import * as Passives from './skills/Passives.js';
import { FighterAI } from './ai/FighterAI.js';
import { characterData } from './characters/index.js';
import { safeFinite, safeDirection, clamp, normaliseAngle } from './utils.js';
import { BuffManager } from './buffs/BuffManager.js';
import { FighterRenderer } from './rendering/FighterRenderer.js';
import { AttackHandler } from './combat/AttackHandler.js';
import { FighterHealth } from './combat/FighterHealth.js';
import { SkillCastPresenter } from './skills/SkillCastPresenter.js';
import { isChannelingSkill, executeChannelTick, executeChannelDamage } from './skills/SkillRegistry.js';

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

    // Debuff manager (stun / slow / poison / burn)
    this.buffs = new BuffManager(this);

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
    this.spawnNameTimer = 3.0; // Show name next to fighter on entry

    // Ninja clone state
    this.clones = [];
    this.cloneTimer = 0;

    // Superhero-specific mechanics
    this.bloodShield = 0;
    this.bloodShieldCooldown = 0;
    this.whistleCooldown = 0;
    this.rebirthUsed = false;
    
    // Mecha Pioneer mechanics
    this.mechaShield = 0;
    this.mechaShieldUsed = false;
    this.sentryDroneTimer = 0;

    // Bounty Hunter mechanics
    this.bountyHunterStacks = 0;

    // Wind Dancer mechanics
    this.windFuryTimer = 0;

    // Ronin mechanics
    this.counterStanceTimer = 0;

    // Brawler mechanics
    this.comboTarget = null;
    this.comboStacks = 0;

    // Rogue mechanics
    this.smokeDodgeTimer = 0;

    // Dawn Goddess mechanics
    this.dawnSpeedTimer = 0;
    this.dawnResurrectionCooldown = 0;
    this.finalSunriseUsed = false;
    this.corrosionTimer = 0;

    // Channeling skill state (e.g. Berserker whirlwind)
    this.channelTimer = 0;
    this.channelTick = 0;

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

  // Debuff application — delegate to BuffManager
  applyStun(duration)           { this.buffs.applyStun(duration); }
  applySlow(duration)           { this.buffs.applySlow(duration); }
  applyPoison(duration, dps)    { this.buffs.applyPoison(duration, dps); }
  applyBurn(duration, dps)      { this.buffs.applyBurn(duration, dps); }
  isStunned()                   { return this.buffs.isStunned(); }
  isSlowed()                    { return this.buffs.isSlowed(); }
  isBurning()                   { return this.buffs.isBurning(); }

  // ═══════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═══════════════════════════════════════════════════════════════

  /**
   * Full update: timers, state machine, movement, combat.
   * @param {number} dt - Delta time in seconds
   * @param {BattleContext} ctx - Bundled battle context (weaponSystem, effectSystem, arena, teams, callbacks)
   */
  update(dt, ctx) {
    // Store the battle context so skills, passives, and buffs can access it
    this.battleContext = ctx;
    const { weaponSystem, effectSystem, arenaWidth, arenaHeight, arenaX, arenaY, opposingTeam, ownTeam } = ctx;

    // Sanitize state variables at start of update to prevent NaN propagation
    this.x  = safeFinite(this.x, arenaX + arenaWidth / 2);
    this.y  = safeFinite(this.y, arenaY + arenaHeight / 2);
    this.hp  = safeFinite(this.hp, this.maxHp);
    this.angle = normaliseAngle(this.angle);

    // Dead fighters don't update beyond death animation
    if (!this.alive && this.state !== 'dead') return;

    // Find closest target dynamically
    this.ai.findClosestTarget(opposingTeam);

    // ── Update all timers ──
    this.stateTimer += dt;
    var attackTimerRate = this.getAttackTimerRate();
    this.attackTimer = Math.max(0, this.attackTimer - dt * attackTimerRate);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    this.buffs.update(dt, effectSystem);
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.blinkCooldown = Math.max(0, this.blinkCooldown - dt);
    this.cloneTimer = Math.max(0, this.cloneTimer - dt);
    if (this.spawnNameTimer > 0) {
      this.spawnNameTimer = Math.max(0, this.spawnNameTimer - dt);
    }
    this.heavenlyEyeCooldown = Math.max(0, (this.heavenlyEyeCooldown || 0) - dt);
    this.windFuryTimer = Math.max(0, (this.windFuryTimer || 0) - dt);
    this.counterStanceTimer = Math.max(0, (this.counterStanceTimer || 0) - dt);
    this.smokeDodgeTimer = Math.max(0, (this.smokeDodgeTimer || 0) - dt);
    this.dawnSpeedTimer = Math.max(0, (this.dawnSpeedTimer || 0) - dt);
    this.dawnResurrectionCooldown = Math.max(0, (this.dawnResurrectionCooldown || 0) - dt);
    this.corrosionTimer = Math.max(0, (this.corrosionTimer || 0) - dt);
    this.skillReady = (this.skillCooldown <= 0) && !this.buffs.isPoisoned();

    this.updatePassiveTimers(dt);
    this.updateAutomaticPassives(opposingTeam, effectSystem, dt);

    // Clear clones when timer expires
    if (this.cloneTimer <= 0 && this.clones.length > 0) {
      this.clones = [];
    }

    // ── Stunned: skip all actions ──
    if (this.buffs.isStunned()) {
      this.x = clamp(this.x, arenaX + 30, arenaX + arenaWidth - 30);
      this.y = clamp(this.y, arenaY + 30, arenaY + arenaHeight - 30);
      return;
    }

    // ── Update facing angle toward target (skip during whirlwind spin) ──
    if (this.state !== 'channeling' && this.target && this.target.isAlive()) {
      const faceDir = safeDirection(
        this.target.x - this.x,
        this.target.y - this.y
      );
      // Prevent frantic spinning due to collision jitter when overlapping
      if (faceDir.dist * faceDir.dist > 10.0) {
        this.angle = Math.atan2(faceDir.dy * faceDir.dist, faceDir.dx * faceDir.dist);
      }
    }
    this.angle = normaliseAngle(this.angle);

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
          this.ai.applyRepositionMovement(dt, ctx);
        } else {
          // Apply standard movement pattern
          this.ai.applyMovement(dt, ctx);
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
          this.ai.applyMovement(dt * 0.8, ctx);
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
        this.ai.applyRepositionMovement(dt, ctx);
        if (this.stateTimer >= this.charData.attackSpeed * 0.3) {
          // 85% chance to perform an extended tactical reposition, otherwise chase
          if (Math.random() < 0.85) {
            this.ai.startReposition(ctx);
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
        // Channeling skills → persistent state, otherwise reposition
        if (this.charData.skill && isChannelingSkill(this.charData.skill.type)) {
          if (this.stateTimer >= 0.3) {
            this.setState('channeling');
            this.channelTimer = this.charData.skill.duration || 2.0;
            this.channelTick = 0;
          }
        } else if (this.stateTimer >= 0.5) {
          this.ai.startReposition(ctx);
        }
        break;

      // ───────────────────────────────────────────────
      // CHANNELING: Persistent skill (whirlwind, etc.)
      // ───────────────────────────────────────────────
      case 'channeling':
        this.channelTimer -= dt;
        this.channelTick -= dt;

        // Per-frame tick — visuals, rotation, movement
        executeChannelTick(this, this.charData.skill, effectSystem, dt);

        // Periodic damage tick
        if (this.channelTick <= 0) {
          this.channelTick = this.charData.skill.channelTickInterval || 0.25;
          executeChannelDamage(this, this.charData.skill, effectSystem);
        }

        // Channeling ends
        if (this.channelTimer <= 0) {
          this.ai.startReposition(ctx);
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

        this.ai.applyRepositionMovement(dt, ctx);

        // Reposition for a short time, then resume chasing
        if (this.stateTimer >= this.repositionDuration) {
          this.setState('chase');
        }
        break;

      // ───────────────────────────────────────────────
      // DASHING_SKILL: Slide smoothly towards the target location
      // ───────────────────────────────────────────────
      case 'dashing_skill':
        if (this.dashSkillType !== 'blazing_stampede' && (!this.target || !this.target.isAlive())) {
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
          this.executeDashingSkillHit();
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
    this.x = clamp(this.x, arenaX + 30, arenaX + arenaWidth - 30);
    this.y = clamp(this.y, arenaY + 30, arenaY + arenaHeight - 30);
    // Reset to arena centre if coords are still non-finite (clamp returns min on NaN)
    if (!isFinite(this.x)) this.x = arenaX + arenaWidth / 2;
    if (!isFinite(this.y)) this.y = arenaY + arenaHeight / 2;

    this.hp = safeFinite(this.hp, this.maxHp);
    this.angle = normaliseAngle(this.angle);

    // Timer cleanup
    this.buffs.sanitise();
    this.attackTimer   = safeFinite(this.attackTimer, 0);
    this.skillCooldown = safeFinite(this.skillCooldown, 0);
    this.corrosionTimer = safeFinite(this.corrosionTimer, 0);
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
    AttackHandler.executeAttack(this, weaponSystem, effectSystem);
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

    const dir = safeDirection(
      this.target.x - this.x,
      this.target.y - this.y
    );

    // AI tendency strategies
    switch (this.charData.aiTendency) {
      case 'aggressive':
        // No special behavior — charge in always
        break;

      case 'cautious':
        if (this.hp < this.maxHp * 0.3 && dir.dist < this.charData.attackRange * 1.2) {
          this.x -= dir.dx * this.charData.speed * 30 * dt;
          this.y -= dir.dy * this.charData.speed * 30 * dt;
        }
        break;

      case 'balanced':
        if (this.hp <= this.maxHp * 0.5 && dir.dist < this.charData.attackRange * 0.8) {
          this.x -= dir.dx * this.charData.speed * 15 * dt;
          this.y -= dir.dy * this.charData.speed * 15 * dt;
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
    if (this.state === 'skill' || this.state === 'dashing_skill' || this.state === 'channeling' || this.state === 'dead') return false;

    const dir = safeDirection(this.target.x - this.x, this.target.y - this.y);
    return dir.dist <= this.charData.skill.range;
  }

  /**
   * Shared beginning-of-skill behavior. Keep cross-skill visuals,
   * audio, and cooldowns here so individual payloads cannot skip them.
   * @param {EffectSystem} effectSystem
   * @param {object} skill
   * @param {string=} displayName
   */
  startSkillCast(effectSystem, skill, displayName) {
    SkillCastPresenter.startSkillCast(this, effectSystem, skill, displayName);
  }

  /**
   * Show a team-colored skill name above this fighter.
   * @param {EffectSystem} effectSystem
   * @param {string} skillName
   */
  showSkillName(effectSystem, skillName) {
    SkillCastPresenter.showSkillName(this, effectSystem, skillName);
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
   * Automatic passives that can trigger without taking or dealing damage.
   * @param {Fighter[]} opposingTeam
   * @param {EffectSystem} effectSystem
   * @param {number} dt
   */
  updateAutomaticPassives(opposingTeam, effectSystem, dt) {
    if (this.hasPassive('steam_whistle')) {
      this.trySteamWhistle(opposingTeam, effectSystem);
    }
    if (this.hasPassive('heavenly_eye')) {
      Passives.tryHeavenlyEye(this, opposingTeam, effectSystem);
    }
    if (this.hasPassive('sentry_drones')) {
      Passives.trySentryDrones(this, opposingTeam, effectSystem, dt);
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
    FighterHealth.takeDamage(this, damage, attackerX, attackerY, effectSystem);
  }

  /**
   * Heal this fighter.
   * @param {number} amount - Heal amount
   * @param {EffectSystem} effectSystem - For visual feedback
   */
  heal(amount, effectSystem) {
    FighterHealth.heal(this, amount, effectSystem);
  }

  /**
   * Passive effects that fully avoid incoming damage.
   * @param {EffectSystem} effectSystem
   * @returns {boolean} True when damage should be cancelled
   */
  tryDamageAvoidancePassives(effectSystem) {
    return FighterHealth.tryDamageAvoidancePassives(this, effectSystem);
  }

  /**
   * Passive shields and damage reducers.
   * @param {number} damage
   * @param {EffectSystem} effectSystem
   * @returns {number} Remaining damage
   */
  applyDamageReductionPassives(damage, effectSystem, attackerX, attackerY) {
    return FighterHealth.applyDamageReductionPassives(this, damage, effectSystem, attackerX, attackerY);
  }

  /**
   * Strong hero passive: survive lethal damage once and ignite nearby enemies.
   * @param {EffectSystem} effectSystem
   * @returns {boolean} True when lethal damage was cancelled
   */
  tryLethalSurvivalPassives(effectSystem) {
    return FighterHealth.tryLethalSurvivalPassives(this, effectSystem);
  }

  /**
   * Heal from damage dealt when the character has lifesteal.
   * @param {number} damage
   * @param {EffectSystem} effectSystem
   * @param {number=} overrideRatio
   */
  healFromDamage(damage, effectSystem, overrideRatio) {
    FighterHealth.healFromDamage(this, damage, effectSystem, overrideRatio);
  }

  /**
   * Execute the hit/payload of a dashing skill after completing the smooth dash movement.
   */
  executeDashingSkillHit() {
    AttackHandler.executeDashingSkillHit(this);
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
    AttackHandler.executeSkill(this, weaponSystem, effectSystem);
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
    FighterRenderer.render(this, ctx, time);
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
   * Get effective attack timer rate, factoring in slow debuff and blood_rage passive.
   * @returns {number} Multiplier (>1 = faster, <1 = slower)
   */
  getAttackTimerRate() {
    let rate = this.buffs.slowAttackRate(); // 0.6 when slowed, 1.0 otherwise
    // Blood rage: attack speed increases as HP decreases
    if (this.hasPassive('blood_rage')) {
      const hpPercent = this.hp / this.maxHp;
      rate *= (1 + (1 - hpPercent) * 1.5); // up to 2.5x at 0% HP
    }
    // Bounty mark: +4% attack speed per kill stack, max 100% (25 stacks)
    if (this.hasPassive('bounty_mark') && this.bountyHunterStacks > 0) {
      rate *= (1 + this.bountyHunterStacks * 0.04);
    }
    // Counter stance: retaliate faster after being hit by melee
    if (this.counterStanceTimer > 0) {
      rate *= 1.6;
    }
    return rate;
  }

  /**
   * Get effective movement speed multiplier.
   * @returns {number}
   */
  getSpeedMultiplier() {
    let mult = this.isSlowed() ? 0.5 : 1.0;
    // Blood rage: +25% move speed when HP below 35%
    if (this.hasPassive('blood_rage') && this.hp < this.maxHp * 0.35) {
      mult *= 1.25;
    }
    // Wind fury: +40% move speed
    if (this.windFuryTimer > 0) {
      mult *= 1.4;
    }
    // Dawn blessing: brief allied movement speed boost
    if (this.dawnSpeedTimer > 0) {
      mult *= 1.25;
    }
    return mult;
  }

  /**
   * Get outgoing damage multiplier from passives (e.g. wind fury).
   * @returns {number}
   */
  getOutgoingDamageMultiplier() {
    let mult = 1.0;
    // Wind fury: +25% damage
    if (this.windFuryTimer > 0) {
      mult *= 1.25;
    }
    // Counter stance: next melee counter hit deals +35% damage
    if (this.counterStanceTimer > 0) {
      mult *= 1.35;
    }
    return mult;
  }

  /**
   * Check if this fighter is still alive.
   * @returns {boolean}
   */
  isAlive() {
    return this.alive;
  }
}
