import { open, sleep, S } from './lib.mjs';
const { browser, page, shot, waitFor, talkThrough } = await open();
await shot('title');
// New game: the prologue
await page.click('.title-box button');
await talkThrough(90000, () => window.__game && window.__game.mode === 'field' && !window.__game.busy, async () => { await shot('prologue'); });
await waitFor(() => window.__game.field.map && window.__game.field.map.id === 'cottage');
await sleep(800); await shot('cottage-start');
const go = async (ch, map, at, dir, extra) => {
  await page.evaluate(([ch, map, at, dir, extra]) => {
    const g = window.__game, st = g.chapterState(g.CHAPTERS[ch]);
    for (const id of Object.keys(window.MAPS)) st.done['visit:' + id] = true;
    Object.assign(st.done, { 'camp:warmCamp': ch >= 2, 'camp:northCamp': ch >= 3, 'camp:frozenCamp': ch >= 4 }, (extra && extra.done) || {});
    Object.assign(st.flags, (extra && extra.flags) || {});
    if (ch === 0) { st.flags.party = true; st.done.first = true; st.flags.magpie = true; }
    g.state = st; g.goField(map, at, dir);
  }, [ch, map, at, dir || 's', extra || null]);
  await waitFor((m) => window.__game.field.map && window.__game.field.map.id === m && !window.__game.busy, map, 60000);
  await page.evaluate(() => window.__game.field.setCounter && window.__game.field.setCounter(-1e6));
  await sleep(1500);
};
const list = [
  [0, 'cottage', [640, 560], 'w'], [0, 'wickhollow', [640, 500], 's'], [0, 'jetty', [768, 690], 'n'], [0, 'thornwood', [990, 420], 'e'],
  [1, 'bogmire', [700, 430], 's'], [1, 'bogmire-heart', [770, 880], 'n'],
  [2, 'bogmire', [700, 430], 's', { done: { greatWraith: true }, flags: { lights: true } }, 'bogmire-lit'],
  [2, 'warm-roads-camp', [790, 570], 's'], [2, 'ember-line-road', [585, 545], 'n'], [2, 'dawnroost-road', [760, 560], 'n'], [2, 'dawnroost', [790, 720], 'n'], [2, 'dawnroost-node', [768, 900], 'n'],
  [3, 'northern-camp', [790, 520], 's'], [3, 'eldergrove-edge', [700, 520], 'e'], [3, 'cold-moor', [700, 560], 'e'], [3, 'crossroads', [470, 660], 'n'],
  [4, 'shipyard', [765, 600], 'n'], [4, 'frozen-camp', [800, 560], 's'], [4, 'frostmere-shore', [768, 480], 'n'], [4, 'frozen-pass', [790, 720], 'n'], [4, 'misthollow', [768, 880], 'n'], [4, 'moonwell', [768, 900], 'n'],
];
for (const [ch, map, at, dir, extra, name] of list) {
  try { await go(ch, map, at, dir, extra); await shot('field-' + (name || map)); }
  catch (e) { console.log('FAIL', map, e.message); await shot('fail-' + map); await talkThrough(20000).catch(() => {}); }
}
// talk to Nettie (shop), Ysmera (portrait)
async function talkTo(ch, map, at, dir, name, extra) {
  await go(ch, map, at, dir, extra);
  await page.keyboard.press('Enter');
  await sleep(1500); await shot(name);
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Enter'); await sleep(900); await shot(name + '-' + (i + 1)); }
  await page.keyboard.press('Escape'); await sleep(400);
  await talkThrough(20000).catch(() => {}); await page.keyboard.press('Escape'); await sleep(400);
}
try { await talkTo(0, 'wickhollow', [600, 450], 'w', 'talk-nettie'); } catch (e) { console.log('FAIL nettie', e.message); }
try { await talkTo(4, 'shipyard', [765, 545], 'n', 'talk-ysmera'); } catch (e) { console.log('FAIL ysmera', e.message); }
try { await talkTo(4, 'misthollow', [930, 700], 'e', 'talk-ede'); } catch (e) { console.log('FAIL ede', e.message); }
await browser.close();
