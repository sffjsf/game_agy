import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeSeriousPunch(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  // Calculate destination (stop 20px away from target)
  var dashDestX = caster.x;
  var dashDestY = caster.y;
  if (dist > 20) {
    dashDestX = caster.target.x - dx / dist * 20;
    dashDestY = caster.target.y - dy / dist * 20;
  }
  caster.setState('dashing_skill');
  caster.dashStartX = caster.x;
  caster.dashStartY = caster.y;
  caster.dashTargetX = dashDestX;
  caster.dashTargetY = dashDestY;
  caster.dashDuration = 0.08; // Very fast lunge!
  caster.dashTimer = 0;
  caster.dashSkillType = 'serious_punch';
  EffectLib.addDashEffect(effectSystem, caster.x, caster.y, caster.charData.color, 30);
  return;
}

}
