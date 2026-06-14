import * as Passives from '../skills/Passives.js';
import { soundSystem } from '../audio.js';
import { safeFinite, safeDirection, clamp } from '../utils.js';
import * as EffectLib from '../effects_lib/index.js';

export class FighterHealth {
  static takeDamage(f, damage, attackerX, attackerY, effectSystem, options) {
    if (!f.alive) return;

    // Sanitise all inputs once at the top
    f.x  = safeFinite(f.x, 400);
    f.y  = safeFinite(f.y, 300);
    f.hp = safeFinite(f.hp, f.maxHp);
    damage   = safeFinite(damage, 0);
    attackerX = safeFinite(attackerX, f.x);
    attackerY = safeFinite(attackerY, f.y);

    if (f.hasPassive && f.hasPassive('sukuna_basic_spin') && f.sukunaBasicSpin && damage > 0) {
      FighterHealth.heal(f, damage, effectSystem);
      effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 18, '伤转疗!', false, '#FF1744');
      effectSystem.addHealEffect(f.x, f.y);
      return;
    }

    // Ult Invincibility, Chronoshift invulnerability, or Sword Deity survival dash check
    if (f.ultInvincibilityTimer > 0 || (f.chronoshiftInvulnTimer && f.chronoshiftInvulnTimer > 0) || (f.chronoshiftTimer && f.chronoshiftTimer > 0) || (f.invulnerableDashTimer && f.invulnerableDashTimer > 0)) {
      effectSystem.addDamageNumber(f.x, f.y - f.charData.size, '免伤!', false, '#E6C229');
      return;
    }

    if (FighterHealth.tryDamageAvoidancePassives(f, effectSystem)) return;

    // Acid corrosion: +30% damage taken
    if (f.corrosionTimer > 0) {
      damage *= 1.30;
    }

    damage = FighterHealth.applyDamageReductionPassives(f, damage, effectSystem, attackerX, attackerY);
    const isBurnDamage = options && options.type === 'burn';
    const shouldTriggerFrostShield = f.hasPassive && f.hasPassive('frost_shield') && !isBurnDamage;
    if (shouldTriggerFrostShield) {
      const cap = f.maxHp * 0.05;
      if (damage > cap) {
        damage = cap;
        effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 18, '冰盾减伤!', false, '#B3E5FC');
      }
    }

    if (damage <= 0) return;

    // shadow_clone_save check
    const targetHpThreshold = f.maxHp * 0.30;
    if (f.hasPassive('shadow_clone_save') && f.hp - damage <= targetHpThreshold && !f.shadowCloneSaveUsed && f.alive) {
      f.shadowCloneSaveUsed = true;

      const ownTeam = f.battleContext && f.battleContext.ownTeam ? f.battleContext.ownTeam : null;
      if (ownTeam) {
        const clone = new f.constructor('shadow_clone', f.x, f.y, f.team);
        clone.angle = f.angle;
        clone.battleContext = f.battleContext;
        ownTeam.push(clone);
        EffectLib.addCloneEffect(effectSystem, f.x, f.y, f.charData.secondaryColor || '#9C27B0', 40);
      }

      const opposingTeam = f.battleContext && f.battleContext.opposingTeam
        ? f.battleContext.opposingTeam.filter(e => e.isAlive())
        : [];
      if (opposingTeam.length > 0) {
        const weakest = opposingTeam.slice().sort((a, b) => a.hp - b.hp)[0];
        const angle = weakest.angle;
        f.x = weakest.x - Math.cos(angle) * 55;
        f.y = weakest.y - Math.sin(angle) * 55;
        f.angle = angle;
        EffectLib.addCloneEffect(effectSystem, f.x, f.y, f.charData.secondaryColor || '#9C27B0', 35);
      }

      f.invisibleTimer = 1.0;
      damage = 0;
      f.hp = Math.max(f.hp, targetHpThreshold);

      effectSystem.addDamageNumber(f.x, f.y - f.charData.size, '残影遁避!', false, '#9C27B0');
      if (soundSystem) soundSystem.playSkillSound();
      return;
    }

    f.hp -= damage;
    f.hp = clamp(f.hp, 0, f.maxHp);

    // Passive: Celestial Sword Deity gains a flying sword when taking damage
    if (f.hasPassive('passive_sword_array') && f.alive && f.hp > 0) {
      f.swordCount = Math.min((f.swordCount || 0) + 1, 9);
    }

    if (shouldTriggerFrostShield && f.alive && f.hp > 0) {
      FighterHealth.fireFrostShieldBlade(f, effectSystem);
    }

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
      // ── Chronoshift Save Check ──
      let timeTraveler = null;
      const ownTeam = f.battleContext && f.battleContext.ownTeam ? f.battleContext.ownTeam : [];
      for (const teammate of ownTeam) {
        if (teammate.isAlive() && (teammate === f || teammate.hp > 0) && teammate.hasPassive('chronoshift') && !teammate.chronoshiftUsed) {
          timeTraveler = teammate;
          break;
        }
      }

      if (timeTraveler) {
        timeTraveler.chronoshiftUsed = true;
        f.hp = 1;
        f.chronoshiftTimer = 1.0;
        f.chronoshiftInvulnTimer = 1.0;
        f.applyStun(1.0);
        effectSystem.addDamageNumber(f.x, f.y - f.charData.size, '时空回溯!', false, '#E6C229');
        EffectLib.addCloneEffect(effectSystem, f.x, f.y, '#E6C229', 45);
        if (soundSystem) soundSystem.playSkillSound();
        f.setState('hit');
        return;
      }

      if (FighterHealth.tryLethalSurvivalPassives(f, effectSystem)) {
        f.setState('chase');
      } else {
        const revived = Passives.triggerFinalSunrise(f, effectSystem);
        if (revived === f) {
          f.setState('chase');
        } else {
          if (soundSystem) soundSystem.playDeathSound();
          f.setState('dead');
        }
      }
    } else if (f.state !== 'attack' && f.state !== 'skill' && f.state !== 'reposition' && f.state !== 'dashing_skill' && f.state !== 'channeling' && f.state !== 'dead') {
      f.setState('hit');
    }
  }

  static heal(f, amount, effectSystem) {
    if (!f.alive) return;
    amount = safeFinite(amount, 0);
    const wasFull = f.hp >= f.maxHp;
    if (amount > 0 && wasFull && f.hasPassive && f.hasPassive('sukuna_overheal_hunt') && (f.sukunaOverhealCooldown || 0) <= 0) {
      f.sukunaOverhealRequested = true;
    }
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

  static fireFrostShieldBlade(f, effectSystem) {
    if (!f.battleContext || !f.battleContext.opposingTeam) return;
    const range = 420;
    const width = 70;
    const dirX = Math.cos(f.angle);
    const dirY = Math.sin(f.angle);
    f.battleContext.opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const ex = enemy.x - f.x;
      const ey = enemy.y - f.y;
      const forward = ex * dirX + ey * dirY;
      const side = Math.abs(ex * dirY - ey * dirX);
      if (forward >= 0 && forward <= range && side <= width) {
        enemy.takeDamage(16, f.x, f.y, effectSystem);
        enemy.applySlow(1.2, 0.55);
        effectSystem.addHitEffect(enemy.x, enemy.y, '#B3E5FC');
      }
    });
    for (let i = 0; i < 12; i++) {
      const forward = Math.random() * range;
      const side = (Math.random() - 0.5) * width * 2;
      effectSystem.addParticle({
        x: f.x + dirX * forward + -dirY * side,
        y: f.y + dirY * forward + dirX * side,
        vx: dirX * 260,
        vy: dirY * 260,
        life: 0.28,
        maxLife: 0.28,
        color: '#B3E5FC',
        size: 5,
        gravity: 0,
        friction: 0.95,
        type: 'spark'
      });
    }
    effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 20, '大冰刃!', false, '#B3E5FC');
  }
}
