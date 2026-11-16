# montage.py: builds a patch out of several small clean strips of one painting, for surfaces that the painting only shows
# in narrow pieces (the boardwalk between stalls and carts, the plank walls between windows). Each row is a list of boxes;
# each box is scaled to the row height row_h (keeping its shape), then stretched top to bottom by squash (ground seen at a
# slant); the boxes of a row are set side by side, the rows are stacked, and every row is cut to the narrowest row's width.
# The result goes through seamless.make like any other patch.
from PIL import Image, ImageOps


def montage(img, rows, row_h, squash=1.0, mirror_rows=()):
    img = img.convert('RGB')
    h = max(1, round(row_h * squash))
    out_rows = []
    for i, boxes in enumerate(rows):
        parts = []
        for b in boxes:
            p = img.crop(tuple(int(v) for v in b))
            w = max(1, round(p.width * row_h / p.height))
            parts.append(p.resize((w, h), Image.LANCZOS))
        r = Image.new('RGB', (sum(p.width for p in parts), h))
        x = 0
        for p in parts:
            r.paste(p, (x, 0)); x += p.width
        if i in mirror_rows: r = ImageOps.mirror(r)
        out_rows.append(r)
    w = min(r.width for r in out_rows)
    m = Image.new('RGB', (w, h * len(out_rows)))
    for i, r in enumerate(out_rows):
        m.paste(r.crop((0, 0, w, h)), (0, i * h))
    return m


def even_colour(img, sigma_frac=0.12):
    # evens out the colour across a patch (lamp-warm on one side, moon-blue on the other) by dividing each colour channel
    # by a big soft blur of itself; seamless.make then evens out the brightness the same way
    import numpy as np
    from PIL import ImageFilter
    a = np.asarray(img.convert('RGB'), dtype=np.float32)
    s = max(2, sigma_frac * max(img.size))
    out = np.empty_like(a)
    for c in range(3):
        ch = a[..., c]
        blur = np.asarray(Image.fromarray(np.clip(ch, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s)), dtype=np.float32)
        out[..., c] = ch * (ch.mean() + 1.0) / (blur + 1.0)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
