# make_chops.py: the Battle Music Lab's second shelf: Carnival of Ashes cut into pieces and put back together as new
# music. Usage: python3 moon-faire-witches/music/lab/make_chops.py
#   chop-1-rebuilt:   the song's own beats rearranged into a new 60-second loop. Each cut is made only where the music on
#                     both sides matches (the same chord, the same place in the bar, the "infinite jukebox" trick), and
#                     every piece is set to one steady speed, so the joins don't stumble.
#   chop-2-rebuilt-dark: the same loop through the dark mix (slower, lower, softer highs, a faint wobble, a room).
#   chop-3-fractured: an ethereal piece built from fragments: the music box's quietest bars smeared into a floating
#                     chord, its little tunes slowed and echoing (some played backwards, as swells), a slow heartbeat
#                     made from the song's own kick drum, and its heaviest hits far off like thunder.
# Reads music/original/battle-carnival-of-ashes.mp3; writes music/lab/out/chop-*.webm and chops.json.
import os, sys, json
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import fx
from make_effects import source, OUT
import librosa

SR = fx.SR
BEAT = 60 / 136          # the steady beat everything is set to (136 a minute: the song's own middle speed)


def analyse(x):
    """The song's beats, and for each beat: its chord (chroma), its tone colour (MFCC) and how loud it is."""
    m = librosa.to_mono(x); hop = 256
    _, beats = librosa.beat.beat_track(y=m, sr=SR, hop_length=hop, units='samples', start_bpm=140, tightness=200)
    beats = np.asarray(beats)
    C = librosa.feature.chroma_cqt(y=librosa.effects.harmonic(m), sr=SR, hop_length=hop)
    M = librosa.feature.mfcc(y=m, sr=SR, hop_length=hop, n_mfcc=13)
    fr = beats // hop
    Cb = librosa.util.sync(C, fr, aggregate=np.median)[:, 1:len(beats)]
    Mb = librosa.util.sync(M, fr, aggregate=np.mean)[:, 1:len(beats)]
    rms = np.array([np.sqrt(np.mean(m[beats[i]:beats[i + 1]] ** 2)) for i in range(len(beats) - 1)])
    nb = len(beats) - 1
    Cb = Cb / (np.linalg.norm(Cb, axis=0, keepdims=True) + 1e-9)
    Mz = (Mb - Mb.mean(1, keepdims=True)) / (Mb.std(1, keepdims=True) + 1e-9); Mz /= np.linalg.norm(Mz, axis=0, keepdims=True) + 1e-9
    return beats, Cb[:, :nb], Mz[:, :nb], rms


def context_sim(F, i, j, before=4, after=4):
    """How alike the music around beat i is to the music around beat j (1 = the same)."""
    ks = [k for k in range(-before, after) if 0 <= i + k < F.shape[1] and 0 <= j + k < F.shape[1]]
    return float(np.mean([F[:, i + k] @ F[:, j + k] for k in ks]))


def rebuilt(x):
    """Plays the song's middle in a new order: the second quiet music box and the last heavy part (114-136 s), then a cut
    back into the first heavy part, which runs on through the first quiet music box and the build into the middle
    heavy part, arriving back where the loop began. The only new cut is the one jump; the loop's seam is the song's own
    join, so it can't stumble."""
    beats, C, M, rms = analyse(x)
    F = np.vstack([C * 1.0, M * 0.6]); F /= np.linalg.norm(F, axis=0, keepdims=True)
    ib = np.diff(beats); sec = beats[:-1] / SR
    near = lambda s: int(np.argmin(np.abs(sec - s)))
    start = near(114.0)
    best = None
    for e in range(near(132.0), near(137.0)):
        for j in range(near(52.0), near(80.0)):
            if abs(np.log(np.median(ib[j:j + 8]) / np.median(ib[e - 8:e]))) > 0.08: continue
            sc = context_sim(F, e, j, 6, 6)
            if best is None or sc > best[0]: best = (sc, e, j)
    sc, e, j = best
    path = list(range(start, e)) + list(range(j, start))
    jumps = [(e - start, e, j, sc)]
    loop_sim = 1.0
    # render: each run of consecutive beats is cut whole and set to the steady beat, then the runs are joined with
    # short equal-power blends that start a hair before each beat (so no attack is cut)
    runs, cur = [], [path[0]]
    for b in path[1:]:
        if b == cur[-1] + 1: cur.append(b)
        else: runs.append(cur); cur = [b]
    runs.append(cur)
    pre, xf = int(0.012 * SR), int(0.018 * SR)
    pieces = []
    for r in runs:
        a, b = beats[r[0]] - pre, beats[r[-1] + 1] - pre
        seg = x[:, a:b + xf]
        k = (b - a) / SR / (len(r) * BEAT)                            # its speed against the steady beat
        seg = fx.ff(seg, f'rubberband=tempo={k:.5f}:transients=crisp') if abs(k - 1) > 0.004 else seg
        want = int(round(len(r) * BEAT * SR)) + xf                   # exactly its beats long, so the beat never drifts
        seg = seg[:, :want] if seg.shape[1] >= want else np.pad(seg, ((0, 0), (0, want - seg.shape[1])))
        pieces.append(seg)
    out = pieces[0]
    for p in pieces[1:]:
        g = np.sin(np.linspace(0, np.pi / 2, xf))
        body = out[:, :-xf]; join = out[:, -xf:] * g[::-1] + p[:, :xf] * g
        out = np.concatenate([body, join, p[:, xf:]], axis=1)
    out = out[:, :int(round(len(path) * BEAT * SR)) + xf]
    out = fx.loopify(out, xf / SR)
    info = {'beats': len(path), 'runs': len(runs), 'jumps': [{'at_beat': j[0], 'match': j[3]} for j in jumps], 'loop_match': round(loop_sim, 3),
            'from_seconds': [round(beats[r[0]] / SR, 1) for r in runs]}
    return out, info


def wrap(y, n):
    """Fold everything past n samples back onto the start (echoes that ring past the loop's end carry into its start)."""
    y = y.copy()
    while y.shape[1] > n:
        k = min(n, y.shape[1] - n); y[:, :k] += y[:, n:n + k]; y = np.concatenate([y[:, :n], y[:, n + k:]], axis=1)
    return y


def through(f, loop):
    """Put a loop through effects and keep it a loop: three rounds go in, the middle round comes out."""
    y = f(np.concatenate([loop, loop, loop], axis=1)); p = y.shape[1] // 3
    return y[:, p:2 * p]


def fractured(x):
    beats, C, M, rms = analyse(x)
    t = lambda s: int(s * SR)
    # 1. the bed: the darkest quiet bars (about 117-123 s) and the outro (138-146 s), smeared into one floating chord
    pad = fx.paulstretch(x[:, t(116.5):t(123)], 9.0, 0.6)[:, :t(56)]
    pad2 = fx.paulstretch(x[:, t(138):t(146)], 7.0, 0.6)[:, :t(56)]
    G = 2 * BEAT                       # the slow pulse: half the song's speed (68 a minute)
    L = int(round(52 / G)) * G; n = t(L) + t(12); out = np.zeros((2, n), 'float32')
    bed = fx.loopify(fx.lowpass(pad * 0.7 + pad2 * 0.5, 2800)[:, :t(L) + t(2)], 2.0)   # the bed loops on its own
    out[:, :bed.shape[1]] += bed * 0.9
    # 2. little tunes: two-bar phrases from the quiet music box, slowed (same pitch), echoing; some backwards first
    qb = [i for i in range(len(rms) - 8) if rms[i:i + 8].max() < np.quantile(rms, 0.3)]
    phrases = []
    for i in qb:
        if phrases and i - phrases[-1] < 12: continue
        phrases.append(i)
    phrases = phrases[:6]
    slots = [2, 10, 18, 26, 34, 42, 50, 58]
    for k, slot in enumerate(slots):
        i = phrases[k % len(phrases)]
        seg = x[:, beats[i] - t(0.01):beats[i + 6]]
        seg = fx.fade(fx.slower(seg, 0.75), 0.02, 0.4)
        wet = fx.reverb(seg, wet=0.55, sec=4.5)
        at = t(slot * G / 2)
        if k % 3 == 1:                                         # a backwards swell that leads into it
            sw = fx.fade(wet[:, ::-1][:, -t(2.5):], 1.5, 0.0)
            a = max(0, at - sw.shape[1]); out[:, a:at] += sw[:, -(at - a):] * 0.5
        e = min(n, at + wet.shape[1]); out[:, at:e] += wet[:, :e - at] * 0.55
    # 3. the heartbeat: the song's own kick drum, low and soft, twice each slow beat (lub-dub)
    hb = [i for i in range(len(rms)) if rms[i] > np.quantile(rms, 0.85)]
    k0 = beats[hb[len(hb) // 2]]
    kick = fx.fade(fx.lowpass(x[:, k0 - t(0.005):k0 + t(0.25)], 140), 0.003, 0.12) * 2.2
    for s in range(int(L / G)):
        for off, v in ((0.0, 1.0), (0.22, 0.6)):
            a = t(s * G + off); out[:, a:a + kick.shape[1]] += kick[:, :n - a] * v
    # 4. thunder: the song's heaviest hits, lower, far away, every eight slow beats
    hits = sorted(hb, key=lambda i: -rms[i])[:3]
    for k, s in enumerate(range(4, int(L / G), 8)):
        a0 = beats[hits[k % len(hits)]]
        th = fx.reverb(fx.lowpass(fx.pitch(x[:, a0 - t(0.01):a0 + t(1.2)], -5), 500), wet=0.7, sec=5)
        th = fx.fade(th, 0.005, 1.0); a = t(s * G); e = min(n, a + th.shape[1]); out[:, a:e] += th[:, :e - a] * 0.6
    out = wrap(out, t(L))
    return out, {'seconds': round(out.shape[1] / SR, 1), 'phrases_from': [round(beats[i] / SR, 1) for i in phrases]}


CHOPS = [
    ('chop-1-rebuilt', 'Rebuilt', 'The song’s own beats cut up and rearranged into a new 60-second loop: quiet music box, heavy part, quiet, heavy, and a middle stretch that leads back to the start. Cuts are only made where both sides match, and every piece is set to one steady speed.',
     'Sounds like Carnival of Ashes, but a new order of its parts that loops forever with no ending or fade.', 'Every fight.'),
    ('chop-2-rebuilt-dark', 'Rebuilt, dark', 'The same rebuilt loop through the dark mix: 12% slower, two half-steps lower, softer highs, a faint wobble and a room.',
     'Darker and heavier, still with a steady beat.', 'Every fight, or only the bosses.'),
    ('chop-3-fractured', 'Fractured lullaby', 'Built from fragments: the quietest music-box bars smeared into a floating chord, its little tunes slowed and echoing (some backwards, as swells), a slow heartbeat made from its own kick drum, and its heaviest hits far off like thunder.',
     'Ethereal and ominous: no carnival left, only its ghost. Slow, with a heartbeat for a pulse.', 'Wraiths, the final boss, or as the danger-zone music.'),
]

if __name__ == '__main__':
    x = source(); meta = []
    loop, info1 = rebuilt(x)
    print('rebuilt', json.dumps(info1), flush=True)
    from make_effects import VERSIONS
    dark = [v for v in VERSIONS if v[0] == 'fx-6-dark-mix'][0][5]
    frac, info3 = fractured(x)
    print('fractured', json.dumps(info3), flush=True)
    for (name, title, did, feel, use), y, inf in zip(CHOPS, [loop, through(dark, loop), frac], [info1, None, info3]):
        p = os.path.join(OUT, name + '.webm'); fx.encode(y, p)
        meta.append({'file': name + '.webm', 'title': title, 'did': did, 'feel': feel, 'use': use, 'seconds': round(y.shape[1] / SR, 1), 'loops': True})
        print(name, meta[-1]['seconds'], 's', os.path.getsize(p) // 1024, 'KB', flush=True)
    json.dump(meta, open(os.path.join(OUT, 'chops.json'), 'w'), indent=1)
