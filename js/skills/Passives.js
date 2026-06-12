import * as EffectLib from '../effects_lib/index.js';
import { Fighter } from '../fighter.js';
import { soundSystem } from '../audio.js';
import { createProjectile } from '../combat/Projectile.js';

export function applyMeleeHitPassives(fighter, damage, primaryTarget, effectSystem) {
  if (fighter.hasPassive('saitama_splash')) {
    EffectLib.addMeteorEffect(effectSystem, primaryTarget.x, primaryTarget.y, '#FFD700', 70);
    effectSystem.screenShake(5);
    const opposingTeam = fighter.team === 'left' ? fighter.combatManager.fightersRight : fighter.combatManager.fightersLeft;
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
  }
}

export function applyPiercingLineDamage(fighter, damage, range, width, primaryTarget, effectSystem) {
  const opposingTeam = fighter.team === 'left' ? fighter.combatManager.fightersRight : fighter.combatManager.fightersLeft;
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
  const teamArr = fighter.team === 'left' ? fighter.combatManager.fightersLeft : fighter.combatManager.fightersRight;
  if (!teamArr) return;
  var spawnX = fighter.x + (Math.random() - 0.5) * 60;
  var spawnY = fighter.y + (Math.random() - 0.5) * 60;
  var minion = new Fighter('summoned_golem', spawnX, spawnY, fighter.team);
  minion.combatManager = fighter.combatManager;
  teamArr.push(minion);
  EffectLib.addCloneEffect(effectSystem, spawnX, spawnY, '#E040FB', 30);
  if (soundSystem) soundSystem.playSummonSound();
}

export function executeFireConeAttack(fighter, effectSystem) {
  if (!fighter.combatManager) return;
  const range = fighter.charData.attackRange || 190;
  const coneHalfAngle = Math.PI / 4;
  const opposingTeam = fighter.team === 'left' ? fighter.combatManager.fightersRight : fighter.combatManager.fightersLeft;
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
  if (!opposingTeam || fighter.stunTimer > 0 || fighter.whistleCooldown > 0) return;
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
    var nextX = enemy.x + Math.cos(kbAngle) * 80;
    var nextY = enemy.y + Math.sin(kbAngle) * 80;
    if (isFinite(nextX)) enemy.x = nextX;
    if (isFinite(nextY)) enemy.y = nextY;
    enemy.applySlow(2.0);
    effectSystem.addHitEffect(enemy.x, enemy.y, '#FFD700');
    effectSystem.addDamageNumber(enemy.x, enemy.y - enemy.charData.size, '击退 & 减慢!', false, '#FFD700');
  });
  if (!triggered) return;
  fighter.whistleCooldown = 6.0;
  EffectLib.addWhistleEffect(effectSystem, fighter.x, fighter.y, fighter.charData.color, 100);
  soundSystem.playSkillSound();
  fighter.showSkillName(effectSystem, '蒸汽鸣笛');
  effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '鸣笛 TOOT!', false, '#FFD700');
}

export function tryHeavenlyEye(fighter, opposingTeam, effectSystem) {
  if (!opposingTeam || fighter.stunTimer > 0 || fighter.heavenlyEyeCooldown > 0) return;
  
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
  let proj = createProjectile(fighter.x, fighter.y, vx, vy, damage, fighter.id, '#FFF176', 40, 'laser', fighter);
  fighter.combatManager.weaponSystem.projectiles.push(proj);

  EffectLib.addStunEffect(effectSystem, fighter.x, fighter.y, '#FFD700', 30);
  soundSystem.playShootSound();
}

export function tryDamageAvoidancePassives(fighter, effectSystem) {
  if (!fighter.hasPassive('saitama_dodge')) return false;
  if (Math.random() >= 0.35) return false;
  effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size, '闪避!', false, '#FFFFFF');
  effectSystem.addHitEffect(fighter.x, fighter.y, '#FFFFFF');
  return true;
}

export function applyDamageReductionPassives(fighter, damage, effectSystem) {
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
  if (!fighter.hasPassive('inferno_rebirth') || fighter.rebirthUsed || fighter.hp > 0) return false;
  fighter.rebirthUsed = true;
  fighter.hp = Math.min(fighter.maxHp, 45);
  fighter.burnTimer = 0;
  fighter.burnDps = 0;
  EffectLib.addFireBurstEffect(effectSystem, fighter.x, fighter.y, '#FF5722', 150);
  effectSystem.screenShake(14);
  effectSystem.addDamageNumber(fighter.x, fighter.y - fighter.charData.size - 18, '浴火重生!', false, '#FFD54F');
  const opposingTeam = fighter.team === 'left' ? fighter.combatManager.fightersRight : fighter.combatManager.fightersLeft;
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

