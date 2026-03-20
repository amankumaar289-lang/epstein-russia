// ========================================================
// Единый API-сервер для датасета Эпштейна
// Парсит The_only_датасет.txt напрямую, без базы данных
// Порт: из ENV или 3001
// ========================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT) || 3006;

app.use(cors());
app.use(express.json());

// Логгер запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Логгер для отладки
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ========== ПАРСЕР ДАТАСЕТА ==========

function parseDataset() {
    const possiblePaths = [
        path.join(__dirname, '..', 'The_only_датасет.txt'),
        path.join(__dirname, 'The_only_датасет.txt'),
        path.join(process.cwd(), 'The_only_датасет.txt'),
        path.join(process.cwd(), '..', 'The_only_датасет.txt')
    ];

    for (const p of possiblePaths) {
        console.log('Проверка пути:', p);
        if (fs.existsSync(p)) {
            console.log('УСПЕХ: Датасет найден по пути:', p);
            return parseWithFilePath(p);
        }
    }

    console.error('КРИТИЧЕСКАЯ ОШИБКА: Файл The_only_датасет.txt не найден ни по одному из путей.');
    process.exit(1);
}

function parseWithFilePath(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const sections = raw.split(/\+{3,}/);

    if (sections.length < 4) {
        console.error('ОШИБКА: Неверный формат датасета. Ожидается 4 секции, найдено:', sections.length);
        throw new Error('Invalid dataset format');
    }

    const relationsRaw = parseRelations(sections[0]);
    const documents = parseDocuments(sections[1]);
    const personsRaw = parsePersons(sections[2]);
    const timeline = parseTimeline(sections[3]);

    // Дедупликация и нормализация
    const personsMap = new Map();
    personsRaw.forEach(p => {
        if (p.id) personsMap.set(p.id, p);
    });
    const persons = Array.from(personsMap.values());

    const relationsMap = new Map();
    relationsRaw.forEach(r => {
        if (r.id) relationsMap.set(r.id, r);
    });
    const relations = Array.from(relationsMap.values());

    return { relations, documents, persons, timeline };
}

function parseTSV(text) {
    if (!text) return { headers: [], rows: [] };

    // Удаляем BOM если есть и нормализуем переносы строк
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length < 2) return { headers: [], rows: [] };

    // Ищем строку с заголовками - она должна содержать ключевые слова и табуляцию
    let headerIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const lower = lines[i].toLowerCase();
        // В секции таймлайна заголовок может начинаться с "Таймлайн: year"
        if (lower.includes('\t') && (lower.includes('id') || lower.includes('year') || lower.includes('from') || lower.includes('name'))) {
            headerIdx = i;
            break;
        }
    }

    if (headerIdx === -1) {
        // Пробуем взять первую строку если табуляция есть
        if (lines[0].includes('\t')) headerIdx = 0;
        else return { headers: [], rows: [] };
    }

    // Очищаем заголовок от префикса типа "Таймлайн: "
    let headerLine = lines[headerIdx];
    if (headerLine.includes(':')) {
        headerLine = headerLine.split(':')[1].trim();
    }

    const headers = headerLine.split('\t').map(h => h.trim()).filter(Boolean);
    const rows = [];

    for (let i = headerIdx + 1; i < lines.length; i++) {
        const cells = lines[i].split('\t');
        if (cells.length < 2) continue;

        const row = {};
        headers.forEach((h, idx) => {
            if (h) {
                row[h] = (cells[idx] || '').trim();
            }
        });
        rows.push(row);
    }

    return { headers, rows };
}

function parseRelations(section) {
    const { rows } = parseTSV(section);
    const seen = new Set();
    const result = [];
    rows.forEach(r => {
        if (!r.id || seen.has(r.id)) return;
        seen.add(r.id);
        result.push({
            id: r.id || '',
            from: r.from || '',
            to: r.to || '',
            type: r.type || '',
            description_ru: r.description_ru || '',
            date: r.date || '',
            source: r.source || '',
            strength: parseInt(r.strength) || 1
        });
    });
    return result;
}

function parseDocuments(section) {
    const { rows } = parseTSV(section);
    const seen = new Set();
    const result = [];
    rows.forEach(r => {
        if (!r.id || seen.has(r.id)) return;
        seen.add(r.id);
        result.push({
            id: r.id || '',
            title_ru: r.title_ru || '',
            date: r.date || '',
            excerpt_ru: r.excerpt_ru || '',
            source: r.source || '',
            tags: (r.tags || '').split(',').map(t => t.trim()).filter(Boolean)
        });
    });
    return result;
}

// Маппинг английских ролей из датасета на русские
const ROLE_RU = {
    'Financier': 'Финансист',
    'Diplomat': 'Дипломат',
    'Minister': 'Министр',
    'Banker': 'Банкир',
    'Official': 'Чиновник',
    'President / Politician': 'Президент',
    'Businessman / Former Official': 'Бизнесмен / бывший чиновник',
    'Politician / Prime Minister': 'Политик / Премьер-министр',
    'Minister / Military Official': 'Министр обороны',
    'Politician': 'Политик',
    'Activist / Politician': 'Активист / Политик',
    'Real Estate Developer / Businessman': 'Девелопер / Бизнесмен',
    'Investor / PR Consultant': 'Инвестор / PR-консультант',
    'Diplomat / Secretary General': 'Дипломат / Генсек Совета Европы',
    'Analyst / Advisor': 'Аналитик / Советник',
    'Venture Investor / Science Advisor': 'Венчурный инвестор',
    'Head of DP World': 'Глава DP World',
    'Diplomat / IPI Director': 'Дипломат / Директор IPI',
    'Assistant / Financial Coordinator': 'Ассистент / Координатор',
    'Model / Social Connector': 'Модель / Светский посредник',
    'Son of Vitaly Churkin': 'Сын Виталия Чуркина',
    'Convicted Sex Offender': 'Осуждённый преступник',
};

function parsePersons(section) {
    const { rows } = parseTSV(section);
    const seen = new Set();
    const result = [];
    rows.forEach(r => {
        if (!r.id || seen.has(r.id)) return;
        seen.add(r.id);
        result.push({
            id: r.id || '',
            name_en: r.name_en || '',
            name_ru: r.name_ru || '',
            type: r.type || 'person',
            role: ROLE_RU[r.role] || r.role || '',
            mentions: parseInt(r.mentions) || 0,
            first_year: parseInt(r.first_year) || 0,
            photo_url: r.photo_url || '',
            bio_short: r.bio_short || ''
        });
    });
    return result;
}

function parseTimeline(section) {
    const { rows } = parseTSV(section);
    return rows.map(r => ({
        year: parseInt(r.year) || 0,
        event_ru: r.event_ru || '',
        related_people: (r.related_people || '').split(',').map(p => normalizePersonId(p.trim())).filter(Boolean),
        related_docs: (r.related_docs || '').split(',').map(d => d.trim()).filter(Boolean)
    }));
}

// Нормализуем: epshtein -> epstein
function normalizePersonId(id) {
    if (!id || typeof id !== 'string') return '';
    let nid = id.toLowerCase().trim();
    if (nid === 'epshtein') return 'epstein';
    return nid;
}

// ========== ЗАГРУЗКА ДАННЫХ ==========

console.log('Загрузка датасета...');
const DATA = parseDataset();
console.log(`Загружено: ${DATA.persons.length} персон, ${DATA.relations.length} связей, ${DATA.documents.length} документов, ${DATA.timeline.length} событий`);

// Создаём карту персон для быстрого доступа
const personsMap = new Map();
DATA.persons.forEach(p => {
    personsMap.set(p.id, p);
});

// Helper functions (already fixed normalize usage)
function getRelationsForPerson(personId) {
    const normId = normalizePersonId(personId);
    return DATA.relations.filter(r => r.from === normId || r.to === normId);
}

function getDocsForPerson(personId) {
    const normId = normalizePersonId(personId);
    return DATA.documents.filter(doc => doc.tags.includes(normId));
}

// ========== API ЭНДПОИНТЫ ==========

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Статистика
app.get('/api/stats', (req, res) => {
    try {
        const typeCounts = {};
        DATA.relations.forEach(r => {
            if (r.type) {
                typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
            }
        });

        res.json({
            totalPersons: DATA.persons.length,
            totalRelations: DATA.relations.length,
            totalDocuments: DATA.documents.length,
            totalTimelineEvents: DATA.timeline.length,
            // Совместимость со старым форматом
            persons: DATA.persons.length,
            relations: DATA.relations.length,
            documents: DATA.documents.length,
            timeline_events: DATA.timeline.length,
            categories: Object.entries(typeCounts).map(([category, count]) => ({ category, count })),
            relationTypes: Object.entries(typeCounts).map(([category, count]) => ({ category, count }))
        });
    } catch (err) {
        console.error('Ошибка в /api/stats:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Все персоны
app.get('/api/persons', (req, res) => {
    try {
        res.json(DATA.persons);
    } catch (err) {
        console.error('Ошибка в /api/persons:', err);
        res.status(500).json({ error: err.message });
    }
});

// Одна персона по ID
app.get('/api/person/:id', (req, res) => {
    try {
        const id = normalizePersonId(req.params.id);
        const person = personsMap.get(id);

        if (!person) {
            return res.status(404).json({ error: 'Персона не найдена' });
        }

        const relations = getRelationsForPerson(person.id);
        const docs = getDocsForPerson(person.id);

        const connectedIds = new Set();
        relations.forEach(r => {
            connectedIds.add(r.from);
            connectedIds.add(r.to);
        });
        connectedIds.delete(person.id);

        const connected = [...connectedIds]
            .map(cid => personsMap.get(cid))
            .filter(Boolean);

        res.json({
            person,
            relations,
            documents: docs,
            connected_persons: connected
        });
    } catch (err) {
        console.error(`Ошибка в /api/person/${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Все связи
app.get('/api/relations', (req, res) => {
    res.json({
        relations: DATA.relations,
        total: DATA.relations.length
    });
});

// Все документы
app.get('/api/documents', (req, res) => {
    res.json(DATA.documents);
});

// Один документ по ID
app.get('/api/document/:id', (req, res) => {
    const doc = DATA.documents.find(d => d.id === req.params.id);
    if (!doc) {
        return res.status(404).json({ error: 'Документ не найден' });
    }
    res.json(doc);
});

// Таймлайн
app.get('/api/timeline', (req, res) => {
    try {
        res.json(DATA.timeline);
    } catch (err) {
        console.error('Ошибка в /api/timeline:', err);
        res.status(500).json({ error: err.message });
    }
});

// Поиск
app.get('/api/search', (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    if (!q) return res.json({ persons: [], documents: [] });

    const matchedPersons = DATA.persons.filter(p =>
        p.name_ru.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.bio_short.toLowerCase().includes(q)
    );

    const matchedDocs = DATA.documents.filter(d =>
        d.title_ru.toLowerCase().includes(q) ||
        d.excerpt_ru.toLowerCase().includes(q) ||
        d.tags.some(t => t.includes(q))
    );

    res.json({ persons: matchedPersons, documents: matchedDocs });
});

// Граф-данные для D3 (ноды + линки)
app.get('/api/graph', (req, res) => {
    try {
        const EPSTEIN_ID = 'epstein';

        // 1. Предварительный расчет связей для BFS и connectionCount
        const adj = new Map();
        DATA.relations.forEach(r => {
            const f = normalizePersonId(r.from);
            const t = normalizePersonId(r.to);
            if (!f || !t) return;

            if (!adj.has(f)) adj.set(f, new Set());
            if (!adj.has(t)) adj.set(t, new Set());
            adj.get(f).add(t);
            adj.get(t).add(f);
        });

        // 2. BFS для расчета расстояний от Эпштейна
        const distances = new Map();
        const queue = [];

        if (adj.has(EPSTEIN_ID)) {
            distances.set(EPSTEIN_ID, 0);
            queue.push(EPSTEIN_ID);
        }

        while (queue.length > 0) {
            const current = queue.shift();
            const d = distances.get(current);
            const neighbors = adj.get(current) || [];
            for (const neighbor of neighbors) {
                if (!distances.has(neighbor)) {
                    distances.set(neighbor, d + 1);
                    queue.push(neighbor);
                }
            }
        }

        // 3. Формирование финальных нод
        const nodes = DATA.persons.map(person => {
            const id = normalizePersonId(person.id);
            const connectionCount = (adj.get(id)?.size) || 0;
            const distance = distances.has(id) ? distances.get(id) : 99;

            return {
                id: id,
                name_ru: person.name_ru || id,
                name_en: person.name_en || id,
                role: person.role || '',
                photo_url: person.photo_url || '',
                bio_short: person.bio_short || '',
                mentions: person.mentions || 0,
                connectionCount,
                distance,
                isEpstein: id === EPSTEIN_ID
            };
        });

        const links = [];
        DATA.relations.forEach(r => {
            const s = normalizePersonId(r.from);
            const t = normalizePersonId(r.to);
            if (s && t) {
                links.push({
                    source: s,
                    target: t,
                    type: r.type,
                    description_ru: r.description_ru,
                    strength: parseInt(r.strength) || 1,
                    date: r.date,
                    id: r.id
                });
            }
        });

        // 4. Дополнительные связи из таймлайна (Deduped)
        DATA.timeline.forEach((t, idx) => {
            const people = t.related_people;
            if (Array.isArray(people) && people.length >= 2) {
                for (let i = 0; i < people.length; i++) {
                    const p1 = normalizePersonId(people[i]);
                    if (!p1) continue;
                    for (let j = i + 1; j < people.length; j++) {
                        const p2 = normalizePersonId(people[j]);
                        if (!p2) continue;

                        const exists = links.some(l =>
                            (l.source === p1 && l.target === p2) ||
                            (l.source === p2 && l.target === p1)
                        );
                        if (!exists) {
                            links.push({
                                source: p1,
                                target: p2,
                                type: 'indirect',
                                description_ru: t.event_ru,
                                strength: 1,
                                id: `timeline-${idx}-${i}-${j}`
                            });
                        }
                    }
                }
            }
        });

        res.json({ nodes, links });
    } catch (err) {
        console.error('Ошибка в /api/graph:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Количество связей для каждой персоны
app.get('/api/actor-counts', (req, res) => {
    const counts = {};
    DATA.relations.forEach(r => {
        const from = r.from;
        const to = r.to;
        counts[from] = (counts[from] || 0) + 1;
        counts[to] = (counts[to] || 0) + 1;
    });
    res.json(counts);
});

// Кластеры тегов из документов
app.get('/api/tag-clusters', (req, res) => {
    const tagCounts = {};
    DATA.documents.forEach(doc => {
        doc.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const clusters = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count], idx) => ({
            id: idx,
            tag,
            count,
            documents: DATA.documents.filter(d => d.tags.includes(tag)).map(d => d.id)
        }));

    res.json(clusters);
});

// Связи в формате совместимом с фронтендом
app.get('/api/relationships', (req, res) => {
    res.json({
        relationships: DATA.relations.map(r => ({
            ...r,
            from: r.from,
            to: r.to
        })),
        total: DATA.relations.length,
        totalBeforeLimit: DATA.relations.length
    });
});

// ========== РАЗДАЧА ФРОНТЕНДА ==========

const frontendPath = path.join(__dirname, 'network-ui', 'dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));

    // SPA: все не-API маршруты → index.html
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
    });

    console.log(`✓ Фронтенд: ${frontendPath}`);
} else {
    console.log(`⚠ Фронтенд не найден: ${frontendPath}`);
    console.log('  Собери его: cd network-ui && npm run build');
}

// ========== ГЛОБАЛЬНАЯ ОБРАБОТКА ОШИБОК ==========
app.use((err, req, res, next) => {
    console.error('КРИТИЧЕСКАЯ ОШИБКА СЕРВЕРА:', err);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ========== ЗАПУСК ==========

app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log(`  🚀 Сервер запущен: http://localhost:${PORT}`);
    console.log(`  API:        http://localhost:${PORT}/api/stats`);
    console.log(`  Граф:       http://localhost:${PORT}/api/graph`);
    console.log(`  Фронтенд:  http://localhost:${PORT}/`);
    console.log('══════════════════════════════════════════════════');
    console.log('');
});
