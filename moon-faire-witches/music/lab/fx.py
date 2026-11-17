# fx.py: the small sound tools the Battle Music Lab is made with (moon-faire-witches/music/lab/). Each takes and gives
# a stereo array shaped (2, samples) at 44100 Hz. Written November 17, 2026, for Chris's "Carnival of Ashes" experiments;
# kept general so any song can go through them.
#   ff(x, filter)       run a song through an ffmpeg audio filter (rubberband for speed and pitch, vibrato, ...)
#   slower(x, k)        play at k times the speed, same pitch (0.8 = 20% slower)
#   pitch(x, semis)     move the pitch, same speed (-3 = three half-steps lower)
#   tape(x, k)          speed and pitch move together, like a record played slow (0.85)
#   reverb(x, ...)      a big dark room (made from fading noise)
#   lowpass / highpass  cut the highs / the lows
#   paulstretch(x, k)   smear a passage k times longer into a floating chord (the "ethereal pad" trick)
#   fade(x, a, b)       fade in over a seconds and out over b seconds
#   encode(x, out)      level to -20 LUFS (the game's songs' level) and save as Opus in WebM, 40 kbps
import os, subprocess, tempfile, json
import numpy as np
import soundfile as sf
import scipy.signal as ss

SR = 44100
RNG = np.random.default_rng(20261117)


def load(path):
    x, sr = sf.read(path, always_2d=True, dtype='float32')
    assert sr == SR, sr
    return x.T.copy()


def save(path, x):
    sf.write(path, np.clip(x, -1, 1).T, SR, subtype='FLOAT')


def ff(x, af):
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, 'a.wav'), os.path.join(d, 'b.wav')
        save(a, x)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', a, '-af', af, '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_f32le', b], check=True)
        return load(b)


def slower(x, k): return ff(x, f'rubberband=tempo={k}:transients=crisp')
def pitch(x, semis): return ff(x, f'rubberband=pitch={2 ** (semis / 12):.6f}:formant=preserved')
def tape(x, k): return ff(x, f'asetrate={int(SR * k)},aresample={SR}')
def wobble(x, rate=0.45, depth=0.12): return ff(x, f'vibrato=f={rate}:d={depth}')


def lowpass(x, f, order=4):
    sos = ss.butter(order, f, 'low', fs=SR, output='sos'); return ss.sosfiltfilt(sos, x, axis=1).astype('float32')


def highpass(x, f, order=2):
    sos = ss.butter(order, f, 'high', fs=SR, output='sos'); return ss.sosfiltfilt(sos, x, axis=1).astype('float32')


def room(sec=3.2, bright=6000, dark=900, pre=0.025):
    """A stereo impulse response: fading noise that gets darker as it fades."""
    n = int(sec * SR); t = np.arange(n) / SR
    ir = np.zeros((2, n + int(pre * SR)), 'float32')
    for c in range(2):
        noise = RNG.standard_normal(n).astype('float32')
        lo = lowpass(noise[None], dark, 2)[0]; hi = lowpass(noise[None], bright, 2)[0]
        mix = np.exp(-t / (sec * 0.25))            # bright early, dark late
        tail = (hi * mix + lo * (1 - mix)) * np.exp(-6.9 * t / sec)
        ir[c, int(pre * SR):] = tail
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def reverb(x, wet=0.35, sec=3.2, bright=6000, dark=900):
    ir = room(sec, bright, dark)
    w = np.stack([ss.fftconvolve(x[c], ir[c])[: x.shape[1] + ir.shape[1] - 1] for c in range(2)])
    out = np.zeros_like(w); out[:, : x.shape[1]] = x
    w *= np.sqrt(np.mean(x ** 2) / max(np.mean(w ** 2), 1e-12))  # the room as loud as the dry song before mixing
    return (out * (1 - wet) + w * wet).astype('float32')


def fade(x, a=0.0, b=0.0):
    x = x.copy(); n = x.shape[1]
    if a: k = int(a * SR); x[:, :k] *= np.linspace(0, 1, k) ** 2
    if b: k = int(b * SR); x[:, n - k:] *= np.linspace(1, 0, k) ** 2
    return x


def paulstretch(x, k, win=0.5):
    """Paul's extreme stretch: each window keeps its sound but loses its timing, so a passage becomes a floating cloud."""
    w = int(win * SR) // 2 * 2; half = w // 2
    window = (1 - np.linspace(-1, 1, w) ** 2) ** 1.25
    n_out = int(x.shape[1] * k); out = np.zeros((2, n_out + w), 'float32')
    step_in = half / k; pos = 0.0; o = 0
    while o < n_out:
        i = int(pos)
        for c in range(2):
            seg = x[c, i:i + w]
            if len(seg) < w: seg = np.pad(seg, (0, w - len(seg)))
            spec = np.abs(np.fft.rfft(seg * window))
            ph = RNG.uniform(0, 2 * np.pi, len(spec))
            out[c, o:o + w] += np.fft.irfft(spec * np.exp(1j * ph), w) * window
        pos += step_in; o += half
        if pos >= x.shape[1] - 1: pos = 0.0
    out = out[:, :n_out]
    return (out / max(np.abs(out).max(), 1e-9) * 0.5).astype('float32')


def loopify(x, xfade):
    """Make x loop with no seam: its last xfade seconds are blended into its start (the result is xfade shorter)."""
    k = int(xfade * SR); head, body, tail = x[:, :k], x[:, k:-k], x[:, -k:]
    g = np.sin(np.linspace(0, np.pi / 2, k))      # equal-power: the tail fades out as the head fades in
    return np.concatenate([head * g + tail * np.cos(np.linspace(0, np.pi / 2, k)), body], axis=1)


def encode(x, out, lufs=-20, kbps=40):
    with tempfile.TemporaryDirectory() as d:
        a = os.path.join(d, 'a.wav'); save(a, x * 0.9 / max(np.abs(x).max(), 1e-9))
        r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', a, '-af', f'loudnorm=I={lufs}:TP=-2:LRA=14:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
        m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
        af = (f"loudnorm=I={lufs}:TP=-2:LRA=14:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
              f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', a, '-af', af, '-c:a', 'libopus', '-b:a', f'{kbps}k', '-vbr', 'on', out], check=True)
