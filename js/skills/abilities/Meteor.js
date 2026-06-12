import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeMeteor(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  const area = skill.area || 80;
  EffectLib.addMeteorEffect(effectSystem, caster.target.x, caster.target.y, caster.charData.color, area);
  effectSystem.screenShake(10);
  const targetX = caster.target.x;
  const targetY = caster.target.y;
  const opposingTeam = caster._opposingTeam;
  if (opposingTeam) {
    opposingTeam.forEach(enemy => {
      if (enemy.isAlive()) {
        const ex = enemy.x - targetX;
        const ey = enemy.y - targetY;
        const edist = Math.sqrt(ex * ex + ey * ey);
        if (edist <= area) {
          enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
        }
      }
    });
  }
  return;
}

}
