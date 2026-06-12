import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executePoisonCloud(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  const area = skill.area || 100;
  const targetX = caster.target.x;
  const targetY = caster.target.y;
  EffectLib.addPoisonCloudEffect(effectSystem, targetX, targetY, caster.charData.color, area);
  effectSystem.screenShake(3);
  if (caster.combatManager) {
    caster.combatManager.addPoisonZone(targetX, targetY, caster.team, area, skill.duration || 3.0, skill.poisonDps || 4.0, 1.2);
  }
  const opposingTeam = caster.team === 'left' ? caster.combatManager.fightersRight : caster.combatManager.fightersLeft;
  if (opposingTeam) {
    opposingTeam.forEach(enemy => {
      if (enemy.isAlive()) {
        const ex = enemy.x - targetX;
        const ey = enemy.y - targetY;
        const edist = Math.sqrt(ex * ex + ey * ey);
        if (edist <= area) {
          enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
          enemy.applyPoison(skill.duration || 3.0, skill.poisonDps || 4.0);
          enemy.applySlow(1.2);
        }
      }
    });
  }
  return;
}

}
