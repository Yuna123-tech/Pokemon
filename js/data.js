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

  // ── 학교 화단 ──
  woodsorrel: { name: '괭이밥',     poke: 187, pname: '통통코',   emoji: '🍀', role: 'producer',   hab: '학교 화단',
                fact: '하트 모양 잎이 세 장씩 나고 노란 꽃이 피어요. 과학 47쪽에 나온 생산자예요.' },
  fleabane:   { name: '개망초',     poke: 669, pname: '플라베베', emoji: '🌼', role: 'producer',   hab: '학교 화단·들',
                fact: '흰 꽃잎과 노란 가운데가 달걀프라이를 닮았어요. 과학 47쪽에 나온 생산자예요.' },
  dandelion:  { name: '민들레',     poke: 189, pname: '솜솜코',   emoji: '🌼', role: 'producer',   hab: '학교 화단',
                fact: '씨앗이 솜털에 매달려 바람을 타고 날아가요. 햇빛으로 스스로 양분을 만들어요.' },
  sunflower:  { name: '해바라기',   poke: 192, pname: '해루미',   emoji: '🌻', role: 'producer',   hab: '학교 화단',
                fact: '해를 닮은 큰 꽃이 피어요. 햇빛을 이용해 스스로 양분을 만드는 생산자예요.' },
  sparrow:    { name: '참새',       poke: 21,  pname: '깨비참',   emoji: '🐦', role: 'consumer',   hab: '마을·들',
                fact: '사람 가까이 사는 작은 새예요. 곡식 낟알과 곤충을 먹어요.' },
  butterfly:  { name: '나비',       poke: 666, pname: '비비용',   emoji: '🦋', role: 'consumer',   hab: '학교 화단',
                fact: '꽃의 꿀을 빨아 먹어요. 애벌레가 자라서 나비가 돼요.' },
  bee:        { name: '꿀벌',       poke: 415, pname: '세꿀버리', emoji: '🐝', role: 'consumer',   hab: '학교 화단',
                fact: '꽃의 꿀과 꽃가루를 모아 먹어요. 꽃가루를 옮겨 식물이 열매를 맺게 도와요.' },
  ant:        { name: '개미',       poke: 632, pname: '아이앤트', emoji: '🐜', role: 'consumer',   hab: '학교 화단',
                fact: '무리 지어 살며 작은 곤충이나 단것을 먹어요.' },
  snail2:     { name: '달팽이',     poke: 616, pname: '쪼마리',   emoji: '🐌', role: 'consumer',   hab: '학교 화단',
                fact: '축축한 곳을 좋아하고 식물의 잎을 갉아 먹어요.' },
  // ── 공원 ──
  raccoon:    { name: '너구리',     poke: 263, pname: '지그제구리', emoji: '🦝', role: 'consumer', hab: '공원·숲',
                fact: '열매, 곤충, 작은 동물 등 여러 가지를 먹어요. 밤에 주로 활동해요.' },
  magpie:     { name: '까치',       poke: 198, pname: '니로우',   emoji: '🐦‍⬛', role: 'consumer',  hab: '공원·마을',
                fact: '곤충, 열매, 작은 동물을 먹는 새예요.' },
  dragonfly:  { name: '잠자리',     poke: 193, pname: '왕자리',   emoji: '🪰', role: 'consumer',   hab: '공원·습지',
                fact: '날아다니며 작은 곤충을 잡아먹어요. 애벌레는 물속에서 자라요.' },
  spider:     { name: '거미',       poke: 167, pname: '페이검',   emoji: '🕷️', role: 'consumer',  hab: '공원',
                fact: '거미줄을 쳐서 곤충을 잡아먹어요.' },
  owl:        { name: '부엉이',     poke: 163, pname: '부우부',   emoji: '🦉', role: 'consumer',   hab: '공원·산',
                fact: '밤에 활동하며 쥐 같은 작은 동물을 잡아먹어요.' },
  rhino:      { name: '장수풍뎅이', poke: 214, pname: '헤라크로스', emoji: '🪲', role: 'consumer', hab: '공원·숲',
                fact: '나무 수액을 먹는 곤충이에요. 수컷은 머리에 큰 뿔이 있어요.' },
  // ── 산 ──
  bear:       { name: '반달가슴곰', poke: 216, pname: '깜지곰',   emoji: '🐻', role: 'consumer',   hab: '산',
                fact: '가슴에 반달 무늬가 있어요. 과학 59쪽처럼 위치 추적기로 생태를 조사하며 보호하고 있어요.' },
  deer:       { name: '고라니',     poke: 585, pname: '사철록',   emoji: '🦌', role: 'consumer',   hab: '산·들',
                fact: '풀과 나뭇잎을 먹어요. 도로를 건너다 다치지 않도록 생태통로를 만들어요.' },
  fox:        { name: '여우',       poke: 37,  pname: '식스테일', emoji: '🦊', role: 'consumer',   hab: '산',
                fact: '쥐, 토끼 같은 작은 동물과 열매를 먹어요.' },
  pine:       { name: '소나무',     poke: 204, pname: '피콘',     emoji: '🌲', role: 'producer',   hab: '산',
                fact: '사계절 내내 잎이 푸른 나무예요. 솔방울이 열려요. 햇빛으로 스스로 양분을 만들어요.' },
  firefly:    { name: '반딧불이',   poke: 313, pname: '볼비트',   emoji: '✨', role: 'consumer',   hab: '습지·산',
                fact: '꽁무니에서 빛을 내는 곤충이에요. 깨끗한 물가 주변에서 볼 수 있어요.' },
  // ── 습지 ──
  stork:      { name: '황새',       poke: 962, pname: '떨구새',   emoji: '🪶', role: 'consumer',   hab: '습지',
                fact: '국제적 멸종 위기종이에요. 우리나라는 1996년부터 복원 연구를 하고 있어요. (과학 58쪽)' },
  loach:      { name: '미꾸라지',   poke: 339, pname: '미꾸리',   emoji: '🐟', role: 'consumer',   hab: '습지·논',
                fact: '논이나 개울 진흙 속에 살며 작은 생물을 먹어요. 황새의 먹이가 돼요.' },
  tadpole:    { name: '올챙이',     poke: 60,  pname: '발챙이',   emoji: '🐸', role: 'consumer',   hab: '습지',
                fact: '개구리의 어린 시절이에요. 물속에서 자라요.' },
  strider:    { name: '소금쟁이',   poke: 283, pname: '비구술',   emoji: '🦟', role: 'consumer',   hab: '습지',
                fact: '물 위를 걸어 다니며 물에 떨어진 곤충을 먹어요.' },
  otter:      { name: '수달',       poke: 418, pname: '브이젤',   emoji: '🦦', role: 'consumer',   hab: '강·습지',
                fact: '물고기를 잡아먹는 천연기념물이에요. 물이 깨끗해야 살 수 있어요.' },
  catfish:    { name: '메기',       poke: 340, pname: '메깅',     emoji: '🐟', role: 'consumer',   hab: '강',
                fact: '긴 수염이 있는 물고기예요. 밤에 작은 물고기와 동물을 먹어요.' },
  // ── 섬 · 바다 ──
  starfish:   { name: '불가사리',   poke: 120, pname: '별가사리', emoji: '⭐', role: 'consumer',   hab: '바다',
                fact: '조개 같은 동물을 먹어요.' },
  clam:       { name: '조개',       poke: 90,  pname: '셀러',     emoji: '🐚', role: 'consumer',   hab: '바다',
                fact: '바닷물 속 아주 작은 먹이를 걸러 먹어요.' },
  seahorse:   { name: '해마',       poke: 116, pname: '쏘드라',   emoji: '🐴', role: 'consumer',   hab: '바다',
                fact: '말을 닮은 물고기예요. 작은 새우 같은 먹이를 먹어요.' },
  octopus:    { name: '문어',       poke: 224, pname: '대포무노', emoji: '🐙', role: 'consumer',   hab: '바다',
                fact: '게나 조개를 잡아먹어요.' },
  whale:      { name: '고래',       poke: 320, pname: '고래왕자', emoji: '🐋', role: 'consumer',   hab: '바다',
                fact: '바다에 사는 아주 큰 동물이에요. 물고기나 작은 바다 생물을 먹어요.' },

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

/* =========================================================
   내 파트너 포켓몬 (레벨업 · 진화)
   line: 진화 단계별 도감 번호, names: 단계별 이름
   ========================================================= */
const EVOLVE_LEVELS = [7, 15];   // Lv 7에 1차 진화, Lv 15에 2차 진화
const MAX_LEVEL = 30;
const STARTERS = {
  bulbasaur:  { line: [1, 2, 3],       names: ['이상해씨', '이상해풀', '이상해꽃'], type: '풀',   emoji: '🌱',
                desc: '등의 씨앗이 햇빛을 받아 자라요. 생산자처럼 햇빛을 좋아해요!' },
  charmander: { line: [4, 5, 6],       names: ['파이리', '리자드', '리자몽'],       type: '불꽃', emoji: '🔥',
                desc: '꼬리의 불꽃이 힘을 나타내요. 숲에서는 불조심!' },
  squirtle:   { line: [7, 8, 9],       names: ['꼬부기', '어니부기', '거북왕'],     type: '물',   emoji: '💧',
                desc: '바다거북을 닮았어요. 바다 쓰레기를 싫어해요!' },
  pichu:      { line: [172, 25, 26],   names: ['피츄', '피카츄', '라이츄'],         type: '전기', emoji: '⚡',
                desc: '숲에 사는 전기 쥐 포켓몬. 에너지 절약을 응원해요!' },
  turtwig:    { line: [387, 388, 389], names: ['모부기', '수풀부기', '토대부기'],   type: '풀',   emoji: '🌳',
                desc: '토대부기의 등에는 나무가 자라 작은 생태계가 된대요!' },
  chikorita:  { line: [152, 153, 154], names: ['치코리타', '베이리프', '메가니움'], type: '풀',   emoji: '🍃',
                desc: '머리의 잎사귀로 햇빛을 모아요.' },
  caterpie:   { line: [10, 11, 12],    names: ['캐터피', '단데기', '버터플'],       type: '벌레', emoji: '🐛',
                desc: '애벌레 → 번데기 → 나비로 변해요. 먹이그물 속 애벌레를 닮았어요!' },
  treecko:    { line: [252, 253, 254], names: ['나무지기', '나무돌이', '나무킹'],   type: '풀',   emoji: '🦎', desc: '숲속 큰 나무에 사는 도마뱀 포켓몬이에요.' },
  torchic:    { line: [255, 256, 257], names: ['아차모', '영치코', '번치코'],       type: '불꽃', emoji: '🐥', desc: '따뜻한 병아리 포켓몬. 산불 조심!' },
  mudkip:     { line: [258, 259, 260], names: ['물짱이', '늪짱이', '대짱이'],       type: '물',   emoji: '🐟', desc: '습지와 강을 좋아해요. 깨끗한 물을 지켜 줘요!' },
  piplup:     { line: [393, 394, 395], names: ['팽도리', '팽태자', '엠페르트'],     type: '물',   emoji: '🐧', desc: '차가운 바다에 사는 펭귄 포켓몬이에요.' },
  snivy:      { line: [495, 496, 497], names: ['주리비얀', '샤비', '샤로다'],       type: '풀',   emoji: '🐍', desc: '꼬리 잎으로 햇빛을 받아 힘을 내요.' },
  rowlet:     { line: [722, 723, 724], names: ['나몰빼미', '빼미스로우', '모크나이퍼'], type: '풀', emoji: '🦉', desc: '숲에 사는 올빼미 포켓몬. 밤에도 잘 봐요!' },
  grookey:    { line: [810, 811, 812], names: ['흥나숭', '채키몽', '고릴타'],       type: '풀',   emoji: '🐒', desc: '나뭇가지로 리듬을 타는 숲의 원숭이 포켓몬이에요.' },
  sprigatito: { line: [906, 907, 908], names: ['나오하', '나로테', '마스카나'],     type: '풀',   emoji: '🐱', desc: '몸에서 풀 향기가 나는 고양이 포켓몬이에요.' },
  togepi:     { line: [175, 176, 468], names: ['토게피', '토게틱', '토게키스'],     type: '페어리', emoji: '🥚', desc: '행복을 나눠 주는 포켓몬이에요.' },
  dratini:    { line: [147, 148, 149], names: ['미뇽', '신뇽', '망나뇽'],           type: '드래곤', emoji: '🐉', desc: '맑은 물속에 사는 전설 같은 포켓몬이에요.' },
  eevee:      { line: [133, 'branch', 'branch'], names: ['이브이', '', ''],         type: '노말', emoji: '🦊',
                desc: '진화할 때 리피아·샤미드·부스터 중 하나를 고를 수 있어요!',
                branches: [ { id: 470, name: '리피아', icon: '🍃' }, { id: 134, name: '샤미드', icon: '💧' }, { id: 136, name: '부스터', icon: '🔥' } ] },
};

/* ---------- 상점 ---------- */
const SHOP_ITEMS = [
  { id: 'xpcandy',  icon: '🍬', name: '경험치 사탕', price: 30,  kind: 'item',  desc: '파트너 경험치 +40' },
  { id: 'candy',    icon: '🍭', name: '이상한 사탕', price: 100, kind: 'item',  desc: '파트너 레벨 +1' },
  { id: 'adopt',    icon: '🥚', name: '새 파트너 입양', price: 300, kind: 'adopt', desc: '아직 없는 파트너 포켓몬을 데려와요' },
  { id: 'theme-forest', icon: '🌲', name: '배경: 깊은 숲',   price: 80, kind: 'theme', value: 'forest' },
  { id: 'theme-sea',    icon: '🌊', name: '배경: 푸른 바다', price: 80, kind: 'theme', value: 'sea' },
  { id: 'theme-night',  icon: '🌌', name: '배경: 별밤',     price: 120, kind: 'theme', value: 'night' },
  { id: 'theme-sakura', icon: '🌸', name: '배경: 벚꽃길',   price: 120, kind: 'theme', value: 'sakura' },
  { id: 'title-web',    icon: '🕸️', name: '칭호: 먹이그물 박사', price: 150, kind: 'title', value: '먹이그물 박사' },
  { id: 'title-fungi',  icon: '🍄', name: '칭호: 분해자의 친구', price: 150, kind: 'title', value: '분해자의 친구' },
  { id: 'title-green',  icon: '♻️', name: '칭호: 지구 지킴이',   price: 200, kind: 'title', value: '지구 지킴이' },
];
const THEMES = {
  basic:  { name: '기본',   css: 'linear-gradient(180deg,#e3f2fd,#fff)' },
  forest: { name: '깊은 숲', css: 'linear-gradient(180deg,#a5d6a7,#2e7d32)' },
  sea:    { name: '푸른 바다', css: 'linear-gradient(180deg,#b3e5fc,#0277bd)' },
  night:  { name: '별밤',   css: 'radial-gradient(circle at 30% 20%,#fff 0 1px,transparent 2px) 0 0/40px 40px, linear-gradient(180deg,#1a237e,#4a148c)' },
  sakura: { name: '벚꽃길', css: 'radial-gradient(circle,#f8bbd0 0 4px,transparent 5px) 0 0/36px 36px, linear-gradient(180deg,#fce4ec,#f48fb1)' },
};
// 스토리 스테이지를 깨면 받는 칭호
const STAGE_TITLES = { 1: '생태계 탐험가', 2: '역할 분류왕', 3: '먹이사슬 고수', 4: '오염 해결사', 5: '바다 지킴이', 6: '생태 마스터' };

/* ---------- 교과서에 나온 먹이 관계 (과학 48~49쪽, 61쪽, 실험관찰 25쪽) ---------- */
const TEXTBOOK_EDGES = [
  ['grass', 'grasshopper'], ['grasshopper', 'frog'], ['grasshopper', 'duck'], ['frog', 'duck'],
  ['duck', 'hawk'], ['duck', 'weasel'], ['frog', 'snake'], ['frog', 'hawk'], ['bulbul', 'hawk'],
  ['weasel', 'hawk'], ['oak', 'squirrel'], ['clover', 'rabbit'], ['snake', 'hawk'], ['rabbit', 'hawk'],
];

/* ---------- 기억력 카드 짝 (모두 교과서 낱말과 뜻) ---------- */
const MEMORY_PAIRS = [
  ['생태계', '서로 영향을 주고받는 생물 요소와 비생물 요소'],
  ['생물 요소', '살아 있는 것 (동물, 식물 등)'],
  ['비생물 요소', '햇빛, 물, 공기, 흙'],
  ['생산자', '햇빛 등을 이용해 스스로 양분을 만듦'],
  ['소비자', '다른 생물을 먹이로 하여 살아감'],
  ['분해자', '죽은 생물체나 배출물을 분해함'],
  ['먹이사슬', '먹고 먹히는 관계가 사슬처럼 연결됨'],
  ['먹이그물', '여러 먹이사슬이 그물처럼 얽힘'],
  ['환경오염', '환경이 더러워지거나 훼손되는 현상'],
  ['서식지', '생물이 일정하게 자리 잡고 사는 곳'],
  ['미세 플라스틱', '크기 5 mm 이하의 작은 플라스틱'],
  ['생태통로', '동물이 이동할 수 있게 만든 길'],
  ['대기오염', '자동차나 공장의 매연'],
  ['수질오염', '생활 하수, 공장 폐수, 기름 유출'],
  ['토양오염', '농약의 지나친 사용, 쓰레기'],
  ['밀렵', '허가를 받지 않고 몰래 사냥하는 것'],
  ['텃새', '계절에 따라 이동하지 않고 한곳에 머무는 새'],
];

/* =========================================================
   탐험 맵 (15칸 × 11줄)
   T 나무  . 풀밭  = 길  , 풀숲(야생 생물 등장)  W 물  S 모래  F 꽃  R 바위
   J 쓰레기(주우면 코인)  N 안내판  @ 시작 위치
   건물: G 체육관 길  A 라운드 아레나  P 스피드 트랙  D 대결장  K 팀전 경기장
         M 기억력 카드  H 상점  C 포켓몬센터  X 환전소
   출구: < > ^ v  (exits 에서 어디로 가는지 정해요)
   ========================================================= */
const MAPS = {
  town: {
    name: '생태 마을', bg: 'town', icon: '🏘️',
    rows: [
      'TTTTTTT^TTTTTTT',
      'TFF..G.=.D..FFT',
      'T,,..=.=.=..,,T',
      'T,,C.=.=.=.H,,T',
      'T..===N===...TT',
      '<======@======>',
      'T..=.=====.=..T',
      'T..X.=.F.=.A..T',
      'TFF..P...K..FFT',
      'T,,...M.=...,,T',
      'TTTTTTTvTTTTTTT',
    ],
    exits: { '<': { map: 'forest', x: 13, y: 5 }, '>': { map: 'beach', x: 1, y: 5 }, '^': { map: 'river', x: 7, y: 9 }, v: { map: 'school', x: 7, y: 1 } },
    signs: { N: '🪧 생태 마을에 온 걸 환영해요! ⬅️ 숲길 · ➡️ 해변 · ⬆️ 강가 · ⬇️ 학교 화단으로 갈 수 있어요. 풀숲에 들어가면 야생 생물을 만나요.' },
    pool: ['grass', 'clover', 'grasshopper', 'rabbit', 'tit', 'caterpillar', 'sparrow', 'magpie'],
  },
  school: {
    name: '학교 화단', bg: 'school', icon: '🏫',
    rows: [
      'TTTTTTT^TTTTTTT',
      'Thhhhh.=.hhhhhT',
      'Thhhhh.=.hhhhhT',
      'T.....N=......T',
      'Tff,,,,=,,,,ffT',
      'T,,,,F.=.F,,,,T',
      'T,,,,..=..,,,,T',
      'Tff,,..=..,,ffT',
      'T.....===.....T',
      'TFF.F..R..F.FFT',
      'TTTTTTTTTTTTTTT',
    ],
    exits: { '^': { map: 'town', x: 7, y: 9 } },
    signs: { N: '🪧 학교 화단에서는 어떤 것들을 볼 수 있을까요? 꽃, 나비, 개미 같은 생물 요소와 햇빛, 흙, 물 같은 비생물 요소가 함께 있어요. (과학 42쪽)' },
    pool: ['woodsorrel', 'fleabane', 'dandelion', 'sunflower', 'sparrow', 'butterfly', 'bee', 'ant', 'snail2', 'tit', 'caterpillar'],
  },
  forest: {
    name: '숲길', bg: 'forest', icon: '🌲',
    rows: [
      'TTTTTTT^TTTTTTT',
      'T,,,,T...T,,,,T',
      'T,,,,..N..,,,,T',
      'TT,,...T...,,TT',
      'T...,,,T,,,...T',
      '<.,,,,...,,,,.>',
      'T..,,TT.TT,,..T',
      'TT...,,,,,...TT',
      'T,,,T..R..T,,,T',
      'T,,,,,...,,,,,T',
      'TTTTTTTTTTTTTTT',
    ],
    exits: { '>': { map: 'town', x: 1, y: 5 }, '^': { map: 'mountain', x: 7, y: 9 }, '<': { map: 'park', x: 13, y: 5 } },
    signs: { N: '🪧 숲 생태계: 상수리나무, 다람쥐, 버섯 같은 생물 요소와 햇빛, 공기, 흙 같은 비생물 요소가 서로 영향을 주고받아요. ⬆️ 산 · ⬅️ 공원' },
    pool: ['oak', 'squirrel', 'bulbul', 'snake', 'frog', 'beetle', 'mole', 'mushroom', 'mold', 'cornel', 'weasel', 'hawk', 'caterpillar'],
  },
  park: {
    name: '흔적 공원', bg: 'park', icon: '🐾',
    rows: [
      'TTTTTTTTTTTTTTT',
      'T,,,..Q..T,,,,T',
      'T,,..===...,,,T',
      'T.Q.=WWW=..Q..T',
      'T...=WWW=.....T',
      'T,,.=====..,,.>',
      'T,,...N...Q,,,T',
      'TT..,,,,,,..TTT',
      'TQ..,,TT,,...QT',
      'T,,,,.....,,,,T',
      'TTTTTTTTTTTTTTT',
    ],
    exits: { '>': { map: 'forest', x: 1, y: 5 } },
    signs: { N: '🪧 동물의 흔적을 찾아라! 🐾 표시를 밟으면 동물이 남긴 흔적을 볼 수 있어요. 흔적은 맨손으로 만지지 않아요. (과학 40쪽)' },
    pool: ['raccoon', 'magpie', 'dragonfly', 'spider', 'owl', 'rhino', 'squirrel', 'sparrow', 'mushroom', 'butterfly'],
  },
  mountain: {
    name: '푸른 산', bg: 'mountain', icon: '⛰️',
    rows: [
      'TTTTTTTTTTTTTTT',
      'TRR,,,TTT,,,RRT',
      'TR,,,..N..,,,RT',
      'T,,,TT...TT,,,T',
      'T,,...=.=...,,T',
      'rrrrrrEEErrrrrr',
      'T,,...=.=...,,T',
      'T,,,TT...TT,,,T',
      'TR,,,,...,,,,RT',
      'TRR,,,...,,,RRT',
      'TTTTTTTvTTTTTTT',
    ],
    exits: { v: { map: 'forest', x: 7, y: 1 } },
    signs: { N: '🪧 반달가슴곰이 사는 산이에요. 과학자들은 위치 추적기로 야생 동물의 이동 경로를 알아내 보호해요. (과학 59쪽)',
             E: '🌉 생태통로예요! 도로 때문에 끊어진 숲을 이어 동물이 안전하게 이동할 수 있게 해요. (과학 53쪽)' },
    pool: ['bear', 'deer', 'fox', 'pine', 'owl', 'hawk', 'squirrel', 'oak', 'mushroom', 'firefly'],
  },
  river: {
    name: '강가', bg: 'river', icon: '🏞️',
    rows: [
      'TTTTTTTTTTTTTTT',
      'T,,,..N...,,,,T',
      'T,,,.......,,,T',
      'WWWWWWW=WWWWWWW',
      'WWWWWWW=WWWWWWW',
      'T,,,...=...,,,T',
      'T..,,..=..,,..T',
      'TFF..,,=,,..FFT',
      '<,,....=....,,>',
      'T.....,=,.....T',
      'TTTTTTTvTTTTTTT',
    ],
    exits: { v: { map: 'town', x: 7, y: 1 }, '<': { map: 'wetland', x: 13, y: 5 }, '>': { map: 'factory', x: 1, y: 5 } },
    signs: { N: '🪧 강 생태계: 붕어마름(생산자), 붕어·오리·왜가리(소비자)와 물, 햇빛, 흙(비생물 요소)이 함께 있어요. ⬅️ 습지 · ➡️ 공장 지대' },
    pool: ['waterweed', 'duck', 'heron', 'crucian', 'snail', 'frog', 'hawk', 'catfish', 'otter'],
  },
  wetland: {
    name: '황새 습지', bg: 'wetland', icon: '🪶',
    rows: [
      'TTTTTTTTTTTTTTT',
      'TLLLL.N..LLLLLT',
      'TLLLL....LLLLLT',
      'T.....===.....T',
      'TWWW..=...LLLLT',
      'TWWW..=...LLLL>',
      'T,,...=.......T',
      'TLLLL.=..,,,,,T',
      'TLLLL.=..,,WW,T',
      'T.....=...,WW,T',
      'TTTTTTTTTTTTTTT',
    ],
    exits: { '>': { map: 'river', x: 1, y: 8 } },
    signs: { N: '🪧 황새는 밀렵, 농약 사용 증가, 서식지 파괴로 1970년대 초에 사라졌어요. 지금은 복원한 황새를 자연으로 돌려보내고 있어요. (과학 58쪽)' },
    pool: ['stork', 'loach', 'tadpole', 'strider', 'heron', 'frog', 'otter', 'dragonfly', 'firefly', 'waterweed'],
  },
  factory: {
    name: '공장 지대', bg: 'factory', icon: '🏭',
    rows: [
      'TTTTTTTTTTTTTTT',
      'Tppppp..ppppp.T',
      'TpppppO.ppppp.T',
      'T..O.=====.O..T',
      'T....=.N.=....T',
      '<=====...=====T',
      'T..O.=...=..O.T',
      'T,,..=====..,,T',
      'TWWO......O.WWT',
      'TWW,,..O..,,WWT',
      'TTTTTTTTTTTTTTT',
    ],
    exits: { '<': { map: 'river', x: 13, y: 8 } },
    signs: { N: '🪧 공장 지대에 오염 몬스터(☠️)가 나타났어요! 오염된 곳을 밟고 문제를 맞혀 깨끗하게 정화해 주세요. (과학 50~51쪽)' },
    pool: ['sparrow', 'magpie', 'ant', 'mold', 'spider'],
  },
  beach: {
    name: '해변', bg: 'beach', icon: '🏖️',
    rows: [
      'WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWW',
      'WW,,,WWWWW,,,WW',
      'S,,,,,SSS,,,,,S',
      'SSJSSSSNSSSSJSS',
      '<SSSSSSSSSSSSS>',
      'SSSSJSSSSSSJSSS',
      'S..SSSSSSSSS..S',
      'TF.,,..J..,,.FT',
      'T..,,.....,,..T',
      'TTTTTTTTTTTTTTT',
    ],
    exits: { '<': { map: 'town', x: 13, y: 5 }, '>': { map: 'island', x: 1, y: 5 } },
    signs: { N: '🪧 바다거북 10마리 중 8마리가 플라스틱 쓰레기를 먹은 것으로 나타났어요. 해변의 쓰레기를 주워 주세요! ➡️ 국립공원 섬' },
    pool: ['gull', 'dolphin', 'turtle', 'jelly', 'coral', 'crab', 'ray', 'mackerel', 'seaweed', 'starfish', 'clam'],
  },
  island: {
    name: '국립공원 섬', bg: 'island', icon: '🏝️',
    rows: [
      'WWWWWWWWWWWWWWW',
      'WWWSSSSSSSSSWWW',
      'WWSS,,TTT,,SSWW',
      'WSS,,,T.T,,,SSW',
      'WS,,,,.N.,,,,SW',
      '<SSS..=====.SSW',
      'WS,,,,...,,,,SW',
      'WSS,,,TTT,,,SSW',
      'WWSS,,,,,,,SSWW',
      'WWWSSSSJSSSSWWW',
      'WWWWWWWWWWWWWWW',
    ],
    exits: { '<': { map: 'beach', x: 13, y: 5 } },
    signs: { N: '🪧 이곳은 생태계 보호 구역이에요. 한려 해상 국립 공원처럼 보호 구역을 정해 생물의 서식지를 지켜요. (과학 53쪽)' },
    pool: ['gull', 'dolphin', 'turtle', 'starfish', 'clam', 'seahorse', 'octopus', 'whale', 'seaweed', 'crab', 'coral'],
  },
};
// 지도에서 보이는 순서 (바로 가기 메뉴)
const MAP_ORDER = ['town', 'school', 'forest', 'park', 'mountain', 'river', 'wetland', 'factory', 'beach', 'island'];
const BUILDINGS = {
  G: { icon: '🏟️', name: '체육관 길',   go: 'story' },
  A: { icon: '🏆', name: '라운드 아레나', go: 'round' },
  P: { icon: '⏱️', name: '스피드 트랙',   go: 'speed' },
  D: { icon: '⚔️', name: '대결장',       go: 'duel' },
  K: { icon: '👥', name: '팀전 경기장',   go: 'team' },
  M: { icon: '🃏', name: '기억력 카드',   go: 'memory' },
  H: { icon: '🏪', name: '상점',         go: 'shop' },
  C: { icon: '🏥', name: '포켓몬센터',    go: 'center' },
  X: { icon: '💱', name: '환전소',       go: 'exchange' },
};

const TOPICS = {
  1: { name: '생태계 구성 요소', icon: '🌳', pages: '42~45쪽' },
  2: { name: '생산자·소비자·분해자', icon: '🍄', pages: '46~47쪽' },
  3: { name: '먹이사슬·먹이그물', icon: '🕸️', pages: '48~49쪽' },
  4: { name: '환경오염', icon: '🌫️', pages: '50~51쪽' },
  5: { name: '생태계 보전', icon: '🐢', pages: '52~59쪽' },
};
