const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(express.json({ limit: '25mb' }));
// HTML не кэшируем (css/js версионируются через ?v=), чтобы разметка и скрипты
// всегда были одной версии — иначе на старом index.html новый app.js падает.
app.use(express.static(path.join(__dirname), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.set('Cache-Control', 'no-cache');
  },
}));

const DATA_DIR  = process.env.DATA_DIR  || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

// БД держим в памяти: читаем/парсим файл один раз при старте, дальше отдаём
// из ОЗУ. Иначе каждый из ~10 запросов на загрузку страницы заново читал и
// парсил весь db.json с диска (с base64-фото) — отсюда и тормоза.
let _db = null;
function load() {
  if (_db) return _db;
  try { _db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { _db = { items: [], owners: [], logs: [] }; }
  return _db;
}

// Запись на диск дебаунсим, чтобы серия изменений не блокировала event loop
// множеством синхронных записей многомегабайтного файла.
let _saveTimer = null;
function save(db) {
  _db = db;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try { fs.writeFileSync(DATA_FILE, JSON.stringify(_db)); }
    catch (e) { console.error('save failed:', e.message); }
  }, 150);
}
// Гарантируем запись перед остановкой процесса
function flush() {
  clearTimeout(_saveTimer);
  try { if (_db) fs.writeFileSync(DATA_FILE, JSON.stringify(_db)); } catch (_) {}
}
process.on('SIGTERM', () => { flush(); process.exit(0); });
process.on('SIGINT',  () => { flush(); process.exit(0); });

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ─── AUTH ─── */
// Гарантируем наличие root-администратора (Monarc / 0000)
function seedRoot(db) {
  if (!db.users)    db.users = [];
  if (!db.sessions) db.sessions = [];
  if (!db.users.some(u => u.role === 'root')) {
    db.users.unshift({
      id: uid(), login: 'Monarc', password: '0000', name: 'Monarc',
      role: 'root', createdAt: new Date().toISOString(),
    });
  }
}
// Один раз при старте
(() => { const db = load(); seedRoot(db); save(db); })();

function currentUser(req) {
  const token = req.headers['x-auth-token'] || '';
  if (!token) return null;
  const db   = load();
  const sess = (db.sessions || []).find(s => s.token === token);
  if (!sess) return null;
  return (db.users || []).find(u => u.id === sess.userId) || null;
}

function requireRoot(req, res) {
  if (req.user.role !== 'root') { res.status(403).json({ error: 'Недостаточно прав' }); return false; }
  return true;
}

// Виден ли пользователю данный объект (visibility: [] / отсутствует = всем)
function visibleTo(rec, user) {
  if (user.role === 'root') return true;
  const v = rec.visibility;
  if (!Array.isArray(v) || v.length === 0) return true;
  return v.includes(user.id);
}

/* ─── ДОСТУП К РАЗДЕЛАМ (критические точки) ───
   У пользователя может быть access: ['inventory','stats','finance','project','faq'].
   Root видит всё. Если access не задан — полный доступ (обратная совместимость). */
const SECTIONS = ['inventory', 'stats', 'finance', 'project', 'faq'];
function hasAccess(user, section) {
  if (user.role === 'root') return true;
  if (!Array.isArray(user.access)) return true;
  return user.access.includes(section);
}
function requireAccess(section) {
  return (req, res, next) => {
    if (!hasAccess(req.user, section)) return res.status(403).json({ error: 'Нет доступа к разделу' });
    next();
  };
}

// Публичный вход
app.post('/api/login', (req, res) => {
  const db = load(); seedRoot(db);
  const login = String(req.body.login || '').trim().toLowerCase();
  const pass  = String(req.body.password || '');
  const user  = (db.users || []).find(u => (u.login || '').toLowerCase() === login && String(u.password) === pass);
  if (!user) { save(db); return res.status(401).json({ error: 'Неверный логин или пароль' }); }
  const token = uid() + uid();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  save(db);
  res.json({ token, user: { id: user.id, name: user.name, login: user.login, role: user.role, access: user.access || null, hideCosts: !!user.hideCosts } });
});

// Всё остальное под /api требует валидный токен
app.use('/api', (req, res, next) => {
  // private+no-cache: браузер всегда сверяется с сервером (ETag), но если
  // данные не менялись — получает крошечный 304 вместо повторной загрузки
  // всех фото. Свежесть/видимость сохраняются, страницы грузятся быстрее.
  res.set('Cache-Control', 'private, no-cache');
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  next();
});

// Серверная защита критических разделов (не только скрытие в интерфейсе)
app.use(['/api/payments', '/api/employee-payments', '/api/plans', '/api/sales'], (req, res, next) => requireAccess('finance')(req, res, next));
app.use('/api/tasks',       (req, res, next) => requireAccess('project')(req, res, next));
app.use('/api/quickaccess', (req, res, next) => requireAccess('project')(req, res, next));
app.use('/api/faq',         (req, res, next) => requireAccess('faq')(req, res, next));

app.get('/api/me', (req, res) => {
  const u = req.user;
  res.json({ id: u.id, name: u.name, login: u.login, role: u.role, access: u.access || null, hideCosts: !!u.hideCosts });
});

// Пользователь меняет свой собственный пароль
app.post('/api/me/password', (req, res) => {
  const password = String(req.body.password || '');
  if (password.length < 1) return res.status(400).json({ error: 'Введите новый пароль' });
  const db = load();
  const u  = (db.users || []).find(x => x.id === req.user.id);
  if (!u) return res.status(404).json({ error: 'not found' });
  u.password = password;
  save(db);
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers['x-auth-token'] || '';
  const db = load();
  db.sessions = (db.sessions || []).filter(s => s.token !== token);
  save(db);
  res.json({ ok: true });
});

/* ─── USERS (только root) ─── */
app.get('/api/users', (req, res) => {
  if (!requireRoot(req, res)) return;
  res.json((load().users || []).map(u => ({
    id: u.id, login: u.login, password: u.password, name: u.name, role: u.role,
    access: u.access || null,
    hideCosts: !!u.hideCosts,
    tgChatId:  u.tgChatId || '',
    notify:    u.notify   || [],
  })));
});

app.post('/api/users', (req, res) => {
  if (!requireRoot(req, res)) return;
  const db       = load();
  const login    = String(req.body.login || '').trim();
  const password = String(req.body.password || '');
  const name     = String(req.body.name || '').trim() || login;
  if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны' });
  if ((db.users || []).some(u => (u.login || '').toLowerCase() === login.toLowerCase()))
    return res.status(409).json({ error: 'Такой логин уже существует' });
  const access = Array.isArray(req.body.access) ? req.body.access.filter(s => SECTIONS.includes(s)) : null;
  const user = {
    id: uid(), login, password, name, role: 'user', access,
    hideCosts: !!req.body.hideCosts,
    tgChatId:  String(req.body.tgChatId || '').trim(),
    notify:    Array.isArray(req.body.notify) ? req.body.notify.filter(c => NOTIFY_CATS.includes(c)) : [],
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save(db);
  res.json(user);
});

app.put('/api/users/:id', (req, res) => {
  if (!requireRoot(req, res)) return;
  const db = load();
  const u  = (db.users || []).find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'not found' });
  const login = String(req.body.login ?? u.login).trim();
  if (login && db.users.some(x => x.id !== u.id && (x.login || '').toLowerCase() === login.toLowerCase()))
    return res.status(409).json({ error: 'Такой логин уже существует' });
  if (login) u.login = login;
  if (req.body.password != null && req.body.password !== '') u.password = String(req.body.password);
  if (req.body.name != null) u.name = String(req.body.name).trim() || u.name;
  if (Array.isArray(req.body.access)) u.access = req.body.access.filter(s => SECTIONS.includes(s));
  if (req.body.hideCosts != null) u.hideCosts = !!req.body.hideCosts;
  if (req.body.tgChatId  != null) u.tgChatId  = String(req.body.tgChatId).trim();
  if (Array.isArray(req.body.notify)) u.notify = req.body.notify.filter(c => NOTIFY_CATS.includes(c));
  save(db);
  res.json(u);
});

app.delete('/api/users/:id', (req, res) => {
  if (!requireRoot(req, res)) return;
  const db = load();
  const u  = (db.users || []).find(x => x.id === req.params.id);
  if (u && u.role === 'root') return res.status(400).json({ error: 'Нельзя удалить root-администратора' });
  db.users = (db.users || []).filter(x => x.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── ITEMS ─── */
// Пользователю с hideCosts не отдаём закупочные цены, доставку и историю изменений
function stripCosts(item, user) {
  if (!user?.hideCosts || user.role === 'root') return item;
  const { buyPrice, deliveryCost, history, ...rest } = item;
  return rest;
}

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
  res.json(rows.map(i => stripCosts(i, req.user)));
});

app.get('/api/items/:id', (req, res) => {
  const item = (load().items || []).find(i => i.id === req.params.id);
  item ? res.json(stripCosts(item, req.user)) : res.status(404).json({ error: 'Not found' });
});

app.put('/api/items', (req, res) => {
  const db  = load();
  const now = new Date().toISOString();
  const item = { ...req.body };
  // hideCosts-пользователь не видит закупочные поля — сохраняем их из старой записи
  if (req.user?.hideCosts && req.user.role !== 'root' && item.id) {
    const old = (db.items || []).find(i => i.id === item.id);
    if (old) {
      item.buyPrice     = old.buyPrice;
      item.deliveryCost = old.deliveryCost;
      item.history      = old.history;
    }
  }
  if (!item.id) { item.id = uid(); item.createdAt = now; }
  item.updatedAt = now;
  const totQty = item.sizes?.length > 0
    ? item.sizes.reduce((s, r) => s + (parseInt(r.qty) || 0), 0)
    : (item.quantity || 0);
  item.quantity = totQty;
  item.total = Math.round((totQty * (item.price || 0)) * 100) / 100;
  if (!db.items) db.items = [];
  const idx = db.items.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    const old = db.items[idx];
    const TRACKED = ['status','ownerId','name','price','buyPrice','categoryId'];
    const changes = {};
    TRACKED.forEach(f => { if (String(old[f]??'') !== String(item[f]??'')) changes[f] = { from: old[f], to: item[f] }; });
    item.history = [...(old.history || [])];
    if (Object.keys(changes).length) item.history = [...item.history, { ts: now, by: item._updatedBy||null, changes }].slice(-30);
    delete item._updatedBy;
    db.items[idx] = item;
  } else {
    item.history = [];
    db.items.push(item);
  }
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
  if (idx >= 0) { db.owners[idx] = owner; } else { db.owners.push(owner); }
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

/* Категории уведомлений: каждому типу события — категория,
   пользователю можно включить набор категорий (user.notify = ['item_add', ...]) */
const NOTIFY_CATS = ['item_add', 'item_edit', 'item_delete', 'finance', 'owners', 'system'];
function notifyCategoryOf(type) {
  if (type === 'item_add')    return 'item_add';
  if (type === 'item_edit')   return 'item_edit';
  if (type === 'item_delete') return 'item_delete';
  if (type === 'payment' || type === 'emp_payment' || type === 'sale') return 'finance';
  if (type && type.startsWith('owner_')) return 'owners';
  return 'system';   // backup, restore, clear и прочее
}

function tgSend(token, chatId, text) {
  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(6000),
  }).catch(() => {});
}

function logToTelegram(entry) {
  const token = process.env.TG_LOG_TOKEN;
  if (!token) return;

  const icon = TG_ICONS[entry.type] || '•';
  const date = new Date(entry.ts).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
  const text = `${icon} <b>${entry.desc}</b>\n<i>${date}</i>`;

  // Главный чат (как раньше)
  if (process.env.TG_LOG_CHAT) tgSend(token, process.env.TG_LOG_CHAT, text);

  // Персональные подписки пользователей
  const cat  = notifyCategoryOf(entry.type);
  const sent = new Set([String(process.env.TG_LOG_CHAT || '')]);
  (load().users || []).forEach(u => {
    if (!u.tgChatId || sent.has(String(u.tgChatId))) return;
    if (!Array.isArray(u.notify) || !u.notify.includes(cat)) return;
    sent.add(String(u.tgChatId));
    tgSend(token, u.tgChatId, text);
  });
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
const STATUS_RU = { ordered: 'Заказано', in_stock: 'В наличии', processing: 'В заказе', waiting: 'Ожидается', done: 'Завершено' };
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

/* ─── EMPLOYEE PAYMENTS ─── */
app.get('/api/employee-payments', (req, res) => {
  let rows = load().employeePayments || [];
  if (req.query.ownerId) rows = rows.filter(p => p.ownerId === req.query.ownerId);
  res.json(rows.slice().reverse());
});

app.post('/api/employee-payments', (req, res) => {
  const db    = load();
  const entry = { id: uid(), ...req.body, ts: new Date().toISOString() };
  if (!db.employeePayments) db.employeePayments = [];
  db.employeePayments.push(entry);
  save(db);
  if (entry.isExpense) {
    logToTelegram({
      type: 'emp_payment', ts: entry.ts,
      desc: `🧾 ${entry.ownerName || 'Сотрудник'} потратил из своих: +${Number(entry.amount).toLocaleString('ru-RU')} ₽${entry.desc ? ' — ' + entry.desc : ''}`,
    });
  } else {
    const sign = entry.type === 'credit' ? '+' : '−';
    logToTelegram({
      type: 'emp_payment', ts: entry.ts,
      desc: `💵 ${entry.ownerName || 'Сотрудник'}: ${sign}${Number(entry.amount).toLocaleString('ru-RU')} ₽${entry.desc ? ' — ' + entry.desc : ''}`,
    });
  }
  res.json(entry);
});

app.delete('/api/employee-payments/:id', (req, res) => {
  const db  = load();
  const rec = (db.employeePayments || []).find(p => p.id === req.params.id);
  db.employeePayments = (db.employeePayments || []).filter(p => p.id !== req.params.id);
  save(db);
  if (rec) {
    const sign = rec.type === 'credit' ? '+' : '−';
    logToTelegram({
      type: 'emp_payment', ts: new Date().toISOString(),
      desc: `🗑 Удалено начисление ${rec.ownerName || 'сотрудника'}: ${sign}${Number(rec.amount).toLocaleString('ru-RU')} ₽${rec.desc ? ' — ' + rec.desc : ''}`,
    });
  }
  res.json({ ok: true });
});

// Погасить долги перед сотрудниками (их расходы из своих) — списывается из бюджета.
// body.ids — какие именно долги гасить; без ids гасятся все непогашенные.
app.post('/api/employee-payments/reimburse', (req, res) => {
  if (!requireRoot(req, res)) return;
  const db  = load();
  const now = new Date().toISOString();
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
  let total = 0, count = 0;
  const names = [];
  (db.employeePayments || []).forEach(p => {
    if (p.isExpense && !p.reimbursed && (!ids || ids.includes(p.id))) {
      p.reimbursed = true;
      p.reimbursedAt = now;
      total += Number(p.amount) || 0;
      count++;
      if (p.ownerName && !names.includes(p.ownerName)) names.push(p.ownerName);
    }
  });
  save(db);
  if (total > 0) {
    logToTelegram({
      type: 'emp_payment', ts: now,
      desc: `✅ Погашены долги (${names.join(', ') || 'сотрудники'}): −${total.toLocaleString('ru-RU')} ₽ (${count} шт) — вычтено из бюджета компании`,
    });
  }
  res.json({ ok: true, total, count });
});

/* ─── PAYMENTS ─── */
app.get('/api/payments', (req, res) => {
  res.json((load().payments || []).slice().reverse());
});

app.post('/api/payments', (req, res) => {
  const db    = load();
  const entry = { id: uid(), ...req.body, ts: new Date().toISOString() };
  if (!db.payments) db.payments = [];
  db.payments.push(entry);
  save(db);
  const sign = entry.type === 'deposit' ? '+' : '−';
  logToTelegram({
    type: 'payment', ts: entry.ts,
    desc: `${entry.type === 'deposit' ? '💰' : '💸'} ${entry.desc || (entry.type === 'deposit' ? 'Депозит' : 'Списание')}: ${sign}${Number(entry.amount).toLocaleString('ru-RU')} ₽`,
  });
  res.json(entry);
});

app.delete('/api/payments/:id', (req, res) => {
  const db  = load();
  const rec = (db.payments || []).find(p => p.id === req.params.id);
  db.payments = (db.payments || []).filter(p => p.id !== req.params.id);
  save(db);
  if (rec) {
    const sign = rec.type === 'deposit' ? '+' : '−';
    logToTelegram({
      type: 'payment', ts: new Date().toISOString(),
      desc: `🗑 Удалена запись: ${rec.desc || (rec.type === 'deposit' ? 'Депозит' : 'Списание')} ${sign}${Number(rec.amount).toLocaleString('ru-RU')} ₽`,
    });
  }
  res.json({ ok: true });
});

/* ─── PURCHASE PLANS ─── */
app.get('/api/plans', (req, res) => {
  res.json((load().plans || []).slice().reverse());
});

app.post('/api/plans', (req, res) => {
  const db    = load();
  const entry = { id: uid(), ...req.body, done: false, createdAt: new Date().toISOString() };
  if (!db.plans) db.plans = [];
  db.plans.push(entry);
  save(db);
  if (entry.amount) {
    logToTelegram({
      type: 'plan', ts: entry.createdAt,
      desc: `📋 Новый план закупки: «${entry.title}» — ${Number(entry.amount).toLocaleString('ru-RU')} ₽`,
    });
  }
  res.json(entry);
});

app.patch('/api/plans/:id', (req, res) => {
  const db  = load();
  const idx = (db.plans || []).findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  const prev = db.plans[idx];
  db.plans[idx] = { ...prev, ...req.body };
  save(db);
  if (req.body.done === true && !prev.done && prev.amount) {
    logToTelegram({
      type: 'plan', ts: new Date().toISOString(),
      desc: `✅ План выполнен: «${prev.title}» — ${Number(prev.amount).toLocaleString('ru-RU')} ₽`,
    });
  }
  res.json(db.plans[idx]);
});

app.delete('/api/plans/:id', (req, res) => {
  const db = load();
  db.plans = (db.plans || []).filter(p => p.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── SALES ─── */
app.get('/api/sales', (req, res) => res.json(load().sales || []));

// Изменить остаток товара на складе на delta штук (delta<0 — списание, >0 — возврат)
function adjustStock(db, itemId, size, delta) {
  const item = (db.items || []).find(i => i.id === itemId);
  if (!item) return;
  if (item.sizes && item.sizes.length) {
    const sz = item.sizes.find(s => (s.size || '') === (size || '')) || item.sizes[0];
    if (sz) sz.qty = Math.max(0, (parseInt(sz.qty) || 0) + delta);
    item.quantity = item.sizes.reduce((s, r) => s + (parseInt(r.qty) || 0), 0);
  } else {
    item.quantity = Math.max(0, (parseInt(item.quantity) || 0) + delta);
  }
  item.total = Math.round((item.quantity * (item.price || 0)) * 100) / 100;
  item.updatedAt = new Date().toISOString();
}

app.post('/api/sales', (req, res) => {
  const db   = load();
  const sale = { id: uid(), soldAt: new Date().toISOString(), ...req.body };
  sale.qty       = Math.max(1, parseInt(sale.qty) || 1);
  sale.netProfit = (sale.salePrice || 0) - (sale.buyPrice || 0) - (sale.deliveryCost || 0);
  if (sale.itemId) adjustStock(db, sale.itemId, sale.size, -sale.qty);
  if (!db.sales) db.sales = [];
  db.sales.unshift(sale);
  save(db);
  res.json(sale);
});

app.delete('/api/sales/:id', (req, res) => {
  const db   = load();
  const sale = (db.sales || []).find(s => s.id === req.params.id);
  // Удаление записи продажи возвращает товар на склад
  if (sale && sale.itemId) adjustStock(db, sale.itemId, sale.size, Math.max(1, parseInt(sale.qty) || 1));
  db.sales = (db.sales || []).filter(s => s.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── CATEGORIES ─── */
app.get('/api/categories', (req, res) => res.json(load().categories || []));
app.post('/api/categories', (req, res) => {
  const db  = load();
  const cat = { id: uid(), ...req.body };
  if (!db.categories) db.categories = [];
  db.categories.push(cat);
  save(db);
  res.json(cat);
});
app.delete('/api/categories/:id', (req, res) => {
  const db = load();
  db.categories = (db.categories || []).filter(c => c.id !== req.params.id);
  db.items = (db.items || []).map(i => i.categoryId === req.params.id ? { ...i, categoryId: null } : i);
  save(db);
  res.json({ ok: true });
});

/* ─── TASKS ─── */
app.get('/api/tasks', (req, res) => {
  res.json((load().tasks || []).filter(t => visibleTo(t, req.user)));
});

app.post('/api/tasks', (req, res) => {
  const db   = load();
  const task = { id: uid(), createdAt: new Date().toISOString(), done: false, ...req.body };
  if (!db.tasks) db.tasks = [];
  db.tasks.push(task);
  save(db);
  res.json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const db  = load();
  const idx = (db.tasks || []).findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.tasks[idx] = { ...db.tasks[idx], ...req.body, id: req.params.id };
  save(db);
  res.json(db.tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = load();
  db.tasks = (db.tasks || []).filter(t => t.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── QUICK ACCESS ─── */
app.get('/api/quickaccess', (req, res) => {
  res.json((load().quickaccess || []).filter(q => visibleTo(q, req.user)));
});

app.post('/api/quickaccess', (req, res) => {
  const db    = load();
  const entry = { id: uid(), createdAt: new Date().toISOString(), ...req.body };
  if (!db.quickaccess) db.quickaccess = [];
  db.quickaccess.push(entry);
  save(db);
  res.json(entry);
});

app.patch('/api/quickaccess/:id', (req, res) => {
  const db  = load();
  const idx = (db.quickaccess || []).findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.quickaccess[idx] = { ...db.quickaccess[idx], ...req.body, id: req.params.id };
  save(db);
  res.json(db.quickaccess[idx]);
});

app.delete('/api/quickaccess/:id', (req, res) => {
  const db = load();
  db.quickaccess = (db.quickaccess || []).filter(q => q.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── PROJECT NOTES ─── */
app.get('/api/project', (req, res) => {
  res.json((load().project || []));
});

app.post('/api/project', (req, res) => {
  const db    = load();
  const entry = { id: uid(), createdAt: new Date().toISOString(), ...req.body };
  if (!db.project) db.project = [];
  db.project.push(entry);
  save(db);
  res.json(entry);
});

app.patch('/api/project/:id', (req, res) => {
  const db  = load();
  const idx = (db.project || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.project[idx] = { ...db.project[idx], ...req.body, id: req.params.id };
  save(db);
  res.json(db.project[idx]);
});

app.delete('/api/project/:id', (req, res) => {
  const db = load();
  db.project = (db.project || []).filter(p => p.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── FAQ ─── */
app.get('/api/faq', (req, res) => {
  res.json((load().faq || []).filter(f => visibleTo(f, req.user)));
});

app.post('/api/faq', (req, res) => {
  const db    = load();
  const entry = { id: uid(), createdAt: new Date().toISOString(), ...req.body };
  if (!db.faq) db.faq = [];
  db.faq.push(entry);
  save(db);
  res.json(entry);
});

app.patch('/api/faq/:id', (req, res) => {
  const db  = load();
  const idx = (db.faq || []).findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.faq[idx] = { ...db.faq[idx], ...req.body, id: req.params.id };
  save(db);
  res.json(db.faq[idx]);
});

app.delete('/api/faq/:id', (req, res) => {
  const db = load();
  db.faq = (db.faq || []).filter(f => f.id !== req.params.id);
  save(db);
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

/* ─── Telegram backup — sends JSON file every 24h ─── */
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;

async function sendBackupToTelegram() {
  const token  = process.env.TG_LOG_TOKEN;
  const chatId = process.env.TG_LOG_CHAT;
  if (!token || !chatId) return false;

  const db   = load();
  const data = { version: 2, exportedAt: new Date().toISOString(), items: db.items || [], owners: db.owners || [] };
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' }).replace(/\./g, '-');

  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('caption',
    `💾 <b>Авто-бэкап Masqucerade INC.</b>\n` +
    `📦 Товаров: ${data.items.length}\n` +
    `👥 Владельцев: ${data.owners.length}\n` +
    `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК`
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
