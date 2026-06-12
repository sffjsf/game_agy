import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeBombToss(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  const area = skill.area || 90;
  const targetX = caster.target.x;
  const targetY = caster.target.y;
  EffectLib.addBombEffect(effectSystem, targetX, targetY, caster.charData.color, area);
  effectSystem.screenShake(7);
  if (caster._applyAreaDamage) {
    caster._applyAreaDamage(targetX, targetY, caster.team, skill.damage, area, caster);
  }
  return;
}

}
