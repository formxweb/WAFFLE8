/* CUPISTAN · KAP'TAN KAPI'YA (v2)
 * One rAF loop, started by scroll/resize/pointer and stopped when the page
 * settles. Layout is read only in measure(); frames only write transforms,
 * custom properties and SVG attributes.
 */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bezier = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = matchMedia('(hover: hover)').matches;
  const body = document.body;
  let vw = innerWidth, vh = innerHeight;

  /* ─── the mascot, cloned wherever a cup is needed ─────────────── */
  const rootSvg = $('[data-mascot-root] .mascot');
  let cloneN = 0;
  $$('[data-mascot-clone]').forEach((host) => {
    const svg = rootSvg.cloneNode(true);
    const id = `m-body-clip-${++cloneN}`;
    svg.querySelector('clipPath').id = id;
    svg.querySelector('[clip-path]').setAttribute('clip-path', `url(#${id})`);
    svg.removeAttribute('role');
    svg.removeAttribute('aria-label');
    svg.setAttribute('aria-hidden', 'true');
    svg.querySelector('.m-heart').style.opacity = '0'; // only one heart exists
    host.append(svg);
  });
  const finalMascot = $('[data-final-mascot] .mascot');
  const cupMascot = $('.cupbtn .mascot');

  /* ─── hours: the cup lives on Istanbul time ───────────────────── */
  const BRANCH = {
    carsi: { name: 'Çarşı', opens: 750, closes: 1290, openTxt: "12:30'da", closeTxt: "21:30'a kadar" },
    oy: { name: 'Osman Yılmaz', opens: 600, closes: 60, lateCloses: 120, openTxt: "10:00'da", closeTxt: "01:00'e kadar", lateTxt: "02:00'ye kadar" },
  };
  const MAPS = {
    carsi: 'https://www.google.com/maps/dir/?api=1&destination=Cupistan%2C%20Hac%C4%B1halil%20%C3%87ar%C5%9F%C4%B1%2C%20Gebze%2C%20Kocaeli',
    oy: 'https://www.google.com/maps/dir/?api=1&destination=Cupistan%2C%20%C4%B0lyas%20Uzuner%20Cd.%20No%3A15%2FA%2C%20Gebze%2C%20Kocaeli',
  };
  function istanbulNow() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { dow, min: (+get('hour')) * 60 + (+get('minute')) };
  }
  function status() {
    const { dow, min } = istanbulNow();
    const prev = (dow + 6) % 7;
    const c = BRANCH.carsi;
    const carsi = min >= c.opens && min < c.closes
      ? { open: true, until: c.closeTxt }
      : { open: false, next: (min >= c.closes ? 'yarın ' : 'bugün ') + c.openTxt };
    const o = BRANCH.oy;
    let oy;
    if (min >= o.opens) oy = { open: true, until: (dow === 5 || dow === 6) ? o.lateTxt : o.closeTxt };
    else {
      const late = prev === 5 || prev === 6;
      oy = min < (late ? o.lateCloses : o.closes)
        ? { open: true, until: late ? o.lateTxt : o.closeTxt }
        : { open: false, next: 'bugün ' + o.openTxt };
    }
    return { carsi, oy };
  }
  const cap = (s) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

  function renderHours() {
    const s = status();
    const anyOpen = s.carsi.open || s.oy.open;
    body.classList.toggle('is-night', !anyOpen);

    const pill = $('[data-status-pill]');
    pill.classList.toggle('is-open', anyOpen);
    $('[data-status-short]').textContent = anyOpen ? 'açık' : 'kapalı';
    const small = anyOpen ? (s.oy.open ? s.oy.until : s.carsi.until) : `${BRANCH.oy.openTxt} açılır`;
    $('[data-status-until]').textContent = small;
    pill.setAttribute('aria-label', `${anyOpen ? 'Şu an açık' : 'Şu an kapalı'}, ${small}. Kapılara git.`);

    let line;
    if (s.carsi.open && s.oy.open) line = 'şu an iki kapı da açık';
    else if (s.oy.open) line = `şu an Osman Yılmaz açık · ${s.oy.until}`;
    else if (s.carsi.open) line = `şu an Çarşı açık · ${s.carsi.until}`;
    else line = `iki kapı da kapalı · ${BRANCH.oy.openTxt} açılıyoruz`;
    $('[data-status-line]').textContent = line;
    $('.kapak__status .dot').classList.toggle('is-open', anyOpen);

    $$('.door').forEach((door) => {
      const b = s[door.dataset.branch];
      door.classList.toggle('is-open', b.open);
      $('[data-door-sign]', door).innerHTML = b.open ? `<b>açık</b>${b.until}` : `<b>kapalı</b>${b.next.replace(/^(bugün|yarın) /, '')} açılır`;
      $('[data-door-now]', door).innerHTML = b.open
        ? `<b>şu an açık</b>${cap(b.until)} seni bekliyor.`
        : `<b>şu an kapalı</b>${cap(b.next)} açılıyor. İçerisi uyuyor.`;
      $('.mascot', door)?.classList.toggle('is-asleep', !b.open);
    });
    $$('[data-toc-now]').forEach((el) => {
      const b = s[el.dataset.tocNow];
      el.textContent = b.open ? `şu an açık, ${b.until}` : `şu an kapalı, ${b.next} açılıyor`;
    });
    const nowline = $('[data-toc-nowline]');
    if (nowline) {
      nowline.textContent = s.carsi.open && s.oy.open ? 'Şu an iki kapı da açık.'
        : s.oy.open ? `Şu an Osman Yılmaz açık, ${s.oy.until}.`
        : `Şu an iki kapı da kapalı. Osman Yılmaz ${s.oy.next} açılıyor.`;
    }

    // the main action always points at a door that is (or opens next)
    const target = s.oy.open ? 'oy' : s.carsi.open ? 'carsi' : 'oy';
    $$('[data-open-directions]').forEach((a) => {
      a.href = MAPS[target];
      $('[data-open-label]', a).textContent = anyOpen
        ? `yol tarifi · ${BRANCH[target].name} şu an açık`
        : `yol tarifi · ${BRANCH.oy.name} ${s.oy.next} açılıyor`;
      $('[data-open-text]', a).textContent = anyOpen ? 'Açık kapıya git' : 'Kapıya yol tarifi';
    });
    $$('[data-maps]').forEach((a) => { a.href = MAPS[a.dataset.maps]; });

    [rootSvg, finalMascot, cupMascot].forEach((m) => m && m.classList.toggle('is-asleep', !anyOpen));
  }
  renderHours();
  const tick = () => { renderHours(); setTimeout(tick, 60000 - (Date.now() % 60000) + 80); };
  setTimeout(tick, 60000 - (Date.now() % 60000) + 80);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderHours(); });

  /* ─── elements ────────────────────────────────────────────────── */
  const kapak = $('.kapak');
  const stage = $('.kapak__stage');
  const mascotBox = $('.kapak__mascot');
  const lid = $('.m-lid', rootSvg);
  const rootHeart = $('.m-heart', rootSvg);
  const inside = $('.kapak__inside');
  const insideImg = $('img', inside);
  const ring = $('.kapak__ring');
  const ringEl = $('ellipse', ring);
  const disc = $('.kapak__disc');
  const wmRoot = $('.wm__root');
  const wmRest = $('.wm__rest');
  const flip = $('.flip');
  const sl = $('.kapak__sl');
  const st = $('.kapak__status');
  const heart = $('#heart');
  const spineWord = $('.spine__word');
  const spineRoot = $('.spine__root');
  const cupbtn = $('.cupbtn');
  const kapris = $('.kapris');
  const kStage = $('.kapris__stage');
  const glazes = $$('.glaze i');
  const eclairs = $$('[data-eclair]');
  const fisLines = $$('.fis__list li');
  const kAfter = $('.kapris__after');
  const kova = $('[data-kova]');
  const words = $$('.kapis__w');
  const closeUp = $('.kapis__close');
  const box = $('[data-box]');
  const boxLid = $('.box__lid');
  const RIM = 0.355;   // real cup rim radius as a fraction of the kap-ici photo side
  const S_B = 2.3;     // how far the camera dives into the drawn cup

  const M = {};
  const pageTop = (el) => el.getBoundingClientRect().top + scrollY;

  function measure() {
    vw = innerWidth; vh = innerHeight;

    // KAPAK, read at rest
    mascotBox.style.transform = '';
    disc.style.transform = '';
    wmRoot.style.transform = '';
    const sr = stage.getBoundingClientRect();
    const mr = mascotBox.getBoundingClientRect();
    const dr = disc.getBoundingClientRect();
    const k = mr.width / 240;
    M.k = k;
    M.sw = stage.clientWidth;
    M.sh = stage.clientHeight;
    M.kapakTop = pageTop(kapak);
    M.kapakRange = Math.max(1, kapak.offsetHeight - M.sh);
    M.rim = { x: mr.left - sr.left + 120 * k, y: mr.top - sr.top + 116 * k, rx: 70 * k, ry: 13 * k };
    M.heart0 = { x: mr.left - sr.left + 120 * k, y: mr.top - sr.top + 25.5 * k, w: 48 * k };
    M.target = { x: M.sw / 2, y: Math.min(M.sh, vh) * 0.5 };
    M.Rmax = Math.hypot(M.sw, M.sh) / 2 + 40;
    M.Sbase = (M.rim.rx * S_B / RIM) * 1.32;
    insideImg.style.width = insideImg.style.height = `${M.Sbase}px`;
    mascotBox.style.transformOrigin = `${120 * k}px ${116 * k}px`;
    disc.style.transformOrigin = `${M.rim.x - (dr.left - sr.left)}px ${M.rim.y - (dr.top - sr.top)}px`;

    const wr = wmRoot.getBoundingClientRect();
    M.wm = { x: wr.left - sr.left, y: wr.top - sr.top, w: wr.width };
    const ar = spineRoot.getBoundingClientRect();
    M.spine = { x: ar.left, y: ar.top, w: ar.width };
    M.anchor = { x: ar.left + ar.width * 0.5, y: ar.top - ar.height * 0.12, w: Math.max(18, ar.height * 0.62) };

    M.chapters = $$('.ch').map((el) => ({ el, id: el.dataset.ch, suffix: el.dataset.suffix, top: pageTop(el) }));
    M.vessels = $$('[data-fill]').map((el) => ({ el, top: pageTop(el), h: el.offsetHeight }));
    M.kapris = { top: pageTop(kapris), range: Math.max(1, kapris.offsetHeight - kStage.offsetHeight), h: kapris.offsetHeight };
    const kp = $('.kapis');
    M.kapis = { top: pageTop(kp), h: kp.offsetHeight };
    M.box = { top: pageTop(box), h: box.offsetHeight };
    if (finalMascot) {
      const fr = finalMascot.getBoundingClientRect();
      const fk = fr.width / 240;
      M.final = { top: fr.top + scrollY, x: fr.left + 120 * fk, y: fr.top + scrollY + 25.5 * fk, w: 48 * fk };
    }
    M.mascots = $$('.mascot').map((m) => {
      const r = m.getBoundingClientRect();
      const live = !!m.closest('.cupbtn, .kapak__stage');
      return { m, live, x: r.left + r.width / 2, y: r.top + scrollY + r.height * 0.6, w: r.width };
    });
    last = -1;
    kapakDone = -1;
    kick();
  }

  /* ─── the heart ───────────────────────────────────────────────── */
  function placeHeart(x, y, w, rot = 0) {
    heart.style.width = `${w}px`;
    heart.style.transform = `translate(${x - w / 2}px, ${y - w * 0.412}px) rotate(${rot}deg)`;
  }

  /* ─── spine suffix: every visible span leaves, one arrives ─────── */
  const suffixBox = $('.spine__suffix');
  let current = 'kapak';
  let lastChange = 0;
  let jumping = 0;
  function setChapter(id, suffix) {
    if (id === current) return;
    current = id;
    body.dataset.chapter = id;
    spineWord.setAttribute('aria-label', `KAP${suffix}, içindekiler`);
    const now = performance.now();
    const fast = reduce || now < jumping || now - lastChange < 260;
    lastChange = now;
    for (const s of [...suffixBox.children]) {
      if (s.classList.contains('out')) continue;
      if (fast) { s.remove(); continue; }
      s.classList.add('out');
      setTimeout(() => s.remove(), 700);
    }
    const nu = document.createElement('span');
    nu.textContent = suffix;
    if (!fast) nu.className = 'in';
    suffixBox.append(nu);
    if (!fast) requestAnimationFrame(() => requestAnimationFrame(() => nu.classList.remove('in')));
  }

  /* ─── KAPAK: the name becomes the spine, the camera falls into the cup ─ */
  let diving = false;
  let spineShown = true;
  function showSpine(on) {
    if (on === spineShown) return;
    spineShown = on;
    spineWord.style.setProperty('--spine-o', on ? '1' : '0');
    spineWord.style.visibility = on ? '' : 'hidden';
  }
  let kapakDone = -1;
  function kapakFrame(y) {
    const p = clamp((y - M.kapakTop) / M.kapakRange);
    const settled = p >= 1 ? 1 : p <= 0 ? 0 : -1;
    if (settled !== -1 && settled === kapakDone && y > M.kapakTop + M.kapakRange + vh) return p;
    kapakDone = settled;
    const stageTop = Math.min(0, M.kapakTop + M.kapakRange - y);
    const a = easeInOut(clamp((p - 0.02) / 0.2));
    const b = easeInOut(clamp((p - 0.16) / 0.32));
    const c = easeInOut(clamp((p - 0.46) / 0.4));

    const nowDiving = p > 0.012;
    if (nowDiving !== diving) {
      diving = nowDiving;
      kapak.classList.toggle('is-diving', diving);
      if (diving) flip.classList.add('is-b'); // the morph always lands on KAP
    }
    kapak.classList.toggle('is-inside', p > 0.9);
    rootSvg.classList.toggle('is-surprised', a > 0.12 && b < 0.9);

    // CUPİSTAN → KAP: the root flies into the corner and becomes the spine
    if (a > 0) {
      const sx = M.spine.x - M.wm.x;
      const sy = M.spine.y - (M.wm.y + stageTop);
      const sc = lerp(1, M.spine.w / M.wm.w, a);
      wmRoot.style.transform = `translate(${sx * a}px, ${sy * a}px) scale(${sc})`;
    } else wmRoot.style.transform = '';
    const landed = a >= 0.985;
    wmRoot.style.visibility = landed ? 'hidden' : '';
    showSpine(landed);
    wmRest.style.opacity = String(1 - clamp(a * 1.7));
    wmRest.style.transform = a > 0 ? `translateY(${a * 24}px)` : '';
    const fade = String(1 - clamp(a * 1.8));
    sl.style.opacity = fade; st.style.opacity = fade;
    sl.style.transform = st.style.transform = a > 0 ? `translateY(${-a * 26}px)` : '';

    // the lid lifts; the heart leaves it
    lid.style.transform = a > 0 ? `translate(${a * 70}px, ${-a * 460}px) rotate(${-a * 34}deg)` : '';
    lid.style.opacity = String(1 - clamp((a - 0.85) / 0.15));
    rootHeart.style.opacity = a > 0.001 ? '0' : '';

    // the camera dives: one uniform scale around the rim, no squash
    const R = M.rim;
    const s = 1 + (S_B - 1) * b;
    const tx = (M.target.x - R.x) * b, ty = (M.target.y - R.y) * b;
    const camera = b > 0 ? `translate(${tx}px, ${ty}px) scale(${s})` : '';
    mascotBox.style.transform = camera;
    disc.style.transform = camera;

    // the drawn rim tilts open into a real cup seen from above
    const cx = R.x + tx, cy = R.y + ty;
    const rxw = R.rx * s, ryw = lerp(R.ry, R.rx, b) * s;
    const rad = lerp(R.rx * S_B, M.Rmax, c);
    const ex = c > 0 ? rad : rxw, ey = c > 0 ? rad : ryw;
    const stroke = 6 * M.k * s;
    inside.style.opacity = String(clamp(b / 0.08));
    inside.style.clipPath = `ellipse(${Math.max(0, ex - stroke / 2)}px ${Math.max(0, ey - stroke / 2)}px at ${cx}px ${cy}px)`;
    const Sb = (R.rx * S_B) / RIM;
    const S = c > 0 ? lerp(Sb, Sb * 1.3, easeOut(c)) : rxw / RIM;
    const sy = c > 0 ? 1 : ryw / rxw;
    const k = S / M.Sbase;
    insideImg.style.transform = `translate(${cx - S / 2}px, ${cy - (S * sy) / 2}px) scale(${k}, ${k * sy})`;

    const ringR = c > 0 ? RIM * S : 0;
    ring.style.opacity = String(b > 0 ? 1 - clamp(c / 0.35) : 0);
    ringEl.setAttribute('cx', cx.toFixed(1));
    ringEl.setAttribute('cy', cy.toFixed(1));
    ringEl.setAttribute('rx', Math.max(0, (c > 0 ? ringR : rxw) - stroke / 2).toFixed(1));
    ringEl.setAttribute('ry', Math.max(0, (c > 0 ? ringR : ryw) - stroke / 2).toFixed(1));
    ringEl.setAttribute('stroke-width', stroke.toFixed(1));

    // the heart: from the cream to the A of KAP, on screen all the way
    if (a <= 0.001) heart.classList.remove('is-on');
    else if (p < 0.24) {
      heart.classList.add('is-on');
      const t = easeInOut(clamp((p - 0.02) / 0.2));
      const H = M.heart0;
      const hx = H.x, hy = H.y + stageTop;
      const ctx = Math.min(vw - 40, Math.max(hx, M.anchor.x) + vw * 0.22);
      const cty = Math.max(vh * 0.12, M.anchor.y + vh * 0.1);
      placeHeart(bezier(hx, ctx, M.anchor.x, t), bezier(hy, cty, M.anchor.y, t), lerp(H.w, M.anchor.w, t), Math.sin(t * Math.PI) * -24);
    }
    return p;
  }

  /* ─── KAPRİS: four éclairs land on one plate, the receipt prints ─ */
  let landedPrev = 0;
  let glazeIdx = -1;
  function setGlaze(i) {
    if (i === glazeIdx) return;
    glazeIdx = i;
    glazes.forEach((g, j) => g.classList.toggle('on', j === i));
    const col = eclairs[i].dataset.color;
    body.style.setProperty('--kbg-now', col);
    const light = i === 3;
    kStage.style.setProperty('--kink', light ? 'var(--kopuk)' : 'var(--bitter)');
    body.classList.toggle('ink-light', light);
  }
  function kaprisFrame(y) {
    const K = M.kapris;
    if (y + vh < K.top - 100 || y > K.top + K.h + 100) return;
    const pk = clamp((y - K.top) / K.range);
    let n = 0;
    eclairs.forEach((el, i) => {
      const start = 0.04 + i * 0.19;
      const d = clamp((pk - start) / 0.13);
      const land = clamp((pk - start - 0.13) / 0.05);
      const bump = d >= 1 ? Math.sin(Math.PI * land) : 0;
      el.style.setProperty('--ty', `${((1 - easeIn(d)) * -vh * 1.15).toFixed(1)}px`);
      el.style.setProperty('--spin', `${((1 - d) * (i % 2 ? -24 : 18)).toFixed(2)}deg`);
      el.style.setProperty('--sx', (1 + 0.05 * bump).toFixed(3));
      el.style.setProperty('--sy', (1 - 0.12 * bump).toFixed(3));
      if (d >= 1) n++;
      fisLines[i]?.classList.toggle('on', d >= 1);
    });
    if (n > landedPrev && !reduce) crumbsAt(eclairs[n - 1], 0.5, 7);
    landedPrev = n;
    setGlaze(Math.max(0, n - 1));
    kAfter.classList.toggle('on', n === 4 && pk > 0.86);
  }

  /* ─── KAPIŞ KAPIŞ: the bucket hangs from its handle ───────────── */
  let theta = 0, omega = 0;
  function kapisFrame(y, vel, dt) {
    const k = M.kapis;
    const near = !(y + vh < k.top - 200 || y > k.top + k.h + 200);
    if (near) {
      const t = clamp((y + vh - k.top) / (k.h + vh));
      words[0].style.setProperty('--x', `${((0.5 - t) * 14).toFixed(2)}vw`);
      words[1].style.setProperty('--x', `${((t - 0.5) * 36).toFixed(2)}vw`);
      closeUp.style.setProperty('--spin', `${(t * 120).toFixed(1)}deg`);
    }
    if (reduce) return false;
    const v = near ? vel * (16.7 / Math.max(8, dt)) : 0;
    omega += -v * 0.012 - theta * 0.045;
    omega *= 0.9;
    theta = clamp(theta + omega, -13, 13);
    if (Math.abs(theta) < 0.01 && Math.abs(omega) < 0.01) theta = omega = 0;
    kova.style.setProperty('--swing', `${theta.toFixed(2)}deg`);
    return theta !== 0 || omega !== 0;
  }

  /* ─── KAPAK OLSUN: the box lid shuts on the cake ──────────────── */
  let shut = false;
  function boxFrame(y) {
    const B = M.box;
    if (y + vh < B.top - 100 || y > B.top + B.h + vh) return;
    const t = easeInOut(clamp((vh * 0.78 - (B.top - y)) / (vh * 0.5)));
    boxLid.style.setProperty('--lid', `${lerp(-104, 0, t).toFixed(1)}deg`);
    const nowShut = t >= 0.999;
    if (nowShut !== shut) { shut = nowShut; box.classList.toggle('is-shut', shut); }
  }

  /* ─── main loop: runs only while something moves ──────────────── */
  let last = -1, lastY = scrollY, lastT = performance.now(), running = false, quietSince = 0;
  let cupShown = false;
  function frame(ts) {
    const y = scrollY;
    const dt = ts - lastT; lastT = ts;
    const vel = y - lastY; lastY = y;
    let busy = false;
    if (y !== last) {
      last = y;
      busy = true;
      const p = reduce ? clamp((y - M.kapakTop) / Math.max(1, kapak.offsetHeight * 0.5)) : kapakFrame(y);

      // chapter in the spine
      let ch = M.chapters[0];
      for (const c of M.chapters) if (c.top <= y + vh * 0.42) ch = c;
      if (!reduce && ch.id === 'kapak' && p > 0.55) ch = M.chapters[1];
      setChapter(ch.id, ch.suffix);

      // the heart rests on the A of KAP, then goes home to the last cup
      if (reduce || p >= 0.24) {
        const f = M.final;
        let q = 0;
        if (f) {
          const fy = f.y - y;
          q = clamp((vh * 0.95 - (f.top - y)) / (vh * 0.45));
          if (reduce) q = q > 0.5 ? 1 : 0;
          if (q > 0 && q < 1) {
            const t = easeInOut(q);
            const cx = Math.max(f.x, M.anchor.x) + vw * 0.12;
            const cy = lerp(M.anchor.y, fy, 0.35);
            placeHeart(bezier(M.anchor.x, cx, f.x, t), bezier(M.anchor.y, cy, fy, t), lerp(M.anchor.w, f.w, t), Math.sin(t * Math.PI) * 30);
          } else if (q === 0) placeHeart(M.anchor.x, M.anchor.y, M.anchor.w, 0);
        }
        const home = q >= 1;
        const show = !home && (!reduce || p >= 0.5);
        heart.classList.toggle('is-on', show);
        if (reduce) rootHeart.style.opacity = show || home ? '0' : '';
        if (finalMascot) $('.m-heart', finalMascot).style.opacity = home ? '1' : '0';
      }

      // vessels fill like cups under a tap
      for (const v of M.vessels) {
        const f = reduce ? 1 : easeOut(clamp((vh * 0.95 - (v.top - y)) / (v.h * 0.8)));
        v.el.style.setProperty('--fill', f.toFixed(3));
      }

      if (!reduce) { kaprisFrame(y); boxFrame(y); }

      // cup button: appears after the first scroll, steps aside while reading down
      if (!cupShown && y > 40) showCup();
      if (cupShown && !tocOpen) cupbtn.classList.toggle('is-away', vel > 4 && y > vh * 1.2 ? true : vel < -4 ? false : cupbtn.classList.contains('is-away'));
    }
    if (kapisFrame(y, vel, dt)) busy = true;
    if (busy) quietSince = ts;
    if (ts - quietSince < 500) requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    if (running) return;
    running = true;
    lastT = performance.now();
    requestAnimationFrame(frame);
  }
  addEventListener('scroll', kick, { passive: true });

  /* ─── cup button ──────────────────────────────────────────────── */
  function showCup() {
    if (cupShown) return;
    cupShown = true;
    cupbtn.classList.add('is-in');
    cupbtn.classList.add('hint');
    setTimeout(() => cupbtn.classList.remove('hint'), 3600);
  }
  setTimeout(showCup, 1600);

  /* ─── the wordmark flips between two languages ────────────────── */
  if (!reduce) setInterval(() => { if (current === 'kapak' && !diving && !document.hidden) flip.classList.toggle('is-b'); }, 2600);

  /* ─── eyes follow; a tap squishes ─────────────────────────────── */
  let px = 0, py = 0, eyesQueued = false;
  addEventListener('pointermove', (ev) => {
    px = ev.clientX; py = ev.clientY;
    if (eyesQueued) return;
    eyesQueued = true;
    requestAnimationFrame(() => {
      eyesQueued = false;
      for (const c of M.mascots || []) {
        let x = c.x, y = c.y - scrollY, w = c.w;
        if (c.live) { const r = c.m.getBoundingClientRect(); if (!r.width) continue; x = r.left + r.width / 2; y = r.top + r.height * 0.6; w = r.width; }
        if (y < -200 || y > vh + 200 || !w) continue;
        c.m.style.setProperty('--ex', clamp((px - x) / (w * 1.6), -1, 1).toFixed(2));
        c.m.style.setProperty('--ey', clamp((py - y) / (w * 1.6), -1, 1).toFixed(2));
      }
    });
  }, { passive: true });
  mascotBox.addEventListener('click', () => {
    mascotBox.classList.remove('is-squish');
    void mascotBox.offsetWidth;
    mascotBox.classList.add('is-squish');
  });

  /* ─── KAPRİS: one bite at a time, from the end you can see ────── */
  function crumbsAt(el, frac, count) {
    const r = el.getBoundingClientRect();
    const bx = r.left + r.width * frac, by = r.top + r.height / 2;
    const cols = [el.dataset.color, '#C08A55', '#8A5A3C', '#F8E3CA'];
    for (let i = 0; i < count; i++) {
      const c = document.createElement('i');
      c.className = 'crumb';
      c.style.left = `${bx + (Math.random() - 0.5) * r.width * 0.5}px`;
      c.style.top = `${by + (Math.random() - 0.5) * r.height * 0.4}px`;
      c.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
      c.style.setProperty('--dy', `${Math.random() * 110 + 50}px`);
      c.style.setProperty('--r', `${Math.random() * 360}deg`);
      c.style.setProperty('--s', `${Math.random() * 6 + 4}px`);
      c.style.setProperty('--c', cols[i % cols.length]);
      body.append(c);
      setTimeout(() => c.remove(), 950);
    }
  }
  const hint = $('[data-bite-hint]');
  if (hint) hint.textContent = hover ? 'tıkla: bir lokma' : 'dokun: bir lokma';
  eclairs.forEach((el) => {
    let n = 0;
    el.addEventListener('click', () => {
      const r = el.getBoundingClientRect();
      const w = el.offsetWidth, h = el.offsetHeight;
      const visFrac = clamp((Math.min(r.right, vw - 10) - r.left) / r.width, 0.35, 1);
      n = (n + 1) % 4;
      if (n === 0) {
        el.style.removeProperty('--bite-mask');
        el.animate([{ scale: '.6' }, { scale: '1' }], { duration: 600, easing: 'cubic-bezier(.34,1.72,.5,1)' });
        if (hint) hint.textContent = 'vitrinde daha var';
        return;
      }
      const rad = h * 0.34;
      const front = w * visFrac - n * 0.17 * w;
      const x = front + rad;
      const g = (yy) => `radial-gradient(circle ${rad}px at ${x}px ${yy}px, #0000 ${rad - 1}px, #000 ${rad}px)`;
      el.style.setProperty('--bite-mask', `linear-gradient(90deg, #000 ${x}px, #0000 ${x}px), ${g(h * 0.16)}, ${g(h * 0.5)}, ${g(h * 0.84)}`);
      if (hint) hint.textContent = n === 3 ? 'son lokma' : 'bir lokma daha?';
      if (!reduce) crumbsAt(el, clamp(front / w), 9);
    });
  });

  /* ─── KAPI: knock to look inside ──────────────────────────────── */
  $$('.door__leaf').forEach((leaf) => {
    leaf.addEventListener('click', () => {
      const door = leaf.closest('.door');
      const peek = door.classList.toggle('is-peek');
      const name = $('.door__name', door).textContent;
      leaf.setAttribute('aria-label', peek ? `${name} kapısını kapat` : `${name} kapısını aralayıp içeri bak`);
    });
  });

  /* ─── İÇİNDEKİLER: open the cup ───────────────────────────────── */
  const toc = $('#icindekiler');
  toc.hidden = true;
  const outside = [$('main'), $('.band'), $('.spine'), $('.skip')];
  let tocOpen = false, opener = null;
  const focusables = () => [...$$('a[href], button', toc), cupbtn].filter((e) => !e.hidden && e.offsetParent !== null);
  function openToc(src) {
    const r = (src && src.getBoundingClientRect().width ? src : $('.cupbtn__cup')).getBoundingClientRect();
    toc.style.setProperty('--cx', `${r.left + r.width / 2}px`);
    toc.style.setProperty('--cy', `${r.top + r.height * 0.4}px`);
    opener = document.activeElement;
    toc.hidden = false;
    void toc.offsetWidth;
    toc.classList.add('is-open');
    tocOpen = true;
    cupbtn.classList.add('is-in');
    cupbtn.classList.remove('is-away');
    [cupbtn, spineWord].forEach((b) => b.setAttribute('aria-expanded', 'true'));
    outside.forEach((el) => el && (el.inert = true));
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => $('[data-toc-close]').focus({ preventScroll: true }), reduce ? 0 : 280);
  }
  function closeToc(then) {
    if (!tocOpen) return;
    tocOpen = false;
    toc.classList.remove('is-open');
    [cupbtn, spineWord].forEach((b) => b.setAttribute('aria-expanded', 'false'));
    outside.forEach((el) => el && (el.inert = false));
    document.documentElement.style.overflow = '';
    let done = false;
    const finish = () => { if (done || tocOpen) return; done = true; toc.hidden = true; if (then) then(); else opener?.focus?.({ preventScroll: true }); };
    toc.addEventListener('transitionend', (e) => { if (e.propertyName === 'clip-path') finish(); }, { once: true });
    setTimeout(finish, reduce ? 0 : 820);
  }
  cupbtn.addEventListener('click', () => (tocOpen ? closeToc() : openToc(cupbtn)));
  spineWord.addEventListener('click', () => (tocOpen ? closeToc() : openToc(spineWord)));
  $('[data-toc-close]').addEventListener('click', () => closeToc());
  addEventListener('keydown', (e) => {
    if (!tocOpen) return;
    if (e.key === 'Escape') { closeToc(); return; }
    if (e.key === 'Tab') {
      const f = focusables();
      const first = f[0], lastF = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastF.focus(); }
      else if (!e.shiftKey && document.activeElement === lastF) { e.preventDefault(); first.focus(); }
    }
  });
  $$('a[href^="#"]', toc).forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    closeToc(() => goTo(id));
  }));
  function goTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = id === 'kapak' ? 0 : pageTop(el);
    jumping = performance.now() + 1400;
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', `#${id}`);
    const h = el.querySelector('h1, h2');
    if (h) { h.tabIndex = -1; setTimeout(() => h.focus({ preventScroll: true }), reduce ? 0 : 900); }
  }
  // in-page links outside the TOC (status pill) jump instantly in the spine too
  $$('a[href^="#"]').forEach((a) => { if (!toc.contains(a)) a.addEventListener('click', () => { jumping = performance.now() + 1400; }); });

  /* ─── off-screen loops sleep ──────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting)), { rootMargin: '200px 0px' });
    $$('.ch, .band').forEach((s) => io.observe(s));
  }

  /* ─── boot ────────────────────────────────────────────────────── */
  if (reduce) {
    eclairs.forEach((el) => { el.style.setProperty('--ty', '0px'); el.style.setProperty('--spin', '0deg'); });
    fisLines.forEach((l) => l.classList.add('on'));
    setGlaze(0);
    kAfter.classList.add('on');
  } else {
    showSpine(false);
  }
  measure();
  let rT;
  const remeasure = () => { clearTimeout(rT); rT = setTimeout(measure, 120); };
  addEventListener('resize', remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
  document.fonts?.ready.then(measure);
  addEventListener('load', measure);
  if (location.hash && location.hash.length > 1) jumping = performance.now() + 1400;
})();
