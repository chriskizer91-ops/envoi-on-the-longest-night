// stage-halcyon.js: Halcyon's battle staging for the bench. Her blows land on the Witch and Sol with the
// bible's level 20 numbers; Sol calls "Kestrel!" when Halcyon staggers; Light-Drinker heals her by what it takes.
window.STAGES = window.STAGES || {};
window.STAGES.halcyon = (function () {
  const HITS = {
    gloamCleave: [['sol', 1100]],
    duskArc: [['witch', 800], ['sol', 800]],
    severance: [['witch', 900]],
    lightDrinker: [['sol', 700, 'drain']],
    counter: [['sol', 900]],
    blackNoon: [['witch', 2400], ['sol', 2400]],
  };
  return {
    onAction(ctx, a) {
      if (a === 'stagger' && ctx.actors.sol && ctx.actors.sol.visible) ctx.actors.sol.play('kestrel', true);
    },
    onHit(ctx, a, i) {
      const list = HITS[a]; if (!list) return false;
      const m = ctx.subject.m, v = new ctx.THREE.Vector3();
      ctx.ring(m.anchor('hit', v), 'hit');
      list.forEach(([id, n, kind], k) => {
        const dealt = ctx.swing(n, 0.08);
        ctx.damage(id, dealt, '', k * 90);
        if (kind === 'drain') ctx.damage('halcyon', '+' + dealt.toLocaleString('en-US'), 'heal', 300);
      });
      return true;
    },
    wide(ctx) { const a = ctx.subject.action; return a === 'duskArc' || a === 'blackNoon' || a === 'blackNoonCharge' || a === 'stagger'; },
    label(ctx) {
      const a = ctx.subject.action, s = ctx.subject;
      if (a === 'die' && !s.busy) return 'Gone home. Press Appear';
      if (a === 'retreat' && !s.busy) return 'Gone into the dark. Press Appear';
      if (a === 'vowStance' && !s.busy) return "Warden's Vow: she counters any blow. Press Counter";
      if (a === 'blackNoonCharge' && !s.busy) return 'Black Noon is charging. Press Black Noon';
      return null;
    },
  };
})();
