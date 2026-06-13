import { soundSystem } from '../../audio.js';

/**
 * Celestial Swords - Legendary ultimate skill for 九霄剑仙 (Sword Deity).
 * Teleports the caster to the center of the arena, lifts them into the air (untargetable/invulnerable),
 * and deploys a massive Yin-Yang Bagua sword array.
 */
export function executeCelestialSwords(caster, skill, weaponSystem, effectSystem) {
  if (!caster.target || !caster.target.isAlive()) return;

  const targetX = caster.target.x;
  const targetY = caster.target.y;

  // 1. Play skill sound and shake the screen
  if (soundSystem) {
    soundSystem.playSkillSound();
  }
  effectSystem.screenShake(6);

  // 2. Teleport caster to the target's position
  caster.x = targetX;
  caster.y = targetY;

  // 3. Trigger ascended/untargetable state for the 5-second duration of the ultimate
  caster.isAscended = true;
  caster.celestialSwordsTimer = 5.0;
  caster.ultInvincibilityTimer = 5.0; // Invulnerable

  // 4. Add the Taiji sword array to the HazardZoneManager centered on the target
  const radius = skill.area || 280;
  const duration = skill.duration || 5.0;
  if (caster.battleContext && caster.battleContext.addSwordArray) {
    caster.battleContext.addSwordArray(targetX, targetY, caster.team, radius, duration);
  }

  // 5. Spawn circular golden particle flashes at the target center
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 150;
    effectSystem.addParticle({
      x: targetX,
      y: targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      color: i % 2 === 0 ? '#FFF9C4' : '#FFD700',
      size: 2.5 + Math.random() * 3.0,
      gravity: 0,
      friction: 0.92,
      type: 'circle'
    });
  }

  effectSystem.addDamageNumber(targetX, targetY - 60, '诛仙剑阵!', false, '#FFD700');
}
