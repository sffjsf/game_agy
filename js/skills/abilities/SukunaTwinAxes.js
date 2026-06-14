import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';
import { clamp } from '../../utils.js';

export function executeSukunaTwinAxes(caster, skill, weaponSystem, effectSystem) {
  const opposingTeam = caster.battleContext && caster.battleContext.opposingTeam
    ? caster.battleContext.opposingTeam.filter(enemy => enemy.isAlive() && !(enemy.invisibleTimer > 0))
    : [];

  if (opposingTeam.length === 0) return;

  const target = findNearestEnemy(caster, opposingTeam);
  if (!target) return;

  caster.ultInvincibilityTimer = Math.max(caster.ultInvincibilityTimer || 0, skill.duration || 0.8);

  const dx = target.x - caster.x;
  const dy = target.y - caster.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = (target.charData.size || 30) + (caster.charData.size || 38) + 10;
  const nextX = target.x - (dx / dist) * offset;
  const nextY = target.y - (dy / dist) * offset;
  const ctx = caster.battleContext;
  const oldX = caster.x;
  const oldY = caster.y;

  caster.x = ctx ? clamp(nextX, ctx.arenaX + 30, ctx.arenaX + ctx.arenaWidth - 30) : nextX;
  caster.y = ctx ? clamp(nextY, ctx.arenaY + 30, ctx.arenaY + ctx.arenaHeight - 30) : nextY;
  caster.angle = Math.atan2(target.y - caster.y, target.x - caster.x);

  EffectLib.addDashEffect(effectSystem, oldX, oldY, '#FF1744', 44);
  effectSystem.addTrail(caster.x, caster.y, '#FF1744', 14);

  const range = skill.range || 260;
  const halfAngle = skill.sectorHalfAngle || 1.05;
  addTwinAxeSlash(effectSystem, caster.x, caster.y, caster.angle, range, halfAngle, '#FF1744', 'rgba(255, 23, 68, 0.2)');
  addTwinAxeSlash(effectSystem, caster.x, caster.y, caster.angle + Math.PI, range, halfAngle, '#2B0B0B', 'rgba(43, 11, 11, 0.24)');

  hitSector(caster, opposingTeam, caster.angle, range, halfAngle, skill.damage, effectSystem, '#FF1744');
  hitSector(caster, opposingTeam, caster.angle + Math.PI, range, halfAngle, skill.damage, effectSystem, '#2B0B0B');

  drawSectorBurst(caster, effectSystem, caster.angle, range, '#FF1744');
  drawSectorBurst(caster, effectSystem, caster.angle + Math.PI, range, '#2B0B0B');

  effectSystem.addDamageNumber(caster.x, caster.y - caster.charData.size - 26, '前后双斧!', false, '#FFCDD2');
  effectSystem.screenShake(9);
  if (soundSystem) soundSystem.playSkillSound();
}

function findNearestEnemy(caster, enemies) {
  let target = null;
  let bestDistSq = Infinity;
  enemies.forEach(enemy => {
    const dx = enemy.x - caster.x;
    const dy = enemy.y - caster.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      target = enemy;
    }
  });
  return target;
}

function hitSector(caster, enemies, angle, range, halfAngle, damage, effectSystem, color) {
  enemies.forEach(enemy => {
    if (!enemy.isAlive()) return;
    const dx = enemy.x - caster.x;
    const dy = enemy.y - caster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dist) || dist > range + enemy.charData.size) return;

    let angleDiff = Math.atan2(dy, dx) - angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) <= halfAngle) {
      const beforeHp = enemy.hp;
      enemy.takeDamage(damage, caster.x, caster.y, effectSystem);
      const damageDealt = Math.max(0, beforeHp - enemy.hp);
      if (damageDealt > 0) {
        caster.heal(damageDealt, effectSystem);
      }
      effectSystem.addHitEffect(enemy.x, enemy.y, color);
    }
  });
}

function addTwinAxeSlash(effectSystem, x, y, angle, range, halfAngle, color, fillColor) {
  // Two offset slashes per direction make the "two axes" readable.
  for (let i = 0; i < 2; i++) {
    effectSystem.addParticle({
      x: x + Math.cos(angle + Math.PI / 2) * (i === 0 ? -12 : 12),
      y: y + Math.sin(angle + Math.PI / 2) * (i === 0 ? -12 : 12),
      vx: 0,
      vy: 0,
      life: 0.34,
      maxLife: 0.34,
      color,
      fillColor,
      edgeColor: i === 0 ? '#FFCDD2' : '#FF8A80',
      glowColor: '#FF1744',
      size: range,
      range,
      angle: angle + (i === 0 ? -0.08 : 0.08),
      halfAngle,
      thickness: 20,
      axeSize: 38,
      gravity: 0,
      friction: 1,
      type: 'axe_slash'
    });
  }
}

function drawSectorBurst(caster, effectSystem, angle, range, color) {
  for (let i = 0; i < 38; i++) {
    const spread = (Math.random() - 0.5) * 2.1;
    const particleAngle = angle + spread;
    const distance = 30 + Math.random() * range;
    effectSystem.addParticle({
      x: caster.x + Math.cos(particleAngle) * distance * 0.35,
      y: caster.y + Math.sin(particleAngle) * distance * 0.35,
      vx: Math.cos(particleAngle) * (180 + Math.random() * 180),
      vy: Math.sin(particleAngle) * (180 + Math.random() * 180),
      life: 0.24 + Math.random() * 0.16,
      maxLife: 0.4,
      color,
      size: 5 + Math.random() * 5,
      gravity: 0,
      friction: 0.84,
      type: 'spark'
    });
  }

  effectSystem.addParticle({
    x: caster.x,
    y: caster.y,
    vx: 0,
    vy: 0,
    life: 0.22,
    maxLife: 0.22,
    color: color === '#FF1744' ? 'rgba(255, 23, 68, 0.7)' : 'rgba(43, 11, 11, 0.7)',
    size: range * 0.8,
    gravity: 0,
    friction: 1,
    type: 'ring'
  });
}
