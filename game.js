(() => {
const $ = id => document.getElementById(id);
let PH = [];
// ---- תמונות נעולות בקוד ----
const PKEY = 'milim-photokey';
async function deriveKey(code, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 200000 }, base, 256));
}
let DAT = null;
async function getDat() {
  if (!DAT) { const r = await fetch('photos.txt'); if (!r.ok) throw new Error('no photos'); const t = (await r.text()).trim(); const bin = atob(t); DAT = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) DAT[i] = bin.charCodeAt(i); }
  return DAT;
}
async function unlock(code) {
  const d = await getDat(), dv = new DataView(d.buffer);
  const salt = d.slice(4, 20);
  let raw = null;
  if (code) raw = await deriveKey(code, salt);
  else { try { const s = localStorage.getItem(PKEY); if (s) raw = Uint8Array.from(atob(s), c => c.charCodeAt(0)); } catch (e) {} }
  if (!raw) return false;
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const n = dv.getUint32(20, true); let o = 24; const urls = [];
  for (let i = 0; i < n; i++) {
    const iv = d.slice(o, o + 12), len = dv.getUint32(o + 12, true), ct = d.slice(o + 16, o + 16 + len); o += 16 + len;
    try { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct); urls.push(URL.createObjectURL(new Blob([pt], { type: 'image/jpeg' }))); }
    catch (e) { if (i === 0) { try { localStorage.removeItem(PKEY); } catch (_) {} return false; } }
  }
  PH = urls;
  try { localStorage.setItem(PKEY, btoa(String.fromCharCode(...raw))); } catch (e) {}
  if (LV) drawBg(S.level);
  return true;
}
async function initPhotos() {
  const h = decodeURIComponent((location.hash || '').slice(1)).trim();
  if (h) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
  try { if (h && await unlock(h)) return; await unlock(); } catch (e) {}
}
const THEMES = [
  { n: 'זריחה', sky: ['#ffb88c', '#de6262'], hills: ['#9b4d6b', '#6f3a5c', '#4a2847'], sun: '#ffe7a0', fill: '#c2456b' },
  { n: 'שמיים כחולים', sky: ['#56ccf2', '#2f80ed'], hills: ['#6fcf97', '#27ae60', '#1e8449'], sun: '#fff6c8', fill: '#2e62c9' },
  { n: 'שקיעה בים', sky: ['#fbd786', '#f7797d'], hills: ['#4e7fae', '#35628e', '#234a70'], sun: '#fff2c4', fill: '#e0614f' },
  { n: 'יער', sky: ['#a8e063', '#56ab2f'], hills: ['#3d8b3d', '#2c6e2c', '#1d4f1d'], sun: '#fdffd6', fill: '#2c7a3d' },
  { n: 'סתיו', sky: ['#f6d365', '#fda085'], hills: ['#c0632b', '#9c4a1f', '#6e3214'], sun: '#fff8d6', fill: '#c0632b' },
  { n: 'לילה זרוע כוכבים', sky: ['#141e30', '#243b55'], hills: ['#2e4a6b', '#203853', '#14253a'], sun: '#f4f1d6', fill: '#5a6fd8', night: 1 },
  { n: 'פריחה', sky: ['#fbc2eb', '#a6c1ee'], hills: ['#e58bb5', '#c1679a', '#9a4c7b'], sun: '#fffbe8', fill: '#b5508a' },
  { n: 'מדבר', sky: ['#f9d29d', '#ffd8cb'], hills: ['#e0a96d', '#c98b4b', '#a46b33'], sun: '#fffbe0', fill: '#b06f2c' },
  { n: 'שלג', sky: ['#e6f0ff', '#a9c6e8'], hills: ['#ffffff', '#dfe9f5', '#c3d5ea'], sun: '#fffdf0', fill: '#4a78b8' },
  { n: 'אגם', sky: ['#43cea2', '#185a9d'], hills: ['#2a8f8a', '#1f6f73', '#145257'], sun: '#eafff6', fill: '#1f7a8c' },
];
const LPC = 12;
const chapter = lv => Math.floor((lv - 1) / LPC);
const theme = lv => THEMES[chapter(lv) % THEMES.length];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function hillPath(seed, base, amp) {
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let d = `M0 ${base}`; const n = 6;
  for (let i = 1; i <= n; i++) { const x = (i / n) * 400, cx = x - 400 / n / 2; d += ` Q${cx} ${base - amp * (0.4 + r())} ${x} ${base - amp * r() * 0.5}`; }
  return d + ' L400 800 L0 800 Z';
}
function drawBg(lv) {
  const t = theme(lv), ch = chapter(lv);
  document.documentElement.style.setProperty('--fill', t.fill);
  document.querySelector('meta[name=theme-color]').content = t.sky[0];
  if (PH.length) { const u = PH[(ch * 5) % PH.length]; $('bg').innerHTML = `<div class="phb" style="background-image:url('${u}')"></div><div class="ph" style="background-image:url('${u}')"></div>`; return; }
  let stars = '';
  if (t.night) for (let i = 0; i < 60; i++) stars += `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 420}" r="${(i % 3) * 0.6 + 0.6}" fill="#fff" opacity="${0.4 + (i % 5) / 8}"/>`;
  $('bg').innerHTML = `<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[0]}"/><stop offset="1" stop-color="${t.sky[1]}"/></linearGradient></defs>
  <rect width="400" height="800" fill="url(#g)"/>${stars}<circle cx="${290 - (ch % 3) * 60}" cy="170" r="48" fill="${t.sun}" opacity=".9"/>
  ${t.hills.map((c, i) => `<path d="${hillPath(ch * 3 + i + 1, 470 + i * 110, 120 - i * 20)}" fill="${c}" opacity=".9"/>`).join('')}</svg>`;
}

// ---- מצב ----
const KEY = 'milim-v1';
let S = { level: 1, coins: 200, found: [], cells: [], bonus: [], jar: 0, snd: true, vib: true, big: true, diff: 'mid', total: 0, gift: '' };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ---- צלילים: פעמונים חמים ----
let AC, MASTER;
function ac() {
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); MASTER = AC.createGain(); MASTER.gain.value = 0.9; MASTER.connect(AC.destination); }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function bell(f, delay = 0, vol = 0.18, dur = 1.1) {
  if (!S.snd) return;
  try {
    const a = ac(), t = a.currentTime + delay;
    [[1, 1, 'sine'], [2, 0.35, 'sine'], [3, 0.12, 'triangle'], [4.2, 0.05, 'sine']].forEach(([m, v, type]) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = f * m;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * v, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / m);
      o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + dur + 0.05);
    });
  } catch (e) {}
}
function tone(f, d = 0.12, type = 'sine', vol = 0.15, delay = 0, slide) {
  if (!S.snd) return;
  try {
    const a = ac(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + d + 0.02);
  } catch (e) {}
}
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
const SFX = {
  pick: i => bell(SCALE[Math.min(i, 7)], 0, 0.12, 0.5),
  ok: n => { [0, 2, 4, 5, 7].slice(0, Math.max(3, Math.min(5, n))).forEach((k, i) => bell(SCALE[k], i * 0.09, 0.16)); },
  land: i => bell(SCALE[Math.min(i + 2, 7)] * 2, 0, 0.06, 0.3),
  bad: () => { tone(220, 0.18, 'triangle', 0.1, 0, 160); tone(180, 0.22, 'triangle', 0.08, 0.12, 130); },
  bonus: () => [783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => bell(f, i * 0.06, 0.1, 0.6)),
  coin: () => { bell(1975.5, 0, 0.07, 0.25); bell(2637, 0.05, 0.05, 0.3); },
  whoosh: () => tone(300, 0.35, 'sine', 0.08, 0, 900),
  win: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.14, 0.18, 1.4));
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(f => bell(f, 0.7, 0.1, 2.2));
    for (let i = 0; i < 8; i++) bell(2000 + Math.random() * 1500, 0.8 + i * 0.07, 0.03, 0.4);
  },
};
const vib = p => { if (S.vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

// ---- כלים קטנים ----
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800); }
function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function setCoins(n) { S.coins = n; $('coins').textContent = n; save(); }
const CHEERS = ['יפה!', 'מעולה!', 'מצוין!', 'אלופה!', 'מדהים!', 'כל הכבוד!', 'וואו!', 'גאונה!'];
function cheer(t) { const c = $('cheer'); c.textContent = t; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); }
const disp = n => n.slice(0, -1) + (TOFIN[n.slice(-1)] || n.slice(-1));

// ---- שלב ----
let LV, cellMap, cellEls, sz = 50;
function startLevel(lv, fresh) {
  if (fresh) { S.found = []; S.cells = []; S.bonus = []; }
  S.level = lv; save();
  LV = makeLevel(lv, S.diff || 'mid');
  drawBg(lv);
  $('lvlname').textContent = 'שלב ' + lv;
  $('chap').textContent = theme(lv).n + ' · ' + (((lv - 1) % LPC) + 1) + '/' + LPC;
  cellMap = new Map();
  LV.words.forEach((p, wi) => {
    for (let i = 0; i < p.n.length; i++) {
      const x = p.dir === 'h' ? p.x + i : p.x, y = p.dir === 'v' ? p.y + i : p.y, k = x + ',' + y;
      const c = cellMap.get(k) || { x, y, ch: p.n[i], fin: false };
      if (i === p.n.length - 1 && TOFIN[p.n[i]]) c.fin = true;
      cellMap.set(k, c);
    }
  });
  buildWheel(); buildBoard(true); updateJar(); setCoins(S.coins);
}
function buildBoard(intro) {
  const b = $('board'); b.innerHTML = ''; cellEls = {};
  const W = b.clientWidth, H = b.clientHeight;
  sz = Math.floor(Math.min(W / LV.W, H / LV.H, S.big ? 86 : 70));
  const gap = Math.max(3, sz * 0.08), ox = (W - sz * LV.W) / 2, oy = (H - sz * LV.H) / 2;
  let i = 0;
  for (const [k, c] of cellMap) {
    const el = document.createElement('div'); el.className = 'cell' + (intro ? ' in' : '');
    el.style.cssText = `width:${sz - gap}px;height:${sz - gap}px;right:${ox + c.x * sz}px;top:${oy + c.y * sz}px;font-size:${sz * 0.62}px;animation-delay:${intro ? (c.x + c.y) * 40 : 0}ms`;
    el.innerHTML = `<span>${c.fin ? TOFIN[c.ch] : c.ch}</span>`;
    if (S.cells.includes(k)) el.classList.add('on');
    el.onclick = () => pickCell(k);
    b.appendChild(el); cellEls[k] = el; i++;
  }
}
function wordCells(wi) { const p = LV.words[wi], r = []; for (let i = 0; i < p.n.length; i++) r.push((p.dir === 'h' ? p.x + i : p.x) + ',' + (p.dir === 'v' ? p.y + i : p.y)); return r; }
function showCell(k, cls = 'flip') { const el = cellEls[k]; if (!el) return; el.classList.remove('in', 'flip', 'glow', 'pick'); void el.offsetWidth; el.classList.add('on', cls); }
function markWordFound(n) {
  const wi = LV.words.findIndex(p => p.n === n);
  wordCells(wi).forEach(k => { if (!S.cells.includes(k)) S.cells.push(k); });
  if (!S.found.includes(n)) { S.found.push(n); S.total++; }
}
function checkWordsByCells() {
  LV.words.forEach((p, wi) => { if (!S.found.includes(p.n) && wordCells(wi).every(k => S.cells.includes(k))) { S.found.push(p.n); S.total++; } });
}
// אותיות עפות מהגלגל למשבצות
async function flyWord(n, fromRects) {
  const wi = LV.words.findIndex(p => p.n === n), cells = wordCells(wi);
  const fresh = cells.map(k => !cellEls[k].classList.contains('on'));
  const flies = cells.map((k, i) => {
    const from = fromRects[i] || fromRects[fromRects.length - 1], to = cellEls[k].getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'flyL';
    f.textContent = (i === n.length - 1 && TOFIN[n[i]]) ? TOFIN[n[i]] : n[i];
    f.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;font-size:${from.height * 0.62}px;transition-delay:${i * 70}ms`;
    document.body.appendChild(f);
    return { f, from, to };
  });
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  flies.forEach(({ f, from, to }) => {
    const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
    f.style.transform = `translate(${dx}px,${dy}px) scale(${to.width / from.width})`;
  });
  cells.forEach((k, i) => setTimeout(() => {
    flies[i].f.remove();
    if (fresh[i]) showCell(k, 'flip'); else showCell(k, 'glow');
    SFX.land(i);
  }, 560 + i * 70));
  await sleep(600 + cells.length * 70);
}
let winShown = false;
function checkWin() {
  if (winShown || S.found.length < LV.words.length) return;
  winShown = true; save();
  setTimeout(() => {
    const lv = LV.level, endChap = lv % LPC === 0;
    const reward = 10 + (lv % 5 === 0 ? 20 : 0) + (endChap ? 50 : 0);
    S.pendingReward = reward; S.done = Math.max(S.done || 0, lv); save();
    $('winT').textContent = CHEERS[lv % CHEERS.length];
    $('winPhoto').innerHTML = PH.length ? `<div class="photo" style="--ph:url('${PH[(lv - 1) % PH.length]}')"><img src="${PH[(lv - 1) % PH.length]}" alt=""><div class="shine"></div></div>` : '';
    $('winP').innerHTML = (endChap ? `סיימת את הפרק "${theme(lv).n}"! 🎉<br>` : '') + (PH.length && lv <= PH.length ? 'תמונה חדשה נוספה לאלבום<br>' : '') + `קיבלת <b>${reward}</b> מטבעות`;
    SFX.win(); vib([40, 60, 40, 60, 80]); confetti(); $('winOv').classList.add('show');
  }, 500);
}

// ---- גלגל ----
let sel = [], dragging = false, ptsPos = [], slots = [];
function buildWheel() {
  const wh = $('wheel'); wh.querySelectorAll('.lt').forEach(e => e.remove());
  const D = Math.max(220, Math.min(innerWidth - 100, innerHeight * 0.42, 380)); wh.style.width = wh.style.height = D + 'px';
  const n = LV.wheel.length, R = D / 2, lr = Math.min(R * 0.36, (Math.PI * R * 0.68) / n);
  slots = LV.wheel.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return { x: R + Math.cos(a) * R * 0.66, y: R + Math.sin(a) * R * 0.66 }; });
  ptsPos = LV.wheel.map((ch, i) => {
    const el = document.createElement('div'); el.className = 'lt'; el.textContent = ch;
    const { x, y } = slots[i];
    el.style.cssText = `width:${lr * 1.8}px;height:${lr * 1.8}px;left:${x - lr * 0.9}px;top:${y - lr * 0.9}px;font-size:${lr * (S.big ? 1.5 : 1.25)}px`;
    wh.appendChild(el); return { x, y, el, ch, r: lr };
  });
  $('line').setAttribute('viewBox', `0 0 ${D} ${D}`);
  drawLine();
}
function drawLine(px, py) {
  const pts = sel.map(i => ptsPos[i]); let d = '';
  pts.forEach((p, i) => (d += (i ? 'L' : 'M') + p.x + ' ' + p.y + ' '));
  if (dragging && pts.length && px !== undefined) d += 'L' + px + ' ' + py;
  $('line').innerHTML = d ? `<path d="${d}" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--fill')}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>` : '';
  ptsPos.forEach((p, i) => p.el.classList.toggle('sel', sel.includes(i)));
  const w = sel.map(i => ptsPos[i].ch).join('');
  $('preview').innerHTML = w ? `<div class="w">${w}</div>` : '';
}
function hitTest(e) {
  const r = $('wheel').getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  for (let i = 0; i < ptsPos.length; i++) { const p = ptsPos[i]; if (Math.hypot(p.x - x, p.y - y) < p.r * 1.0) return { i, x, y }; }
  return { i: -1, x, y };
}
const wheel = $('wheel');
wheel.addEventListener('pointerdown', e => {
  if (e.target.id === 'shuf') return;
  const h = hitTest(e); if (h.i < 0) return;
  dragging = true; sel = [h.i]; SFX.pick(0); vib(8); try { wheel.setPointerCapture(e.pointerId); } catch (_) {} drawLine(h.x, h.y);
});
wheel.addEventListener('pointermove', e => {
  if (!dragging) return; const h = hitTest(e);
  if (h.i >= 0) {
    if (sel.length > 1 && sel[sel.length - 2] === h.i) sel.pop();
    else if (!sel.includes(h.i)) { sel.push(h.i); SFX.pick(sel.length - 1); vib(8); }
  }
  drawLine(h.x, h.y);
});
const endDrag = () => {
  if (!dragging) return; dragging = false;
  const w = sel.map(i => ptsPos[i].ch).join(''), rects = sel.map(i => ptsPos[i].el.getBoundingClientRect());
  sel = []; drawLine();
  if (w.length >= 2) submit(w, rects); else $('preview').innerHTML = '';
};
wheel.addEventListener('pointerup', endDrag); wheel.addEventListener('pointercancel', endDrag);

function flash(w, cls, ms = 800) { $('preview').innerHTML = `<div class="w ${cls}">${w}</div>`; clearTimeout(flash.t); flash.t = setTimeout(() => ($('preview').innerHTML = ''), ms); }
let streak = 0;
function submit(n, rects) {
  const p = LV.words.find(p => p.n === n);
  if (p) {
    if (S.found.includes(n)) { flash(disp(n), 'dup'); toast('כבר מצאת את המילה הזאת'); SFX.bad(); return; }
    markWordFound(n); checkWordsByCells(); save();
    flash(disp(n), 'ok', 500); SFX.ok(n.length); vib(25); streak++;
    if (n.length >= 5 || streak % 3 === 0) cheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    flyWord(n, rects).then(checkWin);
    return;
  }
  streak = 0;
  if (n.length >= 3 && isBonusWord(n)) {
    if (S.bonus.includes(n)) { flash(disp(n), 'dup'); toast('כבר נמצאה כמילה נוספת'); return; }
    S.bonus.push(n); S.jar = (S.jar || 0) + 1; flash(disp(n), 'bonus'); SFX.bonus(); vib(20); toast('⭐ מילה נוספת!');
    flyStar(rects[0]);
    if (S.jar >= 10) { S.jar = 0; setTimeout(() => { flyCoins($('jar').getBoundingClientRect(), 50); toast('⭐ 50 מטבעות על 10 מילים נוספות!'); }, 900); }
    save(); return;
  }
  flash(disp(n), 'bad'); SFX.bad(); vib([30, 40, 30]);
}
function updateJar() { $('jarN').textContent = (S.jar || 0) + '/10'; document.querySelector('#jar .bar i').style.width = ((S.jar || 0) * 10) + '%'; }
function flyStar(from) {
  const to = $('jar').getBoundingClientRect(), f = document.createElement('div');
  f.className = 'flyC'; f.textContent = '⭐'; f.style.cssText = `left:${from.left}px;top:${from.top}px;font-size:34px;width:auto;height:auto`;
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transform = `translate(${to.left - from.left}px,${to.top - from.top}px) rotate(360deg) scale(.7)`; }));
  setTimeout(() => { f.remove(); bump($('jar')); updateJar(); }, 820);
}
// מטבעות עפים לקופה
function flyCoins(from, amount) {
  const to = document.querySelector('.pill .coin').getBoundingClientRect();
  const n = Math.min(12, Math.max(5, Math.round(amount / 5))), per = amount / n;
  let given = 0, sum = 0;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div'); c.className = 'flyC coin';
    const sx = from.left + from.width / 2 + (Math.random() - 0.5) * 80, sy = from.top + from.height / 2 + (Math.random() - 0.5) * 40;
    c.style.cssText = `left:${sx}px;top:${sy}px;transition-delay:${i * 60}ms`;
    document.body.appendChild(c);
    requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transform = `translate(${to.left - sx}px,${to.top - sy}px) scale(.8)`; }));
    setTimeout(() => {
      c.remove(); given++;
      const add = given === n ? amount - sum : Math.round(per); sum += add;
      setCoins(S.coins + add); SFX.coin(); bump(document.querySelector('.pill'));
    }, 820 + i * 60);
  }
}
$('shuf').onclick = () => {
  const n = ptsPos.length, perm = [...Array(n).keys()];
  for (let tries = 0; tries < 5; tries++) {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    if (perm.some((v, i) => v !== i)) break;
  }
  ptsPos.forEach((p, k) => {
    const s = slots[perm[k]]; p.x = s.x; p.y = s.y;
    p.el.classList.add('spin'); p.el.style.left = s.x - p.r * 0.9 + 'px'; p.el.style.top = s.y - p.r * 0.9 + 'px';
  });
  $('shuf').animate([{ transform: 'translate(-50%,-50%) rotate(0)' }, { transform: 'translate(-50%,-50%) rotate(360deg)' }], { duration: 500, easing: 'ease-out' });
  SFX.whoosh();
};

// ---- עזרים ----
function spend(c) { if (S.coins < c) { toast('אין מספיק מטבעות'); SFX.bad(); return false; } setCoins(S.coins - c); bump(document.querySelector('.pill')); return true; }
function revealCell(k) {
  if (S.cells.includes(k)) return; S.cells.push(k);
  showCell(k, 'flip'); cellEls[k].classList.add('hint'); bell(1318.5, 0, 0.12, 0.8);
  checkWordsByCells(); save(); checkWin();
}
$('hintBtn').onclick = () => {
  const open = LV.words.map((p, wi) => wi).filter(wi => !S.found.includes(LV.words[wi].n));
  if (!open.length || !spend(40)) return;
  open.sort((a, b) => LV.words[a].n.length - LV.words[b].n.length);
  revealCell(wordCells(open[0]).find(k => !S.cells.includes(k)));
};
let picking = false;
$('pickBtn').onclick = () => {
  if (picking) { picking = false; Object.values(cellEls).forEach(e => e.classList.remove('pick')); return; }
  if (S.coins < 70) { toast('אין מספיק מטבעות'); return; }
  picking = true; toast('לחצי על משבצת ריקה');
  for (const k in cellEls) if (!S.cells.includes(k)) cellEls[k].classList.add('pick');
};
function pickCell(k) {
  if (!picking || S.cells.includes(k)) return;
  picking = false; Object.values(cellEls).forEach(e => e.classList.remove('pick'));
  if (spend(70)) revealCell(k);
}
$('wordBtn').onclick = () => {
  const p = LV.words.find(p => !S.found.includes(p.n)); if (!p || !spend(150)) return;
  const wi = LV.words.indexOf(p);
  markWordFound(p.n); checkWordsByCells(); save(); SFX.ok(p.n.length);
  wordCells(wi).forEach((k, i) => setTimeout(() => { showCell(k, 'flip'); SFX.land(i); }, i * 90));
  setTimeout(checkWin, p.n.length * 90 + 300);
};
$('jar').onclick = () => {
  $('jarList').innerHTML = S.bonus.length ? S.bonus.map(n => `<b>${disp(n)}</b>`).join('') : '<p>עוד לא נמצאו מילים נוספות בשלב הזה</p>';
  $('jarOv').classList.add('show');
};
$('closeJar').onclick = () => $('jarOv').classList.remove('show');

// ---- אלבום ----
$('albumBtn').onclick = () => {
  const done = S.done || S.level - 1, open = Math.min(PH.length, done);
  $('albumP').textContent = PH.length ? `${open} מתוך ${PH.length} תמונות. כל שלב פותח תמונה חדשה.` : 'התמונות נעולות. הקלידי את הקוד המשפחתי:';
  $('codeRow').hidden = !!PH.length;
  $('albumGrid').innerHTML = PH.map((src, i) => i < open ? `<img src="${src}" data-i="${i}" alt="">` : '<div>🔒</div>').join('');
  $('menuOv').classList.remove('show'); $('albumOv').classList.add('show');
};
$('albumGrid').onclick = e => { const i = e.target.dataset && e.target.dataset.i; if (i !== undefined) { $('viewerImg').src = PH[i]; $('viewer').classList.add('show'); } };
$('viewer').onclick = () => $('viewer').classList.remove('show');
$('codeBtn').onclick = async () => {
  const c = $('codeIn').value.trim().toLowerCase(); if (!c) return;
  $('codeBtn').textContent = '...';
  let ok = false; try { ok = await unlock(c); } catch (e) {}
  $('codeBtn').textContent = 'פתיחה';
  if (ok) { SFX.bonus(); toast('📷 התמונות נפתחו!'); $('albumBtn').onclick(); } else { SFX.bad(); toast('הקוד לא נכון'); }
};
$('closeAlbum').onclick = () => $('albumOv').classList.remove('show');

// ---- תפריט ----
const sw = (id, key, cb) => { const el = $(id); el.classList.toggle('on', !!S[key]); el.onclick = () => { S[key] = !S[key]; el.classList.toggle('on', S[key]); save(); cb && cb(); }; };
sw('sndSw', 'snd'); sw('vibSw', 'vib'); sw('bigSw', 'big', () => { buildWheel(); buildBoard(); });
const DIFFN = { easy: 'קל', mid: 'בינוני', hard: 'קשה' };
function showDiff() { document.querySelectorAll('#diffRow button').forEach(b => b.classList.toggle('on', b.dataset.d === (S.diff || 'mid'))); }
document.querySelectorAll('#diffRow button').forEach(b => b.onclick = () => {
  if (S.diff === b.dataset.d) return;
  S.diff = b.dataset.d; save(); showDiff(); winShown = false;
  startLevel(S.level, true); toast('רמת קושי: ' + DIFFN[S.diff]);
});
$('menuBtn').onclick = () => { showDiff(); $('stTotal').textContent = S.total; $('menuOv').classList.add('show'); };
$('closeMenu').onclick = () => $('menuOv').classList.remove('show');
$('nextBtn').onclick = () => {
  const r = $('nextBtn').getBoundingClientRect();
  $('winOv').classList.remove('show');
  flyCoins(r, S.pendingReward || 10); S.pendingReward = 0;
  winShown = false; streak = 0;
  startLevel(S.level + 1, true);
};

// ---- קונפטי ----
function confetti() {
  const c = $('confetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#ffc83d', '#4f8cf0', '#2fb36a', '#e0614f', '#b5508a', '#fff'];
  const ps = [];
  [[0.2, 0.9], [0.8, 0.9], [0.5, 0.6]].forEach(([ox, oy], b) => {
    for (let i = 0; i < 70; i++) ps.push({ x: innerWidth * ox, y: innerHeight * oy, vx: (Math.random() - 0.5) * 14 + (ox - 0.5) * -6, vy: -Math.random() * 18 - 6, s: Math.random() * 9 + 6, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6, d: b * 12, round: Math.random() < 0.3 });
  });
  let f = 0;
  (function step() {
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => {
      if (f < p.d) return;
      p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.vx *= 0.99; p.r += 0.12;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c;
      if (p.round) { x.beginPath(); x.arc(0, 0, p.s / 2.5, 0, 7); x.fill(); } else x.fillRect(-p.s / 2, -p.s / 4 * Math.abs(Math.cos(p.r * 2)), p.s, p.s / 2 * Math.abs(Math.cos(p.r * 2)) + 1);
      x.restore();
    });
    if (++f < 200) requestAnimationFrame(step); else x.clearRect(0, 0, c.width, c.height);
  })();
}

// ---- התחלה ----
$('playBtn').onclick = () => {
  $('home').classList.remove('show');
  try { ac(); } catch (e) {}
  bell(783.99, 0, 0.12); bell(1046.5, 0.1, 0.12);
  const today = new Date().toDateString();
  if (S.gift !== today) { S.gift = today; save(); setTimeout(() => $('giftOv').classList.add('show'), 400); }
};
$('giftBtn').onclick = () => { $('giftOv').classList.remove('show'); flyCoins($('giftBtn').getBoundingClientRect(), 100); };
$('playBtn').textContent = S.level > 1 ? 'להמשיך · שלב ' + S.level : 'לשחק';
startLevel(S.level, false);
initPhotos();
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildWheel(); buildBoard(); }, 150); });
let installEv = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEv = e; $('installBtn').hidden = false; });
addEventListener('appinstalled', () => { $('installBtn').hidden = true; toast('המשחק הותקן במסך הבית'); });
$('installBtn').onclick = async () => { if (!installEv) return; installEv.prompt(); try { await installEv.userChoice; } catch (e) {} installEv = null; $('installBtn').hidden = true; };
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
