# make_effects.py: the Battle Music Lab's first shelf: Carnival of Ashes, whole, through different studio effects, so
# Chris can hear what each does. Usage: python3 moon-faire-witches/music/lab/make_effects.py
# Reads music/original/battle-carnival-of-ashes.mp3; writes music/lab/out/fx-*.webm and fx.json (what each one is).
import os, sys, json, subprocess, tempfile
sys.path.insert(0, os.path.dirname(__file__))
import fx

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
SRC = os.path.join(HERE, '..', 'original', 'battle-carnival-of-ashes.mp3')


def source():
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, 's.wav')
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', SRC, '-map', '0:a', '-ar', '44100', '-ac', '2', '-c:a', 'pcm_f32le', w], check=True)
        return fx.load(w)


# each: file name, title, what was done, what it does to the feel, how it could be used in the game, and the recipe
VERSIONS = [
    ('fx-0-as-made', 'As you made it', 'Nothing: the song as it is, at the same loudness as the others.',
     'For comparing.', '', lambda x: x),
    ('fx-1-slower', 'Slower', 'Played 20% slower; the pitch stays the same.',
     'Heavier and dragging, like the carnival is winding down.', 'Every fight, if the original feels too quick for turn-based battles.',
     lambda x: fx.slower(x, 0.8)),
    ('fx-2-lower', 'Lower', 'Moved down three half-steps; the speed stays the same.',
     'Darker and deeper; the music box sounds older and heavier.', 'Boss fights, so they sound darker than ordinary ones.',
     lambda x: fx.pitch(x, -3)),
    ('fx-3-slowed-reverb', 'Slowed and in a big room', 'Played slower like a record turned down (15%, so it is also lower), in a big echoing room.',
     'Dreamy, ghostly and far off: the "slowed and reverb" sound.', 'A witch’s trance, Curtain Call, or the quiet after a fight is won.',
     lambda x: fx.reverb(fx.tape(x, 0.85), wet=0.42, sec=4.2)),
    ('fx-4-far-away', 'From far away', 'The highs cut away and a lot of echo, as if heard through fog or a wall.',
     'Soft, muffled, in the background; tense rather than loud.', 'While you choose a move, then back to full when a blow lands; or when a witch is nearly beaten.',
     lambda x: fx.reverb(fx.highpass(fx.lowpass(x, 950), 50), wet=0.5, sec=3.6)),
    ('fx-5-warped', 'Warped tape', 'Two half-steps lower with a slow, wavering wobble, like an old tape or a music box running down.',
     'Unsettling and haunted: the carnival is wrong somehow.', 'Shadow wraiths and the final boss.',
     lambda x: fx.reverb(fx.lowpass(fx.wobble(fx.pitch(x, -2), 0.4, 0.16), 5200), wet=0.25, sec=2.8)),
    ('fx-6-dark-mix', 'Dark mix (my pick for battles)', 'A little of each: 12% slower, two half-steps lower, the harshest highs softened, a faint wobble and a medium room.',
     'Still Carnival of Ashes, still has a beat, but darker, heavier and more ethereal.', 'Every fight, quietly in the background.',
     lambda x: fx.reverb(fx.wobble(fx.lowpass(fx.pitch(fx.slower(x, 0.88), -2), 6500), 0.3, 0.06), wet=0.28, sec=2.6)),
]

if __name__ == '__main__':
    x = source(); meta = []
    only = sys.argv[1:]
    for name, title, did, feel, use, f in VERSIONS:
        if only and name not in only: continue
        y = fx.fade(f(x), 0.02, 0.05)
        out = os.path.join(OUT, name + '.webm'); fx.encode(y, out)
        meta.append({'file': name + '.webm', 'title': title, 'did': did, 'feel': feel, 'use': use, 'seconds': round(y.shape[1] / fx.SR, 1)})
        print(name, meta[-1]['seconds'], 's', os.path.getsize(out) // 1024, 'KB', flush=True)
    if not only: json.dump(meta, open(os.path.join(OUT, 'fx.json'), 'w'), indent=1)
