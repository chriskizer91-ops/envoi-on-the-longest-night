// talk.js: the dialogue box (plan phase 5: "when anyone speaks, their painted portrait appears beside the words"). Io,
// Sol and Ysmera have painted portraits (art request 05); the townsfolk show their paper doll's head and shoulders (the
// game passes them in with the portraits) until their paintings come; anyone else, a pixel portrait, their walking
// sprite's head and shoulders blown up. Words appear a few letters at a time; a tap, Enter or Space
// shows the rest, then goes on. A line with no speaker is narration. Choices are buttons under the words.
// Talk.create(host, { portraits: { id: { name, src } }, people: (id) -> { name, look } | null, src(path), speed() -> 0 to 2 })
//   -> { say(lines) -> Promise, ask(who, text, choices) -> Promise<index>, busy }
//   a line is [who, text] or a string (narration)
// Needs makeFolk (sprites.js). Defines window.Talk.
(function () {
  'use strict';
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function create(host, opts) {
    const box = el('div', { class: 'talk win', hidden: '', role: 'dialog', 'aria-live': 'polite' }, host);
    const faceWrap = el('div', { class: 'talk-face' }, box);
    const img = el('img', { alt: '' }, faceWrap), pix = el('canvas', { width: '112', height: '112', 'aria-hidden': 'true' }, faceWrap);
    const words = el('div', { class: 'talk-words' }, box), who = el('div', { class: 'talk-who' }, words), said = el('p', { class: 'talk-said' }, words);
    const choiceBox = el('div', { class: 'talk-choices' }, words);
    const next = el('div', { class: 'talk-next', 'aria-hidden': 'true' }, words, '▼');
    const pg = pix.getContext('2d'); pg.imageSmoothingEnabled = false;
    const sprites = {};
    let typing = null, advance = null, busy = false;

    function setFace(id) {
      const pr = id && opts.portraits[id];
      if (pr) { faceWrap.hidden = false; img.hidden = false; pix.hidden = true; img.src = opts.src ? opts.src(pr.src) : pr.src; img.alt = pr.name; who.textContent = pr.name; return; }
      const p = id && opts.people && opts.people(id);
      if (p) {
        faceWrap.hidden = false; img.hidden = true; pix.hidden = false; who.textContent = p.name;
        const s = sprites[p.look] || (sprites[p.look] = makeFolk(p.look, 1));
        const [sx, sy] = s.frame('s', 0);
        pg.clearRect(0, 0, 112, 112); pg.fillStyle = '#151236'; pg.fillRect(0, 0, 112, 112);
        // head and shoulders: the sprite's top 28 rows, four times over
        const top = Math.max(0, s.h - 2 - Math.round((p.look === 'child' ? 30 : p.look === 'gnome' ? 27 : 40)));
        pg.drawImage(s.canvas, sx, sy + top, 28, 28, 0, 0, 112, 112);
        return;
      }
      faceWrap.hidden = true; who.textContent = id && opts.people && !p ? id : '';
    }
    // the words come a few letters at a time, as fast as the game's setting says (opts.speed: 0 for all at once)
    function show(text) {
      clearInterval(typing); said.textContent = ''; show.full = text;
      const sp = opts.speed ? opts.speed() : 1;
      if (REDUCED || !sp) { said.textContent = text; return; }
      let i = 0; typing = setInterval(() => { i += 2 * sp; said.textContent = text.slice(0, Math.floor(i)); if (i >= text.length) { clearInterval(typing); typing = null; } }, 18);
    }
    function tap() {
      if (typing) { clearInterval(typing); typing = null; said.textContent = show.full; return; }
      if (advance) { const a = advance; advance = null; a(); }
    }
    box.addEventListener('click', (e) => { if (e.target.closest('.talk-choices')) return; tap(); });
    window.addEventListener('keydown', (e) => { if (box.hidden || choiceBox.childElementCount) return; if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') { e.preventDefault(); e.stopPropagation(); tap(); } }, true);

    async function say(lines) {
      busy = true; box.hidden = false; choiceBox.textContent = ''; next.hidden = false;
      for (const ln of lines) {
        const [id, text] = typeof ln === 'string' ? [null, ln] : ln;
        setFace(id); box.classList.toggle('narr', !id); show(text);
        await new Promise((r) => { advance = r; });
      }
      box.hidden = true; busy = false;
    }
    function ask(id, text, choices) {
      busy = true; box.hidden = false; setFace(id); box.classList.toggle('narr', !id); show(text); next.hidden = true; choiceBox.textContent = '';
      return new Promise((res) => {
        choices.forEach((c, i) => {
          const b = el('button', { type: 'button', class: 'go' + (i ? ' alt' : '') }, choiceBox, c);
          b.addEventListener('click', (e) => { e.stopPropagation(); choiceBox.textContent = ''; next.hidden = false; box.hidden = true; busy = false; res(i); });
          if (!i) setTimeout(() => b.focus({ preventScroll: true }), 30);
        });
      });
    }
    return { say, ask, get busy() { return busy; }, box };
  }
  window.Talk = { create };
})();
