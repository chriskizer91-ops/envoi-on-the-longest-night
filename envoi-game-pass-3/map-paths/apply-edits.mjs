// apply-edits.mjs: puts Chris's path edits from the map editor (or the Walking Paths page) into the game's
// src/game/maps.js. Check them first (check-edits.mjs). Each changed walk, block or front list is rewritten with its
// unchanged lines kept exactly as they are (their comments, and the arc(), ring() and lamp helpers), and each new or
// changed shape written as plain points under the comment of the shape it replaces; a lamp helper is opened up only
// where one of its lamps changed. A list still empty, on one line (`block: [],`), gets its new shapes on lines of their
// own between its brackets. A one-line list with something in it (the jetty's `block: [...lampBlocks(JETTY_LAMPS)],`,
// the fen's heart's fronts) still stops it ("has no block"): open that list onto lines of its own by hand first.
// Usage: node envoi-game-pass-3/map-paths/apply-edits.mjs <edits.json> [more.json ...]
//   each file as check-edits.mjs reads it (edits-core.js docsOf): the map editor's "Copy my work", Walking Paths'
//   download, a store read (ArtifactData list or get, with out_dir or not), one map's document, or a list of these.
//   The keepsakes' places in an export or from the `places` collection aren't written here: it names the ones Chris
//   moved, for envoi-final-draft/items/items.js by hand. Nor are moved exits, people, spots and arrivals (it names those
//   too). It writes nothing and exits 1 when a file can't be read, holds something that isn't a map's edits, or has a
//   document whose changed walk, block or front wasn't written.
// Then node tools/check-maps.mjs, build, test and publish (README.md, "Reading and applying Chris's edits").
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), R = path.resolve(HERE, '../..'), P = path.join(R, 'src/game/maps.js');
require(path.join(HERE, 'edits-core.js'));
const E = globalThis.MapEdits, SHAPES = ['walk', 'block', 'front'];
const SRC = fs.readFileSync(P, 'utf8');
const helpers = SRC.slice(SRC.indexOf("  'use strict';") + 15, SRC.indexOf('  const MAPS = {'));
function mapBlock(id) {
  const key = /^[a-z]+$/.test(id) ? id : "'" + id + "'";
  const start = SRC.indexOf('\n    ' + key + ': {\n'); if (start < 0) throw new Error('no map ' + id);
  const end = SRC.indexOf('\n    },\n', start); return [start + 1, end + 7];
}
function fieldEntries(id, field) {
  const [a, b] = mapBlock(id), block = SRC.slice(a, b);
  // a list still empty, on one line (`block: [],`: the crossroads', the cold moor's, Frostmere's shore's): its new shapes
  // go between the brackets, on lines of their own
  const one = block.indexOf('\n      ' + field + ': [],');
  if (one >= 0) { const at = a + one + ('\n      ' + field + ': [').length; return { entries: [], abs: [at, at], tail: [], inline: true }; }
  const fs0 = block.indexOf('\n      ' + field + ': [\n'); if (fs0 < 0) throw new Error(id + ' has no ' + field);
  const bodyStart = fs0 + ('\n      ' + field + ': [\n').length, bodyEnd = block.indexOf('\n      ],', bodyStart);
  const lines = block.slice(bodyStart, bodyEnd + 1).split('\n').filter((l, i, arr) => i < arr.length - 1 || l.length);
  const entries = []; let lead = [], cur = null, depth = 0;
  for (const l of lines) {
    if (!cur && l.trim().startsWith('//')) { lead.push(l); continue; }
    if (!cur) { cur = { lead, lines: [] }; lead = []; }
    cur.lines.push(l);
    const code = l.replace(/\/\/.*$/, '');
    for (const ch of code) { if ('[{('.includes(ch)) depth++; else if (']})'.includes(ch)) depth--; }
    if (depth === 0) { entries.push(cur); cur = null; }
  }
  const ev = new Function(helpers + '; return (t) => eval(t);')();
  for (const e of entries) {
    const code = e.lines.map((l) => l.replace(/\s*\/\/.*$/, '')).join('\n').trim().replace(/,$/, '');
    e.code = code; e.shapes = ev('[' + code + ']'); e.n = e.shapes.length;
    const m = e.lines[e.lines.length - 1].match(/\/\/.*$/); e.tail = m ? m[0] : '';
  }
  return { entries, abs: [a + bodyStart, a + bodyEnd + 1], tail: lead };
}

const files = process.argv.slice(2);
if (!files.length) { console.log('Usage: node envoi-game-pass-3/map-paths/apply-edits.mjs <edits.json> [more.json ...]'); process.exit(2); }
// every document in the files, read as check-edits.mjs reads them
let bad = 0;
const docs = [], keeps = [];
for (const f of files) {
  let v;
  try { v = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log('✗ ' + f + ': can’t read it as JSON (' + e.message + ')'); bad++; continue; }
  for (const x of E.docsOf(v, path.basename(f))) {
    if (x.keepsake) keeps.push(x.d);
    else if (x.notDoc) { console.log('✗ ' + x.where + ': this isn’t a map’s edits'); bad++; }
    else if (!Array.isArray(x.d.changed)) { console.log('✗ ' + x.where + ': ' + x.d.map + '’s edits don’t say what changed'); bad++; }
    else docs.push(x.d);
  }
}
const I = '        ';
const pts = (p) => '[' + p.map((q) => '[' + q[0] + ', ' + q[1] + ']').join(', ') + ']';
let src = SRC;
const edits = []; // [start, end, text], applied from the end
for (const doc of docs) {
  const fields = doc.changed.filter((f) => SHAPES.includes(f));
  for (const field of fields) {
    // every list is found in maps.js as it was read; the rewrites go in from the end of the file, so none moves another
    const { entries, abs, tail, inline } = fieldEntries(doc.map, field);
    const where = []; entries.forEach((e, ei) => { for (let m = 0; m < e.n; m++) where.push([ei, m]); });
    const sh = doc.shapes[field], from = sh.fromTracing, dropped = sh.dropped.slice();
    const out = [], lit = (shape, comment) => {
      const t = field === 'front' ? I + '{ pts: ' + pts(shape.pts) + ', base: ' + shape.base + ' },' : I + pts(shape) + ',';
      out.push(t + (comment ? ' ' + comment : ''));
    };
    let i = 0;
    while (i < from.length) {
      const k = from[i];
      if (k == null) {
        // a new shape: under the comment of the shape it replaces (the next dropped one)
        const d = dropped.shift(), [ei, m] = d != null ? where[d] : [-1, 0], e = entries[ei];
        if (e && m === 0) out.push(...e.lead);
        const spread = e && /^\.\.\.lamp(Fronts|Blocks)\(/.test(e.code);
        const name = spread ? '// ' + e.code.match(/\(([A-Z_]+)\)/)[1] + '[' + m + ']’s lamp post, as Chris redrew it' : (e && e.n === 1 ? e.tail : e && m === 0 ? e.tail : '');
        const shape = field === 'front' ? doc.front[i] : doc[field][i];
        lit(shape, name); i++; continue;
      }
      const [ei, m] = where[k], e = entries[ei];
      // a shape the page took from the tracing must still be that shape in maps.js (edits made on an older tracing
      // can differ): if it isn't, it is written out as the page has it
      const same = (j, mm) => JSON.stringify(field === 'front' ? [e.shapes[mm].pts, e.shapes[mm].base] : e.shapes[mm]) === JSON.stringify(field === 'front' ? [doc.front[j].pts, doc.front[j].base] : doc[field][j]);
      if (!same(i, m)) { if (m === 0) out.push(...e.lead); lit(field === 'front' ? doc.front[i] : doc[field][i], m === 0 ? e.tail : ''); i++; continue; }
      // the whole entry kept, in order: its lines as they are
      if (m === 0 && from.slice(i, i + e.n).every((x, j) => x === k + j && same(i + j, j))) { out.push(...e.lead, ...e.lines); i += e.n; continue; }
      // part of an entry kept: that shape alone
      if (m === 0) out.push(...e.lead);
      const lampM = e.code.match(/^\.\.\.lamp(Fronts|Blocks)\(([A-Z_]+)\)$/);
      if (lampM) out.push(I + lampM[2] + '[' + m + '].' + (lampM[1] === 'Fronts' ? 'front' : 'block') + ',');
      else lit(e.shapes[m], m === 0 ? e.tail : '');
      i++;
    }
    out.push(...tail);
    edits.push([abs[0], abs[1], inline ? '\n' + out.join('\n') + '\n      ' : out.join('\n') + '\n', doc.map + ' ' + field]);
  }
}
// every walk, block and front a document says changed must have its rewrite; the rest of what changed goes in by hand
for (const doc of docs) {
  const lost = doc.changed.filter((f) => SHAPES.includes(f) && !edits.some((e) => e[3] === doc.map + ' ' + f));
  if (lost.length) { console.log('✗ ' + doc.map + ': its ' + lost.join(', ') + ' changed, but nothing would be written for ' + (lost.length > 1 ? 'them' : 'it')); bad++; }
  const byHand = doc.changed.filter((f) => !SHAPES.includes(f));
  if (byHand.length) console.log('· ' + doc.map + ': its ' + byHand.join(', ') + ' changed too, which go in by hand (README.md, “Reading and applying Chris’s edits”, step 3)');
}
// the keepsakes' places, from an export or the `places` collection: named when they differ from items.js, never written
if (keeps.length) {
  globalThis.window = globalThis; require(path.join(R, 'envoi-final-draft/items/items.js'));
  const BY = Object.fromEntries(globalThis.LOOT.ITEMS.map((it) => [it.id, it])), lines = [];
  for (const k of keeps) {
    const it = BY[k.item]; if (!it) { lines.push(k.item + ': not one of the keepsakes in items.js'); continue; }
    const was = (it.source === 'hidden' || it.source === 'found') && it.at ? it.home + ' at ' + it.at.join(', ') : null, now = k.map ? k.map + ' at ' + k.x + ', ' + k.y : null;
    const what = [];
    if (now !== was) what.push(now ? 'lies on ' + now + (was ? ' (items.js: ' + was + ')' : ' (items.js: not on a map)') : 'taken off its map (items.js: ' + was + ')');
    if (k.note && String(k.note).trim()) what.push('his note: “' + String(k.note).trim() + '”');
    if (what.length) lines.push(it.name + ': ' + what.join('; '));
  }
  console.log('· the keepsakes’ places came too (' + keeps.length + '). apply-edits.mjs doesn’t write those: put any Chris moved into envoi-final-draft/items/items.js by hand (its home and at), then run node tools/check-maps.mjs.');
  for (const l of lines) console.log('    ' + l);
  if (!lines.length) console.log('    All of them are where items.js has them, with no notes: nothing to do for them.');
}
if (bad) { console.log('Nothing was written to maps.js: ' + bad + (bad === 1 ? ' problem' : ' problems') + ' above.'); process.exit(1); }
edits.sort((a, b) => b[0] - a[0]);
for (let j = 1; j < edits.length; j++) if (edits[j][1] > edits[j - 1][0]) throw new Error('overlapping edits');
for (const [a, b, t, what] of edits) { src = src.slice(0, a) + t + src.slice(b); console.log('applied ' + what); }
if (!edits.length) console.log('nothing to apply: no walk, block or front changed');
else fs.writeFileSync(P, src);
