/* =========================================================
   포켓몬 생태계 탐험대 - 공통 기능
   (저장, 트레이너 프로필, 보상·레벨업·진화, 화면 도우미, 소리)
   ========================================================= */
'use strict';

/* ---------- 저장 (이 기기의 브라우저에만 저장됩니다) ---------- */
const STORE_KEY = 'ecoPokemonExplorer.v2';
const OLD_STORE_KEY = 'ecoPokemonExplorer.v1';

function blankProfile(name, starter) {
  return {
    name, cleared: {}, dex: [], pledge: '',
    partners: { [starter]: { level: 1, xp: 0, branch: null } }, active: starter,
    coins: 0, earned: { date: '', coins: 0 }, exchanged: { date: '', units: 0 },
    items: { xpcandy: 0, candy: 0 },
    titles: ['새싹 트레이너'], title: '새싹 트레이너', themes: ['basic'], theme: 'basic',
    stats: { correct: 0, answered: 0, roundBest: 0, speedBest: 0, duelWins: 0, memoryBest: 0, wild: 0, totalCoins: 0 },
    usedCoupons: [], receipts: [], trash: { date: '', got: [] }, mons: [],
    pos: { map: 'town', x: 7, y: 5 },
    created: Date.now(),
  };
}

function loadStore() {
  let st = null;
  try { st = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { st = null; }
  if (!st || typeof st !== 'object') st = { current: null, profiles: {}, device: {} };
  st.profiles = st.profiles || {};
  st.device = Object.assign({ sound: true, allOpen: false, verified: [], ranking: {} }, st.device || {});
  // 예전 버전(v1) 기록 옮기기
  try {
    const old = JSON.parse(localStorage.getItem(OLD_STORE_KEY) || 'null');
    if (old && old.name && !st.profiles[old.name]) {
      const p = blankProfile(old.name, 'pichu');
      p.cleared = old.cleared || {}; p.dex = old.dex || []; p.pledge = old.pledge || '';
      p.needsStarter = true;
      st.profiles[old.name] = p;
      if (old.teacher) st.device.allOpen = true;
      localStorage.removeItem(OLD_STORE_KEY);
    }
  } catch (e) { /* 무시 */ }
  Object.values(st.profiles).forEach(p => {
    const b = blankProfile(p.name, p.active || 'pichu');
    for (const k of Object.keys(b)) if (p[k] === undefined) p[k] = b[k];
    p.stats = Object.assign(b.stats, p.stats);
    p.items = Object.assign(b.items, p.items);
  });
  return st;
}
let store = loadStore();
let device = store.device;
let save = store.current ? store.profiles[store.current] || null : null;

function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 저장 불가 환경 */ }
}
function selectProfile(name) {
  store.current = name; save = store.profiles[name]; persist();
}
function createProfile(name, starter) {
  store.profiles[name] = blankProfile(name, starter);
  selectProfile(name);
}

/* ---------- 도우미 ---------- */
const app = document.getElementById('app');

function h(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith('--')) node.style.setProperty(sk, sv); else node.style[sk] = sv;
        }
      }
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return node;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// 한국어 조사: josa('사과', '을/를') → '사과를'
function josa(word, pair) {
  const [withJong, noJong] = pair.split('/');
  const base = String(word).replace(/\(.*?\)/g, '').trim();
  const ch = base.charCodeAt(base.length - 1);
  if (ch < 0xAC00 || ch > 0xD7A3) return word + noJong;
  const jong = (ch - 0xAC00) % 28;
  if (pair === '으로/로') return word + (jong === 0 || jong === 8 ? '로' : '으로');
  return word + (jong ? withJong : noJong);
}
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function dayNumber() { return Math.floor((Date.now() - new Date(2026, 0, 1).getTime()) / 86400000) % 1000; }
// 짧은 확인용 해시 (FNV-1a)
function fnv(str) {
  let x = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  return x >>> 0;
}
function normName(n) { return String(n).replace(/\s+/g, '').toLowerCase(); }

/* ---------- 포켓몬 이미지 (실패 시 다음 주소 → 이모지) ---------- */
function pokeImg(pokeId, emoji, cls = '', lazy = false) {
  if (!pokeId) return h('span', { class: `emoji-img ${cls}`, role: 'img' }, emoji || '❔');
  let idx = 0;
  const img = h('img', { class: `poke-img ${cls}`, alt: '', draggable: 'false', loading: lazy ? 'lazy' : null });
  img.addEventListener('error', () => {
    idx++;
    if (idx < IMG_SOURCES.length) img.src = IMG_SOURCES[idx](pokeId);
    else img.replaceWith(h('span', { class: `emoji-img ${cls}`, role: 'img' }, emoji || '❔'));
  });
  img.src = IMG_SOURCES[0](pokeId);
  return img;
}
function creatureImg(id, cls = '') { const c = CREATURES[id]; return pokeImg(c.poke, c.emoji, cls); }

/* ---------- 소리 ---------- */
let audioCtx = null;
function tone(freqs, dur = 0.12, type = 'square', gap = 0.09, vol = 0.06) {
  if (!device.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type = type; o.frequency.value = f;
      const t = audioCtx.currentTime + i * gap;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + dur + 0.02);
    });
  } catch (e) { /* 소리 미지원 */ }
}
const sfx = {
  click:   () => tone([660], 0.05, 'square', 0, 0.03),
  correct: () => tone([784, 1047], 0.13),
  wrong:   () => tone([220, 165], 0.18, 'sawtooth', 0.12, 0.05),
  catch:   () => tone([523, 659, 784, 1047], 0.1, 'square', 0.08),
  clear:   () => tone([523, 523, 523, 698, 880, 784, 1047], 0.14, 'square', 0.13),
  pop:     () => tone([900], 0.06, 'triangle', 0, 0.06),
  coin:    () => tone([988, 1319], 0.08, 'square', 0.07, 0.04),
  level:   () => tone([523, 659, 784, 1047, 1319], 0.12, 'triangle', 0.1, 0.07),
  step:    () => tone([180], 0.03, 'triangle', 0, 0.02),
};

/* ---------- 상단 바 / 모달 / 알림 ---------- */
const topbar = document.getElementById('topbar');
const topTitle = document.getElementById('topbar-title');
const topCoins = document.getElementById('topbar-coins');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
let inStage = false;   // 게임 도중이면 true (나가기 전에 물어봐요)

function showTopbar(title) {
  topbar.classList.remove('hidden');
  topTitle.textContent = title;
  updateCoinChip();
}
function hideTopbar() { topbar.classList.add('hidden'); }
function updateCoinChip() {
  if (!topCoins) return;
  topCoins.textContent = save ? `🪙 ${save.coins}` : '';
  topCoins.classList.toggle('hidden', !save);
}
function openModal(content, opts = {}) {
  clear(modalBody); modalBody.appendChild(content);
  modal.classList.remove('hidden');
  modal.dataset.locked = opts.locked ? '1' : '';
  document.getElementById('modal-close').classList.toggle('hidden', !!opts.locked);
}
function closeModal() { modal.classList.add('hidden'); modal.dataset.locked = ''; }
document.getElementById('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal && !modal.dataset.locked) closeModal(); });

function toast(msg, ms = 1700) {
  const t = h('div', { class: 'toast' }, msg);
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 500);
}
function leave(fn) {
  if (inStage && !confirm('지금 하던 게임을 그만두고 나갈까요?')) return;
  inStage = false; closeModal(); fn();
}
document.getElementById('btn-home').addEventListener('click', () => leave(() => save ? goTown() : renderTitle()));
document.getElementById('btn-dex').addEventListener('click', () => openModal(dexView()));
document.getElementById('btn-info').addEventListener('click', () => openModal(copyrightView()));
const soundBtn = document.getElementById('btn-sound');
function syncSoundBtn() { soundBtn.textContent = device.sound ? '🔊' : '🔇'; }
soundBtn.addEventListener('click', () => { device.sound = !device.sound; persist(); syncSoundBtn(); sfx.click(); });
syncSoundBtn();

/* ---------- 저작권 안내 ---------- */
function copyrightView() {
  return h('div', { class: 'legal' },
    h('h2', null, '📢 저작권 안내'),
    h('p', null, h('b', null, '이 게임은 초등학교 수업을 위해 만든 비영리 팬 게임(Fan Game)입니다.')),
    h('ul', null,
      h('li', null, '포켓몬스터(Pokémon)의 이름, 캐릭터, 이미지에 대한 모든 저작권과 상표권은 ',
        h('b', null, 'Nintendo, Creatures Inc., GAME FREAK inc., The Pokémon Company'), '(한국: 포켓몬코리아)에 있습니다.'),
      h('li', null, h('b', null, '이 게임의 제작자에게는 포켓몬 관련 저작권이 없으며'), ', 공식 회사와 아무런 관련이 없습니다.'),
      h('li', null, '어떠한 상업적 목적(판매, 광고 수익 등)으로도 사용하지 않으며, 교실 학습용으로만 사용합니다. 게임 속 코인은 실제 돈과 관계없습니다.'),
      h('li', null, '포켓몬 이미지는 파일로 포함하지 않고, 공개 저장소(PokeAPI)에서 화면에 불러와 보여 줍니다.'),
      h('li', null, '학습 내용은 초등학교 4학년 2학기 과학 「2. 생물과 환경」 단원을 참고하였습니다.'),
      h('li', null, '저작권자의 요청이 있으면 즉시 게시를 중단하겠습니다.')),
    h('p', { class: 'legal-en' },
      'This is a non-commercial, educational fan game. Pokémon and all related names, characters and images are ' +
      '© Nintendo / Creatures Inc. / GAME FREAK inc. / The Pokémon Company. The creator claims no copyright and is not affiliated with them.'));
}

/* ---------- 도감 ---------- */
const DEX_IDS = Object.keys(CREATURES).filter(id => CREATURES[id].living && CREATURES[id].poke);
function registerDex(id) {
  const c = CREATURES[id];
  if (!save || !c || !c.living || !c.poke || save.dex.includes(id)) return false;
  save.dex.push(id); persist();
  missionEvent('dex');
  return true;
}
function dexView(tab = 'eco') {
  if (!save) return h('p', null, '트레이너를 먼저 골라 주세요.');
  const tabs = h('div', { class: 't-tabs' },
    h('button', { class: `t-tab ${tab === 'eco' ? 'on' : ''}`, onclick: () => openModal(dexView('eco')) }, `📕 생태 도감 ${save.dex.length}/${DEX_IDS.length}`),
    h('button', { class: `t-tab ${tab === 'mon' ? 'on' : ''}`, onclick: () => openModal(dexView('mon')) }, `⚪ 포켓몬 도감 ${save.mons.length}/${ALL_MONS.length}`));
  if (tab === 'mon') {
    const grid = h('div', { class: 'dex-grid mon-grid' });
    Object.entries(WILD_POKEMON).forEach(([org, ids]) => ids.forEach((id, i) => {
      const caught = save.mons.includes(id);
      grid.appendChild(h('div', { class: `dex-cell ${caught ? 'caught' : 'unknown'}`, title: caught ? POKE_NAMES[id] : '' },
        pokeImg(id, '⚪', 'dex-img', true),
        h('div', { class: 'dex-name' }, caught ? POKE_NAMES[id] : '???'),
        h('div', { class: 'dex-org' }, caught ? `${i >= 2 ? '✨ ' : ''}${CREATURES[org].name}` : `No.${String(id).padStart(4, '0')}`)));
    }));
    return h('div', null, h('h2', null, '⚪ 포켓몬 도감'), tabs,
      h('p', { class: 'muted' }, '야생 포켓몬을 잡으면 등록돼요. 아래 이름은 그 포켓몬이 닮은 실제 생물이에요. ✨ 표시는 드물게 나오는 포켓몬! 10마리마다 보너스 코인을 받아요.'), grid);
  }
  const grid = h('div', { class: 'dex-grid' });
  DEX_IDS.forEach(id => {
    const c = CREATURES[id]; const caught = save.dex.includes(id);
    grid.appendChild(h('button', { class: `dex-cell ${caught ? 'caught' : 'unknown'}`,
      onclick: () => { if (caught) { sfx.click(); openModal(dexDetail(id)); } } },
      creatureImg(id, 'dex-img'), h('div', { class: 'dex-name' }, caught ? c.name : '???')));
  });
  return h('div', null,
    h('h2', null, '📕 생태 도감'), tabs,
    h('p', { class: 'muted' }, '퀴즈를 맞히거나 풀숲에서 야생 생물을 만나면 도감에 등록돼요.',
      save.dex.length < DEX_IDS.length ? ' 💡 10곳의 지역을 모두 돌아다녀 보세요!' : ' 🎉 도감 완성!'),
    grid);
}
function dexDetail(id) {
  const c = CREATURES[id]; const role = ROLE_INFO[c.role];
  const eats = WEB_EDGES.filter(e => e[1] === id).map(e => CREATURES[e[0]].name);
  const eatenBy = WEB_EDGES.filter(e => e[0] === id).map(e => CREATURES[e[1]].name);
  return h('div', { class: 'dex-detail' },
    h('div', { class: 'dex-detail-img' }, creatureImg(id)),
    h('h2', null, c.name),
    h('p', { class: 'muted' }, `닮은 포켓몬: ${c.pname} (No.${String(c.poke).padStart(4, '0')})`),
    h('div', { class: 'chips' }, h('span', { class: `chip role-${c.role}` }, `${role.icon} ${role.label}`), h('span', { class: 'chip' }, `📍 ${c.hab}`)),
    h('p', null, c.fact),
    eats.length ? h('p', null, h('b', null, '🍴 먹는 것: '), eats.join(', ')) : null,
    eatenBy.length ? h('p', null, h('b', null, '⚠️ 먹히는 상대: '), eatenBy.join(', ')) : null,
    h('p', { class: 'muted' }, `닮은 포켓몬들: ${(WILD_POKEMON[id] || []).map(p => POKE_NAMES[p]).join(', ')}`),
    h('button', { class: 'btn small', onclick: () => openModal(dexView()) }, '← 도감으로'));
}

/* =========================================================
   파트너 포켓몬 · 레벨 · 진화
   ========================================================= */
function xpToNext(level) { return 40 + level * 10; }
function stageOf(level) { return level >= EVOLVE_LEVELS[1] ? 2 : level >= EVOLVE_LEVELS[0] ? 1 : 0; }

// 파트너 정보 { key, level, xp, next, stage, poke, name, starter }
function partnerInfo(key, p = save) {
  if (!p) return null;
  key = key || p.active;
  const st = STARTERS[key]; const data = p.partners[key];
  if (!st || !data) return null;
  const stage = stageOf(data.level);
  let poke = st.line[stage], name = st.names[stage];
  if (poke === 'branch') {
    const b = st.branches.find(x => x.id === data.branch) || null;
    if (b) { poke = b.id; name = b.name; } else { poke = st.line[0]; name = st.names[0]; }
  }
  return { key, starter: st, level: data.level, xp: data.xp, next: xpToNext(data.level), stage, poke, name, data };
}
function partnerImg(cls = '', key, p) {
  const info = partnerInfo(key, p);
  return info ? pokeImg(info.poke, info.starter.emoji, cls) : h('span', { class: `emoji-img ${cls}` }, '⚪');
}

const pendingEvents = [];   // 레벨업·진화 알림 (게임이 끝난 뒤 보여 줘요)

function addXp(amount, key) {
  if (!save) return;
  const info = partnerInfo(key);
  if (!info) return;
  const d = info.data;
  if (d.level >= MAX_LEVEL) return;
  d.xp += amount;
  while (d.level < MAX_LEVEL && d.xp >= xpToNext(d.level)) {
    d.xp -= xpToNext(d.level);
    const beforeStage = stageOf(d.level);
    d.level++;
    pendingEvents.push({ type: 'level', key: info.key, level: d.level });
    if (stageOf(d.level) > beforeStage) pendingEvents.push({ type: 'evolve', key: info.key, fromStage: beforeStage, toStage: stageOf(d.level) });
  }
  if (d.level >= MAX_LEVEL) d.xp = 0;
}

// 보상 주기: reward({ xp, coins, bypassCap })  → 실제로 받은 코인 수를 돌려줘요
function reward({ xp = 0, coins = 0, bypassCap = false } = {}) {
  if (!save) return { coins: 0, capped: false };
  let got = coins;
  if (coins > 0 && !bypassCap) {
    if (save.earned.date !== todayStr()) save.earned = { date: todayStr(), coins: 0 };
    const room = Math.max(0, CLASS_CONFIG.dailyCoinLimit - save.earned.coins);
    got = Math.min(coins, room);
    save.earned.coins += got;
  }
  save.coins += got;
  save.stats.totalCoins += got;
  if (xp) addXp(xp);
  persist(); updateCoinChip();
  if (got > 0) sfx.coin();
  return { coins: got, capped: got < coins };
}
function coinsLeftToday() {
  if (!save) return 0;
  if (save.earned.date !== todayStr()) return CLASS_CONFIG.dailyCoinLimit;
  return Math.max(0, CLASS_CONFIG.dailyCoinLimit - save.earned.coins);
}
function countAnswer(ok) {
  if (!save) return;
  save.stats.answered++; if (ok) { save.stats.correct++; missionEvent('correct'); }
}

// 쌓인 레벨업/진화 알림을 차례로 보여 줘요
function flushEvents(done = () => {}) {
  const levels = pendingEvents.filter(e => e.type === 'level');
  const evo = pendingEvents.find(e => e.type === 'evolve');
  pendingEvents.length = 0;
  if (!levels.length && !evo) { done(); return; }
  if (levels.length) { sfx.level(); toast(`⬆️ ${partnerInfo(levels[0].key).name} 레벨 업! Lv.${levels[levels.length - 1].level}`, 2200); }
  if (evo) showEvolution(evo, done); else done();
}

function showEvolution(evo, done) {
  const st = STARTERS[evo.key];
  const data = save.partners[evo.key];
  const proceed = () => {
    const after = partnerInfo(evo.key);
    const beforePoke = st.line[evo.fromStage] === 'branch' ? after.poke : st.line[evo.fromStage];
    const beforeName = st.names[evo.fromStage] || after.name;
    const stageBox = h('div', { class: 'evo-stage' }, pokeImg(beforePoke, st.emoji, 'evo-img evo-before'));
    const text = h('p', { class: 'big-text' }, `어라…? ${beforeName}의 모습이…!`);
    const btn = h('button', { class: 'btn primary hidden', onclick: () => { closeModal(); done(); } }, '좋아요! ▶');
    openModal(h('div', { class: 'center evo-box' }, h('h2', null, '✨ 진화 ✨'), stageBox, text, btn), { locked: true });
    sfx.level();
    setTimeout(() => {
      clear(stageBox); stageBox.appendChild(pokeImg(after.poke, st.emoji, 'evo-img evo-after'));
      text.textContent = `축하해요! ${josa(beforeName, '은/는')} ${josa(after.name, '으로/로')} 진화했다!`;
      btn.classList.remove('hidden'); sfx.clear();
    }, 2200);
  };
  if (st.branches && !data.branch) {
    // 이브이: 진화할 모습 고르기
    openModal(h('div', { class: 'center' },
      h('h2', null, '✨ 이브이가 진화하려고 해요!'),
      h('p', null, '어떤 모습으로 진화할까요? (한 번 고르면 바꿀 수 없어요)'),
      h('div', { class: 'branch-row' }, ...st.branches.map(b => h('button', { class: 'branch-btn', onclick: () => {
        data.branch = b.id; persist(); proceed();
      } }, pokeImg(b.id, b.icon, 'branch-img'), h('div', null, `${b.icon} ${b.name}`))))), { locked: true });
  } else proceed();
}

/* ---------- 쿠폰 / 영수증 코드 ---------- */
// 쿠폰: 종류(1자리) + 수량(2자리) + 일련번호(3자리) + 확인(3자리) → "105-123-456"
function couponCheck(name, payload) { return String(fnv(`${normName(name)}|${payload}|${CLASS_CONFIG.codeSecret}`) % 1000).padStart(3, '0'); }
function makeCoupon(name, kind, amount) {
  const payload = `${kind}${String(amount).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  const code = payload + couponCheck(name, payload);
  return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6)}`;
}
function readCoupon(name, input) {
  const d = String(input).replace(/\D/g, '');
  if (d.length !== 9) return { ok: false, msg: '코드는 숫자 9자리예요.' };
  const payload = d.slice(0, 6);
  if (couponCheck(name, payload) !== d.slice(6)) return { ok: false, msg: '코드가 맞지 않아요. 이름과 코드를 다시 확인해요.' };
  const kind = d[0], amount = Number(d.slice(1, 3));
  if (!['1', '2', '3'].includes(kind) || !amount) return { ok: false, msg: '쓸 수 없는 코드예요.' };
  return { ok: true, kind, amount, id: d };
}
// 영수증: 수량(2) + 날짜번호(3) + 일련(2) + 확인(3) → "03286-41789"
function makeReceipt(name, units) {
  const payload = `${String(units).padStart(2, '0')}${String(dayNumber()).padStart(3, '0')}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;
  const code = payload + String(fnv(`R|${normName(name)}|${payload}|${CLASS_CONFIG.codeSecret}`) % 1000).padStart(3, '0');
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}
function readReceipt(name, input) {
  const d = String(input).replace(/\D/g, '');
  if (d.length !== 10) return { ok: false, msg: '영수증 코드는 숫자 10자리예요.' };
  const payload = d.slice(0, 7);
  const chk = String(fnv(`R|${normName(name)}|${payload}|${CLASS_CONFIG.codeSecret}`) % 1000).padStart(3, '0');
  if (chk !== d.slice(7)) return { ok: false, msg: '❌ 맞지 않는 영수증이에요. (이름 또는 코드가 달라요)' };
  const units = Number(d.slice(0, 2)), day = Number(d.slice(2, 5));
  const date = new Date(new Date(2026, 0, 1).getTime() + day * 86400000);
  return { ok: true, units, id: d, date: `${date.getMonth() + 1}월 ${date.getDate()}일` };
}

/* ---------- 공통 퀴즈 화면 조각 ---------- */
function subjectView(s, cls = '') {
  s = s || {};
  if (s.creature) {
    const c = CREATURES[s.creature];
    return h('div', { class: `q-subject ${cls}` }, creatureImg(s.creature, 'q-subject-img'), h('div', { class: 'q-subject-name' }, c.name));
  }
  return h('div', { class: `q-subject ${cls}` }, s.poke ? pokeImg(s.poke, s.emoji, 'q-subject-img') : h('span', { class: 'emoji-img q-subject-img' }, s.emoji || '❓'));
}

// 주제 고르기 칩
function topicPicker(selected) {
  const wrap = h('div', { class: 'topic-picker' });
  const all = h('button', { class: 'topic-chip' }, '📚 전체');
  const chips = Object.entries(TOPICS).map(([k, t]) => {
    const b = h('button', { class: 'topic-chip' }, `${t.icon} ${k}. ${t.name}`);
    b.dataset.k = k; return b;
  });
  const sync = () => {
    chips.forEach(b => b.classList.toggle('on', selected.has(Number(b.dataset.k))));
    all.classList.toggle('on', selected.size === 5);
  };
  all.addEventListener('click', () => { sfx.click(); [1, 2, 3, 4, 5].forEach(k => selected.add(k)); sync(); });
  chips.forEach(b => b.addEventListener('click', () => {
    sfx.click(); const k = Number(b.dataset.k);
    if (selected.size === 5) { selected.clear(); selected.add(k); }
    else if (selected.has(k)) { if (selected.size > 1) selected.delete(k); }
    else selected.add(k);
    sync();
  }));
  wrap.append(all, ...chips); sync();
  return wrap;
}

/* ---------- 랭킹용 기록 코드 (선생님에게만 보여요) ----------
   학생 기록 → 짧은 코드 → 선생님 메뉴에 붙여 넣으면 선생님 컴퓨터에만 랭킹이 저장돼요. */
function rankingSummary(p = save) {
  const info = partnerInfo(null, p);
  const stars = Object.values(p.cleared || {}).reduce((a, b) => a + b, 0);
  return { name: p.name, lv: info ? info.level : 1, dex: p.dex.length, stars, correct: p.stats.correct,
    answered: p.stats.answered, round: p.stats.roundBest, speed: p.stats.speedBest, duel: p.stats.duelWins,
    coins: p.stats.totalCoins, poke: info ? info.poke : 25, mon: (p.mons || []).length };
}
function makeRecordCode(p = save) {
  const r = rankingSummary(p);
  const nums = [r.lv, r.dex, r.stars, r.correct, r.answered, r.round, r.speed, r.duel, r.coins, r.poke, r.mon].map(n => Math.max(0, n | 0).toString(36));
  const body = nums.join('.');
  const chk = (fnv(`K|${normName(r.name)}|${body}|${CLASS_CONFIG.codeSecret}`) % 1296).toString(36).padStart(2, '0');
  return `ECO-${body}-${chk}`.toUpperCase();
}
function readRecordCode(name, code) {
  const m = String(code).trim().toUpperCase().match(/^ECO-([0-9A-Z.]+)-([0-9A-Z]{2})$/);
  if (!m) return null;
  const body = m[1].toLowerCase();
  const chk = (fnv(`K|${normName(name)}|${body}|${CLASS_CONFIG.codeSecret}`) % 1296).toString(36).padStart(2, '0');
  if (chk !== m[2].toLowerCase()) return null;
  const n = body.split('.').map(x => parseInt(x, 36));
  if ((n.length !== 10 && n.length !== 11) || n.some(isNaN)) return null;
  return { name, lv: n[0], dex: n[1], stars: n[2], correct: n[3], answered: n[4], round: n[5], speed: n[6], duel: n[7], coins: n[8], poke: n[9], mon: n[10] || 0 };
}

/* =========================================================
   📜 오늘의 미션 (매일 3개, 이 기기에만 저장)
   ========================================================= */
const MISSION_POOL = [
  { id: 'producer', text: '야생에서 생산자 3마리 만나기', goal: 3, ev: 'meet-producer', coins: 25 },
  { id: 'consumer', text: '야생에서 소비자 5마리 만나기', goal: 5, ev: 'meet-consumer', coins: 25 },
  { id: 'decomposer', text: '야생에서 분해자 1마리 만나기 (버섯·곰팡이)', goal: 1, ev: 'meet-decomposer', coins: 25 },
  { id: 'clean', text: '공장 지대의 오염 2곳 정화하기', goal: 2, ev: 'clean', coins: 30 },
  { id: 'trash', text: '해변·섬에서 쓰레기 3개 줍기', goal: 3, ev: 'trash', coins: 25 },
  { id: 'trace', text: '흔적 공원에서 동물 흔적 2개 추리하기', goal: 2, ev: 'trace', coins: 25 },
  { id: 'correct', text: '아무 게임에서나 문제 15개 맞히기', goal: 15, ev: 'correct', coins: 30 },
  { id: 'round', text: '라운드전에서 3라운드 이상 클리어', goal: 3, ev: 'round', mode: 'max', coins: 30 },
  { id: 'speed', text: '스피드 퀴즈에서 100점 이상', goal: 100, ev: 'speed', mode: 'max', coins: 30 },
  { id: 'memory', text: '기억력 카드 1판 완성', goal: 1, ev: 'memory', coins: 20 },
  { id: 'visit', text: '서로 다른 지역 4곳 방문하기', goal: 4, ev: 'visit', mode: 'unique', coins: 20 },
  { id: 'dex', text: '도감에 새 생물 2마리 등록하기', goal: 2, ev: 'dex', coins: 30 },
];
function ensureMissions() {
  if (!save) return [];
  if (!save.missions || save.missions.date !== todayStr()) {
    // 날짜와 이름으로 정해지는 3개 (같은 날엔 같은 미션)
    const seed = fnv(todayStr() + save.name);
    const pool = MISSION_POOL.slice().sort((a, b) => (fnv(a.id + seed) % 997) - (fnv(b.id + seed) % 997));
    save.missions = { date: todayStr(), list: pool.slice(0, 3).map(m => ({ id: m.id, prog: 0, seen: [], claimed: false })), bonus: false };
    persist();
  }
  return save.missions.list;
}
function missionEvent(ev, value = 1, key = null) {
  if (!save) return;
  ensureMissions().forEach(st => {
    const m = MISSION_POOL.find(x => x.id === st.id);
    if (!m || m.ev !== ev || st.prog >= m.goal) return;
    if (m.mode === 'max') st.prog = Math.max(st.prog, value);
    else if (m.mode === 'unique') { if (key && !st.seen.includes(key)) { st.seen.push(key); st.prog = st.seen.length; } }
    else st.prog += value;
    if (st.prog >= m.goal) { st.prog = m.goal; setTimeout(() => { sfx.level(); toast(`📜 미션 완료! 「${m.text}」 — 미션 창에서 보상을 받아요`, 2600); }, 400); }
  });
  persist();
}
function missionsView() {
  const list = ensureMissions();
  const all = list.every(st => st.claimed);
  const box = h('div', null, h('h2', null, '📜 오늘의 미션'), h('p', { class: 'muted' }, '매일 새로운 미션 3개가 나와요. 다 하면 보너스 선물!'));
  list.forEach(st => {
    const m = MISSION_POOL.find(x => x.id === st.id);
    const done = st.prog >= m.goal;
    box.appendChild(h('div', { class: `mission-row ${st.claimed ? 'claimed' : done ? 'done' : ''}` },
      h('div', { class: 'mission-text' }, h('b', null, m.text), h('div', { class: 'xp-bar' }, h('div', { class: 'xp-fill', style: { width: Math.round(st.prog / m.goal * 100) + '%' } })),
        h('span', { class: 'muted' }, `${st.prog} / ${m.goal}`)),
      st.claimed ? h('span', { class: 'chip' }, '✅ 받음')
        : h('button', { class: 'btn small primary', disabled: done ? null : 'disabled', onclick: () => {
          st.claimed = true; reward({ coins: m.coins, xp: 20, bypassCap: true }); sfx.catch();
          toast(`🎁 미션 보상 🪙${m.coins}!`); openModal(missionsView()); flushEvents();
        } }, `🪙 ${m.coins}`)));
  });
  if (all && !save.missions.bonus) {
    box.appendChild(h('button', { class: 'btn primary big', onclick: () => {
      save.missions.bonus = true; save.items.candy++; persist(); sfx.clear(); toast('🍭 모든 미션 완료! 이상한 사탕을 받았어요!', 2500); openModal(missionsView());
    } }, '🎁 보너스 선물 받기 (이상한 사탕)'));
  } else if (save.missions.bonus) box.appendChild(h('p', { class: 'center big-text' }, '🎉 오늘 미션 모두 완료! 내일 또 만나요.'));
  return box;
}

/* =========================================================
   🌦️ 날씨 · 낮과 밤 (비생물 요소가 생물에게 영향을 줘요)
   ========================================================= */
function weatherOf(map) {
  const v = fnv(`${todayStr()}|${map}|${new Date().getHours() >> 2}`) % 10;
  return v < 5 ? 'sunny' : v < 8 ? 'cloudy' : 'rain';
}
const WEATHER_INFO = {
  sunny:  { icon: '☀️', name: '맑음', tip: '햇빛이 쨍쨍! 식물(생산자)이 양분을 만들기 좋은 날이에요.' },
  cloudy: { icon: '⛅', name: '구름', tip: '구름이 햇빛을 가렸어요. 햇빛도 생태계를 이루는 비생물 요소예요.' },
  rain:   { icon: '🌧️', name: '비', tip: '비가 와요! 물을 좋아하는 개구리·달팽이·올챙이가 더 자주 나타나요. 비생물 요소(물)가 생물에게 영향을 줘요.' },
};
function isNight() { const hr = new Date().getHours(); return hr >= 19 || hr < 6; }
const RAIN_LOVERS = ['frog', 'snail', 'snail2', 'tadpole', 'loach', 'mushroom', 'mold'];
const NIGHT_LOVERS = ['owl', 'raccoon', 'firefly', 'catfish'];
// 날씨와 시간에 따라 야생 생물 고르기
function pickWild(map) {
  const pool = MAPS[map].pool.slice();
  const w = weatherOf(map);
  const bag = pool.slice();
  if (w === 'rain') pool.filter(id => RAIN_LOVERS.includes(id)).forEach(id => bag.push(id, id, id));
  if (isNight()) pool.filter(id => NIGHT_LOVERS.includes(id)).forEach(id => bag.push(id, id, id));
  return pick(bag);
}

/* ---------- 💾 기록 파일 저장 · 불러오기 (내 컴퓨터에만) ---------- */
function exportProfile() {
  const blob = new Blob([JSON.stringify({ app: 'eco-pokemon', version: 3, profile: save }, null, 1)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `포켓몬생태계_${save.name}_${todayStr()}.json` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importProfile(file, done) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const data = JSON.parse(rd.result);
      const p = data && data.profile;
      if (!p || data.app !== 'eco-pokemon' || !p.name || !p.partners) throw new Error('bad');
      if (store.profiles[p.name] && !confirm(`이 컴퓨터에 있는 「${p.name}」 기록을 파일의 기록으로 바꿀까요?`)) return;
      store.profiles[p.name] = p; persist();
      store = loadStore(); device = store.device; selectProfile(p.name);
      toast(`📂 ${p.name}의 기록을 불러왔어요!`); done && done();
    } catch (e) { toast('기록 파일을 읽을 수 없어요.'); }
  };
  rd.readAsText(file);
}

/* =========================================================
   ⚪ 포켓몬 수집
   ========================================================= */
const ALL_MONS = Object.values(WILD_POKEMON).flat();
// 생물에 맞는 포켓몬 고르기 (앞쪽은 자주, 뒤쪽은 드물게)
function wildPokemonFor(org) {
  const ids = WILD_POKEMON[org] || [CREATURES[org].poke];
  const weights = ids.map((_, i) => Math.max(1, 6 - 2 * i));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ids.length; i++) { r -= weights[i]; if (r <= 0) return ids[i]; }
  return ids[0];
}
function isRareMon(org, id) { return (WILD_POKEMON[org] || []).indexOf(id) >= 2; }
function orgOfMon(id) { return Object.keys(WILD_POKEMON).find(k => WILD_POKEMON[k].includes(id)); }
function registerMon(id) {
  if (!save || save.mons.includes(id)) return false;
  save.mons.push(id);
  const n = save.mons.length;
  if (n % 10 === 0) {
    reward({ coins: 30, bypassCap: true });
    setTimeout(() => { sfx.clear(); toast(`🎉 포켓몬 ${n}마리 수집! 보너스 🪙30`, 2600); }, 600);
  }
  const titles = { 30: '포켓몬 수집가', 80: '포켓몬 탐험 대장', 150: '포켓몬 박사' };
  if (titles[n] && !save.titles.includes(titles[n])) { save.titles.push(titles[n]); setTimeout(() => toast(`🏷️ 새 칭호 「${titles[n]}」!`, 2600), 1400); }
  persist();
  return true;
}
