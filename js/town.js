/* =========================================================
   생태 마을 · 숲길 · 강가 · 해변 (걸어 다니는 탐험 맵)
   ========================================================= */
'use strict';

const BLOCKED = new Set(['T', 'W', 'R']);
const TILE_ICON = { T: '🌳', ',': '🌾', F: '🌼', R: '🪨', N: '🪧', J: '🥤' };
const EXIT_ICON = { '<': '⬅️', '>': '➡️', '^': '⬆️', v: '⬇️' };
let townActive = false;
let walker = null;   // { timer }
let stepsSinceEncounter = 0;

function goTown(first = false) {
  inStage = false;
  closeModal();
  if (!save) { renderTitle(); return; }
  if (!MAPS[save.pos.map]) save.pos = { map: 'town', x: 7, y: 5 };
  renderWorld();
  if (first) {
    openModal(h('div', { class: 'center' },
      h('div', { class: 'evo-stage' }, partnerImg('evo-img')),
      h('h2', null, `${save.name}, 생태 마을에 온 걸 환영해요!`),
      h('p', null, '화면을 누르면 그곳으로 걸어가요. 건물에 들어가면 여러 가지 게임을 할 수 있어요.'),
      h('p', null, '🏟️ 체육관 길에서 교과서 순서대로 배우고, 숲길·강가·해변의 풀숲(🌾)에서 야생 생물을 만나 보세요!'),
      h('button', { class: 'btn primary', onclick: closeModal }, '탐험 시작! ▶')));
  } else {
    // 다른 친구 화면에서 레벨이 올라 진화를 아직 못 고른 이브이가 있으면 지금 골라요
    const info = partnerInfo();
    if (info && info.starter.branches && info.stage >= 1 && !info.data.branch) pendingEvents.push({ type: 'evolve', key: info.key, fromStage: 0, toStage: info.stage });
    flushEvents(() => { if (document.getElementById('player')) renderWorld(); });
  }
}

function tileAt(map, x, y) { const r = MAPS[map].rows[y]; return r ? r[x] : undefined; }
function trashGot(map, x, y) {
  if (save.trash.date !== todayStr()) save.trash = { date: todayStr(), got: [] };
  return save.trash.got.includes(`${map}:${x},${y}`);
}

function renderWorld() {
  const m = MAPS[save.pos.map];
  townActive = true;
  stopWalking();
  showTopbar(`🗺️ ${m.name}`);
  clear(app);
  const cols = m.rows[0].length, rows = m.rows.length;
  const grid = h('div', { class: `world world-${m.bg}`, style: { '--cols': cols, '--rows': rows } });
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const ch = m.rows[y][x];
    let cls = 'tile', content = null, label = null;
    if (BUILDINGS[ch]) { cls += ' t-building'; content = BUILDINGS[ch].icon; label = BUILDINGS[ch].name; }
    else if (m.exits[ch]) { cls += ' t-exit'; content = EXIT_ICON[ch]; label = MAPS[m.exits[ch].map].name; }
    else {
      cls += ' t-' + ({ T: 'tree', '.': 'grass', '=': 'path', '@': 'path', ',': 'tall', W: 'water', S: 'sand', F: 'flower', R: 'rock', J: 'sand', N: 'sign' }[ch] || 'grass');
      if (ch === 'J' && trashGot(save.pos.map, x, y)) content = null; else content = TILE_ICON[ch] || null;
    }
    const tile = h('div', { class: cls, 'data-x': x, 'data-y': y }, content ? h('span', { class: 'tile-ico' }, content) : null, label ? h('span', { class: 'tile-label' }, label) : null);
    tile.addEventListener('click', () => walkTo(x, y));
    grid.appendChild(tile);
  }
  const player = h('div', { class: 'player', id: 'player' }, partnerImg('player-img'));
  grid.appendChild(player);

  const quick = h('div', { class: 'quick-menu' },
    ...Object.entries(BUILDINGS).map(([k, b]) => h('button', { class: 'quick-btn', onclick: () => { sfx.click(); openPlace(b.go); } }, b.icon, h('span', null, b.name))),
    ...['town', 'forest', 'river', 'beach'].filter(k => k !== save.pos.map).map(k => h('button', { class: 'quick-btn region', onclick: () => {
      sfx.click(); const spot = findWalkable(k); save.pos = { map: k, x: spot.x, y: spot.y }; persist(); renderWorld();
    } }, { town: '🏘️', forest: '🌲', river: '🏞️', beach: '🏖️' }[k], h('span', null, MAPS[k].name))));

  app.appendChild(h('section', { class: 'screen world-screen' },
    partnerHud(),
    h('div', { class: 'world-wrap' }, grid),
    h('p', { class: 'muted center small-hint' }, '💡 가고 싶은 곳을 누르거나 방향키(←↑→↓)로 움직여요. 풀숲(🌾)에서는 야생 생물이 나타나요!'),
    h('h3', { class: 'quick-title' }, '🚀 바로 가기'),
    quick));
  placePlayer(false);
}

function findWalkable(map) {
  const m = MAPS[map];
  for (let y = 0; y < m.rows.length; y++) for (let x = 0; x < m.rows[y].length; x++) if (m.rows[y][x] === '@') return { x, y };
  const exit = Object.values(MAPS).flatMap(mm => Object.values(mm.exits)).find(e => e.map === map);
  return exit ? { x: exit.x, y: exit.y } : { x: 7, y: 5 };
}

function placePlayer(animate = true) {
  const p = document.getElementById('player');
  if (!p) return;
  p.classList.toggle('no-anim', !animate);
  p.style.setProperty('--x', save.pos.x);
  p.style.setProperty('--y', save.pos.y);
}

function stopWalking() { if (walker) { clearTimeout(walker.timer); walker = null; } }

function passable(map, x, y, isGoal) {
  const ch = tileAt(map, x, y);
  if (ch === undefined || BLOCKED.has(ch)) return false;
  if ((BUILDINGS[ch] || MAPS[map].exits[ch]) && !isGoal) return false;
  return true;
}

function findPath(map, sx, sy, tx, ty) {
  if (!passable(map, tx, ty, true)) return null;
  const key = (x, y) => `${x},${y}`;
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k)) continue;
      const goal = nx === tx && ny === ty;
      if (!passable(map, nx, ny, goal)) continue;
      prev.set(k, [x, y]); q.push([nx, ny]);
    }
  }
  if (!prev.has(key(tx, ty))) return null;
  const path = []; let cur = [tx, ty];
  while (cur && !(cur[0] === sx && cur[1] === sy)) { path.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
  return path;
}

function walkTo(tx, ty) {
  if (!townActive || !modal.classList.contains('hidden')) return;
  if (tx === save.pos.x && ty === save.pos.y) { arrive(true); return; }
  const path = findPath(save.pos.map, save.pos.x, save.pos.y, tx, ty);
  if (!path) { toast('그곳으로는 갈 수 없어요 🌳', 1000); return; }
  stopWalking();
  walker = { timer: null };
  const step = () => {
    if (!walker || !path.length) { walker = null; persist(); return; }
    const [x, y] = path.shift();
    save.pos.x = x; save.pos.y = y;
    placePlayer(true); sfx.step();
    walker.timer = setTimeout(() => {
      const stop = arrive(!path.length);
      if (stop) { walker = null; persist(); return; }
      step();
    }, 150);
  };
  step();
}

// 칸에 도착했을 때. true를 돌려주면 걷기를 멈춰요.
function arrive(isFinal) {
  const map = save.pos.map, { x, y } = save.pos;
  const ch = tileAt(map, x, y);
  const m = MAPS[map];
  if (m.exits[ch]) {
    const e = m.exits[ch];
    save.pos = { map: e.map, x: e.x, y: e.y }; persist();
    sfx.pop(); renderWorld(); toast(`📍 ${MAPS[e.map].name}`, 1000);
    return true;
  }
  if (BUILDINGS[ch]) { persist(); sfx.click(); openPlace(BUILDINGS[ch].go); return true; }
  if (ch === 'J' && !trashGot(map, x, y)) {
    save.trash.got.push(`${map}:${x},${y}`);
    const r = reward({ coins: 2, xp: 3 });
    const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"] .tile-ico`);
    if (tile) tile.remove();
    toast(r.coins ? '🗑️ 쓰레기를 주웠어요! 바다가 깨끗해졌어요 🪙+2' : '🗑️ 쓰레기를 주웠어요! 바다가 깨끗해졌어요', 1500);
  }
  if (ch === 'N' && isFinal) { openModal(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, '🪧'), h('p', { class: 'big-text' }, m.signs.N))); return true; }
  if (ch === ',') {
    stepsSinceEncounter++;
    if (stepsSinceEncounter >= 3 && Math.random() < 0.22) {
      stepsSinceEncounter = 0; persist();
      wildEncounter(pick(m.pool));
      return true;
    }
  }
  return false;
}

document.addEventListener('keydown', e => {
  if (!townActive || !document.getElementById('player') || !modal.classList.contains('hidden')) return;
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (!d) return;
  e.preventDefault();
  if (walker) return;
  const nx = save.pos.x + d[0], ny = save.pos.y + d[1];
  if (!passable(save.pos.map, nx, ny, true)) return;
  save.pos.x = nx; save.pos.y = ny; placePlayer(true); sfx.step();
  walker = { timer: setTimeout(() => { walker = null; arrive(true); persist(); }, 140) };
});

function openPlace(go) {
  townActive = false;
  stopWalking();
  ({ story: renderMap, round: () => modeRound(), speed: () => modeSpeed(), duel: () => modeDuel(), team: () => modeTeam(),
    memory: () => modeMemory(), shop: renderShop, center: renderCenter, exchange: renderExchange })[go]();
}

/* ---------- 야생 생물 만남 ---------- */
function encounterQuestion(id) {
  const all = AUTHORED_QUESTIONS.concat(generatedQuestions()).filter(q => q.subject && q.subject.creature === id);
  const deeper = all.filter(q => q.topic !== 1);
  const q = pick(deeper.length && Math.random() < 0.8 ? deeper : all);
  return Object.assign({}, q, { choices: q.shuffle ? shuffle(q.choices) : q.choices.slice() });
}

function wildEncounter(id) {
  const c = CREATURES[id];
  const q = encounterQuestion(id);
  if (!q) return;
  sfx.catch();
  const btns = h('div', { class: `choice-grid ${q.choices.length > 3 || q.choices.some(t => t.length > 14) ? 'long' : ''}` });
  const result = h('div');
  q.choices.forEach(label => btns.appendChild(h('button', { class: 'choice-btn', onclick: e => {
    btns.querySelectorAll('button').forEach(b => { b.disabled = true; });
    const ok = label === q.answer;
    countAnswer(ok);
    let msg;
    if (ok) {
      e.currentTarget.classList.add('right');
      const isNew = registerDex(id);
      save.stats.wild++;
      const r = reward({ xp: 12, coins: 3 });
      sfx.correct(); if (isNew) setTimeout(sfx.catch, 250);
      msg = `${isNew ? `📕 ${josa(c.name, '을/를')} 도감에 새로 등록했다!` : `${josa(c.name, '이/가')} 반갑게 인사하고 돌아갔어요.`}  ✨경험치 +12${r.coins ? `  🪙+${r.coins}` : ''}`;
    } else {
      e.currentTarget.classList.add('wrong');
      btns.querySelectorAll('button').forEach(b => { if (b.textContent === q.answer) b.classList.add('right'); });
      sfx.wrong();
      msg = `${josa(c.name, '은/는')} 풀숲으로 도망쳤다… 설명을 읽고 다음엔 꼭 맞혀요!`;
    }
    persist();
    result.append(h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
      h('div', { class: 'feedback-title' }, ok ? '정답! 🎉' : '아쉬워요! 💦'),
      h('div', { class: 'feedback-text', html: q.explain }),
      h('div', { class: 'feedback-extra' }, msg),
      h('button', { class: 'btn primary', onclick: () => { closeModal(); townActive = true; flushEvents(() => renderWorld()); } }, '계속 탐험하기 ▶')));
  } }, label)));
  openModal(h('div', { class: 'wild' },
    h('div', { class: 'wild-intro' }, `야생의 ${josa(c.name, '이/가')} 나타났다!`),
    h('div', { class: `wild-arena wild-${MAPS[save.pos.map].bg}` }, h('div', { class: 'wild-img bounce-in' }, creatureImg(id)),
      h('div', { class: 'name-plate' }, h('div', { class: 'np-main' }, c.name), h('div', { class: 'np-sub' }, `닮은 포켓몬: ${c.pname}`))),
    h('div', { class: 'battle-prompt', html: q.q }), btns, result), { locked: true });
}
