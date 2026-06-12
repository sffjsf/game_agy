import { soundSystem } from '../audio.js';
import { Projectile } from '../weapon.js';
import { Fighter } from '../fighter.js';

export function executeSkillStrategy(caster, skill, weaponSystem, effectSystem) {
    if (!caster.target) return;
    var dx = caster.target.x - caster.x;
    var dy = caster.target.y - caster.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }
    switch (skill.type) {

      // ── WHIRLWIND (Swordsman): AOE damage around self ──
      case 'aoe_melee': {
        effectSystem.addSkillEffect('aoe_melee', caster.x, caster.y, caster.charData.color, skill.range);
        effectSystem.screenShake(6);

        const opposingTeam = (caster.team === 'left') ? caster.combatManager.fightersRight : caster.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (enemy.isAlive()) {
              const ex = enemy.x - caster.x;
              const ey = enemy.y - caster.y;
              const edist = Math.sqrt(ex * ex + ey * ey);
              if (edist <= skill.range) {
                enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
                caster.healFromDamage(skill.damage, effectSystem);
              }
            }
          });
        }
        break;
      }

      // ── TRIPLE SHOT (Archer): 3 arrows in a spread ──
      case 'multi_shot': {
        var baseAngle = Math.atan2(dy, dx);
        var spreadAngle = Math.PI / 12; // 15 degrees

        for (var i = -1; i <= 1; i++) {
          var shotAngle = baseAngle + i * spreadAngle;
          var speed = caster.charData.projectileSpeed || 400;
          var vx = Math.cos(shotAngle) * speed;
          var vy = Math.sin(shotAngle) * speed;

          var proj = new Projectile(
            caster.x, caster.y, vx, vy,
            skill.damage, caster.team,
            caster.charData.color, 5, 'arrow'
          );
          proj.attacker = caster;
          weaponSystem.projectiles.push(proj);
        }

        effectSystem.addSkillEffect('multi_shot', caster.x, caster.y, caster.charData.color, 30);
        break;
      }

      // ── METEOR (Mage): AOE damage at target location ──
      case 'meteor': {
        const area = skill.area || 80;
        effectSystem.addSkillEffect('meteor', caster.target.x, caster.target.y, caster.charData.color, area);
        effectSystem.screenShake(10);

        const targetX = caster.target.x;
        const targetY = caster.target.y;

        const opposingTeam = (caster.team === 'left') ? caster.combatManager.fightersRight : caster.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (enemy.isAlive()) {
              const ex = enemy.x - targetX;
              const ey = enemy.y - targetY;
              const edist = Math.sqrt(ex * ex + ey * ey);
              if (edist <= area) {
                enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
              }
            }
          });
        }
        break;
      }

      // ── BLAST BOMB (Bomber): Moderate area damage at target location ──
      case 'bomb_toss': {
        const area = skill.area || 90;
        const targetX = caster.target.x;
        const targetY = caster.target.y;

        effectSystem.addSkillEffect('bomb', targetX, targetY, caster.charData.color, area);
        effectSystem.screenShake(7);

        if (caster.combatManager) {
          caster.combatManager.applyAreaDamage(targetX, targetY, caster.team, skill.damage, area, caster);
        }
        break;
      }

      // ── TOXIC FLASK (Poisoner): Light area damage plus slow ──
      case 'poison_cloud': {
        const area = skill.area || 100;
        const targetX = caster.target.x;
        const targetY = caster.target.y;

        effectSystem.addSkillEffect('poison_cloud', targetX, targetY, caster.charData.color, area);
        effectSystem.screenShake(3);
        if (caster.combatManager) {
          caster.combatManager.addPoisonZone(targetX, targetY, caster.team, area, skill.duration || 3.0, skill.poisonDps || 4.0, 1.2);
        }

        const opposingTeam = (caster.team === 'left') ? caster.combatManager.fightersRight : caster.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (enemy.isAlive()) {
              const ex = enemy.x - targetX;
              const ey = enemy.y - targetY;
              const edist = Math.sqrt(ex * ex + ey * ey);
              if (edist <= area) {
                enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
                enemy.applyPoison(skill.duration || 3.0, skill.poisonDps || 4.0);
                enemy.applySlow(1.2);
              }
            }
          });
        }
        break;
      }

      // ── PIERCING THRUST (Spearman): Damage enemies in a forward line ──
      case 'pierce': {
        const range = skill.range || 150;
        const width = skill.width || 34;
        const dirX = dx / dist;
        const dirY = dy / dist;
        effectSystem.addSkillEffect('multi_shot', caster.x, caster.y, caster.charData.color, 35);

        const opposingTeam = (caster.team === 'left') ? caster.combatManager.fightersRight : caster.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (!enemy.isAlive()) return;
            const ex = enemy.x - caster.x;
            const ey = enemy.y - caster.y;
            const forward = ex * dirX + ey * dirY;
            const side = Math.abs(ex * dirY - ey * dirX);
            if (forward >= 0 && forward <= range && side <= width) {
              enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
              effectSystem.addHitEffect(enemy.x, enemy.y, caster.charData.color);
            }
          });
        }
        break;
      }

      // ── FROST NOVA (Frost Apprentice): Large area slow ──
      case 'frost_nova': {
        const area = skill.area || 210;
        effectSystem.addSkillEffect('slow', caster.x, caster.y, '#4FC3F7', area);
        effectSystem.addSkillEffect('aoe_melee', caster.x, caster.y, '#B3E5FC', area);
        effectSystem.screenShake(4);

        const opposingTeam = (caster.team === 'left') ? caster.combatManager.fightersRight : caster.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (!enemy.isAlive()) return;
            const ex = enemy.x - caster.x;
            const ey = enemy.y - caster.y;
            const edist = Math.sqrt(ex * ex + ey * ey);
            if (edist <= area) {
              enemy.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
              enemy.applySlow(skill.duration || 3.0);
              effectSystem.addSkillEffect('slow', enemy.x, enemy.y, '#4FC3F7', 36);
            }
          });
        }
        break;
      }

      // ── INFERNO DETONATION (Vulcan): Explode all burning enemies ──
      case 'inferno_detonation': {
        const area = skill.area || 115;
        const opposingTeam = (caster.team === 'left') ? caster.combatManager.fightersRight : caster.combatManager.fightersLeft;
        if (opposingTeam) {
          var burningTargets = opposingTeam.filter(enemy => enemy.isAlive() && enemy.burnTimer > 0);
          if (burningTargets.length === 0 && caster.target && caster.target.isAlive()) {
            caster.target.applyBurn(skill.burnDuration || 3.5, skill.burnDps || 6);
            burningTargets = [caster.target];
          }

          burningTargets.forEach(burningEnemy => {
            effectSystem.addSkillEffect('fire_burst', burningEnemy.x, burningEnemy.y, '#FF5722', area);
            caster.combatManager.applyAreaDamage(burningEnemy.x, burningEnemy.y, caster.team, skill.damage, area, caster);

            opposingTeam.forEach(enemy => {
              if (!enemy.isAlive()) return;
              const ex = enemy.x - burningEnemy.x;
              const ey = enemy.y - burningEnemy.y;
              const edist = Math.sqrt(ex * ex + ey * ey);
              if (isFinite(edist) && edist <= area) {
                enemy.applyBurn(skill.burnDuration || 3.5, skill.burnDps || 6);
              }
            });
          });
        }
        effectSystem.screenShake(12);
        break;
      }

      // ── SHADOW DASH (Vampire): Smooth high speed slide ──
      case 'dash': {
        // Calculate destination (stop 30px away from target)
        var dashDestX = caster.x;
        var dashDestY = caster.y;
        if (dist > 30) {
          dashDestX = caster.target.x - (dx / dist) * 30;
          dashDestY = caster.target.y - (dy / dist) * 30;
        }

        // Set up dashing_skill state
        caster.setState('dashing_skill');
        caster.dashStartX = caster.x;
        caster.dashStartY = caster.y;
        caster.dashTargetX = dashDestX;
        caster.dashTargetY = dashDestY;
        caster.dashDuration = 0.12; // 0.12 seconds dash duration (very fast, but smooth!)
        caster.dashTimer = 0;
        caster.dashSkillType = 'dash';

        // Play skill starting effect
        effectSystem.addSkillEffect('dash', caster.x, caster.y, caster.charData.color, 20);
        break;
      }

      // ── SHADOW CLONE (Ninja): Create clones that attack ──
      case 'clone': {
        caster.clones = [
          { x: caster.x + 30, y: caster.y - 20 },
          { x: caster.x - 30, y: caster.y + 20 }
        ];
        caster.cloneTimer = 3.0; // Clones last 3 seconds

        effectSystem.addSkillEffect('clone', caster.x, caster.y, caster.charData.color, 30);

        // Each clone fires a shuriken at the target
        for (var i = 0; i < caster.clones.length; i++) {
          weaponSystem.createRangedAttack(
            caster.clones[i].x, caster.clones[i].y,
            caster.target.x, caster.target.y,
            skill.damage, caster.team,
            'shuriken', caster.charData.color,
            caster
          );
        }
        break;
      }

      // ── SHIELD BASH (Knight): Stun + damage ──
      case 'stun': {
        if (caster.target.isAlive() && dist <= skill.range) {
          caster.target.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
          caster.target.stunTimer = skill.duration; // Apply stun!
          effectSystem.addSkillEffect('stun', caster.target.x, caster.target.y, '#FFD700', 30);
          effectSystem.screenShake(6);
        }
        break;
      }

      // ── BACKSTAB (Assassin): Smooth high speed curve behind target ──
      case 'backstab': {
        // Calculate destination behind the target (opposite their facing angle)
        var behindX = caster.target.x - Math.cos(caster.target.angle) * 30;
        var behindY = caster.target.y - Math.sin(caster.target.angle) * 30;

        // Set up dashing_skill state
        caster.setState('dashing_skill');
        caster.dashStartX = caster.x;
        caster.dashStartY = caster.y;
        caster.dashTargetX = behindX;
        caster.dashTargetY = behindY;
        caster.dashDuration = 0.15; // 0.15 seconds dash duration
        caster.dashTimer = 0;
        caster.dashSkillType = 'backstab';

        // Play starting skill effect
        effectSystem.addSkillEffect('backstab', caster.x, caster.y, caster.charData.color, 20);
        break;
      }

      // ── BANANA PEEL (Minion): Slow debuff + ranged damage ──
      case 'slow': {
        weaponSystem.createRangedAttack(
          caster.x, caster.y,
          caster.target.x, caster.target.y,
          skill.damage, caster.team,
          'banana', caster.charData.color,
          caster
        );

        if (caster.target.isAlive() && dist <= skill.range) {
          caster.target.slowTimer = skill.duration; // Apply slow!
          effectSystem.addSkillEffect('slow', caster.target.x, caster.target.y, '#42A5F5', 40);
        }
        break;
      }

      // ── SERIOUS PUNCH (Saitama): Smooth super fast lunge ──
      case 'serious_punch': {
        // Calculate destination (stop 20px away from target)
        var dashDestX = caster.x;
        var dashDestY = caster.y;
        if (dist > 20) {
          dashDestX = caster.target.x - (dx / dist) * 20;
          dashDestY = caster.target.y - (dy / dist) * 20;
        }

        caster.setState('dashing_skill');
        caster.dashStartX = caster.x;
        caster.dashStartY = caster.y;
        caster.dashTargetX = dashDestX;
        caster.dashTargetY = dashDestY;
        caster.dashDuration = 0.08; // Very fast lunge!
        caster.dashTimer = 0;
        caster.dashSkillType = 'serious_punch';

        effectSystem.addSkillEffect('dash', caster.x, caster.y, caster.charData.color, 30);
        break;
      }

      // ── SUMMON BATS (Blood Demon): Summons 4 homing siphoning bats ──
      case 'summon_bats': {
        var baseAngle = Math.atan2(dy, dx);
        var spread = Math.PI / 3; // 60 degrees spread
        var numBats = 4;
        for (var i = 0; i < numBats; i++) {
          var angleOffset = (i - (numBats - 1) / 2) * (spread / (numBats - 1));
          var batAngle = baseAngle + angleOffset;
          var speed = 250; // Homing will guide them
          var vx = Math.cos(batAngle) * speed;
          var vy = Math.sin(batAngle) * speed;
          
          var batProj = new Projectile(
            caster.x, caster.y, vx, vy,
            skill.damage, caster.team,
            '#FF1744', 8, 'bat'
          );
          batProj.attacker = caster;
          weaponSystem.projectiles.push(batProj);
        }
        effectSystem.addSkillEffect('clone', caster.x, caster.y, '#FF1744', 40);
        effectSystem.screenShake(4);
        break;
      }

      // ── TRAIN STAMPEDE (Train Conductor): Summons linear stun train ──
      case 'train_stampede': {
        var baseAngle = Math.atan2(dy, dx);
        var speed = 300;
        var vx = Math.cos(baseAngle) * speed;
        var vy = Math.sin(baseAngle) * speed;

        var proj = weaponSystem.createRangedAttack(
          caster.x, caster.y,
          caster.target.x, caster.target.y,
          skill.damage, caster.team,
          'train', caster.charData.color,
          caster
        );

        effectSystem.screenShake(5);
        effectSystem.addSkillEffect('multi_shot', caster.x, caster.y, caster.charData.color, 40);
        break;
      }

      // ── SUMMON LEGION (Superhero Summoner): Summons 3 Stone Golems ──
      case 'summon_legion': {
        const teamArr = caster.team === 'left' ? caster.combatManager.fightersLeft : caster.combatManager.fightersRight;
        if (teamArr) {
          for (var i = 0; i < 3; i++) {
            var spawnX = caster.x + (Math.random() - 0.5) * 80;
            var spawnY = caster.y + (Math.random() - 0.5) * 80;
            var minion = new Fighter('summoned_golem', spawnX, spawnY, caster.team);
            minion.combatManager = caster.combatManager;
            teamArr.push(minion);
            effectSystem.addSkillEffect('clone', spawnX, spawnY, '#E040FB', 40);
          }
          if (soundSystem) soundSystem.playSummonSound();
        }
        effectSystem.screenShake(8);
        effectSystem.addSkillEffect('meteor', caster.x, caster.y, '#9C27B0', 60);
        break;
      }
    }

}
