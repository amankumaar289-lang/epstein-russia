const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT) || 3006;

app.use(cors());
app.use(express.json());

// ========== ПАРСЕР ДАТАСЕТА ==========
function parseDataset() {
    const possiblePaths = [
        path.join(__dirname, 'The_only_датасет.txt'),
        path.join(__dirname, 'dataset.txt'),
        path.join(process.cwd(), 'The_only_датасет.txt'),
        path.join(process.cwd(), 'dataset.txt')
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log('✓ Датасет найден:', p);
            return parseWithFilePath(p);
        }
    }
    console.error('⚠ Файл данных не найден!');
    process.exit(1);
}

function parseTSV(text) {
    if (!text) return { headers: [], rows: [] };
    const lines = text.replace(/^\uFEFF/, '').split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return { headers: [], rows: [] };
    let headerLine = lines[0];
    if (headerLine.includes(':')) headerLine = headerLine.split(':')[1].trim();
    const headers = headerLine.split('\t').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
        const cells = line.split('\t');
        const row = {};
        headers.forEach((h, i) => { row[h] = (cells[i] || '').trim(); });
        return row;
    }).filter(r => r.id);
    return { headers, rows };
}

function parseWithFilePath(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const sections = raw.split(/\+{3,}/);
    const relations = parseTSV(sections[0]).rows;
    const documents = parseTSV(sections[1]).rows.map(d => ({...d, tags: (d.tags || '').split(',').map(t => t.trim())}));
    const persons = parseTSV(sections[2]).rows;
    const timeline = parseTSV(sections[3]).rows.map(r => ({
        ...r, 
        year: parseInt(r.year),
        related_people: (r.related_people || '').split(',').map(p => p.trim().toLowerCase()),
        related_docs: (r.related_docs || '').split(',').map(d => d.trim())
    }));
    return { relations, documents, persons, timeline };
}

const DATA = parseDataset();
const personsMap = new Map();
DATA.persons.forEach(p => personsMap.set(p.id.toLowerCase(), p));

// ========== API ==========
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/stats', (req, res) => res.json({
    totalPersons: DATA.persons.length,
    totalRelations: DATA.relations.length,
    totalDocuments: DATA.documents.length,
    totalTimelineEvents: DATA.timeline.length,
    categories: []
}));
app.get('/api/graph', (req, res) => {
    const nodes = DATA.persons.map(p => ({ ...p, connectionCount: DATA.relations.filter(r => r.from === p.id || r.to === p.id).length }));
    const links = DATA.relations.map(r => ({ source: r.from, target: r.to, ...r }));
    res.json({ nodes, links });
});
app.get('/api/person/:id', (req, res) => {
    const id = req.params.id.toLowerCase();
    const person = personsMap.get(id);
    if (!person) return res.status(404).json({ error: 'Not found' });
    res.json({
        person,
        relations: DATA.relations.filter(r => r.from === id || r.to === id),
        documents: DATA.documents.filter(d => d.tags.includes(id)),
        connected_persons: []
    });
});
app.get('/api/timeline', (req, res) => res.json(DATA.timeline));
app.get('/api/documents', (req, res) => res.json(DATA.documents));

// ========== РАЗДАЧА ФРОНТЕНДА ==========
const frontendPath = path.join(__dirname, 'network-ui', 'dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API error' });
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
