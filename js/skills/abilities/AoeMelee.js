import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeAoeMelee(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  EffectLib.addAoeMeleeEffect(effectSystem, caster.x, caster.y, caster.charData.color, skill.range);
  effectSystem.screenShake(6);
  const opposingTeam = caster.battleContext.opposingTeam;
  if (opposingTeam) {
    opposingTeam.forEach(enemy => {
      if (enemy.isAlive()) {
        const ex = enemy.x - caster.x;
        const ey = enemy.y - caster.y;
        const edist = Math.sqrt(ex * ex + ey * ey);
        if (edist <= skill.range) {
          enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
          caster.healFromDamage(skill.damage, effectSystem);
        }
      }
    });
  }
  return;
}

}
