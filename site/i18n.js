/* ─── Языки витрины: RU / EN ───
   Переводим интерфейс (кнопки, фильтры, корзину, состояния). Названия и
   описания товаров — данные из панели, они остаются как есть.
   Выбор языка живёт в localStorage `mqLang`, смена перезагружает страницу. */
(function () {
  const DICT = {
    ru: {
      'lang.aria': 'Язык',
      'search.ph': 'Найти товар…', 'search.aria': 'Поиск', 'search.close': 'Закрыть поиск',
      'cart.aria': 'Корзина', 'menu.open': 'Открыть меню', 'menu.close': 'Закрыть меню',
      'nav.back': '← Каталог', 'tg.write': 'Написать в Telegram', 'tg.writeArrow': 'Написать в Telegram →',
      'filters': 'Фильтры', 'sort.aria': 'Сортировка', 'loading': 'Загружаем…',
      'scroll.hint': 'Листайте вниз', 'search.all': 'Все товары', 'search.none': 'Ничего не найдено',
      'search.found': 'Найдено',

      'sec.m': 'Мужское', 'sec.w': 'Женское', 'sec.a': 'Аксессуары',
      'sec.archive': 'Архив', 'sec.other': 'Другое', 'sec.goods': 'Товары', 'sec.all': 'Все товары',
      'mega.section': 'Раздел', 'mega.all': 'Смотреть все →',
      'mega.cats': 'Категории', 'mega.garments': 'Тип одежды',
      'kicker.monarc': 'Оригинальные бренды', 'kicker.type': 'Люкс-качество на каждый день',

      'cond.new': 'Новое с биркой', 'cond.excellent': 'Отличное состояние', 'cond.good': 'Хорошее состояние',
      'g.top': 'Верх', 'g.bottom': 'Низ', 'g.shoes': 'Обувь', 'g.outerwear': 'Верхняя одежда',

      'f.type': 'Тип', 'f.brand': 'Бренд', 'f.cond': 'Износ', 'f.price': 'Цена',
      'f.all': 'Все', 'f.from': 'Цена от', 'f.to': 'до ₽',
      'sort.default': 'По умолчанию', 'sort.new': 'Сначала новые',
      'sort.asc': 'Сначала дешевле', 'sort.desc': 'Сначала дороже',

      'st.inStock': 'В наличии', 'st.preorder': 'Под заказ', 'st.sold': 'Продано',
      'st.reserved': 'Зарезервировано', 'st.inOrder': 'в заказе',
      'empty.catalog': 'Пока пусто — загляните позже',
      'err.catalog': 'Не удалось загрузить каталог — попробуйте обновить страницу',
      'err.notfound': 'Товар не найден', 'err.toHome': 'вернуться на главную',

      'p.related': 'Похожие товары', 'p.fit': 'Замеры и посадка', 'p.zoom': 'Открыть на весь экран',
      'p.addCart': 'В корзину', 'p.inCart': 'В корзине ✓ — открыть',
      'p.sizeInOrder': 'Этот размер уже в заказе',
      'p.soldNote': 'Эта вещь уже нашла владельца. Напишите нам — подберём похожую.',
      'p.allInOrder': 'Все размеры сейчас в заказе. Напишите нам — сообщим, как только освободится.',
      'p.note': 'В продаже только оригинальные вещи · отправка по России и всему миру',

      'c.title': 'Корзина', 'c.close': 'Закрыть корзину', 'c.remove': 'Убрать из корзины',
      'c.empty': 'Корзина пуста',
      'c.emptyHint': 'Добавляйте вещи со страниц товаров — и оформите заявку одним разом',
      'c.loadErr': 'Не удалось загрузить корзину', 'c.loadErrHint': 'Проверьте соединение и попробуйте ещё раз',
      'c.size': 'Размер', 'c.promo.ph': 'Промокод', 'c.promo.apply': 'Применить',
      'c.promo.remove': 'убрать', 'c.promo.expired': 'Промокод больше не действует',
      'c.promo.notFound': 'Промокод не найден', 'c.promo.label': 'Промокод',
      'c.discount': 'Скидка', 'c.total': 'Итого', 'c.formTitle': 'Оформление заявки',
      'c.name': 'Имя', 'c.contact': 'Telegram или телефон *', 'c.comment': 'Комментарий (необязательно)',
      'c.submit': 'Отправить заявку', 'c.sending': 'Отправляем…',
      'c.hint': 'Мы свяжемся с вами, подтвердим наличие и обсудим оплату и доставку. Или напишите нам напрямую:',
      'c.success': 'Заявка отправлена ✓',
      'c.successHint': 'Мы свяжемся с вами в ближайшее время — подтвердим наличие и обсудим доставку.',
      'c.back': 'Вернуться в каталог', 'c.err': 'Ошибка',
      'c.sendErr': 'Не удалось отправить — попробуйте ещё раз или напишите в Telegram',
    },
    en: {
      'lang.aria': 'Language',
      'search.ph': 'Search products…', 'search.aria': 'Search', 'search.close': 'Close search',
      'cart.aria': 'Cart', 'menu.open': 'Open menu', 'menu.close': 'Close menu',
      'nav.back': '← Catalog', 'tg.write': 'Message on Telegram', 'tg.writeArrow': 'Message on Telegram →',
      'filters': 'Filters', 'sort.aria': 'Sort', 'loading': 'Loading…',
      'scroll.hint': 'Scroll down', 'search.all': 'All products', 'search.none': 'Nothing found',
      'search.found': 'Found',

      'sec.m': 'Men', 'sec.w': 'Women', 'sec.a': 'Accessories',
      'sec.archive': 'Archive', 'sec.other': 'Other', 'sec.goods': 'Products', 'sec.all': 'All products',
      'mega.section': 'Section', 'mega.all': 'View all →',
      'mega.cats': 'Categories', 'mega.garments': 'Type',
      'kicker.monarc': 'Original brands', 'kicker.type': 'Everyday luxury quality',

      'cond.new': 'New with tags', 'cond.excellent': 'Excellent condition', 'cond.good': 'Good condition',
      'g.top': 'Tops', 'g.bottom': 'Bottoms', 'g.shoes': 'Shoes', 'g.outerwear': 'Outerwear',

      'f.type': 'Type', 'f.brand': 'Brand', 'f.cond': 'Condition', 'f.price': 'Price',
      'f.all': 'All', 'f.from': 'Price from', 'f.to': 'to ₽',
      'sort.default': 'Default', 'sort.new': 'Newest first',
      'sort.asc': 'Price: low to high', 'sort.desc': 'Price: high to low',

      'st.inStock': 'In stock', 'st.preorder': 'Made to order', 'st.sold': 'Sold',
      'st.reserved': 'Reserved', 'st.inOrder': 'in order',
      'empty.catalog': 'Nothing here yet — check back soon',
      'err.catalog': 'Could not load the catalog — please refresh the page',
      'err.notfound': 'Product not found', 'err.toHome': 'back to home',

      'p.related': 'You may also like', 'p.fit': 'Measurements & fit', 'p.zoom': 'Open full screen',
      'p.addCart': 'Add to cart', 'p.inCart': 'In cart ✓ — open',
      'p.sizeInOrder': 'This size is already in an order',
      'p.soldNote': 'This piece has found its owner. Message us — we will find something similar.',
      'p.allInOrder': 'All sizes are currently in orders. Message us — we will let you know when one frees up.',
      'p.note': 'Authentic pieces only · worldwide shipping',

      'c.title': 'Cart', 'c.close': 'Close cart', 'c.remove': 'Remove from cart',
      'c.empty': 'Your cart is empty',
      'c.emptyHint': 'Add pieces from product pages — and send one request for all of them',
      'c.loadErr': 'Could not load the cart', 'c.loadErrHint': 'Check your connection and try again',
      'c.size': 'Size', 'c.promo.ph': 'Promo code', 'c.promo.apply': 'Apply',
      'c.promo.remove': 'remove', 'c.promo.expired': 'This promo code is no longer valid',
      'c.promo.notFound': 'Promo code not found', 'c.promo.label': 'Promo code',
      'c.discount': 'Discount', 'c.total': 'Total', 'c.formTitle': 'Request checkout',
      'c.name': 'Name', 'c.contact': 'Telegram or phone *', 'c.comment': 'Comment (optional)',
      'c.submit': 'Send request', 'c.sending': 'Sending…',
      'c.hint': 'We will get in touch, confirm availability and arrange payment and delivery. Or message us directly:',
      'c.success': 'Request sent ✓',
      'c.successHint': 'We will contact you shortly — confirm availability and arrange delivery.',
      'c.back': 'Back to catalog', 'c.err': 'Error',
      'c.sendErr': 'Could not send — please try again or message us on Telegram',
    },
  };

  const saved = localStorage.getItem('mqLang');
  const lang  = (saved === 'en' || saved === 'ru') ? saved : 'ru';
  window.mqLang = lang;
  window.mqT = (k) => (DICT[lang] && DICT[lang][k]) || DICT.ru[k] || k;
  document.documentElement.lang = lang;

  /* Строки, зашитые в разметку: data-i18n / -ph / -aria */
  function applyStatic(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => { el.textContent = mqT(el.dataset.i18n); });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = mqT(el.dataset.i18nPh); });
    (root || document).querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', mqT(el.dataset.i18nAria)); });
  }

  const GLOBE = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
    <circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>
    <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></svg>`;

  /* Переключатель: глобус в шапке, по клику — выбор языка */
  function mount(host) {
    host.innerHTML = `
      <button class="lang-btn" type="button" aria-label="${mqT('lang.aria')}" aria-expanded="false">
        ${GLOBE}<span class="lang-cur">${lang.toUpperCase()}</span>
      </button>
      <div class="lang-menu" role="menu">
        <button type="button" role="menuitem" data-lang="ru"${lang === 'ru' ? ' class="on"' : ''}>Русский</button>
        <button type="button" role="menuitem" data-lang="en"${lang === 'en' ? ' class="on"' : ''}>English</button>
      </div>`;
    const btn = host.querySelector('.lang-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.lang-switch.open').forEach(o => { if (o !== host) o.classList.remove('open'); });
      btn.setAttribute('aria-expanded', String(host.classList.toggle('open')));
    });
    host.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.lang === lang) { host.classList.remove('open'); return; }
      localStorage.setItem('mqLang', b.dataset.lang);
      location.reload();
    }));
  }

  function boot() {
    applyStatic();
    document.querySelectorAll('.lang-switch').forEach(mount);
    document.addEventListener('click', () =>
      document.querySelectorAll('.lang-switch.open').forEach(o => o.classList.remove('open')));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
