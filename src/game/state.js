// state.js: the game's state and its saves (plan phase 5: "saves kept in the browser"). Three save slots in localStorage;
// the one in use is written at every rest, at every change of map and from the menu. A save code carries a save as text,
// to another device or another copy of the game (handoff, section 9). The state is the party (level, experience, each
// hero's HP, Io's MP), the shards, the herbs carried, the story's flags, what has been done once (events, wells), the
// highest band the Magpie can reach, where Io is, where she last rested, the keepsakes found and who wears each (items:
// keepsakes.js; a save from before them has keepsakes: { io, sol }, the two hidden ones) and the time played. HP or MP of
// null means full.
// Defines window.GameState = { fresh, load, save, has, clear, slot, use, list, latest, code, fromCode, SLOTS, maxHp,
// maxMp, hpOf, mpOf, gearOf, fit, gain, restore, applyBattle, healOutside, useHerb }. Needs rules.js and keepsakes.js.
(function () {
  'use strict';
  // slot 1 keeps the name the single save had, so a game saved before the slots came is in slot 1
  const KEY = 'envoi.save.v1', SLOTS = 3;
  const keyOf = (n) => (n > 1 ? KEY + '.' + n : KEY);
  let SLOT = 1;
  try { SLOT = Math.min(SLOTS, Math.max(1, Math.round(+localStorage.getItem('envoi.slot')) || 1)); } catch (e) { /* storage blocked: slot 1 */ }
  const RL = () => window.BattleRules;
  // a new game's herbs: three of each (Chris, October 4)
  const startHerbs = () => Object.fromEntries(Object.keys(RL().HERBS).map((id) => [id, RL().START_HERBS]));
  function fresh() {
    return {
      v: 1, level: 1, xp: 0, shards: 0, hp: { io: null, sol: null }, mp: null, herbs: startHerbs(), flags: {}, done: {}, band: 1,
      where: { mode: 'field', map: 'cottage', at: null, dir: 's' }, rest: { mode: 'field', map: 'cottage', at: [838, 520] },
      landings: { wickhollow: true }, items: {}, time: 0, fights: 0, wins: 0,
    };
  }
  function load(n) { try { const s = localStorage.getItem(keyOf(n || SLOT)); if (!s) return null; const st = JSON.parse(s); return st && st.v === 1 ? st : null; } catch (e) { return null; } }
  function save(st, n) { try { st.saved = Date.now(); localStorage.setItem(keyOf(n || SLOT), JSON.stringify(st)); return true; } catch (e) { return false; } }
  // the slot in use from now on (kept, so the next visit continues in it)
  function use(n) { SLOT = Math.min(SLOTS, Math.max(1, n | 0)); try { localStorage.setItem('envoi.slot', String(SLOT)); } catch (e) { /* not kept */ } }
  const slot = () => SLOT;
  // every slot with its save, or null where it is empty; and the one saved last, for Continue
  const list = () => Array.from({ length: SLOTS }, (_, i) => ({ slot: i + 1, st: load(i + 1) }));
  function latest() { let b = null; for (const s of list()) if (s.st && (!b || (s.st.saved || 0) > (b.st.saved || 0))) b = s; return b; }
  const has = () => !!latest();
  function clear(n) { try { localStorage.removeItem(keyOf(n || SLOT)); } catch (e) { /* blocked */ } }
  // a save code: the save as text, with a check so a code that was cut short or mistyped is refused
  const sum = (t) => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h.toString(36); };
  function code(st) { const b = btoa(unescape(encodeURIComponent(JSON.stringify(st)))); return 'ENVOI1:' + b + ':' + sum(b); }
  function fromCode(text) {
    const m = /ENVOI1:([A-Za-z0-9+/=]+):([0-9a-z]+)/.exec(String(text || '').replace(/\s+/g, ''));
    if (!m || sum(m[1]) !== m[2]) return null;
    try { const st = JSON.parse(decodeURIComponent(escape(atob(m[1])))); return st && st.v === 1 && st.flags && st.where ? st : null; } catch (e) { return null; }
  }
  // what the keepsakes a hero wears add, in percent (keepsakes.js): gearOf(st, 'sol').hp. The same as the battle's (the
  // engine multiplies in the same order, so the maximums agree to the point)
  const NONE = { heal: 0, hp: 0, mp: 0, hpBack: 0, mpBack: 0 };
  const gearOf = (st, id) => (window.Keepsakes ? window.Keepsakes.gear(st, id) : NONE);
  const maxHp = (st, id) => Math.round(RL().HEROES[id].hp * RL().scale(st.level) * (1 + gearOf(st, id).hp / 100));
  const maxMp = (st) => Math.round(RL().HEROES.io.mp * RL().mpScale(st.level) * (1 + gearOf(st, 'io').mp / 100));
  const hpOf = (st, id) => (st.hp[id] == null ? maxHp(st, id) : st.hp[id]);
  const mpOf = (st) => (st.mp == null ? maxMp(st) : st.mp);
  // experience and shards; a level up keeps each hero's share of HP and MP. Returns how many levels were gained
  function gain(st, xp, shards) {
    st.xp += xp; st.shards += shards; let ups = 0;
    while (st.level < RL().MAX_LEVEL && st.xp >= RL().xpNeed(st.level)) {
      const fio = hpOf(st, 'io') / maxHp(st, 'io'), fso = hpOf(st, 'sol') / maxHp(st, 'sol'), fmp = mpOf(st) / maxMp(st);
      st.xp -= RL().xpNeed(st.level); st.level++; ups++;
      if (st.hp.io != null) st.hp.io = Math.round(fio * maxHp(st, 'io'));
      if (st.hp.sol != null) st.hp.sol = Math.round(fso * maxHp(st, 'sol'));
      if (st.mp != null) st.mp = Math.round(fmp * maxMp(st));
    }
    if (st.level >= RL().MAX_LEVEL) st.xp = Math.min(st.xp, RL().xpNeed(st.level));
    return ups;
  }
  function restore(st) { st.hp = { io: null, sol: null }; st.mp = null; }
  // after a keepsake goes on or comes off: HP and MP inside the new maximums (full stays full)
  function fit(st) {
    for (const id of ['io', 'sol']) if (st.hp[id] != null && st.hp[id] >= maxHp(st, id)) st.hp[id] = null;
    if (st.mp != null && st.mp >= maxMp(st)) st.mp = null;
  }
  // after a fight: HP and MP as the battle left them, and the herbs it used taken from those carried (the fight had at
  // most BATTLE_USE of each: fights.js); a win gives its experience and shards. A hero who fell in a fight the party won
  // gets back up with a little HP
  function applyBattle(st, r) {
    st.fights++;
    for (const id in RL().HERBS) {
      const had = Math.min(st.herbs[id] || 0, RL().BATTLE_USE), left = Math.min(had, (r.herbs && r.herbs[id]) || 0);
      if (had > left) st.herbs[id] = (st.herbs[id] || 0) - (had - left);
    }
    for (const h of r.heroes) { if (h.id === 'io') { st.hp.io = h.hp; st.mp = h.mp; } else st.hp.sol = h.hp; }
    let ups = 0;
    if (r.outcome === 'win' || r.outcome === 'retreat') {
      st.wins++; ups = gain(st, r.xp, r.shards);
      for (const id of ['io', 'sol']) if (st.hp[id] === 0) st.hp[id] = Math.max(1, Math.round(maxHp(st, id) * 0.1));
    }
    for (const id of ['io', 'sol']) if (st.hp[id] != null && st.hp[id] >= maxHp(st, id)) st.hp[id] = null;
    if (st.mp != null && st.mp >= maxMp(st)) st.mp = null;
    return ups;
  }
  // Io's Moonlore out of battle: Lunar Mend on one, Waxing Light on both (when Sol is with her); her keepsakes make it stronger
  function healOutside(st, move, who) {
    const M = RL().HEROES.io.moves[move], k = RL().scale(st.level), mp = mpOf(st);
    if (!M || mp < M.mp) return 'Not enough MP.';
    const ids = move === 'waxing' ? (st.flags.party ? ['io', 'sol'] : ['io']) : [who];
    if (ids.every((id) => hpOf(st, id) <= 0)) return 'She is down: a Nightrose or a rest will bring her back.';
    st.mp = mp - M.mp;
    for (const id of ids) { if (hpOf(st, id) <= 0) continue; st.hp[id] = Math.min(maxHp(st, id), hpOf(st, id) + Math.round(M.heal * k * (1 + gearOf(st, 'io').heal / 100))); if (st.hp[id] >= maxHp(st, id)) st.hp[id] = null; }
    return null;
  }
  // a herb out of battle, as it works in battle (heals grow with the level); the Lily only works in a fight
  function useHerb(st, id, who) {
    const H = RL().HERBS[id]; if (!H || !(st.herbs[id] > 0)) return 'None left.';
    if (id === 'emberLily') return 'The Lily’s warmth only lasts a fight. Keep it for one.';
    if (id === 'nightrose') { if (hpOf(st, who) > 0) return 'She isn’t down.'; st.hp[who] = Math.round(maxHp(st, who) * H.revive); }
    else if (id === 'mugwort') { if (mpOf(st) >= maxMp(st)) return 'Io’s MP is full.'; st.mp = Math.min(maxMp(st), mpOf(st) + Math.round(H.mp * RL().mpScale(st.level))); if (st.mp >= maxMp(st)) st.mp = null; }
    else {
      const k = RL().scale(st.level), ids = id === 'lavender' ? (st.flags.party ? ['io', 'sol'] : ['io']) : [who];
      if (ids.every((x) => hpOf(st, x) <= 0 || hpOf(st, x) >= maxHp(st, x))) return 'No one needs it.';
      for (const x of ids) { if (hpOf(st, x) <= 0) continue; st.hp[x] = Math.min(maxHp(st, x), hpOf(st, x) + Math.round(H.heal * k)); if (st.hp[x] >= maxHp(st, x)) st.hp[x] = null; }
    }
    st.herbs[id]--;
    return null;
  }
  window.GameState = { fresh, load, save, has, clear, slot, use, list, latest, code, fromCode, SLOTS, maxHp, maxMp, hpOf, mpOf, gearOf, fit, gain, restore, applyBattle, healOutside, useHerb };
})();
