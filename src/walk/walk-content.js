// walk-content.js: the ground-level maps (art request 04), where Io starts on each, and the talking portraits
// (art request 05). The build inlines the "art/..." paths as data URIs.
window.WALK = {
  maps: [
    { id: 'wickhollow', name: 'Wickhollow square', src: "art/walk/walk-wickhollow-square.webp", start: [770, 640] },
    { id: 'cottage', name: "Io's cottage", src: "art/walk/walk-wickhollow-cottage.webp", start: [768, 880] },
    { id: 'jetty', name: 'The jetty', src: "art/walk/walk-wickhollow-jetty.webp", start: [768, 330] },
    { id: 'thornwood', name: 'The Thornwood', src: "art/walk/walk-thornwood.webp", start: [640, 492] },
    { id: 'bogmire', name: 'Bogmire', src: "art/walk/walk-bogmire.webp", start: [770, 470] },
    { id: 'bogmire-heart', name: "Bogmire's dark heart", src: "art/walk/walk-bogmire-heart.webp", start: [768, 520] },
    { id: 'dawnroost', name: 'Dawnroost', src: "art/walk/walk-dawnroost.webp", start: [663, 760] },
    { id: 'dawnroost-node', name: "Dawnroost's living node", src: "art/walk/walk-dawnroost-node.webp", start: [768, 560] },
    { id: 'crossroads', name: 'The northern crossroads', src: "art/walk/walk-northern-crossroads.webp", start: [770, 600] },
    { id: 'shipyard', name: 'The shipyard', src: "art/walk/walk-shipyard.webp", start: [768, 470] },
    { id: 'frozen-pass', name: 'The frozen pass', src: "art/walk/walk-frozen-pass.webp", start: [760, 600] },
    { id: 'misthollow', name: 'Misthollow', src: "art/walk/walk-misthollow.webp", start: [768, 800] },
    { id: 'moonwell', name: 'The dead Moonwell', src: "art/walk/walk-misthollow-moonwell.webp", start: [768, 760] },
  ],
  portraits: {
    io: { name: 'Io', src: "art/portraits/portrait-io.webp" },
    sol: { name: 'Sol', src: "art/portraits/portrait-sol.webp" },
    shipmaster: { name: 'Ysmera Brightkeel', src: "art/portraits/portrait-shipmaster-a.webp" },
  },
  // sample lines to show the dialogue box; the story's own words come with the story steps
  lines: [
    ['io', 'Every lamp in the square is still lit. Whatever is out there, it has not come this far yet.'],
    ['sol', 'Then we go to it before it comes to us. Stay behind me.'],
    ['shipmaster', 'A witch and the last of the Wardens, at my yard. Your little ship will need more than courage to fly north.'],
  ],
};
