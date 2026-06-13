import { safeDirection } from '../utils.js';

export class FighterAI {
  constructor(fighter) {
    this.fighter = fighter;
    // Movement strategy registry — one method per movePattern.
    // Each receives (dt, moveSpeed, dir, effectSystem) where dir = {dx, dy, dist}.
    this._movementStrategies = {
      linear:       this._moveLinear.bind(this),
      keepDistance: this._moveKeepDistance.bind(this),
      arc:          this._moveArc.bind(this),
      dash:         this._moveDash.bind(this),
      zigzag:       this._moveZigzag.bind(this),
      flank:        this._moveFlank.bind(this),
      wobble:       this._moveWobble.bind(this),
    };
  }

  findClosestTarget(opposingTeam) {
    if (!opposingTeam || opposingTeam.length === 0) {
      this.fighter.target = null;
      return;
    }

    // If current target is alive and we are already committed to an attack/skill, keep it
    if (this.fighter.target && this.fighter.target.isAlive() &&
        (this.fighter.state === 'charge' || this.fighter.state === 'attack' || this.fighter.state === 'skill' || this.fighter.state === 'dashing_skill')) {
      return;
    }

    // Bounty Mark: target the lowest HP enemy instead of the closest
    if (this.fighter.hasPassive && this.fighter.hasPassive('bounty_mark')) {
      this._findLowestHpTarget(opposingTeam);
      return;
    }

    let closest = null;
    let minDist = Infinity;

    let currentTargetDist = Infinity;
    if (this.fighter.target && this.fighter.target.isAlive()) {
      const dx = this.fighter.target.x - this.fighter.x;
      const dy = this.fighter.target.y - this.fighter.y;
      currentTargetDist = Math.sqrt(dx * dx + dy * dy);
    }

    for (let i = 0; i < opposingTeam.length; i++) {
      const enemy = opposingTeam[i];
      if (enemy.isAlive()) {
        const dx = enemy.x - this.fighter.x;
        const dy = enemy.y - this.fighter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = enemy;
        }
      }
    }

    // Hysteresis: only switch targets if the new closest is significantly closer
    // (e.g. 25 pixels) than the current target. This prevents rapid spinning/trembling.
    if (this.fighter.target && this.fighter.target.isAlive()) {
      if (closest !== this.fighter.target && minDist < currentTargetDist - 25) {
        this.fighter.target = closest;
      }
    } else {
      this.fighter.target = closest;
    }
  }

  /**
   * Target the enemy with the lowest current HP (bounty_mark passive).
   * Hysteresis: only switch if the new target has meaningfully lower HP.
   */
  _findLowestHpTarget(opposingTeam) {
    let best = null;
    let lowestHp = Infinity;

    let currentTargetHp = Infinity;
    if (this.fighter.target && this.fighter.target.isAlive()) {
      currentTargetHp = this.fighter.target.hp;
    }

    for (let i = 0; i < opposingTeam.length; i++) {
      const enemy = opposingTeam[i];
      if (enemy.isAlive()) {
        if (enemy.hp < lowestHp) {
          lowestHp = enemy.hp;
          best = enemy;
        }
      }
    }

    // Hysteresis: only switch if new target has at least 15 less HP (absolute)
    // This prevents rapid target switching when multiple enemies are similarly wounded.
    if (this.fighter.target && this.fighter.target.isAlive()) {
      if (best !== this.fighter.target && lowestHp < currentTargetHp - 15) {
        this.fighter.target = best;
      }
    } else {
      this.fighter.target = best;
    }
  }

  applyMovement(dt, ctx) {
    if (!this.fighter.target || !this.fighter.target.isAlive()) return;

    // Convert speed: charData.speed is px/frame at 60fps → px/sec = speed * 60
    var baseSpeed = this.fighter.charData.speed * 60;
    var moveSpeed = baseSpeed * dt * this.fighter.getSpeedMultiplier();

    const dir = safeDirection(
      this.fighter.target.x - this.fighter.x,
      this.fighter.target.y - this.fighter.y
    );

    const strategy = this._movementStrategies[this.fighter.charData.movePattern];
    if (strategy) {
      strategy(dt, moveSpeed, dir, ctx.effectSystem);
    }
  }

  // ── Movement strategies (one per movePattern) ────────────

  /** LINEAR: Direct approach */
  _moveLinear(dt, moveSpeed, dir) {
    this.fighter.x += dir.dx * moveSpeed;
    this.fighter.y += dir.dy * moveSpeed;
  }

  /** KEEP DISTANCE: Maintain ideal range */
  _moveKeepDistance(dt, moveSpeed, dir) {
    var idealDist = this.fighter.charData.attackRange * 0.7;
    if (this.fighter.skillReady && this.fighter.charData.skill) {
      idealDist = Math.min(idealDist, this.fighter.charData.skill.range * 0.8);
    }

    if (dir.dist < idealDist - 20) {
      this.fighter.x -= dir.dx * moveSpeed;
      this.fighter.y -= dir.dy * moveSpeed;
    } else if (dir.dist > idealDist + 20) {
      this.fighter.x += dir.dx * moveSpeed;
      this.fighter.y += dir.dy * moveSpeed;
    }

    // Perpendicular drift to avoid being stationary
    this.fighter.x += -dir.dy * moveSpeed * 0.3;
    this.fighter.y += dir.dx * moveSpeed * 0.3;
  }

  /** ARC: Orbit around target */
  _moveArc(dt, moveSpeed, dir) {
    this.fighter.flankAngle += dt * 1.5;
    var idealDist = this.fighter.charData.attackRange * 0.8;
    if (this.fighter.skillReady && this.fighter.charData.skill) {
      idealDist = Math.min(idealDist, this.fighter.charData.skill.range * 0.8);
    }

    var orbitX = this.fighter.target.x + Math.cos(this.fighter.flankAngle) * idealDist;
    var orbitY = this.fighter.target.y + Math.sin(this.fighter.flankAngle) * idealDist;

    const toDir = safeDirection(orbitX - this.fighter.x, orbitY - this.fighter.y);
    this.fighter.x += toDir.dx * moveSpeed;
    this.fighter.y += toDir.dy * moveSpeed;
  }

  /** DASH: Normal movement + periodic high-speed slide */
  _moveDash(dt, moveSpeed, dir, effectSystem) {
    if (this.fighter.shortDashTimer > 0) {
      this.fighter.shortDashTimer -= dt;
      if (isFinite(this.fighter.shortDashVx) && isFinite(this.fighter.shortDashVy)) {
        this.fighter.x += this.fighter.shortDashVx * dt;
        this.fighter.y += this.fighter.shortDashVy * dt;
      }
      if (effectSystem && Math.random() < 0.4) {
        effectSystem.addTrail(this.fighter.x, this.fighter.y, this.fighter.charData.color + '60', 3);
      }
      return;
    }

    this.fighter.x += dir.dx * moveSpeed;
    this.fighter.y += dir.dy * moveSpeed;

    if (this.fighter.blinkCooldown <= 0 && dir.dist > 70) {
      var dashDist = 90 + Math.random() * 30;
      this.fighter.shortDashTimer = 0.15;
      this.fighter.shortDashVx = dir.dx * (dashDist / 0.15);
      this.fighter.shortDashVy = dir.dy * (dashDist / 0.15);
      this.fighter.blinkCooldown = 2.0 + Math.random() * 1.5;
    }
  }

  /** ZIGZAG: Alternating perpendicular movement */
  _moveZigzag(dt, moveSpeed, dir) {
    this.fighter.moveTimer += dt;
    if (this.fighter.moveTimer >= 0.4) {
      this.fighter.zigzagDir *= -1;
      this.fighter.moveTimer = 0;
    }
    // Perpendicular direction
    var px = -dir.dy;
    var py = dir.dx;
    this.fighter.x += (dir.dx + px * this.fighter.zigzagDir * 0.7) * moveSpeed;
    this.fighter.y += (dir.dy + py * this.fighter.zigzagDir * 0.7) * moveSpeed;
  }

  /** FLANK: Move to target's back */
  _moveFlank(dt, moveSpeed, dir) {
    var behindX = this.fighter.target.x - Math.cos(this.fighter.target.angle) * 60;
    var behindY = this.fighter.target.y - Math.sin(this.fighter.target.angle) * 60;
    const toDir = safeDirection(behindX - this.fighter.x, behindY - this.fighter.y);
    this.fighter.x += toDir.dx * moveSpeed;
    this.fighter.y += toDir.dy * moveSpeed;
  }

  /** WOBBLE: Unpredictable wobbly path */
  _moveWobble(dt, moveSpeed, dir) {
    this.fighter.wobbleAngle += dt * 8;
    var wobbleX = Math.cos(this.fighter.wobbleAngle) * moveSpeed * 0.5;
    var wobbleY = Math.sin(this.fighter.wobbleAngle * 1.3) * moveSpeed * 0.5;
    this.fighter.x += dir.dx * moveSpeed * 0.7 + wobbleX;
    this.fighter.y += dir.dy * moveSpeed * 0.7 + wobbleY;
  }

  startReposition(ctx) {
    this.fighter.setState('reposition');
    // Reposition duration is longer for full map movements (e.g. 2.0s to 3.5s)
    this.fighter.repositionDuration = 2.0 + Math.random() * 1.5;

    const arenaX = ctx.arenaX || 20;
    const arenaY = ctx.arenaY || 10;
    const arenaWidth = ctx.arenaWidth || 800;
    const arenaHeight = ctx.arenaHeight || 500;

    if (this.fighter.charData.weaponType === 'ranged') {
      this.fighter.repositionType = 'waypoint';

      // Pick the furthest waypoint from the enemy
      if (this.fighter.target && this.fighter.target.isAlive()) {
        const enemyX = this.fighter.target.x;
        const enemyY = this.fighter.target.y;

        // 8 Candidate waypoints (corners & midpoints of arena boundaries)
        const candidates = [
          { x: arenaX + 40, y: arenaY + 40 }, // Top Left
          { x: arenaX + arenaWidth - 40, y: arenaY + 40 }, // Top Right
          { x: arenaX + arenaWidth - 40, y: arenaY + arenaHeight - 40 }, // Bottom Right
          { x: arenaX + 40, y: arenaY + arenaHeight - 40 }, // Bottom Left
          { x: arenaX + arenaWidth / 2, y: arenaY + 40 }, // Top Mid
          { x: arenaX + arenaWidth / 2, y: arenaY + arenaHeight - 40 }, // Bottom Mid
          { x: arenaX + 40, y: arenaY + arenaHeight / 2 }, // Left Mid
          { x: arenaX + arenaWidth - 40, y: arenaY + arenaHeight / 2 } // Right Mid
        ];

        let maxDist = -1;
        let bestPoint = candidates[0];

        for (const pt of candidates) {
          const dx = pt.x - enemyX;
          const dy = pt.y - enemyY;
          const dist = dx * dx + dy * dy;
          if (dist > maxDist) {
            maxDist = dist;
            bestPoint = pt;
          }
        }

        this.fighter.repositionWaypointX = bestPoint.x;
        this.fighter.repositionWaypointY = bestPoint.y;
      } else {
        // Fallback: random corner
        this.fighter.repositionWaypointX = arenaX + (Math.random() < 0.5 ? 40 : arenaWidth - 40);
        this.fighter.repositionWaypointY = arenaY + (Math.random() < 0.5 ? 40 : arenaHeight - 40);
      }
    } else {
      // Melee units circle 70% of the time with a WIDE radius, retreat 30% of the time
      this.fighter.repositionType = Math.random() < 0.7 ? 'circle' : 'retreat';
      this.fighter.circleDir = Math.random() < 0.5 ? 1 : -1;
    }
  }

  applyRepositionMovement(dt, ctx) {
    if (!this.fighter.target || !this.fighter.target.isAlive()) return;

    const effectSystem = ctx.effectSystem;
    var baseSpeed = this.fighter.charData.speed * 60;
    var moveSpeed = baseSpeed * dt * this.fighter.getSpeedMultiplier();

    var dx = this.fighter.target.x - this.fighter.x;
    var dy = this.fighter.target.y - this.fighter.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }

    if (this.fighter.repositionType === 'waypoint') {
      // Move towards the designated waypoint (full-map kiting)
      var wpDx = this.fighter.repositionWaypointX - this.fighter.x;
      var wpDy = this.fighter.repositionWaypointY - this.fighter.y;
      var wpDist = Math.sqrt(wpDx * wpDx + wpDy * wpDy);

      if (!isFinite(wpDx) || !isFinite(wpDy) || !isFinite(wpDist) || wpDist < 1) {
        wpDx = 0;
        wpDy = 0;
        wpDist = 1;
      }

      if (wpDist > 10) {
        this.fighter.x += (wpDx / wpDist) * moveSpeed;
        this.fighter.y += (wpDy / wpDist) * moveSpeed;
      } else {
        // Arrived at waypoint, default to circling target
        this.fighter.repositionType = 'circle';
        this.fighter.circleDir = Math.random() < 0.5 ? 1 : -1;
      }

      // Speed trail effect while running across the map
      if (effectSystem && Math.random() < 0.25) {
        effectSystem.addTrail(this.fighter.x, this.fighter.y, this.fighter.charData.color + '30', 2.5);
      }
    } else if (this.fighter.repositionType === 'retreat') {
      // Move directly away from target
      this.fighter.x -= (dx / dist) * moveSpeed;
      this.fighter.y -= (dy / dist) * moveSpeed;

      // Visual representation (dust particles on backing off)
      if (Math.random() < 0.1 && effectSystem) {
        effectSystem.addTrail(this.fighter.x, this.fighter.y, 'rgba(255,255,255,0.15)', 2);
      }
    } else if (this.fighter.repositionType === 'circle') {
      // Tangent direction for circling
      var tx = -dy / dist;
      var ty = dx / dist;

      // WIDE circling: radius is 220px - 300px depending on their base range
      var idealDist = Math.max(220, this.fighter.charData.attackRange * 1.5);
      var radialPush = 0;
      if (dist < idealDist) {
        radialPush = -0.3; // Push outward slightly
      } else if (dist > idealDist + 20) {
        radialPush = 0.3; // Pull inward slightly
      }

      this.fighter.x += (tx * this.fighter.circleDir + (dx / dist) * radialPush) * moveSpeed;
      this.fighter.y += (ty * this.fighter.circleDir + (dy / dist) * radialPush) * moveSpeed;

      // Visual trail
      if (Math.random() < 0.08 && effectSystem) {
        effectSystem.addTrail(this.fighter.x, this.fighter.y, this.fighter.charData.color + '40', 3);
      }
    }
  }


}
