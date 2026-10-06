/**
 * Functional checks for the interactions that broke in review.
 *   node tools/check.mjs
 * Prints PASS/FAIL lines; exits 1 on any failure.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(ROOT, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const URL0 = `http://localhost:${server.address().port}/`;
const browser = await pw.chromium.launch();
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fails++; };

async function page({ mobile = true, time, reduced = false, js = true } = {}) {
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, timezoneId: 'Europe/Istanbul', reducedMotion: reduced ? 'reduce' : 'no-preference', javaScriptEnabled: js });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', (e) => errors.push(e.message));
  if (time) await pg.clock.install({ time: new Date(time) });
  await pg.goto(URL0, { waitUntil: 'load' });
  await pg.waitForTimeout(300);
  return { ctx, pg, errors };
}

// 1 · İçindekiler dialog
{
  const { ctx, pg, errors } = await page({ mobile: true });
  await pg.evaluate(() => scrollTo(0, 60)); await pg.waitForTimeout(800);
  await pg.click('.cupbtn'); await pg.waitForTimeout(900);
  ok(await pg.evaluate(() => document.querySelector('#icindekiler').classList.contains('is-open')), 'TOC opens from the cup');
  ok(await pg.evaluate(() => document.activeElement?.matches('[data-toc-close]')), 'focus moves to the close button');
  for (let i = 0; i < 40; i++) await pg.keyboard.press('Tab');
  ok(await pg.evaluate(() => document.querySelector('#icindekiler').contains(document.activeElement) || document.activeElement.closest('.cupbtn')), 'Tab stays inside the dialog');
  ok(await pg.evaluate(() => document.querySelector('main').inert), 'page behind is inert');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(900);
  ok(await pg.evaluate(() => document.querySelector('#icindekiler').hidden), 'ESC closes it');
  ok(await pg.evaluate(() => !!document.activeElement?.closest('.cupbtn')), 'focus returns to the cup');
  // jump through the TOC: the spine must hold exactly one suffix
  await pg.click('.cupbtn'); await pg.waitForTimeout(900);
  await pg.click('#icindekiler a[href="#kap-emir"]'); await pg.waitForTimeout(2600);
  const spans = await pg.evaluate(() => [...document.querySelectorAll('.spine__suffix > span')].filter((s) => !s.classList.contains('out')).map((s) => s.textContent));
  ok(spans.length === 1 && spans[0] === '!', `TOC jump leaves one suffix (${JSON.stringify(spans)})`);
  // status pill jump
  await pg.evaluate(() => scrollTo(0, 2500)); await pg.waitForTimeout(700);
  await pg.click('.spine__status'); await pg.waitForTimeout(1500);
  const spans2 = await pg.evaluate(() => [...document.querySelectorAll('.spine__suffix > span')].map((s) => s.textContent));
  ok(spans2.length <= 2, `status jump leaves no pile (${JSON.stringify(spans2)})`);
  ok(errors.length === 0, `no page errors ${errors.join(' | ')}`);
  await ctx.close();
}

// 2 · live hours (Istanbul time; 2026-10-08 is a Thursday)
const CASES = [
  ['2026-10-08T10:00:00Z', 'Thu 13:00', { carsi: true, oy: true }, 'iki kapı da açık'],
  ['2026-10-08T19:00:00Z', 'Thu 22:00', { carsi: false, oy: true }, "01:00'e kadar"],
  ['2026-10-08T21:30:00Z', 'Fri 00:30', { carsi: false, oy: true }, "01:00'e kadar"],
  ['2026-10-08T22:30:00Z', 'Fri 01:30', { carsi: false, oy: false }, "10:00'da"],
  ['2026-10-09T22:30:00Z', 'Sat 01:30', { carsi: false, oy: true }, "02:00'ye kadar"],
  ['2026-10-10T22:30:00Z', 'Sun 01:30', { carsi: false, oy: true }, "02:00'ye kadar"],
  ['2026-10-11T22:30:00Z', 'Mon 01:30', { carsi: false, oy: false }, "10:00'da"],
  ['2026-10-12T08:00:00Z', 'Mon 11:00', { carsi: false, oy: true }, "bugün 12:30'da"],
];
for (const [t, label, want, text] of CASES) {
  const { ctx, pg } = await page({ mobile: true, time: t });
  const got = await pg.evaluate(() => ({
    carsi: document.querySelector('.door[data-branch="carsi"]').classList.contains('is-open'),
    oy: document.querySelector('.door[data-branch="oy"]').classList.contains('is-open'),
    night: document.body.classList.contains('is-night'),
    txt: [document.querySelector('[data-status-line]').textContent, document.querySelector('[data-status-until]').textContent, ...[...document.querySelectorAll('[data-door-now],[data-toc-now],[data-door-sign]')].map((e) => e.textContent)].join(' | '),
  }));
  ok(got.carsi === want.carsi && got.oy === want.oy && got.night === (!want.carsi && !want.oy) && got.txt.includes(text), `${label}: çarşı=${got.carsi} oy=${got.oy} night=${got.night} "${text}"`);
  if (/[a-zçğıöşü] (Bugün|Yarın)/.test(got.txt)) ok(false, `${label}: capitalised Bugün/Yarın mid-sentence: ${got.txt}`);
  await ctx.close();
}

// 3 · reduced motion: one heart, real chapter
{
  const { ctx, pg } = await page({ mobile: true, reduced: true });
  const r = await pg.evaluate(() => ({ fly: document.querySelector('#heart').classList.contains('is-on'), svg: getComputedStyle(document.querySelector('[data-mascot-root] .m-heart')).opacity, ch: document.body.dataset.chapter }));
  ok(!(r.fly && r.svg !== '0'), `reduced motion shows one heart (flying=${r.fly}, mascot=${r.svg})`);
  ok(r.ch === 'kapak', `reduced motion starts on KAPAK (${r.ch})`);
  await ctx.close();
}

// 4 · no JS: readable, menu in place, no dead cup
{
  const { ctx, pg } = await page({ mobile: true, js: false });
  const r = await pg.evaluate(() => ({ toc: getComputedStyle(document.querySelector('#icindekiler')).visibility, cup: getComputedStyle(document.querySelector('.cupbtn')).display }));
  ok(r.toc === 'visible' && r.cup === 'none', `no-JS: menu visible (${r.toc}), cup hidden (${r.cup})`);
  await ctx.close();
}

await browser.close(); server.close();
console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
process.exit(fails ? 1 : 0);
