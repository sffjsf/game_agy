import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

export function executeGroundSlam(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  // Screen shake and ground dust ring
  effectSystem.screenShake(8);
  
  // Use a rocky brown/grey color for the dust shockwave
  EffectLib.addAoeMeleeEffect(effectSystem, caster.x, caster.y, '#8D6E63', skill.range);

  // Play skill sound if available
  if (soundSystem) {
    soundSystem.playSkillSound();
  }

  // Get opposing team
  const opposingTeam = caster.battleContext.opposingTeam;
  if (!opposingTeam) return;

  opposingTeam.forEach(enemy => {
    if (!enemy.isAlive()) return;

    const ex = enemy.x - caster.x;
    const ey = enemy.y - caster.y;
    const edist = Math.sqrt(ex * ex + ey * ey) || 1;

    if (edist <= skill.range) {
      // Deal damage
      enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);

      // Apply 1.0s stun (duration is from skill config)
      enemy.applyStun(skill.duration || 1.0);
      EffectLib.addStunEffect(effectSystem, enemy.x, enemy.y, '#FFD700', 30);

      // Knockback by 35px away from caster (if target doesn't have stone_shell passive)
      if (!enemy.hasPassive('stone_shell')) {
        const kbX = ex / edist;
        const kbY = ey / edist;
        enemy.x += kbX * 35;
        enemy.y += kbY * 35;
      }

      effectSystem.addHitEffect(enemy.x, enemy.y, '#795548');
    }
  });
}
