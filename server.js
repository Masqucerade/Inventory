const express = require('express');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const app = express();
app.set('trust proxy', true);          // за прокси Railway → req.protocol === 'https'
app.use(express.json({ limit: '25mb' }));

// Страницы: / — витрина, /monarc и /type — каталог, /admin — Mini App.
const sendHtml = (res, file) =>
  res.sendFile(path.join(__dirname, file), { headers: { 'Cache-Control': 'no-cache' } });

/* ─── SEO: og-теги (превью в Telegram), per-item карточки, sitemap ─── */
// HTML витрины читаем один раз и подставляем <!--META--> на каждый запрос.
const SITE_INDEX   = fs.readFileSync(path.join(__dirname, 'site/index.html'),   'utf8');
const SITE_CATALOG = fs.readFileSync(path.join(__dirname, 'site/catalog.html'), 'utf8');
const OG_FALLBACK  = '/site/og-cover.png';

const escAttr = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const originOf = req => `${req.protocol}://${req.get('host')}`;

function headTags({ title, description, url, image, type = 'website' }) {
  const t = escAttr(title), d = escAttr(description), u = escAttr(url), i = escAttr(image);
  return `<title>${t}</title>
  <meta name="description" content="${d}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Masqucerade INC.">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:url" content="${u}">
  <meta property="og:image" content="${i}">
  <meta property="og:locale" content="ru_RU">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${i}">`;
}

app.get('/', (req, res) => {
  const o = originOf(req);
  res.set('Cache-Control', 'no-cache').send(SITE_INDEX.replace('<!--META-->', headTags({
    title:       'Masqucerade INC.',
    description: 'Monarc — оригинальные дизайнерские бренды. Type Clothes — повседневная одежда в безупречном исполнении.',
    url:   o + '/',
    image: o + OG_FALLBACK,
  })));
});

app.get(['/monarc', '/type'], (req, res) => {
  const o = originOf(req);
  const section  = req.path === '/monarc' ? 'monarc' : 'type';
  const secTitle = section === 'monarc' ? 'Monarc' : 'Type Clothes';
  let title = `Masqucerade INC. — ${secTitle}`;
  let description = section === 'monarc'
    ? 'Оригинальные дизайнерские бренды — ERD, Chrome Hearts, Balenciaga, Rick Owens и другие.'
    : 'Люкс-качество на каждый день — повседневная одежда в безупречном исполнении.';
  let image = o + OG_FALLBACK, url = `${o}/${section}`, type = 'website';

  // Прямая ссылка на товар /type?item=<id> → превью конкретной вещи с её фото.
  const id = req.query.item;
  if (id) {
    const it = (load().items || []).find(i => i.id === id && i.showOnSite && i.orderStatus !== 'done');
    if (it) {
      const photos = (it.photos && it.photos.length) ? it.photos : (it.photo ? [it.photo] : []);
      const price  = it.price != null ? new Intl.NumberFormat('ru-RU').format(it.price) + ' ₽' : '';
      title = `${it.name} — Masqucerade INC.`;
      description = it.description || [price, secTitle].filter(Boolean).join(' · ');
      if (photos[0]) image = o + photos[0];
      url  = `${o}/${section}?item=${encodeURIComponent(id)}`;
      type = 'product';
    }
  }
  res.set('Cache-Control', 'no-cache').send(SITE_CATALOG.replace('<!--META-->', headTags({ title, description, url, image, type })));
});

app.get('/brands', (req, res) => res.redirect(301, '/monarc'));
app.get('/admin',  (req, res) => sendHtml(res, 'index.html'));

app.get('/sitemap.xml', (req, res) => {
  const o = originOf(req);
  const urls = [`${o}/`, `${o}/monarc`, `${o}/type`];
  for (const it of (load().items || [])) {
    if (it.showOnSite && it.orderStatus !== 'done')
      urls.push(`${o}/${it.isMonarc ? 'monarc' : 'type'}?item=${encodeURIComponent(it.id)}`);
  }
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n') +
    `\n</urlset>\n`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${originOf(req)}/sitemap.xml\n`);
});

// db.json (фото, пароли, финансы) не должен отдаваться статикой
app.use('/data', (req, res) => res.status(404).end());

// HTML не кэшируем (css/js версионируются через ?v=), чтобы разметка и скрипты
// всегда были одной версии — иначе на старом index.html новый app.js падает.
app.use(express.static(path.join(__dirname), {
  index: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.set('Cache-Control', 'no-cache');
  },
}));

const DATA_DIR  = process.env.DATA_DIR  || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

// Фото лежат отдельными файлами на volume, а не base64 в db.json. Имена — по
// content-hash, поэтому раздаём с вечным кэшем (файл с таким именем неизменен).
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
fs.mkdirSync(PHOTOS_DIR, { recursive: true });
app.use('/photos', express.static(PHOTOS_DIR, { immutable: true, maxAge: '365d' }));

// data:image/…;base64,… → файл /photos/<hash>.jpg. Дедуп по хэшу: одинаковые
// байты пишутся один раз. Возвращает ссылку либо null, если это не data-URL.
function saveDataUrl(dataUrl) {
  const m = /^data:image\/([a-z]+);base64,(.+)$/is.exec(dataUrl);
  if (!m) return null;
  const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
  const name = crypto.createHash('sha1').update(m[2]).digest('hex').slice(0, 16) + '.' + ext;
  const file = path.join(PHOTOS_DIR, name);
  try { if (!fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(m[2], 'base64')); }
  catch (e) { console.error('photo write failed:', e.message); return null; }
  return '/photos/' + name;
}

// Выгружает base64-фото товара в файлы, оставляя ссылки. Идемпотентна: ссылки
// /photos/… и любые не-data-строки проходят как есть. Мутирует и возвращает item.
function externalizePhotos(item) {
  if (!item || typeof item !== 'object') return item;
  const ref = v => (typeof v === 'string' && v.startsWith('data:')) ? (saveDataUrl(v) || v) : v;
  if (Array.isArray(item.photos)) item.photos = item.photos.map(ref).filter(Boolean);
  if (Array.isArray(item.thumbs)) item.thumbs = item.thumbs.map(ref).filter(Boolean);
  if (typeof item.photo === 'string') item.photo = ref(item.photo);
  // Легаси/миграция: миниатюр нет — берём полные (они и так ≤900px).
  if ((!item.thumbs || !item.thumbs.length) && item.photos && item.photos.length)
    item.thumbs = [...item.photos];
  return item;
}

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
/* Пароли: scrypt-хэш вида "s2$<salt>$<hash>" — исходный пароль нигде не хранится. */
function hashPassword(pass) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pass), salt, 32).toString('hex');
  return `s2$${salt}$${hash}`;
}
function verifyPassword(pass, stored) {
  if (!stored) return false;
  if (!String(stored).startsWith('s2$')) return String(stored) === String(pass); // legacy plaintext
  const [, salt, hash] = String(stored).split('$');
  try {
    const h = crypto.scryptSync(String(pass), salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
  } catch { return false; }
}

// Гарантируем наличие root-администратора (Monarc / 0000)
function seedRoot(db) {
  if (!db.users)    db.users = [];
  if (!db.sessions) db.sessions = [];
  if (!db.users.some(u => u.role === 'root')) {
    db.users.unshift({
      id: uid(), login: 'Monarc', password: hashPassword('0000'), name: 'Monarc',
      role: 'root', createdAt: new Date().toISOString(),
    });
  }
}
// Один раз при старте: сид root + миграция открытых паролей на хэши
(() => {
  const db = load();
  seedRoot(db);
  let migrated = 0;
  (db.users || []).forEach(u => {
    if (u.password && !String(u.password).startsWith('s2$')) {
      u.password = hashPassword(u.password);
      migrated++;
    }
  });
  if (migrated) console.log(`Пароли захэшированы: ${migrated}`);
  save(db);
})();

function currentUser(req) {
  const token = req.headers['x-auth-token'] || '';
  if (!token) return null;
  const db   = load();
  const sess = (db.sessions || []).find(s => s.token === token);
  if (!sess) return null;
  // Просроченная сессия (45 дней) — требуем перелогин
  if (Date.now() - new Date(sess.createdAt).getTime() > 45 * 24 * 3600 * 1000) return null;
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
const SECTIONS = ['inventory', 'stats', 'finance', 'project', 'site', 'faq'];
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

// Публичный вход.
// Rate-limit: не больше 10 неудачных попыток с одного IP за 10 минут.
const _loginAttempts = new Map();
const SESSION_TTL_MS = 45 * 24 * 3600 * 1000;   // сессия живёт 45 дней

app.post('/api/login', (req, res) => {
  const ip  = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const att = _loginAttempts.get(ip);
  if (att && now - att.first < 10 * 60 * 1000 && att.count >= 10)
    return res.status(429).json({ error: 'Слишком много попыток — подождите 10 минут' });

  const db = load(); seedRoot(db);
  const login = String(req.body.login || '').trim().toLowerCase();
  const pass  = String(req.body.password || '');
  const user  = (db.users || []).find(u => (u.login || '').toLowerCase() === login && verifyPassword(pass, u.password));
  if (!user) {
    if (!att || now - att.first >= 10 * 60 * 1000) _loginAttempts.set(ip, { first: now, count: 1 });
    else att.count++;
    save(db);
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }
  _loginAttempts.delete(ip);
  // Чистим протухшие сессии, чтобы db не рос бесконечно
  db.sessions = (db.sessions || []).filter(s => now - new Date(s.createdAt).getTime() < SESSION_TTL_MS);
  const token = uid() + uid();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  save(db);
  res.json({ token, user: { id: user.id, name: user.name, login: user.login, role: user.role, access: user.access || null, hideCosts: !!user.hideCosts } });
});

/* ─── ПУБЛИЧНЫЙ API ВИТРИНЫ (без авторизации, только чтение) ───
   Наружу уходят только товары/топики с галочкой showOnSite и только
   публичные поля — никаких закупов, владельцев и служебных данных. */
app.get('/api/public/items', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  let items = (load().items || []).filter(i => i.showOnSite && i.orderStatus !== 'done');
  if (['brands', 'monarc'].includes(req.query.section)) items = items.filter(i => i.isMonarc);
  else if (req.query.section === 'type')                items = items.filter(i => !i.isMonarc);
  res.json(items.map(i => {
    const photos = Array.isArray(i.photos) && i.photos.length ? i.photos : (i.photo ? [i.photo] : []);
    const thumbs = Array.isArray(i.thumbs) && i.thumbs.length ? i.thumbs : photos;
    return {
      id:           i.id,
      name:         i.name,
      price:        i.price ?? null,
      photos,
      thumbs,
      sizes:        Array.isArray(i.sizes) ? i.sizes.filter(s => (s.qty || 0) > 0).map(s => ({ size: s.size, qty: s.qty })) : null,
      description:  i.description || '',
      measurements: i.measurements || '',
      categoryId:   i.categoryId || null,
      garment:      i.garment || null,
      quantity:     i.quantity ?? null,
    };
  }));
});

app.get('/api/public/categories', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json((load().categories || [])
    .slice().sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => ({ id: c.id, name: c.name, parentId: c.parentId || null, order: c.order || 0 })));
});

app.get('/api/public/collections', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  const db = load();
  // Наружу попадают только id товаров, реально видимых в этом разделе витрины
  let visible = (db.items || []).filter(i => i.showOnSite && i.orderStatus !== 'done');
  if (['brands', 'monarc'].includes(req.query.section)) visible = visible.filter(i => i.isMonarc);
  else if (req.query.section === 'type')                visible = visible.filter(i => !i.isMonarc);
  const pub = new Set(visible.map(i => i.id));
  res.json((db.collections || [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => ({
      id:          c.id,
      title:       c.title,
      order:       c.order || 0,   // общий порядок с блоками — для чередования
      description: c.description || '',
      itemIds:     (c.itemIds || []).filter(id => pub.has(id)),
    }))
    .filter(c => c.itemIds.length));
});

// Контент-блоки витрины (баннер / текст / промо), настраиваются в админке.
app.get('/api/public/blocks', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  const section = ['brands', 'monarc'].includes(req.query.section) ? 'monarc' : 'type';
  const blocks = (load().blocks || [])
    .filter(b => b.enabled && (b.section === 'all' || b.section === section))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(b => {
      const order = b.order || 0;   // общий порядок с подборками — для чередования на витрине
      if (b.type === 'banner') return {
        id: b.id, type: 'banner', order,
        images: (Array.isArray(b.images) && b.images.length) ? b.images : (b.image ? [b.image] : []),
        size: b.size || 'md',
        heading: b.heading || '', subtext: b.subtext || '',
        linkType: b.linkType || 'none', linkValue: b.linkValue || '',
      };
      if (b.type === 'text')      return { id: b.id, type: 'text',  order, heading: b.heading || '', body: b.body || '' };
      if (b.type === 'promo')     return { id: b.id, type: 'promo', order, text: b.text || '' };
      if (b.type === 'marquee')   return { id: b.id, type: 'marquee', order, text: b.text || '' };
      if (b.type === 'statement') return { id: b.id, type: 'statement', order, kicker: b.kicker || '', text: b.text || '' };
      if (b.type === 'weekly')    return { id: b.id, type: 'weekly', order, heading: b.heading || 'Товары недели', itemIds: b.itemIds || [] };
      if (b.type === 'duo') return {
        id: b.id, type: 'duo', order,
        imageA: b.imageA || '', captionA: b.captionA || '', linkTypeA: b.linkTypeA || 'none', linkValueA: b.linkValueA || '',
        imageB: b.imageB || '', captionB: b.captionB || '', linkTypeB: b.linkTypeB || 'none', linkValueB: b.linkValueB || '',
      };
      return { id: b.id, type: b.type, order };
    })
    .filter(b => {
      if (b.type === 'banner')    return (b.images && b.images.length) || b.heading;   // пустой баннер не показываем
      if (b.type === 'duo')       return b.imageA || b.imageB;
      if (b.type === 'statement' || b.type === 'marquee') return b.text;
      if (b.type === 'weekly')    return (b.itemIds || []).length;
      return true;
    })
  res.json(blocks);
});

app.get('/api/public/faq', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json((load().faq || []).filter(f => f.showOnSite).map(f => ({
    id:    f.id,
    title: f.title,
    body:  f.body || '',
    lines: Array.isArray(f.lines) ? f.lines.map(l => ({ label: l.label || '', text: l.text || '' })) : [],
  })));
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
// FAQ-топики витрины управляются во вкладке «Сайт» → доступ по разделу 'site'
app.use('/api/faq',         (req, res, next) => requireAccess('site')(req, res, next));
// Внутренние гайды для сотрудников живут во вкладке «Гайды» (раздел 'faq')
app.use('/api/guides',      (req, res, next) => requireAccess('faq')(req, res, next));
app.use(['/api/blocks', '/api/collections'], (req, res, next) => requireAccess('site')(req, res, next));

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
  u.password = hashPassword(password);
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
  // Пароли наружу не отдаём — они хранятся только хэшами
  res.json((load().users || []).map(u => ({
    id: u.id, login: u.login, name: u.name, role: u.role,
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
    id: uid(), login, password: hashPassword(password), name, role: 'user', access,
    hideCosts: !!req.body.hideCosts,
    tgChatId:  String(req.body.tgChatId || '').trim(),
    notify:    Array.isArray(req.body.notify) ? req.body.notify.filter(c => NOTIFY_CATS.includes(c)) : [],
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save(db);
  const { password: _p, ...safe } = user;
  res.json(safe);
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
  if (req.body.password != null && req.body.password !== '') u.password = hashPassword(req.body.password);
  if (req.body.name != null) u.name = String(req.body.name).trim() || u.name;
  if (Array.isArray(req.body.access)) u.access = req.body.access.filter(s => SECTIONS.includes(s));
  if (req.body.hideCosts != null) u.hideCosts = !!req.body.hideCosts;
  if (req.body.tgChatId  != null) u.tgChatId  = String(req.body.tgChatId).trim();
  if (Array.isArray(req.body.notify)) u.notify = req.body.notify.filter(c => NOTIFY_CATS.includes(c));
  save(db);
  const { password: _p, ...safe } = u;
  res.json(safe);
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
    const catName = {};
    (load().categories || []).forEach(c => { catName[c.id] = (c.name || '').toLowerCase(); });
    rows = rows.filter(i =>
      (i.name  ||'').toLowerCase().includes(q) ||
      (i.type  ||'').toLowerCase().includes(q) ||
      (catName[i.categoryId] || '').includes(q) ||
      (i.size  ||'').toLowerCase().includes(q) ||
      (i.notes ||'').toLowerCase().includes(q) ||
      (Array.isArray(i.sizes) && i.sizes.some(s => (s.size || '').toLowerCase().includes(q)))
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
  const item = externalizePhotos({ ...req.body });
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
    const TRACKED = ['orderStatus','ownerId','name','price','buyPrice','categoryId'];
    const changes = {};
    TRACKED.forEach(f => { if (String(old[f]??'') !== String(item[f]??'')) changes[f] = { from: old[f], to: item[f] }; });
    item.history = [...(old.history || [])];
    if (Object.keys(changes).length)
      item.history = [...item.history, { ts: now, by: item._updatedBy||null, byName: req.user?.name || null, changes }].slice(-30);
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

/* @username → chat_id. Личным чатам Telegram не шлёт по юзернейму,
   поэтому собираем соответствия из getUpdates (пользователь должен
   один раз нажать Start у бота). Кэш живёт в db.tgChats. */
let _tgChatsRefreshedAt = 0;
async function refreshTgChats(token) {
  if (Date.now() - _tgChatsRefreshedAt < 60_000) return;   // не чаще раза в минуту
  _tgChatsRefreshedAt = Date.now();
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100`, {
      signal: AbortSignal.timeout(8000),
    });
    const d = await r.json();
    if (!d.ok) return;
    const db = load();
    db.tgChats = db.tgChats || {};
    (d.result || []).forEach(u => {
      const chat = u.message?.chat || u.edited_message?.chat;
      if (chat?.type === 'private' && chat.username) {
        db.tgChats[chat.username.toLowerCase()] = String(chat.id);
      }
    });
    save(db);
  } catch (_) {}
}

async function resolveTgChat(token, idOrName) {
  const v = String(idOrName || '').trim();
  if (!v) return null;
  if (!v.startsWith('@')) return v;                 // числовой ID — как есть
  const uname = v.slice(1).toLowerCase();
  let map = load().tgChats || {};
  if (map[uname]) return map[uname];
  await refreshTgChats(token);                       // попробуем подтянуть из getUpdates
  map = load().tgChats || {};
  return map[uname] || null;
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

  // Персональные подписки пользователей (fire-and-forget)
  (async () => {
    const cat  = notifyCategoryOf(entry.type);
    const sent = new Set([String(process.env.TG_LOG_CHAT || '')]);
    for (const u of (load().users || [])) {
      if (!u.tgChatId) continue;
      if (!Array.isArray(u.notify) || !u.notify.includes(cat)) continue;
      const chatId = await resolveTgChat(token, u.tgChatId);
      if (!chatId || sent.has(String(chatId))) continue;
      sent.add(String(chatId));
      tgSend(token, chatId, text);
    }
  })().catch(() => {});
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
  const cats = {};
  (db.categories || []).forEach(c => { cats[c.id] = c.name; });

  const rows = [csvRow(['Категория','Наименование','Размеры','Кол-во','Цена/шт','Итого','Владелец','Статус','Заметки','Обновлено'])];
  (db.items || []).forEach(item => {
    const sizes = (item.sizes || []).map(s => s.size + (s.qty > 1 ? '×' + s.qty : '')).join(', ') || '-';
    rows.push(csvRow([
      cats[item.categoryId] || '', item.name || '', sizes,
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
app.patch('/api/categories/:id', (req, res) => {
  const db  = load();
  const idx = (db.categories || []).findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  const patch = { ...req.body };
  if (patch.name != null) patch.name = String(patch.name).trim();
  db.categories[idx] = { ...db.categories[idx], ...patch };
  save(db);
  res.json(db.categories[idx]);
});
app.delete('/api/categories/:id', (req, res) => {
  const db = load();
  db.categories = (db.categories || []).filter(c => c.id !== req.params.id)
    .map(c => c.parentId === req.params.id ? { ...c, parentId: null } : c);  // подкатегории → в корень
  db.items = (db.items || []).map(i => i.categoryId === req.params.id ? { ...i, categoryId: null } : i);
  save(db);
  res.json({ ok: true });
});

/* ─── COLLECTIONS (подборки товаров на сайте) ─── */
app.get('/api/collections', (req, res) => res.json(load().collections || []));
app.put('/api/collections', (req, res) => {
  const db = load();
  if (!db.collections) db.collections = [];
  // Частичный мердж: приходит либо полная форма, либо только {id, order} при
  // перестановке — не затираем непереданные поля.
  const c = { ...req.body };
  if (c.title != null)       c.title = String(c.title).trim();
  if (c.description != null) c.description = String(c.description).trim();
  if (c.itemIds != null && !Array.isArray(c.itemIds)) c.itemIds = [];
  if (!c.id) {
    c.id = uid();
    if (c.order == null) c.order = db.collections.reduce((m, x) => Math.max(m, x.order || 0), 0) + 1;
  }
  const idx = db.collections.findIndex(x => x.id === c.id);
  if (idx >= 0) db.collections[idx] = { ...db.collections[idx], ...c };
  else db.collections.push({ title: '', description: '', itemIds: [], ...c });
  save(db);
  res.json(idx >= 0 ? db.collections[idx] : c);
});
app.delete('/api/collections/:id', (req, res) => {
  const db = load();
  db.collections = (db.collections || []).filter(c => c.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── SITE BLOCKS (баннер / текст / промо на витрине) ─── */
app.get('/api/blocks', (req, res) => res.json(load().blocks || []));
app.put('/api/blocks', (req, res) => {
  const db = load();
  if (!db.blocks) db.blocks = [];
  const b = { ...req.body };
  // Картинки (баннер + обе картинки двойного баннера): base64 → файл на volume.
  const toRef = v => (typeof v === 'string' && v.startsWith('data:')) ? (saveDataUrl(v) || v) : v;
  for (const f of ['image', 'imageA', 'imageB']) b[f] = toRef(b[f]);
  if (Array.isArray(b.images)) b.images = b.images.map(toRef).filter(Boolean);   // мультифото баннера
  if (!b.id) {
    b.id = uid();
    if (b.order == null) b.order = db.blocks.reduce((m, x) => Math.max(m, x.order || 0), 0) + 1;
  }
  const idx = db.blocks.findIndex(x => x.id === b.id);
  if (idx >= 0) db.blocks[idx] = { ...db.blocks[idx], ...b };
  else db.blocks.push(b);
  save(db);
  res.json(idx >= 0 ? db.blocks[idx] : b);
});
app.delete('/api/blocks/:id', (req, res) => {
  const db = load();
  db.blocks = (db.blocks || []).filter(b => b.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── TASKS ─── */
/* Личная задача видна только своему создателю (даже root чужие не видит) */
function taskVisible(t, user) {
  if (t.personal) return t.createdBy === user.id;
  return visibleTo(t, user);
}

app.get('/api/tasks', (req, res) => {
  res.json((load().tasks || []).filter(t => taskVisible(t, req.user)));
});

app.post('/api/tasks', (req, res) => {
  const db   = load();
  const task = { id: uid(), createdAt: new Date().toISOString(), done: false, ...req.body };
  task.personal  = !!req.body.personal;
  task.createdBy = req.user.id;
  if (!db.tasks) db.tasks = [];
  db.tasks.push(task);
  save(db);
  res.json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const db  = load();
  const idx = (db.tasks || []).findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  if (!taskVisible(db.tasks[idx], req.user)) return res.status(404).json({ error: 'not found' });
  db.tasks[idx] = { ...db.tasks[idx], ...req.body, id: req.params.id, createdBy: db.tasks[idx].createdBy };
  save(db);
  res.json(db.tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = load();
  const t  = (db.tasks || []).find(x => x.id === req.params.id);
  if (t && !taskVisible(t, req.user)) return res.status(404).json({ error: 'not found' });
  db.tasks = (db.tasks || []).filter(x => x.id !== req.params.id);
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

/* ─── ГАЙДЫ (внутренняя база для сотрудников, Markdown) ───
   Читают все с доступом к разделу 'faq', редактирует только root. */
app.get('/api/guides', (req, res) => {
  res.json((load().guides || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
});

app.post('/api/guides', (req, res) => {
  if (!requireRoot(req, res)) return;
  const db  = load();
  if (!db.guides) db.guides = [];
  const now = new Date().toISOString();
  const entry = {
    id: uid(), createdAt: now, updatedAt: now,
    order: db.guides.length,
    title:  String(req.body.title || '').trim(),
    body:   String(req.body.body || ''),
    format: req.body.format === 'html' ? 'html' : 'markdown',
  };
  db.guides.push(entry);
  save(db);
  res.json(entry);
});

app.patch('/api/guides/:id', (req, res) => {
  if (!requireRoot(req, res)) return;
  const db  = load();
  const idx = (db.guides || []).findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const patch = {};
  if (req.body.title !== undefined) patch.title = String(req.body.title).trim();
  if (req.body.body  !== undefined) patch.body  = String(req.body.body);
  if (req.body.order !== undefined) patch.order = req.body.order;
  if (req.body.format !== undefined) patch.format = req.body.format === 'html' ? 'html' : 'markdown';
  db.guides[idx] = { ...db.guides[idx], ...patch, id: req.params.id, updatedAt: new Date().toISOString() };
  save(db);
  res.json(db.guides[idx]);
});

app.delete('/api/guides/:id', (req, res) => {
  if (!requireRoot(req, res)) return;
  const db = load();
  db.guides = (db.guides || []).filter(g => g.id !== req.params.id);
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
  db.items  = (req.body.items || []).map(externalizePhotos);
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

// Разовая миграция: выгрузить base64-фото существующих товаров в файлы.
function migratePhotos() {
  const db = load();
  if (!Array.isArray(db.items) || !db.items.length) return;
  // Страховка: перед первым переносом сохраняем нетронутую копию базы (с base64)
  // на volume. Пишем один раз — потом файл остаётся как оффлайн-откат.
  const preFile = path.join(DATA_DIR, 'db.premigration.json');
  const hasB64 = db.items.some(it =>
    [...(it.photos || []), ...(it.thumbs || []), it.photo]
      .some(v => typeof v === 'string' && v.startsWith('data:')));
  if (hasB64 && !fs.existsSync(preFile)) {
    try { fs.writeFileSync(preFile, fs.readFileSync(DATA_FILE)); console.log('Pre-migration backup written:', preFile); }
    catch (e) { console.error('Pre-migration backup FAILED, aborting migration:', e.message); return; }
  }
  let changed = 0;
  for (const it of db.items) {
    const before = JSON.stringify([it.photos, it.thumbs, it.photo]);
    externalizePhotos(it);
    if (JSON.stringify([it.photos, it.thumbs, it.photo]) !== before) changed++;
  }
  if (changed) { save(db); console.log(`Photo migration: ${changed} item(s) externalized`); }
  else console.log('Photo migration: nothing to do');
}

// Разовая миграция: у существующих участников с настроенным access добавить
// раздел 'site' (появился позже) — чтобы вкладка «Сайт» осталась доступной,
// но теперь её можно снять галочкой. Root и «полный доступ» (access=null) — мимо.
function migrateSiteAccess() {
  const db = load();
  let changed = 0;
  for (const u of (db.users || [])) {
    if (u.role !== 'root' && Array.isArray(u.access) && !u.access.includes('site')) {
      u.access.push('site');
      changed++;
    }
  }
  if (changed) { save(db); console.log(`Site-access migration: ${changed} user(s) updated`); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Masqucerade INC. v2 on :${PORT}`);
  migratePhotos();
  migrateSiteAccess();
  scheduleBackup();
});
