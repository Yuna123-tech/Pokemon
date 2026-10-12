/* =========================================================
   생태 마을 · 숲길 · 강가 · 해변 (걸어 다니는 탐험 맵)
   ========================================================= */
'use strict';

const BLOCKED = new Set(['T', 'W', 'R', 'h', 'f', 'p', 'r']);
const ENCOUNTER_TILES = new Set([',', 'L']);
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
  showTopbar(`${m.icon || '🗺️'} ${m.name}`);
  clear(app);
  const cols = m.rows[0].length, rows = m.rows.length;
  const grid = h('div', { class: `world world-${m.bg}`, style: { '--cols': cols, '--rows': rows } });
  grid.insertAdjacentHTML('beforeend', ART.DEFS);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const ch = m.rows[y][x];
    const done = trashGot(save.pos.map, x, y);
    const state = { collected: done, cleaned: done, found: done };
    const tile = h('div', { class: `tile ${BLOCKED.has(ch) ? 'blocked' : ''}`, 'data-x': x, 'data-y': y, html: ART.ground(ch, x, y, m.bg, state) });
    tile.addEventListener('click', () => walkTo(x, y));
    grid.appendChild(tile);
    // 나무·건물처럼 위로 솟은 그림 (아래쪽 줄일수록 앞에 보여요)
    const obj = ART.object(ch, x, y, m.bg, m.rows, state);
    if (obj) {
      const o = h('div', { class: `obj ${ch === 'T' ? 'obj-tree' : ''}`, 'data-ox': x, 'data-oy': y, html: obj, style: { '--x': x, '--y': y, zIndex: y * 10 + 2 } });
      if (BUILDINGS[ch]) o.append(h('span', { class: 'b-icon' }, BUILDINGS[ch].icon), h('span', { class: 'tile-label' }, BUILDINGS[ch].name));
      if (m.exits[ch]) o.append(h('span', { class: 'tile-label exit-label' }, MAPS[m.exits[ch].map].name));
      grid.appendChild(o);
    }
  }
  const player = h('div', { class: 'player', id: 'player' }, h('div', { class: 'player-shadow' }), partnerImg('player-img'));
  grid.appendChild(player);
  const weather = weatherOf(save.pos.map), W = WEATHER_INFO[weather];
  grid.appendChild(h('div', { class: `weather w-${weather} ${isNight() ? 'night' : ''} wmap-${m.bg}` }));
  missionEvent('visit', 1, save.pos.map);

  const quick = h('div', { class: 'quick-menu' },
    ...Object.entries(BUILDINGS).map(([k, b]) => h('button', { class: 'quick-btn', onclick: () => { sfx.click(); openPlace(b.go); } }, b.icon, h('span', null, b.name))),
    ...MAP_ORDER.filter(k => k !== save.pos.map).map(k => h('button', { class: 'quick-btn region', onclick: () => {
      sfx.click(); const spot = findWalkable(k); save.pos = { map: k, x: spot.x, y: spot.y }; persist(); renderWorld();
    } }, MAPS[k].icon, h('span', null, MAPS[k].name))));

  app.appendChild(h('section', { class: 'screen world-screen' },
    partnerHud(),
    h('div', { class: 'map-bar' },
      h('div', { class: 'map-title' }, `${m.icon} ${m.name}`),
      h('button', { class: 'weather-chip', onclick: () => toast(`${W.icon} ${W.name}${isNight() ? ' · 🌙 밤' : ''} — ${W.tip}${isNight() ? ' 밤에는 부엉이·너구리·반딧불이를 만나기 쉬워요.' : ''}`, 4200) }, `${W.icon} ${W.name}${isNight() ? ' 🌙' : ''}`),
      h('button', { class: 'mission-chip', onclick: () => { sfx.click(); openModal(missionsView()); } }, `📜 오늘의 미션 ${ensureMissions().filter(x => x.prog >= MISSION_POOL.find(mm => mm.id === x.id).goal).length}/3`)),
    h('div', { class: 'world-wrap' }, grid, buddyView()),
    h('p', { class: 'muted center small-hint' }, '💡 가고 싶은 곳을 누르거나 방향키(←↑→↓)로 움직여요. 풀숲·화단·논에서는 야생 생물이 나타나요!'),
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
  p.style.zIndex = save.pos.y * 10 + 5;
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
    missionEvent('trash');
    const o = document.querySelector(`.obj[data-ox="${x}"][data-oy="${y}"]`);
    if (o) o.remove();
    toast(r.coins ? '🗑️ 쓰레기를 주웠어요! 바다가 깨끗해졌어요 🪙+2' : '🗑️ 쓰레기를 주웠어요! 바다가 깨끗해졌어요', 1500);
  }
  if (ch === 'O' && !trashGot(map, x, y)) { persist(); pollutionEncounter(x, y); return true; }
  if (ch === 'Q' && !trashGot(map, x, y)) { persist(); traceEncounter(x, y); return true; }
  if (ch === 'E' && m.signs.E && !walker?.ecoShown) { if (walker) walker.ecoShown = true; toast(m.signs.E, 3200); }
  if ((ch === 'N' || ch === 'Y') && isFinal && m.signs[ch]) { openModal(h('div', { class: 'center' }, h('div', { class: 'big-emoji' }, '🪧'), h('p', { class: 'big-text' }, m.signs[ch]))); return true; }
  if (ENCOUNTER_TILES.has(ch)) {
    stepsSinceEncounter++;
    if (stepsSinceEncounter >= 3 && Math.random() < 0.22) {
      stepsSinceEncounter = 0; persist();
      wildEncounter(pickWild(map));
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
  const all = AUTHORED_QUESTIONS.concat(TRACE_QUESTIONS, generatedQuestions()).filter(q => q.subject && q.subject.creature === id);
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
      missionEvent(`meet-${c.role}`);
      catchAnimation(document.querySelector('.wild-arena'));
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
    const show = () => result.append(h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
      h('div', { class: 'feedback-title' }, ok ? '잡았다! 🎉' : '아쉬워요! 💦'),
      h('div', { class: 'feedback-text', html: q.explain }),
      h('div', { class: 'feedback-extra' }, msg),
      h('button', { class: 'btn primary', onclick: () => { closeModal(); townActive = true; flushEvents(() => renderWorld()); } }, '계속 탐험하기 ▶')));
    if (ok) setTimeout(show, 1700); else show();
  } }, label)));
  openModal(h('div', { class: 'wild' },
    h('div', { class: 'wild-intro' }, `야생의 ${josa(c.name, '이/가')} 나타났다!`),
    h('div', { class: `wild-arena wild-${MAPS[save.pos.map].bg}` }, h('div', { class: 'wild-img bounce-in' }, creatureImg(id)),
      h('div', { class: 'name-plate' }, h('div', { class: 'np-main' }, c.name), h('div', { class: 'np-sub' }, `닮은 포켓몬: ${c.pname}`))),
    h('div', { class: 'battle-prompt', html: q.q }), btns, result), { locked: true });
}

/* ---------- 오염 몬스터 정화 (공장 지대) ---------- */
function markDone(x, y) {
  if (save.trash.date !== todayStr()) save.trash = { date: todayStr(), got: [] };
  save.trash.got.push(`${save.pos.map}:${x},${y}`);
}
function tileQuiz({ intro, visual, q, onRight, rightMsg, wrongMsg }) {
  const btns = h('div', { class: `choice-grid ${q.choices.length > 3 || q.choices.some(t => t.length > 14) ? 'long' : ''}` });
  const result = h('div');
  q.choices.forEach(label => btns.appendChild(h('button', { class: 'choice-btn', onclick: e => {
    btns.querySelectorAll('button').forEach(b => { b.disabled = true; });
    const ok = label === q.answer;
    countAnswer(ok);
    let extra;
    if (ok) { e.currentTarget.classList.add('right'); sfx.correct(); extra = onRight(); }
    else { e.currentTarget.classList.add('wrong'); revealAnswer(btns, q.answer); sfx.wrong(); extra = wrongMsg; }
    persist();
    result.append(h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
      h('div', { class: 'feedback-title' }, ok ? rightMsg : '아쉬워요! 💦'),
      h('div', { class: 'feedback-text', html: q.explain }),
      extra ? h('div', { class: 'feedback-extra' }, extra) : null,
      h('button', { class: 'btn primary', onclick: () => { closeModal(); townActive = true; flushEvents(() => renderWorld()); } }, '계속 탐험하기 ▶')));
  } }, label)));
  openModal(h('div', { class: 'wild' }, h('div', { class: 'wild-intro' }, intro), visual, h('div', { class: 'battle-prompt', html: q.q }), btns, result), { locked: true });
}

function pollutionEncounter(x, y) {
  const type = pick(['air', 'water', 'soil']);
  const mon = POLLUTION_MONSTERS[type];
  const q = pick(getQuestions({ topics: [4], count: 30 }));
  sfx.wrong();
  tileQuiz({
    intro: `☠️ 오염 몬스터 ${josa(mon.pname, '이/가')} 나타났다!`,
    visual: h('div', { class: 'wild-arena wild-factory' }, h('div', { class: 'wild-img bounce-in' }, pokeImg(mon.poke, mon.icon)),
      h('div', { class: 'name-plate' }, h('div', { class: 'np-main' }, mon.label), h('div', { class: 'np-sub' }, `오염 몬스터 ${mon.pname}`))),
    q,
    rightMsg: '정화 성공! ✨',
    onRight: () => { markDone(x, y); missionEvent('clean'); const r = reward({ xp: 15, coins: 4 }); return `이곳이 깨끗해졌어요! ✨경험치 +15${r.coins ? `  🪙+${r.coins}` : ''}`; },
    wrongMsg: '오염 몬스터가 아직 남아 있어요. 설명을 읽고 다시 도전해요!',
  });
}

/* ---------- 동물의 흔적 (흔적 공원) ---------- */
function traceEncounter(x, y) {
  const q = Object.assign({}, pick(TRACE_QUESTIONS));
  q.choices = q.shuffle ? shuffle(q.choices) : q.choices.slice();
  sfx.pop();
  tileQuiz({
    intro: '🔍 동물의 흔적을 발견했다!',
    visual: h('div', { class: 'wild-arena wild-park' }, h('div', { class: 'trace-emoji bounce-in' }, (q.subject && q.subject.emoji) || '🐾'),
      h('p', { class: 'muted' }, '흔적은 맨손으로 만지지 않고 관찰해요 🧤')),
    q,
    rightMsg: '훌륭한 추리예요! 🕵️',
    onRight: () => { markDone(x, y); missionEvent('trace'); const r = reward({ xp: 12, coins: 3 }); return `흔적 탐정 성공! ✨경험치 +12${r.coins ? `  🪙+${r.coins}` : ''}`; },
    wrongMsg: '다시 한번 흔적을 잘 살펴봐요!',
  });
}

/* ---------- 몬스터볼 잡기 연출 ---------- */
function catchAnimation(arena) {
  if (!arena) return;
  arena.classList.add('catching');
  arena.appendChild(h('div', { class: 'catch-ball' }));
  setTimeout(() => { sfx.pop(); }, 700);
  setTimeout(() => { sfx.pop(); }, 1000);
  setTimeout(() => { sfx.catch(); arena.appendChild(h('div', { class: 'catch-stars' }, '✨ 잡았다! ✨')); }, 1400);
}

/* ---------- 🐾 따라다니는 파트너 (교과서 팁 말풍선) ---------- */
const BUDDY_TIPS = [
  '생태계는 생물 요소와 비생물 요소가 서로 영향을 주고받는 곳이야!',
  '햇빛, 물, 공기, 흙은 살아 있지 않은 비생물 요소야.',
  '식물 같은 생산자는 햇빛 등을 이용해 스스로 양분을 만들어.',
  '동물 같은 소비자는 다른 생물을 먹이로 하여 살아가.',
  '버섯, 곰팡이, 일부 세균은 죽은 생물체나 배출물을 분해하는 분해자야.',
  '먹고 먹히는 관계가 사슬처럼 이어진 것이 먹이사슬이야.',
  '여러 먹이사슬이 그물처럼 얽힌 것이 먹이그물이야. 복잡할수록 생태계가 안정적이야!',
  '환경오염에는 대기오염, 수질오염, 토양오염이 있어.',
  '미세 플라스틱은 크기 5 mm 이하의 작은 플라스틱이야.',
  '일회용품을 줄이고 에너지를 절약하면 생태계를 보전할 수 있어!',
  '생태통로는 동물이 안전하게 이동하도록 만든 길이야.',
  '황새 ‘엔젤’은 24시간 동안 1,200 km를 날아 대만까지 갔대!',
  '동물의 흔적은 맨손으로 만지지 말고 관찰해야 해.',
  '사람도 생태계의 일부야. 우리의 생활 방식이 생태계에 영향을 줘!',
];
let buddyTimer = null;
function buddyView() {
  clearInterval(buddyTimer);
  const info = partnerInfo();
  const data = info.data;
  const bubble = h('div', { class: 'buddy-bubble' }, pick(BUDDY_TIPS));
  const hearts = h('div', { class: 'buddy-hearts' });
  const love = h('span', { class: 'buddy-love' }, `💗 ${data.affection || 0}`);
  const pet = h('button', { class: 'buddy-poke', title: '쓰다듬기', onclick: () => {
    data.affection = (data.affection || 0) + 1; persist();
    love.textContent = `💗 ${data.affection}`;
    sfx.pop();
    const ht = h('span', { class: 'heart-pop' }, '💗'); hearts.appendChild(ht); setTimeout(() => ht.remove(), 900);
    bubble.textContent = pick([`${save.name}, 고마워! 💗`, '헤헤, 기분 좋아!', '같이 탐험하자!', ...BUDDY_TIPS]);
    if (data.affection % 20 === 0) { reward({ xp: 10 }); toast(`💗 ${josa(info.name, '와/과')} 더 친해졌어요! (경험치 +10)`); }
  } }, partnerImg('buddy-img'));
  buddyTimer = setInterval(() => { if (!document.body.contains(bubble)) { clearInterval(buddyTimer); return; } bubble.textContent = pick(BUDDY_TIPS); }, 14000);
  return h('div', { class: 'buddy' }, bubble, h('div', { class: 'buddy-body' }, hearts, pet, love));
}
