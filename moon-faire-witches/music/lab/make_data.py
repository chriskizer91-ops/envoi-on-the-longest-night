# make_data.py: writes lab-data.js (the list the Battle Music Lab page shows) from out/fx.json and out/chops.json.
# Each file path is written in double quotes, as "./out/<name>.webm", so tools/build.mjs puts the song inside the page.
import json, os
H = os.path.dirname(os.path.abspath(__file__))
def rows(f): 
    L = json.load(open(os.path.join(H, 'out', f)))
    for r in L: r['file'] = './out/' + r['file']
    return L
fxl, ch = rows('fx.json'), rows('chops.json')
js = '// lab-data.js: made by make_data.py; don\'t edit by hand\n'
for name, L in (('LAB_FX', fxl), ('LAB_CHOPS', ch)):
    js += 'window.' + name + ' = [\n' + ''.join('  { file: "' + r['file'] + '", ' + json.dumps({k: v for k, v in r.items() if k != 'file'})[1:-1] + ' },\n' for r in L) + '];\n'
open(os.path.join(H, 'lab-data.js'), 'w').write(js)
print(js[:400])
