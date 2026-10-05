// make.mjs: builds Envoi Sound Check, the page where Chris hears every sound the game plays, as one file.
// 1. game-tables.js: each place's sounds and music, read from the game itself (src/game/game.js, Game.AMBIENCE and
//    Game.MUSIC), so the page plays a place exactly as the game schedules it, whatever changes there later.
// 2. The page built as the game's pages are (tools/build.mjs): the game's own sound code and Chris's two songs inside it,
//    so it plays with no internet. dist/sound-tool.html, copied here as "Envoi Sound Check.html".
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/sound-tool/make.mjs
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), R = path.resolve(HERE, '../..');
globalThis.window = globalThis;
require(path.join(R, 'src/game/maps.js'));
require(path.join(R, 'src/game/game.js'));
const { AMBIENCE, MUSIC } = globalThis.Game;
if (!AMBIENCE || !MUSIC) { console.error('game.js no longer gives Game.AMBIENCE and Game.MUSIC'); process.exit(1); }
// each place's name as the game shows it (maps.js), for the page's list
const NAMES = Object.fromEntries(Object.keys(AMBIENCE).map((id) => [id, (globalThis.MAPS[id] && globalThis.MAPS[id].name) || id]));
fs.writeFileSync(path.join(HERE, 'game-tables.js'),
  '// game-tables.js: made by make.mjs from src/game/game.js (Game.AMBIENCE and Game.MUSIC) and src/game/maps.js (the\n' +
  '// places\' names). Don\'t edit it: run make.mjs again after a change there.\n' +
  'window.GAME_SOUND = ' + JSON.stringify({ AMBIENCE, MUSIC, NAMES }) + ';\n');
execFileSync(process.execPath, [path.join(R, 'tools/build.mjs'), path.relative(R, path.join(HERE, 'sound-tool.html'))], { cwd: R, stdio: 'inherit' });
const out = path.join(HERE, '..', 'Envoi Sound Check.html');
fs.copyFileSync(path.join(R, 'dist/sound-tool.html'), out);
console.log(path.relative(R, out) + ': ' + fs.statSync(out).size.toLocaleString('en-US') + ' bytes');
