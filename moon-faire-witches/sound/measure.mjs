// measure.mjs: renders every sound and every part of the music of moon-faire-witches/src/battle/sound.js offline (an
// OfflineAudioContext in headless Chromium, so nothing has to be played or heard) and prints, for each: how long it
// lasts, its peak after the limiter (must stay under 0.95), how loud it is on average, and how loud what a phone
// speaker can carry of it is (its average level above 300 Hz). For the music it also checks the loop: two rounds are
// rendered, and the longest silence anywhere in them is measured (a seam would show as a gap at the loop point).
// Usage: node moon-faire-witches/sound/measure.mjs [--only name,name] [--raw] [--json out.json] [--md out.md]
//   --only: just these sounds, or these parts of the music by name (--only battle,ashenReel)
//   --raw: also the peak before the limiter (for balancing the sounds against each other)
// For the music it also prints how loud what lies above 4 kHz is (the part of a sound that turns harsh on a phone speaker).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('/opt/npm-tools/node_modules/playwright'); } catch { pw = require('playwright'); }
const R = path.resolve(new URL('../..', import.meta.url).pathname);
const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1]; };
const only = opt('--only') ? opt('--only').split(',') : null, RAWPEAK = args.includes('--raw');
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.setContent('<!doctype html><title>measure</title>');
await page.addScriptTag({ content: fs.readFileSync(path.join(R, 'moon-faire-witches/src/battle/sound.js'), 'utf8') });
await page.evaluate(() => {
  const SR = 44100;
  // what a render holds: peak, where it ends (the last moment above -50 dB), average level, and the share above 300 Hz
  // (every render starts its sound at LEAD seconds, not at 0: the browser's compressor starts a render turned right
  // down and takes a moment to open, which a page that has been open for a while never shows)
  const LEAD = 0.5; window.LEAD = LEAD;
  window.stats = (buf) => {
    const o = Math.round(LEAD * SR), L = buf.getChannelData(0).subarray(o), Rr = (buf.numberOfChannels > 1 ? buf.getChannelData(1) : buf.getChannelData(0)).subarray(o), n = L.length;
    let peak = 0, last = 0, first = -1, e = 0, eh = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0, wide = 0, et = 0, u1 = 0, u2 = 0, v1 = 0, v2 = 0;
    // a 300 Hz high-pass (two poles), to see what is left for a small speaker
    const w = 2 * Math.PI * 300 / SR, c = Math.cos(w), al = Math.sin(w) / (2 * 0.7071), b0 = (1 + c) / 2 / (1 + al), b1 = -(1 + c) / (1 + al), a1 = -2 * c / (1 + al), a2 = (1 - al) / (1 + al);
    // and a 4 kHz high-pass, to see how much of it is up where a phone speaker turns harsh
    const w4 = 2 * Math.PI * 4000 / SR, c4 = Math.cos(w4), al4 = Math.sin(w4) / (2 * 0.7071), d0 = (1 + c4) / 2 / (1 + al4), d1 = -(1 + c4) / (1 + al4), k1 = -2 * c4 / (1 + al4), k2 = (1 - al4) / (1 + al4);
    for (let i = 0; i < n; i++) {
      const m = (L[i] + Rr[i]) / 2, a = Math.max(Math.abs(L[i]), Math.abs(Rr[i]));
      const z = d0 * m + d1 * u1 + d0 * u2 - k1 * v1 - k2 * v2; u2 = u1; u1 = m; v2 = v1; v1 = z; et += z * z;
      if (a > peak) peak = a; if (a > 0.00316) { last = i; if (first < 0) first = i; }
      const y = b0 * m + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = m; y2 = y1; y1 = y;
      e += m * m; eh += y * y; wide += (L[i] - Rr[i]) * (L[i] - Rr[i]);
    }
    const len = (last + 1) / SR;
    return { peak, len, rms: Math.sqrt(e / Math.max(1, last + 1)), phone: e ? eh / e : 0, phoneRms: Math.sqrt(eh / Math.max(1, last + 1)), highRms: Math.sqrt(et / Math.max(1, last + 1)), wide: e ? Math.sqrt(wide / 4 / e) : 0, full: last >= n - SR * 0.05 };
  };
  window.renderSfx = async (name, a, sec, noLimiter) => {
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * (sec + LEAD)), SR), S = window.makeBattleSound({ context: ctx, noLimiter });
    S.init(); ctx.suspend(LEAD).then(() => { S.sfx[name](...a); ctx.resume(); });
    const buf = await ctx.startRendering();
    return Object.assign(window.stats(buf), { errors: S.errors.slice(), missing: [...S.missing] });
  };
  window.renderMusic = async (part, noLimiter) => {
    const S0 = window.makeBattleSound(), P = S0.parts.find((p) => p.name === part), sec = P.seconds * 2;
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * (sec + LEAD)), SR), S = window.makeBattleSound({ context: ctx, noLimiter });
    S.init(); S.score(part, sec + LEAD - 0.001, LEAD);
    const o = Math.round(LEAD * SR), buf = await ctx.startRendering(), st = window.stats(buf), L = buf.getChannelData(0).subarray(o), Rr = buf.getChannelData(1).subarray(o);
    // the longest silence (under -46 dB) after the first note, and how loud the half second across the loop point is
    let gap = 0, run = 0, started = false, seamGap = 0; const seamAt = Math.round(P.seconds * SR);
    for (let i = 0; i < L.length; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(Rr[i])); if (a > 0.005) { started = true; run = 0; } else if (started) { run++; if (run > gap) gap = run; if (Math.abs(i - seamAt) < SR && run > seamGap) seamGap = run; } }
    const seam = Math.round(P.seconds * SR), win = Math.round(SR * 0.25); let es = 0; for (let i = seam - win; i < seam + win; i++) es += ((L[i] + Rr[i]) / 2) ** 2;
    // the first round against the second: the same notes, so the same loudness, bar for bar
    let e1 = 0, e2 = 0; for (let i = 0; i < seam; i++) e1 += L[i] * L[i]; for (let i = seam; i < L.length; i++) e2 += L[i] * L[i];
    return Object.assign(st, { loop: P.seconds, bars: P.bars, gapMs: gap / SR * 1000, seamGapMs: seamGap / SR * 1000, seamDb: 20 * Math.log10(Math.sqrt(es / (2 * win)) / st.rms), roundsDb: 10 * Math.log10(e2 / e1), errors: S.errors.slice() });
  };
});
const cat = await page.evaluate(() => { const S = window.makeBattleSound(); return { catalog: S.catalog, parts: S.parts, families: S.families }; });
const rows = [], bad = [];
const f2 = (x) => x.toFixed(2), db = (x) => (20 * Math.log10(Math.max(1e-6, x))).toFixed(0);
const jobs = [];
for (const c of cat.catalog) { if (only && !only.includes(c.name)) continue; for (const [label, a] of c.takes ? Object.entries(c.takes) : [['', c.demo]]) jobs.push({ c, label, a }); }
async function one({ c, label, a }) {
  let r = await page.evaluate(([n, a2, s]) => window.renderSfx(n, a2, s, false), [c.name, a, 3.5]);
  if (r.full) r = await page.evaluate(([n, a2, s]) => window.renderSfx(n, a2, s, false), [c.name, a, 14]);
  if (RAWPEAK) r.raw = (await page.evaluate(([n, a2, s]) => window.renderSfx(n, a2, s, true), [c.name, a, Math.min(14, r.len + 0.3)])).peak;
  return Object.assign({ name: c.name, take: label, family: c.family }, r);
}
// three renders at a time (each OfflineAudioContext renders on its own thread)
for (let i = 0; i < jobs.length; i += 3) for (const r of await Promise.all(jobs.slice(i, i + 3).map(one))) {
  rows.push(r); const label = r.take;
  if (r.errors.length || r.missing.length) bad.push(r.name + ': ' + r.errors.concat(r.missing).join('; '));
  if (r.peak > 0.95) bad.push(r.name + ': peak ' + f2(r.peak));
  if (r.peak < 0.03) bad.push(r.name + (label ? ' (' + label + ')' : '') + ': nearly silent, peak ' + r.peak.toFixed(3));
}
const music = [];
for (const p of cat.parts) {
  if (only && !only.includes(p.name)) continue;
  const r = await page.evaluate((n) => window.renderMusic(n, false), p.name);
  if (RAWPEAK) r.raw = (await page.evaluate((n) => window.renderMusic(n, true), p.name)).peak;
  music.push(Object.assign({ name: p.name }, r));
  if (r.errors.length) bad.push(p.name + ': ' + r.errors.join('; ')); if (r.peak > 0.95) bad.push(p.name + ': peak ' + f2(r.peak)); if (r.seamGapMs > 40) bad.push(p.name + ': a silence of ' + Math.round(r.seamGapMs) + ' ms at the loop point');
}
await browser.close();
let md = '| Sound | Seconds | Peak | Average (dB) | On a phone speaker (dB) |' + (RAWPEAK ? ' Before the limiter |' : '') + '\n|---|---|---|---|---|' + (RAWPEAK ? '---|' : '') + '\n';
let famNow = '';
for (const r of rows) {
  if (r.family !== famNow) { famNow = r.family; md += '| **' + famNow + '** | | | | |' + (RAWPEAK ? ' |' : '') + '\n'; }
  md += '| ' + r.name + (r.take ? ' (' + r.take + ')' : '') + ' | ' + f2(r.len) + ' | ' + f2(r.peak) + ' | ' + db(r.rms) + ' | ' + db(r.phoneRms) + ' |' + (RAWPEAK ? ' ' + f2(r.raw) + ' |' : '') + '\n';
}
if (music.length) {
  md += '\n| Music | One round (s) | Bars | Peak | Average (dB) | On a phone speaker (dB) | Above 4 kHz (dB) | Longest silence within a second of the loop point (ms) | Longest silence anywhere in two rounds, a rest in the tune (ms) | Across the loop point (dB against the average) | Round two against round one (dB) |' + (RAWPEAK ? ' Before the limiter |' : '') + '\n|---|---|---|---|---|---|---|---|---|---|---|' + (RAWPEAK ? '---|' : '') + '\n';
  for (const r of music) md += '| ' + r.name + ' | ' + f2(r.loop) + ' | ' + r.bars + ' | ' + f2(r.peak) + ' | ' + db(r.rms) + ' | ' + db(r.phoneRms) + ' | ' + db(r.highRms) + ' | ' + Math.round(r.seamGapMs) + ' | ' + Math.round(r.gapMs) + ' | ' + r.seamDb.toFixed(1) + ' | ' + r.roundsDb.toFixed(2) + ' |' + (RAWPEAK ? ' ' + f2(r.raw) + ' |' : '') + '\n';
}
console.log(md);
const peaks = rows.concat(music).map((r) => r.peak);
console.log(rows.length + ' renders of ' + new Set(rows.map((r) => r.name)).size + ' sounds, ' + music.length + ' parts of the music. Highest peak ' + f2(Math.max(...peaks)) + ', lowest ' + f2(Math.min(...peaks)) + '. Page errors: ' + errs.length + '. Problems: ' + bad.length);
for (const b of bad.concat(errs)) console.log('  ! ' + b);
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify({ rows, music }, null, 1));
if (opt('--md')) fs.writeFileSync(opt('--md'), md);
process.exit(bad.length || errs.length ? 1 : 0);
