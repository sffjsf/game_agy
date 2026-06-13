import * as Passives from '../skills/Passives.js';
import { soundSystem } from '../audio.js';
import { safeFinite, safeDirection, clamp } from '../utils.js';

export class FighterHealth {
  static takeDamage(f, damage, attackerX, attackerY, effectSystem) {
    if (!f.alive) return;

    // Sanitise all inputs once at the top
    f.x  = safeFinite(f.x, 400);
    f.y  = safeFinite(f.y, 300);
    f.hp = safeFinite(f.hp, f.maxHp);
    damage   = safeFinite(damage, 0);
    attackerX = safeFinite(attackerX, f.x);
    attackerY = safeFinite(attackerY, f.y);

    if (FighterHealth.tryDamageAvoidancePassives(f, effectSystem)) return;
    damage = FighterHealth.applyDamageReductionPassives(f, damage, effectSystem, attackerX, attackerY);

    if (damage <= 0) return;

    f.hp -= damage;
    f.hp = clamp(f.hp, 0, f.maxHp);

    // Visual feedback
    f.hitFlashTimer = 0.15;
    effectSystem.addHitEffect(f.x, f.y, f.charData.color);
    const damageColor = f.team === 'left' ? '#FF5252' : '#29B6F6';
    effectSystem.addDamageNumber(f.x, f.y - f.charData.size, damage, false, damageColor);

     // Play hit sound
    if (soundSystem) soundSystem.playHitSound();

    // Blazing wings passive: burn the closest enemy to the attack position
    if (f.hasPassive('blazing_wings') && f.battleContext && f.battleContext.opposingTeam) {
      let closestAttacker = null;
      let minDistance = Infinity;
      f.battleContext.opposingTeam.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const dx = enemy.x - attackerX;
        const dy = enemy.y - attackerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          closestAttacker = enemy;
        }
      });
      if (closestAttacker) {
        closestAttacker.applyBurn(2.0, 6.0);
      }
    }

    // Knockback (5-8px away from attacker)
    if (!f.hasPassive('stone_shell')) {
      const kb = safeDirection(f.x - attackerX, f.y - attackerY);
      var kbDist = 5 + Math.random() * 3;
      f.x += kb.dx * kbDist;
      f.y += kb.dy * kbDist;
    }

    // State transition
    if (f.hp <= 0) {
      if (FighterHealth.tryLethalSurvivalPassives(f, effectSystem)) {
        f.setState('chase');
      } else {
        if (soundSystem) soundSystem.playDeathSound();
        f.setState('dead');
      }
    } else if (f.state !== 'attack' && f.state !== 'skill' && f.state !== 'reposition' && f.state !== 'dashing_skill' && f.state !== 'channeling' && f.state !== 'dead') {
      f.setState('hit');
    }
  }

  static heal(f, amount, effectSystem) {
    if (!f.alive) return;
    amount = safeFinite(amount, 0);
    f.hp = clamp(f.hp + amount, 0, f.maxHp);
    effectSystem.addHealEffect(f.x, f.y);
  }

  static tryDamageAvoidancePassives(f, effectSystem) {
    return Passives.tryDamageAvoidancePassives(f, effectSystem);
  }

  static applyDamageReductionPassives(f, damage, effectSystem, attackerX, attackerY) {
    return Passives.applyDamageReductionPassives(f, damage, effectSystem, attackerX, attackerY);
  }

  static tryLethalSurvivalPassives(f, effectSystem) {
    return Passives.tryLethalSurvivalPassives(f, effectSystem);
  }

  static healFromDamage(f, damage, effectSystem, overrideRatio) {
    var ratio = typeof overrideRatio === 'number' ? overrideRatio : (f.charData.lifesteal || 0);
    if (ratio <= 0 || damage <= 0) return;
    FighterHealth.heal(f, damage * ratio, effectSystem);
  }
}
