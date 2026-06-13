import { soundSystem } from '../../audio.js';

/**
 * Temporal Field - Hero ultimate skill for Time Traveler.
 * Deploys a large golden zone that speeds up friendly units and
 * delays hostile ones.
 */
export function executeTemporalField(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  if (!caster.target || !caster.target.isAlive()) return;

  const targetX = caster.target.x;
  const targetY = caster.target.y;
  const radius = skill.area || 150;
  const duration = skill.duration || 3.5;

  // 1. Play skill sound and shake the screen
  if (soundSystem) {
    soundSystem.playSkillSound();
  }
  effectSystem.screenShake(4);

  // 2. Add the temporal zone to the HazardZoneManager
  if (caster.battleContext && caster.battleContext.addTemporalField) {
    caster.battleContext.addTemporalField(targetX, targetY, caster.team, radius, duration);
  }

  // 3. Apply instant damage to all enemies inside the zone when deployed
  const opposingTeam = caster.battleContext && caster.battleContext.opposingTeam
    ? caster.battleContext.opposingTeam
    : [];
  opposingTeam.forEach(enemy => {
    if (enemy.isAlive()) {
      const edx = enemy.x - targetX;
      const edy = enemy.y - targetY;
      const edist = Math.sqrt(edx * edx + edy * edy);
      if (edist <= radius) {
        enemy.takeDamage(skill.damage || 20, targetX, targetY, effectSystem);
        effectSystem.addHitEffect(enemy.x, enemy.y, '#E6C229');
      }
    }
  });

  // 4. Spawn golden clock dial flash particles at target center
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 100;
    effectSystem.addParticle({
      x: targetX,
      y: targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      color: i % 2 === 0 ? '#E6C229' : '#F17105',
      size: 2.0 + Math.random() * 2.5,
      gravity: 0,
      friction: 0.93,
      type: 'circle'
    });
  }

  effectSystem.addDamageNumber(targetX, targetY, '时间结界!', false, '#E6C229');
}
