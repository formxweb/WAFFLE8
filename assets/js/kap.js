/* CUPISTAN · KAP'TAN KAPI'YA
 * One rAF loop reads scrollY and writes transforms / custom properties.
 * Layout is only read in measure() (load, resize, image decode).
 */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeBack = (t) => { const c = 1.45; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    // only one heart exists; copies wait for it
    svg.querySelector('.m-heart').style.opacity = '0';
    host.append(svg);
  });
  const mascots = $$('.mascot');
  const finalMascot = $('[data-final-mascot] .mascot');

  /* ─── hours: the cup lives on Istanbul time ───────────────────── */
  const BRANCH = {
    carsi: { name: 'Çarşı', opens: 750, closes: 1290, openTxt: "12:30'da", closeTxt: "21:30'a kadar" },
    oy: { name: 'Osman Yılmaz', opens: 600, closes: 60, lateCloses: 120, openTxt: "10:00'da", closeTxt: "01:00'e kadar", lateTxt: "02:00'ye kadar" },
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
      : { open: false, next: (min >= c.closes ? 'Yarın ' : 'Bugün ') + c.openTxt };
    const o = BRANCH.oy;
    let oy;
    if (min >= o.opens) oy = { open: true, until: (dow === 5 || dow === 6) ? o.lateTxt : o.closeTxt };
    else {
      const late = prev === 5 || prev === 6;
      oy = min < (late ? o.lateCloses : o.closes)
        ? { open: true, until: late ? o.lateTxt : o.closeTxt }
        : { open: false, next: 'Bugün ' + o.openTxt };
    }
    return { carsi, oy };
  }

  const MAPS = {
    carsi: 'https://www.google.com/maps/search/?api=1&query=Cupistan%20Hac%C4%B1halil%20%C3%87ar%C5%9F%C4%B1%20Gebze',
    oy: 'https://www.google.com/maps/search/?api=1&query=Cupistan%20%C4%B0lyas%20Uzuner%20Cd.%20No%3A15%2FA%20Gebze',
  };

  function renderHours() {
    const s = status();
    const anyOpen = s.carsi.open || s.oy.open;
    body.classList.toggle('is-night', !anyOpen);

    // spine pill
    const pill = $('[data-status-pill]');
    pill.classList.toggle('is-open', anyOpen);
    $('[data-status-short]').textContent = anyOpen ? 'açık' : 'kapalı';
    const until = s.oy.open ? s.oy.until : s.carsi.open ? s.carsi.until : "10:00'da";
    $('[data-status-until]').textContent = until;
    pill.setAttribute('aria-label', anyOpen ? `Şu an açık, ${until}. Kapılara git.` : `Şu an kapalı, ${until} açılıyor. Kapılara git.`);

    // opening line
    let line;
    if (s.carsi.open && s.oy.open) line = 'şu an iki kapı da açık';
    else if (s.oy.open) line = `şu an Osman Yılmaz açık · ${s.oy.until}`;
    else if (s.carsi.open) line = `şu an Çarşı açık · ${s.carsi.until}`;
    else line = `iki kapı da kapalı · ${s.oy.next.replace('Bugün ', '').replace('Yarın ', '')} açılıyoruz`;
    $('[data-status-line]').textContent = line;

    // doors
    $$('.door').forEach((door) => {
      const b = s[door.dataset.branch];
      door.classList.toggle('is-open', b.open);
      $('[data-door-sign]', door).textContent = b.open ? 'açık' : 'kapalı';
      $('[data-door-now]', door).innerHTML = b.open
        ? `<b>şu an açık</b>${b.until} seni bekliyor.`
        : `<b>şu an kapalı</b>${b.next} açılıyor. İçerisi uyuyor.`;
      const m = $('.mascot', door);
      if (m) m.classList.toggle('is-asleep', !b.open);
    });
    $$('[data-toc-now]').forEach((el) => {
      const b = s[el.dataset.tocNow];
      el.textContent = b.open ? `şu an açık, ${b.until}` : `şu an kapalı, ${b.next} açılıyor`;
    });

    // the main action always points at an open door
    const go = $('[data-open-directions]');
    const target = s.oy.open ? 'oy' : s.carsi.open ? 'carsi' : 'oy';
    go.href = MAPS[target];
    $('[data-open-label]', go).textContent = anyOpen ? `yol tarifi · ${BRANCH[target].name} şu an açık` : `yol tarifi · ${BRANCH.oy.name} ${s.oy.next.toLowerCase()} açılıyor`;
    const label = go.querySelector('span');
    label.lastChild.textContent = anyOpen ? 'Açık kapıya git' : 'Yolu şimdiden öğren';

    // the mascots sleep when every door is closed
    [rootSvg, finalMascot, $('.cupbtn .mascot')].forEach((m) => m && m.classList.toggle('is-asleep', !anyOpen));
  }
  renderHours();
  setInterval(renderHours, 60 * 1000);

  /* ─── measurement ─────────────────────────────────────────────── */
  const kapak = $('.kapak');
  const stage = $('.kapak__stage');
  const mascotBox = $('.kapak__mascot');
  const lid = $('.m-lid', rootSvg);
  const inside = $('.kapak__inside');
  const insideImg = $('img', inside);
  const ring = $('.kapak__ring');
  const slogan = $('.kapak__slogan');
  const disc = $('.kapak__disc');
  const heart = $('#heart');
  const spineRoot = $('.spine__root');
  const cupbtn = $('.cupbtn');
  const RIM = 0.355; // real cup rim radius as a fraction of the photo's side

  const M = { chapters: [], vessels: [], eclairs: [], bleed: null, kapis: null, olsun: null, final: null };

  const pageTop = (el) => el.getBoundingClientRect().top + scrollY;

  function measure() {
    vw = innerWidth; vh = innerHeight;

    // kapak geometry at rest
    mascotBox.style.transform = '';
    const sr = stage.getBoundingClientRect();
    const mr = mascotBox.getBoundingClientRect();
    const k = mr.width / 240;
    M.k = k;
    M.kapakTop = pageTop(kapak);
    M.kapakRange = Math.max(1, kapak.offsetHeight - stage.offsetHeight);
    M.rim = { x: mr.left - sr.left + 120 * k, y: mr.top - sr.top + 116 * k, rx: 70 * k, ry: 13 * k };
    M.heart0 = { x: mr.left - sr.left + 120 * k, y: mr.top - sr.top + 25 * k, w: 48 * k };
    M.rb = Math.max(M.rim.rx, Math.min(vw, vh) * 0.3);
    M.Sc = Math.max(vw, vh) * 1.04;
    M.Rmax = Math.hypot(vw, vh) / 2 + 30;
    insideImg.style.width = insideImg.style.height = `${M.Sc}px`;
    mascotBox.style.transformOrigin = `${120 * k}px ${116 * k}px`;

    const ar = spineRoot.getBoundingClientRect();
    M.anchor = { x: ar.left + ar.width * 0.5, y: ar.top - ar.height * 0.08, w: Math.max(18, ar.height * 0.62) };

    M.chapters = $$('.ch').map((el) => ({ el, id: el.dataset.ch, suffix: el.dataset.suffix, top: pageTop(el) }));
    M.vessels = $$('[data-fill]').map((el) => ({ el, top: pageTop(el), h: el.offsetHeight }));
    M.eclairs = $$('[data-eclair]').map((el) => ({ el, top: pageTop(el), h: el.offsetHeight, from: +el.dataset.from }));
    const bl = $('[data-bleed]');
    M.bleed = { el: bl, top: pageTop(bl), h: bl.offsetHeight };
    const kp = $('.kapis');
    M.kapis = { el: kp, top: pageTop(kp), h: kp.offsetHeight };
    const kr = $('.kapris');
    M.kapris = { el: kr, top: pageTop(kr), h: kr.offsetHeight };
    const ol = $('.olsun');
    M.olsun = { el: ol, top: pageTop(ol), h: ol.offsetHeight };
    if (finalMascot) {
      const fr = finalMascot.getBoundingClientRect();
      const fk = fr.width / 240;
      M.final = { top: fr.top + scrollY, x: fr.left + 120 * fk, y: fr.top + scrollY + 25 * fk, w: 48 * fk };
    }
    M.mascotCenters = mascots.map((m) => { const r = m.getBoundingClientRect(); return { m, x: r.left + r.width / 2, y: r.top + scrollY + r.height * 0.6, w: r.width }; });
    last = -1;
  }

  /* ─── heart ───────────────────────────────────────────────────── */
  function placeHeart(x, y, w, rot = 0) {
    heart.style.width = `${w}px`;
    heart.style.transform = `translate(${x - w / 2}px, ${y - w * 0.46}px) rotate(${rot}deg)`;
  }

  /* ─── spine suffix ────────────────────────────────────────────── */
  const suffixBox = $('.spine__suffix');
  let current = 'kapak';
  function setChapter(id, suffix) {
    if (id === current) return;
    current = id;
    body.dataset.chapter = id;
    const old = suffixBox.firstElementChild;
    const nu = document.createElement('span');
    nu.textContent = suffix;
    nu.className = 'in';
    suffixBox.append(nu);
    requestAnimationFrame(() => {
      old.classList.add('out');
      nu.classList.remove('in');
    });
    setTimeout(() => old.remove(), 700);
  }

  /* ─── kapak: lift the lid, fall into the cup ──────────────────── */
  let diving = false;
  function kapakFrame(y) {
    const p = clamp((y - M.kapakTop) / M.kapakRange);
    const stageTop = Math.min(0, M.kapakTop + M.kapakRange - y);
    const a = easeInOut(clamp((p - 0.03) / 0.2));
    const b = easeInOut(clamp((p - 0.18) / 0.3));
    const c = easeInOut(clamp((p - 0.46) / 0.42));

    const nowDiving = p > 0.03;
    if (nowDiving !== diving) { diving = nowDiving; kapak.classList.toggle('is-diving', diving); }
    kapak.classList.toggle('is-inside', p > 0.9);
    rootSvg.classList.toggle('is-surprised', a > 0.12 && b < 0.85);

    // lid flies, the heart leaves it
    lid.style.transform = a > 0 ? `translate(${a * 40}px, ${-a * 300}px) rotate(${-a * 26}deg)` : '';
    lid.style.opacity = String(1 - clamp((a - 0.6) / 0.4));
    $('.m-heart', rootSvg).style.opacity = a > 0.001 ? '0' : '';

    const h0 = M.heart0;
    if (a <= 0.001) {
      heart.classList.remove('is-on');
    } else {
      heart.classList.add('is-on');
      const t = easeInOut(clamp((p - 0.03) / 0.26));
      const sx = h0.x, sy = h0.y + stageTop;
      const ex = M.anchor.x, ey = M.anchor.y;
      const cx = lerp(sx, ex, 0.5) + vw * 0.08, cy = Math.min(sy, ey) - vh * 0.18;
      const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex;
      const hy = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey;
      placeHeart(x, hy, lerp(h0.w, M.anchor.w, t), Math.sin(t * Math.PI) * -28);
    }

    // the cup body tilts away under the rim
    const R = M.rim;
    const tx = vw / 2, ty = vh * 0.5;
    const cxp = lerp(R.x, tx, b), cyp = lerp(R.y, ty, b);
    mascotBox.style.transform = b > 0
      ? `translate(${cxp - R.x}px, ${cyp - R.y}px) scale(${1 + b * 0.15}, ${1 - b * 0.82})`
      : '';
    mascotBox.style.opacity = String(1 - clamp((b - 0.35) / 0.45));
    slogan.style.transform = a > 0 ? `translateY(${-a * vh * 0.22}px)` : '';
    slogan.style.opacity = String(1 - clamp(a * 1.3));
    disc.style.setProperty('--disc', String(1 + b * 0.5 + c * 0.6));

    // the rim becomes a real cup seen from above
    const stroke = 6 * M.k;
    const rX = lerp(R.rx, M.rb, b), rY = lerp(R.ry, M.rb, b);
    const rad = lerp(M.rb, M.Rmax, c);
    const ex2 = (c > 0 ? rad : rX) - stroke / 2;
    const ey2 = (c > 0 ? rad : rY) - stroke / 2;
    inside.style.opacity = String(clamp(b / 0.18));
    inside.style.clipPath = `ellipse(${ex2}px ${ey2}px at ${cxp}px ${cyp}px)`;
    const Sb = M.rb / RIM;
    const S = lerp(Sb, M.Sc, easeOut(c));
    const sy = c > 0 ? 1 : rY / rX;
    const sc = S / M.Sc;
    insideImg.style.transform = `translate(${cxp - S / 2}px, ${cyp - (S * sy) / 2}px) scale(${sc}, ${sc * sy})`;

    // the drawn rim traces the photographed rim, then lets go
    const ringR = c > 0 ? RIM * S : 0;
    const rw = c > 0 ? ringR : rX, rh = c > 0 ? ringR : rY;
    ring.style.opacity = String(b > 0 ? 1 - clamp(c / 0.3) : 0);
    ring.style.setProperty('--rw', `${stroke}px`);
    ring.style.width = `${(rw - stroke / 2) * 2}px`;
    ring.style.height = `${(rh - stroke / 2) * 2}px`;
    ring.style.transform = `translate(${cxp - rw + stroke / 2}px, ${cyp - rh + stroke / 2}px)`;

    cupbtn.classList.toggle('is-in', p > 0.86 || y > M.kapakTop + M.kapakRange);
    return p;
  }

  /* ─── kapris: background takes the glaze of the éclair in the middle ─ */
  let activeEclair = null;
  function eclairFrame(y) {
    let best = null, bestD = Infinity;
    for (const e of M.eclairs) {
      const top = e.top - y;
      const t = clamp((vh - top) / (vh * 0.6));
      e.el.style.setProperty('--e', String(reduce ? 1 : easeBack(t)));
      const mid = top + e.h / 2;
      const d = Math.abs(mid - vh * 0.5);
      if (top < vh && top + e.h > 0 && d < bestD) { bestD = d; best = e.el; }
    }
    const kr = M.kapris;
    const inView = y + vh > kr.top && y < kr.top + kr.h;
    if (!best && inView) best = M.eclairs[0].el;
    if (best && best !== activeEclair) {
      activeEclair = best;
      kr.el.style.setProperty('--kbg', best.dataset.color);
      kr.el.style.setProperty('--kink', best.dataset.ink);
      body.style.setProperty('--kbg-now', best.dataset.color);
      const light = best.dataset.ink.toUpperCase() !== '#3A2A22' && best.dataset.ink.toUpperCase() !== '#2F4338';
      body.classList.toggle('ink-light', light);
    }
  }

  /* ─── kapış kapış: the bucket hangs from its handle ───────────── */
  const kova = $('[data-kova]');
  const words = $$('.kapis__w');
  const closeUp = $('.kapis__close');
  let theta = 0, omega = 0, lastY = scrollY;
  function kapisFrame(y, vel) {
    const k = M.kapis;
    const t = clamp((y + vh - k.top) / (k.h + vh));
    if (y + vh < k.top - 200 || y > k.top + k.h + 200) return;
    words[0].style.setProperty('--x', `${(0.5 - t) * 70}vw`);
    words[1].style.setProperty('--x', `${(t - 0.5) * 70}vw`);
    closeUp.style.setProperty('--spin', `${t * 140}deg`);
    if (!reduce) {
      omega += -vel * 0.028 - theta * 0.045;
      omega *= 0.9;
      theta = clamp(theta + omega, -13, 13);
      kova.style.setProperty('--swing', `${theta.toFixed(2)}deg`);
    }
  }

  /* ─── main loop ───────────────────────────────────────────────── */
  let last = -1;
  function frame() {
    const y = scrollY;
    const vel = y - lastY;
    lastY = y;
    const moving = y !== last;
    if (moving || Math.abs(omega) > 0.01 || Math.abs(theta) > 0.01) {
      last = y;
      const p = reduce ? 1 : kapakFrame(y);

      // chapter in the spine
      let ch = M.chapters[0];
      for (const c of M.chapters) if (c.top <= y + vh * 0.42) ch = c;
      if (ch.id === 'kapak' && p > 0.6) ch = M.chapters[1];
      setChapter(ch.id, ch.suffix);

      // the heart rests on the A of KAP, then goes home to the last cup
      if (reduce || p >= 0.29) {
        const f = M.final;
        let q = 0;
        if (f) {
          const fy = f.y - y;
          q = clamp((vh * 0.98 - (f.top - y)) / (vh * 0.42));
          if (q > 0) {
            const t = easeInOut(q);
            const cx = lerp(M.anchor.x, f.x, 0.5) - vw * 0.12;
            const cy = Math.min(M.anchor.y, fy) + vh * 0.1;
            const x = (1 - t) * (1 - t) * M.anchor.x + 2 * (1 - t) * t * cx + t * t * f.x;
            const hy = (1 - t) * (1 - t) * M.anchor.y + 2 * (1 - t) * t * cy + t * t * fy;
            placeHeart(x, hy, lerp(M.anchor.w, f.w, t), Math.sin(t * Math.PI) * 30);
          } else {
            placeHeart(M.anchor.x, M.anchor.y, M.anchor.w, 0);
          }
        }
        const home = q >= 1;
        heart.classList.toggle('is-on', !home);
        if (finalMascot) $('.m-heart', finalMascot).style.opacity = home ? '1' : '0';
        finalMascot?.classList.toggle('has-heart', home);
      }

      // vessels fill like cups under a tap
      for (const v of M.vessels) {
        const top = v.top - y;
        const f = reduce ? 1 : easeOut(clamp((vh * 0.95 - top) / (v.h * 0.85)));
        v.el.style.setProperty('--fill', f.toFixed(3));
      }

      // the cream close-up drifts
      const b = M.bleed;
      if (b && y + vh > b.top && y < b.top + b.h) b.el.style.setProperty('--par', clamp((y + vh - b.top) / (b.h + vh)).toFixed(3));

      eclairFrame(y);
      kapisFrame(y, vel);

      const o = M.olsun;
      if (o && y + vh > o.top && y < o.top + o.h) o.el.style.setProperty('--stamp', `${((y - o.top) * 0.16) % 360}deg`);
    }
    requestAnimationFrame(frame);
  }

  /* ─── the slogan flips between two languages ──────────────────── */
  const flip = $('.flip');
  if (!reduce) setInterval(() => { if (current === 'kapak' && !document.hidden) flip.classList.toggle('is-b'); }, 2600);

  /* ─── eyes follow, a tap squishes ─────────────────────────────── */
  addEventListener('pointermove', (ev) => {
    for (const c of M.mascotCenters || []) {
      const cy = c.y - scrollY;
      if (cy < -200 || cy > vh + 200) continue;
      c.m.style.setProperty('--ex', clamp((ev.clientX - c.x) / (c.w * 1.6), -1, 1).toFixed(2));
      c.m.style.setProperty('--ey', clamp((ev.clientY - cy) / (c.w * 1.6), -1, 1).toFixed(2));
    }
  }, { passive: true });
  mascotBox.addEventListener('click', () => {
    mascotBox.classList.remove('is-squish');
    void mascotBox.offsetWidth;
    mascotBox.classList.add('is-squish');
  });

  /* ─── kapris: one bite at a time ──────────────────────────────── */
  $$('[data-eclair]').forEach((fig) => {
    const pill = $('.eclair__pill', fig);
    const hint = $('.eclair__hint', fig);
    let n = 0;
    pill.addEventListener('click', (ev) => {
      const r = pill.getBoundingClientRect();
      const w = pill.offsetWidth, h = pill.offsetHeight;
      n = (n + 1) % 4;
      if (n === 0) {
        pill.style.removeProperty('--bite-mask');
        pill.animate([{ transform: getComputedStyle(pill).transform + ' scale(.6)' }, { transform: getComputedStyle(pill).transform }], { duration: 600, easing: 'cubic-bezier(.34,1.72,.5,1)' });
        if (hint) hint.textContent = 'vitrinde daha var';
        return;
      }
      const rad = h * 0.34;
      const front = w - n * 0.17 * w;
      const x = front + rad;
      const g = (yy) => `radial-gradient(circle ${rad}px at ${x}px ${yy}px, #0000 ${rad - 1}px, #000 ${rad}px)`;
      pill.style.setProperty('--bite-mask', `linear-gradient(90deg, #000 ${x}px, #0000 ${x}px), ${g(h * 0.16)}, ${g(h * 0.5)}, ${g(h * 0.84)}`);
      if (hint) hint.textContent = n === 3 ? 'son lokma' : 'bir lokma daha?';
      if (reduce) return;
      // crumbs fall where the bite was
      const bx = r.left + (front / w) * r.width + 6;
      const by = r.top + r.height / 2;
      const cols = [fig.dataset.color, '#C08A55', '#8A5A3C', '#F8E3CA'];
      for (let i = 0; i < 9; i++) {
        const c = document.createElement('i');
        c.className = 'crumb';
        c.style.left = `${bx + (Math.random() - 0.5) * 20}px`;
        c.style.top = `${by + (Math.random() - 0.5) * h * 0.5}px`;
        c.style.setProperty('--dx', `${(Math.random() * 90 + 10) * (Math.random() < 0.7 ? 1 : -1)}px`);
        c.style.setProperty('--dy', `${Math.random() * 120 + 60}px`);
        c.style.setProperty('--r', `${Math.random() * 360}deg`);
        c.style.setProperty('--s', `${Math.random() * 6 + 4}px`);
        c.style.setProperty('--c', cols[i % cols.length]);
        body.append(c);
        setTimeout(() => c.remove(), 950);
      }
      ev.preventDefault();
    });
  });

  /* ─── kapı: knock to look inside ──────────────────────────────── */
  $$('.door__leaf').forEach((leaf) => {
    leaf.addEventListener('click', () => {
      const door = leaf.closest('.door');
      const peek = door.classList.toggle('is-peek');
      const name = $('.door__name', door).textContent;
      leaf.setAttribute('aria-label', peek ? `${name} kapısını kapat` : `${name} kapısını aç`);
    });
  });

  /* ─── İçindekiler: open the cup ───────────────────────────────── */
  const toc = $('#icindekiler');
  let lastFocus = null;
  function openToc() {
    const r = $('.cupbtn__cup').getBoundingClientRect();
    toc.style.setProperty('--cx', `${r.left + r.width / 2}px`);
    toc.style.setProperty('--cy', `${r.top + r.height * 0.35}px`);
    lastFocus = document.activeElement;
    toc.hidden = false;
    void toc.offsetWidth;
    toc.classList.add('is-open');
    cupbtn.setAttribute('aria-expanded', 'true');
    cupbtn.classList.add('is-in');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => $('a', toc)?.focus({ preventScroll: true }), 300);
  }
  function closeToc(then) {
    toc.classList.remove('is-open');
    cupbtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    setTimeout(() => { if (!toc.classList.contains('is-open')) toc.hidden = true; then?.(); }, reduce ? 0 : 520);
    if (!then) lastFocus?.focus?.({ preventScroll: true });
  }
  cupbtn.addEventListener('click', () => (toc.classList.contains('is-open') ? closeToc() : openToc()));
  $$('[data-toc-open]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openToc(); }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && toc.classList.contains('is-open')) closeToc(); });
  $$('a[href^="#"]', toc).forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    closeToc(() => {
      const el = document.getElementById(id);
      let top = id === 'kapak' ? 0 : pageTop(el);
      if (id === 'kap') top = M.kapakTop + M.kapakRange + 1;
      scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  }));

  /* ─── boot ────────────────────────────────────────────────────── */
  measure();
  if (reduce) { heart.classList.add('is-on'); cupbtn.classList.add('is-in'); }
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 120); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(measure, 120); }).observe(document.body);
  document.fonts?.ready.then(measure);
  addEventListener('load', measure);
  requestAnimationFrame(frame);
  setTimeout(() => cupbtn.classList.add('hint'), 1500);
  setTimeout(() => cupbtn.classList.remove('hint'), 5200);
})();
