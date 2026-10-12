/* =========================================================
   타이틀 · 트레이너 고르기 · 포켓몬센터 · 상점 · 환전소 · 선생님 메뉴
   ========================================================= */
'use strict';

/* ---------- 타이틀 ---------- */
function renderTitle() {
  inStage = false;
  hideTopbar(); closeModal(); clear(app);
  const names = Object.keys(store.profiles).sort((a, b) => (store.profiles[b].lastPlayed || 0) - (store.profiles[a].lastPlayed || 0));
  const list = h('div', { class: 'profile-list' },
    ...names.map(n => {
      const p = store.profiles[n];
      const info = partnerInfo(null, p);
      return h('button', { class: 'profile-btn', onclick: () => {
        sfx.correct(); selectProfile(n);
        if (p.needsStarter) { renderStarterPick(n, true); return; }
        p.lastPlayed = Date.now(); persist(); goTown();
      } }, partnerImg('profile-img', null, p), h('div', null, h('b', null, n), h('div', { class: 'muted' }, info ? `${info.name} Lv.${info.level}` : '')));
    }),
    h('button', { class: 'profile-btn new', onclick: () => { sfx.click(); renderNewTrainer(); } }, h('span', { class: 'emoji-img profile-img' }, '➕'), h('b', null, '새 트레이너')));

  const parade = h('div', { class: 'title-parade' },
    ...shuffle(Object.keys(POKE_NAMES).map(Number)).slice(0, 7).map((p, i) => { const im = pokeImg(p, '⭐', 'parade-img'); im.style.animationDelay = `${i * 0.18}s`; return im; }));

  app.appendChild(h('section', { class: 'screen title-screen' },
    h('div', { class: 'title-card' },
      h('div', { class: 'pokeball-logo' }),
      h('h1', { class: 'game-title' }, '포켓몬', h('br'), h('span', null, '생태계 탐험대')),
      h('p', { class: 'subtitle' }, '초등 과학 4학년 2학기 「2. 생물과 환경」'),
      parade,
      h('div', { class: 'name-label' }, names.length ? '누구로 탐험할까요?' : '처음 왔나요? 트레이너를 만들어요!'),
      list,
      h('div', { class: 'title-links' },
        h('button', { class: 'link-btn', onclick: () => openModal(howToView()) }, '🎮 게임 방법'),
        h('button', { class: 'link-btn', onclick: () => teacherGate() }, '👩‍🏫 선생님 메뉴')),
      h('div', { class: 'title-legal' },
        h('b', null, '⚠️ 비영리 교육용 팬 게임입니다.'), h('br'),
        '포켓몬 캐릭터와 이미지의 저작권은 Nintendo · Creatures · GAME FREAK · The Pokémon Company에 있으며, ',
        h('b', null, '제작자에게는 저작권이 없습니다.'), ' 게임 기록은 이 컴퓨터에만 저장돼요. ',
        h('button', { class: 'link-btn inline', onclick: () => openModal(copyrightView()) }, '자세히 보기')))));
}

function renderNewTrainer() {
  clear(app);
  const input = h('input', { type: 'text', maxlength: '10', placeholder: '이름 (예: 김민지)' });
  const go = () => {
    const name = input.value.trim();
    if (!name) { input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 500); return; }
    if (store.profiles[name]) { toast('이미 있는 이름이에요. 목록에서 골라 주세요!'); return; }
    sfx.correct(); renderStarterPick(name, false);
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  app.appendChild(h('section', { class: 'screen' }, h('div', { class: 'panel center' },
    h('h2', null, '🧢 새 트레이너 만들기'),
    h('p', null, '이름을 적어 주세요. 기록은 이 컴퓨터에만 저장돼요.'),
    input, h('div', { class: 'row-btns' },
      h('button', { class: 'btn', onclick: renderTitle }, '← 뒤로'),
      h('button', { class: 'btn primary', onclick: go }, '다음 ▶')))));
  setTimeout(() => input.focus(), 50);
}

// 파트너 고르기 (처음 시작 / 새 파트너 입양)
function renderStarterPick(name, migrating, adopt = false) {
  clear(app);
  if (!adopt) hideTopbar();
  const owned = adopt ? Object.keys(save.partners) : [];
  const grid = h('div', { class: 'starter-grid' });
  Object.entries(STARTERS).forEach(([key, st]) => {
    const has = owned.includes(key);
    grid.appendChild(h('button', { class: `starter-card ${has ? 'owned' : ''}`, disabled: has ? 'disabled' : null, onclick: () => {
      if (!confirm(`${st.names[0]}${josa(st.names[0], '을/를').slice(-1)} ${adopt ? '새 파트너로 데려올까요?' : '파트너로 고를까요?'}`)) return;
      sfx.catch();
      if (adopt) {
        save.coins -= SHOP_ITEMS.find(i => i.id === 'adopt').price;
        save.partners[key] = { level: 1, xp: 0, branch: null }; save.active = key; persist();
        toast(`🥚 ${st.names[0]}${josa(st.names[0], '이/가').slice(-1)} 새 파트너가 되었어요!`); renderCenter();
      } else if (migrating) {
        save.partners = { [key]: { level: 1, xp: 0, branch: null } }; save.active = key; delete save.needsStarter;
        save.lastPlayed = Date.now(); persist(); goTown();
      } else {
        createProfile(name, key); save.lastPlayed = Date.now(); persist(); goTown(true);
      }
    } },
      pokeImg(st.line[0], st.emoji, 'starter-img'),
      h('div', { class: 'starter-name' }, st.names[0]),
      h('div', { class: 'chip small' }, `${st.emoji} ${st.type}`),
      h('p', { class: 'starter-desc' }, has ? '이미 함께하고 있어요' : st.desc)));
  });
  app.appendChild(h('section', { class: 'screen' }, h('div', { class: 'panel center' },
    h('h2', null, adopt ? '🥚 새 파트너 입양' : `${name}, 함께할 파트너를 골라요!`),
    h('p', null, '문제를 맞히면 파트너가 레벨 업! Lv.7과 Lv.15에 진화해요.'),
    grid,
    h('button', { class: 'btn', onclick: () => adopt ? renderShop() : renderTitle() }, '← 뒤로'))));
}

function howToView() {
  return h('div', null,
    h('h2', null, '🎮 게임 방법'),
    h('ol', { class: 'howto' },
      h('li', null, '트레이너를 만들고 ', h('b', null, '파트너 포켓몬'), '을 골라요.'),
      h('li', null, h('b', null, '생태 마을'), '을 걸어 다녀요. 화면을 누르면 그곳으로 걸어가고, 방향키로도 움직일 수 있어요.'),
      h('li', null, '건물에 들어가면 여러 게임을 할 수 있어요: 🏟️ 체육관 길(교과서 순서 스토리), 🏆 라운드전, ⏱️ 스피드 퀴즈, ⚔️ 1:1 대결, 👥 팀전, 🃏 기억력 카드.'),
      h('li', null, '숲길·강가·해변의 ', h('b', null, '풀숲(🌾)'), '에서는 야생 생물이 나타나요. 문제를 맞히면 도감에 등록돼요.'),
      h('li', null, '문제를 맞히면 파트너가 경험치를 얻고 ', h('b', null, '🪙 코인'), '을 받아요. Lv.7, Lv.15에 진화!'),
      h('li', null, '🏪 상점에서 사탕·배경·칭호·새 파트너를 사고, 💱 환전소에서 코인을 ', h('b', null, CLASS_CONFIG.currencyName), '로 바꿀 수 있어요.')),
    h('p', { class: 'note' }, '💡 모든 문제는 과학 교과서 「2. 생물과 환경」에서 나와요. 포켓몬은 실제 생물을 닮은 “모델”이에요.'));
}

/* ---------- 파트너 정보 카드 (마을 위쪽에 보여요) ---------- */
function partnerHud() {
  const info = partnerInfo();
  if (!info) return h('div');
  const pct = info.level >= MAX_LEVEL ? 100 : Math.round(info.xp / info.next * 100);
  return h('div', { class: 'hud' },
    h('div', { class: 'hud-poke' }, partnerImg('hud-img')),
    h('div', { class: 'hud-info' },
      h('div', { class: 'hud-name' }, `${save.name} · ${info.name} `, h('span', { class: 'lv' }, `Lv.${info.level}`)),
      h('div', { class: 'xp-bar' }, h('div', { class: 'xp-fill', style: { width: pct + '%' } })),
      h('div', { class: 'hud-sub' }, h('span', { class: 'title-tag' }, `🏷️ ${save.title}`), h('span', null, `🪙 ${save.coins}`), h('span', null, `📕 ${save.dex.length}/${DEX_IDS.length}`), h('span', null, `⚪ ${save.mons.length}/${ALL_MONS.length}`))));
}

/* =========================================================
   🏥 포켓몬센터 (내 파트너 · 가방 · 트레이너 카드)
   ========================================================= */
function renderCenter() {
  inStage = false;
  showTopbar('🏥 포켓몬센터');
  clear(app);
  const info = partnerInfo();
  const nextEvo = EVOLVE_LEVELS.find(l => l > info.level);
  const pct = info.level >= MAX_LEVEL ? 100 : Math.round(info.xp / info.next * 100);

  const useItem = (id) => {
    if (!save.items[id]) { toast('가방에 없어요. 상점에서 살 수 있어요!'); return; }
    if (info.level >= MAX_LEVEL) { toast('이미 최고 레벨이에요! 🎉'); return; }
    save.items[id]--;
    if (id === 'xpcandy') addXp(40);
    else { const d = info.data; d.xp = xpToNext(d.level); addXp(0); }
    persist(); sfx.coin();
    flushEvents(() => renderCenter());
  };

  const partners = Object.keys(save.partners).map(k => {
    const pi = partnerInfo(k);
    return h('button', { class: `mini-partner ${k === save.active ? 'on' : ''}`, onclick: () => {
      save.active = k; persist(); sfx.click(); renderCenter();
    } }, partnerImg('mini-img', k), h('div', null, `${pi.name}`), h('div', { class: 'muted' }, `Lv.${pi.level}`));
  });

  const titleSel = h('select', { class: 'select' }, ...save.titles.map(t => { const o = h('option', { value: t }, t); if (t === save.title) o.selected = true; return o; }));
  titleSel.addEventListener('change', () => { save.title = titleSel.value; persist(); toast('칭호를 바꿨어요!'); });
  const themeSel = h('select', { class: 'select' }, ...save.themes.map(t => { const o = h('option', { value: t }, THEMES[t].name); if (t === save.theme) o.selected = true; return o; }));
  themeSel.addEventListener('change', () => { save.theme = themeSel.value; persist(); renderCenter(); });

  const s = save.stats;
  const rate = s.answered ? Math.round(s.correct / s.answered * 100) : 0;
  app.appendChild(h('section', { class: 'screen center-screen' },
    h('div', { class: 'panel partner-panel', style: { background: THEMES[save.theme].css } },
      h('div', { class: 'partner-big' }, partnerImg('partner-big-img')),
      h('div', { class: 'partner-card' },
        h('h2', null, `${info.name} `, h('span', { class: 'lv' }, `Lv.${info.level}`)),
        h('div', { class: 'xp-bar big' }, h('div', { class: 'xp-fill', style: { width: pct + '%' } })),
        h('p', { class: 'muted' }, info.level >= MAX_LEVEL ? '최고 레벨 달성! 🏆' : `다음 레벨까지 경험치 ${info.next - info.xp}`),
        h('p', null, nextEvo ? `✨ Lv.${nextEvo}이 되면 진화해요!` : '✨ 최종 진화 완료!'),
        h('p', { class: 'muted' }, info.starter.desc))),
    h('div', { class: 'panel' },
      h('h3', null, '🎒 가방'),
      h('div', { class: 'bag' },
        h('button', { class: 'bag-item', onclick: () => useItem('xpcandy') }, '🍬', h('b', null, ` 경험치 사탕 ×${save.items.xpcandy}`), h('div', { class: 'muted' }, '눌러서 사용 (경험치 +40)')),
        h('button', { class: 'bag-item', onclick: () => useItem('candy') }, '🍭', h('b', null, ` 이상한 사탕 ×${save.items.candy}`), h('div', { class: 'muted' }, '눌러서 사용 (레벨 +1)'))),
      h('h3', null, '🤝 내 파트너들'),
      h('div', { class: 'mini-partners' }, ...partners),
      h('p', { class: 'muted' }, '누르면 함께 다닐 파트너가 바뀌어요. 새 파트너는 상점에서 입양할 수 있어요.')),
    h('div', { class: 'panel' },
      h('h3', null, '🪪 트레이너 카드'),
      h('div', { class: 'form-row' }, h('label', null, '칭호'), titleSel),
      h('div', { class: 'form-row' }, h('label', null, '배경'), themeSel),
      h('div', { class: 'stat-grid' },
        stat('맞힌 문제', `${s.correct}개`), stat('정답률', `${rate}%`), stat('도감', `${save.dex.length}/${DEX_IDS.length}`),
        stat('체육관 배지', `${Object.keys(save.cleared).filter(k => k !== '6').length}/5`),
        stat('라운드전 최고', `${s.roundBest}라운드`), stat('스피드 최고', `${s.speedBest}점`),
        stat('대결 승리', `${s.duelWins}번`), stat('모은 코인', `${s.totalCoins}`), stat('잡은 포켓몬', `${save.mons.length}/${ALL_MONS.length}`)),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn small', onclick: () => { exportProfile(); toast('💾 기록 파일을 내려받았어요. 잘 보관해요!'); } }, '💾 내 기록 파일로 저장'),
        (() => {
          const inp = h('input', { type: 'file', accept: '.json,application/json', class: 'hidden' });
          inp.addEventListener('change', () => { if (inp.files[0]) importProfile(inp.files[0], () => renderCenter()); });
          return h('label', { class: 'btn small file-btn' }, '📂 기록 파일 불러오기', inp);
        })()),
      h('p', { class: 'muted' }, '💡 다른 컴퓨터로 옮기거나 기록이 지워질 때를 대비해 파일로 저장해 둘 수 있어요. (인터넷으로 보내지 않아요)'),
      h('details', { class: 'record-code' },
        h('summary', null, '📤 선생님께 보낼 기록 코드'),
        h('p', { class: 'muted' }, '선생님이 요청하면 아래 코드를 보여 주세요. (선생님만 우리 반 랭킹을 볼 수 있어요)'),
        h('div', { class: 'code-box' }, makeRecordCode()))),
    h('div', { class: 'row-btns' }, h('button', { class: 'btn primary', onclick: () => goTown() }, '🏠 마을로'))));
}
function stat(label, value) { return h('div', { class: 'stat' }, h('div', { class: 'stat-v' }, value), h('div', { class: 'stat-l' }, label)); }

/* =========================================================
   🏪 상점
   ========================================================= */
function renderShop() {
  inStage = false;
  showTopbar('🏪 상점');
  clear(app);
  const grid = h('div', { class: 'shop-grid' });
  SHOP_ITEMS.forEach(item => {
    let owned = false, note = item.desc || '';
    if (item.kind === 'theme') { owned = save.themes.includes(item.value); note = '포켓몬센터 배경이 바뀌어요'; }
    if (item.kind === 'title') { owned = save.titles.includes(item.value); note = '트레이너 카드에 칭호가 붙어요'; }
    if (item.kind === 'adopt' && Object.keys(save.partners).length >= Object.keys(STARTERS).length) { owned = true; note = '모든 파트너를 모았어요!'; }
    if (item.kind === 'item') note += ` (가진 개수: ${save.items[item.id]})`;
    grid.appendChild(h('div', { class: `shop-item ${owned ? 'owned' : ''}` },
      h('div', { class: 'shop-icon' }, item.icon),
      h('div', { class: 'shop-name' }, item.name),
      h('div', { class: 'muted' }, note),
      h('button', { class: 'btn small primary', disabled: owned ? 'disabled' : null, onclick: () => buy(item) }, owned ? '보유 중' : `🪙 ${item.price}`)));
  });
  app.appendChild(h('section', { class: 'screen' },
    h('div', { class: 'panel' },
      h('h2', null, '🏪 포켓몬 상점'),
      h('p', null, `내 코인: `, h('b', { class: 'coin-big' }, `🪙 ${save.coins}`), h('span', { class: 'muted' }, `  · 오늘 더 벌 수 있는 코인: ${coinsLeftToday()}`)),
      grid),
    h('div', { class: 'row-btns' }, h('button', { class: 'btn primary', onclick: () => goTown() }, '🏠 마을로'))));
}
function buy(item) {
  if (save.coins < item.price) { sfx.wrong(); toast('코인이 모자라요! 문제를 풀어서 모아 보세요 💪'); return; }
  if (item.kind === 'adopt') { renderStarterPick(save.name, false, true); return; }
  if (!confirm(`${josa(item.name, '을/를')} 🪙${item.price}에 살까요?`)) return;
  save.coins -= item.price;
  if (item.kind === 'item') save.items[item.id]++;
  if (item.kind === 'theme') { save.themes.push(item.value); save.theme = item.value; }
  if (item.kind === 'title') { save.titles.push(item.value); save.title = item.value; }
  persist(); updateCoinChip(); sfx.coin(); toast(`🛍️ ${item.name} 구매 완료!`);
  renderShop();
}

/* =========================================================
   💱 환전소 (게임 코인 ↔ 학급 화폐)
   ========================================================= */
function renderExchange() {
  inStage = false;
  showTopbar('💱 환전소');
  clear(app);
  const C = CLASS_CONFIG;
  if (save.exchanged.date !== todayStr()) save.exchanged = { date: todayStr(), units: 0 };
  const leftUnits = Math.max(0, C.dailyExchangeLimit - save.exchanged.units);
  const maxUnits = Math.min(leftUnits, Math.floor(save.coins / C.coinsPerUnit));

  const unitSel = h('input', { type: 'number', min: '1', max: String(Math.max(1, maxUnits)), value: '1', class: 'num-input' });
  const exchangeBox = C.dailyExchangeLimit > 0 ? h('div', { class: 'panel' },
    h('h3', null, `🪙 → 💵 코인을 ${C.currencyName}${josa(C.currencyName, '으로/로').slice(C.currencyName.length)} 바꾸기`),
    h('p', null, h('b', null, `🪙 ${C.coinsPerUnit} 코인 = ${C.currencyName} 1${C.currencyUnit}`), ` · 오늘 남은 환전: ${leftUnits}${C.currencyUnit}`),
    maxUnits > 0
      ? h('div', { class: 'form-row' }, unitSel, h('span', null, C.currencyUnit),
          h('button', { class: 'btn primary small', onclick: () => {
            const u = Math.floor(Number(unitSel.value));
            if (!(u >= 1 && u <= maxUnits)) { toast(`1~${maxUnits} 사이로 적어 주세요.`); return; }
            if (!confirm(`🪙 ${u * C.coinsPerUnit} 코인을 ${C.currencyName} ${u}${C.currencyUnit}${josa(C.currencyUnit, '으로/로').slice(C.currencyUnit.length)} 바꿀까요?\n영수증 코드를 선생님께 보여 드려야 해요.`)) return;
            const code = makeReceipt(save.name, u);
            save.coins -= u * C.coinsPerUnit; save.exchanged.units += u;
            save.receipts.unshift({ code, units: u, date: todayStr() });
            save.receipts = save.receipts.slice(0, 20);
            persist(); sfx.coin(); renderExchange();
            openModal(receiptView(save.receipts[0]));
          } }, '환전하기'))
      : h('p', { class: 'muted' }, leftUnits ? `코인이 ${C.coinsPerUnit}개 이상 있어야 환전할 수 있어요.` : '오늘은 더 환전할 수 없어요. 내일 다시 와요!'),
    save.receipts.length ? h('div', null, h('h4', null, '🧾 내 영수증 (눌러서 크게 보기)'),
      ...save.receipts.slice(0, 6).map(r => h('button', { class: 'receipt-row', onclick: () => openModal(receiptView(r)) },
        `${r.date} · ${C.currencyName} ${r.units}${C.currencyUnit} · `, h('code', null, r.code)))) : null)
    : h('div', { class: 'panel' }, h('p', null, '선생님이 코인 환전 기능을 꺼 두었어요.'));

  const codeInput = h('input', { type: 'text', inputmode: 'numeric', placeholder: '예: 105-123-456', class: 'code-input' });
  const couponBox = h('div', { class: 'panel' },
    h('h3', null, '🎟️ 선생님 쿠폰 쓰기'),
    h('p', { class: 'muted' }, `${C.currencyName}${josa(C.currencyName, '으로/로').slice(C.currencyName.length)} 선생님께 받은 쿠폰 코드를 적으면 코인이나 사탕을 받아요. (쿠폰은 내 이름으로만 쓸 수 있어요)`),
    h('div', { class: 'form-row' }, codeInput, h('button', { class: 'btn primary small', onclick: () => {
      const r = readCoupon(save.name, codeInput.value);
      if (!r.ok) { sfx.wrong(); toast(r.msg, 2500); return; }
      if (save.usedCoupons.includes(r.id)) { sfx.wrong(); toast('이미 사용한 쿠폰이에요.'); return; }
      save.usedCoupons.push(r.id);
      let msg = '';
      if (r.kind === '1') { save.coins += r.amount * 10; save.stats.totalCoins += r.amount * 10; msg = `🪙 ${r.amount * 10} 코인`; }
      if (r.kind === '2') { save.items.candy += r.amount; msg = `🍭 이상한 사탕 ${r.amount}개`; }
      if (r.kind === '3') { save.items.xpcandy += r.amount; msg = `🍬 경험치 사탕 ${r.amount}개`; }
      persist(); updateCoinChip(); sfx.catch(); toast(`🎉 쿠폰 사용! ${josa(msg, '을/를')} 받았어요!`, 2500); renderExchange();
    } }, '쿠폰 쓰기')));

  app.appendChild(h('section', { class: 'screen' },
    h('div', { class: 'panel center' }, h('h2', null, '💱 환전소'), h('p', null, `내 코인: `, h('b', { class: 'coin-big' }, `🪙 ${save.coins}`))),
    exchangeBox, couponBox,
    h('div', { class: 'row-btns' }, h('button', { class: 'btn primary', onclick: () => goTown() }, '🏠 마을로'))));
}
function receiptView(r) {
  const C = CLASS_CONFIG;
  return h('div', { class: 'center receipt' },
    h('h2', null, '🧾 환전 영수증'),
    h('p', null, `이름: `, h('b', null, save.name)),
    h('p', { class: 'big-text' }, `${C.currencyName} ${r.units}${C.currencyUnit}`),
    h('div', { class: 'code-box big' }, r.code),
    h('p', { class: 'muted' }, `${r.date} · 이 화면을 선생님께 보여 주세요. 선생님이 코드를 확인하고 ${josa(C.currencyName, '을/를')} 주실 거예요.`));
}

/* =========================================================
   👩‍🏫 선생님 메뉴 (비밀번호 필요)
   ========================================================= */
function teacherGate() {
  const input = h('input', { type: 'password', inputmode: 'numeric', placeholder: '비밀번호', class: 'code-input' });
  const go = () => {
    if (input.value === String(CLASS_CONFIG.teacherPin)) { sfx.correct(); openModal(teacherView()); }
    else { sfx.wrong(); input.value = ''; toast('비밀번호가 달라요.'); }
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  openModal(h('div', { class: 'center' }, h('h2', null, '👩‍🏫 선생님 메뉴'), h('p', null, '선생님 비밀번호를 입력하세요.'),
    input, h('div', null, h('button', { class: 'btn primary', onclick: go }, '확인')),
    h('p', { class: 'muted' }, '비밀번호는 js/config.js 파일에서 바꿀 수 있어요.')));
  setTimeout(() => input.focus(), 50);
}

function teacherView(tab = 'rank') {
  const tabs = { rank: '🏅 랭킹', coupon: '🎟️ 쿠폰', receipt: '🧾 영수증 확인', class: '📚 수업', students: '👥 이 기기 학생' };
  const body = h('div', { class: 't-body' });
  const nav = h('div', { class: 't-tabs' }, ...Object.entries(tabs).map(([k, v]) =>
    h('button', { class: `t-tab ${k === tab ? 'on' : ''}`, onclick: () => openModal(teacherView(k)) }, v)));
  ({ rank: tRank, coupon: tCoupon, receipt: tReceipt, class: tClass, students: tStudents })[tab](body);
  return h('div', { class: 'teacher' }, h('h2', null, '👩‍🏫 선생님 메뉴'), nav, body);
}

// 랭킹: 이 기기 학생 + 선생님이 붙여 넣은 기록 코드 (선생님 컴퓨터에만 저장)
function tRank(body) {
  const rows = {};
  Object.values(store.profiles).forEach(p => { rows[p.name] = Object.assign(rankingSummary(p), { src: '이 기기' }); });
  Object.values(device.ranking).forEach(r => { if (!rows[r.name] || rows[r.name].src !== '이 기기') rows[r.name] = Object.assign({}, r, { src: '코드' }); });
  const sortKeys = { lv: '레벨', mon: '포켓몬 수집', correct: '맞힌 문제', dex: '도감', stars: '별', round: '라운드전', speed: '스피드', duel: '대결 승', coins: '모은 코인' };
  const sel = h('select', { class: 'select' }, ...Object.entries(sortKeys).map(([k, v]) => h('option', { value: k }, `${v} 순`)));
  const table = h('div');
  const draw = () => {
    const k = sel.value;
    const list = Object.values(rows).sort((a, b) => (b[k] - a[k]) || (b.lv - a.lv) || (b.correct - a.correct));
    clear(table);
    table.appendChild(h('table', { class: 'rank-table' },
      h('thead', null, h('tr', null, h('th', null, '순위'), h('th', null, '이름'), h('th', null, '레벨'), h('th', null, '맞힌'), h('th', null, '정답률'),
        h('th', null, '도감'), h('th', null, '포켓몬'), h('th', null, '별'), h('th', null, '라운드'), h('th', null, '스피드'), h('th', null, '대결'), h('th', null, '코인'))),
      h('tbody', null, ...list.map((r, i) => h('tr', null,
        h('td', null, i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1),
        h('td', { class: 'rank-name' }, pokeImg(r.poke, '⚪', 'rank-img'), r.name, r.src === '코드' ? h('span', { class: 'muted' }, ' (코드)') : null),
        h('td', null, r.lv), h('td', null, r.correct), h('td', null, r.answered ? Math.round(r.correct / r.answered * 100) + '%' : '-'),
        h('td', null, r.dex), h('td', null, r.mon || 0), h('td', null, r.stars), h('td', null, r.round), h('td', null, r.speed), h('td', null, r.duel), h('td', null, r.coins))))));
    if (!list.length) table.appendChild(h('p', { class: 'muted' }, '아직 기록이 없어요.'));
  };
  sel.addEventListener('change', draw);
  const nameIn = h('input', { type: 'text', placeholder: '학생 이름' });
  const codeIn = h('textarea', { rows: '3', placeholder: 'ECO-... 기록 코드 (학생 포켓몬센터 → 트레이너 카드 → 기록 코드)' });
  body.append(
    h('p', { class: 'muted' }, '이 랭킹은 선생님만 볼 수 있어요. 학생 화면에는 랭킹이 나오지 않아요. 학생 기록은 각자 컴퓨터에만 저장되고, 학생이 보여 준 기록 코드를 여기 붙여 넣으면 ', h('b', null, '이 컴퓨터에만'), ' 저장돼요.'),
    h('div', { class: 'form-row' }, sel),
    table,
    h('h4', null, '➕ 기록 코드 추가 / 갱신'),
    h('div', { class: 'form-col' }, nameIn, codeIn, h('button', { class: 'btn small primary', onclick: () => {
      const name = nameIn.value.trim();
      const r = readRecordCode(name, codeIn.value);
      if (!name || !r) { sfx.wrong(); toast('이름과 코드가 맞지 않아요. 이름을 정확히 적었는지 확인해 주세요.', 2500); return; }
      device.ranking[normName(name)] = Object.assign(r, { updated: Date.now() }); persist();
      sfx.correct(); toast(`${name} 기록을 저장했어요!`); openModal(teacherView('rank'));
    } }, '저장')),
    Object.keys(device.ranking).length ? h('button', { class: 'btn small danger', onclick: () => {
      if (!confirm('붙여 넣은 기록 코드를 모두 지울까요? (이 기기 학생 기록은 그대로예요)')) return;
      device.ranking = {}; persist(); openModal(teacherView('rank'));
    } }, '코드 기록 모두 지우기') : '');
  draw();
}

function tCoupon(body) {
  const C = CLASS_CONFIG;
  const nameIn = h('input', { type: 'text', placeholder: '학생 이름 (게임 속 이름과 똑같이)' });
  const kindSel = h('select', { class: 'select' },
    h('option', { value: '1' }, '🪙 코인'), h('option', { value: '2' }, '🍭 이상한 사탕 (레벨 +1)'), h('option', { value: '3' }, '🍬 경험치 사탕'));
  const amtIn = h('input', { type: 'number', min: '1', max: '99', value: '10', class: 'num-input' });
  const hint = h('span', { class: 'muted' });
  const syncHint = () => { hint.textContent = kindSel.value === '1' ? `× 10 = 🪙 ${(Number(amtIn.value) || 0) * 10} 코인` : '개'; };
  kindSel.addEventListener('change', syncHint); amtIn.addEventListener('input', syncHint); syncHint();
  const out = h('div');
  body.append(
    h('p', null, `학생이 ${josa(C.currencyName, '을/를')} 내고 게임 보상을 사고 싶어 할 때, 그 학생 이름으로만 쓸 수 있는 1회용 쿠폰을 만들어요. (참고: ${C.currencyName} 1${C.currencyUnit} = 🪙 ${C.coinsPerUnit})`),
    h('div', { class: 'form-col' }, nameIn, h('div', { class: 'form-row' }, kindSel, amtIn, hint),
      h('button', { class: 'btn small primary', onclick: () => {
        const name = nameIn.value.trim(); const amt = Math.floor(Number(amtIn.value));
        if (!name || !(amt >= 1 && amt <= 99)) { toast('이름과 수량(1~99)을 확인해 주세요.'); return; }
        const code = makeCoupon(name, kindSel.value, amt);
        clear(out);
        out.append(h('div', { class: 'center' }, h('p', null, `${name} 학생용 쿠폰`), h('div', { class: 'code-box big' }, code),
          h('p', { class: 'muted' }, '학생이 💱 환전소 → 쿠폰 쓰기에 이 코드를 적으면 돼요.')));
      } }, '쿠폰 만들기')),
    out);
}

function tReceipt(body) {
  const nameIn = h('input', { type: 'text', placeholder: '학생 이름' });
  const codeIn = h('input', { type: 'text', inputmode: 'numeric', placeholder: '영수증 코드 (예: 03286-41789)' });
  const out = h('div');
  body.append(
    h('p', null, `학생이 코인을 ${josa(CLASS_CONFIG.currencyName, '으로/로')} 바꾸면 영수증 코드를 보여 줘요. 이름과 코드를 넣어 진짜인지 확인한 뒤 ${josa(CLASS_CONFIG.currencyName, '을/를')} 주세요.`),
    h('div', { class: 'form-col' }, nameIn, codeIn, h('button', { class: 'btn small primary', onclick: () => {
      const r = readReceipt(nameIn.value.trim(), codeIn.value);
      clear(out);
      if (!r.ok) { sfx.wrong(); out.append(h('p', { class: 'bad' }, r.msg)); return; }
      const dup = device.verified.includes(r.id);
      sfx.correct();
      out.append(h('div', { class: `verify ${dup ? 'dup' : 'ok'}` },
        h('p', { class: 'big-text' }, dup ? '⚠️ 이미 확인한 영수증이에요!' : '✅ 진짜 영수증이에요'),
        h('p', null, `${nameIn.value.trim()} · ${r.date} · ${CLASS_CONFIG.currencyName} ${r.units}${CLASS_CONFIG.currencyUnit}`),
        dup ? null : h('button', { class: 'btn small', onclick: () => {
          device.verified.push(r.id); device.verified = device.verified.slice(-500); persist(); toast('지급 완료로 표시했어요.'); openModal(teacherView('receipt'));
        } }, '지급 완료로 표시 (중복 지급 방지)')));
    } }, '확인하기')), out);
}

function tClass(body) {
  const toggle = h('input', { type: 'checkbox' }); toggle.checked = !!device.allOpen;
  toggle.addEventListener('change', () => { device.allOpen = toggle.checked; persist(); });
  const C = CLASS_CONFIG;
  body.append(
    h('table', { class: 'lesson-table' },
      h('thead', null, h('tr', null, h('th', null, '체육관 스테이지'), h('th', null, '학습 내용'), h('th', null, '교과서'))),
      h('tbody', null, ...STAGES.map(s => h('tr', null, h('td', null, `${s.badge} ${s.id}. ${s.name}`), h('td', null, s.topic), h('td', null, s.pages))))),
    h('label', { class: 'toggle-row' }, toggle, ' 이 기기에서 모든 체육관 스테이지 열기 (차시별 수업용)'),
    h('h4', null, '⚙️ 현재 설정 (js/config.js 에서 바꿀 수 있어요)'),
    h('ul', null,
      h('li', null, `학급 화폐: ${C.currencyName} (단위: ${C.currencyUnit})`),
      h('li', null, `환전 비율: 🪙 ${C.coinsPerUnit} 코인 = 1${C.currencyUnit}`),
      h('li', null, `하루 환전 한도: ${C.dailyExchangeLimit}${C.currencyUnit} / 하루 코인 획득 한도: 🪙 ${C.dailyCoinLimit}`)),
    h('p', { class: 'muted' }, '💡 게임 기록은 서버 없이 각 컴퓨터의 브라우저에만 저장돼요. 인터넷 기록 삭제나 시크릿 창에서는 기록이 지워질 수 있어요.'));
}

function tStudents(body) {
  const list = Object.values(store.profiles);
  body.append(h('p', { class: 'muted' }, '이 컴퓨터에 저장된 트레이너들이에요.'),
    list.length ? h('div', { class: 'form-col' }, ...list.map(p => {
      const info = partnerInfo(null, p);
      return h('div', { class: 'student-row' }, partnerImg('rank-img', null, p),
        h('b', null, p.name), h('span', { class: 'muted' }, ` ${info ? info.name + ' Lv.' + info.level : ''} · 🪙${p.coins}`),
        h('button', { class: 'btn small danger', onclick: () => {
          if (!confirm(`${p.name}의 기록을 이 컴퓨터에서 완전히 지울까요?`)) return;
          delete store.profiles[p.name];
          if (store.current === p.name) { store.current = null; save = null; }
          persist(); openModal(teacherView('students'));
        } }, '삭제'));
    })) : h('p', null, '저장된 트레이너가 없어요.'));
}
