// apply-edits.mjs: puts Chris's edits from the Walking Paths page into the game's src/game/maps.js. Check them first
// (check-edits.mjs). Each changed walk, block or front list is rewritten with its unchanged lines kept exactly as they
// are (their comments, and the arc(), ring() and lamp helpers), and each new or changed shape written as plain points
// under the comment of the shape it replaces; a lamp helper is opened up only where one of its lamps changed.
// Usage: node envoi-game-pass-3/map-paths/apply-edits.mjs <edits.json> [more.json ...]
//   each file one map's document as the page's store gives it back (ArtifactData list/get with out_dir), or its data
// Then node tools/check-maps.mjs, build, test and publish (README.md, "Reading and applying Chris's edits").
import fs from 'fs';
import path from 'path';
const R = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..'), P = path.join(R, 'src/game/maps.js');
const SRC = fs.readFileSync(P, 'utf8');
const helpers = SRC.slice(SRC.indexOf("  'use strict';") + 15, SRC.indexOf('  const MAPS = {'));
function mapBlock(id) {
  const key = /^[a-z]+$/.test(id) ? id : "'" + id + "'";
  const start = SRC.indexOf('\n    ' + key + ': {\n'); if (start < 0) throw new Error('no map ' + id);
  const end = SRC.indexOf('\n    },\n', start); return [start + 1, end + 7];
}
function fieldEntries(id, field) {
  const [a, b] = mapBlock(id), block = SRC.slice(a, b);
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

const docs = process.argv.slice(2).map((f) => { const v = JSON.parse(fs.readFileSync(f, 'utf8')); return v.data && v.data.map ? v.data : v; });
if (!docs.length) { console.log('Usage: node envoi-game-pass-3/map-paths/apply-edits.mjs <edits.json> [more.json ...]'); process.exit(2); }
const I = '        ';
const pts = (p) => '[' + p.map((q) => '[' + q[0] + ', ' + q[1] + ']').join(', ') + ']';
let src = SRC;
const edits = []; // [start, end, text], applied from the end
for (const doc of docs) {
  const fields = (doc.changed || []).filter((f) => ['walk', 'block', 'front'].includes(f));
  for (const field of fields) {
    // every list is found in maps.js as it was read; the rewrites go in from the end of the file, so none moves another
    const { entries, abs, tail } = fieldEntries(doc.map, field);
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
      // the whole entry kept, in order: its lines as they are
      if (m === 0 && from.slice(i, i + e.n).every((x, j) => x === k + j)) { out.push(...e.lead, ...e.lines); i += e.n; continue; }
      // part of an entry kept: that shape alone
      if (m === 0) out.push(...e.lead);
      const lampM = e.code.match(/^\.\.\.lamp(Fronts|Blocks)\(([A-Z_]+)\)$/);
      if (lampM) out.push(I + lampM[2] + '[' + m + '].' + (lampM[1] === 'Fronts' ? 'front' : 'block') + ',');
      else lit(e.shapes[m], m === 0 ? e.tail : '');
      i++;
    }
    out.push(...tail);
    edits.push([abs[0], abs[1], out.join('\n') + '\n', doc.map + ' ' + field]);
  }
}
edits.sort((a, b) => b[0] - a[0]);
for (let j = 1; j < edits.length; j++) if (edits[j][1] > edits[j - 1][0]) throw new Error('overlapping edits');
for (const [a, b, t, what] of edits) { src = src.slice(0, a) + t + src.slice(b); console.log('applied ' + what); }
if (!edits.length) console.log('nothing to apply: no walk, block or front changed');
fs.writeFileSync(P, src);
