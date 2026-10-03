// balance-page.js: the battle balance page (demos/balance.html). It shows the balance targets with the simulator's last
// results (balance-results.js) and can play them all again in the browser; it plays one fight turn by turn with each
// fighter's gauges and every blow written out; and it shows the level curve and the experience and shards along the
// way. Needs rules.js, engine.js and sim.js.
(function () {
  'use strict';
  const RL = window.BattleRules, E = window.BattleEngine, S = window.BattleSim;
  const $ = (id) => document.getElementById(id);
  function el(tag, attrs, parent, text) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const pct = (x) => Math.round(x * 100) + '%';
  const nf = (n) => Math.round(n).toLocaleString('en-US');
  const STYLE = { careless: 'Careless', sensible: 'Attentive', expert: 'Expert' };
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- the targets ----------
  function targetText(t) {
    const parts = [];
    if (t.win) parts.push(t.win[0] === t.win[1] ? pct(t.win[0]) : t.win[0] === 0 ? 'at most ' + pct(t.win[1]) : t.win[1] === 1 ? 'at least ' + pct(t.win[0]) : pct(t.win[0]) + ' to ' + pct(t.win[1]));
    if (t.minutes) parts.push(t.minutes[0] + ' to ' + t.minutes[1] + ' min');
    if (t.margin != null) parts.push('losses leave under ' + pct(t.margin));
    return parts.join(', ');
  }
  // one line per target: the fight and how often it was won, then the style, the target and the length beneath
  function renderTargets(res) {
    const box = $('targets');
    box.textContent = '';
    let met = 0, lastWhy = '';
    res.rows.forEach((row) => {
      const t = S.TARGETS[row.i];
      if (!row.fails.length) met++;
      if (t.why !== lastWhy) { el('h3', null, box, t.why); lastWhy = t.why; }
      const r = el('div', { class: 'trow' }, box);
      el('span', { class: 'tname' }, r, S.FIGHTS[t.fight].name + ', level ' + t.level);
      el('span', { class: 'twin' }, r, pct(row.winRate));
      el('span', { class: 'chip ' + (row.fails.length ? 'miss' : 'ok') }, r, row.fails.length ? 'Missed' : 'Met');
      el('span', { class: 'tmore' }, r, STYLE[t.policy] + ' play · want ' + targetText(t) + ' · ' + row.minutes.median.toFixed(1) + ' min' +
        (row.loseMargin == null ? '' : ' · losses leave ' + pct(row.loseMargin)) + (row.fails.length ? ' · missed on ' + row.fails.join(', ') : ''));
    });
    $('met').textContent = met + ' of ' + res.rows.length;
    $('metNote').textContent = 'targets met, ' + nf(res.n) + ' fights each' + (res.here ? ', played here just now.' : ', from the last run of tools/balance.mjs.');
  }
  let running = false;
  function playAgain() {
    if (running) return;
    running = true;
    const n = +$('runN').value, seed = 1 + Math.floor(Math.random() * 1e6), out = { n, here: true, rows: [] };
    const btn = $('runBtn'); btn.disabled = true;
    let i = 0;
    const step = () => {
      const t = S.TARGETS[i];
      $('runStatus').textContent = 'Playing ' + S.FIGHTS[t.fight].name.toLowerCase() + ' at level ' + t.level + ', ' + t.policy + ' (' + (i + 1) + ' of ' + S.TARGETS.length + ')';
      setTimeout(() => {
        const r = S.run(t.fight, t.level, t.policy, n, { seed: seed + i * 7919 });
        out.rows.push({ i, winRate: r.winRate, retreat: r.retreat, minutes: r.minutes, loseMargin: r.loseMargin, fails: S.check(t, r) });
        i++;
        if (i < S.TARGETS.length) step();
        else { renderTargets(out); $('runStatus').textContent = 'Done: ' + nf(n * S.TARGETS.length) + ' fights.'; btn.disabled = false; running = false; }
      }, 20);
    };
    step();
  }

  // ---------- watching one fight ----------
  const W = { fight: 'first', level: 1, policy: 'sensible', timer: 0, B: null, rand: null, cards: {}, n: 0 };
  function nameOf(B, key) { const u = B.unit(key); return u ? u.name : key === 'lunara' ? 'Lunara' : key === 'envoi' ? 'Envoi' : key; }
  function card(u, parent) {
    const c = el('div', { class: 'unit ' + u.side }, parent);
    const top = el('div', { class: 'top' }, c);
    el('span', { class: 'who' }, top, u.name);
    el('span', { class: 'lv' }, top, 'Level ' + u.level);
    const g = (cls, label) => { const r = el('div', { class: 'gauge ' + cls }, c); el('span', null, r, label); const b = el('span', { class: 'bar' }, r); const i = el('i', null, b); const v = el('span', null, r); return { i, v }; };
    const o = { c, hp: g('hp', 'HP'), atb: g('atb', 'Turn') };
    if (u.id === 'io') o.mp = g('mp', 'MP');
    if (u.id === 'sol') o.heat = g('heat', 'Heat');
    if (u.side === 'hero') o.tr = g('tr', 'Trance');
    o.tags = el('div', { class: 'tags' }, c);
    return o;
  }
  function paint() {
    const B = W.B;
    for (const u of B.units) {
      const o = W.cards[u.key];
      o.c.classList.toggle('down', u.hp <= 0);
      o.hp.i.style.width = (100 * u.hp / u.maxHp) + '%'; o.hp.v.textContent = nf(u.hp);
      o.atb.i.style.width = (100 * u.atb) + '%'; o.atb.v.textContent = '';
      if (o.mp) { o.mp.i.style.width = (100 * u.mp / u.maxMp) + '%'; o.mp.v.textContent = u.mp; }
      if (o.heat) { o.heat.i.style.width = u.heat + '%'; o.heat.v.textContent = u.heat; }
      if (o.tr) { o.tr.i.style.width = (100 * Math.min(1, u.trance)) + '%'; o.tr.v.textContent = u.inTrance ? 'on' : ''; }
      const tags = [];
      if (u.side === 'hero') {
        if (u.inTrance) tags.push(u.id === 'io' ? 'Twin Moons' : 'Dawnbreaker');
        if (u.id === 'sol' && !u.inTrance && u.heat >= 70) tags.push('Sunburn');
        if (u.defending) tags.push('Defending'); if (u.guarding) tags.push('Guarding');
        if (u.severed) tags.push('Severed');
        if (u.hovering) tags.push('Hovering');
      } else {
        if (u.bound) tags.push('Bound'); if (u.sunder > 0) tags.push('Sundered');
        if (u.charging) tags.push('Gathering ' + u.def.moves[u.charging].name); if (u.vow > 0) tags.push("Warden's Vow");
        if (u.evade) tags.push('Guttering'); if (u.rage) tags.push('Cold ×' + (1 + u.rage * u.acted).toFixed(2));
      }
      if (u.side === 'hero' && B.lunara === 1) tags.push('Embrace');
      if (u.side === 'hero' && B.ward) tags.push("Envoi's ward");
      o.tags.textContent = '';
      for (const t of tags) el('span', null, o.tags, t);
    }
  }
  // one turn's log as a line: who did what, every blow and heal, and anything that changed
  function describe(B, log) {
    const parts = [];
    // blows in a row are grouped by who takes them: "Shadow Wraith −254 −260, Io −190"
    let hits = null;
    const flush = () => {
      if (!hits) return;
      parts.push(['dmg', ' ' + hits.order.map((k) => nameOf(B, k) + ' ' + hits.by[k].join(' ')).join(', ')]);
      hits = null;
    };
    for (const e of log) {
      switch (e.t) {
        case 'turn': break;
        case 'move': flush(); parts.push(['b', nameOf(B, e.who)], ' ' + (e.released ? 'unleashes ' : 'uses ') + e.name + (e.target && B.unit(e.target) && B.unit(e.target).side === 'foe' && B.unit(e.who).side === 'hero' ? ' on ' + nameOf(B, e.target) : e.target && e.target !== e.who && B.unit(e.target) ? ' on ' + nameOf(B, e.target) : '') + '.'); break;
        case 'hit': {
          if (!hits) hits = { order: [], by: {} };
          if (!hits.by[e.to]) { hits.by[e.to] = []; hits.order.push(e.to); }
          hits.by[e.to].push('−' + nf(e.n) + (e.guard ? ' (halved)' : ''));
          break;
        }
        case 'heal': flush(); parts.push(['heal', ' ' + nameOf(B, e.to) + ' +' + nf(e.n)]); break;
        case 'miss': flush(); parts.push(['note', ' It misses: ' + nameOf(B, e.to) + ' gutters almost out.']); break;
        case 'bound': flush(); parts.push(['note', ' ' + nameOf(B, e.to) + ' is Bound.']); break;
        case 'sundered': flush(); parts.push(['note', ' ' + nameOf(B, e.to) + ' is Sundered.']); break;
        case 'sever': flush(); parts.push(['note', ' ' + nameOf(B, e.to) + ' is Severed.']); break;
        case 'severed': flush(); parts.push(['note', ' ' + nameOf(B, e.to) + ' is Severed and can\'t be healed.']); break;
        case 'might': flush(); parts.push(['note', ' Every blow the party lands is ' + Math.round(e.n * 100) + '% harder from now on.']); break;
        case 'cover': flush(); parts.push(['note', ' Sol guards Io.']); break;
        case 'oath': flush(); parts.push(['note', " Warden's Oath: Sol steps in front of Io."]); break;
        case 'counter': flush(); parts.push(['note', ' ' + nameOf(B, e.who) + ' counters.']); break;
        case 'ward': flush(); parts.push(['note', " Envoi's Folding Ward takes the whole blow."]); break;
        case 'charge': flush(); parts.push(['b', nameOf(B, e.who)], e.name === 'Lure' ? ' holds out its fruit: the Lure. The Grab comes next turn.' : ' gathers ' + e.name + '. It lands on her next turn.'); break;
        case 'tranceReady': flush(); parts.push(['note', ' ' + nameOf(B, e.who) + "'s Trance gauge is full."]); break;
        case 'trance': flush(); parts.push(['b', nameOf(B, e.who)], ' enters Trance.'); break;
        case 'tranceEnds': flush(); parts.push(['note', ' ' + nameOf(B, e.who) + "'s Trance ends."]); break;
        case 'burn': flush(); parts.push(['dmg', ' Sunburn: Sol −' + nf(e.n)]); break;
        case 'down': flush(); parts.push(['note', ' ' + nameOf(B, e.who) + (B.unit(e.who).side === 'foe' ? ' is released.' : ' falls.')]); break;
        case 'revive': flush(); parts.push(['heal', ' ' + nameOf(B, e.who) + ' is back up with ' + nf(e.n) + '.']); break;
        case 'summon': flush(); parts.push(['note', e.who === 'lunara' ? ' Lunara rises from the well and closes her wings over the party.' : " The letters fold into Envoi; Sol's blade lights its heart."]); break;
        case 'strike': flush(); parts.push(['b', e.who === 'lunara' ? 'Lunara' : 'Envoi'], e.who === 'lunara' ? ' casts Silver Requiem.' : ' wraps its foe and burns.'); break;
        case 'leave': flush(); break;
        case 'blackout': flush(); parts.push(['note', ' The screen goes dark. Halcyon strikes unseen.']); break;
        case 'frost': flush(); parts.push(['note', ' Frost drifts over everything: the party slows for ' + e.s + ' seconds.']); break;
        case 'frostEnds': flush(); parts.push(['note', ' The frost clears.']); break;
        case 'stagger': flush(); parts.push(['b', nameOf(B, e.who)], ' falters and loses her turn.'); break;
        case 'kestrel': flush(); parts.push(['note', ' "Kestrel." Halcyon hears her old name for Sol.']); break;
        case 'hover': flush(); parts.push(['note', ' Sol springs up and hangs in the air like a kestrel.']); break;
        case 'herb': flush(); parts.push(['b', nameOf(B, e.who)], ' uses ' + e.name + (e.to ? ' on ' + nameOf(B, e.to) : '') + '.'); break;
        case 'heat': flush(); parts.push(['note', ' Sol +' + e.n + ' Heat.']); break;
        case 'mp': flush(); parts.push(['heal', ' Io +' + e.n + ' MP']); break;
        case 'sap': flush(); parts.push(['note', ' The blade drinks ' + (e.to === 'sol' ? 'Heat' : 'MP') + '.']); break;
        case 'retreat': flush(); parts.push(['note', ' Halcyon is down to a fifth of her strength and retreats into the dark.']); break;
        case 'lured': flush(); parts.push(['note', ' ' + nameOf(B, e.to) + ' is drawn to the fruit; her gauge stops.']); break;
        case 'unlured': break;
        case 'held': flush(); parts.push(['note', ' ' + nameOf(B, e.to) + ' is dragged to the crown; her turn starts over.']); break;
        case 'scorch': flush(); parts.push(['note', e.broke ? ' The flame breaks the lure.' : ' It recoils from the flame.']); break;
        case 'cane': flush(); parts.push(['note', ' A cane is severed: ' + e.left + ' left.']); break;
        case 'end': break;
      }
    }
    flush();
    return parts;
  }
  function addLine(B, parts, cls) {
    if (!parts.length) return;
    const li = el('li', cls ? { class: cls } : null);
    el('span', { class: 't' }, li, (B.t / 60).toFixed(1) + ' m');
    const w = el('span', { class: 'w' }, li);
    for (const p of parts) { if (typeof p === 'string') w.appendChild(document.createTextNode(p)); else el(p[0] === 'b' ? 'b' : 'span', p[0] === 'b' ? null : { class: p[0] }, w, p[1]); }
    $('log').appendChild(li);
    $('log').scrollTop = $('log').scrollHeight;
  }
  function stopFight() { clearTimeout(W.timer); W.timer = 0; $('skip').disabled = true; }
  function newFight() {
    stopFight();
    const F = S.FIGHTS[W.fight];
    W.n++;
    const seed = 1 + Math.floor(Math.random() * 1e6);
    W.rand = E.rng(seed * 2654435761 + 97);
    W.B = E.create(Object.assign({ seed }, F.setup(W.level, W.rand)));
    W.cards = {};
    $('fighters').textContent = ''; $('log').textContent = ''; $('result').textContent = '';
    for (const u of W.B.units) W.cards[u.key] = card(u, $('fighters'));
    $('fightNote').textContent = F.note.charAt(0).toUpperCase() + F.note.slice(1) + '.';
    paint();
    $('skip').disabled = false;
    W.timer = setTimeout(tick, reduce ? 0 : 500);
  }
  function oneTurn() {
    const B = W.B, pol = S.POLICIES[W.policy];
    const s = B.turn();
    let log = s.log;
    if (s.type === 'choose') { const [id, t] = pol(B, s, W.rand); log = log.concat(B.choose(id, t)); }
    addLine(B, describe(B, log));
    paint();
    if (B.over) {
      stopFight();
      const r = B.result(), txt = { win: 'The party wins', lose: 'The party falls', retreat: 'Halcyon retreats', stalemate: 'Nobody wins' }[r.outcome];
      $('result').textContent = txt + ' after ' + (B.t / 60).toFixed(1) + ' minutes of battle' + (r.xp ? ', for ' + nf(r.xp) + ' experience and ' + nf(r.shards) + ' sunstone shards.' : '.');
      return false;
    }
    return true;
  }
  function tick() { if (oneTurn()) W.timer = setTimeout(tick, reduce ? 0 : 650); }
  function skip() { stopFight(); let k = 0; while (oneTurn() && ++k < 5000); }

  function setupWatch() {
    const sel = $('fight');
    for (const id in S.FIGHTS) el('option', { value: id }, sel, S.FIGHTS[id].name);
    const lv = $('level'), out = $('levelOut');
    const range = () => { const F = S.FIGHTS[W.fight]; lv.min = F.levels[0]; lv.max = F.levels[1]; W.level = Math.min(F.levels[1], Math.max(F.levels[0], F.level)); lv.value = W.level; out.textContent = W.level; };
    sel.addEventListener('change', () => { W.fight = sel.value; range(); newFight(); });
    lv.addEventListener('input', () => { W.level = +lv.value; out.textContent = W.level; });
    lv.addEventListener('change', newFight);
    const seg = $('style');
    for (const p of ['careless', 'sensible', 'expert']) {
      const b = el('button', { type: 'button', 'aria-pressed': p === W.policy ? 'true' : 'false' }, seg, STYLE[p]);
      b.addEventListener('click', () => { W.policy = p; for (const x of seg.children) x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); newFight(); });
    }
    $('again').addEventListener('click', newFight);
    $('skip').addEventListener('click', skip);
    range();
  }

  // ---------- the level curve ----------
  function renderCurve() {
    const levels = [1, 5, 10, 15, 20], k = RL.scale, sum = (a) => a.reduce((x, y) => x + y, 0);
    const H = RL.HEROES, F = RL.FOES, SU = RL.SUMMONS;
    const rows = [
      ['Io’s HP', (L) => H.io.hp * k(L)],
      ['Io’s MP', (L) => H.io.mp * RL.mpScale(L)],
      ['Sol’s HP', (L) => H.sol.hp * k(L)],
      ['Io’s Attack', (L) => sum(H.io.moves.attack.hits) * k(L)],
      ['Flame Bolt', (L) => sum(H.io.moves.flame.hits) * k(L)],
      ['Lunar Mend', (L) => H.io.moves.mend.heal * k(L)],
      ['Sol’s Attack', (L) => sum(H.sol.moves.attack.hits) * k(L)],
      ['Lunara’s strike', (L) => sum(SU.lunara.hits) * k(L)],
      ['Envoi’s strike', (L) => sum(SU.envoi.hits) * k(L)],
      ['A Shadow Wraith’s HP', (L) => F.wraith.hp * k(L)],
      ['Soul Reaper', (L) => sum(F.wraith.moves.sweep.hits) * k(L)],
    ];
    const head = $('curveHead');
    el('th', null, head, '');
    for (const L of levels) el('th', { class: 'num' }, head, 'Lv ' + L);
    const body = $('curve');
    for (const [name, f] of rows) {
      const tr = el('tr', null, body);
      el('td', null, tr, name);
      for (const L of levels) el('td', { class: 'num' }, tr, nf(f(L)));
    }
  }

  // ---------- experience and shards ----------
  function renderEconomy() {
    const body = $('econ');
    let total = 0;
    for (const e of S.economy()) {
      if (e.level > 1) total += e.fights;
      const tr = el('tr', null, body);
      el('td', { class: 'num' }, tr, e.level);
      el('td', { class: 'num' }, tr, nf(e.need));
      el('td', { class: 'num' }, tr, nf(e.xp));
      el('td', { class: 'num' }, tr, e.level === 1 ? 'first fight' : e.fights.toFixed(1));
      el('td', { class: 'num' }, tr, nf(e.shards));
    }
    $('econTotal').textContent = 'About ' + Math.round(total) + ' wild fights from level 2 to 20 for a player who fights every one, before the gates’ experience. The Magpie’s upgrades: ' +
      RL.MAGPIE.map((m) => m.name.replace(/^The /, 'the ') + ' at level ' + m.level + ' for ' + nf(m.shards) + ' shards').join('; ') + '.';
  }

  renderTargets(window.BALANCE_RESULTS);
  $('runBtn').addEventListener('click', playAgain);
  setupWatch();
  renderCurve();
  renderEconomy();
  newFight();
  window.__balance = { W, newFight, skip, playAgain };
})();
