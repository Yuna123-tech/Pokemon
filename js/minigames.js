/* =========================================================
   🎪 놀이 광장 게임: 분류 두더지 · 먹이사슬 탑 · 생태 빙고 · OX 퀴즈쇼 · 오염 정화 디펜스
   (모든 내용은 교과서 「2. 생물과 환경」 범위)
   ========================================================= */
'use strict';

function simpleIntro({ icon, title, rules, onStart, bg = 'bg-meadow', topics = false, best }) {
  if (topics) { modeIntro({ icon, title, rules, onStart, bg }); return; }
  inStage = false; stopModeTimer();
  showTopbar(`${icon} ${title}`);
  clear(app);
  app.appendChild(h('section', { class: `screen mode-intro ${bg}` }, h('div', { class: 'panel' },
    h('h2', null, `${icon} ${title}`),
    h('ul', { class: 'rules' }, ...rules.map(r => h('li', { html: r }))),
    best ? h('p', { class: 'muted' }, best) : null,
    h('div', { class: 'row-btns' },
      h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로'),
      h('button', { class: 'btn primary big', onclick: () => { sfx.correct(); onStart(); } }, '▶ 시작!')))));
}
function monFor(id) { return CREATURES[id] && CREATURES[id].poke ? wildPokemonFor(id) : null; }

/* =========================================================
   🔨 분류 두더지 잡기
   ========================================================= */
const WHACK_RULES = [
  { label: '🌿 생산자만 잡아라!', test: c => c.role === 'producer', why: c => `${c.name}: ${c.living ? ROLE_INFO[c.role].label : '비생물 요소'}` },
  { label: '🍽️ 소비자만 잡아라!', test: c => c.role === 'consumer', why: c => `${c.name}: ${c.living ? ROLE_INFO[c.role].label : '비생물 요소'}` },
  { label: '🍄 분해자만 잡아라!', test: c => c.role === 'decomposer', why: c => `${c.name}: ${c.living ? ROLE_INFO[c.role].label : '비생물 요소'}` },
  { label: '🌱 생물 요소만 잡아라!', test: c => c.living, why: c => `${c.name}: ${c.living ? '생물 요소' : '비생물 요소'}` },
  { label: '🪨 비생물 요소만 잡아라!', test: c => !c.living, why: c => `${c.name}: ${c.living ? '생물 요소' : '비생물 요소'}` },
];
function modeWhack() {
  simpleIntro({ icon: '🔨', title: '분류 두더지 잡기', bg: 'bg-forest', best: save.stats.whackBest ? `내 최고 점수: ${save.stats.whackBest}점` : '',
    rules: ['구멍에서 생물과 비생물 요소가 튀어나와요. 화면 위의 <b>규칙</b>에 맞는 것만 빨리 눌러요!',
      '규칙은 12초마다 바뀌어요: 생산자 / 소비자 / 분해자 / 생물 요소 / 비생물 요소',
      '맞게 누르면 +10점(연속이면 더!), 틀리게 누르면 -5점. 45초 동안 최고 점수에 도전!'], onStart: runWhack });
}
function runWhack() {
  inStage = true;
  const ids = Object.keys(CREATURES);
  const holes = [];
  let score = 0, combo = 0, hits = 0, left = 45, ruleIdx = Math.floor(Math.random() * WHACK_RULES.length), ruleLeft = 12;
  const wrongs = [];
  clear(app);
  const ruleEl = h('div', { class: 'whack-rule' });
  const hud = h('div', { class: 'mode-hud' });
  const field = h('div', { class: 'whack-field' });
  for (let i = 0; i < 9; i++) { const hole = h('div', { class: 'hole' }, h('div', { class: 'hole-dirt' })); field.appendChild(hole); holes.push({ el: hole, busy: false }); }
  app.appendChild(h('section', { class: 'screen whack-screen' }, hud, ruleEl, field));
  const rule = () => WHACK_RULES[ruleIdx];
  const draw = () => {
    clear(hud); hud.append(h('span', null, `⏱️ ${Math.ceil(left)}초`), h('span', null, `⭐ ${score}점`), h('span', null, combo > 1 ? `🔥 ${combo}콤보` : '🔥 -'));
    ruleEl.textContent = `${rule().label} (${Math.ceil(ruleLeft)})`;
  };
  const pop = () => {
    const free = holes.filter(x => !x.busy);
    if (!free.length) return;
    const hole = pick(free);
    const want = Math.random() < 0.45;
    const cands = ids.filter(id => rule().test(CREATURES[id]) === want);
    const id = pick(cands.length ? cands : ids);
    const c = CREATURES[id];
    const mon = monFor(id);
    hole.busy = true;
    const mole = h('button', { class: 'mole' }, mon ? pokeImg(mon, c.emoji, 'mole-img') : h('span', { class: 'emoji-img mole-img' }, c.emoji), h('span', { class: 'mole-name' }, c.name));
    let hit = false;
    mole.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (hit || !inStage) return; hit = true;
      const ok = rule().test(c);
      countAnswer(ok);
      if (ok) { combo++; hits++; score += 10 + Math.min(combo - 1, 5) * 2; sfx.pop(); mole.classList.add('bonk'); popText(field, e, `+${10 + Math.min(combo - 1, 5) * 2}`, 'good'); }
      else { combo = 0; score = Math.max(0, score - 5); sfx.wrong(); mole.classList.add('oops'); popText(field, e, rule().why(c), 'bad'); wrongs.push({ q: `${rule().label} → ${c.name}`, answer: rule().why(c), explain: c.fact }); }
      draw();
      setTimeout(() => { mole.remove(); hole.busy = false; }, 300);
    });
    hole.el.appendChild(mole);
    const stay = Math.max(800, 1500 - (45 - left) * 12);
    setTimeout(() => { if (!hit) { mole.classList.add('down'); setTimeout(() => { mole.remove(); hole.busy = false; }, 200); } }, stay);
  };
  draw();
  let tick = 0;
  modeTimer = setInterval(() => {
    if (!inStage) { stopModeTimer(); return; }
    tick++;
    left -= 0.1; ruleLeft -= 0.1;
    if (tick % 7 === 0) pop();
    if (ruleLeft <= 0) { ruleIdx = (ruleIdx + 1 + Math.floor(Math.random() * 3)) % WHACK_RULES.length; ruleLeft = 12; sfx.level(); ruleEl.classList.remove('flash'); void ruleEl.offsetWidth; ruleEl.classList.add('flash'); }
    if (tick % 3 === 0) draw();
    if (left <= 0) {
      stopModeTimer(); inStage = false;
      const best = score > save.stats.whackBest; if (best) save.stats.whackBest = score;
      reward({ xp: hits * 3, coins: Math.floor(score / 15) });
      persist();
      resultScreen({ icon: '🔨', title: '분류 두더지 결과', lines: [`점수: <b>${score}점</b>`, `맞게 잡은 수: <b>${hits}</b>`, best ? '🎉 <b>새 최고 기록!</b>' : `내 최고 기록: ${save.stats.whackBest}점`], review: wrongs, again: runWhack });
    }
  }, 100);
}

/* =========================================================
   🗼 먹이사슬 탑 쌓기
   ========================================================= */
function modeTower() {
  simpleIntro({ icon: '🗼', title: '먹이사슬 탑 쌓기', bg: 'bg-meadow', best: save.stats.towerBest ? `내 최고 기록: ${save.stats.towerBest}층` : '',
    rules: ['맨 아래는 스스로 양분을 만드는 <b>생산자</b>예요. 그 생물을 <b>먹는 생물</b>을 골라 탑을 한 층씩 쌓아요!',
      '더 이상 먹는 생물이 없는 꼭대기에 닿으면 먹이사슬 완성! 보너스와 함께 새 먹이사슬을 이어 쌓아요.',
      '틀리면 ❤️가 줄어요. ❤️ 3개가 모두 없어지면 끝! (먹이 관계는 체육관 먹이그물 실험실과 같아요)'], onStart: runTower });
}
function runTower() {
  inStage = true;
  const producers = Object.keys(WEB_NODES).filter(id => CREATURES[id].role === 'producer');
  let lives = 3, floors = 0, chains = 0;
  const stack = [];   // [{ id, chainStart }]
  const wrongs = [];
  clear(app);
  const hud = h('div', { class: 'mode-hud' });
  const towerEl = h('div', { class: 'tower' });
  const panel = h('div', { class: 'panel q-panel' });
  app.appendChild(h('section', { class: 'screen tower-screen' }, hud, h('div', { class: 'tower-wrap' }, towerEl, panel)));
  const drawHud = () => { clear(hud); hud.append(h('span', null, `🗼 ${floors}층`), h('span', null, '❤️'.repeat(lives) + '🤍'.repeat(3 - lives)), h('span', null, `🔗 완성 ${chains}개`)); };
  const addBlock = (id, start) => {
    stack.push({ id, start });
    const mon = monFor(id);
    towerEl.prepend(h('div', { class: `t-block ${start ? 'start' : ''} role-${CREATURES[id].role}` },
      mon ? pokeImg(mon, CREATURES[id].emoji, 't-img') : creatureImg(id, 't-img'), h('b', null, webName(id)),
      h('span', { class: 'muted' }, start ? '생산자' : '↑ 먹는 생물')));
    towerEl.scrollTop = 0;
  };
  const newChain = () => { addBlock(pick(producers), true); ask(); };
  const ask = () => {
    drawHud();
    const top = stack[stack.length - 1].id;
    const eaters = WEB_EDGES.filter(e => e[0] === top).map(e => e[1]);
    clear(panel);
    if (!eaters.length) {
      chains++; sfx.clear();
      const r = reward({ xp: 20, coins: 5 });
      panel.append(h('div', { class: 'feedback ok' }, h('div', { class: 'feedback-title' }, `🎉 먹이사슬 완성! (${webName(top)} 꼭대기)`),
        h('div', { class: 'feedback-text' }, stack.slice(stack.map(s => s.start).lastIndexOf(true)).map(s => webName(s.id)).join(' ➜ ')),
        h('div', { class: 'feedback-extra' }, `보너스! ✨경험치 +20${r.coins ? ` 🪙+${r.coins}` : ''}`)),
        h('button', { class: 'btn primary', onclick: e => { e.currentTarget.disabled = true; newChain(); } }, '새 먹이사슬 이어 쌓기 ▶'));
      return;
    }
    const others = Object.keys(WEB_NODES).filter(x => x !== top && !eaters.includes(x) && CREATURES[x].role !== 'producer');
    const answer = pick(eaters);
    const choices = shuffle([answer, ...shuffle(others).slice(0, 2)]);
    const grid = h('div', { class: 'choice-grid' });
    choices.forEach(id => grid.appendChild(h('button', { class: 'choice-btn', onclick: e => {
      grid.querySelectorAll('button').forEach(b => { b.disabled = true; });
      const ok = eaters.includes(id);
      countAnswer(ok);
      if (ok) { e.currentTarget.classList.add('right'); sfx.correct(); floors++; reward({ xp: 8, coins: 1 }); addBlock(id, false); setTimeout(ask, 500); }
      else {
        e.currentTarget.classList.add('wrong'); sfx.wrong(); lives--; towerEl.classList.add('wobble'); setTimeout(() => towerEl.classList.remove('wobble'), 600);
        wrongs.push({ q: `${webName(top)}을(를) 먹는 생물은?`, answer: eaters.map(webName).join(', '), explain: `${webName(id)}${josa(webName(id), '은/는').slice(webName(id).length)} ${webName(top)}${josa(webName(top), '을/를').slice(webName(top).length)} 먹지 않아요.` });
        panel.append(h('div', { class: 'feedback no' }, h('div', { class: 'feedback-text' }, `${webName(top)}${josa(webName(top), '을/를').slice(webName(top).length)} 먹는 생물: ${eaters.map(webName).join(', ')}`),
          h('button', { class: 'btn primary', onclick: ev => { ev.currentTarget.disabled = true; if (lives <= 0) finish(); else ask(); } }, lives <= 0 ? '결과 보기 ▶' : '다시 고르기 ▶')));
        drawHud();
      }
    } }, h('div', { class: 'tc-img' }, creatureImg(id)), webName(id))));
    panel.append(h('div', { class: 'battle-prompt' }, `🔼 ${webName(top)}${josa(webName(top), '을/를').slice(webName(top).length)} 먹는 생물은 누구일까요?`), grid);
  };
  const finish = () => {
    inStage = false;
    const best = floors > save.stats.towerBest; if (best) save.stats.towerBest = floors;
    persist();
    resultScreen({ icon: '🗼', title: '먹이사슬 탑 결과', lines: [`쌓은 층: <b>${floors}층</b>`, `완성한 먹이사슬: <b>${chains}개</b>`, best ? '🎉 <b>새 최고 기록!</b>' : `내 최고 기록: ${save.stats.towerBest}층`], review: wrongs, again: runTower });
  };
  newChain();
}

/* =========================================================
   🎯 생태 빙고
   ========================================================= */
const BINGO_PAIRS = MEMORY_PAIRS.concat([
  ['생태계 보호 구역', '생물의 서식지를 보호하려고 정한 곳 (예: 한려 해상 국립 공원)'],
  ['위치 추적기', '야생 동물의 이동 경로를 실시간으로 알아내는 기기'],
  ['황새', '1970년대 초 우리나라에서 자취를 감춘 국제적 멸종 위기종 새'],
  ['에너지 절약', '쓰지 않는 전등 끄기처럼 생태계 보전을 위한 생활 실천'],
  ['일회용품', '사용을 줄이면 쓰레기가 줄어 생태계 보전에 도움이 되는 물건'],
  ['물고기 통로', '장애물이 있는 곳에 물고기가 이동하도록 만든 길'],
  ['충돌 방지 스티커', '투명 방음벽에 붙여 새를 보호하는 것'],
  ['동물의 흔적', '똥, 발자국, 깃털처럼 동물이 남긴 것'],
]);
function modeBingo() {
  simpleIntro({ icon: '🎯', title: '생태 빙고', bg: 'bg-lab', best: save.stats.bingoBest ? `내 최고 기록: ${save.stats.bingoBest}줄` : '',
    rules: ['내 빙고판(4×4)에 교과서 낱말 16개가 있어요.',
      '설명이 나오면 그 낱말을 빙고판에서 찾아 눌러요. 빙고판에 없으면 <b>「내 판에 없어요」</b>를 눌러요!',
      '12문제 동안 가로·세로·대각선 <b>빙고 줄</b>을 최대한 많이 만들어요.'], onStart: runBingo });
}
function runBingo() {
  inStage = true;
  const card = shuffle(BINGO_PAIRS).slice(0, 16);
  const calls = shuffle(BINGO_PAIRS).slice(0, 12);
  const marked = new Set();
  let qi = 0, correct = 0;
  const wrongs = [];
  clear(app);
  const hud = h('div', { class: 'mode-hud' });
  const callEl = h('div', { class: 'panel bingo-call' });
  const board = h('div', { class: 'bingo-board' });
  const lineCount = () => {
    const L = [];
    for (let i = 0; i < 4; i++) { L.push([0, 1, 2, 3].map(j => i * 4 + j)); L.push([0, 1, 2, 3].map(j => j * 4 + i)); }
    L.push([0, 5, 10, 15], [3, 6, 9, 12]);
    return L.filter(l => l.every(k => marked.has(k))).length;
  };
  const cells = card.map((p, i) => h('button', { class: 'bingo-cell', onclick: () => pickCell(i) }, p[0]));
  board.append(...cells);
  const notBtn = h('button', { class: 'btn', onclick: () => pickCell(-1) }, '🙅 내 판에 없어요');
  app.appendChild(h('section', { class: 'screen bingo-screen' }, hud, callEl, board, h('div', { class: 'row-btns' }, notBtn)));
  let locked = false;
  const show = () => {
    clear(hud); hud.append(h('span', null, `🎯 ${Math.min(qi + 1, 12)} / 12`), h('span', null, `🟩 빙고 ${lineCount()}줄`), h('span', null, `✅ ${correct}`));
    clear(callEl);
    if (qi >= 12) return finish();
    callEl.append(h('div', { class: 'muted' }, '이 설명에 맞는 낱말은?'), h('div', { class: 'big-text' }, `“${calls[qi][1]}”`));
    locked = false;
  };
  function pickCell(i) {
    if (locked || qi >= 12) return;
    locked = true;
    const target = card.findIndex(p => p[0] === calls[qi][0]);
    const ok = i === target;
    countAnswer(ok);
    if (ok) {
      correct++; sfx.correct();
      if (i >= 0) { marked.add(i); cells[i].classList.add('marked'); }
      else toast('👍 맞아요! 내 판에 없는 낱말이었어요.', 1200);
      const lines = lineCount();
      if (i >= 0 && lines > (pickCell.lastLines || 0)) { sfx.clear(); toast(`🎉 빙고! ${lines}줄`, 1500); }
      pickCell.lastLines = lines;
    } else {
      sfx.wrong();
      if (i >= 0) cells[i].classList.add('shake');
      if (target >= 0) cells[target].classList.add('hint');
      wrongs.push({ q: `“${calls[qi][1]}”`, answer: calls[qi][0] + (target < 0 ? ' (내 판에 없었어요)' : ''), explain: '' });
      toast(`정답: ${calls[qi][0]}${target < 0 ? ' — 내 판에 없었어요' : ''}`, 1600);
      setTimeout(() => { cells.forEach(c => c.classList.remove('shake', 'hint')); }, 1500);
    }
    qi++;
    setTimeout(show, ok ? 500 : 1600);
  }
  const finish = () => {
    inStage = false;
    const lines = lineCount();
    const best = lines > save.stats.bingoBest; if (best) save.stats.bingoBest = lines;
    reward({ xp: correct * 6, coins: lines * 5 + correct });
    persist();
    resultScreen({ icon: '🎯', title: '생태 빙고 결과', lines: [`빙고: <b>${lines}줄</b>`, `맞힌 문제: <b>${correct} / 12</b>`, best ? '🎉 <b>새 최고 기록!</b>' : `내 최고 기록: ${save.stats.bingoBest}줄`], review: wrongs, again: runBingo });
  };
  show();
}

/* =========================================================
   ⭕ OX 퀴즈쇼
   ========================================================= */
function modeOXShow() {
  simpleIntro({ icon: '⭕', title: 'OX 퀴즈쇼', bg: 'bg-champion', topics: true,
    rules: ['문장이 나오면 10초 안에 <b>⭕ 쪽</b>이나 <b>❌ 쪽</b>을 눌러 파트너를 이동시켜요.',
      '틀리면 파트너가 퐁당! ❤️ 3개가 모두 없어지기 전까지 최대한 오래 살아남아요. (최대 15문제)'], onStart: runOXShow });
}
function runOXShow(topics) {
  inStage = true;
  const qs = getQuestions({ topics, count: 15, types: ['ox'] });
  let qi = 0, lives = 3, correct = 0;
  const wrongs = [];
  clear(app);
  const hud = h('div', { class: 'mode-hud' });
  const qEl = h('div', { class: 'panel ox-q' });
  const timeFill = h('div', { class: 'time-fill' });
  const avatar = h('div', { class: 'ox-avatar' }, partnerImg('ox-avatar-img'));
  const zoneO = h('button', { class: 'ox-zone o' }, '⭕');
  const zoneX = h('button', { class: 'ox-zone x' }, '❌');
  const stage = h('div', { class: 'ox-stage' }, zoneO, zoneX, avatar);
  const info = h('div', { class: 'feedback-slot' });
  app.appendChild(h('section', { class: 'screen oxshow-screen' }, hud, qEl, h('div', { class: 'time-bar' }, timeFill), stage, info));
  let choice = null, locked = false;
  const move = side => { if (locked) return; choice = side; sfx.step(); avatar.className = `ox-avatar at-${side}`; };
  zoneO.addEventListener('click', () => move('o'));
  zoneX.addEventListener('click', () => move('x'));
  const ask = () => {
    stopModeTimer();
    clear(hud); hud.append(h('span', null, `⭕ ${qi + 1} / ${qs.length}`), h('span', null, '❤️'.repeat(lives) + '🤍'.repeat(3 - lives)), h('span', null, `✅ ${correct}`));
    clear(info);
    if (qi >= qs.length || lives <= 0) return finish();
    const q = qs[qi];
    clear(qEl); qEl.append(h('div', { class: 'big-text', html: q.q }));
    choice = null; locked = false; avatar.className = 'ox-avatar';
    stage.classList.remove('reveal-o', 'reveal-x');
    let left = 10;
    modeTimer = setInterval(() => {
      left -= 0.1; timeFill.style.width = Math.max(0, left / 10 * 100) + '%';
      if (left <= 0) { stopModeTimer(); judge(q); }
    }, 100);
  };
  const judge = q => {
    locked = true;
    const right = q.answer === OX_CHOICES[0] ? 'o' : 'x';
    const ok = choice === right;
    countAnswer(ok);
    stage.classList.add(`reveal-${right}`);
    if (ok) { correct++; sfx.correct(); reward({ xp: 8, coins: 1 }); avatar.classList.add('cheer'); }
    else { lives--; sfx.wrong(); avatar.classList.add('fall'); wrongs.push(q); }
    info.append(h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
      h('div', { class: 'feedback-title' }, ok ? '살아남았다! 🎉' : (choice ? '퐁당! 💦' : '⏰ 시간 초과! 💦')),
      h('div', { class: 'feedback-text', html: `정답: <b>${q.answer}</b> — ${q.explain}` }),
      h('button', { class: 'btn primary', onclick: e => { e.currentTarget.disabled = true; qi++; ask(); } }, '다음 ▶')));
    info.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const finish = () => {
    inStage = false; stopModeTimer();
    const best = correct > save.stats.oxBest; if (best) save.stats.oxBest = correct;
    persist();
    resultScreen({ icon: '⭕', title: 'OX 퀴즈쇼 결과', lines: [`맞힌 문제: <b>${correct}개</b>`, lives > 0 ? '🏆 끝까지 살아남았어요!' : '💦 다음엔 더 오래 버텨 봐요!', best ? '🎉 <b>새 최고 기록!</b>' : `내 최고 기록: ${save.stats.oxBest}개`], review: wrongs, again: () => runOXShow(topics) });
  };
  ask();
}

/* =========================================================
   🛡️ 오염 정화 디펜스
   ========================================================= */
function modeDefense() {
  simpleIntro({ icon: '🛡️', title: '오염 정화 디펜스', bg: 'bg-factory', best: save.stats.defenseBest ? `내 최고 점수: ${save.stats.defenseBest}점` : '',
    rules: ['오른쪽에서 오염 몬스터가 생태계(왼쪽 숲과 강)로 다가와요!',
      '몬스터를 누른 뒤, 그 오염이 <b>대기·수질·토양 오염</b> 중 무엇인지 골라 정화해요.',
      '몬스터가 생태계에 닿으면 ❤️가 줄어요. 60초 동안 생태계를 지켜요!'], onStart: runDefense });
}
function runDefense() {
  inStage = true;
  let score = 0, hp = 5, left = 60, selected = null, spawnEvery = 26, tick = 0, cleaned = 0;
  const wrongs = [];
  clear(app);
  const hud = h('div', { class: 'mode-hud' });
  const field = h('div', { class: 'def-field' }, h('div', { class: 'def-home' }, '🌳🏞️', h('small', null, '생태계')),
    ...[0, 1, 2].map(i => h('div', { class: 'def-lane', style: { top: `${8 + i * 30}%` } })));
  const typeBtns = h('div', { class: 'def-types' }, ...['air', 'water', 'soil'].map(t => {
    const m = POLLUTION_MONSTERS[t];
    return h('button', { class: 'btn def-type', disabled: 'disabled', onclick: () => judge(t) }, `${m.icon} ${m.label}`);
  }));
  const hint = h('p', { class: 'muted center' }, '👆 다가오는 몬스터를 먼저 눌러요!');
  app.appendChild(h('section', { class: 'screen defense-screen' }, hud, field, hint, typeBtns));
  const drawHud = () => { clear(hud); hud.append(h('span', null, `⏱️ ${Math.ceil(left)}초`), h('span', null, '❤️'.repeat(Math.max(0, hp)) + '🤍'.repeat(Math.max(0, 5 - hp))), h('span', null, `⭐ ${score}점`)); };
  const setButtons = on => typeBtns.querySelectorAll('button').forEach(b => { b.disabled = !on; });
  const spawn = () => {
    const pc = pick(POLLUTION_CASES), mon = POLLUTION_MONSTERS[pc.type];
    const lane = Math.floor(Math.random() * 3);
    const dur = Math.max(6, 11 - (60 - left) / 10);
    const el = h('button', { class: 'def-mon', style: { top: `${8 + lane * 30}%`, animationDuration: `${dur}s` } },
      pokeImg(mon.poke, mon.icon, 'def-img'), h('span', { class: 'def-label' }, `${pc.icon} ${pc.title}`));
    const m = { el, pc, alive: true };
    el.addEventListener('click', () => {
      if (!m.alive || !inStage) return;
      field.querySelectorAll('.def-mon.sel').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel'); selected = m; setButtons(true); sfx.click();
      hint.textContent = `「${pc.title}」은(는) 어떤 오염일까요?`;
    });
    el.addEventListener('animationend', () => {
      if (!m.alive) return;
      m.alive = false; el.remove(); hp--; sfx.wrong(); field.classList.add('hurt'); setTimeout(() => field.classList.remove('hurt'), 400);
      if (selected === m) { selected = null; setButtons(false); }
      drawHud();
      if (hp <= 0) end();
    });
    field.appendChild(el);
  };
  function judge(t) {
    if (!selected || !selected.alive) return;
    const m = selected; selected = null; setButtons(false);
    const ok = m.pc.type === t;
    countAnswer(ok);
    if (ok) { m.alive = false; m.el.classList.add('cleaned'); setTimeout(() => m.el.remove(), 400); score += 10; cleaned++; sfx.pop(); hint.textContent = `✨ 정화 성공! ${m.pc.explain}`; }
    else {
      sfx.wrong(); m.el.classList.remove('sel'); m.el.classList.add('angry'); score = Math.max(0, score - 3);
      const right = POLLUTION_MONSTERS[m.pc.type].label;
      hint.textContent = `❌ 「${m.pc.title}」은(는) ${right}이에요!`;
      wrongs.push({ q: m.pc.title, answer: right, explain: m.pc.explain });
    }
    drawHud();
  }
  const end = () => {
    if (!inStage) return;
    stopModeTimer(); inStage = false;
    field.querySelectorAll('.def-mon').forEach(x => x.remove());
    const best = score > save.stats.defenseBest; if (best) save.stats.defenseBest = score;
    reward({ xp: cleaned * 5, coins: Math.floor(score / 12) + (hp > 0 ? 5 : 0) });
    persist();
    resultScreen({ icon: '🛡️', title: '오염 정화 디펜스 결과',
      lines: [`점수: <b>${score}점</b> (정화 ${cleaned}마리)`, hp > 0 ? `🌳 생태계를 지켜 냈어요! (남은 ❤️ ${hp})` : '💔 생태계가 오염되었어요… 다시 도전!', best ? '🎉 <b>새 최고 기록!</b>' : `내 최고 기록: ${save.stats.defenseBest}점`],
      review: wrongs, again: runDefense });
  };
  drawHud(); spawn();
  modeTimer = setInterval(() => {
    if (!inStage) { stopModeTimer(); return; }
    tick++; left -= 0.1;
    if (tick % spawnEvery === 0) { spawn(); if (spawnEvery > 13 && tick % 100 === 0) spawnEvery -= 2; }
    if (tick % 5 === 0) drawHud();
    if (left <= 0) end();
  }, 100);
}
