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
  const totQty = item.sizes?.length > 0
    ? item.sizes.reduce((s, r) => s + (parseInt(r.qty) || 0), 0)
    : (item.quantity || 0);
  item.quantity = totQty;
  item.total = Math.round((totQty * (item.price || 0)) * 100) / 100;
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

/* ─── Telegram log notifications — fire and forget ─── */
const TG_ICONS = {
  item_add:     '➕', item_edit:    '✏️', item_delete:  '🗑',
  owner_add:    '👤', owner_edit:   '✏️', owner_delete: '🗑',
  backup:       '💾', restore:      '📂', clear:        '🧹',
};

function logToTelegram(entry) {
  const token  = process.env.TG_LOG_TOKEN;
  const chatId = process.env.TG_LOG_CHAT;
  if (!token || !chatId) return;

  const icon = TG_ICONS[entry.type] || '•';
  const date = new Date(entry.ts).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  const text = `${icon} <b>${entry.desc}</b>\n<i>${date}</i>`;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(6000),
  }).catch(() => {});
}

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
  logToTelegram(entry); // → Telegram
  res.json(entry);
});

app.delete('/api/logs', (req, res) => {
  const db = load(); db.logs = []; save(db);
  res.json({ ok: true });
});

/* ─── CSV для Google Sheets (=IMPORTDATA) ─── */
const STATUS_RU = { ordered: 'Заказано', in_stock: 'В наличии', processing: 'В заказе', done: 'Завершено' };
const LOG_RU    = { item_add: 'Добавление', item_edit: 'Изменение', item_delete: 'Удаление',
                    owner_add: 'Владелец+', owner_edit: 'Владелец', owner_delete: 'Владелец-',
                    backup: 'Бэкап', restore: 'Восстановление', clear: 'Очистка' };

function csvRow(arr) {
  return arr.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
}

app.get('/api/items.csv', (req, res) => {
  const db = load();
  const owners = {};
  (db.owners || []).forEach(o => { owners[o.id] = o.name; });

  const rows = [csvRow(['Тип','Наименование','Размеры','Кол-во','Цена/шт','Итого','Владелец','Статус','Заметки','Обновлено'])];
  (db.items || []).forEach(item => {
    const sizes = (item.sizes || []).map(s => s.size + (s.qty > 1 ? '×' + s.qty : '')).join(', ') || '-';
    rows.push(csvRow([
      item.type || '', item.name || '', sizes,
      item.quantity || 0, item.price || 0, item.total || 0,
      owners[item.ownerId] || '', STATUS_RU[item.orderStatus] || item.orderStatus || '',
      item.notes || '', item.updatedAt ? new Date(item.updatedAt).toLocaleString('ru-RU') : '',
    ]));
  });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(rows.join('\n'));
});

app.get('/api/logs.csv', (req, res) => {
  const logs = (load().logs || []).slice().reverse().slice(0, 80);

  const rows = [csvRow(['Дата и время','Тип','Описание'])];
  logs.forEach(log => {
    rows.push(csvRow([
      log.ts ? new Date(log.ts).toLocaleString('ru-RU') : '',
      LOG_RU[log.type] || log.type || '',
      log.desc || '',
    ]));
  });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(rows.join('\n'));
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

/* ─── Telegram backup — sends JSON file every 24h ─── */
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;

async function sendBackupToTelegram() {
  const token  = process.env.TG_LOG_TOKEN;
  const chatId = process.env.TG_LOG_CHAT;
  if (!token || !chatId) return false;

  const db   = load();
  const data = { version: 2, exportedAt: new Date().toISOString(), items: db.items || [], owners: db.owners || [] };
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');

  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('caption',
    `💾 <b>Авто-бэкап Masqucerade INC.</b>\n` +
    `📦 Товаров: ${data.items.length}\n` +
    `👥 Владельцев: ${data.owners.length}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU')}`
  );
  form.append('parse_mode', 'HTML');
  form.append('document', new Blob([json], { type: 'application/json' }), `masqucerade-${date}.json`);

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST', body: form,
      signal: AbortSignal.timeout(20000),
    });
    if (r.ok) {
      const d = load(); if (!d.meta) d.meta = {};
      d.meta.lastBackup = new Date().toISOString(); save(d);
      console.log('Telegram backup sent');
      return true;
    }
  } catch (err) { console.error('Backup failed:', err.message); }
  return false;
}

/* Manual trigger via API */
app.post('/api/backup/send', async (req, res) => {
  const ok = await sendBackupToTelegram();
  res.json({ ok });
});

/* Smart scheduler — survives restarts */
function scheduleBackup() {
  const db        = load();
  const lastBackup = db.meta?.lastBackup;
  const elapsed   = lastBackup ? Date.now() - new Date(lastBackup).getTime() : Infinity;
  const delay     = elapsed >= BACKUP_INTERVAL ? 0 : BACKUP_INTERVAL - elapsed;

  setTimeout(async () => {
    await sendBackupToTelegram();
    setInterval(sendBackupToTelegram, BACKUP_INTERVAL);
  }, delay);

  if (delay === 0) console.log('Backup overdue — sending now');
  else console.log(`Next backup in ${Math.round(delay / 3600000)}h`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Masqucerade INC. v2 on :${PORT}`);
  scheduleBackup();
});
