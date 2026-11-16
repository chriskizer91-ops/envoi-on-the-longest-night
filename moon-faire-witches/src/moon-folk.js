// moon-folk.js: Moon Faire's fair folk (their 3D models at a quarter of their triangles, the weight Moon Faire's game uses)
// standing in for Envoi's seventeen townsfolk on the walking maps, and their faces for the talking box.
// CAST says who plays whom. Every Envoi name, place and line stays as it is (src/game/maps.js, src/game/script.js); only
// the body changes. The picks follow what each person does in Envoi and what the fair folk were made to be.
// makeMoonFolk() has the same face as src/walk/painted-folk.js, so src/game/field.js draws them without a change:
//   { has(id), loaded(id), draw(g, id, x, y, h, s), npc(id), greet(id), talk(id, on), emote(id, name), portrait(id) -> data URL | null }
//   draw: x, y the feet on the field's canvas; h an adult's height on the canvas (Io's); s: { dir, walk, moving, t, seed }
// Each person is drawn by one shared small WebGL canvas, one at a time, and laid onto the field's picture at their feet,
// so the field still puts everyone in front of or behind each other by where they stand.
(function () {
  'use strict';
  // Envoi's townsfolk, by their id in src/game/maps.js -> the Moon Faire person who plays them (and a size, for the two gnomes)
  const CAST = {
    // Wickhollow, Io's home
    nettie: { mf: 'fortune-teller', why: 'Wickhollow’s herb witch: the tall card-reader in the dim tent' },
    hilde: { mf: 'pie-seller', why: 'the smith who banks her forge high: the sturdy one with flour on her hands' },
    gretch: { mf: 'chestnut-roaster-opus', why: 'the mayor: a solid man in a good coat and hat who keeps the brazier going' },
    // the jetty
    quill: { mf: 'old-night-watchman', why: 'the old sailor who gives Io his skiff: coat, scarf and a beard' },
    // Bogmire, the stilt town whose lights were stolen
    wenna: { mf: 'old-lamp-seller', why: 'Bogmire’s herb-seller, who knows her jars in the dark: the old woman who has sold lamps all her life' },
    tobb: { mf: 'fair-baker', why: 'Bogmire’s innkeeper: the stout, cheerful baker' },
    pell: { mf: 'farm-lad', why: 'the youngster who saw the lights taken: the farm lad, the youngest of the fair folk' },
    // the Warden waystation, where Envoi is made
    marta: { mf: 'old-lamplighter', why: 'the old woman who kept the hall made up: the lamplighter in her red dress and headscarf' },
    brann: { mf: 'chestnut-roaster', why: 'the waystation’s herb trader: the cheerful man at his brazier' },
    tamsin: { mf: 'ballad-singer', why: 'the girl who asks if there are any Wardens left: the young singer' },
    // the shipyard
    ysmera: { mf: 'gate-keeper', why: 'Ysmera Brightkeel, the shipmaster: stern and tidy in a flat hat and waistcoat' },
    pim: { mf: 'fair-baker-opus', scale: 0.72, why: 'a gnome of the yard: the other baker, made small' },
    tock: { mf: 'ribbon-dyer-opus', scale: 0.72, why: 'a gnome of the yard: the other dyer, made small' },
    gil: { mf: 'ribbon-dyer', why: 'old Gil of the yard’s bunks: the old, quiet dyer' },
    // Misthollow, under the dead Moonwell
    sorrel: { mf: 'fortune-teller-opus', why: 'Misthollow’s herb witch: the other card-reader' },
    ede: { mf: 'old-lamplighter-opus', why: 'who keeps the inn fire lit for spite: the other lamplighter' },
    watch: { mf: 'old-night-watchman-opus', name: 'The watchman', why: 'Misthollow’s watch: the other night-watchman (Envoi’s watchwoman becomes a watchman)' },
  };
  const TALL = 1.7;           // metres an adult's on-screen height stands for (as Io's, src/moon-io-walker.js)
  const PITCH = 24 * Math.PI / 180, BOX_UP = 2.2, BOX_DOWN = 0.18, BOX_HALF_W = 0.85;
  const YAW = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };

  function makeMoonFolk(opts) {
    opts = opts || {};
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96;
    let renderer = null, scene = null, cam = null, ok = false;
    const people = {}, building = {}, last = {}, yaw = {}, faces = {};
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setClearColor(0x000000, 0); renderer.outputEncoding = THREE.sRGBEncoding;
      scene = new THREE.Scene();
      const es = new THREE.Scene(), gS = new THREE.SphereGeometry(10, 24, 12), col = [];
      const top = new THREE.Color(0.22, 0.21, 0.32), mid = new THREE.Color(0.09, 0.08, 0.12), bot = new THREE.Color(0.03, 0.022, 0.035), c = new THREE.Color();
      for (let i = 0; i < gS.attributes.position.count; i++) { const y = gS.attributes.position.getY(i) / 10; if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.7)); else c.copy(mid).lerp(bot, Math.pow(-y, 0.5)); col.push(c.r, c.g, c.b); }
      gS.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      es.add(new THREE.Mesh(gS, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.03).texture; pm.dispose();
      // a warm lamplit key (the towns are lit by lamps and windows), a cool moon rim, a soft fill
      scene.add(new THREE.HemisphereLight(0xc4b8c8, 0x3a2c30, 0.6));
      const key = new THREE.DirectionalLight(0xffe2c4, 0.85); key.position.set(1.6, 3.4, 3.0); scene.add(key);
      const rim = new THREE.DirectionalLight(0xb8b0ff, 0.45); rim.position.set(-1.8, 2.6, -3.2); scene.add(rim);
      const fill = new THREE.DirectionalLight(0xc0c8ff, 0.25); fill.position.set(-2.6, 1.2, 2.4); scene.add(fill);
      cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
      ok = true;
    } catch (e) { console.error('The fair folk could not be drawn:', e); }
    const has = (id) => ok && !!CAST[id] && !!(window.MF_NPCS && window.MF_NPCS.people[CAST[id].mf]);
    function loaded(id) {
      if (people[id]) return true;
      if (!has(id) || building[id]) return false;
      building[id] = window.MF_NPC.make(CAST[id].mf).then((npc) => {
        if (CAST[id].scale) npc.root.scale.setScalar(CAST[id].scale);
        npc.root.visible = false; scene.add(npc.root); if (npc.fx) scene.add(npc.fx);
        people[id] = npc; yaw[id] = 0;
      }).catch((e) => console.error('could not make ' + id, e));
      return false;
    }
    // one person, rendered alone at the size they stand on screen; the camera looks down at the maps' angle
    function render(npc, ppm, dpr, boxUp, halfW) {
      const Hm = boxUp + BOX_DOWN;
      const W = Math.max(8, Math.round(2 * halfW * ppm * dpr)), H = Math.max(8, Math.round((Hm * Math.cos(PITCH) + 0.6 * Math.sin(PITCH)) * ppm * dpr));
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; renderer.setSize(W, H, false); }
      const hh = H / (2 * ppm * dpr); cam.left = -halfW; cam.right = halfW; cam.top = hh; cam.bottom = -hh;
      const ay = boxUp / 2 - BOX_DOWN / 2 + 0.05;
      cam.position.set(0, ay + 10 * Math.sin(PITCH), 10 * Math.cos(PITCH)); cam.lookAt(0, ay, 0); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      for (const k in people) people[k].root.visible = people[k] === npc;
      renderer.render(scene, cam);
      const f = new THREE.Vector3(0, 0, 0).project(cam);
      return { W, H, fx: (f.x + 1) / 2 * W / dpr, fy: (1 - f.y) / 2 * H / dpr };
    }
    function draw(g, id, x, y, h, s) {
      const npc = people[id]; if (!npc) return;
      const t = s.t || 0, dt = last[id] == null ? 0 : Math.max(0, Math.min(0.1, t - last[id])); last[id] = t;
      let to = YAW[s.dir] != null ? YAW[s.dir] : 0, d = to - yaw[id]; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw[id] += d * Math.min(1, dt * 7);
      npc.root.position.set(0, 0, 0); npc.root.rotation.y = yaw[id];
      npc.update(dt);
      const dpr = Math.min(window.devicePixelRatio || 1, 2), ppm = h / TALL, r = render(npc, ppm, dpr, BOX_UP, BOX_HALF_W);
      g.save();
      const sc = npc.root.scale.y;
      g.fillStyle = 'rgba(16,9,31,0.4)'; g.beginPath(); g.ellipse(x, y, 0.3 * ppm * sc, 0.1 * ppm * sc, 0, 0, Math.PI * 2); g.fill();
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(cv, x - r.fx, y - r.fy, r.W / dpr, r.H / dpr);
      g.restore();
    }
    // a head-and-shoulders picture of a person, for the talking box: rendered once, from the front, close
    function portrait(id) {
      if (faces[id]) return faces[id];
      const npc = people[id]; if (!npc) return null;
      const keepYaw = npc.root.rotation.y, keepScale = npc.root.scale.y;
      npc.root.rotation.y = 0; npc.root.scale.setScalar(1); npc.root.position.set(0, 0, 0); npc.update(0);
      const S = 256; if (cv.width !== S || cv.height !== S) { cv.width = S; cv.height = S; renderer.setSize(S, S, false); }
      const head = npc.headTop(new THREE.Vector3()); const cy = head.y - 0.32;
      cam.left = -0.26; cam.right = 0.26; cam.top = 0.26; cam.bottom = -0.26; cam.position.set(0, cy + 0.6, 4); cam.lookAt(0, cy - 0.02, 0); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      for (const k in people) people[k].root.visible = people[k] === npc;
      renderer.render(scene, cam);
      faces[id] = cv.toDataURL('image/png');
      npc.root.rotation.y = keepYaw; npc.root.scale.setScalar(keepScale);
      return faces[id];
    }
    return {
      has, loaded, draw, portrait, CAST,
      npc: (id) => people[id] || null,
      greet: (id) => { const n = people[id]; if (n) n.greet(); },
      talk: (id, on) => { const n = people[id]; if (n) n.talk(on); },
      emote: (id, e) => { const n = people[id]; return n ? n.emote(e) : false; },
      nameOf: (id, fallback) => (CAST[id] && CAST[id].name) || fallback,
      get ready() { return ok; },
    };
  }
  window.MOON_FOLK_CAST = CAST;
  window.makeMoonFolk = makeMoonFolk;
})();
