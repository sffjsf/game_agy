import { WeaponSystem } from './weapon.js';
import { EffectSystem } from './effects.js';
import { safeDirection } from './utils.js';
import { createBattleContexts } from './combat/BattleContextFactory.js';
import { CombatRenderer } from './combat/CombatRenderer.js';
import { HazardZoneManager } from './combat/HazardZoneManager.js';
import { ProjectileHitProcessor } from './combat/ProjectileHitProcessor.js';
import { createTeam, normalizeTeamIds } from './combat/TeamSpawner.js';

/**
 * CombatManager - Thin battle orchestrator.
 * Owns lifecycle state and delegates spawning, contexts, hazards, hits, and render.
 */
export class CombatManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.weaponSystem = new WeaponSystem();
    this.effectSystem = new EffectSystem();
    this.hazardZoneManager = new HazardZoneManager();

    this.fighter1 = null;
    this.fighter2 = null;
    this.fightersLeft = [];
    this.fightersRight = [];
    this.state = 'waiting';
    this.countdownTimer = 0;
    this.battleTime = 0;
    this.winner = null;
    this.waitTimer = 0;

    this.speedMultiplier = 1.0;

    this.onCountdownTick = null;
    this.onBattleEnd = null;

    this._lastCountdownVal = 4;
    this._finishedTimer = 0;
    this._battleEndNotified = false;

    this.renderer = new CombatRenderer(canvas, () => this._getRenderState());
    this._computeArena();
  }

  get poisonZones() {
    return this.hazardZoneManager.poisonZones;
  }

  get gravityWells() {
    return this.hazardZoneManager.gravityWells;
  }

  get burnZones() {
    return this.hazardZoneManager.burnZones;
  }

  _computeArena() {
    const pad = 20;
    this.arenaWidth = this.canvas.width - pad * 2;
    this.arenaHeight = this.canvas.height - pad;
    this.arenaX = pad;
    this.arenaY = pad / 2;
  }

  updateDimensions() {
    this._computeArena();
  }

  startBattle(leftIds, rightIds) {
    this._computeArena();

    leftIds = normalizeTeamIds(leftIds);
    rightIds = normalizeTeamIds(rightIds);

    const arena = this._getArena();
    this.fightersLeft = createTeam(leftIds, 'left', arena);
    this.fightersRight = createTeam(rightIds, 'right', arena);
    this.fighter1 = this.fightersLeft[0] || null;
    this.fighter2 = this.fightersRight[0] || null;

    this.weaponSystem.clear();
    this.effectSystem = new EffectSystem();
    this.hazardZoneManager.clear();

    this.state = 'countdown';
    this.countdownTimer = 3;
    this.battleTime = 0;
    this.winner = null;
    this.waitTimer = 0;
    this._lastCountdownVal = 4;
    this._finishedTimer = 0;
    this._battleEndNotified = false;
  }

  update(rawDt) {
    const dt = rawDt * this.speedMultiplier;

    if (this.state === 'countdown') {
      this._tickCountdown(dt);
      return;
    }

    if (this.state === 'fighting') {
      this._updateFighting(dt);
      return;
    }

    if (this.state === 'finished') {
      this.effectSystem.update(dt);
      this._finishedTimer -= dt;
      if (this._finishedTimer <= 0 && !this._battleEndNotified) {
        this._battleEndNotified = true;
        if (this.onBattleEnd) {
          this.onBattleEnd(this.winner, this.battleTime);
        }
      }
    }
  }

  _updateFighting(dt) {
    const contexts = createBattleContexts(this);
    this.fightersLeft.forEach(f => f.update(dt, contexts.left));
    this.fightersRight.forEach(f => f.update(dt, contexts.right));

    this.hazardZoneManager.update(dt, {
      fightersLeft: this.fightersLeft,
      fightersRight: this.fightersRight,
      effectSystem: this.effectSystem,
      applyAreaDamage: (...args) => this.applyAreaDamage(...args),
    });

    this.resolveFighterCollision();
    this._processWeaponHits(dt);
    this.effectSystem.update(dt);
    this._checkBattleEnd();
    this.battleTime += dt;
  }

  _processWeaponHits(dt) {
    const allFighters = [...this.fightersLeft, ...this.fightersRight];
    const hits = this.weaponSystem.update(dt, allFighters);
    if (!hits || hits.length === 0) return;

    const hitProcessor = new ProjectileHitProcessor(
      this.effectSystem,
      (x, y, ownerTeam, damage, radius, attacker) => this.applyAreaDamage(x, y, ownerTeam, damage, radius, attacker)
    );

    for (const hit of hits) {
      if (!hit.target || !hit.target.isAlive()) continue;

      const skipDirectDamage = hit.projectile && hit.projectile.type === 'bomb';
      if (!skipDirectDamage) {
        const hitX = hit.projectile ? hit.projectile.x : hit.target.x;
        const hitY = hit.projectile ? hit.projectile.y : hit.target.y;

        // Bounty mark: +40% damage vs targets below 50% HP
        const attacker = hit.projectile ? hit.projectile.attacker : null;
        if (attacker && attacker.hasPassive && attacker.hasPassive('bounty_mark')) {
          const hpPercent = hit.target.hp / hit.target.maxHp;
          if (hpPercent < 0.5) {
            hit.damage *= 1.4;
          }
        }

        hit.target.takeDamage(hit.damage, hitX, hitY, this.effectSystem);

        // Bounty mark: on-kill permanent attack speed boost (max 25 stacks)
        if (!hit.target.isAlive() && attacker && attacker.hasPassive('bounty_mark')) {
          attacker.bountyHunterStacks = Math.min((attacker.bountyHunterStacks || 0) + 1, 25);
        }
      }

      hitProcessor.process(hit);
    }
  }

  _tickCountdown(dt) {
    this.countdownTimer -= dt;
    const count = this.countdownTimer > 0 ? Math.ceil(this.countdownTimer) : 0;

    if (count !== this._lastCountdownVal) {
      this._lastCountdownVal = count;
      if (!this.onCountdownTick) return;

      if (count > 0) {
        this.onCountdownTick({ count, type: 'number' });
      } else {
        this.onCountdownTick({ type: 'fight' });
        setTimeout(() => {
          if (this.onCountdownTick) this.onCountdownTick({ type: 'end' });
        }, 500);
      }
    }

    if (this.countdownTimer <= 0) {
      this.state = 'fighting';
    }
  }

  _checkBattleEnd() {
    const leftAlive = this.fightersLeft.some(f => f.isAlive());
    const rightAlive = this.fightersRight.some(f => f.isAlive());

    if (!leftAlive || !rightAlive) {
      this.state = 'finished';
      this._finishedTimer = 1.5;
      this._battleEndNotified = false;
      this.winner = !leftAlive && !rightAlive ? null : (leftAlive ? 'left' : 'right');
    }
  }

  processProjectileHitPassives(hit) {
    const hitProcessor = new ProjectileHitProcessor(
      this.effectSystem,
      (x, y, ownerTeam, damage, radius, attacker) => this.applyAreaDamage(x, y, ownerTeam, damage, radius, attacker)
    );
    hitProcessor.process(hit);
  }

  applyAreaDamage(x, y, ownerTeam, damage, radius, attacker) {
    const targets = ownerTeam === 'left' ? this.fightersRight : this.fightersLeft;
    if (!targets) return;

    targets.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const dir = safeDirection(enemy.x - x, enemy.y - y);
      if (dir.dist <= radius) {
        enemy.takeDamage(damage, x, y, this.effectSystem);
        if (attacker && attacker.isAlive()) {
          attacker.healFromDamage(damage, this.effectSystem);
        }
      }
    });
  }

  addPoisonZone(...args) {
    this.hazardZoneManager.addPoisonZone(...args);
  }

  updatePoisonZones(dt) {
    this.hazardZoneManager.updatePoisonZones(dt, this._getHazardBattleState());
  }

  addGravityWell(...args) {
    this.hazardZoneManager.addGravityWell(...args);
  }

  updateGravityWells(dt) {
    this.hazardZoneManager.updateGravityWells(dt, this._getHazardBattleState());
  }

  addBurnZone(...args) {
    this.hazardZoneManager.addBurnZone(...args);
  }

  updateBurnZones(dt) {
    this.hazardZoneManager.updateBurnZones(dt, this._getHazardBattleState());
  }

  resolveFighterCollision() {
    const allFighters = [...this.fightersLeft, ...this.fightersRight].filter(f => f.isAlive());
    if (allFighters.length < 2) return;

    for (let i = 0; i < allFighters.length; i++) {
      for (let j = i + 1; j < allFighters.length; j++) {
        const f1 = allFighters[i];
        const f2 = allFighters[j];
        const dir = safeDirection(f2.x - f1.x, f2.y - f1.y);
        const minDist = (f1.charData.size + f2.charData.size) * 0.75;

        if (dir.dist < minDist) {
          const pushDist = (minDist - dir.dist) / 2;
          f1.x -= dir.dx * pushDist;
          f1.y -= dir.dy * pushDist;
          f2.x += dir.dx * pushDist;
          f2.y += dir.dy * pushDist;
        }
      }
    }
  }

  render() {
    this.renderer.render();
  }

  _getArena() {
    return {
      x: this.arenaX,
      y: this.arenaY,
      width: this.arenaWidth,
      height: this.arenaHeight,
    };
  }

  _getHazardBattleState() {
    return {
      fightersLeft: this.fightersLeft,
      fightersRight: this.fightersRight,
      effectSystem: this.effectSystem,
      applyAreaDamage: (...args) => this.applyAreaDamage(...args),
    };
  }

  _getRenderState() {
    return {
      battleState: this.state,
      arena: this._getArena(),
      fightersLeft: this.fightersLeft,
      fightersRight: this.fightersRight,
      weaponSystem: this.weaponSystem,
      effectSystem: this.effectSystem,
      hazards: this.hazardZoneManager,
    };
  }

  getState() {
    return this.state;
  }

  getWinner() {
    return this.winner;
  }

  getFighter1() {
    return this.fighter1;
  }

  getFighter2() {
    return this.fighter2;
  }

  getBattleTime() {
    return this.battleTime;
  }
}
