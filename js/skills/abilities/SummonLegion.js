import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeSummonLegion(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  const teamArr = caster.battleContext.ownTeam;
  if (teamArr) {
    for (var i = 0; i < 3; i++) {
      var spawnX = caster.x + (Math.random() - 0.5) * 80;
      var spawnY = caster.y + (Math.random() - 0.5) * 80;
      var minion = new Fighter('summoned_golem', spawnX, spawnY, caster.team);
      teamArr.push(minion);
      EffectLib.addCloneEffect(effectSystem, spawnX, spawnY, '#E040FB', 40);
    }
    if (soundSystem) soundSystem.playSummonSound();
  }
  effectSystem.screenShake(8);
  EffectLib.addMeteorEffect(effectSystem, caster.x, caster.y, '#9C27B0', 60);
  return;
}

}
