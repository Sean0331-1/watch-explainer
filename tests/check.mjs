// 驗收檢查（SPEC.md 第 9 節）＋截圖。用法：node tests/check.mjs
// Playwright 借用原專案的 node_modules；瀏覽器用 Edge（原專案規格 §4.3：Smart App Control 會擋未簽章的瀏覽器）。
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire('C:/SEAN/claude watshes/package.json');
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const shots = path.join(root, 'screenshots');
mkdirSync(shots, { recursive: true });

let failed = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); if (!ok) failed++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

const browser = await chromium.launch({ channel: 'msedge' });

// ── 桌機 ──
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const d = await page.evaluate(() => ({ tph: window.__watch.TPH, ratio: window.__watch.TOTAL_RATIO }));
  check('發條盒每小時 0.1495 圈', near(d.tph.barrel, 0.1495, 0.0001), d.tph.barrel.toFixed(5));
  check('中心輪每小時 1 圈', near(d.tph.centre, 1, 1e-9));
  check('三輪每小時 7.5 圈', near(d.tph.third, 7.5, 1e-9));
  check('秒輪每小時 60 圈', near(d.tph.seconds, 60, 1e-9));
  check('擒縱輪每小時 630 圈', near(d.tph.escape, 630, 1e-9));
  check('總增速比約 4213', Math.round(d.ratio) === 4213, d.ratio.toFixed(3));

  // 第 1 章
  await page.locator('#crown').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(shots, 'ch1-crown.png'), clip: await page.locator('#crown .ch-body').boundingBox() });
  await page.click('#crown [data-pos="3"]');
  await page.evaluate(() => window.__watch.crown.applyTurn(1.5));
  await page.waitForTimeout(500);
  check('第 3 段轉 1.5 圈：時間 +60 分鐘', (await page.textContent('#crown-time')) === '上午 11:08', await page.textContent('#crown-time'));
  await page.screenshot({ path: path.join(shots, 'ch1-crown-pos3.png'), clip: await page.locator('#crown .stage').boundingBox() });
  await page.click('#crown [data-pos="2"]');
  await page.waitForTimeout(450);
  await page.evaluate(() => window.__watch.crown.applyTurn(5));
  await page.waitForTimeout(100);
  check('第 2 段轉 5 圈：日期前進 9 天（1.8 天／圈）', (await page.textContent('#crown-date')) === '8 日', await page.textContent('#crown-date'));
  await page.screenshot({ path: path.join(shots, 'ch1-crown-pos2.png'), clip: await page.locator('#crown .stage').boundingBox() });
  await page.click('#crown [data-pos="1"]');
  await page.waitForTimeout(450);
  const before = await page.evaluate(() => window.__watch.power.arbor);
  await page.evaluate(() => window.__watch.crown.applyTurn(-3));
  check('第 1 段反轉不上鍊', near(await page.evaluate(() => window.__watch.power.arbor), before, 1e-3));
  await page.evaluate(() => window.__watch.crown.applyTurn(2));
  check('第 1 段順轉 2 圈：發條軸 +32/63 圈', near(await page.evaluate(() => window.__watch.power.arbor), before + 32 / 63, 1e-3));

  // 第 2 章
  await page.locator('#power').scrollIntoViewIfNeeded();
  await page.click('#pw-reset');
  await page.evaluate(() => window.__watch.power.wind(11.79 / (16 / 63)));
  await page.waitForTimeout(150);
  check('上鍊 46.4 圈：動力儲存約 79 小時', (await page.textContent('#pw-reserve')) === '約 79 小時', await page.textContent('#pw-reserve'));
  await page.evaluate(() => window.__watch.power.wind(1));
  await page.waitForTimeout(50);
  check('上滿後繼續上鍊：顯示打滑', (await page.textContent('#pw-status')).includes('打滑'));
  await page.screenshot({ path: path.join(shots, 'ch2-power-full.png'), clip: await page.locator('#power .ch-body').boundingBox() });
  await page.click('#pw-back');
  await page.waitForTimeout(100);
  check('反轉：棘爪擋住', (await page.textContent('#pw-status')).includes('棘爪'));
  await page.click('#pw-fast');
  await page.waitForTimeout(1600);
  const r1 = await page.evaluate(() => window.__watch.power.reserve);
  check('快轉放鍊：動力儲存遞減', r1 < 78.8 - 1, r1.toFixed(2));
  await page.click('#pw-fast');
  await page.click('#pw-reset');
  await page.evaluate(() => window.__watch.power.wind(20));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(shots, 'ch2-power.png'), clip: await page.locator('#power .stage').boundingBox() });

  // 第 3 章
  await page.locator('#train').scrollIntoViewIfNeeded();
  await page.click('#tr-play');                       // 暫停
  await page.evaluate(() => { window.__watch.train.st.t = 10; });
  await page.waitForTimeout(150);
  const hand = await page.evaluate(() => document.querySelector('.hand-s').getAttribute('transform'));
  check('1× 經過 10 秒：秒針轉 60°', /rotate\(60(\.0+)?\)/.test(hand), hand);
  await page.click('#train [data-mesh="2"]');
  check('點嚙合：三輪 → 秒輪 72 ÷ 9 = 8 倍', (await page.textContent('#tr-mesh')).includes('≈ 8 倍'));
  const rows = await page.$$eval('#tr-table tbody tr', (trs) => trs.map((tr) => tr.lastElementChild.textContent));
  check('一圈需時表', rows.join('|') === '約 6 小時 41 分|1 小時|8 分鐘|1 分鐘|約 5.7 秒', rows.join('|'));
  await page.click('#train [data-speed="60"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(shots, 'ch3-train.png'), clip: await page.locator('#train .ch-body').boundingBox() });

  // 第 4 章
  await page.locator('#escapement').scrollIntoViewIfNeeded();
  for (let k = 0; k < 8; k++) { await page.click('#esc-next'); await page.waitForTimeout(700); }
  const w = await page.evaluate(() => window.__watch.esc.st.v.w);
  check('下一階段 ×8：擒縱輪前進 18°（一齒）', near(w, 18, 1e-6), String(w));
  for (const [i, name] of [[0, 'lock'], [1, 'unlock'], [2, 'impulse'], [3, 'drop']]) {
    await page.click(`#escapement [data-phase="${i}"]`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(shots, `ch4-esc-${i + 1}-${name}.png`), clip: await page.locator('#escapement .stage').boundingBox() });
  }
  await page.screenshot({ path: path.join(shots, 'ch4-escapement.png'), clip: await page.locator('#escapement .ch-body').boundingBox() });

  // 開頭與導覽
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(shots, 'hero.png') });
  await page.locator('#train').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(400);
  check('捲到第 3 章：導覽「輪系」亮起', await page.evaluate(() => document.querySelector('nav.path a.on')?.textContent.trim()) === '輪系');

  check('主控台沒有錯誤', errors.length === 0, errors.join(' / '));
  await page.close();
}

// ── 手機 375 px ──
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  check('手機 375 px 沒有水平捲軸', sw <= 375, `scrollWidth ${sw}`);
  for (const id of ['crown', 'power', 'train', 'escapement']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shots, `mobile-${id}.png`), clip: await page.locator(`#${id} .ch-body`).boundingBox() });
  }
  check('手機版主控台沒有錯誤', errors.length === 0, errors.join(' / '));
  await page.close();
}

await browser.close();
console.log(failed ? `\n${failed} 項失敗` : '\n全部通過');
process.exit(failed ? 1 : 0);
