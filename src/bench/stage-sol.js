// stage-sol.js: Sol's battle staging for the bench. Her blows land on a Shadow Wraith with the bible's level 1
// numbers; above 70 Heat she is in Sunburn and hits 35% harder (lore bible, "Heat and Sunburn").
// Kestrel Stoop takes two turns: she rises and hovers, then stoops onto the target for the biggest single hit in the game.
window.STAGES = window.STAGES || {};
window.STAGES.sol = (function () {
  const S = { heat: 0, trance: 0 };
  const HITS = {
    combo: [90, 95, 150], flareCut: [520], sunder: [280], emberRush: [170, 170, 170, 170],
    solarCrest: [null], daybreak: [120, 120, 120, 120, 260], highNoon: [160, 160, 160, 160, 160, 160, 900],
    stoop: [1500], // one blow that beats two turns of Ember Rush (2 x 4 x 170)
  };
  const AIR = { stoopRise: 1, stoop: 1 };
  function apply(ctx) { const m = ctx.subject.m; if (!m || !m.state) return; m.state.heat = S.heat / 100; m.state.sunburn = S.heat >= 70 ? 1 : 0; m.state.trance = S.trance; }
  return {
    onBuild(ctx) { apply(ctx); },
    setHeat(ctx, v) { S.heat = v; apply(ctx); },
    setTrance(ctx, v) { S.trance = v; apply(ctx); },
    // in the air: keep her in frame, and turn her to face her prey until the dive starts (the battle aims her the same way)
    update(ctx) {
      const sub = ctx.subject, a = sub.action, m = sub.m;
      if (!m) return;
      const air = !!AIR[a];
      sub.spec.tall = air && m.lift > .3 ? 2.4 + m.lift : undefined;
      const w = ctx.actors.wraith;
      if (air && w && (a === 'stoopRise' || sub.progress < .1)) sub.yaw += ctx.wrapA(ctx.faceYaw(sub, w) - sub.yaw) * .2;
    },
    onHit(ctx, a, i) {
      const list = HITS[a]; if (!list) return false;
      const m = ctx.subject.m, v = new ctx.THREE.Vector3();
      let n = list[i] === null ? Math.max(600, 12 * S.heat) : list[i];
      if (n === undefined) return true;
      if (S.heat >= 70 || S.trance > 0.5) n *= 1.35;
      ctx.ring(m.anchor('hit', v), 'hit');
      ctx.damage('wraith', ctx.swing(Math.round(n), 0.1));
      return true;
    },
    wide(ctx) { const a = ctx.subject.action; return a === 'emberRush' || a === 'solarCrest' || a === 'highNoon' || !!AIR[a]; },
    label(ctx) {
      const sub = ctx.subject, a = sub.action;
      if (a === 'stoopRise' && !sub.busy) return 'Kestrel Stoop: hovering. Press Stoop to dive';
      if (!a && S.heat >= 70) return 'Sunburn: every hit 35% harder';
      return null;
    },
  };
})();
