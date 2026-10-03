// Turns the art requests in docs/art-requests/ into one phone page Chris can open, with a Copy button on every
// prompt and a "Made it" tick he can keep per prompt. The Night square painting is embedded as the reference for
// the camera angle. Writes dist/art-requests.html, ready to publish as is (no outer document tags).
// Usage: node tools/art-page.mjs [docs/art-requests/04-walking-maps.md ...]  (default: the open requests)
// A file given as path#Heading shows only that ## section and what follows it, under the file's title.
import fs from 'fs';
import path from 'path';
const R = path.resolve(new URL('..', import.meta.url).pathname);
const OPEN = ['docs/art-requests/04-walking-maps.md', 'docs/art-requests/02-world-map.md#The night versions'];
const files = process.argv.slice(2).length ? process.argv.slice(2) : OPEN;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function render(md, reqId, from) {
  let lines = md.split('\n');
  if (from) { const k = lines.indexOf('## ' + from); if (k < 0) throw new Error('no heading ## ' + from); lines = lines.filter((l, j) => j >= k || /^# /.test(l)); }
  let html = '', i = 0, para = [], title = '', sectionId = reqId, prompts = 0;
  const flush = () => { if (para.length) { html += '<p>' + inline(para.join(' ')) + '</p>\n'; para = []; } };
  while (i < lines.length) {
    const ln = lines[i];
    if (/^# /.test(ln)) { flush(); title = ln.slice(2).trim(); i++; continue; }
    if (/^## /.test(ln)) {
      flush(); const h = ln.slice(3).trim(); sectionId = reqId + '-' + slug(h);
      html += '</section>\n<section class="part" id="' + sectionId + '"><h3>' + inline(h) + '</h3>\n'; i++; continue;
    }
    if (/^### /.test(ln)) {
      flush(); const h = ln.slice(4).trim(); sectionId = reqId + '-' + slug(h);
      html += '<h4 id="' + sectionId + '">' + inline(h) + '</h4>\n'; i++; continue;
    }
    if (/^```/.test(ln)) {
      flush(); const body = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++; prompts++;
      html += '<div class="prompt"><pre id="p-' + sectionId + '">' + esc(body.join('\n')) + '</pre><div class="row">' +
        '<button type="button" class="copy" data-for="p-' + sectionId + '">Copy prompt</button>' +
        '<label class="made"><input type="checkbox" id="made-' + sectionId + '" data-key="' + sectionId + '"> Made it</label></div></div>\n';
      continue;
    }
    if (/^\|/.test(ln)) {
      flush(); const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      html += '<div class="tbl"><table><thead><tr>' + cells(rows[0]).map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
        rows.slice(2).map((r) => '<tr>' + cells(r).map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>\n';
      continue;
    }
    if (/^- /.test(ln)) {
      flush(); html += '<ul>';
      while (i < lines.length && /^- /.test(lines[i])) html += '<li>' + inline(lines[i++].slice(2)) + '</li>';
      html += '</ul>\n'; continue;
    }
    if (!ln.trim()) { flush(); i++; continue; }
    para.push(ln.trim()); i++;
  }
  flush();
  return { title, prompts, html: '<section class="part" id="' + reqId + '-top">' + html + '</section>' };
}

const reqs = files.map((arg) => {
  const [f, from] = arg.split('#');
  const id = path.basename(f, '.md').replace(/^(\d+)-.*/, 'r$1');
  return Object.assign({ id }, render(fs.readFileSync(path.resolve(R, f), 'utf8'), id, from));
});
const ref = 'data:image/webp;base64,' + fs.readFileSync(path.join(R, 'reference/art/backdrops/night-square.webp')).toString('base64');

const page = `<title>Envoi Art Requests</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<style>
/* One reading column; each request is a run of prompt cards, each card a copyable prompt with its file name above it. */
:root{
  --bg:#efeaf6; --surface:#fbf8ff; --ink:#241a30; --soft:#5d5070; --line:#d6cde4;
  --accent:#8a4f00; --accent-bg:#fff1d6; --moon:#5b3d93; --code-bg:#ece4f6;
  --display:"IM Fell English",Georgia,serif; --body:"Atkinson Hyperlegible",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#120d18; --surface:#1d1626; --ink:#ece6f7; --soft:#a99cc0; --line:#3a2f4a;
  --accent:#ffc46e; --accent-bg:#3a2a12; --moon:#c7b0ff; --code-bg:#2a2136; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#120d18; --surface:#1d1626; --ink:#ece6f7; --soft:#a99cc0; --line:#3a2f4a;
  --accent:#ffc46e; --accent-bg:#3a2a12; --moon:#c7b0ff; --code-bg:#2a2136; color-scheme:dark}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.55}
.page{max-width:44rem;margin:0 auto;padding-inline:16px;padding-block:20px 48px}
header h1{font-family:var(--display);font-style:italic;font-weight:400;font-size:2rem;line-height:1.1;margin:0 0 .4rem;text-wrap:balance}
header p{margin:.4rem 0;color:var(--soft)}
nav{display:flex;flex-wrap:wrap;gap:8px;margin:1rem 0 .5rem}
nav a{color:var(--ink);text-decoration:none;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:6px 14px;font-size:.92rem}
nav a:hover{border-color:var(--accent)}
nav a small{color:var(--soft)}
h2{font-family:var(--display);font-weight:400;font-size:1.6rem;line-height:1.15;margin:2.4rem 0 .6rem;padding-top:1rem;border-top:1px solid var(--line);text-wrap:balance}
h3{font-family:var(--display);font-style:italic;font-weight:400;font-size:1.3rem;margin:1.8rem 0 .4rem;color:var(--moon);text-wrap:balance}
h4{font-family:var(--body);font-weight:700;font-size:1.02rem;margin:1.4rem 0 .3rem}
p,li{max-width:65ch}
ul{padding-left:1.2rem;margin:.5rem 0}
li{margin:.25rem 0}
code{font-family:var(--mono);font-size:.86em;background:var(--code-bg);padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}
.ref{margin:1rem 0;display:grid;gap:6px}
.ref img{display:block;width:100%;max-width:100%;height:auto;border-radius:8px;border:1px solid var(--line)}
.ref small{color:var(--soft)}
.prompt{background:var(--surface);border:1px solid var(--line);border-radius:10px;margin:.8rem 0 1rem;overflow:hidden}
.prompt pre{margin:0;padding:14px 14px 10px;font-family:var(--mono);font-size:.84rem;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;max-height:16rem;overflow:auto}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:10px 14px;border-top:1px solid var(--line)}
.copy{font:inherit;font-weight:700;min-height:44px;padding:0 18px;border-radius:8px;border:1px solid var(--accent);background:var(--accent-bg);color:var(--ink);cursor:pointer}
.copy:hover{filter:brightness(1.05)}
.copy[data-done]{border-color:var(--moon)}
.made{display:flex;align-items:center;gap:8px;color:var(--soft);min-height:44px;cursor:pointer}
.made input{width:20px;height:20px;accent-color:var(--accent)}
.tbl{overflow-x:auto;margin:.8rem 0}
table{border-collapse:collapse;font-size:.92rem;min-width:28rem}
th,td{text-align:left;vertical-align:top;padding:7px 10px;border-bottom:1px solid var(--line)}
th{font-weight:700;color:var(--soft)}
button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (prefers-reduced-motion:no-preference){.copy{transition:border-color .2s}}
</style>
<div class="page">
<header>
<h1>Envoi Art Requests</h1>
<p>The images the game needs next. Copy a prompt, generate it, and send the image back in the chat with the file name given.</p>
<p>Tick “Made it” as you go. The ticks stay on this device only.</p>
<nav aria-label="Requests">${reqs.map((r) => `<a href="#${r.id}">${esc(r.title.replace(/^Art Request \d+: /, ''))} <small>${r.prompts} prompts</small></a>`).join('')}</nav>
</header>
<main>
${reqs.map((r) => `<h2 id="${r.id}">${esc(r.title)}</h2>
${r.id === 'r04' ? `<figure class="ref"><img src="${ref}" alt="The Night square painting: a moonlit village square seen from high above, with a stone well in the middle and warm lamps around it."><small>The Night square, the style reference for Wickhollow square. Press and hold to save it if your phone allows; it is also in the repo at <code>reference/art/backdrops/night-square.webp</code>. The battle backdrops you made are the style references for the other places.</small></figure>` : ''}
${r.html}`).join('\n')}
</main>
</div>
<script>
(function(){
  var store = {get:function(k){try{return localStorage.getItem(k);}catch(e){return null;}}, set:function(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
  document.querySelectorAll('.made input').forEach(function(box){
    box.checked = store.get('made:' + box.dataset.key) === '1';
    box.addEventListener('change', function(){ store.set('made:' + box.dataset.key, box.checked ? '1' : '0'); });
  });
  document.querySelectorAll('.copy').forEach(function(btn){
    btn.addEventListener('click', function(){
      var pre = document.getElementById(btn.dataset.for), text = pre.textContent;
      var done = function(){ btn.textContent = 'Copied'; btn.setAttribute('data-done',''); setTimeout(function(){ btn.textContent = 'Copy prompt'; btn.removeAttribute('data-done'); }, 1800); };
      var select = function(){ var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Selected: copy it'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, select); else select();
    });
  });
})();
</script>
`;
fs.mkdirSync(path.join(R, 'dist'), { recursive: true });
const out = path.join(R, 'dist/art-requests.html');
fs.writeFileSync(out, page);
console.log(path.relative(R, out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB,', reqs.map((r) => r.title + ' (' + r.prompts + ')').join(', '));
