/* =========================================================
   포켓몬 생태계 탐험대 - 브라우저 자동 점검 (Playwright)
   실행: npx playwright@1 install chromium (처음 한 번)
         node tests/smoke.js            (W=390 node tests/smoke.js 로 휴대폰 크기)
   화면 캡처는 tests/shots/ 에 저장돼요. 마지막 줄 ERRORS [] 이면 통과.
   ========================================================= */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const SHOTS = path.join(__dirname, 'shots') + '/';
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const W = Number(process.env.W || 1000);
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: W, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  const shot = async n => { await page.waitForTimeout(400); await page.screenshot({ path: `${SHOTS}${W}-${n}.png`, fullPage: true }); };
  let fails = 0;
  const step = async (name, fn) => {
    try {
      await page.evaluate(() => { if (typeof closeModal === 'function') { closeModal(); pendingEvents.length = 0; inStage = false; stopModeTimer(); } });
      await fn(); console.log('OK  ', name);
    } catch (e) { fails++; console.log('FAIL', name, e.message.split('\n')[0]); }
  };
  // 정답 찾기: 화면의 문제 문장으로 문제은행에서 정답을 찾아요
  const answerOf = sel => page.evaluate(s => {
    const el = document.querySelector(s); if (!el) return null;
    const all = AUTHORED_QUESTIONS.concat(TRACE_QUESTIONS, generatedQuestions());
    const q = all.find(x => x.q === el.innerHTML); return q ? q.answer : null;
  }, sel);

  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.waitForTimeout(1000);
  await step('타이틀', () => shot('00-title'));
  await step('트레이너 만들기', async () => {
    await page.click('.profile-btn.new'); await page.fill('input[type=text]', '점검이');
    await page.click('text=다음'); await page.click('.starter-card >> nth=0');
    await page.click('text=탐험 시작!');
    await page.evaluate(() => { window.weatherOf = () => 'sunny'; window.isNight = () => false; });
  });
  await step('지도 11곳 그리기', async () => {
    for (const m of await page.evaluate(() => MAP_ORDER)) {
      await page.evaluate(mm => { const s = findWalkable(mm); save.pos = { map: mm, x: s.x, y: s.y }; renderWorld(); }, m);
      await page.waitForTimeout(300);
      await (await page.$('.world')).screenshot({ path: `${SHOTS}${W}-map-${m}.png` });
    }
  });
  await step('야생 포켓몬 만나서 잡기', async () => {
    await page.evaluate(() => { save.pos = { map: 'forest', x: 13, y: 5 }; renderWorld(); wildEncounter('frog'); });
    const a = await answerOf('.wild .battle-prompt');
    await page.click(`.wild .choice-btn:has-text("${a}")`);
    await page.waitForTimeout(2000);
    if (!(await page.evaluate(() => save.mons.length))) throw new Error('포켓몬이 도감에 등록되지 않음');
  });
  await step('사탕 진화 (도토링 → 잎새코)', async () => {
    await page.evaluate(() => { catchMon(273); save.candy[273] = 20; evolveByCandy(273, 274); });
    await page.waitForTimeout(2500);
    if (!(await page.evaluate(() => save.mons.includes(274)))) throw new Error('진화 실패');
  });
  await step('파트너 레벨 진화 (아보 → 아보크, Lv.10)', async () => {
    await page.evaluate(() => { closeModal(); catchMon(23); makeMonPartner(23); reward({ xp: 900, bypassCap: true }); goTown(); });
    await page.waitForTimeout(2600);
    const name = await page.evaluate(() => partnerInfo().name);
    if (name !== '아보크') throw new Error('진화 안 됨: ' + name);
  });
  await step('체육관 스테이지 1 끝까지', async () => {
    await page.evaluate(() => { closeModal(); startStage(1); });
    for (let i = 0; i < 300 && !(await page.$('.clear-screen')); i++) {
      if (await page.$('.dialog-box')) { await page.click('.dialog-box'); continue; }
      const fb = await page.$('.feedback button:not([disabled])'); if (fb) { await fb.click(); continue; }
      const c = await page.$$('.choice-btn:not([disabled])'); if (c.length) await c[Math.floor(Math.random() * c.length)].click();
      await page.waitForTimeout(80);
    }
    if (!(await page.$('.clear-screen'))) throw new Error('클리어 화면 없음');
    await shot('stage1-clear');
  });
  // 게임들: 시작 화면 → 시작 → 몇 초 동안 아무 버튼이나 눌러 보기
  const games = ['round', 'speed', 'memory', 'whack', 'tower', 'bingo', 'oxshow', 'defense'];
  for (const g of games) {
    await step(`게임: ${g}`, async () => {
      await page.evaluate(x => openPlace(x), g);
      await page.click('text=▶ 시작!');
      for (let i = 0; i < 25; i++) {
        const btns = await page.$$('.choice-btn:not([disabled]), .bingo-cell, .ox-zone, .mem-card, .def-mon');
        if (btns.length) { try { await btns[Math.floor(Math.random() * btns.length)].click({ force: true, timeout: 500 }); } catch (e) {} }
        await page.waitForTimeout(150);
      }
      await shot(`game-${g}`);
    });
  }
  await step('대결·팀전 시작 화면', async () => {
    await page.evaluate(() => { inStage = false; openPlace('duel'); }); await page.click('text=⚔️ 대결 시작!'); await shot('game-duel');
    await page.evaluate(() => { inStage = false; openPlace('team'); }); await page.click('text=▶ 팀전 시작!'); await shot('game-team');
  });
  await step('포켓몬센터 · 상점 · 환전소 · 쿠폰', async () => {
    await page.evaluate(() => { inStage = false; stopModeTimer(); openPlace('center'); }); await shot('center');
    await page.evaluate(() => openPlace('shop')); await shot('shop');
    await page.evaluate(() => openPlace('exchange'));
    const code = await page.evaluate(() => makeCoupon('점검이', '1', 5));
    const before = await page.evaluate(() => save.coins);
    await page.fill('.code-input', code); await page.click('button:has-text("쿠폰 쓰기")');
    if ((await page.evaluate(() => save.coins)) !== before + 50) throw new Error('쿠폰 코인이 들어오지 않음');
  });
  await step('선생님 메뉴 (비밀번호 · 랭킹 코드)', async () => {
    await page.evaluate(() => teacherGate());
    await page.fill('.code-input', await page.evaluate(() => String(CLASS_CONFIG.teacherPin)));
    await page.click('text=확인'); await shot('teacher');
    const ok = await page.evaluate(() => !!readRecordCode('점검이', makeRecordCode()));
    if (!ok) throw new Error('기록 코드 확인 실패');
  });
  console.log(`\n결과: ${fails ? fails + '개 실패' : '모두 통과'}`);
  console.log('ERRORS', errors);
  await browser.close();
  process.exit(fails || errors.length ? 1 : 0);
})();
