/* Headless screenshots of the React app, for visual verification of design steps.
   The suite in test_kampus.js proves behavior; this proves the pixels moved.

   Usage:  node tests/screenshot.mjs <out-dir> [label] [url]
   PW_CHROME points at an existing Chromium (see CLAUDE.md). The dev server must
   already be running (npm run dev). Captures desktop 1280 and phone 390. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const [outDir = 'shots', label = 'home', url = 'http://localhost:5173/'] = process.argv.slice(2);
const VIEWPORTS = [{ name: 'desktop', width: 1280, height: 1000 }, { name: 'phone', width: 390, height: 844 }];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
const errors = [];

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  page.on('pageerror', e => errors.push(`${vp.name} PAGE: ${e.message.slice(0, 160)}`));
  // The app ships no favicon; the browser's automatic request for one is not a defect.
  page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(`${vp.name} ${r.status()}: ${r.url().slice(0, 120)}`); });
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/favicon/.test(t) || /status of 404/.test(t)) return;   // paired with the response hook above
    errors.push(`${vp.name} CONSOLE: ${t.slice(0, 160)}`);
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const file = path.join(outDir, `${label}-${vp.name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('shot:', file);
  await page.close();
}

await browser.close();
console.log('ERRORS:', errors.length, errors.slice(0, 5));
if (errors.length) process.exit(1);
