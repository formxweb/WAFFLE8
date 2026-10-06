/**
 * Visual QA: serves the site, captures frames at given scroll depths.
 *   node tools/qa.mjs [outDir] [mobile|tablet|laptop|desktop|wide|both|all] [y1,y2,...|auto] [timezone] [ISO time]
 * "auto" captures every 0.5 viewport down the full page.
 * The ISO time (e.g. 2026-10-08T15:00:00+03:00) starts the page clock there, to check the open, closed and night states.
 * Prints console errors, failed requests and horizontal overflow.
 * Uses the globally installed Playwright (PLAYWRIGHT_BROWSERS_PATH).
 */
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(join(ROOT, p)); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;

const [,, out = 'qa-out', which = 'both', ys = 'auto', tz = 'Europe/Istanbul', at] = process.argv;
await mkdir(out, { recursive: true });
const DEVICES = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tablet: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  laptop: { viewport: { width: 1024, height: 700 }, deviceScaleFactor: 1 },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  wide: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
};
const GROUPS = { both: ['mobile', 'desktop'], all: Object.keys(DEVICES) };
const browser = await pw.chromium.launch();
for (const name of GROUPS[which] || which.split(',')) {
  const ctx = await browser.newContext({ ...DEVICES[name], timezoneId: tz });
  const page = await ctx.newPage();
  if (at) await page.clock.install({ time: new Date(at) });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = DEVICES[name].viewport.height;
  const list = ys === 'auto' ? Array.from({ length: Math.ceil(H / (vh * 0.5)) + 1 }, (_, i) => Math.min(H - vh, Math.round(i * vh * 0.5))) : ys.split(',').map((v) => (v.endsWith('vh') ? Math.round(parseFloat(v) * vh / 100) : +v));
  for (const y of [...new Set(list)]) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    // let lazy images decode and the rAF loop settle
    await page.waitForTimeout(450);
    // wait for visible images to decode, but never hang on lazy images the browser has not requested
    await page.evaluate(() => Promise.race([
      Promise.all([...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).map((i) => (i.complete ? null : i.decode().catch(() => null)))),
      new Promise((r) => setTimeout(r, 2500)),
    ]));
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/${name}-${String(y).padStart(5, '0')}.png` });
  }
  const vp = await page.evaluate(() => ({ iw: innerWidth, cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth }));
  const bad = vp.iw !== DEVICES[name].viewport.width || vp.sw > vp.cw;
  console.log(`[${name}] height=${H} frames=${list.length} innerWidth=${vp.iw} scrollWidth=${vp.sw}${bad ? '  <-- LAYOUT VIEWPORT WIDENED' : ''}`);
  errors.forEach((e) => console.log(`[${name}] ${e}`));
  await ctx.close();
}
await browser.close();
server.close();
