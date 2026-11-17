// herbal-decay.js: where Chris's "Herbal Decay" lives, for the song bed (../src/song-bed.js). The file beside this
// script is his own file exactly as he gave it (AAC at 96 kbps in .m4a, 3:20, November 17, 2026), never re-compressed:
// the build puts its bytes inside the page as they are.
window.SONG_BED_FILE = "./herbal-decay-battle-aac-96k.m4a";
// unbuilt, the path is beside this script, not beside the page that loads it
if (!/^data:/.test(window.SONG_BED_FILE) && document.currentScript) window.SONG_BED_FILE = new URL(window.SONG_BED_FILE, document.currentScript.src).href;
