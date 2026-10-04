 // ---------- materials ----------
 // Shader additions shared by the body: a dissolve that burns away with a glowing edge, a clean break through a severed
 // cane, leaves that rustle, thin out (state.wilt) and wither, a faint cool rim, veins that glow from the crevices (uVein:
 // x feeding, y where a pulse has run to, z its strength, w the glow at rest), char from fire, a cut at the ground it
 // rises through (uClip), leaves that redden in its wrath, sepals and petals lit from inside by the heart, and the heart
 // glowing through its drupelets. New in this version:
 //  - light through leaves and petals: moonlight (or the heart's light) from behind a leaf passes through it, warmed and
 //    tinted by it, and a leaf seen against the moon glows; shadowed leaves stay dark, since the shadowed light is used;
 //  - frost: rime on the upper faces of everything far enough from its warm heart (uFrost; none within WARM meters of its
 //    middle, full past COLD), glinting as the camera moves;
 //  - old bark: the spire, the great canes' bases and the dead canes blend into grey fissured bark (aOld);
 //  - the leaves' undersides are paler, matte and felted, as a bramble's are;
 //  - depth materials for shadows that match every cut, fade, sway and leaf shape.
 const MAXC = 10;
 const U = {
  time: { value: 0 }, flut: { value: 1 }, dis: { value: 0 }, disCol: { value: new THREE.Color(0xffa040) }, with: { value: 0 }, thin: { value: 0 },
  rim: { value: .16 }, rimC: { value: new THREE.Color(0x8c8ab8) }, cut: { value: Array.from({ length: MAXC }, () => new THREE.Vector4(2, 2, 0, 0)) },
  vein: { value: new THREE.Vector4(0, -1, 0, VEIN) }, veinC: { value: new THREE.Color(1, .14, .42) }, char: { value: 0 }, burn: { value: 0 },
  clip: { value: -1e4 }, wrath: { value: 0 }, hb: { value: .5 }, heartC: { value: new THREE.Color(1, .16, .36) },
  frost: { value: opts.frost === undefined ? .55 : +opts.frost }, ctr: { value: V3() }, warm: { value: V3(WARM, COLD, 1) }, trans: { value: 1 }
 };
 const NOISE = 'float brH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n' +
  'float brN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(brH(i),brH(i+vec3(1,0,0)),f.x),mix(brH(i+vec3(0,1,0)),brH(i+vec3(1,1,0)),f.x),f.y),mix(mix(brH(i+vec3(0,0,1)),brH(i+vec3(1,0,1)),f.x),mix(brH(i+vec3(0,1,1)),brH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
 const UNI = (sh, extra) => Object.assign(sh.uniforms, { uTime: U.time, uFlut: U.flut, uDis: U.dis, uDisCol: U.disCol, uWith: U.with, uThin: U.thin, uRim: U.rim, uRimC: U.rimC, uCut: U.cut,
  uVein: U.vein, uVeinC: U.veinC, uChar: U.char, uBurn: U.burn, uClip: U.clip, uWrath: U.wrath, uHB: U.hb, uHeartC: U.heartC, uFrost: U.frost, uCtr: U.ctr, uWarm: U.warm, uTrans: U.trans }, extra || {});
 // the vertex side shared by colour and depth: bind-pose position for noise, world height, world position and normal,
 // the severing cut's lookup and the leaves' flutter
 function vsPatch(vs, o, depth) {
  vs = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uTime;\nuniform float uFlut;\n' + (o.cut ? 'attribute vec2 aCn;\nuniform vec4 uCut[' + MAXC + '];\nvarying float vCs;\nvarying vec4 vCut;\n' : '') +
   (o.flut ? 'attribute vec4 aFl;\nvarying float vThinR;\n' : '') + (o.vein && !depth ? 'attribute vec2 aVn;\nvarying vec2 vVn;\n' : '') + (o.old && !depth ? 'attribute float aOld;\nvarying float vOld;\n' : '') + (o.heart && !depth ? 'attribute vec2 aHt;\nvarying vec2 vHt;\n' : '') + vs;
  vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;\n' + (o.vein && !depth ? ' vVn = aVn;\n' : '') + (o.old && !depth ? ' vOld = aOld;\n' : '') + (o.heart && !depth ? ' vHt = aHt;\n' : '') +
   (o.cut ? ' vCs = aCn.y; vCut = vec4(2., 2., 0., 0.); if (aCn.x > -.5) { int ci = int(aCn.x + .5); for (int i = 0; i < ' + MAXC + '; i++) { if (i == ci) vCut = uCut[i]; } }\n' : '') +
   (o.flut ? ' { float a = aFl.x * uFlut; transformed += objectNormal * a * (.035 * sin(uTime * 2.3 + aFl.y) + .02 * sin(uTime * 5.3 + aFl.y * 1.7) + .01 * sin(uTime * 9.1 + aFl.y * 2.9)); vThinR = aFl.z; }\n' : ''));
  vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
  return vs;
 }
 // the discards shared by colour and depth: below the ground it rises through, the dissolve, the severing cut, thinning
 function discards(o) {
  return ' if (vWP.y < uClip) discard;\n float brE = 0.0, brCh = 0.0; float brNz = .72 * brN(vDP * 9.) + .28 * brN(vDP * 23.);\n' +
   ' if (uDis > 0.0) { float th = uDis * 1.1 - .05; if (brNz < th) discard; brE = 1. - smoothstep(0., .055, brNz - th); }\n' +
   (o.cut ? ' if (vCut.x < 1.5) { float e = .035 * (brNz - .5), s = vCs - e; if (s > vCut.x && s < vCut.y) discard;\n' +
    '  brE = max(brE, vCut.w * (1. - smoothstep(0., .02, min(abs(s - vCut.x), abs(s - vCut.y)))));\n' +
    '  if (s >= vCut.y && vCut.z > 0.) { float th = vCut.z * 1.1 - .05; if (brNz < th) discard; brE = max(brE, 1. - smoothstep(0., .055, brNz - th)); } }\n' : '') +
   (o.flut ? ' if (vThinR < uThin) discard;\n' : '');
 }
 const FS_HEAD = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uTime;\nuniform float uDis;\nuniform vec3 uDisCol;\nuniform float uWith;\nuniform vec3 uWithC;\nuniform float uThin;\nuniform float uRim;\nuniform float uRimS;\nuniform vec3 uRimC;\n' +
  'uniform vec4 uVein;\nuniform vec3 uVeinC;\nuniform float uChar;\nuniform float uBurn;\nuniform float uClip;\nuniform float uWrath;\nuniform float uHB;\nuniform vec3 uHeartC;\nuniform float uFrost;\nuniform vec3 uCtr;\nuniform vec3 uWarm;\nuniform float uTrans;\nuniform float uTransS;\nuniform float uFrostS;\n';
 const KEYS_P = ['flut', 'cut', 'rim', 'vein', 'bloom', 'heart', 'crev', 'char', 'frost', 'trans', 'old', 'back'];
 function patch(m, o) {
  const key = 'brc2-' + KEYS_P.map((k) => (o[k] ? k + o[k] : '')).join('');
  const extra = { uRimS: { value: o.rim || 0 }, uWithC: { value: o.withC || new THREE.Color(.4, .3, .2) }, uTransS: { value: o.trans || 0 }, uFrostS: { value: o.frost || 0 } };
  if (o.old) Object.assign(extra, { uOldMap: { value: OLDBARK.map }, uOldN: { value: OLDBARK.normal } });
  m.onBeforeCompile = (sh) => {
   UNI(sh, extra);
   let vs = vsPatch(sh.vertexShader, o, false), fs = sh.fragmentShader;
   fs = FS_HEAD + (o.cut ? 'varying float vCs;\nvarying vec4 vCut;\n' : '') + (o.flut ? 'varying float vThinR;\n' : '') + (o.vein ? 'varying vec2 vVn;\n' : '') +
    (o.old ? 'varying float vOld;\nuniform sampler2D uOldMap;\nuniform sampler2D uOldN;\n' : '') + (o.heart ? 'varying vec2 vHt;\n' : '') + NOISE + fs;
   // light through a leaf or petal: what arrives on its far side passes through, strongest looking toward the light
   if (o.trans) {
    fs = fs.replace('#include <common>', '#include <common>\nvec3 brTrans(IncidentLight dl, GeometricContext g) { float b = max(0., -dot(g.normal, dl.direction)); float f = pow(max(0., dot(g.viewDir, -dl.direction)), 3.); return dl.color * (b * .55 + b * f * 1.6) * uTrans * uTransS; }\n');
    fs = fs.split('RE_Direct( directLight, geometry, material, reflectedLight );').join('RE_Direct( directLight, geometry, material, reflectedLight );\n\t\treflectedLight.directDiffuse += brTrans( directLight, geometry ) * material.diffuseColor;');
   }
   fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + discards(o));
   // the old bark, sampled at its own scale and blended in by aOld
   if (o.old) {
    fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n { vec4 ob = texture2D(uOldMap, vUv * vec2(1., .6)); ob = mapTexelToLinear(ob); diffuseColor.rgb = mix(diffuseColor.rgb, ob.rgb, vOld); }');
    fs = fs.replace('vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;', 'vec3 mapN = mix(texture2D( normalMap, vUv ).xyz, texture2D( uOldN, vUv * vec2(1., .6) ).xyz, vOld) * 2.0 - 1.0;');
   }
   fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n { float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, uWithC * (.4 + lum * 1.5), uWith); }\n' +
    // the leaves' undersides: paler, greyer and felted
    (o.back ? ' if (!gl_FrontFacing) { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * .9, l * 1.05, l * .85) * 1.25, .45); }\n diffuseColor.rgb *= mix(vec3(1.), vec3(1.55, .5, .42), uWrath * .6);\n' : '') +
    (o.bloom ? ' if (gl_FrontFacing) { if (vUv.x < .5) diffuseColor.rgb *= .62; } else if (vUv.x > .5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .02, .07), .65);\n' : '') +
    (o.char ? ' if (uChar > 0.0) { float n3 = brN(vDP * 3.1); brCh = clamp((uChar * ' + o.char.toFixed(2) + ' * 1.7 - (' + (o.flut ? 'vThinR * .5 + n3 * .3 + brNz * .2' : 'n3 * .7 + brNz * .3') + ')) * 5., 0., 1.); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.012, .008, .006), brCh); }\n' : '') +
    // frost: rime on the upper faces, from WARM to COLD meters out from its middle, gathering more in the creases of noise
    (o.frost ? ' float brFr = 0.0; { float d = length(vWP.xz - uCtr.xz) / max(uWarm.z, .01); float up = (gl_FrontFacing ? 1. : -1.) * vWN.y; float nz = brN(vWP * 7.) * .6 + brN(vWP * 31.) * .4;\n' +
     '  brFr = uFrost * uFrostS * smoothstep(uWarm.x, uWarm.y, d) * smoothstep(-.2, .7, up + (nz - .5) * .9); brFr = clamp(brFr * 1.25, 0., 1.);\n' +
     '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62, .68, .8) * (.85 + .3 * nz), brFr * .7); }\n' : ''));
   if (o.frost) fs = fs.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .55, brFr);');
   fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uDisCol * brE * 1.6;\n' +
    (o.char ? ' totalEmissiveRadiance += vec3(1., .42, .12) * brCh * (1. - brCh) * 3. * uBurn;\n' : '') +
    (o.vein ? ' { float l = pow(max(dot(texelColor.rgb, vec3(.3, .59, .11)), 1e-4), .4545), crev = 1. - smoothstep(' + (o.crev || '.06, .16') + ', l);\n' +
     '  float vg = vVn.x * (uVein.w * (.55 + .45 * sin(uTime * 1.3 - vVn.y * 6.)) + uVein.x * (.6 + .4 * sin(uTime * 6. - vVn.y * 15.)) + uVein.z * exp(-pow((vVn.y - uVein.y) * 4.5, 2.)));\n' +
     '  totalEmissiveRadiance += uVeinC * vg * (.06 + 1.4 * crev); }\n' : '') +
    (o.bloom ? ' totalEmissiveRadiance += uHeartC * uHB * .22 * (1. - smoothstep(0., .5, vUv.y)) * (gl_FrontFacing ? .6 : 1.);\n' : '') +
    (o.heart ? ' { float fr = pow(1. - abs(dot(normalize(normal), normalize(vViewPosition))), 1.5); totalEmissiveRadiance = uHeartC * uHB * (.1 + vHt.x * 2.6) * (.35 + .65 * vHt.y) * (.3 + 1.7 * fr); }\n' : '') +
    (o.frost ? ' if (brFr > .05) { vec3 vd = normalize(cameraPosition - vWP); float gl = brH(floor(vWP * 260.)); float tw = pow(max(0., sin(dot(vd, vec3(41.3, 27.1, 33.7)) + gl * 90.)), 40.); totalEmissiveRadiance += vec3(.75, .85, 1.) * step(.93, gl) * tw * brFr * .9; }\n' : ''));
   if (o.rim) fs = fs.replace('#include <dithering_fragment>', ' gl_FragColor.rgb += uRimC * (uRim * uRimS * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6));\n#include <dithering_fragment>');
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => key;
  m.userData.patch = o;
  return m;
 }
 // the shadow pass's version of a material: the same discards, sway and leaf shapes
 function depthOf(m) {
  const o = m.userData.patch || {}, d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, skinning: true, map: m.alphaTest > 0 ? m.map : null, alphaTest: m.alphaTest || 0, side: m.side });
  d.onBeforeCompile = (sh) => {
   UNI(sh);
   sh.vertexShader = vsPatch(sh.vertexShader.replace('#include <begin_vertex>', '#include <beginnormal_vertex>\n#include <begin_vertex>'), o, true);
   sh.fragmentShader = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uDis;\nuniform float uThin;\nuniform float uClip;\n' + (o.cut ? 'varying float vCs;\nvarying vec4 vCut;\n' : '') + (o.flut ? 'varying float vThinR;\n' : '') + NOISE +
    sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + discards(o));
  };
  d.customProgramCacheKey = () => 'brc2d-' + (o.cut ? 'c' : '') + (o.flut ? 'f' : '') + (m.alphaTest > 0 ? 'a' : '');
  return d;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0 }, o));
 const phys = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .8, metalness: 0 }, o));
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 const M = {
  bark: patch(phys({ map: BARK.map, normalMap: BARK.normal, normalScale: new THREE.Vector2(1.1, 1.1), vertexColors: true, roughness: .6, sheen: new THREE.Color(.05, .045, .065), envMapIntensity: .55, skinning: true }), { cut: true, rim: 1, char: .45, vein: true, crev: '.07, .17', frost: .9, old: true, withC: new THREE.Color(.3, .26, .22) }),
  wood: patch(std({ map: WOOD.map, normalMap: WOOD.normal, normalScale: new THREE.Vector2(1.2, 1.2), vertexColors: true, roughness: .92, envMapIntensity: .5, skinning: true }), { cut: true, rim: .8, vein: true, crev: '.07, .17', frost: .6, withC: new THREE.Color(.32, .28, .24) }),
  vc: patch(std({ vertexColors: true, roughness: .42, skinning: true }), { cut: true, rim: .8, char: .4, frost: .7, trans: .25, withC: new THREE.Color(.36, .3, .24) }),
  leaf: patch(std({ map: LEAF.map, normalMap: LEAF.normal, normalScale: new THREE.Vector2(.9, .9), vertexColors: true, alphaTest: .45, side: THREE.DoubleSide, roughness: .52, skinning: true }), { cut: true, flut: true, rim: .55, char: 1, frost: 1, trans: 1, back: true, withC: new THREE.Color(.46, .33, .18) }),
  berry: patch(phys({ vertexColors: true, roughness: .3, clearcoat: .9, clearcoatRoughness: .12, emissive: 0x000000, skinning: true }), { cut: true, rim: .5, frost: .8, trans: .35, withC: new THREE.Color(.13, .09, .08) }),
  bloom: patch(phys({ map: BLOOM.map, normalMap: BLOOM.normal, normalScale: new THREE.Vector2(.8, .8), vertexColors: true, alphaTest: .5, side: THREE.DoubleSide, roughness: .7, sheen: new THREE.Color(.22, .06, .1), envMapIntensity: .5, skinning: true }), { rim: .6, char: .8, bloom: true, trans: 1.2, frost: .5, withC: new THREE.Color(.42, .32, .24) }),
  heart: patch(phys({ vertexColors: true, roughness: .28, clearcoat: .6, clearcoatRoughness: .2, metalness: .02, skinning: true }), { rim: .4, heart: true }),
  soil: new THREE.MeshStandardMaterial({ map: soilMap, transparent: true, depthWrite: false, roughness: 1, color: new THREE.Color(1, 1, 1).lerp(new THREE.Color(.75, .95, .7), MOSS * .4), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
 };
 // the roots under the meadow, seen only in x-ray: lines of light the heartbeat runs out along
 const XRAY = { value: 0 };
 M.xray = new THREE.ShaderMaterial({
  uniforms: { uX: XRAY, uVein: U.vein, uVeinC: U.veinC, uTime: U.time },
  vertexShader: 'attribute vec2 aVn;\nvarying vec2 vVn;\nvarying float vF;\nvoid main(){ vVn = aVn; vec4 mv = modelViewMatrix * vec4(position, 1.0); vF = -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform float uX; uniform vec4 uVein; uniform vec3 uVeinC; uniform float uTime; varying vec2 vVn; varying float vF;\n' +
   'void main(){ float p = exp(-pow((vVn.y - uVein.y) * 3.2, 2.)) * (uVein.z + .35); float rest = .22 + .1 * sin(uTime * 1.3 - vVn.y * 5.);\n' +
   ' vec3 c = mix(vec3(.55, .32, .5), uVeinC * 2.4, clamp(p * 1.4, 0., 1.)) * (rest + p * 1.6) * vVn.x; gl_FragColor = vec4(c * uX, 1.); }',
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
 });
