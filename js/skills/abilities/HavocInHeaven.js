import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

export function executeHavocInHeaven(caster, skill, weaponSystem, effectSystem) {
  // Massive visual impact
  effectSystem.screenShake(10); // Big screen shake
  EffectLib.addAoeMeleeEffect(effectSystem, caster.x, caster.y, caster.charData.color, skill.range);
  
  // Extra visual flair for Great Sage
  EffectLib.addStunEffect(effectSystem, caster.x, caster.y, '#FFD700', skill.range);
  
  // Play dramatic sound if available
  if (typeof window !== 'undefined' && window.soundSystem) {
    window.soundSystem.playSound('skill', 0.8);
  }
  
  // Apply damage and stun to all enemies in range
  const opposingTeam = caster.battleContext.opposingTeam;
  if (!opposingTeam) return;

  opposingTeam.forEach(enemy => {
    if (!enemy.isAlive()) return;
    const dx = enemy.x - caster.x;
    const dy = enemy.y - caster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist <= skill.range) {
      // flat damage as requested
      const damage = skill.damage;
      enemy.takeDamage(damage, caster.x, caster.y, effectSystem);
      
      // Stun for 1.5s
      enemy.applyStun(1.5);
      
      // Knockback slightly
      if (!enemy.hasPassive('stone_shell')) {
        const kbAngle = Math.atan2(dy, dx);
        if (isFinite(kbAngle)) {
          enemy.x += Math.cos(kbAngle) * 30;
          enemy.y += Math.sin(kbAngle) * 30;
        }
      }
      
      effectSystem.addHitEffect(enemy.x, enemy.y, '#FF9800');
    }
  });
}
