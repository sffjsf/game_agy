import * as EffectLib from '../effects_lib/index.js';
import * as Passives from '../skills/Passives.js';
import { executeSkillStrategy } from '../skills/SkillRegistry.js';
import { soundSystem } from '../audio.js';
import { getArenaBoundaryIntersection } from '../skills/abilities/BlazingStampede.js';
import { clamp } from '../utils.js';

/**
 * AttackHandler - Executes attacks, skills, and dashing-skill payloads for a Fighter.
 *
 * Extracted from fighter.js. All methods are static — they operate on the given
 * Fighter instance (reading and mutating its state), but the orchestration logic
 * lives here instead of bloating the Fighter class.
 */
export class AttackHandler {
  /**
   * Execute a normal attack (melee or ranged).
   * @param {Fighter} f - The attacking fighter
   * @param {WeaponSystem} weaponSystem
   * @param {EffectSystem} effectSystem
   */
  static executeAttack(f, weaponSystem, effectSystem) {
    if (!f.target || !f.target.isAlive()) return;

    if (f.charData.weaponType === 'melee') {
      if (f.charData.id === 'frost_lord') {
        AttackHandler.executeFrostLordBasicAttack(f, effectSystem);
        if (soundSystem) soundSystem.playSkillSound();
        return;
      }

      if (f.charData.id === 'two_faced_sukuna') {
        f.sukunaLowHpBasicFollowup = f.hp < f.maxHp * 0.5;
        AttackHandler.executeSukunaBasicSpin(f, effectSystem);
        if (soundSystem) soundSystem.playSwingSound();
        return;
      }

      if (f.charData.id === 'celestial_sword_deity') {
        AttackHandler.flashToCelestialTargetFront(f, f.target, effectSystem);

        // 1. Release active passive swords in a fan shape towards target
        if (f.swordCount > 0) {
          const count = f.swordCount;
          f.swordCount = 0;
          
          for (let i = 0; i < count; i++) {
            const angleOffset = (i - (count - 1) / 2) * 0.12; // Spread flying swords in a fan shape
            const dirX = Math.cos(f.angle + angleOffset);
            const dirY = Math.sin(f.angle + angleOffset);
            
            weaponSystem.createRangedAttack(
              f.x - Math.cos(f.angle) * 12,
              f.y - Math.sin(f.angle) * 12,
              f.x + dirX * 300,
              f.y + dirY * 300,
              f.charData.attackPower * 0.3, // Each flying sword deals 30% of attack power
              f.team,
              'flying_sword',
              '#FFEB3B',
              f,
              f.battleContext.opposingTeam
            );
          }
          if (soundSystem) soundSystem.playShootSound();
        }

        // 2. Spawn the basic attack sword wave directed towards target
        weaponSystem.createRangedAttack(
          f.x, f.y,
          f.target.x, f.target.y,
          f.charData.attackPower,
          f.team,
          'sword_wave',
          '#FFF59D',
          f,
          f.battleContext.opposingTeam
        );

        // 3. Legendary second strike: instant target-area sword-piercing barrage.
        AttackHandler.executeCelestialBasicSwordBarrage(f, f.target, effectSystem);

        // 4. Passive: gain a sword only from the original basic attack.
        f.swordCount = Math.min((f.swordCount || 0) + 1, 9);

        if (soundSystem) soundSystem.playSwingSound();
        return;
      }

      if (f.hasPassive('fire_cone_basic')) {
        f.executeFireConeAttack(effectSystem);
        if (soundSystem) soundSystem.playSwingSound();
        return;
      }

      // Give a slight lunge slide forward (20px) towards target on attack trigger
      var dx = f.target.x - f.x;
      var dy = f.target.y - f.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        var lungeDist = 20;
        f.x += (dx / dist) * lungeDist;
        f.y += (dy / dist) * lungeDist;
      }

      // Melee: check arc and range with 1.3x tolerance to compensate for high speed movement
      var result = weaponSystem.createMeleeAttack(
        f, f.target,
        f.charData.attackPower,
        f.charData.attackRange * 1.3,
        f.angle
      );

      if (result.hit && f.target.isAlive()) {
        // Bounty mark: +40% damage vs targets below 50% HP
        let finalDamage = result.damage;
        if (f.hasPassive('bounty_mark')) {
          const hpPercent = f.target.hp / f.target.maxHp;
          if (hpPercent < 0.5) {
            finalDamage *= 1.4;
          }
        }

        // Combo strikes: repeated hits on the same target ramp damage
        if (f.hasPassive('combo_strikes')) {
          if (f.comboTarget === f.target) {
            f.comboStacks = Math.min((f.comboStacks || 0) + 1, 5);
          } else {
            f.comboTarget = f.target;
            f.comboStacks = 1;
          }
          finalDamage *= (1 + f.comboStacks * 0.08);
          if (f.comboStacks >= 3) {
            effectSystem.addDamageNumber(f.x, f.y - f.charData.size, `连打 x${f.comboStacks}`, false, '#FFCCBC');
          }
        }

        // shadow_strike check (Blade Master backstab crit + bleed)
        if (f.hasPassive('shadow_strike')) {
          const fromTargetAngle = Math.atan2(f.y - f.target.y, f.x - f.target.x);
          let backAngleDiff = fromTargetAngle - (f.target.angle + Math.PI);
          while (backAngleDiff > Math.PI) backAngleDiff -= Math.PI * 2;
          while (backAngleDiff < -Math.PI) backAngleDiff += Math.PI * 2;
          const isBackstab = Math.abs(backAngleDiff) <= Math.PI * 0.45;
          if (isBackstab) {
            finalDamage *= 1.80; // 180% crit
            f.target.bleedStacks = Math.min((f.target.bleedStacks || 0) + 1, 3);
            f.target.bleedTimer = 3.0;
            f.target.bleedTick = 0.5;
            effectSystem.addDamageNumber(f.target.x, f.target.y - f.target.charData.size - 12, '影袭暴击!', true, '#9C27B0');
            EffectLib.addBackstabEffect(effectSystem, f.target.x, f.target.y, f.charData.secondaryColor || '#9C27B0', 20);
          } else {
            f.target.bleedStacks = Math.min((f.target.bleedStacks || 0) + 1, 3);
            f.target.bleedTimer = 3.0;
            f.target.bleedTick = 0.5;
          }
        }

        // Rogue backstab: bonus damage when attacking from behind the target.
        // Smoke step also guarantees the next attack window can backstab, because
        // enemies constantly turn toward their target outside stun windows.
        if (f.hasPassive('rogue_backstab')) {
          let isBackstab = f.smokeDodgeTimer > 0;
          if (!isBackstab) {
            const fromTargetAngle = Math.atan2(f.y - f.target.y, f.x - f.target.x);
            let backAngleDiff = fromTargetAngle - (f.target.angle + Math.PI);
            while (backAngleDiff > Math.PI) backAngleDiff -= Math.PI * 2;
            while (backAngleDiff < -Math.PI) backAngleDiff += Math.PI * 2;
            isBackstab = Math.abs(backAngleDiff) <= Math.PI * 0.45;
          }
          if (isBackstab) {
            finalDamage *= 1.45;
            effectSystem.addDamageNumber(f.target.x, f.target.y - f.target.charData.size - 12, '背刺!', false, '#B39DDB');
          }
        }

        // Apply outgoing damage multiplier (e.g. wind fury)
        finalDamage *= f.getOutgoingDamageMultiplier();
        finalDamage = Passives.applyDawnDebuffBonus(f, f.target, finalDamage, effectSystem);

        f.applyMeleeHitPassives(finalDamage, f.target, effectSystem);
        f.target.takeDamage(finalDamage, f.x, f.y, effectSystem);
        f.healFromDamage(finalDamage, effectSystem);
        Passives.triggerDawnBlessing(f, effectSystem);
        if (f.target.hp <= 0 || f.target.state === 'dead') {
          Passives.triggerDawnKillRevive(f, effectSystem);
        }

        // Counter stance: consume the empowered strike after landing it
        if (f.counterStanceTimer > 0) {
          f.counterStanceTimer = 0;
        }

        // Counter stance: melee hits prime the target's next counterattack
        if (f.target.isAlive() && f.target.hasPassive('counter_stance')) {
          f.target.counterStanceTimer = 3.0;
          effectSystem.addDamageNumber(f.target.x, f.target.y - f.target.charData.size, '反击!', false, '#D7CCC8');
        }

        // Chain tether: basic attacks can pull the enemy closer
        if (f.target.isAlive() && f.hasPassive('chain_tether') && Math.random() < 0.35) {
          const pullDx = f.x - f.target.x;
          const pullDy = f.y - f.target.y;
          const pullDist = Math.sqrt(pullDx * pullDx + pullDy * pullDy) || 1;
          if (!f.target.hasPassive('stone_shell')) {
            f.target.x += (pullDx / pullDist) * 45;
            f.target.y += (pullDy / pullDist) * 45;
          }
          f.target.applySlow(1.0, 0.6);
          effectSystem.addHitEffect(f.target.x, f.target.y, '#BDBDBD');
          effectSystem.addDamageNumber(f.target.x, f.target.y - f.target.charData.size, '牵制!', false, '#BDBDBD');
        }

        // Shield wall: melee attackers can be knocked back by the target's shield
        if (f.target.isAlive() && f.target.hasPassive('shield_wall') && Math.random() < 0.3) {
          const kbDx = f.x - f.target.x;
          const kbDy = f.y - f.target.y;
          const kbDist = Math.sqrt(kbDx * kbDx + kbDy * kbDy) || 1;
          f.x += (kbDx / kbDist) * 70;
          f.y += (kbDy / kbDist) * 70;
          f.applySlow(0.8, 0.65);
          effectSystem.addHitEffect(f.x, f.y, '#CFD8DC');
          effectSystem.addDamageNumber(f.x, f.y - f.charData.size, '盾反!', false, '#CFD8DC');
        }

        // Bounty mark: on-kill permanent attack speed boost (max 25 stacks)
        if (!f.target.isAlive() && f.hasPassive('bounty_mark')) {
          f.bountyHunterStacks = Math.min((f.bountyHunterStacks || 0) + 1, 25);
        }

        effectSystem.addHitEffect(f.target.x, f.target.y, f.charData.color);
        effectSystem.screenShake(3);
      }
      if (soundSystem) soundSystem.playSwingSound();
    } else {
      // Ranged: spawn projectile or use a special ranged passive.
      if (f.hasPassive('summoner_attack')) {
        f.performSummonerBasicAttack(effectSystem);
      } else {
        weaponSystem.createRangedAttack(
          f.x, f.y,
          f.target.x, f.target.y,
          f.charData.attackPower,
          f.team,
          f.charData.projectileType,
          f.charData.color,
          f,
          f.battleContext.opposingTeam
        );
        if (soundSystem) soundSystem.playShootSound();
      }
    }
  }

  /**
   * Execute the character's special skill.
   * @param {Fighter} f
   * @param {WeaponSystem} weaponSystem
   * @param {EffectSystem} effectSystem
   */
  static executeSkill(f, weaponSystem, effectSystem) {
    if (!f.target || !f.target.isAlive()) return;

    var skill = f.charData.skill;
    f.startSkillCast(effectSystem, skill, skill.nameCN || skill.name);

    executeSkillStrategy(f, skill, weaponSystem, effectSystem);

    // Wind walker: gain wind fury after using any skill
    if (f.hasPassive('wind_walker')) {
      f.windFuryTimer = 2.5;
    }
  }

  /**
   * Execute the hit/payload of a dashing skill after completing the smooth dash movement.
   * @param {Fighter} f
   */
  static executeDashingSkillHit(f) {
    const ctx = f.battleContext;
    const effectSystem = ctx.effectSystem;

    if (!f.target || !f.target.isAlive()) {
      f.setState('chase');
      return;
    }

    var skill = f.charData.skill;
    var dx = f.target.x - f.x;
    var dy = f.target.y - f.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }

    let nextDashStarted = false;

    if (f.dashSkillType === 'dash') {
      // Vampire dash damage & heal
      if (dist <= 45) {
        f.target.takeDamage(skill.damage, f.x, f.y, effectSystem);
        f.healFromDamage(skill.damage, effectSystem);
      }
      effectSystem.screenShake(5);
    } else if (f.dashSkillType === 'backstab') {
      // Assassin backstab critical damage
      if (dist <= skill.range + 20) {
        f.target.takeDamage(skill.damage, f.x, f.y, effectSystem);
        effectSystem.addDamageNumber(f.target.x, f.target.y - 40, skill.damage, true, '#FFD700');
        EffectLib.addBackstabEffect(effectSystem, f.target.x, f.target.y, f.charData.color, 20);
        effectSystem.screenShake(7);
      }
    } else if (f.dashSkillType === 'serious_punch') {
      // One Punch Man serious punch
      EffectLib.addMeteorEffect(effectSystem, f.x, f.y, '#FFD700', 90);
      EffectLib.addAoeMeleeEffect(effectSystem, f.x, f.y, '#FF1744', 130);
      effectSystem.screenShake(18);

      const opposingTeam = f.battleContext.opposingTeam;
      if (opposingTeam) {
        opposingTeam.forEach(enemy => {
          if (enemy.isAlive()) {
            const ex = enemy.x - f.x;
            const ey = enemy.y - f.y;
            const edist = Math.sqrt(ex * ex + ey * ey);
            if (edist <= 130) {
              enemy.takeDamage(skill.damage, f.x, f.y, effectSystem);
            }
          }
        });
      }
    } else if (f.dashSkillType === 'gale_dash') {
      // Wind Dancer: line damage along dash path + wind fury buff
      const startX = f.dashStartX;
      const startY = f.dashStartY;
      const endX = f.dashTargetX;
      const endY = f.dashTargetY;

      const pathDx = endX - startX;
      const pathDy = endY - startY;
      const pathLen = Math.sqrt(pathDx * pathDx + pathDy * pathDy) || 1;

      // Damage all enemies along the dash path (distance threshold 45px)
      const opposingTeam = ctx.opposingTeam;
      if (opposingTeam) {
        opposingTeam.forEach(enemy => {
          if (enemy.isAlive()) {
            const ex = enemy.x;
            const ey = enemy.y;

            let t = ((ex - startX) * pathDx + (ey - startY) * pathDy) / (pathLen * pathLen);
            t = Math.max(0, Math.min(1, t));
            const closestX = startX + t * pathDx;
            const closestY = startY + t * pathDy;
            const distToPath = Math.sqrt((ex - closestX) * (ex - closestX) + (ey - closestY) * (ey - closestY));

            if (distToPath <= 45) {
              enemy.takeDamage(skill.damage, f.x, f.y, effectSystem);
              effectSystem.addHitEffect(enemy.x, enemy.y, f.charData.color);
            }
          }
        });
      }

      // Grant wind fury: +40% move speed, +25% damage for 2.5s
      f.windFuryTimer = 2.5;

      // Wind burst visual
      EffectLib.addDashEffect(effectSystem, f.x, f.y, '#B0E0E6', 40);
      effectSystem.addDamageNumber(f.x, f.y - f.charData.size, '疾风!', false, '#B0E0E6');
      effectSystem.screenShake(4);

    } else if (f.dashSkillType === 'blazing_stampede') {
      // Seraph charge hit & trail logic
      const startX = f.dashStartX;
      const startY = f.dashStartY;
      const endX = f.dashTargetX;
      const endY = f.dashTargetY;

      const pathDx = endX - startX;
      const pathDy = endY - startY;
      const pathLen = Math.sqrt(pathDx * pathDx + pathDy * pathDy) || 1;

      // 1. Damage all enemies along the path (distance threshold 50px)
      const opposingTeam = ctx.opposingTeam;
      if (opposingTeam) {
        opposingTeam.forEach(enemy => {
          if (enemy.isAlive()) {
            const ex = enemy.x;
            const ey = enemy.y;

            let t = ((ex - startX) * pathDx + (ey - startY) * pathDy) / (pathLen * pathLen);
            t = Math.max(0, Math.min(1, t));
            const closestX = startX + t * pathDx;
            const closestY = startY + t * pathDy;
            const distToPath = Math.sqrt((ex - closestX) * (ex - closestX) + (ey - closestY) * (ey - closestY));

            if (distToPath <= 50) {
              enemy.takeDamage(skill.damage, f.x, f.y, effectSystem);
              enemy.applyBurn(2.0, 8.0);
              EffectLib.addFireBurstEffect(effectSystem, enemy.x, enemy.y, '#FF3D00', 30);
            }
          }
        });
      }

      // 2. Spawn a trail of burning zones along the path (radius 45, duration 2.0s, DPS 8.0)
      if (ctx.addBurnZone) {
        const stepSize = 40;
        const numSteps = Math.floor(pathLen / stepSize);
        for (let i = 0; i <= numSteps; i++) {
          const pct = numSteps > 0 ? i / numSteps : 0;
          const px = startX + pathDx * pct;
          const py = startY + pathDy * pct;
          ctx.addBurnZone(px, py, f.team, 45, 2.0, 8.0);
        }
      }

      effectSystem.screenShake(6);

      // 3. Handle consecutive charges
      f.seraphChargeCount--;
      if (f.seraphChargeCount > 0) {
        if (!f.target || !f.target.isAlive()) {
          f.ai.findClosestTarget(ctx.opposingTeam);
        }

        if (f.target && f.target.isAlive()) {
          const nextDx = f.target.x - f.x;
          const nextDy = f.target.y - f.y;
          const nextDist = Math.sqrt(nextDx * nextDx + nextDy * nextDy) || 1;
          let dirX = nextDx / nextDist;
          let dirY = nextDy / nextDist;

          if (nextDist < 15 || isNaN(dirX) || isNaN(dirY) || (dirX === 0 && dirY === 0)) {
            const cx = ctx.arenaX + ctx.arenaWidth / 2;
            const cy = ctx.arenaY + ctx.arenaHeight / 2;
            const toCenterX = cx - f.x;
            const toCenterY = cy - f.y;
            const toCenterDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY) || 1;
            dirX = toCenterX / toCenterDist;
            dirY = toCenterY / toCenterDist;
          }

          const intersection = getArenaBoundaryIntersection(
            f.x, f.y, dirX, dirY,
            ctx.arenaX, ctx.arenaY, ctx.arenaWidth, ctx.arenaHeight
          );

          f.setState('dashing_skill');
          f.dashStartX = f.x;
          f.dashStartY = f.y;
          f.dashTargetX = intersection.x;
          f.dashTargetY = intersection.y;
          f.dashDuration = 0.22;
          f.dashTimer = 0;
          f.dashSkillType = 'blazing_stampede';

          EffectLib.addDashEffect(effectSystem, f.x, f.y, f.charData.color, 25);
          if (soundSystem) soundSystem.playShootSound();
          nextDashStarted = true;
        }
      }
    } else if (f.dashSkillType === 'frost_staff_pierce') {
      AttackHandler.resolveFrostLordStaffPierce(f, effectSystem);
    }

    // Go to cooldown or reposition (only if we did not transition to next dash)
    if (!nextDashStarted) {
      if (Math.random() < 0.4) {
        f.ai.startReposition(ctx);
      } else {
        f.setState('cooldown');
        f.repositionType = (f.charData.weaponType === 'ranged') ? 'retreat' : (Math.random() < 0.65 ? 'circle' : 'retreat');
        f.circleDir = Math.random() < 0.5 ? 1 : -1;
      }
    }
  }

  static executeSukunaBasicSpin(f, effectSystem) {
    if (!f.battleContext || !f.battleContext.opposingTeam) return;

    const radius = f.charData.attackRange || 195;
    f.sukunaBasicSpin = {
      radius,
      hitCount: 10,
      hitDamage: 3,
      hitIndex: 0,
      hitTimer: 0,
      hitInterval: 0.095,
      duration: 1.0,
      elapsed: 0
    };

    EffectLib.addAoeMeleeEffect(effectSystem, f.x, f.y, '#FF1744', radius);
    effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 24, '巨斧回天!', false, '#FF1744');
    effectSystem.screenShake(5);
  }

  static updateSukunaBasicSpin(f, dt, effectSystem) {
    const spin = f.sukunaBasicSpin;
    if (!spin || !f.battleContext || !f.battleContext.opposingTeam) return false;

    spin.elapsed += dt;
    spin.hitTimer += dt;
    f.angle += dt * 24;
    f.ultInvincibilityTimer = Math.max(f.ultInvincibilityTimer || 0, 0.08);

    if (f.target && f.target.isAlive()) {
      const dx = f.target.x - f.x;
      const dy = f.target.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      f.x += (dx / dist) * f.charData.speed * 72 * dt;
      f.y += (dy / dist) * f.charData.speed * 72 * dt;
    }

    if (Math.random() < 0.75) {
      const trailAngle = Math.random() * Math.PI * 2;
      const trailRadius = Math.random() * spin.radius * 0.65;
      effectSystem.addTrail(
        f.x + Math.cos(trailAngle) * trailRadius,
        f.y + Math.sin(trailAngle) * trailRadius,
        '#FF174480',
        7
      );
    }

    while (spin.hitIndex < spin.hitCount && (spin.hitTimer >= spin.hitInterval || spin.elapsed >= spin.duration)) {
      spin.hitTimer -= spin.hitInterval;
      AttackHandler.resolveSukunaSpinHit(f, spin, effectSystem);
      spin.hitIndex++;
    }

    if (spin.hitIndex >= spin.hitCount) {
      f.sukunaBasicSpin = null;
      if (f.sukunaLowHpBasicFollowup) {
        f.sukunaLowHpBasicFollowup = false;
        f.sukunaOverhealRequested = true;
        if (!AttackHandler.tryStartSukunaOverhealHunt(f, effectSystem, true, true)) {
          f.setState('cooldown');
        }
      } else {
        f.setState('cooldown');
      }
    }

    return true;
  }

  static resolveSukunaSpinHit(f, spin, effectSystem) {
    const radius = spin.radius;
    f.battleContext.opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const dx = enemy.x - f.x;
      const dy = enemy.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius + enemy.charData.size) {
        enemy.takeDamage(spin.hitDamage, f.x, f.y, effectSystem);
        effectSystem.addHitEffect(enemy.x, enemy.y, '#FF1744');
      }
    });

    effectSystem.addParticle({
      x: f.x,
      y: f.y,
      vx: 0,
      vy: 0,
      life: 0.16,
      maxLife: 0.16,
      color: spin.hitIndex % 2 === 0 ? 'rgba(255, 23, 68, 0.75)' : 'rgba(43, 11, 11, 0.75)',
      size: radius,
      gravity: 0,
      friction: 1,
      type: 'ring'
    });
    effectSystem.screenShake(1.5);
  }

  static tryStartSukunaOverhealHunt(f, effectSystem, forceNow = false, ignoreCooldown = false) {
    if (!f.hasPassive || !f.hasPassive('sukuna_overheal_hunt')) return false;
    const requested = f.sukunaOverhealRequested || f.sukunaPendingOverhealHunt;
    if (!requested) return false;

    f.sukunaOverhealRequested = false;
    if ((!ignoreCooldown && (f.sukunaOverhealCooldown || 0) > 0) || f.sukunaPassiveSlash) {
      f.sukunaPendingOverhealHunt = false;
      return false;
    }

    if (!forceNow && AttackHandler.isSukunaBusy(f)) {
      f.sukunaPendingOverhealHunt = true;
      return false;
    }

    const target = AttackHandler.findSukunaHighestHpEnemy(f);
    if (!target) {
      f.sukunaPendingOverhealHunt = false;
      return false;
    }

    f.sukunaPendingOverhealHunt = false;
    if (!ignoreCooldown) {
      f.sukunaOverhealCooldown = 4.0;
    }
    f.sukunaPassiveSlash = {
      target,
      hitIndex: 0,
      hitCount: 4,
      hitDamage: f.charData.passiveSlashDamage || 9,
      dashTimer: 0,
      dashDuration: 0.11,
      pauseTimer: 0,
      pauseDuration: 0.05,
      phase: 'dash',
      startX: f.x,
      startY: f.y,
      endX: f.x,
      endY: f.y
    };

    effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 24, '追猎四斩!', false, '#FF1744');
    AttackHandler.prepareSukunaPassiveSlash(f, f.sukunaPassiveSlash, effectSystem);
    return true;
  }

  static isSukunaBusy(f) {
    return !!(
      f.sukunaBasicSpin ||
      f.sukunaPassiveSlash ||
      f.state === 'attack' ||
      f.state === 'skill' ||
      f.state === 'channeling' ||
      f.state === 'dashing_skill'
    );
  }

  static findSukunaHighestHpEnemy(f) {
    const opposingTeam = f.battleContext && f.battleContext.opposingTeam ? f.battleContext.opposingTeam : [];
    let target = null;
    let highestHp = -Infinity;
    opposingTeam.forEach(enemy => {
      if (!enemy.isAlive() || enemy.invisibleTimer > 0) return;
      if (enemy.hp > highestHp) {
        highestHp = enemy.hp;
        target = enemy;
      }
    });
    return target;
  }

  static updateSukunaPassiveSlash(f, dt, effectSystem) {
    const slash = f.sukunaPassiveSlash;
    if (!slash || !f.battleContext || !f.battleContext.opposingTeam) return false;

    f.ultInvincibilityTimer = Math.max(f.ultInvincibilityTimer || 0, 0.18);

    if (!slash.target || !slash.target.isAlive()) {
      slash.target = AttackHandler.findSukunaHighestHpEnemy(f);
      if (!slash.target) {
        f.sukunaPassiveSlash = null;
        f.setState('chase');
        return false;
      }
    }

    if (slash.phase === 'dash') {
      slash.dashTimer += dt;
      const pct = Math.min(1, slash.dashTimer / (slash.dashDuration || 0.11));
      f.x = slash.startX + (slash.endX - slash.startX) * pct;
      f.y = slash.startY + (slash.endY - slash.startY) * pct;
      f.angle = Math.atan2(slash.target.y - f.y, slash.target.x - f.x);
      effectSystem.addTrail(f.x, f.y, '#FF1744', 10);

      if (pct >= 1) {
        AttackHandler.resolveSukunaPassiveSlashHit(f, slash, effectSystem);
        slash.hitIndex++;
        slash.phase = 'pause';
        slash.pauseTimer = 0;
      }
    } else {
      slash.pauseTimer += dt;
      if (slash.pauseTimer >= slash.pauseDuration) {
        if (slash.hitIndex >= slash.hitCount) {
          f.sukunaPassiveSlash = null;
          f.setState('chase');
        } else {
          slash.target = AttackHandler.findSukunaHighestHpEnemy(f);
          if (!slash.target) {
            f.sukunaPassiveSlash = null;
            f.setState('chase');
          } else {
            AttackHandler.prepareSukunaPassiveSlash(f, slash, effectSystem);
          }
        }
      }
    }

    return true;
  }

  static prepareSukunaPassiveSlash(f, slash, effectSystem) {
    const target = slash.target;
    const offset = (target.charData.size || 30) + (f.charData.size || 38) + 12;
    const angle = (slash.hitIndex / slash.hitCount) * Math.PI * 2 + (slash.hitIndex % 2 ? 0.45 : -0.45);
    const endX = target.x + Math.cos(angle) * offset;
    const endY = target.y + Math.sin(angle) * offset;
    const ctx = f.battleContext;

    slash.startX = f.x;
    slash.startY = f.y;
    slash.endX = ctx ? clamp(endX, ctx.arenaX + 30, ctx.arenaX + ctx.arenaWidth - 30) : endX;
    slash.endY = ctx ? clamp(endY, ctx.arenaY + 30, ctx.arenaY + ctx.arenaHeight - 30) : endY;
    slash.dashTimer = 0;
    slash.phase = 'dash';
    f.angle = Math.atan2(target.y - f.y, target.x - f.x);
    EffectLib.addDashEffect(effectSystem, f.x, f.y, '#FF1744', 34);
  }

  static resolveSukunaPassiveSlashHit(f, slash, effectSystem) {
    const target = slash.target;
    if (!target || !target.isAlive()) return;

    target.takeDamage(slash.hitDamage, f.x, f.y, effectSystem);
    effectSystem.addHitEffect(target.x, target.y, '#FF1744');
    effectSystem.addDamageNumber(target.x, target.y - target.charData.size - 12, `四斩 ${slash.hitIndex + 1}`, false, '#FFCDD2');
    EffectLib.addBackstabEffect(effectSystem, target.x, target.y, '#FF1744', 26);
    effectSystem.screenShake(3);
    if (soundSystem) soundSystem.playCritSound();
  }

  /**
   * 九霄剑仙普攻第二段：在被攻击目标圆形区域内触发万剑归宗穿刺。
   * Starts a fixed 10-hit barrage over normal game time and intentionally does not grant swordCount.
   */
  static executeCelestialBasicSwordBarrage(f, target, effectSystem) {
    if (!target || !target.isAlive() || !f.battleContext || !f.battleContext.opposingTeam) return;

    const centerX = target.x;
    const centerY = target.y;
    const radius = 155;
    const hitCount = 10;
    const hitDamage = 4;
    const stunDuration = 1.8;

    f.celestialBasicBarrage = {
      centerX,
      centerY,
      radius,
      hitCount,
      hitDamage,
      hitIndex: 0,
      dashTimer: 0,
      dashDuration: 0.14,
      pauseTimer: 0,
      pauseDuration: 0.04,
      phase: 'dash',
      startX: f.x,
      startY: f.y,
      endX: f.x,
      endY: f.y,
      stunnedTargets: []
    };

    f.battleContext.opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const dx = enemy.x - centerX;
      const dy = enemy.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius + enemy.charData.size) {
        enemy.applyStun(stunDuration);
        f.celestialBasicBarrage.stunnedTargets.push(enemy);
        EffectLib.addStunEffect(effectSystem, enemy.x, enemy.y, '#FFD700', 26);
      }
    });

    AttackHandler.prepareCelestialBarrageDash(f, f.celestialBasicBarrage, effectSystem);
    f.ultInvincibilityTimer = Math.max(f.ultInvincibilityTimer || 0, 1.8);

    effectSystem.addParticle({
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      life: 0.6,
      maxLife: 0.6,
      color: 'rgba(255, 215, 0, 0.85)',
      size: radius,
      gravity: 0,
      friction: 1,
      type: 'ring'
    });
    effectSystem.addDamageNumber(centerX, centerY - radius * 0.55, '万剑归宗', false, '#FFD700');
    effectSystem.screenShake(5);
  }

  static updateCelestialBasicSwordBarrage(f, dt, effectSystem) {
    const barrage = f.celestialBasicBarrage;
    if (!barrage || !f.battleContext || !f.battleContext.opposingTeam) return false;

    f.ultInvincibilityTimer = Math.max(f.ultInvincibilityTimer || 0, 0.18);

    if (barrage.phase === 'dash') {
      barrage.dashTimer += dt;
      const duration = barrage.dashDuration || 0.14;
      const pct = Math.min(1, barrage.dashTimer / duration);

      f.x = barrage.startX + (barrage.endX - barrage.startX) * pct;
      f.y = barrage.startY + (barrage.endY - barrage.startY) * pct;
      f.angle = Math.atan2(barrage.endY - barrage.startY, barrage.endX - barrage.startX);

      effectSystem.addTrail(f.x, f.y, '#FFD700', 8);
      if (Math.random() < 0.65) {
        effectSystem.addParticle({
          x: f.x + (Math.random() - 0.5) * 14,
          y: f.y + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 50,
          vy: (Math.random() - 0.5) * 50,
          life: 0.28,
          maxLife: 0.28,
          color: '#FFF59D',
          size: 3,
          gravity: 0,
          friction: 0.92,
          type: 'circle'
        });
      }

      if (pct >= 1) {
        f.x = barrage.endX;
        f.y = barrage.endY;
        AttackHandler.resolveCelestialBasicSwordHit(f, barrage, effectSystem);
        barrage.hitIndex++;
        barrage.phase = 'pause';
        barrage.pauseTimer = 0;
      }
    } else {
      barrage.pauseTimer += dt;
      if (barrage.pauseTimer >= barrage.pauseDuration) {
        if (barrage.hitIndex >= barrage.hitCount) {
          f.celestialBasicBarrage = null;
          f.setState('cooldown');
        } else {
          AttackHandler.prepareCelestialBarrageDash(f, barrage, effectSystem);
        }
      }
    }

    return true;
  }

  static prepareCelestialBarrageDash(f, barrage, effectSystem) {
    const currentAngle = Math.atan2(f.y - barrage.centerY, f.x - barrage.centerX);
    const weave = (barrage.hitIndex % 2 === 0 ? 0.36 : -0.36);
    const endAngle = currentAngle + Math.PI + weave;
    const startX = f.x;
    const startY = f.y;
    const endX = barrage.centerX + Math.cos(endAngle) * barrage.radius;
    const endY = barrage.centerY + Math.sin(endAngle) * barrage.radius;
    const ctx = f.battleContext;

    barrage.startX = ctx ? clamp(startX, ctx.arenaX + 30, ctx.arenaX + ctx.arenaWidth - 30) : startX;
    barrage.startY = ctx ? clamp(startY, ctx.arenaY + 30, ctx.arenaY + ctx.arenaHeight - 30) : startY;
    barrage.endX = ctx ? clamp(endX, ctx.arenaX + 30, ctx.arenaX + ctx.arenaWidth - 30) : endX;
    barrage.endY = ctx ? clamp(endY, ctx.arenaY + 30, ctx.arenaY + ctx.arenaHeight - 30) : endY;
    barrage.dashTimer = 0;
    barrage.phase = 'dash';

    f.angle = Math.atan2(barrage.endY - barrage.startY, barrage.endX - barrage.startX);

    EffectLib.addDashEffect(effectSystem, f.x, f.y, '#FFD700', 30);
  }

  static resolveCelestialBasicSwordHit(f, barrage, effectSystem) {
    const centerX = barrage.centerX;
    const centerY = barrage.centerY;
    const radius = barrage.radius;
    const hitIndex = barrage.hitIndex;
    const startX = barrage.startX;
    const startY = barrage.startY;
    const endX = barrage.endX;
    const endY = barrage.endY;
    const pathDx = endX - startX;
    const pathDy = endY - startY;
    const pathLen = Math.sqrt(pathDx * pathDx + pathDy * pathDy) || 1;

    f.battleContext.opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const t = Math.max(0, Math.min(1, ((enemy.x - startX) * pathDx + (enemy.y - startY) * pathDy) / (pathLen * pathLen)));
      const closestX = startX + pathDx * t;
      const closestY = startY + pathDy * t;
      const distToPath = Math.sqrt((enemy.x - closestX) * (enemy.x - closestX) + (enemy.y - closestY) * (enemy.y - closestY));
      const dx = enemy.x - centerX;
      const dy = enemy.y - centerY;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      if (distToPath <= 82 && distToCenter <= radius + enemy.charData.size) {
        enemy.takeDamage(barrage.hitDamage, centerX, centerY, effectSystem);
        effectSystem.addHitEffect(enemy.x, enemy.y, '#FFD700');
      }
    });

    effectSystem.addParticle({
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      life: 0.2,
      maxLife: 0.2,
      color: hitIndex % 2 === 0 ? 'rgba(255, 253, 231, 0.85)' : 'rgba(255, 215, 0, 0.85)',
      size: radius * 0.25,
      gravity: 0,
      friction: 1,
      type: 'ring'
    });
    effectSystem.screenShake(2);
  }

  static flashToCelestialTargetFront(f, target, effectSystem) {
    if (!target || !target.isAlive()) return;

    const dx = target.x - f.x;
    const dy = target.y - f.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const flashRange = 240;
    if (!isFinite(dist) || dist > flashRange) return;

    const frontAngle = isFinite(target.angle) ? target.angle : Math.atan2(f.y - target.y, f.x - target.x);
    const offset = (target.charData.size || 34) + (f.charData.size || 34) + 16;
    const nextX = target.x + Math.cos(frontAngle) * offset;
    const nextY = target.y + Math.sin(frontAngle) * offset;
    const ctx = f.battleContext;

    const oldX = f.x;
    const oldY = f.y;
    f.x = ctx ? clamp(nextX, ctx.arenaX + 30, ctx.arenaX + ctx.arenaWidth - 30) : nextX;
    f.y = ctx ? clamp(nextY, ctx.arenaY + 30, ctx.arenaY + ctx.arenaHeight - 30) : nextY;
    f.angle = Math.atan2(target.y - f.y, target.x - f.x);
    f.ultInvincibilityTimer = Math.max(f.ultInvincibilityTimer || 0, 0.25);

    if (effectSystem) {
      effectSystem.addTrail(oldX, oldY, '#FFFDE7', 9);
      effectSystem.addTrail(f.x, f.y, '#FFD700', 10);
      for (let i = 0; i < 8; i++) {
        effectSystem.addParticle({
          x: oldX + (f.x - oldX) * (i / 7),
          y: oldY + (f.y - oldY) * (i / 7),
          vx: 0,
          vy: 0,
          life: 0.25,
          maxLife: 0.25,
          color: i % 2 === 0 ? '#FFFDE7' : '#FFD700',
          size: 3,
          gravity: 0,
          friction: 1,
          type: 'circle'
        });
      }
      effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 16, '闪身', false, '#FFF176');
    }
  }

  static executeFrostLordBasicAttack(f, effectSystem) {
    const ctx = f.battleContext;
    if (!ctx || !ctx.opposingTeam) return;

    let nearest = null;
    let nearestDist = Infinity;
    ctx.opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const dx = enemy.x - f.x;
      const dy = enemy.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    });
    if (!nearest) return;

    // First hit: guaranteed falling iceberg on nearest target.
    nearest.takeDamage(f.charData.attackPower, nearest.x, nearest.y - 120, effectSystem);
    nearest.applyStun(0.5);
    effectSystem.addDamageNumber(nearest.x, nearest.y - nearest.charData.size - 28, '冰山坠落!', true, '#B3E5FC');
    EffectLib.addAoeMeleeEffect(effectSystem, nearest.x, nearest.y, '#B3E5FC', 78);
    for (let i = 0; i < 24; i++) {
      effectSystem.addParticle({
        x: nearest.x + (Math.random() - 0.5) * 60,
        y: nearest.y - 120 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 45,
        vy: 220 + Math.random() * 120,
        life: 0.45,
        maxLife: 0.45,
        color: i % 2 === 0 ? '#E1F5FE' : '#81D4FA',
        size: 4 + Math.random() * 5,
        gravity: 0,
        friction: 0.94,
        type: 'spark'
      });
    }

    if (ctx.ownTeam) {
      const servant = new f.constructor('ice_servant', nearest.x + (Math.random() - 0.5) * 50, nearest.y + (Math.random() - 0.5) * 50, f.team);
      servant.battleContext = ctx;
      ctx.ownTeam.push(servant);
      EffectLib.addCloneEffect(effectSystem, servant.x, servant.y, '#B3E5FC', 42);
    }

    let lowest = null;
    ctx.opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      if (!lowest || enemy.hp < lowest.hp) lowest = enemy;
    });
    if (!lowest) return;

    const startX = f.x;
    const startY = f.y;
    const behindAngle = isFinite(lowest.angle) ? lowest.angle + Math.PI : Math.atan2(f.y - lowest.y, f.x - lowest.x);
    const offset = (lowest.charData.size || 34) + (f.charData.size || 38) + 22;
    const rawEndX = lowest.x + Math.cos(behindAngle) * offset;
    const rawEndY = lowest.y + Math.sin(behindAngle) * offset;
    const endX = clamp(rawEndX, ctx.arenaX + 30, ctx.arenaX + ctx.arenaWidth - 30);
    const endY = clamp(rawEndY, ctx.arenaY + 30, ctx.arenaY + ctx.arenaHeight - 30);
    f.ultInvincibilityTimer = Math.max(f.ultInvincibilityTimer || 0, 0.55);
    f.setState('dashing_skill');
    f.dashStartX = startX;
    f.dashStartY = startY;
    f.dashTargetX = endX;
    f.dashTargetY = endY;
    f.dashDuration = 0.28;
    f.dashTimer = 0;
    f.dashSkillType = 'frost_staff_pierce';
    f.frostStaffTarget = lowest;
    f.target = lowest;

    effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 18, '冰杖穿身!', false, '#B3E5FC');
    EffectLib.addDashEffect(effectSystem, f.x, f.y, '#B3E5FC', 38);
    effectSystem.screenShake(4);
  }

  static resolveFrostLordStaffPierce(f, effectSystem) {
    const ctx = f.battleContext;
    if (!ctx || !ctx.opposingTeam) {
      f.setState('cooldown');
      return;
    }

    const startX = f.dashStartX;
    const startY = f.dashStartY;
    const endX = f.dashTargetX;
    const endY = f.dashTargetY;
    const pathDx = endX - startX;
    const pathDy = endY - startY;
    const pathLen = Math.sqrt(pathDx * pathDx + pathDy * pathDy) || 1;
    const target = f.frostStaffTarget;

    ctx.opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const t = Math.max(0, Math.min(1, ((enemy.x - startX) * pathDx + (enemy.y - startY) * pathDy) / (pathLen * pathLen)));
      const closestX = startX + pathDx * t;
      const closestY = startY + pathDy * t;
      const distToPath = Math.sqrt((enemy.x - closestX) ** 2 + (enemy.y - closestY) ** 2);
      if (enemy === target || distToPath <= 62) {
        enemy.takeDamage(enemy === target ? 16 : 14, f.x, f.y, effectSystem);
        enemy.applyStun(1.0);
        effectSystem.addHitEffect(enemy.x, enemy.y, '#B3E5FC');
      }
    });

    if (target && target.isAlive()) {
      const dx = target.x - f.x;
      const dy = target.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 120) {
        target.takeDamage(22, f.x, f.y, effectSystem);
        target.applyStun(1.0);
        effectSystem.addDamageNumber(target.x, target.y - target.charData.size - 22, '挥杖重击!', true, '#E1F5FE');
        EffectLib.addAoeMeleeEffect(effectSystem, target.x, target.y, '#B3E5FC', 72);
      }
    }

    for (let i = 0; i < 22; i++) {
      const pct = i / 21;
      effectSystem.addParticle({
        x: startX + pathDx * pct,
        y: startY + pathDy * pct,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 0.35,
        maxLife: 0.35,
        color: '#B3E5FC',
        size: 3,
        gravity: 0,
        friction: 0.92,
        type: 'circle'
      });
    }
    f.frostStaffTarget = null;
    effectSystem.screenShake(8);
    f.setState('cooldown');
  }

  static fireFrostShieldBlade(f, effectSystem) {
    if (!f || !f.battleContext || !f.battleContext.opposingTeam) return;
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
