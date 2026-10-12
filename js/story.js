/* =========================================================
   포켓몬 생태계 탐험대 - 체육관 스토리 모드 (교과서 순서대로 6개 스테이지)
   ========================================================= */
'use strict';

/* =========================================================
   화면 2: 지도
   ========================================================= */
function isOpen(id) { return device.allOpen || id === 1 || !!save.cleared[id - 1]; }

function renderMap() {
  inStage = false;
  closeModal();
  showTopbar('🏟️ 체육관 길');
  clear(app);
  const badges = h('div', { class: 'badge-case' },
    ...STAGES.map(s => h('div', { class: `badge-slot ${save.cleared[s.id] ? 'got' : ''}`, title: s.badgeName },
      h('span', null, save.cleared[s.id] ? s.badge : '◯'))));

  const route = h('div', { class: 'route' });
  STAGES.forEach((s, i) => {
    const open = isOpen(s.id);
    const stars = save.cleared[s.id] || 0;
    const node = h('button', {
      class: `stage-node ${open ? 'open' : 'locked'} ${stars ? 'done' : ''} ${i % 2 ? 'right' : 'left'}`,
      style: { '--c': s.color },
      onclick: () => {
        if (!open) { sfx.wrong(); toast('앞 스테이지를 먼저 깨야 열려요! 🔒'); return; }
        sfx.click(); startStage(s.id);
      } },
      h('div', { class: 'stage-icon' }, open ? (s.poke ? pokeImg(s.poke, s.avatar, 'stage-poke') : s.avatar) : '🔒'),
      h('div', { class: 'stage-text' },
        h('div', { class: 'stage-num' }, s.id === 6 ? 'FINAL' : `STAGE ${s.id}`),
        h('div', { class: 'stage-name' }, s.name),
        h('div', { class: 'stage-topic' }, s.topic),
        h('div', { class: 'stage-stars' }, stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : (open ? '도전!' : ''))),
    );
    route.appendChild(node);
  });

  const allDone = !!save.cleared[6];
  app.appendChild(h('section', { class: 'screen map-screen' },
    h('div', { class: 'map-head' },
      h('div', { class: 'trainer' },
        partnerImg('trainer-pika'),
        h('div', null,
          h('div', { class: 'trainer-name' }, `${save.name || '트레이너'} 트레이너`),
          h('div', { class: 'muted' }, `도감 ${save.dex.length}/${DEX_IDS.length} · 배지 ${Object.keys(save.cleared).filter(k => k !== '6').length}/5`))),
      badges),
    route,
    h('div', { class: 'row-btns' },
      allDone ? h('button', { class: 'btn primary', onclick: renderCertificate }, '🏅 생태 마스터 인증서 보기') : null,
      h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로 돌아가기')),
  ));
}

/* =========================================================
   스테이지 진행 엔진
   ========================================================= */
let stage = null;   // { def, mistakes, hp, hpMax }

function startStage(id) {
  const def = STAGES.find(s => s.id === id);
  stage = { def, mistakes: 0, hp: 0, hpMax: 0 };
  inStage = true;
  showTopbar(`${def.id === 6 ? 'FINAL' : 'STAGE ' + def.id} · ${def.name}`);
  const steps = STAGE_SCRIPTS[id]();
  runSteps(steps, () => stageClear());
}

function runSteps(steps, done) {
  let i = 0;
  const next = () => {
    if (!inStage) return;
    if (i >= steps.length) { done(); return; }
    const step = steps[i++];
    let used = false;
    const once = () => { if (used) return; used = true; next(); };  // 두 번 눌러도 한 단계만 넘어가요
    window.scrollTo(0, 0);
    step(once);
  };
  next();
}

/* ---------- 말하는 장면 ---------- */
const SPEAKERS = {
  prof: () => ({ name: '생태 박사', avatar: h('span', { class: 'emoji-img' }, '🧑‍🔬') }),
  pika: () => ({ name: '피카츄', avatar: pokeImg(25, '⚡') }),
  leader: () => ({ name: stage.def.leader, avatar: stage.def.poke ? pokeImg(stage.def.poke, stage.def.avatar) : h('span', { class: 'emoji-img' }, stage.def.avatar) }),
  turtle: () => ({ name: '꼬부기 (바다거북)', avatar: pokeImg(7, '🐢') }),
};

// lines: [{ who, text, card? }]
function talk(lines, bg = 'bg-lab') {
  return next => {
    let i = 0;
    clear(app);
    const scene = h('section', { class: `screen talk-screen ${bg}` });
    const stageBox = h('div', { class: 'talk-stage' });
    const box = h('div', { class: 'dialog-box', tabindex: '0' });
    const nameTag = h('div', { class: 'dialog-name' });
    const text = h('div', { class: 'dialog-text' });
    const more = h('div', { class: 'dialog-more' }, '▼');
    box.append(nameTag, text, more);
    const skip = h('button', { class: 'skip-btn', onclick: e => { e.stopPropagation(); sfx.click(); next(); } }, '건너뛰기 ⏭');
    scene.append(skip, stageBox, box);
    app.appendChild(scene);

    const show = () => {
      const line = lines[i];
      const sp = SPEAKERS[line.who]();
      clear(stageBox);
      stageBox.appendChild(h('div', { class: `speaker speaker-${line.who}` }, sp.avatar));
      if (line.card) stageBox.appendChild(h('div', { class: 'concept-card', html: line.card }));
      nameTag.textContent = sp.name;
      text.innerHTML = line.text.replace(/\{name\}/g, escapeHtml(save.name || '트레이너'));
      text.classList.remove('fade-in'); void text.offsetWidth; text.classList.add('fade-in');
      more.textContent = i === lines.length - 1 ? '▶ 시작' : '▼';
    };
    const advance = () => {
      sfx.click();
      i++;
      if (i >= lines.length) next(); else show();
    };
    box.addEventListener('click', advance);
    box.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); } });
    show();
    box.focus({ preventScroll: true });
  };
}

/* ---------- 배틀형 퀴즈 ----------
   item = {
     subject: { creature } | { poke, emoji, title, sub } | { html },
     prompt, choices: [문자열], answer: 정답 문자열, explain, shuffle, intro
   } */
function quiz(items, opts = {}) {
  return next => {
    const queue = items.slice();
    const total = items.length;
    let solved = 0;
    let finished = false;
    stage.hpMax = total; stage.hp = total;

    clear(app);
    const leaderAvatar = stage.def.poke ? pokeImg(stage.def.poke, stage.def.avatar, 'hp-avatar-img') : h('span', null, stage.def.avatar);
    const hpFill = h('div', { class: 'hp-fill' });
    const hpText = h('div', { class: 'hp-text' });
    const header = h('div', { class: 'battle-header' },
      h('div', { class: 'hp-avatar' }, leaderAvatar),
      h('div', { class: 'hp-wrap' },
        h('div', { class: 'hp-label' }, `${stage.def.leader}${opts.title ? ' · ' + opts.title : ''}`),
        h('div', { class: 'hp-bar' }, hpFill), hpText));
    const arena = h('div', { class: `arena ${opts.bg || 'bg-forest'}` });
    const dialog = h('div', { class: 'battle-dialog' });
    const scene = h('section', { class: 'screen battle-screen' }, header, arena, dialog);
    app.appendChild(scene);

    const updateHp = () => {
      const pct = Math.max(0, (total - solved) / total * 100);
      hpFill.style.width = pct + '%';
      hpFill.className = 'hp-fill ' + (pct > 50 ? 'g' : pct > 20 ? 'y' : 'r');
      hpText.textContent = `남은 문제 ${total - solved} / ${total}`;
    };

    const ask = () => {
      updateHp();
      if (!queue.length) {
        if (!finished) { finished = true; setTimeout(next, 350); }
        return;
      }
      const item = queue.shift();
      if (item.bg) arena.className = `arena ${item.bg}`;
      clear(arena); clear(dialog);
      arena.appendChild(renderSubject(item));

      const choices = item.shuffle ? shuffle(item.choices) : item.choices;
      const btns = h('div', { class: `choice-grid n${choices.length} ${item.long ? 'long' : ''}` });
      choices.forEach(label => {
        btns.appendChild(h('button', { class: 'choice-btn', onclick: e => answer(item, label, e.currentTarget, btns) }, label));
      });
      if (item.intro) dialog.append(h('div', { class: 'battle-intro' }, item.intro));
      dialog.append(
        h('div', { class: 'battle-prompt', html: item.prompt }),
        btns);
    };

    const answer = (item, label, btn, btns) => {
      btns.querySelectorAll('button').forEach(b => { b.disabled = true; });
      const ok = label === item.answer;
      const subjectEl = arena.querySelector('.subject');
      if (ok) {
        sfx.correct();
        btn.classList.add('right');
        solved++;
        countAnswer(true);
        reward({ xp: 10, coins: 2 });
        updateHp();
        let caughtMsg = null;
        const cid = item.subject && item.subject.creature;
        if (cid && registerDex(cid)) {
          caughtMsg = `📕 ${josa(CREATURES[cid].name, '이/가')} 도감에 새로 등록되었다!`;
          setTimeout(sfx.catch, 250);
          subjectEl && subjectEl.classList.add('caught-anim');
          arena.appendChild(h('div', { class: 'pokeball-throw' }));
        }
        feedback(true, item.explain, caughtMsg);
      } else {
        sfx.wrong();
        stage.mistakes++;
        countAnswer(false);
        btn.classList.add('wrong');
        btns.querySelectorAll('button').forEach(b => { if (b.textContent === item.answer) b.classList.add('right'); });
        subjectEl && subjectEl.classList.add('shake');
        queue.push(item);
        feedback(false, item.explain, '이 문제는 조금 뒤에 다시 나와요!');
      }
    };

    const feedback = (ok, explain, extra) => {
      const panel = h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
        h('div', { class: 'feedback-title' }, ok ? pick(['정답이에요! 🎉', '훌륭해요! ✨', '효과는 굉장했다! 💥', '딩동댕! ⭕']) : pick(['아쉬워요! 다시 생각해 봐요 🤔', '앗, 빗나갔다! 💦'])),
        h('div', { class: 'feedback-text', html: explain || '' }),
        extra ? h('div', { class: 'feedback-extra' }, extra) : null,
        h('button', { class: 'btn primary', onclick: e => { e.currentTarget.disabled = true; sfx.click(); ask(); } }, queue.length || !ok ? '다음 ▶' : '결과 보기 ▶'));
      dialog.appendChild(panel);
      panel.querySelector('button').focus({ preventScroll: true });
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    ask();
  };
}


function renderSubject(item) {
  const s = item.subject || {};
  if (s.creature) {
    const c = CREATURES[s.creature];
    return h('div', { class: 'subject' },
      h('div', { class: 'platform' }),
      h('div', { class: 'subject-img bounce-in' }, creatureImg(s.creature)),
      h('div', { class: 'name-plate' },
        h('div', { class: 'np-main' }, c.name),
        c.pname ? h('div', { class: 'np-sub' }, `닮은 포켓몬: ${c.pname}`) : h('div', { class: 'np-sub' }, c.living ? '포켓몬 없음' : '자연의 요소')));
  }
  if (s.html) return h('div', { class: 'subject subject-html', html: s.html });
  return h('div', { class: 'subject' },
    h('div', { class: 'platform' }),
    h('div', { class: 'subject-img bounce-in' },
      s.poke ? pokeImg(s.poke, s.emoji) : h('span', { class: 'emoji-img' }, s.emoji || '❔'),
      s.badge ? h('div', { class: 'subject-badge' }, s.badge) : null),
    h('div', { class: 'name-plate' },
      h('div', { class: 'np-main' }, s.title || ''),
      s.sub ? h('div', { class: 'np-sub' }, s.sub) : null));
}

/* ---------- 먹이사슬 만들기 ---------- */
function chainStep(chain, idx, total) {
  return next => {
    let pos = 0;
    clear(app);
    const slots = h('div', { class: 'chain-slots' });
    chain.forEach((id, i) => {
      if (i) slots.appendChild(h('div', { class: 'chain-arrow' }, '➜'));
      slots.appendChild(h('div', { class: 'chain-slot', 'data-i': i }, h('span', { class: 'slot-num' }, i + 1)));
    });
    const hint = h('div', { class: 'chain-hint' }, '🌱 먹이사슬은 스스로 양분을 만드는 생산자부터 시작해요!');
    const cards = h('div', { class: 'chain-cards' });
    const doneBox = h('div', { class: 'chain-done' });

    shuffle(chain).forEach(id => {
      const card = h('button', { class: 'chain-card' }, creatureImg(id), h('div', { class: 'cc-name' }, CREATURES[id].name));
      card.addEventListener('click', () => {
        if (id === chain[pos]) {
          sfx.pop();
          const slot = slots.querySelector(`.chain-slot[data-i="${pos}"]`);
          clear(slot);
          slot.classList.add('filled');
          slot.append(creatureImg(id), h('div', { class: 'cc-name' }, CREATURES[id].name));
          card.classList.add('used'); card.disabled = true;
          registerDex(id);
          pos++;
          if (pos < chain.length) {
            hint.textContent = `👉 ${josa(CREATURES[chain[pos - 1]].name, '을/를')} 먹는 생물은 누구일까요?`;
          } else {
            finish();
          }
        } else {
          sfx.wrong();
          stage.mistakes++;
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 500);
          hint.textContent = pos === 0
            ? '🤔 그 생물은 스스로 양분을 만들지 못해요. 생산자를 먼저 찾아요!'
            : `🤔 ${josa(CREATURES[id].name, '은/는')} ${josa(CREATURES[chain[pos - 1]].name, '을/를')} 먹지 않아요. 다시 찾아봐요!`;
        }
      });
      cards.appendChild(card);
    });

    const finish = () => {
      sfx.correct();
      reward({ xp: 15, coins: 3 });
      hint.textContent = '🎉 먹이사슬 완성!';
      cards.remove();
      const sentence = chain.slice(0, -1).map((id, i) =>
        `${josa(CREATURES[id].name, '은/는')} ${CREATURES[chain[i + 1]].name}에게`).join(', ') + ' 먹혀요.';
      doneBox.append(
        h('p', null, sentence),
        h('p', { class: 'muted' }, '화살표(➜)는 먹히는 생물에서 먹는 생물 쪽을 가리켜요.'),
        h('button', { class: 'btn primary', onclick: () => { sfx.click(); next(); } }, '다음 ▶'));
      doneBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    app.appendChild(h('section', { class: 'screen chain-screen bg-meadow' },
      h('div', { class: 'panel' },
        h('h2', null, `🔗 먹이사슬 만들기 (${idx}/${total})`),
        h('p', null, '먹히는 생물 ➜ 먹는 생물 순서로 카드를 눌러 먹이사슬을 완성해요.'),
        slots, hint, cards, doneBox)));
  };
}

/* ---------- 먹이그물 실험실 ---------- */
const WEB_MISSIONS = [
  { target: 'frog',
    intro: '먹이그물에서 <b>개구리</b>를 눌러 사라지게 해 보세요.',
    prompt: '개구리가 사라졌어요. <b>매</b>는 어떻게 될까요?',
    choices: ['직박구리, 오리, 족제비 등 다른 먹이를 먹고 살 수 있어요.', '먹을 것이 하나도 없어서 바로 사라져요.', '매도 개구리처럼 풀을 먹기 시작해요.'],
    answer: '직박구리, 오리, 족제비 등 다른 먹이를 먹고 살 수 있어요.',
    explain: '먹이그물에서는 매가 여러 생물을 먹어요. 개구리가 사라져도 다른 먹이가 있어 살아갈 수 있어요. 대신 개구리를 먹던 <b>뱀과 오리는 먹이가 줄고</b>, 개구리의 먹이인 <b>메뚜기는 늘어날 수</b> 있어요.' },
  { target: 'bulbul',
    intro: '이번에는 <b>직박구리</b>를 눌러 사라지게 해 보세요.',
    prompt: '직박구리가 사라졌어요. <b>애벌레</b>의 수는 어떻게 될까요?',
    choices: ['잡아먹히지 않아서 늘어날 수 있어요.', '아무런 변화가 없어요.', '애벌레도 함께 사라져요.'],
    answer: '잡아먹히지 않아서 늘어날 수 있어요.',
    explain: '직박구리는 애벌레와 산수유 열매를 먹어요. 직박구리가 사라지면 <b>애벌레가 늘어나고</b>, 그러면 산수유 잎이 더 많이 먹힐 수 있어요. 직박구리를 먹던 <b>매는 먹이가 줄어요</b>. 한 생물이 사라지면 생태계 전체가 영향을 받아요!' },
  { target: 'oak',
    intro: '<b>도토리(상수리나무)</b>를 눌러 사라지게 해 보세요.',
    prompt: '도토리가 사라졌어요. 가장 먼저 큰 어려움을 겪는 생물은?',
    choices: ['다람쥐', '메뚜기', '토끼'],
    answer: '다람쥐',
    explain: '이 먹이그물에서 다람쥐는 도토리만 먹어요. 먹이가 사라지면 다람쥐가 살기 어려워지고, 다람쥐를 먹는 뱀과 족제비도 영향을 받아요. 생산자는 생태계를 받치는 아주 중요한 생물이에요.' },
];

function webStep() {
  return next => {
    let removed = new Set();
    let missionIdx = 0;
    let awaiting = 'remove'; // remove | answer | free
    clear(app);

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 800 530');
    svg.setAttribute('class', 'web-svg');
    svg.innerHTML = `<defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#5d4037"/></marker>
      <marker id="arrow-off" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#ccc"/></marker></defs>`;
    const R = 36;
    const edgeEls = WEB_EDGES.map(([a, b]) => {
      const A = WEB_NODES[a], B = WEB_NODES[b];
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', A.x + dx / len * R); line.setAttribute('y1', A.y + dy / len * R);
      line.setAttribute('x2', B.x - dx / len * (R + 4)); line.setAttribute('y2', B.y - dy / len * (R + 4));
      line.setAttribute('class', 'web-edge');
      svg.appendChild(line);
      return { a, b, line };
    });
    const nodeEls = {};
    Object.entries(WEB_NODES).forEach(([id, n]) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', `web-node role-${CREATURES[id].role}`);
      g.setAttribute('transform', `translate(${n.x},${n.y})`);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', n.label);
      const c = CREATURES[id];
      let srcIdx = 0;
      g.innerHTML = `<circle class="wn-bg" r="${R}"></circle>
        <text class="wn-emoji" y="12" text-anchor="middle">${c.emoji}</text>
        <image class="wn-img" x="${-R + 4}" y="${-R + 4}" width="${(R - 4) * 2}" height="${(R - 4) * 2}"></image>
        <rect class="wn-label-bg" x="-36" y="${R - 2}" width="72" height="22" rx="11"></rect>
        <text class="wn-label" y="${R + 14}" text-anchor="middle">${n.label}</text>
        <text class="wn-x" y="16" text-anchor="middle">✕</text>
        <g class="wn-status" transform="translate(${R - 6},${-R + 4})"><circle r="13"></circle><text y="6" text-anchor="middle"></text></g>`;
      const im = g.querySelector('image');
      im.addEventListener('error', () => {
        srcIdx++;
        if (srcIdx < IMG_SOURCES.length) im.setAttribute('href', IMG_SOURCES[srcIdx](c.poke));
        else im.remove();
      });
      im.setAttribute('href', IMG_SOURCES[0](c.poke));
      const onTap = () => tapNode(id, g);
      g.addEventListener('click', onTap);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } });
      svg.appendChild(g);
      nodeEls[id] = g;
    });

    const missionBox = h('div', { class: 'web-mission' });
    const legend = h('div', { class: 'web-legend' },
      h('span', null, h('i', { class: 'lg starve' }), '먹이가 없어요'),
      h('span', null, h('i', { class: 'lg less' }), '먹이가 줄었어요'),
      h('span', null, h('i', { class: 'lg more' }), '수가 늘어날 수 있어요'));
    const resetBtn = h('button', { class: 'btn small', onclick: () => { removed.clear(); refresh(); sfx.click(); } }, '↺ 모두 되살리기');

    app.appendChild(h('section', { class: 'screen web-screen bg-meadow' },
      h('div', { class: 'panel web-panel' },
        h('h2', null, '🕸️ 먹이그물 실험실'),
        h('p', { class: 'muted' }, '생물을 누르면 사라지고, 다시 누르면 돌아와요. 화살표는 먹히는 생물 ➜ 먹는 생물이에요.'),
        h('div', { class: 'web-wrap' }, svg),
        legend, resetBtn, missionBox)));

    function tapNode(id, g) {
      if (awaiting === 'answer') { toast('먼저 아래 질문에 답해 보세요! 👇'); return; }
      if (awaiting === 'remove') {
        const m = WEB_MISSIONS[missionIdx];
        if (id !== m.target) {
          sfx.wrong();
          g.classList.add('shake-svg'); setTimeout(() => g.classList.remove('shake-svg'), 500);
          toast(`미션: ${WEB_NODES[m.target].label}을(를) 찾아 눌러 보세요!`);
          return;
        }
      }
      sfx.pop();
      if (removed.has(id)) removed.delete(id); else removed.add(id);
      refresh();
      if (awaiting === 'remove') { awaiting = 'answer'; showQuestion(); }
    }

    function refresh() {
      edgeEls.forEach(({ a, b, line }) => {
        line.setAttribute('class', removed.has(a) || removed.has(b) ? 'web-edge off' : 'web-edge');
        line.setAttribute('marker-end', removed.has(a) || removed.has(b) ? 'url(#arrow-off)' : 'url(#arrow)');
      });
      Object.keys(WEB_NODES).forEach(id => {
        const g = nodeEls[id];
        const st = g.querySelector('.wn-status');
        g.classList.toggle('removed', removed.has(id));
        let status = '';
        if (!removed.has(id)) {
          const food = WEB_EDGES.filter(e => e[1] === id).map(e => e[0]);
          const preds = WEB_EDGES.filter(e => e[0] === id).map(e => e[1]);
          const foodLeft = food.filter(f => !removed.has(f));
          if (food.length && !foodLeft.length) status = 'starve';
          else if (foodLeft.length < food.length) status = 'less';
          else if (preds.some(p => removed.has(p))) status = 'more';
        }
        st.setAttribute('class', `wn-status ${status}`);
        st.querySelector('text').textContent = { starve: '!', less: '↓', more: '↑' }[status] || '';
      });
    }

    function showMission() {
      clear(missionBox);
      const m = WEB_MISSIONS[missionIdx];
      missionBox.append(h('div', { class: 'mission-tag' }, `미션 ${missionIdx + 1}/${WEB_MISSIONS.length}`), h('p', { html: m.intro }));
      nodeEls[m.target].classList.add('glow');
    }

    function showQuestion() {
      const m = WEB_MISSIONS[missionIdx];
      nodeEls[m.target].classList.remove('glow');
      clear(missionBox);
      const btns = h('div', { class: 'choice-grid long' });
      shuffle(m.choices).forEach(label => {
        btns.appendChild(h('button', { class: 'choice-btn', onclick: e => {
          const ok = label === m.answer;
          if (ok) {
            sfx.correct();
            reward({ xp: 15, coins: 3 });
            btns.querySelectorAll('button').forEach(b => { b.disabled = true; });
            e.currentTarget.classList.add('right');
            missionBox.appendChild(h('div', { class: 'feedback ok' },
              h('div', { class: 'feedback-title' }, '정답이에요! 🎉'),
              h('div', { class: 'feedback-text', html: m.explain }),
              h('button', { class: 'btn primary', onclick: () => {
                sfx.click();
                missionIdx++;
                removed.clear(); refresh();
                if (missionIdx < WEB_MISSIONS.length) { awaiting = 'remove'; showMission(); }
                else freeMode();
              } }, '다음 ▶')));
          } else {
            sfx.wrong(); stage.mistakes++;
            e.currentTarget.classList.add('wrong'); e.currentTarget.disabled = true;
            toast('먹이그물의 화살표와 표시(! ↓ ↑)를 다시 살펴봐요!');
          }
        } }, label));
      });
      missionBox.append(h('div', { class: 'mission-tag' }, `질문 ${missionIdx + 1}/${WEB_MISSIONS.length}`),
        h('p', { html: m.prompt }), btns);
      missionBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function freeMode() {
      awaiting = 'free';
      clear(missionBox);
      missionBox.append(
        h('div', { class: 'mission-tag' }, '자유 실험'),
        h('p', null, '모든 미션 성공! 이제 마음대로 생물을 사라지게 해 보며 어떤 일이 생기는지 살펴보세요. 다 했으면 다음으로 가요.'),
        h('button', { class: 'btn primary', onclick: () => { sfx.click(); next(); } }, '다음 ▶'));
    }

    refresh();
    showMission();
  };
}

/* ---------- 바다 청소 미니게임 ---------- */
function cleanupStep() {
  return next => {
    const GOAL = 15, TIME = 35;
    const TRASH = ['🛍️', '🥤', '🧴', '😷', '🥫', '🍾', '🧃', '🎈'];
    const FRIENDS = [7, 72, 746, 222, 98, 226];
    let score = 0, timeLeft = TIME, running = false, spawnTimer = null, clockTimer = null;

    const run = () => {
      clear(app);
      score = 0; timeLeft = TIME;
      const scoreEl = h('div', { class: 'cu-score' });
      const timeEl = h('div', { class: 'cu-time' });
      const meter = h('div', { class: 'cu-meter-fill' });
      const sea = h('div', { class: 'sea' },
        h('div', { class: 'sea-turtle' }, pokeImg(7, '🐢')));
      const start = h('button', { class: 'btn primary big cu-start' }, '▶ 청소 시작!');
      sea.appendChild(start);

      const update = () => {
        scoreEl.textContent = `🗑️ ${score} / ${GOAL}`;
        timeEl.textContent = `⏱️ ${timeLeft}초`;
        meter.style.width = Math.min(100, score / GOAL * 100) + '%';
      };
      update();

      const spawn = () => {
        const friend = Math.random() < 0.3;
        const top = 8 + Math.random() * 70;
        const dur = 4 + Math.random() * 3;
        const fromLeft = Math.random() < 0.5;
        const item = h('button', { class: `floater ${friend ? 'friend' : 'trash'} ${fromLeft ? 'ltr' : 'rtl'}`,
          style: { top: top + '%', animationDuration: dur + 's' } },
          friend ? pokeImg(pick(FRIENDS), '🐟') : h('span', null, pick(TRASH)));
        item.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (!running || item.classList.contains('hit')) return;
          item.classList.add('hit');
          if (friend) {
            sfx.wrong();
            score = Math.max(0, score - 1);
            popText(sea, e, '앗! 바다 친구예요 💦', 'bad');
          } else {
            sfx.pop();
            score++;
            popText(sea, e, '+1', 'good');
          }
          update();
          setTimeout(() => item.remove(), 250);
        });
        item.addEventListener('animationend', () => item.remove());
        sea.appendChild(item);
      };

      const end = () => {
        running = false;
        clearInterval(spawnTimer); clearInterval(clockTimer);
        sea.querySelectorAll('.floater').forEach(f => f.remove());
        const success = score >= GOAL;
        if (success) { sfx.clear(); reward({ xp: 20, coins: 10 }); } else { sfx.wrong(); stage.mistakes++; }
        sea.appendChild(h('div', { class: 'cu-result' },
          h('h3', null, success ? '바다가 깨끗해졌어요! 🌊✨' : '조금만 더 힘내요! 💪'),
          h('p', null, `주운 쓰레기: ${score}개`),
          h('p', { class: 'muted' }, success
            ? '꼬부기(바다거북)가 행복해졌어요. 실제로 바다를 지키려면 쓰레기를 만들지 않는 것이 가장 중요해요!'
            : `목표 ${GOAL}개에 조금 모자랐어요. 다시 도전해 볼까요?`),
          h('div', { class: 'row-btns' },
            success ? null : h('button', { class: 'btn', onclick: () => { sfx.click(); run(); } }, '↺ 다시 하기'),
            h('button', { class: 'btn primary', onclick: () => { sfx.click(); next(); } }, '다음 ▶'))));
      };

      start.addEventListener('click', () => {
        start.remove(); running = true; sfx.click();
        spawn();
        spawnTimer = setInterval(spawn, 650);
        clockTimer = setInterval(() => {
          if (!inStage) { clearInterval(spawnTimer); clearInterval(clockTimer); return; }
          timeLeft--; update();
          if (timeLeft <= 0) end();
        }, 1000);
      });

      app.appendChild(h('section', { class: 'screen cleanup-screen' },
        h('div', { class: 'panel' },
          h('h2', null, '🐢 바다거북을 구해라!'),
          h('p', null, '떠다니는 ', h('b', null, '쓰레기'), '만 눌러서 치워요. 바다 친구(포켓몬)를 누르면 점수가 깎여요!'),
          h('div', { class: 'cu-hud' }, scoreEl, h('div', { class: 'cu-meter' }, meter), timeEl),
          sea)));
    };
    run();
  };
}

function popText(container, e, text, cls) {
  const rect = container.getBoundingClientRect();
  const p = h('div', { class: `pop-text ${cls}`, style: { left: (e.clientX - rect.left) + 'px', top: (e.clientY - rect.top) + 'px' } }, text);
  container.appendChild(p);
  setTimeout(() => p.remove(), 900);
}

/* ---------- 실천 다짐 ---------- */
function pledgeStep() {
  return next => {
    clear(app);
    let chosen = save.pledge || '';
    const custom = h('input', { type: 'text', maxlength: '40', placeholder: '직접 쓰고 싶다면 여기에 적어요' });
    if (chosen && !PLEDGES.includes(chosen)) custom.value = chosen;
    const list = h('div', { class: 'pledge-list' });
    PLEDGES.forEach(p => {
      const b = h('button', { class: `pledge-btn ${p === chosen ? 'sel' : ''}`, onclick: () => {
        sfx.click(); chosen = p; custom.value = '';
        list.querySelectorAll('.pledge-btn').forEach(x => x.classList.toggle('sel', x === b));
      } }, '🌱 ' + p);
      list.appendChild(b);
    });
    custom.addEventListener('input', () => {
      if (custom.value.trim()) { chosen = custom.value.trim(); list.querySelectorAll('.pledge-btn').forEach(x => x.classList.remove('sel')); }
    });
    app.appendChild(h('section', { class: 'screen bg-beach' },
      h('div', { class: 'panel' },
        h('h2', null, '✋ 나의 생태계 보전 다짐'),
        h('p', null, '사람을 포함한 모든 생물은 생태계의 일부예요. 내가 꾸준히 실천할 일을 하나 골라요. (인증서에 들어가요!)'),
        list, custom,
        h('button', { class: 'btn primary', onclick: () => {
          if (!chosen) { toast('다짐을 하나 골라 주세요! 🌱'); return; }
          save.pledge = chosen; persist(); sfx.correct(); next();
        } }, '다짐 완료 ▶'))));
  };
}

/* ---------- 스테이지 클리어 ---------- */
function stageClear() {
  const def = stage.def;
  const m = stage.mistakes;
  const stars = m === 0 ? 3 : m <= 3 ? 2 : 1;
  const firstTime = !save.cleared[def.id];
  save.cleared[def.id] = Math.max(save.cleared[def.id] || 0, stars);
  // 처음 깨면 큰 보상과 칭호! (하루 코인 한도와 상관없이 받아요)
  const prize = firstTime ? 50 + stars * 10 : stars * 5;
  const got = reward({ xp: firstTime ? 60 : 20, coins: prize, bypassCap: firstTime });
  const newTitle = STAGE_TITLES[def.id];
  if (firstTime && newTitle && !save.titles.includes(newTitle)) save.titles.push(newTitle);
  persist();
  inStage = false;
  sfx.clear();
  clear(app);
  const nextStage = STAGES.find(s => s.id === def.id + 1);
  app.appendChild(h('section', { class: 'screen clear-screen' },
    h('div', { class: 'panel center' },
      h('div', { class: 'confetti' }),
      h('h2', null, def.id === 6 ? '🏆 챔피언 리그 우승!' : `${def.leader}에게 승리했다!`),
      h('div', { class: 'badge-big' }, def.badge),
      h('p', { class: 'big-text' }, `${josa(def.badgeName, '을/를')} 받았다!`),
      h('div', { class: 'stars' }, ...[1, 2, 3].map(i => h('span', { class: i <= stars ? 'on' : '' }, '★'))),
      h('p', { class: 'muted' }, m === 0 ? '한 번도 틀리지 않았어요! 완벽해요!' : `틀린 횟수: ${m}번 · 다시 도전하면 별을 더 모을 수 있어요.`),
      h('p', { class: 'reward-line' }, `🪙 +${got.coins} 코인`, firstTime && newTitle ? ` · 🏷️ 새 칭호 「${newTitle}」` : ''),
      h('div', { class: 'row-btns' },
        def.id === 6
          ? h('button', { class: 'btn primary big', onclick: renderCertificate }, '🏅 인증서 받기')
          : (nextStage ? h('button', { class: 'btn primary', onclick: () => startStage(nextStage.id) }, `다음: ${nextStage.name} ▶`) : null),
        h('button', { class: 'btn', onclick: renderMap }, '🏟️ 체육관 길'),
        h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로'),
        firstTime ? null : h('button', { class: 'btn', onclick: () => startStage(def.id) }, '↺ 다시 하기')))));
  setTimeout(() => flushEvents(), 900);
}

/* ---------- 인증서 ---------- */
function renderCertificate() {
  inStage = false;
  showTopbar('생태 마스터 인증서');
  clear(app);
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const totalStars = STAGES.reduce((s, st) => s + (save.cleared[st.id] || 0), 0);
  app.appendChild(h('section', { class: 'screen cert-screen' },
    h('div', { class: 'certificate', id: 'certificate' },
      h('div', { class: 'cert-inner' },
        h('div', { class: 'cert-top' }, partnerImg('cert-poke'), h('div', { class: 'cert-title' }, '생태 마스터 인증서'), pokeImg(151, '✨', 'cert-poke')),
        h('p', { class: 'cert-name' }, `${save.name || '트레이너'}`),
        h('p', { class: 'cert-body' },
          '위 트레이너는 포켓몬 생태계 탐험대에서 생태계의 구성 요소, 생물의 역할, 먹이그물, 환경오염과 생태계 보전에 대해 열심히 탐구하여 ',
          h('b', null, '생태 마스터'), '가 되었기에 이 인증서를 드립니다.'),
        h('div', { class: 'cert-badges' }, ...STAGES.map(s => h('span', { title: s.badgeName }, save.cleared[s.id] ? s.badge : '◯'))),
        h('p', { class: 'cert-stats' }, `⭐ 별 ${totalStars} / 18 · 📕 도감 ${save.dex.length} / ${DEX_IDS.length}`),
        save.pledge ? h('div', { class: 'cert-pledge' }, h('b', null, '나의 다짐: '), save.pledge) : null,
        h('p', { class: 'cert-date' }, dateStr),
        h('p', { class: 'cert-sign' }, '포켓몬 생태계 탐험대 생태 박사 🧑‍🔬'),
        h('p', { class: 'cert-legal' }, '※ 비영리 교육용 팬 게임 · 포켓몬 저작권: Nintendo/Creatures/GAME FREAK/The Pokémon Company'))),
    h('div', { class: 'row-btns no-print' },
      h('button', { class: 'btn primary', onclick: () => window.print() }, '🖨️ 인쇄하기'),
      h('button', { class: 'btn', onclick: () => goTown() }, '🏠 마을로'))));
}

/* =========================================================
   스테이지 대본
   ========================================================= */
const BG = { 숲: 'bg-forest', 강: 'bg-river', 바다: 'bg-sea' };

function livingItem(id, hab) {
  const c = CREATURES[id];
  const answer = c.living ? '🌱 생물 요소' : '🪨 비생물 요소';
  const explain = c.living
    ? `<b>${c.name}</b>${josa(c.name, '은/는').slice(c.name.length)} 살아 있는 생물이라 <b>생물 요소</b>예요.<br>${c.fact}`
    : `<b>${c.name}</b>${josa(c.name, '은/는').slice(c.name.length)} 살아 있지 않아서 <b>비생물 요소</b>예요.<br>${c.fact}`;
  return {
    subject: { creature: id }, bg: BG[hab],
    intro: c.living ? `${hab} 생태계에서 야생의 ${josa(c.name, '이/가')} 나타났다!` : `${hab} 생태계에서 무언가를 발견했다!`,
    prompt: `<b>${c.name}</b>${josa(c.name, '은/는').slice(c.name.length)} 생물 요소일까요, 비생물 요소일까요?`,
    choices: ['🌱 생물 요소', '🪨 비생물 요소'], answer, explain,
  };
}

// 아직 도감에 없는 생물을 먼저 골라요
function habitatRound(hab, pool, count, nonLiving) {
  const fresh = shuffle(pool.filter(id => !save.dex.includes(id)));
  const seen = shuffle(pool.filter(id => save.dex.includes(id)));
  const picked = fresh.concat(seen).slice(0, count);
  return shuffle(picked.concat(nonLiving)).map(id => livingItem(id, hab));
}

function roleItem(id) {
  const c = CREATURES[id];
  const r = ROLE_INFO[c.role];
  const labels = ['🌿 생산자', '🍽️ 소비자', '🍄 분해자'];
  const answer = `${r.icon} ${r.label}`;
  return {
    subject: { creature: id }, bg: c.hab.includes('바다') ? 'bg-sea' : c.hab.includes('강') ? 'bg-river' : 'bg-forest',
    prompt: `<b>${c.name}</b>${josa(c.name, '은/는').slice(c.name.length)} 생태계에서 어떤 역할을 할까요?`,
    choices: labels, answer,
    explain: `<b>${c.name}</b>: ${r.label} — ${r.desc}<br>${c.fact}`,
  };
}

function mcq(prompt, answer, wrongs, explain, subject, extra = {}) {
  return Object.assign({ subject, prompt, choices: [answer, ...wrongs], answer, explain, shuffle: true, long: true }, extra);
}

const STAGE_SCRIPTS = {
  /* ── STAGE 1: 생태계 구성 요소 ── */
  1: () => [
    talk([
      { who: 'prof', text: '어서 와요, <b>{name}</b> 트레이너! 나는 생태 박사예요. 오늘부터 우리는 <b>생태계 탐험대</b>랍니다.' },
      { who: 'pika', text: '피카피카! 학교 화단에서는 어떤 것들을 볼 수 있을까? 나무, 개미, 햇빛, 흙…!' },
      { who: 'prof', text: '자연에서 동물이나 식물처럼 <b>살아 있는 것</b>을 <b>생물 요소</b>라고 해요.',
        card: '<div class="cc-title">🌱 생물 요소</div><div class="cc-body">살아 있는 것<br>예) 나무, 다람쥐, 버섯</div>' },
      { who: 'prof', text: '햇빛, 물, 공기, 흙처럼 <b>살아 있지 않은 것</b>은 <b>비생물 요소</b>라고 해요.',
        card: '<div class="cc-title">🪨 비생물 요소</div><div class="cc-body">살아 있지 않은 것<br>예) 햇빛, 물, 공기, 흙</div>' },
      { who: 'prof', text: '한 지역에서 서로 영향을 주고받는 생물 요소와 비생물 요소를 통틀어 <b>생태계</b>라고 해요. 생태계는 쓰러진 나무 아래처럼 작을 수도, 섬처럼 클 수도 있어요.',
        card: '<div class="cc-title">🌍 생태계</div><div class="cc-body">생물 요소 + 비생물 요소<br>(서로 영향을 주고받아요)</div>' },
      { who: 'pika', text: '참! 포켓몬은 실제 생물을 닮은 <b>모델</b>이야. 카드에 크게 쓰인 <b>진짜 생물 이름</b>을 보고 생각해 줘! 피카!' },
      { who: 'leader', text: '나는 초록 관장! 숲, 강, 바다 생태계에서 만나는 것들을 생물 요소와 비생물 요소로 나눌 수 있을까?' },
    ], 'bg-forest'),
    quiz([
      // 서식지마다 생물은 무작위로 골라요 → 다시 도전하면 새로운 생물을 만나 도감을 채울 수 있어요
      ...habitatRound('숲', ['oak', 'squirrel', 'mushroom', 'mole', 'beetle', 'snake', 'bulbul'], 4, ['sun', 'soil']),
      ...habitatRound('강', ['waterweed', 'duck', 'snail', 'heron', 'crucian', 'frog'], 3, ['water']),
      ...habitatRound('바다', ['seaweed', 'coral', 'turtle', 'crab', 'gull', 'dolphin', 'jelly', 'ray', 'mackerel'], 4, ['air']),
      mcq('한 지역에서 서로 영향을 주고받는 생물 요소와 비생물 요소를 통틀어 무엇이라고 할까요?', '생태계', ['먹이사슬', '서식지', '환경오염'],
        '정답은 <b>생태계</b>! 숲, 강, 바다처럼 지구에는 다양한 생태계가 있고, 각 생태계는 생물이 살아가는 데 모두 중요해요.',
        { emoji: '🌍', title: '마지막 문제!', sub: '생태계의 뜻' }),
    ], { title: '생물 요소 vs 비생물 요소' }),
  ],

  /* ── STAGE 2: 생산자·소비자·분해자 ── */
  2: () => [
    talk([
      { who: 'prof', text: '우리는 필요한 양분을 어떻게 얻고 있나요? 밥을 먹어서 얻지요! 생물은 살아가는 방식에 따라 생태계에서 맡은 <b>역할</b>이 달라요.' },
      { who: 'prof', text: '식물처럼 <b>햇빛 등을 이용해 스스로 양분을 만드는</b> 생물은 <b>생산자</b>예요.',
        card: '<div class="cc-title">🌿 생산자</div><div class="cc-body">스스로 양분을 만들어요<br>예) 풀, 나무, 미역</div>' },
      { who: 'prof', text: '동물처럼 <b>다른 생물을 먹이로 하여 살아가는</b> 생물은 <b>소비자</b>예요.',
        card: '<div class="cc-title">🍽️ 소비자</div><div class="cc-body">다른 생물을 먹어요<br>예) 메뚜기, 박새, 토끼</div>' },
      { who: 'prof', text: '버섯, 곰팡이, 일부 세균처럼 <b>죽은 생물체나 배출물을 분해</b>해 양분을 얻고 다른 생물이 이용할 수 있게 하는 생물은 <b>분해자</b>예요.',
        card: '<div class="cc-title">🍄 분해자</div><div class="cc-body">죽은 생물·배출물을 분해해요<br>예) 버섯, 곰팡이, 세균</div>' },
      { who: 'leader', text: '나는 버섯 관장! 내가 보내는 생물들의 역할을 알아맞혀 봐!' },
    ], 'bg-lab'),
    quiz([
      ...shuffle(['grass', 'clover', 'cornel', 'seaweed', 'grasshopper', 'caterpillar', 'tit', 'rabbit', 'hawk', 'coral', 'mushroom', 'mold']).map(roleItem),
      Object.assign(roleItem('bacteria'), { subject: { emoji: '🦠', title: '세균(일부)', sub: '현미경으로 봐야 보여요' } }),
      mcq('생산자가 스스로 양분을 만들 때 이용하는 것은 무엇일까요?', '햇빛', ['다른 동물', '죽은 생물', '플라스틱'],
        '생산자는 <b>햇빛</b> 등을 이용해 스스로 양분을 만들어요. 그래서 비생물 요소인 햇빛도 생태계에서 아주 중요해요!',
        { emoji: '☀️', title: '생각 문제', sub: '생산자와 햇빛' }),
      mcq('생태계에서 <b>분해자가 모두 사라지면</b> 어떤 일이 생길까요?', '죽은 생물과 배출물이 쌓이고, 다른 생물이 쓸 양분이 부족해져요.',
        ['아무런 변화가 없어요.', '생산자가 훨씬 더 잘 자라요.'],
        '분해자가 없으면 죽은 생물과 배출물이 분해되지 않고 그대로 쌓여요. 흙으로 돌아가는 양분도 줄어 <b>식물(생산자)도 잘 자라기 어려워요.</b>',
        { poke: 590, emoji: '🍄', title: '생각 문제', sub: '분해자가 사라진다면?' }),
    ], { title: '생물의 역할' }),
  ],

  /* ── STAGE 3: 먹이사슬·먹이그물 ── */
  3: () => [
    talk([
      { who: 'pika', text: '개구리가 먹는 동물과 개구리를 먹는 동물에는 어떤 것이 있을까? 피카?' },
      { who: 'prof', text: '메뚜기는 풀을 먹고, 개구리는 메뚜기를 먹어요. 이처럼 생물이 서로 먹고 먹히는 관계가 사슬처럼 연결된 것을 <b>먹이사슬</b>이라고 해요.',
        card: '<div class="cc-title">🔗 먹이사슬</div><div class="cc-body">풀 ➜ 메뚜기 ➜ 개구리 ➜ 뱀<br><small>(➜ 먹히는 쪽에서 먹는 쪽으로)</small></div>' },
      { who: 'prof', text: '오리는 메뚜기뿐만 아니라 개구리도 먹고, 매나 족제비에게 잡아먹혀요. 이처럼 여러 개의 먹이사슬이 그물처럼 복잡하게 얽혀 있는 것을 <b>먹이그물</b>이라고 해요.',
        card: '<div class="cc-title">🕸️ 먹이그물</div><div class="cc-body">여러 먹이사슬이<br>그물처럼 얽힌 것</div>' },
      { who: 'leader', text: '나는 매서운 관장! 먼저 먹이사슬 카드를 순서대로 놓아 봐. 먹이 관계 모형은 <b>생산자 카드부터</b> 시작하는 거야!' },
    ], 'bg-meadow'),
    ...CHAINS.map((c, i) => chainStep(c, i + 1, CHAINS.length)),
    talk([
      { who: 'leader', text: '훌륭해! 이번엔 먹이그물 실험실이야. 생물 하나가 사라지면 어떤 일이 생기는지 직접 실험해 보자!' },
    ], 'bg-meadow'),
    webStep(),
    quiz([
      mcq('<b>단순한 먹이사슬</b>에서 개구리가 사라지면 매는 어떻게 될까요?', '먹을 것이 없어 살기 어려워요.',
        ['다른 먹이를 골라 먹어서 괜찮아요.', '매의 수가 크게 늘어나요.'],
        '단순한 먹이 관계에서는 개구리가 사라지면 매도 먹을 것이 없어 살 수 없고 생태계가 <b>불안정</b>해져요.',
        { html: simpleChainHtml() }),
      mcq('먹이그물이 <b>복잡할수록</b> 생태계는 어떻게 될까요?', '어떤 생물이 사라져도 다른 먹이를 먹을 수 있어 생태계가 안정적으로 유지돼요.',
        ['생물 하나만 사라져도 생태계 전체가 바로 무너져요.', '먹이그물은 생태계와 아무 관계가 없어요.'],
        '먹이그물이 복잡하면 어떤 생물이 사라져도 또 다른 먹이를 먹고 살아갈 수 있어 <b>환경 변화의 영향을 적게 받고 생태계를 안정적으로 유지</b>하는 데 도움이 돼요.',
        { emoji: '🕸️', title: '정리 문제', sub: '단순한 먹이 관계 vs 복잡한 먹이 관계' }),
    ], { title: '먹이그물 정리', bg: 'bg-meadow' }),
  ],

  /* ── STAGE 4: 환경오염 ── */
  4: () => [
    talk([
      { who: 'pika', text: '피카…? 바다에 유출된 기름은 생태계에 어떤 영향을 미칠까?' },
      { who: 'prof', text: '인간의 활동으로 공기, 물, 흙 등이 오염되면 생태계에 좋지 않은 영향을 줄 수 있어요. 환경이 더러워지거나 훼손되는 현상을 <b>환경오염</b>이라고 해요.',
        card: '<div class="cc-title">🏭 환경오염 3가지</div><div class="cc-body">🌫️ 대기오염 (공기)<br>💧 수질오염 (물)<br>🟫 토양오염 (흙)</div>' },
      { who: 'prof', text: '환경이 오염되면 생물이 사는 곳인 <b>서식지</b>가 파괴되고, 생물의 종류와 수가 줄어들거나 사라질 수도 있어요.' },
      { who: 'leader', text: '나는 맑음 관장! 공장에 오염 몬스터들이 나타났어! 오염의 원인이 무슨 오염인지 맞히면 몬스터를 정화할 수 있어!' },
    ], 'bg-factory'),
    quiz([
      ...shuffle(POLLUTION_CASES).map(pc => {
        const mon = POLLUTION_MONSTERS[pc.type];
        const label = `${mon.icon} ${mon.label}`;
        return {
          subject: { poke: mon.poke, emoji: mon.icon, title: pc.title, sub: `오염 몬스터 ${mon.pname}`, badge: pc.icon },
          bg: 'bg-factory',
          intro: `오염 몬스터 ${josa(mon.pname, '이/가')} 나타났다!`,
          prompt: `<b>${pc.title}</b>${josa(pc.title, '은/는').slice(pc.title.length)} 어떤 환경오염의 원인일까요?`,
          choices: ['🌫️ 대기오염', '💧 수질오염', '🟫 토양오염'], answer: label,
          explain: `<b>${mon.label}</b>이에요! ${pc.explain}`,
        };
      }),
      mcq('크기가 <b>5 mm 이하</b>인 아주 작은 플라스틱을 무엇이라고 할까요?', '미세 플라스틱', ['재활용 플라스틱', '플라스틱 섬', '페트병'],
        '<b>미세 플라스틱</b>은 물에 사는 생물이 먹이로 착각해 먹기 쉬워 큰 피해를 줘요.', { emoji: '🫧', title: '생각 문제', sub: '아주 작은 플라스틱' }),
      mcq('환경이 오염되면 생물에게 어떤 일이 생길까요?', '서식지가 파괴되고 생물의 종류와 수가 줄어들거나 사라질 수 있어요.',
        ['생물이 더 많아지고 건강해져요.', '생물에게는 아무 영향이 없어요.'],
        '환경이 오염되면 생물에게 해로운 영향을 미쳐요. 그래서 <b>환경오염을 줄이고 생태계 파괴를 막기 위해 다양한 노력</b>을 해야 해요.',
        { poke: 109, emoji: '🌫️', title: '정리 문제', sub: '환경오염과 생물' }),
    ], { title: '오염 몬스터 정화', bg: 'bg-factory' }),
  ],

  /* ── STAGE 5: 생태계 보전 ── */
  5: () => [
    talk([
      { who: 'turtle', text: '꼬북… 우리나라 연안에서 죽은 바다거북 <b>10마리 중 8마리</b>가 플라스틱 쓰레기를 먹은 것으로 나타났대요.',
        card: '<div class="cc-title">📰 카드 뉴스</div><div class="cc-body">우리나라 바다거북,<br>플라스틱 먹고 죽어 간다</div>' },
      { who: 'prof', text: '플라스틱 쓰레기가 바다에 사는 동물에게 심각한 위협이 되고 있어요. 생태계를 보전하려면 많은 사람의 노력이 필요해요.' },
      { who: 'leader', text: '나는 바다 관장! 먼저 바다 쓰레기를 치워서 바다거북을 구해 줘!' },
    ], 'bg-beach'),
    cleanupStep(),
    talk([
      { who: 'prof', text: '국가나 사회에서는 동물이 이동할 수 있도록 <b>생태통로</b>를 만들고, <b>생태계 보호 구역</b>이나 기간을 정하기도 해요.',
        card: '<div class="cc-title">🛡️ 생태계 보전 노력</div><div class="cc-body">생태통로 · 물고기 통로<br>새 충돌 방지 스티커<br>생태계 보호 구역</div>' },
      { who: 'prof', text: '우리도 <b>일회용품 사용을 줄이고 에너지를 절약</b>하면 환경을 보호하고 생태계를 보전하는 데 도움을 줄 수 있어요.' },
      { who: 'leader', text: '이제 생태계를 지키는 행동을 골라 볼까? 도움이 되는지, 해가 되는지 생각해 봐!' },
    ], 'bg-beach'),
    quiz([
      ...shuffle(ACTIONS).map(a => ({
        subject: { emoji: a.icon, title: '이 행동은?', sub: '생태계에 도움이 될까?' }, bg: 'bg-beach',
        prompt: `“${a.text}”`,
        choices: ['👍 도움이 돼요', '👎 해가 돼요'], answer: a.good ? '👍 도움이 돼요' : '👎 해가 돼요',
        explain: a.explain,
      })),
      ...SOLUTIONS.map(s => mcq(`<b>문제 상황</b>: ${s.problem}<br>어떻게 해결하면 좋을까요?`, s.answer, s.wrong,
        `<b>${s.answer}</b><br>생태계 보전을 위해 사람들이 실제로 하고 있는 노력이에요.`,
        { emoji: s.icon, title: '해결책을 찾아라!', sub: '생태계 보전 노력' }, { bg: 'bg-beach' })),
    ], { title: '생태계 지킴이', bg: 'bg-beach' }),
    pledgeStep(),
  ],

  /* ── STAGE 6: 챔피언 ── */
  6: () => [
    talk([
      { who: 'leader', text: '뮤우~ ✨ 배지를 모두 모았구나, <b>{name}</b>! 나는 챔피언 뮤. 생태계에 대해 배운 것을 모두 확인해 볼게!' },
      { who: 'pika', text: '피카피카! 지금까지 배운 걸 떠올려 보자. 생태계 구성 요소, 생물의 역할, 먹이그물, 환경오염, 생태계 보전!' },
    ], 'bg-champion'),
    quiz([
      mcq('다음 중 <b>비생물 요소</b>는 무엇일까요?', '흙', ['버섯', '산호', '다람쥐'],
        '흙은 살아 있지 않은 <b>비생물 요소</b>예요. 버섯, 산호, 다람쥐는 모두 생물 요소예요. (산호는 동물이에요!)', { emoji: '🟫', title: 'Q1', sub: '생태계 구성 요소' }),
      mcq('생태계에서 <b>ㅅㅁ ㅇㅅ</b>와 <b>ㅂㅅㅁ ㅇㅅ</b>는 서로 영향을 주고받아요. 알맞은 말은?', '생물 요소, 비생물 요소', ['생산자, 소비자', '먹이사슬, 먹이그물'],
        '생태계에서는 <b>생물 요소</b>와 <b>비생물 요소</b>가 서로 영향을 주고받아요.', { emoji: '🔤', title: 'Q2', sub: '초성 퀴즈' }),
      mcq('햇빛 등을 이용해 <b>스스로 양분을 만드는</b> 생물을 무엇이라고 할까요?', '생산자', ['소비자', '분해자', '비생물 요소'],
        '<b>생산자</b>는 햇빛 등을 이용해 스스로 양분을 만들어요.', { creature: 'grass' }),
      mcq('버섯과 곰팡이처럼 주로 <b>죽은 생물체나 배출물을 분해</b>해 양분을 얻는 생물은?', '분해자', ['생산자', '소비자', '포식자'],
        '<b>분해자</b>는 죽은 생물체나 배출물을 분해해 다른 생물이 이용할 수 있게 해요.', { creature: 'mushroom' }),
      mcq('생물의 먹이 관계가 서로 복잡하게 얽혀 있는 것을 <b>ㅁㅇㄱㅁ</b>이라고 해요. 알맞은 말은?', '먹이그물', ['먹이사슬', '생태통로', '생태계'],
        '여러 개의 먹이사슬이 그물처럼 복잡하게 얽혀 있는 것을 <b>먹이그물</b>이라고 해요.', { emoji: '🕸️', title: 'Q5', sub: '초성 퀴즈' }),
      mcq('다음 먹이사슬에서 빈칸에 들어갈 생물은?<br>도토리 ➜ (    ) ➜ 뱀 ➜ 매', '다람쥐', ['토끼풀', '버섯', '갈매기'],
        '다람쥐는 도토리를 먹고, 뱀에게 잡아먹혀요.', { creature: 'squirrel' }),
      mcq('바다에 <b>기름이 유출</b>되는 것은 어떤 환경오염일까요?', '수질오염', ['대기오염', '토양오염'],
        '바다에 유출된 기름은 물을 더럽히는 <b>수질오염</b>이에요.', { poke: 89, emoji: '🛢️', title: 'Q7', sub: '환경오염' }),
      mcq('환경오염에는 대기오염, 수질오염, <b>ㅌㅇ</b>오염 등이 있어요. 알맞은 말은?', '토양', ['태양', '탄소'],
        '흙이 오염되는 것을 <b>토양오염</b>이라고 해요.', { poke: 568, emoji: '🟫', title: 'Q8', sub: '초성 퀴즈' }),
      mcq('일회용품의 사용을 줄이면 <b>ㅅㅌㄱ</b>를 보전하는 데 도움이 돼요. 알맞은 말은?', '생태계', ['생태통로', '세탁기'],
        '일회용품 사용을 줄이면 쓰레기가 줄어 <b>생태계</b>를 보전하는 데 도움이 돼요.', { emoji: '♻️', title: 'Q9', sub: '초성 퀴즈' }),
      mcq('다음 중 생태계 보전을 위한 노력으로 <b>알맞지 않은</b> 것은?', '숲을 없애고 넓은 도로를 만들어요.',
        ['동물이 다닐 수 있는 생태통로를 만들어요.', '생태계 보호 구역을 지정해요.', '에너지를 절약해요.'],
        '숲을 없애면 생물의 서식지가 파괴돼요. 나머지는 모두 생태계를 지키는 노력이에요.', { emoji: '🛣️', title: 'Q10', sub: '생태계 보전' }),
      mcq('과학자들이 황새 ‘엔젤’ 같은 야생 동물에게 <b>위치 추적기</b>를 다는 까닭은 무엇일까요?',
        '이동 경로를 알아내 생태적 특성을 파악하고 보호하려고요.', ['동물을 더 쉽게 사냥하려고요.', '동물을 예쁘게 꾸미려고요.'],
        '위치 추적기로 실시간 이동 경로를 알 수 있어요. 황새 ‘엔젤’은 24시간 동안 1,200 km를 쉬지 않고 날아 대만에 도착했대요! 이런 정보로 야생 동물을 보호할 수 있어요.',
        { emoji: '🛰️', title: 'Q11', sub: '황새가 어디에 있는지 알 수 있다고?' }),
    ], { title: '챔피언 결전', bg: 'bg-champion' }),
  ],
};

function simpleChainHtml() {
  const ids = ['grass', 'grasshopper', 'frog', 'hawk'];
  return '<div class="mini-chain">' + ids.map((id, i) => {
    const c = CREATURES[id];
    const off = id === 'frog' ? ' off' : '';
    return (i ? '<span class="mc-arrow">➜</span>' : '') +
      `<div class="mc-node${off}"><img src="${IMG_SOURCES[0](c.poke)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${c.emoji}',className:'emoji-img'}))"><div>${c.name}</div>${off ? '<b class="mc-x">✕</b>' : ''}</div>`;
  }).join('') + '<div class="mc-cap">단순한 먹이사슬</div></div>';
}

