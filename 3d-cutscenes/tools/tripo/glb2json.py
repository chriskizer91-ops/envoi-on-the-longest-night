# glb2json.py: turns a GLB into a .json glTF (its geometry, still compressed, inside it as base64) and its textures as
# separate image files beside it, because an artifact serves .json and .jpg but not .glb.
# Usage: python3 glb2json.py <in.glb> <outdir> <name>
import json, struct, sys, base64, os
src, outdir, name = sys.argv[1:4]
b = open(src, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl])
bl = struct.unpack('<I', b[20 + jl:24 + jl])[0]; BIN = b[28 + jl:28 + jl + bl]
imgViews = {}
for i, im in enumerate(j.get('images', [])):
    bv = j['bufferViews'][im['bufferView']]; data = BIN[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    ext = '.jpg' if im.get('mimeType') == 'image/jpeg' else '.png' if im.get('mimeType') == 'image/png' else '.webp'
    fn = f'{name}{"" if i == 0 else "-" + str(i)}{ext}'; open(os.path.join(outdir, fn), 'wb').write(data)
    imgViews[im['bufferView']] = True; im.pop('bufferView'); im['uri'] = fn
# compact buffer 0 without the image views; views (and meshopt's own references) into buffer 0 get new offsets
new, remap = bytearray(), {}
def take(off, ln):
    pad = (-len(new)) % 16; new.extend(b'\0' * pad); o = len(new); new.extend(BIN[off:off + ln]); return o
for vi, bv in enumerate(j['bufferViews']):
    if vi in imgViews: continue
    if bv.get('buffer', 0) == 0 and 'byteLength' in bv:
        bv['byteOffset'] = take(bv.get('byteOffset', 0), bv['byteLength'])
    mo = bv.get('extensions', {}).get('EXT_meshopt_compression')
    if mo and mo.get('buffer', 0) == 0:
        mo['byteOffset'] = take(mo.get('byteOffset', 0), mo['byteLength'])
# drop the image views, renumbering the rest
keep = [vi for vi in range(len(j['bufferViews'])) if vi not in imgViews]; idx = {old: n for n, old in enumerate(keep)}
j['bufferViews'] = [j['bufferViews'][vi] for vi in keep]
for a in j.get('accessors', []):
    if 'bufferView' in a: a['bufferView'] = idx[a['bufferView']]
    sp = a.get('sparse')
    if sp: sp['indices']['bufferView'] = idx[sp['indices']['bufferView']]; sp['values']['bufferView'] = idx[sp['values']['bufferView']]
j['buffers'][0]['byteLength'] = len(new); j['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(bytes(new)).decode()
out = os.path.join(outdir, name + '.json'); json.dump(j, open(out, 'w'), separators=(',', ':'))
print(name, 'json', os.path.getsize(out), 'bytes; images', [im['uri'] for im in j.get('images', [])], '; extensions', j.get('extensionsUsed'))
