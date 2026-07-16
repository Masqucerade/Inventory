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

let ITEMS = [], CATS = [], activeCat = null, activeGarment = null;

// Фиксированные типы одежды
const GARMENTS = [
  { id: 'top',       name: 'Верх' },
  { id: 'bottom',    name: 'Низ' },
  { id: 'shoes',     name: 'Обувь' },
  { id: 'outerwear', name: 'Верхняя одежда' },
];

async function boot() {
  document.getElementById('sectionKicker').textContent = TITLES[SECTION].kicker;
  document.getElementById('sectionTitle').textContent  = TITLES[SECTION].title;
  // На разделе Monarc логотип в шапке — «Monarc»
  if (SECTION === 'monarc') {
    const ln = document.getElementById('logoName');
    if (ln) ln.textContent = 'Monarc';
  }
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
    renderHeaderNav();
    renderFilters();
    renderGrid();
    updateCatalogChrome();
    renderFaq(faq);
    openFromUrl();          // если зашли по прямой ссылке на товар — открыть его
  } catch (e) {
    document.getElementById('goodsGrid').innerHTML =
      '<div class="goods-empty">Не удалось загрузить каталог — попробуйте обновить страницу</div>';
  }
}

// карта «родитель → дети» и поддерево категории (id + все потомки)
function catKidsMap() {
  const m = {};
  CATS.forEach(c => { if (c.parentId) (m[c.parentId] = m[c.parentId] || []).push(c); });
  return m;
}
function catSubtree(id) {
  const kids = catKidsMap(), set = new Set(), st = [id];
  while (st.length) { const x = st.pop(); if (set.has(x)) continue; set.add(x); (kids[x] || []).forEach(k => st.push(k.id)); }
  return set;
}

// Фиксированные разделы витрины — как у Gurbich (Под заказ → Другое)
const HDR_SECTIONS = [
  { id: 'm', label: 'Мужское' },
  { id: 'w', label: 'Женское' },
  { id: 'a', label: 'Аксессуары' },
];
// Категория верхнего уровня с тем же названием, что и раздел (если заведена в панели)
function sectionCat(sec) {
  const n = sec.label.trim().toLowerCase();
  return CATS.find(c => !c.parentId && (c.name || '').trim().toLowerCase() === n) || null;
}

// Навигация в шапке — точно как у Gurbich: Мужское · Женское · Аксессуары · Другое
function renderHeaderNav() {
  const nav = document.getElementById('siteNav');
  if (!nav) return;
  const used = new Set(ITEMS.map(i => i.categoryId).filter(Boolean));
  const inUse = id => [...catSubtree(id)].some(x => used.has(x));
  const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
  const kids = catKidsMap();
  const act = (activeCat && !activeCat.startsWith('__')) ? CATS.find(c => c.id === activeCat) : null;
  const topActive = act ? (act.parentId || act.id) : null;

  let html = HDR_SECTIONS.map(sec => {
    const cat = sectionCat(sec);
    const dataCat = cat ? cat.id : `__sec-${sec.id}__`;
    const secActive = cat ? topActive === cat.id : activeCat === dataCat;

    // Колонка категорий: подкатегории раздела; если одноимённая категория
    // не заведена — показываем все верхние категории с товарами
    let catsCol = cat ? (kids[cat.id] || []).filter(s => inUse(s.id)).sort(byOrder) : [];
    if (!cat) catsCol = CATS.filter(c => !c.parentId && inUse(c.id)).sort(byOrder);

    // Типы одежды: встречающиеся в товарах раздела (или во всех товарах)
    const scope = cat ? (ids => ITEMS.filter(i => ids.has(i.categoryId)))(catSubtree(cat.id)) : ITEMS;
    const gUsed = new Set(scope.map(i => i.garment).filter(Boolean));
    const gList = GARMENTS.filter(g => gUsed.has(g.id));

    // Совсем нечего показать — обычная ссылка без панели
    if (!catsCol.length && !gList.length)
      return `<a class="hnav${secActive ? ' active' : ''}" data-cat="${esc(dataCat)}" href="#">${esc(sec.label)}</a>`;

    // У типов одежды раздел ставится вместе с типом только если раздел заведён
    const gCat = cat ? ` data-cat="${esc(cat.id)}"` : '';
    return `<div class="hnav-group${secActive ? ' active' : ''}">
      <a class="hnav${secActive ? ' active' : ''}" href="#">${esc(sec.label)}<span class="hnav-caret" aria-hidden="true">▾</span></a>
      <div class="hnav-drop">
        <div class="mega-inner">
          <div class="mega-head">
            <p class="mega-kicker">Раздел</p>
            <div class="mega-title">${esc(sec.label)}</div>
            <a class="mega-all" ${cat ? `data-cat="${esc(cat.id)}"` : 'data-all'} data-garment="" href="#">Смотреть все →</a>
          </div>
          ${catsCol.length ? `<div class="mega-col">
            <p class="mega-col-title">Категории</p>
            <div class="mega-links">
              ${catsCol.map(s => `<a class="hnav-sub${activeCat === s.id ? ' active' : ''}" data-cat="${esc(s.id)}" href="#">${esc(s.name)}</a>`).join('')}
            </div>
          </div>` : ''}
          ${gList.length ? `<div class="mega-col">
            <p class="mega-col-title">Тип одежды</p>
            <div class="mega-links">
              ${gList.map(g => `<a class="hnav-sub${activeGarment === g.id && (!cat || activeCat === cat.id) ? ' active' : ''}"${gCat} data-garment="${esc(g.id)}" href="#">${esc(g.name)}</a>`).join('')}
            </div>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  // «Другое» — вместо «Под заказ» у Gurbich (остальные товары)
  html += `<a class="hnav${activeCat === '__other__' ? ' active' : ''}" data-cat="__other__" href="#">Другое</a>`;
  nav.innerHTML = html;
  bindMegaHover(nav);
}

/* Наведение открывает мега-меню (десктоп); на тач-устройствах — по тапу.
   После выбора пункта меню не выскакивает снова, пока курсор не покинет шапку. */
const HOVER_CAPABLE = window.matchMedia('(hover: hover)').matches;
function bindMegaHover(nav) {
  if (!HOVER_CAPABLE) return;
  nav.querySelectorAll('.hnav-group').forEach(g => {
    g.addEventListener('mouseenter', () => {
      if (nav.classList.contains('suppress')) return;
      clearTimeout(g._closeT);
      nav.querySelectorAll('.hnav-group.open').forEach(o => { if (o !== g) o.classList.remove('open'); });
      g.classList.add('open');
    });
    g.addEventListener('mouseleave', () => {
      g._closeT = setTimeout(() => g.classList.remove('open'), 140);
    });
  });
  if (!nav._suppressBound) {
    nav._suppressBound = true;
    nav.addEventListener('mouseleave', () => nav.classList.remove('suppress'));
  }
}

function applyNavFilter(link) {
  // Раздел не сбрасывает выбранный тип одежды — фильтры комбинируются.
  // У ссылки могут быть оба атрибута (мега-меню: раздел + тип одежды разом).
  if (link.dataset.all !== undefined) {
    activeCat = null;
    if (link.dataset.garment !== undefined) activeGarment = link.dataset.garment || null;
  }
  else {
    if (link.dataset.cat     !== undefined) activeCat     = link.dataset.cat || null;
    if (link.dataset.garment !== undefined) activeGarment = link.dataset.garment || null;
  }
  renderHeaderNav();
  renderFilters();
  renderGrid();
  updateCatalogChrome();
  if (activeCat || activeGarment) document.getElementById('gridHeading').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const _siteNav = document.getElementById('siteNav');
if (_siteNav) _siteNav.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  e.preventDefault();
  const group = a.closest('.hnav-group');
  // Клик по родителю с подменю — только открыть/закрыть панель (фильтр — по пунктам меню)
  if (group && a.classList.contains('hnav')) {
    if (HOVER_CAPABLE) return;               // на десктопе панель управляется наведением
    const open = group.classList.contains('open');
    _siteNav.querySelectorAll('.hnav-group.open').forEach(g => g.classList.remove('open'));
    if (!open) group.classList.add('open');
    return;
  }
  _siteNav.querySelectorAll('.hnav-group.open').forEach(g => g.classList.remove('open'));
  // Пока курсор в шапке — меню не выскакивает снова после выбора
  if (HOVER_CAPABLE && group) _siteNav.classList.add('suppress');
  applyNavFilter(a);
});
// Клик вне меню — закрыть выпадающие
document.addEventListener('click', (e) => {
  if (!e.target.closest('.hnav-group'))
    document.querySelectorAll('.hnav-group.open').forEach(g => g.classList.remove('open'));
});

// Старые фильтры (тип одежды) — под кнопкой «Фильтры», уточняют внутри раздела
let _filtersOpen = false;
function renderFilters() {
  const el  = document.getElementById('catChips');
  const btn = document.getElementById('filtersBtn');
  const usedG = new Set(ITEMS.map(i => i.garment).filter(Boolean));
  const gShown = GARMENTS.filter(g => usedG.has(g.id));
  if (btn) { btn.hidden = !gShown.length; btn.classList.toggle('on', !!activeGarment); }
  if (!el) return;
  if (!gShown.length) { el.hidden = true; el.innerHTML = ''; _filtersOpen = false; return; }
  el.innerHTML = `<div class="cat-row garment-row">` +
    `<button class="cat-chip${!activeGarment ? ' active' : ''}" data-garment="">Все</button>` +
    gShown.map(g => `<button class="cat-chip${activeGarment === g.id ? ' active' : ''}" data-garment="${esc(g.id)}">${esc(g.name)}</button>`).join('') +
    `</div>`;
  el.hidden = !_filtersOpen;
}

const _filtersBtn = document.getElementById('filtersBtn');
if (_filtersBtn) _filtersBtn.addEventListener('click', () => {
  _filtersOpen = !_filtersOpen;
  const el = document.getElementById('catChips');
  if (el) el.hidden = !_filtersOpen;
  _filtersBtn.classList.toggle('open', _filtersOpen);
});

const _catChips = document.getElementById('catChips');
if (_catChips) _catChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.cat-chip');
  if (!chip || chip.dataset.garment === undefined) return;
  activeGarment = chip.dataset.garment || null;   // уточняет внутри активного раздела
  renderFilters();
  renderGrid();
  updateCatalogChrome();
  if (activeCat || activeGarment) document.getElementById('gridHeading').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// При активном фильтре показываем только товары категории, пряча промо-поток
let _streamHasContent = false;
function updateCatalogChrome() {
  const filtering = !!activeCat || !!activeGarment;
  // inline-стиль, т.к. #siteBlocks:not(:empty){display:flex} перебивает [hidden]
  document.getElementById('siteBlocks').style.display = filtering ? 'none' : '';
  const gh = document.getElementById('gridHeading');
  if (filtering) {
    const parts = [];
    if (activeGarment) parts.push((GARMENTS.find(g => g.id === activeGarment) || {}).name);
    if (activeCat === '__other__') parts.push('Другое');
    else if (activeCat && activeCat.startsWith('__sec-')) {
      const s = HDR_SECTIONS.find(x => `__sec-${x.id}__` === activeCat);
      parts.push(s ? s.label : 'Товары');
    }
    else if (activeCat) parts.push((CATS.find(c => c.id === activeCat) || {}).name);
    gh.hidden = false;
    gh.textContent = parts.filter(Boolean).join(' · ') || 'Товары';
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
        <span class="good-tag ${i.inStock ? 'in-stock' : 'preorder'}">${i.inStock ? 'В наличии' : 'Под заказ'}</span>
      </div>
    </article>`;
}

function renderGrid() {
  const el = document.getElementById('goodsGrid');
  let items;
  if (activeCat === '__other__') {
    // «Другое» — товары вне разделов Мужское/Женское/Аксессуары
    const inSec = new Set();
    HDR_SECTIONS.map(sectionCat).filter(Boolean).forEach(c => catSubtree(c.id).forEach(id => inSec.add(id)));
    items = ITEMS.filter(i => !inSec.has(i.categoryId));
  }
  else if (activeCat && activeCat.startsWith('__')) items = [];                        // раздел ещё не заведён
  else if (activeCat) { const ids = catSubtree(activeCat); items = ITEMS.filter(i => ids.has(i.categoryId)); }
  else items = ITEMS;
  if (activeGarment) items = items.filter(i => i.garment === activeGarment);
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

// Универсальный баннер: высота, кадрирование и фокус настраиваются в панели
function bannerHtml(b) {
  if (!b.image) return '';
  const href  = blockLinkHref(b);
  const ext   = b.linkType === 'tg' || b.linkType === 'url';
  const style = `object-fit:${b.fit === 'contain' ? 'contain' : 'cover'};object-position:${esc(b.pos || 'center center')}`;
  const cap   = (b.heading || b.sub)
    ? `<div class="block-banner-cap">${b.heading ? `<h2>${nl2br(b.heading)}</h2>` : ''}${b.sub ? `<p>${nl2br(b.sub)}</p>` : ''}</div>`
    : '';
  const inner = `<img src="${esc(b.image)}" alt="${esc(b.heading || '')}" loading="lazy" draggable="false" style="${style}">${cap}`;
  const cls   = `site-block block-banner banner-${b.height || 'm'}${b.fit === 'contain' ? ' banner-contain' : ''}`;
  return href
    ? `<a class="${cls}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`
    : `<section class="${cls}">${inner}</section>`;
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
      <p class="collection-kicker">Подборка</p>    </div>
    <h2>${esc(c.title)}</h2>
    ${c.description ? `<p class="collection-desc">${esc(c.description)}</p>` : ''}
    <div class="collection-carousel">
      <div class="goods-grid collection-grid">${items.map(cardHTML).join('')}</div>
      <button class="carousel-next" aria-label="Листать дальше" tabindex="-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg></button>
    </div>
  </section>`;
}

// Блок «Товары недели» — витрина выбранных товаров с золотым акцентом
function weeklyHtml(b, items) {
  const h = b.heading || 'Товары недели';
  const custom = h && h !== 'Товары недели';
  return `<section class="collection-block week-block">
    <div class="collection-head">
      <p class="collection-kicker week-kicker">★ Товары недели</p>    </div>
    ${custom ? `<h2>${esc(h)}</h2>` : ''}
    <div class="collection-carousel">
      <div class="goods-grid collection-grid">${items.map(cardHTML).join('')}</div>
      <button class="carousel-next" aria-label="Листать дальше" tabindex="-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg></button>
    </div>
  </section>`;
}

// Показать индикатор карусели только когда контент реально не влезает
function markCarousels() {
  document.querySelectorAll('.collection-block').forEach(block => {
    const grid = block.querySelector('.collection-grid');
    if (!grid) return;
    const update = () => {
      block.classList.toggle('scrollable', grid.scrollWidth - grid.clientWidth > 8);
      block.classList.toggle('at-end', grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 8);
    };
    update();
    if (!grid._carBound) { grid._carBound = true; grid.addEventListener('scroll', update, { passive: true }); }
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
    if (b.type === 'weekly') {
      const items = (b.itemIds || []).map(id => byId.get(id)).filter(Boolean);
      if (items.length) stream.push({ order: b.order || 0, kind: 'block', html: weeklyHtml(b, items) });
      continue;
    }
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
  requestAnimationFrame(() => requestAnimationFrame(markCarousels));
  setTimeout(markCarousels, 400);   // подстраховка: дождаться загрузки фото/шрифтов
}

/* Клик по карточке товара в потоке (подборки) — та же модалка */
document.getElementById('siteBlocks').addEventListener('click', (e) => {
  // Стрелка-шеврон — прокрутить карусель дальше
  const next = e.target.closest('.carousel-next');
  if (next) {
    const grid = next.closest('.collection-carousel')?.querySelector('.collection-grid');
    if (grid) { grid.scrollLeft += Math.round(grid.clientWidth * 0.85); setTimeout(markCarousels, 60); }   // scroll-snap мягко доводит до карточки
    return;
  }
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
