/* ─────────────────────────────────────────────
   MASQUCERADE INC. — виджет для Scriptable (iOS)
   Календарь месяца + дела на сегодня в стиле панели.
   Ключ и адрес уже вшиты — просто вставьте скрипт в Scriptable
   и добавьте виджет на экран «Домой» (любой размер).
   ───────────────────────────────────────────── */
const KEY  = "__KEY__";
const HOST = "__HOST__";

const BG     = new Color("#0a0a0b");
const CARD   = new Color("#131315");
const TEXT   = new Color("#fafafa");
const DIM    = new Color("#ffffff", 0.55);
const FAINT  = new Color("#ffffff", 0.26);
const RED    = new Color("#f87171");
const MON = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const WD  = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

let data = null;
try {
  const req = new Request(`https://${HOST}/widget.json?key=${KEY}`);
  req.timeoutInterval = 15;
  data = await req.loadJSON();
} catch (e) { data = null; }

const family = config.widgetFamily || "large";
const w = new ListWidget();
w.backgroundColor = BG;
w.setPadding(14, 15, 14, 15);
w.url = `https://${HOST}/admin`;
w.refreshAfterDate = new Date(Date.now() + 20 * 60 * 1000);   // обновление раз в 20 минут

if (!data || data.error) {
  const t = w.addText("Нет связи с панелью");
  t.font = Font.mediumSystemFont(13); t.textColor = DIM;
  Script.setWidget(w); Script.complete();
} else {

/* Подпись сегодняшней даты: «26 августа» */
const MON_G = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
function dateLabel() {
  const d = new Date(data.date + "T00:00:00");
  return `${d.getDate()} ${MON_G[d.getMonth()]}`;
}

/* ── Шапка ── */
function header(stack, right) {
  const h = stack.addStack();
  h.centerAlignContent();
  const b = h.addText("MASQUCERADE");
  b.font = Font.semiboldSystemFont(9); b.textColor = DIM;
  h.addSpacer();
  if (right) { const r = h.addText(right); r.font = Font.mediumSystemFont(10); r.textColor = FAINT; }
}

/* ── Строка дела: время + название ── */
function taskRow(stack, item, opts = {}) {
  const row = stack.addStack();
  row.centerAlignContent();
  if (item.time) {
    const t = row.addText(item.time);
    t.font = Font.boldSystemFont(opts.small ? 10 : 11);
    t.textColor = TEXT; t.lineLimit = 1;
    row.addSpacer(6);
  } else {
    const d = row.addText("•");
    d.font = Font.systemFont(opts.small ? 10 : 11); d.textColor = FAINT;
    row.addSpacer(6);
  }
  const n = row.addText(item.title);
  n.font = Font.systemFont(opts.small ? 10 : 11.5);
  n.textColor = opts.dim ? DIM : TEXT;
  n.lineLimit = 1;
  row.addSpacer();
}

/* ── Сетка месяца ── */
function monthGrid(stack, width) {
  const { y, m, days, overdueDays } = data.month;
  const todayN = Number(data.date.slice(8));
  const cw = Math.floor(width / 7);
  const ch = 17;

  const title = stack.addText(`${MON[m - 1]} ${y}`);
  title.font = Font.semiboldSystemFont(13); title.textColor = TEXT;
  stack.addSpacer(7);

  const wdRow = stack.addStack();
  WD.forEach(d => {
    const c = wdRow.addStack(); c.size = new Size(cw, 11); c.centerAlignContent();
    const t = c.addText(d); t.font = Font.systemFont(8); t.textColor = FAINT;
  });
  stack.addSpacer(3);

  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7;   // пн = 0
  const daysIn   = new Date(y, m, 0).getDate();
  let day = 1 - firstDow;
  for (let r = 0; r < 6 && day <= daysIn; r++) {
    const row = stack.addStack();
    for (let c = 0; c < 7; c++, day++) {
      const cell = row.addStack();
      cell.size = new Size(cw, ch);
      cell.centerAlignContent();
      if (day < 1 || day > daysIn) { cell.addSpacer(); continue; }
      const isToday = day === todayN;
      const busy    = !!days[day];
      const over    = overdueDays.includes(day);
      if (isToday) { cell.backgroundColor = TEXT; cell.cornerRadius = ch / 2; }
      const t = cell.addText(String(day));
      t.font = (isToday || busy) ? Font.boldSystemFont(10.5) : Font.systemFont(10.5);
      t.textColor = isToday ? BG : over ? RED : busy ? TEXT : FAINT;
    }
    stack.addSpacer(2);
  }
}

/* ── Колонка дел ── */
function tasksColumn(stack, limit, opts = {}) {
  const dt = new Date(data.date + "T00:00:00");
  const head = stack.addText(opts.title || `Сегодня · ${dt.getDate()} ${MON[dt.getMonth()].toLowerCase().slice(0, 3)}`);
  head.font = Font.semiboldSystemFont(12); head.textColor = TEXT;
  stack.addSpacer(6);

  const list = data.today.slice(0, limit);
  if (!list.length) {
    const e = stack.addText("На сегодня дел нет");
    e.font = Font.systemFont(10.5); e.textColor = FAINT;
  } else {
    list.forEach((item, i) => { taskRow(stack, item, opts); if (i < list.length - 1) stack.addSpacer(5); });
  }

  // Ближайшие — если сегодня свободно и место осталось
  const left = limit - list.length;
  if (left > 0 && data.upcoming.length) {
    stack.addSpacer(9);
    const h = stack.addText("Дальше");
    h.font = Font.semiboldSystemFont(10); h.textColor = FAINT;
    stack.addSpacer(4);
    data.upcoming.slice(0, left).forEach((u, i) => {
      const d = new Date(u.date + "T00:00:00");
      taskRow(stack, { time: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`, title: u.title },
        { dim: true, small: true });
      if (i < left - 1) stack.addSpacer(4);
    });
  }
}

/* ── Нижняя строка со счётчиками ── */
function footer(stack) {
  const f = stack.addStack();
  f.centerAlignContent();
  const parts = [];
  if (data.overdue) parts.push({ text: `${data.overdue} просрочено`, color: RED });
  if (data.free)    parts.push({ text: `${data.free} без даты`, color: DIM });
  if (data.orders)  parts.push({ text: `${data.orders} заявок`, color: DIM });
  if (data.perks.length) parts.push({ text: `оплата: ${data.perks[0].title}`, color: DIM });
  if (!parts.length) parts.push({ text: "всё закрыто", color: FAINT });
  parts.slice(0, 3).forEach((p, i) => {
    if (i) { const s = f.addText("  ·  "); s.font = Font.systemFont(9); s.textColor = FAINT; }
    const t = f.addText(p.text); t.font = Font.mediumSystemFont(9.5); t.textColor = p.color;
  });
  f.addSpacer();
}

if (family === "small") {
  const dt = new Date(data.date + "T00:00:00");
  header(w, null);
  w.addSpacer(6);
  const d = w.addText(String(dt.getDate()));
  d.font = Font.boldSystemFont(30); d.textColor = TEXT;
  const mo = w.addText(MON[dt.getMonth()].toLowerCase());
  mo.font = Font.mediumSystemFont(11); mo.textColor = DIM;
  w.addSpacer(8);
  const cnt = data.today.length;
  const c = w.addText(cnt ? `${cnt} ${cnt === 1 ? "дело" : cnt < 5 ? "дела" : "дел"} сегодня` : "дел нет");
  c.font = Font.semiboldSystemFont(11); c.textColor = cnt ? TEXT : FAINT;
  if (data.today[0]) {
    w.addSpacer(5);
    taskRow(w, data.today[0], { small: true });
  }
  w.addSpacer();
  footer(w);
} else if (family === "medium") {
  header(w, dateLabel());
  w.addSpacer(9);
  const row = w.addStack();
  const left = row.addStack(); left.layoutVertically(); left.size = new Size(150, 0);
  monthGrid(left, 150);
  row.addSpacer(14);
  const right = row.addStack(); right.layoutVertically();
  tasksColumn(right, 4);
  right.addSpacer();
  w.addSpacer(6);
  footer(w);
} else {
  header(w, dateLabel());
  w.addSpacer(10);
  const row = w.addStack();
  const left = row.addStack(); left.layoutVertically(); left.size = new Size(168, 0);
  monthGrid(left, 168);
  row.addSpacer(16);
  const right = row.addStack(); right.layoutVertically();
  tasksColumn(right, 7);
  right.addSpacer();
  w.addSpacer(8);
  footer(w);
}

if (config.runsInApp) await w.presentLarge();
Script.setWidget(w);
Script.complete();
}
