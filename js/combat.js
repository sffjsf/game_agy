import * as EffectLib from './effects_lib/index.js';
import { Fighter } from './fighter.js';
import { WeaponSystem } from './weapon.js';
import { EffectSystem } from './effects.js';
import { safeFinite, safeDirection } from './utils.js';

/**
 * CombatManager - Orchestrates the entire battle
 * Manages fighters, weapon/effect systems, arena, countdown, and battle state.
 */
export class CombatManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.weaponSystem = new WeaponSystem();
    this.effectSystem = new EffectSystem();
    this.poisonZones = [];

    this.fighter1 = null;
    this.fighter2 = null;
    this.state = 'waiting'; // 'waiting', 'countdown', 'fighting', 'finished'
    this.countdownTimer = 0;
    this.battleTime = 0;
    this.winner = null;
    this.waitTimer = 0;

    /** Battle speed multiplier (set externally via speed slider). */
    this.speedMultiplier = 1.0;

    /** Observer callbacks — set by main.js to decouple UI from battle logic. */
    this.onCountdownTick = null;  // ({count: number, type: 'number'|'fight'|'end'}) => void
    this.onBattleEnd = null;      // (winner: string|null, battleTime: number) => void

    /** Internal state for countdown dedup & finished delay. */
    this._lastCountdownVal = 4;
    this._finishedTimer = 0;
    this._battleEndNotified = false;

    // Arena dimensions (updated on resize via main.js)
    this._computeArena();
  }

  /* ── Arena helpers ────────────────────────────────────── */

  _computeArena() {
    const pad = 20;
    const hudHeight = 0; // HUD is HTML-based, not canvas
    this.arenaWidth = this.canvas.width - pad * 2;
    this.arenaHeight = this.canvas.height - pad;
    this.arenaX = pad;
    this.arenaY = pad / 2;
  }

  /** Called externally after canvas resize */
  updateDimensions() {
    this._computeArena();
  }

  /* ── Battle lifecycle ─────────────────────────────────── */

  startBattle(leftIds, rightIds) {
    this._computeArena();

    // Support single string backwards compatibility
    if (typeof leftIds === 'string') leftIds = [leftIds];
    if (typeof rightIds === 'string') rightIds = [rightIds];

    this.fightersLeft = [];
    this.fightersRight = [];

    const spawnXLeft = this.arenaX + 80;
    const spawnXRight = this.arenaX + this.arenaWidth - 80;
    const centerY = this.arenaY + this.arenaHeight / 2;
    const spacing = 70; // Vertical spacing

    // Spawn Left Team
    const numLeft = leftIds.length;
    const startYLeft = centerY - ((numLeft - 1) * spacing) / 2;
    for (let i = 0; i < numLeft; i++) {
      const y = startYLeft + i * spacing;
      const f = new Fighter(leftIds[i], spawnXLeft, y, 'left');
      this.fightersLeft.push(f);
    }

    // Spawn Right Team
    const numRight = rightIds.length;
    const startYRight = centerY - ((numRight - 1) * spacing) / 2;
    for (let i = 0; i < numRight; i++) {
      const y = startYRight + i * spacing;
      const f = new Fighter(rightIds[i], spawnXRight, y, 'right');
      this.fightersRight.push(f);
    }

    // Reset systems
    this.weaponSystem.clear();
    this.effectSystem = new EffectSystem();
    this.poisonZones = [];

    // State
    this.state = 'countdown';
    this.countdownTimer = 3;
    this.battleTime = 0;
    this.winner = null;
    this.waitTimer = 0;
    this._lastCountdownVal = 4;
    this._finishedTimer = 0;
    this._battleEndNotified = false;
  }

  /* ── Update ───────────────────────────────────────────── */

  update(rawDt) {
    const dt = rawDt * this.speedMultiplier;

    if (this.state === 'countdown') {
      this._tickCountdown(dt);
      return;
    }

    if (this.state === 'fighting') {
      // Update left and right fighters — pass full context so fighters never need combatManager
      const battleCallbacks = {
        addPoisonZone: (...args) => this.addPoisonZone(...args),
        applyAreaDamage: (x, y, ownerTeam, damage, radius, attacker) => this.applyAreaDamage(x, y, ownerTeam, damage, radius, attacker),
      };
      this.fightersLeft.forEach(f => {
        f.update(dt, this.weaponSystem, this.effectSystem, this.arenaWidth, this.arenaHeight, this.arenaX, this.arenaY, this.fightersRight, this.fightersLeft, battleCallbacks);
      });
      this.fightersRight.forEach(f => {
        f.update(dt, this.weaponSystem, this.effectSystem, this.arenaWidth, this.arenaHeight, this.arenaX, this.arenaY, this.fightersLeft, this.fightersRight, battleCallbacks);
      });

      this.updatePoisonZones(dt);

      // Resolve collision between all active fighters
      this.resolveFighterCollision();

      // Update projectiles / melee hits
      const allFighters = [...this.fightersLeft, ...this.fightersRight];
      const hits = this.weaponSystem.update(dt, allFighters);

      // Process hits
      if (hits && hits.length > 0) {
        for (const hit of hits) {
          if (hit.target && hit.target.isAlive()) {
            const skipDirectDamage = hit.projectile && hit.projectile.type === 'bomb';
            if (!skipDirectDamage) {
              hit.target.takeDamage(hit.damage, hit.projectile ? hit.projectile.x : hit.target.x, hit.projectile ? hit.projectile.y : hit.target.y, this.effectSystem);
            }
            this.processProjectileHitPassives(hit);
          }
        }
      }

      // Update effects
      this.effectSystem.update(dt);

      // Check death
      this._checkBattleEnd();

      this.battleTime += dt;
      return;
    }

    if (this.state === 'finished') {
      // Let remaining effects play out
      this.effectSystem.update(dt);

      // Delay before notifying result
      this._finishedTimer -= dt;
      if (this._finishedTimer <= 0 && !this._battleEndNotified) {
        this._battleEndNotified = true;
        if (this.onBattleEnd) {
          this.onBattleEnd(this.winner, this.battleTime);
        }
      }
    }
  }

  /** Emit countdown ticks to onCountdownTick callback when the display value changes. */
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
        // Signal UI to hide countdown after the fight flash
        setTimeout(() => {
          if (this.onCountdownTick) this.onCountdownTick({ type: 'end' });
        }, 500);
      }
    }

    if (this.countdownTimer <= 0) {
      this.state = 'fighting';
    }
  }

  /** Check if either team is wiped out and transition to finished. */
  _checkBattleEnd() {
    const leftAlive = this.fightersLeft.some(f => f.isAlive());
    const rightAlive = this.fightersRight.some(f => f.isAlive());

    if (!leftAlive || !rightAlive) {
      this.state = 'finished';
      this._finishedTimer = 1.5;
      this._battleEndNotified = false;
      if (!leftAlive && !rightAlive) {
        this.winner = null; // draw
      } else {
        this.winner = leftAlive ? 'left' : 'right';
      }
    }
  }

  processProjectileHitPassives(hit) {
    if (!hit.projectile) return;

    const projectile = hit.projectile;
    const attacker = projectile.attacker;

    if (attacker && attacker.hasPassive && attacker.hasPassive('train_stun') && projectile.type === 'train') {
      hit.target.applyStun(1.8);
      EffectLib.addStunEffect(this.effectSystem, hit.target.x, hit.target.y, '#FFD700', 30);
    }

    // Type-based on-hit effects
    switch (projectile.type) {
      case 'bomb':
        this.applyAreaDamage(projectile.x, projectile.y, projectile.ownerId, hit.damage, 105, attacker);
        EffectLib.addBombEffect(this.effectSystem, projectile.x, projectile.y, projectile.color, 105);
        this.effectSystem.screenShake(6);
        return;

      case 'poison':
        hit.target.applyPoison(3.0, 3.5);
        hit.target.applySlow(1.2);
        EffectLib.addPoisonCloudEffect(this.effectSystem, hit.target.x, hit.target.y, projectile.color, 55);
        break;
    }

    if (!attacker || !attacker.isAlive()) return;

    // Lifesteal from projectile hits
    attacker.healFromDamage(hit.damage, this.effectSystem, projectile.type === 'bat' ? 1.0 : undefined);
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

  addPoisonZone(x, y, ownerTeam, radius, duration, poisonDps, slowDuration) {
    this.poisonZones.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam: ownerTeam,
      radius: radius,
      duration: duration,
      maxDuration: duration,
      poisonDps: poisonDps || 3.0,
      slowDuration: slowDuration || 0
    });
  }

  updatePoisonZones(dt) {
    for (let i = this.poisonZones.length - 1; i >= 0; i--) {
      const zone = this.poisonZones[i];
      zone.duration -= dt;
      if (zone.duration <= 0) {
        this.poisonZones.splice(i, 1);
        continue;
      }

      const enemies = zone.ownerTeam === 'left' ? this.fightersRight : this.fightersLeft;
      if (!enemies) continue;

      enemies.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const dir = safeDirection(enemy.x - zone.x, enemy.y - zone.y);
        if (dir.dist <= zone.radius) {
          enemy.applyPoison(Math.min(1.0, zone.duration), zone.poisonDps);
          if (zone.slowDuration > 0) enemy.applySlow(zone.slowDuration);
        }
      });
    }
  }

  resolveFighterCollision() {
    const allFighters = [...this.fightersLeft, ...this.fightersRight].filter(f => f.isAlive());
    if (allFighters.length < 2) return;

    for (let i = 0; i < allFighters.length; i++) {
      for (let j = i + 1; j < allFighters.length; j++) {
        const f1 = allFighters[i];
        const f2 = allFighters[j];

        const dir = safeDirection(f2.x - f1.x, f2.y - f1.y);

        // Combined radius * 0.75 to allow close combat but prevent overlapping
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

  /* ── Render ───────────────────────────────────────────── */

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // Screen shake
    const shake = this.effectSystem.getShakeOffset();
    if (shake.x || shake.y) {
      ctx.translate(shake.x, shake.y);
    }

    // ── Draw arena background ──
    this._drawArena(ctx);

    // ── Battle / Finished rendering ──
    if (this.state === 'fighting' || this.state === 'finished') {
      const time = performance.now() / 1000;
      this.fightersLeft.forEach(f => f.render(ctx, time));
      this.fightersRight.forEach(f => f.render(ctx, time));
      this.weaponSystem.render(ctx);
      this.effectSystem.render(ctx);
    }

    ctx.restore();
  }

  _drawArena(ctx) {
    // Dark arena floor
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(this.arenaX, this.arenaY, this.arenaWidth, this.arenaHeight);

    // Border
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.arenaX, this.arenaY, this.arenaWidth, this.arenaHeight);

    // Subtle grid lines for depth
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let gx = this.arenaX + gridStep; gx < this.arenaX + this.arenaWidth; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, this.arenaY);
      ctx.lineTo(gx, this.arenaY + this.arenaHeight);
      ctx.stroke();
    }
    for (let gy = this.arenaY + gridStep; gy < this.arenaY + this.arenaHeight; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(this.arenaX, gy);
      ctx.lineTo(this.arenaX + this.arenaWidth, gy);
      ctx.stroke();
    }

    // Center line
    ctx.strokeStyle = 'rgba(255,215,0,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    const cx = this.arenaX + this.arenaWidth / 2;
    ctx.beginPath();
    ctx.moveTo(cx, this.arenaY);
    ctx.lineTo(cx, this.arenaY + this.arenaHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawCountdown(ctx) {
    const cx = this.arenaX + this.arenaWidth / 2;
    const cy = this.arenaY + this.arenaHeight / 2;
    const count = Math.ceil(this.countdownTimer);
    const text = count > 0 ? String(count) : 'FIGHT!';
    const progress = this.countdownTimer - Math.floor(this.countdownTimer);
    const scale = 1 + progress * 0.5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.font = `900 ${count > 0 ? 120 : 72}px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = count > 0 ? '#ffffff' : '#FFD700';
    ctx.shadowColor = count > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,215,0,0.8)';
    ctx.shadowBlur = 30;
    ctx.globalAlpha = Math.min(1, progress * 3 + 0.2);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  /* ── Getters ──────────────────────────────────────────── */

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
