// balance.mjs: plays every fight in the game thousands of times with the three play styles (src/battle/sim.js) and
// checks the plan's balance targets. Run it after changing any number in src/battle/rules.js.
// Usage: node tools/balance.mjs [--n 1000] [--report docs/balance-report.md] [--results src/battle/balance-results.js]
// It prints a table and exits with 1 if a target is missed. --report writes the same table as Markdown; --results
// writes it as a script for the balance page (demos/balance.html), so the page opens with these results.
// The seeds are fixed, so the same numbers always give the same report.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('..', import.meta.url).pathname);
for (const f of ['rules', 'engine', 'sim']) require(path.join(R, 'src/battle', f + '.js'));
const S = globalThis.BattleSim, RL = globalThis.BattleRules;

const args = process.argv.slice(2);
let n = 1000, report = '', results = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--n') n = +args[++i];
  else if (args[i] === '--report') report = args[++i];
  else if (args[i] === '--results') results = args[++i];
}

const pct = (x) => Math.round(x * 100) + '%';
const mins = (m) => m.toFixed(1);
const t0 = Date.now();
const rows = [];
let missed = 0;
for (const t of S.TARGETS) {
  const r = S.run(t.fight, t.level, t.policy, n);
  const fails = S.check(t, r);
  if (fails.length) missed++;
  rows.push({ t, r, fails });
  const range = t.win ? `${pct(t.win[0])}-${pct(t.win[1])}` : '';
  console.log(
    (fails.length ? 'MISS ' : 'ok   ') + S.FIGHTS[t.fight].name.padEnd(18) + ('L' + t.level).padEnd(4) + t.policy.padEnd(9) +
    `win ${pct(r.winRate).padStart(4)} (want ${range})`.padEnd(28) + `median ${mins(r.minutes.median)} min` +
    (r.loseMargin != null ? `, losses leave ${pct(r.loseMargin)} of the foes' HP` : '') + (fails.length ? '  <- ' + fails.join(', ') : ''),
  );
}
console.log(`${S.TARGETS.length - missed} of ${S.TARGETS.length} targets met, ${n} fights each, in ${((Date.now() - t0) / 1000).toFixed(1)} s`);

if (report) {
  const L = [];
  L.push('# Balance report', '');
  L.push(`Written by \`tools/balance.mjs\` from the numbers in \`src/battle/rules.js\`. Each row is ${n} fights with fixed seeds, so the same numbers always give the same report. **${S.TARGETS.length - missed} of ${S.TARGETS.length} targets met.**`, '');
  L.push('The play styles: **careless** picks moves almost at random and heals late; **sensible** heals anyone under about half and saves MP for healing; **expert** heals before the next big hit could land, shields against charged moves and uses each summon at the right moment. A fight\'s length includes 1.5 seconds of thinking for each menu.', '');
  L.push('| Fight | Level | Style | Wins | Target | Median length | Losses leave | Met |', '|---|---|---|---|---|---|---|---|');
  for (const { t, r, fails } of rows) {
    L.push(`| ${S.FIGHTS[t.fight].name} | ${t.level} | ${t.policy} | ${pct(r.winRate)}${r.retreat ? ' (retreats)' : ''} | ${t.win ? pct(t.win[0]) + ' to ' + pct(t.win[1]) : ''}${t.minutes ? ', ' + t.minutes[0] + ' to ' + t.minutes[1] + ' min' : ''}${t.margin != null ? ', losses leave under ' + pct(t.margin) : ''} | ${mins(r.minutes.median)} min | ${r.loseMargin != null ? pct(r.loseMargin) + ' of foe HP' : ''} | ${fails.length ? 'No: ' + fails.join(', ') : 'Yes'} |`);
  }
  L.push('', '## Experience and shards', '');
  L.push('An average wild fight at each level, and how many it takes to level up. A gate is worth about one level; the first fight takes Io straight to level 2.', '');
  L.push('| Level | To next level | Wild fight gives | Fights for a level | Shards a fight |', '|---|---|---|---|---|');
  let total = 0;
  for (const e of S.economy()) {
    if (e.level > 1) total += e.fights;
    L.push(`| ${e.level} | ${e.need.toLocaleString('en-US')} | ${e.xp.toLocaleString('en-US')} | ${e.level === 1 ? 'the first fight' : e.fights.toFixed(1)} | ${e.shards.toLocaleString('en-US')} |`);
  }
  L.push('', `About ${Math.round(total)} wild fights from level 2 to 20 for a player who skips nothing, before the gates' experience is counted.`, '');
  L.push('## The Magpie', '', '| Upgrade | Level | Shards |', '|---|---|---|');
  for (const m of RL.MAGPIE) L.push(`| ${m.name} | ${m.level} | ${m.shards.toLocaleString('en-US')} |`);
  L.push('');
  fs.writeFileSync(path.resolve(R, report), L.join('\n'));
  console.log('wrote', report);
}
if (results) {
  const data = { n, rows: rows.map(({ t, r, fails }) => ({ i: S.TARGETS.indexOf(t), winRate: r.winRate, retreat: r.retreat, minutes: r.minutes, loseMargin: r.loseMargin, fails })) };
  fs.writeFileSync(path.resolve(R, results), '// balance-results.js: written by tools/balance.mjs --results; the balance page shows these until it plays the fights again.\nwindow.BALANCE_RESULTS = ' + JSON.stringify(data) + ';\n');
  console.log('wrote', results);
}
process.exit(missed ? 1 : 0);
