const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname)));

const DATA_DIR  = process.env.DATA_DIR  || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { items: [], owners: [], logs: [] }; }
}

function save(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ─── ITEMS ─── */
app.get('/api/items', (req, res) => {
  let rows = load().items || [];
  const { ownerId, orderStatus, search } = req.query;
  if (ownerId)     rows = rows.filter(i => i.ownerId === ownerId);
  if (orderStatus) rows = rows.filter(i => i.orderStatus === orderStatus);
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(i =>
      (i.name  ||'').toLowerCase().includes(q) ||
      (i.type  ||'').toLowerCase().includes(q) ||
      (i.size  ||'').toLowerCase().includes(q) ||
      (i.notes ||'').toLowerCase().includes(q)
    );
  }
  rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(rows);
});

app.get('/api/items/:id', (req, res) => {
  const item = (load().items || []).find(i => i.id === req.params.id);
  item ? res.json(item) : res.status(404).json({ error: 'Not found' });
});

app.put('/api/items', (req, res) => {
  const db  = load();
  const now = new Date().toISOString();
  const item = { ...req.body };
  if (!item.id) { item.id = uid(); item.createdAt = now; }
  item.updatedAt = now;
  item.total = Math.round(((item.quantity || 0) * (item.price || 0)) * 100) / 100;
  if (!db.items) db.items = [];
  const idx = db.items.findIndex(i => i.id === item.id);
  idx >= 0 ? (db.items[idx] = item) : db.items.push(item);
  save(db);
  res.json(item);
});

app.delete('/api/items/:id', (req, res) => {
  const db = load();
  db.items = (db.items || []).filter(i => i.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── OWNERS ─── */
app.get('/api/owners', (req, res) => res.json(load().owners || []));

app.put('/api/owners', (req, res) => {
  const db    = load();
  const owner = { ...req.body };
  if (!owner.id) { owner.id = uid(); owner.createdAt = new Date().toISOString(); }
  if (!db.owners) db.owners = [];
  const idx = db.owners.findIndex(o => o.id === owner.id);
  idx >= 0 ? (db.owners[idx] = owner) : db.owners.push(owner);
  save(db);
  res.json(owner);
});

app.delete('/api/owners/:id', (req, res) => {
  const db = load();
  db.owners = (db.owners || []).filter(o => o.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── LOGS ─── */
app.get('/api/logs', (req, res) => {
  const logs = (load().logs || []).slice().reverse().slice(0, 80);
  res.json(logs);
});

app.post('/api/logs', (req, res) => {
  const db    = load();
  const entry = { id: uid(), ...req.body, ts: new Date().toISOString() };
  if (!db.logs) db.logs = [];
  db.logs.push(entry);
  if (db.logs.length > 300) db.logs = db.logs.slice(-300);
  save(db);
  res.json(entry);
});

app.delete('/api/logs', (req, res) => {
  const db = load(); db.logs = []; save(db);
  res.json({ ok: true });
});

/* ─── EXPORT / IMPORT ─── */
app.get('/api/export', (req, res) => {
  const db = load();
  res.json({ version: 2, exportedAt: new Date().toISOString(), items: db.items || [], owners: db.owners || [] });
});

app.post('/api/import', (req, res) => {
  const db  = load();
  db.items  = req.body.items  || [];
  db.owners = req.body.owners || [];
  save(db);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Masqucerade INC. on :${PORT}`));
