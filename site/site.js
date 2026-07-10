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
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('sectionKicker').textContent = TITLES[SECTION].kicker;
  document.getElementById('sectionTitle').textContent  = TITLES[SECTION].title;
  document.title = `Masqucerade INC. — ${TITLES[SECTION].title}`;
  document.querySelectorAll('.site-nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === SECTION));
  document.getElementById('footTg').href = `https://t.me/${TG_USERNAME}`;

  try {
    const [items, cats, faq, collections] = await Promise.all([
      fetch(`/api/public/items?section=${SECTION}`).then(r => r.json()),
      fetch('/api/public/categories').then(r => r.json()),
      fetch('/api/public/faq').then(r => r.json()),
      fetch(`/api/public/collections?section=${SECTION}`).then(r => r.json()),
    ]);
    ITEMS = items; CATS = cats;
    renderCollections(collections);
    renderChips();
    renderGrid();
    renderFaq(faq);
  } catch (e) {
    document.getElementById('goodsGrid').innerHTML =
      '<div class="goods-empty">Не удалось загрузить каталог — попробуйте обновить страницу</div>';
  }
}

function renderChips() {
  const usedCatIds = new Set(ITEMS.map(i => i.categoryId).filter(Boolean));
  const cats = CATS.filter(c => usedCatIds.has(c.id));
  const el = document.getElementById('catChips');
  if (!cats.length) { el.innerHTML = ''; return; }
  el.innerHTML =
    `<button class="cat-chip${!activeCat ? ' active' : ''}" data-cat="">Все</button>` +
    cats.map(c =>
      `<button class="cat-chip${activeCat === c.id ? ' active' : ''}" data-cat="${esc(c.id)}">${esc(c.name)}</button>`
    ).join('');
}

document.getElementById('catChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.cat-chip');
  if (!chip) return;
  activeCat = chip.dataset.cat || null;
  renderChips();
  renderGrid();
});

function sizesLabel(sizes) {
  if (!Array.isArray(sizes) || !sizes.length) return '';
  return sizes.map(s => s.size).filter(Boolean).join(' · ');
}

function cardHTML(i) {
  const cover = (i.photos && i.photos[0]) || null;
  return `
    <article class="good-card" data-id="${esc(i.id)}">
      <div class="good-photo">
        ${cover ? `<img src="${esc(cover)}" alt="${esc(i.name)}" loading="lazy" draggable="false">`
                : '<span class="no-photo">Masqucerade</span>'}
        ${(i.photos || []).length > 1 ? `<span class="photo-count">${i.photos.length}</span>` : ''}
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

/* ─── Подборки ─── */
function renderCollections(collections) {
  const byId = new Map(ITEMS.map(i => [i.id, i]));
  const blocks = (collections || [])
    .map(c => ({ ...c, items: c.itemIds.map(id => byId.get(id)).filter(Boolean) }))
    .filter(c => c.items.length);
  if (!blocks.length) return;
  document.getElementById('gridHeading').hidden = false;
  document.getElementById('collectionsWrap').innerHTML = blocks.map(c => `
    <section class="collection-block">
      <p class="collection-kicker">Подборка</p>
      <h2>${esc(c.title)}</h2>
      ${c.description ? `<p class="collection-desc">${esc(c.description)}</p>` : ''}
      <div class="goods-grid collection-grid">${c.items.map(cardHTML).join('')}</div>
    </section>`).join('');
}

/* Клик по карточке внутри подборки — та же модалка */
document.getElementById('collectionsWrap').addEventListener('click', (e) => {
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

function openModal(i) {
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
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}
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
