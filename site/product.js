/* ─── Masqucerade INC. — страница товара /product/:id ─── */

const TG_USERNAME = 'Masqucerade';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtPrice = (p) => p == null || p === '' ? '' :
  new Intl.NumberFormat('ru-RU').format(p) + ' ₽';

// Износ вещи (как у Gurbich: «НОВОЕ С БИРКАМИ»)
const CONDITIONS = {
  new:       'Новое с биркой',
  excellent: 'Отличное состояние',
  good:      'Хорошее состояние',
};

const ID = decodeURIComponent(location.pathname.split('/').pop());

async function boot() {
  document.getElementById('footTg').href = `https://t.me/${TG_USERNAME}`;
  let data, cats = [];
  try {
    [data, cats] = await Promise.all([
      fetch(`/api/public/items/${encodeURIComponent(ID)}`).then(r => { if (!r.ok) throw 0; return r.json(); }),
      fetch('/api/public/categories').then(r => r.json()),
    ]);
  } catch (e) {
    document.getElementById('productWrap').innerHTML =
      '<div class="goods-empty">Товар не найден — <a href="/" style="text-decoration:underline">вернуться на главную</a></div>';
    return;
  }
  const i = data.item;

  /* Тема раздела; в шапке всегда «Masqucerade» */
  document.body.classList.add('theme-' + i.section);
  // Сервер уводит товар на домен его бренда, так что «назад» — на главную;
  // пока Type-домен не подключён, его товары живут на /type
  const typeHost = document.querySelector('meta[name="mq-type-host"]')?.content || '';
  document.getElementById('backLink').href = (i.section === 'type' && !typeHost) ? '/type' : '/';
  document.title = `${i.name} — Masqucerade INC.`;

  const cat    = cats.find(c => c.id === i.categoryId);
  const photos = i.photos || [];
  const msg    = encodeURIComponent(`Здравствуйте! Интересует «${i.name}» с вашего сайта.`);
  // Лента на фото: продано / зарезервировано («В заказе»)
  const ribbonOf = (x) => x.sold ? '<span class="photo-ribbon">Продано</span>'
    : x.reserved ? '<span class="photo-ribbon reserved">Зарезервировано</span>' : '';

  document.getElementById('productWrap').innerHTML = `
    <div class="product-grid">
      <div class="product-gallery">
        <div class="p-photo-main${i.sold ? ' is-sold' : ''}" id="pPhotoMain" title="Открыть на весь экран">
          ${photos.length
            ? `<img id="pMainImg" src="${esc(photos[0])}" alt="${esc(i.name)}" draggable="false">`
            : '<span class="no-photo">Masqucerade</span>'}
          ${ribbonOf(i)}
        </div>
        ${photos.length > 1 ? `<div class="p-thumbs">${photos.map((p, idx) =>
          `<button type="button" class="p-thumb${idx === 0 ? ' active' : ''}" data-src="${esc(p)}"><img src="${esc(p)}" alt="" draggable="false"></button>`).join('')}</div>` : ''}
      </div>
      <div class="product-info">
        <p class="m-cat">${esc(i.brand ? i.brand : (cat ? cat.name : (i.section === 'monarc' ? 'Monarc' : 'Type Clothes')))}</p>
        <h1 class="p-name">${esc(i.name)}</h1>
        ${i.condition ? `<p class="p-cond${i.condition === 'new' ? ' cond-new' : ''}">${CONDITIONS[i.condition] || ''}</p>` : ''}
        <p class="m-price">${fmtPrice(i.price)}${i.oldPrice ? ` <s class="old-price">${fmtPrice(i.oldPrice)}</s><em class="disc-badge">−${Math.round((1 - i.price / i.oldPrice) * 100)}%</em>` : ''}</p>
        ${i.sold
          ? `<span class="good-tag sold p-sold-tag">Продано</span>`
          : `<div class="m-sizes" id="pSizes">${(i.sizes || []).filter(s => s.size).map(s =>
              `<button type="button" class="m-size m-size-pick" data-size="${esc(s.size)}">${esc(s.size)}</button>`).join('')}</div>`}
        ${i.description ? `<p class="m-desc">${esc(i.description)}</p>` : ''}
        ${i.measurements ? `
        <div class="m-fit" id="mFit">
          <button class="m-fit-head" id="mFitHead" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0l-11.2 11.2a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0l11.2-11.2a1 1 0 0 0 0-1.4z"/>
              <path d="m7.5 10.5 1.5 1.5"/><path d="m10.5 7.5 1.5 1.5"/><path d="m13.5 4.5 1.5 1.5"/>
            </svg>
            Замеры и посадка
            <svg class="m-fit-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="m-fit-body">${esc(i.measurements)}</div>
        </div>` : ''}
        ${i.sold
          ? `<p class="p-sold-note">Эта вещь уже нашла владельца. Напишите нам — подберём похожую.</p>
             <a class="tg-btn ghost" href="https://t.me/${TG_USERNAME}" target="_blank" rel="noopener">Написать в Telegram</a>`
          : `<button class="tg-btn cart-add-btn" id="addCartBtn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              В корзину
            </button>
            <a class="tg-btn ghost" href="https://t.me/${TG_USERNAME}?text=${msg}" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.4 4.1 2.9 11.3c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.5c.3.9 1.4 1.1 2 .4l2.6-2.7 4.8 3.5c.8.6 1.9.2 2.1-.8l3-14.9c.2-1.1-.8-2-1.5-1.7zM8.5 14.4l9.4-6.9c.3-.2.6.2.4.4l-7.6 7.5-.3 3-1.9-4z"/>
              </svg>
              Написать в Telegram
            </a>
            <p class="p-note">В продаже только оригинальные вещи · отправка по России и всему миру</p>`}
      </div>
    </div>
    ${data.related && data.related.length ? `
    <section class="related-sec">
      <h2>Похожие товары</h2>
      <div class="goods-grid related-grid">
        ${data.related.map(r => {
          const cover = (r.photos && r.photos[0]) || (r.thumbs && r.thumbs[0]) || null;
          return `<a class="good-card" href="/product/${encodeURIComponent(r.id)}">
            <div class="good-photo">${cover
              ? `<img src="${esc(cover)}" alt="${esc(r.name)}" loading="lazy" draggable="false">`
              : '<span class="no-photo">Masqucerade</span>'}${ribbonOf(r)}</div>
            <div class="good-info">
              <div class="good-name">${esc(r.name)}</div>
              <div class="good-meta"><span class="good-price">${fmtPrice(r.price)}</span></div>
            </div>
          </a>`;
        }).join('')}
      </div>
    </section>` : ''}
  `;

  /* ── «В корзину»: размер выбирается чипом (если он один — сам) ── */
  const sizeChips = [...document.querySelectorAll('.m-size-pick')];
  let pickedSize = sizeChips.length === 1 ? sizeChips[0].dataset.size : '';
  if (sizeChips.length === 1) sizeChips[0].classList.add('picked');
  sizeChips.forEach(ch => ch.addEventListener('click', () => {
    pickedSize = ch.dataset.size;
    sizeChips.forEach(x => x.classList.toggle('picked', x === ch));
    document.getElementById('pSizes')?.classList.remove('need-size');
  }));
  document.getElementById('addCartBtn')?.addEventListener('click', () => {
    if (sizeChips.length > 1 && !pickedSize) {
      // Просим выбрать размер — подсветкой чипов
      const wrap = document.getElementById('pSizes');
      wrap.classList.remove('need-size'); void wrap.offsetWidth;
      wrap.classList.add('need-size');
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    window.mqCart.add(i.id, pickedSize);
    const btn = document.getElementById('addCartBtn');
    btn.classList.add('in-cart');
    btn.innerHTML = 'В корзине ✓ — открыть';
    btn.onclick = () => window.mqCart.open();
    window.mqCart.open();
  });

  /* Клик по «Написать в Telegram» — счётчик заявок (только ссылки, не корзина) */
  document.querySelectorAll('a.tg-btn').forEach(a =>
    a.addEventListener('click', () => {
      const url = `/api/public/items/${encodeURIComponent(i.id)}/click`;
      try { navigator.sendBeacon(url); }
      catch (_) { fetch(url, { method: 'POST', keepalive: true }).catch(() => {}); }
    }));

  /* Миниатюры переключают главное фото */
  document.querySelectorAll('.p-thumb').forEach(t =>
    t.addEventListener('click', () => {
      const main = document.getElementById('pMainImg');
      if (main) main.src = t.dataset.src;
      document.querySelectorAll('.p-thumb').forEach(x => x.classList.toggle('active', x === t));
    })
  );

  /* Аккордеон «Замеры и посадка» */
  document.getElementById('mFitHead')?.addEventListener('click', () =>
    document.getElementById('mFit').classList.toggle('open'));

  /* Зум: клик по главному фото — на весь экран */
  const zoom = document.getElementById('photoZoom');
  document.getElementById('pPhotoMain')?.addEventListener('click', () => {
    const main = document.getElementById('pMainImg');
    if (!main) return;
    document.getElementById('zoomImg').src = main.src;
    zoom.hidden = false;
    document.body.style.overflow = 'hidden';
  });
  zoom.addEventListener('click', () => {
    zoom.hidden = true;
    document.body.style.overflow = '';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !zoom.hidden) { zoom.hidden = true; document.body.style.overflow = ''; }
  });
}

boot();
