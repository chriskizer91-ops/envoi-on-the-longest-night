// page.js: the cutscene's page for Chris's phone. It gets the cutscene ready behind a loading line (the module builds
// the place and the cast), shows the start screen over the opening view, plays it on a tap (a browser lets a page make
// sound only after one), and afterwards shows an end card with how many frames a second this screen drew, over the
// last picture. Detail: Light, Phone or Laptop (a phone starts at Phone); the choice is kept in this browser.
// ?test drives the frames from window.__cs instead of the clock, for headless pictures; ?q=light|phone|laptop sets the detail.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const Qs = new URLSearchParams(location.search), TEST = Qs.has('test');
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };
  const PHONE = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(innerWidth, innerHeight) < 560;
  const OK = ['light', 'phone', 'laptop'], KEY = 'cs-finale-opening-q';
  let quality = OK.includes(Qs.get('q')) ? Qs.get('q') : OK.includes(store.get(KEY)) ? store.get(KEY) : PHONE ? 'phone' : 'laptop';
  const NAMES = { light: 'Light', phone: 'Phone', laptop: 'Laptop' };
  const CS = window.CUTSCENES && window.CUTSCENES['finale-opening'];
  let handle = null;
  if (TEST) document.body.classList.add('test');
  $('goNote').textContent = 'about ' + Math.round(CS ? CS.seconds : 72) + ' seconds, with sound';
  if (!PHONE) $('startNote').textContent = 'Made for the game on a phone; on a laptop, Laptop detail is the full one. Skip ends it at any moment.';

  function oops(t) { const o = $('oops'); o.textContent = t; o.hidden = false; }
  function clearStill() { document.querySelectorAll('#stage .envoi-cs-still').forEach((c) => c.remove()); document.body.classList.remove('ended'); }
  function markQ() { for (const q of OK) $('q' + NAMES[q]).setAttribute('aria-pressed', String(q === quality)); }
  function build() {
    if (!CS) { oops('The cutscene did not load. Reload the page to try again.'); return; }
    if (handle) handle.cancel();
    clearStill();
    $('load').hidden = false; $('start').hidden = true; $('endcard').hidden = true;
    handle = CS.prepare($('stage'), {
      quality, idle: true, soundButton: true, test: TEST,
      volume: { music: 1, effects: 1, surroundings: 1 },
      onProgress(f, w) { $('loadBar').style.width = Math.round(f * 100) + '%'; $('loadBar').parentNode.setAttribute('aria-valuenow', String(Math.round(f * 100))); if (w) $('loadStep').textContent = w; }
    });
    const h = handle;
    h.ready.then(() => {
      if (h !== handle) return;
      $('load').hidden = true; $('start').hidden = false; markQ();
      if (TEST) { window.__cs = h.test; window.__cs.ready = true; }
    }, (e) => {
      if (h !== handle || (e && e.message === 'cancelled')) return;
      $('loadStep').textContent = 'It could not start here: ' + (e && e.message ? e.message : e) + '. It needs a browser with WebGL 2, such as a current Chrome, Edge, Firefox or Safari.';
      window.__err = String(e && e.stack || e);
    });
  }
  function play() {
    if (!handle) return;
    $('start').hidden = true;
    handle.start().then(ended);
  }
  function ended(why) {
    const s = CS.last || {};
    let f = s.fps ? 'about <b>' + s.fps + '</b> frames a second' + (s.worst ? ' (the slowest moment <b>' + s.worst + '</b>)' : '') + ', at ' + NAMES[s.quality] + ' detail' : 'skipped before it could be measured, at ' + NAMES[s.quality || quality] + ' detail';
    if (s.fps && s.sharpness && s.sharpness < 100) f += '. It drew the picture at <b>' + s.sharpness + '%</b> of its sharpness to keep up';
    const rows = [
      ['On this screen', f],
      ['The hand-over', 'It ends on the finale’s own framing: Io and Sol lower left, Halcyon and Noctara upper right, as the fight stands them. Skipping lands on the same picture.'],
      ['The words', 'The finale’s own three lines, still placeholders for the lore conversation.'],
      ['Made from', 'The cutscene Io and the game’s Sol, Halcyon and Noctara, as they are. The dead Moonwell, Misthollow below it and the Ironspire peaks are new, built after the finale’s painting, the walking maps and art request 11’s painting; every sound is made in code.']
    ];
    $('endRows').innerHTML = rows.map((r) => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join('');
    $('endTitle').textContent = why === 'skipped' ? 'Skipped to the hand-over' : 'That was the finale’s opening';
    const other = s.fps && s.fps < 24 && quality !== 'light' ? 'light' : quality === 'laptop' ? 'phone' : quality === 'light' ? 'phone' : (s.fps >= 28 ? 'laptop' : 'light');
    const b = $('otherQ'); b.dataset.q = other;
    b.innerHTML = { light: 'Lighter', phone: 'Phone detail', laptop: 'Sharper' }[other] + '<span>' + { light: 'for a slower phone', phone: 'what a phone gets first', laptop: 'the full detail, for a laptop' }[other] + '</span>';
    document.body.classList.add('ended'); $('endcard').hidden = false;
    window.__ended = s;
  }
  function setQ(q) { if (!OK.includes(q)) return; quality = q; store.set(KEY, q); build(); }
  $('go').addEventListener('click', play);
  $('again').addEventListener('click', build);
  $('otherQ').addEventListener('click', (e) => setQ(e.currentTarget.dataset.q));
  for (const q of OK) $('q' + NAMES[q]).addEventListener('click', () => { if (q !== quality) setQ(q); });
  build();
})();
