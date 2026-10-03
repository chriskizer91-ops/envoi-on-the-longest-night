// goal-arrow.js: the little golden arrow that shows Io where the story wants her next (Chris, October 3: "a little arrow
// that tells her where to walk in town whenever she gets a quest"). The ground maps (field.js) and the world map
// (world.js) draw it alike: while the goal is in view, the arrow bobs over it (over a person's head, over a place, or
// just inside a way out, pointing out through it); when it isn't, the arrow stands beside Io, pointing the way.
// GoalArrow.draw(g, { x, y, over, out, ix, iy, ih, W, H, t })
//   x, y: the goal on the screen (canvas px); over: how high over that point the arrow floats (a person's height);
//   out: an angle, when the goal is a way out; ix, iy, ih: Io's feet on the screen and her height there; W, H: the
//   screen's size; t: milliseconds
// Defines window.GoalArrow.
(function () {
  'use strict';
  const EDGE = 28; // how far inside the screen's edges the goal must be to count as in view (canvas px)
  // a small golden arrow along angle a, its middle at (x, y), s long from its middle to its tip
  function arrow(g, x, y, a, s) {
    g.save(); g.translate(x, y); g.rotate(a);
    g.beginPath(); g.moveTo(s, 0); g.lineTo(-s * 0.7, -s * 0.8); g.lineTo(-s * 0.3, 0); g.lineTo(-s * 0.7, s * 0.8); g.closePath();
    g.shadowColor = 'rgba(255,200,110,0.85)'; g.shadowBlur = s;
    g.fillStyle = '#ffd36e'; g.fill();
    g.shadowBlur = 0; g.lineJoin = 'round'; g.lineWidth = Math.max(1.2, s * 0.14); g.strokeStyle = 'rgba(28,12,36,0.9)'; g.stroke();
    g.restore();
  }
  function draw(g, o) {
    const s = Math.max(9, Math.min(15, o.ih * 0.2)), bob = Math.sin(o.t / 230) * s * 0.35;
    const inView = o.x > EDGE && o.x < o.W - EDGE && o.y > EDGE && o.y < o.H - EDGE;
    if (inView && o.out != null) arrow(g, o.x - Math.cos(o.out) * (s * 2.4 + bob), o.y - Math.sin(o.out) * (s * 2.4 + bob), o.out, s);
    else if (inView) arrow(g, o.x, o.y - (o.over || 0) - s * 1.4 + bob, Math.PI / 2, s);
    else {
      // beside her, a little out from her middle, pointing at it
      const cy = o.iy - o.ih * 0.5, a = Math.atan2(o.y - cy, o.x - o.ix), r = o.ih * 0.8 + s + bob;
      arrow(g, o.ix + Math.cos(a) * r, cy + Math.sin(a) * r, a, s);
    }
  }
  window.GoalArrow = { draw };
})();
