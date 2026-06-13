import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

/**
 * Abyssal Torrent - Hero ultimate skill for Tidebringer.
 * Fires a wide rolling wave of water forward, damaging, slowing,
 * and knocking back all enemies in its path.
 * Summons a small Tide Sprite at the end of the torrent.
 */
export function executeAbyssalTorrent(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  const angle = caster.angle;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const maxRange = skill.range || 420;
  const laneWidth = 65; // half width (total 130px lane)

  // 1. Audio and Screen shake
  if (soundSystem) {
    soundSystem.playSkillSound();
  }
  effectSystem.screenShake(5);

  // 2. Damage, Slow and Knockback all enemies along the torrent path
  const opposingTeam = caster.battleContext && caster.battleContext.opposingTeam
    ? caster.battleContext.opposingTeam
    : [];

  opposingTeam.forEach(enemy => {
    if (enemy.isAlive()) {
      const ex = enemy.x - caster.x;
      const ey = enemy.y - caster.y;
      
      // Projection along casting direction
      const forward = ex * dirX + ey * dirY;
      const side = Math.abs(ex * (-dirY) + ey * dirX);

      // Check if enemy falls within the wave lane
      if (forward > 0 && forward <= maxRange && side <= laneWidth) {
        // Apply damage
        enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);

        // Apply knockback (push along casting direction by 95px)
        if (!enemy.hasPassive('stone_shell')) {
          enemy.x += dirX * 95;
          enemy.y += dirY * 95;
        }

        // Apply slow and slow particles
        enemy.applySlow(2.0);
        EffectLib.addSlowEffect(effectSystem, enemy.x, enemy.y, '#80DEEA', 40);
        effectSystem.addDamageNumber(enemy.x, enemy.y - enemy.charData.size, '退潮!', false, '#80DEEA');
      }
    }
  });

  // 3. Generate splashing rolling water particles along the wave path
  const steps = 14;
  for (let s = 1; s <= steps; s++) {
    const pct = s / steps;
    const px = caster.x + dirX * maxRange * pct;
    const py = caster.y + dirY * maxRange * pct;

    // Splash particles at this node
    const particlesCount = 4;
    for (let k = 0; k < particlesCount; k++) {
      effectSystem.addParticle({
        x: px + (Math.random() - 0.5) * 35,
        y: py + (Math.random() - 0.5) * 35,
        vx: dirX * 180 + (Math.random() - 0.5) * 80,
        vy: dirY * 180 + (Math.random() - 0.5) * 80,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
        color: k % 2 === 0 ? '#80DEEA' : '#FFFFFF',
        size: 2.5 + Math.random() * 5.5,
        gravity: 0,
        friction: 0.94,
        type: 'circle'
      });
    }
  }

  // 4. Summon Tide Sprite (hidden: true) at the end of the wave path
  const ownTeam = caster.battleContext && caster.battleContext.ownTeam
    ? caster.battleContext.ownTeam
    : null;

  if (ownTeam) {
    // Spawn at 80% wave range to stay inside the combat arena bounds
    const spawnX = caster.x + dirX * maxRange * 0.8;
    const spawnY = caster.y + dirY * maxRange * 0.8;

    const summon = new caster.constructor('tide_summon', spawnX, spawnY, caster.team);
    summon.angle = caster.angle;
    summon.battleContext = caster.battleContext; // share context
    ownTeam.push(summon);

    EffectLib.addCloneEffect(effectSystem, spawnX, spawnY, '#80DEEA', 40);
    if (soundSystem) {
      soundSystem.playSummonSound();
    }
  }
}
