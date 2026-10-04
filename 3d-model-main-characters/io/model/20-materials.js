
 // ---------- materials ----------
 // Shader additions, each where the real material needs it:
 //  - skin: light wraps a little past the edge of the lit side and comes out warm and red there, as it does through skin;
 //  - hair: two highlights run along each strand (a sharp pale one and a broad tinted one, shifted along it), broken up
 //    strand by strand, as hair shines;
 //  - glitter: a share of tiny facets in the dress, sash and hat band each catch a light only when it, the facet and the
 //    eye line up, so they twinkle as she moves and the camera turns;
 //  - fur: the hat band's shells thin out toward their tips into a fuzz;
 //  - a faint cool rim at the edges facing away, so she reads against the night;
 //  - her spells' white glow and her trance's blue (the game model lerps every emissive toward them; here they are added);
 //  - the starlight cloak of her trance, exactly as the game model draws it.
 const U = {
  time: { value: 0 }, glow: { value: 0 }, glowC: { value: CR(.48, .48, .5) }, trance: { value: 0 }, trC: { value: C('#6a80d8') },
  rim: { value: .3 }, rimC: { value: CR(.42, .45, .66) }, sss: { value: CR(1, .36, .24) }, glitC: { value: CR(1, .92, .82) }
 };
 const NOISE = 'float ioH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n';
 const KEYS = ['skin', 'hair', 'glit', 'fur', 'rim', 'glow', 'tr', 'star', 'dark'];
 function patch(m, o) {
  const key = 'io1-' + KEYS.map((k) => (o[k] ? k + o[k] : '')).join('');
  m.onBeforeCompile = (sh) => {
   Object.assign(sh.uniforms, { uTime: U.time, uGlow: U.glow, uGlowC: U.glowC, uTrance: U.trance, uTrC: U.trC, uRim: U.rim, uRimC: U.rimC, uSSS: U.sss, uGlitC: U.glitC });
   if (o.star) sh.uniforms.starMap = { value: STARMAP };
   let vs = sh.vertexShader, fs = sh.fragmentShader;
   vs = 'varying vec3 vDP;\nvarying vec3 vWP;\n' + (o.hair ? 'attribute vec3 aHT;\nvarying vec3 vHT;\nvarying vec2 vHU;\n' : '') + (o.fur ? 'attribute float aShell;\nvarying float vShell;\n' : '') + vs;
   vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;' + (o.fur ? ' vShell = aShell;' : '') + (o.hair ? ' vHU = uv;' : ''));
   if (o.hair) vs = vs.replace('#include <skinnormal_vertex>', '#include <skinnormal_vertex>\n vec3 hT = aHT;\n#ifdef USE_SKINNING\n hT = (skinMatrix * vec4(hT, 0.)).xyz;\n#endif\n vHT = normalize((modelViewMatrix * vec4(hT, 0.)).xyz);');
   vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
   fs = 'varying vec3 vDP;\nvarying vec3 vWP;\nuniform float uTime, uGlow, uTrance, uRim;\nuniform vec3 uGlowC, uTrC, uRimC, uSSS, uGlitC;\n' + (o.hair ? 'varying vec3 vHT;\nvarying vec2 vHU;\n' : '') + (o.fur ? 'varying float vShell;\n' : '') +
    (o.star ? 'uniform sampler2D starMap;\n' : '') + NOISE + fs;
   let fn = '';
   if (o.skin) fn += 'vec3 ioSSS(IncidentLight dl, GeometricContext g) { float d = dot(g.normal, dl.direction); float w = clamp((d + .5) / 1.5, 0., 1.); return dl.color * max(0., w * w - max(d, 0.)) * uSSS * ' + (+o.skin).toFixed(2) + '; }\n';
   if (o.hair) fn += 'vec3 ioHair(IncidentLight dl, GeometricContext g, vec3 base) { vec3 T = normalize(vHT), N = g.normal, H = normalize(dl.direction + g.viewDir);\n' +
    ' float id = floor(vHU.y * 4096.), nz = ioH(vec3(id, 3.1, 7.7)), sp = .55 + .9 * ioH(vec3(floor(vHU.x * 40.), id, 1.));\n' +
    ' vec3 T1 = normalize(T + N * (-.1 + .08 * nz)), T2 = normalize(T + N * (.16 + .12 * nz)); float a = dot(T1, H), b = dot(T2, H);\n' +
    ' float s1 = pow(sqrt(max(0., 1. - a * a)), 160.), s2 = pow(sqrt(max(0., 1. - b * b)), 34.); float dif = clamp(dot(N, dl.direction) * .55 + .45, 0., 1.);\n' +
    ' return dl.color * dif * (s1 * .1 * vec3(1., .96, .92) + s2 * .45 * base * vec3(1.35, .85, .7)) * sp; }\n';
   if (o.glit) fn += 'vec3 ioGlit(IncidentLight dl, GeometricContext g) { vec3 c = floor(vDP * ' + (+o.glit).toFixed(1) + '); float h = ioH(c); if (h < .62) return vec3(0.);\n' +
    ' vec3 j = vec3(ioH(c + 1.7), ioH(c + 3.1), ioH(c + 5.3)) - .5; vec3 n = normalize(g.normal + j * 1.6); float s = pow(max(dot(n, normalize(dl.direction + g.viewDir)), 0.), 600.);\n' +
    ' return dl.color * s * 14. * uGlitC; }\n';
   if (fn) fs = fs.replace('#include <lights_pars_begin>', '#include <lights_pars_begin>\n' + fn);
   let add = '';
   if (o.skin) add += '\n\t\treflectedLight.directDiffuse += ioSSS(directLight, geometry) * material.diffuseColor;';
   if (o.hair) add += '\n\t\treflectedLight.directSpecular += ioHair(directLight, geometry, material.diffuseColor);';
   if (o.glit) add += '\n\t\treflectedLight.directSpecular += ioGlit(directLight, geometry);';
   if (add) fs = fs.replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.split('RE_Direct( directLight, geometry, material, reflectedLight );').join('RE_Direct( directLight, geometry, material, reflectedLight );' + add));
   // the fuzz: each shell keeps fewer fibres, and the lower ones are in their shade
   if (o.fur) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n if (vShell > .001) { float n = ioH(vec3(floor(vUv.x * 1400.), floor(vUv.y * 70.), 0.)); if (n < vShell * .95 + .02) discard; }\n diffuseColor.rgb *= .5 + .5 * vShell + .2 * step(.001, vShell);');
   if (o.star) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n vec4 stc = texture2D(starMap, vUv * 0.6 + vec2(uTime * 0.004, uTime * 0.012));' + (LIN ? ' stc.rgb = pow(stc.rgb, vec3(2.2));' : '') + '\n diffuseColor.rgb = mix(diffuseColor.rgb, stc.rgb * 0.75 + ' + (LIN ? 'vec3(0.0005, 0.0014, 0.0155)' : 'vec3(0.03, 0.05, 0.15)') + ', uTrance);');
   let em = '';
   if (o.star) em += '\n totalEmissiveRadiance += stc.rgb * stc.rgb * 1.8 * uTrance * (0.7 + 0.3 * sin(uTime * 3.0 + vUv.x * 37.0 + vUv.y * 23.0));';
   if (o.rim) em += '\n totalEmissiveRadiance += uRimC * uRim * ' + (+o.rim).toFixed(2) + ' * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.);';
   if (o.glow) em += '\n totalEmissiveRadiance += uGlowC * uGlow * ' + (+o.glow).toFixed(2) + ';';
   if (o.tr) em += '\n totalEmissiveRadiance += uTrC * uTrance * ' + (+o.tr).toFixed(2) + ';';
   if (em) fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + em);
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => key;
  return m;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0, skinning: true }, o));
 const phys = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .8, metalness: 0, skinning: true }, o));
 const nv2 = (k) => new THREE.Vector2(k, k);
 const METAL = LIN ? 1 : .4;                           // the game's plain renderer has no night to reflect: less metal there
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 // the trance's starlight (the game model's map, painted at twice the size, from the same stream)
 hs = SEED.starmap;
 const STARMAP = tex((() => {
  const S = 512, k = 2, c = cvs(S, S), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, S);
  gr.addColorStop(0, '#2a3c86'); gr.addColorStop(0.5, '#1b2660'); gr.addColorStop(1, '#2c2470'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) { const b = 150 + hr() * 105; g.fillStyle = 'rgba(' + (b | 0) + ',' + ((b * 0.96) | 0) + ',255,' + (0.35 + hr() * 0.65).toFixed(2) + ')'; const s = (hr() < 0.85 ? 1 : 2) * k; g.fillRect(hr() * S, hr() * S, s, s); }
  g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) { const x = hr() * S, y = hr() * S, r = (2 + hr() * 4) * k; for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) star4(g, x + dx, y + dy, r); }
  return c;
 })(), 1, 1, true);
 const M = {
  face: patch(std({ map: FACE.map, normalMap: FACE.normal, normalScale: nv2(.08), roughness: .5 }), { skin: 1, rim: .5, glow: 1 }),
  skin: patch(std({ color: C('#f0b894'), normalMap: SKIN, normalScale: nv2(.22), roughness: .55 }), { skin: 1, rim: .5, glow: 1 }),
  lid: patch(std({ color: C('#f0b894'), roughness: .5 }), { skin: 1, glow: 1 }),
  skinShade: patch(std({ color: C('#eaa585'), normalMap: SKIN, normalScale: nv2(.2), roughness: .6 }), { skin: 1, rim: .5, glow: 1 }),
  lip: patch(phys({ color: C('#c85a6e'), roughness: .34, clearcoat: .6, clearcoatRoughness: .22 }), { skin: .6, glow: 1 }),
  nail: patch(phys({ color: C('#4a1850'), roughness: .22, clearcoat: 1, clearcoatRoughness: .06 }), { glow: 1 }),
  hair: patch(std({ vertexColors: true, roughness: .7, envMapIntensity: .15 }), { hair: 1, glow: 1, tr: .45 }),
  lash: patch(std({ vertexColors: true, roughness: .55, envMapIntensity: .4 }), { glow: 1 }),
  scrunchie: patch(phys({ color: C('#7d2e9a'), roughness: .72, sheen: CR(.62, .4, .8), normalMap: CRUSH, normalScale: nv2(.9) }), { rim: .6, glow: 1 }),
  coat: patch(phys({ map: COATV.map, normalMap: COATV.normal, normalScale: nv2(.6), roughnessMap: COATV.rm, metalnessMap: COATV.rm, roughness: 1, metalness: METAL, sheen: CR(.34, .14, .26), envMapIntensity: .35 }), { star: 1, rim: 1, glow: 1 }),
  lining: patch(phys({ color: C('#4a1334'), roughness: .42, sheen: CR(.4, .2, .34), side: THREE.BackSide }), { glow: 1 }),
  trim: patch(phys({ map: TRIM.map, normalMap: TRIM.normal, normalScale: nv2(1), roughnessMap: TRIM.rm, metalnessMap: TRIM.rm, roughness: 1, metalness: METAL, emissive: C('#2a0a18').multiplyScalar(.5) }), { rim: .6, glow: 1 }),
  gold: patch(phys({ color: C('#efbd5c'), metalness: METAL, roughness: .24, clearcoat: .4, clearcoatRoughness: .1, emissive: C('#3a2206').multiplyScalar(.35) }), { glow: 1 }),
  silver: patch(phys({ color: C('#dddbe4'), metalness: METAL, roughness: .2, clearcoat: .3, emissive: C('#1c1c22').multiplyScalar(.4) }), { glow: 1 }),
  blade: patch(phys({ map: BLADE.map, normalMap: BLADE.normal, normalScale: nv2(.7), roughnessMap: BLADE.rm, metalnessMap: BLADE.rm, metalness: METAL, roughness: 1, envMapIntensity: 1.3 }), { glow: 1 }),
  handle: patch(phys({ map: LEATHER.map, color: CR(.62, .6, .62), normalMap: LEATHER.normal, normalScale: nv2(.8), roughness: .62 }), { glow: 1 }),
  boot: patch(phys({ map: LEATHER.map, normalMap: LEATHER.normal, normalScale: nv2(.55), roughnessMap: LEATHER.rm, roughness: 1, clearcoat: .28, clearcoatRoughness: .38 }), { rim: .7, glow: 1 }),
  bootDark: patch(phys({ map: LEATHER.map, color: CR(.62, .56, .58), normalMap: LEATHER.normal, normalScale: nv2(.6), roughness: .66, clearcoat: .15 }), { rim: .5, glow: 1 }),
  dress: patch(phys({ map: DRESS.map, emissiveMap: DRESS.emis, emissive: CR(.12, .12, .12), normalMap: DRESS.normal, normalScale: nv2(.7), roughness: .6, sheen: CR(.22, .16, .22), side: THREE.DoubleSide }), { glit: 260, rim: .8, glow: 1 }),
  bodice: patch(std({ map: NET.map, normalMap: NET.normal, normalScale: nv2(1), roughness: .78 }), { rim: .3, glow: 1 }),
  sash: patch(phys({ map: SASH.map, emissiveMap: SASH.emis, emissive: CR(.2, .2, .2), normalMap: SASH.normal, normalScale: nv2(.5), roughness: .4, sheen: CR(.62, .6, .68), side: THREE.DoubleSide }), { glit: 300, rim: .6, glow: 1 }),
  hat: patch(phys({ map: HATV.map, normalMap: HATV.normal, normalScale: nv2(.6), roughnessMap: HATV.rm, metalnessMap: HATV.rm, roughness: 1, metalness: METAL, sheen: CR(.32, .13, .24), side: THREE.DoubleSide, envMapIntensity: .35 }), { rim: 1, glow: 1 }),
  hatBand: patch(phys({ map: BAND.map, emissiveMap: BAND.emis, emissive: CR(.12, .12, .12), normalMap: BAND.normal, normalScale: nv2(.6), roughness: .9, sheen: CR(.4, .3, .26) }), { fur: 1, rim: .5, glow: 1 }),
  horn: patch(phys({ map: HORN.map, normalMap: HORN.normal, normalScale: nv2(.8), vertexColors: true, roughness: .36, clearcoat: .45, clearcoatRoughness: .28 }), { rim: .6, glow: 1 }),
  cord: patch(std({ color: C('#151015'), roughness: .62, normalMap: CRUSH, normalScale: nv2(.4) }), { glow: 1 }),
  eyeW: patch(phys({ color: 0xffffff, vertexColors: true, roughness: .28, clearcoat: .8, clearcoatRoughness: .1, emissive: C('#3c3c40') }), { glow: 1 }),
  iris: patch(phys({ map: IRIS, emissiveMap: IRIS, emissive: C('#5a5a5a'), roughness: .3, clearcoat: 1, clearcoatRoughness: .05 }), { glow: 1, tr: .8 }),
  shine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  frame: patch(phys({ color: C('#141014'), roughness: .24, metalness: .6 * METAL, clearcoat: .8, clearcoatRoughness: .12 }), { glow: 1 }),
  // glass that only adds what it reflects (so it never darkens her eyes), and a breath of tint
  lens: new THREE.MeshPhysicalMaterial(Object.assign({ color: 0x000000, roughness: .04, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.1 }, ADD)),
  lensTint: new THREE.MeshStandardMaterial({ color: C('#dfe8ff'), roughness: .05, transparent: true, opacity: .07, depthWrite: false }),
  cornea: new THREE.MeshPhysicalMaterial(Object.assign({ color: 0x000000, roughness: .02, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: .9 }, ADD))
 };
 for (const k in M) M[k].name = k;
 const LINING = [{ m: M.lining, c: M.lining.color.clone() }];
 const INDIGO = C('#1c2660');
