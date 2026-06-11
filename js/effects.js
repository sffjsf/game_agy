/**
 * effects.js - Visual Effects System for 2D Auto-Battle Game
 * 
 * Handles all visual effects: particles, damage numbers, trails, and screen shake.
 * No modules/imports - loaded via script tag.
 */

class EffectSystem {
  constructor() {
    /** @type {Array} Active particle effects */
    this.particles = [];
    /** @type {Array} Floating damage number texts */
    this.damageNumbers = [];
    /** @type {Array} Movement trail dots */
    this.trails = [];
    /** @type {number} Current screen shake intensity */
    this.shakeAmount = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // HIT EFFECT - Burst of sparks on impact
  // ═══════════════════════════════════════════════════════════════
  /**
   * Create 10-15 particles bursting outward from the hit point.
   * @param {number} x - Hit position X
   * @param {number} y - Hit position Y
   * @param {string} color - Particle color
   */
  addHitEffect(x, y, color) {
    var count = 10 + Math.floor(Math.random() * 6); // 10-15
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 80 + Math.random() * 120;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        color: color,
        size: 2 + Math.random() * 3,
        gravity: 0,
        friction: 0.92,
        type: 'spark'
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DEATH EFFECT - Big explosion of particles
  // ═══════════════════════════════════════════════════════════════
  /**
   * Create 30-40 particles in an explosion pattern on death.
   * Mix of 'circle' and 'spark' types with gravity.
   * @param {number} x - Death position X
   * @param {number} y - Death position Y
   * @param {string} color - Character color
   */
  addDeathEffect(x, y, color) {
    var count = 30 + Math.floor(Math.random() * 11); // 30-40
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 50 + Math.random() * 200;
      var type = Math.random() > 0.5 ? 'circle' : 'spark';
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        color: color,
        size: 2 + Math.random() * 5,
        gravity: 150,
        friction: 0.95,
        type: type
      });
    }

    // Add an expanding ring at the center
    this.particles.push({
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      life: 0.6,
      maxLife: 0.6,
      color: color,
      size: 10,
      gravity: 0,
      friction: 1.0,
      type: 'ring'
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // DAMAGE NUMBERS - Floating text showing damage dealt
  // ═══════════════════════════════════════════════════════════════
  /**
   * Add a floating damage number that rises and fades.
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {number} damage - Damage amount to display
   * @param {boolean} isCrit - Whether this is a critical hit
   * @param {string} color - Text color (overridden to gold if crit)
   */
  addDamageNumber(x, y, damage, isCrit, color) {
    // Handle both numeric and string damage values
    var text;
    if (typeof damage === 'string') {
      text = damage;
    } else if (typeof damage === 'number' && isFinite(damage)) {
      text = Math.round(damage).toString();
    } else {
      text = '0'; // Fallback for NaN/Infinity
    }

    var displayX = x + (Math.random() - 0.5) * 20;
    var displayY = y;
    if (!isFinite(displayX)) displayX = x;
    if (!isFinite(displayY)) displayY = y;

    this.damageNumbers.push({
      x: displayX,
      y: displayY,
      vy: -70 - Math.random() * 20,       // Float upward
      text: text,
      life: 1.0,
      maxLife: 1.0,
      color: isCrit ? '#FFD700' : (color || '#FF4444'),
      fontSize: isCrit ? 32 : 24,
      isCrit: isCrit
    });
  }

  /**
   * Add a bold, large floating skill name above the caster.
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} skillName - Skill name to display
   * @param {string} team - Caster team, 'left' or 'right'
   */
  addSkillName(x, y, skillName, team) {
    var text = typeof skillName === 'string' && skillName ? skillName : '技能释放';
    var isLeft = team === 'left';
    var displayX = isFinite(x) ? x : 400;
    var displayY = isFinite(y) ? y : 260;

    this.damageNumbers.push({
      x: displayX,
      y: displayY,
      vy: -95,
      text: text,
      life: 1.15,
      maxLife: 1.15,
      color: isLeft ? '#00E5FF' : '#FF3D00',
      strokeColor: isLeft ? '#063B62' : '#5A1600',
      glowColor: isLeft ? 'rgba(0, 229, 255, 0.85)' : 'rgba(255, 61, 0, 0.85)',
      fontSize: 40,
      isCrit: false,
      isSkillName: true,
      team: team
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CHARGE EFFECT - Particles converging inward (charging up)
  // ═══════════════════════════════════════════════════════════════
  /**
   * Create 3-5 particles that converge inward toward the position.
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {string} color - Particle color
   */
  addChargeEffect(x, y, color) {
    var count = 3 + Math.floor(Math.random() * 3); // 3-5
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 30 + Math.random() * 20;
      var startX = x + Math.cos(angle) * dist;
      var startY = y + Math.sin(angle) * dist;
      // Velocity directed inward toward center
      var speed = dist / 0.3; // Arrive in ~0.3 seconds
      this.particles.push({
        x: startX,
        y: startY,
        vx: (x - startX) / 0.3,
        vy: (y - startY) / 0.3,
        life: 0.3,
        maxLife: 0.3,
        color: color,
        size: 3 + Math.random() * 2,
        gravity: 0,
        friction: 1.0,
        type: 'circle'
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SKILL EFFECTS - Big visual for skill activation
  // ═══════════════════════════════════════════════════════════════
  /**
   * Create a big visual effect based on skill type.
   * @param {string} type - Skill visual type
   * @param {number} x - Effect center X
   * @param {number} y - Effect center Y
   * @param {string} color - Effect color
   * @param {number} radius - Effect radius
   */
  addSkillEffect(type, x, y, color, radius) {
    switch (type) {
      case 'aoe_melee':
        // Ring of particles expanding outward in a circle
        for (var i = 0; i < 25; i++) {
          var angle = (i / 25) * Math.PI * 2;
          var speed = 100 + Math.random() * 60;
          this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.4 + Math.random() * 0.2,
            maxLife: 0.6,
            color: color,
            size: 3 + Math.random() * 3,
            gravity: 0,
            friction: 0.9,
            type: 'spark'
          });
        }
        // Expanding ring
        this.particles.push({
          x: x, y: y, vx: 0, vy: 0,
          life: 0.5, maxLife: 0.5,
          color: color, size: radius,
          gravity: 0, friction: 1.0,
          type: 'ring'
        });
        break;

      case 'multi_shot':
        // Burst of small particles in a forward cone
        for (var i = 0; i < 15; i++) {
          var angle = (Math.random() - 0.5) * Math.PI * 0.6;
          var speed = 150 + Math.random() * 100;
          this.particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.3, maxLife: 0.3,
            color: color,
            size: 2 + Math.random() * 2,
            gravity: 0, friction: 0.95,
            type: 'circle'
          });
        }
        break;

      case 'meteor':
        // Large ring + shower of sparks falling downward
        this.particles.push({
          x: x, y: y, vx: 0, vy: 0,
          life: 0.8, maxLife: 0.8,
          color: '#FF6F00', size: radius,
          gravity: 0, friction: 1.0,
          type: 'ring'
        });
        for (var i = 0; i < 30; i++) {
          var angle = Math.random() * Math.PI * 2;
          var dist = Math.random() * radius * 0.5;
          this.particles.push({
            x: x + Math.cos(angle) * dist,
            y: y - 40 - Math.random() * 60, // Start above
            vx: (Math.random() - 0.5) * 60,
            vy: 100 + Math.random() * 150, // Fall downward
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            color: i % 3 === 0 ? '#FF6F00' : (i % 3 === 1 ? '#FF8F00' : '#FFAB00'),
            size: 2 + Math.random() * 4,
            gravity: 200,
            friction: 0.98,
            type: 'spark'
          });
        }
        break;

      case 'bomb':
        // Compact fiery explosion for ordinary bomber skills
        this.particles.push({
          x: x, y: y, vx: 0, vy: 0,
          life: 0.45, maxLife: 0.45,
          color: '#FF7043', size: radius,
          gravity: 0, friction: 1.0,
          type: 'ring'
        });
        for (var i = 0; i < 24; i++) {
          var angle = Math.random() * Math.PI * 2;
          var speed = 80 + Math.random() * 170;
          this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.35 + Math.random() * 0.25,
            maxLife: 0.6,
            color: i % 3 === 0 ? '#FFCA28' : (i % 3 === 1 ? '#FF7043' : '#6D4C41'),
            size: 3 + Math.random() * 5,
            gravity: 80,
            friction: 0.9,
            type: 'spark'
          });
        }
        break;

      case 'poison_cloud':
        // Lingering green cloud dots spreading around the target
        this.particles.push({
          x: x, y: y, vx: 0, vy: 0,
          life: 0.8, maxLife: 0.8,
          color: '#66BB6A', size: radius,
          gravity: 0, friction: 1.0,
          type: 'ring'
        });
        for (var i = 0; i < 28; i++) {
          var angle = Math.random() * Math.PI * 2;
          var dist = Math.random() * radius * 0.55;
          this.particles.push({
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist * 0.55,
            vx: (Math.random() - 0.5) * 45,
            vy: -20 - Math.random() * 35,
            life: 0.7 + Math.random() * 0.45,
            maxLife: 1.15,
            color: i % 2 === 0 ? '#76FF03' : '#2E7D32',
            size: 5 + Math.random() * 7,
            gravity: -10,
            friction: 0.94,
            type: 'circle'
          });
        }
        break;

      case 'dash':
        // Trail of particles along a line
        for (var i = 0; i < 20; i++) {
          this.particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.3 + Math.random() * 0.2,
            maxLife: 0.5,
            color: color,
            size: 3 + Math.random() * 3,
            gravity: 0,
            friction: 0.9,
            type: 'circle'
          });
        }
        break;

      case 'clone':
        // Puff of smoke particles
        for (var i = 0; i < 15; i++) {
          var angle = Math.random() * Math.PI * 2;
          var speed = 30 + Math.random() * 50;
          this.particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            color: '#90A4AE',
            size: 4 + Math.random() * 5,
            gravity: -20, // Float upward slightly
            friction: 0.93,
            type: 'circle'
          });
        }
        break;

      case 'stun':
        // Stars in a circle above target
        for (var i = 0; i < 8; i++) {
          var angle = (i / 8) * Math.PI * 2;
          this.particles.push({
            x: x + Math.cos(angle) * 20,
            y: y - 20 + Math.sin(angle) * 10,
            vx: Math.cos(angle) * 15,
            vy: Math.sin(angle) * 15 - 10,
            life: 1.0, maxLife: 1.0,
            color: '#FFD700',
            size: 3,
            gravity: 0,
            friction: 0.98,
            type: 'spark'
          });
        }
        break;

      case 'backstab':
        // Quick burst behind target
        for (var i = 0; i < 12; i++) {
          var angle = Math.random() * Math.PI * 2;
          var speed = 60 + Math.random() * 80;
          this.particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.2 + Math.random() * 0.15,
            maxLife: 0.35,
            color: '#B71C1C',
            size: 2 + Math.random() * 3,
            gravity: 0, friction: 0.9,
            type: 'spark'
          });
        }
        break;

      case 'slow':
        // Blue/white particles spreading on ground
        for (var i = 0; i < 15; i++) {
          var angle = Math.random() * Math.PI * 2;
          var speed = 20 + Math.random() * 40;
          this.particles.push({
            x: x + (Math.random() - 0.5) * radius,
            y: y + (Math.random() - 0.5) * radius * 0.5,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed * 0.3, // Mostly horizontal
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            color: i % 2 === 0 ? '#42A5F5' : '#BBDEFB',
            size: 3 + Math.random() * 3,
            gravity: 0,
            friction: 0.92,
            type: 'circle'
          });
        }
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TRAIL EFFECT - Single dot for movement trails
  // ═══════════════════════════════════════════════════════════════
  /**
   * Add a single trail dot that fades quickly.
   * @param {number} x - Position X
   * @param {number} y - Position Y
   * @param {string} color - Trail color
   * @param {number} size - Trail dot size
   */
  addTrail(x, y, color, size) {
    this.trails.push({
      x: x,
      y: y,
      life: 0.25,
      maxLife: 0.25,
      color: color,
      size: size || 3
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // HEAL EFFECT - Green particles floating upward
  // ═══════════════════════════════════════════════════════════════
  /**
   * Create 5-8 green particles floating upward for healing.
   * @param {number} x - Position X
   * @param {number} y - Position Y
   */
  addHealEffect(x, y) {
    var count = 5 + Math.floor(Math.random() * 4); // 5-8
    for (var i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -40 - Math.random() * 30, // Float upward
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color: '#4CAF50',
        size: 3 + Math.random() * 2,
        gravity: -10, // Continue upward
        friction: 0.98,
        type: 'circle'
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN SHAKE
  // ═══════════════════════════════════════════════════════════════
  /**
   * Trigger screen shake. Uses the max of current and new amount.
   * @param {number} amount - Shake intensity (3-5 normal, 8-12 big)
   */
  screenShake(amount) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  /**
   * Get current shake offset for the camera.
   * @returns {{x: number, y: number}} Random offset based on shake amount
   */
  getShakeOffset() {
    if (this.shakeAmount < 0.5) {
      return { x: 0, y: 0 };
    }
    return {
      x: (Math.random() - 0.5) * this.shakeAmount * 2,
      y: (Math.random() - 0.5) * this.shakeAmount * 2
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // UPDATE - Advance all effects by dt seconds
  // ═══════════════════════════════════════════════════════════════
  /**
   * Update all active effects.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // --- Update particles ---
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;     // Apply gravity
      p.vx *= p.friction;          // Apply friction
      p.vy *= p.friction;
      p.life -= dt;

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // --- Update damage numbers ---
    for (var i = this.damageNumbers.length - 1; i >= 0; i--) {
      var d = this.damageNumbers[i];
      d.y += d.vy * dt;
      d.vy *= 0.98; // Slow down rise
      d.life -= dt;

      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // --- Update trails ---
    for (var i = this.trails.length - 1; i >= 0; i--) {
      this.trails[i].life -= dt;
      if (this.trails[i].life <= 0) {
        this.trails.splice(i, 1);
      }
    }

    // --- Decay screen shake ---
    if (this.shakeAmount > 0) {
      this.shakeAmount *= Math.pow(0.05, dt); // Rapid exponential decay
      if (this.shakeAmount < 0.3) {
        this.shakeAmount = 0;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER - Draw all active effects to the canvas
  // ═══════════════════════════════════════════════════════════════
  /**
   * Render all active visual effects.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    // --- Draw trails (below everything else) ---
    for (var i = 0; i < this.trails.length; i++) {
      var t = this.trails[i];
      var alpha = t.life / t.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.fill();
      ctx.restore();
    }

    // --- Draw particles ---
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      var alpha = Math.max(0, p.life / p.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;

      switch (p.type) {
        case 'circle':
          // Simple filled circle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          break;

        case 'spark':
          // Elongated rectangle (spark) rotated in direction of movement
          var sparkAngle = Math.atan2(p.vy, p.vx);
          if (isNaN(sparkAngle) || !isFinite(sparkAngle)) sparkAngle = 0;
          var sparkLen = p.size * 2.5;
          var sparkWidth = p.size * 0.6;
          ctx.translate(p.x, p.y);
          ctx.rotate(sparkAngle);
          ctx.beginPath();
          ctx.rect(-sparkLen / 2, -sparkWidth / 2, sparkLen, sparkWidth);
          ctx.fillStyle = p.color;
          ctx.fill();
          break;

        case 'ring':
          // Expanding stroked circle
          var progress = 1 - (p.life / p.maxLife);
          var ringRadius = p.size * (0.5 + progress * 1.5);
          ctx.beginPath();
          ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2 + (1 - progress) * 3;
          ctx.stroke();
          break;
      }

      ctx.restore();
    }

    // --- Draw damage numbers ---
    for (var i = 0; i < this.damageNumbers.length; i++) {
      var d = this.damageNumbers[i];
      var alpha = Math.max(0, d.life / d.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold ' + d.fontSize + 'px "Arial Black", Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Crit numbers scale up slightly
      if (d.isSkillName) {
        var skillScale = 0.82 + Math.sin((1 - alpha) * Math.PI) * 0.3 + alpha * 0.18;
        ctx.translate(d.x, d.y);
        ctx.scale(skillScale, skillScale);
        ctx.shadowColor = d.glowColor || d.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 5;
        ctx.strokeStyle = d.strokeColor || '#111111';
        ctx.fillStyle = d.color;
        ctx.strokeText(d.text, 0, 0);
        ctx.fillText(d.text, 0, 0);
      } else if (d.isCrit) {
        var scale = 1 + (1 - alpha) * 0.3;
        ctx.translate(d.x, d.y);
        ctx.scale(scale, scale);
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, 0, 0);
      } else {
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, d.x, d.y);
      }

      ctx.restore();
    }
  }
}
