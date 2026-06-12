import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeStun(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  if (caster.target.isAlive() && dist <= skill.range) {
    caster.target.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
    caster.target.stunTimer = skill.duration; // Apply stun!
    EffectLib.addStunEffect(effectSystem, caster.target.x, caster.target.y, '#FFD700', 30);
    effectSystem.screenShake(6);
  }
  return;
}

}
