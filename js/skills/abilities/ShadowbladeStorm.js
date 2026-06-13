import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

/**
 * Shadowblade Storm - Hero ultimate skill for Blade Master.
 * Instantly teleports behind up to 3 lowest HP enemies, slashes them,
 * applies maximum bleed stacks, and grants brief invincibility.
 */
export function executeShadowbladeStorm(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  const opposingTeam = caster.battleContext && caster.battleContext.opposingTeam
    ? caster.battleContext.opposingTeam.filter(enemy => enemy.isAlive())
    : [];

  if (opposingTeam.length === 0) return;

  // 1. Grant 0.6 seconds of absolute invincibility to the caster
  caster.ultInvincibilityTimer = 0.6;

  // 2. Target up to 3 enemies with the lowest current HP
  const targets = opposingTeam.slice()
    .sort((a, b) => a.hp - b.hp)
    .slice(0, 3);

  // 3. Teleport and slash each target in sequence (instantly in one frame frame-by-frame flash)
  targets.forEach((target, index) => {
    // Determine positioning behind the target
    const angle = target.angle;
    
    // Teleport behind the target
    caster.x = target.x - Math.cos(angle) * 45;
    caster.y = target.y - Math.sin(angle) * 45;
    caster.angle = angle; // Face target

    // Deal damage
    target.takeDamage(skill.damage, caster.x, caster.y, effectSystem);

    // Apply maximum Bleed stacks (3 stacks)
    target.bleedStacks = 3;
    target.bleedTimer = 3.5;
    target.bleedTick = 0.5;

    // Visual indicators
    EffectLib.addBackstabEffect(effectSystem, target.x, target.y, caster.charData.secondaryColor || '#9C27B0', 25);
    effectSystem.addDamageNumber(target.x, target.y - target.charData.size, '瞬闪暗杀!', true, '#9C27B0');
    effectSystem.addHitEffect(target.x, target.y, '#9C27B0');
    
    // Sound per slash
    if (soundSystem) {
      soundSystem.playCritSound();
    }
  });

  // 4. Play skill sound and shake the screen
  if (soundSystem) {
    soundSystem.playSkillSound();
  }
  effectSystem.screenShake(6);
}
