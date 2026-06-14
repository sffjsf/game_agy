import { createProjectile } from './combat/Projectile.js';
import { soundSystem } from './audio.js';
import { safeDirection, normaliseAngle } from './utils.js';

/**
 * Default projectile properties by type.
 * Extend this map when adding new projectile types.
 */
const PROJECTILE_DEFAULTS = {
  arrow:            { speed: 400, size: 5 },
  magic:            { speed: 300, size: 6 },
  homing_orb:       { speed: 300, size: 6 },
  shuriken:         { speed: 380, size: 5 },
  banana:           { speed: 320, size: 6 },
  bomb:             { speed: 520, size: 10 },
  poison:           { speed: 420, size: 7 },
  train:            { speed: 300, size: 24 },
  skill_projectile: { speed: 280, size: 8 },
  water_orb:        { speed: 800, size: 8 },
  time_bolt:        { speed: 950, size: 7 },
  flying_sword:     { speed: 750, size: 5 },
  sword_wave:       { speed: 700, size: 10 },
  ganjiang_moye_sword: { speed: 820, size: 18 },
};
const DEFAULT_PROJECTILE = { speed: 350, size: 5 };

export class WeaponSystem {
  constructor() {
    /** @type {Projectile[]} Active projectiles */
    this.projectiles = [];
  }

  /**
   * Execute a melee attack, checking range and arc.
   * @param {Object} attacker - Attacking fighter (needs x, y)
   * @param {Object} target - Target fighter (needs x, y, and isAlive())
   * @param {number} damage - Attack damage
   * @param {number} range - Attack range in pixels
   * @param {number} angle - Attacker's facing angle in radians
   * @returns {{hit: boolean, damage: number}}
   */
  createMeleeAttack(attacker, target, damage, range, angle) {
    if (!target || !target.isAlive()) {
      return { hit: false, damage: 0 };
    }

    const dir = safeDirection(target.x - attacker.x, target.y - attacker.y);

    // Check if within range
    if (dir.dist > range) {
      return { hit: false, damage: 0 };
    }

    // Check if target is within a 90-degree arc (PI/4 each side)
    const angleToTarget = Math.atan2(dir.dy, dir.dx);
    const angleDiff = normaliseAngle(angleToTarget - angle);

    if (Math.abs(angleDiff) <= Math.PI / 4) {
      return { hit: true, damage: damage };
    }

    return { hit: false, damage: 0 };
  }

  /**
   * Create a ranged attack projectile aimed at the target.
   * @param {number} x - Spawn X position
   * @param {number} y - Spawn Y position
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {number} damage - Projectile damage
   * @param {string} ownerId - Owner's team ('left' or 'right')
   * @param {string} type - Projectile type ('arrow', 'magic', etc.)
   * @param {string} color - Projectile color
   * @returns {Projectile} The created projectile
   */
  createRangedAttack(x, y, targetX, targetY, damage, ownerId, type, color, attacker, opposingTeam) {
    const dir = safeDirection(
      targetX - x,
      targetY - y,
      { dx: ownerId === 'left' ? 1 : -1, dy: 0 }
    );

    // Speed: character override > type default > universal default
    const charSpeed = (attacker && attacker.charData && attacker.charData.projectileSpeed);
    const cfg = PROJECTILE_DEFAULTS[type] || DEFAULT_PROJECTILE;
    const speed = charSpeed || cfg.speed;
    const size = cfg.size;

    var vx = dir.dx * speed;
    var vy = dir.dy * speed;

    var proj = createProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    if (attacker) proj.attacker = attacker;
    if (opposingTeam) proj.opposingTeam = opposingTeam;
    this.projectiles.push(proj);
    return proj;
  }

  /**
   * Update all projectiles and check for collisions with fighters.
   * @param {number} dt - Delta time in seconds
   * @param {Fighter[]} fighters - Array of all fighters to check collisions against
   * @returns {Array<{target: Object, damage: number, projectile: Projectile}>} Array of hits
   */
  update(dt, fighters) {
    var hits = [];

    // Update each projectile
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var proj = this.projectiles[i];
      proj.update(dt);

      // Check if expired or already hit
      if (proj.isExpired() || proj.hit) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collisions against each fighter
      for (var j = 0; j < fighters.length; j++) {
        var fighter = fighters[j];

        // Skip same-team fighters (ownerId is the team string)
        if (fighter.team === proj.ownerId) continue;

        // Skip dead fighters
        if (!fighter.isAlive()) continue;

        // Circle-circle collision detection
        var dx = proj.x - fighter.x;
        var dy = proj.y - fighter.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var combinedRadius = proj.size + fighter.charData.size;

        if (dist < combinedRadius) {
          if (proj.piercing || proj.type === 'train' || proj.type === 'laser' || proj.type === 'sword_wave') {
            // Piercing projectiles only hit each fighter once.
            if (proj.hitFighters.indexOf(fighter) === -1) {
              proj.hitFighters.push(fighter);
              hits.push({
                target: fighter,
                damage: proj.damage,
                projectile: proj
              });
            }
          } else {
            // Hit detected!
            hits.push({
              target: fighter,
              damage: proj.damage,
              projectile: proj
            });
            proj.hit = true; // Mark for removal
            break; // Each projectile can only hit one target
          }
        }
      }

      // Remove hit projectiles
      if (proj.hit) {
        this.projectiles.splice(i, 1);
      }
    }

    return hits;
  }

  /**
   * Render all active projectiles.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      ctx.save();
      this.projectiles[i].render(ctx);
      ctx.restore();
    }
  }

  /**
   * Remove all projectiles.
   */
  clear() {
    this.projectiles = [];
  }
}
