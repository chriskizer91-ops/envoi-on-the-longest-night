// walkers.js: the painted paper dolls (art request 08), cut by tools/cut-sheet.mjs into even cells with the feet on one
// spot (foot), with the middle frame's height (fig) and the person's height beside Io's (ratio). Those who walk in the
// story's scenes have six frames in each of four rows (toward the viewer, left, right, away) and each row's standing
// frame (stand); everyone else stands in their place and only turns to talk, so theirs is one to three standing poses
// (still: the cell each facing shows). Written by tools/walkers-index.mjs; don't edit.
window.WALKERS = {
  brann: { src: "art/walkers/brann.avif", cols: 2, rows: 1, cell: [126,177], foot: [63,173], fig: 169, ratio: 1, still: { s: 0, w: 1, e: 0, n: 0 } },
  ede: { src: "art/walkers/ede.avif", cols: 3, rows: 1, cell: [180,178], foot: [92,173], fig: 164, ratio: 1, still: { s: 0, w: 1, e: 2, n: 0 } },
  gil: { src: "art/walkers/gil.avif", cols: 3, rows: 1, cell: [161,173], foot: [85,169], fig: 165, ratio: 1, still: { s: 0, w: 1, e: 2, n: 0 } },
  gretch: { src: "art/walkers/gretch.avif", cols: 3, rows: 1, cell: [161,178], foot: [82,173], fig: 166, ratio: 1, still: { s: 0, w: 1, e: 2, n: 0 } },
  halcyon: { src: "art/walkers/halcyon.avif", cols: 6, rows: 4, cell: [172,178], foot: [86,173], fig: 169, ratio: 1, stand: [3,2,5,4] },
  hilde: { src: "art/walkers/hilde.avif", cols: 1, rows: 1, cell: [90,176], foot: [45,171], fig: 168, ratio: 1, still: { s: 0, w: 0, e: 0, n: 0 } },
  marta: { src: "art/walkers/marta.avif", cols: 3, rows: 1, cell: [142,178], foot: [71,173], fig: 169, ratio: 1, still: { s: 0, w: 1, e: 2, n: 0 } },
  nettie: { src: "art/walkers/nettie.avif", cols: 3, rows: 1, cell: [144,177], foot: [65,173], fig: 164, ratio: 1, still: { s: 0, w: 1, e: 2, n: 0 } },
  pell: { src: "art/walkers/pell.avif", cols: 1, rows: 1, cell: [74,129], foot: [38,125], fig: 121, ratio: 0.75, still: { s: 0, w: 0, e: 0, n: 0 } },
  pim: { src: "art/walkers/pim.avif", cols: 1, rows: 1, cell: [76,118], foot: [31,113], fig: 110, ratio: 0.667, still: { s: 0, w: 0, e: 0, n: 0 } },
  quill: { src: "art/walkers/quill.avif", cols: 6, rows: 4, cell: [174,178], foot: [86,173], fig: 163, ratio: 1, stand: [5,2,5,1] },
  sol: { src: "art/walkers/sol.avif", cols: 6, rows: 4, cell: [200,178], foot: [102,173], fig: 163, ratio: 1, stand: [0,2,2,2] },
  sorrel: { src: "art/walkers/sorrel.avif", cols: 3, rows: 1, cell: [161,173], foot: [80,169], fig: 165, ratio: 1, still: { s: 0, w: 1, e: 2, n: 0 } },
  tamsin: { src: "art/walkers/tamsin.avif", cols: 2, rows: 1, cell: [95,133], foot: [39,129], fig: 126, ratio: 0.75, still: { s: 0, w: 1, e: 0, n: 0 } },
  tobb: { src: "art/walkers/tobb.avif", cols: 1, rows: 1, cell: [124,178], foot: [65,173], fig: 170, ratio: 1, still: { s: 0, w: 0, e: 0, n: 0 } },
  tock: { src: "art/walkers/tock.avif", cols: 1, rows: 1, cell: [70,114], foot: [33,110], fig: 106, ratio: 0.667, still: { s: 0, w: 0, e: 0, n: 0 } },
  watch: { src: "art/walkers/watch.avif", cols: 3, rows: 1, cell: [144,178], foot: [69,173], fig: 167, ratio: 1, still: { s: 0, w: 1, e: 2, n: 0 } },
  wenna: { src: "art/walkers/wenna.avif", cols: 3, rows: 1, cell: [154,175], foot: [80,171], fig: 163, ratio: 1, still: { s: 0, w: 1, e: 2, n: 0 } },
  ysmera: { src: "art/walkers/ysmera.avif", cols: 6, rows: 4, cell: [206,185], foot: [104,180], fig: 163, ratio: 1.04, stand: [4,5,2,1] },
};
