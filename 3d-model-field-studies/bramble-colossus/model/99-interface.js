 // ---------- interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function anchor(name, out) {
  out = out || V3();
  switch (name) {
   case 'hit': case 'tip': return tipW(LEAD, out);
   case 'lure': case 'bloom': return heart.localToWorld(out.set(0, 1.25, 0)); // the open flower's middle, over the heart
   case 'heart': return heart.localToWorld(out.set(0, .55, 0));               // its weak point, hidden while the bud is shut
   case 'head': case 'top': case 'bud': return bud.localToWorld(out.set(0, 2.1, 0));
   case 'crown': case 'mouth': return mass.localToWorld(out.set(0, CH * .6, 0));
   case 'grasp': return tipW(LEAD, out).add(tipW(MATE, _a)).multiplyScalar(.5);
   case 'held': return out.copy(held); // where a held prey's chest belongs; see holding and inside
   case 'snare': case 'impact': { const tg = state.target; return tg ? out.set(tg.x, root.position.y, tg.z) : root.localToWorld(out.set(0, 0, REACH * SZ)); }
   case 'feet': return out.copy(root.position);
   default: { // 'chest' and anything else: the front of the spire, halfway up
    const m = /^cane(\d+)$/.exec(name); if (m && CANES[+m[1]]) return tipW(CANES[+m[1]], out);
    return SP[3].localToWorld(out.set(0, 0, .5));
   }
  }
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0, nb = 0; const texs = new Set();
 root.traverse((o) => { if (o.isBone) nb++; if (o.isMesh || o.isPoints) { draws++; if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'normalMap', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 fx.traverse((o) => { if (o.isMesh || o.isPoints) draws++; });
 return {
  root, fx, animate, play, ACTIONS, anchor, sever, regrow,
  guard(on) { gOn = !!on; },
  reset() { actv = null; gOn = false; gW = 0; Object.assign(FIN, BASE); regrow(); state.wilt = 0; charV = 0; VW.t = 9; HB = 0; for (const C of CANES) C.sp = null; spInit = false; for (const S of TVS) S.t = -1; for (let i = 0; i < NTV; i++) TV.setMatrixAt(i, M0); TV.instanceMatrix.needsUpdate = true; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return 0; }, get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get gone() { return FIN.fade < .02 && !!actv && actv.name === 'die'; },
  get holding() { return holdV; },               // 0 to 1: how firmly it holds its prey (Devour); the prey belongs at anchor('held')
  get inside() { return cl(FIN.inn, 0, 1); },   // 0 to 1: the prey is inside the shut bud (Devour); over .5 the battle hides it
  get open() { return cl(FIN.op, 0, 1.5); },    // how open the bud is: over about .6 its heart is bare to blows
  get wrath() { return wrathV; },
  get canes() { return CANES.filter((c) => c.cutJ < 0).length; },
  get greatCanes() { return CANES.filter((c) => c.great && c.cutJ < 0).length; },
  height: (BY + 2.35) * SZ, width: 11 * SZ, reach: REACH * SZ, level: LEVEL, variant: 'colossus',
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: nb }
 };
}
