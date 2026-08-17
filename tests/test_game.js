const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto('file:///home/claude/work/index.html');
  await page.waitForTimeout(300);

  // ---- 1. Structural fuzz test of every generator/tier ----
  const fuzz = await page.evaluate(() => {
    const problems = [];
    const issues = [];
    for (const grade of [3, 4, 5, 6, 7, 8]) {
      S.grade = grade;
      for (const topic of ['frac', 'ratio', 'int', 'alg']) {
        for (let tier = 1; tier <= 3; tier++) {
          S.tiers2[grade + '_' + topic] = tier;
          for (let i = 0; i < 200; i++) {
            const p = makeProblem(topic);
            const tag = `G${grade} ${topic} T${tier}`;
            if (!p.choices || p.choices.length < 3) issues.push(`${tag}: <3 choices for "${p.q}"`);
            if (p.correctIdx < 0 || p.choices[p.correctIdx] !== p.ans) issues.push(`${tag}: bad correctIdx "${p.q}"`);
            if (new Set(p.choices).size !== p.choices.length) issues.push(`${tag}: duplicate choices "${p.q}" -> ${p.choices.join(' | ')}`);
            if (!p.skill) issues.push(`${tag}: missing skill`);
            if (!p.steps || p.steps.length < 2) issues.push(`${tag}: missing teach steps for "${p.q}" [${p.skill}]`);
            if (p.skill === 'Arithmetic') issues.push(`${tag}: fell back to arithmetic (generator failing) q="${p.q}"`);
            if (i < 1) problems.push(`${tag} [${p.skill}] ${p.prompt}: ${p.q.replace(/<[^>]+>/g, '/')} => ${p.ans.replace(/<[^>]+>/g, '/')}`);
          }
          S.tiers2[grade + '_' + topic] = 1;
        }
      }
    }
    S.grade = 6;
    return { issues: [...new Set(issues)].slice(0, 30), samples: problems };
  });
  console.log('--- FUZZ ISSUES (' + fuzz.issues.length + ') ---');
  fuzz.issues.forEach(s => console.log(' !', s));
  console.log('--- SAMPLES ---');
  fuzz.samples.forEach(s => console.log('  ', s));

  // ---- 2. Play a full round clicking correct answers ----
  await page.click('#mode-chill');
  await page.evaluate(() => startRound('frac'));
  for (let q = 0; q < 12; q++) {
    await page.waitForFunction(() => G && !G.locked && document.querySelectorAll('#answers .ans').length >= 3, { timeout: 5000 });
    const idx = await page.evaluate(() => G.cur.correctIdx);
    // answer some wrong on purpose (q 5 and 9)
    const clickIdx = (q === 5 || q === 9) ? await page.evaluate(() => (G.cur.correctIdx + 1) % G.cur.choices.length) : idx;
    await page.evaluate(i => answer(i), clickIdx);
    await page.waitForTimeout(60);
    await page.evaluate(() => { if (G && G.locked) { } });
    // fast-forward the setTimeout by waiting real time
    await page.waitForTimeout((q === 5 || q === 9) ? 1300 : 460);
  }
  await page.waitForTimeout(500);
  const endVisible = await page.evaluate(() => document.getElementById('scr-end').classList.contains('on'));
  const endStats = await page.evaluate(() => ({
    correct: document.getElementById('e-correct').textContent,
    acc: document.getElementById('e-acc').textContent,
    ore: S.ore,
    sessions: S.stats.sessions.length,
    daily: S.stats.daily.streak,
    skills: Object.keys(S.stats.skills).length
  }));
  console.log('--- ROUND END ---', { endVisible, ...endStats });
  await page.screenshot({ path: 'shot_end.png' });

  // ---- 3. Shop: buy a pickaxe ----
  await page.evaluate(() => { S.ore = 500; });
  await page.click('#btn-end-shop');
  await page.waitForTimeout(200);
  await page.click('[data-buy="stone"]');
  await page.waitForTimeout(200);
  const shopState = await page.evaluate(() => ({ ore: S.ore, pick: S.pickaxe, owned: S.owned.pickaxes }));
  console.log('--- SHOP ---', shopState);

  // pets tab + theme buy
  await page.click('[data-tab="themes"]');
  await page.waitForTimeout(150);
  await page.click('[data-buy="nether"]');
  await page.waitForTimeout(150);
  const themeState = await page.evaluate(() => ({ theme: S.theme, bodyClass: document.body.className, ore: S.ore }));
  console.log('--- THEME ---', themeState);
  await page.screenshot({ path: 'shot_shop.png' });

  // ---- 4. Parent dashboard ----
  await page.click('#btn-shop-back');
  await page.click('#btn-parent');
  await page.waitForTimeout(250);
  const parentText = await page.evaluate(() => document.getElementById('parentbody').innerText.slice(0, 400));
  console.log('--- PARENT ---\n' + parentText);
  await page.screenshot({ path: 'shot_parent.png' });

  // ---- 5. Timed round starts + timer ticks; keyboard answer ----
  await page.click('#btn-parent-back');
  await page.click('#mode-timed');
  await page.evaluate(() => startRound('int'));
  await page.waitForTimeout(1200);
  await page.keyboard.press('1');
  await page.waitForTimeout(300);
  const timedState = await page.evaluate(() => ({ mode: S.mode, qCount: G ? G.qCount : 'ended', timeLeft: G ? G.timeLeft : '-' }));
  console.log('--- TIMED ---', timedState);
  await page.screenshot({ path: 'shot_game.png' });

  // ---- 5b. Teach mode: pause, steps render, halved gems, hint stats ----
  const teach = await page.evaluate(async () => {
    const out = {};
    if (G) endRound();
    S.mode = 'timed';
    startRound('alg');
    const t0 = G.timeLeft;
    showTeach();
    out.paused = G.paused && G.helped;
    out.panelVisible = document.getElementById('teach').style.display === 'block';
    out.stepsShown = document.querySelectorAll('#teach .tstep').length;
    await new Promise(r => setTimeout(r, 2300));
    out.timeFrozen = (G.timeLeft === t0);
    out.speakText = speakify(G.cur.prompt + ': ' + G.cur.q);
    const oreBefore = G.ore;
    const streakBefore = G.streak;
    answer(G.cur.correctIdx);            // answer correctly WITH hint
    out.resumed = !G.paused;
    out.gainedWithHint = G.ore - oreBefore;
    out.streakKept = G.streak === streakBefore + 1;
    out.hintRecorded = Object.values(S.stats.skills).some(s => (s.h || 0) > 0);
    // compare: full-price answer without hint
    await new Promise(r => setTimeout(r, 500));
    const ore2 = G.ore;
    answer(G.cur.correctIdx);
    out.gainedNoHint = G.ore - ore2;
    endRound();
    return out;
  });
  console.log('--- TEACH ---', teach);
  const sp = await page.evaluate(() => [
    speakify('<span class="fr"><span class="fn">3</span><span class="fd">4</span></span> + <span class="fr"><span class="fn">1</span><span class="fd">4</span></span>'),
    speakify('−8 − (−3) = ?'),
    speakify('|−16| = ?'),
    speakify('Split 30 gems in the ratio 2:3'),
    speakify('25% of 80'),
  ]);
  console.log('--- SPEAKIFY ---'); sp.forEach(s => console.log('  ·', s));

  // adaptive tier-up check
  const tierCheck = await page.evaluate(() => {
    S.grade = 6; S.tiers2['6_ratio'] = 1; S.recent2['6_ratio'] = [];
    for (let i = 0; i < 6; i++) recordAdaptive('ratio', true);
    const up = S.tiers2['6_ratio'];
    for (let i = 0; i < 6; i++) recordAdaptive('ratio', false);
    const down = S.tiers2['6_ratio'];
    // grade isolation: grade 3's tier untouched
    return { afterWins: up, afterLosses: down, g3Untouched: (S.tiers2['3_ratio'] || 1) === 1 };
  });
  console.log('--- ADAPTIVE ---', tierCheck);

  // home screen shot
  await page.evaluate(() => { endRound(); renderHome(); show('scr-home'); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shot_home.png' });

  console.log('--- CONSOLE ERRORS (' + errors.length + ') ---');
  errors.slice(0, 10).forEach(e => console.log(' !', e));
  await browser.close();
  if (fuzz.issues.length || errors.length) process.exit(1);
})();
