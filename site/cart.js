/* ─── Masqucerade INC. — корзина и оформление заявки ───
   Общий модуль каталога и страницы товара. Состав — в localStorage,
   заявка уходит в POST /api/public/order (Telegram админам). */
(() => {
  const KEY = 'mqCart';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtPrice = (p) => p == null || p === '' ? '—' :
    new Intl.NumberFormat(window.mqLang === 'en' ? 'en-US' : 'ru-RU').format(p) + ' ₽';

  const read  = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} updateBadge(); };

  /* ── Применённый промокод (переживает перезагрузку страницы) ── */
  const PKEY = 'mqPromo';
  const readPromo  = () => { try { return localStorage.getItem(PKEY) || ''; } catch { return ''; } };
  const writePromo = (code) => { try { code ? localStorage.setItem(PKEY, code) : localStorage.removeItem(PKEY); } catch {} };

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
        <span class="co-title">${T('c.title')}</span>
        <button class="mob-close" id="coClose" type="button" aria-label="${T('c.close')}">
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
        <p>${T('c.empty')}</p>
        <span>${T('c.emptyHint')}</span>
      </div>`;
      return;
    }
    body.innerHTML = `<div class="co-empty"><p>${T('loading')}</p></div>`;
    let items = [];
    try {
      items = await fetch('/api/public/cart-info', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: cart.map(c => c.id) }),
      }).then(r => r.json());
    } catch (_) {
      body.innerHTML = `<div class="co-empty"><p>${T('c.loadErr')}</p><span>${T('c.loadErrHint')}</span></div>`;
      return;
    }
    const byId = new Map(items.map(i => [i.id, i]));
    // Проданное выпадает из корзины само
    const live = cart.filter(c => byId.get(c.id) && !byId.get(c.id).sold);
    if (live.length !== cart.length) write(live);
    if (!live.length) { render(); return; }

    const total = live.reduce((s, c) => s + (byId.get(c.id).price || 0), 0);

    // Сохранённый промокод перепроверяем на сервере при каждом открытии —
    // мог истечь, выключиться или перестать проходить по сумме
    let promo = null, promoMsg = '';
    const savedCode = readPromo();
    if (savedCode) {
      try {
        const r = await fetch('/api/public/promo-check', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: savedCode, ids: live.map(c => c.id) }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) promo = d;
        else { writePromo(''); promoMsg = d.error || T('c.promo.expired'); }
      } catch (_) { /* сеть моргнула — не сбрасываем код */ }
    }

    body.innerHTML = `
      <div class="co-list">
        ${live.map(c => {
          const i = byId.get(c.id);
          const cover = (i.thumbs && i.thumbs[0]) || (i.photos && i.photos[0]) || null;
          return `<div class="co-row" data-id="${esc(c.id)}" data-size="${esc(c.size || '')}">
            <a class="co-thumb" href="/product/${encodeURIComponent(i.id)}">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy" draggable="false">` : ''}</a>
            <div class="co-info">
              <a class="co-name" href="/product/${encodeURIComponent(i.id)}">${esc(i.name)}</a>
              <span class="co-meta">${c.size ? `${T('c.size')}: ${esc(c.size)} · ` : ''}${fmtPrice(i.price)}</span>
            </div>
            <button class="co-remove" type="button" aria-label="${T('c.remove')}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>`;
        }).join('')}
      </div>
      <div class="co-promo">
        ${promo
          ? `<div class="co-promo-applied">
               <span>${T('c.promo.label')} <b>${esc(promo.code)}</b> · ${esc(promo.label)}</span>
               <button type="button" id="coPromoRemove">${T('c.promo.remove')}</button>
             </div>`
          : `<div class="co-promo-row">
               <input class="co-input co-promo-input" id="coPromoInput" type="text" placeholder="${T('c.promo.ph')}" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false">
               <button class="tg-btn ghost co-promo-btn" id="coPromoApply" type="button">${T('c.promo.apply')}</button>
             </div>`}
        <p class="co-promo-msg" id="coPromoMsg" ${promoMsg ? '' : 'hidden'}>${esc(promoMsg)}</p>
      </div>
      ${promo ? `<div class="co-total co-discount"><span>${T('c.discount')}</span><b>−${fmtPrice(promo.discount).replace(' ₽', '')} ₽</b></div>` : ''}
      <div class="co-total"><span>${T('c.total')}</span><b>${promo ? `<s class="co-total-old">${fmtPrice(total)}</s> ` : ''}${fmtPrice(promo ? promo.final : total)}</b></div>
      <form class="co-form" id="coForm">
        <p class="co-form-title">${T('c.formTitle')}</p>
        <input class="co-input" id="coName" type="text" placeholder="${T('c.name')}" autocomplete="name" maxlength="100">
        <input class="co-input" id="coContact" type="text" placeholder="${T('c.contact')}" autocomplete="tel" maxlength="150" required>
        <textarea class="co-input" id="coComment" placeholder="${T('c.comment')}" rows="2" maxlength="500"></textarea>
        <button class="tg-btn co-submit" type="submit">${T('c.submit')}</button>
        <p class="co-hint">${T('c.hint')} <a href="https://t.me/Masqucerade" target="_blank" rel="noopener">Telegram</a></p>
      </form>`;

    body.querySelectorAll('.co-remove').forEach(btn =>
      btn.addEventListener('click', () => {
        const row = btn.closest('.co-row');
        write(read().filter(c => !(c.id === row.dataset.id && (c.size || '') === row.dataset.size)));
        render();
      }));

    /* Промокод: применить / убрать */
    const applyPromo = async () => {
      const inp = body.querySelector('#coPromoInput');
      const msg = body.querySelector('#coPromoMsg');
      const code = (inp.value || '').trim();
      if (!code) { inp.focus(); return; }
      const btn = body.querySelector('#coPromoApply');
      btn.disabled = true; btn.textContent = '…';
      try {
        const r = await fetch('/api/public/promo-check', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, ids: read().map(c => c.id) }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.ok) throw new Error(d.error || T('c.promo.notFound'));
        writePromo(d.code);
        render();
      } catch (err) {
        btn.disabled = false; btn.textContent = T('c.promo.apply');
        msg.textContent = err.message;
        msg.hidden = false;
      }
    };
    body.querySelector('#coPromoApply')?.addEventListener('click', applyPromo);
    body.querySelector('#coPromoInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); applyPromo(); }
    });
    body.querySelector('#coPromoRemove')?.addEventListener('click', () => { writePromo(''); render(); });

    body.querySelector('#coForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const contact = body.querySelector('#coContact').value.trim();
      if (!contact) { body.querySelector('#coContact').focus(); return; }
      const btn = body.querySelector('.co-submit');
      btn.disabled = true; btn.textContent = T('c.sending');
      try {
        const r = await fetch('/api/public/order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: read(),
            name:    body.querySelector('#coName').value.trim(),
            contact,
            comment: body.querySelector('#coComment').value.trim(),
            promoCode: readPromo() || undefined,
          }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || T('c.err'));
        write([]);
        writePromo('');
        body.innerHTML = `<div class="co-empty co-success">
          <p>${T('c.success')}</p>
          <span>${T('c.successHint')}</span>
          <a class="tg-btn ghost co-success-btn" href="/">${T('c.back')}</a>
        </div>`;
      } catch (err) {
        btn.disabled = false; btn.textContent = T('c.submit');
        alert(err.message || T('c.sendErr'));
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
