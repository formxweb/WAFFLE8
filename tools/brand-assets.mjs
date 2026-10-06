/**
 * Renders the brand bitmaps with Playwright:
 *   assets/og.jpg            1200x630 share card (JPEG q86)
 *   apple-touch-icon.png     180x180, solid sage square
 *   favicon-32.png           32x32, transparent corners
 *
 *   node tools/brand-assets.mjs
 *
 * The share card page is generated into a temp dir (BRAND_TMP, default the OS
 * temp dir) with the site's fonts inlined from assets/css/fonts.css, so it
 * always uses the same faces as the site. Uses the globally installed
 * Playwright if it is not resolvable locally.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TMP = mkdtempSync(join(process.env.BRAND_TMP || tmpdir(), 'cupistan-brand-'));

// site fonts, inlined (file:// pages cannot fetch file:// fonts)
const fontsCss = readFileSync(join(ROOT, 'assets/css/fonts.css'), 'utf8').replace(
  /url\(\.\.\/fonts\/([^)]+)\)/g,
  (_, f) => `url(data:font/woff2;base64,${readFileSync(join(ROOT, 'assets/fonts', f)).toString('base64')})`,
);

// the mascot, awake and smiling (copied from index.html's <svg class="mascot">)
const MASCOT = `<svg class="mascot" viewBox="0 0 240 240" aria-hidden="true">
  <defs><clipPath id="m-body-clip"><path d="M50,116 L190,116 C188,168 186,204 178,217 C174,224 167,228 158,228 L82,228 C73,228 66,224 62,217 C54,204 52,168 50,116 Z"/></clipPath></defs>
  <g stroke="#66604D" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <path d="M186,140 C232,128 236,202 180,198" fill="none" stroke-width="24"/>
    <path d="M186,140 C232,128 236,202 180,198" fill="none" stroke="#F8E3CA" stroke-width="11"/>
    <path d="M50,116 L190,116 C188,168 186,204 178,217 C174,224 167,228 158,228 L82,228 C73,228 66,224 62,217 C54,204 52,168 50,116 Z" fill="#F8E3CA"/>
    <path d="M60,124 C62,170 66,200 74,212" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="7"/>
    <g clip-path="url(#m-body-clip)"><path d="M40,194 C90,201 150,201 200,194 L200,240 L40,240 Z" fill="#F07E7B" stroke="none"/></g>
    <path d="M55,195 C95,202 145,202 185,195" fill="none" stroke-width="5"/>
    <path d="M50,116 L190,116 C188,168 186,204 178,217 C174,224 167,228 158,228 L82,228 C73,228 66,224 62,217 C54,204 52,168 50,116 Z" fill="none"/>
    <ellipse cx="120" cy="116" rx="70" ry="13" fill="#E9555A"/>
    <path d="M78,116 C96,107 118,124 136,111 C146,105 158,113 162,118" fill="none" stroke="#FFF9F0" stroke-width="7"/>
  </g>
  <g>
    <ellipse cx="82" cy="174" rx="12" ry="7" fill="#F8A3A1"/>
    <ellipse cx="158" cy="174" rx="12" ry="7" fill="#F8A3A1"/>
    <ellipse cx="97" cy="156" rx="8.5" ry="10" fill="#3A2A22"/><ellipse cx="143" cy="156" rx="8.5" ry="10" fill="#3A2A22"/>
    <circle cx="94.5" cy="152" r="3.2" fill="#fff"/><circle cx="140.5" cy="152" r="3.2" fill="#fff"/>
    <path d="M110,170 Q120,180 130,170" fill="none" stroke="#3A2A22" stroke-width="4.5" stroke-linecap="round"/>
  </g>
  <g stroke="#66604D" stroke-width="6" stroke-linejoin="round">
    <path d="M44,124 C30,123 30,103 45,100 C43,87 60,80 71,87 C78,77 96,77 102,86 C110,76 131,76 139,86 C146,77 165,78 170,88 C181,81 198,88 195,101 C210,104 209,124 195,124 C183,130 163,126 152,128 C137,133 104,133 89,128 C78,125 58,130 44,124 Z" fill="#FFF9F0"/>
    <path d="M64,111 C92,118 148,118 178,109" fill="none" stroke-width="3.5" stroke-opacity=".55"/>
    <path d="M67,93 C56,91 56,74 70,72 C70,59 87,55 95,62 C103,52 125,51 132,60 C140,53 158,57 157,68 C172,69 178,86 168,93 C159,99 139,97 120,99 C99,99 80,99 67,93 Z" fill="#FFF9F0"/>
    <path d="M80,82 C100,88 140,88 160,80" fill="none" stroke-width="3.5" stroke-opacity=".55"/>
    <path d="M87,66 C80,55 90,41 103,43 C107,32 126,30 134,39 C147,37 155,50 148,61 C141,70 127,69 118,69 C104,69 93,72 87,66 Z" fill="#FFF9F0"/>
    <path d="M120,46 C120,46 99,33 99,19 C99,10 107,5 113,8 C116.5,9.5 119,12.5 120,15 C121,12.5 123.5,9.5 127,8 C133,5 141,10 141,19 C141,33 120,46 120,46 Z" fill="#E9555A"/>
  </g>
</svg>`;

const OG = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
${fontsCss}
:root { --krema:#F8E8D6; --bitter:#3A2A22; --zeytin:#66604D; --cilek:#E9555A; --adacayi:#929876; }
* { box-sizing: border-box; }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: var(--krema); color: var(--bitter); }
.card { position: relative; width: 1200px; height: 630px; overflow: hidden; }
.disc { position: absolute; left: 678px; top: 148px; width: 600px; height: 600px; border-radius: 50%;
        background: var(--adacayi); border: 7px solid var(--bitter); }
.shadow { position: absolute; left: 850px; top: 574px; width: 270px; height: 34px; border-radius: 50%;
          background: rgba(58,42,34,.28); filter: blur(7px); }
.mascot { position: absolute; left: 785px; top: 204px; width: 420px; height: 420px; overflow: visible; }
.word { position: absolute; left: 56px; top: 50px; margin: 0; font: 400 146px/1 'Coiny', sans-serif; letter-spacing: -.01em; white-space: nowrap; }
.word .cup { color: var(--cilek); }
.say { position: absolute; left: 64px; top: 258px; margin: 0; font: italic 400 46px/1.1 'Fraunces', Georgia, serif;
       font-variation-settings: 'SOFT' 100, 'WONK' 1; }
.tag { position: absolute; left: 66px; bottom: 56px; margin: 0; font: 400 22px/1 'DM Mono', monospace; letter-spacing: .08em; color: var(--zeytin); }
.rule { position: absolute; left: 66px; top: 348px; width: 92px; height: 7px; border-radius: 4px; background: var(--cilek); }
</style></head><body><div class="card">
  <div class="disc"></div>
  <div class="shadow"></div>
  ${MASCOT}
  <h1 class="word"><span class="cup">CUP</span>İSTAN</h1>
  <p class="say">Kap bi mutluluk · Gebze</p>
  <i class="rule"></i>
  <p class="tag">#KAPİSTAN · @cupistantr</p>
</div></body></html>`;

const browser = await pw.chromium.launch();
try {
  // share card
  const ogFile = join(TMP, 'og.html');
  writeFileSync(ogFile, OG);
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(ogFile).href);
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() => ['150px Coiny', 'italic 46px Fraunces', '22px "DM Mono"'].filter((f) => !document.fonts.check(f, 'İ')));
  if (missing.length) throw new Error(`fonts not loaded: ${missing}`);
  await page.screenshot({ path: join(ROOT, 'assets/og.jpg'), type: 'jpeg', quality: 86 });

  // icons from favicon.svg
  const svg = readFileSync(join(ROOT, 'favicon.svg'), 'utf8');
  const icon = async (size, solid, out) => {
    const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:${solid || 'transparent'}">
      <div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></body></html>`);
    await p.screenshot({ path: join(ROOT, out), omitBackground: !solid });
    await p.close();
  };
  await icon(180, '#929876', 'apple-touch-icon.png');
  await icon(32, null, 'favicon-32.png');
} finally {
  await browser.close();
}
console.log('wrote assets/og.jpg, apple-touch-icon.png, favicon-32.png');
