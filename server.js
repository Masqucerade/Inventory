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
const SITE_PRODUCT = fs.readFileSync(path.join(__dirname, 'site/product.html'), 'utf8');
const OG_FALLBACK  = '/site/og-cover.png';

const escAttr = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const originOf = req => `${req.protocol}://${req.get('host')}`;

// Страницы Monarc получают свою фавиконку (Σi на чёрном)
const monarcFavicon = html => html
  .replace('<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
           '<link rel="icon" href="/site/monarc-favicon.svg" type="image/svg+xml">')
  .replace('<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">', '');

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
  // Название вкладки: Monarc — своё, Type — общий бренд
  let title = section === 'monarc' ? 'Monarc' : 'Masqucerade';
  let description = section === 'monarc'
    ? 'Оригинальные дизайнерские бренды — ERD, Chrome Hearts, Balenciaga, Rick Owens и другие.'
    : 'Люкс-качество на каждый день — повседневная одежда в безупречном исполнении.';
  let image = o + OG_FALLBACK, url = `${o}/${section}`, type = 'website';

  // Старые прямые ссылки /type?item=<id> → постоянная страница товара
  if (req.query.item) return res.redirect(301, `/product/${encodeURIComponent(req.query.item)}`);

  let html = SITE_CATALOG.replace('<!--META-->', headTags({ title, description, url, image, type }));
  if (section === 'monarc') html = monarcFavicon(html);
  res.set('Cache-Control', 'no-cache').send(html);
});

// Страница товара — постоянный адрес, og-превью с фото вещи
app.get('/product/:id', (req, res) => {
  const o  = originOf(req);
  const it = (load().items || []).find(i => i.id === req.params.id && i.showOnSite);
  if (!it) return res.redirect(302, '/');
  const photos = (it.photos && it.photos.length) ? it.photos : (it.photo ? [it.photo] : []);
  const price  = it.price != null ? new Intl.NumberFormat('ru-RU').format(it.price) + ' ₽' : '';
  let html = SITE_PRODUCT.replace('<!--META-->', headTags({
    title:       `${it.name} — Masqucerade INC.`,
    description: it.description || [price, it.isMonarc ? 'Monarc' : 'Type Clothes'].filter(Boolean).join(' · '),
    url:   `${o}/product/${encodeURIComponent(it.id)}`,
    image: photos[0] ? o + photos[0] : o + OG_FALLBACK,
    type:  'product',
  }));
  if (it.isMonarc) html = monarcFavicon(html);
  res.set('Cache-Control', 'no-cache').send(html);
});

app.get('/brands', (req, res) => res.redirect(301, '/monarc'));
app.get('/admin',  (req, res) => sendHtml(res, 'index.html'));

app.get('/sitemap.xml', (req, res) => {
  const o = originOf(req);
  const urls = [`${o}/`, `${o}/monarc`, `${o}/type`];
  for (const it of (load().items || [])) {
    if (it.showOnSite) urls.push(`${o}/product/${encodeURIComponent(it.id)}`);
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

// Служебные файлы проекта тоже не отдаём (express.static раздаёт весь __dirname)
app.use(['/server.js', '/package.json', '/package-lock.json', '/nixpacks.toml', '/railway.json'],
  (req, res) => res.status(404).end());

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
// Товар «продан» — всё распродано или объявление завершено; такие уходят в «Архив» витрины
const isSoldOut = (i) => i.orderStatus === 'done' || (parseInt(i.quantity) || 0) <= 0;

function publicItem(i) {
  const photos = Array.isArray(i.photos) && i.photos.length ? i.photos : (i.photo ? [i.photo] : []);
  const thumbs = Array.isArray(i.thumbs) && i.thumbs.length ? i.thumbs : photos;
  return {
    id:           i.id,
    name:         i.name,
    price:        i.price ?? null,
    // Старая цена для скидки — только если реально больше текущей
    oldPrice:     (i.oldPrice && i.price && i.oldPrice > i.price) ? i.oldPrice : null,
    inStock:      i.orderStatus === 'in_stock',
    sold:         isSoldOut(i),
    reserved:     i.orderStatus === 'processing',   // «В заказе» → лента «Зарезервировано»
    photos,
    thumbs,
    sizes:        Array.isArray(i.sizes) ? i.sizes.filter(s => (s.qty || 0) > 0).map(s => ({ size: s.size, qty: s.qty })) : null,
    description:  i.description || '',
    measurements: i.measurements || '',
    categoryId:   i.categoryId || null,
    garment:      i.garment || null,
    quantity:     i.quantity ?? null,
    createdAt:    i.createdAt || null,
    section:      i.isMonarc ? 'monarc' : 'type',
  };
}

app.get('/api/public/items', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  // Проданные тоже отдаём (sold: true) — витрина показывает их в «Архиве»
  let items = (load().items || []).filter(i => i.showOnSite);
  if (['brands', 'monarc'].includes(req.query.section)) items = items.filter(i => i.isMonarc);
  else if (req.query.section === 'type')                items = items.filter(i => !i.isMonarc);
  res.json(items.map(publicItem));
});

// Один товар для страницы /product/:id + похожие (та же категория, в наличии)
app.get('/api/public/items/:id', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  const db = load();
  const it = (db.items || []).find(i => i.id === req.params.id && i.showOnSite);
  if (!it) return res.status(404).json({ error: 'Not found' });
  // Счётчик просмотров страницы товара (виден в панели)
  it.views = (it.views || 0) + 1;
  save(db);
  const pool = (db.items || []).filter(i =>
    i.showOnSite && i.id !== it.id && !isSoldOut(i) && !!i.isMonarc === !!it.isMonarc);
  // Сначала — та же категория; если там пусто, показываем другие вещи раздела
  let related = it.categoryId ? pool.filter(i => i.categoryId === it.categoryId) : [];
  if (!related.length) related = pool;
  res.json({ item: publicItem(it), related: related.slice(0, 8).map(publicItem) });
});

// Клик по «Написать в Telegram» на странице товара — счётчик заявок.
// Вместе с views даёт воронку: смотрят → пишут.
app.post('/api/public/items/:id/click', (req, res) => {
  const db = load();
  const it = (db.items || []).find(i => i.id === req.params.id && i.showOnSite);
  if (it) { it.tgClicks = (it.tgClicks || 0) + 1; save(db); }
  res.json({ ok: true });
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
      if (b.type === 'text')      return { id: b.id, type: 'text',  order, heading: b.heading || '', body: b.body || '' };
      if (b.type === 'promo')     return { id: b.id, type: 'promo', order, text: b.text || '' };
      if (b.type === 'marquee')   return { id: b.id, type: 'marquee', order, text: b.text || '' };
      if (b.type === 'statement') return { id: b.id, type: 'statement', order, kicker: b.kicker || '', text: b.text || '' };
      if (b.type === 'weekly')    return { id: b.id, type: 'weekly', order, heading: b.heading || 'Товары недели', itemIds: b.itemIds || [] };
      if (b.type === 'banner') return {
        id: b.id, type: 'banner', order,
        image: b.image || '', heading: b.heading || '', sub: b.sub || '',
        height: b.height || 'm', fit: b.fit || 'cover', pos: b.pos || 'center center',
        linkType: b.linkType || 'none', linkValue: b.linkValue || '',
      };
      if (b.type === 'duo') return {
        id: b.id, type: 'duo', order,
        imageA: b.imageA || '', captionA: b.captionA || '', linkTypeA: b.linkTypeA || 'none', linkValueA: b.linkValueA || '',
        imageB: b.imageB || '', captionB: b.captionB || '', linkTypeB: b.linkTypeB || 'none', linkValueB: b.linkValueB || '',
      };
      // Обложка раздела: полноэкранное превью на самом верху каталога
      if (b.type === 'cover') return {
        id: b.id, type: 'cover', order,
        image: b.image || '', heading: b.heading || '', sub: b.sub || '',
        pos: b.pos || 'center center',
        fit: b.fit === 'auto' ? 'auto' : 'cover',   // auto = фото целиком, без кадрирования
      };
      // Попап при заходе: section нужен клиенту (лендинг показывает только «Везде»)
      if (b.type === 'popup') return {
        id: b.id, type: 'popup', order, section: b.section || 'all',
        heading: b.heading || '', text: b.text || '', image: b.image || '',
        linkType: b.linkType || 'none', linkValue: b.linkValue || '', btnLabel: b.btnLabel || '',
        repeat: b.repeat === 'always' ? 'always' : 'once',
      };
      return { id: b.id, type: b.type, order };
    })
    .filter(b => {
      if (b.type === 'banner')    return !!b.image;
      if (b.type === 'cover')     return !!b.image;
      if (b.type === 'duo')       return b.imageA || b.imageB;
      if (b.type === 'statement' || b.type === 'marquee') return b.text;
      if (b.type === 'weekly')    return (b.itemIds || []).length;
      if (b.type === 'popup')     return b.heading || b.text;
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

// Сотрудники (только id/имя/роль) — доступно всем авторизованным; для задач проекта
app.get('/api/team', (req, res) => {
  res.json((load().users || []).map(u => ({ id: u.id, name: u.name || u.login, role: u.role })));
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
  // slice(): без фильтров rows — это сам db.items, sort мутировал бы базу
  rows = rows.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
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
  site_block:   '🧱', site_col:     '🗂', site_faq:     '💬', site_item: '🌐',
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
  // desc содержит пользовательский ввод (названия товаров) — экранируем,
  // иначе «<» в названии ломает parse_mode HTML и сообщение молча не уходит
  const text = `${icon} <b>${escAttr(entry.desc)}</b>\n<i>${date}</i>`;

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
  const limit = Math.min(300, Math.max(1, parseInt(req.query.limit) || 80));
  const logs = (load().logs || []).slice().reverse().slice(0, limit);
  res.json(logs);
});

app.post('/api/logs', (req, res) => {
  const db    = load();
  const entry = { id: uid(), ...req.body, ts: new Date().toISOString() };
  // Кто сделал — для журнала (Terminal)
  entry.user = req.user?.name || req.user?.login || null;
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
                    backup: 'Бэкап', restore: 'Восстановление', clear: 'Очистка',
                    site_block: 'Витрина', site_col: 'Подборка', site_faq: 'FAQ сайта', site_item: 'Витрина' };

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
  db.plans[idx] = { ...prev, ...req.body, id: prev.id };
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
  // Снимок категории и владельца на момент продажи — для статистики
  if (sale.itemId) {
    const item = (db.items || []).find(i => i.id === sale.itemId);
    if (item) {
      if (sale.categoryId === undefined) sale.categoryId = item.categoryId || null;
      if (sale.ownerId === undefined) {
        const sz = (item.sizes || []).find(s => (s.size || '') === (sale.size || ''));
        sale.ownerId = (sz && sz.ownerId) || item.ownerId || null;
      }
    }
  }
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
  // Только присланные поля: b[f] = toRef(undefined) создавал ключ со значением
  // undefined, и частичный мердж (тумблер/порядок/fit) затирал сохранённое фото
  for (const f of ['image', 'imageA', 'imageB']) if (b[f] !== undefined) b[f] = toRef(b[f]);
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

/* ─── Уведомление исполнителю: «пришла новая задача» ───
   Шлётся лично, если у сотрудника указан tgChatId. Личные задачи и
   назначение самому себе не уведомляем. Fire-and-forget. */
const TASK_KIND_RU = { urgent: 'Срочная', duty: 'Обязанность', goal: 'Цель' };

async function notifyTaskAssigned(task, byUser) {
  try {
    const token = process.env.TG_LOG_TOKEN;
    if (!token || !task?.assigneeId || task.personal) return;
    const db = load();
    const u  = (db.users || []).find(x => x.id === task.assigneeId);
    if (!u || !u.tgChatId || u.id === byUser?.id) return;
    const chatId = await resolveTgChat(token, u.tgChatId);
    if (!chatId) return;
    const text =
      `<b>MASQUCERADE INC.</b>\n` +
      `<i>Вам назначена новая задача</i>\n\n` +
      `<b>${escAttr(task.title || task.text || 'Без названия')}</b>` +
      (task.description ? `\n${escAttr(task.description)}` : '') +
      `\n\nТип: ${TASK_KIND_RU[task.kind] || TASK_KIND_RU.duty}` +
      (byUser?.name ? `\nНазначил: ${escAttr(byUser.name)}` : '');
    tgSend(token, chatId, text);
  } catch (_) {}
}

/* ─── TASKS ─── */
/* Личная задача видна только своему создателю (даже root чужие не видит).
   Сотрудник видит только СВОИ задачи: назначенные ему (в т.ч. legacy —
   на владельца вещей с тем же именем), созданные им и общие (без
   исполнителя). Чужие задачи не отдаются вовсе. Root видит всё. */
function taskVisible(t, user, db) {
  if (t.personal) return t.createdBy === user.id;
  if (!visibleTo(t, user)) return false;
  if (user.role === 'root') return true;
  if (!t.assigneeId || t.assigneeId === user.id || t.createdBy === user.id) return true;
  const legacy = ((db || load()).owners || []).find(o =>
    (o.name || '').toLowerCase() === (user.name || '').toLowerCase());
  return !!legacy && t.assigneeId === legacy.id;
}

app.get('/api/tasks', (req, res) => {
  const db = load();
  res.json((db.tasks || []).filter(t => taskVisible(t, req.user, db)));
});

app.post('/api/tasks', (req, res) => {
  const db   = load();
  const task = { id: uid(), createdAt: new Date().toISOString(), done: false, ...req.body };
  task.personal  = !!req.body.personal;
  task.createdBy = req.user.id;
  if (!db.tasks) db.tasks = [];
  db.tasks.push(task);
  save(db);
  notifyTaskAssigned(task, req.user);   // лично исполнителю в Telegram
  res.json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const db  = load();
  const idx = (db.tasks || []).findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  if (!taskVisible(db.tasks[idx], req.user, db)) return res.status(404).json({ error: 'not found' });
  const prevAssignee = db.tasks[idx].assigneeId || null;
  db.tasks[idx] = { ...db.tasks[idx], ...req.body, id: req.params.id, createdBy: db.tasks[idx].createdBy };
  save(db);
  // Переназначили на другого человека — уведомляем нового исполнителя
  if (db.tasks[idx].assigneeId && db.tasks[idx].assigneeId !== prevAssignee && !db.tasks[idx].done)
    notifyTaskAssigned(db.tasks[idx], req.user);
  res.json(db.tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = load();
  const t  = (db.tasks || []).find(x => x.id === req.params.id);
  if (t && !taskVisible(t, req.user, db)) return res.status(404).json({ error: 'not found' });
  db.tasks = (db.tasks || []).filter(x => x.id !== req.params.id);
  save(db);
  res.json({ ok: true });
});

/* ─── ВЕЧЕРНЯЯ СВОДКА ЗАДАЧ В TELEGRAM ───
   Каждый день в 19:00 МСК каждому пользователю с tgChatId приходит
   личная сводка: его активные задачи по типам + личные. Root получает
   полную картину по всем задачам. Дата отправки хранится в meta —
   рестарты не приводят к дублям. */
const DIGEST_HOUR_MSK = 18;

function mskParts() {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t)?.value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: parseInt(g('hour'), 10) };
}

async function sendTaskDigests() {
  const token = process.env.TG_LOG_TOKEN;
  if (!token) return 0;
  const db    = load();
  const tasks = db.tasks || [];
  const dateStr = new Date().toLocaleDateString('ru-RU',
    { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' });
  let sent = 0;

  for (const u of (db.users || [])) {
    if (!u.tgChatId) continue;
    const legacy = (db.owners || []).find(o =>
      (o.name || '').toLowerCase() === (u.name || '').toLowerCase());
    // Сотруднику — его задачи; root — все активные (полная картина)
    const pool = u.role === 'root'
      ? tasks.filter(t => !t.done && !t.personal)
      : tasks.filter(t => !t.done && !t.personal && t.assigneeId &&
          (t.assigneeId === u.id || (legacy && t.assigneeId === legacy.id)));
    const personal  = tasks.filter(t => !t.done && t.personal && t.createdBy === u.id);
    const commonCnt = tasks.filter(t => !t.done && !t.personal && !t.assigneeId).length;
    if (!pool.length && !personal.length) continue;   // нечего сводить — не беспокоим

    const chatId = await resolveTgChat(token, u.tgChatId);
    if (!chatId) continue;

    const sec = (title, list) => !list.length ? '' :
      `\n<b>${title} — ${list.length}</b>\n` +
      list.slice(0, 6).map(t => `•  ${escAttr(t.title || t.text || '')}`).join('\n') +
      (list.length > 6 ? `\n<i>…и ещё ${list.length - 6}</i>` : '') + '\n';
    const byKind = k => pool.filter(t => (t.kind || 'duty') === k);

    let text = `<b>MASQUCERADE INC.</b>\n<i>Вечерняя сводка · ${escAttr(dateStr)}</i>\n`;
    text += sec('Срочные', byKind('urgent'));
    text += sec('Обязанности', byKind('duty'));
    text += sec('Цели и планы', byKind('goal'));
    text += sec('Личные', personal);
    if (u.role !== 'root' && commonCnt)
      text += `\nОбщие задачи без исполнителя: ${commonCnt}\n`;
    text += `\nВсего активных задач: <b>${pool.length + personal.length}</b>`;

    tgSend(token, chatId, text);
    sent++;
  }
  return sent;
}

function scheduleTaskDigest() {
  setInterval(async () => {
    try {
      const { date, hour } = mskParts();
      if (hour < DIGEST_HOUR_MSK) return;
      const db = load();
      if (db.meta?.taskDigestDate === date) return;   // сегодня уже отправляли
      if (!db.meta) db.meta = {};
      db.meta.taskDigestDate = date;   // помечаем до отправки — защита от дублей
      save(db);
      const n = await sendTaskDigests();
      console.log(`Task digest sent (${n}) · ${date}`);
    } catch (e) { console.error('digest error:', e.message); }
  }, 5 * 60 * 1000);
}

/* Ручной запуск сводки (root) — проверить оформление, не дожидаясь вечера */
app.post('/api/tasks/digest', async (req, res) => {
  if (!requireRoot(req, res)) return;
  const n = await sendTaskDigests();
  res.json({ ok: true, sent: n });
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
  // Скрытую от пользователя запись нельзя менять (как в GET)
  if (!visibleTo(db.quickaccess[idx], req.user)) return res.status(404).json({ error: 'not found' });
  db.quickaccess[idx] = { ...db.quickaccess[idx], ...req.body, id: req.params.id };
  save(db);
  res.json(db.quickaccess[idx]);
});

app.delete('/api/quickaccess/:id', (req, res) => {
  const db = load();
  const q  = (db.quickaccess || []).find(x => x.id === req.params.id);
  if (q && !visibleTo(q, req.user)) return res.status(404).json({ error: 'not found' });
  db.quickaccess = (db.quickaccess || []).filter(x => x.id !== req.params.id);
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
  // Скрытый от пользователя топик нельзя менять (как в GET)
  if (!visibleTo(db.faq[idx], req.user)) return res.status(404).json({ error: 'not found' });
  db.faq[idx] = { ...db.faq[idx], ...req.body, id: req.params.id };
  save(db);
  res.json(db.faq[idx]);
});

app.delete('/api/faq/:id', (req, res) => {
  const db = load();
  const f  = (db.faq || []).find(x => x.id === req.params.id);
  if (f && !visibleTo(f, req.user)) return res.status(404).json({ error: 'not found' });
  db.faq = (db.faq || []).filter(x => x.id !== req.params.id);
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
  // hideCosts-пользователю закупочные поля не отдаём и здесь — иначе весь
  // «скрытый» закуп утекает одной кнопкой «Скачать JSON»
  res.json({
    version: 2, exportedAt: new Date().toISOString(),
    items:  (db.items || []).map(i => stripCosts(i, req.user)),
    owners: db.owners || [],
  });
});

app.post('/api/import', (req, res) => {
  // Восстановление заменяет всю базу товаров — только root.
  // (Заодно защита от потери закупа: hideCosts-экспорт не содержит buyPrice,
  // и его обратный импорт стёр бы закупочные цены у всех товаров.)
  if (!requireRoot(req, res)) return;
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

/* ─── Гайд по панели: контент живёт в коде и версионируется.
   При повышении PANEL_GUIDE_REV содержимое гайда «Гайд по панели»
   перезаписывается при старте — так гайд в проде всегда актуален. ─── */
const PANEL_GUIDE_REV   = 2;
const PANEL_GUIDE_TITLE = 'Гайд по панели';
const PANEL_GUIDE_BODY = `# Гайд по панели Masqucerade INC.

Панель управляет складом, финансами, командой и публичным сайтом-витриной. Ниже — все разделы по порядку.

## Вход и роли

- Вход по логину и паролю. Сессия живёт 45 дней, потом попросит войти заново.
- **Root-админ** видит и может всё. **Сотрудникам** root настраивает доступ к разделам (Товары, Статистика, Счёт, Proj, Сайт, FAQ) и флаг «без закупа» — такие сотрудники не видят закупочные цены, доставку и историю изменений.
- Сменить свой пароль: меню ☰ → иконка ключа.

## Товары

- **Добавить**: кнопка «+». Фото до 10 штук — с камеры, из галереи или вставкой из буфера (Ctrl+V). Первое фото — обложка; тап по фото делает его главным.
- **Размеры**: каждый размер со своим количеством; владельца можно задать и на отдельный размер — тогда вещь «разделена» между участниками.
- **Статусы**: Заказано → На складе → В наличии → В заказе → Завершено. Быстрая смена — из карточки товара, строка «Статус».
- **Категории и подкатегории** заводятся в меню ☰ → Категории. Тип одежды (верх/низ/обувь/верхняя одежда) подставляется автоматически по названию — можно поправить руками.
- **Поиск и фильтры**: строка поиска, чипы владельцев и Monarc, фильтр по категориям и типам, сортировка (дата, статус, цена, количество, А–Я).
- **Массовые действия**: кнопка выделения → отметить товары → номер посылки, стоимость доставки, владелец или флаги сразу для всех.
- **Архив**: товары со статусом «Завершено» сворачиваются в блок «Архив» под списком.
- **Продать**: в карточке товара кнопка «Продать товар» — списывает остаток (по размеру), пишет продажу в Счёт и прибыль в статистику. Удаление записи продажи возвращает товар на склад.

## Счёт

- **Баланс компании** = депозиты − списания + прибыль с продаж − погашенные долги сотрудникам.
- **Сотрудники**: «Зарплата» — начислить; «Выплатить» — списать с остатка; «Расход» — сотрудник потратил свои деньги на нужды компании, это долг компании. «Погасить долги…» — выбрать какие и списать из бюджета.
- **Планы закупок**: список с суммами и галочками «выполнено».
- **Записи продаж**: выручка, издержки и чистая прибыль по каждой продаже.

## Статистика

- Склад: по статусам, владельцам (деньги владельца = закуп + доставка + его % от прибыли; вещи Monarc — целиком), по категориям.
- Продажи: разрезы по категориям и владельцам, итоговая доля участников.
- Просмотры товаров на сайте.

## Proj

- **Задачи**: три колонки — Срочные, Обязанности, Цели и планы. Назначаются на сотрудника (карточки сверху фильтруют по человеку), можно фото. «Личная» задача видна только вам. Выполненные прячутся под кнопкой.
- **Заметки**: заголовок + текст, цвет — как акцент карточки.
- **Доступы**: реквизиты и пароли. Пишите построчно в формате «Логин: …» / «Пароль: …» — каждая строка станет отдельным рядом со своей кнопкой копирования. Пароли скрыты точками, глаз показывает. Все действия карточки — за кнопкой «⋯».

## Сайт (витрина)

- Товар попадает на сайт тумблером **«На сайте»** в его карточке — там же описание и замеры для покупателя. Когда остаток нулевой или статус «Завершено», товар автоматически уходит в «Архив» витрины.
- **Блоки** (вкладка Витрина): баннер, товары недели, слоган, текст, бегущая строка, промо-полоса. Каждый блок — для раздела Monarc, Type или везде. Порядок стрелками, блоки чередуются с подборками. Глаз скрывает блок не удаляя.
- **Подборки**: наборы товаров с заголовком — карусели на витрине.
- **FAQ сайта**: топики с галочкой «Виден на сайте» показываются покупателям; без неё — внутренние скрипты ответов с кнопками копирования.
- Страницы: главная «/», разделы «/monarc» и «/type», товар «/product/…». Кнопка «Открыть сайт» — вверху вкладки.

## Terminal

- Журнал всех действий в панели: кто и что сделал.
- **!** жёлтым — важное: финансы, изменения витрины, пользователи.
- **‼** красным — опасное: удаления, восстановление из файла, очистка.

## FAQ (этот раздел)

- Внутренние гайды для команды. Пишет и редактирует только root — Markdown или готовый HTML.

## Меню ☰

- **Бэкап в Telegram** — прислать JSON-файл базы в чат прямо сейчас (авто-бэкап уходит раз в сутки).
- **Скачать JSON** — файл базы на устройство. **Восстановить из файла** — только root, заменяет данные целиком.
- **Пользователи** (root): создать сотрудника, задать доступы к разделам, «без закупа», Chat ID и категории Telegram-уведомлений.
- **Участники** — владельцы вещей с цветом и % с продажи. **Категории** — дерево категорий с порядком.
- Тема тёмная/светлая.

## Telegram-уведомления

- Бот шлёт события в общий чат и лично подписанным сотрудникам (по категориям: товары, финансы, система…).
- **Новая задача**: когда вам назначают задачу, бот присылает её лично — с типом, описанием и от кого.
- **Вечерняя сводка**: каждый день в 19:00 МСК приходит личная сводка активных задач — срочные, обязанности, цели и личные. Root получает полную картину по всем задачам.
- Чтобы всё это работало: нажать Start у бота и указать свой Chat ID или @username в настройках пользователя (меню ☰ → Пользователи).`;

function migratePanelGuide() {
  const db = load();
  if (db.meta?.panelGuideRev === PANEL_GUIDE_REV) return;
  if (!db.guides) db.guides = [];
  const now = new Date().toISOString();
  const g = db.guides.find(x => (x.title || '').trim().toLowerCase() === PANEL_GUIDE_TITLE.toLowerCase());
  if (g) {
    g.body = PANEL_GUIDE_BODY; g.format = 'markdown'; g.updatedAt = now;
  } else {
    // order: -1 — гайд по панели всегда первым в списке
    db.guides.unshift({ id: uid(), title: PANEL_GUIDE_TITLE, body: PANEL_GUIDE_BODY,
      format: 'markdown', order: -1, createdAt: now, updatedAt: now });
  }
  if (!db.meta) db.meta = {};
  db.meta.panelGuideRev = PANEL_GUIDE_REV;
  save(db);
  console.log('Panel guide → rev', PANEL_GUIDE_REV);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Masqucerade INC. v2 on :${PORT}`);
  migratePhotos();
  migrateSiteAccess();
  migratePanelGuide();
  scheduleBackup();
  scheduleTaskDigest();
});
