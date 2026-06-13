import * as EffectLib from '../effects_lib/index.js';
import { executeSkillStrategy } from '../skills/SkillRegistry.js';
import { soundSystem } from '../audio.js';
import { getArenaBoundaryIntersection } from '../skills/abilities/BlazingStampede.js';

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

        f.applyMeleeHitPassives(finalDamage, f.target, effectSystem);
        f.target.takeDamage(finalDamage, f.x, f.y, effectSystem);
        f.healFromDamage(finalDamage, effectSystem);

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
}
