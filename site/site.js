/* ─── Masqucerade INC. — публичная витрина ─── */

/* Юзернейм Telegram без @ — кнопки «Написать» ведут сюда */
const TG_USERNAME = 'Masqucerade';

const path    = location.pathname.replace(/\/+$/, '');
const SECTION = (path === '/monarc' || path === '/brands') ? 'monarc' : 'type';
const TITLES  = {
  monarc: { kicker: 'Оригинальные бренды',           title: 'Monarc'       },
  type:   { kicker: 'Люкс-качество на каждый день',  title: 'Type Clothes' },
};
document.body.classList.add('theme-' + SECTION);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtPrice = (p) => p == null || p === '' ? '' :
  new Intl.NumberFormat('ru-RU').format(p) + ' ₽';

let ITEMS = [], CATS = [], activeCat = null;

async function boot() {
  document.getElementById('sectionKicker').textContent = TITLES[SECTION].kicker;
  document.getElementById('sectionTitle').textContent  = TITLES[SECTION].title;
  document.title = `Masqucerade INC. — ${TITLES[SECTION].title}`;
  document.querySelectorAll('.site-nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === SECTION));
  document.getElementById('footTg').href = `https://t.me/${TG_USERNAME}`;

  try {
    const [items, cats, faq, collections, blocks] = await Promise.all([
      fetch(`/api/public/items?section=${SECTION}`).then(r => r.json()),
      fetch('/api/public/categories').then(r => r.json()),
      fetch('/api/public/faq').then(r => r.json()),
      fetch(`/api/public/collections?section=${SECTION}`).then(r => r.json()),
      fetch(`/api/public/blocks?section=${SECTION}`).then(r => r.json()),
    ]);
    ITEMS = items; CATS = cats;
    renderStream(blocks, collections);
    renderChips();
    renderGrid();
    updateCatalogChrome();
    renderFaq(faq);
    openFromUrl();          // если зашли по прямой ссылке на товар — открыть его
  } catch (e) {
    document.getElementById('goodsGrid').innerHTML =
      '<div class="goods-empty">Не удалось загрузить каталог — попробуйте обновить страницу</div>';
  }
}

function renderChips() {
  const usedCatIds = new Set(ITEMS.map(i => i.categoryId).filter(Boolean));
  const cats = CATS.filter(c => usedCatIds.has(c.id));
  const el = document.getElementById('catChips');
  // Фильтр по категориям показываем, только если есть из чего выбирать
  if (cats.length < 1) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML =
    `<button class="cat-chip${!activeCat ? ' active' : ''}" data-cat="">Все</button>` +
    cats.map(c =>
      `<button class="cat-chip${activeCat === c.id ? ' active' : ''}" data-cat="${esc(c.id)}">${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}</button>`
    ).join('');
}

document.getElementById('catChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.cat-chip');
  if (!chip) return;
  activeCat = chip.dataset.cat || null;
  renderChips();
  renderGrid();
  updateCatalogChrome();
  // При выборе категории — сразу к товарам (промо-блоки скрыты)
  if (activeCat) document.getElementById('gridHeading').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// При активном фильтре показываем только товары категории, пряча промо-поток
let _streamHasContent = false;
function updateCatalogChrome() {
  const filtering = !!activeCat;
  // inline-стиль, т.к. #siteBlocks:not(:empty){display:flex} перебивает [hidden]
  document.getElementById('siteBlocks').style.display = filtering ? 'none' : '';
  const gh = document.getElementById('gridHeading');
  if (filtering) {
    const cat = CATS.find(c => c.id === activeCat);
    gh.hidden = false;
    gh.textContent = cat ? `${cat.emoji ? cat.emoji + ' ' : ''}${cat.name}` : 'Товары';
  } else {
    gh.hidden = !_streamHasContent;
    gh.textContent = 'Все товары';
  }
}

function syncHeaderHeight() {
  const h = document.querySelector('.site-header')?.offsetHeight || 56;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
syncHeaderHeight();
window.addEventListener('resize', syncHeaderHeight);

function sizesLabel(sizes) {
  if (!Array.isArray(sizes) || !sizes.length) return '';
  return sizes.map(s => s.size).filter(Boolean).join(' · ');
}

function cardHTML(i) {
  // Полное фото (≤900px) — чёткое даже на retina; браузер лениво подгружает.
  const cover = (i.photos && i.photos[0]) || (i.thumbs && i.thumbs[0]) || null;
  return `
    <article class="good-card" data-id="${esc(i.id)}">
      <div class="good-photo">
        ${cover ? `<img src="${esc(cover)}" alt="${esc(i.name)}" loading="lazy" draggable="false">`
                : '<span class="no-photo">Masqucerade</span>'}
      </div>
      <div class="good-info">
        <div class="good-name">${esc(i.name)}</div>
        <div class="good-meta">
          <span class="good-price">${fmtPrice(i.price)}</span>
          <span class="good-sizes">${esc(sizesLabel(i.sizes))}</span>
        </div>
      </div>
    </article>`;
}

function renderGrid() {
  const el = document.getElementById('goodsGrid');
  const items = activeCat ? ITEMS.filter(i => i.categoryId === activeCat) : ITEMS;
  if (!items.length) {
    el.innerHTML = '<div class="goods-empty">Пока пусто — загляните позже</div>';
    return;
  }
  el.innerHTML = items.map(cardHTML).join('');
}

/* ─── Контент-блоки (баннер / текст / промо) ─── */
function blockLinkHref(b) {
  switch (b.linkType) {
    case 'monarc': return '/monarc';
    case 'type':   return '/type';
    case 'tg':     return `https://t.me/${TG_USERNAME}`;
    case 'url':    return b.linkValue || '';
    default:       return '';
  }
}
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

function bannerHtml(b) {
  const href = blockLinkHref(b);
  const ext  = b.linkType === 'tg' || b.linkType === 'url';
  const inner = `${b.image ? `<img src="${esc(b.image)}" alt="${esc(b.heading)}" loading="lazy" draggable="false">` : ''}
    ${(b.heading || b.subtext) ? `<div class="block-banner-cap">
      ${b.heading ? `<h2>${nl2br(b.heading)}</h2>` : ''}
      ${b.subtext ? `<p>${esc(b.subtext)}</p>` : ''}
    </div>` : ''}`;
  return href
    ? `<a class="site-block block-banner" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`
    : `<div class="site-block block-banner">${inner}</div>`;
}
function textHtml(b) {
  if (!b.heading && !b.body) return '';
  return `<section class="site-block block-text">
    ${b.heading ? `<h2>${nl2br(b.heading)}</h2>` : ''}
    ${b.body ? `<div class="block-text-body">${nl2br(b.body)}</div>` : ''}
  </section>`;
}
function statementHtml(b) {
  if (!b.text) return '';
  return `<section class="site-block block-statement">
    ${b.kicker ? `<p class="statement-kicker">${esc(b.kicker)}</p>` : ''}
    <p class="statement-text">${nl2br(b.text)}</p>
  </section>`;
}
function marqueeHtml(b) {
  if (!b.text) return '';
  const seg = `<span class="marquee-seg">${esc(b.text)}<i class="marquee-star">✦</i></span>`;
  // два одинаковых ряда подряд → бесшовная петля
  return `<div class="site-block block-marquee" aria-label="${esc(b.text)}">
    <div class="marquee-inner">${seg.repeat(8)}</div>
    <div class="marquee-inner" aria-hidden="true">${seg.repeat(8)}</div>
  </div>`;
}
function duoTile(img, caption, linkType, linkValue) {
  const href = blockLinkHref({ linkType, linkValue });
  const ext  = linkType === 'tg' || linkType === 'url';
  const inner = `${img ? `<img src="${esc(img)}" alt="${esc(caption)}" loading="lazy" draggable="false">` : ''}
    ${caption ? `<div class="block-banner-cap"><h2>${nl2br(caption)}</h2></div>` : ''}`;
  return href
    ? `<a class="duo-tile" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`
    : `<div class="duo-tile">${inner}</div>`;
}
function duoHtml(b) {
  if (!b.imageA && !b.imageB) return '';
  return `<div class="site-block block-duo">
    ${duoTile(b.imageA, b.captionA, b.linkTypeA, b.linkValueA)}
    ${duoTile(b.imageB, b.captionB, b.linkTypeB, b.linkValueB)}
  </div>`;
}
function blockToHtml(b) {
  switch (b.type) {
    case 'banner':    return bannerHtml(b);
    case 'text':      return textHtml(b);
    case 'statement': return statementHtml(b);
    case 'marquee':   return marqueeHtml(b);
    case 'duo':       return duoHtml(b);
    default:          return '';
  }
}

function collectionHtml(c, items) {
  return `<section class="collection-block">
    <div class="collection-head">
      <p class="collection-kicker">Подборка</p>
      <span class="carousel-hint" aria-hidden="true">листайте →</span>
    </div>
    <h2>${esc(c.title)}</h2>
    ${c.description ? `<p class="collection-desc">${esc(c.description)}</p>` : ''}
    <div class="collection-carousel">
      <div class="goods-grid collection-grid">${items.map(cardHTML).join('')}</div>
    </div>
  </section>`;
}

// Показать индикатор карусели только когда контент реально не влезает
function markCarousels() {
  document.querySelectorAll('.collection-block').forEach(block => {
    const grid = block.querySelector('.collection-grid');
    block.classList.toggle('scrollable', !!grid && grid.scrollWidth - grid.clientWidth > 8);
  });
}
let _carouselResizeT;
window.addEventListener('resize', () => { clearTimeout(_carouselResizeT); _carouselResizeT = setTimeout(markCarousels, 150); });

/* Единый поток витрины: баннеры, текст и подборки в общем порядке (order).
   Промо-полосы — отдельно, тонкой строкой сверху. */
function renderStream(blocks, collections) {
  blocks = blocks || [];

  const promos = blocks.filter(b => b.type === 'promo' && b.text).sort((a, b) => (a.order || 0) - (b.order || 0));
  const bar = document.getElementById('promoBar');
  if (promos.length) {
    bar.innerHTML = promos.map(p => `<span>${esc(p.text)}</span>`).join('<i class="promo-sep">•</i>');
    bar.hidden = false;
  } else {
    bar.hidden = true;
  }

  const byId = new Map(ITEMS.map(i => [i.id, i]));
  const stream = [];
  for (const b of blocks) {
    const html = blockToHtml(b);
    if (html) stream.push({ order: b.order || 0, kind: 'block', html });
  }
  for (const c of (collections || [])) {
    const items = (c.itemIds || []).map(id => byId.get(id)).filter(Boolean);
    if (items.length) stream.push({ order: c.order || 0, kind: 'col', html: collectionHtml(c, items) });
  }
  stream.sort((a, b) => (a.order - b.order) || (a.kind === 'col' ? 1 : -1));

  document.getElementById('siteBlocks').innerHTML = stream.map(x => x.html).join('');
  document.getElementById('collectionsWrap').innerHTML = '';
  _streamHasContent = stream.length > 0;
  requestAnimationFrame(markCarousels);
}

/* Клик по карточке товара в потоке (подборки) — та же модалка */
document.getElementById('siteBlocks').addEventListener('click', (e) => {
  const card = e.target.closest('.good-card');
  if (!card) return;
  const item = ITEMS.find(i => i.id === card.dataset.id);
  if (item) openModal(item);
});

/* ─── Модалка товара ─── */
const modal = document.getElementById('itemModal');

document.getElementById('goodsGrid').addEventListener('click', (e) => {
  const card = e.target.closest('.good-card');
  if (!card) return;
  const item = ITEMS.find(i => i.id === card.dataset.id);
  if (item) openModal(item);
});

function openModal(i, push = true) {
  const cat    = CATS.find(c => c.id === i.categoryId);
  const photos = i.photos || [];
  document.getElementById('mPhoto').innerHTML = photos.length
    ? `<img id="mPhotoMain" src="${esc(photos[0])}" alt="${esc(i.name)}" draggable="false">` +
      (photos.length > 1
        ? `<div class="m-thumbs">${photos.map((p, idx) =>
            `<button class="m-thumb${idx === 0 ? ' active' : ''}" data-src="${esc(p)}"><img src="${esc(p)}" alt="" draggable="false"></button>`
          ).join('')}</div>`
        : '')
    : '<span class="no-photo">Masqucerade</span>';
  document.getElementById('mCat').textContent   = cat ? cat.name : TITLES[SECTION].title;
  document.getElementById('mName').textContent  = i.name;
  document.getElementById('mPrice').textContent = fmtPrice(i.price);
  document.getElementById('mSizes').innerHTML   = (i.sizes || [])
    .filter(s => s.size).map(s => `<span class="m-size">${esc(s.size)}</span>`).join('');
  document.getElementById('mDesc').textContent  = i.description || '';

  /* Замеры и посадка — раскрывающийся блок */
  const fitEl = document.getElementById('mFit');
  if (i.measurements) {
    fitEl.hidden = false;
    fitEl.classList.remove('open');
    document.getElementById('mFitBody').textContent = i.measurements;
  } else {
    fitEl.hidden = true;
  }
  const msg = encodeURIComponent(`Здравствуйте! Интересует «${i.name}» с вашего сайта.`);
  document.getElementById('mTgBtn').href = `https://t.me/${TG_USERNAME}?text=${msg}`;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  // Прямая ссылка на товар в адресной строке — можно копировать и слать клиенту.
  if (push) history.pushState({ item: i.id }, '', `${location.pathname}?item=${encodeURIComponent(i.id)}`);
}

function closeModal(push = true) {
  modal.hidden = true;
  document.body.style.overflow = '';
  if (push && new URLSearchParams(location.search).get('item'))
    history.pushState({}, '', location.pathname);
}

/* Открыть товар по прямой ссылке /type?item=<id> при заходе и по кнопкам назад/вперёд */
function openFromUrl(push = false) {
  const id = new URLSearchParams(location.search).get('item');
  const it = id && ITEMS.find(i => i.id === id);
  if (it) openModal(it, push); else closeModal(false);
}
window.addEventListener('popstate', () => openFromUrl(false));
modal.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) { closeModal(); return; }
  /* Переключение фото по миниатюрам */
  const th = e.target.closest('.m-thumb');
  if (th) {
    document.getElementById('mPhotoMain').src = th.dataset.src;
    document.querySelectorAll('.m-thumb').forEach(t => t.classList.toggle('active', t === th));
    return;
  }
  /* Аккордеон «Замеры и посадка» */
  if (e.target.closest('#mFitHead')) {
    document.getElementById('mFit').classList.toggle('open');
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

/* ─── FAQ ─── */
function faqBody(f) {
  if (f.lines && f.lines.length) {
    return f.lines.map(l =>
      `${l.label ? `<div class="faq-a-label">${esc(l.label)}</div>` : ''}<div>${esc(l.text)}</div>`
    ).join('');
  }
  return esc(f.body || '');
}

function renderFaq(faq) {
  if (!faq.length) return;
  document.getElementById('faqSection').hidden = false;
  document.getElementById('faqAcc').innerHTML = faq.map(f => `
    <div class="faq-item">
      <button class="faq-q">
        ${esc(f.title)}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <div class="faq-a"><div class="faq-a-inner">${faqBody(f)}</div></div>
    </div>`).join('');

  document.getElementById('faqAcc').addEventListener('click', (e) => {
    const q = e.target.closest('.faq-q');
    if (!q) return;
    const item = q.parentElement;
    const ans  = item.querySelector('.faq-a');
    const open = item.classList.toggle('open');
    ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '0';
  });
}

boot();
