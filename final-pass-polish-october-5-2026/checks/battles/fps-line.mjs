// fps-line.mjs: the end card shows the fight's frame rate (the October 2 decision: the average and the slowest second,
// with the cap) in the game and the arena demo, which build the battle from the screen's own markup() rather than a
// page of their own. The check builds markup() (src/battle/screen.js) and writes the line into it as showEnd does.
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/fps-line.mjs
import { grab, line } from './rig.mjs';
const html = new Function(grab('function markup()') + '\nreturn markup;')()();
const el = /id="stFps"/.test(html) ? { textContent: '' } : null;
// a fight of 30 s at 30 frames a second, its slowest second 24, capped at 30
const PACE = { cap: 30, fps: { n: 900, t: 30000, low: 24 } };
new Function('PACE', '$', line('const F = PACE.fps, fl = $(') + '\n' + line('if (fl) fl.textContent ='))(PACE, (id) => (id === 'stFps' ? el : null));
console.log(el ? 'the end card’s frame-rate line: “' + el.textContent + '”' : 'FAIL: the end card has no frame-rate line (markup() has no #stFps)');
process.exit(el && /^Frame rate: 30 a second on average, 24 in the slowest second \(capped at 30\)\.$/.test(el.textContent) ? 0 : 1);
