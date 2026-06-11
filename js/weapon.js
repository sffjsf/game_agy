/**
 * weapon.js - Projectile & Weapon System for 2D Auto-Battle Game
 * 
 * Defines global Projectile class and WeaponSystem class.
 * Handles ranged attack projectiles and melee attack hit detection.
 * No modules/imports - loaded via script tag.
 */

// ═══════════════════════════════════════════════════════════════
// PROJECTILE CLASS
// ═══════════════════════════════════════════════════════════════

class Projectile {
  /**
   * Create a new projectile.
   * @param {number} x - Start X position
   * @param {number} y - Start Y position
   * @param {number} vx - X velocity (px/s)
   * @param {number} vy - Y velocity (px/s)
   * @param {number} damage - Damage on hit
   * @param {string} ownerId - Team of the owner ('left' or 'right')
   * @param {string} color - Projectile color
   * @param {number} size - Collision radius
   * @param {string} type - Visual type: 'arrow', 'magic', 'shuriken', 'banana', 'skill_projectile'
   */
  constructor(x, y, vx, vy, damage, ownerId, color, size, type) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.ownerId = ownerId;   // Team string for collision filtering
    this.color = color;
    this.size = size;
    this.type = type;
    this.lifetime = 2.0;      // Seconds before expiry
    this.rotation = 0;        // Current rotation angle (radians)
    this.hit = false;         // Flag to mark for removal on collision
    this.hitFighters = [];    // List of fighters hit by this projectile (for piercing)
  }

  /**
   * Update projectile position and rotation.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;

    // Homing logic for bat projectile and homing_orb
    if (this.type === 'bat' || this.type === 'homing_orb') {
      if (window.combatManager) {
        var opposingTeam = (this.ownerId === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
        if (opposingTeam) {
          var target = null;
          var minDist = Infinity;
          opposingTeam.forEach(enemy => {
            if (enemy.isAlive()) {
              var dx = enemy.x - this.x;
              var dy = enemy.y - this.y;
              var d = Math.sqrt(dx * dx + dy * dy);
              if (d < minDist) {
                minDist = d;
                target = enemy;
              }
            }
          });

          if (target) {
            var tx = target.x - this.x;
            var ty = target.y - this.y;
            var tdist = Math.sqrt(tx * tx + ty * ty);
            if (!isFinite(tx) || !isFinite(ty) || !isFinite(tdist) || tdist < 1) {
              tx = (this.ownerId === 'left') ? 1 : -1;
              ty = 0;
              tdist = 1;
            }
            
            var homingSpeed = this.type === 'homing_orb' ? 550 : 380;
            var targetVx = (tx / tdist) * homingSpeed;
            var targetVy = (ty / tdist) * homingSpeed;

            // Interpolate velocity for smooth steering
            if (isFinite(targetVx) && isFinite(targetVy)) {
              var turnRate = this.type === 'homing_orb' ? 0.25 : 0.12;
              this.vx = this.vx * (1 - turnRate) + targetVx * turnRate;
              this.vy = this.vy * (1 - turnRate) + targetVy * turnRate;
            }
          }
        }
      }
      if (this.type === 'bat') {
        this.rotation = Math.sin(this.lifetime * 25) * 0.4;
      }
    }

    // Rotation speeds differ by type
    switch (this.type) {
      case 'arrow':
        // Arrow doesn't rotate; it always points in travel direction
        break;
      case 'magic':
        this.rotation += dt * 2;
        break;
      case 'shuriken':
        this.rotation += dt * 10;
        break;
      case 'banana':
        this.rotation += dt * 6;
        break;
      case 'bomb':
        this.rotation += dt * 5;
        break;
      case 'poison':
        this.rotation += dt * 4;
        break;
      case 'skill_projectile':
        this.rotation += dt * 1;
        break;
    }
  }

  /**
   * Render the projectile based on its type.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    ctx.save();

    switch (this.type) {
      // ───────────────────────────────────────────────
      // ARROW: Elongated triangle pointing in travel direction
      // ───────────────────────────────────────────────
      case 'arrow': {
        var travelAngle = Math.atan2(this.vy, this.vx);
        if (isNaN(travelAngle) || !isFinite(travelAngle)) travelAngle = 0;
        ctx.translate(this.x, this.y);
        ctx.rotate(travelAngle);

        // Arrow shaft
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(6, 0);
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrowhead (triangle)
        ctx.beginPath();
        ctx.moveTo(10, 0);        // Tip
        ctx.lineTo(4, -3);        // Upper barb
        ctx.lineTo(4, 3);         // Lower barb
        ctx.closePath();
        ctx.fillStyle = '#9E9E9E';
        ctx.fill();
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Fletching (tail feathers)
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-8, -3);
        ctx.moveTo(-10, 0);
        ctx.lineTo(-8, 3);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      }

      // ───────────────────────────────────────────────
      // MAGIC / HOMING ORB: Glowing circle with outer ring
      // ───────────────────────────────────────────────
      case 'magic':
      case 'homing_orb': {
        ctx.translate(this.x, this.y);
        var pulse = 1.0 + Math.sin(this.rotation * 3) * 0.2;

        // Outer glow
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.8 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = this.color.replace(')', ', 0.15)').replace('rgb', 'rgba');
        // Fallback for hex colors
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Outer ring
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.3 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Inner solid circle
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        break;
      }

      // ───────────────────────────────────────────────
      // POISON: Green bubbling flask orb
      // ───────────────────────────────────────────────
      case 'poison': {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.25, 0, Math.PI * 2);
        ctx.fillStyle = '#1B5E20';
        ctx.fill();
        ctx.strokeStyle = '#76FF03';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#76FF03';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(-2, -2, this.size * 0.45, 0, Math.PI * 2);
        ctx.arc(4, 3, this.size * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }

      // ───────────────────────────────────────────────
      // BOMB: Round bomb with a lit fuse
      // ───────────────────────────────────────────────
      case 'bomb': {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.25, 0, Math.PI * 2);
        ctx.fillStyle = '#2E1A12';
        ctx.fill();
        ctx.strokeStyle = '#FFAB40';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-this.size * 0.45, -this.size * 0.8);
        ctx.quadraticCurveTo(-this.size * 0.8, -this.size * 1.2, -this.size * 0.25, -this.size * 1.35);
        ctx.strokeStyle = '#D7CCC8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-this.size * 0.25, -this.size * 1.35, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD54F';
        ctx.fill();
        break;
      }

      // ───────────────────────────────────────────────
      // SHURIKEN: 4-pointed star that rotates
      // ───────────────────────────────────────────────
      case 'shuriken': {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        var points = 4;
        var outerR = this.size * 1.4;
        var innerR = this.size * 0.5;

        ctx.beginPath();
        for (var i = 0; i < points * 2; i++) {
          var r = (i % 2 === 0) ? outerR : innerR;
          var a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
          if (i === 0) {
            ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          } else {
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
        }
        ctx.closePath();
        ctx.fillStyle = '#546E7A';
        ctx.fill();
        ctx.strokeStyle = '#B0BEC5';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Center hole
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#263238';
        ctx.fill();
        break;
      }

      // ───────────────────────────────────────────────
      // BANANA: Curved arc shape that rotates
      // ───────────────────────────────────────────────
      case 'banana': {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Banana body (thick curved arc)
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.2, -Math.PI * 0.7, Math.PI * 0.3, false);
        ctx.strokeStyle = '#FDD835';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Darker inner edge
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.2, -Math.PI * 0.7, Math.PI * 0.3, false);
        ctx.strokeStyle = '#F9A825';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Brown tips
        var tipAngle1 = -Math.PI * 0.7;
        var tipAngle2 = Math.PI * 0.3;
        ctx.beginPath();
        ctx.arc(
          Math.cos(tipAngle1) * this.size * 1.2,
          Math.sin(tipAngle1) * this.size * 1.2,
          2, 0, Math.PI * 2
        );
        ctx.fillStyle = '#8D6E63';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          Math.cos(tipAngle2) * this.size * 1.2,
          Math.sin(tipAngle2) * this.size * 1.2,
          2, 0, Math.PI * 2
        );
        ctx.fill();
        break;
      }

      // ───────────────────────────────────────────────
      // SKILL PROJECTILE: Larger glowing orb with halo
      // ───────────────────────────────────────────────
      case 'skill_projectile': {
        ctx.translate(this.x, this.y);
        var pulse = 1.0 + Math.sin(this.rotation * 4) * 0.15;

        // Outer halo
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 2.5 * pulse, 0, Math.PI * 2);
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Middle glow ring
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 1.6 * pulse, 0, Math.PI * 2);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Core
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        break;
      }

      // ───────────────────────────────────────────────
      // BAT: Homing siphoning bats with flapping wings
      // ───────────────────────────────────────────────
      case 'bat': {
        var travelAngle = Math.atan2(this.vy, this.vx);
        if (isNaN(travelAngle) || !isFinite(travelAngle)) travelAngle = 0;
        ctx.translate(this.x, this.y);
        ctx.rotate(travelAngle);

        var flap = this.rotation; // Oscillation between -0.4 and 0.4 from update()

        // Draw bat wings (dark red / black with bright red trim)
        ctx.fillStyle = '#1A0008';
        ctx.strokeStyle = '#FF1744';
        ctx.lineWidth = 1.2;

        // Left wing (drawn with flap angle)
        ctx.save();
        ctx.rotate(-flap);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-12, -18, -18, -12);
        ctx.quadraticCurveTo(-10, -6, -4, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Right wing
        ctx.save();
        ctx.rotate(flap);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-12, 18, -18, 12);
        ctx.quadraticCurveTo(-10, 6, -4, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Glowing red body core
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF1744';
        ctx.shadowColor = '#FF1744';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Tiny glowing white eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(1, -2, 1.5, 1);
        ctx.fillRect(1, 1, 1.5, 1);
        break;
      }

      // ───────────────────────────────────────────────
      // TRAIN: Giant, long steam train locomotive with 2 carriages
      // ───────────────────────────────────────────────
      case 'train': {
        var travelAngle = Math.atan2(this.vy, this.vx);
        if (isNaN(travelAngle) || !isFinite(travelAngle)) travelAngle = 0;
        ctx.translate(this.x, this.y);
        ctx.rotate(travelAngle);

        // Draw steam clouds from chimney (locomotive chimney is around x=10, y=-20)
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(this.lifetime * 20) * 0.1;
        ctx.fillStyle = 'rgba(240, 240, 240, 0.7)';
        ctx.beginPath();
        ctx.arc(-2, -32, 11, 0, Math.PI * 2);
        ctx.arc(-18, -38, 15, 0, Math.PI * 2);
        ctx.arc(-38, -44, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 1. Couplers (golden bars connecting head and carriages)
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-20, 0); // between head and carriage 1
        ctx.lineTo(-34, 0);
        ctx.moveTo(-64, 0); // between carriage 1 and carriage 2
        ctx.lineTo(-78, 0);
        ctx.stroke();

        // 2. Carriage 2 (Rear)
        ctx.fillStyle = '#1A237E';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(-108, -15, 30, 30);
        ctx.fill();
        ctx.stroke();
        // Carriage 2 windows (yellow rectangles)
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(-102, -10, 8, 8);
        ctx.fillRect(-90, -10, 8, 8);
        // Carriage 2 wheels
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-100, 16, 5, 0, Math.PI * 2);
        ctx.arc(-86, 16, 5, 0, Math.PI * 2);
        ctx.arc(-100, -16, 5, 0, Math.PI * 2);
        ctx.arc(-86, -16, 5, 0, Math.PI * 2);
        ctx.fill();

        // 3. Carriage 1 (Middle)
        ctx.fillStyle = '#1A237E';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(-64, -15, 30, 30);
        ctx.fill();
        ctx.stroke();
        // Carriage 1 windows
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(-58, -10, 8, 8);
        ctx.fillRect(-46, -10, 8, 8);
        // Carriage 1 wheels
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-56, 16, 5, 0, Math.PI * 2);
        ctx.arc(-42, 16, 5, 0, Math.PI * 2);
        ctx.arc(-56, -16, 5, 0, Math.PI * 2);
        ctx.arc(-42, -16, 5, 0, Math.PI * 2);
        ctx.fill();

        // 4. Locomotive Head (Front)
        // Main boiler (navy blue rectangle)
        ctx.fillStyle = '#0D47A1';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-20, -18, 44, 36);
        ctx.fill();
        ctx.stroke();

        // Cab roof / visor (curved back cabin)
        ctx.fillStyle = '#0D47A1';
        ctx.beginPath();
        ctx.rect(-20, -24, 18, 6);
        ctx.fill();
        ctx.stroke();

        // Cab window (yellow)
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(-16, -12, 10, 12);

        // Locomotive front grill (gold cowcatcher)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(24, -12);
        ctx.lineTo(34, 0);
        ctx.lineTo(24, 12);
        ctx.closePath();
        ctx.fill();

        // Chimney
        ctx.fillStyle = '#1A237E';
        ctx.beginPath();
        ctx.rect(10, -26, 8, 8);
        ctx.fill();
        ctx.stroke();

        // Locomotive Wheels (larger wheels)
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-10, 18, 7, 0, Math.PI * 2);
        ctx.arc(12, 18, 7, 0, Math.PI * 2);
        ctx.arc(-10, -18, 7, 0, Math.PI * 2);
        ctx.arc(12, -18, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Check if this projectile has expired.
   * @returns {boolean} True if lifetime has run out
   */
  isExpired() {
    return this.lifetime <= 0;
  }

  /**
   * Get collision bounds for this projectile.
   * @returns {{x: number, y: number, radius: number}}
   */
  getBounds() {
    return { x: this.x, y: this.y, radius: this.size };
  }
}


// ═══════════════════════════════════════════════════════════════
// WEAPON SYSTEM CLASS
// ═══════════════════════════════════════════════════════════════

class WeaponSystem {
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

    var proj = new Projectile(x, y, vx, vy, damage, ownerId, color, size, type);
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
      this.projectiles[i].render(ctx);
    }
  }

  /**
   * Remove all projectiles.
   */
  clear() {
    this.projectiles = [];
  }
}
