// gaps.mjs: reads the new sound file and every script that calls it, and lists any sound name that is called but not
// made (the brief's first check: 0). It also lists the sounds no beat uses yet (spares).
// Usage: node moon-faire-witches/sound/gaps.mjs
import fs from 'fs';
import path from 'path';
const R = path.resolve(new URL('..', import.meta.url).pathname);
const snd = fs.readFileSync(path.join(R, 'src/battle/sound.js'), 'utf8');
const made = new Set([...snd.matchAll(/^\s*def\('([A-Za-z]+)'/gm)].map((m) => m[1]));
const files = ['src/battle/screen.js', 'src/kit.js', 'spellbook/spellbook.js', 'lineup/lineup.js', 'bigbad/bigbad.js'];
const used = new Map(); let gaps = 0, calls = 0;
for (const f of files) {
  const code = fs.readFileSync(path.join(R, f), 'utf8'), names = [];
  for (const m of code.matchAll(/SND\.sfx\.([A-Za-z]+)/g)) names.push(m[1]);
  for (const m of code.matchAll(/SND\.sfx\[([^\]]+)\]/g)) for (const q of m[1].matchAll(/[?:]\s*'([A-Za-z]+)'/g)) names.push(q[1]);   // SND.sfx[a ? 'x' : 'y']
  if (f.endsWith('screen.js')) for (const m of code.matchAll(/\{ sfx: '([A-Za-z]+)' \}/g)) names.push(m[1]);                    // the Jester's moves name theirs
  calls += names.length;
  const miss = [...new Set(names.filter((n) => !made.has(n)))]; gaps += miss.length;
  for (const n of names) used.set(n, (used.get(n) || 0) + 1);
  console.log(f + ': ' + names.length + ' calls, ' + new Set(names).size + ' names, gaps ' + miss.length + (miss.length ? ' (' + miss.join(', ') + ')' : ''));
}
const spare = [...made].filter((n) => !used.has(n));
console.log('Sounds made: ' + made.size + '. Calls: ' + calls + '. Names used: ' + used.size + '. Gaps: ' + gaps + '.');
console.log('Made but not called yet (' + spare.length + '): ' + spare.join(', '));
process.exit(gaps ? 1 : 0);
