import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';
export function executeMultiShot(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
{
  var baseAngle = Math.atan2(dy, dx);
  var spreadAngle = Math.PI / 12; // 15 degrees

  for (var i = -1; i <= 1; i++) {
    var shotAngle = baseAngle + i * spreadAngle;
    var speed = caster.charData.projectileSpeed || 400;
    var vx = Math.cos(shotAngle) * speed;
    var vy = Math.sin(shotAngle) * speed;
    var proj = createProjectile(caster.x, caster.y, vx, vy, skill.damage, caster.team, caster.charData.color, 5, 'arrow');
    proj.attacker = caster;
    proj.opposingTeam = caster._opposingTeam;
    weaponSystem.projectiles.push(proj);
  }
  EffectLib.addMultiShotEffect(effectSystem, caster.x, caster.y, caster.charData.color, 30);
  return;
}

}
