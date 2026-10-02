// stage-sol.js: Sol's battle staging for the bench. Her blows land on a Shadow Wraith with the bible's level 1
// numbers; above 70 Heat she is in Sunburn and hits 35% harder (lore bible, "Heat and Sunburn").
window.STAGES = window.STAGES || {};
window.STAGES.sol = (function () {
  const S = { heat: 0, trance: 0 };
  const HITS = {
    combo: [90, 95, 150], flareCut: [520], sunder: [280], emberRush: [170, 170, 170, 170],
    solarCrest: [null], daybreak: [120, 120, 120, 120, 260], highNoon: [160, 160, 160, 160, 160, 160, 900],
  };
  function apply(ctx) { const m = ctx.subject.m; if (!m || !m.state) return; m.state.heat = S.heat / 100; m.state.sunburn = S.heat >= 70 ? 1 : 0; m.state.trance = S.trance; }
  return {
    onBuild(ctx) { apply(ctx); },
    setHeat(ctx, v) { S.heat = v; apply(ctx); },
    setTrance(ctx, v) { S.trance = v; apply(ctx); },
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
    wide(ctx) { const a = ctx.subject.action; return a === 'emberRush' || a === 'solarCrest' || a === 'highNoon'; },
    label(ctx) {
      const a = ctx.subject.action;
      if (!a && S.heat >= 70) return 'Sunburn: every hit 35% harder';
      return null;
    },
  };
})();
