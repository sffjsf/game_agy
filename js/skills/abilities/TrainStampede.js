import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeTrainStampede(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  var baseAngle = Math.atan2(dy, dx);
  var speed = 300;
  var vx = Math.cos(baseAngle) * speed;
  var vy = Math.sin(baseAngle) * speed;
  var proj = weaponSystem.createRangedAttack(caster.x, caster.y, caster.target.x, caster.target.y, skill.damage, caster.team, 'train', caster.charData.color, caster, caster.battleContext.opposingTeam);
  effectSystem.screenShake(5);
  EffectLib.addMultiShotEffect(effectSystem, caster.x, caster.y, caster.charData.color, 40);
  return;
}

}
