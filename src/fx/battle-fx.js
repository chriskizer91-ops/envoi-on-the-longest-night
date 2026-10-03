// battle-fx.js: the battle's spell effects (sparks, rings, slashes, projectiles, crescent blades, beams, sigils,
// tendrils, the black sun, a shield, briars, spirals, geysers, converging motes and moonfall). Imported unchanged from
// reference/demos/night-square-shadow-wraith.html. three.js r128 (global THREE). Defines makeBattleFX(): add fx.grp to
// the scene and call fx.update(dt, t) every frame.
function makeBattleFX() {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const tmpV = new THREE.Vector3(); // scratch vector for geyser, rise, spiral and converge (a page global in the Night square demo)
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); return t; }
  function radialTex(inner, mid, outer) {
    return canvasTex(128, 128, (x) => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.45, mid); gr.addColorStop(1, outer || 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); });
  }
    const grp = new THREE.Group();
    const T = {
      soft: radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0.35)'),
      star: canvasTex(64, 64, (x) => {
        const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = gr; x.fillRect(0, 0, 64, 64); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(32, 2); x.quadraticCurveTo(32, 32, 62, 32); x.quadraticCurveTo(32, 32, 32, 62); x.quadraticCurveTo(32, 32, 2, 32); x.quadraticCurveTo(32, 32, 32, 2); x.fill();
      }),
      ring: canvasTex(256, 256, (x) => { x.strokeStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 14; x.lineWidth = 9; x.beginPath(); x.arc(128, 128, 104, 0, TAU); x.stroke(); x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 84, 0, TAU); x.stroke(); }),
      crescent: canvasTex(128, 128, (x) => { x.shadowColor = '#cfe0ff'; x.shadowBlur = 16; x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 46, 0, TAU); x.arc(82, 52, 42, 0, TAU, true); x.fill('evenodd'); }),
      slash: canvasTex(256, 256, (x) => {
        x.shadowColor = '#fff'; x.shadowBlur = 18;
        for (let i = 0; i < 26; i++) { const t = i / 25, a0 = -1.1 + t * 2.2; x.strokeStyle = 'rgba(255,255,255,' + (Math.sin(Math.PI * t) * 0.9).toFixed(3) + ')'; x.lineWidth = 3 + 14 * Math.sin(Math.PI * t); x.beginPath(); x.arc(70, 128, 110, a0, a0 + 0.1); x.stroke(); }
      }),
      beam: canvasTex(64, 256, (x) => {
        const img = x.createImageData(64, 256), d = img.data;
        for (let y = 0; y < 256; y++) for (let i = 0; i < 64; i++) {
          const dx = (i - 31.5) / 32, vy = 1 - y / 256, a = Math.min(1, (Math.exp(-dx * dx * 7) * 0.75 + Math.exp(-dx * dx * 55) * 0.6) * Math.min(1, vy * 7) * Math.pow(1 - vy, 1.1));
          const k = (y * 64 + i) * 4; d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = a * 255;
        }
        x.putImageData(img, 0, 0);
      }),
      sigil: canvasTex(256, 256, (x) => {
        x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 10;
        x.lineWidth = 4; x.beginPath(); x.arc(128, 128, 118, 0, TAU); x.stroke();
        x.lineWidth = 2; x.beginPath(); x.arc(128, 128, 100, 0, TAU); x.stroke(); x.beginPath(); x.arc(128, 128, 64, 0, TAU); x.stroke();
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; x.beginPath(); x.moveTo(128 + Math.cos(a) * 64, 128 + Math.sin(a) * 64); x.lineTo(128 + Math.cos(a + TAU / 3) * 64, 128 + Math.sin(a + TAU / 3) * 64); x.stroke(); }
        for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; x.beginPath(); x.arc(128 + Math.cos(a) * 109, 128 + Math.sin(a) * 109, i % 3 ? 2 : 4, 0, TAU); x.fill(); }
      }),
      sun: canvasTex(256, 256, (x) => {
        const gr = x.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(40,255,140,0.9)'); gr.addColorStop(0.25, 'rgba(20,160,80,0.45)'); gr.addColorStop(1, 'rgba(0,40,20,0)');
        x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
        x.fillStyle = '#020403'; x.beginPath(); x.arc(128, 128, 64, 0, TAU); x.fill();
        x.strokeStyle = '#b9ffd6'; x.lineWidth = 3; x.shadowColor = '#5dff9d'; x.shadowBlur = 16; x.beginPath(); x.arc(128, 128, 64, 0, TAU); x.stroke();
      })
    };

    // particles: additive points whose colour fades to black
    function Pool(n, tex, size) {
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), vel = new Float32Array(n * 3), base = new Float32Array(n * 3), life = new Float32Array(n), max = new Float32Array(n), drag = new Float32Array(n), grav = new Float32Array(n);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({ size, map: tex, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false; pts.renderOrder = 8; grp.add(pts);
      for (let i = 0; i < n; i++) pos[i * 3 + 1] = -99;
      let next = 0;
      return {
        mat, size,
        emit(p, color, count, o) {
          o = o || {};
          for (let c = 0; c < count; c++) {
            const i = next; next = (next + 1) % n;
            const th = Math.random() * TAU, ph = Math.acos(rnd(-1, 1)), sp = (o.speed || 2) * rnd(0.35, 1);
            let vx = Math.sin(ph) * Math.cos(th) * sp, vy = Math.cos(ph) * sp, vz = Math.sin(ph) * Math.sin(th) * sp;
            if (o.up) vy = Math.abs(vy) * o.up;
            if (o.dir) { vx += o.dir.x; vy += o.dir.y; vz += o.dir.z; }
            const sr = o.spread || 0;
            pos[i * 3] = p.x + rnd(-sr, sr); pos[i * 3 + 1] = p.y + rnd(-sr, sr) * (o.flat ? 0.1 : 1); pos[i * 3 + 2] = p.z + rnd(-sr, sr);
            vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
            base[i * 3] = color[0]; base[i * 3 + 1] = color[1]; base[i * 3 + 2] = color[2];
            max[i] = life[i] = (o.life || 0.6) * rnd(0.6, 1.2); drag[i] = o.drag === undefined ? 2.5 : o.drag; grav[i] = o.grav === undefined ? -1.5 : o.grav;
          }
        },
        update(dt) {
          for (let i = 0; i < n; i++) {
            if (life[i] <= 0) continue;
            life[i] -= dt;
            if (life[i] <= 0) { pos[i * 3 + 1] = -99; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0; continue; }
            const f = Math.exp(-drag[i] * dt);
            vel[i * 3] *= f; vel[i * 3 + 1] = vel[i * 3 + 1] * f + grav[i] * dt; vel[i * 3 + 2] *= f;
            pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
            const k = Math.pow(life[i] / max[i], 1.3);
            col[i * 3] = base[i * 3] * k; col[i * 3 + 1] = base[i * 3 + 1] * k; col[i * 3 + 2] = base[i * 3 + 2] * k;
          }
          geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
        }
      };
    }
    const sparks = Pool(480, T.star, 0.11), embers = Pool(480, T.soft, 0.07), puffs = Pool(140, T.soft, 0.34);

    // a few reusable lights for flashes (fixed count, so shaders never recompile)
    const lights = [0, 1, 2].map(() => { const L = new THREE.PointLight(0xffffff, 0, 5, 2); grp.add(L); return { L, t: 1, dur: 1, i: 0 }; });
    function flashLight(p, color, intensity, dur, dist) {
      let best = lights[0]; for (const l of lights) if (l.t / l.dur > best.t / best.dur) best = l;
      best.L.position.copy(p); best.L.color.set(color); best.L.distance = dist || 6; best.i = intensity; best.t = 0; best.dur = dur;
      return best;
    }
    function holdLight(color, dist) { const l = flashLight(new THREE.Vector3(0, -50, 0), color, 0, 1e9, dist); l.hold = true; return l; }

    // animated objects: fn(u) runs every frame until done
    const anims = [];
    function anim(dur, fn, done) { return new Promise((res) => anims.push({ t: 0, dur, fn, done, res })); }
    function sprite(tex, color, blending, order) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, blending: blending === undefined ? THREE.AdditiveBlending : blending, depthWrite: false, transparent: true }));
      s.renderOrder = order || 7; grp.add(s); return s;
    }
    function drop(o) { grp.remove(o); if (o.material) o.material.dispose(); }
    const ringGeo = new THREE.PlaneGeometry(1, 1);
    function ring(p, color, r0, r1, dur, op, tex) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ map: tex || T.ring, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.03, p.z); m.renderOrder = 3; grp.add(m);
      return anim(dur, (u) => { const r = lerp(r0, r1, 1 - Math.pow(1 - u, 2)) * 2; m.scale.set(r, r, 1); m.material.opacity = (op || 1) * (1 - u); }, () => drop(m));
    }
    function burst(p, color, n, speed, o) {
      o = o || {};
      sparks.emit(p, color, n, { speed, life: o.life || 0.55, spread: o.spread || 0.05, grav: o.grav, up: o.up, dir: o.dir });
      embers.emit(p, color.map((c) => Math.min(1, c * 0.9 + 0.1)), Math.round(n * 0.8), { speed: speed * 0.7, life: (o.life || 0.55) * 1.4, spread: o.spread || 0.08, grav: o.grav, up: o.up, dir: o.dir });
      puffs.emit(p, color.map((c) => c * 0.45), Math.max(2, Math.round(n / 8)), { speed: speed * 0.25, life: 0.5, spread: 0.05, grav: 0.3, drag: 3 });
    }
    function slash(p, color, rot, size, dur) {
      const s = sprite(T.slash, color); s.position.copy(p); s.material.rotation = rot;
      return anim(dur || 0.35, (u) => { const k = size * (0.7 + 0.5 * u); s.scale.set(k, k, 1); s.material.opacity = Math.sin(Math.PI * Math.min(1, u * 1.3)); }, () => drop(s));
    }

    const qbez = (a, c, b, u, out) => { const k0 = (1 - u) * (1 - u), k1 = 2 * (1 - u) * u, k2 = u * u; return out.set(a.x * k0 + c.x * k1 + b.x * k2, a.y * k0 + c.y * k1 + b.y * k2, a.z * k0 + c.z * k1 + b.z * k2); };
    function projectile(o) {
      const core = sprite(o.tex || T.soft, o.color), halo = sprite(T.soft, o.halo || o.color);
      core.scale.setScalar(o.size); halo.scale.setScalar(o.size * 2.6); halo.material.opacity = 0.5;
      const from = o.from.clone(), to0 = typeof o.to === 'function' ? o.to() : o.to;
      const ctrl = from.clone().lerp(to0, 0.5); ctrl.y += o.arc === undefined ? 0.6 : o.arc;
      if (o.side) { const d = new THREE.Vector3().subVectors(to0, from); ctrl.x += -d.z * o.side; ctrl.z += d.x * o.side; }
      const L = o.light ? flashLight(from, o.light, o.lightI || 2.2, 1e9, 4) : null, p = new THREE.Vector3();
      return anim(o.dur, (u) => {
        const to = typeof o.to === 'function' ? o.to() : o.to;
        qbez(from, ctrl, to, u, p); core.position.copy(p); halo.position.copy(p);
        if (o.spin) core.material.rotation = u * o.spin;
        if (o.trail) embers.emit(p, o.trail, 2, { speed: 0.35, life: 0.4, spread: 0.03, grav: 0, drag: 4 });
        if (L) L.L.position.copy(p);
      }, () => { drop(core); drop(halo); if (L) { L.t = 0; L.dur = 0.25; } });
    }
    function blades(centerFn, n) {
      const list = [];
      for (let i = 0; i < n; i++) { const s = sprite(T.crescent, 0xe4edff); s.scale.setScalar(0.001); list.push({ s, a: i / n * TAU, state: 'orbit', t: 0 }); }
      anim(1e9, (u, dt) => {
        const c = centerFn();
        for (const b of list) {
          if (b.state !== 'orbit') continue;
          b.a += dt * 3.4; b.t += dt; const k = Math.min(1, b.t / 0.35);
          b.s.position.set(c.x + Math.cos(b.a) * 0.78, c.y + 0.15 + Math.sin(b.a * 2) * 0.09, c.z + Math.sin(b.a) * 0.62);
          b.s.scale.setScalar(0.36 * k); b.s.material.rotation += dt * 10; b.s.material.opacity = k;
          if (Math.random() < 0.6) embers.emit(b.s.position, [0.55, 0.68, 1], 1, { speed: 0.2, life: 0.3, grav: 0, drag: 4 });
        }
        return !list.some((b) => b.state === 'orbit');
      });
      return list;
    }
    function launchBlade(b, toFn, dur) {
      b.state = 'fly';
      const from = b.s.position.clone(), p = new THREE.Vector3();
      return anim(dur || 0.3, (u, dt) => {
        const to = toFn(); p.lerpVectors(from, to, u * u * (3 - 2 * u) * 0.3 + u * 0.7);
        b.s.position.copy(p); b.s.material.rotation += (dt || 0.016) * 22;
        embers.emit(p, [0.7, 0.8, 1], 2, { speed: 0.25, life: 0.3, grav: 0, drag: 4 });
      }, () => drop(b.s));
    }
    function beam(p, color, width, height, dur) {
      const s = sprite(T.beam, color, THREE.AdditiveBlending, 6); s.center.set(0.5, 0); s.position.set(p.x, 0, p.z);
      return anim(dur, (u) => { const k = u < 0.12 ? u / 0.12 : 1 - Math.pow((u - 0.12) / 0.88, 2); s.scale.set(width * (0.55 + 0.45 * k), height, 1); s.material.opacity = k; }, () => drop(s));
    }
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    function sigil(p, color, size, dur, spin) {
      const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: T.sigil, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.03, p.z); m.renderOrder = 3; grp.add(m);
      return anim(dur, (u) => { const k = Math.min(1, u / 0.15) * (1 - Math.max(0, (u - 0.8) / 0.2)); m.scale.set(size * (0.6 + 0.4 * Math.min(1, u / 0.15)), size * (0.6 + 0.4 * Math.min(1, u / 0.15)), 1); m.rotation.z = u * (spin || 2); m.material.opacity = k; }, () => drop(m));
    }
    const tentGeo = (() => {
      const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0.04, 0.35, 0.02], [-0.05, 0.7, 0.07], [0.05, 1.0, 0.03], [0.16, 1.2, -0.07], [0.24, 1.18, -0.16]].map((q) => new THREE.Vector3(q[0], q[1], q[2])));
      const geo = new THREE.TubeGeometry(curve, 28, 1, 8, false), pos = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
      for (let i = 0; i <= 28; i++) { curve.getPointAt(i / 28, c); const r = 0.075 * Math.pow(1 - i / 28, 0.8) + 0.004; for (let j = 0; j <= 8; j++) { const k = i * 9 + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); } }
      geo.computeVertexNormals(); return geo;
    })();
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x0c0a12, roughness: 0.5, emissive: 0x0d4a26 });
    function tendrils(p, dur) {
      const gT = new THREE.Group(); gT.position.set(p.x, 0, p.z); grp.add(gT);
      const list = [], q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), ax = new THREE.Vector3();
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU + rnd(-0.25, 0.25), r = rnd(0.38, 0.62), m = new THREE.Mesh(tentGeo, tentMat);
        m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        ax.set(-Math.sin(a), 0, Math.cos(a)); q1.setFromAxisAngle(ax, rnd(0.25, 0.5)); q2.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(0, TAU));
        m.quaternion.copy(q1).multiply(q2); m.scale.set(1, 0.001, 1); gT.add(m); list.push({ m, ph: rnd(0, 6), h: rnd(0.8, 1.25) });
      }
      return anim(dur, (u) => {
        const k = u < 0.18 ? Math.sin(u / 0.18 * Math.PI / 2) : u > 0.72 ? 1 - Math.sin((u - 0.72) / 0.28 * Math.PI / 2) : 1;
        for (const L of list) { const w = 1 + 0.25 * k; L.m.scale.set(w, Math.max(0.001, k * L.h * (1 + 0.06 * Math.sin(u * 30 + L.ph))), w); }
      }, () => grp.remove(gT));
    }
    // size scales it for a bigger caster (the great wraith); 1 by default
    function blackSun(p, dur, size) {
      const s = sprite(T.sun, 0xffffff, THREE.NormalBlending, 6), z = size || 1; s.position.copy(p);
      return anim(dur, (u) => { const k = u < 0.45 ? Math.sin(u / 0.45 * Math.PI / 2) : u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1; s.scale.setScalar((0.2 + 1.7 * k) * z); s.material.opacity = k; s.material.rotation = u * 1.5; }, () => drop(s));
    }
    let shieldM = null, shieldOn = 0, shieldFlash = 0;
    function shield(on, p, yaw) {
      if (!shieldM) {
        shieldM = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: T.sigil, color: 0xbfd6ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        shieldM.renderOrder = 6; shieldM.scale.set(1.25, 1.25, 1); grp.add(shieldM);
      }
      shieldOn = on ? 1 : 0;
      if (p) { shieldM.position.set(p.x + Math.sin(yaw) * 0.6, 0.95, p.z + Math.cos(yaw) * 0.6); shieldM.rotation.set(0, yaw, 0); }
    }
    function rise(pFn, color, dur, rate, radius) {
      let acc = 0;
      return anim(dur, (u, dt) => {
        acc += rate * (dt || 0); const c = pFn();
        while (acc >= 1) { acc -= 1; const a = rnd(0, TAU), r = rnd(0.1, radius); tmpV.set(c.x + Math.cos(a) * r, rnd(0.05, 0.4), c.z + Math.sin(a) * r * 0.8); embers.emit(tmpV, color, 1, { speed: 0.25, life: 1.1, grav: 1.4, drag: 1.2 }); }
      });
    }

    // nightbloom briars: thorny purple vines that burst up and flower
    function mergeGeos(list) {
      let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
      const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), I = new Uint32Array(ni); let vo = 0, io = 0;
      for (const g of list) {
        const c = g.attributes.position.count; P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3);
        const col = g.userData.col || [1, 1, 1]; for (let k = 0; k < c; k++) C.set(col, (vo + k) * 3);
        const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; vo += c;
      }
      const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('color', new THREE.BufferAttribute(C, 3)); out.setIndex(new THREE.BufferAttribute(I, 1)); return out;
    }
    const vineCurve = new THREE.CatmullRomCurve3([[0, 0, 0], [0.06, 0.3, 0.03], [-0.05, 0.65, 0.08], [0.07, 0.98, 0.02], [0.2, 1.22, -0.06], [0.3, 1.25, -0.18]].map((q) => new THREE.Vector3(q[0], q[1], q[2])));
    const VINE_TIP = new THREE.Vector3(0.3, 1.25, -0.18);
    const vineGeo = (() => {
      const tube = new THREE.TubeGeometry(vineCurve, 30, 1, 7, false), pos = tube.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
      for (let i = 0; i <= 30; i++) { vineCurve.getPointAt(i / 30, c); const r = 0.055 * Math.pow(1 - i / 30, 0.8) + 0.006; for (let j = 0; j <= 7; j++) { const k = i * 8 + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); } }
      tube.computeVertexNormals(); const parts = [tube], up = new THREE.Vector3(0, 1, 0);
      for (let k = 2; k < 16; k++) {
        const t = k / 17, p = vineCurve.getPointAt(t), tg = vineCurve.getTangentAt(t), side = new THREE.Vector3(Math.cos(k * 2.4), 0.3, Math.sin(k * 2.4));
        side.addScaledVector(tg, -side.dot(tg)).normalize(); const r = 0.055 * Math.pow(1 - t, 0.8), h = 0.05 + r * 0.6;
        const cone = new THREE.ConeGeometry(0.011 + r * 0.2, h, 5); cone.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up, side)));
        cone.translate(p.x + side.x * (r + h / 2), p.y + side.y * (r + h / 2), p.z + side.z * (r + h / 2)); parts.push(cone);
      }
      return mergeGeos(parts);
    })();
    const flowerGeo = (() => {
      const parts = [];
      for (let i = 0; i < 5; i++) { const s = new THREE.SphereGeometry(1, 10, 8); s.scale(0.08, 0.018, 0.045); s.translate(0.075, 0, 0); s.rotateY(i / 5 * TAU); s.userData.col = [0.75, 0.38, 1.0]; parts.push(s); }
      const ctr = new THREE.SphereGeometry(0.032, 10, 8); ctr.userData.col = [1.0, 0.86, 0.45]; parts.push(ctr);
      return mergeGeos(parts);
    })();
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x2b1934, roughness: 0.55, emissive: 0x3c0f56 });
    const flowerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, emissive: 0x3a1252 });
    function briars(p, dur) {
      const gB = new THREE.Group(); gB.position.set(p.x, 0, p.z); grp.add(gB);
      const list = [], q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), ax = new THREE.Vector3(), tip = new THREE.Vector3();
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU + rnd(-0.25, 0.25), r = rnd(0.42, 0.7), m = new THREE.Mesh(vineGeo, vineMat);
        m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        ax.set(-Math.sin(a), 0, Math.cos(a)); q1.setFromAxisAngle(ax, rnd(0.3, 0.55)); q2.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(0, TAU));
        m.quaternion.copy(q1).multiply(q2); m.scale.set(1, 0.001, 1); gB.add(m);
        const f = new THREE.Mesh(flowerGeo, flowerMat); f.scale.setScalar(0.001); gB.add(f);
        list.push({ m, f, ph: rnd(0, 6), h: rnd(0.85, 1.3), bloom: rnd(0.3, 0.42) });
      }
      return anim(dur, (u) => {
        const k = u < 0.2 ? Math.sin(u / 0.2 * Math.PI / 2) : u > 0.78 ? 1 - Math.sin((u - 0.78) / 0.22 * Math.PI / 2) : 1;
        for (const L of list) {
          const w = 1 + 0.25 * k; L.m.scale.set(w, Math.max(0.001, k * L.h * (1 + 0.05 * Math.sin(u * 28 + L.ph))), w); L.m.updateMatrix();
          tip.copy(VINE_TIP).applyMatrix4(L.m.matrix); L.f.position.copy(tip);
          const b = Math.min(sm01((u - L.bloom) / 0.15), k); L.f.scale.setScalar(0.001 + b * 1.3); L.f.rotation.set(0.4, u * 2 + L.ph, 0.3);
        }
      }, () => grp.remove(gB));
    }
    const sm01 = (x) => { const c = x < 0 ? 0 : x > 1 ? 1 : x; return c * c * (3 - 2 * c); };

    // spirals of light, a geyser from the well, light pouring into a point, and a falling moon
    function spiral(cFn, color, dur, rate) {
      let acc = 0, ang = 0;
      return anim(dur, (u, dt) => {
        const d = dt || 0; acc += (rate || 80) * d; ang += d * 7; const c = cFn();
        while (acc >= 1) { acc -= 1; for (const k of [0, Math.PI]) { const a = ang + k + rnd(-0.1, 0.1), r = 0.62 - 0.3 * u; tmpV.set(c.x + Math.cos(a) * r, c.y - 0.95 + u * 1.9, c.z + Math.sin(a) * r * 0.8); embers.emit(tmpV, color, 1, { speed: 0.12, life: 0.8, grav: 0.8, drag: 2 }); } }
      });
    }
    function geyser(p, dur, color) {
      let acc = 0;
      return anim(dur, (u, dt) => {
        acc += 130 * (dt || 0) * (1 - u * 0.6);
        while (acc >= 1) { acc -= 1; tmpV.set(p.x + rnd(-0.35, 0.35), 0.9, p.z + rnd(-0.3, 0.3)); sparks.emit(tmpV, color, 1, { speed: 0.6, dir: { x: rnd(-0.7, 0.7), y: rnd(5, 9.5), z: rnd(-0.7, 0.7) }, life: 1.1, grav: -3.5, drag: 0.6 }); }
      });
    }
    function converge(cFn, color, dur, rate) {
      let acc = 0;
      return anim(dur, (u, dt) => {
        acc += (rate || 90) * (dt || 0); const c = cFn();
        while (acc >= 1) {
          acc -= 1; const a = rnd(0, TAU), b = rnd(-1, 1), r = rnd(1.6, 2.8), q = Math.sqrt(1 - b * b);
          tmpV.set(c.x + Math.cos(a) * r * q, c.y + b * r, c.z + Math.sin(a) * r * q);
          embers.emit(tmpV, color, 1, { speed: 0.01, dir: { x: (c.x - tmpV.x) * 2.4, y: (c.y - tmpV.y) * 2.4, z: (c.z - tmpV.z) * 2.4 }, life: 0.42, grav: 0, drag: 0 });
        }
      });
    }
    function moonfall(p, tex, dur) {
      const moon = sprite(tex, 0xffffff, THREE.NormalBlending, 9), glow = sprite(T.soft, 0xdfe8ff, THREE.AdditiveBlending, 8), rg = sprite(T.ring, 0xffffff, THREE.AdditiveBlending, 8);
      const from = new THREE.Vector3(p.x + 1.6, 13, p.z - 2.2), to = new THREE.Vector3(p.x, 1.3, p.z), q = new THREE.Vector3();
      return anim(dur, (u) => {
        q.lerpVectors(from, to, u * u); moon.position.copy(q); glow.position.copy(q); rg.position.copy(q);
        const s = 1.4 + 2.4 * u; moon.scale.setScalar(s); glow.scale.setScalar(s * 2.6); rg.scale.setScalar(s * 1.8);
        rg.material.rotation = u * 6; rg.material.opacity = 0.6; moon.material.opacity = Math.min(1, u * 4); glow.material.opacity = 0.65;
        embers.emit(q, [0.85, 0.9, 1], 5, { speed: 0.7, life: 0.5, spread: 0.45, grav: 0, drag: 2 });
      }, () => { drop(moon); drop(glow); drop(rg); });
    }
    // pointScale (from the battle screen): its camera is far off with a narrow lens, which leaves three.js's points under a
    // pixel at their sizes in meters; the screen says how much bigger they must be to show at their real size
    function update(dt, t, pointScale) {
      if (pointScale > 0) for (const P of [sparks, embers, puffs]) P.mat.size = P.size * pointScale;
      sparks.update(dt); embers.update(dt); puffs.update(dt);
      for (const l of lights) { if (l.t < l.dur) { l.t += dt; l.L.intensity = l.i * Math.max(0, 1 - l.t / l.dur); } else l.L.intensity = 0; }
      for (let i = anims.length - 1; i >= 0; i--) {
        const a = anims[i]; a.t += dt; const u = Math.min(1, a.t / a.dur);
        const end = a.fn(u, dt, t) === true || u >= 1;
        if (end) { anims.splice(i, 1); if (a.done) a.done(); a.res(); }
      }
      if (shieldM) {
        shieldFlash = Math.max(0, shieldFlash - dt * 3);
        const target = shieldOn * (0.5 + 0.1 * Math.sin(t * 4)) + shieldFlash;
        shieldM.material.opacity += (target - shieldM.material.opacity) * Math.min(1, dt * 10);
        shieldM.visible = shieldM.material.opacity > 0.01;
        shieldM.material.rotation = 0; shieldM.rotateZ(dt * 0.6);
      }
    }
    return { grp, T, sparks, embers, puffs, burst, ring, slash, flashLight, anim, sprite, drop, projectile, blades, launchBlade, beam, sigil, tendrils, blackSun, briars, spiral, geyser, converge, moonfall, shield, shieldHit() { shieldFlash = 1; }, rise, update };
}
