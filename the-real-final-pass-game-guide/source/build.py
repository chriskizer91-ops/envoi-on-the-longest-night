#!/usr/bin/env python3
"""Builds the guide: guide.src.html + style.css + fonts + images -> one self-contained HTML file.
{{img:path}} becomes a data: URI of gb/img/<path> (webp/jpg/png); {{css}} becomes the stylesheet with the fonts inside."""
import base64, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out.html')
MIME = {'.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2'}

def uri(path):
    ext = os.path.splitext(path)[1]
    with open(path, 'rb') as f:
        return 'data:' + MIME[ext] + ';base64,' + base64.b64encode(f.read()).decode()

FONTS = [
    ('Barlow', 400, 'normal', 'barlow-latin-400-normal'), ('Barlow', 400, 'italic', 'barlow-latin-400-italic'),
    ('Barlow', 500, 'normal', 'barlow-latin-500-normal'), ('Barlow', 600, 'normal', 'barlow-latin-600-normal'),
    ('Barlow', 700, 'normal', 'barlow-latin-700-normal'),
    ('Barlow Condensed', 700, 'normal', 'barlow-condensed-latin-700-normal'),
    ('Barlow Condensed', 800, 'italic', 'barlow-condensed-latin-800-italic'),
    ('Barlow Condensed', 900, 'italic', 'barlow-condensed-latin-900-italic'),
    ('Cinzel', 400, 'normal', 'cinzel-latin-400-normal'), ('Cinzel', 600, 'normal', 'cinzel-latin-600-normal'),
    ('Cinzel', 900, 'normal', 'cinzel-latin-900-normal'),
    ('Michroma', 400, 'normal', 'michroma-latin-400-normal'),
    ('Share Tech Mono', 400, 'normal', 'share-tech-mono-latin-400-normal'),
]
faces = ''.join('@font-face{font-family:"%s";font-style:%s;font-weight:%d;font-display:swap;src:url(%s) format("woff2")}\n'
                % (fam, sty, w, uri(os.path.join(HERE, 'fonts', fn + '.woff2'))) for fam, w, sty, fn in FONTS)
css = faces + open(os.path.join(HERE, 'style.css'), encoding='utf-8').read()
import glob
sys.path.insert(0, HERE)
import mapspec
src = ''.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(HERE, 'src', '*.html'))))
src = re.sub(r'\{\{map:([a-z-]+)\}\}((?:(?!\{\{map:).)*?)\{\{/map\}\}', lambda m: mapspec.render(m.group(1), m.group(2)), src, flags=re.S)
src = re.sub(r'\{\{map:([a-z-]+)\}\}', lambda m: mapspec.render(m.group(1)), src)
missing = []
def img(m):
    p = os.path.join(HERE, 'img', m.group(1))
    if not os.path.exists(p):
        missing.append(m.group(1)); return ''
    return uri(p)
html = src.replace('{{css}}', css)
html = re.sub(r'\{\{img:([^}]+)\}\}', img, html)
if missing:
    print('MISSING IMAGES:', ', '.join(sorted(set(missing))))
# the artifact copy: the publish skeleton supplies doctype, head and body
if len(sys.argv) > 2:
    open(sys.argv[2], 'w', encoding='utf-8').write(html)
# the standalone file: a whole document that opens anywhere, offline
m = re.match(r'\s*(<title>.*?</title>\s*<meta name="description"[^>]*>)\s*', html, re.S)
headbits, body = (m.group(1), html[m.end():]) if m else ('', html)
full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + headbits + '\n'
        '<style>[hidden]{display:none!important}</style>\n</head>\n<body>\n' + body + '\n</body>\n</html>\n')
open(OUT, 'w', encoding='utf-8').write(full)
print('wrote', OUT, len(full.encode('utf-8')), 'bytes; artifact copy', len(html.encode('utf-8')))
