// painted-folk.js: everyone but Io on the ground maps as painted paper dolls (art request 08), in the style of Io's
// Path Polish sheet. Each person's sheet is cut by tools/cut-sheet.mjs into even cells with the feet on one spot, and
// listed in src/walk/walkers.js. Those who walk in the story's scenes step as Io does: six frames to a stride, one frame
// for every 1/6.4 of the person's own height walked, and stand on the row's standing frame. The townsfolk only stand
// and turn to talk (Chris, October 3), so theirs are one to three standing poses (toward the viewer, and left and right
// where the sheet had a side pose with the feet together); facing away, they show the pose toward the viewer. Everyone
// breathes slowly while standing, over a soft shadow at the feet.
// A sheet loads the first time its person is drawn; until then the caller draws its pixel stand-in.
// makePaintedFolk(src) -> { has(id), loaded(id), draw(g, id, x, y, h, s) }
//   src(path) -> the image's URL
//   loaded(id): true once the sheet is in (and starts loading it if it isn't)
//   draw: x, y: the feet on the canvas; h: an adult's height on the canvas (Io's); s: { dir: 'n' | 's' | 'e' | 'w',
//   walk: how far the person has walked, in Io's heights; moving; t: seconds; seed: any number, so neighbours don't
//   breathe together }
// Needs window.WALKERS (walkers.js). Defines window.makePaintedFolk.
(function () {
  'use strict';
  const FRAMES_PER_HEIGHT = 6.4, ROW = { s: 0, w: 1, e: 2, n: 3 };

  function makePaintedFolk(src) {
    const W = window.WALKERS || {}, img = {}, asked = {};
    function loaded(id) {
      if (img[id]) return true;
      const m = W[id]; if (!m || asked[id]) return false;
      asked[id] = true;
      const i = new Image(); i.onload = () => { img[id] = i; }; i.src = src(m.src);
      return false;
    }
    function draw(g, id, x, y, h, s) {
      const m = W[id], im = img[id]; if (!m || !im) return;
      const k = h * m.ratio / m.fig; // canvas px per sheet px: the middle frame comes out at the person's height
      const own = (s.walk || 0) / m.ratio; // the distance in the person's own heights
      let frame, row;
      if (m.still) { frame = m.still[s.dir] || 0; row = 0; }
      else { row = ROW[s.dir] || 0; frame = s.moving ? Math.floor(Math.max(0, own) * FRAMES_PER_HEIGHT) % m.cols : m.stand[row]; }
      const moving = s.moving && !m.still;
      const [cw, ch] = m.cell, [fx, fy] = m.foot, fh = m.fig * k;
      // a breath while standing, a little lift with each step (Io's: about half a percent of her height)
      const breath = moving ? Math.abs(Math.sin(own * FRAMES_PER_HEIGHT / 6 * Math.PI * 2)) * 0.003 * fh
        : (0.5 + 0.5 * Math.sin((s.t || 0) * 2 + (s.seed || 0))) * 0.0045 * fh;
      g.save();
      g.fillStyle = 'rgba(16,9,31,0.44)'; g.beginPath(); g.ellipse(x, y + 0.013 * fh, 0.142 * fh, 0.045 * fh, 0, 0, Math.PI * 2); g.fill();
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      // the breath lifts the figure from its feet, which stay planted
      g.drawImage(im, frame * cw, row * ch, cw, ch, x - fx * k, y - fy * k + breath, cw * k, ch * k - breath);
      g.restore();
    }
    return { has: (id) => !!W[id], loaded, draw };
  }
  window.makePaintedFolk = makePaintedFolk;
})();
