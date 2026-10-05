# picks screenshots for the guide: output name -> source png in shots/
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
PICK = {
  'title': 'title', 'prologue': 'prologue', 'ui-chapters': 'ui-chapters', 'menu-party': 'menu-party', 'menu-settings-3': 'menu-settings-3',
  'field-wickhollow': 'field-wickhollow', 'field-thornwood': 'field-thornwood', 'field-bogmire': 'field-bogmire',
  'field-warm-roads-camp': 'field-warm-roads-camp', 'field-ember-line-road': 'field-ember-line-road', 'field-dawnroost': 'field-dawnroost',
  'field-northern-camp': 'field-northern-camp', 'field-eldergrove-edge': 'field-eldergrove-edge', 'field-frozen-camp': 'field-frozen-camp',
  'field-frozen-pass': 'field-frozen-pass', 'talk-nettie-2': 'talk-nettie-2', 'talk-ysmera': 'talk-ysmera', 'talk-ede': 'talk-ede',
  'card-keepsake-1': 'card-keepsake-1', 'shop': 'shop', 'fly-1': 'fly-1',
  'b-first-pick': 'b-first-pick-Witchcraft', 'b-first-cast': 'b-first-cmd', 'b-first-intro': 'b-first-intro',
  'b-wild1-action': 'b-wild1-3-Moonsteel', 'b-wild1-end': 'b-wild1-end', 'b-great-intro': 'b-great-intro', 'b-great-action': 'b-great-1-EmberstarLily', 'b-node-intro': 'b-node-intro', 'b-node-action': 'b-node-cmd', 'b-node-swordarts': 'b-node-swordarts', 'b-halcyon-intro': 'b-halcyon-2-GloamCleave', 'b-bramble-intro': 'b-bramble-1-ThornSweep', 'b-colossus-intro': 'b-colossus-intro', 'b-colossus-action': 'b-colossus-1-SirenBloom', 'b-finale-intro': 'b-finale-intro', 'b-finale-action': 'b-finale-2-VoidSphere', 'b-finale-cut': 'b-finale-cut-20000',
}
extra = dict(a.split('=') for a in sys.argv[1:])
PICK.update(extra)
os.makedirs(os.path.join(HERE, 'img/shots'), exist_ok=True)
for out, src in PICK.items():
    p = os.path.join(HERE, 'shots', src + '.png')
    if not os.path.exists(p): print('missing', src); continue
    subprocess.run(['convert', p, '-resize', '800x', '-quality', '62', os.path.join(HERE, 'img/shots', out + '.webp')], check=True)
print('ok', len(PICK))
