/**
 * CombatManager - Orchestrates the entire battle
 * Manages fighters, weapon/effect systems, arena, countdown, and battle state.
 */
class CombatManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.weaponSystem = new WeaponSystem();
    this.effectSystem = new EffectSystem();

    this.fighter1 = null;
    this.fighter2 = null;
    this.state = 'waiting'; // 'waiting', 'countdown', 'fighting', 'finished'
    this.countdownTimer = 0;
    this.battleTime = 0;
    this.winner = null;
    this.waitTimer = 0;

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

  startBattle(char1Id, char2Id) {
    this._computeArena();

    // Create fighters
    const spawnY = this.arenaY + this.arenaHeight / 2;
    this.fighter1 = new Fighter(char1Id, this.arenaX + 80, spawnY, 'left');
    this.fighter2 = new Fighter(char2Id, this.arenaX + this.arenaWidth - 80, spawnY, 'right');

    // Assign targets
    this.fighter1.setTarget(this.fighter2);
    this.fighter2.setTarget(this.fighter1);

    // Reset systems
    this.weaponSystem.clear();
    this.effectSystem = new EffectSystem();

    // State
    this.state = 'countdown';
    this.countdownTimer = 3;
    this.battleTime = 0;
    this.winner = null;
    this.waitTimer = 0;
  }

  /* ── Update ───────────────────────────────────────────── */

  update(dt) {
    if (this.state === 'countdown') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.state = 'fighting';
      }
      return;
    }

    if (this.state === 'fighting') {
      // Update fighters
      this.fighter1.update(dt, this.weaponSystem, this.effectSystem, this.arenaWidth, this.arenaHeight, this.arenaX, this.arenaY);
      this.fighter2.update(dt, this.weaponSystem, this.effectSystem, this.arenaWidth, this.arenaHeight, this.arenaX, this.arenaY);

      // Resolve collision between fighters to prevent overlapping
      this.resolveFighterCollision();

      // Update projectiles / melee hits
      const hits = this.weaponSystem.update(dt, [this.fighter1, this.fighter2]);

      // Process hits
      if (hits && hits.length > 0) {
        for (const hit of hits) {
          if (hit.target && hit.target.isAlive()) {
            hit.target.takeDamage(hit.damage, hit.projectile ? hit.projectile.x : hit.target.x, hit.projectile ? hit.projectile.y : hit.target.y, this.effectSystem);

            // Lifesteal – heal attacker
            const attacker = hit.target === this.fighter1 ? this.fighter2 : this.fighter1;
            if (attacker.charData.lifesteal && attacker.charData.lifesteal > 0) {
              const healAmt = hit.damage * attacker.charData.lifesteal;
              if (healAmt > 0) {
                attacker.heal(healAmt, this.effectSystem);
              }
            }
          }
        }
      }

      // Update effects
      this.effectSystem.update(dt);

      // Check death
      if (!this.fighter1.isAlive() || !this.fighter2.isAlive()) {
        this.state = 'finished';
        if (!this.fighter1.isAlive() && !this.fighter2.isAlive()) {
          this.winner = null; // draw
        } else {
          this.winner = this.fighter1.isAlive() ? this.fighter1 : this.fighter2;
        }
      }

      this.battleTime += dt;

      // Safety timeout – 60 second hard limit
      if (this.battleTime > 60) {
        this.state = 'finished';
        // Higher HP wins, else draw
        if (this.fighter1.hp !== this.fighter2.hp) {
          this.winner = this.fighter1.hp > this.fighter2.hp ? this.fighter1 : this.fighter2;
        } else {
          this.winner = null;
        }
      }
      return;
    }

    if (this.state === 'finished') {
      // Let remaining effects play out
      this.effectSystem.update(dt);
    }
  }

  /**
   * Resolve collisions between the two fighters to prevent them from completely overlapping.
   * Allows them to get close (up to 70% of combined size) but pushes them apart if they overlap more.
   */
  resolveFighterCollision() {
    if (!this.fighter1 || !this.fighter2) return;
    if (!this.fighter1.isAlive() || !this.fighter2.isAlive()) return;

    const dx = this.fighter2.x - this.fighter1.x;
    const dy = this.fighter2.y - this.fighter1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Combined radius * 0.7 to allow close-combat but prevent overlapping
    const minDist = (this.fighter1.charData.size + this.fighter2.charData.size) * 0.7;

    if (dist < minDist) {
      const overlap = minDist - dist;
      // Normal vector pointing from fighter1 to fighter2
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      // Push them apart by half the overlap each
      const pushDist = overlap / 2;
      this.fighter1.x -= nx * pushDist;
      this.fighter1.y -= ny * pushDist;
      this.fighter2.x += nx * pushDist;
      this.fighter2.y += ny * pushDist;
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

    // ── Countdown ──
    if (this.state === 'countdown') {
      this._drawCountdown(ctx);
    }

    // ── Battle / Finished rendering ──
    if (this.state === 'fighting' || this.state === 'finished') {
      this.fighter1.render(ctx, performance.now() / 1000);
      this.fighter2.render(ctx, performance.now() / 1000);
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
