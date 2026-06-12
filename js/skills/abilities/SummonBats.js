import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeSummonBats(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  var baseAngle = Math.atan2(dy, dx);
  var spread = Math.PI / 3; // 60 degrees spread
  var numBats = 4;
  for (var i = 0; i < numBats; i++) {
    var angleOffset = (i - (numBats - 1) / 2) * (spread / (numBats - 1));
    var batAngle = baseAngle + angleOffset;
    var speed = 250; // Homing will guide them
    var vx = Math.cos(batAngle) * speed;
    var vy = Math.sin(batAngle) * speed;
    var batProj = createProjectile(caster.x, caster.y, vx, vy, skill.damage, caster.team, '#FF1744', 8, 'bat');
    batProj.attacker = caster;
    batProj.opposingTeam = caster.battleContext.opposingTeam;
    weaponSystem.projectiles.push(batProj);
  }
  EffectLib.addCloneEffect(effectSystem, caster.x, caster.y, '#FF1744', 40);
  effectSystem.screenShake(4);
  return;
}

}
