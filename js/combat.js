import * as EffectLib from './effects_lib/index.js';
import { Fighter } from './fighter.js';
import { WeaponSystem } from './weapon.js';
import { EffectSystem } from './effects.js';
import { BattleContext } from './BattleContext.js';
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
    this.gravityWells = [];
    this.burnZones = [];

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

    const maxSpacing = 70;
    const spawnXLeft = this.arenaX + 80;
    const spawnXRight = this.arenaX + this.arenaWidth - 80;
    const centerY = this.arenaY + this.arenaHeight / 2;

    // Spawn Left Team
    const numLeft = leftIds.length;
    const spacingLeft = numLeft > 1 ? Math.min(maxSpacing, (this.arenaHeight - 80) / (numLeft - 1)) : maxSpacing;
    const startYLeft = centerY - ((numLeft - 1) * spacingLeft) / 2;
    for (let i = 0; i < numLeft; i++) {
      const y = startYLeft + i * spacingLeft;
      const f = new Fighter(leftIds[i], spawnXLeft, y, 'left');
      this.fightersLeft.push(f);
    }

    // Spawn Right Team
    const numRight = rightIds.length;
    const spacingRight = numRight > 1 ? Math.min(maxSpacing, (this.arenaHeight - 80) / (numRight - 1)) : maxSpacing;
    const startYRight = centerY - ((numRight - 1) * spacingRight) / 2;
    for (let i = 0; i < numRight; i++) {
      const y = startYRight + i * spacingRight;
      const f = new Fighter(rightIds[i], spawnXRight, y, 'right');
      this.fightersRight.push(f);
    }

    // Reset systems
    this.weaponSystem.clear();
    this.effectSystem = new EffectSystem();
    this.poisonZones = [];
    this.gravityWells = [];
    this.burnZones = [];

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
      // Update left and right fighters — pass BattleContext so fighters never need combatManager
      const shared = {
        weaponSystem: this.weaponSystem,
        effectSystem: this.effectSystem,
        arenaWidth: this.arenaWidth,
        arenaHeight: this.arenaHeight,
        arenaX: this.arenaX,
        arenaY: this.arenaY,
        battleCallbacks: {
          addPoisonZone: (...args) => this.addPoisonZone(...args),
          applyAreaDamage: (x, y, ownerTeam, damage, radius, attacker) => this.applyAreaDamage(x, y, ownerTeam, damage, radius, attacker),
          addGravityWell: (...args) => this.addGravityWell(...args),
          addBurnZone: (...args) => this.addBurnZone(...args),
        },
      };
      const ctxLeft  = new BattleContext({ ...shared, opposingTeam: this.fightersRight, ownTeam: this.fightersLeft });
      const ctxRight = new BattleContext({ ...shared, opposingTeam: this.fightersLeft,  ownTeam: this.fightersRight });
      this.fightersLeft.forEach(f  => f.update(dt, ctxLeft));
      this.fightersRight.forEach(f => f.update(dt, ctxRight));

      this.updatePoisonZones(dt);
      this.updateGravityWells(dt);
      this.updateBurnZones(dt);

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

    // ── Draw ground zones (burn, poison) ──
    if (this.state === 'countdown' || this.state === 'fighting' || this.state === 'finished') {
      const time = performance.now() / 1000;

      // Draw poison zones
      if (this.poisonZones && this.poisonZones.length > 0) {
        this.poisonZones.forEach(zone => {
          ctx.save();
          const grad = ctx.createRadialGradient(zone.x, zone.y, 2, zone.x, zone.y, zone.radius);
          grad.addColorStop(0, 'rgba(76, 175, 80, 0.25)'); // Green center
          grad.addColorStop(0.6, 'rgba(156, 39, 176, 0.12)'); // Purple middle
          grad.addColorStop(1, 'rgba(156, 39, 176, 0)'); // Fade out
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
          ctx.fill();

          // Poison ring outline
          ctx.strokeStyle = 'rgba(76, 175, 80, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.radius * (0.95 + Math.sin(time * 3 + zone.x) * 0.03), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
      }

      // Draw burn zones
      if (this.burnZones && this.burnZones.length > 0) {
        this.burnZones.forEach(zone => {
          ctx.save();
          // Pulsing radius for fire effect
          const pulseRadius = zone.radius * (0.95 + Math.sin(time * 8 + zone.x * zone.y) * 0.05);
          
          const grad = ctx.createRadialGradient(zone.x, zone.y, 2, zone.x, zone.y, pulseRadius);
          grad.addColorStop(0, 'rgba(255, 110, 0, 0.35)'); // Bright orange center
          grad.addColorStop(0.5, 'rgba(255, 61, 0, 0.18)'); // Reddish inner ring
          grad.addColorStop(0.8, 'rgba(230, 81, 0, 0.08)'); // Dark orange/red
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent edge
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();

          // Cracking outline
          ctx.strokeStyle = 'rgba(255, 61, 0, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
      }
    }

    // ── Battle / Finished rendering ──
    if (this.state === 'countdown' || this.state === 'fighting' || this.state === 'finished') {
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

  addGravityWell(x, y, ownerTeam, radius, duration, damage) {
    this.gravityWells.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam: ownerTeam,
      radius: radius || 130,
      duration: duration || 2.5,
      maxDuration: duration || 2.5,
      damage: damage || 38
    });
  }

  updateGravityWells(dt) {
    for (let i = this.gravityWells.length - 1; i >= 0; i--) {
      const well = this.gravityWells[i];
      well.duration -= dt;

      // Spawning swirling visual effects in gravity well
      if (Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const dist = well.radius * (0.3 + Math.random() * 0.7);
        const px = well.x + Math.cos(angle) * dist;
        const py = well.y + Math.sin(angle) * dist;
        const speed = 140;
        const vx = -Math.sin(angle) * speed - Math.cos(angle) * 90;
        const vy = Math.cos(angle) * speed - Math.sin(angle) * 90;

        this.effectSystem.addParticle({
          x: px,
          y: py,
          vx: vx,
          vy: vy,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.7,
          color: '#FF6D00',
          size: 2.0 + Math.random() * 2,
          gravity: 0,
          friction: 0.96,
          type: 'circle'
        });
      }

      // Draw swirling central rings
      if (Math.random() < 0.12) {
        this.effectSystem.addParticle({
          x: well.x,
          y: well.y,
          vx: 0,
          vy: 0,
          life: 0.25,
          maxLife: 0.25,
          color: '#3E2723',
          size: 20 + Math.sin(Date.now() * 0.015) * 6,
          gravity: 0,
          friction: 1.0,
          type: 'ring'
        });
      }

      // If duration is finished, explode!
      if (well.duration <= 0) {
        // Deal area damage
        this.applyAreaDamage(well.x, well.y, well.ownerTeam, well.damage, well.radius, null);
        EffectLib.addFireBurstEffect(this.effectSystem, well.x, well.y, '#FF6D00', well.radius);
        this.effectSystem.screenShake(10);
        this.gravityWells.splice(i, 1);
        continue;
      }

      // Apply pull and slow to enemies in range
      const enemies = well.ownerTeam === 'left' ? this.fightersRight : this.fightersLeft;
      if (enemies) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive()) return;
          const dx = enemy.x - well.x;
          const dy = enemy.y - well.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist <= well.radius) {
            // Apply slow continuously
            enemy.applySlow(0.2, 0.5);

            // Pull towards center unless target has stone_shell
            if (!enemy.hasPassive('stone_shell')) {
              const pullPower = 150 * dt * (1 - dist / well.radius); // Pull stronger near center
              const pullAngle = Math.atan2(dy, dx);
              enemy.x -= Math.cos(pullAngle) * pullPower;
              enemy.y -= Math.sin(pullAngle) * pullPower;
            }

            // Spawn particles pulling from enemy to center
            if (Math.random() < 0.15) {
              const pullAngle = Math.atan2(dy, dx);
              this.effectSystem.addParticle({
                x: enemy.x,
                y: enemy.y,
                vx: -Math.cos(pullAngle) * 250,
                vy: -Math.sin(pullAngle) * 250,
                life: 0.25,
                maxLife: 0.25,
                color: '#FF6D00',
                size: 2,
                gravity: 0,
                friction: 0.95,
                type: 'spark'
              });
            }
          }
        });
      }
    }
  }

  addBurnZone(x, y, ownerTeam, radius, duration, burnDps) {
    this.burnZones.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam: ownerTeam,
      radius: radius || 40,
      duration: duration || 2.0,
      maxDuration: duration || 2.0,
      burnDps: burnDps || 8.0
    });
  }

  updateBurnZones(dt) {
    for (let i = this.burnZones.length - 1; i >= 0; i--) {
      const zone = this.burnZones[i];
      zone.duration -= dt;
      if (zone.duration <= 0) {
        this.burnZones.splice(i, 1);
        continue;
      }

      // Spawn flame particles inside the burn zone
      if (Math.random() < 0.25) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * zone.radius;
        const px = zone.x + Math.cos(angle) * dist;
        const py = zone.y + Math.sin(angle) * dist;

        this.effectSystem.addParticle({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 20,
          vy: -20 - Math.random() * 30, // Float up
          life: 0.3 + Math.random() * 0.25,
          maxLife: 0.55,
          color: Math.random() < 0.6 ? '#FF3D00' : '#FFC400',
          size: 2.0 + Math.random() * 2.5,
          gravity: -60, // Light gravity upwards
          friction: 0.94,
          type: 'spark'
        });
      }

      const enemies = zone.ownerTeam === 'left' ? this.fightersRight : this.fightersLeft;
      if (!enemies) continue;

      enemies.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const dx = enemy.x - zone.x;
        const dy = enemy.y - zone.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist <= zone.radius) {
          // Apply burn debuff (lasts 1.0 second, refreshed continuously)
          enemy.applyBurn(1.0, zone.burnDps);
        }
      });
    }
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
