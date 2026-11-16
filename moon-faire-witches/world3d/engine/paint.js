// paint.js: the small pictures a place is dressed with that the texture packs don't hold, painted in code in the
// paintings' colours: lit window panes, plank doors, the chapel's rose window, flower clusters, a lamp's halo, the
// stall's fruit and bread. Each returns a canvas. (They're only stand-ins too: a made texture can replace any of them.)
(function (G) {
  'use strict';
  const W3D = G.W3D = G.W3D || {};
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const R = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  const P = W3D.paint = {};
  // a lit window: warm panes with a brighter middle, dark lead between them, a wooden frame (arch: a round top)
  P.window = function (opt) {
    opt = opt || {};
    const c = cv(64, 96), g = c.getContext('2d');
    g.fillStyle = '#2a1a14'; g.fillRect(0, 0, 64, 96);
    const lit = !opt.dark, colour = !!opt.colour;
    const gr = g.createRadialGradient(32, 54, 4, 32, 50, 52);
    if (colour) { gr.addColorStop(0, '#ffd890'); gr.addColorStop(0.5, '#d07848'); gr.addColorStop(1, '#5a2850'); }
    else if (lit) { gr.addColorStop(0, '#fff0b8'); gr.addColorStop(0.55, '#ffbe62'); gr.addColorStop(1, '#c86a2a'); }
    else { gr.addColorStop(0, '#2a3048'); gr.addColorStop(1, '#141826'); }
    g.fillStyle = gr; g.fillRect(6, 6, 52, 84);
    if (colour) { const r = R(5); for (let i = 0; i < 40; i++) { g.fillStyle = ['rgba(90,140,220,.55)', 'rgba(220,60,60,.45)', 'rgba(250,210,90,.5)', 'rgba(80,190,120,.4)'][i % 4]; g.fillRect(6 + r() * 46, 6 + r() * 78, 7, 7); } }
    g.strokeStyle = '#1a0f0a'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(32, 6); g.lineTo(32, 90); g.moveTo(6, 48); g.lineTo(58, 48); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(6, 27); g.lineTo(58, 27); g.moveTo(6, 69); g.lineTo(58, 69); g.stroke();
    g.strokeStyle = '#4a3020'; g.lineWidth = 6; g.strokeRect(3, 3, 58, 90);
    return c;
  };
  // the chapel's round window of coloured glass
  P.rose = function () {
    const c = cv(128, 128), g = c.getContext('2d'), r = R(9);
    g.fillStyle = '#3a3440'; g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 58); gr.addColorStop(0, '#fff2c0'); gr.addColorStop(0.4, '#ffb050'); gr.addColorStop(1, '#a04838');
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.fill();
    const cols = ['#4a7ad8', '#d84a4a', '#f0c050', '#58b878', '#b060d0'];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.fillStyle = cols[k % 5]; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(64 + Math.cos(a) * 34, 64 + Math.sin(a) * 34, 12, 7, a, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1; g.strokeStyle = '#2a2430'; g.lineWidth = 3;
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(64 + Math.cos(a) * 14, 64 + Math.sin(a) * 14); g.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); g.stroke(); }
    g.beginPath(); g.arc(64, 64, 14, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(64, 64, 34, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 7; g.strokeStyle = '#5a5260'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.stroke();
    return c;
  };
  // a plank door with iron straps; alpha cuts its round top when arched
  P.door = function (opt) {
    opt = opt || {};
    const c = cv(64, 112), g = c.getContext('2d'), r = R(3);
    if (opt.arch) { g.beginPath(); g.moveTo(0, 112); g.lineTo(0, 32); g.arc(32, 32, 32, Math.PI, 0); g.lineTo(64, 112); g.closePath(); g.clip(); }
    const base = opt.colour || [92, 60, 40];
    for (let i = 0; i < 6; i++) { const k = 0.8 + r() * 0.35; g.fillStyle = 'rgb(' + base.map((v) => Math.round(v * k)).join(',') + ')'; g.fillRect(i * 64 / 6, 0, 64 / 6 + 1, 112); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * 64 / 6, 0, 1.5, 112); }
    g.fillStyle = 'rgba(20,16,18,.85)'; g.fillRect(0, 30, 64, 4); g.fillRect(0, 82, 64, 4);
    if (opt.double) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(31, 0, 2, 112); }
    g.fillStyle = '#c8a050'; g.beginPath(); g.arc(opt.double ? 38 : 50, 62, 2.6, 0, Math.PI * 2); g.fill();
    if (opt.double) { g.beginPath(); g.arc(26, 62, 2.6, 0, Math.PI * 2); g.fill(); }
    return c;
  };
  // a cluster of small flowers and leaves, cut out by alpha (one card of a bed or a bush)
  P.flowers = function (kind, seed) {
    const c = cv(128, 128), g = c.getContext('2d'), r = R(seed || 1);
    const sets = { mix: ['#e8c0d8', '#f0e0f0', '#d07090', '#f0d070', '#a090e0', '#ffffff'], white: ['#f4f2ff', '#e8e8f8', '#ffffff', '#dcdcf0'], violet: ['#a080e0', '#8070d0', '#c0a0f0', '#e0d0ff'],
      sun: ['#f0c030', '#e8a020', '#ffd040'], fruit: ['#d04030', '#e0a040', '#b07030', '#80a040', '#e8d080'] };
    const cols = sets[kind] || sets.mix;
    for (let i = 0; i < 70; i++) { const x = 14 + r() * 100, y = 30 + r() * 92; g.fillStyle = 'rgba(' + [28 + r() * 20, 52 + r() * 30, 40 + r() * 20].map(Math.round).join(',') + ',1)'; g.beginPath(); g.ellipse(x, y, 5 + r() * 6, 3 + r() * 4, r() * 3, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 46; i++) { const x = 12 + r() * 104, y = 16 + r() * 88, s = kind === 'sun' ? 7 : 2.4 + r() * 2.4; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); if (kind === 'sun') { g.fillStyle = '#4a2a10'; g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill(); } }
    return c;
  };
  // the stall's counter: fruit, bread and baskets
  P.produce = function () {
    const c = cv(128, 64), g = c.getContext('2d'), r = R(21);
    g.fillStyle = '#5a3a24'; g.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 7; i++) { g.fillStyle = '#7a5030'; g.beginPath(); g.ellipse(10 + i * 18, 40, 9, 7, 0, 0, Math.PI * 2); g.fill(); }
    const cols = ['#d04030', '#e09040', '#c8b050', '#a05a2a', '#e8d090', '#80a040'];
    for (let i = 0; i < 70; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.arc(4 + r() * 120, 18 + r() * 34, 2.5 + r() * 3, 0, Math.PI * 2); g.fill(); }
    return c;
  };
  // a soft round glow, for the halos round lanterns and windows
  P.halo = function () {
    const c = cv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,.7)'); gr.addColorStop(0.4, 'rgba(255,255,255,.22)'); gr.addColorStop(0.75, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  // the Moonwell's water: pale, with rings
  P.moonwater = function () {
    const c = cv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, '#f4fbff'); gr.addColorStop(0.45, '#a8d4ff'); gr.addColorStop(1, '#3a6ab8'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (let k = 1; k < 5; k++) { g.beginPath(); g.arc(64, 64, k * 13, 0, Math.PI * 2); g.stroke(); }
    return c;
  };
  // Io's soft shadow
  P.blob = function () {
    const c = cv(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(8,4,16,.7)'); gr.addColorStop(0.6, 'rgba(8,4,16,.35)'); gr.addColorStop(1, 'rgba(8,4,16,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
})(window);
