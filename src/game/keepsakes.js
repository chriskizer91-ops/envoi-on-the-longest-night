// keepsakes.js: the twenty keepsakes in the game (Chris's list, locked October 4, 2026, evening, in
// envoi-final-draft/items/; his pictures, art request 14). What the party has found and who wears what, what each hero's
// keepsakes add up to, and how they look: the card that shows when one is found, and the Items page in the menu, which
// shows only what has been found and never how many are left (Chris: "the inventory can't tell you how many you haven't
// found"). The save keeps st.items: { <keepsake id>: who wears it, 'io' or 'sol', or '' for nobody }; a keepsake is
// found once it's there. The battle takes each hero's totals through fights.js; the balance never counts on them.
// Defines window.Keepsakes. Needs items.js (window.LOOT).
(function () {
  'use strict';
  const LIST = () => (window.LOOT ? window.LOOT.ITEMS : []);
  const get = (id) => LIST().find((it) => it.id === id) || null;
  const NAME = { io: 'Io', sol: 'Sol' };
  const GIVER = { nettie: 'Nettie', marta: 'Marta', ysmera: 'Ysmera', ede: 'Ede' };
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }

  // ---------- the save ----------
  // a save from before the twenty carried the two hidden ones as st.keepsakes: { io, sol }. They are the Crescent Locket
  // and the Warden's Brooch, worn as they were
  function migrate(st) {
    st.items = st.items || {};
    const old = st.keepsakes || {};
    if (old.io && !('crescent-locket' in st.items)) st.items['crescent-locket'] = 'io';
    if (old.sol && !('wardens-brooch' in st.items)) st.items['wardens-brooch'] = 'sol';
    return st;
  }
  const found = (st, id) => !!(st.items && Object.prototype.hasOwnProperty.call(st.items, id));
  const canWear = (it, who) => it.wear === 'either' || it.wear === who;
  // who puts one on as it's found: its own hero; a shared one Sol, once she's with Io (the shared ones make up her HP and
  // damage totals), else Io. The Items page changes it
  const firstWearer = (st, it) => (it.wear !== 'either' ? it.wear : st.flags && st.flags.party ? 'sol' : 'io');
  // found now: returns who wears it, or null if it was found before
  function give(st, id) {
    migrate(st); const it = get(id);
    if (!it || found(st, id)) return null;
    st.items[id] = firstWearer(st, it);
    return st.items[id];
  }
  // put on by `who`, or taken off ('')
  function wear(st, id, who) {
    const it = get(id);
    if (!it || !found(st, id) || (who && !canWear(it, who))) return false;
    st.items[id] = who || ''; return true;
  }
  const wornBy = (st, who) => LIST().filter((it) => st.items && st.items[it.id] === who);
  const foundList = (st) => LIST().filter((it) => found(st, it.id));

  // ---------- what they add up to ----------
  // every help of the keepsakes one hero wears, added up, in items.js's units (mostly percent)
  const KEYS = ['heal', 'hp', 'might', 'trance', 'heat', 'herbHeal', 'mp', 'mpBack', 'hpBack', 'regen', 'sunder', 'stoop', 'shards', 'herbPrice', 'glint', 'flee', 'bigBlows', 'frost'];
  function gear(st, who) {
    const g = {}; for (const k of KEYS) g[k] = 0;
    if (!st) return g;
    for (const it of wornBy(st, who)) for (const part of [it.main, it.also]) for (const k in part) g[k] += part[k];
    return g;
  }
  // what works for the whole party, from whoever wears it: more shards, cheaper herbs, brighter glints, an easier run.
  // Sol's count once she's with Io
  function party(st) {
    const a = gear(st, 'io'), b = st && st.flags && st.flags.party ? gear(st, 'sol') : gear(null);
    return { shards: a.shards + b.shards, herbPrice: a.herbPrice + b.herbPrice, glint: a.glint + b.glint > 0, flee: Math.max(a.flee, b.flee) };
  }

  // ---------- the words ----------
  const pct = (n) => String(Math.round(n * 100) / 100) + '%';
  const wearChip = (it) => (it.wear === 'io' ? 'Io only' : it.wear === 'sol' ? 'Sol only' : 'Io or Sol');
  // where it comes from, as Chris's cards say it
  const sourceLine = (it) => (it.source === 'hidden' ? 'Hidden keepsake' : it.source === 'gift' ? 'A gift from ' + (GIVER[it.giver] || it.giver) : it.source === 'fight' ? 'From the first Bramble Colossus' : 'Found');
  const whereLabel = (it) => (it.source === 'gift' ? 'A parting gift' : it.source === 'fight' ? 'Earned in battle' : it.source === 'hidden' ? 'Where it was hidden' : 'Where it was found');
  // items.js's place, without its notes for the game's makers (a gate in brackets)
  const whereText = (it) => String(it.where || '').replace(/\s*\([^)]*\)\s*$/, '') + '.';
  // the main help in a few words, as on Chris's cards: "+6.25% healing", "+2.5% HP and +2.5% damage"
  function mainLine(it) {
    const m = it.main, out = [];
    if (m.heal) out.push('+' + pct(m.heal) + ' healing');
    if (m.hp) out.push('+' + pct(m.hp) + ' HP');
    if (m.might) out.push('+' + pct(m.might) + ' damage');
    return out.join(' and ');
  }
  // what the main help means for whoever wears it (on Io, a shared one's damage is her spells')
  function mainMeans(it) {
    const m = it.main;
    if (m.heal) return 'Lunar Mend and Waxing Light heal more';
    if (m.hp && m.might) return 'More HP, and her blows land harder';
    if (m.hp) return 'More max HP for whoever wears it';
    return it.wear === 'either' ? 'Blows, and Io’s spells, land harder' : 'Her blows land harder';
  }
  // a hero's keepsakes in a line, for the Party tab: what their main helps come to
  function summary(st, who) {
    const g = gear(st, who), out = [];
    if (g.heal) out.push('+' + pct(g.heal) + ' healing');
    if (g.hp) out.push('+' + pct(g.hp) + ' HP');
    if (g.might) out.push('+' + pct(g.might) + ' damage');
    return out.join(' · ');
  }

  // ---------- the card ----------
  // its picture, its name, who can wear it, where it comes from, its two helps and where it was found: in the look of
  // Chris's cards, laid out to read on his phone held either way. It never numbers the keepsakes
  function card(it, o) {
    o = o || {};
    const c = el('article', { class: 'kcard kc-' + it.wear + (it.secret ? ' is-secret' : '') });
    const head = el('header', { class: 'kcard-head' }, c);
    el('span', { class: 'kcard-brand' }, head, 'Envoi · keepsake');
    el('span', { class: 'kcard-who' }, head, wearChip(it));
    const pic = el('div', { class: 'kcard-pic' }, c);
    el('img', { alt: '', src: o.src ? o.src(it.pic) : it.pic, width: '256', height: '256' }, pic);
    const body = el('div', { class: 'kcard-body' }, c);
    el('h3', { class: 'kcard-name' }, body, it.name);
    el('p', { class: 'kcard-source' }, body, (it.secret ? '★ ' : '') + sourceLine(it));
    const helps = el('div', { class: 'kcard-helps' }, body);
    const m = el('p', { class: 'kcard-main' }, helps, mainLine(it)); el('small', null, m, mainMeans(it));
    const a = el('p', { class: 'kcard-also' }, helps, it.alsoDoes); el('small', null, a, it.inFight ? 'In fights' : 'Outside fights');
    const w = el('div', { class: 'kcard-where' }, body);
    el('small', null, w, whereLabel(it)); el('p', null, w, whereText(it));
    return c;
  }

  // the card over the game, until it's closed: when one is found (kicker 'Found'), and from the Items page, with what can
  // be done with it there. o: { src, kicker, wears, actions: [{ label, run }], root }
  function show(root, it, o) {
    o = o || {};
    return new Promise((done) => {
      const lay = el('div', { class: 'kcard-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': it.name }, root);
      const box = el('div', { class: 'kcard-box' }, lay);
      if (o.kicker) el('p', { class: 'kcard-kicker' }, box, o.kicker);
      box.appendChild(card(it, o));
      const foot = el('div', { class: 'kcard-foot' }, box);
      if (o.wears) el('p', { class: 'kcard-wears' }, foot, o.wears);
      const row = el('div', { class: 'kcard-actions' }, foot);
      const prev = document.activeElement;
      let shut = false;
      const close = () => {
        if (shut) return; shut = true;
        document.removeEventListener('keydown', onKey, true); lay.remove();
        if (prev && prev.isConnected && prev.focus) prev.focus({ preventScroll: true });
        done();
      };
      for (const x of o.actions || []) { const b = el('button', { type: 'button', class: 'go alt' }, row, x.label); b.addEventListener('click', () => { x.run(); close(); }); }
      const ok = el('button', { type: 'button', class: 'go' }, row, o.ok || 'OK'); ok.addEventListener('click', close);
      // Esc closes the card alone (not the menu under it); Enter and Space press the button in focus
      const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
      document.addEventListener('keydown', onKey, true);
      lay.addEventListener('click', (e) => { if (e.target === lay) close(); });
      setTimeout(() => { if (!shut) ok.focus({ preventScroll: true }); }, 30);
    });
  }
  // the card as one is found: who puts it on
  function showFound(root, st, id, o) {
    const it = get(id), who = st.items[id];
    const line = who ? NAME[who] + ' puts it on.' + (it.wear === 'either' ? ' Either of them can wear it: the menu’s Items page hands it over.' : '') : '';
    return show(root, it, Object.assign({ kicker: it.source === 'gift' ? 'A gift' : it.source === 'fight' ? 'Earned' : 'Found', wears: line }, o || {}));
  }

  // ---------- the Items page in the menu ----------
  // Io's keepsakes beside Sol's, each its picture; a tap shows its card, where it can be taken off, put on, or (a shared
  // one) handed to the other. Only what has been found is here: nothing counts the twenty or keeps places for the rest.
  // o: { root, src, heroes: ['io', 'sol'], redraw, changed }
  function page(body, st, o) {
    migrate(st);
    const heroes = o.heroes || ['io', 'sol'];
    if (!foundList(st).length) { el('p', { class: 'gm-top' }, body, 'Nothing yet. What Io and Sol find on the way, and what people give them, is kept here.'); return; }
    el('p', { class: 'gm-top' }, body, 'What Io and Sol have found. Tap one to see its card.');
    const cols = el('div', { class: 'ks-cols' }, body);
    for (const who of heroes) {
      const sec = el('section', { class: 'ks-col' }, cols); el('h3', null, sec, NAME[who]);
      const list = wornBy(st, who), grid = el('div', { class: 'ks-grid' }, sec);
      if (!list.length) el('p', { class: 'ks-none' }, sec, 'Wears none');
      for (const it of list) tile(grid, it);
    }
    const off = foundList(st).filter((it) => !st.items[it.id] || !heroes.includes(st.items[it.id]));
    if (off.length) {
      const sec = el('section', { class: 'ks-col ks-off' }, body); el('h3', null, sec, 'Not worn');
      const grid = el('div', { class: 'ks-grid' }, sec); for (const it of off) tile(grid, it);
    }
    function tile(grid, it) {
      const b = el('button', { type: 'button', class: 'ks-tile kc-' + it.wear + (it.secret ? ' is-secret' : ''), 'aria-label': it.name, title: it.name }, grid);
      el('img', { alt: '', src: o.src ? o.src(it.pic) : it.pic, width: '256', height: '256' }, b);
      b.addEventListener('click', async () => {
        await show(o.root, it, Object.assign({ src: o.src }, choices(it)));
        if (o.redraw) o.redraw();
        const again = body.querySelector('.ks-tile[title="' + it.name.replace(/"/g, '\\"') + '"]'); if (again) again.focus({ preventScroll: true });
      });
    }
    // who wears it, and what can be done with it
    function choices(it) {
      const who = st.items[it.id], acts = [], set = (w) => () => { wear(st, it.id, w); if (o.changed) o.changed(); };
      if (who) {
        if (it.wear === 'either') for (const h of heroes) if (h !== who) acts.push({ label: 'Give it to ' + NAME[h], run: set(h) });
        acts.push({ label: 'Take it off', run: set('') });
      } else for (const h of heroes) if (canWear(it, h)) acts.push({ label: (it.wear === 'either' ? NAME[h] + ' puts it on' : 'Put it on'), run: set(h) });
      return { wears: who ? NAME[who] + ' wears it.' : 'Nobody wears it.', actions: acts, ok: 'Close' };
    }
  }

  window.Keepsakes = { list: LIST, get, migrate, found, give, wear, wornBy, foundList, canWear, gear, party, summary, card, show, showFound, page, mainLine, sourceLine };
})();
