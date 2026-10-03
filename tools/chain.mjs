// chain.mjs: plays the whole journey (src/game/story.js) in order with each play style and prints where the party stands
// at each step: its level, shards, wild fights so far (and those spent grinding), and losses. Usage:
// node tools/chain.mjs [--n 40] [--policy sensible,expert]
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('..', import.meta.url).pathname);
for (const f of ['src/battle/rules', 'src/battle/engine', 'src/battle/sim', 'src/game/story', 'src/battle/chain']) require(path.join(R, f + '.js'));
const args = process.argv.slice(2);
let n = 40, pols = ['sensible', 'expert'], results = '';
for (let i = 0; i < args.length; i++) { if (args[i] === '--n') n = +args[++i]; else if (args[i] === '--policy') pols = args[++i].split(','); else if (args[i] === '--results') results = args[++i]; }
const all = {};
const t0 = Date.now();
for (const p of pols) {
  const r = globalThis.BattleChain.runMany(p, n); all[p] = r;
  console.log(`\n${p === 'sensible' ? 'attentive' : p}: ${n} journeys (medians)`);
  console.log('step'.padEnd(46) + 'level'.padStart(6) + 'shards'.padStart(9) + 'wild'.padStart(6) + 'grind'.padStart(7) + 'lost'.padStart(6) + 'hours'.padStart(7));
  for (const s of r.steps) console.log(s.what.padEnd(46) + String(s.level).padStart(6) + String(s.shards).padStart(9) + String(s.wild).padStart(6) + String(s.grind).padStart(7) + String(s.losses).padStart(6) + (s.time / 3600).toFixed(1).padStart(7));
  console.log('gate tries (median / 90th):', Object.entries(r.tries).map(([k, v]) => `${k} ${v.median}/${v.p90}`).join(', '));
  console.log(`wild fights ${r.wild}, grinding ${r.grind}, walks back to rest ${r.back}, fled ${r.fled}, losses ${r.losses}, fight time ${r.hours.toFixed(1)} h`);
}
console.log(`\n${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (results) {
  const fs = await import('fs');
  fs.writeFileSync(path.join(R, results), '// written by tools/chain.mjs: the whole journey, played ' + n + ' times with each play style\nwindow.CHAIN_RESULTS = ' + JSON.stringify(all) + ';\n');
  console.log('wrote ' + results);
}
