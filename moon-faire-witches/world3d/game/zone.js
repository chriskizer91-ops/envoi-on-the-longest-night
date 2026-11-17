// zone.js: a zone page of the 3D game (world3d/game/zone-<n>.html, November 16, 2026). Io walks from one 3D place of
// the zone to the next through their exits, on one page: each place is built when she gets there and the one she left
// is taken down whole (walker.js switchTo, world.js dispose), so only one place is ever in the phone's memory.
//   W3D.zone(n)          runs zone n (game/zones.js: its places and its landings)
//   W3D.zoneFly(from)    THE AIR-TRAVEL HOOK (game/README.md, "Air travel": the interface, kept stable). Called when Io
//                        walks into a road out to the wide world (maps.js `to: 'world'`) or up to the Magpie where she's
//                        moored, with from = { zone, place, at: [x, y], face, exit, landing }. By default: with ?fly=<page>
//                        it goes to that page, the details in its query; inside a frame it posts { type: 'envoi3d-fly',
//                        from } to the page round it; otherwise it shows a small card, "The Magpie: flying comes next"
// Opening a zone page at a spot (a flight handing back): zone-<n>.html?place=<id>&at=<x>,<y>[&face=<radians>], or
// ?landing=<LANDINGS id>. Otherwise she starts where she was in this zone, else at its first landing.
// The shared save: localStorage 'envoi3d-save', { v: 1, found, where, zones } (game/README.md, "The shared save"): the
// keepsakes found (kept in step with walker.js's own 'envoi3d-found', which the place pages use) and where Io is, so
// reopening the page puts her back. Nothing is read or written in a ?test run (?test&save: where she is, for the checks).
(function (G) {
  'use strict';
  const W3D = G.W3D;
  const TEST = /[?&]test\b/.test(location.search), SAVE = !TEST || /[?&]save\b/.test(location.search);
  const $ = (id) => document.getElementById(id);
  const wait = (ms) => new Promise((r) => setTimeout(r, TEST ? 0 : ms));
  const FADE = 320;     // the fade to night and back, as the 2D game's (0.3 s each way)
  const HOLD = 0.3;     // seconds walking on into a road's own rectangle, heading out, before she goes: no brushing an edge
  const READ = 750;     // the next place's name stays at least this long

  // ---- the shared save: one localStorage key the game's pages all read and write (game/README.md). Each write reads it
  // fresh and keeps every field it doesn't know (another page's) ----
  const SAVE_KEY = 'envoi3d-save', FOUND_KEY = 'envoi3d-found';
  function readSave() { try { const q = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return q && typeof q === 'object' ? q : {}; } catch (e) { return {}; } }
  function writeSave(change) { if (!SAVE) return; try { const q = readSave(); change(q); q.v = 1; localStorage.setItem(SAVE_KEY, JSON.stringify(q)); } catch (e) { /* the phone won't keep it: fine */ } }

  // ---- the art. When the page isn't built, the repository's art (paintings, keepsakes) is three folders up. The places
  // write their textures' paths for a page in world3d/, one folder up from here, so the build couldn't find them: this
  // page's own list (zone-<n>-art.js, written by make-zones.mjs) names each from here, and the build puts it inside ----
  const fromRoot = (p) => (/^data:/.test(p) ? p : '../../../' + p);
  // (the extras, engine/extras.js: Chris's short list, are named the same way)
  for (const e of W3D.EXTRAS || []) { const key = e.made.replace(/^\.\/\.\.\//, ''); e.made = (G.W3D_ART || {})[key] || './../../' + key; }
  function fixArt(place) {
    if (place.zoneArt) return; place.zoneArt = true;
    const ART = G.W3D_ART || {};
    for (const t of place.textures || []) for (const k of ['made', 'stand']) {
      if (!t[k] || /^data:/.test(t[k])) continue;
      const key = t[k].replace(/^\.\/\.\.\//, '');
      t[k] = ART[key] || './../../' + key;
    }
    place.paintingSrc = fromRoot(place.painting);
  }

  // ---- the roads out of a place: each 3D exit with where it goes, from the walking map's own exits (maps.js). A wild
  // place's 3D moves its exits out to the edge of its open ground, so a road is matched by its rectangle, else its label,
  // else its order ----
  const norm = (s) => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/^the /, '').trim();
  function roadsOf(id) {
    const place = G.W3D_PLACES[id], m = (G.MAPS || {})[id] || { exits: [] };
    return (place.exits || []).map((e, i) => {
      const same = m.exits.find((x) => x.rect.join() === e.rect.join()) || m.exits.find((x) => norm(x.label) === norm(e.label)) || m.exits[i] || {};
      return { e, rect: e.rect, label: e.label, to: same.to, at: same.at, dir: same.dir, rect2d: same.rect };
    });
  }
  const inRect = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  // which way a road leaves its place (in pixels: [-1, 0] west, [0, 1] south...): out through the edge it lies along
  function outward(place, r) {
    const W = place.size[0], H = place.size[1];
    if (r[2] - r[0] < r[3] - r[1]) return [(r[0] + r[2]) / 2 < W / 2 ? -1 : 1, 0];
    return [0, (r[1] + r[3]) / 2 < H / 2 ? -1 : 1];
  }
  const DIR = { n: Math.PI, s: 0, e: Math.PI / 2, w: -Math.PI / 2 };
  // where she arrives by a road: its `at` in the next place, facing into it (away from the edge she came in by). Where the
  // next place's 3D has moved its road back out to the edge of its open ground, she arrives by that road instead, as far
  // in from it as `at` is from the painting's
  function arrival(fromId, road) {
    const next = G.W3D_PLACES[road.to], back = roadsOf(road.to).find((b) => b.to === fromId);
    let at = road.at.slice();
    if (back && back.rect2d && back.rect.join() !== back.rect2d.join()) {
      at = [at[0] + (back.rect[0] + back.rect[2] - back.rect2d[0] - back.rect2d[2]) / 2, at[1] + (back.rect[1] + back.rect[3] - back.rect2d[1] - back.rect2d[3]) / 2];
    }
    let face = road.dir ? DIR[road.dir] : Math.PI;
    if (back) { const o = outward(next, back.rect); face = Math.atan2(-o[0], -o[1]); }
    return { at, face };
  }

  // ---- THE AIR-TRAVEL HOOK (game/README.md, "Air travel"). from = { zone, place, at: [x, y] (Io's spot in the place's
  // painting pixels), face (radians), exit: { label, to, rect } or null (the road out she walked into), landing: its
  // LANDINGS id or null (the Magpie she walked up to) }. A page of the same game may replace the function; by default: ----
  let cardT = 0;
  W3D.zoneFly = function (from) {
    const fly = new URLSearchParams(location.search).get('fly');
    // opened with ?fly=<page>: on to that page, with where she is in its query
    if (fly) {
      const u = new URL(fly, location.href), q = u.searchParams;
      q.set('zone', from.zone); q.set('place', from.place); q.set('at', from.at.join(',')); q.set('face', from.face);
      if (from.landing) q.set('landing', from.landing); if (from.exit) q.set('exit', from.exit.label);
      location.href = u.href; return;
    }
    // inside a frame: the page round it takes the flight
    if (G.parent && G.parent !== G) { G.parent.postMessage({ type: 'envoi3d-fly', from }, '*'); return; }
    const c = $('magpie'); if (!c) return;
    c.classList.add('on'); clearTimeout(cardT); cardT = setTimeout(() => c.classList.remove('on'), 4500);
  };

  W3D.zone = async function (n) {
    const Z = G.W3D_ZONES[n], PL = G.W3D_PLACES || {};
    const have = Z.places.filter((id) => PL[id]);
    const zoneOf = (id) => Object.keys(G.W3D_ZONES).find((k) => G.W3D_ZONES[k].places.includes(id));
    if (TEST) document.body.classList.add('test');
    if (!have.length) { $('loadmsg').textContent = 'None of this zone’s places is built in 3D yet.'; return; }
    for (const id of have) fixArt(PL[id]);

    // the keepsakes found, the same in the shared save and in the walker's own list (the place pages')
    if (!TEST) try {
      const all = Object.assign({}, JSON.parse(localStorage.getItem(FOUND_KEY) || '{}') || {}, readSave().found || {});
      localStorage.setItem(FOUND_KEY, JSON.stringify(all)); writeSave((q) => { q.found = Object.assign(q.found || {}, all); });
    } catch (e) { /* nothing kept */ }

    // where she starts: where the page was opened at (?place=<id>&at=<x>,<y>&face=<radians>, or ?landing=<LANDINGS id>),
    // else where she was in this zone, else the zone's first landing that's built, else its first place's own start
    const url = new URLSearchParams(location.search), num = (v) => (v != null && v !== '' && isFinite(+v) ? +v : null);
    const saved = SAVE ? (readSave().zones || {})[n] : null;
    const Lurl = Z.landings.find((l) => l.id === url.get('landing') && have.includes(l.place)), L0 = Z.landings.find((l) => have.includes(l.place));
    const atUrl = (url.get('at') || '').split(',').map(num);
    let start;
    if (have.includes(url.get('place'))) {
      const p = PL[url.get('place')], L = Lurl && Lurl.place === url.get('place') ? Lurl : null;
      start = { place: url.get('place'), at: atUrl.length === 2 && atUrl.every((v) => v != null) ? atUrl : L ? L.stand : p.start,
        face: num(url.get('face')) != null ? num(url.get('face')) : L ? DIR.s : p.startFace != null ? p.startFace : Math.PI };
    }
    else if (Lurl) start = { place: Lurl.place, at: Lurl.stand, face: DIR.s };
    else if (saved && have.includes(saved.place) && Array.isArray(saved.at)) start = { place: saved.place, at: saved.at, face: +saved.face || 0 };
    else if (L0) start = { place: L0.place, at: L0.stand, face: DIR.s };   // she steps down facing south, as in the 2D game
    else { const p = PL[have[0]]; start = { place: have[0], at: p.start, face: p.startFace != null ? p.startFace : Math.PI }; }
    // the spot is read: a reload starts from the save, not from the address again
    const READ_KEYS = ['place', 'at', 'face', 'landing', 'zone', 'exit'];   // (zone and exit: what the hook itself sends on)
    if (READ_KEYS.some((k) => url.has(k))) { for (const k of READ_KEYS) url.delete(k); try { history.replaceState(null, '', location.pathname + (url.toString() ? '?' + url : '') + location.hash); } catch (e) { /* fine */ } }

    let toastT = 0, itemT = 0;
    const toast = (s) => { const t = $('toast'); t.textContent = s; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; }, 2600); };
    let here = start.place, roads = roadsOf(here), switching = false, hold = 0, armed = false, near0 = null, magArmed = true, saveT = 0, last = null;
    const W = await W3D.walk({
      place: PL[here], root: $('world'), canvas: $('cv'), ring: $('ring'), dot: $('dot'), toast,
      say: (s) => { $('loadmsg').textContent = s; },
      onGuide: (on) => { $('guide').classList.toggle('on', on); $('numbers').style.display = on ? 'block' : 'none'; $('again').style.display = on ? 'block' : 'none'; againReset(); },
      onItem: (it) => {
        $('cardpic').src = fromRoot(it.pic); $('cardname').textContent = it.name;
        $('cardlook').textContent = it.look ? it.look.charAt(0).toUpperCase() + it.look.slice(1) + '.' : '';
        $('card').classList.add('on'); clearTimeout(itemT); itemT = setTimeout(() => $('card').classList.remove('on'), 7000);
        if (!TEST) writeSave((q) => { (q.found = q.found || {})[it.id] = 1; });
      },
      onStats: (s) => { $('numbers').textContent = s.fps + ' frames a second · ' + Math.round(s.triangles / 1000) + 'k triangles · ' + s.calls + ' draw calls'; },
      onFrame,
    });
    // the Magpie's soft glow where she's moored (the 2D game's glow at a landing)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(W3D.paint.halo()), color: 0xcfc2ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    glow.scale.set(2.6, 2.6, 1); W.P.scene.add(glow);
    const landingHere = () => Z.landings.find((l) => l.place === here);
    function placeGlow() {
      const L = landingHere(), M = W.P.M; glow.visible = !!L;
      if (L) glow.position.set(M.x(L.magpie[0]), W.P.walkH(L.magpie[0], L.magpie[1]) + 1.3, M.z(L.magpie[1]));
    }
    // where she is now (in the shared save, for next time and for the other pages)
    const spot = () => ({ place: here, at: [Math.round(W.io.px), Math.round(W.io.py)], face: +W.io.yaw.toFixed(3) });
    function save() { const p = spot(); writeSave((q) => { q.where = Object.assign({ zone: n }, p); (q.zones = q.zones || {})[n] = p; }); }
    const flyFrom = (o) => { save(); const p = spot(); return Object.assign({ zone: n, place: p.place, at: p.at, face: p.face, exit: null, landing: null }, o); };
    addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

    // each frame: the roads out, the Magpie, and now and then where she is
    function onFrame(dt, near) {
      if (switching) return;
      const io = W.io, M = W.P.M;
      // a road to a place this page hasn't got: its name, as the place pages say it
      if (near !== near0) {
        near0 = near; const r = near && roads.find((q) => q.e === near);
        if (r && r.to !== 'world' && !have.includes(r.to)) toast(r.label + (PL[r.to] && zoneOf(r.to) ? ': on the zone ' + zoneOf(r.to) + ' page' : ': coming next, a place of its own'));
      }
      // into a road's own rectangle, heading out, for a moment: she goes (out to the wide world: the Magpie's card)
      const r = roads.find((q) => inRect(q.rect, io.px, io.py));
      if (!r) armed = true;
      const o = r && outward(W.P.place, r.rect), out = r ? Math.sin(io.yaw) * o[0] + Math.cos(io.yaw) * o[1] : 0;
      if (r && armed && io.speed > 0.25 && out > 0.3) hold += dt; else hold = 0;
      if (r && hold >= HOLD) {
        hold = 0; armed = false;
        if (have.includes(r.to)) go(r);
        else if (r.to === 'world') W3D.zoneFly(flyFrom({ exit: { label: r.label, to: r.to, rect: r.rect.slice() } }));
      }
      // up to the Magpie where she's moored
      const L = landingHere();
      if (L) {
        const d = Math.hypot((io.px - L.magpie[0]) * M.SX, (io.py - L.magpie[1]) * M.SZ);
        if (d < 1.6 && magArmed) { magArmed = false; W3D.zoneFly(flyFrom({ landing: L.id })); }
        if (d > 3.5) magArmed = true;
        glow.material.opacity = 0.62 + 0.16 * Math.sin(performance.now() / 700);
      }
      if ((saveT += dt) > 2) { saveT = 0; save(); }
    }

    // on to the next place: a fade to the night with its name, the old place down and the new one up, and back
    async function go(r) {
      switching = true; W.push(0, 0, 0);
      const next = PL[r.to], arr = arrival(here, r);
      $('fadename').textContent = next.name; $('fade').classList.add('on');
      await wait(FADE);
      const t0 = performance.now();
      try { await W.switchTo(next, arr.at[0], arr.at[1], arr.face); } catch (e) { console.error(e); $('fadename').textContent = 'Something went wrong: ' + e.message; return; }
      W.push(null);
      here = r.to; roads = roadsOf(here); hold = 0; armed = false; near0 = null; magArmed = true; placeGlow(); save();
      last = { from: r, place: here, wanted: arr.at, at: [W.io.px, W.io.py], face: arr.face };
      await wait(Math.max(0, READ - (performance.now() - t0)));
      $('fade').classList.remove('on'); await wait(FADE);
      switching = false;
    }

    // start again (in the guide view only): back to the landing, and this zone's keepsakes back where they were (in the
    // shared save and the walker's own list)
    let againT = 0;
    function againReset() { clearTimeout(againT); $('again').textContent = 'Start again'; $('again').classList.remove('sure'); }
    $('again').addEventListener('click', () => {
      if (!$('again').classList.contains('sure')) { $('again').textContent = 'Tap again to start again'; $('again').classList.add('sure'); againT = setTimeout(againReset, 3500); return; }
      const mine = ((G.LOOT && G.LOOT.ITEMS) || []).filter((it) => Z.places.includes(it.home)).map((it) => it.id);
      writeSave((q) => { if (q.zones) delete q.zones[n]; if (q.where && +q.where.zone === +n) delete q.where; for (const id of mine) if (q.found) delete q.found[id]; });
      try { const f = JSON.parse(localStorage.getItem(FOUND_KEY) || '{}') || {}; for (const id of mine) delete f[id]; localStorage.setItem(FOUND_KEY, JSON.stringify(f)); } catch (e) { /* nothing kept */ }
      removeEventListener('pagehide', save); location.reload();
    });
    $('card').addEventListener('click', () => $('card').classList.remove('on'));
    $('magpie').addEventListener('click', () => $('magpie').classList.remove('on'));
    $('guide').addEventListener('click', () => W.guide(!$('guide').classList.contains('on')));

    // she stands where she starts, the camera settled behind her, and the whole place sent to the screen at once
    W.C.yaw = start.face + Math.PI; W.C.auto = 0;
    const a = W.nearestFit(start.at[0], start.at[1]); W.setIo(a[0], a[1], start.face);
    placeGlow(); W.warm();
    $('load').style.opacity = 0; setTimeout(() => { $('load').style.display = 'none'; }, 700);
    setTimeout(() => toast(W3D.quality === 'high' ? 'W A S D or the arrows to walk · tap twice to run · Shift to sprint · drag to look' : 'Drag on the left to walk · drag on the right to look'), 900);
    // for the checks (tools/zone-test.mjs)
    window.__zone = { n, have, roadsOf, arrival, outward, HOLD, glow, get here() { return here; }, get switching() { return switching; }, get last() { return last; }, get roads() { return roads; } };
    window.__ready = true;
    return W;
  };
})(window);
