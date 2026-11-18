// make-moods.mjs: reads each walking place's own atmosphere from the 3D world (moon-faire-witches/world3d/places/<id>.js,
// the world-3d job's, read only): the colours its leaves, firs and bushes are tinted, its fog and its moonlight. Writes
// map/moods.js, from which the 3D map colours each region of the land the way that region looks in the game.
// A place that sets none keeps the 3D world's own defaults (engine/world.js's TINT and engine/core.js's moon and fog).
// Usage: node moon-faire-witches/world-map/tools/make-moods.mjs [--ref <git commit or branch to read the places from>]
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const ri = process.argv.indexOf('--ref'), ref = ri >= 0 ? process.argv[ri + 1] : null;
const DIR = 'moon-faire-witches/world3d/places';
const read = (id) => (ref ? execSync(`git -C "${R}" show ${ref}:${DIR}/${id}.js`, { maxBuffer: 1 << 28 }).toString() : fs.readFileSync(path.join(R, DIR, id + '.js'), 'utf8'));
const sha = ref ? execSync(`git -C "${R}" rev-parse --short ${ref}`).toString().trim() : 'the working copy';
const IDS = ['wickhollow', 'cottage', 'jetty', 'thornwood', 'bogmire', 'bogmire-heart', 'warm-roads-camp', 'ember-line-road', 'dawnroost-road', 'dawnroost', 'dawnroost-node',
  'northern-camp', 'eldergrove-edge', 'cold-moor', 'crossroads', 'shipyard', 'frozen-camp', 'frostmere-shore', 'frozen-pass', 'misthollow', 'moonwell'];
const BASE = { leaves: 0xd8ffee, firs: 0xa8c8c0, bush: 0xd8ffe8, moon: [0.42, 0.43, 0.56], fog: [0.075, 0.08, 0.16] };
const rgb = (n) => [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
const r3 = (a) => a.map((v) => Math.round(v * 1000) / 1000);
const places = {};
for (const id of IDS) {
  const src = read(id), tints = (src.match(/\btints:\s*\{([^}]*)\}/) || [])[1] || '';
  const hex = (k) => { const m = tints.match(new RegExp('\\b' + k + ':\\s*0x([0-9a-fA-F]{6})')); return m ? parseInt(m[1], 16) : BASE[k]; };
  const arr = (k) => { const m = src.match(new RegExp('\\b' + k + ':\\s*\\[([^\\]]*)\\]')); const v = m ? m[1].split(',').map(Number) : null; return v && v.length === 3 && v.every(Number.isFinite) ? v : BASE[k]; };
  // what grows there, as one colour: its leaves, firs and bushes together, against the 3D world's own default green
  const grow = [0, 1, 2].map((c) => (rgb(hex('leaves'))[c] / rgb(BASE.leaves)[c] + rgb(hex('firs'))[c] / rgb(BASE.firs)[c] + rgb(hex('bush'))[c] / rgb(BASE.bush)[c]) / 3);
  places[id] = { grow: r3(grow), fog: r3(arr('fog')), moon: r3(arr('moon')), own: !!tints };
  console.log(id.padEnd(16) + ' grows ' + places[id].grow.join(', ') + ' · fog ' + places[id].fog.join(', ') + ' · moon ' + places[id].moon.join(', ') + (tints ? '' : '   (the defaults)'));
}
const out = `// moods.js: each walking place's own atmosphere, read from the 3D world's places (${DIR}/, at ${sha}) by
// tools/make-moods.mjs. Not written by hand: run the tool again when the places change.
// grow: what its leaves, firs and bushes are tinted, against the 3D world's default green (1, 1, 1 = that default);
// fog and moon: its fog's colour and its moonlight. The 3D map colours each region of the land from the places in it.
window.MAP_MOODS = ${JSON.stringify(places, null, 1).replace(/\[\n\s+/g, '[').replace(/,\n\s+(?=[\d.-])/g, ', ').replace(/\n\s+\]/g, ']')};
`;
fs.writeFileSync(path.join(R, 'moon-faire-witches/world-map/map/moods.js'), out);
console.log('map/moods.js written (' + IDS.length + ' places, from ' + sha + ')');
