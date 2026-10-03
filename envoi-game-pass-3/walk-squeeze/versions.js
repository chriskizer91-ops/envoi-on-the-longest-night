// versions.js: written by make-versions.mjs (run it again rather than editing this). The example painting's
// versions, measured: px (width, height), bytes, detail (SSIM averaged over the four close-ups), close (each close-up),
// whole (the whole painting). Defines window.SQUEEZE.
window.SQUEEZE = {
  "painting": [1500,1000],
  "patches": {"path":[632,650,256,256],"oak":[330,230,256,256],"wall":[1000,140,256,256],"flowers":[400,590,256,256]},
  "versions": [
    {"id":"original","name":"Original","tag":"As you sent it","px":[1500,1000],"fmt":"WebP","q":null,"bytes":461262,"detail":1,"close":{"path":1,"oak":1,"wall":1,"flowers":1},"whole":1,"src":"./img/original.webp"},
    {"id":"a100","name":"100%","tag":"","px":[1500,1000],"fmt":"AVIF","q":45,"bytes":357657,"detail":0.975,"close":{"path":0.967,"oak":0.979,"wall":0.98,"flowers":0.972},"whole":0.974,"src":"./img/a100.avif"},
    {"id":"a100l","name":"100% light","tag":"","px":[1500,1000],"fmt":"AVIF","q":30,"bytes":203095,"detail":0.929,"close":{"path":0.915,"oak":0.935,"wall":0.94,"flowers":0.925},"whole":0.927,"src":"./img/a100l.avif"},
    {"id":"a100xl","name":"100% extra light","tag":"","px":[1500,1000],"fmt":"AVIF","q":20,"bytes":137986,"detail":0.875,"close":{"path":0.849,"oak":0.888,"wall":0.894,"flowers":0.868},"whole":0.872,"src":"./img/a100xl.avif"},
    {"id":"a75","name":"75%","tag":"","px":[1125,750],"fmt":"AVIF","q":45,"bytes":197497,"detail":0.774,"close":{"path":0.768,"oak":0.781,"wall":0.775,"flowers":0.774},"whole":0.771,"src":"./img/a75.avif"},
    {"id":"a75l","name":"75% light","tag":"Town maps","px":[1125,750],"fmt":"AVIF","q":30,"bytes":109800,"detail":0.716,"close":{"path":0.698,"oak":0.734,"wall":0.724,"flowers":0.71},"whole":0.713,"src":"./img/a75l.avif"},
    {"id":"a63l","name":"63% light","tag":"","px":[945,630],"fmt":"AVIF","q":30,"bytes":82627,"detail":0.67,"close":{"path":0.65,"oak":0.683,"wall":0.684,"flowers":0.664},"whole":0.667,"src":"./img/a63l.avif"},
    {"id":"a50l","name":"50% light","tag":"","px":[750,500],"fmt":"AVIF","q":30,"bytes":68532,"detail":0.637,"close":{"path":0.614,"oak":0.655,"wall":0.648,"flowers":0.631},"whole":0.632,"src":"./img/a50l.avif"},
    {"id":"a50xl","name":"50% extra light","tag":"","px":[750,500],"fmt":"AVIF","q":20,"bytes":40036,"detail":0.534,"close":{"path":0.498,"oak":0.563,"wall":0.558,"flowers":0.518},"whole":0.525,"src":"./img/a50xl.avif"}
  ]
};
