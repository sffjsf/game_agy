import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeBackstab(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  // Calculate destination behind the target (opposite their facing angle)
  var behindX = caster.target.x - Math.cos(caster.target.angle) * 30;
  var behindY = caster.target.y - Math.sin(caster.target.angle) * 30;

  // Set up dashing_skill state
  caster.setState('dashing_skill');
  caster.dashStartX = caster.x;
  caster.dashStartY = caster.y;
  caster.dashTargetX = behindX;
  caster.dashTargetY = behindY;
  caster.dashDuration = 0.15; // 0.15 seconds dash duration
  caster.dashTimer = 0;
  caster.dashSkillType = 'backstab';

  // Play starting skill effect
  EffectLib.addBackstabEffect(effectSystem, caster.x, caster.y, caster.charData.color, 20);
  return;
}

}
