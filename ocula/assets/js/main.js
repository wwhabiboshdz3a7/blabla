/* Ocula : toutes les animations de la page, construites avec anime.js v4 (global `anime`). */
(() => {
  'use strict';

  const {
    animate,
    createTimeline,
    createTimer,
    createAnimatable,
    stagger,
    onScroll,
    splitText,
    scrambleText,
    spring,
    svg,
    utils,
  } = anime;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const el = (tag, cls) => Object.assign(document.createElement(tag), { className: cls });

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rootStyle = getComputedStyle(document.documentElement);
  const token = name => rootStyle.getPropertyValue(name).trim();
  const PALETTE = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'].map(token);
  const STAR = token('--star');
  const RULE = token('--rule');

  const frNumber = (n, dec = 0) => n.toFixed(dec).replace('.', ',');

  if (REDUCED) document.documentElement.classList.add('is-static');

  /* ------------------------------------------------------------------ télescope */

  // Six tubes emboîtés, du plus large (objectif) au plus fin (oculaire).
  const TUBES = [132, 114, 97, 80, 63, 46];
  const TUBE_LEN = 130;
  const RINGS = 6; // anneaux par tube, collerette comprise
  const RODS = 8; // génératrices par tube
  const STEP = 104; // écart entre deux tubes une fois déployés
  const REST = 0.5; // part du déploiement jouée par l'intro, le scroll fait le reste

  // Position z d'un tube quand le télescope est entièrement déployé, centrée sur 0.
  const zFull = i => -(i - (TUBES.length - 1) / 2) * STEP;

  function buildScope(root) {
    const segs = [];
    const inners = [];
    const rings = [];
    const glow = [];
    const rods = [];

    TUBES.forEach((radius, i) => {
      const col = PALETTE[i];
      const seg = el('div', 'seg');
      const inner = el('div', 'seg-inner');
      seg.append(inner);
      root.append(seg);

      for (let k = 0; k < RINGS; k++) {
        const ring = el('div', 'ring');
        ring.style.setProperty('--r', radius);
        ring.style.setProperty('--col', col);
        if (k === 0) ring.classList.add('is-collar');
        if (i === 0 && k === 0) ring.classList.add('is-glass');
        utils.set(ring, { z: TUBE_LEN / 2 - k * (TUBE_LEN / (RINGS - 1)) });
        inner.append(ring);
        rings.push(ring);
        if (k > 0) glow.push(ring);
      }

      for (let k = 0; k < RODS; k++) {
        const wrap = el('div', 'rod-wrap');
        wrap.style.transform = `rotateZ(${(k * 360) / RODS}deg) translateY(${radius}px) rotateY(90deg)`;
        const rod = el('div', 'rod');
        rod.style.setProperty('--len', TUBE_LEN);
        rod.style.setProperty('--col', col);
        wrap.append(rod);
        inner.append(wrap);
        rods.push(rod);
      }

      segs.push(seg);
      inners.push(inner);
    });

    return { segs, inners, rings, glow, rods };
  }

  const scopeRoot = $('#scope');
  const scope = buildScope(scopeRoot);
  const story = $('.story');
  const stage = $('.stage');
  const pos = $('.pos');
  const dolly = $('.dolly');
  const orient = $('.orient');

  // Orientations de la monture, en degrés.
  const ORIENT_HERO = { rotateX: 16, rotateY: -62, rotateZ: -22 };
  const ORIENT_PROFILE = { rotateX: -4, rotateY: -88, rotateZ: -8 };
  const ORIENT_SKY = { rotateX: 28, rotateY: -38, rotateZ: 14 };
  const ORIENT_AXIS = { rotateX: 0, rotateY: 0, rotateZ: 0 };

  utils.set(orient, ORIENT_HERO);

  function fitStage() {
    const w = innerWidth;
    const h = innerHeight;
    const fit = w < 760
      ? utils.clamp(Math.min(w / 820, h / 1100), 0.4, 0.62)
      : utils.clamp(Math.min(w / 1300, h / 860), 0.5, 1.05);
    stage.style.setProperty('--fit', fit.toFixed(3));
  }
  fitStage();
  addEventListener('resize', fitStage);

  /* ------------------------------------------------------------------ ciel étoilé */

  function createSky(canvas, { count, colored }) {
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let stars = [];

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(count * Math.min(1, (w * h) / (1440 * 900)) + count * 0.25);
      stars = Array.from({ length: n }, () => ({
        x: utils.random(-1, 1, 4),
        y: utils.random(-1, 1, 4),
        depth: utils.random(0.2, 1, 3),
        size: utils.random(0.4, 1.6, 2),
        phase: utils.random(0, 6.28, 2),
        color: colored && Math.random() < 0.18 ? utils.randomPick(PALETTE) : STAR,
      }));
    };

    // warp : 0 = ciel calme, 1 = étoiles étirées en traînées depuis le centre
    const draw = (time, warp = 0) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const reach = Math.max(cx, cy);
      for (const s of stars) {
        const px = cx + s.x * reach;
        const py = cy + s.y * reach;
        const twinkle = 0.55 + 0.45 * Math.sin(time * 0.0016 * s.depth + s.phase);
        ctx.globalAlpha = twinkle * (0.35 + s.depth * 0.65);
        ctx.fillStyle = s.color;
        ctx.strokeStyle = s.color;
        if (warp > 0.01) {
          const k = warp * warp * 0.5 * s.depth;
          ctx.lineWidth = s.size;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + (px - cx) * k, py + (py - cy) * k);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();
    addEventListener('resize', resize);
    return { draw, resize };
  }

  const sky = createSky($('.sky'), { count: 260, colored: true });
  let warp = 0;

  // Fond du panneau révélé : nébuleuse dessinée une seule fois.
  function paintDeep(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const blobs = [
      [0.22, 0.3, 0.5, PALETTE[5]],
      [0.78, 0.68, 0.55, PALETTE[0]],
      [0.6, 0.22, 0.35, PALETTE[4]],
      [0.3, 0.8, 0.4, PALETTE[2]],
    ];
    for (const [x, y, r, c] of blobs) {
      const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * Math.max(w, h));
      g.addColorStop(0, c + '2e');
      g.addColorStop(1, c + '00');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < 420; i++) {
      ctx.globalAlpha = utils.random(0.2, 1, 2);
      ctx.fillStyle = Math.random() < 0.15 ? utils.randomPick(PALETTE) : STAR;
      ctx.beginPath();
      ctx.arc(utils.random(0, w), utils.random(0, h), utils.random(0.3, 1.3, 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const deep = $('.deep');
  paintDeep(deep);
  addEventListener('resize', () => paintDeep(deep));

  /* ------------------------------------------------------------------ mode sans mouvement */

  if (REDUCED) {
    scope.segs.forEach((s, i) => utils.set(s, { z: zFull(i) * REST }));
    utils.set(pos, { '--shift': 1 });
    sky.draw(0);
  }

  /* ------------------------------------------------------------------ intro */

  const heroTitle = splitText('.hero-title', {
    words: { class: 'word', wrap: 'clip' },
    chars: { class: 'char' },
  });

  if (!REDUCED) {
    utils.set(scope.rings, { scale: 0 });
    utils.set(scope.rods, { scaleX: 0 });
    utils.set(scopeRoot, { rotateY: -150, rotateX: 40 });
    utils.set('.scroll-hint', { opacity: 0 });

    createTimeline({ defaults: { ease: 'out(4)' } })
      .add('.nav-inner > *', { opacity: [0, 1], y: [-14, 0], duration: 700, delay: stagger(70) }, 0)
      .add(scopeRoot, { rotateY: 0, rotateX: 0, duration: 2400, ease: 'inOut(3)' }, 0)
      .add(scope.rings, { scale: [0, 1], duration: 1000, delay: stagger(16, { from: 'center' }) }, 100)
      .add(scope.rods, { scaleX: [0, 1], duration: 900, delay: stagger(5) }, 500)
      .add(scope.segs, {
        z: (_, i) => zFull(i) * REST,
        duration: 1300,
        ease: 'outElastic(1, .7)',
        delay: stagger(80),
      }, 900)
      .add(heroTitle.chars, { y: ['110%', '0%'], duration: 1000, delay: stagger(14) }, 250)
      .add(['.hero .eyebrow', '.hero-lede', '.hero-actions'], {
        opacity: [0, 1],
        y: [24, 0],
        duration: 900,
        delay: stagger(110),
      }, 600)
      .add('.scroll-hint', { opacity: [0, 1], duration: 600 }, 1700)
      .call(startIdle, 1900);
  }

  // Animations d'ambiance qui tournent en continu une fois le télescope monté.
  function startIdle() {
    animate(scope.glow, {
      opacity: [0.2, 0.85],
      duration: 900,
      delay: stagger(28),
      loop: true,
      alternate: true,
      ease: 'inOut(2)',
    });
    animate('.bob', {
      y: [-10, 10],
      rotateZ: [-1.5, 1.5],
      duration: 4200,
      loop: true,
      alternate: true,
      ease: 'inOut(2)',
    });
    animate('.scroll-dot', {
      y: [0, 6],
      duration: 700,
      loop: true,
      alternate: true,
      ease: 'inOut(2)',
    });
  }

  // La monture suit doucement le pointeur.
  if (!REDUCED) {
    const tilt = createAnimatable('.tilt', { rotateX: 900, rotateY: 900, ease: 'out(3)' });
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      tilt.rotateY((e.clientX / innerWidth - 0.5) * 16);
      tilt.rotateX((e.clientY / innerHeight - 0.5) * -12);
    });
  }

  /* ------------------------------------------------------------------ scroll : mise au point */

  const PHASES = [
    { at: 0, label: 'Déployer', text: "Six tubes glissent l'un hors de l'autre, chacun sur son propre ressort." },
    { at: 0.26, label: 'Pointer', text: 'La monture pivote sur trois axes. Le scroll pilote la timeline image par image.' },
    { at: 0.5, label: 'Aligner', text: "Les anneaux deviennent concentriques : vous regardez dans l'axe optique." },
    { at: 0.7, label: 'Plonger', text: "Travelling avant à travers les lentilles, jusqu'au ciel profond." },
  ];

  const hud = {
    index: $('.hud-index'),
    label: $('.hud-label'),
    caption: $('.hud-caption'),
    needle: $('.hud-needle'),
    p: $('.hud-p'),
    m: $('.hud-m'),
    phase: 0,
  };

  function updateHud(progress) {
    hud.needle.style.width = `${(progress * 100).toFixed(2)}%`;
    hud.p.textContent = Math.round(progress * 100);
    hud.m.textContent = Math.round(12 + progress * 228);
    let phase = 0;
    PHASES.forEach((p, i) => { if (progress >= p.at) phase = i; });
    if (phase !== hud.phase) {
      hud.phase = phase;
      hud.index.textContent = String(phase + 1).padStart(2, '0');
      animate(hud.label, { innerHTML: scrambleText({ text: PHASES[phase].label, chars: 'A-Z' }) });
      animate(hud.caption, {
        innerHTML: scrambleText({ text: PHASES[phase].text, revealRate: 160, settleDuration: 180, chars: 'shades' }),
      });
    }
  }

  if (!REDUCED) {
    createTimeline({
      defaults: { ease: 'linear' },
      autoplay: onScroll({ target: story, enter: 'top top', leave: 'bottom bottom', sync: 0.6 }),
      onUpdate: self => {
        updateHud(self.progress);
        warp = utils.clamp(utils.mapRange(self.progress, 0.68, 0.95, 0, 1), 0, 1);
      },
    })
      // 01 Déployer
      .add('.hero', { opacity: [1, 0], y: [0, -90], duration: 170 }, 0)
      .add('.scroll-hint', { opacity: 0, duration: 60 }, 0)
      .add(pos, { '--shift': [1, 0], duration: 260, ease: 'inOut(2)' }, 0)
      .add(scope.inners, {
        z: (_, i) => zFull(i) * (1 - REST),
        duration: 240,
        ease: 'inOut(2)',
        delay: stagger(8),
      }, 20)
      .add(orient, { ...ORIENT_PROFILE, duration: 260, ease: 'inOut(2)' }, 0)
      .add('.hud', { opacity: [0, 1], y: [20, 0], duration: 80 }, 140)
      // 02 Pointer
      .add(orient, { ...ORIENT_SKY, duration: 240, ease: 'inOut(2)' }, 260)
      // 03 Aligner
      .add(orient, { ...ORIENT_AXIS, duration: 200, ease: 'inOut(3)' }, 500)
      .add('.crosshair', { opacity: [0, 1], scale: [0.5, 1], duration: 120, ease: 'out(2)' }, 590)
      // 04 Plonger
      .add(dolly, { z: [0, 1250], duration: 300, ease: 'in(3)' }, 700)
      .add('.crosshair', { opacity: 0, scale: 3, duration: 140, ease: 'in(2)' }, 720)
      .add('.reveal', { '--lens': [0, 1], duration: 190, ease: 'in(2)' }, 760)
      .add('.hud', { opacity: 0, duration: 60 }, 850)
      .add('.reveal-inner > *', { opacity: [0, 1], y: [50, 0], duration: 100, delay: stagger(20), ease: 'out(3)' }, 860);
  }

  // Le ciel ne se redessine que lorsque la section est à l'écran.
  if (!REDUCED) {
    const skyTimer = createTimer({ onUpdate: self => sky.draw(self.currentTime, warp) });
    onScroll({
      target: story,
      onEnter: () => skyTimer.play(),
      onLeave: () => skyTimer.pause(),
    });
  }

  /* ------------------------------------------------------------------ apparitions au scroll */

  // Le contenu est visible par défaut : l'état de départ n'est posé qu'au moment de l'entrée.
  function onFirstView(target, play) {
    if (REDUCED) return;
    onScroll({ target, enter: 'bottom-=60 top', repeat: false, onEnter: play });
  }

  $$('.split').forEach(heading => {
    const { words } = splitText(heading, { words: { class: 'word', wrap: 'clip' } });
    onFirstView(heading, () => {
      animate(words, { y: ['105%', '0%'], duration: 1000, delay: stagger(60), ease: 'out(4)' });
    });
  });

  onFirstView('.grid', () => {
    animate('.card', { opacity: [0, 1], y: [60, 0], duration: 1000, delay: stagger(90), ease: 'out(4)' });
  });

  onFirstView('.steps', () => {
    animate('.step', { opacity: [0, 1], y: [40, 0], duration: 900, delay: stagger(120), ease: 'out(4)' });
  });

  /* ------------------------------------------------------------------ démo : animate() */

  const autoplayWhenVisible = target => (REDUCED ? false : onScroll({ target }));

  createTimeline({
    loop: true,
    alternate: true,
    defaults: { duration: 1500, ease: 'inOut(3)' },
    autoplay: autoplayWhenVisible('.demo-animate'),
  })
    .add('.shape-a', { left: ['12%', '88%'], scale: [1, 0.55] }, 0)
    .add('.shape-b', {
      left: ['12%', '88%'],
      rotate: [0, 360],
      borderRadius: ['6px', '17px'],
      backgroundColor: [PALETTE[1], PALETTE[4]],
    }, 120)
    .add('.shape-c', {
      left: ['12%', '88%'],
      borderWidth: ['3px', '9px'],
      borderColor: [PALETTE[2], PALETTE[5]],
    }, 240);

  /* ------------------------------------------------------------------ démo : stagger() */

  const COLS = 13;
  const ROWS = 7;
  const dotsRoot = $('.dots');
  const dots = Array.from({ length: COLS * ROWS }, () => dotsRoot.appendChild(el('span', 'dot')));

  function ripple(from) {
    animate(dots, {
      scale: [{ to: 1.8, duration: 220, ease: 'out(2)' }, { to: 1, duration: 700, ease: 'inOut(3)' }],
      backgroundColor: [{ to: PALETTE[1], duration: 220 }, { to: RULE, duration: 900 }],
      delay: stagger(42, { grid: [COLS, ROWS], from }),
    });
  }

  $('.demo-stagger').addEventListener('click', e => {
    const i = dots.indexOf(e.target);
    ripple(i >= 0 ? i : 'center');
  });

  createTimer({
    duration: 2800,
    loop: true,
    autoplay: autoplayWhenVisible('.demo-stagger'),
    onLoop: () => ripple(utils.random(0, dots.length - 1)),
    onBegin: () => ripple('center'),
  });

  /* ------------------------------------------------------------------ démo : createTimeline() */

  const eclipseBar = $('.eclipse-bar i');
  createTimeline({
    loop: true,
    loopDelay: 300,
    autoplay: autoplayWhenVisible('.demo-eclipse'),
    onUpdate: self => utils.set(eclipseBar, { scaleX: self.iterationProgress }),
  })
    .set('.eclipse-label', { opacity: 0 }, 0)
    .add('.demo-eclipse .moon', { x: [-190, 0], duration: 2200, ease: 'inOut(3)' }, 0)
    .add('.demo-eclipse .sun', { scale: [1, 0.96], duration: 400, ease: 'out(2)' }, 1900)
    .add('.corona', { opacity: [0, 1], scale: [0.9, 1.4], duration: 900, ease: 'out(3)' }, 1950)
    .add('.eclipse-label', { opacity: [0, 1], y: [8, 0], duration: 500, ease: 'out(3)' }, 2100)
    .add('.corona', { opacity: 0, scale: 1, duration: 500, ease: 'in(2)' }, 3600)
    .add('.eclipse-label', { opacity: 0, duration: 400 }, 3600)
    .add('.demo-eclipse .sun', { scale: 1, duration: 400 }, 3700)
    .add('.demo-eclipse .moon', { x: 190, duration: 2200, ease: 'inOut(3)' }, 3700);

  /* ------------------------------------------------------------------ démo : spring() */

  const springDemo = $('.demo-spring');
  const lens = $('.lens');
  const followers = $$('.trail', springDemo).map((t, i) =>
    createAnimatable(t, { x: 160 + i * 120, y: 160 + i * 120, ease: 'out(3)' })
  );
  const follow = (x, y) => followers.forEach(f => { f.x(x); f.y(y); });
  const syncFollowers = () => follow(utils.get(lens, 'x', false) || 0, utils.get(lens, 'y', false) || 0);
  const springBack = () => animate(lens, {
    x: 0,
    y: 0,
    ease: spring({ bounce: 0.55, duration: 650 }),
    onUpdate: syncFollowers,
  });
  let drag = null;
  let lastTouch = 0;

  lens.addEventListener('pointerdown', e => {
    const box = springDemo.getBoundingClientRect();
    drag = {
      cx: box.left + box.width / 2,
      cy: box.top + box.height / 2,
      mx: box.width / 2 - 36,
      my: box.height / 2 - 36,
    };
    lens.setPointerCapture(e.pointerId);
    utils.remove(lens);
  });

  lens.addEventListener('pointermove', e => {
    if (!drag) return;
    const x = utils.clamp(e.clientX - drag.cx, -drag.mx, drag.mx);
    const y = utils.clamp(e.clientY - drag.cy, -drag.my, drag.my);
    utils.set(lens, { x, y });
    follow(x, y);
  });

  const release = () => {
    if (!drag) return;
    drag = null;
    lastTouch = Date.now();
    springBack();
  };
  lens.addEventListener('pointerup', release);
  lens.addEventListener('pointercancel', release);

  // Au clavier, la lentille est lancée puis revient.
  const throwLens = () => {
    const box = springDemo.getBoundingClientRect();
    animate(lens, {
      x: utils.random(-(box.width / 2 - 50), box.width / 2 - 50),
      y: utils.random(-(box.height / 2 - 50), box.height / 2 - 50),
      duration: 380,
      ease: 'out(3)',
      onUpdate: syncFollowers,
      onComplete: springBack,
    });
  };
  lens.addEventListener('click', e => { if (e.detail === 0) throwLens(); });

  // Sans interaction, la démo se joue toute seule.
  createTimer({
    duration: 3200,
    loop: true,
    autoplay: autoplayWhenVisible(springDemo),
    onLoop: () => { if (!drag && Date.now() - lastTouch > 6000) throwLens(); },
  });

  /* ------------------------------------------------------------------ démo : SVG */

  const [cLine] = svg.createDrawable('.c-line');
  createTimeline({
    loop: true,
    loopDelay: 600,
    autoplay: autoplayWhenVisible('.demo-svg'),
  })
    .set('.c-stars circle', { scale: 0 }, 0)
    .set('.c-names text', { opacity: 0 }, 0)
    .set(cLine, { draw: '0 0' }, 0)
    .add('.c-stars circle', { scale: [0, 1], duration: 700, delay: stagger(140), ease: 'outElastic(1, .5)' }, 0)
    .add(cLine, { draw: ['0 0', '0 1'], duration: 1700, ease: 'inOut(2)' }, 250)
    .add('.c-names text', { opacity: [0, 1], translateY: [6, 0], duration: 500, delay: stagger(130), ease: 'out(2)' }, 900)
    .add(cLine, { draw: '1 1', duration: 1200, ease: 'inOut(2)' }, 3900)
    .add('.c-stars circle', { scale: 0, duration: 400, delay: stagger(90), ease: 'in(2)' }, 4300)
    .add('.c-names text', { opacity: 0, duration: 400 }, 4300);

  /* ------------------------------------------------------------------ démo : texte */

  const STARS = [
    ['Sirius', -1.46],
    ['Canopus', -0.74],
    ['Arcturus', -0.05],
    ['Véga', 0.03],
    ['Bételgeuse', 0.5],
    ['Altaïr', 0.76],
    ['Deneb', 1.25],
  ];
  const starName = $('.star-name');
  const starMag = $('.star-mag-v');
  let starIndex = 0;

  createTimer({
    duration: 2600,
    loop: true,
    autoplay: autoplayWhenVisible('.demo-text'),
    onLoop: () => {
      starIndex = (starIndex + 1) % STARS.length;
      const [name, mag] = STARS[starIndex];
      animate(starName, { innerHTML: scrambleText({ text: name, chars: 'A-Z', cursor: true }) });
      const from = { v: parseFloat(starMag.textContent.replace('−', '-').replace(',', '.')) };
      animate(from, {
        v: mag,
        duration: 700,
        ease: 'out(3)',
        onUpdate: () => { starMag.textContent = frNumber(from.v, 2).replace('-', '−'); },
      });
    },
  });

  /* ------------------------------------------------------------------ atelier */

  const lab = createTimeline({
    loop: true,
    loopDelay: 400,
    autoplay: false,
    onUpdate: self => syncLab(self),
  });

  const orbitPaths = svg.createDrawable('.orbit');
  const path = id => {
    const { translateX, translateY } = svg.createMotionPath(id);
    return { translateX, translateY };
  };

  // Io, Europe et Ganymède tournent en résonance 1:2:4, comme les vraies.
  lab
    .set('.moon-dot', { opacity: 0 }, 0)
    .add('.planet', { scale: [0, 1], duration: 900, ease: 'outElastic(1, .6)' }, 0)
    .add('.planet-glow', { scale: [0, 1], opacity: [0, 1], duration: 1200, ease: 'out(3)' }, 100)
    .add(orbitPaths, { draw: ['0 0', '0 1'], duration: 1100, delay: stagger(160), ease: 'inOut(2)' }, 500)
    .label('lunes', 1500)
    .add('.moon-dot', { opacity: [0, 1], duration: 300, delay: stagger(100) }, 'lunes')
    .add('.m1', { ...path('#orbit-1'), duration: 1000, loop: 3, ease: 'linear' }, 'lunes')
    .add('.m2', { ...path('#orbit-2'), duration: 2000, loop: 1, ease: 'linear' }, 'lunes')
    .add('.m3', { ...path('#orbit-3'), duration: 4000, ease: 'linear' }, 'lunes')
    .add('.planet-glow', { scale: [1, 1.3, 1], duration: 900, ease: 'inOut(2)' }, '+=0')
    .add(orbitPaths, { draw: '1 1', duration: 700, delay: stagger(100), ease: 'in(2)' }, '<<')
    .add('.moon-dot', { opacity: 0, duration: 300 }, '<<');

  const labPlay = $('#lab-play');
  const labScrub = $('#lab-scrub');
  const labTime = $('#lab-time');
  let labTouched = false;

  function syncLab(self) {
    labScrub.value = Math.round(self.iterationProgress * 1000);
    labTime.textContent = `${frNumber(self.iterationCurrentTime / 1000, 2)} s`;
  }

  function syncPlayButton() {
    labPlay.classList.toggle('is-paused', lab.paused);
    labPlay.setAttribute('aria-label', lab.paused ? 'Lecture' : 'Pause');
  }
  syncPlayButton();

  labPlay.addEventListener('click', () => {
    labTouched = true;
    if (lab.paused) lab.play(); else lab.pause();
    syncPlayButton();
  });

  $('#lab-restart').addEventListener('click', () => {
    labTouched = true;
    lab.restart();
    syncPlayButton();
  });

  $('#lab-reverse').addEventListener('click', () => {
    labTouched = true;
    lab.alternate();
    if (lab.paused) lab.play();
    syncPlayButton();
  });

  labScrub.addEventListener('input', () => {
    labTouched = true;
    lab.pause();
    lab.seek((lab.iterationDuration * labScrub.value) / 1000);
    syncPlayButton();
  });

  $$('.speed').forEach(btn => btn.addEventListener('click', () => {
    lab.speed = parseFloat(btn.dataset.speed);
    $$('.speed').forEach(b => b.classList.toggle('is-on', b === btn));
  }));

  if (!REDUCED) {
    onScroll({
      target: '.lab-panel',
      onEnter: () => { if (!labTouched) { lab.play(); syncPlayButton(); } },
      onLeave: () => { if (!labTouched) { lab.pause(); syncPlayButton(); } },
    });
  } else {
    lab.seek(lab.iterationDuration * 0.6);
  }

  /* ------------------------------------------------------------------ fiche technique */

  const ticks = $('.fs-ticks');
  for (let i = 0; i < 71; i++) ticks.append(document.createElement('i'));

  onFirstView('.focus-scale', () => {
    animate('.fs-ticks i', { scaleY: [0, 1], duration: 700, delay: stagger(12, { from: 'first' }), ease: 'out(3)' });
    animate('.fs-nums span', { opacity: [0, 1], y: [8, 0], duration: 600, delay: stagger(70, { start: 300 }), ease: 'out(3)' });
  });

  onFirstView('.plate', () => {
    $$('.count').forEach(node => {
      const dec = Number(node.dataset.dec || 0);
      const counter = { v: 0 };
      animate(counter, {
        v: Number(node.dataset.to),
        duration: 1600,
        ease: 'out(4)',
        onUpdate: () => { node.textContent = frNumber(counter.v, dec); },
      });
    });
    animate('.plate-row', { opacity: [0, 1], x: [-20, 0], duration: 700, delay: stagger(70), ease: 'out(3)' });
  });

  // Défilé infini : le contenu est doublé puis glisse de la moitié de sa largeur.
  const track = $('.marquee-track');
  [...track.children].forEach(node => {
    const clone = node.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.append(clone);
  });
  if (!REDUCED) {
    const marquee = animate(track, { x: ['0%', '-50%'], duration: 32000, ease: 'linear', loop: true });
    track.addEventListener('pointerenter', () => animate(marquee, { speed: 0.2, duration: 600 }));
    track.addEventListener('pointerleave', () => animate(marquee, { speed: 1, duration: 600 }));
  }

  /* ------------------------------------------------------------------ logo et pied de page */

  const logo = $('.logo');
  logo.addEventListener('pointerenter', () => {
    animate('.logo-mark i', {
      scale: [{ to: 1.35, duration: 200, ease: 'out(2)' }, { to: 1, ease: spring({ bounce: 0.6, duration: 500 }) }],
      delay: stagger(60, { reversed: true }),
    });
  });

  const wordmark = splitText('.wordmark', { chars: { class: 'char' } });
  wordmark.chars.forEach(ch => {
    ch.addEventListener('pointerenter', () => {
      animate(ch, {
        y: [{ to: '-18%', duration: 220, ease: 'out(3)' }, { to: '0%', ease: spring({ bounce: 0.65, duration: 700 }) }],
        rotate: [{ to: utils.random(-8, 8), duration: 220 }, { to: 0, ease: spring({ bounce: 0.5, duration: 700 }) }],
      });
    });
  });
  onFirstView('.wordmark', () => {
    animate(wordmark.chars, { y: ['70%', '0%'], opacity: [0, 1], duration: 1200, delay: stagger(70), ease: 'out(4)' });
  });

  /* ------------------------------------------------------------------ copier */

  const toastEl = $('.toast');
  function toast(message) {
    toastEl.textContent = message;
    createTimeline()
      .add(toastEl, { opacity: [0, 1], y: [12, 0], duration: 300, ease: 'out(3)' })
      .add(toastEl, { opacity: 0, y: -6, duration: 300, ease: 'in(2)' }, '+=1600');
  }

  $$('.copy').forEach(btn => {
    const state = $('.copy-state', btn);
    btn.addEventListener('click', () => {
      const done = ok => {
        if (!ok) {
          const range = document.createRange();
          range.selectNodeContents($('.copy-text', btn));
          const selection = getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
        toast(ok ? 'Copié dans le presse-papiers' : 'Texte sélectionné : copiez-le avec Ctrl+C');
        animate(state, { innerHTML: scrambleText({ text: ok ? 'Copié' : 'Prêt' }) });
        setTimeout(() => animate(state, { innerHTML: scrambleText({ text: 'Copier' }) }), 1800);
      };
      try {
        navigator.clipboard.writeText(btn.dataset.copy).then(() => done(true), () => done(false));
      } catch {
        done(false);
      }
    });
  });
})();
