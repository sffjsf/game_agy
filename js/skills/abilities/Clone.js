import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeClone(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  caster.clones = [{
    x: caster.x + 30,
    y: caster.y - 20
  }, {
    x: caster.x - 30,
    y: caster.y + 20
  }];
  caster.cloneTimer = 3.0; // Clones last 3 seconds

  EffectLib.addCloneEffect(effectSystem, caster.x, caster.y, caster.charData.color, 30);

  // Each clone fires a shuriken at the target
  for (var i = 0; i < caster.clones.length; i++) {
    weaponSystem.createRangedAttack(caster.clones[i].x, caster.clones[i].y, caster.target.x, caster.target.y, skill.damage, caster.team, 'shuriken', caster.charData.color, caster, caster._opposingTeam);
  }
  return;
}

}
