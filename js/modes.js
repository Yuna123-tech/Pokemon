/* =========================================================
   여러 가지 게임: 라운드전 · 스피드 퀴즈 · 1:1 대결 · 팀전 · 기억력 카드
   (문제는 모두 questions.js의 교과서 문제은행에서 나와요)
   ========================================================= */
'use strict';

let modeTimer = null;
function stopModeTimer() { if (modeTimer) { clearInterval(modeTimer); modeTimer = null; } }

// 게임 시작 전 안내 화면 (규칙 + 주제 고르기)
function modeIntro({ icon, title, rules, extra, onStart, bg = 'bg-meadow' }) {
  inStage = false; stopModeTimer();
  showTopbar(`${icon} ${title}`);
  clear(app);
  const topics = new Set([1, 2, 3, 4, 5]);
  app.appendChild(h('section', { class: `screen mode-intro ${bg}` },
    h('div', { class: 'panel' },
      h('h2', null, `${icon} ${title}`),
      h('ul', { class: 'rules' }, ...rules.map(r => h('li', { html: r }))),
      h('h3', null, '📚 문제 범위 (교과서 「2. 생물과 환경」)'),
      topicPicker(topics),
      extra || null,
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로'),
        h('button', { class: 'btn primary big', onclick: () => { sfx.correct(); onStart([...topics]); } }, '▶ 시작!')))));
}

function choiceButtons(q, onPick, cls = '') {
  const grid = h('div', { class: `choice-grid ${q.choices.length > 3 || q.choices.some(t => t.length > 14) ? 'long' : ''} ${cls}` });
  q.choices.forEach(label => grid.appendChild(h('button', { class: 'choice-btn', onclick: e => onPick(label, e.currentTarget, grid) }, label)));
  return grid;
}
function revealAnswer(grid, answer) {
  grid.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.textContent === answer) b.classList.add('right'); });
}

/* =========================================================
   🏆 라운드전 (서바이벌)
   ========================================================= */
function modeRound() {
  modeIntro({ icon: '🏆', title: '라운드 아레나', bg: 'bg-champion', rules: [
    '라운드마다 야생 포켓몬 도전자가 나타나요. 문제를 <b>3번 맞히면</b> 도전자를 이기고 다음 라운드로!',
    '틀리거나 시간이 다 되면 ❤️가 하나 줄어요. ❤️ 3개가 모두 없어지면 끝!',
    '라운드가 올라갈수록 제한 시간이 짧아져요. 최고 기록에 도전해요!',
  ], onStart: runRound });
}

function runRound(topics) {
  inStage = true;
  const pool = getQuestions({ topics, count: 300 });
  let qi = 0, round = 1, hearts = 3, hits = 0, correct = 0, challenger = pick(DEX_IDS), foeMon = wildPokemonFor(challenger);
  showTopbar('🏆 라운드 아레나');

  const ask = () => {
    stopModeTimer();
    if (!inStage) return;
    const q = pool[qi++ % pool.length];
    const limit = Math.max(8, 22 - round * 2);
    let left = limit;
    clear(app);
    const timeFill = h('div', { class: 'time-fill' });
    const grid = choiceButtons(q, (label, btn) => {
      stopModeTimer();
      const ok = label === q.answer;
      countAnswer(ok);
      revealAnswer(grid, q.answer);
      if (ok) {
        btn.classList.add('right'); sfx.correct(); hits++; correct++;
        reward({ xp: 10, coins: 1 });
        arena.querySelector('.foe').classList.add('hit');
      } else { if (btn) btn.classList.add('wrong'); sfx.wrong(); hearts--; arena.querySelector('.me').classList.add('hit'); }
      after(ok);
    });
    const arena = h('div', { class: 'round-arena' },
      h('div', { class: 'fighter me' }, partnerImg('fighter-img'), h('div', { class: 'fighter-name' }, partnerInfo().name)),
      h('div', { class: 'vs' }, 'VS'),
      h('div', { class: 'fighter foe' }, pokeImg(foeMon, CREATURES[challenger].emoji, 'fighter-img'),
        h('div', { class: 'fighter-name' }, `야생의 ${POKE_NAMES[foeMon]}`),
        h('div', { class: 'pips' }, ...[0, 1, 2].map(i => h('span', { class: i < hits ? 'off' : '' }, '●')))));
    const info = h('div', { class: 'feedback-slot' });
    const after = ok => {
      info.append(h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
        h('div', { class: 'feedback-title' }, ok ? (hits >= 3 ? `🎉 라운드 ${round} 클리어!` : '공격 성공! 💥') : (hearts <= 0 ? '💔 게임 끝!' : '앗, 공격을 받았다! 💦')),
        h('div', { class: 'feedback-text', html: q.explain }),
        h('button', { class: 'btn primary', onclick: e => {
          e.currentTarget.disabled = true; sfx.click();
          if (hearts <= 0) return finish();
          if (hits >= 3) { reward({ coins: 2 + round, xp: 10 }); registerMon(foeMon); toast(`⚪ ${POKE_NAMES[foeMon]}${josa(POKE_NAMES[foeMon], '을/를').slice(-1)} 이겼다! 포켓몬 도감 등록`); round++; hits = 0; challenger = pick(DEX_IDS); foeMon = wildPokemonFor(challenger); }
          ask();
        } }, hearts <= 0 ? '결과 보기 ▶' : '다음 ▶')));
      info.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    app.appendChild(h('section', { class: 'screen round-screen' },
      h('div', { class: 'mode-hud' }, h('span', null, `🏆 라운드 ${round}`), h('span', null, '❤️'.repeat(hearts) + '🤍'.repeat(3 - hearts)), h('span', null, `✅ ${correct}`)),
      arena,
      h('div', { class: 'panel q-panel' },
        h('div', { class: 'time-bar' }, timeFill),
        h('div', { class: 'battle-prompt', html: q.q }), grid, info)));
    modeTimer = setInterval(() => {
      left -= 0.1; timeFill.style.width = Math.max(0, left / limit * 100) + '%';
      if (left <= 0) {
        stopModeTimer(); countAnswer(false); revealAnswer(grid, q.answer); sfx.wrong(); hearts--;
        arena.querySelector('.me').classList.add('hit');
        info.append(h('div', { class: 'muted' }, '⏰ 시간 초과!')); after(false);
      }
    }, 100);
  };

  const finish = () => {
    inStage = false; stopModeTimer();
    const cleared = round - 1;
    const best = cleared > save.stats.roundBest;
    if (best) save.stats.roundBest = cleared;
    missionEvent('round', cleared);
    persist();
    resultScreen({ icon: '🏆', title: '라운드전 결과', lines: [`클리어한 라운드: <b>${cleared}</b>`, `맞힌 문제: <b>${correct}</b>개`, best ? '🎉 <b>새 최고 기록!</b>' : `내 최고 기록: ${save.stats.roundBest}라운드`], again: () => runRound(topics) });
  };
  ask();
}

/* =========================================================
   ⏱️ 스피드 퀴즈 (60초)
   ========================================================= */
function modeSpeed() {
  modeIntro({ icon: '⏱️', title: '스피드 트랙', bg: 'bg-meadow', rules: [
    '<b>60초</b> 동안 최대한 많은 문제를 맞혀요!',
    '연속으로 맞히면 <b>콤보 점수</b>가 붙어요. 틀리면 콤보가 끊겨요.',
    '끝나면 틀린 문제를 해설과 함께 다시 볼 수 있어요.',
  ], onStart: runSpeed });
}

function runSpeed(topics) {
  inStage = true;
  const pool = getQuestions({ topics, count: 200 });
  let qi = 0, score = 0, combo = 0, correct = 0, left = 60;
  const wrongs = [];
  clear(app);
  const timeEl = h('span'), scoreEl = h('span'), comboEl = h('span');
  const body = h('div', { class: 'panel q-panel speed-panel' });
  app.appendChild(h('section', { class: 'screen speed-screen' },
    h('div', { class: 'mode-hud' }, timeEl, scoreEl, comboEl), body));
  const hud = () => { timeEl.textContent = `⏱️ ${Math.ceil(left)}초`; scoreEl.textContent = `⭐ ${score}점`; comboEl.textContent = combo > 1 ? `🔥 ${combo}콤보` : '🔥 -'; };
  const ask = () => {
    if (!inStage) return;
    const q = pool[qi++ % pool.length];
    clear(body);
    body.append(subjectView(q.subject, 'small'), h('div', { class: 'battle-prompt', html: q.q }),
      choiceButtons(q, (label, btn, grid) => {
        const ok = label === q.answer;
        countAnswer(ok); revealAnswer(grid, q.answer);
        if (ok) { combo++; correct++; score += 10 + (combo - 1) * 2; btn.classList.add('right'); sfx.correct(); }
        else { combo = 0; btn.classList.add('wrong'); sfx.wrong(); wrongs.push(q); }
        hud();
        setTimeout(ask, ok ? 350 : 900);
      }));
  };
  hud(); ask();
  modeTimer = setInterval(() => {
    left -= 0.25; hud();
    if (left <= 0) {
      stopModeTimer(); inStage = false;
      const best = score > save.stats.speedBest;
      if (best) save.stats.speedBest = score;
      missionEvent('speed', score);
      reward({ xp: correct * 6, coins: Math.floor(score / 20) });
      persist();
      resultScreen({ icon: '⏱️', title: '스피드 퀴즈 결과',
        lines: [`점수: <b>${score}점</b>`, `맞힌 문제: <b>${correct}</b>개`, best ? '🎉 <b>새 최고 기록!</b>' : `내 최고 기록: ${save.stats.speedBest}점`],
        review: wrongs, again: () => runSpeed(topics) });
    }
  }, 250);
}

/* ---------- 결과 화면 ---------- */
function resultScreen({ icon, title, lines, review = [], again }) {
  inStage = false; stopModeTimer();
  clear(app); sfx.clear();
  app.appendChild(h('section', { class: 'screen' },
    h('div', { class: 'panel center' },
      h('div', { class: 'confetti' }),
      h('div', { class: 'badge-big' }, icon),
      h('h2', null, title),
      ...lines.map(l => h('p', { class: 'big-text', html: l })),
      h('p', { class: 'muted' }, `🪙 코인 ${save.coins} · 오늘 더 벌 수 있는 코인 ${coinsLeftToday()}`),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn primary', onclick: again }, '↺ 다시 하기'),
        h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로'))),
    review.length ? h('div', { class: 'panel' }, h('h3', null, '📝 틀린 문제 다시 보기'),
      ...review.slice(0, 10).map(q => h('div', { class: 'review-item' }, h('div', { html: '❓ ' + q.q }), h('div', { class: 'review-ans' }, `정답: ${q.answer}`), h('div', { class: 'muted', html: q.explain })))) : null));
  setTimeout(() => flushEvents(), 700);
}

/* =========================================================
   ⚔️ 1:1 대결 (한 기기에서 두 명이)
   ========================================================= */
function modeDuel() {
  inStage = false; stopModeTimer();
  showTopbar('⚔️ 대결장');
  clear(app);
  const names = Object.keys(store.profiles);
  const playerPicker = (def) => {
    const sel = h('select', { class: 'select' }, h('option', { value: '' }, '👤 손님 (기록 안 남음)'), ...names.map(n => h('option', { value: n }, `🧢 ${n}`)));
    sel.value = def || '';
    return sel;
  };
  const p1 = playerPicker(save.name), p2 = playerPicker('');
  const g1 = h('input', { type: 'text', placeholder: '손님 이름', value: '친구 1' });
  const g2 = h('input', { type: 'text', placeholder: '손님 이름', value: '친구 2' });
  const face = h('input', { type: 'checkbox' });
  const topics = new Set([1, 2, 3, 4, 5]);
  app.appendChild(h('section', { class: 'screen bg-factory' },
    h('div', { class: 'panel' },
      h('h2', null, '⚔️ 1:1 포켓몬 대결'),
      h('ul', { class: 'rules' },
        h('li', { html: '한 기기에서 두 명이 대결해요. 같은 문제가 나오면 <b>먼저 맞힌 사람</b>이 공격!' }),
        h('li', { html: '빨리 맞히면(4초 안) <b>급소 공격</b>으로 더 큰 피해! 틀리면 그 문제는 더 못 풀어요.' }),
        h('li', { html: '상대 포켓몬의 HP를 0으로 만들면 승리! 내 트레이너로 하면 이긴 사람이 더 큰 보상을 받아요.' })),
      h('div', { class: 'duel-setup' },
        h('div', { class: 'duel-side' }, h('h3', null, '🔴 플레이어 1'), p1, g1),
        h('div', { class: 'duel-side' }, h('h3', null, '🔵 플레이어 2'), p2, g2)),
      h('label', { class: 'toggle-row' }, face, ' 태블릿을 가운데 두고 마주 보고 하기 (플레이어 2 화면 뒤집기)'),
      h('h3', null, '📚 문제 범위'), topicPicker(topics),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로'),
        h('button', { class: 'btn primary big', onclick: () => {
          const mk = (sel, guest) => {
            if (sel.value) { const pi = partnerInfo(null, store.profiles[sel.value]); return { name: sel.value, profile: sel.value, poke: pi.poke, pname: pi.name }; }
            const gp = pick(Object.keys(POKE_NAMES).map(Number));
            return { name: guest.value.trim() || '손님', profile: null, poke: gp, pname: POKE_NAMES[gp] };
          };
          const a = mk(p1, g1), b = mk(p2, g2);
          if (a.profile && a.profile === b.profile) { toast('두 플레이어가 같은 트레이너예요!'); return; }
          sfx.correct(); runDuel(a, b, [...topics], face.checked);
        } }, '⚔️ 대결 시작!')))));
}

function rewardProfile(name, opts) {
  if (!name || !store.profiles[name]) return;
  if (name === save.name) { reward(opts); return; }
  const prev = save, before = pendingEvents.length;
  save = store.profiles[name];
  reward(opts);
  pendingEvents.length = before;   // 다른 친구의 레벨업 알림은 그 친구가 들어올 때 확인해요
  save = prev; persist(); updateCoinChip();
}

function runDuel(a, b, topics, facing) {
  inStage = true;
  const pool = getQuestions({ topics, count: 40 });
  const players = [Object.assign(a, { hp: 100, hits: 0 }), Object.assign(b, { hp: 100, hits: 0 })];
  let qi = 0;
  showTopbar('⚔️ 대결 중!');
  clear(app);
  const center = h('div', { class: 'duel-center' });
  const panels = players.map((p, i) => h('div', { class: `duel-panel p${i + 1} ${facing && i === 1 ? 'flip' : ''}` }));
  app.appendChild(h('section', { class: `screen duel-screen ${facing ? 'facing' : ''}` }, panels[1], center, panels[0]));

  const drawPanel = (i, q, state) => {
    const p = players[i]; const panel = panels[i];
    clear(panel);
    const hpPct = Math.max(0, p.hp);
    panel.append(
      h('div', { class: 'duel-top' },
        h('div', { class: 'duel-poke' }, pokeImg(p.poke, '⚪', 'duel-img')),
        h('div', { class: 'duel-meta' },
          h('div', { class: 'duel-name' }, `${i ? '🔵' : '🔴'} ${p.name} · ${p.pname}`),
          h('div', { class: 'hp-bar' }, h('div', { class: `hp-fill ${hpPct > 50 ? 'g' : hpPct > 20 ? 'y' : 'r'}`, style: { width: hpPct + '%' } })),
          h('div', { class: 'hp-text' }, `HP ${Math.max(0, p.hp)} / 100`))),
      h('div', { class: 'duel-q', html: q.q }),
      state.grids[i]);
  };

  const next = () => {
    if (!inStage) return;
    stopModeTimer();
    if (players.some(p => p.hp <= 0) || qi >= 15) return finish();
    const q = pool[qi++ % pool.length];
    const started = Date.now();
    const state = { locked: [false, false], done: false, grids: [] };
    state.grids = [0, 1].map(i => choiceButtons(q, (label, btn, grid) => {
      if (state.done || state.locked[i]) return;
      const ok = label === q.answer;
      if (ok) {
        state.done = true; stopModeTimer();
        btn.classList.add('right'); sfx.correct();
        const fast = Date.now() - started < 4000;
        const dmg = fast ? 34 : 25;
        const foe = players[1 - i];
        foe.hp -= dmg; players[i].hits++;
        resolve(`${players[i].name}의 ${players[i].pname} 공격! ${fast ? '⚡ 급소에 맞았다! ' : ''}-${dmg}`, i);
      } else {
        state.locked[i] = true; btn.classList.add('wrong'); sfx.wrong();
        grid.querySelectorAll('button').forEach(b => { b.disabled = true; });
        if (state.locked[0] && state.locked[1]) { state.done = true; stopModeTimer(); resolve('둘 다 틀렸어요! 아무도 공격하지 못했어요.', -1); }
      }
    }));
    drawPanel(0, q, state); drawPanel(1, q, state);
    let left = 20;
    const tEl = h('div', { class: 'duel-timer' }, `⏱️ ${left}`);
    clear(center); center.append(h('div', { class: 'duel-vs' }, `문제 ${qi} / 15`), tEl);
    modeTimer = setInterval(() => {
      left--; tEl.textContent = `⏱️ ${left}`;
      if (left <= 0 && !state.done) { state.done = true; stopModeTimer(); resolve('⏰ 시간 초과! 아무도 공격하지 못했어요.', -1); }
    }, 1000);

    function resolve(msg, attacker) {
      state.grids.forEach(g => revealAnswer(g, q.answer));
      [0, 1].forEach(i => {
        const hpFill = panels[i].querySelector('.hp-fill'), hpText = panels[i].querySelector('.hp-text');
        const hp = Math.max(0, players[i].hp);
        hpFill.style.width = hp + '%'; hpFill.className = `hp-fill ${hp > 50 ? 'g' : hp > 20 ? 'y' : 'r'}`; hpText.textContent = `HP ${hp} / 100`;
      });
      if (attacker >= 0) panels[1 - attacker].querySelector('.duel-poke').classList.add('hit');
      clear(center);
      center.append(h('div', { class: 'duel-msg' }, msg), h('div', { class: 'duel-explain', html: `정답: <b>${q.answer}</b><br>${q.explain}` }),
        h('button', { class: 'btn primary', onclick: e => { e.currentTarget.disabled = true; sfx.click(); next(); } },
          players.some(p => p.hp <= 0) || qi >= 15 ? '결과 보기 ▶' : '다음 문제 ▶'));
    }
  };

  const finish = () => {
    inStage = false; stopModeTimer();
    const [p1, p2] = players;
    const winner = p1.hp === p2.hp ? null : (p1.hp > p2.hp ? p1 : p2);
    players.forEach(p => {
      if (!p.profile) return;
      const won = p === winner;
      rewardProfile(p.profile, { xp: won ? 40 : 20 + p.hits * 3, coins: won ? 12 : 5 });
      if (won) store.profiles[p.profile].stats.duelWins++;
    });
    persist(); sfx.clear();
    clear(app);
    app.appendChild(h('section', { class: 'screen' }, h('div', { class: 'panel center' },
      h('div', { class: 'confetti' }),
      h('h2', null, winner ? `🏆 ${winner.name} 승리!` : '🤝 무승부!'),
      winner ? h('div', { class: 'evo-stage' }, pokeImg(winner.poke, '🏆', 'evo-img')) : null,
      h('p', { class: 'big-text' }, `${p1.name} HP ${Math.max(0, p1.hp)}  vs  ${p2.name} HP ${Math.max(0, p2.hp)}`),
      h('p', { class: 'muted' }, '내 트레이너로 참가한 사람은 경험치와 코인을 받았어요. (이긴 사람 🪙12 · 진 사람 🪙5)'),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn primary', onclick: () => { p1.hp = 100; p2.hp = 100; runDuel(Object.assign(a, { hp: 100, hits: 0 }), Object.assign(b, { hp: 100, hits: 0 }), topics, facing); } }, '↺ 다시 대결'),
        h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로')))));
    setTimeout(() => flushEvents(), 700);
  };
  next();
}

/* =========================================================
   👥 팀전 (전자칠판 · 프로젝터용, 선생님 진행)
   ========================================================= */
const TEAM_LINES = [
  { name: '피카츄 팀', line: [172, 25, 26], color: '#fbc02d' },
  { name: '꼬부기 팀', line: [7, 8, 9], color: '#29b6f6' },
  { name: '이상해씨 팀', line: [1, 2, 3], color: '#66bb6a' },
  { name: '파이리 팀', line: [4, 5, 6], color: '#ff7043' },
];
function modeTeam() {
  inStage = false; stopModeTimer();
  showTopbar('👥 팀전 경기장');
  clear(app);
  let count = 4;
  const topics = new Set([1, 2, 3, 4, 5]);
  const nameInputs = TEAM_LINES.map(t => h('input', { type: 'text', value: t.name }));
  const countRow = h('div', { class: 'seg' });
  const qSel = h('select', { class: 'select' }, ...[10, 15, 20].map(n => h('option', { value: n }, `${n}문제`)));
  const drawCount = () => {
    clear(countRow);
    [2, 3, 4].forEach(n => countRow.appendChild(h('button', { class: `seg-btn ${n === count ? 'on' : ''}`, onclick: () => { count = n; drawCount(); } }, `${n}팀`)));
    nameInputs.forEach((inp, i) => { inp.parentElement && inp.parentElement.classList.toggle('hidden', i >= count); });
  };
  const teamRows = h('div', { class: 'team-setup' }, ...TEAM_LINES.map((t, i) => h('div', { class: 'team-row', style: { '--tc': t.color } }, pokeImg(t.line[0], '⚪', 'team-mini'), nameInputs[i])));
  app.appendChild(h('section', { class: 'screen bg-champion' },
    h('div', { class: 'panel' },
      h('h2', null, '👥 팀전 (전자칠판용)'),
      h('ul', { class: 'rules' },
        h('li', { html: '선생님이 진행하는 모둠 대항전이에요. 문제가 크게 나오면 모둠별로 답을 정해 화이트보드에 적어요.' }),
        h('li', { html: '<b>정답 공개</b>를 누른 뒤, 맞힌 팀을 모두 골라 <b>점수 주기</b>를 눌러요. 5번째마다 <b>보너스 라운드(점수 2배)</b>!' }),
        h('li', { html: '점수가 오르면 팀 포켓몬이 진화해요! (300점, 600점)' })),
      h('h3', null, '팀 수'), countRow, teamRows,
      h('h3', null, '문제 수'), qSel,
      h('h3', null, '📚 문제 범위'), topicPicker(topics),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로'),
        h('button', { class: 'btn primary big', onclick: () => {
          const teams = TEAM_LINES.slice(0, count).map((t, i) => ({ name: nameInputs[i].value.trim() || t.name, line: t.line, color: t.color, score: 0 }));
          sfx.correct(); runTeam(teams, [...topics], Number(qSel.value));
        } }, '▶ 팀전 시작!')))));
  drawCount();
}

function runTeam(teams, topics, total) {
  inStage = true;
  const pool = getQuestions({ topics, count: total, types: null });
  let qi = 0;
  const teamStage = s => s >= 600 ? 2 : s >= 300 ? 1 : 0;
  const board = h('div', { class: 'team-board' });
  const main = h('div', { class: 'team-main panel' });
  clear(app);
  app.appendChild(h('section', { class: 'screen team-screen' }, board, main));
  const drawBoard = () => {
    clear(board);
    const max = Math.max(...teams.map(t => t.score));
    teams.forEach(t => board.appendChild(h('div', { class: `team-card ${t.score === max && max > 0 ? 'lead' : ''}`, style: { '--tc': t.color } },
      pokeImg(t.line[teamStage(t.score)], '⚪', 'team-img'), h('div', { class: 'team-name' }, t.name), h('div', { class: 'team-score' }, t.score))));
  };
  const ask = () => {
    stopModeTimer();
    if (qi >= total) return finish();
    const q = pool[qi++];
    const bonus = qi % 5 === 0;
    let left = 30, running = true;
    clear(main);
    const tEl = h('div', { class: 'team-timer' }, `⏱️ ${left}`);
    const choices = h('div', { class: 'team-choices' }, ...q.choices.map((c, i) => h('div', { class: 'team-choice' }, h('b', null, '①②③④'[i] + ' '), c)));
    const pauseBtn = h('button', { class: 'btn small' }, '⏸️ 멈춤');
    pauseBtn.addEventListener('click', () => { running = !running; pauseBtn.textContent = running ? '⏸️ 멈춤' : '▶️ 계속'; });
    const revealBtn = h('button', { class: 'btn primary', onclick: () => reveal() }, '👀 정답 공개');
    main.append(
      h('div', { class: 'team-qhead' }, h('span', null, `문제 ${qi} / ${total}`), bonus ? h('span', { class: 'bonus' }, '🌟 보너스 라운드 ×2') : null, tEl),
      h('div', { class: 'team-q', html: q.q }), choices,
      h('div', { class: 'row-btns' }, pauseBtn, revealBtn));
    modeTimer = setInterval(() => {
      if (!running) return;
      left--; tEl.textContent = `⏱️ ${Math.max(0, left)}`;
      if (left === 5) sfx.pop();
      if (left <= 0) { stopModeTimer(); tEl.textContent = '⏰ 시간 끝!'; sfx.wrong(); }
    }, 1000);
    function reveal() {
      stopModeTimer(); sfx.correct();
      choices.querySelectorAll('.team-choice').forEach((el, i) => el.classList.toggle('right', q.choices[i] === q.answer));
      revealBtn.remove(); pauseBtn.remove();
      const picked = new Set();
      const toggles = h('div', { class: 'team-toggles' }, ...teams.map((t, i) => {
        const b = h('button', { class: 'team-toggle', style: { '--tc': t.color } }, `✔ ${t.name}`);
        b.addEventListener('click', () => { if (picked.has(i)) picked.delete(i); else picked.add(i); b.classList.toggle('on'); sfx.click(); });
        return b;
      }));
      main.append(h('div', { class: 'feedback ok' }, h('div', { class: 'feedback-text', html: `정답: <b>${q.answer}</b><br>${q.explain}` })),
        h('p', { class: 'muted' }, '맞힌 팀을 모두 고른 뒤 점수 주기를 누르세요.'), toggles,
        h('button', { class: 'btn primary big', onclick: e => {
          e.currentTarget.disabled = true;
          const pts = bonus ? 200 : 100;
          const before = teams.map(t => teamStage(t.score));
          picked.forEach(i => { teams[i].score += pts; });
          drawBoard();
          const evolved = teams.filter((t, i) => teamStage(t.score) > before[i]);
          if (evolved.length) { sfx.level(); toast(`✨ ${evolved.map(t => t.name).join(', ')} 포켓몬이 진화했다!`, 2200); } else if (picked.size) sfx.coin();
          setTimeout(ask, evolved.length ? 1200 : 300);
        } }, qi >= total ? '점수 주고 결과 보기 ▶' : '점수 주기 ▶'));
    }
  };
  const finish = () => {
    inStage = false; stopModeTimer(); sfx.clear();
    const ranked = teams.slice().sort((a, b) => b.score - a.score);
    clear(app);
    app.appendChild(h('section', { class: 'screen' }, h('div', { class: 'panel center' },
      h('div', { class: 'confetti' }),
      h('h2', null, `🏆 우승: ${ranked[0].name}!`),
      h('div', { class: 'podium' }, ...ranked.map((t, i) => h('div', { class: `podium-step s${i + 1}`, style: { '--tc': t.color } },
        pokeImg(t.line[teamStage(t.score)], '⚪', 'team-img'), h('div', { class: 'team-name' }, `${['🥇', '🥈', '🥉', '4위'][i]} ${t.name}`), h('div', { class: 'team-score' }, `${t.score}점`)))),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn primary', onclick: modeTeam }, '↺ 새 팀전'),
        h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로')))));
  };
  drawBoard(); ask();
}

/* =========================================================
   🃏 기억력 카드 (낱말 ↔ 뜻 짝 맞추기)
   ========================================================= */
function modeMemory() {
  inStage = false; stopModeTimer();
  showTopbar('🃏 기억력 카드');
  clear(app);
  app.appendChild(h('section', { class: 'screen bg-lab' }, h('div', { class: 'panel' },
    h('h2', null, '🃏 기억력 카드'),
    h('ul', { class: 'rules' },
      h('li', { html: '카드 2장을 뒤집어 <b>교과서 낱말</b>과 <b>그 뜻</b>을 짝 지어요.' }),
      h('li', { html: '적게 뒤집을수록 코인을 더 많이 받아요!' })),
    h('div', { class: 'row-btns' },
      h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로'),
      h('button', { class: 'btn primary big', onclick: () => { sfx.correct(); runMemory(); } }, '▶ 시작!')))));
}

function runMemory() {
  inStage = true;
  const pairs = shuffle(MEMORY_PAIRS).slice(0, 6);
  const cards = shuffle(pairs.flatMap((p, i) => [{ pair: i, text: p[0], kind: 'term' }, { pair: i, text: p[1], kind: 'def' }]));
  let open = [], matched = 0, moves = 0, busy = false;
  const backs = shuffle(ALL_MONS).slice(0, 6);
  clear(app);
  const movesEl = h('span');
  const grid = h('div', { class: 'memory-grid' });
  app.appendChild(h('section', { class: 'screen bg-lab' },
    h('div', { class: 'mode-hud' }, h('span', null, '🃏 기억력 카드'), movesEl, h('span', null, `짝 ${pairs.length}개`)), grid));
  const hud = () => { movesEl.textContent = `🔄 ${moves}번 뒤집음`; };
  cards.forEach((c, idx) => {
    const el = h('button', { class: `mem-card ${c.kind}` },
      h('div', { class: 'mem-inner' },
        h('div', { class: 'mem-back' }, pokeImg(backs[idx % backs.length], '⚪', 'mem-back-img')),
        h('div', { class: 'mem-front' }, c.kind === 'term' ? h('b', null, c.text) : h('span', null, c.text))));
    el.addEventListener('click', () => {
      if (busy || el.classList.contains('flipped')) return;
      sfx.pop(); el.classList.add('flipped'); open.push({ el, c });
      if (open.length < 2) return;
      moves++; hud();
      const [a, b] = open; open = [];
      if (a.c.pair === b.c.pair) {
        a.el.classList.add('matched'); b.el.classList.add('matched'); matched++; sfx.correct();
        if (matched === pairs.length) setTimeout(done, 600);
      } else {
        busy = true;
        setTimeout(() => { a.el.classList.remove('flipped'); b.el.classList.remove('flipped'); busy = false; }, 900);
      }
    });
    grid.appendChild(el);
  });
  hud();
  const done = () => {
    inStage = false;
    const coins = Math.max(3, 15 - Math.max(0, moves - 6) * 1);
    const best = !save.stats.memoryBest || moves < save.stats.memoryBest;
    if (best) save.stats.memoryBest = moves;
    missionEvent('memory');
    reward({ xp: 20, coins });
    persist();
    resultScreen({ icon: '🃏', title: '기억력 카드 완료!',
      lines: [`뒤집은 횟수: <b>${moves}번</b>`, best ? '🎉 <b>새 최고 기록!</b>' : `내 최고 기록: ${save.stats.memoryBest}번`],
      review: [], again: runMemory });
    // 짝 복습
    app.querySelector('.panel').appendChild(h('div', { class: 'pair-review' }, h('h3', null, '📖 오늘의 짝 복습'),
      ...pairs.map(p => h('p', null, h('b', null, p[0]), ' — ', p[1]))));
  };
}
