/* ─── Masqucerade INC. — корзина и оформление заявки ───
   Общий модуль каталога и страницы товара. Состав — в localStorage,
   заявка уходит в POST /api/public/order (Telegram админам). */
(() => {
  const KEY = 'mqCart';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtPrice = (p) => p == null || p === '' ? '—' :
    new Intl.NumberFormat('ru-RU').format(p) + ' ₽';

  const read  = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} updateBadge(); };

  /* ── Бейдж на иконке корзины в шапке ── */
  function updateBadge() {
    const n = read().length;
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = n || '';
      b.hidden = !n;
    });
  }

  /* ── Оверлей корзины (создаётся один раз) ── */
  let overlay = null;
  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="co-top">
        <span class="co-title">Корзина</span>
        <button class="mob-close" id="coClose" type="button" aria-label="Закрыть корзину">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="co-body" id="coBody"></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#coClose').addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
    return overlay;
  }

  function toggle(open) {
    ensureOverlay();
    overlay.classList.toggle('open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('mob-lock', open);
    if (open) render();
  }

  /* ── Содержимое: список вещей + форма заявки ── */
  async function render() {
    const body = overlay.querySelector('#coBody');
    const cart = read();
    if (!cart.length) {
      body.innerHTML = `<div class="co-empty">
        <p>Корзина пуста</p>
        <span>Добавляйте вещи со страниц товаров — и оформите заявку одним разом</span>
      </div>`;
      return;
    }
    body.innerHTML = `<div class="co-empty"><p>Загружаем…</p></div>`;
    let items = [];
    try {
      items = await fetch('/api/public/cart-info', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: cart.map(c => c.id) }),
      }).then(r => r.json());
    } catch (_) {
      body.innerHTML = `<div class="co-empty"><p>Не удалось загрузить корзину</p><span>Проверьте соединение и попробуйте ещё раз</span></div>`;
      return;
    }
    const byId = new Map(items.map(i => [i.id, i]));
    // Проданное выпадает из корзины само
    const live = cart.filter(c => byId.get(c.id) && !byId.get(c.id).sold);
    if (live.length !== cart.length) write(live);
    if (!live.length) { render(); return; }

    const total = live.reduce((s, c) => s + (byId.get(c.id).price || 0), 0);
    body.innerHTML = `
      <div class="co-list">
        ${live.map(c => {
          const i = byId.get(c.id);
          const cover = (i.thumbs && i.thumbs[0]) || (i.photos && i.photos[0]) || null;
          return `<div class="co-row" data-id="${esc(c.id)}" data-size="${esc(c.size || '')}">
            <a class="co-thumb" href="/product/${encodeURIComponent(i.id)}">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy" draggable="false">` : ''}</a>
            <div class="co-info">
              <a class="co-name" href="/product/${encodeURIComponent(i.id)}">${esc(i.name)}</a>
              <span class="co-meta">${c.size ? `Размер: ${esc(c.size)} · ` : ''}${fmtPrice(i.price)}</span>
            </div>
            <button class="co-remove" type="button" aria-label="Убрать из корзины">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>`;
        }).join('')}
      </div>
      <div class="co-total"><span>Итого</span><b>${fmtPrice(total)}</b></div>
      <form class="co-form" id="coForm">
        <p class="co-form-title">Оформление заявки</p>
        <input class="co-input" id="coName" type="text" placeholder="Имя" autocomplete="name" maxlength="100">
        <input class="co-input" id="coContact" type="text" placeholder="Telegram или телефон *" autocomplete="tel" maxlength="150" required>
        <textarea class="co-input" id="coComment" placeholder="Комментарий (необязательно)" rows="2" maxlength="500"></textarea>
        <button class="tg-btn co-submit" type="submit">Отправить заявку</button>
        <p class="co-hint">Мы свяжемся с вами, подтвердим наличие и обсудим оплату и доставку.
        Или напишите нам напрямую: <a href="https://t.me/Masqucerade" target="_blank" rel="noopener">Telegram</a></p>
      </form>`;

    body.querySelectorAll('.co-remove').forEach(btn =>
      btn.addEventListener('click', () => {
        const row = btn.closest('.co-row');
        write(read().filter(c => !(c.id === row.dataset.id && (c.size || '') === row.dataset.size)));
        render();
      }));

    body.querySelector('#coForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const contact = body.querySelector('#coContact').value.trim();
      if (!contact) { body.querySelector('#coContact').focus(); return; }
      const btn = body.querySelector('.co-submit');
      btn.disabled = true; btn.textContent = 'Отправляем…';
      try {
        const r = await fetch('/api/public/order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: read(),
            name:    body.querySelector('#coName').value.trim(),
            contact,
            comment: body.querySelector('#coComment').value.trim(),
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Ошибка');
        write([]);
        body.innerHTML = `<div class="co-empty co-success">
          <p>Заявка отправлена ✓</p>
          <span>Мы свяжемся с вами в ближайшее время — подтвердим наличие и обсудим доставку.</span>
          <a class="tg-btn ghost co-success-btn" href="/">Вернуться в каталог</a>
        </div>`;
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Отправить заявку';
        alert(err.message || 'Не удалось отправить — попробуйте ещё раз или напишите в Telegram');
      }
    });
  }

  /* ── Публичное API модуля ── */
  window.mqCart = {
    add(id, size = '') {
      const cart = read();
      if (cart.some(c => c.id === id && (c.size || '') === (size || ''))) return false;   // уже в корзине
      cart.push({ id, size: size || '' });
      write(cart);
      return true;
    },
    has: (id) => read().some(c => c.id === id),
    open: () => toggle(true),
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.cart-btn');
    if (btn) toggle(true);
  });
  updateBadge();
})();
