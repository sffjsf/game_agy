import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeInfernoDetonation(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  const area = skill.area || 115;
  const opposingTeam = caster.battleContext.opposingTeam;
  if (opposingTeam) {
    var burningTargets = opposingTeam.filter(enemy => enemy.isAlive() && enemy.isBurning());
    if (burningTargets.length === 0 && caster.target && caster.target.isAlive()) {
      caster.target.applyBurn(skill.burnDuration || 3.5, skill.burnDps || 6);
      burningTargets = [caster.target];
    }
    burningTargets.forEach(burningEnemy => {
      EffectLib.addFireBurstEffect(effectSystem, burningEnemy.x, burningEnemy.y, '#FF5722', area);
      if (caster.battleContext.applyAreaDamage) caster.battleContext.applyAreaDamage(burningEnemy.x, burningEnemy.y, caster.team, skill.damage, area, caster);
      opposingTeam.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const ex = enemy.x - burningEnemy.x;
        const ey = enemy.y - burningEnemy.y;
        const edist = Math.sqrt(ex * ex + ey * ey);
        if (isFinite(edist) && edist <= area) {
          enemy.applyBurn(skill.burnDuration || 3.5, skill.burnDps || 6);
        }
      });
    });
  }
  effectSystem.screenShake(12);
  return;
}

}
