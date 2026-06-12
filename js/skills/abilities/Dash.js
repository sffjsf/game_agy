import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeDash(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  // Calculate destination (stop 30px away from target)
  var dashDestX = caster.x;
  var dashDestY = caster.y;
  if (dist > 30) {
    dashDestX = caster.target.x - dx / dist * 30;
    dashDestY = caster.target.y - dy / dist * 30;
  }

  // Set up dashing_skill state
  caster.setState('dashing_skill');
  caster.dashStartX = caster.x;
  caster.dashStartY = caster.y;
  caster.dashTargetX = dashDestX;
  caster.dashTargetY = dashDestY;
  caster.dashDuration = 0.12; // 0.12 seconds dash duration (very fast, but smooth!)
  caster.dashTimer = 0;
  caster.dashSkillType = 'dash';

  // Play skill starting effect
  EffectLib.addDashEffect(effectSystem, caster.x, caster.y, caster.charData.color, 20);
  return;
}

}
