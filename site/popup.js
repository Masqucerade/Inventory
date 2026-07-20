/* ─── Masqucerade INC. — попап при заходе на сайт ───
   Показывает первый включённый блок типа «popup» своего раздела.
   Режим «один раз»: после закрытия посетителя больше не беспокоим
   (localStorage). Подключается на лендинге и страницах каталога. */

(async function () {
  const TG_USERNAME = 'Masqucerade';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const path     = location.pathname.replace(/\/+$/, '');
  // Раздел задаёт сервер по домену (meta); фолбэк — по пути
  const section  = document.querySelector('meta[name="mq-section"]')?.content
    || ((path === '/monarc' || path === '/brands') ? 'monarc' : 'type');
  const typeHost = document.querySelector('meta[name="mq-type-host"]')?.content || '';
  const href = (b) =>
    b.linkType === 'monarc' ? (section === 'monarc' ? '/' : 'https://masqucerade.com/')
    : b.linkType === 'type' ? (section === 'type' ? '/' : (typeHost ? `https://${typeHost}/` : '/type'))
    : b.linkType === 'tg'   ? `https://t.me/${TG_USERNAME}`
    : b.linkType === 'url'  ? (b.linkValue || '') : '';

  try {
    const blocks = await fetch(`/api/public/blocks?section=${section}`).then(r => r.json());
    const p = blocks.filter(b => b.type === 'popup')[0];
    if (!p) return;

    const key = 'mq_popup_' + p.id;
    if (p.repeat !== 'always' && localStorage.getItem(key)) return;

    const link = href(p);
    const ext  = p.linkType === 'tg' || p.linkType === 'url';
    const btn  = link
      ? `<a class="sp-btn" href="${esc(link)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(p.btnLabel || (p.linkType === 'tg' ? 'Написать в Telegram' : 'Смотреть'))}</a>`
      : '';

    const wrap = document.createElement('div');
    wrap.className = 'site-popup';
    wrap.innerHTML = `
      <div class="sp-card" role="dialog" aria-modal="true">
        <button class="sp-close" type="button" aria-label="Закрыть">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        ${p.image ? `<img class="sp-img" src="${esc(p.image)}" alt="" draggable="false">` : ''}
        <div class="sp-body">
          ${p.heading ? `<div class="sp-head">${esc(p.heading)}</div>` : ''}
          ${p.text ? `<div class="sp-text">${esc(p.text)}</div>` : ''}
          ${btn}
        </div>
      </div>`;

    const close = () => {
      try { localStorage.setItem(key, '1'); } catch (_) {}
      wrap.classList.remove('open');
      setTimeout(() => wrap.remove(), 320);
    };
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('.sp-close') || e.target.closest('.sp-btn') || !e.target.closest('.sp-card')) close();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    document.body.appendChild(wrap);
    // Небольшая пауза — даём странице отрисоваться, потом плавно показываем
    setTimeout(() => wrap.classList.add('open'), 600);
  } catch (_) {}
})();
