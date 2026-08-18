const { chromium } = require('playwright');

(async () => {
  // PW_CHROME lets CI or sandboxes point at a preinstalled Chromium build
  const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGE: ' + e.message.slice(0, 160)));
  await page.goto('file://' + require('path').join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(500);

  // ---- 1. generator fuzz across all grades/tiers ----
  const fuzz = await page.evaluate(() => {
    const issues = [];
    for (const grade of [3,4,5,6,7,8]) {
      S.grade = grade;
      for (const topic of ['frac','ratio','int','alg']) {
        for (let tier = 1; tier <= 3; tier++) {
          S.tiers2[grade+'_'+topic] = tier;
          for (let i = 0; i < 150; i++) {
            const p = makeProblem(topic);
            const tag = `G${grade} ${topic} T${tier}`;
            if (!p.choices || p.choices.length < 3) issues.push(`${tag}: <3 choices`);
            if (p.correctIdx < 0 || p.choices[p.correctIdx] !== p.ans) issues.push(`${tag}: bad correctIdx`);
            if (new Set(p.choices).size !== p.choices.length) issues.push(`${tag}: dup choices`);
            if (!p.steps || p.steps.length < 2) issues.push(`${tag}: no steps`);
            if (p.skill === 'Arithmetic') issues.push(`${tag}: fallback generator`);
          }
          S.tiers2[grade+'_'+topic] = 1;
        }
      }
    }
    S.grade = 6;
    return [...new Set(issues)].slice(0, 20);
  });
  console.log('FUZZ ISSUES:', fuzz.length, fuzz);

  // ---- 2. onboarding ----
  await page.evaluate(() => { store.clear(); S = freshState(); startOnb(0); });
  await page.click('#onb-next');
  await page.getByText('6', { exact: true }).first().click();
  await page.locator('.avpick button').nth(1).click();
  await page.click('#onb-done');
  await page.waitForTimeout(300);
  const onb = await page.evaluate(() => ({
    onboarded: S.onboarded, avatar: S.avatar, grade: S.grade,
    home: document.getElementById('scr-home').classList.contains('on'),
    gcards: document.querySelectorAll('.gcard').length,
    worlds: document.querySelectorAll('.wtile').length,
    headline: document.getElementById('headline').textContent
  }));
  console.log('ONBOARDING:', JSON.stringify(onb));

  // ---- 3. full standard round with one wrong + second look ----
  await page.evaluate(() => startRound('frac'));
  let wrongDone = false, safety = 0;
  while (safety++ < 40) {
    const state = await page.evaluate(() => G ? {locked: G.locked, phase: G.phase, q: G.qNum, hasWrong: !!document.getElementById('btn-nextq')} : null);
    if (!state) break;
    if (state.hasWrong) { await page.click('#btn-nextq'); await page.waitForTimeout(150); continue; }
    if (state.locked) { await page.waitForTimeout(300); continue; }
    const wrongNow = !wrongDone && state.phase === 'main' && state.q === 4;
    await page.evaluate(w => {
      const i = w ? (G.cur.correctIdx + 1) % G.cur.choices.length : G.cur.correctIdx;
      if (G.cur.nl && document.querySelector('#nlsvg')) {
        const v = valOf(G.cur.ans);
        const t = document.querySelector(`#nlsvg .tick[data-v="${w ? v + 1 : v}"]`);
        if (t) t.dispatchEvent(new Event('click')); else answer(i);
      } else answer(i);
    }, wrongNow);
    if (wrongNow) wrongDone = true;
    await page.waitForTimeout(1100);
  }
  await page.waitForTimeout(400);
  const round = await page.evaluate(() => ({
    end: document.getElementById('scr-end').classList.contains('on'),
    endText: document.getElementById('endcol').innerText.slice(0, 60).replace(/\n/g, ' | '),
    sessions: S.stats.sessions.length,
    lastSession: S.stats.sessions[S.stats.sessions.length - 1],
    gems: S.gems, wkEarned: S.wk.earned, tickets: S.tickets
  }));
  console.log('ROUND:', JSON.stringify(round));

  // ---- 4. teach confirm + halving ----
  const teach = await page.evaluate(async () => {
    const out = {};
    startRound('alg');
    await new Promise(r => setTimeout(r, 200));
    document.getElementById('btn-teach').click();
    out.confirmShown = !document.getElementById('teachconfirm').classList.contains('hide');
    document.getElementById('tc-teach').click();
    out.teachOpen = !document.getElementById('teach').classList.contains('hide');
    out.dimmed = document.getElementById('answers').classList.contains('dim');
    out.steps1 = document.querySelectorAll('#teach .tstep').length;
    const nxt = document.getElementById('t-next'); if (nxt) nxt.click();
    out.steps2 = document.querySelectorAll('#teach .tstep').length;
    const before = S.gems, spentBefore = S.wk.spent;
    answer(G.cur.correctIdx);
    out.gainHalved = S.gems - before;
    out.spentTracked = S.wk.spent > spentBefore;
    await new Promise(r => setTimeout(r, 1200));
    const b2 = S.gems;
    answer(G.cur.correctIdx);
    out.gainFull = S.gems - b2;
    abandonRound(); renderHome(); go('home');
    return out;
  });
  console.log('TEACH:', JSON.stringify(teach));

  // ---- 5. focus mode + streak titles ----
  const focus = await page.evaluate(async () => {
    S.focusMode = true; applyTheme();
    startRound('ratio');
    await new Promise(r => setTimeout(r, 200));
    const live = document.body.classList.contains('live') && document.body.classList.contains('focuson');
    G.streak = 8; updateStreakline();
    const line = document.getElementById('streakline').textContent;
    abandonRound(); renderHome(); go('home');
    return { live, line };
  });
  console.log('FOCUS:', JSON.stringify(focus));

  // ---- 6. session wind-down banner ----
  const sess = await page.evaluate(async () => {
    S.sessionLen = 10;
    S.playMs = { day: todayStr(), ms: 10*60000 - 500, bannered: false };
    startRound('frac');
    await new Promise(r => setTimeout(r, 1600));
    const shown = !!document.getElementById('btn-sessdone');
    abandonRound(); renderHome(); go('home');
    S.sessionLen = 0; save();
    return shown;
  });
  console.log('SESSION BANNER:', sess);

  // ---- 7. shop: gear bonus + midnight theme ----
  const shop = await page.evaluate(() => {
    S.gems = 2000; renderShop(); go('shop');
    document.querySelector('[data-buy="gear:stone"]').click();
    const bonusAfterGear = bonusPct();
    shopTab = 'themes'; renderShop();
    document.querySelector('[data-buy="themes:midnight"]').click();
    return { bonusAfterGear, theme: S.theme, cls: document.body.className.includes('theme-midnight'), gems: S.gems, spent: S.wk.spent };
  });
  console.log('SHOP:', JSON.stringify(shop));

  // ---- 8. rewards redeem + parent approve ----
  const rew = await page.evaluate(() => {
    S.theme='paper'; applyTheme();
    S.tickets = 5; renderRewards(); go('rewards');
    document.querySelector('[data-redeem]').click();
    const afterRedeem = { tickets: S.tickets, waiting: S.redemptions.filter(r=>r.status==='requested').length };
    S.parentOnboarded = true; renderParent(); go('parent');
    const g = document.querySelector('[data-given]'); if (g) g.click();
    return { ...afterRedeem, given: S.redemptions.filter(r=>r.status==='given').length };
  });
  console.log('REWARDS:', JSON.stringify(rew));

  // ---- 9. lemonade stand economics ----
  const stand = await page.evaluate(() => {
    renderStand(); go('stand');
    S.biz.price = 2; S.biz.made = 20; S.biz.bankedDay=''; S.biz.result = null; save(); renderStand();
    document.getElementById('st-open').click();
    const r = S.biz.result;
    const fc = forecastToday();
    const expDemand = Math.round(22 * (fc==='sunny'?1.2:0.8));
    const ok = r.demand===expDemand && r.sold===Math.min(20, expDemand) && r.cost===10 && r.revenue===r.sold*2 && r.profit===r.revenue-10;
    const g0 = S.gems;
    const bank = document.getElementById('st-bank');
    if (bank) bank.click();
    return { ok, fc, profit: r.profit, banked: S.biz.result.banked, paid: S.gems - g0 };
  });
  console.log('STAND:', JSON.stringify(stand));

  // ---- 10. grade test: pass ----
  await page.evaluate(() => {
    for (const k of ['frac','ratio','int','alg']) S.tiers2['6_'+k] = 2;
    S.grade = 6; S.maxG = 6; save();
    renderTestIntro(); go('testintro');
  });
  await page.click('#btn-starttest');
  safety = 0;
  while (safety++ < 60) {
    const st = await page.evaluate(() => G ? {locked: G.locked, idx: G.idx, correct: G.correct, hasWrong: !!document.getElementById('btn-nextq')} : null);
    if (!st) break;
    if (st.hasWrong) { await page.click('#btn-nextq'); await page.waitForTimeout(120); continue; }
    if (st.locked) { await page.waitForTimeout(250); continue; }
    const answerWrong = st.correct >= 16 && st.idx >= 16;  // 16 right then 4 wrong
    await page.evaluate(w => answer(w ? (G.cur.correctIdx+1)%G.cur.choices.length : G.cur.correctIdx), answerWrong);
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(400);
  const test = await page.evaluate(() => ({
    result: document.getElementById('scr-testresult').classList.contains('on'),
    text: document.getElementById('testresultcol').innerText.slice(0, 50).replace(/\n/g,' | '),
    passed6: !!S.passed[6], grade: S.grade, tickets: S.tickets
  }));
  console.log('GRADE TEST:', JSON.stringify(test));

  console.log('ERRORS:', errors.length, errors.slice(0, 5));
  await browser.close();
  if (fuzz.length || errors.length) process.exit(1);
})();
