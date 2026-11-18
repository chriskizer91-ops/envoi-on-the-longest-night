// dawnroost-node.js: Dawnroost's living node in 3D, laid out on its painting (reference/art/walk/walk-dawnroost-node.png,
// 1536 x 1024) in the painting's own pixels, as src/game/maps.js keeps the walking map. Where Io can walk is that map's
// own walk and block areas, unchanged (MAPS['dawnroost-node']), and everything else inside the castle's walls that looks
// like ground (Chris, November 16: anywhere that looks walkable is walkable): the bounds below run inside the walls and
// down the road between its low walls, so the court, its stall yards and corners are open, and the walls close it.
// The texture ids are the texture pack's (texture-packs/bogmire-dawnroost/dawnroost-node/inventory.md).
// The node is the sunstone in its walled court on the hilltop above Dawnroost. Heights are metres: the court is 0; the two
// wall walks at the top corners are 3.6 up, their stairs climbing north from the court; the walls stand 4.7 high (with
// their merlons to 5.35), the corner towers 5.3 to 5.6, the gatehouse 7 and its two pillars 7.8; the sunstone stands on
// a round dais of three low steps (0.2, 0.4, 0.6) in a curved niche of the north wall. The gate's passage falls to the
// road (-0.8 at its mouth), and the road goes on down the hill toward Dawnroost between two low stone walls; outside the
// walls the hill falls away, rocky, with dark firs and flowering bushes.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  // metres between two points of the painting (4 cm a pixel across, 5 cm down)
  const mDist = (ax, ay, bx, by) => Math.hypot((ax - bx) * 0.04, (ay - by) * 0.05);

  const H_W = 3.6, WALL = 4.7, BOT = -6;
  // the two stairs up to the wall walks: x across, from the top (yt) down to the court (yb), n treads
  const STAIRS = [{ x0: 205, x1: 273, yt: 158, yb: 338, n: 15 }, { x0: 1263, x1: 1331, yt: 158, yb: 338, n: 15 }];
  const stairH = (s, y) => H_W * Math.max(0, Math.min(s.n, Math.ceil((s.yb - y) / (s.yb - s.yt) * s.n))) / s.n;
  // the sunstone's round dais: three steps, by the distance from its middle (metres)
  const DAIS = [770, 165], STEP_R = [4.9, 4.2, 3.4];
  const daisH = (x, y) => { const r = mDist(x, y, DAIS[0], DAIS[1]); return r < STEP_R[2] ? 0.6 : r < STEP_R[1] ? 0.4 : r < STEP_R[0] ? 0.2 : 0; };
  // the sun in the floor, a true circle (the painting squashes it)
  const MED = [766, 451], MED_R = 4.15;
  // the road down to Dawnroost: from the gate's mouth (-0.8), falling about 1 in 5
  const roadH = (y) => -0.8 - (y - 834) * 0.0095;

  // the castle's outline, round the outer feet of its walls: inside it the ground is the court's (0)
  const CASTLE = [[94, 52], [326, 52], [326, 128], [332, 128], [332, 188], [528, 188], [528, 166], [545, 166], [545, 118], [622, 118], [622, 84], [672, 86],
    [723, 60], [770, 54], [817, 60], [868, 86], [918, 84], [918, 118], [995, 118], [995, 166], [1012, 166], [1012, 188], [1206, 188], [1206, 128], [1212, 128],
    [1212, 52], [1446, 52], [1446, 172], [1370, 172], [1370, 360], [1446, 382], [1492, 386], [1494, 642], [1500, 668], [1460, 740], [1300, 766], [1296, 782],
    [1205, 782], [1205, 754], [962, 754], [962, 840], [918, 840], [918, 828], [620, 828], [620, 840], [574, 840], [574, 754], [334, 754], [334, 762], [252, 762],
    [252, 732], [213, 730], [61, 640], [34, 642], [32, 548], [50, 546], [50, 366], [170, 366], [170, 174], [94, 174]];
  // where Io may go (Chris's rule): inside this, every place that isn't solid is walkable. It runs inside the walls all
  // round (so they close it), through the gate and down the road between its low walls to the painting's edge
  const ARC = [200, 225, 250, 270, 290, 315, 340].map((a) => [Math.round(DAIS[0] + Math.cos(a * Math.PI / 180) * 4.9 / 0.04), Math.round(166 + Math.sin(a * Math.PI / 180) * 4.9 / 0.05)]);
  const BOUNDS = [[108, 80], [296, 80], [296, 212], [540, 212], [540, 180], [548, 180], [548, 145], [636, 145], ...ARC, [904, 145], [992, 145], [992, 180],
    [1000, 180], [1000, 212], [1240, 212], [1240, 80], [1428, 80], [1428, 165], [1351, 165], [1351, 380], [1466, 400], [1466, 655], [1420, 735], [1300, 750],
    [1250, 740], [970, 726], [940, 790], [885, 800], [885, 1021], [650, 1021], [650, 800], [596, 790], [560, 726], [300, 726], [240, 712], [150, 662], [60, 618],
    [60, 580], [76, 560], [76, 383], [190, 383], [190, 165], [108, 165]];

  // the ground's height under any point of the painting (metres)
  function ground(x, y) {
    if (y > 630 && y <= 834 && x > 690 && x < 855) return -0.8 * (y - 630) / 204;            // the gate's passage
    if (y > 826 && x > 640 && x < 900) return y <= 834 ? -0.8 * (y - 630) / 204 : roadH(y);   // the road at the gate's foot
    if (inPoly(CASTLE, x, y)) return 0;                                                      // the court, under the walls
    const dm = edgeDist(CASTLE, x, y) * 0.045, n = G.W3D ? G.W3D.vnoise(x / 170, y / 170) - 0.5 : 0;
    let h = -0.7 - 0.16 * dm - 1.8 * ss(0, 8, dm) + n * 1.8 * ss(2, 10, dm);                // the hill falls away
    if (y > 834) { const r = roadH(y), k = ss(118, 230, Math.abs(x - 768)); h = r + (Math.min(h, r - 0.2) - r) * k; }   // the road
    return h;
  }

  // ---- the walls: blocks in pixels [x0, y0, x1, y1], their tops (m), which edges carry merlons (the outer side, for the
  // curtain walls; every side, for towers) and which carry a low lip of coping (the court side) ----
  const WALLS = [
    { r: [296, 190, 550, 234], top: WALL, mer: 'n', lip: 's' },        // the north wall, west of the sunstone
    { r: [528, 166, 552, 192], top: WALL },                             // where it meets the taller wall by the niche
    { r: [545, 120, 622, 170], top: 6.0, mer: 'n', lip: 's', col: [1.2, 1.05, 0.92] },   // the taller wall beside the niche
    { r: [622, 86, 666, 170], top: 6.8, bowl: [644, 112], col: [1.35, 1.1, 0.9] },   // the niche's west pillar
    { r: [874, 86, 918, 170], top: 6.8, bowl: [896, 112], col: [1.35, 1.1, 0.9] },   // the niche's east pillar
    { r: [918, 120, 995, 170], top: 6.0, mer: 'n', lip: 's', col: [1.2, 1.05, 0.92] },
    { r: [988, 166, 1012, 192], top: WALL },
    { r: [990, 190, 1240, 234], top: WALL, mer: 'n', lip: 's' },       // the north wall, east of the sunstone
    { r: [172, 158, 205, 398], top: WALL, mer: 'w', lip: 'e' },        // the west wall, along the west stair
    { r: [52, 368, 205, 398], top: WALL, mer: 'n', lip: 's' },         // the wall north of the west stall yard
    { r: [52, 368, 100, 598], top: WALL, mer: 'w', lip: 'e' },         // the west wall
    { r: [34, 550, 84, 606], top: 5.3, mer: 'nsew', bowl: [59, 578] }, // the west corner post
    { r: [252, 688, 334, 760], top: 5.6, mer: 'nsew', bowl: [293, 708] },   // the south-west tower
    { r: [332, 700, 574, 752], top: WALL, mer: 's', lip: 'n' },        // the south wall, west of the gate
    { r: [962, 700, 1207, 752], top: WALL, mer: 's', lip: 'n' },       // the south wall, east of the gate
    { r: [1205, 709, 1296, 780], top: 5.6, mer: 'nsew', bowl: [1248, 727] }, // the south-east tower
    { r: [1442, 556, 1492, 644], top: 5.3, mer: 'nsew', bowl: [1467, 592] }, // the east corner post
    { r: [1442, 384, 1490, 560], top: WALL, mer: 'e', lip: 'w' },      // the east wall
    { r: [1334, 158, 1368, 398], top: WALL, mer: 'e', lip: 'w' },      // the east wall, along the east stair
    { r: [284, 54, 324, 132], top: 5.6, mer: 'nsew', bowl: [304, 92] },    // the tower at the west wall walk's north-east corner
    { r: [284, 132, 302, 160], top: WALL }, { r: [296, 128, 332, 200], top: WALL },
    { r: [1212, 54, 1254, 132], top: 5.6, mer: 'nsew', bowl: [1233, 92] }, // the tower at the east wall walk's north-west corner
    { r: [1236, 132, 1255, 160], top: WALL }, { r: [1206, 128, 1240, 200], top: WALL },
  ];
  // the walls that aren't square: the south-west and south-east corners (their inner faces slant), and the turn north of
  // the east stall yard; each with the lines its merlons stand along (outside) and its lip (inside)
  const SLANTS = [
    { poly: [[36, 596], [100, 596], [252, 686], [252, 732], [213, 730], [61, 640], [36, 640]], mer: [[[66, 635], [216, 725]], [[38, 600], [38, 638]]], lip: [[100, 599], [250, 688]] },
    { poly: [[1290, 714], [1414, 692], [1444, 642], [1494, 642], [1500, 668], [1460, 740], [1300, 766]], mer: [[[1302, 760], [1456, 734], [1494, 668]]], lip: [[1292, 716], [1414, 694], [1442, 645]] },
    { poly: [[1334, 366], [1368, 362], [1446, 384], [1490, 388], [1490, 414], [1442, 414], [1368, 398], [1334, 398]], mer: [[[1336, 368], [1368, 364], [1446, 386], [1488, 390]]], lip: [[1336, 396], [1368, 396], [1442, 412]] },
  ];
  // the wall walks: the stone floors at the top corners (walked on), and the parapets round them (1.1 m, merlons outside)
  const WALKS = [
    { poly: [[96, 54], [286, 54], [286, 158], [207, 158], [207, 172], [96, 172]],
      parapets: [[96, 54, 286, 104], [96, 104, 120, 126], [96, 126, 132, 172], [132, 150, 163, 172], [163, 159, 172, 172]], mer: [[[98, 56], [284, 56]], [[98, 56], [98, 170]], [[98, 170], [170, 170]]] },
    { poly: [[1236, 54], [1444, 54], [1444, 172], [1331, 172], [1331, 158], [1236, 158]],
      parapets: [[1236, 54, 1444, 104], [1408, 104, 1444, 172], [1380, 130, 1408, 172], [1368, 152, 1380, 172]], mer: [[[1238, 56], [1442, 56]], [[1442, 56], [1442, 170]], [[1368, 170], [1442, 170]]] },
  ];
  // the gate: a deep gatehouse with an arched passage, between two tall pillars with iron urns on top
  const GATE = { x0: 620, x1: 917, y0: 630, y1: 826, a0: 711.5, a1: 832.5, top: 7.0, spring: 3.0 };
  const PILLARS = [[574, 618, 620, 838], [918, 618, 962, 838]], PILLAR_TOP = 7.8;
  // the posts round the dais (their chains between), just inside the walking map's edge there
  const POSTS = [[649, 212], [692, 205], [714, 240], [824, 240], [848, 205], [889, 212]];
  const CHAINS = [[[649, 174], [649, 212]], [[649, 212], [692, 205]], [[692, 205], [714, 240]], [[824, 240], [848, 205]], [[848, 205], [889, 212]], [[889, 212], [889, 174]]];
  // the gold veins in the court's floor, read from the painting (bright gold between its cobbles): runs of 2 px cells,
  // "row:start.length,..." in base 36, rows and cells counted in 2 px
  const VEINS = "2i:8d.2,8n.1,8s.1,cn.1 2j:8l.1,8s.1,cr.1 2k:8l.1,cr.1 2l:8k.1 2m:8k.1,cg.1 2n:8i.2,cg.1,cr.3 2o:8u.1,cg.2,cu.1 2p:8u.1,ch.2,cu.1 2q:8t.1,ci.1,ct.1 "
    + "2r:8s.1,ci.1,cu.1 2s:8s.1 2t:8s.1 2v:8r.1,ck.1 2w:8r.1,ck.1,cu.1 2x:8q.2,ck.1,cu.1 2y:8j.8,cl.a 2z:8r.1,ck.3,ct.1 30:8r.1,cj.2,cm.1,ct.1 "
    + "31:8s.1,cj.1,cm.1,ct.1 32:8s.2,cg.2,cj.1,cm.1,ct.1 33:8t.1,ce.2,ct.1 34:8t.1,cg.1,cs.2 35:8u.2,cg.1,cs.1 36:8j.1,8v.1,cf.4,cm.1,co.5 "
    + "37:8j.1,8r.1,8v.1,ce.1,cr.1 38:8j.1,8t.5,ce.1,cr.1 39:8k.1,8r.3,8x.5,ce.1,cq.1 3a:8o.3,8z.1,cp.2 3b:8z.1,cp.1 3c:8z.1,ca.3,co.2 "
    + "3d:8m.2,8z.1,9a.2,c0.2,ca.1,cc.1,co.1,cv.3 3e:8j.2,97.3,c2.2,ca.3,cl.1,cn.2 3f:77.1,8e.1,8h.1,94.3,99.1,cb.1,cm.2,cw.2 "
    + "3g:78.1,8c.1,8h.1,8p.3,93.2,98.1,c3.3,cb.2,ck.3,co.1,cs.2 3h:8c.1,8r.1,8x.3,92.2,c2.2,c5.7,cd.1,cj.2 "
    + "3i:8a.1,8c.1,8h.2,8r.4,8w.2,8z.3,c1.1,c3.3,c7.1,c9.1,cb.3,cj.1,cp.1,d2.1 3j:8a.1,8u.3,8z.1,c7.3,cd.1,cf.2,ci.2 "
    + "3k:89.1,8t.2,8w.1,8y.2,9c.1,9h.1,bx.3,c6.2,cd.3,ch.2,ck.1 3l:89.1,8o.2,8s.1,8u.5,9b.1,9h.1,bt.2,bx.1,bz.1,c2.5,c8.6,cf.5,e2.2,ef.1 "
    + "3m:7c.1,87.3,8s.3,8y.1,9b.1,9h.1,bv.1,bx.3,c2.1,c4.1,c6.1,c9.1,cd.1,ci.1,co.1,d2.3,ef.1 3n:8s.1,8y.1,9a.8,bv.3,bz.5,c6.1,c8.2,cc.1,ci.3,co.1 "
    + "3o:7g.4,85.2,8s.1,8y.5,99.1,9f.1,9h.3,bs.4,c1.1,c7.2,cb.2,ck.2,d8.1,dt.3,dx.4,e3.1 "
    + "3p:7g.1,81.4,86.1,93.3,99.1,9e.4,9j.3,9y.1,bs.1,bu.1,c1.1,c6.5,cm.2,d8.1,dv.3,e3.1 "
    + "3q:7c.5,81.1,83.1,85.2,96.3,9e.1,9l.3,9q.3,9y.1,ao.1,bg.1,bn.3,bs.3,c1.5,d8.1,dt.2,dx.1 "
    + "3r:7c.1,7g.b,7x.9,8l.2,97.2,9d.1,9o.2,9r.1,9t.1,9w.2,an.1,bf.1,bh.1,bk.3,bp.1,c4.1,cq.1,d8.1,da.8,do.5,du.1,dy.3 "
    + "3s:79.3,7l.1,7w.2,81.3,86.1,8k.1,96.2,99.2,9d.1,9r.6,aa.3,ai.1,an.1,be.7,bp.2,c4.3,d9.1,di.3,ds.2,e0.4 "
    + "3t:78.1,7l.1,7v.1,7x.1,81.1,83.1,86.1,8h.1,95.2,99.1,9b.1,9d.1,9u.1,9x.2,aa.1,aj.1,an.1,bd.2,bh.1,bq.3,c2.3,c6.1,ct.3,d8.1,e3.1 "
    + "3u:75.3,7l.1,7r.1,7x.7,86.1,8f.2,94.2,99.1,9c.1,9u.1,9y.d,ah.4,an.3,b3.3,b9.4,bh.2,bq.1,bs.1,c1.2,c4.3,cv.1,dd.4,dq.1,e4.2 "
    + "3v:74.2,8f.1,93.2,99.4,9t.1,aa.1,ag.1,ak.4,aq.1,au.4,b3.1,b6.3,bj.1,br.1,c0.2,c6.2,cm.2,cw.4,d2.1,d5.1,e2.2,e6.3 "
    + "3w:70.4,8b.1,8f.1,93.1,9c.3,9h.1,9m.2,9s.2,aa.7,al.1,aq.1,au.1,ax.7,b7.1,bj.1,br.2,by.2,c8.1,d0.2,dx.1,e9.2 "
    + "3x:6z.1,83.2,89.2,91.2,9e.3,9i.2,9o.4,aa.1,ae.1,ag.1,al.1,ar.4,ax.1,b2.1,b7.3,bk.1,bt.5,c9.1,d1.1,dq.1,dx.1 "
    + "3y:6y.2,7s.1,7z.1,85.1,88.2,90.2,9g.3,9k.1,9p.1,a7.5,ad.2,ah.1,al.1,ar.2,au.1,ax.1,b1.1,bk.2,bp.1,bs.1,c9.3,d1.4,dh.2 "
    + "3z:6x.1,7t.2,7w.3,87.1,90.1,9i.3,9p.1,9z.3,a4.3,ab.3,ai.1,ak.1,ar.1,at.5,b1.1,bl.2,bo.1,bq.3,cc.1,d2.1,d4.1,ed.3 "
    + "40:6u.3,87.1,8z.1,9l.5,ad.8,aq.4,aw.1,b1.1,b8.3,bk.1,bm.5,cc.1,d3.1,dv.2,ef.3 "
    + "41:6s.3,8y.1,9m.1,9p.3,ae.1,ak.1,aq.1,aw.1,b1.1,b8.1,bk.3,bo.1,cc.3,dh.2,eh.3 "
    + "42:5y.2,6r.2,8y.1,9m.1,9r.4,a3.1,ae.1,aj.8,aw.7,b8.1,bb.1,bg.4,bp.1,dy.1,ej.3,ex.1,fa.3,fe.2 "
    + "43:6i.2,6n.4,79.2,8q.1,8u.4,9l.2,9v.4,a3.1,ae.1,ai.2,an.1,ap.1,ar.1,aw.1,b2.1,b8.1,bc.1,be.2,bh.1,bp.2,el.7,et.2,ex.1,ez.2,f4.2 "
    + "44:6m.1,8p.1,9k.2,9z.7,ad.6,an.3,as.1,aw.1,b1.3,b6.9,bh.1,bq.1,ch.1,eo.1 45:6m.1,8m.3,9j.2,a6.8,ag.1,ai.1,an.1,as.a,b3.4,bd.1,bf.1,bq.3,ci.1,eo.1 "
    + "46:6m.1,90.1,93.2,9j.1,9v.2,a8.1,ag.3,an.2,ar.1,b3.1,bd.1,bf.1,bo.2,bs.2,e2.2,ep.1 47:9i.2,9x.1,a8.1,an.1,ap.3,b3.1,bo.1,bt.1 "
    + "48:9i.1,a8.1,an.3,b3.1,be.3,bo.1,bt.1,es.1 49:6j.1,8h.2,9h.1,9q.1,a8.1,ap.1,b3.1,bt.3,es.1 4a:6j.1,9f.2,9i.1,9q.1,a8.1,ap.1,as.1,b3.1,bt.1,bv.2,et.1 "
    + "4b:97.4,9e.2,9m.1,a8.2,ap.1,as.1,b0.3,bq.1,bt.2,bx.1,c3.1,eu.1 4c:8n.2,9a.4,a9.2,ae.2,ah.2,am.4,ar.1,at.8,bq.1,bx.3,c2.1 "
    + "4d:58.1,6d.1,9a.1,9d.1,aa.1,ae.1,ag.1,ai.1,am.1,ao.6,az.1,bg.2,br.1,bx.1,c0.3,ex.2 4e:58.1,98.2,9e.1,aa.1,af.1,ai.1,an.2,b0.1,bc.2,bw.2,c2.2 "
    + "4f:9e.2,a5.4,aa.1,af.2,ao.1,b0.3,bw.1,c3.2,f0.2 4g:9g.1,a4.1,a9.2,ag.4,an.2,b3.1,bw.1,c5.2 4h:59.1,67.2,94.2,9g.1,ak.3,au.2,c7.1 "
    + "4i:59.1,92.2,am.1,c8.1,f4.2 4j:59.1,91.1,9i.1,a7.1,am.1,bt.2,ca.3,cp.1,f6.3 4k:62.1,6m.1,9i.1,a8.3,am.1,cc.2 4l:60.2,6m.1,8t.6,9i.1,al.1,bm.1,ce.5 "
    + "4m:5y.2,6p.1,7c.1,8o.2,8r.2,8v.1,9i.1,ae.3,ai.5,cf.1,cj.1,cm.5,dw.1,dz.2 4n:5r.8,6q.2,8f.2,8v.1,9w.3,a1.3,a9.2,ac.2,an.2,cf.1,cx.1,e1.1,fd.4,fk.1 "
    + "4o:5v.1,8v.1,ao.1,bt.1,cg.1,cv.2,fg.1 4p:5v.1,8v.1,ao.1,cg.1,fg.1,g2.2 4q:5u.1,8u.2,98.2,9c.1,aa.3,ap.1,b0.1,cg.1,fh.1 "
    + "4r:5t.1,8u.1,9j.1,9l.3,a1.2,ap.1,b0.1,bq.1,cf.2,fi.1 4s:5t.1,8u.1,a0.1,ap.5,bq.1,cd.3 4t:ap.1,au.2,az.1 4u:5r.1,aa.1,ap.1,az.1 "
    + "4v:9p.1,9z.1,ab.1,ap.1,az.1,cj.1,fl.1 4w:8r.1,9p.1,9w.1,9z.1,ab.1,ao.1,az.1 4x:8r.1,9w.1,ac.1,ao.1,az.1,ec.1 4y:6y.1,ac.3,an.1,az.1,bm.3,ec.1 "
    + "4z:5o.1,8o.1,9o.1,a1.2,ag.2,am.1,az.1,cn.1,fn.2 50:8o.1,ag.1,ai.5,az.1,co.1 51:9t.1,ag.2,am.1,bj.1 52:8d.1,am.1,bj.1,cy.1 53:8d.1 55:5m.3,fq.2 "
    + "56:8h.2,9a.1,ct.3,fs.1 57:7b.2,8j.1,9a.1,cs.2 58:72.2,8k.1,9d.1,cq.3,fu.2 59:8l.2,9d.1,co.2 5a:5v.2,8n.2,fh.2 5b:75.1,7c.1 5c:76.1,8g.1,cj.2,cw.1 "
    + "5d:5a.1,77.1,8g.1,8t.2 5e:78.1,8e.2,8v.1 5f:6x.1,78.1,8e.1,8t.3,cg.1,cy.1,e2.1 5g:8f.1,ce.2,cy.1,e3.1,f7.2 5h:78.1,f5.2 5i:78.1,7e.6,dw.1,e8.1,f4.1 "
    + "5j:78.1,7d.1,7h.1,7j.1,8d.1,dx.1,e8.1 5k:72.1,7b.3,7g.4,8d.1,dx.1 5l:72.1,79.2,7e.1,7g.1,8c.1,ex.1 5m:6h.1,79.1,7d.3,8f.2,c3.1 "
    + "5n:6h.1,79.5,8h.2,c3.1,cv.1 5o:77.3,c1.2,c4.1,ct.2 5p:8j.1,9a.1 5q:9a.1 5r:6p.1 5s:8m.2,ej.1 5t:ej.1 5u:cm.1,eh.2 5v:73.1,cm.1 5w:72.1,cm.1,ed.1 "
    + "5x:6z.4,e9.3 63:6y.1 64:6y.1 66:6x.1 67:6x.1 69:6x.1,8u.2,8x.8,c5.6,cf.1 6a:6x.1,ed.1 6b:ed.1 6i:6v.1,8v.1,eb.1 6j:8u.1,eb.1 6k:eb.1 6l:cm.1 "
    + "6m:cm.1,e9.1 6n:8r.2,e9.1 6o:8t.1 6p:8t.1 6q:e6.1 6r:75.3,ce.3,e3.3,ea.2 6s:8w.1,cg.1 6t:7b.2,8k.1,95.1,bz.1,cg.1 "
    + "6u:70.1,8p.1,95.1,99.1,by.1,ct.1,e9.3 6v:94.1,98.1,c3.2,ct.1,cw.3 6w:79.1,8c.4,94.1,cz.1,eg.1 6x:79.1,8f.1,8m.1,8t.1,8v.1,95.1,cz.1 "
    + "6y:7a.9,8f.1,8k.2,8t.1,8v.1,92.1,cw.1,cz.2,dt.2 6z:6p.2,7f.1,89.1,8e.1,8j.1,92.1,cx.2,d1.1,dv.1,dy.1 "
    + "70:79.1,7f.5,8d.1,8j.1,8z.2,ca.3,cq.3,d1.4,dw.2,dz.1,en.3 71:6k.1,7k.1,7m.2,8y.1,c9.1,e6.1 72:6k.1,7k.2,85.3,c9.1,dl.3 73:6j.1,7m.2,9j.1,br.1,db.1 "
    + "74:7s.4,9j.1,d2.1,dc.3,dh.2,dr.1 75:6f.2,7a.1,9h.2,ct.2,d2.1,ds.4 76:6d.2,7a.1,7j.1,8l.1,cq.3,cu.1,d0.3,dx.1,ex.2 77:6b.2,7j.1,8m.4,ct.2,dx.1,ez.2 "
    + "78:68.4,8t.1,cj.1,cm.3,f0.6 79:67.2,7e.1,7i.2,8t.1,d2.2,dq.1,dy.1 7a:67.1,7d.1,7f.3,7k.1,7n.1,8b.1,8u.3,9d.1,ch.1,d1.1,d4.2,dq.1,e9.1 "
    + "7b:67.1,7e.2,7n.1,88.1,8b.1,cg.1,dq.1,e9.1 7c:8b.1 7d:cc.1,d2.1 7e:64.1,7h.1,bc.1,c9.3,d2.1,dq.2 7f:63.1,7l.1,93.4,c5.5 7g:93.1,96.1,an.1,c5.1 "
    + "7h:92.2,97.1,an.1,c3.2 7i:61.1,91.1,98.1,an.1,c1.2 7j:61.1,73.1,7o.1,am.1,cc.1 7k:61.1,73.1,aj.4 7l:8y.2,9f.3,ah.1,an.1,bu.2,ce.1 "
    + "7m:8v.3,9h.3,ac.2,an.2,bs.2,cf.1,dx.1 7n:ao.1,bq.2 7o:5v.1,9n.3,ap.1,bm.2 7p:6a.2,6w.2,9p.3,9u.1,ap.1 7q:9u.1,ap.1,be.3 7r:9z.2,ap.2,b8.1,bc.1 "
    + "7s:8p.2,a9.1,aq.1,b4.2,b7.1,ck.4 7t:8n.3,8r.1,aq.5,az.2 7u:cq.1,dw.2 7w:5p.1,aq.1 7x:5p.1,ap.1,az.2 7y:8h.1,ao.2,ct.1 7z:8h.1,ao.1,b1.1,e2.2 "
    + "80:ao.1,b1.1 81:86.1,8d.1 82:85.1,an.1 83:an.1 84:an.1,c6.1 85:ao.1,c6.1 86:ao.1 87:ao.1 88:ao.1 89:ao.1 8a:a9.2,ao.1 8b:92.1,ao.1 8c:92.1,ao.5 "
    + "8d:an.1,b1.2 8e:an.1,b7.2 8f:9e.2,c0.1,d9.1 8g:bz.1,d8.1 8h:ae.1,av.1 8i:93.2,9u.3,ae.1,au.1 8j:9t.1,an.1 8k:a3.3,an.1,bm.3 8l:9n.2,an.1 "
    + "8m:9i.4,an.1,b6.1 8n:8t.1,bq.1 8o:8t.1,bp.1";
  const veinRuns = () => { const out = []; for (const row of VEINS.split(' ')) { if (!row) continue; const [j, rs] = row.split(':'), y = parseInt(j, 36) * 2; for (const r of rs.split(',')) { const [a, n] = r.split('.'); out.push([parseInt(a, 36) * 2, y, parseInt(n, 36) * 2]); } } return out; };

  P['dawnroost-node'] = {
    id: 'dawnroost-node', name: 'Dawnroost’s living node', painting: "art/walk/walk-dawnroost-node.avif", size: [1536, 1024],
    mapId: 'dawnroost-node', paintingPng: 'reference/art/walk/walk-dawnroost-node.png',
    // the wall check (tools/walls-test.mjs): from the road, to the exit, the gate, the sunstone, both wall walks, the corners
    // and the two stall yards
    checks: { from: [768, 990], goals: [
      ['the road down to Dawnroost (south edge)', 768, 1016], ['through the gate', 772, 720], ['the sunstone, up the dais steps', 770, 228],
      ['round the sunstone, on the dais', 712, 175], ['the west wall walk, up the west stair', 200, 128], ['the east wall walk, up the east stair', 1330, 124],
      ['the west recess by the dais', 615, 190], ['the east recess by the dais', 922, 190], ['the north-west bench', 468, 258], ['the north-east bench', 1070, 258],
      ['the barrels by the west stair', 340, 268], ['the corner past the east stall', 1345, 680], ['behind the west stall (a pocket)', 122, 470],
      ['the strip behind the east stall (a pocket)', 1416, 482], ['the west stall yard, by the wagon', 300, 600]] },
    // the trees from the painting (tools/make-trees.mjs): only outside the walls, and none on the road
    treeGen: { dark: 0.55, fir: 0.6, firSouth: 0.6, keepOut: [[28, 40, 1500, 848]], roads: [[640, 834, 896, 1500]],
      out: { density: 0.55, clump: 240, clear: 0.3, kinds: [0.3, 0.7, 0], size: [0.95, 1.4] } },
    // the ground: the court's veined cobbles on the walk, the town's cobbles on the road (paving, laid in groundPatches),
    // earth round the edges, and Dawnroost's flowering grass
    ground: { cob: 'node_cobbles_veined', grass: 'dawn_grass_flowers', dirt: 'shared_forest_floor', pave: 'shared_cobbles_town', rep: [2.8, 4.0, 4.0, 3.2], grassTint: [0.75, 0.82, 0.8] },
    surfaces: { stone: 'shared_wall_castle', timber: 'shared_wall_castle', roof: 'shared_wall_castle', dry: 'shared_drystone', pave: 'node_court_cobbles',
      planks: 'shared_boardwalk_planks', wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks', cloth: 'shared_awning_stripes', rock: 'shared_rock_cliff',
      soil: 'shared_forest_floor', leaves: 'wick_leaf_canopy', firs: 'wilds_fir_boughs', bark: 'shared_bark_oak' },
    extraMats: { dais: { tex: 'node_dais_stone', rep: 1.6, shade: 0.35 }, canvas: { tex: 'camp_tent_canvas', rep: 1.4, tint: 0xa8a4ac, side: 'double', shade: 0.3 } },
    tints: { leaves: 0x9fc0b4, firs: 0x8fb2aa, bush: 0xa8c8b8 },
    // the night: the court's light is the sunstone's gold, so the sky's light is a little warmer than elsewhere
    night: { sky: [0.66, 0.61, 0.63], glowK: 1.55 },
    // each texture: Chris's made one if the page carries it (texture-packs/made/), else the stand-in. Written out in full, so
    // the offline build finds the pictures and puts them inside the file.
    textures: [
      { id: 'node_cobbles_veined', made: "./../texture-packs/made-web/node_cobbles_veined.webp", stand: "./../texture-packs/bogmire-dawnroost/dawnroost-node/stand-in/node_cobbles_veined.png" },
      { id: 'node_court_cobbles', made: "./../texture-packs/made-web/node_court_cobbles.webp", stand: "./../texture-packs/bogmire-dawnroost/dawnroost-node/stand-in/node_court_cobbles.png" },
      { id: 'node_dais_stone', made: "./../texture-packs/made-web/node_dais_stone.webp", stand: "./../texture-packs/bogmire-dawnroost/dawnroost-node/stand-in/node_dais_stone.png" },
      { id: 'shared_wall_castle', made: "./../texture-packs/made-web/shared_wall_castle.webp", stand: "./../texture-packs/bogmire-dawnroost/dawnroost/stand-in/shared_wall_castle.png" },
      { id: 'dawn_grass_flowers', made: "./../texture-packs/made-web/dawn_grass_flowers.webp", stand: "./../texture-packs/bogmire-dawnroost/dawnroost/stand-in/dawn_grass_flowers.png" },
      { id: 'shared_cobbles_town', made: "./../texture-packs/made-web/shared_cobbles_town.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_cobbles_town.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made-web/shared_drystone.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_drystone.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made-web/shared_boardwalk_planks.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_awning_stripes', made: "./../texture-packs/made-web/shared_awning_stripes.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_awning_stripes.png" },
      { id: 'shared_rock_cliff', made: "./../texture-packs/made-web/shared_rock_cliff.webp", stand: "./../texture-packs/arenas/crossroads/stand-in/shared_rock_cliff.png" },
      { id: 'shared_forest_floor', made: "./../texture-packs/made-web/shared_forest_floor.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/shared_forest_floor.png" },
      { id: 'wick_leaf_canopy', made: "./../texture-packs/made-web/wick_leaf_canopy.webp", stand: "./../texture-packs/wickhollow/cottage/stand-in/wick_leaf_canopy.png" },
      { id: 'wilds_fir_boughs', made: "./../texture-packs/made-web/wilds_fir_boughs.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_fir_boughs.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made-web/shared_bark_oak.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/shared_bark_oak.png" },
      { id: 'camp_tent_canvas', made: "./../texture-packs/made-web/camp_tent_canvas.webp", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/camp_tent_canvas.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: a stair's tread, the wall walks, the dais's steps, or the ground
    walk_h(x, y) {
      for (const s of STAIRS) if (x >= s.x0 - 2 && x <= s.x1 + 2 && y > s.yt && y < s.yb) return stairH(s, y);
      if (y <= 160 && (x < 300 || x > 1236)) return H_W;
      if (y < 268 && x > 640 && x < 900) { const d = daisH(x, y); if (d > 0) return d; }
      return ground(x, y);
    },
    water: [], lawns: [], buildings: [],
    bounds: BOUNDS, thicket: false,
    // the court's floor past the walk (the stall yards and the corners) is cobbled too; the gate's passage and the road are
    // the town's cobbles
    groundPatches: [
      { poly: [[100, 398], [372, 398], [372, 604], [252, 690], [100, 600]], kind: 'cob' }, { poly: [[1158, 398], [1442, 398], [1442, 642], [1414, 692], [1290, 714], [1205, 710], [1158, 660]], kind: 'cob' },
      { poly: [[272, 234], [364, 234], [364, 392], [272, 392]], kind: 'cob' }, { poly: [[1172, 234], [1268, 234], [1268, 392], [1172, 392]], kind: 'cob' },
      { poly: [[540, 165], [645, 165], [645, 270], [540, 270]], kind: 'cob' }, { poly: [[895, 165], [1000, 165], [1000, 270], [895, 270]], kind: 'cob' },
      { poly: [[712, 632], [832, 632], [834, 834], [840, 1030], [696, 1030], [710, 834]], kind: 'pave' },
    ],
    start: [768, 990], startFace: Math.PI, startYaw: 0,
    // the way out (the walking map's exit): down the road to Dawnroost
    exits: [{ rect: [699, 1004, 836, 1024], label: 'Dawnroost' }],

    // the road's two low walls of dry stone, from the gate's foot down the hill
    walls: [
      { pts: [[650, 826], [650, 1300]], h: 0.85, t: 0.55, tex: 'dry' },
      { pts: [[885, 826], [885, 1300]], h: 0.85, t: 0.55, tex: 'dry' },
    ],
    steps: [],
    // the lamps: one on each wall walk (the walking map's NODE_LAMPS), and one at each stair's foot
    lamps: [
      { at: [158, 104], kind: 'post', y: H_W, short: true }, { at: [1381, 104], kind: 'post', y: H_W, short: true },
      { at: [194, 408], kind: 'post' }, { at: [1342, 408], kind: 'post' },
    ],
    // small things: benches against the walls and by the stalls, barrels and crates in the corners and at the stalls
    props: [
      { k: 'bench', at: [468, 246], face: 0 }, { k: 'bench', at: [1070, 246], face: 0 }, { k: 'bench', at: [338, 592], face: Math.PI / 2 },
      { k: 'bench', at: [1172, 595], face: -Math.PI / 2 }, { k: 'bench', at: [1342, 596], face: 0 }, { k: 'bench', at: [1138, 672], face: 0 },
      { k: 'barrel', at: [322, 282] }, { k: 'barrel', at: [346, 302] }, { k: 'barrel', at: [326, 318] }, { k: 'crates', at: [332, 346] },
      { k: 'barrel', at: [1196, 282] }, { k: 'barrel', at: [1218, 300] }, { k: 'barrel', at: [1200, 320] }, { k: 'crates', at: [1206, 346] },
      { k: 'barrel', at: [236, 522] }, { k: 'barrel', at: [258, 512] }, { k: 'crates', at: [296, 522] }, { k: 'barrel', at: [128, 400] },
      { k: 'barrel', at: [1312, 524] }, { k: 'barrel', at: [1336, 520] }, { k: 'barrel', at: [1362, 542] }, { k: 'barrel', at: [1376, 566] },
      { k: 'barrel', at: [1384, 594] }, { k: 'crates', at: [1376, 516] }, { k: 'crates', at: [1214, 458] }, { k: 'barrel', at: [1236, 452] },
    ],
    // flowering bushes: hiding the west stall yard from the court, along the south wall's planting strip, at the walls' feet
    flowers: [
      [290, 455, 0.9, 'white'], [318, 500, 1.0, 'white'], [340, 535, 0.75, 'mix'], [264, 438, 0.6, 'mix'],
      [372, 672, 0.9, 'white'], [402, 666, 0.8, 'mix'], [485, 670, 1.1, 'white'], [525, 668, 0.9, 'mix'], [556, 664, 0.7, 'white'],
      [985, 664, 0.8, 'mix'], [1020, 670, 1.0, 'white'], [1055, 668, 0.9, 'mix'], [1135, 678, 0.8, 'white'], [1176, 692, 0.7, 'mix'],
      [395, 240, 0.35, 'white'], [520, 240, 0.35, 'mix'], [1020, 240, 0.35, 'mix'], [1150, 240, 0.35, 'white'],
      [1175, 482, 0.6, 'white'], [1176, 532, 0.55, 'mix'], [1382, 628, 0.6, 'white'], [1450, 650, 0.55, 'mix'],
    ],
    // the lights for the light map: [x, y, radius px, strength, colour]. The fires' own are added in extra.
    lights: [
      [770, 200, 300, 1.1, 'warm'], [770, 300, 220, 0.5, 'warm'], [766, 451, 150, 0.45, 'warm'], [772, 730, 90, 0.35, 'warm'],
      [205, 505, 120, 0.75, 'warm'], [1340, 512, 120, 0.75, 'warm'],
    ],
    trees: 'dawnroost-node',
    // the pockets past the 2D walk: the west stall yard, behind the striped stall and round the covered wagon (in through
    // the gap between the flowering bushes and the bench, or along the yard's north wall behind the stall); and the strip
    // behind the east stall, between its barrels and the east wall (in past the white bush at the corner beyond the bench)
    walkAdd: [
      { poly: [[373, 552], [373, 577], [322, 577], [305, 596], [300, 616], [186, 616], [140, 606], [106, 588], [106, 410], [138, 410], [140, 548], [300, 548], [320, 552]], ground: 'cob' },
      { poly: [[1362, 646], [1398, 644], [1398, 450], [1432, 450], [1432, 646], [1410, 684], [1362, 684]], ground: 'cob' },
    ],
    // where the 3D hides the keepsake: the Node Sunstone lies at the top of the west stair in the 2D game; here it is
    // tucked behind the west stall, under the banner on the yard's west wall
    items: { 'node-sunstone': [121, 470] },
    // the painting's own trees inside the walls (the cypresses are built in extra): the pine in the south-east corner
    extraTrees: [[1295, 684, 0.7, 1, 41]],

    // ---- everything the engine has no field for: the walls, towers, gatehouse and pillars, the wall walks and their
    // stairs, the sunstone on its dais with its posts and chains, the sun in the floor and the gold veins, the braziers and
    // fire bowls, the banners, the urns, the two stalls, the weapon rack, the covered wagon, the cypresses, pot plants, the
    // little shrine behind the east stall, and the rocks and bushes round the hill outside
    extra(K) {
      const { B, X, Z, TAU } = K;
      const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
      const UP = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _d = new THREE.Vector3();
      const ROD = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true); g.translate(0, 0.5, 0); const n = g.toNonIndexed(); g.dispose(); return n; })();
      function rod(k, a, b, r, col) {
        _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); if (L < 1e-4) return; _d.multiplyScalar(1 / L); _q.setFromUnitVectors(UP, _d);
        B.geom(k, ROD, new THREE.Matrix4().compose(V3(a), _q, new THREE.Vector3(r, L, r)), col, [0.4, L]);
      }
      const STONE = [1.0, 0.95, 0.92], TOPC = [0.86, 0.81, 0.8], MERC = [0.96, 0.91, 0.9], WOOD = [0.8, 0.64, 0.52], RED = [1, 1, 1];
      const GOLD = [0.62, 0.42, 0.13], GOLD_B = [0.9, 0.6, 0.16];
      const pxPoly = (r) => [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
      // a flat piece lying on the ground at height y, facing up (points in metres [x, z])
      function flat(k, pts, y, col) {
        let [a, b, c, d] = pts; const ny = (b[1] - a[1]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[1] - a[1]); if (ny < 0) [b, d] = [d, b];
        B.quad(k, [a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], null, col);
      }
      // an upright prism over a polygon of pixels, from y0 to y1 (sides of k, a top of topK); solid unless told not
      function prism(poly, y0, y1, k, o) {
        o = o || {}; let pts = poly.map(([px, py]) => [X(px), Z(py)]);
        let A = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; A += a[0] * b[1] - b[0] * a[1]; }
        if (A > 0) pts = pts.slice().reverse();
        let u = 0;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
          B.quad(k, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [u, y0, u + L, y1], o.col || STONE); u += L;
        }
        const tri = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, z)), []);
        for (const [i, j, l] of tri) {
          let a = pts[i], b = pts[j], c = pts[l]; const ny = (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]); if (ny < 0) [b, c] = [c, b];
          B.tri(o.topK || k, [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]], o.topCol || TOPC);
        }
        if (o.solid !== false) K.addBlock(poly);
      }
      // merlons along a line of pixels, standing on top (y), t thick
      function merlons(pts, y, t) {
        for (let k = 1; k < pts.length; k++) {
          const ax = X(pts[k - 1][0]), az = Z(pts[k - 1][1]), bx = X(pts[k][0]), bz = Z(pts[k][1]), dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx);
          const n = Math.max(1, Math.round(L / 1.65));
          for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; B.box('stone', ax + dx * f, y, az + dz * f, 0.85, 0.65, t || 0.5, ry, MERC); }
        }
      }
      // merlons along a square wall's edges, set 0.3 m in from each edge named ('n', 's', 'e', 'w')
      function wallMerlons(r, y, edges) {
        const ix = 0.3 / 0.04, iz = 0.3 / 0.05;
        if (edges.includes('n')) merlons([[r[0], r[1] + iz], [r[2], r[1] + iz]], y);
        if (edges.includes('s')) merlons([[r[0], r[3] - iz], [r[2], r[3] - iz]], y);
        if (edges.includes('w')) merlons([[r[0] + ix, r[1]], [r[0] + ix, r[3]]], y);
        if (edges.includes('e')) merlons([[r[2] - ix, r[1]], [r[2] - ix, r[3]]], y);
      }
      // a low lip of coping along a wall's court side, set 0.2 m in
      function lip(pts, y) {
        for (let k = 1; k < pts.length; k++) {
          const ax = X(pts[k - 1][0]), az = Z(pts[k - 1][1]), bx = X(pts[k][0]), bz = Z(pts[k][1]), dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
          B.box('stone', (ax + bx) / 2, y, (az + bz) / 2, L, 0.22, 0.4, Math.atan2(-dz, dx), MERC);
        }
      }
      function wallLips(r, y, edges) {
        const ix = 0.2 / 0.04, iz = 0.2 / 0.05;
        if (edges.includes('n')) lip([[r[0], r[1] + iz], [r[2], r[1] + iz]], y);
        if (edges.includes('s')) lip([[r[0], r[3] - iz], [r[2], r[3] - iz]], y);
        if (edges.includes('w')) lip([[r[0] + ix, r[1]], [r[0] + ix, r[3]]], y);
        if (edges.includes('e')) lip([[r[2] - ix, r[1]], [r[2] - ix, r[3]]], y);
      }
      // a flame: a few thin tongues of fire leaning a little apart, a brighter heart, and a soft glow round it
      function flame(x, y, z, h, w) {
        const r = W3D.rand(Math.round(x * 97 + z * 31) >>> 0);
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI / 5 + r() * 0.4, c = Math.cos(a) * w * 0.55, s = Math.sin(a) * w * 0.55, hh = h * (0.55 + r() * 0.45), lx = (r() - 0.5) * w * 0.8, lz = (r() - 0.5) * w * 0.8;
          for (const [k, f, col] of [[1, 1, [1.0, 0.36, 0.05]], [0.5, 0.6, [1.3, 0.85, 0.3]]]) {
            const p = [x - c * k, y, z - s * k], q = [x + c * k, y, z + s * k], t = [x + lx * f, y + hh * f, z + lz * f];
            B.tri('glass', p, q, t, [[0, 0], [1, 0], [0.5, 1]], col); B.tri('glass', q, p, t, [[0, 0], [1, 0], [0.5, 1]], col);
          }
        }
        K.halo(x, y + h * 0.45, z, h * 2.2, [1.0, 0.5, 0.15]);
      }
      // a fire bowl: an iron bowl of burning coals (on a tower, a newel post, a pillar), its glow and its light
      function bowl(px, py, y, s) {
        const x = X(px), z = Z(py); s = s || 1;
        B.cyl('iron', x, y, z, 0.2 * s, 0.12 * s, 0.22 * s, 8);
        B.cyl('iron', x, y + 0.22 * s, z, 0.2 * s, 0.4 * s, 0.26 * s, 10, null, null, true);
        B.cyl('iron', x, y + 0.46 * s, z, 0.42 * s, 0.42 * s, 0.05 * s, 10, null, null, true);
        B.cyl('glass', x, y + 0.4 * s, z, 0.37 * s, 0.37 * s, 0.04, 10, [1.6, 0.55, 0.15]);
        flame(x, y + 0.44 * s, z, 0.75 * s, 0.24 * s);
        K.halo(x, y + 0.75 * s, z, 2.4 * s, [1.0, 0.55, 0.22]); K.lamps3d.push({ x, y: y + 0.7, z, c: 0xff9a48, k: 1.4 });
        K.light(px, py + 10, 110 * s, 0.75, 'forge');
      }
      // a brazier: a stone plinth, an iron column and a big iron basket of fire
      function brazier(px, py, w, d, ph) {
        const x = X(px), z = Z(py);
        B.box('stone', x, -0.05, z, w, ph, d, 0, [0.75, 0.72, 0.76]); B.box('stone', x, ph - 0.05, z, w + 0.12, 0.1, d + 0.12, 0, [0.62, 0.6, 0.64]);
        const y0 = ph + 0.05;
        B.cyl('iron', x, y0, z, 0.24, 0.1, 0.25, 8); B.cyl('iron', x, y0 + 0.25, z, 0.09, 0.09, 0.55, 6);
        for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.5; rod('iron', [x + Math.cos(a) * 0.42, y0, z + Math.sin(a) * 0.42], [x + Math.cos(a) * 0.3, y0 + 0.85, z + Math.sin(a) * 0.3], 0.035); }
        const by = y0 + 0.8;
        B.cyl('iron', x, by, z, 0.28, 0.6, 0.45, 12, null, null, true);
        B.cyl('iron', x, by + 0.42, z, 0.63, 0.63, 0.07, 12, null, null, true);
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6; rod('iron', [x + Math.cos(a) * 0.62, by + 0.48, z + Math.sin(a) * 0.62], [x + Math.cos(a) * 0.7, by + 0.66, z + Math.sin(a) * 0.7], 0.025); }
        B.cyl('glass', x, by + 0.36, z, 0.56, 0.56, 0.05, 12, [1.7, 0.6, 0.16]);
        flame(x, by + 0.4, z, 1.15, 0.38); flame(x + 0.2, by + 0.38, z - 0.1, 0.7, 0.22); flame(x - 0.22, by + 0.38, z + 0.08, 0.8, 0.22);
        K.halo(x, by + 0.9, z, 4.2, [1.0, 0.55, 0.2]); K.halo(x, by + 0.5, z, 2.2, [1.0, 0.7, 0.3]);
        K.lamps3d.push({ x, y: by + 0.8, z, c: 0xff8a40, k: 2.0 });
        K.light(px, py + 6, 170, 1.25, 'forge');
        return by;
      }
      // a red banner with a gold sun, hanging from an iron rod: its middle at (x, z), facing n ([nx, nz]), its top at y
      function banner(x, z, top, w, h, n) {
        const t = [n[1], -n[0]], o = 0.03, hb = h * 0.8;
        const P_ = (u, y, off) => [x + t[0] * u + n[0] * (o + (off || 0)), y, z + t[1] * u + n[1] * (o + (off || 0))];
        B.quad('cloth', P_(-w / 2, top - hb), P_(w / 2, top - hb), P_(w / 2, top), P_(-w / 2, top), [0.27, 0, 0.4, hb], RED);
        B.tri('cloth', P_(w / 2, top - hb), P_(-w / 2, top - hb), P_(0, top - h), [[0.4, 0], [0.27, 0], [0.33, -0.3]], RED);
        rod('iron', P_(-w / 2 - 0.1, top + 0.02, 0.02), P_(w / 2 + 0.1, top + 0.02, 0.02), 0.025);
        // the gold trim down its sides and round its point, and the sun on both faces
        for (const side of [1, -1]) {
          const off = side * 0.012, e = 0.035;
          B.quad('glass', P_(-w / 2, top - hb, off), P_(-w / 2 + e, top - hb, off), P_(-w / 2 + e, top, off), P_(-w / 2, top, off), null, GOLD);
          B.quad('glass', P_(w / 2 - e, top - hb, off), P_(w / 2, top - hb, off), P_(w / 2, top, off), P_(w / 2 - e, top, off), null, GOLD);
          const cy = top - h * 0.42, R = w * 0.16;
          for (let i = 0; i < 16; i++) {
            const a0 = i * TAU / 16, a1 = (i + 1) * TAU / 16, am = (a0 + a1) / 2;
            const p = (a, r) => P_(Math.cos(a) * r, cy + Math.sin(a) * r, off);
            if (side > 0) { B.tri('glass', [x + t[0] * 0 + n[0] * (o + off), cy, z + n[1] * (o + off)], p(a0, R), p(a1, R), [[0, 0], [1, 0], [0, 1]], GOLD); if (i % 2 === 0) B.tri('glass', p(am - 0.13, R * 1.05), p(am, R * 1.75), p(am + 0.13, R * 1.05), [[0, 0], [1, 0], [0, 1]], GOLD); }
            else { B.tri('glass', [x + n[0] * (o + off), cy, z + n[1] * (o + off)], p(a1, R), p(a0, R), [[0, 0], [1, 0], [0, 1]], GOLD); if (i % 2 === 0) B.tri('glass', p(am + 0.13, R * 1.05), p(am, R * 1.75), p(am - 0.13, R * 1.05), [[0, 0], [1, 0], [0, 1]], GOLD); }
          }
        }
      }

      // ---- the walls and towers ----
      for (const w of WALLS) {
        const [x0, y0, x1, y1] = w.r, cx = (X(x0) + X(x1)) / 2, cz = (Z(y0) + Z(y1)) / 2, W = X(x1) - X(x0), D = Z(y1) - Z(y0);
        B.box('stone', cx, BOT, cz, W, w.top - BOT, D, 0, w.col || STONE);
        if (w.mer) wallMerlons(w.r, w.top, w.mer);
        if (w.lip) wallLips(w.r, w.top, w.lip);
        if (w.bowl) { B.box('stone', X(w.bowl[0]), w.top, Z(w.bowl[1]), 0.8, 0.35, 0.8, 0, TOPC); bowl(w.bowl[0], w.bowl[1], w.top + 0.35, 1.1); }
        if (!w.mer && !w.bowl && w.top > 5) B.box('stone', cx, w.top, cz, W + 0.25, 0.16, D + 0.25, 0, TOPC);
      }
      for (const s of SLANTS) { prism(s.poly, BOT, WALL, 'stone'); for (const m of s.mer) merlons(m, WALL); lip(s.lip, WALL); }
      // the wall walks at the top corners (walked on: their floors aren't solid), and their parapets
      for (const wk of WALKS) {
        prism(wk.poly, BOT, H_W, 'stone', { topK: 'pave', topCol: [0.88, 0.86, 0.9], solid: false });
        for (const p of wk.parapets) B.box('stone', (X(p[0]) + X(p[2])) / 2, H_W, (Z(p[1]) + Z(p[3])) / 2, X(p[2]) - X(p[0]), WALL - H_W, Z(p[3]) - Z(p[1]), 0, STONE);
        for (const m of wk.mer) merlons(m, WALL);
      }

      // ---- the stairs up to the wall walks: stone treads on a solid flight against the wall, a stepped parapet on the
      // court side, newel posts with fire bowls at its foot and at the top on the wall side ----
      for (const [si, s] of STAIRS.entries()) {
        const xa = X(s.x0), xb = X(s.x1), L = s.yb - s.yt, west = si === 0;
        for (let k = 1; k <= s.n; k++) {
          const ya = s.yb - L * k / s.n, yb = s.yb - L * (k - 1) / s.n, top = H_W * k / s.n;
          B.box('stone', (xa + xb) / 2, -0.6, (Z(ya) + Z(yb)) / 2, xb - xa, top + 0.6, Z(yb) - Z(ya) + 0.02, 0, k % 2 ? [0.92, 0.9, 0.95] : [0.86, 0.84, 0.9]);
          B.box('stone', (xa + xb) / 2, top - 0.04, Z(yb) - 0.04, xb - xa, 0.05, 0.08, 0, [0.62, 0.6, 0.66]);   // the tread's worn nose
          // the parapet beside it, a tread at a time, down to just above the court
          if (yb <= 328) { const pa = west ? 274 : 1236, pb = west ? 302 : 1262; B.box('stone', (X(pa) + X(pb)) / 2, -0.6, (Z(ya) + Z(yb)) / 2, X(pb) - X(pa), top + 1.0 + 0.6, Z(yb) - Z(ya) + 0.02, 0, STONE); }
        }
        // the newel at the parapet's foot, with its fire bowl; and the one at the top, on the wall's side
        const nx0 = west ? 273 : 1231, nx1 = west ? 304 : 1263, nTop = stairH(s, 283) + 1.3;
        B.box('stone', (X(nx0) + X(nx1)) / 2, -0.6, Z(283), X(nx1) - X(nx0), nTop + 0.6, Z(300) - Z(266), 0, STONE);
        bowl((nx0 + nx1) / 2, 283, nTop, 0.85);
        const tx0 = west ? 172 : 1334, tx1 = west ? 205 : 1366, tTop = H_W + 1.25;
        B.box('stone', (X(tx0) + X(tx1)) / 2, -0.6, Z(167), X(tx1) - X(tx0), tTop + 0.6, Z(176) - Z(158), 0, STONE);
        bowl((tx0 + tx1) / 2, 167, tTop, 0.85);
      }

      // ---- the gatehouse: two solid halves, the arched passage between them (a stone vault), the spandrels round the arch
      // on both faces, a pale ring of voussoirs on the outer face, merlons along both edges, a lantern each side outside ----
      {
        const g = GATE, x0 = X(g.x0), x1 = X(g.x1), a0 = X(g.a0), a1 = X(g.a1), z0 = Z(g.y0), z1 = Z(g.y1), R = (a1 - a0) / 2, cx = (a0 + a1) / 2, sp = g.spring;
        B.box('stone', (x0 + a0) / 2, BOT, (z0 + z1) / 2, a0 - x0, g.top - BOT, z1 - z0, 0, STONE);
        B.box('stone', (a1 + x1) / 2, BOT, (z0 + z1) / 2, x1 - a1, g.top - BOT, z1 - z0, 0, STONE);
        B.box('stone', cx, sp + R, (z0 + z1) / 2, a1 - a0, g.top - sp - R, z1 - z0, 0, STONE);
        const N = 14, arc = (i) => { const a = Math.PI * i / N; return [cx + Math.cos(a) * R, sp + Math.sin(a) * R]; };
        for (let i = 0; i < N; i++) {
          const [xa, ya] = arc(i), [xb, yb] = arc(i + 1), ua = R * Math.PI * i / N, ub = R * Math.PI * (i + 1) / N;
          B.quad('stone', [xb, yb, z0], [xa, ya, z0], [xa, ya, z1], [xb, yb, z1], [ub, z0, ua, z1], [0.72, 0.7, 0.76]);           // the vault
          B.quad('stone', [xb, yb, z0], [xa, ya, z0], [xa, sp + R, z0], [xb, sp + R, z0], [xb, yb, xa, sp + R], STONE);         // the court face, above the arch
          B.quad('stone', [xa, ya, z1], [xb, yb, z1], [xb, sp + R, z1], [xa, sp + R, z1], [xa, ya, xb, sp + R], STONE);         // the road face
          // the voussoirs: a ring of paler stones standing a hand proud of both faces
          for (const [zf, s] of [[z1 + 0.12, 1], [z0 - 0.08, -1]]) {
            const [xc, yc] = [cx + Math.cos(Math.PI * i / N) * (R + 0.5), sp + Math.sin(Math.PI * i / N) * (R + 0.5)], [xd, yd] = [cx + Math.cos(Math.PI * (i + 1) / N) * (R + 0.5), sp + Math.sin(Math.PI * (i + 1) / N) * (R + 0.5)];
            if (s > 0) B.quad('stone', [xa, ya, zf], [xb, yb, zf], [xd, yd, zf], [xc, yc, zf], [ua, 0, ub, 0.5], [1.12, 1.1, 1.1]);
            else B.quad('stone', [xb, yb, zf], [xa, ya, zf], [xc, yc, zf], [xd, yd, zf], [ua, 0, ub, 0.5], [1.05, 1.03, 1.05]);
            B.quad('stone', [xb, yb, zf - s * 0.12], [xa, ya, zf - s * 0.12], [xa, ya, zf], [xb, yb, zf], null, [0.8, 0.78, 0.82]);
          }
        }
        // the jambs below the arch's spring, pale, on the road face
        for (const xj of [a0 - 0.25, a1 + 0.25]) B.box('stone', xj, roadH(834) - 0.1, z1 + 0.06, 0.5, sp - roadH(834) + 0.1, 0.12, 0, [1.08, 1.06, 1.06], { solid: false });
        wallMerlons([g.x0, g.y0, g.x1, g.y1], g.top, 'ns');
        for (const px of [668, 876]) { K.lantern(X(px), roadH(834) + 2.8, z1 + 0.32, [0, 0, 1], 0.95); K.light(px, 852, 120, 1.0, 'warm'); }
        // a lamp inside the passage, hanging from the vault
        rod('iron', [cx, sp + R - 0.05, (z0 + z1) / 2], [cx, sp + R - 0.9, (z0 + z1) / 2], 0.012);
        K.lantern(cx, sp + R - 1.3, (z0 + z1) / 2, null, 0.85, true);
      }
      // the two pillars, each with a cornice and an iron urn (its shield toward the court), and a banner on the road side
      for (const p of PILLARS) {
        const cx = (X(p[0]) + X(p[2])) / 2, cz = (Z(p[1]) + Z(p[3])) / 2, W = X(p[2]) - X(p[0]), D = Z(p[3]) - Z(p[1]);
        B.box('stone', cx, BOT, cz, W, PILLAR_TOP - BOT, D, 0, STONE);
        B.box('stone', cx, PILLAR_TOP - 0.05, cz, W + 0.3, 0.2, D + 0.3, 0, TOPC);
        const ux = cx, uz = Z(p[1]) + 0.9, y = PILLAR_TOP + 0.15;
        B.box('stone', ux, y - 0.02, uz, 1.0, 0.25, 1.0, 0, TOPC);
        B.cyl('iron', ux, y + 0.22, uz, 0.32, 0.2, 0.16, 10); B.cyl('iron', ux, y + 0.38, uz, 0.12, 0.12, 0.14, 8);
        B.cyl('iron', ux, y + 0.52, uz, 0.22, 0.5, 0.36, 12); B.cyl('iron', ux, y + 0.88, uz, 0.5, 0.34, 0.32, 12); B.cyl('iron', ux, y + 1.2, uz, 0.38, 0.38, 0.07, 12);
        B.cyl('iron', ux, y + 1.27, uz, 0.12, 0.02, 0.32, 6);
        B.box('iron', ux, y + 0.5, uz - 0.5, 0.55, 0.6, 0.07, 0, [1.25, 1.2, 1.15]); B.box('glass', ux, y + 0.72, uz - 0.545, 0.14, 0.14, 0.02, 0, GOLD);
        banner(cx, Z(p[3]), PILLAR_TOP - 2.2, 1.25, 3.0, [0, 1]);
      }

      // ---- the sunstone's niche: a curved wall round the dais, taller than the rest, merlons along its top ----
      {
        const cx = X(DAIS[0]), cz = Z(166), Rm = 4.92, N = 22, nm = [];
        for (let i = 0; i < N; i++) {
          const a0 = Math.PI + Math.PI * i / N, a1 = Math.PI + Math.PI * (i + 1) / N, am = (a0 + a1) / 2;
          const x = cx + Math.cos(am) * Rm, z = cz + Math.sin(am) * Rm, ry = Math.atan2(-Math.cos(am), -Math.sin(am));
          B.box('stone', x, BOT, z, Rm * (a1 - a0) * 1.12, 7.4 - BOT, 1.15, ry, [1.75, 1.3, 0.88]);
          nm.push([K.M.px(cx + Math.cos(am) * 4.55), K.M.py(cz + Math.sin(am) * 4.55)]);
        }
        merlons(nm, 7.4, 0.45);
      }

      // ---- the dais: three round steps of pale stone ----
      {
        const cx = X(DAIS[0]), cz = Z(DAIS[1]), hs = [0.2, 0.4, 0.6];
        STEP_R.forEach((r, i) => {
          const side = new THREE.CylinderGeometry(r, r, hs[i] + 0.3, 56, 1, true); B.geom('dais', side, new THREE.Matrix4().makeTranslation(cx, (hs[i] - 0.3) / 2, cz), [0.92, 0.86, 0.78], [TAU * r, 0.6]); side.dispose();
          const top = i < 2 ? new THREE.RingGeometry(STEP_R[i + 1], r, 56, 1) : new THREE.CircleGeometry(r, 56); top.rotateX(-Math.PI / 2);
          B.geom('dais', top, new THREE.Matrix4().makeTranslation(cx, hs[i], cz), [1.0, 0.95, 0.86], [2 * r, 2 * r]); top.dispose();
        });
      }
      // ---- the sunstone: a great cluster of amber crystals blazing with light, on the dais's top ----
      {
        const cx = X(770), cz = Z(170), y0 = 0.58;
        const shaft = new THREE.CylinderGeometry(0.9, 1, 0.78, 6, 1, true), tip = new THREE.ConeGeometry(0.9, 0.22, 6, 1, true);
        shaft.translate(0, 0.39, 0); tip.translate(0, 0.89, 0);
        // [x, z offset (m), radius, height, lean (radians)]
        const C = [[0, 0, 0.85, 5.4, 0], [-0.2, -0.85, 0.6, 4.3, 0.12], [-0.95, 0.3, 0.52, 3.5, 0.3], [0.95, 0.35, 0.56, 3.8, 0.28], [-1.55, 0.85, 0.42, 2.4, 0.5],
          [1.6, 0.8, 0.45, 2.6, 0.48], [-0.55, 1.2, 0.38, 2.0, 0.4], [0.6, 1.25, 0.4, 2.2, 0.38], [0.05, 1.55, 0.28, 1.3, 0.45], [-2.05, 0.2, 0.3, 1.4, 0.62],
          [2.1, 0.25, 0.33, 1.6, 0.6], [1.1, -0.7, 0.4, 2.9, 0.3], [-1.2, -0.6, 0.38, 2.7, 0.32]];
        const R0 = W3D.rand(55);
        for (let i = 0; i < 16; i++) { const a = R0() * TAU, d = 1.3 + R0() * 0.9; C.push([Math.cos(a) * d, Math.sin(a) * d, 0.1 + R0() * 0.12, 0.35 + R0() * 0.6, 0.5 + R0() * 0.5]); }
        // each face of a crystal its own shade, deep amber at its foot to pale gold at its point
        const FACET = [1.0, 0.74, 0.56, 0.66, 0.88, 1.12];
        for (const [ox, oz, r, h, lean] of C) {
          const L = Math.hypot(ox, oz) || 1, axis = new THREE.Vector3(oz / L, 0, -ox / L), q = new THREE.Quaternion().setFromAxisAngle(axis, lean).multiply(new THREE.Quaternion().setFromAxisAngle(UP, R0() * TAU));
          const m4 = new THREE.Matrix4().compose(new THREE.Vector3(cx + ox, y0 - 0.05, cz + oz), q, new THREE.Vector3(r, h, r)), seed = Math.floor(R0() * 6);
          const col = (v, i) => { const t = Math.max(0, Math.min(1, (v.y - y0) / h)), k = FACET[(Math.floor(i / 6) + seed) % 6]; return [(0.85 + 0.35 * t) * k, (0.36 + 0.44 * t) * k, (0.05 + 0.18 * t) * k]; };
          B.geom('glass', shaft, m4, col, 1); B.geom('glass', tip, m4, col, 1);
        }
        shaft.dispose(); tip.dispose();
        K.halo(cx, 3.0, cz - 0.6, 7.5, [0.75, 0.42, 0.12]); K.halo(cx, 1.2, cz, 5, [0.8, 0.45, 0.14]); K.halo(cx, 5.4, cz - 0.4, 3.2, [0.8, 0.6, 0.3]);
        K.lamps3d.push({ x: cx, y: 2.6, z: cz + 1.5, c: 0xffc060, k: 3.2 });
        K.addBlock(K.circlePx(770, 170, 2.15, 14));
      }
      // ---- the short iron posts and their chains round the dais (the front left open, up its steps) ----
      {
        const top = (px, py) => P['dawnroost-node'].walk_h(px, py);
        for (const [px, py] of POSTS) {
          const x = X(px), z = Z(py), y = top(px, py);
          B.cyl('iron', x, y, z, 0.11, 0.09, 0.12, 8); B.cyl('iron', x, y + 0.1, z, 0.07, 0.06, 1.0, 8);
          const sg = new THREE.SphereGeometry(0.1, 8, 6); B.geom('iron', sg, new THREE.Matrix4().makeTranslation(x, y + 1.18, z), null, 1); sg.dispose();
        }
        for (const [[ax, ay], [bx, by]] of CHAINS) {
          const A = [X(ax), top(ax, ay) + 0.92, Z(ay)], Bq = [X(bx), top(bx, by) + 0.92, Z(by)], L = Math.hypot(Bq[0] - A[0], Bq[2] - A[2]), n = Math.max(4, Math.round(L / 0.18));
          for (let i = 0; i < n; i++) {
            const t0 = i / n, t1 = (i + 1) / n, sag = (t) => 0.32 * Math.sin(Math.PI * t) * Math.min(1, L / 2);
            const p = [A[0] + (Bq[0] - A[0]) * t0, A[1] + (Bq[1] - A[1]) * t0 - sag(t0), A[2] + (Bq[2] - A[2]) * t0], q = [A[0] + (Bq[0] - A[0]) * t1, A[1] + (Bq[1] - A[1]) * t1 - sag(t1), A[2] + (Bq[2] - A[2]) * t1];
            rod('iron', p, q, 0.028);
          }
          // a chain stands in Io's way: a thin strip along it
          const nx = -(Z(by) - Z(ay)) / L, nz = (X(bx) - X(ax)) / L, w = 0.06;
          K.addBlock([[ax + nx * w / 0.04, ay + nz * w / 0.05], [bx + nx * w / 0.04, by + nz * w / 0.05], [bx - nx * w / 0.04, by - nz * w / 0.05], [ax - nx * w / 0.04, ay - nz * w / 0.05]]);
        }
      }
      // the two braziers flanking the dais
      brazier(567, 251, 1.6, 1.0, 0.5); brazier(973, 251, 1.6, 1.0, 0.5);

      // ---- the sun in the floor: a disc of dark paving in a pale kerb, a gold boss in the middle, sixteen wavy gold rays ----
      {
        const cx = X(MED[0]), cz = Z(MED[1]);
        const disc = (k, r0, r1, y, col) => { const g = r0 > 0 ? new THREE.RingGeometry(r0, r1, 64, 1) : new THREE.CircleGeometry(r1, 64); g.rotateX(-Math.PI / 2); B.geom(k, g, new THREE.Matrix4().makeTranslation(cx, y, cz), col, [2 * r1, 2 * r1]); g.dispose(); };
        disc('pave', 0, 3.85, 0.008, [0.52, 0.5, 0.6]); disc('dais', 3.85, MED_R, 0.012, [0.8, 0.76, 0.72]); disc('dais', 1.0, 1.3, 0.012, [0.7, 0.66, 0.64]);
        disc('glass', 0, 1.0, 0.016, GOLD); disc('glass', 0.74, 0.82, 0.02, GOLD_B); disc('glass', 3.8, 3.86, 0.016, GOLD_B);
        for (let k = 0; k < 16; k++) {
          const a = k * Math.PI / 8 + Math.PI / 2, long = k % 2 === 0, r0 = 1.3, r1 = long ? 3.6 : 2.5, W0 = long ? 0.17 : 0.12, N = 12, c = Math.cos(a), s = Math.sin(a);
          for (let i = 0; i < N; i++) {
            const ta = i / N, tb = (i + 1) / N, ra = r0 + (r1 - r0) * ta, rb = r0 + (r1 - r0) * tb, wa = W0 * (1 - ta) + 0.015, wb = W0 * (1 - tb) + 0.015;
            const oa = 0.09 * Math.sin(ta * 10), ob = 0.09 * Math.sin(tb * 10);
            const P2 = (r, o) => [cx + c * r - s * o, cz + s * r + c * o];
            flat('glass', [P2(ra, oa - wa / 2), P2(rb, ob - wb / 2), P2(rb, ob + wb / 2), P2(ra, oa + wa / 2)], 0.018, [0.82, 0.54, 0.14]);
          }
        }
      }
      // ---- the gold veins running out from the sunstone across the court, between its cobbles: the painting's, thinned to
      // lines, each cell joined to its neighbours ----
      {
        const cells = new Set(); for (const [px, py, len] of veinRuns()) for (let x = px; x < px + len; x += 2) cells.add(x + ',' + py);
        const has = (x, y) => cells.has(x + ',' + y), w = 0.034;
        const seg = (ax, ay, bx, by, col) => {
          const x0 = X(ax + 1), z0 = Z(ay + 1), x1 = X(bx + 1), z1 = Z(by + 1), dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), nx = -dz / L * w, nz = dx / L * w;
          flat('glass', [[x0 + nx, z0 + nz], [x1 + nx, z1 + nz], [x1 - nx, z1 - nz], [x0 - nx, z0 - nz]], 0.012, col);
        };
        let li = 0;
        for (const key of cells) {
          const [x, y] = key.split(',').map(Number), b = 0.62 + 0.6 * Math.exp(-mDist(x, y, 770, 200) / 9), col = [0.95 * b, 0.6 * b, 0.15 * b];
          let n = 0;
          for (const [dx, dy] of [[2, 0], [2, 2], [0, 2], [-2, 2]]) if (has(x + dx, y + dy)) { seg(x, y, x + dx, y + dy, col); n++; }
          if (!n && !has(x - 2, y) && !has(x - 2, y - 2) && !has(x, y - 2) && !has(x + 2, y - 2)) seg(x - 1, y, x + 1, y, col);
          if (li++ % 12 === 0) K.light(x + 1, y + 1, 26, 0.3, 'warm');
        }
      }

      // ---- the banners: on the north wall, beside the niche, on the stall yard's west wall, and on stands over the two
      // braziers in the court ----
      banner(X(377), Z(234), 4.4, 1.15, 2.6, [0, 1]); banner(X(1160), Z(234), 4.4, 1.15, 2.6, [0, 1]);
      banner(X(592), Z(170), 5.4, 1.2, 2.9, [0, 1]); banner(X(944), Z(170), 5.4, 1.2, 2.9, [0, 1]);
      banner(X(100), Z(458), 3.9, 1.0, 2.3, [1, 0]);
      banner(X(140), Z(687), 3.0, 1.1, 2.6, [-0.595, 0.804]);
      banner(X(1380), Z(753), 3.0, 1.1, 2.6, [0.2, 0.98]);
      for (const [px, py] of [[569, 489], [967, 489]]) {
        const by = brazier(px, py, 1.8, 1.1, 0.9), x = X(px), z = Z(py) - 0.55;
        B.cyl('iron', x, 0.85, z, 0.07, 0.06, 5.7, 7);
        B.box('iron', x, 6.2, z, 1.6, 0.07, 0.07, 0); for (const sx of [-0.82, 0.82]) { const g = new THREE.SphereGeometry(0.07, 6, 4); B.geom('iron', g, new THREE.Matrix4().makeTranslation(x + sx, 6.23, z), null, 1); g.dispose(); }
        B.cyl('iron', x, 6.5, z, 0.08, 0.01, 0.4, 6); const g = new THREE.SphereGeometry(0.1, 8, 6); B.geom('iron', g, new THREE.Matrix4().makeTranslation(x, 6.5, z), null, 1); g.dispose();
        banner(x, z + 0.02, 6.15, 1.3, 2.6, [0, 1]); void by;
      }

      // ---- the cypresses either side of the gate, by the south wall: slim dark flames of leaves ----
      for (const [px, py] of [[448, 688], [1092, 688]]) {
        const x = X(px), z = Z(py), y = 0;
        B.cyl('bark', x, y - 0.1, z, 0.14, 0.1, 0.9, 6);
        B.geom('leafBush', K.ico[0], new THREE.Matrix4().compose(new THREE.Vector3(x, y + 2.1, z), new THREE.Quaternion(), new THREE.Vector3(0.78, 2.0, 0.78)), [0.42, 0.56, 0.52], 2);
        B.geom('leafBush', K.ico[1], new THREE.Matrix4().compose(new THREE.Vector3(x, y + 3.7, z), new THREE.Quaternion(), new THREE.Vector3(0.5, 1.15, 0.5)), [0.46, 0.6, 0.55], 2);
        B.geom('leafBush', K.ico[2], new THREE.Matrix4().compose(new THREE.Vector3(x, y + 4.6, z), new THREE.Quaternion(), new THREE.Vector3(0.24, 0.55, 0.24)), [0.5, 0.64, 0.58], 2);
      }
      // ---- the pot plants at the stairs' feet and by the west bench: a wooden tub with a flowering shrub ----
      for (const [px, py] of [[292, 370], [1244, 370], [336, 632]]) {
        const x = X(px), z = Z(py);
        B.cyl('wood', x, 0, z, 0.42, 0.36, 0.5, 10, WOOD, [2.4, 0.5]); B.cyl('iron', x, 0.36, z, 0.43, 0.43, 0.05, 10, null, null, true);
        B.geom('leafBush', K.ico[(px >> 2) % 3], new THREE.Matrix4().compose(new THREE.Vector3(x, 1.0, z), new THREE.Quaternion(), new THREE.Vector3(0.5, 0.62, 0.5)), [0.6, 0.72, 0.62], 1.6);
        for (const a of [0, 1.57]) B.quad('fl_mix', [x - Math.cos(a) * 0.45, 0.75, z - Math.sin(a) * 0.45], [x + Math.cos(a) * 0.45, 0.75, z + Math.sin(a) * 0.45], [x + Math.cos(a) * 0.45, 1.5, z + Math.sin(a) * 0.45], [x - Math.cos(a) * 0.45, 1.5, z - Math.sin(a) * 0.45], [0, 0, 1, 1]);
      }

      // ---- a stall: four posts, a striped awning sloping to the front, its hanging edge, a counter of goods under it ----
      function stall(xa, xb, yb, yf) {
        const x0 = X(xa), x1 = X(xb), zf = Z(yf), zb = Z(yb), E = [0.62, 0.5, 0.44];
        for (const x of [x0 + 0.1, x1 - 0.1]) { B.box('wood', x, 0, zf - 0.1, 0.12, 2.3, 0.12, 0, E); B.box('wood', x, 0, zb + 0.1, 0.12, 2.9, 0.12, 0, E); }
        B.box('wood', (x0 + x1) / 2, 2.2, zf - 0.1, x1 - x0, 0.1, 0.1, 0, E, { solid: false }); B.box('wood', (x0 + x1) / 2, 2.8, zb + 0.1, x1 - x0, 0.1, 0.1, 0, E, { solid: false });
        const n = Math.max(2, Math.round((x1 - x0) / 1.4)), W = (x1 - x0 + 0.4) / n;
        for (let i = 0; i < n; i++) {
          const a = x0 - 0.2 + W * i, b = a + W, sag = 0.08;
          B.quad('cloth', [a, 2.25, zf + 0.25], [b, 2.25, zf + 0.25], [b, 2.95, zb - 0.05], [a, 2.95, zb - 0.05], [a, 0, b, zf - zb]);
          for (let s = 0; s < 3; s++) { const u = a + W * s / 3, v = u + W / 3; B.quad('cloth', [u, 1.95 - sag, zf + 0.26], [v, 1.95 - sag, zf + 0.26], [v, 2.25, zf + 0.26], [u, 2.25, zf + 0.26], [0.29, 0, 0.36, 0.3]); B.tri('cloth', [u, 1.95 - sag, zf + 0.26], [v, 1.95 - sag, zf + 0.26], [(u + v) / 2, 1.8 - sag, zf + 0.26], [[0.29, 0], [0.36, 0], [0.33, -0.15]]); }
        }
        // red rope trim along the awning's front
        rod('cloth', [x0 - 0.2, 2.24, zf + 0.27], [x1 + 0.2, 2.24, zf + 0.27], 0.03, [1, 1, 1]);
        B.box('wood', (x0 + x1) / 2, 0, zf - 0.55, x1 - x0 - 0.6, 0.9, 0.7, 0, [0.8, 0.66, 0.56]);
        B.quad('produce', [x0 + 0.4, 0.91, zf - 0.22], [x1 - 0.4, 0.91, zf - 0.22], [x1 - 0.4, 1.12, zf - 0.85], [x0 + 0.4, 1.12, zf - 0.85], [0, 0, 1, 1]);
        B.box('wood', (x0 + x1) / 2, 0, zb + 0.6, x1 - x0 - 1.0, 0.8, 0.6, 0, [0.72, 0.6, 0.52]);
        for (let i = 0; i < 6; i++) { const x = x0 + 0.9 + i * (x1 - x0 - 1.8) / 5, z = zb + 0.6; B.cyl(i % 2 ? 'stone' : 'wood', x, 0.8, z, 0.12, 0.14, 0.24, 7, i % 2 ? [0.7, 0.85, 0.8] : [0.85, 0.7, 0.5]); }
        return { x0, x1, zf, zb };
      }
      // the west stall, its lantern, its little orange banners, a small table of goods and a pot
      {
        const s = stall(148, 272, 424, 492);
        K.lantern(s.x0 + 0.1, 1.5, s.zf - 0.1, null, 0.8, true);
        for (const px of [178, 236]) { const x = X(px); B.quad('cloth', [x - 0.2, 1.3, s.zf + 0.28], [x + 0.2, 1.3, s.zf + 0.28], [x + 0.2, 1.95, s.zf + 0.28], [x - 0.2, 1.95, s.zf + 0.28], [0.06, 0, 0.12, 0.65], [1.6, 1.15, 0.7]); }
        const tx = X(205), tz = Z(522);
        B.box('wood', tx, 0.7, tz, 1.0, 0.07, 0.65, 0, WOOD); for (const [dx, dz] of [[-0.42, -0.26], [0.42, -0.26], [0.42, 0.26], [-0.42, 0.26]]) B.box('wood', tx + dx, 0, tz + dz, 0.06, 0.7, 0.06, 0, WOOD);
        for (let i = 0; i < 4; i++) B.box('wood', tx - 0.33 + i * 0.22, 0.77, tz, 0.16, 0.14, 0.16, i * 0.4, [0.9, 0.75, 0.55]);
        B.cyl('stone', X(152), 0, Z(538), 0.2, 0.28, 0.42, 9, [1.3, 0.75, 0.55]);
      }
      // the east stall and its lantern; the lantern on its banner pole in the corner
      {
        const s = stall(1290, 1388, 436, 502);
        K.lantern(s.x1 - 0.1, 1.5, s.zf - 0.1, null, 0.8, true);
      }
      // the weapon rack: two posts and three rails, a row of spears leaning in it, a red banner hung on its front
      {
        const x0 = X(1194), x1 = X(1284), z = Z(518), E = [0.62, 0.5, 0.44];
        for (const x of [x0, x1]) B.box('wood', x, 0, z, 0.16, 2.3, 0.16, 0, E);
        for (const y of [0.35, 1.3, 2.15]) B.box('wood', (x0 + x1) / 2, y, z, x1 - x0, 0.09, 0.09, 0, E);
        for (let i = 0; i < 9; i++) {
          if (i === 4) continue;
          const x = x0 + 0.3 + i * (x1 - x0 - 0.6) / 8;
          rod('wood', [x, 0.05, z + 0.12], [x + 0.06, 2.55, z - 0.05], 0.025, [0.7, 0.58, 0.48]);
          B.cyl('iron', x + 0.065, 2.55, z - 0.055, 0.045, 0.0, 0.3, 4, [1.4, 1.4, 1.5]);
        }
        banner((x0 + x1) / 2, z + 0.06, 2.1, 0.9, 1.7, [0, 1]);
      }
      // the lantern on a pole, with a little orange banner, at the far end of the strip behind the east stall, and the small
      // stone shrine there: a shard of sunstone glowing on it
      {
        const x = X(1426), z = Z(452);
        B.box('wood', x, 0, z, 0.14, 2.6, 0.14, 0, [0.62, 0.5, 0.44]); B.box('wood', x - 0.25, 2.5, z, 0.6, 0.08, 0.08, 0, [0.62, 0.5, 0.44]);
        K.lantern(x - 0.48, 2.0, z, null, 0.8, true);
        B.quad('cloth', [x - 0.02, 1.0, z - 0.25], [x - 0.02, 1.0, z + 0.25], [x - 0.02, 1.9, z + 0.25], [x - 0.02, 1.9, z - 0.25], [0.06, 0, 0.12, 0.9], [1.6, 1.15, 0.7]);
        const sx = X(1414), sz = Z(468);
        B.box('stone', sx, 0, sz, 0.7, 0.75, 0.5, 0, [1.0, 0.96, 0.92]); B.box('stone', sx, 0.75, sz, 0.85, 0.1, 0.6, 0, TOPC);
        const sh = new THREE.ConeGeometry(0.08, 0.36, 6), sh2 = new THREE.ConeGeometry(0.05, 0.22, 6);
        B.geom('glass', sh, new THREE.Matrix4().makeTranslation(sx, 1.03, sz), [1.5, 0.9, 0.3], 1); B.geom('glass', sh2, new THREE.Matrix4().compose(new THREE.Vector3(sx + 0.08, 0.97, sz + 0.02), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.5), new THREE.Vector3(1, 1, 1)), [1.4, 0.8, 0.25], 1);
        sh.dispose(); sh2.dispose();
        K.halo(sx, 1.05, sz, 1.1, [1.0, 0.7, 0.3]); K.light(1414, 474, 50, 0.6, 'warm'); K.light(1408, 456, 90, 0.7, 'warm');
      }

      // ---- the covered wagon in the west stall yard: a wooden bed on four wheels, a grey canvas hood with red trim ----
      {
        const x = X(256), z = Z(640), L = 3.2, Wd = 1.45, E = [0.7, 0.55, 0.46];
        B.box('wood', x, 0.55, z, L, 0.3, Wd, 0, WOOD);
        for (const s of [-1, 1]) B.box('wood', x, 0.85, z + s * (Wd / 2 - 0.04), L, 0.4, 0.08, 0, E);
        for (const s of [-1, 1]) B.box('wood', x + s * (L / 2 - 0.04), 0.85, z, 0.08, 0.4, Wd, 0, E);
        const wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 14); wheel.rotateX(Math.PI / 2);
        for (const sx of [-1.05, 1.05]) for (const sz of [-1, 1]) B.geom('wood', wheel, new THREE.Matrix4().makeTranslation(x + sx, 0.5, z + sz * (Wd / 2 + 0.1)), [0.6, 0.48, 0.4], 1);
        wheel.dispose();
        const hood = new THREE.CylinderGeometry(0.8, 0.8, L - 0.5, 12, 1, true, 0, Math.PI); hood.rotateZ(Math.PI / 2);
        B.geom('canvas', hood, new THREE.Matrix4().makeTranslation(x - 0.15, 1.25, z), [0.95, 0.95, 0.98], [2, 2]); hood.dispose();
        const back = new THREE.CircleGeometry(0.8, 10, 0, Math.PI); back.rotateY(-Math.PI / 2);
        B.geom('canvas', back, new THREE.Matrix4().makeTranslation(x - 0.15 - (L - 0.5) / 2, 1.25, z), [0.85, 0.85, 0.88], [1.6, 1.6]); back.dispose();
        for (const s of [-1, 1]) rod('cloth', [x - 0.15 - (L - 0.5) / 2, 1.27, z + s * 0.8], [x - 0.15 + (L - 0.5) / 2, 1.27, z + s * 0.8], 0.04);
        for (const s of [-0.3, 0.3]) rod('wood', [x + L / 2, 0.6, z + s], [x + L / 2 + 1.3, 0.45, z + s * 0.4], 0.04, E);
        K.addBlock([[256 - (L / 2 + 0.1) / 0.04, 640 - (Wd / 2 + 0.2) / 0.05], [256 + (L / 2 + 0.6) / 0.04, 640 - (Wd / 2 + 0.2) / 0.05], [256 + (L / 2 + 0.6) / 0.04, 640 + (Wd / 2 + 0.2) / 0.05], [256 - (L / 2 + 0.1) / 0.04, 640 + (Wd / 2 + 0.2) / 0.05]]);
      }

      // ---- climbing flowers on the gate pillars and the walls' court faces, as the painting has them ----
      for (const [px, py, h, n] of [[628, 826, 3.0, [0, 1]], [910, 826, 3.0, [0, 1]], [636, 630, 2.6, [0, -1]], [902, 630, 2.6, [0, -1]], [430, 700, 2.4, [0, -1]], [520, 700, 2.0, [0, -1]],
        [1010, 700, 2.2, [0, -1]], [1180, 700, 2.0, [0, -1]], [330, 234, 2.2, [0, 1]], [540, 234, 2.6, [0, 1]], [1000, 234, 2.6, [0, 1]], [1230, 234, 2.0, [0, 1]]]) {
        const x = X(px), z = Z(py) + n[1] * 0.06, y = P['dawnroost-node'].ground_h(px, py) - 0.1;
        for (let i = 0; i < 3; i++) { const u = (i - 1) * 0.45, hh = h * (0.7 + 0.3 * ((i + px) % 3) / 2); B.quad('fl_white', [x + u - 0.35, y, z], [x + u + 0.35, y, z], [x + u + 0.35, y + hh, z], [x + u - 0.35, y + hh, z], [0, 0, 1, hh / 0.9]); }
      }

      // ---- outside the walls: the hill's rocks and its flowering bushes ----
      {
        const r = W3D.rand(303);
        for (let i = 0; i < 520; i++) {
          const px = -300 + r() * 2140, py = -260 + r() * 1580, dOut = inPoly(CASTLE, px, py) ? -1 : edgeDist(CASTLE, px, py), roll = r();
          if (dOut < 14 || dOut > 420) continue;
          if (py > 820 && Math.abs(px - 768) < 150) continue;                 // the road and its verges
          const y = K.terrain(px, py), x = X(px), z = Z(py);
          if (roll < 0.45) {
            const sz = 0.8 + r() * 1.7 * (dOut < 120 ? 1.2 : 0.8);
            B.geom('rock', K.rockG[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y - sz * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(sz, sz * (0.8 + r() * 0.5), sz)), null, 1.2);
          } else if (roll < 0.72) {
            const rr = 0.7 + r() * 0.8, h = rr * 0.8, kind = ['fl_white', 'fl_mix', 'fl_white', 'fl_sun'][Math.floor(r() * 4)];
            B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.5, z), new THREE.Quaternion(), new THREE.Vector3(rr, h, rr)), [0.45, 0.55, 0.52], 2.2);
            for (let k = 0; k < 3; k++) { const a = r() * TAU, d = r() * rr * 0.6, fx = x + Math.cos(a) * d, fz = z + Math.sin(a) * d, s = 0.45, t = r() * Math.PI, fy = y + h * (0.5 + r() * 0.5);
              B.quad(kind, [fx - Math.cos(t) * s, fy - 0.3, fz - Math.sin(t) * s], [fx + Math.cos(t) * s, fy - 0.3, fz + Math.sin(t) * s], [fx + Math.cos(t) * s, fy + 0.5, fz + Math.sin(t) * s], [fx - Math.cos(t) * s, fy + 0.5, fz - Math.sin(t) * s], [0, 0, 1, 1]); }
          }
        }
        // flowering bushes along the road's verges, outside its low walls
        for (let py = 846; py < 1300; py += 22 + r() * 18) for (const side of [-1, 1]) {
          const px = 768 + side * (132 + r() * 40), x = X(px), z = Z(py), y = K.terrain(px, py), rr = 0.7 + r() * 0.5, h = rr * 0.85;
          B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.5, z), new THREE.Quaternion(), new THREE.Vector3(rr, h, rr)), [0.45, 0.56, 0.52], 2.2);
          const t = r() * Math.PI; B.quad(r() < 0.5 ? 'fl_white' : 'fl_sun', [x - Math.cos(t) * 0.45, y + h * 0.4, z - Math.sin(t) * 0.45], [x + Math.cos(t) * 0.45, y + h * 0.4, z + Math.sin(t) * 0.45], [x + Math.cos(t) * 0.45, y + h * 1.1, z + Math.sin(t) * 0.45], [x - Math.cos(t) * 0.45, y + h * 1.1, z - Math.sin(t) * 0.45], [0, 0, 1, 1]);
        }
      }
    },
  };
})(window);
