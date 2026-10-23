/* Tempó concept: menu, price switch, opening hours, lunch tape and the walking mascot.
   GSAP 3.13 + ScrollTrigger (vendored). No scroll listeners: one ticker reads scrollY. */
(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap, ST = window.ScrollTrigger;
  if (G && ST) G.registerPlugin(ST);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  // Fixed Icelandic grouping (2.590): Intl('is-IS') falls back to 2,590 where the browser lacks the locale data.
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const ready = () => root.classList.add('ready');
  setTimeout(ready, 2600); // failsafe: never leave the hero hidden

  /* ---------- scroll velocity (shared by the tape and the walker) ---------- */
  const vel = { y: scrollY, v: 0, last: performance.now() };
  function sampleVelocity(now) {
    const dt = Math.max(1, now - vel.last) / 1000, y = scrollY;
    const raw = (y - vel.y) / dt;
    vel.v += (raw - vel.v) * Math.min(1, dt * 9);
    vel.y = y; vel.last = now;
    return dt;
  }

  /* ---------- logo and top links glide home ---------- */
  d.querySelectorAll('[data-top]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    closePanel(false);
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
  }));

  /* ---------- phone menu: focus the panel on a tap, the first link on a key ---------- */
  const burger = d.querySelector('.bar__burger'), panel = d.getElementById('valmynd');
  let lockY = 0;
  function lockScroll() { lockY = scrollY; Object.assign(d.body.style, { position: 'fixed', top: -lockY + 'px', left: '0', right: '0' }); }
  function unlockScroll() { Object.assign(d.body.style, { position: '', top: '', left: '', right: '' }); scrollTo(0, lockY); }
  function openPanel(e) {
    panel.hidden = false; panel.classList.add('is-open'); root.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Loka valmynd');
    lockScroll();
    const viaKey = e && e.detail === 0;
    (viaKey ? panel.querySelector('a') : panel).focus({ preventScroll: true });
  }
  function closePanel(restoreFocus) {
    if (panel.hidden) return;
    panel.hidden = true; panel.classList.remove('is-open'); root.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Opna valmynd');
    unlockScroll();
    if (restoreFocus) burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', e => panel.hidden ? openPanel(e) : closePanel(e.detail === 0));
  panel.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    closePanel(false);
    const section = d.querySelector(a.getAttribute('href'));
    const heading = section?.querySelector('h2') || section;
    if (!heading) return;
    // Layout offsets exclude the heading's scrubbed reveal transform.
    let top = 0;
    for (let el = heading; el; el = el.offsetParent) top += el.offsetTop;
    scrollTo({ top: top - parseFloat(getComputedStyle(heading).scrollMarginTop), behavior: reduce ? 'auto' : 'smooth' });
  });
  addEventListener('keydown', e => {
    if (panel.hidden) return;
    if (e.key === 'Escape') return closePanel(true);
    if (e.key !== 'Tab') return;
    const f = [burger, ...panel.querySelectorAll('a, button')];
    const i = f.indexOf(d.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  matchMedia('(min-width: 900px)').addEventListener('change', m => { if (m.matches) closePanel(false); });

  /* ---------- hero: the burger drops onto the starburst and gets smashed ---------- */
  const burst = d.querySelector('[data-burst]');
  if (burst) {
    const pts = [], n = 15;
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? 70 + ((i * 37) % 9) : 97 - ((i * 53) % 7);
      pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r * .9).toFixed(1));
    }
    burst.setAttribute('points', pts.join(' '));
  }
  function intro() {
    if (!G || reduce) { ready(); return; }
    const words = d.querySelectorAll('.hero__title .w > span');
    const burger = d.querySelector('.hero__burger'), bursty = d.querySelector('.hero__burst'), tag = d.querySelector('.hero__tag');
    const impact = .62;
    G.timeline({ onComplete: () => { ready(); G.set([words, burger, bursty, tag, '.hero__sub', '.hero__cta'], { clearProps: 'opacity,transform' }); waveSoon(400); } })
      .fromTo(words, { yPercent: 105 }, { yPercent: 0, duration: .62, ease: 'power3.out', stagger: .07 }, 0)
      .fromTo(burger, { opacity: 1, yPercent: -95, rotate: -9 }, { yPercent: 0, rotate: 0, duration: .44, ease: 'power2.in' }, impact - .44)
      .to(burger, { scaleY: .84, scaleX: 1.1, duration: .07, ease: 'power1.out' }, impact)
      .to(burger, { scaleY: 1, scaleX: 1, duration: .55, ease: 'elastic.out(1, .7)' }, impact + .07)
      .fromTo(bursty, { opacity: 1, scale: .35, rotate: -24 }, { scale: 1, rotate: 0, duration: .5, ease: 'back.out(2.4)' }, impact)
      .fromTo(tag, { opacity: 0, scale: .4, rotate: -14 }, { opacity: 1, scale: 1, rotate: 8, duration: .38, ease: 'back.out(3)' }, impact + .16)
      .fromTo(['.hero__sub', '.hero__cta'], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out', stagger: .08 }, .42);
  }

  /* ---------- lunch tape: drifts, speeds up with the scroll, turns round with it ---------- */
  const track = d.querySelector('[data-tape]');
  const tape = { x: 0, dir: 1, w: 0, on: false };
  if (track) {
    const unit = d.createElement('div');
    unit.className = 'tape__unit';
    unit.style.display = 'flex';
    while (track.firstChild) unit.appendChild(track.firstChild);
    track.appendChild(unit);
    const fill = () => {
      tape.w = unit.offsetWidth;
      while (track.children.length > 1 && track.lastChild !== unit) track.lastChild.remove();
      const need = Math.ceil((innerWidth * 1.2) / Math.max(1, tape.w)) + 1;
      for (let i = 0; i < need; i++) track.appendChild(unit.cloneNode(true));
    };
    fill();
    addEventListener('resize', fill);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { tape.on = es[0].isIntersecting; }).observe(track);
    else tape.on = true;
    const strip = track.parentElement;
    strip.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') tape.held = true; });
    strip.addEventListener('pointerleave', () => { tape.held = false; });
  }
  function tapeFrame(dt) {
    if (!track || reduce || !tape.on || !tape.w || tape.held) return;
    if (Math.abs(vel.v) > 40) tape.dir = vel.v > 0 ? 1 : -1;
    const speed = 46 + Math.min(Math.abs(vel.v), 2600) * .16;
    tape.x -= speed * tape.dir * dt;
    tape.x = ((tape.x % tape.w) - tape.w) % tape.w;
    track.style.transform = `translate3d(${tape.x.toFixed(1)}px,0,0)`;
  }

  /* ---------- menu: Stakur / Máltíð and the burger display ---------- */
  const sw = d.querySelector('.switch');
  const modeBtns = sw ? [...sw.querySelectorAll('[data-mode]')] : [];
  const note = d.querySelector('[data-mode-note]'), kidsNote = d.querySelector('[data-kids-note]');
  let mode = 'stakur', flipTimers = [];
  function setMode(m, focus) {
    if (m === mode) return;
    mode = m;
    sw.dataset.on = m;
    modeBtns.forEach(b => { const on = b.dataset.mode === m; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    note.classList.toggle('is-off', m !== 'maltid');
    kidsNote.hidden = m !== 'maltid';
    flipTimers.forEach(clearTimeout); // a fast second toggle cancels the first
    flipTimers = [];
    d.querySelectorAll('[data-p]').forEach((el, i) => {
      const val = fmt(el.dataset.p.split(',')[m === 'maltid' ? 1 : 0]);
      if (reduce) { el.textContent = val; return; }
      const delay = i * 24;
      flipTimers.push(setTimeout(() => { el.classList.remove('is-flip'); void el.offsetWidth; el.classList.add('is-flip'); }, delay));
      flipTimers.push(setTimeout(() => { el.textContent = val; }, delay + 130));
    });
  }
  if (sw) {
    note.classList.add('is-off');
    sw.dataset.on = 'stakur';
    modeBtns.forEach(b => { b.tabIndex = b.dataset.mode === 'stakur' ? 0 : -1; });
    sw.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });
    sw.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      setMode(mode === 'stakur' ? 'maltid' : 'stakur', true);
    });
  }
  const items = [...d.querySelectorAll('[data-burger]')];
  const photos = [...d.querySelectorAll('[data-photo]')];
  const cap = d.querySelector('[data-cap]');
  items.forEach(b => b.addEventListener('focus', () => {
    // Keyboard only: a tap that focuses a row (Android Chrome) must not jump the page.
    if (!matchMedia('(max-width: 899px)').matches || root.dataset.input === 'pointer') return;
    const photo = d.querySelector('.display'), r = b.getBoundingClientRect();
    root.style.setProperty('--display-height', photo.offsetHeight + 'px');
    if (r.top < photo.getBoundingClientRect().bottom + 12 || r.bottom > innerHeight)
      b.scrollIntoView({ block: 'start' });
  }));
  items.forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.burger;
    items.forEach(x => x.setAttribute('aria-pressed', x === b));
    photos.forEach(p => p.classList.toggle('is-on', p.dataset.photo === k));
    cap.textContent = b.querySelector('.item__name').textContent;
  }));

  /* ---------- opening hours: week chart on a 10:00 to 05:00 axis, live status ---------- */
  // Hours from tempoborgarar.is (Monday first). Close > 24 means after midnight.
  const HOURS = [null, [11, 21], [11, 21], [11, 21], [11, 28], [12, 28], [12, 21]];
  const NAMES = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];
  const ON_DAY = ['á mánudaginn', 'á þriðjudaginn', 'á miðvikudaginn', 'á fimmtudaginn', 'á föstudaginn', 'á laugardaginn', 'á sunnudaginn'];
  const A0 = 10, A1 = 29, pos = h => ((h - A0) / (A1 - A0)) * 100;
  const hh = h => String(Math.round(h % 24)).padStart(2, '0') + ':00';
  const week = d.querySelector('[data-week]');
  function nowReykjavik() {
    const t = new Date(); // Iceland keeps UTC all year
    return { day: (t.getUTCDay() + 6) % 7, h: t.getUTCHours() + t.getUTCMinutes() / 60 };
  }
  function renderWeek() {
    if (!week) return;
    const axis = week.querySelector('.week__axis');
    axis.innerHTML = [12, 15, 18, 21, 24, 27].map(h => `<span style="left:${pos(h)}%">${hh(h).slice(0, 2)}<i>:00</i></span>`).join('');
    const rows = d.createElement('div');
    rows.className = 'week__rows';
    rows.style.setProperty('--night-at', (pos(22) / 100).toFixed(4));
    rows.innerHTML = '<div class="week__night" aria-hidden="true"></div>' + HOURS.map((o, i) => {
      if (!o) return `<div class="day" data-day="${i}"><span class="day__name">${NAMES[i]}</span><span class="day__track"><span class="day__closed">Lokað</span></span></div>`;
      const late = o[1] > 22;
      const split = late ? `--split:${(((22 - o[0]) / (o[1] - o[0])) * 100).toFixed(1)}%` : '';
      return `<div class="day" data-day="${i}"><span class="day__name">${NAMES[i]}</span><span class="day__track"><span class="day__bar${late ? ' is-late' : ''}" style="left:${pos(o[0])}%;width:${pos(o[1]) - pos(o[0])}%;${split}"><span>${hh(o[0])}</span><span>${hh(o[1])}</span></span></span></div>`;
    }).join('');
    week.appendChild(rows);
    week.setAttribute('role', 'img');
    week.setAttribute('aria-label', 'Opnunartímar: mánudaga lokað, þriðjudaga til fimmtudaga 11:00 til 21:00, föstudaga 11:00 til 04:00, laugardaga 12:00 til 04:00, sunnudaga 12:00 til 21:00.');
  }
  function status() {
    const { day, h } = nowReykjavik();
    const prev = (day + 6) % 7, po = HOURS[prev], to = HOURS[day];
    let open = null;
    if (po && po[1] > 24 && h < po[1] - 24) open = { row: prev, close: po[1], at: h + 24 };
    else if (to && h >= to[0] && h < Math.min(to[1], 24)) open = { row: day, close: to[1], at: h };
    let text;
    if (open) text = `Opið núna, til ${hh(open.close)}`;
    else {
      let k = 0, nd = day, o = to;
      if (!(to && h < to[0])) { do { k++; nd = (day + k) % 7; o = HOURS[nd]; } while (!o && k < 7); }
      text = `Lokað. Opnum ${k === 0 ? 'í dag' : k === 1 ? 'á morgun' : ON_DAY[nd]} kl. ${hh(o[0])}`;
    }
    d.querySelectorAll('[data-status]').forEach(el => { el.textContent = text; });
    const live = d.querySelector('[data-live]');
    if (live) { live.classList.toggle('is-open', !!open); live.classList.toggle('is-closed', !open); live.querySelector('[data-live-text]').textContent = text; }
    if (!week) return;
    week.querySelectorAll('.day').forEach(r => r.classList.toggle('is-today', +r.dataset.day === day));
    week.querySelector('.day__now')?.remove();
    const row = open ? open.row : (h < 5 ? prev : day), at = open ? open.at : (h < 5 ? h + 24 : h);
    if (at >= A0 && at <= A1) {
      const m = d.createElement('span');
      m.className = 'day__now';
      m.style.left = pos(at) + '%';
      week.querySelector(`.day[data-day="${row}"] .day__track`)?.appendChild(m);
    }
  }
  renderWeek();
  status();
  setInterval(status, 60000);

  /* ---------- position-tied reveals (scrubbed, reversible, the trigger never moves) ---------- */
  function reveals() {
    if (!G || !ST || reduce) return;
    // The trigger is the container; only its children move.
    d.querySelectorAll('.menu__head, .hours__head, .board, .menu__more > *, .where__copy').forEach(el => {
      G.fromTo(el.children, { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: 'none', stagger: .06, scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 64%', scrub: true } });
    });
    const bars = d.querySelectorAll('.day__bar');
    G.fromTo(bars, { scaleX: 0 }, { scaleX: 1, ease: 'none', stagger: .08, scrollTrigger: { trigger: week, start: 'top 88%', end: 'top 50%', scrub: true } });
    const ph = d.querySelector('.where__photo img');
    if (ph) G.fromTo(ph, { scale: 1.22 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.where', start: 'top bottom', end: 'center center', scrub: true } });
  }

  /* ---------- the walker: gaurinn leaves the hero, walks the page at your tempo, lands in the footer ---------- */
  const walker = d.querySelector('[data-walker]');
  const W = { on: false, geo: null, face: 1, phase: 0, amp: 0, idle: 0, waved: true, body: null, flip: null, lines: null };
  function docRect(el) { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }
  function measure() {
    if (!W.on) return;
    const hero = d.querySelector('[data-guy-home="hero"]'), foot = d.querySelector('[data-guy-home="foot"]');
    const heroSec = d.querySelector('.hero');
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const restW = walker.offsetWidth, restH = walker.offsetHeight;
    const L1 = Math.max(200, heroSec.offsetHeight * .62);
    const L2 = Math.max(L1 + 10, max - innerHeight * .7);
    // The bar is his street: from just right of the logo to just left of the nav (or the menu button).
    const bar = d.querySelector('.bar').getBoundingClientRect();
    const logo = d.querySelector('.bar__logo').getBoundingClientRect();
    const nav = [...d.querySelectorAll('.bar__nav, .bar__burger')].map(e => e.getBoundingClientRect()).filter(r => r.width)[0];
    const x0 = logo.right + 22, x1 = Math.max(x0, (nav ? nav.left : innerWidth - 80) - 22 - restW);
    W.geo = { hero: docRect(hero), foot: docRect(foot), restW, restH, x0, x1, top: bar.bottom - restH - 5, max, L1, L2 };
  }
  function homeT(r, s, g) { return { x: r.x, y: r.y - s, k: r.w / g.restW }; }
  function restT(q, g) { return { x: mix(g.x0, g.x1, q), y: g.top, k: 1 }; }
  function walkFrame(dt) {
    if (!W.on || !W.geo) return;
    const g = W.geo, s = scrollY;
    let T, walking = 0;
    if (s <= g.L1) { const e = ease(clamp(s / g.L1)); const a = homeT(g.hero, s, g), b = restT(0, g); T = { x: mix(a.x, b.x, e), y: mix(a.y, b.y, e), k: mix(a.k, b.k, e) }; walking = e; }
    else if (s < g.L2) { T = restT((s - g.L1) / (g.L2 - g.L1), g); walking = 1; }
    else { const e = ease(clamp((s - g.L2) / (g.max - g.L2))); const a = restT(1, g), b = homeT(g.foot, s, g); T = { x: mix(a.x, b.x, e), y: mix(a.y, b.y, e), k: mix(a.k, b.k, e) }; walking = 1 - e; }
    walker.style.transform = `translate3d(${T.x.toFixed(1)}px,${T.y.toFixed(1)}px,0) scale(${T.k.toFixed(4)})`;

    const speed = Math.min(Math.abs(vel.v) / 1300, 2.4);
    const moving = Math.abs(vel.v) > 18;
    if (moving && walking > .5) { const f = vel.v > 0 ? 1 : -1; W.face += (f - W.face) * Math.min(1, dt * 14); }
    else if (walking <= .5) W.face += (1 - W.face) * Math.min(1, dt * 10);
    W.amp += ((moving ? 1 : 0) - W.amp) * Math.min(1, dt * (moving ? 10 : 5));
    W.phase += dt * (6 + 9 * speed) * (moving ? 1 : .4);
    const bob = Math.abs(Math.sin(W.phase)) * 7 * W.amp, tilt = Math.sin(W.phase) * 5 * W.amp;
    W.flip.style.transform = `scaleX(${W.face.toFixed(3)})`;
    W.body.style.transform = `translate3d(0,${(-bob).toFixed(2)}px,0) rotate(${tilt.toFixed(2)}deg)`;
    W.lines.style.opacity = (clamp((speed - .55) / 1.1) * walking).toFixed(3);

    if (moving) { W.idle = 0; W.waved = false; }
    else if (!W.waved && (W.idle += dt) > .65) { W.waved = true; wave(); }
  }
  function wave() {
    // The line art is one compound path, so the whole guy wiggles instead of just the hand.
    if (!W.body || !G) return;
    const inner = W.body.firstElementChild;
    G.timeline().to(inner, { rotate: -7, y: -6, duration: .14, ease: 'power2.out', transformOrigin: '50% 92%' })
      .to(inner, { rotate: 6, duration: .16, ease: 'power2.inOut', repeat: 2, yoyo: true })
      .to(inner, { rotate: 0, y: 0, duration: .22, ease: 'power2.out' });
  }
  function waveSoon(ms) { setTimeout(() => { if (W.on && scrollY < 40) wave(); }, ms); }
  async function startWalker() {
    if (W.on || reduce || !G || !walker) return;
    if (!W.body) {
      const svg = await fetch('assets/svg/mascot.svg').then(r => r.text()).catch(() => null);
      if (!svg) return;
      const flip = d.createElement('div');
      flip.className = 'walker__flip';
      flip.style.cssText = 'position:absolute;inset:0;transform-origin:50% 50%';
      flip.append(walker.querySelector('.walker__lines'), walker.querySelector('[data-walker-body]'));
      walker.appendChild(flip);
      W.flip = flip;
      W.body = flip.querySelector('[data-walker-body]');
      W.body.innerHTML = svg;
      W.lines = flip.querySelector('.walker__lines');
    }
    W.on = true;
    root.classList.add('walk');
    measure();
    walkFrame(0);
  }

  /* ---------- one ticker ---------- */
  function tick() {
    if (!panel.hidden) return; // the body is pinned while the phone menu is open
    const dt = Math.min(.05, sampleVelocity(performance.now()));
    tapeFrame(dt);
    walkFrame(dt);
  }
  let resizeT;
  const remeasure = () => { clearTimeout(resizeT); resizeT = setTimeout(() => { measure(); ST && ST.refresh(); }, 120); };
  addEventListener('resize', remeasure);
  addEventListener('pageshow', e => { if (e.persisted) remeasure(); });
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(d.body);

  function boot() {
    intro();
    reveals();
    startWalker();
    if (G) G.ticker.add(tick); else (function loop() { tick(); requestAnimationFrame(loop); })();
    d.fonts && d.fonts.ready.then(remeasure);
    addEventListener('load', remeasure);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
