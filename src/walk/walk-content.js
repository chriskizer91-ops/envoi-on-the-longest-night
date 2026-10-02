// walk-content.js: the pilot ground-level maps (art request 04), where Io starts on each, and the talking portraits
// (art request 05). The build inlines the "art/..." paths as data URIs.
window.WALK = {
  maps: [
    { id: 'wickhollow', name: 'Wickhollow square', src: "art/walk/walk-wickhollow-square.webp", start: [770, 640] },
    { id: 'bogmire', name: 'Bogmire', src: "art/walk/walk-bogmire.webp", start: [770, 470] },
    { id: 'crossroads', name: 'The northern crossroads', src: "art/walk/walk-northern-crossroads.webp", start: [770, 600] },
  ],
  portraits: {
    io: { name: 'Io', src: "art/portraits/portrait-io.webp" },
    sol: { name: 'Sol', src: "art/portraits/portrait-sol.webp" },
    shipmaster: { name: 'The shipmaster', src: "art/portraits/portrait-shipmaster-a.webp" },
  },
  // sample lines to show the dialogue box; the story's own words come with the story steps
  lines: [
    ['io', 'Every lamp in the square is still lit. Whatever is out there, it has not come this far yet.'],
    ['sol', 'Then we go to it before it comes to us. Stay behind me.'],
    ['shipmaster', 'A witch and the last of the Wardens, at my yard. Your little ship will need more than courage to fly north.'],
  ],
};
