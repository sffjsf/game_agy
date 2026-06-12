import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeFrostNova(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  const area = skill.area || 210;
  EffectLib.addSlowEffect(effectSystem, caster.x, caster.y, '#4FC3F7', area);
  EffectLib.addAoeMeleeEffect(effectSystem, caster.x, caster.y, '#B3E5FC', area);
  effectSystem.screenShake(4);
  const opposingTeam = caster.battleContext.opposingTeam;
  if (opposingTeam) {
    opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const ex = enemy.x - caster.x;
      const ey = enemy.y - caster.y;
      const edist = Math.sqrt(ex * ex + ey * ey);
      if (edist <= area) {
        enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
        enemy.applySlow(skill.duration || 3.0);
        EffectLib.addSlowEffect(effectSystem, enemy.x, enemy.y, '#4FC3F7', 36);
      }
    });
  }
  return;
}

}
