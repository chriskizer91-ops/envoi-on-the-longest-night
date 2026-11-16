// io-new-moves.frag.js: new moves for Moon Faire's Io, written the way her own moves are (models/io-3d/src/I99_static.js on
// moon-faire's claude/io-3d-model): every frame her bones go back to rest, the move is laid on top with add(), her hands are
// sent to points in her own space (reaches, aims), and her hair, skirt, book and face follow by themselves.
// tools/patch-io.mjs puts the part above the line before her body() function and the part below it inside body(), just
// before Silverleaf Salve. She faces +z; her right hand is the 'R' side, at negative x. Heights in metres: hips 0.95,
// chest 1.2, shoulders 1.3, head 1.5.
// These are the bodies for Envoi's spells; the spells' lights are Envoi's own (src/fx/battle-fx.js, src/fx/io-spells.js),
// cast by the page at the moments named in src/moon-io.js (cues and hits).
//   e_throw  Flame: witchfire gathers in her right palm, she winds back and throws it overhand
//   e_raise  Crescent Blades: her right hand goes up as the blades gather round her, then sweeps forward at the foe
//   e_grasp  Briars: she leans in, her right palm low over the ground ahead, and closes her fist as the briars grip
//   e_bless  Mend, Moonsteel, Harvest Moon: her right palm offered up toward a friend, her book open in her left hand
//   e_sky    Waxing Light, a summons: both arms up to the sky, her book floating at her side
//   e_moon   Moonlight: both arms up gathering the moon, then her right hand brings the beam down on the foe
//   e_guard  Defend: she sets her feet, the book hugged, her right palm up before her (held until another move)
const eKey = (K, T, out) => {       // a point along keys [[t, x, y, z], ...], eased between them
  if (T <= K[0][0]) return out.set(K[0][1], K[0][2], K[0][3]);
  for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (T <= b[0]) { const u = sm(a[0], b[0], T); return out.set(lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)); } }
  const z = K[K.length - 1]; return out.set(z[1], z[2], z[3]);
};
const E_VIO = [0.80, 0.46, 1.0], E_SIL = [0.82, 0.90, 1.0], E_MINT = [0.70, 1.0, 0.80];
const E_THROW = [[0.0, -0.22, 1.06, 0.24], [0.40, -0.31, 1.56, -0.14], [0.47, -0.30, 1.58, -0.12], [0.60, -0.15, 1.48, 0.44], [0.82, -0.05, 1.12, 0.46], [1.25, -0.20, 1.06, 0.26]];
const E_RAISE = [[0.0, -0.20, 1.10, 0.25], [0.55, -0.19, 1.80, 0.12], [1.15, -0.19, 1.82, 0.14], [1.42, -0.11, 1.42, 0.58], [2.0, -0.11, 1.40, 0.56]];
const E_GRASP = [[0.0, -0.22, 1.05, 0.22], [0.50, -0.15, 0.74, 0.60], [1.08, -0.15, 0.73, 0.62], [1.24, -0.14, 0.88, 0.52], [1.6, -0.18, 0.95, 0.40]];
const E_BLESS = [[0.0, -0.22, 1.05, 0.22], [0.52, -0.15, 1.23, 0.50], [1.55, -0.13, 1.25, 0.53]];
const E_MOON_R = [[0.0, -0.22, 1.08, 0.22], [0.55, -0.40, 1.80, 0.18], [1.40, -0.40, 1.84, 0.18], [1.66, -0.10, 1.38, 0.60], [2.7, -0.10, 1.36, 0.58]];
//@@BLOCKS@@
    if (N === 'e_throw') {
      const arm = pulse(T, 0.0, 0.18, 1.05, 1.45), wind = pulse(T, 0.05, 0.40, 0.47, 0.60), thr = pulse(T, 0.50, 0.62, 0.80, 1.20), st = pulse(T, 0.05, 0.40, 1.00, 1.40), w = pulse(T, 0.0, 0.15, 1.20, 1.45);
      HUG.want = T < 1.40; hugArm(reaches, aims, w);
      add('hips', 0, -0.26 * wind + 0.30 * thr, 0); add('spine1', 0.05 * thr, -0.20 * wind + 0.24 * thr, 0); add('spine2', 0.05 * thr, -0.16 * wind + 0.20 * thr, 0); add('spine3', -0.05 * wind + 0.06 * thr, 0, 0);
      add('neck', 0, 0.20 * wind - 0.18 * thr, 0); add('head', -0.04 * wind, 0.24 * wind - 0.22 * thr, 0);       // her eyes stay on the foe while her body winds
      ank.L.z += 0.16 * st; ank.L.x += 0.03 * st; ank.R.z -= 0.09 * st; ank.R.x -= 0.02 * st; SK.hips.position.y -= 0.04 * st; SK.hips.position.z += 0.05 * thr;
      reaches.push(['R', eKey(E_THROW, T, V3()), arm, -0.45 + 0.3 * thr]);
      if (T < 0.52) aims.push(['R', V3(0.25, 0.35, -1), V3(0, 1, 0.1), wind]); else aims.push(['R', V3(0.05, 0.45, 1), V3(0, -0.2, 1), thr]);
      fingers('R', T < 0.56 ? lerp(0.24, 0.85, sm(0.05, 0.3, T)) : lerp(0.08, 0.24, sm(0.9, 1.3, T)));
      if (T > 0.1 && T < 0.85) emo = 'casting'; else if (T > 0.85 && T < 1.3) mouth = 'smile';
      afterHands = () => { const ch = pulse(T, 0.08, 0.32, 0.56, 0.62); if (ch < 0.01) return;
        const hp = carried('handR', SKL.mid.x, SKL.mid.y, SKL.mid.z, sp1); glow(hp, 0.17 * ch, E_VIO, 0.9 * ch); glow(hp, 0.06 * ch, FXC.pearl, ch, 1);
        if (frnd() < 0.7 * ch) emit(hp.x + frs(0.03), hp.y + frs(0.03), hp.z + frs(0.03), frs(0.12), 0.1 + frnd() * 0.3, frs(0.12), 0.4 + frnd() * 0.4, 0.016 + frnd() * 0.012, E_VIO, 1, 1.6, -0.2); };
    }
    if (N === 'e_raise') {
      const arm = pulse(T, 0.05, 0.40, 1.95, 2.35), up = pulse(T, 0.15, 0.55, 1.15, 1.40), fw = pulse(T, 1.20, 1.42, 1.90, 2.30);
      SPB.want = T > 0.05 && T < 2.2; carried('spine3', 0.12, 1.02, 0.22, SPB.P); SPB.f.set(-0.42, 0.30, 0.86); SPB.n.set(-0.06, 0.90, -0.43);
      add('head', -0.20 * up + 0.02 * fw, 0.04 * up, 0); add('neck', -0.08 * up, 0, 0); add('spine3', -0.05 * up + 0.04 * fw, 0.10 * fw, 0); add('spine2', -0.03 * up + 0.04 * fw, 0.08 * fw, 0); add('hips', 0, 0.10 * fw, 0);
      SK.hips.position.z += 0.04 * fw; ank.L.z += 0.10 * fw; ank.R.z -= 0.05 * fw;
      reaches.push(['R', eKey(E_RAISE, T, V3()), arm, -0.3]);
      if (up > 0.01) aims.push(['R', V3(0.05, 1, 0.12), V3(0.0, 0.1, 1), up]);
      if (fw > 0.01) aims.push(['R', V3(0.02, 0.05, 1), V3(0.25, -1, 0), fw]);
      fingers('R', lerp(0.24, 0.04, Math.max(up, fw)));
      if (T > 0.2 && T < 2.0) emo = 'casting';
      afterHands = () => { const g = Math.max(up, fw) * pulse(T, 0.2, 0.5, 1.6, 2.0); if (g < 0.01) return;
        const hp = carried('handR', SKL.mid.x, SKL.mid.y, SKL.mid.z, sp1); glow(hp, 0.16 * g, E_SIL, 0.8 * g); glow(hp, 0.05 * g, FXC.pearl, g, 1);
        if (frnd() < 0.5 * g) emit(hp.x + frs(0.04), hp.y + frs(0.04), hp.z + frs(0.04), frs(0.08), 0.05 + frnd() * 0.2, frs(0.08), 0.5 + frnd() * 0.5, 0.014, E_SIL, 1, 1.4, -0.05); };
    }
    if (N === 'e_grasp') {
      const arm = pulse(T, 0.05, 0.40, 1.40, 1.85), q = pulse(T, 0.10, 0.50, 1.30, 1.80), shut = sm(1.08, 1.22, T) * (1 - sm(1.45, 1.8, T)), w = pulse(T, 0.0, 0.15, 1.6, 1.85);
      HUG.want = T < 1.75; hugArm(reaches, aims, w);
      SK.hips.position.y -= 0.14 * q; SK.hips.position.z += 0.04 * q; add('hips', 0.06 * q, 0, 0); add('spine1', 0.20 * q, 0.06 * q, 0); add('spine2', 0.12 * q, 0.04 * q, 0); add('neck', -0.06 * q, 0, 0); add('head', -0.10 * q, 0, 0);
      ank.L.z += 0.15 * q; ank.L.x += 0.03 * q; ank.R.z -= 0.10 * q; footP.R = Math.max(footP.R, 0.3 * q);
      reaches.push(['R', eKey(E_GRASP, T, V3()), arm, -0.2]); aims.push(['R', V3(0.05, -0.55, 1), V3(0.05, -1, 0.15), arm]);
      fingers('R', lerp(lerp(0.24, 0.0, sm(0.1, 0.5, T)), 1.25, shut));
      if (T > 0.2 && T < 1.5) emo = 'stern';
      afterHands = () => { const g = pulse(T, 0.30, 0.55, 1.10, 1.30); if (g < 0.01) return;
        const hp = carried('handR', SKL.mid.x, SKL.mid.y, SKL.mid.z, sp1); glow(hp, 0.14 * g, E_VIO, 0.7 * g);
        for (let i = 0; i < 2; i++) if (frnd() < g) emit(hp.x + frs(0.06), hp.y - 0.04, hp.z + frs(0.06), frs(0.10), -0.5 - frnd() * 0.8, frs(0.10) + 0.15, 0.4 + frnd() * 0.4, 0.018, E_VIO, 1, 1.2, 0.8); };
    }
    if (N === 'e_bless') {
      const arm = pulse(T, 0.05, 0.45, 1.60, 2.05);
      SPB.want = T > 0.05 && T < 1.95; carried('spine3', 0.12, 1.02, 0.22, SPB.P); SPB.f.set(-0.42, 0.30, 0.86); SPB.n.set(-0.06, 0.90, -0.43);
      add('head', 0.06 * arm, 0, 0.07 * arm); add('spine3', 0.03 * arm, 0.06 * arm, 0); add('spine2', 0.02 * arm, 0.04 * arm, 0); SK.hips.position.z += 0.02 * arm;
      reaches.push(['R', eKey(E_BLESS, T, V3()), arm, -0.35]); aims.push(['R', V3(0.15, 0.25, 1), V3(0.05, 1, 0.1), arm]); fingers('R', lerp(0.24, 0.10, arm));
      if (T > 0.3 && T < 1.9) mouth = 'smile';
      afterHands = () => { const g = pulse(T, 0.35, 0.65, 1.35, 1.7); if (g < 0.01) return;
        const hp = carried('handR', SKL.mid.x, SKL.mid.y, SKL.mid.z, sp1); hp.y += 0.07; glow(hp, 0.15 * g, E_MINT, 0.7 * g); glow(hp, 0.05 * g, FXC.pearl, g, 1);
        if (frnd() < 0.6 * g) emit(hp.x + frs(0.05), hp.y, hp.z + frs(0.05), frs(0.05), 0.15 + frnd() * 0.2, frs(0.05), 0.6 + frnd() * 0.5, 0.013, frnd() < 0.5 ? E_MINT : FXC.gold, 0, 0.8, -0.1); };
    }
    if (N === 'e_sky' || N === 'e_moon') {
      const moon = N === 'e_moon', end = moon ? 3.15 : 2.7, k = pulse(T, 0.05, 0.60, end - 0.6, end), down = moon ? pulse(T, 1.42, 1.66, 2.70, 3.10) : 0;
      FLB.want = T > 0.05 && T < end - 0.1; FLB.lift = k;
      add('head', -0.26 * k * (1 - down) + 0.04 * down, 0, 0); add('neck', -0.10 * k * (1 - down), 0, 0); add('spine3', -0.06 * k + 0.08 * down, 0.12 * down, 0); add('spine2', -0.03 * k + 0.05 * down, 0.08 * down, 0); add('hips', 0, 0.08 * down, 0);
      SK.hips.position.y += 0.015 * k * (1 - down); SK.hips.position.z += 0.04 * down; ank.L.z += 0.10 * down; ank.R.z -= 0.06 * down;
      const R = moon ? eKey(E_MOON_R, T, V3()) : V3(-0.42, 1.80, 0.18), L = V3(0.42, 1.80 - 0.45 * down, 0.18 + 0.05 * down);
      reaches.push(['R', R, k, -0.25]); reaches.push(['L', L, k, 0.25]);
      aims.push(['R', V3(-0.35, 1, 0.1), V3(0.2, 0.35, 0.9), k * (1 - down)]); aims.push(['L', V3(0.35, 1, 0.1), V3(-0.2, 0.35, 0.9), k]);
      if (down > 0.01) aims.push(['R', V3(0.02, 0.0, 1), V3(0.3, -1, 0), down]);
      fingers('R', lerp(0.24, 0.06, k)); fingers('L', lerp(0.24, 0.10, k));
      const peak = moon ? T > 0.75 && T < 1.4 : T > 0.9 && T < 1.9; if (peak) eyes = 1; if (k > 0.3) { if (moon && T > 1.45) emo = 'casting'; else mouth = 'smile'; }
      afterHands = () => { const g = k * (moon ? pulse(T, 0.3, 0.7, 1.45, 1.7) : pulse(T, 0.3, 0.8, 1.9, 2.4)); if (g < 0.01) return;
        for (const S of ['R', 'L']) { const hp = carried('hand' + S, S === 'R' ? SKL.mid.x : -SKL.mid.x, SKL.mid.y, SKL.mid.z, sp1); glow(hp, 0.14 * g, E_SIL, 0.7 * g);
          if (frnd() < 0.5 * g) emit(hp.x + frs(0.05), hp.y + 0.03, hp.z + frs(0.05), frs(0.06), 0.3 + frnd() * 0.4, frs(0.06), 0.7 + frnd() * 0.6, 0.014, frnd() < 0.6 ? E_SIL : FXC.pearl, 0, 0.6, -0.15); } };
    }
    if (N === 'e_guard') {
      const k = sm(0, 0.25, T);
      HUG.want = true; hugArm(reaches, aims, k);
      SK.hips.position.y -= 0.06 * k; add('spine1', 0.06 * k, 0, 0); add('head', -0.03 * k, 0, 0); ank.L.z += 0.12 * k; ank.L.x += 0.04 * k; ank.R.z -= 0.08 * k; ank.R.x -= 0.03 * k;
      reaches.push(['R', V3(-0.17, 1.40 + 0.01 * Math.sin(clock * 2), 0.40), k, -0.4]); aims.push(['R', V3(-0.05, 1, 0.1), V3(0, 0.05, 1), k]); fingers('R', lerp(0.24, 0.05, k));
      if (k > 0.5) emo = 'stern';
    }
