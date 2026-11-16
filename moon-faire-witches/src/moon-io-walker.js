// moon-io-walker.js: Moon Faire's Io (lightest) walking Envoi's painted maps as her own 3D model, in place of the painted
// walk sheet (src/walk/painted-io.js). Same face as makePaintedIo, so src/game/field.js draws her without a change:
//   makeMoonIoWalker() -> { ready, loaded, h, draw(g, x, y, k, s) }
//   draw: x, y her feet on the field's canvas; k canvas px per unit of h (her height on the canvas is k * h);
//   s: { dir: 'n' | 's' | 'e' | 'w', walk (heights walked), moving, t (seconds), lean, turn, pose: null | 'kneel' | 'cast', poseP }
// She is drawn by a small WebGL canvas of her own, the size she stands on screen, and laid onto the field's picture at her
// feet. The camera looks down on her at the maps' own angle (Moon Faire's walking camera: pitched 24 degrees down), so she
// stands in the painting as its people do. Her light is her own (Moon Faire's stage rig, made a little cooler for the night).
// Her walk keeps pace with how fast the field moves her: her step is sped up or slowed so her feet keep to the ground.
function makeMoonIoWalker(opts) {
  'use strict';
  opts = opts || {};
  const TALL = 1.7;                       // metres of her that the field's h stands for: her height as the painted sheet's figure measures, seen from the maps' angle
  const PITCH = (opts.pitch || 24) * Math.PI / 180;
  const BOX_UP = 2.35, BOX_DOWN = 0.18, BOX_HALF_W = 0.95;   // what the small canvas shows round her, in metres
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96;
  let renderer = null, scene = null, cam = null, A = null, ok = false, failed = false;
  const ready = new Promise((res) => {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false });
      renderer.setClearColor(0x000000, 0); renderer.outputEncoding = THREE.sRGBEncoding;
      scene = new THREE.Scene();
      // her studio, as on her own pages, for the shine on her buckles, horns and boots
      const es = new THREE.Scene(), g = new THREE.SphereGeometry(10, 24, 12), col = [];
      const top = new THREE.Color(0.22, 0.21, 0.36), mid = new THREE.Color(0.09, 0.08, 0.13), bot = new THREE.Color(0.03, 0.022, 0.035), c = new THREE.Color();
      for (let i = 0; i < g.attributes.position.count; i++) { const y = g.attributes.position.getY(i) / 10; if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.7)); else c.copy(mid).lerp(bot, Math.pow(-y, 0.5)); col.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      const panel = (x, y, z, w, h, r, gg, b) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, gg, b), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1, 0); es.add(m); };
      panel(4, 6, 5, 4, 3, 4.2, 3.9, 3.8); panel(-6, 3, 2, 2, 4, 0.8, 0.9, 1.6); panel(-2, 5, -7, 5, 2.5, 2.2, 1.2, 3.6);
      const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.03).texture; pm.dispose();
      // the rig: a moonlit key from the camera's side, a violet rim behind, a cool fill
      scene.add(new THREE.HemisphereLight(0xb8b6d4, 0x3a2c34, 0.55));
      const key = new THREE.DirectionalLight(0xf2ecff, 0.85); key.position.set(1.6, 3.4, 3.0); scene.add(key);
      const rim = new THREE.DirectionalLight(0xc8a8ff, 0.45); rim.position.set(-1.8, 2.6, -3.2); scene.add(rim);
      const fill = new THREE.DirectionalLight(0xc0c8ff, 0.30); fill.position.set(-2.6, 1.2, 2.4); scene.add(fill);
      cam = new THREE.OrthographicCamera(-BOX_HALF_W, BOX_HALF_W, 1, -1, 0.1, 40);
      A = makeMoonIo({ weight: opts.weight || 'lightest' }); A.walkRun = false;
      scene.add(A.root);
      ok = true; res();
    } catch (e) { failed = true; console.error('Io could not be built for walking:', e); res(); }
  });
  // her yaw for each way she faces: south is toward the viewer
  const YAW = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };
  let yaw = 0, lastT = null, lastWalk = 0, pace = 0, curPose = null, lastPx = 0;
  const NATURAL = { walk: 0.62, jog: 1.25 };   // her own step's speed, in her heights a second (her walk cycle is 1.12 s, her jog 0.72 s)
  function draw(g, x, y, k, s) {
    if (!ok) return;
    const t = s.t || 0, dt = lastT == null ? 0 : Math.max(0, Math.min(0.1, t - lastT)); lastT = t;
    // how fast the field moves her, in her heights a second, eased
    const moved = Math.max(0, (s.walk || 0) - lastWalk); lastWalk = s.walk || 0;
    const v = dt > 0 ? moved / dt : 0; pace += ((s.moving ? v : 0) - pace) * Math.min(1, dt * 6);
    // which way she faces, turning smoothly
    let to = YAW[s.dir] != null ? YAW[s.dir] : 0, d = to - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, dt * 12);
    A.root.rotation.set(0, yaw, 0); A.root.position.set(0, 0, 0);
    A.root.rotation.z = -(Math.max(-1, Math.min(1, s.lean || 0))) * 0.04 * Math.cos(yaw);
    // a pose (kneeling to gather, casting moonlight), or her walk
    const pose = s.pose === 'kneel' ? 'kneel' : s.pose === 'cast' ? 'e_sky' : null;
    if (pose !== curPose) { curPose = pose; A.stance = pose === 'kneel' ? 'kneel' : null; if (pose === 'e_sky') A.play('e_sky', true); else if (!pose) A.reset(); }
    let rate = 1, wb = 0;
    if (!pose && s.moving && pace > 0.05) { const jog = pace > 0.95; A.walkRun = jog; wb = 1; rate = Math.max(0.6, Math.min(1.9, pace / (jog ? NATURAL.jog : NATURAL.walk))); }
    A.animate(0, wb, t, dt * rate);
    // the small canvas: her box at the size she stands on screen, sharp to the device's pixels
    const dpr = Math.min(window.devicePixelRatio || 1, 2), ppm = (k * 250) / TALL, Hm = BOX_UP + BOX_DOWN;
    const W = Math.max(8, Math.round(2 * BOX_HALF_W * ppm * dpr)), H = Math.max(8, Math.round(Hm * Math.cos(PITCH) * ppm * dpr + 0.6 * Math.sin(PITCH) * ppm * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; renderer.setSize(W, H, false); }
    // the camera looks down at the maps' angle; its box is fitted so her feet sit at a known row
    const hh = H / (2 * ppm * dpr); cam.left = -BOX_HALF_W; cam.right = BOX_HALF_W; cam.top = hh; cam.bottom = -hh;
    const aim = new THREE.Vector3(0, BOX_UP / 2 - BOX_DOWN / 2 + 0.05, 0);
    cam.position.set(0, aim.y + 10 * Math.sin(PITCH), 10 * Math.cos(PITCH)); cam.lookAt(aim); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    renderer.render(scene, cam);
    const foot = new THREE.Vector3(0, 0, 0).project(cam), fx = (foot.x + 1) / 2 * W / dpr, fy = (1 - foot.y) / 2 * H / dpr;
    // her shadow on the painted ground, then her
    g.save();
    g.fillStyle = 'rgba(16,9,31,0.42)'; g.beginPath(); g.ellipse(x, y, 0.32 * ppm, 0.11 * ppm, 0, 0, Math.PI * 2); g.fill();
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(cv, x - fx, y - fy, W / dpr, H / dpr);
    g.restore();
    lastPx = W;
  }
  return { ready, h: 250, draw, get loaded() { return ok; }, get failed() { return failed; }, model: () => A, canvas: cv };
}
