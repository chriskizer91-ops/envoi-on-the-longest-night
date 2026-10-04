// songs.js: Chris's songs (art/music/, sent October 3; "The three compressed songs are needed to go in", October 4):
// Moonlit Forest Path in the towns, and Herbal Decay in the wilds and over the world map. Each loops from an <audio>
// element, streamed as it plays rather than decoded whole, fades in and out, and carries on where it left off after a
// fight or a visit elsewhere. The songs pause while the game is out of sight. The made-up music (thareia-audio.js) keeps
// the rest: the title, the marsh, the ruins and the flight; and the fights keep their original battle theme (sound.js),
// at Chris's word: "replace the battle mp3 with the original battle music" (October 4). His Herbal Decay Battle stays in
// art/music/, out of the game.
// Songs.create({ src, ctx, onFail }) -> { has(id), play(id), stop(fade), playing(), setVolume(v), state() }
//   src: an art path to its address (game.js's); ctx: the game's AudioContext, only for browsers that won't turn an
//   <audio> element down (iPhones); onFail(id): a song couldn't be played, so the made-up music takes its place
//   setVolume(v): the game's music volume, 0 to 1 (0.75 is Normal); state(): each song's element as it stands, for tests
// Defines window.Songs.
(function () {
  'use strict';
  // each song, and how loud it plays at Normal: as loud as the made-up music it stands in for. Measured with ffmpeg's
  // ebur128 (October 4): the songs are -14.5 and -16.1 LUFS; the made-up town and travel pieces -23.2 and -23.8 at Normal
  const SONGS = {
    town: { file: "art/music/towns-moonlit-forest-path.webm", level: 0.37 },
    wilds: { file: "art/music/wilds-herbal-decay.webm", level: 0.41 },
  };
  const FADE = 0.8; // seconds
  // some browsers (iPhones) keep an <audio> element's volume at 1 whatever it's set to
  const canTurnDown = (() => { try { const t = new Audio(); t.volume = 0.5; return t.volume === 0.5; } catch (e) { return true; } })();

  function create(o) {
    o = o || {};
    const src = o.src || ((p) => p), A = {}, failed = {}, fades = {};
    let cur = null, vol = 0.75;
    const target = (id) => Math.max(0, Math.min(1, SONGS[id].level * vol / 0.75));
    const level = (a) => (a.gain ? a.gain.gain.value : a.volume);
    function setLevel(a, v) { if (a.gain) a.gain.gain.value = v; else a.volume = v; }
    // the song's <audio> element, made when it's first wanted. If the page can't play it from where it is (a published
    // page whose rules refuse it), it's fetched and played from memory instead; if that fails too, it's given up
    function audio(id) {
      if (A[id]) return A[id];
      const a = new Audio(); a.loop = true; a.preload = 'auto';
      const ctx = !canTurnDown && o.ctx && o.ctx();
      if (ctx) { try { const g = ctx.createGain(); ctx.createMediaElementSource(a).connect(g); g.connect(ctx.destination); a.gain = g; } catch (e) { /* plays at full */ } }
      setLevel(a, 0);
      let tried = false;
      a.addEventListener('error', async () => {
        const url = src(SONGS[id].file);
        if (!tried && !url.startsWith('data:')) {
          tried = true;
          try { const r = await fetch(url); if (!r.ok) throw new Error('no song'); a.src = URL.createObjectURL(await r.blob()); if (cur === id) go(id); return; } catch (e) { /* given up below */ }
        }
        failed[id] = true; clearInterval(fades[id]); a.pause();
        if (cur === id) cur = null;
        if (o.onFail) o.onFail(id);
      });
      a.src = src(SONGS[id].file);
      A[id] = a; return a;
    }
    function fade(id, to, secs, then) {
      const a = A[id]; clearInterval(fades[id]);
      const from = level(a), t0 = performance.now(), ms = Math.max(1, secs * 1000);
      fades[id] = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        setLevel(a, from + (to - from) * k);
        if (k >= 1) { clearInterval(fades[id]); if (then) then(); }
      }, 40);
    }
    // start the song (or keep it going) and bring it up to its level; while the game is out of sight it waits
    function go(id) {
      if (document.hidden) return;
      const a = A[id], p = a.play();
      if (p && p.catch) p.catch(() => { /* not allowed yet, or stopped: the next play() tries again */ });
      fade(id, target(id), FADE);
    }
    function play(id) {
      if (!SONGS[id] || failed[id]) return false;
      if (cur === id) return true;
      if (cur) stop(FADE);
      cur = id;
      audio(id);
      go(id);
      return true;
    }
    function stop(secs) {
      if (!cur) return;
      const id = cur; cur = null;
      fade(id, 0, secs == null ? FADE : secs, () => { if (cur !== id) A[id].pause(); });
    }
    function setVolume(v) { vol = v; if (cur) fade(cur, target(cur), 0.1); }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { for (const id in A) A[id].pause(); } else if (cur) go(cur);
    });
    const state = () => ({ playing: cur, songs: Object.fromEntries(Object.keys(A).map((id) => [id, { paused: A[id].paused, at: A[id].currentTime, level: level(A[id]), failed: !!failed[id] }])) });
    return { has: (id) => !!SONGS[id] && !failed[id], play, stop, playing: () => cur, setVolume, state };
  }
  window.Songs = { create, SONGS };
})();
