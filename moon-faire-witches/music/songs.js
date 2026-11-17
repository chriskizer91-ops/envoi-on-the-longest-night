// songs.js: the Witches' Songs page (songs.html). Its song files sit beside it; the build puts them inside the page.
(() => {
  'use strict';
  // every song: its file (in this folder), its name, and the group it plays in
  const GROUPS = [
    { name: 'Calm', where: 'The overworld map and the peaceful places.', songs: [
      { file: "./calm-moonlit-forest-path.webm", name: 'Moonlit Forest Path', note: 'Made for Follow Me Down Witch Way. Calm walking music.' },
      { file: "./calm-moonlit-forest-path-atmospheric.webm", name: 'Moonlit Forest Path (atmospheric)', note: 'The second version: the same feel, more atmosphere.' },
    ] },
    { name: 'Danger', where: 'The wild places, where a fight could start.', songs: [
      { file: "./danger-herbal-lullaby.webm", name: 'Herbal Lullaby', note: 'Carnival-tinted and atmospheric, building up and down.' },
      { file: "./danger-untitled.webm", name: 'Untitled', note: 'Its title in Suno is Chinese for "untitled track".' },
    ] },
    { name: 'Battle', where: 'The fights.', songs: [
      { file: "./battle-carnival-of-ashes.webm", name: 'Carnival of Ashes', note: 'A music box mixed with metal carnival music.' },
    ] },
  ];
  const S = { vol: 0.3, cur: null, cards: [] };
  const L = document.getElementById('list');
  const mmss = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  for (const g of GROUPS) {
    const h = document.createElement('h2'); h.textContent = g.name; L.appendChild(h);
    const w = document.createElement('p'); w.className = 'where'; w.textContent = g.where; L.appendChild(w);
    for (const s of g.songs) {
      const a = new Audio(s.file); a.loop = true; a.preload = 'metadata'; a.volume = S.vol;
      const b = document.createElement('div'); b.className = 'card'; b.setAttribute('role', 'button'); b.tabIndex = 0;
      b.innerHTML = '<div class="top"><span class="ic">&#9654;</span><span class="nm"></span><span class="meta"></span></div><div class="bar"><i></i></div>' + (s.note ? '<div class="note"></div>' : '');
      b.querySelector('.nm').textContent = s.name; if (s.note) b.querySelector('.note').textContent = s.note;
      a.addEventListener('loadedmetadata', () => { b.querySelector('.meta').textContent = mmss(a.duration); });
      a.addEventListener('timeupdate', () => { if (a.duration) b.querySelector('.bar i').style.width = (100 * a.currentTime / a.duration) + '%'; });
      const c = { s, a, b }; S.cards.push(c);
      b.onclick = () => {
        if (S.cur === c && !a.paused) { a.pause(); b.classList.remove('on'); b.querySelector('.ic').innerHTML = '&#9654;'; return; }
        for (const o of S.cards) if (o !== c) { o.a.pause(); o.b.classList.remove('on'); o.b.querySelector('.ic').innerHTML = '&#9654;'; }
        S.cur = c; a.volume = S.vol; a.play(); b.classList.add('on'); b.querySelector('.ic').innerHTML = '&#10074;&#10074;';
      };
      L.appendChild(b);
    }
  }
  document.querySelectorAll('#lvl button').forEach((x) => x.onclick = () => {
    S.vol = +x.dataset.v; document.querySelectorAll('#lvl button').forEach((y) => y.classList.toggle('on', y === x));
    for (const c of S.cards) c.a.volume = S.vol;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.cur) S.cur.b.click(); });
  window.__songs = S;
})();
