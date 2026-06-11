/**
 * fighter.js - Fighter Class for 2D Auto-Battle Game
 * 
 * The core combat entity. Implements state machine, movement patterns,
 * AI decision making, combat, skills, and rendering.
 * 
 * Depends on globals: CHARACTERS, EffectSystem, WeaponSystem
 * No modules/imports - loaded via script tag.
 */

class Fighter {
  /**
   * Create a new fighter from character data.
   * @param {string} characterId - Key in the CHARACTERS object
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {string} team - 'left' or 'right'
   */
  constructor(characterId, x, y, team) {
    // Load character data from the global CHARACTERS object
    this.charData = CHARACTERS[characterId];
    if (!this.charData) {
      throw new Error('Unknown character ID: ' + characterId);
    }

    // Position and orientation
    this.x = x;
    this.y = y;
    this.angle = (team === 'left') ? 0 : Math.PI; // Face toward the enemy side
    this.team = team;

    // Health
    this.hp = this.charData.hp;
    this.maxHp = this.charData.hp;

    // State machine
    this.state = 'idle';
    this.stateTimer = 0;
    this.alive = true;

    // Combat timers
    this.attackTimer = 0;          // Cooldown between attacks
    this.skillCooldown = this.charData.skill.cooldown * 0.5; // Start half-charged
    this.skillReady = false;
    this.attackExecuted = false;    // Flag to ensure attack fires once per state

    // Debuff timers
    this.stunTimer = 0;
    this.slowTimer = 0;
    this.poisonTimer = 0;
    this.poisonDps = 0;
    this.poisonTickTimer = 0;
    this.poisonTrailTimer = 0;

    // Movement pattern state
    this.moveTimer = 0;
    this.blinkCooldown = 1.0 + Math.random(); // Initial delay before first blink
    this.zigzagDir = 1;
    this.flankAngle = Math.random() * Math.PI * 2;
    this.wobbleAngle = Math.random() * Math.PI * 2;

    // Reposition state variables
    this.repositionDuration = 0;
    this.repositionType = 'retreat'; // 'retreat' or 'circle'
    this.circleDir = 1; // 1 or -1
    this.repositionWaypointX = null;
    this.repositionWaypointY = null;

    // Dash skill state variables
    this.dashTargetX = 0;
    this.dashTargetY = 0;
    this.dashStartX = 0;
    this.dashStartY = 0;
    this.dashDuration = 0;
    this.dashTimer = 0;
    this.dashSkillType = ''; // 'dash' or 'backstab'

    // Normal movement dash state variables
    this.shortDashTimer = 0;
    this.shortDashVx = 0;
    this.shortDashVy = 0;

    // Visual state
    this.hitFlashTimer = 0;

    // Ninja clone state
    this.clones = [];
    this.cloneTimer = 0;

    // Superhero-specific mechanics
    this.bloodShield = 0;
    this.bloodShieldCooldown = 0;
    this.whistleCooldown = 0;

    // Reference to enemy target (set externally)
    this.target = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Transition to a new state, resetting the state timer.
   * @param {string} newState - Target state
   */
  setState(newState) {
    this.state = newState;
    this.stateTimer = 0;
    this.attackExecuted = false; // Reset attack execution flag
  }

  /**
   * Find and set the closest alive enemy from the opposing team.
   * Does not change target mid-attack/skill to avoid animation jitter.
   * @param {Fighter[]} opposingTeam
   */
  findClosestTarget(opposingTeam) {
    if (!opposingTeam || opposingTeam.length === 0) {
      this.target = null;
      return;
    }

    // If current target is alive and we are already committed to an attack/skill, keep it
    if (this.target && this.target.isAlive() && 
        (this.state === 'charge' || this.state === 'attack' || this.state === 'skill' || this.state === 'dashing_skill')) {
      return;
    }

    let closest = null;
    let minDist = Infinity;

    let currentTargetDist = Infinity;
    if (this.target && this.target.isAlive()) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      currentTargetDist = Math.sqrt(dx * dx + dy * dy);
    }

    for (let i = 0; i < opposingTeam.length; i++) {
      const enemy = opposingTeam[i];
      if (enemy.isAlive()) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = enemy;
        }
      }
    }

    // Hysteresis: only switch targets if the new closest is significantly closer
    // (e.g. 25 pixels) than the current target. This prevents rapid spinning/trembling.
    if (this.target && this.target.isAlive()) {
      if (closest !== this.target && minDist < currentTargetDist - 25) {
        this.target = closest;
      }
    } else {
      this.target = closest;
    }
  }

  /**
   * Set the enemy target for this fighter.
   * @param {Fighter} enemy - The enemy fighter to target
   */
  setTarget(enemy) {
    this.target = enemy;
  }

  /**
   * Apply stun debuff.
   * @param {number} duration - Stun duration in seconds
   */
  applyStun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  /**
   * Apply slow debuff.
   * @param {number} duration - Slow duration in seconds
   */
  applySlow(duration) {
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  /**
   * Apply poison damage over time.
   * @param {number} duration - Poison duration in seconds
   * @param {number} dps - Damage per second
   */
  applyPoison(duration, dps) {
    this.poisonTimer = Math.max(this.poisonTimer, duration);
    this.poisonDps = Math.max(this.poisonDps || 0, dps || 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═══════════════════════════════════════════════════════════════

  /**
   * Full update: timers, state machine, movement, combat.
   * @param {number} dt - Delta time in seconds
   * @param {WeaponSystem} weaponSystem - For creating attacks
   * @param {EffectSystem} effectSystem - For visual effects
   * @param {number} arenaWidth - Arena width in pixels
   * @param {number} arenaHeight - Arena height in pixels
   * @param {number} arenaX - Arena left offset (optional, default 0)
   * @param {number} arenaY - Arena top offset (optional, default 0)
   */
  update(dt, weaponSystem, effectSystem, arenaWidth, arenaHeight, arenaX, arenaY, opposingTeam) {
    arenaX = arenaX || 0;
    arenaY = arenaY || 0;
    arenaWidth = arenaWidth || 800;
    arenaHeight = arenaHeight || 500;

    // Sanitize state variables at start of update to prevent NaN propagation
    if (typeof this.x !== 'number' || !isFinite(this.x)) this.x = arenaX + arenaWidth / 2;
    if (typeof this.y !== 'number' || !isFinite(this.y)) this.y = arenaY + arenaHeight / 2;
    if (typeof this.hp !== 'number' || !isFinite(this.hp)) this.hp = this.maxHp;
    if (typeof this.angle !== 'number' || !isFinite(this.angle)) this.angle = this.team === 'left' ? 0 : Math.PI;

    // Dead fighters don't update beyond death animation
    if (!this.alive && this.state !== 'dead') return;

    // Find closest target dynamically
    this.findClosestTarget(opposingTeam);

    // ── Update all timers ──
    this.stateTimer += dt;
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    this.stunTimer = Math.max(0, this.stunTimer - dt);
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    this.updatePoison(dt, effectSystem);
    this.updatePoisonTrail(dt, effectSystem);
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.blinkCooldown = Math.max(0, this.blinkCooldown - dt);
    this.cloneTimer = Math.max(0, this.cloneTimer - dt);
    this.skillReady = (this.skillCooldown <= 0);

    this.updatePassiveTimers(dt);
    this.updateAutomaticPassives(opposingTeam, effectSystem);

    // Clear clones when timer expires
    if (this.cloneTimer <= 0 && this.clones.length > 0) {
      this.clones = [];
    }

    // ── Stunned: skip all actions ──
    if (this.stunTimer > 0) {
      // Still clamp coordinates and sanitize!
      if (typeof this.x !== 'number' || !isFinite(this.x)) this.x = arenaX + arenaWidth / 2;
      if (typeof this.y !== 'number' || !isFinite(this.y)) this.y = arenaY + arenaHeight / 2;
      this.x = Math.max(arenaX + 30, Math.min(arenaX + arenaWidth - 30, this.x));
      this.y = Math.max(arenaY + 30, Math.min(arenaY + arenaHeight - 30, this.y));
      return;
    }

    // ── Update facing angle toward target ──
    if (this.target && this.target.isAlive()) {
      if (isFinite(this.target.x) && isFinite(this.target.y) && isFinite(this.x) && isFinite(this.y)) {
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      }
    }
    if (typeof this.angle !== 'number' || !isFinite(this.angle)) {
      this.angle = this.team === 'left' ? 0 : Math.PI;
    }

    // Skills have absolute priority: cast immediately once ready and in range.
    if (this.canCastSkillNow()) {
      this.setState('skill');
    } else if (this.skillReady && this.target && this.target.isAlive() &&
        this.state !== 'skill' && this.state !== 'dashing_skill' && this.state !== 'dead') {
      this.setState('chase');
    }

    // ── State machine ──
    switch (this.state) {

      // ───────────────────────────────────────────────
      // IDLE: Brief wait before engaging
      // ───────────────────────────────────────────────
      case 'idle':
        if (this.stateTimer >= 0.5) {
          this.setState('chase');
        }
        break;

      // ───────────────────────────────────────────────
      // CHASE: Move toward enemy, check attack conditions
      // ───────────────────────────────────────────────
      case 'chase':
        if (!this.target || !this.target.isAlive()) break;

        // Check distance to target
        var dx = this.target.x - this.x;
        var dy = this.target.y - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        // If melee unit is close but attack is on cooldown, perform repositioning movement (circle/retreat)
        if (this.charData.weaponType === 'melee' && dist <= this.charData.attackRange * 1.5 && this.attackTimer > 0) {
          if (this.repositionType === 'waypoint') {
            this.repositionType = Math.random() < 0.65 ? 'circle' : 'retreat';
          }
          this.applyRepositionMovement(dt, arenaWidth, arenaHeight, effectSystem);
        } else {
          // Apply standard movement pattern
          this.applyMovement(dt, arenaWidth, arenaHeight, effectSystem);
        }

        // Apply AI behavior modifications
        this.updateAI(dt, arenaWidth, arenaHeight);

        if (dist <= this.charData.attackRange && this.attackTimer <= 0) {
          // Normal attack
          this.setState('charge');
        }
        break;

      // ───────────────────────────────────────────────
      // CHARGE: Wind up before attacking
      // ───────────────────────────────────────────────
      case 'charge':
        // Charge-up particle effects
        if (Math.random() < 0.3) {
          effectSystem.addChargeEffect(this.x, this.y, this.charData.color);
        }

        // Melee units continue chasing at 80% speed during charge to stay close to moving enemies
        if (this.charData.weaponType === 'melee') {
          this.applyMovement(dt * 0.8, arenaWidth, arenaHeight, effectSystem);
        }

        // When charge time is reached, execute attack
        if (this.stateTimer >= this.charData.chargeTime) {
          this.setState('attack');
        }
        break;

      // ───────────────────────────────────────────────
      // ATTACK: Execute the attack (once)
      // ───────────────────────────────────────────────
      case 'attack':
        if (!this.attackExecuted) {
          this.attackExecuted = true;
          this.executeAttack(weaponSystem, effectSystem);
          this.attackTimer = this.charData.attackSpeed;
        }
        // Brief attack animation, then transition
        if (this.stateTimer >= 0.15) {
          this.setState('cooldown');
          // Choose a reposition type for the cooldown duration
          this.repositionType = (this.charData.weaponType === 'ranged') ? 'retreat' : (Math.random() < 0.65 ? 'circle' : 'retreat');
          this.circleDir = Math.random() < 0.5 ? 1 : -1;
        }
        break;

      // ───────────────────────────────────────────────
      // COOLDOWN: Brief pause after attacking, moves to reposition
      // ───────────────────────────────────────────────
      case 'cooldown':
        // Move during cooldown!
        this.applyRepositionMovement(dt, arenaWidth, arenaHeight, effectSystem);
        if (this.stateTimer >= this.charData.attackSpeed * 0.3) {
          // 85% chance to perform an extended tactical reposition, otherwise chase
          if (Math.random() < 0.85) {
            this.startReposition(arenaWidth, arenaHeight, arenaX, arenaY);
          } else {
            this.setState('chase');
          }
        }
        break;

      // ───────────────────────────────────────────────
      // SKILL: Execute special skill (once)
      // ───────────────────────────────────────────────
      case 'skill':
        if (!this.attackExecuted) {
          this.attackExecuted = true;
          this.executeSkill(weaponSystem, effectSystem);
        }
        // Skill animation time
        if (this.stateTimer >= 0.5) {
          // Reposition to back away or flank after a skill
          this.startReposition(arenaWidth, arenaHeight, arenaX, arenaY);
        }
        break;

      // ───────────────────────────────────────────────
      // REPOSITION: Maneuver around the target
      // ───────────────────────────────────────────────
      case 'reposition':
        if (!this.target || !this.target.isAlive()) {
          this.setState('chase');
          break;
        }

        this.applyRepositionMovement(dt, arenaWidth, arenaHeight, effectSystem);

        // Reposition for a short time, then resume chasing
        if (this.stateTimer >= this.repositionDuration) {
          this.setState('chase');
        }
        break;

      // ───────────────────────────────────────────────
      // DASHING_SKILL: Slide smoothly towards the target location
      // ───────────────────────────────────────────────
      case 'dashing_skill':
        if (!this.target || !this.target.isAlive()) {
          this.setState('chase');
          break;
        }

        this.dashTimer += dt;
        var duration = this.dashDuration || 0.1;
        if (duration <= 0) duration = 0.1;
        var dashPct = Math.min(1, this.dashTimer / duration);
        if (isNaN(dashPct) || !isFinite(dashPct)) dashPct = 1;
        
        // Linear interpolation for smooth dash coordinates
        var nextDashX = this.dashStartX + (this.dashTargetX - this.dashStartX) * dashPct;
        var nextDashY = this.dashStartY + (this.dashTargetY - this.dashStartY) * dashPct;
        if (isFinite(nextDashX)) this.x = nextDashX;
        if (isFinite(nextDashY)) this.y = nextDashY;

        // Visual trails during dash
        if (effectSystem) {
          effectSystem.addTrail(this.x, this.y, this.charData.color, 5);
          if (Math.random() < 0.3) {
            effectSystem.addTrail(this.x + (Math.random() - 0.5) * 10, this.y + (Math.random() - 0.5) * 10, '#ffffff40', 3);
          }
        }

        // When we reach the target, execute the skill payload
        if (dashPct >= 1) {
          this.x = this.dashTargetX;
          this.y = this.dashTargetY;
          this.executeDashingSkillHit(effectSystem, arenaWidth, arenaHeight, arenaX, arenaY);
        }
        break;

      // ───────────────────────────────────────────────
      // HIT: Brief stagger from taking damage
      // ───────────────────────────────────────────────
      case 'hit':
        if (this.stateTimer >= 0.2) {
          this.setState('chase');
        }
        break;

      // ───────────────────────────────────────────────
      // DEAD: Death animation, then mark as not alive
      // ───────────────────────────────────────────────
      case 'dead':
        if (this.stateTimer < dt * 2) {
          // Just entered dead state
          effectSystem.addDeathEffect(this.x, this.y, this.charData.color);
          effectSystem.screenShake(8);
        }
        this.alive = false;
        break;
    }

    // ── Clamp position to arena bounds & sanitize NaN ──
    if (typeof this.x !== 'number' || !isFinite(this.x)) {
      this.x = arenaX + arenaWidth / 2;
    }
    if (typeof this.y !== 'number' || !isFinite(this.y)) {
      this.y = arenaY + arenaHeight / 2;
    }
    if (typeof this.hp !== 'number' || !isFinite(this.hp)) {
      this.hp = this.maxHp;
    }
    if (typeof this.angle !== 'number' || !isFinite(this.angle)) {
      this.angle = this.team === 'left' ? 0 : Math.PI;
    }
    if (!isFinite(this.stunTimer)) this.stunTimer = 0;
    if (!isFinite(this.slowTimer)) this.slowTimer = 0;
    if (!isFinite(this.poisonTimer)) this.poisonTimer = 0;
    if (!isFinite(this.poisonDps)) this.poisonDps = 0;
    if (!isFinite(this.attackTimer)) this.attackTimer = 0;
    if (!isFinite(this.skillCooldown)) this.skillCooldown = 0;

    this.x = Math.max(arenaX + 30, Math.min(arenaX + arenaWidth - 30, this.x));
    this.y = Math.max(arenaY + 30, Math.min(arenaY + arenaHeight - 30, this.y));
  }

  // ═══════════════════════════════════════════════════════════════
  // ATTACK EXECUTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Execute a normal attack (melee or ranged).
   * @param {WeaponSystem} weaponSystem
   * @param {EffectSystem} effectSystem
   */
  executeAttack(weaponSystem, effectSystem) {
    if (!this.target || !this.target.isAlive()) return;

    if (this.charData.weaponType === 'melee') {
      // Give a slight lunge slide forward (20px) towards target on attack trigger
      var dx = this.target.x - this.x;
      var dy = this.target.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        var lungeDist = 20;
        this.x += (dx / dist) * lungeDist;
        this.y += (dy / dist) * lungeDist;
      }

      // Melee: check arc and range with 1.3x tolerance to compensate for high speed movement
      var result = weaponSystem.createMeleeAttack(
        this, this.target,
        this.charData.attackPower,
        this.charData.attackRange * 1.3,
        this.angle
      );

      if (result.hit && this.target.isAlive()) {
        this.applyMeleeHitPassives(result.damage, this.target, effectSystem);
        this.target.takeDamage(result.damage, this.x, this.y, effectSystem);
        this.healFromDamage(result.damage, effectSystem);

        effectSystem.addHitEffect(this.target.x, this.target.y, this.charData.color);
        effectSystem.screenShake(3);
      }
      if (window.soundSystem) window.soundSystem.playSwingSound();
    } else {
      // Ranged: spawn projectile or use a special ranged passive.
      if (this.hasPassive('summoner_attack')) {
        this.performSummonerBasicAttack(effectSystem);
      } else {
        weaponSystem.createRangedAttack(
          this.x, this.y,
          this.target.x, this.target.y,
          this.charData.attackPower,
          this.team,
          this.charData.projectileType,
          this.charData.color,
          this
        );
        if (window.soundSystem) window.soundSystem.playShootSound();
      }
    }
  }

  /**
   * Passive effects that happen when this fighter lands a melee hit.
   * @param {number} damage
   * @param {Fighter} primaryTarget
   * @param {EffectSystem} effectSystem
   */
  applyMeleeHitPassives(damage, primaryTarget, effectSystem) {
    if (this.hasPassive('saitama_splash')) {
      effectSystem.addSkillEffect('meteor', primaryTarget.x, primaryTarget.y, '#FFD700', 70);
      effectSystem.screenShake(5);

      const opposingTeam = (this.team === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
      if (opposingTeam) {
        opposingTeam.forEach(enemy => {
          if (!enemy.isAlive() || enemy === primaryTarget) return;

          const ex = enemy.x - primaryTarget.x;
          const ey = enemy.y - primaryTarget.y;
          const edist = Math.sqrt(ex * ex + ey * ey);
          if (edist <= 70) {
            enemy.takeDamage(damage * 0.5, this.x, this.y, effectSystem);
          }
        });
      }
    }

    if (this.hasPassive('spear_pierce')) {
      this.applyPiercingLineDamage(damage * 0.55, this.charData.attackRange * 1.7, 28, primaryTarget, effectSystem);
    }
  }

  /**
   * Damage enemies in a forward line, excluding the primary target.
   * @param {number} damage
   * @param {number} range
   * @param {number} width
   * @param {Fighter} primaryTarget
   * @param {EffectSystem} effectSystem
   */
  applyPiercingLineDamage(damage, range, width, primaryTarget, effectSystem) {
    const opposingTeam = (this.team === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
    if (!opposingTeam) return;

    var dirX = Math.cos(this.angle);
    var dirY = Math.sin(this.angle);
    opposingTeam.forEach(enemy => {
      if (!enemy.isAlive() || enemy === primaryTarget) return;

      const ex = enemy.x - this.x;
      const ey = enemy.y - this.y;
      const forward = ex * dirX + ey * dirY;
      const side = Math.abs(ex * dirY - ey * dirX);
      if (forward >= 0 && forward <= range && side <= width) {
        enemy.takeDamage(damage, this.x, this.y, effectSystem);
        effectSystem.addHitEffect(enemy.x, enemy.y, this.charData.color);
      }
    });
  }

  /**
   * Super Summoner passive: basic attacks summon a golem instead of firing.
   * @param {EffectSystem} effectSystem
   */
  performSummonerBasicAttack(effectSystem) {
    const teamArr = this.team === 'left' ? window.combatManager.fightersLeft : window.combatManager.fightersRight;
    if (!teamArr) return;

    var spawnX = this.x + (Math.random() - 0.5) * 60;
    var spawnY = this.y + (Math.random() - 0.5) * 60;
    var minion = new Fighter('summoned_golem', spawnX, spawnY, this.team);
    teamArr.push(minion);
    effectSystem.addSkillEffect('clone', spawnX, spawnY, '#E040FB', 30);
    if (window.soundSystem) window.soundSystem.playSummonSound();
  }

  // ═══════════════════════════════════════════════════════════════
  // MOVEMENT PATTERNS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Apply the character's movement pattern during chase state.
   * Speed is in pixels per frame at 60fps; convert to per-second.
   * @param {number} dt - Delta time
   * @param {number} arenaWidth - Arena width
   * @param {number} arenaHeight - Arena height
   * @param {EffectSystem} effectSystem - For blink trail effects
   */
  applyMovement(dt, arenaWidth, arenaHeight, effectSystem) {
    if (!this.target || !this.target.isAlive()) return;

    // Convert speed: charData.speed is px/frame at 60fps → px/sec = speed * 60
    var baseSpeed = this.charData.speed * 60;
    var moveSpeed = baseSpeed * dt * (this.slowTimer > 0 ? 0.5 : 1.0);

    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }

    switch (this.charData.movePattern) {

      // ── LINEAR: Direct approach ──
      case 'linear':
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;
        break;

      // ── KEEP DISTANCE: Maintain ideal range ──
      case 'keepDistance': {
        var idealDist = this.charData.attackRange * 0.7;

        if (dist < idealDist - 20) {
          // Too close → move away
          this.x -= (dx / dist) * moveSpeed;
          this.y -= (dy / dist) * moveSpeed;
        } else if (dist > idealDist + 20) {
          // Too far → move closer
          this.x += (dx / dist) * moveSpeed;
          this.y += (dy / dist) * moveSpeed;
        }

        // Add perpendicular drift to avoid being stationary
        var perpX = -dy / dist;
        var perpY = dx / dist;
        this.x += perpX * moveSpeed * 0.3;
        this.y += perpY * moveSpeed * 0.3;
        break;
      }

      // ── ARC: Orbit around target ──
      case 'arc': {
        this.flankAngle += dt * 1.5;
        var idealDist = this.charData.attackRange * 0.8;

        // Target orbit position
        var orbitX = this.target.x + Math.cos(this.flankAngle) * idealDist;
        var orbitY = this.target.y + Math.sin(this.flankAngle) * idealDist;

        // Move toward orbit position
        var toDx = orbitX - this.x;
        var toDy = orbitY - this.y;
        var toDist = Math.sqrt(toDx * toDx + toDy * toDy);
        if (!isFinite(toDx) || !isFinite(toDy) || !isFinite(toDist) || toDist < 1) {
          toDx = 0;
          toDy = 0;
          toDist = 1;
        }
        this.x += (toDx / toDist) * moveSpeed;
        this.y += (toDy / toDist) * moveSpeed;
        break;
      }

      // ── DASH: Normal movement + periodic high-speed slide ──
      case 'dash': {
        // Handle active short dash movement
        if (this.shortDashTimer > 0) {
          this.shortDashTimer -= dt;
          if (isFinite(this.shortDashVx) && isFinite(this.shortDashVy)) {
            this.x += this.shortDashVx * dt;
            this.y += this.shortDashVy * dt;
          }
          
          if (effectSystem && Math.random() < 0.4) {
            effectSystem.addTrail(this.x, this.y, this.charData.color + '60', 3);
          }
          break;
        }

        // Normal approach
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;

        // Trigger a smooth high-speed glide
        if (this.blinkCooldown <= 0 && dist > 70) {
          // Slide 90-120px towards target over 0.15s
          var dashDist = 90 + Math.random() * 30;
          this.shortDashTimer = 0.15;
          this.shortDashVx = (dx / dist) * (dashDist / 0.15);
          this.shortDashVy = (dy / dist) * (dashDist / 0.15);

          // Reset dash cooldown
          this.blinkCooldown = 2.0 + Math.random() * 1.5;
        }
        break;
      }

      // ── ZIGZAG: Alternating perpendicular movement ──
      case 'zigzag': {
        this.moveTimer += dt;
        if (this.moveTimer >= 0.4) {
          this.zigzagDir *= -1;
          this.moveTimer = 0;
        }

        // Forward direction
        var fx = dx / dist;
        var fy = dy / dist;

        // Perpendicular direction
        var px = -fy;
        var py = fx;

        this.x += (fx + px * this.zigzagDir * 0.7) * moveSpeed;
        this.y += (fy + py * this.zigzagDir * 0.7) * moveSpeed;
        break;
      }

      // ── FLANK: Move to target's back ──
      case 'flank': {
        // Position behind the enemy (opposite their facing angle)
        var behindX = this.target.x - Math.cos(this.target.angle) * 60;
        var behindY = this.target.y - Math.sin(this.target.angle) * 60;

        var fDx = behindX - this.x;
        var fDy = behindY - this.y;
        var fDist = Math.sqrt(fDx * fDx + fDy * fDy);

        if (!isFinite(fDx) || !isFinite(fDy) || !isFinite(fDist) || fDist < 1) {
          fDx = 0;
          fDy = 0;
          fDist = 1;
        }
        this.x += (fDx / fDist) * moveSpeed;
        this.y += (fDy / fDist) * moveSpeed;
        break;
      }

      // ── WOBBLE: Unpredictable wobbly path ──
      case 'wobble': {
        this.wobbleAngle += dt * 8;

        var wobbleX = Math.cos(this.wobbleAngle) * moveSpeed * 0.5;
        var wobbleY = Math.sin(this.wobbleAngle * 1.3) * moveSpeed * 0.5;

        this.x += (dx / dist) * moveSpeed * 0.7 + wobbleX;
        this.y += (dy / dist) * moveSpeed * 0.7 + wobbleY;
        break;
      }
    }
  }

  /**
   * Enter the reposition state, choosing a duration and strategy (retreat/circle).
   */
  startReposition(arenaWidth, arenaHeight, arenaX, arenaY) {
    this.setState('reposition');
    // Reposition duration is longer for full map movements (e.g. 2.0s to 3.5s)
    this.repositionDuration = 2.0 + Math.random() * 1.5;

    arenaX = arenaX || 20;
    arenaY = arenaY || 10;
    arenaWidth = arenaWidth || 800;
    arenaHeight = arenaHeight || 500;

    if (this.charData.weaponType === 'ranged') {
      this.repositionType = 'waypoint';

      // Pick the furthest waypoint from the enemy
      if (this.target && this.target.isAlive()) {
        const enemyX = this.target.x;
        const enemyY = this.target.y;

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

        this.repositionWaypointX = bestPoint.x;
        this.repositionWaypointY = bestPoint.y;
      } else {
        // Fallback: random corner
        this.repositionWaypointX = arenaX + (Math.random() < 0.5 ? 40 : arenaWidth - 40);
        this.repositionWaypointY = arenaY + (Math.random() < 0.5 ? 40 : arenaHeight - 40);
      }
    } else {
      // Melee units circle 70% of the time with a WIDE radius, retreat 30% of the time
      this.repositionType = Math.random() < 0.7 ? 'circle' : 'retreat';
      this.circleDir = Math.random() < 0.5 ? 1 : -1;
    }
  }

  /**
   * Move using a repositioning pattern (retreat, circle, or waypoint kiting).
   * @param {number} dt - Delta time
   * @param {number} arenaWidth - Arena width
   * @param {number} arenaHeight - Arena height
   * @param {EffectSystem} effectSystem - For particle trails
   */
  applyRepositionMovement(dt, arenaWidth, arenaHeight, effectSystem) {
    if (!this.target || !this.target.isAlive()) return;

    var baseSpeed = this.charData.speed * 60;
    var moveSpeed = baseSpeed * dt * (this.slowTimer > 0 ? 0.5 : 1.0);

    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }

    if (this.repositionType === 'waypoint') {
      // Move towards the designated waypoint (full-map kiting)
      var wpDx = this.repositionWaypointX - this.x;
      var wpDy = this.repositionWaypointY - this.y;
      var wpDist = Math.sqrt(wpDx * wpDx + wpDy * wpDy);

      if (!isFinite(wpDx) || !isFinite(wpDy) || !isFinite(wpDist) || wpDist < 1) {
        wpDx = 0;
        wpDy = 0;
        wpDist = 1;
      }

      if (wpDist > 10) {
        this.x += (wpDx / wpDist) * moveSpeed;
        this.y += (wpDy / wpDist) * moveSpeed;
      } else {
        // Arrived at waypoint, default to circling target
        this.repositionType = 'circle';
        this.circleDir = Math.random() < 0.5 ? 1 : -1;
      }

      // Speed trail effect while running across the map
      if (effectSystem && Math.random() < 0.25) {
        effectSystem.addTrail(this.x, this.y, this.charData.color + '30', 2.5);
      }
    } else if (this.repositionType === 'retreat') {
      // Move directly away from target
      this.x -= (dx / dist) * moveSpeed;
      this.y -= (dy / dist) * moveSpeed;

      // Visual representation (dust particles on backing off)
      if (Math.random() < 0.1 && effectSystem) {
        effectSystem.addTrail(this.x, this.y, 'rgba(255,255,255,0.15)', 2);
      }
    } else if (this.repositionType === 'circle') {
      // Tangent direction for circling
      var tx = -dy / dist;
      var ty = dx / dist;

      // WIDE circling: radius is 220px - 300px depending on their base range
      var idealDist = Math.max(220, this.charData.attackRange * 1.5);
      var radialPush = 0;
      if (dist < idealDist) {
        radialPush = -0.3; // Push outward slightly
      } else if (dist > idealDist + 20) {
        radialPush = 0.3; // Pull inward slightly
      }

      this.x += (tx * this.circleDir + (dx / dist) * radialPush) * moveSpeed;
      this.y += (ty * this.circleDir + (dy / dist) * radialPush) * moveSpeed;

      // Visual trail
      if (Math.random() < 0.08 && effectSystem) {
        effectSystem.addTrail(this.x, this.y, this.charData.color + '40', 3);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AI DECISION MAKING
  // ═══════════════════════════════════════════════════════════════

  /**
   * AI behavior modifications based on tendency.
   * Called during 'chase' state to modify positioning.
   * @param {number} dt - Delta time
   * @param {number} arenaWidth - Arena width
   * @param {number} arenaHeight - Arena height
   */
  updateAI(dt, arenaWidth, arenaHeight) {
    if (!this.target || !this.target.isAlive()) return;

    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }

    switch (this.charData.aiTendency) {
      case 'aggressive':
        // No special behavior — charge in always
        break;

      case 'cautious':
        // Retreat when low HP and enemy is close
        if (this.hp < this.maxHp * 0.3 && dist < this.charData.attackRange * 1.2) {
          // Move away from target slightly
          if (dist > 1) {
            this.x -= (dx / dist) * this.charData.speed * 30 * dt;
            this.y -= (dy / dist) * this.charData.speed * 30 * dt;
          }
        }
        break;

      case 'balanced':
        // Cautious when HP is low
        if (this.hp <= this.maxHp * 0.5) {
          if (dist < this.charData.attackRange * 0.8) {
            // Slight retreat
            if (dist > 1) {
              this.x -= (dx / dist) * this.charData.speed * 15 * dt;
              this.y -= (dy / dist) * this.charData.speed * 15 * dt;
            }
          }
        }
        break;
    }
  }

  /**
   * Whether the fighter should immediately spend its ready skill.
   * @returns {boolean}
   */
  canCastSkillNow() {
    if (!this.skillReady || !this.charData.skill) return false;
    if (!this.target || !this.target.isAlive()) return false;
    if (this.state === 'skill' || this.state === 'dashing_skill' || this.state === 'dead') return false;

    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return isFinite(dist) && dist <= this.charData.skill.range;
  }

  /**
   * Shared beginning-of-skill behavior. Keep cross-skill visuals,
   * audio, and cooldowns here so individual payloads cannot skip them.
   * @param {EffectSystem} effectSystem
   * @param {object} skill
   * @param {string=} displayName
   */
  startSkillCast(effectSystem, skill, displayName) {
    if (!skill) return;

    this.skillCooldown = skill.cooldown || 0;
    this.skillReady = false;

    if (window.soundSystem) window.soundSystem.playSkillSound();
    this.showSkillName(effectSystem, displayName || skill.name);
  }

  /**
   * Show a team-colored skill name above this fighter.
   * @param {EffectSystem} effectSystem
   * @param {string} skillName
   */
  showSkillName(effectSystem, skillName) {
    if (!effectSystem || !skillName) return;
    effectSystem.addSkillName(this.x, this.y - this.charData.size - 34, skillName, this.team);
  }

  /**
   * Whether this fighter declares a passive by id in character data.
   * @param {string} passiveId
   * @returns {boolean}
   */
  hasPassive(passiveId) {
    return !!(this.charData.passives && this.charData.passives.some(passive => passive.id === passiveId));
  }

  /**
   * Passive-specific cooldowns and timers.
   * @param {number} dt
   */
  updatePassiveTimers(dt) {
    if (this.bloodShieldCooldown > 0) this.bloodShieldCooldown = Math.max(0, this.bloodShieldCooldown - dt);
    if (this.whistleCooldown > 0) this.whistleCooldown = Math.max(0, this.whistleCooldown - dt);
  }

  /**
   * Tick poison damage without interrupting movement every frame.
   * @param {number} dt
   * @param {EffectSystem} effectSystem
   */
  updatePoison(dt, effectSystem) {
    if (this.poisonTimer <= 0 || this.poisonDps <= 0 || !this.alive) return;

    this.poisonTimer = Math.max(0, this.poisonTimer - dt);
    this.poisonTickTimer -= dt;
    if (this.poisonTickTimer <= 0) {
      this.poisonTickTimer = 0.5;
      this.takeDamage(this.poisonDps * 0.5, this.x, this.y, effectSystem);
      effectSystem.addDamageNumber(this.x, this.y - this.charData.size - 12, '中毒', false, '#76FF03');
      effectSystem.addSkillEffect('poison_cloud', this.x, this.y, '#66BB6A', 28);
    }

    if (this.poisonTimer <= 0) {
      this.poisonDps = 0;
      this.poisonTickTimer = 0;
    }
  }

  /**
   * Poisoner passive: leaves short-lived poison clouds while moving.
   * @param {number} dt
   * @param {EffectSystem} effectSystem
   */
  updatePoisonTrail(dt, effectSystem) {
    if (!this.hasPassive('poison_trail') || !this.alive || this.state === 'dead') return;
    if (!window.combatManager || window.combatManager.state !== 'fighting') return;

    this.poisonTrailTimer = Math.max(0, this.poisonTrailTimer - dt);
    if (this.poisonTrailTimer > 0) return;

    this.poisonTrailTimer = 0.55;
    window.combatManager.addPoisonZone(this.x, this.y, this.team, 64, 3.5, 3.0, 0.8);
    effectSystem.addSkillEffect('poison_cloud', this.x, this.y, '#66BB6A', 58);
  }

  /**
   * Automatic passives that can trigger without taking or dealing damage.
   * @param {Fighter[]} opposingTeam
   * @param {EffectSystem} effectSystem
   */
  updateAutomaticPassives(opposingTeam, effectSystem) {
    if (this.hasPassive('steam_whistle')) {
      this.trySteamWhistle(opposingTeam, effectSystem);
    }
  }

  /**
   * Train Conductor passive: knock back and slow nearby enemies.
   * @param {Fighter[]} opposingTeam
   * @param {EffectSystem} effectSystem
   */
  trySteamWhistle(opposingTeam, effectSystem) {
    if (!opposingTeam || this.stunTimer > 0 || this.whistleCooldown > 0) return;

    var triggered = false;
    opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;

      if (!isFinite(this.x)) this.x = 400;
      if (!isFinite(this.y)) this.y = 300;
      if (!isFinite(enemy.x)) enemy.x = 400;
      if (!isFinite(enemy.y)) enemy.y = 300;

      var dx = enemy.x - this.x;
      var dy = enemy.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= 100) return;

      triggered = true;
      var kbAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
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

    this.whistleCooldown = 6.0;
    effectSystem.addSkillEffect('aoe_melee', this.x, this.y, '#FFD700', 100);
    effectSystem.screenShake(6);
    this.showSkillName(effectSystem, '蒸汽鸣笛');
    effectSystem.addDamageNumber(this.x, this.y - this.charData.size, '鸣笛 TOOT!', false, '#FFD700');
  }

  // ═══════════════════════════════════════════════════════════════
  // DAMAGE & HEALING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Apply damage to this fighter.
   * @param {number} damage - Damage amount
   * @param {number} attackerX - Attacker X position (for knockback)
   * @param {number} attackerY - Attacker Y position (for knockback)
   * @param {EffectSystem} effectSystem - For visual feedback
   */
  takeDamage(damage, attackerX, attackerY, effectSystem) {
    if (!this.alive) return;

    // Ensure this fighter's coordinates and health are valid
    if (typeof this.x !== 'number' || !isFinite(this.x)) this.x = 400;
    if (typeof this.y !== 'number' || !isFinite(this.y)) this.y = 300;
    if (typeof this.hp !== 'number' || !isFinite(this.hp)) this.hp = this.maxHp;

    // Ensure all incoming inputs are valid numbers to prevent NaN propagation
    if (typeof damage !== 'number' || !isFinite(damage)) {
      damage = 0;
    }
    if (typeof attackerX !== 'number' || !isFinite(attackerX)) {
      attackerX = this.x;
    }
    if (typeof attackerY !== 'number' || !isFinite(attackerY)) {
      attackerY = this.y;
    }

    if (this.tryDamageAvoidancePassives(effectSystem)) return;
    damage = this.applyDamageReductionPassives(damage, effectSystem);

    if (damage <= 0) return;

    this.hp -= damage;
    this.hp = Math.max(0, this.hp);

    // Final safety: if hp is still somehow non-finite, reset it
    if (!isFinite(this.hp)) {
      console.warn('[NaN TRACE] hp became NaN after takeDamage! damage=', damage, 'charId=', this.charData.id, 'attackerX=', attackerX, 'attackerY=', attackerY);
      this.hp = 0;
    }

    // Visual feedback
    this.hitFlashTimer = 0.15;
    effectSystem.addHitEffect(this.x, this.y, this.charData.color);
    const damageColor = this.team === 'left' ? '#FF5252' : '#29B6F6';
    effectSystem.addDamageNumber(this.x, this.y - this.charData.size, damage, false, damageColor);
    
    // Play hit sound
    if (window.soundSystem) window.soundSystem.playHitSound();

    // Knockback (5-8px away from attacker)
    var kbAngle = Math.atan2(this.y - attackerY, this.x - attackerX);
    if (isNaN(kbAngle) || !isFinite(kbAngle)) kbAngle = 0;
    var kbDist = 5 + Math.random() * 3;
    
    var nextX = this.x + Math.cos(kbAngle) * kbDist;
    var nextY = this.y + Math.sin(kbAngle) * kbDist;
    if (isFinite(nextX)) this.x = nextX;
    if (isFinite(nextY)) this.y = nextY;

    if (!isFinite(this.x)) this.x = attackerX;
    if (!isFinite(this.y)) this.y = attackerY;

    // State transition
    if (this.hp <= 0) {
      if (window.soundSystem) window.soundSystem.playDeathSound();
      this.setState('dead');
    } else if (this.state !== 'attack' && this.state !== 'skill' && this.state !== 'reposition' && this.state !== 'dashing_skill' && this.state !== 'dead') {
      this.setState('hit');
    }
  }

  /**
   * Heal this fighter.
   * @param {number} amount - Heal amount
   * @param {EffectSystem} effectSystem - For visual feedback
   */
  heal(amount, effectSystem) {
    if (!this.alive) return;
    if (typeof amount !== 'number' || !isFinite(amount)) {
      amount = 0;
    }
    this.hp = Math.min(this.maxHp, this.hp + amount);
    // Final safety
    if (!isFinite(this.hp)) this.hp = this.maxHp;
    effectSystem.addHealEffect(this.x, this.y);
  }

  /**
   * Passive effects that fully avoid incoming damage.
   * @param {EffectSystem} effectSystem
   * @returns {boolean} True when damage should be cancelled
   */
  tryDamageAvoidancePassives(effectSystem) {
    if (!this.hasPassive('saitama_dodge')) return false;
    if (Math.random() >= 0.35) return false;

    effectSystem.addDamageNumber(this.x, this.y - this.charData.size, '闪避!', false, '#FFFFFF');
    effectSystem.addHitEffect(this.x, this.y, '#FFFFFF');
    return true;
  }

  /**
   * Passive shields and damage reducers.
   * @param {number} damage
   * @param {EffectSystem} effectSystem
   * @returns {number} Remaining damage
   */
  applyDamageReductionPassives(damage, effectSystem) {
    if (!this.hasPassive('blood_shield')) return damage;

    if (this.bloodShield > 0) {
      if (damage >= this.bloodShield) {
        damage -= this.bloodShield;
        this.bloodShield = 0;
        effectSystem.addDamageNumber(this.x, this.y - this.charData.size, '护盾破碎!', false, '#FF1744');
      } else {
        this.bloodShield -= damage;
        effectSystem.addDamageNumber(this.x, this.y - this.charData.size, `吸收 ${Math.floor(damage)}`, false, '#FF5252');
        damage = 0;
      }
    }

    if (damage > 0 && this.hp - damage < 45 && this.bloodShieldCooldown <= 0) {
      this.bloodShield = 35;
      this.bloodShieldCooldown = 15.0;
      effectSystem.addHealEffect(this.x, this.y);
      effectSystem.addDamageNumber(this.x, this.y - this.charData.size, '+血红护盾!', false, '#FF1744');
      effectSystem.addSkillEffect('clone', this.x, this.y, '#FF1744', 40);
    }

    return damage;
  }

  /**
   * Heal from damage dealt when the character has lifesteal.
   * @param {number} damage
   * @param {EffectSystem} effectSystem
   * @param {number=} overrideRatio
   */
  healFromDamage(damage, effectSystem, overrideRatio) {
    var ratio = typeof overrideRatio === 'number' ? overrideRatio : (this.charData.lifesteal || 0);
    if (ratio <= 0 || damage <= 0) return;
    this.heal(damage * ratio, effectSystem);
  }

  /**
   * Execute the hit/payload of a dashing skill after completing the smooth dash movement.
   * @param {EffectSystem} effectSystem
   * @param {number} arenaWidth
   * @param {number} arenaHeight
   * @param {number} arenaX
   * @param {number} arenaY
   */
  executeDashingSkillHit(effectSystem, arenaWidth, arenaHeight, arenaX, arenaY) {
    if (!this.target || !this.target.isAlive()) {
      this.setState('chase');
      return;
    }

    var skill = this.charData.skill;
    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }

    if (this.dashSkillType === 'dash') {
      // Vampire dash damage & heal
      if (dist <= 45) {
        this.target.takeDamage(skill.damage, this.x, this.y, effectSystem);
        this.healFromDamage(skill.damage, effectSystem);
      }
      effectSystem.screenShake(5);
    } else if (this.dashSkillType === 'backstab') {
      // Assassin backstab critical damage
      if (dist <= skill.range + 20) {
        this.target.takeDamage(skill.damage, this.x, this.y, effectSystem);
        effectSystem.addDamageNumber(this.target.x, this.target.y - 40, skill.damage, true, '#FFD700');
        effectSystem.addSkillEffect('backstab', this.target.x, this.target.y, this.charData.color, 20);
        effectSystem.screenShake(7);
      }
    } else if (this.dashSkillType === 'serious_punch') {
      // One Punch Man serious punch
      effectSystem.addSkillEffect('meteor', this.x, this.y, '#FFD700', 90);
      effectSystem.addSkillEffect('aoe_melee', this.x, this.y, '#FF1744', 130);
      effectSystem.screenShake(18);

      const opposingTeam = (this.team === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
      if (opposingTeam) {
        opposingTeam.forEach(enemy => {
          if (enemy.isAlive()) {
            const ex = enemy.x - this.x;
            const ey = enemy.y - this.y;
            const edist = Math.sqrt(ex * ex + ey * ey);
            if (edist <= 130) {
              enemy.takeDamage(skill.damage, this.x, this.y, effectSystem);
            }
          }
        });
      }
    }

    // Go to cooldown or reposition
    if (Math.random() < 0.4) {
      this.startReposition(arenaWidth, arenaHeight, arenaX, arenaY);
    } else {
      this.setState('cooldown');
      this.repositionType = (this.charData.weaponType === 'ranged') ? 'retreat' : (Math.random() < 0.65 ? 'circle' : 'retreat');
      this.circleDir = Math.random() < 0.5 ? 1 : -1;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SKILL EXECUTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Execute the character's special skill.
   * @param {WeaponSystem} weaponSystem
   * @param {EffectSystem} effectSystem
   */
  executeSkill(weaponSystem, effectSystem) {
    if (!this.target || !this.target.isAlive()) return;

    var skill = this.charData.skill;
    this.startSkillCast(effectSystem, skill);

    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }

    switch (skill.type) {

      // ── WHIRLWIND (Swordsman): AOE damage around self ──
      case 'aoe_melee': {
        effectSystem.addSkillEffect('aoe_melee', this.x, this.y, this.charData.color, skill.range);
        effectSystem.screenShake(6);

        const opposingTeam = (this.team === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (enemy.isAlive()) {
              const ex = enemy.x - this.x;
              const ey = enemy.y - this.y;
              const edist = Math.sqrt(ex * ex + ey * ey);
              if (edist <= skill.range) {
                enemy.takeDamage(skill.damage, this.x, this.y, effectSystem);
                this.healFromDamage(skill.damage, effectSystem);
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
          var speed = this.charData.projectileSpeed || 400;
          var vx = Math.cos(shotAngle) * speed;
          var vy = Math.sin(shotAngle) * speed;

          var proj = new Projectile(
            this.x, this.y, vx, vy,
            skill.damage, this.team,
            this.charData.color, 5, 'arrow'
          );
          proj.attacker = this;
          weaponSystem.projectiles.push(proj);
        }

        effectSystem.addSkillEffect('multi_shot', this.x, this.y, this.charData.color, 30);
        break;
      }

      // ── METEOR (Mage): AOE damage at target location ──
      case 'meteor': {
        const area = skill.area || 80;
        effectSystem.addSkillEffect('meteor', this.target.x, this.target.y, this.charData.color, area);
        effectSystem.screenShake(10);

        const targetX = this.target.x;
        const targetY = this.target.y;

        const opposingTeam = (this.team === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (enemy.isAlive()) {
              const ex = enemy.x - targetX;
              const ey = enemy.y - targetY;
              const edist = Math.sqrt(ex * ex + ey * ey);
              if (edist <= area) {
                enemy.takeDamage(skill.damage, this.x, this.y, effectSystem);
              }
            }
          });
        }
        break;
      }

      // ── BLAST BOMB (Bomber): Moderate area damage at target location ──
      case 'bomb_toss': {
        const area = skill.area || 90;
        const targetX = this.target.x;
        const targetY = this.target.y;

        effectSystem.addSkillEffect('bomb', targetX, targetY, this.charData.color, area);
        effectSystem.screenShake(7);

        if (window.combatManager) {
          window.combatManager.applyAreaDamage(targetX, targetY, this.team, skill.damage, area, this);
        }
        break;
      }

      // ── TOXIC FLASK (Poisoner): Light area damage plus slow ──
      case 'poison_cloud': {
        const area = skill.area || 100;
        const targetX = this.target.x;
        const targetY = this.target.y;

        effectSystem.addSkillEffect('poison_cloud', targetX, targetY, this.charData.color, area);
        effectSystem.screenShake(3);
        if (window.combatManager) {
          window.combatManager.addPoisonZone(targetX, targetY, this.team, area, skill.duration || 3.0, skill.poisonDps || 4.0, 1.2);
        }

        const opposingTeam = (this.team === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (enemy.isAlive()) {
              const ex = enemy.x - targetX;
              const ey = enemy.y - targetY;
              const edist = Math.sqrt(ex * ex + ey * ey);
              if (edist <= area) {
                enemy.takeDamage(skill.damage, this.x, this.y, effectSystem);
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
        effectSystem.addSkillEffect('multi_shot', this.x, this.y, this.charData.color, 35);

        const opposingTeam = (this.team === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (!enemy.isAlive()) return;
            const ex = enemy.x - this.x;
            const ey = enemy.y - this.y;
            const forward = ex * dirX + ey * dirY;
            const side = Math.abs(ex * dirY - ey * dirX);
            if (forward >= 0 && forward <= range && side <= width) {
              enemy.takeDamage(skill.damage, this.x, this.y, effectSystem);
              effectSystem.addHitEffect(enemy.x, enemy.y, this.charData.color);
            }
          });
        }
        break;
      }

      // ── FROST NOVA (Frost Apprentice): Large area slow ──
      case 'frost_nova': {
        const area = skill.area || 210;
        effectSystem.addSkillEffect('slow', this.x, this.y, '#4FC3F7', area);
        effectSystem.addSkillEffect('aoe_melee', this.x, this.y, '#B3E5FC', area);
        effectSystem.screenShake(4);

        const opposingTeam = (this.team === 'left') ? window.combatManager.fightersRight : window.combatManager.fightersLeft;
        if (opposingTeam) {
          opposingTeam.forEach(enemy => {
            if (!enemy.isAlive()) return;
            const ex = enemy.x - this.x;
            const ey = enemy.y - this.y;
            const edist = Math.sqrt(ex * ex + ey * ey);
            if (edist <= area) {
              enemy.takeDamage(skill.damage, this.x, this.y, effectSystem);
              enemy.applySlow(skill.duration || 3.0);
              effectSystem.addSkillEffect('slow', enemy.x, enemy.y, '#4FC3F7', 36);
            }
          });
        }
        break;
      }

      // ── SHADOW DASH (Vampire): Smooth high speed slide ──
      case 'dash': {
        // Calculate destination (stop 30px away from target)
        var dashDestX = this.x;
        var dashDestY = this.y;
        if (dist > 30) {
          dashDestX = this.target.x - (dx / dist) * 30;
          dashDestY = this.target.y - (dy / dist) * 30;
        }

        // Set up dashing_skill state
        this.setState('dashing_skill');
        this.dashStartX = this.x;
        this.dashStartY = this.y;
        this.dashTargetX = dashDestX;
        this.dashTargetY = dashDestY;
        this.dashDuration = 0.12; // 0.12 seconds dash duration (very fast, but smooth!)
        this.dashTimer = 0;
        this.dashSkillType = 'dash';

        // Play skill starting effect
        effectSystem.addSkillEffect('dash', this.x, this.y, this.charData.color, 20);
        break;
      }

      // ── SHADOW CLONE (Ninja): Create clones that attack ──
      case 'clone': {
        this.clones = [
          { x: this.x + 30, y: this.y - 20 },
          { x: this.x - 30, y: this.y + 20 }
        ];
        this.cloneTimer = 3.0; // Clones last 3 seconds

        effectSystem.addSkillEffect('clone', this.x, this.y, this.charData.color, 30);

        // Each clone fires a shuriken at the target
        for (var i = 0; i < this.clones.length; i++) {
          weaponSystem.createRangedAttack(
            this.clones[i].x, this.clones[i].y,
            this.target.x, this.target.y,
            skill.damage, this.team,
            'shuriken', this.charData.color,
            this
          );
        }
        break;
      }

      // ── SHIELD BASH (Knight): Stun + damage ──
      case 'stun': {
        if (this.target.isAlive() && dist <= skill.range) {
          this.target.takeDamage(skill.damage, this.x, this.y, effectSystem);
          this.target.stunTimer = skill.duration; // Apply stun!
          effectSystem.addSkillEffect('stun', this.target.x, this.target.y, '#FFD700', 30);
          effectSystem.screenShake(6);
        }
        break;
      }

      // ── BACKSTAB (Assassin): Smooth high speed curve behind target ──
      case 'backstab': {
        // Calculate destination behind the target (opposite their facing angle)
        var behindX = this.target.x - Math.cos(this.target.angle) * 30;
        var behindY = this.target.y - Math.sin(this.target.angle) * 30;

        // Set up dashing_skill state
        this.setState('dashing_skill');
        this.dashStartX = this.x;
        this.dashStartY = this.y;
        this.dashTargetX = behindX;
        this.dashTargetY = behindY;
        this.dashDuration = 0.15; // 0.15 seconds dash duration
        this.dashTimer = 0;
        this.dashSkillType = 'backstab';

        // Play starting skill effect
        effectSystem.addSkillEffect('backstab', this.x, this.y, this.charData.color, 20);
        break;
      }

      // ── BANANA PEEL (Minion): Slow debuff + ranged damage ──
      case 'slow': {
        weaponSystem.createRangedAttack(
          this.x, this.y,
          this.target.x, this.target.y,
          skill.damage, this.team,
          'banana', this.charData.color,
          this
        );

        if (this.target.isAlive() && dist <= skill.range) {
          this.target.slowTimer = skill.duration; // Apply slow!
          effectSystem.addSkillEffect('slow', this.target.x, this.target.y, '#42A5F5', 40);
        }
        break;
      }

      // ── SERIOUS PUNCH (Saitama): Smooth super fast lunge ──
      case 'serious_punch': {
        // Calculate destination (stop 20px away from target)
        var dashDestX = this.x;
        var dashDestY = this.y;
        if (dist > 20) {
          dashDestX = this.target.x - (dx / dist) * 20;
          dashDestY = this.target.y - (dy / dist) * 20;
        }

        this.setState('dashing_skill');
        this.dashStartX = this.x;
        this.dashStartY = this.y;
        this.dashTargetX = dashDestX;
        this.dashTargetY = dashDestY;
        this.dashDuration = 0.08; // Very fast lunge!
        this.dashTimer = 0;
        this.dashSkillType = 'serious_punch';

        effectSystem.addSkillEffect('dash', this.x, this.y, this.charData.color, 30);
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
            this.x, this.y, vx, vy,
            skill.damage, this.team,
            '#FF1744', 8, 'bat'
          );
          batProj.attacker = this;
          weaponSystem.projectiles.push(batProj);
        }
        effectSystem.addSkillEffect('clone', this.x, this.y, '#FF1744', 40);
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
          this.x, this.y,
          this.target.x, this.target.y,
          skill.damage, this.team,
          'train', this.charData.color,
          this
        );

        effectSystem.screenShake(5);
        effectSystem.addSkillEffect('multi_shot', this.x, this.y, this.charData.color, 40);
        break;
      }

      // ── SUMMON LEGION (Superhero Summoner): Summons 3 Stone Golems ──
      case 'summon_legion': {
        const teamArr = this.team === 'left' ? window.combatManager.fightersLeft : window.combatManager.fightersRight;
        if (teamArr) {
          for (var i = 0; i < 3; i++) {
            var spawnX = this.x + (Math.random() - 0.5) * 80;
            var spawnY = this.y + (Math.random() - 0.5) * 80;
            var minion = new Fighter('summoned_golem', spawnX, spawnY, this.team);
            teamArr.push(minion);
            effectSystem.addSkillEffect('clone', spawnX, spawnY, '#E040FB', 40);
          }
          if (window.soundSystem) window.soundSystem.playSummonSound();
        }
        effectSystem.screenShake(8);
        effectSystem.addSkillEffect('meteor', this.x, this.y, '#9C27B0', 60);
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Render the fighter on the canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} time - Elapsed time in seconds (for animations)
   */
  render(ctx, time) {
    if (this.state === 'dead' && !this.alive) return;

    ctx.save();

    // ── Foot ground indicator ring (for team color) ──
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = this.team === 'left' ? '#00E5FF' : '#FF3D00';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.charData.size * 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = this.team === 'left' ? '#00E5FF' : '#FF3D00';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]); // Dashed ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.charData.size * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // ── Body circle with glow ──
    ctx.shadowColor = this.charData.glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.charData.size, 0, Math.PI * 2);
    ctx.fillStyle = this.charData.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Body border
    ctx.strokeStyle = this.charData.secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render Blood Shield Bubble
    if (this.bloodShield > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.85)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 8;
      ctx.setLineDash([4, 2]); // dotted shield line
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.charData.size * 1.25 + Math.sin(time * 10) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Hit flash (white overlay) ──
    if (this.hitFlashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = this.hitFlashTimer / 0.15;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.charData.size, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();
    }

    // ── Slow effect (blue tint overlay) ──
    if (this.slowTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.charData.size + 3, 0, Math.PI * 2);
      ctx.fillStyle = '#42A5F5';
      ctx.fill();
      ctx.restore();
    }

    // ── Poison effect (green bubbling ring) ──
    if (this.poisonTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(time * 8) * 0.1;
      ctx.strokeStyle = '#76FF03';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.charData.size + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#76FF03';
      for (var p = 0; p < 3; p++) {
        var pa = time * 2 + p * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.arc(this.x + Math.cos(pa) * (this.charData.size + 8), this.y + Math.sin(pa) * (this.charData.size + 8), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ── Stun effect (spinning stars above head) ──
    if (this.stunTimer > 0) {
      ctx.save();
      var starCount = 3;
      for (var i = 0; i < starCount; i++) {
        var starAngle = time * 4 + (i / starCount) * Math.PI * 2;
        var starX = this.x + Math.cos(starAngle) * 15;
        var starY = this.y - this.charData.size - 12 + Math.sin(starAngle) * 5;

        // Draw a small star
        ctx.beginPath();
        ctx.save();
        ctx.translate(starX, starY);
        for (var j = 0; j < 5; j++) {
          var a = (j / 5) * Math.PI * 2 - Math.PI / 2;
          var r = (j % 2 === 0) ? 5 : 2;
          if (j === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // ── Character decorations ──
    this.charData.drawDecorations(ctx, this.x, this.y, this.angle, this.charData.size, time);

    // ── HP text centered on body ──
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 16px 'Outfit', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(Math.ceil(this.hp), this.x, this.y);
    ctx.restore();

    // ── Charge glow ring (during charge state) ──
    if (this.state === 'charge') {
      var chargeProgress = this.stateTimer / this.charData.chargeTime;
      var ringRadius = this.charData.size + 5 + chargeProgress * 10;

      ctx.save();
      ctx.globalAlpha = 0.3 + chargeProgress * 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = this.charData.color;
      ctx.lineWidth = 2 + chargeProgress * 2;
      ctx.stroke();
      ctx.restore();
    }

    // ── Clone rendering (ninja) ──
    if (this.clones.length > 0 && this.cloneTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.4;

      for (var i = 0; i < this.clones.length; i++) {
        var clone = this.clones[i];

        // Clone body
        ctx.beginPath();
        ctx.arc(clone.x, clone.y, this.charData.size, 0, Math.PI * 2);
        ctx.fillStyle = this.charData.color;
        ctx.fill();
        ctx.strokeStyle = this.charData.secondaryColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Clone decorations
        this.charData.drawDecorations(ctx, clone.x, clone.y, this.angle, this.charData.size, time);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get collision bounds for this fighter.
   * @returns {{x: number, y: number, radius: number}}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.charData.size
    };
  }

  /**
   * Check if this fighter is still alive.
   * @returns {boolean}
   */
  isAlive() {
    return this.alive;
  }
}
