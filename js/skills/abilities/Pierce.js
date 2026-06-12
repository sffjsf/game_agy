import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executePierce(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  const range = skill.range || 150;
  const width = skill.width || 34;
  const dirX = dx / dist;
  const dirY = dy / dist;
  EffectLib.addMultiShotEffect(effectSystem, caster.x, caster.y, caster.charData.color, 35);
  const opposingTeam = caster.team === 'left' ? caster.combatManager.fightersRight : caster.combatManager.fightersLeft;
  if (opposingTeam) {
    opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const ex = enemy.x - caster.x;
      const ey = enemy.y - caster.y;
      const forward = ex * dirX + ey * dirY;
      const side = Math.abs(ex * dirY - ey * dirX);
      if (forward >= 0 && forward <= range && side <= width) {
        enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
        effectSystem.addHitEffect(enemy.x, enemy.y, caster.charData.color);
      }
    });
  }
  return;
}

}
