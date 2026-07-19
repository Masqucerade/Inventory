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

let ITEMS = [], ARCHIVE = [], CATS = [], activeCat = null, activeGarment = null;
let activeSort = 'new', priceMin = null, priceMax = null;

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
  // На разделе Monarc логотип в шапке — «Monarc» + фирменный знак Σi
  if (SECTION === 'monarc') {
    const ln = document.getElementById('logoName');
    if (ln) ln.textContent = 'Monarc';
    const mln = document.getElementById('mobLogoName');
    if (mln) mln.textContent = 'Monarc';
    document.querySelectorAll('.site-logo .brand-mark').forEach(el => {
      el.classList.add('brand-mark-monarc');
      el.innerHTML = '<img src="/site/monarc-mark.svg?v=1" alt="Monarc">';
    });
  }
  // Название вкладки: Monarc — своё, Type — общий бренд
  document.title = SECTION === 'monarc' ? 'Monarc' : 'Masqucerade';
  document.querySelectorAll('.site-nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === SECTION));
  document.getElementById('footTg').href = `https://t.me/${TG_USERNAME}`;
  const mobTg = document.getElementById('mobTg');
  if (mobTg) mobTg.href = `https://t.me/${TG_USERNAME}`;

  try {
    const [items, cats, faq, collections, blocks] = await Promise.all([
      fetch(`/api/public/items?section=${SECTION}`).then(r => r.json()),
      fetch('/api/public/categories').then(r => r.json()),
      fetch('/api/public/faq').then(r => r.json()),
      fetch(`/api/public/collections?section=${SECTION}`).then(r => r.json()),
      fetch(`/api/public/blocks?section=${SECTION}`).then(r => r.json()),
    ]);
    // Проданное уходит в «Архив» — в основном каталоге только живые товары
    ITEMS   = items.filter(i => !i.sold);
    ARCHIVE = items.filter(i => i.sold);
    CATS = cats;
    renderStream(blocks, collections);
    renderHeaderNav();
    renderFilters();
    renderGrid();
    updateCatalogChrome();
    renderFaq(faq);
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
  // «Архив» — проданные вещи (как у Gurbich)
  if (ARCHIVE.length)
    html += `<a class="hnav${activeCat === '__archive__' ? ' active' : ''}" data-cat="__archive__" href="#">Архив</a>`;
  nav.innerHTML = html;
  bindMegaHover(nav);
  renderMobileMenu();   // мобильное меню строится из тех же данных
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

/* ─── Scroll-reveal: секции и карточки всплывают при входе в вьюпорт ───
   Каскад для карточек грида; при prefers-reduced-motion выключен.
   Fail-safe: если IntersectionObserver недоступен или молчит (сломанные
   среды) — контент раскрывается сразу, просто без анимации. */
let _ioFired = false, _ioDead = false, _revealFallbackT;
const _revealIO = (typeof IntersectionObserver !== 'function' ||
                   matchMedia('(prefers-reduced-motion: reduce)').matches) ? null :
  new IntersectionObserver((entries) => {
    _ioFired = true;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('rv-in');
      _revealIO.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

function revealScan() {
  if (!_revealIO || _ioDead) return;
  const els = [
    ...document.querySelectorAll('#siteBlocks > *'),
    ...document.querySelectorAll('#collectionsWrap > *'),
    document.getElementById('gridHeading'),
    ...document.querySelectorAll('#goodsGrid .good-card'),
    document.getElementById('faqSection'),
  ].filter(Boolean);
  let cardIdx = 0;
  els.forEach(el => {
    if (el.classList.contains('rv')) return;
    el.classList.add('rv');
    // Карточки грида — каскадом по строке
    if (el.classList.contains('good-card'))
      el.style.transitionDelay = Math.min((cardIdx++ % 6) * 55, 280) + 'ms';
    _revealIO.observe(el);
  });
  // IO не сработал ни разу — раскрываем всё и больше не прячем
  clearTimeout(_revealFallbackT);
  _revealFallbackT = setTimeout(() => {
    if (_ioFired) return;
    _ioDead = true;
    _revealIO.disconnect();
    document.querySelectorAll('.rv').forEach(el => el.classList.add('rv-in'));
  }, 1200);
}

/* ─── Поиск-оверлей: полноэкранный, живой список (как у Gurbich) ─── */
function renderSearchResults(q) {
  const list  = document.getElementById('soResults');
  const label = document.getElementById('soLabel');
  if (!list) return;
  q = (q || '').trim().toLowerCase();
  const catName = id => CATS.find(c => c.id === id)?.name || '';
  const match = i => !q ||
    (i.name || '').toLowerCase().includes(q) ||
    catName(i.categoryId).toLowerCase().includes(q);
  // Активные — первыми, проданные из архива — в конце с пометкой
  const res = [...ITEMS.filter(match), ...ARCHIVE.filter(match)].slice(0, 40);
  if (label) label.textContent = q ? (res.length ? `Найдено: ${res.length}` : '') : 'Все товары';
  list.innerHTML = res.length ? res.map(i => {
    const cover = (i.thumbs && i.thumbs[0]) || (i.photos && i.photos[0]) || null;
    return `<a class="sr-row" href="/product/${encodeURIComponent(i.id)}">
      <span class="sr-thumb">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy" draggable="false">` : ''}</span>
      <span class="sr-name">${esc(i.name)}</span>
      <span class="sr-meta">${i.sold ? '<em class="sr-sold">Продано</em>' : esc(fmtPrice(i.price))}</span>
    </a>`;
  }).join('') : `<div class="sr-empty">Ничего не найдено</div>`;
}

function toggleSearch(open) {
  const el = document.getElementById('searchOverlay');
  if (!el) return;
  el.classList.toggle('open', open);
  el.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('mob-lock', open);
  if (open) {
    toggleMobMenu(false);   // поиск поверх — меню закрываем
    renderSearchResults(document.getElementById('soInput')?.value);
    setTimeout(() => document.getElementById('soInput')?.focus(), 250);
  }
}

document.getElementById('searchBtn')?.addEventListener('click', () => toggleSearch(true));
document.getElementById('mobSearchBtn')?.addEventListener('click', () => toggleSearch(true));
document.getElementById('soClose')?.addEventListener('click', () => toggleSearch(false));
document.getElementById('soInput')?.addEventListener('input', (e) => renderSearchResults(e.target.value));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleSearch(false);
});

/* ─── Мобильное бургер-меню: полноэкранный аккордеон (как у Gurbich) ─── */
let _mobOpenSec = null;   // раскрытый раздел аккордеона — переживает перерисовку

function renderMobileMenu() {
  const body = document.getElementById('mobMenuBody');
  if (!body) return;
  const kids = catKidsMap();
  const used = new Set(ITEMS.map(i => i.categoryId).filter(Boolean));
  const inUse = id => [...catSubtree(id)].some(x => used.has(x));
  const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
  const caret = `<svg class="mob-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polyline points="6 9 12 15 18 9"/></svg>`;

  let html = HDR_SECTIONS.map(sec => {
    const cat = sectionCat(sec);
    const dataCat = cat ? cat.id : `__sec-${sec.id}__`;
    let catsCol = cat ? (kids[cat.id] || []).filter(s => inUse(s.id)).sort(byOrder) : [];
    if (!cat) catsCol = CATS.filter(c => !c.parentId && inUse(c.id)).sort(byOrder);
    const scope = cat ? (ids => ITEMS.filter(i => ids.has(i.categoryId)))(catSubtree(cat.id)) : ITEMS;
    const gUsed = new Set(scope.map(i => i.garment).filter(Boolean));
    const gList = GARMENTS.filter(g => gUsed.has(g.id));
    const gCat  = cat ? ` data-cat="${esc(cat.id)}"` : '';

    // Нечего раскрывать — обычный пункт-ссылка
    if (!catsCol.length && !gList.length)
      return `<a class="mob-link${activeCat === dataCat ? ' active' : ''}" data-cat="${esc(dataCat)}" href="#">${esc(sec.label)}</a>`;

    return `<div class="mob-acc${_mobOpenSec === sec.id ? ' open' : ''}" data-sec="${esc(sec.id)}">
      <button class="mob-acc-head" type="button">${esc(sec.label)}${caret}</button>
      <div class="mob-acc-body">
        <a class="mob-sub mob-sub-all" ${cat ? `data-cat="${esc(cat.id)}"` : 'data-all'} data-garment="" href="#">Смотреть все →</a>
        ${catsCol.map(s => `<a class="mob-sub${activeCat === s.id ? ' active' : ''}" data-cat="${esc(s.id)}" href="#">${esc(s.name)}</a>`).join('')}
        ${gList.map(g => `<a class="mob-sub${activeGarment === g.id && (!cat || activeCat === cat.id) ? ' active' : ''}"${gCat} data-garment="${esc(g.id)}" href="#">${esc(g.name)}</a>`).join('')}
      </div>
    </div>`;
  }).join('');

  if (ARCHIVE.length)
    html += `<a class="mob-link${activeCat === '__archive__' ? ' active' : ''}" data-cat="__archive__" href="#">Архив</a>`;
  body.innerHTML = html;
}

function toggleMobMenu(open) {
  const el = document.getElementById('mobMenu');
  if (!el) return;
  el.classList.toggle('open', open);
  el.setAttribute('aria-hidden', String(!open));
  document.getElementById('burgerBtn')?.classList.toggle('active', open);
  document.body.classList.toggle('mob-lock', open);   // страница под меню не скроллится
}

document.getElementById('burgerBtn')?.addEventListener('click', () => toggleMobMenu(true));
document.getElementById('mobCloseBtn')?.addEventListener('click', () => toggleMobMenu(false));
document.getElementById('mobMenu')?.addEventListener('click', (e) => {
  const head = e.target.closest('.mob-acc-head');
  if (head) {
    const acc  = head.parentElement;
    const open = acc.classList.toggle('open');
    _mobOpenSec = open ? acc.dataset.sec : null;
    // Одновременно раскрыт только один раздел
    document.querySelectorAll('#mobMenu .mob-acc').forEach(a => { if (a !== acc) a.classList.remove('open'); });
    return;
  }
  const a = e.target.closest('a[data-cat], a[data-all], a[data-garment]');
  if (a) { e.preventDefault(); toggleMobMenu(false); applyNavFilter(a); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleMobMenu(false);
});
// Поворот/расширение экрана до десктопа — меню закрывается само
window.addEventListener('resize', () => {
  if (window.innerWidth > 640) toggleMobMenu(false);
});

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

// Фильтры под кнопкой «Фильтры»: тип одежды, сортировка и диапазон цены
let _filtersOpen = false;
const filtersActive = () =>
  !!activeGarment || activeSort !== 'new' || priceMin != null || priceMax != null;

function renderFilters() {
  const el  = document.getElementById('catChips');
  const btn = document.getElementById('filtersBtn');
  const usedG = new Set(ITEMS.map(i => i.garment).filter(Boolean));
  const gShown = GARMENTS.filter(g => usedG.has(g.id));
  if (btn) { btn.hidden = !ITEMS.length; btn.classList.toggle('on', filtersActive()); }
  if (!el) return;
  if (!ITEMS.length) { el.hidden = true; el.innerHTML = ''; _filtersOpen = false; return; }

  const garmentRow = gShown.length
    ? `<div class="cat-row garment-row">` +
      `<button class="cat-chip${!activeGarment ? ' active' : ''}" data-garment="">Все</button>` +
      gShown.map(g => `<button class="cat-chip${activeGarment === g.id ? ' active' : ''}" data-garment="${esc(g.id)}">${esc(g.name)}</button>`).join('') +
      `</div>`
    : '';
  const SORTS = [['new', 'Сначала новые'], ['asc', 'Дешевле'], ['desc', 'Дороже']];
  const sortRow = `<div class="cat-row sort-row">` +
    SORTS.map(([v, t]) => `<button class="cat-chip${activeSort === v ? ' active' : ''}" data-sort="${v}">${t}</button>`).join('') +
    `<span class="price-range">
      <input type="number" id="priceMin" inputmode="numeric" min="0" placeholder="Цена от" value="${priceMin ?? ''}">
      <i>—</i>
      <input type="number" id="priceMax" inputmode="numeric" min="0" placeholder="до ₽" value="${priceMax ?? ''}">
    </span></div>`;

  el.innerHTML = garmentRow + sortRow;
  el.hidden = !_filtersOpen;

  // Поля цены: применяем с небольшой задержкой, не перерисовывая панель
  let t;
  const applyPrice = () => {
    const mn = document.getElementById('priceMin').value;
    const mx = document.getElementById('priceMax').value;
    priceMin = mn === '' ? null : Math.max(0, +mn);
    priceMax = mx === '' ? null : Math.max(0, +mx);
    if (btn) btn.classList.toggle('on', filtersActive());
    renderGrid();
    updateCatalogChrome();
  };
  ['priceMin', 'priceMax'].forEach(id =>
    document.getElementById(id).addEventListener('input', () => { clearTimeout(t); t = setTimeout(applyPrice, 350); }));
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
  if (!chip) return;
  if (chip.dataset.sort !== undefined)         activeSort = chip.dataset.sort;
  else if (chip.dataset.garment !== undefined) activeGarment = chip.dataset.garment || null;   // уточняет внутри раздела
  else return;
  renderFilters();
  renderGrid();
  updateCatalogChrome();
  if (activeCat || activeGarment) document.getElementById('gridHeading').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// При активном фильтре показываем только товары категории, пряча промо-поток
let _streamHasContent = false;
function updateCatalogChrome() {
  const filtering = !!activeCat || !!activeGarment || priceMin != null || priceMax != null;
  // inline-стиль, т.к. #siteBlocks:not(:empty){display:flex} перебивает [hidden]
  document.getElementById('siteBlocks').style.display = filtering ? 'none' : '';
  const gh = document.getElementById('gridHeading');
  if (filtering) {
    const parts = [];
    if (activeGarment) parts.push((GARMENTS.find(g => g.id === activeGarment) || {}).name);
    if (activeCat === '__archive__') parts.push('Архив');
    else if (activeCat === '__other__') parts.push('Другое');
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
  // Карточка — обычная ссылка на страницу товара /product/:id.
  const cover = (i.photos && i.photos[0]) || (i.thumbs && i.thumbs[0]) || null;
  // Лента на фото заменяет текстовый тег для проданных и зарезервированных
  const ribbon = i.sold ? '<span class="photo-ribbon">Продано</span>'
    : i.reserved ? '<span class="photo-ribbon reserved">Зарезервировано</span>' : '';
  const tag = (i.sold || i.reserved)
    ? ''
    : `<span class="good-tag ${i.inStock ? 'in-stock' : 'preorder'}">${i.inStock ? 'В наличии' : 'Под заказ'}</span>`;
  return `
    <a class="good-card${i.sold ? ' sold' : ''}" href="/product/${encodeURIComponent(i.id)}">
      <div class="good-photo">
        ${cover ? `<img src="${esc(cover)}" alt="${esc(i.name)}" loading="lazy" draggable="false">`
                : '<span class="no-photo">Masqucerade</span>'}
        ${ribbon}
      </div>
      <div class="good-info">
        <div class="good-name">${esc(i.name)}</div>
        <div class="good-meta">
          <span class="good-price">${fmtPrice(i.price)}${i.oldPrice ? ` <s class="old-price">${fmtPrice(i.oldPrice)}</s><em class="disc-badge">−${Math.round((1 - i.price / i.oldPrice) * 100)}%</em>` : ''}</span>
          <span class="good-sizes">${esc(sizesLabel(i.sizes))}</span>
        </div>
        ${tag}
      </div>
    </a>`;
}

function renderGrid() {
  const el = document.getElementById('goodsGrid');
  let items;
  if (activeCat === '__archive__') items = ARCHIVE;                                    // проданные вещи
  else if (activeCat === '__other__') {
    // «Другое» — товары вне разделов Мужское/Женское/Аксессуары
    const inSec = new Set();
    HDR_SECTIONS.map(sectionCat).filter(Boolean).forEach(c => catSubtree(c.id).forEach(id => inSec.add(id)));
    items = ITEMS.filter(i => !inSec.has(i.categoryId));
  }
  else if (activeCat && activeCat.startsWith('__')) items = [];                        // раздел ещё не заведён
  else if (activeCat) { const ids = catSubtree(activeCat); items = ITEMS.filter(i => ids.has(i.categoryId)); }
  else items = ITEMS;
  if (activeGarment) items = items.filter(i => i.garment === activeGarment);

  // Диапазон цены и сортировка (из панели «Фильтры»)
  if (priceMin != null) items = items.filter(i => i.price != null && i.price >= priceMin);
  if (priceMax != null) items = items.filter(i => i.price != null && i.price <= priceMax);
  items = [...items];
  if (activeSort === 'asc')       items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  else if (activeSort === 'desc') items.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  else items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (!items.length) {
    el.innerHTML = '<div class="goods-empty">Пока пусто — загляните позже</div>';
    return;
  }
  el.innerHTML = items.map(cardHTML).join('');
  revealScan();
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

/* Обложка раздела: полноэкранное превью на самом верху, ниже — каталог.
   Берётся первый включённый блок типа «cover» своего раздела. */
function renderCover(blocks) {
  const wrap = document.getElementById('siteCover');
  if (!wrap) return;
  const c = (blocks || []).find(b => b.type === 'cover' && b.image);
  // При обложке заголовок раздела прячется — бренд уже в кадре, дубль не нужен
  document.body.classList.toggle('has-cover', !!c);
  if (!c) { wrap.innerHTML = ''; return; }
  const fitAuto = c.fit === 'auto';   // «фото целиком» — высота по кадру, стрелка не нужна
  wrap.innerHTML = `
    <section class="site-cover${fitAuto ? ' fit-auto' : ''}">
      <img src="${esc(c.image)}" alt="" style="object-position:${esc(c.pos || 'center center')}" draggable="false">
      <div class="sc-shade" aria-hidden="true"></div>
      ${c.heading || c.sub ? `<div class="sc-caption">
        ${c.heading ? `<h2>${esc(c.heading)}</h2>` : ''}
        ${c.sub ? `<p>${esc(c.sub)}</p>` : ''}
      </div>` : ''}
      ${fitAuto ? '' : `<button class="sc-scroll" type="button" aria-label="К товарам">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>`}
    </section>`;
  wrap.querySelector('.sc-scroll')?.addEventListener('click', () => {
    const target = document.querySelector('.catalog-wrap');
    if (!target) return;
    const before = window.scrollY;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Фолбэк: если среда не умеет smooth-скролл — прыгаем мгновенно
    setTimeout(() => {
      if (Math.abs(window.scrollY - before) < 4) target.scrollIntoView({ block: 'start' });
    }, 350);
  });
}

/* Единый поток витрины: баннеры, текст и подборки в общем порядке (order).
   Промо-полосы — отдельно, тонкой строкой сверху. */
function renderStream(blocks, collections) {
  blocks = blocks || [];
  renderCover(blocks);

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
  revealScan();
  requestAnimationFrame(() => requestAnimationFrame(markCarousels));
  setTimeout(markCarousels, 400);   // подстраховка: дождаться загрузки фото/шрифтов
}

/* Карточки — обычные ссылки на /product/:id; здесь остаётся только карусель */
document.getElementById('siteBlocks').addEventListener('click', (e) => {
  // Стрелка-шеврон — прокрутить карусель дальше
  const next = e.target.closest('.carousel-next');
  if (next) {
    e.preventDefault();
    const grid = next.closest('.collection-carousel')?.querySelector('.collection-grid');
    if (grid) { grid.scrollLeft += Math.round(grid.clientWidth * 0.85); setTimeout(markCarousels, 60); }   // scroll-snap мягко доводит до карточки
  }
});

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
  revealScan();
}

boot();
