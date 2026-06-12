import { createProjectile } from './combat/Projectile.js';
import { soundSystem } from './audio.js';

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

    // Calculate distance between attacker and target
    var dx = target.x - attacker.x;
    var dy = target.y - attacker.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    // Check if within range
    if (dist > range) {
      return { hit: false, damage: 0 };
    }

    // Check if target is within a 90-degree arc (PI/2 total, PI/4 each side)
    var angleToTarget = Math.atan2(dy, dx);
    var angleDiff = angleToTarget - angle;

    if (isNaN(angleDiff) || !isFinite(angleDiff)) {
      angleDiff = 0;
    }

    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

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
  createRangedAttack(x, y, targetX, targetY, damage, ownerId, type, color, attacker) {
    // Calculate direction to target
    var dx = targetX - x;
    var dy = targetY - y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    // Avoid division by zero or non-finite values
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = (ownerId === 'left') ? 1 : -1;
      dy = 0;
      dist = 1;
    }

    var dirX = dx / dist;
    var dirY = dy / dist;

    // Projectile speed varies by attacker or defaults
    var speed = 350;
    if (attacker && attacker.charData && attacker.charData.projectileSpeed) {
      speed = attacker.charData.projectileSpeed;
    } else {
      if (type === 'arrow') speed = 400;
      if (type === 'magic') speed = 300;
      if (type === 'shuriken') speed = 380;
      if (type === 'banana') speed = 320;
      if (type === 'bomb') speed = 520;
      if (type === 'poison') speed = 420;
      if (type === 'train') speed = 300;
      if (type === 'skill_projectile') speed = 280;
    }

    var vx = dirX * speed;
    var vy = dirY * speed;

    // Determine default size by type
    var size;
    switch (type) {
      case 'arrow':            size = 5; break;
      case 'magic':
      case 'homing_orb':       size = 6; break;
      case 'shuriken':         size = 5; break;
      case 'banana':           size = 6; break;
      case 'bomb':             size = 10; break;
      case 'poison':           size = 7; break;
      case 'train':            size = 24; break;
      case 'skill_projectile': size = 8; break;
      default:                 size = 5; break;
    }

    var proj = createProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    if (attacker) proj.attacker = attacker;
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
          if (proj.type === 'train') {
            // Train pierces! Only hit each fighter once.
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
