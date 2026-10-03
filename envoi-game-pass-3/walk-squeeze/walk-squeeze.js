// walk-squeeze.js: the Wilderness Walk Squeeze page (walk-squeeze.html). Io walks Chris's example wilderness painting
// with the game's own field (src/game/field.js) and her painted walk (src/walk/painted-io.js), set as src/game/game.js
// sets them: 52 map px tall, 15% of the screen's shorter side, 1.7 of her heights a second. The arrow keys, WASD, the
// d-pad or a tap walk her. The painting under her swaps live between its squeezed versions (versions.js, made and
// measured by make-versions.mjs); Closer brings the camera twice as close; pressing and holding Show the original flicks
// back to the painting as he sent it. Needs pixel-io.js, painted-io.js, sprites.js, field.js and versions.js first.
// window.__squeeze is for checking the page from a script.
(function () {
  'use strict';
  const V = window.SQUEEZE.versions, byId = Object.fromEntries(V.map((v) => [v.id, v]));
  const ORIGINAL = 'original', FIRST = 'a75l', PICK = 'a100xl'; // FIRST: the town maps' choice, where the page opens
  const $ = (id) => document.getElementById(id);
  function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  // the page's own pictures are "./img/...", beside the page; the game's (her walk) are "art/...", from the repo's root.
  // In the built page every one is already a data: address.
  const src = (p) => (p.startsWith('data:') || p.startsWith('./') ? p : '../../' + p);
  const kb = (v) => Math.round(v.bytes / 1024), mb12 = (v) => (v.bytes * 12 / 1048576).toFixed(2), mem = (v) => (v.px[0] * v.px[1] * 4 / 1048576).toFixed(1);
  const pct = (x) => Math.round(x * 100) + '%';
  const tagOf = (v) => (v.id === PICK ? 'My pick' : v.tag);

  // ---------- the example scene, traced for walking ----------
  // In the paintings' own 1536 x 1024 map pixels, whatever size the picture ships at (field.js scales it to fit). A loose
  // trace of the painted dirt: the main path from the top of the painting to the bottom, and its branch west to the oak.
  const SCENE = {
    name: 'The wild path',
    src: byId[ORIGINAL].src, // the WebP every browser shows; the chosen version is swapped in once it's ready
    start: [788, 650],
    walk: [
      // the main path; it starts 60 px down so her head stays on the painting at the top
      [[781, 60], [852, 60], [861, 80], [875, 112], [866, 144], [865, 176], [855, 208], [847, 240], [855, 272], [879, 304], [905, 336],
        [941, 368], [958, 400], [955, 432], [968, 464], [961, 496], [966, 528], [924, 560], [890, 592], [855, 624], [821, 656], [817, 688],
        [807, 720], [803, 752], [820, 784], [835, 816], [855, 848], [857, 880], [846, 912], [846, 944], [860, 976], [862, 1020], [708, 1020],
        [717, 976], [728, 944], [722, 912], [721, 880], [715, 848], [702, 816], [704, 784], [690, 752], [693, 720], [692, 688], [715, 656],
        [731, 624], [777, 592], [823, 560], [830, 528], [856, 496], [867, 464], [856, 432], [828, 400], [776, 368], [775, 336], [763, 304],
        [758, 272], [769, 240], [763, 208], [776, 176], [780, 144], [780, 112], [785, 80]],
      // the branch, from the main path west to the oak's roots
      [[800, 580], [740, 582], [700, 568], [650, 550], [610, 528], [585, 532], [550, 544], [500, 540], [458, 536], [444, 520], [440, 496],
        [428, 482], [410, 486], [402, 506], [404, 536], [412, 562], [450, 578], [500, 582], [550, 588], [600, 578], [650, 594], [700, 612],
        [740, 626], [800, 632]],
    ],
    block: [], exits: [], people: [], spots: [],
  };

  const S = { v: FIRST, peek: false, closer: false, showWalk: location.hash === '#walk' };

  // ---------- how close the camera comes ----------
  // Chris's closeness (0.15): Io stands 15% as tall as the screen's shorter side. On a laptop the walk's box stands in
  // for a phone held sideways. On a phone held sideways the game fills the screen, so she is sized against the screen,
  // as the game would size her, though the box is a little shorter than the screen. Closer doubles it.
  const host = $('field-host');
  const sideways = window.matchMedia ? window.matchMedia('(orientation: landscape) and (max-height: 520px)') : { matches: false };
  let close = 0.15;
  function measure() {
    const r = host.getBoundingClientRect(), box = Math.min(r.width, r.height);
    if (box > 0) close = 0.15 * (sideways.matches ? Math.min(window.innerWidth, window.innerHeight) : box) / box;
  }
  measure();
  if (window.ResizeObserver) new ResizeObserver(measure).observe(host);
  window.addEventListener('resize', measure);

  // ---------- Io on foot, as in the game ----------
  const field = Field.create(host, {
    maps: { wild: SCENE }, src, speed: 110, zoom: 0.7, ioH: 52, paintedIo: makePaintedIo(src), pace: 1.7,
    get ioScreen() { return close * (S.closer ? 2 : 1); },
    get showWalk() { return S.showWalk; },
    onExit() {}, onEvent() {}, onTalk() {}, onSpot() {}, onEncounter() {}, onMenu() {},
  });
  field.load('wild', SCENE.start, 's');

  // ---------- every version, loaded and decoded up front, so a switch shows at once ----------
  const keep = [], ready = {};
  for (const v of V) {
    const im = new Image(); im.decoding = 'async'; im.src = src(v.src); keep.push(im);
    ready[v.id] = (im.decode ? im.decode() : new Promise((res, rej) => { im.onload = res; im.onerror = rej; })).then(() => true, () => false);
    ready[v.id].then((good) => { if (!good) unavailable(v.id); });
  }
  let want = null, shown = ORIGINAL;
  function show(id) {
    want = id;
    // field.setPicture swaps the painting under her in place, with no fade and no jump
    ready[id].then((good) => { if (good && want === id && shown !== id) { field.setPicture(src(byId[id].src)); shown = id; } });
  }

  // ---------- the bar's versions and the versions in detail ----------
  const buttons = [];
  for (const v of V) {
    const b = el('button', null, $('vseg')); b.type = 'button'; b.textContent = v.name;
    b.addEventListener('click', () => choose(v.id)); buttons.push([v.id, b]);
  }
  const maxBytes = Math.max(...V.map((v) => v.bytes));
  for (const v of V) {
    const b = el('button', 'opt' + (v.id === ORIGINAL ? ' ref' : ''), $('options')); b.type = 'button';
    const tag = tagOf(v);
    b.innerHTML = '<span class="head"><span class="name">' + v.name + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</span>' +
      '<span class="px">' + v.px[0] + ' × ' + v.px[1] + ' pixels</span><span class="px">' + v.fmt + (v.q ? ', quality ' + v.q : '') + '</span>' +
      (v.id === ORIGINAL ? '<span class="about">Every other version is measured against this one.</span>' : '') + '</span>' +
      '<span class="nums"><span class="kb">' + kb(v) + ' KB</span>' +
      '<span class="meter" aria-hidden="true"><i style="width:' + (v.bytes / maxBytes * 100).toFixed(1) + '%"></i></span>' +
      '<span class="row"><span>Detail kept</span><span>' + pct(v.detail) + '</span></span>' +
      '<span class="meter detail" aria-hidden="true"><i style="width:' + (v.detail * 100).toFixed(1) + '%"></i></span>' +
      '<span class="row"><span>12 scenes</span><span>' + mb12(v) + ' MB</span></span>' +
      '<span class="row"><span>Memory</span><span>' + mem(v) + ' MB</span></span></span>';
    b.addEventListener('click', () => choose(v.id)); buttons.push([v.id, b]);
  }
  // a browser that can't show AVIF keeps to the original
  function unavailable(id) {
    for (const [bid, b] of buttons) if (bid === id) { b.disabled = true; b.title = 'This browser can’t show this picture.'; }
    if (S.v === id) { S.v = ORIGINAL; render(); }
  }

  const viewer = $('viewer'), hold = $('hold'), closerBtn = $('closer'), label = $('label');
  function render() {
    const id = S.peek ? ORIGINAL : S.v, v = byId[id];
    show(id);
    label.innerHTML = '<b>' + v.name + '</b> · ' + v.px[0] + ' × ' + v.px[1] + ' · ' + v.fmt + ' · ' + kb(v) + ' KB' +
      (S.closer ? ' · closer, twice as big' : '') + (S.peek ? ' (holding)' : '');
    viewer.classList.toggle('peek', S.peek);
    for (const [bid, b] of buttons) b.setAttribute('aria-pressed', String(bid === S.v));
    closerBtn.setAttribute('aria-pressed', String(S.closer));
  }
  function choose(id) { if (byId[id]) { S.v = id; render(); } }
  function setCloser(on) { S.closer = !!on; render(); }
  function peek(on) { if (S.peek === on) return; S.peek = on; hold.classList.toggle('on', on); render(); }
  closerBtn.addEventListener('click', () => setCloser(!S.closer));
  hold.addEventListener('pointerdown', (e) => { e.preventDefault(); try { hold.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ } peek(true); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) hold.addEventListener(ev, () => peek(false));
  hold.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- the keyboard: the field walks her on the arrows and WASD; the page adds 1-9, C and Space ----------
  // These listen first (capturing at the window), so Space never reaches the game's action key, and Enter on a button
  // presses the button instead of being taken by the game.
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') { if (e.target.closest && e.target.closest('button')) e.stopPropagation(); return; }
    const n = e.key.length === 1 && e.key >= '1' && e.key <= '9' ? +e.key : 0;
    if (n && n <= V.length) { choose(V[n - 1].id); e.preventDefault(); }
    else if (e.key === 'c' || e.key === 'C') { setCloser(!S.closer); e.preventDefault(); }
    else if (e.code === 'Space' || e.key === ' ') { if (!e.repeat) peek(true); e.preventDefault(); e.stopPropagation(); }
  }, true);
  window.addEventListener('keyup', (e) => { if (e.code === 'Space' || e.key === ' ') { peek(false); e.preventDefault(); } }, true);
  window.addEventListener('blur', () => peek(false));

  render();
  window.__squeeze = { field, S, choose, setCloser, peek, ready, get shown() { return shown; } };
})();
