/* Prep Book: recipes, week plan, shopping list, prices and a hands-free cook mode. */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => '$' + (v >= 100 ? Math.round(v) : v.toFixed(2));

/* ---------------- icons ---------------- */
const I = {
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 21H20v-3"/><path d="M9 7.5h7M9 11h5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14h3M8 17h6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1a1 1 0 0 1 .7.3l7.4 7.4a1.6 1.6 0 0 1 0 2.3l-7.5 7.5a1.6 1.6 0 0 1-2.3 0l-7.1-7.1a1.3 1.3 0 0 1-.3-1.3z"/><circle cx="8.3" cy="8.3" r="1.6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4 0-7-2.7-7-6.6 0-3.2 2.3-5.1 3.6-7.4.4 1.6 1.4 2.6 2.4 2.9C11 7 12.4 4.6 14.6 3c-.2 2.8 1.2 4.6 2.6 6.1 1.3 1.4 1.8 3 1.8 4.8 0 4-3 7.1-7 7.1z"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
};

/* ---------------- saved state (stays on this phone) ---------------- */
const KEY = 'prepbook.v1';
const DEF = { plan: {}, serv: {}, got: {}, done: {}, hidePantry: true, filter: 'all', sort: 'easy', q: '', timers: [], step: {}, open: {}, seenCheck: null, hideInstall: false, updatedAt: 0 };
let S = loadState();
function loadState() {
  try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { ...DEF }; }
}
let lastSaved = '';
function save() {
  const j = syncedJSON();
  if (j !== lastSaved) { if (lastSaved) S.updatedAt = Date.now(); lastSaved = j; queuePush(); }
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: state lives for this session only */ }
}

/* ---------------- data ---------------- */
let R = [], RB = {}, P = null, MATCH = [], ROW = {}, DB = null;
async function getJSON(u) {
  const res = await fetch(u, { cache: 'no-cache' });
  if (!res.ok) throw new Error(u + ' ' + res.status);
  return res.json();
}
async function loadData() {
  R = await getJSON('recipes.json');
  RB = Object.fromEntries(R.map(r => [r.id, r]));
  await loadPrices();
}
function setPrices(d) {
  if (!d || !Array.isArray(d.rows)) return false;
  if (P && d.checked < P.checked) return false;  // keep whichever check is newer
  P = d;
  ROW = Object.fromEntries(P.rows.map(r => [r.id, r]));
  MATCH = (P.match || []).map(m => ({ row: m.row, re: new RegExp(m.re, 'i') }));
  return true;
}
async function loadPrices() {
  try { setPrices(await getJSON('prices.json')); } catch (e) { /* the database copy may still arrive */ }
  if (DB) {
    try { const snap = await DB.doc('app/prices').get(); if (snap.exists) setPrices(snap.data()); } catch (e) { /* keep the file copy */ }
  }
}

/* ---------------- stores and prices ---------------- */
const STORE = { W: 'Walmart', T: 'Target', C: 'Costco', A: 'Amazon' };
const storeName = (row, s) => s === 'X' ? (row.x && row.x.store) || 'Other' : (s === 'A' && row.cells.A && row.cells.A.store) || STORE[s];
function perUnit(v, unit) {
  const m = money(v);
  if (unit === 'lb' || unit === 'oz') return `${m}/${unit}`;
  if (unit === 'each') return `${m} each`;
  if (unit === 'egg') return `${m} an egg`;
  if (unit === 'can' || unit === 'container') return `${m} a ${unit}`;
  if (unit === 'half gal') return `${m} a half gallon`;
  if (unit === '5 g') return `${m} a 5 g scoop`;
  return `${m} per ${unit}`;
}
function bestOf(row) {
  const s = row.best && row.best[0];
  if (!s) return null;
  return { s, c: row.cells[s], name: storeName(row, s) };
}
function cheapAlt(row) { // cheaper option that isn't the chosen quality tier
  const b = bestOf(row);
  let alt = null;
  for (const [s, c] of Object.entries(row.cells)) {
    if (c.k !== 'alt' || c.up == null) continue;
    if (!alt || c.up < alt.c.up) alt = { s, c, name: storeName(row, s) };
  }
  if (alt && b && alt.c.up < b.c.up * 0.78) return alt;
  return null;
}
const dealsFor = rowIds => (P ? P.deals.filter(d => rowIds.has(d.row)) : []);
const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
function nextCheck(iso) { // runs on Wednesdays, at least 10 days after the last check
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + 10);
  while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ---------------- quantities ---------------- */
const FR = { '½': .5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': .25, '¾': .75, '⅛': .125 };
const NUM = '(?:\\d+(?:\\.\\d+)?(?:\\s?[½⅓⅔¼¾⅛])?|[½⅓⅔¼¾⅛])';
const QTY = new RegExp('^(' + NUM + ')(?:\\s*[–-]\\s*(' + NUM + '))?');
function num(s) {
  const m = String(s).trim().match(/^(\d+(?:\.\d+)?)?\s?([½⅓⅔¼¾⅛])?$/);
  if (!m || (!m[1] && !m[2])) return NaN;
  return (m[1] ? parseFloat(m[1]) : 0) + (m[2] ? FR[m[2]] : 0);
}
function fmtQ(v, metric) {
  if (metric) return String(v >= 20 ? Math.round(v / 5) * 5 : Math.round(v * 10) / 10);
  const w = Math.floor(v + 1e-9), r = v - w;
  const opts = [[0, ''], [.25, '¼'], [1 / 3, '⅓'], [.5, '½'], [2 / 3, '⅔'], [.75, '¾'], [1, '']];
  let best = opts[0], bd = 9;
  for (const o of opts) { const d = Math.abs(r - o[0]); if (d < bd) { bd = d; best = o; } }
  if (bd > .06) return String(Math.round(v * 10) / 10);
  const whole = best[0] === 1 ? w + 1 : w;
  return ((whole ? String(whole) : '') + best[1]) || '0';
}
const PLURAL = /^(\s+)(can|cup|clove|slice|handful|scoop|stick|thumb|bunch|head|sprig|packet|jar|bag|loaf)(s|es)?\b/i;
function scaleSeg(seg, f) {
  if (Math.abs(f - 1) < 1e-6) return seg;
  const m = seg.match(QTY);
  if (!m) return seg;
  const a = num(m[1]), b = m[2] ? num(m[2]) : null;
  if (isNaN(a)) return seg;
  let rest = seg.slice(m[0].length);
  const metric = /^\s?(g|kg|ml|l)\b/i.test(rest);
  const hi = (b ?? a) * f;
  rest = rest.replace(PLURAL, (all, sp, w, pl) => {
    const base = w.toLowerCase() === 'loaf' ? 'loaf' : w;
    if (hi > 1) return sp + (base === 'loaf' ? 'loaves' : /(ch|sh)$/i.test(base) ? base + 'es' : base + 's');
    return sp + base;
  });
  return fmtQ(a * f, metric) + (b != null ? '–' + fmtQ(b * f, metric) : '') + rest;
}
function splitLine(line) {
  let label = '', body = line;
  const m = line.match(/^([A-Z][A-Za-z' ]{1,26}):\s+(.+)$/);
  if (m) { label = m[1]; body = m[2]; }
  return { label, segs: body.split(/\s+·\s+/) };
}
const UNITS = [
  [/^fl\.?\s?oz\b/i, 'v', 1 / 8], [/^(lbs?|pounds?)\b/i, 'w', 1], [/^(oz|ounces?)\b/i, 'w', 1 / 16],
  [/^(g|grams?)\b/i, 'w', 1 / 453.6], [/^kg\b/i, 'w', 2.2046], [/^cups?\b/i, 'v', 1],
  [/^(tbsp|tablespoons?)\b/i, 'v', 1 / 16], [/^(tsp|teaspoons?)\b/i, 'v', 1 / 48], [/^ml\b/i, 'v', 1 / 236.6],
  [/^cans?\b/i, 'can', 1],
];
function amount(seg, f) { // -> {dim, v} in lb / cups / cans / count
  seg = seg.replace(/^(?:zest and )?juice of\s+/i, '');
  const m = seg.match(QTY);
  if (!m) return null;
  const a = num(m[1]), b = m[2] ? num(m[2]) : null;
  if (isNaN(a)) return null;
  const v = (b != null ? (a + b) / 2 : a) * f;
  const rest = seg.slice(m[0].length).trim().replace(/^(small|medium|large|big|heaping)\s+/i, '');
  for (const [re, dim, k] of UNITS) if (re.test(rest)) return { dim, v: v * k };
  if (/^(cloves?|slices?|handfuls?|scoops?|pinch|dash|bunch|pieces?|sticks?|thumbs?|packets?|jars?|bags?|heads?|sprigs?)\b/i.test(rest)) return null;
  return { dim: 'n', v };
}
function fmtAmounts(list) {
  const t = {};
  for (const a of list) if (a) t[a.dim] = (t[a.dim] || 0) + a.v;
  const out = [];
  const q4 = x => fmtQ(Math.max(.25, Math.round(x * 4) / 4));
  if (t.w) out.push(t.w < 1 ? fmtQ(Math.max(.5, Math.round(t.w * 32) / 2)) + ' oz' : (Math.round(t.w * 10) / 10) + ' lb');
  if (t.v) out.push(t.v >= .25 ? q4(t.v) + (t.v > 1.1 ? ' cups' : ' cup') : t.v * 16 >= 1 ? q4(t.v * 16) + ' tbsp' : q4(t.v * 48) + ' tsp');
  if (t.can) out.push(q4(t.can) + (t.can > 1.1 ? ' cans' : ' can'));
  if (t.n) out.push(String(Math.ceil(t.n - 1e-6)));
  return out.length ? 'Need ' + out.join(' + ') : '';
}
const DESCR = /\b(small|medium|large|big|fresh(ly)?|finely|roughly|chopped|minced|diced|sliced|grated|shredded|ripe|whole|raw|plain|organic|low[- ]sodium|reduced[- ]fat|fat[- ]free|nonfat|non-fat|full[- ]fat|softened|melted|cold|warm|warmed|cooked|uncooked|dry|thinly|crushed|heaping|packed|extra)\b/gi;
function baseName(seg) {
  let s = seg.replace(/^(?:zest and )?juice of\s+/i, '').replace(QTY, '').trim();
  for (let i = 0; i < 4; i++) s = s.replace(/^(fl\.?\s?oz|lbs?|oz|g|kg|ml|cups?|tbsp|tsp|cans?|cloves?|slices?|handfuls?|scoops?|pinch(es)?|dash(es)?|bunch(es)?|pieces?|sticks?|thumbs?|loaf|loaves|packs?|packets?|jars?|bags?|heads?|sprigs?|of|a|an|each|small|medium|large|big|heaping)\b\.?\s*/i, '');
  s = s.replace(/^\([^)]*\)\s*/, '');
  s = s.split(/,| — | – | \(|;| or | for | to taste/)[0];
  s = s.replace(DESCR, '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (s === 'garlic cloves' || s === 'garlic clove') s = 'garlic';
  if (s === 'black pepper' || s === 'ground black pepper') s = 'pepper';
  return s;
}
const PANTRY = /^(salt|pepper|black pepper|salt and pepper|salt & pepper|kosher salt|sea salt|flaky salt|garlic powder|onion powder|(smoked )?paprika|cumin|chil[il]i? powder|oregano|dried oregano|cinnamon|nutmeg|thyme|dried thyme|rosemary|italian seasoning|.*seasoning|red pepper flakes|chil[il]i flakes|cayenne|turmeric powder|ground (cinnamon|cumin|ginger|turmeric|black pepper|nutmeg|coriander|cloves|allspice|cardamom)|vanilla|vanilla extract|baking soda|baking powder|cornstarch|bay leaf|bay leaves|curry powder|sumac|za'?atar|allspice|cardamom|soy sauce|.*vinegar|hot sauce|sriracha|water|ice|ice cubes|.*\boil|.*spice.*|garlic salt|dried .*|mustard|dijon mustard|sesame seeds|cocoa powder|maple syrup|stevia|sweetener|sugar|brown sugar|coconut sugar|cooking spray|balsamic glaze|.*glaze)$/i;
const PANTRY_ROWS = new Set([21, 24, 32, 33, 34]);
const matchRow = text => { for (const m of MATCH) if (m.re.test(text)) return m.row; return null; };

/* ---------------- timers and alarm ---------------- */
const DUR = /(\d+(?:\.\d+)?\s?[½¼¾]?|[½¼¾]|\ban\b|\bone\b|\btwo\b|\bthree\b)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi;
function durSecs(n, unit) {
  const v = { an: 1, one: 1, two: 2, three: 3 }[String(n).toLowerCase()] ?? num(n);
  if (/^h/i.test(unit)) return Math.round(v * 3600);
  if (/^s/i.test(unit)) return Math.round(v);
  return Math.round(v * 60);
}
function durLabel(secs) {
  if (secs >= 3600) { const h = Math.floor(secs / 3600), m = Math.round((secs % 3600) / 60); return h + ' hr' + (m ? ' ' + m + ' min' : ''); }
  if (secs >= 60) return Math.round(secs / 60) + ' min';
  return secs + ' sec';
}
function stepTimers(text) {
  const out = [];
  text.replace(DUR, (all, a, b, u) => { const s = durSecs(a, u); if (s >= 10 && s <= 6 * 3600) out.push({ secs: s, text: all }); return all; });
  return out;
}
function stepHTML(text, rid, i) {
  return esc(text).replace(DUR, (all, a, b, u) => {
    const s = durSecs(a, u);
    if (s < 10 || s > 6 * 3600) return all;
    return `<button class="tchip" data-timer="${s}" data-rid="${rid}" data-step="${i}">${I.timer}${all}</button>`;
  });
}
const clock = ms => {
  const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
};

const alarm = (() => {
  let ctx = null, loop = 0;
  function ensure() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older iOS */ }
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
    return ctx;
  }
  function beep(t0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 988;
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    o.start(t0); o.stop(t0 + 0.24);
  }
  function burst() { if (!ctx) return; const t = ctx.currentTime + 0.03; beep(t); beep(t + 0.34); beep(t + 0.68); }
  return {
    prime() { // runs inside a tap, which is what lets the phone play sound later
      const c = ensure(); if (!c) return;
      if (c.state !== 'running') c.resume().catch(() => {});
      const o = c.createOscillator(), g = c.createGain(); g.gain.value = 0.0001;
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.02);
    },
    ring() {
      const c = ensure(); if (!c) return;
      if (c.state !== 'running') c.resume().catch(() => {});
      clearInterval(loop); burst(); loop = setInterval(burst, 1500);
      if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
    },
    stop() { clearInterval(loop); loop = 0; },
  };
})();

function startTimer(secs, rid, step) {
  alarm.prime();
  const r = RB[rid];
  const label = (r ? short(r.t) : 'Timer') + (step != null ? ', step ' + (step + 1) : '');
  S.timers.push({ id: Date.now() * 100 + Math.floor(Math.random() * 100), rid, step, label, total: secs, end: Date.now() + secs * 1000, ring: false });
  save(); if (!cookOpen) toast(durLabel(secs) + ' timer started'); tick(true);
}
function stopTimer(id) {
  S.timers = S.timers.filter(t => t.id !== id); save();
  if (!S.timers.some(t => t.ring)) alarm.stop();
  tick(true);
}
function addMinute(id) {
  const t = S.timers.find(x => x.id === id); if (!t) return;
  t.end = Math.max(t.end, Date.now()) + 60000; t.total += 60; t.ring = false; save();
  if (!S.timers.some(x => x.ring)) alarm.stop();
  tick(true);
}
function short(t) { return t.replace(/\s*\(.*\)$/, '').split(/ with | and | \+ /)[0]; }
let lastTimerHTML = '';
function tick(force) {
  const now = Date.now();
  let newRing = false;
  for (const t of S.timers) if (!t.ring && t.end <= now) { t.ring = true; newRing = true; }
  if (newRing) { save(); alarm.ring(); }
  renderTimerBar(force);
  if (cookOpen) renderCookTimers(force);
}
setInterval(tick, 250);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(true); if (cookOpen) keepAwake(true); } });

function renderTimerBar(force) {
  const bar = $('#timerbar');
  if (!S.timers.length || cookOpen) { bar.classList.add('hidden'); lastTimerHTML = ''; return; }
  const ringing = S.timers.find(t => t.ring);
  const t = ringing || S.timers.slice().sort((a, b) => a.end - b.end)[0];
  const more = S.timers.length - 1;
  const html = ringing
    ? `<div class="tt"><b>Time's up</b><small>${esc(t.label)}</small></div><button class="btn small" data-stop="${t.id}">Stop</button>`
    : `<div class="tt"><b>${clock(t.end - Date.now())}</b><small>${esc(t.label)}${more ? `, plus ${more} more` : ''}</small></div><button class="btn small" data-opencook="${t.rid}" data-step="${t.step ?? 0}">Open</button>`;
  bar.classList.remove('hidden');
  bar.classList.toggle('ring', !!ringing);
  if (force || html !== lastTimerHTML) { bar.innerHTML = html; lastTimerHTML = html; }
}

/* ---------------- keep the screen on while cooking ---------------- */
let wakeLock = null;
async function keepAwake(on) {
  if (on) {
    try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) { wakeLock = null; }
  } else {
    try { if (wakeLock) await wakeLock.release(); } catch (e) { /* already released */ }
    wakeLock = null;
  }
  return !!wakeLock;
}

/* ---------------- toast ---------------- */
let toastT = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------------- routing ---------------- */
const TABS = ['recipes', 'plan', 'shop', 'prices'];
const scrollMem = {};
let curRoute = '';
function go(h) {
  h = String(h || 'recipes').replace(/^#\/?/, '');
  if (curRoute) scrollMem[curRoute] = window.scrollY;
  curRoute = h;
  const [name, arg] = h.split('/');
  if (TABS.includes(name) && S.lastTab !== name) { S.lastTab = name; save(); }
  const tab = name === 'r' ? (S.lastTab || 'recipes') : name;
  $$('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (name === 'r' && RB[arg]) renderDetail(RB[arg]);
  else if (name === 'plan') renderPlan();
  else if (name === 'shop') renderShop();
  else if (name === 'prices') renderPrices();
  else { curRoute = 'recipes'; renderRecipes(); }
  updateDot();
  window.scrollTo(0, scrollMem[curRoute] || 0);
}
const route = () => go(curRoute || 'recipes');
function updateDot() {
  const fresh = P && P.deals.length && S.seenCheck !== P.checked;
  const a = $('.tabs a[data-tab="prices"]');
  let d = $('.dot', a);
  if (fresh && !d) a.insertAdjacentHTML('beforeend', '<span class="dot" aria-label="New deals"></span>');
  if (!fresh && d) d.remove();
}

/* ---------------- Recipes tab ---------------- */
const FILTERS = [['all', 'All'], ['breakfast', 'Breakfast'], ['main', 'Mains'], ['snack', 'Snacks'], ['drink', 'Drinks'], ['quick', '15 min or less'], ['plan', 'In my plan']];
const SORTS = [['easy', 'Easiest first'], ['protein', 'Most protein'], ['cheap', 'Cheapest a serving'], ['kcal', 'Fewest calories']];
function filtered() {
  const q = S.q.trim().toLowerCase();
  let list = R.filter(r => {
    if (S.filter === 'quick' && r.mins > 15) return false;
    if (S.filter === 'plan' && !S.plan[r.id]) return false;
    if (!['all', 'quick', 'plan'].includes(S.filter) && r.meal !== S.filter) return false;
    if (q && !(r.t + ' ' + r.tags.join(' ') + ' ' + r.ing.join(' ') + ' ' + r.u).toLowerCase().includes(q)) return false;
    return true;
  });
  const by = { easy: (a, b) => a.mins - b.mins || b.p - a.p, protein: (a, b) => b.p - a.p, cheap: (a, b) => a.cost - b.cost, kcal: (a, b) => a.kcal - b.kcal }[S.sort];
  return list.sort(by);
}
function isIOSBrowser() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone && !matchMedia('(display-mode: standalone)').matches;
}
function renderRecipes() {
  const v = $('#view');
  const install = isIOSBrowser() && !S.hideInstall
    ? `<div class="installcard"><p><b>Install Prep Book.</b> Tap ${I.share} Share at the bottom of Safari, then <b>Add to Home Screen</b>. It opens full screen and works without a connection.</p><button class="x" data-act="hideinstall" aria-label="Dismiss">×</button></div>` : '';
  v.innerHTML = `
    ${install}
    <header class="pagehead"><h1>Prep Book</h1><p>${R.length} recipes from your saves, sorted for the gym and the budget.</p></header>
    <label class="search">${I.search}<input id="q" type="search" placeholder="Search recipes or ingredients" value="${esc(S.q)}" autocomplete="off" enterkeyhint="search"></label>
    <div class="chips" role="tablist">${FILTERS.map(([k, l]) => `<button class="chip${S.filter === k ? ' on' : ''}" data-filter="${k}">${l}</button>`).join('')}</div>
    <div class="sortrow"><span id="count"></span><select id="sort" aria-label="Sort">${SORTS.map(([k, l]) => `<option value="${k}"${S.sort === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
    <div id="grid" class="grid"></div>`;
  fillGrid();
  $('#q').addEventListener('input', e => { S.q = e.target.value; save(); fillGrid(); });
  $('#sort').addEventListener('change', e => { S.sort = e.target.value; save(); fillGrid(); });
}
function fillGrid() {
  const list = filtered();
  $('#count').textContent = list.length === 1 ? '1 recipe' : list.length + ' recipes';
  $('#grid').innerHTML = list.length ? list.map(r => `
    <a class="card" href="#r/${r.id}">
      <div class="ph"><img src="${r.c}.jpg" alt="" loading="lazy" decoding="async">${S.plan[r.id] ? '<span class="badge">In plan</span>' : ''}</div>
      <div class="cb"><h3>${esc(r.t)}</h3>
        <div class="meta"><span><b>${r.p} g</b> protein</span><span><b>${money(r.cost)}</b></span><span>${r.mins} min</span></div>
      </div>
    </a>`).join('') : `<div class="empty" style="grid-column:1/-1"><h2>Nothing matches</h2><p>Try another word or filter.</p></div>`;
}

/* ---------------- Recipe detail ---------------- */
function servFor(r) { return S.serv[r.id] || r.srv; }
function ingRows(r, f) {
  return r.ing.map((line, i) => {
    const { label, segs } = splitLine(line);
    return { i, label, segs: segs.map(s => scaleSeg(s, f)) };
  });
}
function rowsForRecipe(r) {
  const ids = new Set();
  for (const line of r.ing) for (const seg of splitLine(line).segs) { const id = matchRow(seg); if (id != null) ids.add(id); }
  return [...ids].filter(id => ROW[id]);
}
function renderDetail(r) {
  const n = servFor(r), f = n / r.srv, done = new Set(S.done[r.id] || []);
  const inPlan = S.plan[r.id];
  const rows = rowsForRecipe(r).filter(id => !PANTRY_ROWS.has(id));
  const deals = dealsFor(new Set(rows));
  const v = $('#view');
  v.innerHTML = `
  <article class="detail">
    <div class="hero"><img src="${r.c}.jpg" alt="${esc(r.t)}"><button class="roundbtn back" data-act="back" aria-label="Back">${I.back}</button></div>
    <div class="dpad">
      <p class="credit">From <a href="https://www.instagram.com/p/${r.c}/" target="_blank" rel="noopener">@${esc(r.u)}</a> on Instagram</p>
      <h1>${esc(r.t)}</h1>
      <div class="tags">${r.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="macros">
        <div class="hl"><b>${r.p} g</b><span>protein</span></div><div><b>${r.kcal}</b><span>calories</span></div>
        <div><b>${r.cb} g</b><span>carbs</span></div><div><b>${r.f} g</b><span>fat</span></div>
      </div>
      <div class="facts"><span>Per serving</span><span><b>${money(r.cost)}</b> a serving</span><span><b>${r.mins} min</b> hands-on</span></div>
      <div class="dactions">
        <button class="btn primary big" data-act="cook">${I.flame} Start cooking</button>
        <button class="btn" data-act="plan">${inPlan ? `In your plan, ${inPlan === 1 ? 'one batch' : inPlan + ' batches'}` : 'Add to week plan'}</button>
      </div>
      <div class="sechead"><h2>Ingredients</h2>
        <div class="stepper"><button data-serv="-1" aria-label="Fewer servings"${n <= 1 ? ' disabled' : ''}>−</button><span>${n} serving${n === 1 ? '' : 's'}</span><button data-serv="1" aria-label="More servings">+</button></div>
      </div>
      <ul class="checklist" id="ings">${ingRows(r, f).map(x => `
        <li><label><input type="checkbox" data-ing="${x.i}"${done.has(x.i) ? ' checked' : ''}><span class="box">${I.check}</span>
          <span class="lt">${x.label ? `<span class="lab">${esc(x.label)}</span>` : ''}${x.segs.map(s => `<span class="seg">${esc(s)}</span>`).join('')}</span></label></li>`).join('')}
      </ul>
      ${f !== 1 ? `<p class="hint">Amounts scaled from ${r.srv} to ${n} servings. Cooking times stay the same.</p>` : ''}
      <div class="sechead"><h2>Steps</h2></div>
      <ol class="steps">${r.st.map((s, i) => `<li><span class="n">${i + 1}</span><p>${stepHTML(s, r.id, i)}</p></li>`).join('')}</ol>
      ${r.swap ? `<section class="swap"><h2>Cheaper swap</h2><p>${esc(r.swap)}</p></section>` : ''}
      ${rows.length ? `<div class="sechead"><h2>Where to buy</h2></div>
        ${deals.length ? `<div class="deals" style="margin:0 0 10px">${deals.map(dealHTML).join('')}</div>` : ''}
        <div class="buyrows">${rows.map(id => buyRowHTML(ROW[id])).join('')}</div>
        ${P ? `<p class="hint">Prices checked ${fmtDate(P.checked)}.</p>` : ''}` : ''}
    </div>
  </article>`;
}
function buyRowHTML(row) {
  const b = bestOf(row);
  const alt = cheapAlt(row);
  const x = row.x && row.x.beats ? row.x : null;
  const deal = P && b && P.deals.find(d => d.row === row.id && d.store === b.s);
  return `<div class="buyrow"><div><b>${esc(row.item)}</b><small>${b ? esc(prodName(b.c.prod)) : 'Not tracked at your stores'}</small>
      ${alt ? `<small>Not ${esc(row.tier)}: ${esc(alt.name)} ${perUnit(alt.c.up, row.unit)}</small>` : ''}
      ${x ? `<small>${esc(x.store)} is cheaper: ${perUnit(x.up, row.unit)}</small>` : ''}</div>
    <div class="r">${b ? `<b>${esc(b.name)}</b><small>${perUnit(b.c.up, row.unit)}${deal ? '<span class="dealtag">Deal</span>' : ''}</small>` : ''}</div></div>`;
}
function dealHTML(d) {
  const row = ROW[d.row];
  const where = d.store === 'X' ? (d.storeName || 'Other') : storeName(row, d.store);
  return `<div class="deal">${I.down}<p><b>${esc(d.item)}</b> at ${esc(where)}, ${perUnit(d.up, d.unit)}<small>${esc(cap(d.why))}${d.prod ? '. ' + esc(prodName(d.prod)) : ''}</small></p></div>`;
}
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const prodName = s => String(s || '').replace(/\s+·\s+/g, ', ');

/* ---------------- Cook mode ---------------- */
let cookOpen = null, cookStep = 0;
function openCook(rid, step) {
  const r = RB[rid]; if (!r) return;
  alarm.prime();
  cookOpen = r; cookStep = Math.min(step ?? (S.step[rid] || 0), r.st.length - 1);
  const el = $('#cook');
  el.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  keepAwake(true).then(ok => { const a = $('#cook .awake'); if (a && cookOpen) a.textContent = ok ? 'Screen stays on while this is open.' : 'Tip: turn Auto-Lock off while you cook so the screen stays on.'; });
  renderCook(true);
  renderTimerBar(true);
}
function closeCook() {
  cookOpen = null;
  $('#cook').classList.add('hidden');
  $('#cook').innerHTML = '';
  document.body.style.overflow = '';
  keepAwake(false);
  tick(true);
}
function renderCook(full) {
  const r = cookOpen, el = $('#cook');
  const total = r.st.length, done = cookStep >= total;
  S.step[r.id] = Math.min(cookStep, total - 1); save();
  const timers = done ? [] : stepTimers(r.st[cookStep]);
  el.innerHTML = `
    <div class="ctop"><button class="cx" data-cook="close" aria-label="Close cook mode">${I.x}</button>
      <div class="ct">${esc(r.t)}</div><button class="cing" data-cook="ings">Ingredients</button></div>
    <div class="prog">${r.st.map((s, i) => `<i class="${i <= cookStep ? 'on' : ''}"></i>`).join('')}</div>
    <div class="cbody" id="cbody">${done ? `
      <div class="cdone"><h2>That's the batch.</h2><p>${r.srv} servings. Portion it out while it's warm: most of these keep 4 days in the fridge and about 2 months frozen.</p></div>` : `
      <p class="cno">Step ${cookStep + 1} of ${total}</p>
      <p class="ctext">${stepHTML(r.st[cookStep], r.id, cookStep)}</p>
      ${timers.length ? `<div class="cstart">${timers.map(t => `<button data-timer="${t.secs}" data-rid="${r.id}" data-step="${cookStep}">${I.timer} Start ${durLabel(t.secs)} timer</button>`).join('')}</div>` : ''}`}
    </div>
    <div class="ctray" id="ctray"></div>
    <div class="cnav">
      <button class="prev" data-cook="prev"${cookStep === 0 ? ' disabled' : ''}>${I.back} Back</button>
      <button class="next" data-cook="${done ? 'finish' : 'next'}">${done ? 'Finish' : cookStep === total - 1 ? 'Last step done' : 'Next step'} ${done ? '' : I.next}</button>
    </div>
    <p class="awake">${wakeLock ? 'Screen stays on while this is open.' : 'Tip: turn Auto-Lock off while you cook so the screen stays on.'}</p>`;
  renderCookTimers(true);
  const body = $('#cbody');
  let x0 = null, y0 = null;
  body.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  body.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) cookNav(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
}
let lastCookTimers = '';
function renderCookTimers(force) {
  const tray = $('#ctray'); if (!tray) return;
  const list = S.timers.slice().sort((a, b) => (b.ring - a.ring) || a.end - b.end);
  const html = list.map(t => t.ring
    ? `<div class="ctimer ring"><div class="tt"><b>Time's up</b><small>${esc(t.label)}</small></div><button data-plus="${t.id}">+1 min</button><button data-stop="${t.id}">Stop</button></div>`
    : `<div class="ctimer"><div class="tt"><b>${clock(t.end - Date.now())}</b><small>${esc(t.label)}</small></div><button data-plus="${t.id}">+1 min</button><button data-stop="${t.id}" aria-label="Cancel timer">${I.x.replace('<svg', '<svg width="18" height="18"')}</button></div>`).join('');
  if (force || html !== lastCookTimers) { tray.innerHTML = html; lastCookTimers = html; }
}
function cookNav(d) {
  const total = cookOpen.st.length;
  const n = Math.max(0, Math.min(total, cookStep + d));
  if (n === cookStep) return;
  cookStep = n; renderCook();
}
function cookIngredients() {
  const r = cookOpen, f = servFor(r) / r.srv, done = new Set(S.done[r.id] || []);
  const sh = document.createElement('div');
  sh.className = 'sheet';
  sh.innerHTML = `<div class="panel"><div class="grab"></div><div class="sh"><h2>Ingredients</h2><button class="btn small" data-close>Done</button></div>
    <p class="hint" style="margin:-6px 0 12px">${servFor(r)} servings</p>
    <ul class="checklist">${ingRows(r, f).map(x => `<li><label><input type="checkbox" data-ing="${x.i}"${done.has(x.i) ? ' checked' : ''}><span class="box">${I.check}</span><span class="lt">${x.label ? `<span class="lab">${esc(x.label)}</span>` : ''}${x.segs.map(s => `<span class="seg">${esc(s)}</span>`).join('')}</span></label></li>`).join('')}</ul></div>`;
  sh.addEventListener('click', e => { if (e.target === sh || e.target.closest('[data-close]')) sh.remove(); });
  sh.addEventListener('change', e => { const i = e.target.dataset.ing; if (i != null) toggleDone(r.id, +i, e.target.checked); });
  document.body.appendChild(sh);
}
function toggleDone(rid, i, on) {
  const s = new Set(S.done[rid] || []);
  on ? s.add(i) : s.delete(i);
  S.done[rid] = [...s]; save();
}

/* ---------------- Plan tab ---------------- */
const STARTER = { enchilada: 1, eggbites: 1, garlicbutter: 1, greek: 1, cheesecakeoats: 1 };
function planList() { return Object.entries(S.plan).filter(([id, n]) => RB[id] && n > 0).map(([id, n]) => ({ r: RB[id], n })); }
function planRows() {
  const ids = new Set();
  for (const { r } of planList()) rowsForRecipe(r).forEach(id => { if (!PANTRY_ROWS.has(id)) ids.add(id); });
  return ids;
}
function prepRank(r) {
  const t = r.tags.join(' ');
  if (/Slow cooker/.test(t)) return 0;
  if (/Oven/.test(t)) return 1;
  if (/Air fryer/.test(t)) return 2;
  if (/Skillet|One pan|Batch/.test(t)) return 3;
  if (r.meal === 'drink') return 5;
  return 4;
}
const PREP_WHY = ['Starts first: it cooks unattended for hours.', 'Into the oven early so it bakes while you work the stove.', 'Air fryer runs on its own while you chop.', 'Stovetop work while the oven is busy.', 'No heat needed: assemble while things cool.', 'Blend or mix last.'];
function renderPlan() {
  const items = planList();
  const v = $('#view');
  if (!items.length) {
    v.innerHTML = `<header class="pagehead"><h1>Week plan</h1><p>Pick what you'll batch-cook this week and the shopping list builds itself.</p></header>
      <div class="empty"><h2>Nothing planned yet</h2><p>Add recipes from their pages, or start with the Sunday plan from your Prep Book: enchilada rice bake, garlic butter chicken pasta, Greek pasta salad, egg bites and cheesecake protein bowls.</p></div>
      <div class="dactions"><button class="btn primary big" data-act="starter">Use the Sunday plan</button><a class="btn" href="#recipes">Browse recipes</a></div>`;
    return;
  }
  let meals = 0, cost = 0, prot = 0;
  for (const { r, n } of items) { meals += r.srv * n; cost += r.cost * r.srv * n; prot += r.p * r.srv * n; }
  const deals = dealsFor(planRows());
  const order = items.slice().sort((a, b) => prepRank(a.r) - prepRank(b.r) || b.r.mins - a.r.mins);
  v.innerHTML = `
    <header class="pagehead"><h1>Week plan</h1><p>${items.length} recipe${items.length === 1 ? '' : 's'} to batch-cook.</p></header>
    <div class="summary"><div><b>${meals}</b><span>servings</span></div><div><b>${money(cost).replace(/\.\d\d$/, '')}</b><span>about ${money(cost / meals)} each</span></div><div><b>${Math.round(prot / meals)} g</b><span>protein a serving</span></div></div>
    ${deals.length ? `<div class="sechead"><h2>Deals on your list</h2></div><div class="deals" style="margin-top:0">${deals.map(dealHTML).join('')}</div>` : ''}
    <div class="sechead"><h2>Recipes</h2><button class="btn small ghost" data-act="clearplan">Clear plan</button></div>
    <div class="plist">${items.map(({ r, n }) => `
      <div class="pitem"><a href="#r/${r.id}"><img src="${r.c}.jpg" alt=""></a>
        <div class="pt"><a href="#r/${r.id}"><h3>${esc(r.t)}</h3></a><small>${r.srv * n} serving${r.srv * n === 1 ? '' : 's'}, ${r.p} g protein each</small></div>
        <div class="stepper sm"><button data-batch="${r.id}" data-d="-1" aria-label="One batch fewer">−</button><span>×${n}</span><button data-batch="${r.id}" data-d="1" aria-label="One batch more">+</button></div>
      </div>`).join('')}</div>
    <div style="margin-top:14px"><a class="btn primary big full" href="#shop">${I.bag} Shopping list</a></div>
    <div class="sechead"><h2>Prep day order</h2></div>
    <ol class="order">${order.map(({ r }, i) => `<li><span class="n">${i + 1}</span><p><a href="#r/${r.id}" style="color:inherit;text-decoration:none"><b>${esc(r.t)}</b></a><small>${PREP_WHY[prepRank(r)]} ${r.mins} min hands-on.</small></p></li>`).join('')}</ol>`;
}

/* ---------------- Shop tab ---------------- */
function buildList() {
  const tracked = new Map(), other = new Map(), pantry = new Map();
  for (const { r, n } of planList()) {
    const f = (servFor(r) / r.srv) * n;
    for (const line of r.ing) {
      const { label, segs } = splitLine(line);
      const optional = /optional/i.test(label);
      for (const raw of segs) {
        if (/^(optional|to serve)\b/i.test(raw)) continue;
        const seg = raw.replace(/\s*\(optional\)/i, '');
        const rowId = matchRow(seg);
        const name = baseName(seg);
        const amt = amount(seg, f);
        const isPantry = (rowId != null && PANTRY_ROWS.has(rowId)) || (rowId == null && PANTRY.test(name));
        if (rowId != null && ROW[rowId] && !PANTRY_ROWS.has(rowId)) {
          const e = tracked.get(rowId) || { key: 'r' + rowId, row: ROW[rowId], amts: [], texts: [], uses: new Set() };
          e.amts.push(amt); e.texts.push(scaleSeg(seg, f)); e.uses.add(short(r.t)); tracked.set(rowId, e);
        } else {
          const map = isPantry ? pantry : other;
          const k = rowId != null && ROW[rowId] ? 'row' + rowId : name || seg.toLowerCase();
          const e = map.get(k) || { key: 'n:' + k, name: rowId != null && ROW[rowId] ? ROW[rowId].item : cap(name || seg), amts: [], texts: [], uses: new Set(), optional };
          e.amts.push(amt); e.texts.push(scaleSeg(seg, f)); e.uses.add(short(r.t)); if (!optional) e.optional = false; map.set(k, e);
        }
      }
    }
  }
  return { tracked: [...tracked.values()], other: [...other.values()], pantry: [...pantry.values()] };
}
function amountText(e) {
  const known = e.amts.filter(a => a);
  if (!known.length) return e.texts.length === 1 ? e.texts[0] : [...new Set(e.texts)].join('; ');
  const rest = e.texts.filter((t, i) => !e.amts[i]);
  const extra = rest.filter(t => /\d/.test(t));
  const taste = rest.length > extra.length;
  return fmtAmounts(known) + (extra.length ? ', plus ' + extra.join('; ') : '') + (taste ? ', plus some to taste' : '');
}
function itemHTML(e, extra) {
  const got = !!S.got[e.key];
  return `<li><label><input type="checkbox" data-got="${esc(e.key)}"${got ? ' checked' : ''}><span class="box">${I.check}</span>
    <span class="lt"><b>${esc(e.row ? e.row.item : e.name)}</b>${e.optional ? ' <span class="muted">(optional)</span>' : ''}
    <small>${esc(amountText(e))}</small>${extra || ''}<small>For ${esc([...e.uses].join(', '))}</small></span></label></li>`;
}
function renderShop() {
  const v = $('#view');
  const items = planList();
  if (!items.length) {
    v.innerHTML = `<header class="pagehead"><h1>Shopping list</h1><p>Built from your week plan.</p></header>
      <div class="empty"><h2>Your list is empty</h2><p>Plan a few recipes first and everything you need shows up here, grouped by the store with the best price.</p></div>
      <a class="btn primary big full" href="#plan">Go to week plan</a>`;
    return;
  }
  const L = buildList();
  const byStore = new Map();
  for (const e of L.tracked) {
    const b = bestOf(e.row);
    const st = b ? b.name : 'Any store';
    if (!byStore.has(st)) byStore.set(st, []);
    byStore.get(st).push(e);
  }
  const stores = [...byStore.entries()].sort((a, b) => b[1].length - a[1].length);
  const deals = dealsFor(new Set(L.tracked.map(e => e.row.id)));
  const left = [...L.tracked, ...L.other, ...(S.hidePantry ? [] : L.pantry)].filter(e => !S.got[e.key]).length;
  v.innerHTML = `
    <header class="pagehead"><h1>Shopping list</h1><p>${left ? `${left} item${left === 1 ? '' : 's'} left` : 'All done'} for ${items.length} recipe${items.length === 1 ? '' : 's'}.</p></header>
    <div class="toggle"><span>Hide pantry basics<br><small class="muted">Spices, oils, honey, flour</small></span><span class="switch"><input type="checkbox" id="hidePantry"${S.hidePantry ? ' checked' : ''} aria-label="Hide pantry basics"><i></i></span></div>
    ${deals.length ? `<div class="deals">${deals.map(dealHTML).join('')}</div>` : ''}
    ${stores.map(([st, list]) => `
      <div class="storehead"><h2>${esc(st)}</h2><span>${list.length} item${list.length === 1 ? '' : 's'}</span></div>
      <ul class="checklist">${list.map(e => {
        const b = bestOf(e.row), alt = cheapAlt(e.row), x = e.row.x && e.row.x.beats ? e.row.x : null;
        const deal = P && b && P.deals.find(d => d.row === e.row.id && d.store === b.s);
        const extra = (b ? `<small>${esc(prodName(b.c.prod))}, ${perUnit(b.c.up, e.row.unit)}${deal ? '<span class="dealtag">Deal</span>' : ''}</small>` : '')
          + (alt ? `<small>Not ${esc(e.row.tier)}: <b class="muted">${esc(alt.name)} ${perUnit(alt.c.up, e.row.unit)}</b></small>` : '')
          + (x ? `<small>${esc(x.store)} has it for ${perUnit(x.up, e.row.unit)}</small>` : '');
        return itemHTML(e, extra);
      }).join('')}</ul>`).join('')}
    ${L.other.length ? `<div class="storehead"><h2>Anywhere</h2><span>${L.other.length} item${L.other.length === 1 ? '' : 's'}</span></div><ul class="checklist">${L.other.sort((a, b) => a.name.localeCompare(b.name)).map(e => itemHTML(e)).join('')}</ul>` : ''}
    ${!S.hidePantry && L.pantry.length ? `<div class="storehead"><h2>Check the pantry</h2><span>${L.pantry.length}</span></div><ul class="checklist">${L.pantry.sort((a, b) => a.name.localeCompare(b.name)).map(e => itemHTML(e)).join('')}</ul>` : ''}
    <div class="btnrow" style="margin-top:18px"><button class="btn" data-act="sharelist">${I.share} Share list</button><button class="btn" data-act="uncheck">Uncheck all</button></div>
    ${P ? `<p class="note">Store picks use the cheapest price at your quality tier (organic, pasture-raised, grass-fed), checked ${fmtDate(P.checked)}. Costco prices are warehouse estimates.</p>` : ''}`;
  $('#hidePantry').addEventListener('change', e => { S.hidePantry = e.target.checked; save(); renderShop(); });
}
async function shareList() {
  const L = buildList();
  const lines = [];
  const byStore = new Map();
  for (const e of L.tracked) { const b = bestOf(e.row); const st = b ? b.name : 'Any store'; (byStore.get(st) || byStore.set(st, []).get(st)).push(e); }
  for (const [st, list] of byStore) {
    const todo = list.filter(e => !S.got[e.key]); if (!todo.length) continue;
    lines.push(st + ':'); todo.forEach(e => lines.push('- ' + e.row.item + ' (' + amountText(e) + ')')); lines.push('');
  }
  const rest = [...L.other, ...(S.hidePantry ? [] : L.pantry)].filter(e => !S.got[e.key]);
  if (rest.length) { lines.push('Anywhere:'); rest.forEach(e => lines.push('- ' + e.name + ' (' + amountText(e) + ')')); }
  const text = lines.join('\n').trim();
  try { if (navigator.share) { await navigator.share({ title: 'Shopping list', text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast('List copied. Paste it into Notes or a message.'); return; } catch (e) { /* show it instead */ }
  const sh = document.createElement('div');
  sh.className = 'sheet';
  sh.innerHTML = `<div class="panel"><div class="grab"></div><div class="sh"><h2>Shopping list</h2><button class="btn small" data-close>Done</button></div>
    <p class="hint" style="margin:-6px 0 10px">Select the text and copy it.</p><textarea id="listtext" class="listtext" readonly></textarea></div>`;
  $('#listtext', sh).value = text;
  sh.addEventListener('click', ev => { if (ev.target === sh || ev.target.closest('[data-close]')) sh.remove(); });
  document.body.appendChild(sh);
  $('#listtext', sh).select();
}

/* ---------------- Prices tab ---------------- */
function renderPrices() {
  const v = $('#view');
  if (!P) { v.innerHTML = `<header class="pagehead"><h1>Prices</h1></header><div class="empty"><h2>Prices didn't load</h2><p>Connect to the internet once and they'll be saved for offline use.</p></div>`; return; }
  if (S.seenCheck !== P.checked) { S.seenCheck = P.checked; save(); updateDot(); }
  const groups = {};
  P.rows.forEach(r => (groups[r.g] = groups[r.g] || []).push(r));
  v.innerHTML = `
    <header class="pagehead"><h1>Prices</h1><p>Checked ${fmtDate(P.checked)} at Walmart, Target, Costco, Amazon and Whole Foods. Next check ${nextCheck(P.checked)}.</p></header>
    <label class="search">${I.search}<input id="pq" type="search" placeholder="Find an ingredient" autocomplete="off"></label>
    <div class="sechead"><h2>Deals right now</h2><button class="btn small ghost" data-act="refresh">Refresh</button></div>
    ${P.deals.length ? `<div class="deals" style="margin-top:0">${P.deals.map(dealHTML).join('')}</div>` : `<p class="muted" style="margin:0">No price drops since the last check.</p>`}
    <div id="pgroups">${Object.entries(groups).map(([g, rows]) => `
      <section class="pgroup" data-g="${esc(g)}"><h2>${esc(g)}</h2>${rows.map(priceRowHTML).join('')}</section>`).join('')}</div>
    ${P.missed && P.missed.length ? `<p class="note">Not found on the last check, so the older price is shown: ${esc(P.missed.map(m => m.replace(/\s*\(.*$/, '')).join(', '))}.</p>` : ''}
    <p class="note">${esc(P.note || '')} Prices are what each store's website showed for delivery or pickup near Glen Burnie, MD and can differ in store.</p>`;
  $('#pq').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    $$('.prow').forEach(el => el.classList.toggle('hidden', !!q && !el.dataset.n.includes(q)));
    $$('.pgroup').forEach(g => g.classList.toggle('hidden', !$$('.prow:not(.hidden)', g).length));
  });
}
function priceRowHTML(row) {
  const b = bestOf(row), open = S.open[row.id];
  const deal = P.deals.find(d => d.row === row.id);
  const cells = ['W', 'T', 'C', 'A'].map(s => [s, row.cells[s]]).filter(([, c]) => c);
  if (row.x && row.x.up != null) cells.push(['X', row.x]);
  return `<div class="prow" data-n="${esc(row.item.toLowerCase())}">
    <button data-prow="${row.id}" aria-expanded="${!!open}"><span class="nm"><b>${esc(row.item)}</b><small>${esc(cap(row.tier))}</small></span>
      <span class="bp">${b ? `<b>${perUnit(b.c.up, row.unit)}</b><small>${esc(b.name)}${deal ? '<span class="dealtag">Deal</span>' : ''}</small>` : '<small>Not stocked at this tier</small>'}</span></button>
    ${open ? `<div class="cells">${cells.map(([s, c]) => cellHTML(row, s, c)).join('')}</div>` : ''}</div>`;
}
function cellHTML(row, s, c) {
  const name = s === 'X' ? c.store : storeName(row, s);
  const isBest = row.best.includes(s);
  if (s !== 'X' && c.k === 'none') return `<div class="cellrow off"><div class="s"><b>${esc(name)}</b><small>${esc(prodName(c.prod) || 'Not stocked')}</small></div><div class="v"><small>Not stocked</small></div></div>`;
  const notes = [];
  if (s !== 'X' && c.k === 'alt') notes.push(c.note ? cap(c.note) : 'Different quality tier');
  if (c.est) notes.push('Warehouse estimate');
  if (c.was) notes.push('On sale, was ' + money(c.was));
  if (c.stale) notes.push('Not found ' + fmtDate(P.checked) + ', last seen ' + fmtDate(c.seen));
  if (c.prev != null && c.up != null && Math.abs(c.prev - c.up) >= 0.01) notes.push((c.up < c.prev ? 'Down from ' : 'Up from ') + perUnit(c.prev, row.unit));
  return `<div class="cellrow${isBest ? ' best' : ''}${s !== 'X' && c.k === 'alt' ? ' off' : ''}"><div class="s"><b>${esc(name)}</b><small>${esc(prodName(c.prod))}</small>${notes.map(n => `<small>${esc(n)}</small>`).join('')}</div>
    <div class="v"><b>${c.up != null ? perUnit(c.up, row.unit) : '—'}</b>${c.p != null ? `<small>${money(c.p)} a pack</small>` : ''}</div></div>`;
}

/* ---------------- events ---------------- */
document.addEventListener('click', e => {
  const t = e.target.closest('button, a');
  if (!t) return;
  const d = t.dataset;
  const href = t.tagName === 'A' ? t.getAttribute('href') : null;
  if (href && href.startsWith('#')) { e.preventDefault(); go(href.slice(1)); return; }
  if (d.timer) { e.preventDefault(); startTimer(+d.timer, d.rid, d.step != null ? +d.step : null); if (cookOpen) renderCookTimers(true); return; }
  if (d.stop) { stopTimer(+d.stop); return; }
  if (d.plus) { addMinute(+d.plus); return; }
  if (d.opencook) { openCook(d.opencook, +d.step); return; }
  if (d.filter) { S.filter = d.filter; save(); $$('.chip').forEach(c => c.classList.toggle('on', c === t)); fillGrid(); return; }
  if (d.serv) {
    const r = RB[curRoute.split('/')[1]]; if (!r) return;
    S.serv[r.id] = Math.max(1, servFor(r) + +d.serv); if (S.serv[r.id] === r.srv) delete S.serv[r.id];
    save(); const y = window.scrollY; renderDetail(r); window.scrollTo(0, y); return;
  }
  if (d.batch) {
    const n = (S.plan[d.batch] || 0) + +d.d;
    if (n <= 0) delete S.plan[d.batch]; else S.plan[d.batch] = Math.min(n, 6);
    save(); const y = window.scrollY; renderPlan(); window.scrollTo(0, y); return;
  }
  if (d.prow) { S.open[d.prow] = !S.open[d.prow]; save(); const el = t.closest('.prow'); el.outerHTML = priceRowHTML(ROW[d.prow]); return; }
  if (d.cook) {
    if (d.cook === 'close' || d.cook === 'finish') { if (d.cook === 'finish') { S.step[cookOpen.id] = 0; delete S.done[cookOpen.id]; save(); } closeCook(); return; }
    if (d.cook === 'next') cookNav(1);
    if (d.cook === 'prev') cookNav(-1);
    if (d.cook === 'ings') cookIngredients();
    return;
  }
  switch (d.act) {
    case 'back': go(S.lastTab || 'recipes'); break;
    case 'cook': { const r = RB[curRoute.split('/')[1]]; if (r) openCook(r.id); break; }
    case 'plan': {
      const r = RB[curRoute.split('/')[1]]; if (!r) break;
      if (S.plan[r.id]) { S.plan[r.id] += 1; toast(`${S.plan[r.id]} batches in your plan`); } else { S.plan[r.id] = 1; toast('Added to week plan'); }
      save(); const y = window.scrollY; renderDetail(r); window.scrollTo(0, y); break;
    }
    case 'starter': S.plan = { ...STARTER }; save(); renderPlan(); toast('Sunday plan added'); break;
    case 'clearplan':
      if (t.dataset.armed) { S.plan = {}; S.got = {}; save(); renderPlan(); toast('Plan cleared'); }
      else { t.dataset.armed = '1'; t.textContent = 'Tap again to clear'; t.classList.add('danger'); setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = 'Clear plan'; t.classList.remove('danger'); } }, 3000); }
      break;
    case 'uncheck': S.got = {}; save(); renderShop(); break;
    case 'sharelist': shareList(); break;
    case 'hideinstall': S.hideInstall = true; save(); t.closest('.installcard').remove(); break;
    case 'refresh': t.disabled = true; t.textContent = 'Checking'; loadPrices().then(() => { renderPrices(); toast('Prices checked ' + fmtDate(P.checked)); }); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.ing != null && !t.closest('.sheet')) { const r = RB[curRoute.split('/')[1]]; if (r) toggleDone(r.id, +t.dataset.ing, t.checked); }
  if (t.dataset.got) {
    if (t.checked) S.got[t.dataset.got] = 1; else delete S.got[t.dataset.got];
    save();
    const left = $$('[data-got]').filter(x => !x.checked).length;
    const p = $('.pagehead p'); if (p) p.textContent = (left ? `${left} item${left === 1 ? '' : 's'} left` : 'All done') + p.textContent.replace(/^.*? for /, ' for ');
  }
});

/* ---------------- sync: plan and list follow you between devices ---------------- */
const SYNCED = ['plan', 'serv', 'got', 'done'];
let stateRef = null, pushing = Promise.resolve(), lastPushed = '', pushT = 0;
const syncedJSON = () => JSON.stringify(SYNCED.map(k => S[k]));
function queuePush() {
  if (!stateRef) return;
  clearTimeout(pushT);
  pushT = setTimeout(() => {
    const j = syncedJSON();
    if (j === lastPushed) return;
    const body = { updatedAt: S.updatedAt || Date.now() };
    SYNCED.forEach(k => { body[k] = S[k]; });
    lastPushed = j;
    pushing = pushing.then(() => stateRef.set(body)).catch(() => { lastPushed = ''; });
  }, 900);
}
function adoptRemote(d) {
  if (!d || (d.updatedAt || 0) <= (S.updatedAt || 0)) return false;
  SYNCED.forEach(k => { if (d[k] && typeof d[k] === 'object') S[k] = JSON.parse(JSON.stringify(d[k])); });
  S.updatedAt = d.updatedAt;
  lastPushed = lastSaved = syncedJSON();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  return true;
}
async function connect() {
  if (!window.claude || !window.claude.use) return;
  let db = null, user = null;
  try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { return; }
  if (!db) return;
  DB = db;
  db.doc('app/prices').onSnapshot(snap => {
    if (snap.exists && setPrices(snap.data())) {
      updateDot();
      if (!cookOpen && /^(prices|plan|shop|r\/)/.test(curRoute)) { const y = window.scrollY; route(); window.scrollTo(0, y); }
    }
  }, () => {});
  const uid = user ? await user.id() : null;
  if (!uid) return;
  stateRef = db.doc('data/users/' + uid + '/state');
  let first = true;
  stateRef.onSnapshot(snap => {
    const d = snap.exists ? snap.data() : null;
    if (snap.metadata && snap.metadata.hasPendingWrites) return;
    if (d && adoptRemote(d)) { if (!cookOpen) { const y = window.scrollY; route(); window.scrollTo(0, y); } }
    else if (first && (S.updatedAt || 0) > ((d && d.updatedAt) || 0)) queuePush();
    first = false;
  }, () => { stateRef = null; });
}

/* ---------------- start ---------------- */
async function start() {
  $('#nav').innerHTML = [['recipes', 'Recipes', I.book], ['plan', 'Plan', I.cal], ['shop', 'Shop', I.bag], ['prices', 'Prices', I.tag]]
    .map(([k, l, ic]) => `<a href="#${k}" data-tab="${k}">${ic}<span>${l}</span></a>`).join('');
  lastSaved = syncedJSON();
  connect();
  try { await loadData(); } catch (e) {
    $('#view').innerHTML = `<div class="empty"><h2>Couldn't load the recipes</h2><p>Check your connection and open the page again.</p></div>`;
    return;
  }
  const first = (location.hash || '').replace('#', '');
  go(TABS.includes(first) ? first : (S.lastTab || 'recipes'));
  tick(true);
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden || !P) return;
    const before = P.checked;
    await loadPrices();
    if (P && P.checked !== before) { updateDot(); if (!cookOpen && /^(prices|plan|shop)/.test(curRoute)) route(); }
  });
}
start();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
