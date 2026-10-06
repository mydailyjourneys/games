(() => {
const $ = id => document.getElementById(id);
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
const LEVELS_PER_CHAPTER = 12;
const theme = lv => THEMES[Math.floor((lv - 1) / LEVELS_PER_CHAPTER) % THEMES.length];

function hillPath(seed, base, amp) {
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let d = `M0 ${base}`; const n = 6;
  for (let i = 1; i <= n; i++) { const x = (i / n) * 400, cx = x - 400 / n / 2; d += ` Q${cx} ${base - amp * (0.4 + r())} ${x} ${base - amp * r() * 0.5}`; }
  return d + ' L400 800 L0 800 Z';
}
function drawBg(lv) {
  const t = theme(lv), ch = Math.floor((lv - 1) / LEVELS_PER_CHAPTER);
  let stars = '';
  if (t.night) for (let i = 0; i < 60; i++) stars += `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 420}" r="${(i % 3) * 0.6 + 0.6}" fill="#fff" opacity="${0.4 + (i % 5) / 8}"/>`;
  $('bg').innerHTML = `<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[0]}"/><stop offset="1" stop-color="${t.sky[1]}"/></linearGradient></defs>
  <rect width="400" height="800" fill="url(#g)"/>${stars}<circle cx="${290 - (ch % 3) * 60}" cy="170" r="48" fill="${t.sun}" opacity=".9"/>
  ${t.hills.map((c, i) => `<path d="${hillPath(ch * 3 + i + 1, 470 + i * 110, 120 - i * 20)}" fill="${c}" opacity=".9"/>`).join('')}</svg>`;
  document.documentElement.style.setProperty('--fill', t.fill);
  document.querySelector('meta[name=theme-color]').content = t.sky[0];
}

// ---- מצב ----
const KEY = 'milim-v1';
let S = { level: 1, coins: 200, found: [], cells: [], bonus: [], jar: 0, snd: true, vib: true, big: false, total: 0, gift: '' };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

// ---- צלילים ----
let AC;
function tone(f, d = 0.12, type = 'sine', vol = 0.15, delay = 0) {
  if (!S.snd) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + delay;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) {}
}
const SFX = {
  pick: i => tone(440 * Math.pow(2, i * 2 / 12), 0.12, 'triangle', 0.12),
  ok: () => [523, 659, 784].forEach((f, i) => tone(f, 0.25, 'triangle', 0.14, i * 0.08)),
  bad: () => tone(160, 0.25, 'sawtooth', 0.06),
  bonus: () => [784, 1047].forEach((f, i) => tone(f, 0.2, 'sine', 0.12, i * 0.07)),
  coin: () => [988, 1319].forEach((f, i) => tone(f, 0.12, 'square', 0.05, i * 0.06)),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.11)),
};
const vib = p => { if (S.vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

// ---- שלב ----
let LV, cellMap, cellEls;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1400); }
function setCoins(n, anim) { S.coins = n; $('coins').textContent = n; save(); if (anim) SFX.coin(); }

function startLevel(lv, fresh) {
  if (fresh) { S.found = []; S.cells = []; S.bonus = []; }
  S.level = lv; save();
  LV = makeLevel(lv);
  drawBg(lv);
  $('lvlname').textContent = 'שלב ' + lv;
  $('chap').textContent = theme(lv).n + ' · ' + (((lv - 1) % LEVELS_PER_CHAPTER) + 1) + '/' + LEVELS_PER_CHAPTER;
  cellMap = new Map();
  LV.words.forEach((p, wi) => {
    for (let i = 0; i < p.n.length; i++) {
      const x = p.dir === 'h' ? p.x + i : p.x, y = p.dir === 'v' ? p.y + i : p.y, k = x + ',' + y;
      const c = cellMap.get(k) || { x, y, ch: p.n[i], fin: false, words: [] };
      if (i === p.n.length - 1 && TOFIN[p.n[i]]) c.fin = true;
      c.words.push(wi); cellMap.set(k, c);
    }
  });
  S.found.forEach(n => revealWord(n, true));
  buildWheel(); buildBoard(); updateJar(); setCoins(S.coins);
}
function buildBoard() {
  const b = $('board'); b.innerHTML = ''; cellEls = {};
  const W = b.clientWidth, H = b.clientHeight;
  const sz = Math.floor(Math.min(W / LV.W, H / LV.H, S.big ? 78 : 66));
  const gap = Math.max(2, sz * 0.07), ox = (W - sz * LV.W) / 2, oy = (H - sz * LV.H) / 2;
  for (const [k, c] of cellMap) {
    const el = document.createElement('div'); el.className = 'cell';
    el.style.cssText = `width:${sz - gap}px;height:${sz - gap}px;right:${ox + c.x * sz}px;top:${oy + c.y * sz}px;font-size:${sz * 0.58}px`;
    el.innerHTML = `<span>${c.fin ? TOFIN[c.ch] : c.ch}</span>`;
    if (S.cells.includes(k)) el.classList.add('on');
    el.onclick = () => pickCell(k);
    b.appendChild(el); cellEls[k] = el;
  }
}
function wordCells(wi) { const p = LV.words[wi], r = []; for (let i = 0; i < p.n.length; i++) r.push((p.dir === 'h' ? p.x + i : p.x) + ',' + (p.dir === 'v' ? p.y + i : p.y)); return r; }
function revealWord(n, silent) {
  const wi = LV.words.findIndex(p => p.n === n); if (wi < 0) return;
  wordCells(wi).forEach((k, i) => {
    if (!S.cells.includes(k)) S.cells.push(k);
    if (!silent && cellEls[k]) setTimeout(() => { cellEls[k].classList.add('on', 'pop'); cellEls[k].classList.remove('hint'); }, i * 70);
  });
}
function checkWordsByCells() {
  LV.words.forEach((p, wi) => { if (!S.found.includes(p.n) && wordCells(wi).every(k => S.cells.includes(k))) { S.found.push(p.n); S.total++; } });
}
function checkWin() {
  if (S.found.length < LV.words.length) return;
  save();
  setTimeout(() => {
    const reward = 10 + (LV.level % 5 === 0 ? 20 : 0);
    const endChap = LV.level % LEVELS_PER_CHAPTER === 0;
    $('winT').textContent = ['כל הכבוד!', 'מצוין!', 'נהדר!', 'איזה יופי!', 'מושלם!'][LV.level % 5];
    $('winP').innerHTML = (endChap ? `סיימת את הפרק "${theme(LV.level).n}"! 🎉<br>` : '') + `קיבלת <b>${reward + (endChap ? 50 : 0)}</b> מטבעות`;
    S.pendingReward = reward + (endChap ? 50 : 0);
    SFX.win(); vib([40, 60, 40]); confetti(); $('winOv').classList.add('show');
  }, 700);
}

// ---- גלגל ----
let wheelLetters = [], sel = [], dragging = false, ptsPos = [];
function buildWheel() {
  const wh = $('wheel'); wh.querySelectorAll('.lt').forEach(e => e.remove());
  const avail = Math.min(window.innerWidth - 170, window.innerHeight * 0.36, 330);
  const D = Math.max(200, avail); wh.style.width = wh.style.height = D + 'px';
  const n = LV.wheel.length, R = D / 2, lr = Math.min(R * 0.36, (Math.PI * R * 0.68) / n);
  ptsPos = [];
  LV.wheel.forEach((ch, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n, x = R + Math.cos(a) * R * 0.68, y = R + Math.sin(a) * R * 0.68;
    const el = document.createElement('div'); el.className = 'lt'; el.textContent = ch;
    el.style.cssText = `width:${lr * 1.7}px;height:${lr * 1.7}px;left:${x - lr * 0.85}px;top:${y - lr * 0.85}px;font-size:${lr * (S.big ? 1.35 : 1.2)}px`;
    wh.appendChild(el); ptsPos.push({ x, y, el, ch, r: lr });
  });
  $('line').setAttribute('viewBox', `0 0 ${D} ${D}`);
  drawLine();
}
function drawLine(px, py) {
  const pts = sel.map(i => ptsPos[i]); let d = '';
  pts.forEach((p, i) => (d += (i ? 'L' : 'M') + p.x + ' ' + p.y + ' '));
  if (dragging && pts.length && px !== undefined) d += 'L' + px + ' ' + py;
  $('line').innerHTML = d ? `<path d="${d}" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--fill')}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>` : '';
  ptsPos.forEach((p, i) => p.el.classList.toggle('sel', sel.includes(i)));
  const w = sel.map(i => ptsPos[i].ch).join('');
  $('preview').innerHTML = w ? `<div class="w">${w}</div>` : '';
}
function hitTest(e) {
  const r = $('wheel').getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  for (let i = 0; i < ptsPos.length; i++) { const p = ptsPos[i]; if (Math.hypot(p.x - x, p.y - y) < p.r * 0.95) return { i, x, y }; }
  return { i: -1, x, y };
}
const wheel = $('wheel');
wheel.addEventListener('pointerdown', e => {
  if (e.target.id === 'shuf') return;
  const h = hitTest(e); if (h.i < 0) return;
  dragging = true; sel = [h.i]; SFX.pick(0); vib(8); wheel.setPointerCapture(e.pointerId); drawLine(h.x, h.y);
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
  const w = sel.map(i => ptsPos[i].ch).join(''); sel = []; drawLine();
  if (w.length >= 2) submit(w); else $('preview').innerHTML = '';
};
wheel.addEventListener('pointerup', endDrag); wheel.addEventListener('pointercancel', endDrag);

function flash(w, cls, ms = 700) { $('preview').innerHTML = `<div class="w ${cls}">${w}</div>`; clearTimeout(flash.t); flash.t = setTimeout(() => ($('preview').innerHTML = ''), ms); }
function submit(n) {
  const disp = n.slice(0, -1) + (TOFIN[n.slice(-1)] || n.slice(-1));
  const p = LV.words.find(p => p.n === n);
  if (p) {
    if (S.found.includes(n)) { flash(disp, 'dup'); toast('כבר מצאת את המילה הזאת'); SFX.bad(); return; }
    S.found.push(n); S.total++; revealWord(n); checkWordsByCells(); save(); flash(disp, 'ok'); SFX.ok(); vib(25); checkWin(); return;
  }
  if (n.length >= 3 && isBonusWord(n)) {
    if (S.bonus.includes(n)) { flash(disp, 'dup'); toast('כבר נמצאה כמילה נוספת'); return; }
    S.bonus.push(n); S.jar = (S.jar || 0) + 1; flash(disp, 'bonus'); SFX.bonus(); vib(20); toast('⭐ מילה נוספת!');
    if (S.jar >= 10) { S.jar = 0; setTimeout(() => { setCoins(S.coins + 50, true); toast('⭐ 50 מטבעות על 10 מילים נוספות!'); }, 600); }
    updateJar(); save(); return;
  }
  flash(disp, 'bad'); SFX.bad(); vib([30, 40, 30]);
}
function updateJar() { $('jarN').textContent = (S.jar || 0) + '/10'; document.querySelector('#jar .bar i').style.width = ((S.jar || 0) * 10) + '%'; }
$('shuf').onclick = () => {
  for (let i = LV.wheel.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [LV.wheel[i], LV.wheel[j]] = [LV.wheel[j], LV.wheel[i]]; }
  buildWheel(); tone(600, 0.08, 'triangle', 0.08);
};

// ---- עזרים ----
function spend(c) { if (S.coins < c) { toast('אין מספיק מטבעות'); SFX.bad(); return false; } setCoins(S.coins - c); return true; }
function revealCell(k) {
  if (S.cells.includes(k)) return; S.cells.push(k);
  const el = cellEls[k]; el.classList.add('on', 'hint', 'pop'); tone(880, 0.15, 'sine', 0.12);
  checkWordsByCells(); save(); checkWin();
}
$('hintBtn').onclick = () => {
  const open = LV.words.map((p, wi) => wi).filter(wi => !S.found.includes(LV.words[wi].n));
  if (!open.length) return;
  if (!spend(40)) return;
  // משבצת ראשונה שלא נחשפה במילה הקצרה ביותר שעוד לא נמצאה
  open.sort((a, b) => LV.words[a].n.length - LV.words[b].n.length);
  const k = wordCells(open[0]).find(k => !S.cells.includes(k)); revealCell(k);
};
let picking = false;
$('pickBtn').onclick = () => {
  if (picking) { picking = false; Object.values(cellEls).forEach(e => e.classList.remove('pick')); return; }
  if (S.coins < 70) { toast('אין מספיק מטבעות'); return; }
  picking = true; toast('לחצי על משבצת לחשיפה');
  for (const k in cellEls) if (!S.cells.includes(k)) cellEls[k].classList.add('pick');
};
function pickCell(k) {
  if (!picking || S.cells.includes(k)) return;
  picking = false; Object.values(cellEls).forEach(e => e.classList.remove('pick'));
  if (spend(70)) revealCell(k);
}
$('wordBtn').onclick = () => {
  const p = LV.words.find(p => !S.found.includes(p.n)); if (!p) return;
  if (!spend(150)) return;
  S.found.push(p.n); S.total++; revealWord(p.n); checkWordsByCells(); save(); SFX.ok(); checkWin();
};
$('jar').onclick = () => {
  $('jarList').innerHTML = S.bonus.length ? S.bonus.map(n => `<b>${n.slice(0, -1) + (TOFIN[n.slice(-1)] || n.slice(-1))}</b>`).join('') : '<p>עוד לא נמצאו מילים נוספות בשלב הזה</p>';
  $('jarOv').classList.add('show');
};
$('closeJar').onclick = () => $('jarOv').classList.remove('show');

// ---- תפריט ----
const sw = (id, key, cb) => { const el = $(id); el.classList.toggle('on', !!S[key]); el.onclick = () => { S[key] = !S[key]; el.classList.toggle('on', S[key]); save(); cb && cb(); }; };
sw('sndSw', 'snd'); sw('vibSw', 'vib'); sw("bigSw", "big", () => { buildWheel(); buildBoard(); });
$('menuBtn').onclick = () => { $('stTotal').textContent = S.total; $('menuOv').classList.add('show'); };
$('closeMenu').onclick = () => $('menuOv').classList.remove('show');
$('nextBtn').onclick = () => {
  $('winOv').classList.remove('show');
  setCoins(S.coins + (S.pendingReward || 10), true); S.pendingReward = 0;
  startLevel(S.level + 1, true);
};

// ---- קונפטי ----
function confetti() {
  const c = $('confetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#ffc83d', '#4f8cf0', '#2fb36a', '#e0614f', '#b5508a', '#fff'];
  const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 4, s: Math.random() * 8 + 5, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6 }));
  let f = 0;
  (function step() {
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.vx *= 0.99; p.r += 0.1; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
    if (++f < 150) requestAnimationFrame(step); else x.clearRect(0, 0, c.width, c.height);
  })();
}

// ---- התחלה ----
$('playBtn').onclick = () => {
  $('home').classList.remove('show');
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (e) {}
  const today = new Date().toDateString();
  if (S.gift !== today) { S.gift = today; save(); setTimeout(() => $('giftOv').classList.add('show'), 400); }
};
$('giftBtn').onclick = () => { $('giftOv').classList.remove('show'); setCoins(S.coins + 100, true); };
$('playBtn').textContent = S.level > 1 ? 'להמשיך · שלב ' + S.level : 'לשחק';
startLevel(S.level, false);
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildWheel(); buildBoard(); }, 150); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
