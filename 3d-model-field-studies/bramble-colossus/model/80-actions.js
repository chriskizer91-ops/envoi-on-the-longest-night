 // ---------- poses and actions ----------
 // body: y the mound's rise (it sinks deep into the earth before it appears), lean, tw twist, rl roll, sq squash, sw swirl
 //   (every cane turns the same way round it; Maelstrom spins it), coil (every cane curls sideways along its length), pulse
 //   breathing, gr growth
 // spire: sp pitch (+ forward), sb the bow of its top, sy twist, ss side bend, sk how far it turns to its prey, fall (felled,
 //   it topples forward and to its right)
 // bud: op how open (0 a closed bud, 1 a flower, more flares it), hb the heart's glow, gp a gulp (the bud swells), inn the
 //   prey is inside it
 // canes, by group (L the lead arm, M the other arm, H the mane, F, S and B the legs): l lift, c curl (negative arches it
 //   back), t tip curl, y swing toward the front, w writhe, k reach for the target (state.target)
 // reach: ikd how far toward the target, ikh height added (meters), wrap the tip's coil round what it holds, pull drags the
 //   reach point into the flower (where it feeds), tn twines the arms round each other
 // look: glow (the fruit gleams), lure (pollen), fade (1 solid, 0 gone), trail (whip trails), rust (leaves rustle), wither,
 //   dust, drain (life running down into the roots), shed (falling leaves), feed (the veins glow), fire
 const G6 = ['L', 'M', 'H', 'F', 'S', 'B'];
 function cg(g, l, c, t, y, w, k) { const o = {}, gs = g === '*' ? G6 : g.split(''); for (const q of gs) { if (l !== undefined) o[q + 'l'] = l; if (c !== undefined) o[q + 'c'] = c; if (t !== undefined) o[q + 't'] = t; if (y !== undefined) o[q + 'y'] = y; if (w !== undefined) o[q + 'w'] = w; if (k !== undefined) o[q + 'k'] = k; } return o; }
 const K = (...a) => Object.assign({}, ...a);
 // battle idle: the spire leaning a little at its prey, the bud just parted on the heart's glow, the arms arched out with
 // their tips on the soil before it, the mane up and back, the legs arched out round it like a spider's
 const BASE = K({ y: 0, lean: 0, tw: 0, rl: 0, sq: 0, sw: 0, coil: 0, pulse: 1, gr: 1, sp: .1, sb: .16, sy: 0, ss: 0, sk: .7, fall: 0, op: .14, hb: .55, gp: 0, inn: 0,
  ikd: 1, ikh: 0, wrap: 0, pull: 0, tn: 0, glow: .2, lure: 0, fade: 1, trail: 0, rust: 1, wither: 0, dust: 0, drain: 0, shed: 0, feed: 0, fire: 0 },
  cg('LM', .85, 2.7, .7, .32, .8, 0), cg('H', .75, 1.1, .6, -.25, 1.1, 0), cg('F', 1.2, 2.2, .6, .12, 1, 0), cg('S', 1.1, 2.5, .4, 0, 1, 0), cg('B', 1.05, 2.5, .45, -.1, 1, 0));
 const KEYS = Object.keys(BASE);
 // resting, disguised: a hill of brambles, the spire bowed over the mound with its bud hidden in the leaves
 const REST = K(cg('LM', -.1, 1.5, .5, .4, .2), cg('H', .25, 1.7, .5, .2, .2), cg('FSB', .7, 1.9, .4, -.04, .2), { coil: 2, y: -.15, sq: .1, pulse: .35, rust: .45, sp: .9, sb: 1.9, ss: .2, sk: 0, op: 0, hb: .32, glow: 0 });
 // alert: the spire straightens and leans at its prey, the bud parts on the heart's glow, every cane rises toward it
 const ALERT = K(cg('LM', .95, 1.3, 1.4, .45, .45), cg('H', 1.1, .3, .3, -.3, .5), cg('F', 1.32, 1.35, 1.55, .32, .45), cg('S', 1.28, 1.45, 1.45, .4, .45), cg('B', 1.22, 1.65, 1.2, .3, .45),
  { y: .06, lean: -.04, sq: -.04, sp: .2, sb: .3, sk: 1, op: .34, hb: .95, glow: .4, rust: 1.6, feed: .25 });
 // guard: the arms crossed before the spire, the bud shut tight
 const GUARD = K(cg('LM', .6, 1.2, .8, 1.05, .3), cg('H', .8, .9, .5, -.1, .3), cg('FS', 1.45, 1.4, 1, .75, .35), cg('B', 1.25, 2.3, .5, .2, .5), { sp: -.06, sb: .08, op: 0, hb: .25, lean: -.04, sq: .04, rust: 1.3 });
 const WALK = { lean: .05, rust: 1.4, y: .03, sp: .16 };
 const ACTS = {};
 const EASE = { s: (x) => x * x * (3 - 2 * x), l: (x) => x, i: (x) => x * x, o: (x) => 1 - (1 - x) * (1 - x) };
 function act(name, dur, keys, o) {
  const t = [], p = [], e = []; let prev = BASE;
  for (const [u, k, ez] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); e.push(EASE[ez || 's']); prev = full; }
  ACTS[name] = Object.assign({ dur, t, p, e, hits: [], cues: [], hold: false, interrupt: false, rate: 12, snap: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p; let i = 0; while (i < T.length - 2 && u > T[i + 1]) i++;
  const a = T[i], b = T[i + 1], s = b > a ? cl((u - a) / (b - a), 0, 1) : 1, f = def.e[i + 1](s);
  for (const k of KEYS) out[k] = lerp(Pk[i][k], Pk[i + 1][k], f);
 }
 const ARMS = (k) => cg('LM', undefined, undefined, undefined, undefined, undefined, k);
 // Awakening: it heaves up out of the splitting earth, spikes first, plants its legs, rears and roars its bud open
 act('appear', 4.6, [[0, K(REST, cg('LM', 1.45, -.4, .2, .9, .3), cg('H', 1.5, -.2, .2, .6, .3), cg('FSB', 1.5, -.6, -.2, .4, .3), { y: -8.6, sp: 0, sb: 0, ss: 0, op: 0, hb: .3, coil: 0, pulse: 1 })],
  [.06, { dust: 1, feed: .4 }], [.14, { y: -6.6, shed: .5 }, 'i'], [.42, { y: 0, sq: -.06, rust: 2.4, feed: .7 }, 'o'],
  [.5, K(cg('FSB', 1.3, 2.4, .6, .1, 1.4), cg('LM', .9, 1.2, 1, .5, .8), cg('H', 1, .4, .3, -.2, 1.2), { sq: .08, dust: .6, shed: .2 }), 'o'],
  [.58, K(cg('LM', 1.4, -.6, .4, .1, .5), cg('H', 1.5, -.7, .2, -.3, .8), { sp: -.5, sb: -.3, op: .3, hb: 1, lean: -.08, y: .1, sq: -.08, dust: .1, feed: 1, rust: 2.6 })],
  [.66, { op: 1.4, hb: 2.2, sq: -.1, shed: 1.2, rust: 3.2 }, 'o'], [.8, K(ALERT, { op: .6, hb: 1.2, shed: 0, dust: 0 })], [1, BASE]],
  { snap: KEYS, cues: [.04, .62], rate: 10 });
 // Alert: the spire turns and leans at its prey, every cane rising toward it
 act('alert', 1.8, [[0, {}], [.3, ALERT, 'o'], [.7, K(ALERT, cg('*', undefined, undefined, undefined, undefined, .25))], [1, BASE]], { cues: [.22], rate: 9 });
 // Siren Bloom: the flower opens wide, arms spread in welcome, pollen pouring over the party (the hit is a charm)
 act('bloom', 3.4, [[0, {}],
  [.22, K(cg('LM', .95, .9, .5, -.25, .4), cg('H', 1.25, -.5, -.2, -.5, .6), cg('FSB', 1.0, 2.5, .5, -.05, .3), { sp: -.12, sb: -.1, sk: 1, op: 1.05, hb: 1.3, glow: .8, lure: .6, y: .05, rust: .6 }), 'o'],
  [.34, { op: 1.15, lure: 1.6, glow: 1.2, hb: 1.5 }], [.78, { op: 1.0, lure: 1.1, glow: 1 }], [1, BASE]], { hits: [.55], cues: [.3], rate: 7 });
 // Thorn Lance: the lead arm draws back high, spears down through its prey into the ground, and rips free
 act('lance', 1.8, [[0, {}],
  [.26, K(cg('L', 1.3, -.7, .2, -.2, .2, 0), cg('M', .7, 1.8, .8, .5, .5), { sp: -.2, sb: -.1, sk: 1, sy: .35, tw: .1, lean: -.06, y: .04, op: .4, hb: 1, rust: 1.8 }), 'o'],
  [.4, { Lk: 1, ikd: 1.02, ikh: -.5, wrap: .2, trail: 1, sp: .35, sb: .3, sy: -.15, tw: -.06, lean: .12, sq: .08, rust: 2.6 }, 'i'],
  [.5, { wrap: .5 }], [.66, { Lk: .85, trail: 0, sp: .2 }],
  [.86, K(cg('L', .6, 2, .8, .3, .6, 0), { sp: .1, sy: 0, lean: 0, tw: 0, op: .2, sq: 0 }), 'o'], [1, BASE]], { hits: [.44], cues: [.3], rate: 22 });
 // Hammerfall: the arms rise and twine into one club, hang, then fall on the prey; a shockwave runs over the party
 act('slam', 3.0, [[0, {}],
  [.24, K(cg('LM', 1.05, -.25, -.2, .62, .2, 0), { sp: -.42, sb: -.3, sk: 1, op: .7, hb: 1.2, lean: -.1, y: .1, sq: -.08, rust: 2, tn: 1 }), 'o'],
  [.4, K(cg('LM', 1.15, -.4, -.3, .62, .3), { sp: -.5, sb: -.35, hb: 1.7, feed: .5, tn: 1.2 })],
  [.46, K(ARMS(1), { ikd: 1, ikh: -1.5, wrap: .1, trail: 1, sp: .38, sb: .32, lean: .16, y: -.05, sq: .12, rust: 3, op: .3, tn: 0 }), 'i'],
  [.56, { sq: .06 }], [.7, { Lk: .9, Mk: .9, trail: 0, sp: .25, feed: .3 }],
  [.88, K(cg('LM', .7, 1.9, .8, .4, .7, 0), { sp: .1, sb: .2, lean: 0, y: 0, sq: 0, op: .2, hb: .7 }), 'o'], [1, BASE]],
  { hits: [.5, .6], cues: [.36], rate: 18 });
 // Maelstrom: it winds round, then every cane whirls round it twice at three heights, striking the party four times
 act('whirl', 3.6, [[0, {}],
  [.2, K(cg('LM', -.15, .3, .2, -.4, .3), cg('H', .5, .5, .2, -.3, .3), cg('FSB', .55, .9, .3, .2, .3), { sw: -.9, sy: -.6, tw: -.12, sp: -.06, sb: 0, sk: 0, op: .2, rust: 2, y: .08, sq: -.06 }), 'o'],
  [.3, { sw: 0, sy: .2, trail: 1, rust: 3, dust: 1 }, 'i'],
  [.78, { sw: TAU * 2, trail: 1, dust: 1 }, 'l'],
  [.86, K(cg('LM', .6, 1.8, .7, .3, .8), cg('H', 1, .5, .4, -.15, 1), cg('FSB', 1.2, 2.5, .5, .05, 1), { sw: TAU * 2 + .25, sy: 0, tw: 0, sk: .7, trail: 0, dust: 0, op: .2 }), 'o'],
  [1, K(BASE, { sw: TAU * 2 })]], { hits: [.36, .48, .6, .72], cues: [.2], rate: 14 });
 // Thorn Volley: two whip-cracks of the arms and mane fling thorns that rain on the party in three waves
 act('volley', 3.2, [[0, {}],
  [.28, K(cg('LM', 1.6, -1.6, -.5, .25, .6), cg('H', 1.5, -1.3, -.4, .1, .6), { sp: -.38, sb: -.25, sk: 1, op: .9, hb: 1.4, lean: -.1, y: .08, sq: -.08, rust: 2.4 }), 'o'],
  [.38, K(cg('LM', .9, 1.6, .9, .4, .4), cg('H', 1.2, .4, .3, .4, .4), { sp: .28, sb: .2, lean: .12, trail: 1, sq: .06, rust: 3 }), 'i'],
  [.44, K(cg('LM', 1.4, -.8, -.2, .3, .6), cg('H', 1.45, -.9, -.2, .2, .6), { sp: -.2, trail: .6 }), 'o'],
  [.5, K(cg('LM', .8, 1.7, .9, .4, .4), cg('H', 1.1, .5, .3, .4, .4), { sp: .3, trail: 1 }), 'i'],
  [.66, K(cg('LM', .7, 2, .8, .35, .6), cg('H', 1, .6, .4, -.1, .8), { sp: .12, trail: 0, op: .4 }), 'o'], [1, BASE]],
  { hits: [.58, .68, .78], cues: [.38, .5], rate: 16 });
 // Devour: the arms lift the prey into the flower, which shuts; three gulps (a blow, then a heal) while life spirals down
 // the spire; then it bursts open and the arms set the prey back where it stood
 act('devour', 5.2, [[0, {}],
  [.12, K(cg('LM', 1.3, -.6, .2, .3, .6, 0), { sp: -.15, sb: -.1, sk: 1, op: .3, hb: 1, lean: -.06, y: .05, rust: 2 }), 'o'],
  [.17, K(ARMS(1), { ikd: 1, wrap: 2.6, trail: .7, sp: .2, lean: .08 }), 'i'],
  [.26, { trail: 0, ikh: .5 }],
  [.42, { ikh: 5.4, pull: .55, sp: -.28, sb: -.25, op: 1.25, hb: 1.6, glow: .8 }],
  [.47, { pull: 1, ikh: 4.6, inn: 1 }, 'i'],
  [.52, K(cg('LM', .9, 1.4, .9, .4, .6, 0), { op: 0, hb: 1.2, sq: .06, gp: .4, drain: 1, feed: 1, sp: -.05, sb: .1 }), 'i'],
  [.58, { feed: 1.4, gp: 1 }], [.62, { feed: .8, gp: .2 }], [.68, { feed: 1.4, gp: 1 }], [.72, { feed: .8, gp: .2 }], [.78, { feed: 1.4, gp: 1 }], [.82, { feed: .8, gp: 0, drain: .3 }],
  [.86, K(ARMS(1), { op: 1.35, hb: 1.8, drain: 0, feed: .3, ikh: 4.6, pull: 1 }), 'o'],
  [.95, { pull: 0, ikh: 0, inn: 0, op: .6, sp: .15 }, 'o'],
  [.97, K(ARMS(0), { wrap: 0 })], [1, BASE]],
  { hits: [.2, .58, .68, .78], cues: [.62, .72, .82, .9], rate: 12 });
 // Thornwood: canes stab the soil, the ground splits toward the prey and tree-tall shoots burst up round it and squeeze
 // (animate() drives the shoots)
 act('briar', 3.8, [[0, {}],
  [.2, K(cg('LM', 1.6, -1, .2, .2, .6), cg('H', 1.5, -.8, .1, 0, .6), cg('FSB', 1.75, 1.6, .9, .15, .6), { sp: -.35, sb: -.2, sk: 1, op: .8, hb: 1.4, lean: -.1, y: .08, sq: -.08, rust: 2, feed: .3 }), 'o'],
  [.3, K(cg('LM', .3, 2.9, 1.3, .5, .3), cg('H', .9, 1.2, .6, .3, .3), cg('FSB', .25, 2.9, 1.3, .6, .3), { sp: .35, sb: .3, op: .2, lean: .14, y: -.04, sq: .14, rust: 2.8, dust: 1, feed: 1 }), 'i'],
  [.36, { dust: 0, sq: .06 }],
  [.6, K(cg('*', undefined, undefined, undefined, undefined, 1.2), { feed: .8, rust: 1.6, op: .5 })],
  [.66, { sq: .12, feed: 1.2, rust: 2.4, hb: 1.5 }], [.74, { sq: .05, feed: .7, hb: 1 }],
  [.86, K(cg('LM', 1.2, 1, .8, .3, .6), cg('FSB', 1.55, 1.5, .9, .3, .6), { sp: .1, lean: -.06, y: .04, sq: -.05, dust: .7, feed: .2, op: .2 }), 'o'],
  [1, BASE]], { hits: [.46, .66], cues: [.3, .86], rate: 14 });
 // Wrath: it curls in, then bursts open in a ring of red light; the battle sets state.wrath for its second phase's look
 act('enrage', 3.2, [[0, {}],
  [.28, K(cg('LM', .2, 3.2, 1.2, .9, .4), cg('H', .4, 2.6, .8, .6, .4), cg('FSB', .9, 3.2, 1, .3, .4), { coil: 1.8, sp: .55, sb: .9, ss: .1, op: 0, hb: .4, y: -.1, sq: .16, lean: .06, rust: .6, feed: .4 })],
  [.4, K(cg('LM', 1.7, -1.2, -.4, -.5, 1.6), cg('H', 1.6, -1.4, -.4, -.5, 1.6), cg('FSB', 1.6, 1.3, .2, -.2, 1.6), { coil: 0, sp: -.62, sb: -.4, ss: 0, op: 1.45, hb: 2.4, y: .16, sq: -.14, lean: -.12, rust: 3.6, feed: 1.5, shed: 1.5, dust: 1 }), 'o'],
  [.58, { shed: .3, dust: 0 }], [.78, K(ALERT, { op: .5, hb: 1.4, feed: .6 })], [1, BASE]],
  { cues: [.42], rate: 12 });
 // Hurt: the spire rocks back, every cane flinching away
 act('hurt', .8, [[0, {}], [.16, K(cg('*', 1.35, 1.8, .2, -.35, 2.5), { sp: -.3, sb: -.2, ss: .12, lean: -.12, y: .04, sq: -.08, op: .05, hb: .3, shed: 1.2, rust: 3 })], [1, BASE]], { interrupt: true, rate: 16 });
 act('block', .6, [[0, {}], [.3, K(GUARD, { lean: -.08, rust: 1.6 })], [.7, {}], [1, BASE]], { interrupt: true, rate: 18 });
 // Scorch: its recoil from fire; leaves catch and curl black, and the char fades over the next few seconds
 act('burn', 1.8, [[0, {}],
  [.12, K(cg('*', 1.5, .9, .1, -.5, 3.2), { sp: -.45, sb: -.3, ss: .15, op: 0, hb: .3, lean: -.2, y: .08, sq: -.1, shed: 2, rust: 3.6, fire: 1 }), 'o'],
  [.32, K(cg('*', 1.35, 1.3, .3, -.4, 2.4), { sp: -.3, ss: -.1, lean: -.14, fire: 1, shed: 1 })],
  [.62, K(cg('*', 1.2, 1.9, .5, -.15, 1.5), { sp: 0, ss: 0, lean: -.05, fire: .45, shed: .4, rust: 2 })],
  [1, BASE]], { interrupt: true, rate: 14 });
 act('rest', 2.0, [[0, {}], [1, REST]], { hold: true, rate: 5 });
 // Felled: a last flail, then the spire topples like a tree, the heart beats once more and goes dark, and it crumbles away
 act('die', 5.6, [[0, {}],
  [.08, K(cg('*', 1.6, 1.2, .5, .1, 3), { sp: -.4, sb: -.3, op: 1.3, hb: 2, lean: -.1, y: .08, sq: -.08, rust: 3, shed: 1, feed: 1.4 })],
  [.2, { op: .9, hb: 1.2, ss: .15 }],
  [.44, K(cg('LM', .1, .6, .2, -.2, .4), cg('H', -1.1, .9, .3, .2, .4), cg('FSB', .2, .5, .1, -.1, .15), { fall: 1, sp: .2, sb: .5, ss: .3, coil: 1, op: .5, hb: .9, lean: .05, y: -.1, sq: .25, shed: 1.6, dust: 1, feed: .2 }), 'i'],
  [.52, { fall: .95, dust: .4 }, 'o'], [.56, { fall: 1 }],
  [.7, { hb: 1.6, feed: 1 }], [.76, { hb: .1, feed: 0, wither: .6, shed: .6, dust: 0 }],
  [.9, { wither: 1, op: .3, pulse: 0, shed: 0 }], [.97, { fade: 0 }], [1, { fade: 0 }]],
  { hold: true, interrupt: true, cues: [.2, .5, .7], rate: 10 });


