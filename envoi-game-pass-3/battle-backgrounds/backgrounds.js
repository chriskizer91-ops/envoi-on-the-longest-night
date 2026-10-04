// backgrounds.js: pass three's Battle Backgrounds page, built on Colossus in the Meadow (../../living-battlefields/).
// Chris's combat backgrounds (art request 11 says which fight each one is for) are drawn far off behind the live 3D
// meadow, at any squeeze, so he can judge how small a background can be once 3D ground stands in front of it. Also the
// phone's two levers: the frame-rate cap and the picture's sharpness (its pixel ratio).
// Needs versions.js (window.BG_VERSIONS) and the fight page's hooks (window.__fight, once it is ready).
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const V = window.BG_VERSIONS || {};
  // which painting goes with which fight, matched to the world map (art request 11)
  const PLACES = [
    { id: '01', name: 'Wickhollow River Glade', use: 'Band 1 wilds, levels 1 to 5', used: true },
    { id: '02', name: 'Eldergrove Clearing', use: 'Band 3 wilds, levels 11 to 15', used: true },
    { id: '05', name: 'Frostmere Lake', use: 'Band 4 wilds, and the Colossus', used: true },
    { id: '03', name: 'Bogmire Lantern Banks', use: 'Gate 5: the great wraith', used: true },
    { id: '06', name: 'Ironhold High Pass', use: 'The finale, until the dead Moonwell comes', used: true },
    { id: '04', name: 'Misthollow Drowned City', use: 'Not used: the sunken ruins stay out of the story' },
    { id: '07', name: 'Sandspire Steppe', use: 'Not used: under mist all game' },
    { id: '08', name: 'Miragewell Oasis', use: 'Not used: under mist all game' },
    { id: '09', name: 'Hearthstone Shore', use: 'Not used: under mist all game' },
    { id: '10', name: 'Hearthsea Headland', use: 'Not used: under mist all game' },
  ].filter((p) => V[p.id]);
  const LEVELS = [
    { id: 'q60', name: 'Best', tip: 'Quality 60, full size: as good as it gets' },
    { id: 'q45', name: 'Gentle', tip: 'Quality 45, full size' },
    { id: 'q30', name: 'Maps', tip: 'Quality 30, full size: the walking maps’ squeeze' },
    { id: 'q20', name: 'Strong', tip: 'Quality 20, full size' },
    { id: 'q12', name: 'Harder', tip: 'Quality 12, full size' },
    { id: 'q6', name: 'Hardest', tip: 'Quality 6, full size' },
    { id: 'h15', name: 'Small', tip: '1024 pixels wide, quality 15' },
    { id: 't15', name: 'Tiny', tip: '724 pixels wide, quality 15' },
  ];
  const state = { place: '05', level: 'q30', code: false, holding: false };
  const KB = (b) => (b < 10240 ? (b / 1024).toFixed(1) : Math.round(b / 1024)) + ' KB';
  const MB = (b) => (b / 1048576).toFixed(2) + ' MB';
  function wbtn(t, small) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'wbtn';
    const s = document.createElement('span'); s.className = 't'; s.textContent = t; b.appendChild(s);
    if (small != null) { const m = document.createElement('small'); m.textContent = small; b.appendChild(m); }
    return b;
  }

  // the pictures, loaded when first asked for
  const cache = {};
  function picture(place, level) {
    const k = place + level;
    if (!cache[k]) cache[k] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = V[place][level][0]; });
    return cache[k];
  }
  let shown = '';
  async function show() {
    const F = window.__fight; if (!F || !F.field) return;
    if (state.code) { shown = 'code'; F.field.usePainting(null); return; }
    const level = state.holding ? 'q60' : state.level, k = state.place + level;
    if (k === shown) return;
    try { const img = await picture(state.place, level); if (state.code) return; shown = k; F.field.usePainting(img); }
    catch (e) { $('bgRead').textContent = 'That picture didn’t load.'; }
  }

  function render() {
    for (const b of $('places').querySelectorAll('.wbtn')) b.setAttribute('aria-pressed', String(!state.code && b.dataset.id === state.place));
    for (const b of $('squeezeSeg').querySelectorAll('.wbtn')) b.setAttribute('aria-pressed', String(b.dataset.id === state.level));
    $('bgCode').setAttribute('aria-pressed', String(state.code));
    const p = PLACES.find((x) => x.id === state.place), lv = LEVELS.find((x) => x.id === state.level);
    const used = PLACES.filter((x) => x.used), set = used.reduce((s, x) => s + V[x.id][state.level][1], 0);
    // the four new paintings (art request 11) will weigh about what these do
    const each = set / used.length, eight = set + each * 4 - V['06'][state.level][1];
    const old = V[state.place].q60[1];
    $('bgRead').innerHTML = state.code
      ? '<b>The code’s own painting</b>: drawn when the page opens, so it costs nothing in the file.'
      : '<b>' + p.name + '</b> · ' + p.use + '<br><b>' + KB(V[state.place][state.level][1]) + '</b> at “' + lv.name + '” (' + lv.tip.toLowerCase()
        + '), against ' + KB(old) + ' at its best.<br>All eight of the game’s backgrounds at this squeeze: about <b>' + MB(eight)
        + '</b>; the nine old battle paintings take 2.21 MB.';
    const tag = $('tagDesc'); if (tag) tag.textContent = state.code ? 'The meadow painted in code' : 'At ' + p.name + ' \u00b7 ' + p.use;
  }

  function build() {
    for (const p of PLACES) {
      const b = wbtn(p.name, p.use); b.dataset.id = p.id; if (!p.used) b.classList.add('unused');
      b.addEventListener('click', () => { state.place = p.id; state.code = false; render(); show(); });
      $('places').appendChild(b);
    }
    for (const lv of LEVELS) {
      const b = wbtn(lv.name, KB(V[state.place][lv.id][1])); b.dataset.id = lv.id; b.title = lv.tip;
      b.addEventListener('click', () => { state.level = lv.id; render(); show(); });
      $('squeezeSeg').appendChild(b);
    }
    // the size under each squeeze button follows the painting picked
    const sizes = () => { for (const b of $('squeezeSeg').querySelectorAll('.wbtn')) b.querySelector('small').textContent = KB(V[state.place][b.dataset.id][1]); };
    $('places').addEventListener('click', sizes);
    const best = $('bgBest');
    const hold = (on) => { if (state.holding === on || state.code) return; state.holding = on; best.classList.toggle('held', on); show(); };
    best.addEventListener('pointerdown', (e) => { e.preventDefault(); best.setPointerCapture && best.setPointerCapture(e.pointerId); hold(true); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) best.addEventListener(ev, () => hold(false));
    best.addEventListener('contextmenu', (e) => e.preventDefault());
    $('bgCode').addEventListener('click', () => { state.code = !state.code; shown = ''; render(); show(); });

    // the phone's levers
    const F = window.__fight, base = Math.min(2, window.devicePixelRatio || 1);
    // 20 is gone: on Chris's phone it froze and went black (October 3); he keeps 30, as the game does
    for (const n of [24, 30, 60]) {
      const b = wbtn(String(n), n === 30 ? 'the game' : n === 60 ? 'smoothest' : 'easier'); b.dataset.n = n;
      b.addEventListener('click', () => { F.cap = n; for (const x of $('capSeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(+x.dataset.n === n)); });
      $('capSeg').appendChild(b);
    }
    for (const [k, name] of [[1, 'Full'], [0.75, '3/4'], [0.5, 'Half']]) {
      const b = wbtn(name, Math.round(base * k * 100) / 100 + '×'); b.dataset.k = k;
      b.addEventListener('click', () => {
        F.renderer.setPixelRatio(base * k); F.resize();
        for (const x of $('sharpSeg').querySelectorAll('.wbtn')) x.setAttribute('aria-pressed', String(+x.dataset.k === k));
      });
      $('sharpSeg').appendChild(b);
    }
    // the game's own: 30 frames a second, at 3/4 sharpness (Chris, October 3)
    $('capSeg').querySelector('[data-n="30"]').setAttribute('aria-pressed', 'true');
    $('sharpSeg').querySelector('[data-k="0.75"]').click();
    render(); show();
  }

  // wait for the fight page to paint its meadow and come up
  (function wait() { if (window.__fight && window.__fight.ready) build(); else setTimeout(wait, 200); })();
})();
