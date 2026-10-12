/* =========================================================
   마을 그림 (직접 그린 SVG 타일 · 저작권 걱정 없는 그림)
   ground(): 바닥 그림 / object(): 나무·건물처럼 위로 솟는 그림
   ========================================================= */
'use strict';

const ART = (() => {
  // 칸마다 조금씩 다르게 보이도록 하는 고정 난수
  const rnd = (x, y, k = 0) => { const v = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
  const svg = (inner, vb = '0 0 32 32') => `<svg viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;

  const THEME = {
    town:     { g1: '#86cf6e', g2: '#6fbb58', g3: '#a6e08c', tree: 'round', tall: 'grass' },
    school:   { g1: '#8fd477', g2: '#73bf5c', g3: '#b0e597', tree: 'round', tall: 'bed' },
    forest:   { g1: '#6fbf5a', g2: '#58a646', g3: '#8fd474', tree: 'round', tall: 'grass' },
    park:     { g1: '#88d070', g2: '#70ba59', g3: '#a9e08f', tree: 'round', tall: 'grass' },
    mountain: { g1: '#79b862', g2: '#5f9e4b', g3: '#98cf80', tree: 'pine',  tall: 'grass' },
    river:    { g1: '#80cc6a', g2: '#68b653', g3: '#a0dc88', tree: 'round', tall: 'reed' },
    wetland:  { g1: '#8cc66c', g2: '#74ae56', g3: '#a9d98a', tree: 'round', tall: 'reed' },
    factory:  { g1: '#9aa98a', g2: '#829173', g3: '#b2bfa3', tree: 'dead',  tall: 'weed' },
    beach:    { g1: '#86cf6e', g2: '#6fbb58', g3: '#a6e08c', tree: 'palm',  tall: 'seagrass' },
    island:   { g1: '#86cf6e', g2: '#6fbb58', g3: '#a6e08c', tree: 'palm',  tall: 'grass' },
  };
  const th = t => THEME[t] || THEME.town;

  /* ---------- 바닥 ---------- */
  function grassBase(t, x, y) {
    const c = th(t);
    let s = `<rect width="32" height="32" fill="${(x + y) % 2 ? c.g1 : c.g1}"/>`;
    s += `<rect width="32" height="32" fill="${c.g3}" opacity="${0.12 + rnd(x, y) * 0.12}"/>`;
    for (let i = 0; i < 6; i++) {
      const bx = 2 + rnd(x, y, i) * 28, by = 6 + rnd(x, y, i + 9) * 24;
      s += `<path d="M${bx} ${by}l1.2-3.4M${bx + 2} ${by}l-.6-2.6" stroke="${c.g2}" stroke-width="1.1" stroke-linecap="round"/>`;
    }
    if (rnd(x, y, 30) > .7) s += `<circle cx="${6 + rnd(x, y, 31) * 20}" cy="${6 + rnd(x, y, 32) * 20}" r="1.1" fill="#fff8" />`;
    return s;
  }
  function path(x, y) {
    let s = `<rect width="32" height="32" fill="#e6cf97"/><rect width="32" height="32" fill="#f3e1b2" opacity=".35"/>`;
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${3 + rnd(x, y, i) * 26}" cy="${3 + rnd(x, y, i + 5) * 26}" rx="${1 + rnd(x, y, i + 11)}" ry="${.7 + rnd(x, y, i + 3) * .6}" fill="#c9ad74" opacity=".8"/>`;
    return s;
  }
  function sand(x, y) {
    let s = `<rect width="32" height="32" fill="#f5dfa3"/>`;
    for (let i = 0; i < 7; i++) s += `<circle cx="${2 + rnd(x, y, i) * 28}" cy="${2 + rnd(x, y, i + 7) * 28}" r=".7" fill="#dcbc78"/>`;
    if (rnd(x, y, 40) > .85) s += `<path d="M10 22q3-5 6 0z" fill="#f8b4c4" stroke="#d98a9e" stroke-width=".6"/>`;
    return s;
  }
  function water(t, x, y) {
    const murky = t === 'factory';
    const a = murky ? '#6f8f7a' : '#4fb8ec', b = murky ? '#5c7b66' : '#3aa6dd';
    let s = `<rect width="32" height="32" fill="${a}"/><rect y="16" width="32" height="16" fill="${b}" opacity=".35"/>`;
    s += `<g class="wave"><path d="M2 ${8 + rnd(x, y) * 4}q4-3 8 0t8 0" stroke="#fff" stroke-width="1.3" fill="none" opacity=".55"/>`;
    s += `<path d="M14 ${20 + rnd(x, y, 2) * 5}q4-3 8 0t8 0" stroke="#fff" stroke-width="1.3" fill="none" opacity=".45"/></g>`;
    if (murky) s += `<ellipse cx="16" cy="16" rx="9" ry="4" fill="url(#oil)" opacity=".6"/>`;
    return s;
  }
  function tall(t, x, y) {
    const c = th(t), style = c.tall;
    if (style === 'bed') {
      let s = `<rect width="32" height="32" fill="#9b6b43"/><rect y="0" width="32" height="3" fill="#7a4f2f"/>`;
      const cols = ['#ff6b8a', '#ffd23f', '#ffffff', '#b28dff', '#ff9f43'];
      for (let i = 0; i < 4; i++) {
        const fx = 5 + (i % 2) * 14 + rnd(x, y, i) * 6, fy = 9 + Math.floor(i / 2) * 13;
        const col = cols[Math.floor(rnd(x, y, i + 20) * cols.length)];
        s += `<path d="M${fx} ${fy + 7}v-6" stroke="#3f8f3a" stroke-width="1.4"/><ellipse cx="${fx - 2}" cy="${fy + 4}" rx="2" ry="1" fill="#4caf50"/>`;
        s += [0, 72, 144, 216, 288].map(a => `<circle cx="${fx + Math.cos(a * Math.PI / 180) * 2.2}" cy="${fy + Math.sin(a * Math.PI / 180) * 2.2}" r="1.7" fill="${col}"/>`).join('');
        s += `<circle cx="${fx}" cy="${fy}" r="1.3" fill="#f9a825"/>`;
      }
      return s;
    }
    if (style === 'seagrass') {
      let s = sand(x, y);
      for (let i = 0; i < 4; i++) { const bx = 5 + i * 7 + rnd(x, y, i) * 3; s += `<path class="sway" d="M${bx} 30q-3-8 1-16q2 8-1 16z" fill="#2e9d6a"/><path class="sway" d="M${bx + 2} 30q3-7 0-13q-3 7 0 13z" fill="#43b97f"/>`; }
      return s;
    }
    let s = grassBase(t, x, y);
    const dark = style === 'reed' ? '#4f8f3a' : style === 'weed' ? '#6b7d55' : '#3f9a3a';
    const light = style === 'reed' ? '#7fbf5a' : style === 'weed' ? '#8a9c6f' : '#5cbf4f';
    for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
      const bx = 3 + i * 10 + rnd(x, y, i + row * 3) * 3, by = 15 + row * 13;
      s += `<path class="sway" d="M${bx} ${by}l2-9l2 9l2-11l2 11l2-8l1 8z" fill="${row ? dark : light}" stroke="${dark}" stroke-width=".6" stroke-linejoin="round"/>`;
      if (style === 'reed' && i === 1) s += `<rect x="${bx + 3.4}" y="${by - 15}" width="2" height="5" rx="1" fill="#8d5a2b"/>`;
    }
    return s;
  }
  function paddy(x, y) {
    let s = `<rect width="32" height="32" fill="#86c9e2"/><rect width="32" height="32" fill="#a8dcef" opacity=".35"/><rect width="32" height="2" fill="#a7835a"/>`;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const px = 4 + c * 8, py = 9 + r * 9;
      s += `<path class="sway" d="M${px} ${py}l-2-6M${px} ${py}l0-7M${px} ${py}l2-6" stroke="#4caf50" stroke-width="1.3" stroke-linecap="round"/>`;
    }
    return s;
  }
  function flowers(t, x, y) {
    let s = grassBase(t, x, y);
    const cols = ['#ffeb3b', '#ff80ab', '#ffffff', '#ce93d8'];
    for (let i = 0; i < 4; i++) {
      const fx = 5 + rnd(x, y, i) * 22, fy = 6 + rnd(x, y, i + 4) * 22, col = cols[Math.floor(rnd(x, y, i + 8) * 4)];
      s += [0, 90, 180, 270].map(a => `<circle cx="${fx + Math.cos(a * Math.PI / 180) * 1.6}" cy="${fy + Math.sin(a * Math.PI / 180) * 1.6}" r="1.3" fill="${col}"/>`).join('') + `<circle cx="${fx}" cy="${fy}" r="1" fill="#f57f17"/>`;
    }
    return s;
  }
  function road(x, y) {
    return `<rect width="32" height="32" fill="#5f6368"/><rect y="0" width="32" height="2" fill="#bdbdbd"/><rect y="30" width="32" height="2" fill="#bdbdbd"/>` +
      `<rect x="${x % 2 ? 4 : 18}" y="15" width="10" height="2" fill="#ffd54f"/>`;
  }
  function eco(x, y) {
    return `<rect width="32" height="32" fill="#7cc46a"/>` +
      Array.from({ length: 4 }, (_, i) => `<rect x="2" y="${2 + i * 8}" width="28" height="6" rx="1" fill="#b98552" stroke="#8a5d33" stroke-width=".8"/>`).join('') +
      `<rect x="0" y="0" width="3" height="32" fill="#6d4c2f"/><rect x="29" y="0" width="3" height="32" fill="#6d4c2f"/>` +
      `<path d="M8 6q2-3 4 0M20 22q2-3 4 0" stroke="#4caf50" stroke-width="1.4" fill="none"/>`;
  }
  function pollution(x, y, cleaned) {
    let s = grassBase('factory', x, y);
    if (cleaned) return s + `<path d="M16 9l1.5 3 3.2.4-2.3 2.2.6 3.2-3-1.6-3 1.6.6-3.2-2.3-2.2 3.2-.4z" fill="#fff59d" opacity=".9"/>`;
    s += `<ellipse cx="16" cy="19" rx="13" ry="8" fill="#2b2b2b" opacity=".85"/><ellipse cx="16" cy="19" rx="11" ry="6" fill="url(#oil)" opacity=".8"/>`;
    s += `<g class="bubble"><circle cx="11" cy="17" r="1.6" fill="#7cb342" opacity=".8"/><circle cx="21" cy="21" r="1.2" fill="#9ccc65" opacity=".8"/></g>`;
    return s;
  }
  function trace(t, x, y, found) {
    let s = grassBase(t, x, y);
    if (found) return s;
    const kind = Math.floor(rnd(x, y, 50) * 3);
    if (kind === 0) {  // 발자국
      [[9, 22], [17, 15], [12, 8]].forEach(([px, py]) => {
        s += `<ellipse cx="${px}" cy="${py}" rx="2.6" ry="2" fill="#6d4c2f" opacity=".85"/>` +
          [-2.5, 0, 2.5].map(d => `<circle cx="${px + d}" cy="${py - 3}" r=".9" fill="#6d4c2f" opacity=".85"/>`).join('');
      });
    } else if (kind === 1) {  // 깃털
      s += `<path d="M9 25q8-12 16-17q-4 9-16 17z" fill="#eceff1" stroke="#90a4ae" stroke-width=".8"/><path d="M9 25l16-17" stroke="#78909c" stroke-width=".8"/>`;
    } else {  // 도토리 껍데기
      s += [[10, 20], [18, 22], [15, 14]].map(([px, py]) => `<path d="M${px - 3} ${py}a3 3 0 0 0 6 0z" fill="#8d6e63"/><rect x="${px - 3.4}" y="${py - 1.6}" width="6.8" height="2" rx="1" fill="#5d4037"/>`).join('');
    }
    return s + `<circle cx="27" cy="5" r="3.2" fill="#ffca28" stroke="#6d4c2f" stroke-width=".8"/><text x="27" y="6.6" font-size="4.5" text-anchor="middle" fill="#6d4c2f" font-weight="900">?</text>`;
  }

  function ground(ch, x, y, t, state = {}) {
    const base = ['beach', 'island'].includes(t) && ch !== ',' ? null : null;
    let s;
    switch (ch) {
      case '=': case '@': case 'N': case 'Y': s = path(x, y); break;
      case 'S': case 'J': s = sand(x, y); break;
      case 'W': s = water(t, x, y); break;
      case ',': s = tall(t, x, y); break;
      case 'L': s = paddy(x, y); break;
      case 'F': s = flowers(t, x, y); break;
      case 'r': s = road(x, y); break;
      case 'E': s = eco(x, y); break;
      case 'O': s = pollution(x, y, state.cleaned); break;
      case 'Q': s = trace(t, x, y, state.found); break;
      case 'T': s = ['beach', 'island'].includes(t) ? sand(x, y) : grassBase(t, x, y); break;
      case 'h': s = path(x, y); break;
      case 'p': s = `<rect width="32" height="32" fill="#9e9e9e"/>`; break;
      default:
        if (BUILDINGS[ch]) s = path(x, y);
        else if ('<>^v'.includes(ch)) s = ['beach', 'island'].includes(t) ? sand(x, y) : path(x, y);
        else s = grassBase(t, x, y);
    }
    return svg(s);
  }

  /* ---------- 위로 솟는 그림 (나무, 건물 …) : viewBox 0 0 32 44 ---------- */
  const shadow = (w = 12) => `<ellipse cx="16" cy="41" rx="${w}" ry="3" fill="#000" opacity=".22"/>`;
  function tree(t, x, y) {
    const style = th(t).tree, v = rnd(x, y, 60);
    if (style === 'pine') {
      return shadow(10) + `<rect x="14" y="32" width="4" height="9" fill="#6d4c2f"/>` +
        `<path d="M16 4l11 14h-5l7 9h-6l6 8H3l6-8H3l7-9H5z" fill="#2e7d32"/>` +
        `<path d="M16 4l11 14h-5l7 9h-6l6 8H16z" fill="#1b5e20" opacity=".35"/>` +
        `<path d="M13 12l3-5 2 4M10 22l4-4M19 22l3-3" stroke="#66bb6a" stroke-width="1.2" fill="none" opacity=".8"/>`;
    }
    if (style === 'palm') {
      return shadow(9) + `<path d="M15 41q-1-14 3-26" stroke="#8d6e63" stroke-width="3.4" fill="none"/>` +
        `<path d="M15 41q-1-14 3-26" stroke="#a1887f" stroke-width="1" stroke-dasharray="2 2" fill="none"/>` +
        `<g fill="#2e9d4f"><path d="M18 15q-8-6-15-2q8-1 15 2z"/><path d="M18 15q8-7 14-1q-8-2-14 1z"/><path d="M18 15q-4-10 2-13q-2 6-2 13z"/>` +
        `<path d="M18 15q-9 1-12 9q5-7 12-9z"/><path d="M18 15q9 0 11 9q-5-7-11-9z"/></g><circle cx="17" cy="16" r="1.6" fill="#795548"/><circle cx="19.5" cy="16.5" r="1.6" fill="#6d4c41"/>`;
    }
    if (style === 'dead') {
      return shadow(8) + `<path d="M16 41V20M16 26l-6-6M16 23l5-6M10 20l-2-4M21 17l3-3" stroke="#6d5f53" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
    }
    const dark = v > .5 ? '#2e7d32' : '#388e3c', mid = v > .5 ? '#43a047' : '#4caf50', light = '#81c784';
    return shadow(12) + `<rect x="13.5" y="28" width="5" height="13" rx="1.5" fill="#7b5233"/><rect x="13.5" y="28" width="2" height="13" fill="#9c6b45"/>` +
      `<circle cx="9.5" cy="22" r="8" fill="${dark}"/><circle cx="22.5" cy="22" r="8" fill="${dark}"/><circle cx="16" cy="13" r="10" fill="${mid}"/>` +
      `<circle cx="16" cy="23" r="8" fill="${mid}"/><circle cx="12" cy="10" r="3.5" fill="${light}" opacity=".8"/><circle cx="8" cy="19" r="2.2" fill="${light}" opacity=".6"/>` +
      (v > .75 ? `<circle cx="20" cy="16" r="1.6" fill="#e53935"/><circle cx="12" cy="24" r="1.6" fill="#e53935"/>` : '');
  }
  function rock() {
    return shadow(11) + `<path d="M5 40l2-11 6-6 9 1 5 7 1 9z" fill="#90a4ae"/><path d="M13 23l9 1 5 7-8-2z" fill="#cfd8dc"/><path d="M5 40l2-11 6 4 5 7z" fill="#78909c"/>`;
  }
  function sign() {
    return shadow(7) + `<rect x="15" y="26" width="2.6" height="15" fill="#6d4c2f"/><rect x="6" y="17" width="20" height="12" rx="2" fill="#a1754a" stroke="#6d4c2f" stroke-width="1.4"/>` +
      `<path d="M9 21h14M9 25h10" stroke="#5d4037" stroke-width="1.4" stroke-linecap="round"/>`;
  }
  function exitSign(ch) {
    const rot = { '>': 0, v: 90, '<': 180, '^': 270 }[ch];
    return shadow(6) + `<rect x="15" y="22" width="2.6" height="19" fill="#6d4c2f"/><rect x="5" y="12" width="22" height="13" rx="3" fill="#1e88e5" stroke="#0d47a1" stroke-width="1.4"/>` +
      `<g transform="rotate(${rot} 16 18.5)"><path d="M10 18.5h10m-4-4 4 4-4 4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`;
  }
  function trash() { return `<g transform="translate(9 26) rotate(-25)"><rect width="7" height="13" rx="2" fill="#81d4fa" stroke="#0277bd" stroke-width="1"/><rect x="2" y="-2" width="3" height="3" fill="#e53935"/></g><ellipse cx="16" cy="41" rx="6" ry="1.6" fill="#000" opacity=".15"/>`; }
  function fence() {
    return `<rect x="0" y="30" width="32" height="2.4" fill="#eceff1" stroke="#90a4ae" stroke-width=".6"/><rect x="0" y="36" width="32" height="2.4" fill="#eceff1" stroke="#90a4ae" stroke-width=".6"/>` +
      [3, 12, 21, 29].map(px => `<path d="M${px - 2} 41v-13l2-2 2 2v13z" fill="#fafafa" stroke="#90a4ae" stroke-width=".7"/>`).join('');
  }
  function schoolPart(x, y, rows) {
    const up = (rows[y - 1] || '')[x] === 'h', left = rows[y][x - 1] === 'h', right = rows[y][x + 1] === 'h';
    let s = `<rect x="0" y="${up ? 0 : 14}" width="32" height="${up ? 44 : 30}" fill="#ffe0b2"/>`;
    if (!up) s += `<path d="M${left ? 0 : 2} 16L${left ? 0 : 6} 4h${32 - (left ? 0 : 6) - (right ? 0 : 6)}l${right ? 0 : 4} 12z" fill="#e57373" transform="translate(0 0)"/><rect x="0" y="14" width="32" height="3" fill="#c62828"/>`;
    s += `<rect x="5" y="${up ? 8 : 22}" width="9" height="8" fill="#81d4fa" stroke="#5d4037" stroke-width="1"/><rect x="18" y="${up ? 8 : 22}" width="9" height="8" fill="#81d4fa" stroke="#5d4037" stroke-width="1"/>`;
    if (up && (rows[y + 1] || '')[x] !== 'h') s += `<rect x="0" y="40" width="32" height="4" fill="#bcaaa4"/>`;
    return s;
  }
  function factoryPart(x, y, rows) {
    const up = (rows[y - 1] || '')[x] === 'p';
    let s = `<rect x="0" y="${up ? 0 : 12}" width="32" height="${up ? 44 : 32}" fill="#90a4ae"/>`;
    if (!up) s += `<path d="M0 12l8-8v8l8-8v8l8-8v8l8-8v8z" fill="#607d8b"/>`;
    s += `<rect x="4" y="${up ? 10 : 20}" width="24" height="5" fill="#455a64"/>`;
    if (!up && rnd(x, y, 70) > .45) s += `<rect x="22" y="-6" width="6" height="16" fill="#795548"/><g class="smoke"><circle cx="25" cy="-9" r="4" fill="#9e9e9e" opacity=".7"/><circle cx="28" cy="-15" r="5" fill="#bdbdbd" opacity=".55"/></g>`;
    return s;
  }
  const ROOF = { w: '#8d6e63', u: '#43a047', b: '#ab47bc', o: '#1e88e5', d: '#00897b', G: '#ef5350', A: '#ffb300', P: '#26c6da', D: '#7e57c2', K: '#66bb6a', M: '#ec407a', H: '#42a5f5', C: '#e53935', X: '#8d6e63' };
  function building(ch) {
    const roof = ROOF[ch] || '#ef5350';
    return `<ellipse cx="16" cy="42" rx="15" ry="2.6" fill="#000" opacity=".25"/>` +
      `<rect x="3" y="18" width="26" height="23" fill="#fff8e1" stroke="#5d4037" stroke-width="1.2"/>` +
      `<path d="M0 20L16 5l16 15z" fill="${roof}" stroke="#5d4037" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M16 5l16 15H16z" fill="#000" opacity=".12"/>` +
      `<rect x="12.5" y="29" width="7" height="12" rx="1" fill="#8d6e63" stroke="#5d4037" stroke-width="1"/><circle cx="18" cy="35" r=".8" fill="#ffd54f"/>` +
      `<rect x="5.5" y="24" width="5" height="5" fill="#81d4fa" stroke="#5d4037" stroke-width=".8"/><rect x="21.5" y="24" width="5" height="5" fill="#81d4fa" stroke="#5d4037" stroke-width=".8"/>`;
  }
  function car(x) {
    const col = ['#e53935', '#1e88e5', '#fdd835'][x % 3];
    return `<g transform="translate(4 28)"><rect width="24" height="9" rx="3" fill="${col}"/><rect x="5" y="-5" width="13" height="7" rx="2" fill="${col}"/><rect x="7" y="-4" width="9" height="5" fill="#b3e5fc"/><circle cx="6" cy="9" r="2.6" fill="#212121"/><circle cx="18" cy="9" r="2.6" fill="#212121"/></g>`;
  }

  // 위로 솟는 그림이 있으면 SVG 문자열, 없으면 ''
  function object(ch, x, y, t, rows, state = {}) {
    let s = '';
    if (ch === 'T') s = tree(t, x, y);
    else if (ch === 'R') s = rock();
    else if (ch === 'N' || ch === 'Y') s = sign();
    else if (ch === 'J' && !state.collected) s = trash();
    else if (ch === 'f') s = fence();
    else if (ch === 'h') s = schoolPart(x, y, rows);
    else if (ch === 'p') s = factoryPart(x, y, rows);
    else if (ch === 'r' && rnd(x, y, 80) > .72) s = car(x);
    else if (BUILDINGS[ch]) s = building(ch);
    else if ('<>^v'.includes(ch)) s = exitSign(ch);
    return s ? svg(s, '0 -8 32 52') : '';
  }

  // 지도 전체에서 한 번만 넣는 그라디언트 정의
  const DEFS = `<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="oil" x1="0" x2="1"><stop offset="0" stop-color="#7e57c2"/><stop offset=".35" stop-color="#26c6da"/><stop offset=".65" stop-color="#d4e157"/><stop offset="1" stop-color="#ff7043"/></linearGradient></defs></svg>`;

  return { ground, object, DEFS };
})();
