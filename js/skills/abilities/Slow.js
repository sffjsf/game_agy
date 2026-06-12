import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeSlow(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  weaponSystem.createRangedAttack(caster.x, caster.y, caster.target.x, caster.target.y, skill.damage, caster.team, 'banana', caster.charData.color, caster, caster.battleContext.opposingTeam);
  if (caster.target.isAlive() && dist <= skill.range) {
    caster.target.applySlow(skill.duration);
    EffectLib.addSlowEffect(effectSystem, caster.target.x, caster.target.y, '#42A5F5', 40);
  }
  return;
}

}
