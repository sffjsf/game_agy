import * as EffectLib from '../effects_lib/index.js';
import { Fighter } from '../fighter.js';
import { soundSystem } from '../audio.js';
import { createProjectile } from '../combat/Projectile.js';
import { executeHavocInHeaven } from './abilities/HavocInHeaven.js';

export function applyMeleeHitPassives(fighter, damage, primaryTarget, effectSystem) {
  if (fighter.hasPassive('saitama_splash')) {
    EffectLib.addMeteorEffect(effectSystem, primaryTarget.x, primaryTarget.y, '#FFD700', 70);
    effectSystem.screenShake(5);
    const opposingTeam = fighter.battleContext.opposingTeam;
    if (opposingTeam) {
      opposingTeam.forEach(enemy => {
        if (!enemy.isAlive() || enemy === primaryTarget) return;
        const ex = enemy.x - primaryTarget.x;
        const ey = enemy.y - primaryTarget.y;
        const edist = Math.sqrt(ex * ex + ey * ey);
        if (edist <= 70) {
          enemy.takeDamage(damage * 0.5, fighter.x, fighter.y, effectSystem);
        }
      });
    }
  }
  if (fighter.hasPassive('spear_pierce')) {
    fighter.applyPiercingLineDamage(damage * 0.55, fighter.charData.attackRange * 1.7, 28, primaryTarget, effectSystem);
  }
  if (fighter.hasPassive('hound_bite')) {
    // 40% slow for 2 seconds
    primaryTarget.applySlow(2.0, 0.6);
    effectSystem.addHitEffect(primaryTarget.x, primaryTarget.y, '#FF0000');
  }
  if (fighter.hasPassive('jingu_bang')) {
    // 穿透一条直线上的敌人
    applyPiercingLineDamage(fighter, damage * 0.8, fighter.charData.attackRange * 1.5, 30, primaryTarget, effectSystem);
    effectSystem.addHitEffect(primaryTarget.x, primaryTarget.y, '#FFD700');
    if (Math.random() < 0.3) {
      effectSystem.addDamageNumber(primaryTarget.x, primaryTarget.y - 15, '大圣威压!', false, '#FF9800');
    }
    // Play hit sound locally here if needed
  }

  if (fighter.hasPassive('havoc_proc') && Math.random() < 0.5) {
    if (fighter.charData.skill && fighter.charData.skill.type === 'havoc_in_heaven') {
      executeHavocInHeaven(fighter, fighter.charData.skill, fighter.battleContext.weaponSystem, effectSystem);
    }
  }
}

export function applyPiercingLineDamage(fighter, damage, range, width, primaryTarget, effectSystem) {
  const opposingTeam = fighter.battleContext.opposingTeam;
  if (!opposingTeam) return;
  var dirX = Math.cos(fighter.angle);
  var dirY = Math.sin(fighter.angle);
  opposingTeam.forEach(enemy => {
    if (!enemy.isAlive() || enemy === primaryTarget) return;
    const ex = enemy.x - fighter.x;
    const ey = enemy.y - fighter.y;
    const forward = ex * dirX + ey * dirY;
    const side = Math.abs(ex * dirY - ey * dirX);
    if (forward >= 0 && forward <= range && side <= width) {
      enemy.takeDamage(damage, fighter.x, fighter.y, effectSystem);
      effectSystem.addHitEffect(enemy.x, enemy.y, fighter.charData.color);
    }
  });
}

export function performSummonerBasicAttack(fighter, effectSystem) {
  const teamArr = fighter.battleContext.ownTeam;
  if (!teamArr) return;
  var spawnX = fighter.x + (Math.random() - 0.5) * 60;
  var spawnY = fighter.y + (Math.random() - 0.5) * 60;
  var minion = new Fighter('summoned_golem', spawnX, spawnY, fighter.team);
  teamArr.push(minion);
  EffectLib.addCloneEffect(effectSystem, spawnX, spawnY, '#E040FB', 30);
  if (soundSystem) soundSystem.playSummonSound();
}

export function executeFireConeAttack(fighter, effectSystem) {
  if (!fighter.battleContext.opposingTeam) return;
  const range = fighter.charData.attackRange || 190;
  const coneHalfAngle = Math.PI / 4;
  const opposingTeam = fighter.battleContext.opposingTeam;
  if (!opposingTeam) return;
  if (effectSystem.addFireCone) {
    effectSystem.addFireCone(fighter.x, fighter.y, fighter.angle, '#FF5722', range);
  } else {
    EffectLib.addFireConeEffect(effectSystem, fighter.x, fighter.y, '#FF5722', range);
  }
  effectSystem.screenShake(3);
  opposingTeam.forEach(enemy => {
    if (!enemy.isAlive()) return;
    const dx = enemy.x - fighter.x;
    const dy = enemy.y - fighter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dist) || dist > range) return;
    var angleDiff = Math.atan2(dy, dx) - fighter.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    if (Math.abs(angleDiff) <= coneHalfAngle) {
      enemy.takeDamage(fighter.charData.attackPower, fighter.x, fighter.y, effectSystem);
      enemy.applyBurn(4.0, 6.0);
      effectSystem.addHitEffect(enemy.x, enemy.y, '#FFAB00');
    }
  });
}

export function trySteamWhistle(fighter, opposingTeam, effectSystem) {
  if (!opposingTeam || fighter.isStunned() || fighter.whistleCooldown > 0) return;
  var triggered = false;
  opposingTeam.forEach(enemy => {
    if (!enemy.isAlive()) return;
    if (!isFinite(fighter.x)) fighter.x = 400;
    if (!isFinite(fighter.y)) fighter.y = 300;
    if (!isFinite(enemy.x)) enemy.x = 400;
    if (!isFinite(enemy.y)) enemy.y = 300;
    var dx = enemy.x - fighter.x;
    var dy = enemy.y - fighter.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= 100) return;
    triggered = true;
    var kbAngle = Math.atan2(enemy.y - fighter.y, enemy.x - fighter.x);
    if (isNaN(kbAngle) || !isFinite(kbAngle)) kbAngle = 0;
    if (!enemy.hasPassive('stone_shell')) {
      var nextX = enemy.x + Math.cos(kbAngle) * 80;
      var nextY = enemy.y + Math.sin(kbAngle) * 80;
      if (isFinite(nextX)) enemy.x = nextX;
      if (isFinite(nextY)) enemy.y = nextY;
    }
    enemy.applySlow(2.0);
    effectSystem.addHitEffect(enemy.x, enemy.y, '#FFD700');
    const msg = enemy.hasPassive('stone_shell') ? '减慢!' : '击退 & 减慢!';
    effectSystem.addDamageNumber(enemy.x, enemy.y - enemy.charData.size, msg, false, '#FFD700');
  });
  if (!triggered) return;
  fighter.whistleCooldown = 6.0;
  EffectLib.addWhistleEffect(effectSystem, fighter.x, fighter.y, fighter.charData.color, 100);
  soundSystem.playSkillSound();
  fighter.showSkillName(effectSystem, '蒸汽鸣笛');
  effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '鸣笛 TOOT!', false, '#FFD700');
}

export function tryHeavenlyEye(fighter, opposingTeam, effectSystem) {
  if (!opposingTeam || fighter.isStunned() || fighter.heavenlyEyeCooldown > 0) return;
  
  // Find furthest enemy
  let furthestEnemy = null;
  let maxDist = -1;
  opposingTeam.forEach(enemy => {
    if (!enemy.isAlive()) return;
    let dx = enemy.x - fighter.x;
    let dy = enemy.y - fighter.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) {
      maxDist = dist;
      furthestEnemy = enemy;
    }
  });

  if (!furthestEnemy) return;

  fighter.heavenlyEyeCooldown = 5.0; // 5 seconds cooldown

  let angle = Math.atan2(furthestEnemy.y - fighter.y, furthestEnemy.x - fighter.x);
  if (isNaN(angle) || !isFinite(angle)) angle = 0;
  let speed = 2500; // Instant basically
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;

  let damage = fighter.charData.attackPower * 2.5; // True damage multiplier
  
  // Create laser projectile that pieces all enemies
  let proj = createProjectile(fighter.x, fighter.y, vx, vy, damage, fighter.team, '#FFF176', 40, 'laser', fighter);
  fighter.battleContext.weaponSystem.projectiles.push(proj);

  EffectLib.addStunEffect(effectSystem, fighter.x, fighter.y, '#FFD700', 30);
  soundSystem.playShootSound();
}

export function tryDamageAvoidancePassives(fighter, effectSystem) {
  if (fighter.hasPassive('saitama_dodge') && Math.random() < 0.35) {
    effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '闪避!', false, '#FFFFFF');
    effectSystem.addHitEffect(fighter.x, fighter.y, '#FFFFFF');
    return true;
  }

  if (fighter.hasPassive('wind_walker') && Math.random() < 0.25) {
    effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '御风!', false, '#B0E0E6');
    effectSystem.addHitEffect(fighter.x, fighter.y, '#B0E0E6');
    // Grant wind fury: +40% speed, +25% damage for 2.5s
    fighter.windFuryTimer = 2.5;
    return true;
  }

  return false;
}

export function applyDamageReductionPassives(fighter, damage, effectSystem, attackerX, attackerY) {
  if (fighter.hasPassive('shield_wall') && attackerX !== undefined && attackerY !== undefined) {
    const attackAngle = Math.atan2(attackerY - fighter.y, attackerX - fighter.x);
    let angleDiff = attackAngle - fighter.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    if (Math.abs(angleDiff) <= Math.PI * 0.45) {
      damage *= 0.75;
      effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '盾阵减伤!', false, '#CFD8DC');
    }
  }

  if (fighter.hasPassive('stone_shell')) {
    damage *= 0.9; // 10% damage reduction
    const maxDamageCap = fighter.maxHp * 0.15;
    if (damage > maxDamageCap) {
      damage = maxDamageCap;
      effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '外壳减伤!', false, '#9E9E9E');
    }
  }
  
  if (fighter.hasPassive('electromagnetic_shield')) {
    if (fighter.mechaShield > 0) {
      if (damage >= fighter.mechaShield) {
        damage -= fighter.mechaShield;
        fighter.mechaShield = 0;
        effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '护盾过载!', false, '#FF6D00');
      } else {
        fighter.mechaShield -= damage;
        effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, `电磁偏转 ${Math.floor(damage)}`, false, '#FF9800');
        damage = 0;
      }
    }
    if (damage > 0 && fighter.hp - damage < fighter.maxHp * 0.35 && !fighter.mechaShieldUsed) {
      fighter.mechaShieldUsed = true;
      fighter.mechaShield = fighter.maxHp * 0.30;
      effectSystem.addHealEffect(fighter.x, fighter.y);
      effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '+磁能护盾!', false, '#FF6D00');
      EffectLib.addCloneEffect(effectSystem, fighter.x, fighter.y, '#FF6D00', 40);
    }
  }

  if (!fighter.hasPassive('blood_shield')) return damage;
  if (fighter.bloodShield > 0) {
    if (damage >= fighter.bloodShield) {
      damage -= fighter.bloodShield;
      fighter.bloodShield = 0;
      effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '护盾破碎!', false, '#FF1744');
    } else {
      fighter.bloodShield -= damage;
      effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, `吸收 ${Math.floor(damage)}`, false, '#FF5252');
      damage = 0;
    }
  }
  if (damage > 0 && fighter.hp - damage < 45 && fighter.bloodShieldCooldown <= 0) {
    fighter.bloodShield = 35;
    fighter.bloodShieldCooldown = 15.0;
    effectSystem.addHealEffect(fighter.x, fighter.y);
    effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '+血红护盾!', false, '#FF1744');
    EffectLib.addCloneEffect(effectSystem, fighter.x, fighter.y, '#FF1744', 40);
  }
  return damage;
}

export function tryLethalSurvivalPassives(fighter, effectSystem) {
  if (fighter.hp > 0 || fighter.rebirthUsed) return false;

  if (fighter.hasPassive('inferno_rebirth')) {
    fighter.rebirthUsed = true;
    fighter.hp = Math.min(fighter.maxHp, 45);
    fighter.buffs.clearBurn();
    EffectLib.addFireBurstEffect(effectSystem, fighter.x, fighter.y, '#FF5722', 150);
    effectSystem.screenShake(14);
    effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size - 18, '浴火重生!', false, '#FFD54F');
    const opposingTeam = fighter.battleContext.opposingTeam;
    if (opposingTeam) {
      opposingTeam.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const dx = enemy.x - fighter.x;
        const dy = enemy.y - fighter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (isFinite(dist) && dist <= 150) {
          enemy.takeDamage(18, fighter.x, fighter.y, effectSystem);
          enemy.applyBurn(4.0, 6.0);
        }
      });
    }
    return true;
  }

  if (fighter.hasPassive('life_saving_hair')) {
    fighter.rebirthUsed = true;
    fighter.hp = Math.floor(fighter.maxHp * 0.5); // 恢复 50% 血量
    fighter.buffs.clearDebuffs();
    EffectLib.addCloneEffect(effectSystem, fighter.x, fighter.y, '#FFD700', 80);
    effectSystem.screenShake(10);
    effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size - 18, '救命毫毛!', false, '#FFEB3B');
    return true;
  }

  return false;
}

export function trySentryDrones(fighter, opposingTeam, effectSystem, dt) {
  if (!opposingTeam || fighter.isStunned()) return;

  if (fighter.sentryDroneTimer === undefined) {
    fighter.sentryDroneTimer = 0;
  }

  fighter.sentryDroneTimer -= dt;
  if (fighter.sentryDroneTimer <= 0) {
    fighter.sentryDroneTimer = 0.8; // Shoot every 0.8 seconds

    // Find closest enemy
    let closestEnemy = null;
    let minDist = Infinity;
    opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const dx = enemy.x - fighter.x;
      const dy = enemy.y - fighter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      const leftAngle = fighter.angle + Math.PI / 2;
      const rightAngle = fighter.angle - Math.PI / 2;

      const size = fighter.charData.size;
      const leftX = fighter.x + Math.cos(leftAngle) * size * 0.9;
      const leftY = fighter.y + Math.sin(leftAngle) * size * 0.9;
      const rightX = fighter.x + Math.cos(rightAngle) * size * 0.9;
      const rightY = fighter.y + Math.sin(rightAngle) * size * 0.9;

      const speed = 800;

      // Left drone shoot
      const dxL = closestEnemy.x - leftX;
      const dyL = closestEnemy.y - leftY;
      const distL = Math.sqrt(dxL * dxL + dyL * dyL) || 1;
      const vxL = (dxL / distL) * speed;
      const vyL = (dyL / distL) * speed;

      // Right drone shoot
      const dxR = closestEnemy.x - rightX;
      const dyR = closestEnemy.y - rightY;
      const distR = Math.sqrt(dxR * dxR + dyR * dyR) || 1;
      const vxR = (dxR / distR) * speed;
      const vyR = (dyR / distR) * speed;

      const projL = createProjectile(leftX, leftY, vxL, vyL, 5, fighter.team, '#FF6D00', 12, 'laser', fighter);
      const projR = createProjectile(rightX, rightY, vxR, vyR, 5, fighter.team, '#FF6D00', 12, 'laser', fighter);

      fighter.battleContext.weaponSystem.projectiles.push(projL);
      fighter.battleContext.weaponSystem.projectiles.push(projR);

      EffectLib.addMultiShotEffect(effectSystem, leftX, leftY, '#FF6D00', 10);
      EffectLib.addMultiShotEffect(effectSystem, rightX, rightY, '#FF6D00', 10);

      if (soundSystem) soundSystem.playShootSound();
    }
  }
}
