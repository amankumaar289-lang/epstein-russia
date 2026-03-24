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

// ========== ПАРСЕР ДАТАСЕТА ==========

function parseDataset() {
    const possiblePaths = [
        path.join(__dirname, 'dataset.txt'),
        path.join(__dirname, 'The_only_датасет.txt'),
        path.join(process.cwd(), 'dataset.txt'),
        path.join(process.cwd(), 'The_only_датасет.txt'),
        path.join(__dirname, '..', 'dataset.txt'),
        path.join(__dirname, '..', 'The_only_датасет.txt')
    ];

    for (const p of possiblePaths) {
        console.log('Проверка пути:', p);
        if (fs.existsSync(p)) {
            console.log('УСПЕХ: Датасет найден по пути:', p);
            return parseWithFilePath(p);
        }
    }

    console.error('КРИТИЧЕСКАЯ ОШИБКА: Файл с данными не найден ни по одному из путей.');
    process.exit(1);
}

function parseWithFilePath(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const sections = raw.split(/\+{3,}/);
    if (sections.length < 4) {
        throw new Error('Invalid dataset format');
    }

    const relationsRaw = parseRelations(sections[0]);
    const documents = parseDocuments(sections[1]);
    const personsRaw = parsePersons(sections[2]);
    const timeline = parseTimeline(sections[3]);

    const personsMap = new Map();
    personsRaw.forEach(p => { if (p.id) personsMap.set(p.id, p); });
    const persons = Array.from(personsMap.values());

    const relationsMap = new Map();
    relationsRaw.forEach(r => { if (r.id) relationsMap.set(r.id, r); });
    const relations = Array.from(relationsMap.values());

    return { relations, documents, persons, timeline };
}

function parseTSV(text) {
    if (!text) return { headers: [], rows: [] };
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return { headers: [], rows: [] };

    let headerIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const lower = lines[i].toLowerCase();
        if (lower.includes('\t') && (lower.includes('id') || lower.includes('year') || lower.includes('from') || lower.includes('name'))) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) {
        if (lines[0].includes('\t')) headerIdx = 0;
        else return { headers: [], rows: [] };
    }

    let headerLine = lines[headerIdx];
    if (headerLine.includes(':')) headerLine = headerLine.split(':')[1].trim();

    const headers = headerLine.split('\t').map(h => h.trim()).filter(Boolean);
    const rows = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
        const cells = lines[i].split('\t');
        if (cells.length < 2) continue;
        const row = {};
        headers.forEach((h, idx) => { if (h) row[h] = (cells[idx] || '').trim(); });
        rows.push(row);
    }
    return { headers, rows };
}

function parseRelations(section) {
    const { rows } = parseTSV(section);
    const result = [];
    rows.forEach(r => {
        if (!r.id) return;
        result.push({
            id: r.id, from: r.from || '', to: r.to || '', type: r.type || '',
            description_ru: r.description_ru || '', date: r.date || '',
            source: r.source || '', strength: parseInt(r.strength) || 1
        });
    });
    return result;
}

function parseDocuments(section) {
    const { rows } = parseTSV(section);
    const result = [];
    rows.forEach(r => {
        if (!r.id) return;
        result.push({
            id: r.id, title_ru: r.title_ru || '', date: r.date || '',
            excerpt_ru: r.excerpt_ru || '', source: r.source || '',
            tags: (r.tags || '').split(',').map(t => t.trim()).filter(Boolean)
        });
    });
    return result;
}

const ROLE_RU = {
    'Financier': 'Финансист', 'Diplomat': 'Дипломат', 'Minister': 'Министр',
    'Banker': 'Банкир', 'Official': 'Чиновник', 'President': 'Президент',
    'Businessman': 'Бизнесмен', 'Politician': 'Политик', 'Investor': 'Инвестор',
    'Developer': 'Девелопер', 'Analyst': 'Аналитик', 'Assistant': 'Ассистент',
    'Model': 'Модель', 'Realtor': 'Риелтор', 'Sovereign': 'Глава фонда'
};

function parsePersons(section) {
    const { rows } = parseTSV(section);
    const result = [];
    rows.forEach(r => {
        if (!r.id) return;
        result.push({
            id: r.id, name_en: r.name_en || '', name_ru: r.name_ru || '',
            type: r.type || 'person', role: ROLE_RU[r.role] || r.role || '',
            mentions: parseInt(r.mentions) || 0, first_year: parseInt(r.first_year) || 0,
            photo_url: r.photo_url || '', bio_short: r.bio_short || ''
        });
    });
    return result;
}

function parseTimeline(section) {
    const { rows } = parseTSV(section);
    return rows.map(r => ({
        year: parseInt(r.year) || 0,
        event_ru: r.event_ru || '',
        related_people: (r.related_people || '').split(',').map(p => p.trim().toLowerCase()).filter(Boolean),
        related_docs: (r.related_docs || '').split(',').map(d => d.trim()).filter(Boolean)
    }));
}

// ========== ЗАГРУЗКА ДАННЫХ ==========

console.log('Загрузка датасета...');
const DATA = parseDataset();
const personsMap = new Map();
DATA.persons.forEach(p => { personsMap.set(p.id, p); });

function normalizePersonId(id) {
    if (!id || typeof id !== 'string') return '';
    return id.toLowerCase().trim();
}

// ========== API ЭНДПОИНТЫ ==========

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/stats', (req, res) => {
    const typeCounts = {};
    DATA.relations.forEach(r => { if (r.type) typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });
    res.json({
        totalPersons: DATA.persons.length,
        totalRelations: DATA.relations.length,
        totalDocuments: DATA.documents.length,
        totalTimelineEvents: DATA.timeline.length,
        categories: Object.entries(typeCounts).map(([category, count]) => ({ category, count })),
        relationTypes: Object.entries(typeCounts).map(([category, count]) => ({ category, count }))
    });
});

app.get('/api/persons', (req, res) => res.json(DATA.persons));

app.get('/api/person/:id', (req, res) => {
    const id = normalizePersonId(req.params.id);
    const person = personsMap.get(id);
    if (!person) return res.status(404).json({ error: 'Персона не найдена' });

    const relations = DATA.relations.filter(r => r.from === id || r.to === id);
    const docs = DATA.documents.filter(doc => doc.tags.includes(id));
    const connectedIds = new Set();
    relations.forEach(r => { connectedIds.add(r.from); connectedIds.add(r.to); });
    connectedIds.delete(id);
    const connected = [...connectedIds].map(cid => personsMap.get(cid)).filter(Boolean);

    res.json({ person, relations, documents: docs, connected_persons: connected });
});

app.get('/api/graph', (req, res) => {
    const adj = new Map();
    DATA.relations.forEach(r => {
        const f = normalizePersonId(r.from), t = normalizePersonId(r.to);
        if (!f || !t) return;
        if (!adj.has(f)) adj.set(f, new Set());
        if (!adj.has(t)) adj.set(t, new Set());
        adj.get(f).add(t); adj.get(t).add(f);
    });

    const nodes = DATA.persons.map(person => {
        const id = normalizePersonId(person.id);
        return {
            ...person,
            connectionCount: (adj.get(id)?.size) || 0,
            isEpstein: id === 'epstein'
        };
    });

    const links = DATA.relations.map(r => ({
        source: normalizePersonId(r.from), target: normalizePersonId(r.to),
        type: r.type, description_ru: r.description_ru,
        strength: parseInt(r.strength) || 1, date: r.date, id: r.id
    }));

    res.json({ nodes, links });
});

app.get('/api/search', (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    if (!q) return res.json({ persons: [], documents: [] });
    const matchedPersons = DATA.persons.filter(p => p.name_ru.toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q));
    const matchedDocs = DATA.documents.filter(d => d.title_ru.toLowerCase().includes(q) || d.tags.some(t => t.includes(q)));
    res.json({ persons: matchedPersons, documents: matchedDocs });
});

app.get('/api/documents', (req, res) => res.json(DATA.documents));
app.get('/api/timeline', (req, res) => res.json(DATA.timeline));

// ========== РАЗДАЧА ФРОНТЕНДА ==========
const frontendPath = path.join(__dirname, 'network-ui', 'dist');

if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
    console.log(`✓ Фронтенд: ${frontendPath}`);
} else {
    console.log(`⚠ Фронтенд не найден: ${frontendPath}`);
}

app.listen(PORT, '0.0.0.0', () => {
    console.log('══════════════════════════════════════════════════');
    console.log(`  🚀 Сервер запущен: http://localhost:${PORT}`);
    console.log('══════════════════════════════════════════════════');
});
