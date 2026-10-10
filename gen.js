// מחולל שלבים — דטרמיניסטי לפי מספר שלב, אינסופי
const FIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const TOFIN = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
const norm = w => w.replace(/[ךםןףץ]/g, c => FIN[c]);
const LIST_A = WORDS_A.split(' ');
const SET_B = new Set(WORDS_B.split(' ').map(norm));
LIST_A.forEach(w => SET_B.add(norm(w)));
const A = LIST_A.map((w, i) => ({ w, n: norm(w), r: i }));
const BY_LEN = {};
A.forEach(o => (BY_LEN[o.n.length] = BY_LEN[o.n.length] || []).push(o));

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function counts(s) { const m = {}; for (const c of s) m[c] = (m[c] || 0) + 1; return m; }
function fits(word, cm) { const m = {}; for (const c of word) { m[c] = (m[c] || 0) + 1; if (m[c] > (cm[c] || 0)) return false; } return true; }

function params(level, diff) {
  if (diff === 'easy') return { L: level <= 10 ? 4 : level <= 60 ? 5 : 6, maxRank: Math.min(A.length, 700 + level * 8), maxWords: Math.min(6, 3 + Math.floor(level / 12)) };
  if (diff === 'hard') return { L: level <= 5 ? 5 : level <= 25 ? 6 : 7, maxRank: Math.min(A.length, 2200 + level * 30), maxWords: Math.min(10, 5 + Math.floor(level / 6)) };
  const L = level <= 6 ? 4 : level <= 30 ? 5 : level <= 90 ? 6 : 7;
  return { L, maxRank: Math.min(A.length, 1200 + level * 18), maxWords: Math.min(9, 3 + Math.floor(level / 8) + (L - 4)) };
}
// בניית תשבץ: מחזיר רשימת מילים ממוקמות או null
function layout(words, rnd) {
  const grid = new Map(); // "x,y" -> {c, fin}
  const placed = [];
  const key = (x, y) => x + ',' + y;
  const isFin = (w, i) => i === w.length - 1 && TOFIN[w[i]] !== undefined;
  function canPlace(w, x, y, dir) {
    const dx = dir === 'h' ? 1 : 0, dy = dir === 'h' ? 0 : 1;
    let cross = 0;
    if (grid.has(key(x - dx, y - dy)) || grid.has(key(x + dx * w.length, y + dy * w.length))) return -1;
    for (let i = 0; i < w.length; i++) {
      const cx = x + dx * i, cy = y + dy * i, g = grid.get(key(cx, cy));
      if (g) {
        if (g.c !== w[i] || g[dir]) return -1;
        if (g.fin !== isFin(w, i) && (TOFIN[w[i]])) return -1;
        cross++;
      } else {
        // שכנים צדדיים אסורים
        if (grid.has(key(cx + dy, cy + dx)) || grid.has(key(cx - dy, cy - dx))) return -1;
      }
    }
    return cross;
  }
  function put(o, x, y, dir) {
    const w = o.n, dx = dir === 'h' ? 1 : 0, dy = dir === 'h' ? 0 : 1;
    for (let i = 0; i < w.length; i++) {
      const k = key(x + dx * i, y + dy * i);
      const g = grid.get(k) || { c: w[i], fin: isFin(w, i) };
      g[dir] = true; grid.set(k, g);
    }
    placed.push({ ...o, x, y, dir });
  }
  function bbox(extra) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const pts = [...grid.keys()].map(k => k.split(',').map(Number));
    if (extra) pts.push(...extra);
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  put(words[0], 0, 0, 'h');
  const rest = words.slice(1);
  for (let pass = 0; pass < 2; pass++) {
    for (const o of rest) {
      if (placed.includes(o) || placed.some(p => p.n === o.n)) continue;
      let best = null;
      for (const [k, g] of grid) {
        const [gx, gy] = k.split(',').map(Number);
        for (let i = 0; i < o.n.length; i++) {
          if (o.n[i] !== g.c) continue;
          for (const dir of ['h', 'v']) {
            if (g[dir]) continue;
            const x = dir === 'h' ? gx - i : gx, y = dir === 'h' ? gy : gy - i;
            const c = canPlace(o.n, x, y, dir);
            if (c < 1) continue;
            const ex = [[x, y], [x + (dir === 'h' ? o.n.length - 1 : 0), y + (dir === 'v' ? o.n.length - 1 : 0)]];
            const b = bbox(ex);
            if (b.w > 7 || b.h > 8) continue;
            const score = c * 10 - Math.abs(b.w - b.h) - (b.w * b.h) / 12 + rnd();
            if (!best || score > best.score) best = { x, y, dir, score };
          }
        }
      }
      if (best) put(o, best.x, best.y, best.dir);
    }
  }
  return placed;
}

const CACHE = {};
function makeLevel(level, diff = 'mid') {
  const ck = diff + level;
  if (CACHE[ck]) return CACHE[ck];
  const rnd = rng(level * 7919 + 13 + (diff === 'easy' ? 101 : diff === 'hard' ? 202 : 0));
  const { L, maxRank, maxWords } = params(level, diff);
  const pool = (BY_LEN[L] || []).filter(o => o.r < maxRank);
  let bestLv = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const base = pool[Math.floor(rnd() * pool.length)];
    const cm = counts(base.n);
    const SHORT = { 3: 900, 4: 2200 };
    const cands = A.filter(o => o.n.length >= 3 && o.n.length <= L && o.r < Math.min(maxRank * 1.6, SHORT[o.n.length] || 1e9) && fits(o.n, cm));
    const uniq = []; const seen = new Set();
    for (const o of cands) if (!seen.has(o.n)) { seen.add(o.n); uniq.push(o); }
    if (uniq.length < Math.min(4, maxWords)) continue;
    const jit = new Map(); const q = o => { if (!jit.has(o)) jit.set(o, 0.5 + rnd()); return (o.r + 60) * jit.get(o) * (o.n.length === 3 ? 2.5 : 1) / (1 + 0.25 * (o.n.length - 3)); };
    const others = uniq.filter(o => o.n !== base.n).sort((a, b) => q(a) - q(b));
    // מגוון: חלק מהמילים הארוכות, השאר לפי שכיחות
    const chosen = [base, ...others.slice(0, maxWords * 2)];
    const placed = layout(chosen, rnd).slice(0, maxWords + 1);
    const lv = { level, letters: base.n, words: placed };
    if (!bestLv || placed.length > bestLv.words.length) bestLv = lv;
    if (placed.length >= Math.min(maxWords, 3 + Math.floor(level / 15))) break;
  }
  // ערבוב אותיות
  const arr = bestLv.letters.split('');
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  bestLv.wheel = arr;
  // נרמול קואורדינטות
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of bestLv.words) {
    const ex = p.dir === 'h' ? p.x + p.n.length - 1 : p.x, ey = p.dir === 'v' ? p.y + p.n.length - 1 : p.y;
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, ex); y1 = Math.max(y1, ey);
  }
  bestLv.words.forEach(p => { p.x -= x0; p.y -= y0; });
  bestLv.W = x1 - x0 + 1; bestLv.H = y1 - y0 + 1;
  return (CACHE[ck] = bestLv);
}
function isBonusWord(n) { return SET_B.has(n); }
if (typeof module !== 'undefined') module.exports = { makeLevel, norm, isBonusWord, TOFIN };
