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
      // Update left and right fighters
      this.fightersLeft.forEach(f => {
        f.update(dt, this.weaponSystem, this.effectSystem, this.arenaWidth, this.arenaHeight, this.arenaX, this.arenaY, this.fightersRight);
      });
      this.fightersRight.forEach(f => {
        f.update(dt, this.weaponSystem, this.effectSystem, this.arenaWidth, this.arenaHeight, this.arenaX, this.arenaY, this.fightersLeft);
      });

      // Resolve collision between all active fighters
      this.resolveFighterCollision();

      // Update projectiles / melee hits
      const allFighters = [...this.fightersLeft, ...this.fightersRight];
      const hits = this.weaponSystem.update(dt, allFighters);

      // Process hits
      if (hits && hits.length > 0) {
        for (const hit of hits) {
          if (hit.target && hit.target.isAlive()) {
            hit.target.takeDamage(hit.damage, hit.projectile ? hit.projectile.x : hit.target.x, hit.projectile ? hit.projectile.y : hit.target.y, this.effectSystem);

            // Handle special train projectile stun
            if (hit.projectile && hit.projectile.type === 'train') {
              hit.target.applyStun(1.8);
              this.effectSystem.addSkillEffect('stun', hit.target.x, hit.target.y, '#FFD700', 30);
            }

            // Handle special bat projectile lifesteal (100% siphon)
            if (hit.projectile && hit.projectile.type === 'bat') {
              const attacker = hit.projectile.attacker;
              if (attacker && attacker.isAlive()) {
                attacker.heal(hit.damage * 1.0, this.effectSystem);
              }
            }

            // Lifesteal – heal attacker
            const attacker = hit.projectile ? hit.projectile.attacker : null;
            if (attacker && attacker.isAlive() && attacker.charData.lifesteal && attacker.charData.lifesteal > 0) {
              if (hit.projectile && hit.projectile.type === 'bat') {
                // Already siphoned 100%
              } else {
                const healAmt = hit.damage * attacker.charData.lifesteal;
                if (healAmt > 0) {
                  attacker.heal(healAmt, this.effectSystem);
                }
              }
            }
          }
        }
      }

      // Update effects
      this.effectSystem.update(dt);

      // Check death
      const leftAlive = this.fightersLeft.some(f => f.isAlive());
      const rightAlive = this.fightersRight.some(f => f.isAlive());

      if (!leftAlive || !rightAlive) {
        this.state = 'finished';
        if (!leftAlive && !rightAlive) {
          this.winner = null; // draw
        } else {
          this.winner = leftAlive ? 'left' : 'right';
        }
      }

      this.battleTime += dt;

      // No battle time limit; battles go on until one side is defeated
      return;
    }

    if (this.state === 'finished') {
      // Let remaining effects play out
      this.effectSystem.update(dt);
    }
  }

  resolveFighterCollision() {
    const allFighters = [...this.fightersLeft, ...this.fightersRight].filter(f => f.isAlive());
    if (allFighters.length < 2) return;

    for (let i = 0; i < allFighters.length; i++) {
      for (let j = i + 1; j < allFighters.length; j++) {
        const f1 = allFighters[i];
        const f2 = allFighters[j];

        const dx = f2.x - f1.x;
        const dy = f2.y - f1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Combined radius * 0.75 to allow close combat but prevent overlapping
        const minDist = (f1.charData.size + f2.charData.size) * 0.75;

        if (isFinite(dist) && dist < minDist) {
          const overlap = minDist - dist;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          // Push them apart by half the overlap each
          const pushDist = overlap / 2;
          
          if (isFinite(pushDist) && isFinite(nx) && isFinite(ny)) {
            const nextF1X = f1.x - nx * pushDist;
            const nextF1Y = f1.y - ny * pushDist;
            const nextF2X = f2.x + nx * pushDist;
            const nextF2Y = f2.y + ny * pushDist;

            if (isFinite(nextF1X)) f1.x = nextF1X;
            if (isFinite(nextF1Y)) f1.y = nextF1Y;
            if (isFinite(nextF2X)) f2.x = nextF2X;
            if (isFinite(nextF2Y)) f2.y = nextF2Y;
          }
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

    // ── Countdown ──
    if (this.state === 'countdown') {
      this._drawCountdown(ctx);
    }

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
