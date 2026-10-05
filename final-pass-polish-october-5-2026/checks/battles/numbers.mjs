// numbers.mjs: damage numbers on the same fighter don't print over each other, and stay on the screen, on the phone held
// sideways (915 x 412 full screen; 915 x 356 and 915 x 330 in Chrome), upright (390 x 844) and on a laptop (1366 x 768).
// The battle screen's own number(), place() and update() (src/battle/screen.js) run on stand-ins for the page, at 60
// frames a second, with every number at the same spot across (the worst case of their small random shift):
//   - Envoi's eight blows on one foe, 0.28 s apart (its model's hit times), and a quick three on another, 0.1 s apart:
//     while two numbers on the same fighter are both showing, at least 24 px between them up and down
//   - a foe high on the screen and a hero low behind the windows: every number below the top edge and above the windows
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/numbers.mjs
import { grab, line } from './rig.mjs';

const SIZES = [{ w: 915, h: 412, uiH: 144 }, { w: 915, h: 356, uiH: 144 }, { w: 915, h: 330, uiH: 144 }, { w: 390, h: 844, uiH: 184 }, { w: 1366, h: 768, uiH: 144 }];
function rig(view) {
  // a fighter's point on the screen: across by x, up by y (60 px a metre), from a floor line
  const toScreen = (p) => [view.w / 2 + p.x * 60, p.z - p.y * 60, 0];
  const el = () => ({ className: '', textContent: '', style: {}, remove() { this.gone = true; } });
  const env = { THREE, view, toScreen, document: { createElement: el }, numsEl: { appendChild() {} }, rnd: () => 0, clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    flashA: 0, flashEl: { style: {} }, flashDur: 0.3, markOn: null, markEl: { style: {} }, tmpV: new THREE.Vector3() };
  const opt = (m) => { try { return line(m); } catch (e) { return ''; } }; // (a line the screen may not have had before)
  const body = [line('const nums = [];'), opt('let numsMade'), grab('function place(n)'), grab('function number(p, text, cls, dy)'), grab('function update(rdt)'), 'return { number, update, nums };'].join('\n');
  const names = Object.keys(env);
  return new Function(...names, body)(...names.map((k) => env[k]));
}
const yOf = (n) => +n.el.style.transform.match(/translate\([-\d.]+px,([-\d.]+)px\)/)[1];
let bad = 0;
for (const view of SIZES) {
  const free = view.h - view.uiH, winTop = view.h - view.uiH + 4;
  // the fighters: their chests (z is the floor line of the stand-in camera, in screen pixels)
  const foe = { x: 2, y: 1.2, z: Math.round(free * 0.55) + 72 }, foe2 = { x: -2, y: 1.2, z: Math.round(free * 0.55) + 72 };
  const high = { x: 4, y: 1.2, z: 30 + 72 }, low = { x: -4, y: 1.2, z: view.h - 30 + 72 };
  const R = rig(view), at = { [JSON.stringify(foe)]: 'the foe struck eight times', [JSON.stringify(foe2)]: 'the foe struck three times', [JSON.stringify(high)]: 'the foe high up', [JSON.stringify(low)]: 'the hero behind the windows' };
  const shots = [];
  for (let k = 0; k < 8; k++) shots.push([0.28 * k, foe, '180']);
  for (let k = 0; k < 3; k++) shots.push([0.1 * k, foe2, '2,400']);
  for (let k = 0; k < 2; k++) shots.push([0.2 * k, high, '900'], [0.2 * k, low, '1,200']);
  let worstGap = 1e9, worstTop = 1e9, worstLow = -1e9, gapAt = '';
  for (let f = 0, t = 0; f < 60 * 4; f++, t += 1 / 60) {
    for (const s of shots) if (!s.done && s[0] <= t + 1e-9) { s.done = true; R.number(new THREE.Vector3(s[1].x, s[1].y, s[1].z), s[2], '', 0); }
    R.update(1 / 60);
    const live = R.nums.filter((n) => +n.el.style.opacity >= 0.5);
    for (const n of live) { const y = yOf(n); worstTop = Math.min(worstTop, y - 18); worstLow = Math.max(worstLow, y + 14); }
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      if (live[i].p.distanceTo(live[j].p) > 0.01) continue;
      const g = Math.abs(yOf(live[i]) - yOf(live[j])); if (g < worstGap) { worstGap = g; gapAt = at[JSON.stringify({ x: live[i].p.x, y: live[i].p.y, z: live[i].p.z })] + ' at ' + t.toFixed(2) + ' s'; }
    }
  }
  const ok = worstGap >= 24 && worstTop >= 0 && worstLow <= winTop;
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + view.w + ' x ' + view.h + ': the closest two on one fighter ' + worstGap.toFixed(0) + ' px apart (' + gapAt + '); the highest number’s top at y ' + worstTop.toFixed(0) +
    ', the lowest’s bottom at ' + worstLow.toFixed(0) + ' (the windows from ' + winTop + ')');
}
console.log(bad ? 'FAIL: ' + bad + ' sizes' : 'all good');
process.exit(bad ? 1 : 0);
