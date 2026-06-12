import * as EffectLib from '../effects_lib/index.js';
import { executeSkillStrategy } from '../skills/SkillRegistry.js';
import { soundSystem } from '../audio.js';

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
        f.applyMeleeHitPassives(result.damage, f.target, effectSystem);
        f.target.takeDamage(result.damage, f.x, f.y, effectSystem);
        f.healFromDamage(result.damage, effectSystem);

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
    }

    // Go to cooldown or reposition
    if (Math.random() < 0.4) {
      f.ai.startReposition(ctx);
    } else {
      f.setState('cooldown');
      f.repositionType = (f.charData.weaponType === 'ranged') ? 'retreat' : (Math.random() < 0.65 ? 'circle' : 'retreat');
      f.circleDir = Math.random() < 0.5 ? 1 : -1;
    }
  }
}
