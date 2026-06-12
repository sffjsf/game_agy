import * as EffectLib from './effects_lib/index.js';
import * as Passives from './skills/Passives.js';
import { FighterAI } from './ai/FighterAI.js';
import { executeSkillStrategy } from './skills/SkillRegistry.js';
import { characterData } from './characters/index.js';
import { soundSystem } from './audio.js';

/**
 * fighter.js - Fighter Class for 2D Auto-Battle Game
 * 
 * Handles individual unit AI, states (chase, attack, skill), rendering,
 * and massive switch statements for different character skills.
 */
export class Fighter {
  /**
   * Create a new fighter from character data.
   * @param {string} characterId - Key in the characterData object
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   * @param {string} team - 'left' or 'right'
   */
  constructor(characterId, x, y, team) {
    // Load character data from the global characterData object
    this.charData = Object.assign({}, characterData[characterId]);
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
    this.burnTimer = 0;
    this.burnDps = 0;
    this.burnTickTimer = 0;

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
    this.rebirthUsed = false;

    // Reference to enemy target (set externally)
    this.target = null;
    this.ai = new FighterAI(this);
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
  // Extracted to FighterAI: findClosestTarget


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

  /**
   * Apply burn damage over time.
   * @param {number} duration - Burn duration in seconds
   * @param {number} dps - Damage per second
   */
  applyBurn(duration, dps) {
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnDps = Math.max(this.burnDps || 0, dps || 0);
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
    this.ai.findClosestTarget(opposingTeam);

    // ── Update all timers ──
    this.stateTimer += dt;
    var attackTimerRate = (this.slowTimer > 0) ? 0.6 : 1.0;
    this.attackTimer = Math.max(0, this.attackTimer - dt * attackTimerRate);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    this.stunTimer = Math.max(0, this.stunTimer - dt);
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    this.updatePoison(dt, effectSystem);
    this.updateBurn(dt, effectSystem);
    this.updatePoisonTrail(dt, effectSystem);
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.blinkCooldown = Math.max(0, this.blinkCooldown - dt);
    this.cloneTimer = Math.max(0, this.cloneTimer - dt);
    this.heavenlyEyeCooldown = Math.max(0, (this.heavenlyEyeCooldown || 0) - dt);
    this.skillReady = (this.skillCooldown <= 0) && (this.poisonTimer <= 0);

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
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        // Prevent frantic spinning due to collision jitter when overlapping
        if (dx * dx + dy * dy > 10.0) {
          this.angle = Math.atan2(dy, dx);
        }
      }
    }
    if (typeof this.angle !== 'number' || !isFinite(this.angle)) {
      this.angle = this.team === 'left' ? 0 : Math.PI;
    }

    // Skills have absolute priority: cast immediately once ready and in range.
    if (this.canCastSkillNow()) {
      this.setState('skill');
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

        // Check skill first (every frame while chasing, if ready and target in range)
        if (this.skillReady && dist <= this.charData.skill.range) {
          var skillChance = this.getSkillChance();
          if (Math.random() < skillChance) {
            this.setState('skill');
            break;
          }
        }

        if (dist <= this.charData.attackRange && this.attackTimer <= 0) {
          // Hold normal attack if skill is ready but out of range, so we can walk closer!
          var holdAttackForSkill = this.skillReady && this.charData.skill && dist > this.charData.skill.range;
          
          if (!holdAttackForSkill) {
            this.setState('charge');
            break;
          }
        }

        // If melee unit is close but attack is on cooldown, perform repositioning movement (circle/retreat)
        if (this.charData.weaponType === 'melee' && dist <= this.charData.attackRange * 1.5 && this.attackTimer > 0) {
          if (this.repositionType === 'waypoint') {
            this.repositionType = Math.random() < 0.65 ? 'circle' : 'retreat';
          }
          this.ai.applyRepositionMovement(dt, arenaWidth, arenaHeight, effectSystem);
        } else {
          // Apply standard movement pattern
          this.ai.applyMovement(dt, arenaWidth, arenaHeight, effectSystem);
        }

        // Apply AI behavior modifications
        this.updateAI(dt, arenaWidth, arenaHeight);
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
          this.ai.applyMovement(dt * 0.8, arenaWidth, arenaHeight, effectSystem);
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
        this.ai.applyRepositionMovement(dt, arenaWidth, arenaHeight, effectSystem);
        if (this.stateTimer >= this.charData.attackSpeed * 0.3) {
          // 85% chance to perform an extended tactical reposition, otherwise chase
          if (Math.random() < 0.85) {
            this.ai.startReposition(arenaWidth, arenaHeight, arenaX, arenaY);
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
          this.ai.startReposition(arenaWidth, arenaHeight, arenaX, arenaY);
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

        this.ai.applyRepositionMovement(dt, arenaWidth, arenaHeight, effectSystem);

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
    if (!isFinite(this.burnTimer)) this.burnTimer = 0;
    if (!isFinite(this.burnDps)) this.burnDps = 0;
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
      if (this.hasPassive('fire_cone_basic')) {
        this.executeFireConeAttack(effectSystem);
        if (soundSystem) soundSystem.playSwingSound();
        return;
      }

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
      if (soundSystem) soundSystem.playSwingSound();
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
        if (soundSystem) soundSystem.playShootSound();
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
    return Passives.applyMeleeHitPassives(this, damage, primaryTarget, effectSystem);
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
    return Passives.applyPiercingLineDamage(this, damage, range, width, primaryTarget, effectSystem);
  }

  /**
   * Super Summoner passive: basic attacks summon a golem instead of firing.
   * @param {EffectSystem} effectSystem
   */
  performSummonerBasicAttack(effectSystem) {
    return Passives.performSummonerBasicAttack(this, effectSystem);
  }

  /**
   * Vulcan basic attack: cone fire that burns all enemies in front.
   * @param {EffectSystem} effectSystem
   */
  executeFireConeAttack(effectSystem) {
    return Passives.executeFireConeAttack(this, effectSystem);
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
  // Extracted to FighterAI: applyMovement


  /**
   * Enter the reposition state, choosing a duration and strategy (retreat/circle).
   */
  // Extracted to FighterAI: startReposition


  /**
   * Move using a repositioning pattern (retreat, circle, or waypoint kiting).
   * @param {number} dt - Delta time
   * @param {number} arenaWidth - Arena width
   * @param {number} arenaHeight - Arena height
   * @param {EffectSystem} effectSystem - For particle trails
   */
  // Extracted to FighterAI: applyRepositionMovement


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

    if (soundSystem) soundSystem.playSkillSound();
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
    if (this.poisonTimer <= 0 || !this.alive) return;

    this.poisonTimer = Math.max(0, this.poisonTimer - dt);
    this.poisonTickTimer -= dt;
    if (this.poisonTickTimer <= 0) {
      this.poisonTickTimer = 0.5;
      effectSystem.addDamageNumber(this.x, this.y - this.charData.size - 12, '中毒!', false, '#9C27B0');
      EffectLib.addPoisonCloudEffect(effectSystem, this.x, this.y, '#9C27B0', 28);
    }

    if (this.poisonTimer <= 0) {
      this.poisonTickTimer = 0;
    }
  }

  /**
   * Tick burn damage over time.
   * @param {number} dt
   * @param {EffectSystem} effectSystem
   */
  updateBurn(dt, effectSystem) {
    if (this.burnTimer <= 0 || this.burnDps <= 0 || !this.alive) return;

    this.burnTimer = Math.max(0, this.burnTimer - dt);
    this.burnTickTimer -= dt;
    if (this.burnTickTimer <= 0) {
      this.burnTickTimer = 0.5;
      this.takeDamage(this.burnDps * 0.5, this.x, this.y, effectSystem);
      effectSystem.addDamageNumber(this.x, this.y - this.charData.size - 16, '着火', false, '#FFAB00');
      EffectLib.addFireBurstEffect(effectSystem, this.x, this.y, '#FF5722', 24);
    }

    if (this.burnTimer <= 0) {
      this.burnDps = 0;
      this.burnTickTimer = 0;
    }
  }

  /**
   * Poisoner passive: leaves short-lived poison clouds while moving.
   * @param {number} dt
   * @param {EffectSystem} effectSystem
   */
  updatePoisonTrail(dt, effectSystem) {
    if (!this.hasPassive('poison_trail') || !this.alive || this.state === 'dead') return;
    if (!this.combatManager || this.combatManager.state !== 'fighting') return;

    this.poisonTrailTimer = Math.max(0, this.poisonTrailTimer - dt);
    if (this.poisonTrailTimer > 0) return;

    this.poisonTrailTimer = 0.85;
    this.combatManager.addPoisonZone(this.x, this.y, this.team, 56, 3.2, 3.0, 0.8);
    EffectLib.addPoisonCloudEffect(effectSystem, this.x, this.y, '#66BB6A', 42);
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
    if (this.hasPassive('heavenly_eye')) {
      Passives.tryHeavenlyEye(this, opposingTeam, effectSystem);
    }
  }

  /**
   * Train Conductor passive: knock back and slow nearby enemies.
   * @param {Fighter[]} opposingTeam
   * @param {EffectSystem} effectSystem
   */
  trySteamWhistle(opposingTeam, effectSystem) {
    return Passives.trySteamWhistle(this, opposingTeam, effectSystem);
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

    const wasAlive = this.hp > 0;
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
    if (soundSystem) soundSystem.playHitSound();

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
      if (this.tryLethalSurvivalPassives(effectSystem)) {
        this.setState('chase');
      } else {
        if (soundSystem) soundSystem.playDeathSound();
        this.setState('dead');
      }
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
    return Passives.tryDamageAvoidancePassives(this, effectSystem);
  }

  /**
   * Passive shields and damage reducers.
   * @param {number} damage
   * @param {EffectSystem} effectSystem
   * @returns {number} Remaining damage
   */
  applyDamageReductionPassives(damage, effectSystem) {
    return Passives.applyDamageReductionPassives(this, damage, effectSystem);
  }

  /**
   * Strong hero passive: survive lethal damage once and ignite nearby enemies.
   * @param {EffectSystem} effectSystem
   * @returns {boolean} True when lethal damage was cancelled
   */
  tryLethalSurvivalPassives(effectSystem) {
    return Passives.tryLethalSurvivalPassives(this, effectSystem);
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
        EffectLib.addBackstabEffect(effectSystem, this.target.x, this.target.y, this.charData.color, 20);
        effectSystem.screenShake(7);
      }
    } else if (this.dashSkillType === 'serious_punch') {
      // One Punch Man serious punch
      EffectLib.addMeteorEffect(effectSystem, this.x, this.y, '#FFD700', 90);
      EffectLib.addAoeMeleeEffect(effectSystem, this.x, this.y, '#FF1744', 130);
      effectSystem.screenShake(18);

      const opposingTeam = (this.team === 'left') ? this.combatManager.fightersRight : this.combatManager.fightersLeft;
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
      this.ai.startReposition(arenaWidth, arenaHeight, arenaX, arenaY);
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
    this.startSkillCast(effectSystem, skill, skill.nameCN || skill.name);

    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }

    executeSkillStrategy(this, skill, weaponSystem, effectSystem);
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

    // ── Burn effect (orange flame ring) ──
    if (this.burnTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.45 + Math.sin(time * 10) * 0.12;
      ctx.strokeStyle = '#FFAB00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.charData.size + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FF5722';
      for (var b = 0; b < 4; b++) {
        var ba = -time * 3 + b * Math.PI * 2 / 4;
        ctx.beginPath();
        ctx.arc(this.x + Math.cos(ba) * (this.charData.size + 9), this.y + Math.sin(ba) * (this.charData.size + 9), 3, 0, Math.PI * 2);
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
    if (typeof this.charData.drawDecorations === 'function') {
      this.charData.drawDecorations(ctx, this.x, this.y, this.angle, this.charData.size, time);
    }

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
