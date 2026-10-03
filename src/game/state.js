// state.js: the game's state and its save (plan phase 5: "saves kept in the browser"). One save, in localStorage, written
// at every rest, at every change of map and from the menu. The state is the party (level, experience, each hero's HP,
// Io's MP), the shards, the herbs carried, the story's flags, what has been done once (events, wells), the highest band
// the Magpie can reach, where Io is, where she last rested, and the time played. HP or MP of null means full.
// Defines window.GameState = { fresh, load, save, has, clear, maxHp, maxMp, hpOf, mpOf, gain, restore, applyBattle,
// healOutside, useHerb }. Needs rules.js.
(function () {
  'use strict';
  const KEY = 'envoi.save.v1';
  const RL = () => window.BattleRules;
  function fresh() {
    return {
      v: 1, level: 1, xp: 0, shards: 0, hp: { io: null, sol: null }, mp: null, herbs: {}, flags: {}, done: {}, band: 1,
      where: { mode: 'field', map: 'cottage', at: null, dir: 's' }, rest: { mode: 'field', map: 'cottage', at: [838, 520] },
      landings: { wickhollow: true }, time: 0, fights: 0, wins: 0,
    };
  }
  function load() { try { const s = localStorage.getItem(KEY); if (!s) return null; const st = JSON.parse(s); return st && st.v === 1 ? st : null; } catch (e) { return null; } }
  function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; } }
  const has = () => !!load();
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* blocked */ } }
  const maxHp = (st, id) => Math.round(RL().HEROES[id].hp * RL().scale(st.level));
  const maxMp = (st) => Math.round(RL().HEROES.io.mp * RL().mpScale(st.level));
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
  // after a fight: HP, MP and herbs as the battle left them; a win gives its experience and shards. A hero who fell in
  // a fight the party won gets back up with a little HP
  function applyBattle(st, r) {
    st.fights++;
    st.herbs = Object.assign({}, r.herbs);
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
  // Io's Moonlore out of battle: Lunar Mend on one, Waxing Light on both (when Sol is with her)
  function healOutside(st, move, who) {
    const M = RL().HEROES.io.moves[move], k = RL().scale(st.level), mp = mpOf(st);
    if (!M || mp < M.mp) return 'Not enough MP.';
    const ids = move === 'waxing' ? (st.flags.party ? ['io', 'sol'] : ['io']) : [who];
    if (ids.every((id) => hpOf(st, id) <= 0)) return 'She is down: a Nightrose or a rest will bring her back.';
    st.mp = mp - M.mp;
    for (const id of ids) { if (hpOf(st, id) <= 0) continue; st.hp[id] = Math.min(maxHp(st, id), hpOf(st, id) + Math.round(M.heal * k)); if (st.hp[id] >= maxHp(st, id)) st.hp[id] = null; }
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
  window.GameState = { fresh, load, save, has, clear, maxHp, maxMp, hpOf, mpOf, gain, restore, applyBattle, healOutside, useHerb };
})();
