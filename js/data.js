/* =========================================================
   포켓몬 생태계 탐험대 - 학습 데이터
   초등 과학 4-2 「2. 생물과 환경」 (과학 42~61쪽, 실험관찰 20~31쪽) 내용 기반
   ========================================================= */

// 포켓몬 공식 일러스트 (PokeAPI 공개 저장소). 첫 주소가 막히면 다음 주소를 시도합니다.
const IMG_SOURCES = [
  id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  id => `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${id}.png`,
];

/* ---------------------------------------------------------
   생태계 구성 요소
   poke  : 실제 생물을 닮은 포켓몬 번호 (도감 번호)
   pname : 포켓몬 한국어 이름
   role  : producer(생산자) / consumer(소비자) / decomposer(분해자)
   --------------------------------------------------------- */
const CREATURES = {
  // ── 숲 생태계 ──
  oak:        { name: '상수리나무', poke: 273, pname: '도토링',   emoji: '🌳', role: 'producer',   hab: '숲',
                fact: '가을에 도토리가 열리는 나무예요. 햇빛 등을 이용해 스스로 양분을 만들어요.' },
  squirrel:   { name: '다람쥐',     poke: 417, pname: '파치리스', emoji: '🐿️', role: 'consumer',   hab: '숲',
                fact: '도토리 같은 열매를 먹어요. 뱀이나 족제비에게 잡아먹히기도 해요.' },
  bulbul:     { name: '직박구리',   poke: 396, pname: '찌르꼬',   emoji: '🐦', role: 'consumer',   hab: '숲',
                fact: '산수유 같은 열매와 애벌레 등 곤충을 먹는 새예요. 매에게 잡아먹혀요.' },
  tit:        { name: '박새',       poke: 16,  pname: '구구',     emoji: '🐤', role: 'consumer',   hab: '숲',
                fact: '머리 꼭대기와 목은 검은색, 뺨은 흰색이에요. 곤충, 씨앗, 열매 등을 먹어요.' },
  snake:      { name: '뱀',         poke: 23,  pname: '아보',     emoji: '🐍', role: 'consumer',   hab: '숲',
                fact: '개구리와 다람쥐 등을 잡아먹어요. 매에게 잡아먹히기도 해요.' },
  frog:       { name: '개구리',     poke: 656, pname: '개구마르', emoji: '🐸', role: 'consumer',   hab: '숲·강',
                fact: '메뚜기 같은 곤충을 먹고, 뱀·오리·매에게 잡아먹혀요.' },
  beetle:     { name: '사슴벌레',   poke: 127, pname: '쁘사이저', emoji: '🪲', role: 'consumer',   hab: '숲',
                fact: '참나무 수액을 먹고 사는 곤충이에요. 수컷은 큰 턱이 사슴뿔처럼 생겼어요.' },
  mole:       { name: '두더지',     poke: 50,  pname: '디그다',   emoji: '🦫', role: 'consumer',   hab: '숲',
                fact: '땅속에 굴을 파고 살며 지렁이와 곤충의 애벌레를 먹어요.' },
  mushroom:   { name: '버섯',       poke: 590, pname: '깜놀버슬', emoji: '🍄', role: 'decomposer', hab: '숲',
                fact: '죽은 나무나 낙엽을 분해해 양분을 얻고, 다른 생물이 이용할 수 있게 해요.' },
  mold:       { name: '곰팡이',     poke: 47,  pname: '파라섹트', emoji: '🦠', role: 'decomposer', hab: '숲',
                fact: '죽은 생물체나 음식물에 피어나 분해해요. 버섯과 함께 대표적인 분해자예요.' },
  bacteria:   { name: '세균(일부)', poke: null, pname: null,      emoji: '🦠', role: 'decomposer', hab: '어디에나',
                fact: '눈에 보이지 않을 만큼 작아요. 일부 세균은 죽은 생물체와 배출물을 분해해요.' },

  // ── 먹이그물 생물 ──
  grass:      { name: '풀',         poke: 152, pname: '치코리타', emoji: '🌿', role: 'producer',   hab: '숲·들',
                fact: '햇빛 등을 이용해 스스로 양분을 만들어요. 메뚜기와 애벌레의 먹이가 돼요.' },
  clover:     { name: '토끼풀',     poke: 43,  pname: '뚜벅쵸',   emoji: '☘️', role: 'producer',   hab: '들',
                fact: '잎이 세 장인 풀이에요. 토끼가 즐겨 먹어요.' },
  cornel:     { name: '산수유',     poke: 420, pname: '체리버',   emoji: '🍒', role: 'producer',   hab: '숲',
                fact: '봄에 노란 꽃이 피고 가을에 빨간 열매가 열려요. 직박구리가 열매를 먹어요.' },
  grasshopper:{ name: '메뚜기',     poke: 401, pname: '귀뚤뚜기', emoji: '🦗', role: 'consumer',   hab: '들',
                fact: '풀을 먹고, 개구리와 오리에게 잡아먹혀요.' },
  caterpillar:{ name: '애벌레',     poke: 10,  pname: '캐터피',   emoji: '🐛', role: 'consumer',   hab: '숲·들',
                fact: '나뭇잎을 갉아 먹어요. 직박구리 같은 새들의 중요한 먹이예요.' },
  rabbit:     { name: '토끼',       poke: 659, pname: '파르빗',   emoji: '🐇', role: 'consumer',   hab: '들',
                fact: '토끼풀 같은 풀을 먹어요. 족제비와 매에게 잡아먹혀요.' },
  weasel:     { name: '족제비',     poke: 161, pname: '꼬리선',   emoji: '🦦', role: 'consumer',   hab: '숲·들',
                fact: '토끼, 다람쥐, 오리 등을 잡아먹어요. 매에게 잡아먹히기도 해요.' },
  hawk:       { name: '매',         poke: 663, pname: '파이어로', emoji: '🦅', role: 'consumer',   hab: '숲·강',
                fact: '하늘에서 빠르게 내려와 뱀, 토끼, 오리, 직박구리 등 여러 동물을 잡아먹어요.' },

  // ── 강 생태계 ──
  waterweed:  { name: '붕어마름',   poke: 270, pname: '연꽃몬',   emoji: '🌱', role: 'producer',   hab: '강',
                fact: '물속에서 자라는 물풀이에요. 물고기들의 먹이이자 숨는 곳이 돼요.' },
  duck:       { name: '오리',       poke: 54,  pname: '고라파덕', emoji: '🦆', role: 'consumer',   hab: '강',
                fact: '메뚜기와 개구리 등을 먹고, 매나 족제비에게 잡아먹혀요.' },
  heron:      { name: '왜가리',     poke: 279, pname: '패리퍼',   emoji: '🪶', role: 'consumer',   hab: '강',
                fact: '긴 다리로 물가를 걸으며 물고기와 개구리를 잡아먹어요.' },
  crucian:    { name: '붕어',       poke: 129, pname: '잉어킹',   emoji: '🐟', role: 'consumer',   hab: '강',
                fact: '강이나 연못에 사는 물고기예요. 물풀과 작은 동물을 먹어요.' },
  snail:      { name: '다슬기',     poke: 422, pname: '깝질무',   emoji: '🐌', role: 'consumer',   hab: '강',
                fact: '맑은 강바닥 돌에 붙어 살며 돌에 붙은 이끼를 갉아 먹어요.' },

  // ── 바다 생태계 ──
  gull:       { name: '갈매기',     poke: 278, pname: '갈모매',   emoji: '🕊️', role: 'consumer',   hab: '바다',
                fact: '바닷가에 살며 물고기를 잡아먹는 새예요.' },
  dolphin:    { name: '돌고래',     poke: 963, pname: '맨돌핀',   emoji: '🐬', role: 'consumer',   hab: '바다',
                fact: '물고기를 먹고 사는 바다 동물이에요. 무리 지어 다니며 서로 소리로 대화해요.' },
  turtle:     { name: '바다거북',   poke: 7,   pname: '꼬부기',   emoji: '🐢', role: 'consumer',   hab: '바다',
                fact: '해파리를 즐겨 먹어요. 그런데 비닐봉지를 해파리로 착각해 먹기도 해요.' },
  jelly:      { name: '해파리',     poke: 72,  pname: '왕눈해',   emoji: '🪼', role: 'consumer',   hab: '바다',
                fact: '촉수로 작은 바다 생물을 잡아먹어요. 바다거북의 먹이예요.' },
  coral:      { name: '산호',       poke: 222, pname: '코산호',   emoji: '🪸', role: 'consumer',   hab: '바다',
                fact: '식물처럼 보이지만 사실은 작은 먹이를 잡아먹는 동물이에요!' },
  crab:       { name: '게',         poke: 98,  pname: '크랩',     emoji: '🦀', role: 'consumer',   hab: '바다',
                fact: '집게발로 작은 동물이나 죽은 생물을 먹어요.' },
  ray:        { name: '가오리',     poke: 226, pname: '만타인',   emoji: '🐟', role: 'consumer',   hab: '바다',
                fact: '납작한 몸으로 바닷속을 날 듯이 헤엄쳐요.' },
  mackerel:   { name: '고등어',     poke: 746, pname: '약어리',   emoji: '🐟', role: 'consumer',   hab: '바다',
                fact: '무리 지어 헤엄치는 바닷물고기예요. 작은 물고기를 먹고, 돌고래에게 먹혀요.' },
  seaweed:    { name: '미역',       poke: 781, pname: '타타륜',   emoji: '🌊', role: 'producer',   hab: '바다',
                fact: '바닷속 바위에 붙어 자라요. 햇빛을 이용해 스스로 양분을 만들어요.' },

  // ── 비생물 요소 ──
  sun:   { name: '햇빛', poke: null, emoji: '☀️', living: false,
           fact: '살아 있지 않지만, 식물(생산자)이 양분을 만들 때 꼭 필요해요.' },
  water: { name: '물',   poke: null, emoji: '💧', living: false,
           fact: '살아 있지 않지만, 모든 생물이 살아가는 데 꼭 필요해요.' },
  air:   { name: '공기', poke: null, emoji: '💨', living: false,
           fact: '살아 있지 않지만, 생물이 숨을 쉬는 데 필요해요.' },
  soil:  { name: '흙',   poke: null, emoji: '🟫', living: false,
           fact: '살아 있지 않지만, 식물이 뿌리를 내리고 많은 생물이 사는 곳이에요.' },
};
Object.values(CREATURES).forEach(c => { if (c.living === undefined) c.living = true; });

const ROLE_INFO = {
  producer:   { label: '생산자', icon: '🌿', desc: '햇빛 등을 이용해 스스로 양분을 만들어요.' },
  consumer:   { label: '소비자', icon: '🍽️', desc: '다른 생물을 먹이로 하여 살아가요.' },
  decomposer: { label: '분해자', icon: '🍄', desc: '주로 죽은 생물체나 배출물을 분해해 양분을 얻고, 다른 생물이 이용할 수 있게 해요.' },
};

/* ---------------------------------------------------------
   먹이그물 (과학 49쪽 먹이그물 바탕)
   [먹히는 생물, 먹는 생물]  → 화살표 방향 = 먹히는 쪽에서 먹는 쪽
   --------------------------------------------------------- */
const WEB_NODES = {
  grass:       { x: 90,  y: 470, label: '풀' },
  clover:      { x: 290, y: 470, label: '토끼풀' },
  oak:         { x: 500, y: 470, label: '도토리' },
  cornel:      { x: 710, y: 470, label: '산수유' },
  grasshopper: { x: 90,  y: 350, label: '메뚜기' },
  rabbit:      { x: 290, y: 350, label: '토끼' },
  squirrel:    { x: 500, y: 350, label: '다람쥐' },
  caterpillar: { x: 620, y: 355, label: '애벌레' },
  frog:        { x: 220, y: 270, label: '개구리' },
  duck:        { x: 150, y: 165, label: '오리' },
  weasel:      { x: 420, y: 195, label: '족제비' },
  snake:       { x: 560, y: 225, label: '뱀' },
  bulbul:      { x: 705, y: 215, label: '직박구리' },
  hawk:        { x: 400, y: 55,  label: '매' },
};
const WEB_EDGES = [
  ['grass', 'grasshopper'], ['clover', 'rabbit'], ['oak', 'squirrel'],
  ['cornel', 'caterpillar'], ['cornel', 'bulbul'],
  ['grasshopper', 'frog'], ['grasshopper', 'duck'], ['caterpillar', 'bulbul'],
  ['frog', 'duck'], ['frog', 'snake'], ['frog', 'hawk'],
  ['rabbit', 'weasel'], ['rabbit', 'hawk'],
  ['squirrel', 'snake'], ['squirrel', 'weasel'],
  ['duck', 'weasel'], ['duck', 'hawk'],
  ['bulbul', 'hawk'], ['snake', 'hawk'], ['weasel', 'hawk'],
];

// 먹이사슬 만들기 (먹히는 생물 → 먹는 생물 순서)
const CHAINS = [
  ['grass', 'grasshopper', 'frog', 'snake'],
  ['oak', 'squirrel', 'snake', 'hawk'],
  ['clover', 'rabbit', 'weasel', 'hawk'],
  ['cornel', 'caterpillar', 'bulbul', 'hawk'],
];

/* ---------------------------------------------------------
   환경오염 (과학 50~51쪽)
   --------------------------------------------------------- */
const POLLUTION_MONSTERS = {
  air:   { poke: 109, pname: '또가스', label: '대기오염', icon: '🌫️' },
  water: { poke: 89,  pname: '질뻐기', label: '수질오염', icon: '💧' },
  soil:  { poke: 568, pname: '깨봉이', label: '토양오염', icon: '🟫' },
};
const POLLUTION_CASES = [
  { title: '자동차의 매연',        icon: '🚗💨', type: 'air',
    explain: '자동차 매연은 공기를 더럽혀요. 오염된 공기는 생물이 숨 쉬는 데 해로워요.' },
  { title: '공장 굴뚝의 연기',      icon: '🏭',   type: 'air',
    explain: '공장의 매연은 공기를 더럽히는 대기오염의 원인이에요.' },
  { title: '플라스틱을 마구 태우기', icon: '🔥🧴', type: 'air',
    explain: '플라스틱을 무분별하게 태울 때 나오는 해로운 물질은 생물에게 여러 가지 질병을 일으켜요.' },
  { title: '가정의 생활 하수',      icon: '🚿',   type: 'water',
    explain: '생활 하수가 그대로 강으로 흘러가면 물이 더러워져 물에 사는 생물이 살기 어려워요.' },
  { title: '공장의 폐수 배출',      icon: '🏭🚰', type: 'water',
    explain: '공장 폐수는 강과 바다를 오염시키는 수질오염의 원인이에요.' },
  { title: '바다에 기름 유출',      icon: '🛢️🌊', type: 'water',
    explain: '바다에 유출된 기름은 물고기와 바닷새의 몸을 덮어 숨을 쉬거나 날기 어렵게 해요.' },
  { title: '바다로 흘러간 미세 플라스틱', icon: '🫧', type: 'water',
    explain: '미세 플라스틱(크기 5 mm 이하의 작은 플라스틱)은 물에 사는 생물에게 피해를 줘요.' },
  { title: '농약의 지나친 사용',    icon: '🧪🌾', type: 'soil',
    explain: '농약을 너무 많이 쓰면 흙이 오염되고 흙 속 생물이 살기 어려워져요.' },
  { title: '땅에 버린 쓰레기',      icon: '🗑️',   type: 'soil',
    explain: '쓰레기, 특히 플라스틱은 썩는 데 시간이 오래 걸려 흙을 오염시키고 생물의 서식지를 파괴해요.' },
];

/* ---------------------------------------------------------
   생태계 보전 (과학 52~55쪽)
   --------------------------------------------------------- */
const ACTIONS = [
  { text: '일회용품 사용을 줄이고 장바구니와 텀블러를 써요.', good: true,  icon: '🛍️',
    explain: '일회용품을 줄이면 쓰레기가 줄어 생태계를 보전하는 데 도움이 돼요.' },
  { text: '쓰지 않는 전등과 컴퓨터를 꺼서 에너지를 절약해요.', good: true,  icon: '💡',
    explain: '에너지를 절약하면 환경을 보호하고 생태계를 보전하는 데 도움을 줄 수 있어요.' },
  { text: '다 쓴 마스크를 길에 그냥 버려요.',                 good: false, icon: '😷',
    explain: '함부로 버린 마스크 끈에 새나 동물의 다리가 걸려 다칠 수 있어요. 끈을 자르고 쓰레기통에 버려요.' },
  { text: '바닷가에서 쓰레기를 주워요.',                       good: true,  icon: '🏖️',
    explain: '바다 쓰레기를 줄이면 바다거북처럼 플라스틱을 먹고 다치는 동물을 지킬 수 있어요.' },
  { text: '쓰레기를 분리배출해요.',                           good: true,  icon: '♻️',
    explain: '분리배출을 하면 다시 쓸 수 있는 자원이 늘고 버려지는 쓰레기가 줄어요.' },
  { text: '계곡에서 놀고 난 뒤 쓰레기를 그대로 두고 와요.',      good: false, icon: '🥤',
    explain: '버려진 쓰레기는 물과 흙을 오염시키고 생물의 서식지를 망가뜨려요.' },
  { text: '허가 없이 야생 동물을 몰래 잡아요. (밀렵)',          good: false, icon: '🪤',
    explain: '밀렵은 황새처럼 멸종 위기에 놓인 동물이 사라지는 원인이 돼요.' },
  { text: '멸종 위기 야생 동물 보호 캠페인을 해요.',            good: true,  icon: '📢',
    explain: '많은 사람이 함께 관심을 가지면 멸종 위기 동물을 지킬 수 있어요.' },
];

const SOLUTIONS = [
  { problem: '도로 때문에 숲이 둘로 나뉘어 동물들이 이동하다가 차에 치여요.', icon: '🦌🚗',
    answer: '동물이 지나갈 수 있는 생태통로를 만들어요.',
    wrong: ['도로를 더 넓게 만들어요.', '동물들을 모두 동물원으로 옮겨요.'] },
  { problem: '강에 생긴 보 때문에 물고기가 위쪽으로 올라가지 못해요.', icon: '🐟🧱',
    answer: '장애물에 물고기가 이동할 수 있는 통로를 만들어요.',
    wrong: ['강물을 모두 막아 버려요.', '물고기를 다른 강으로 버려요.'] },
  { problem: '투명한 방음벽에 새들이 부딪혀 다쳐요.', icon: '🐦🪟',
    answer: '방음벽에 새의 충돌을 막는 스티커를 붙여요.',
    wrong: ['방음벽을 더 반짝이게 닦아요.', '새 먹이를 방음벽 앞에 뿌려요.'] },
  { problem: '아름다운 바다와 섬의 생물들이 사는 곳이 점점 망가지고 있어요.', icon: '🏝️',
    answer: '생태계 보호 구역(국립 공원 등)으로 지정해 서식지를 보호해요.',
    wrong: ['큰 리조트를 지어 관광객을 늘려요.', '바다를 메워 땅을 만들어요.'] },
];

const PLEDGES = [
  '일회용품 대신 텀블러와 장바구니를 쓸게요.',
  '쓰레기를 바르게 분리배출할게요.',
  '쓰지 않는 전기를 꺼서 에너지를 아낄게요.',
  '마스크는 끈을 자르고 쓰레기통에 버릴게요.',
  '우리 동네 생물을 관찰하고 소중히 지킬게요.',
  '멸종 위기 동물을 알리는 캠페인을 할게요.',
];

/* ---------------------------------------------------------
   스테이지 정보
   --------------------------------------------------------- */
const STAGES = [
  { id: 1, name: '생태계 숲길',   leader: '초록 관장', avatar: '🌱', badge: '🌳', badgeName: '생태계 배지',
    topic: '생물 요소와 비생물 요소', pages: '과학 42~45쪽', color: '#4caf50' },
  { id: 2, name: '역할 연구소',   leader: '버섯 관장', avatar: '🍄', badge: '🍄', badgeName: '역할 배지',
    topic: '생산자 · 소비자 · 분해자', pages: '과학 46~47쪽', color: '#8d6e63' },
  { id: 3, name: '먹이그물 언덕', leader: '매서운 관장', avatar: '🦅', badge: '🕸️', badgeName: '먹이그물 배지',
    topic: '먹이사슬과 먹이그물', pages: '과학 48~49쪽', color: '#ff9800' },
  { id: 4, name: '오염 몬스터 공장', leader: '맑음 관장', avatar: '🌤️', badge: '🌫️', badgeName: '환경 배지',
    topic: '인간 활동과 환경오염', pages: '과학 50~51쪽', color: '#7e57c2' },
  { id: 5, name: '바다 지킴이 해변', leader: '바다 관장', avatar: '🌊', badge: '🐢', badgeName: '지킴이 배지',
    topic: '생태계 보전을 위한 노력', pages: '과학 52~57쪽', color: '#039be5' },
  { id: 6, name: '챔피언 리그',   leader: '챔피언 뮤', avatar: '✨', badge: '🏆', badgeName: '생태 마스터 트로피',
    topic: '단원 정리 퀴즈', pages: '과학 60~61쪽', color: '#e53935', poke: 151 },
];
