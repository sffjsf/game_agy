import * as EffectLib from '../../effects_lib/index.js';
import { safeDirection, normaliseAngle } from '../../utils.js';

/**
 * Whirlwind (大风车) — initial burst when skill fires.
 */
export function executeWhirlwind(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  EffectLib.addAoeMeleeEffect(effectSystem, caster.x, caster.y, caster.charData.color, skill.range);

  for (var i = 0; i < 22; i++) {
    var angle = (i / 22) * Math.PI * 2;
    var speed = 140 + Math.random() * 90;
    effectSystem.addParticle({
      x: caster.x,
      y: caster.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      color: caster.charData.secondaryColor || '#FF6F00',
      size: 4 + Math.random() * 5,
      gravity: 0,
      friction: 0.82,
      type: 'spark'
    });
  }

  effectSystem.screenShake(10);
}

/**
 * Whirlwind channeling tick — called every frame during the spin.
 * Handles rotation, movement, and particle trails.
 */
export function executeWhirlwindTick(caster, skill, effectSystem, dt) {
  // Fast rotation
  caster.angle += dt * 18;
  caster.angle = normaliseAngle(caster.angle);

  // Move toward target at reduced speed
  if (caster.target && caster.target.isAlive()) {
    var dir = safeDirection(caster.target.x - caster.x, caster.target.y - caster.y);
    caster.x += dir.dx * caster.charData.speed * 30 * dt;
    caster.y += dir.dy * caster.charData.speed * 30 * dt;
  }

  // Spinning particle trail
  if (Math.random() < 0.5) {
    effectSystem.addTrail(
      caster.x + (Math.random() - 0.5) * 20,
      caster.y + (Math.random() - 0.5) * 20,
      caster.charData.secondaryColor + '80', 4
    );
  }
}

/**
 * Whirlwind damage tick — called every 0.25s during the spin.
 * Deals AoE damage + lifesteal to all enemies in range.
 */
export function executeWhirlwindDamage(caster, skill, effectSystem) {
  var opposingTeam = caster.battleContext.opposingTeam;
  if (!opposingTeam) return;

  opposingTeam.forEach(function(enemy) {
    if (enemy.isAlive()) {
      var ex = enemy.x - caster.x;
      var ey = enemy.y - caster.y;
      var edist = Math.sqrt(ex * ex + ey * ey);
      if (edist <= skill.range) {
        enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
        caster.healFromDamage(skill.damage, effectSystem);
        effectSystem.addHitEffect(enemy.x, enemy.y, caster.charData.color);
      }
    }
  });

  effectSystem.screenShake(2);
}
