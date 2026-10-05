// first-lose.mjs: losing the first fight, the battle's end card says Io wakes where the game then wakes her. The game
// (src/game/game.js, wake('firstLost')) takes her to her last rest, which in a new game is her cottage, and plays the
// firstLost scene (src/game/script.js): "Io wakes in her own bed". The card's line (src/game/fights.js, the first fight's
// loseText) must name the same place.
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/first-lose.mjs
import path from 'path';
import { createRequire } from 'module';
import { R } from './rig.mjs';
const require = createRequire(import.meta.url);
require(path.join(R, 'src/game/script.js'));
const card = globalThis.GameFights.config('first', { level: 1, xp: 0, flags: {}, hp: {}, herbs: {} }, {}).loseText;
const scene = [].concat(globalThis.SCRIPT.scenes.firstLost).find((l) => typeof l === 'string' && /Io wakes/.test(l));
const where = (card.match(/Io wakes ([^;.,]+)/) || [])[1] || '';
console.log('the end card: “' + card + '”\nthe scene after it: “' + scene + '”');
const ok = !!where && scene.includes('Io wakes ' + where);
console.log(ok ? 'ok: both have her wake ' + where : 'FAIL: the card has her wake ' + (where || 'nowhere') + ', the scene in her cottage');
process.exit(ok ? 0 : 1);
