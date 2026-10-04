# glb.py: writes a one-mesh GLB (positions, normals, UVs, indices, one JPEG colour texture, not metal, a little rough),
# for the picture-to-3D model after its face is fixed. Usage: python3 glb.py <original.glb> <base> <out.glb>, where
# <base>.pos.bin / .nor.bin / .idx.bin / .jpg are the fixed arrays and texture; the UVs come from the original.
import json, struct, sys
import numpy as np
src, base, out = sys.argv[1:4]
b = open(src, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); bin0 = 20 + jl + 8
def acc(i, dt, n):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; s = bin0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(b, dtype=dt, count=a['count'] * n, offset=s)
prim = j['meshes'][0]['primitives'][0]
uv = acc(prim['attributes']['TEXCOORD_0'], np.float32, 2)
pos = np.fromfile(base + '.pos.bin', np.float32); nor = np.fromfile(base + '.nor.bin', np.float32); idx = np.fromfile(base + '.idx.bin', np.uint32)
jpg = open(base + '.jpg', 'rb').read()
assert len(pos) == len(nor) == len(uv) // 2 * 3, (len(pos), len(nor), len(uv))
chunks, views, off = [], [], 0
def add(data, target=None):
    global off
    pad = (-len(data)) % 4; data = data + b'\0' * pad
    v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data) - pad}
    if target: v['target'] = target
    views.append(v); chunks.append(data); off += len(data); return len(views) - 1
p3 = pos.reshape(-1, 3)
vP = add(pos.tobytes(), 34962); vN = add(nor.tobytes(), 34962); vU = add(uv.tobytes(), 34962); vI = add(idx.tobytes(), 34963); vJ = add(jpg)
n = len(p3)
J = {'asset': {'version': '2.0', 'generator': 'Tripo, face fixed by 3d-cutscenes'},
     'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'Io', 'mesh': 0}],
     'meshes': [{'name': 'Io', 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}, 'indices': 3, 'material': 0}]}],
     'materials': [{'name': 'Io', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0.0, 'roughnessFactor': 0.85}}],
     'textures': [{'source': 0, 'sampler': 0}], 'samplers': [{'magFilter': 9729, 'minFilter': 9987}], 'images': [{'bufferView': vJ, 'mimeType': 'image/jpeg'}],
     'accessors': [
        {'bufferView': vP, 'componentType': 5126, 'count': n, 'type': 'VEC3', 'min': p3.min(0).tolist(), 'max': p3.max(0).tolist()},
        {'bufferView': vN, 'componentType': 5126, 'count': n, 'type': 'VEC3'},
        {'bufferView': vU, 'componentType': 5126, 'count': n, 'type': 'VEC2'},
        {'bufferView': vI, 'componentType': 5125, 'count': len(idx), 'type': 'SCALAR'}],
     'bufferViews': views, 'buffers': [{'byteLength': off}]}
js = json.dumps(J, separators=(',', ':')).encode(); js += b' ' * ((-len(js)) % 4)
binb = b''.join(chunks)
with open(out, 'wb') as f:
    f.write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(binb)))
    f.write(struct.pack('<I4s', len(js), b'JSON')); f.write(js)
    f.write(struct.pack('<I4s', len(binb), b'BIN\0')); f.write(binb)
print('wrote', out, round((12 + 16 + len(js) + len(binb)) / 1e6, 2), 'MB,', len(idx) // 3, 'triangles')
