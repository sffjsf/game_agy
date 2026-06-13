import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

/**
 * Throws a flask of acid that explodes into a corrosive toxic cloud.
 * Deals initial damage, poisons, slows, and corrodes targets (damage amplification).
 */
export function executeCorrosiveCloud(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  if (!caster.target || !caster.target.isAlive()) return;

  const area = skill.area || 90;
  const targetX = caster.target.x;
  const targetY = caster.target.y;
  const duration = skill.duration || 3.5;
  const poisonDps = skill.poisonDps || 5.0;

  // 1. Spawn poison cloud particles at target position
  EffectLib.addPoisonCloudEffect(effectSystem, targetX, targetY, '#76FF03', area);
  effectSystem.screenShake(3);
  if (soundSystem) soundSystem.playSkillSound();

  // 2. Spawn poison/acid ground zone (DPS + slow)
  if (caster.battleContext && caster.battleContext.addPoisonZone) {
    caster.battleContext.addPoisonZone(targetX, targetY, caster.team, area, duration, poisonDps, 1.2);
  }

  // 3. Apply initial burst, poison, slow, and corrosion status to all targets in radius
  const opposingTeam = caster.battleContext && caster.battleContext.opposingTeam
    ? caster.battleContext.opposingTeam
    : [];

  opposingTeam.forEach(enemy => {
    if (enemy.isAlive()) {
      const ex = enemy.x - targetX;
      const ey = enemy.y - targetY;
      const edist = Math.sqrt(ex * ex + ey * ey);

      if (edist <= area) {
        // Initial explosive damage
        enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);

        // Apply debuffs
        enemy.applyPoison(duration, poisonDps);
        enemy.applySlow(1.2);

        // Set custom corrosion timer (reduces defense / increases damage taken by 30%)
        enemy.corrosionTimer = duration;

        // Custom combat text and impact particles
        effectSystem.addDamageNumber(enemy.x, enemy.y - enemy.charData.size, '腐蚀!', false, '#76FF03');
        effectSystem.addHitEffect(enemy.x, enemy.y, '#76FF03');
      }
    }
  });
}
