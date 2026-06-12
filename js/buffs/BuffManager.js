import * as EffectLib from '../effects_lib/index.js';
import { safeFinite } from '../utils.js';

/**
 * BuffManager — owns all debuff / DoT state for one Fighter.
 *
 * Extracted from Fighter to reduce its line count.
 * Fighter delegates timer ticks, application, and rendering here.
 */
export class BuffManager {
  /**
   * @param {import('../fighter.js').Fighter} fighter
   */
  constructor(fighter) {
    this.fighter = fighter;

    /** Stun duration remaining (seconds) */
    this.stun = 0;
    /** Slow duration remaining (seconds) */
    this.slow = 0;
    /** Poison duration remaining (seconds) */
    this.poison = 0;
    /** Poison damage per second */
    this.poisonDps = 0;
    /** Poison visual-tick accumulator */
    this.poisonTick = 0;
    /** Poison trail cooldown (poisoner passive) */
    this.poisonTrail = 0;
    /** Burn duration remaining (seconds) */
    this.burn = 0;
    /** Burn damage per second */
    this.burnDps = 0;
    /** Burn DoT tick accumulator */
    this.burnTick = 0;
  }

  // ═══════════════════════════════════════════════════════
  //  Public queries
  // ═══════════════════════════════════════════════════════

  isStunned()  { return this.stun > 0; }
  isSlowed()   { return this.slow > 0; }
  isPoisoned() { return this.poison > 0; }
  isBurning()  { return this.burn > 0; }

  /** Attack-speed multiplier when slowed. */
  slowAttackRate() { return this.slow > 0 ? 0.6 : 1.0; }
  /** Move-speed multiplier when slowed. */
  slowMoveRate()   { return this.slow > 0 ? 0.5 : 1.0; }

  // ═══════════════════════════════════════════════════════
  //  Apply debuffs (keep highest duration)
  // ═══════════════════════════════════════════════════════

  applyStun(duration)    { this.stun  = Math.max(this.stun, duration); }
  applySlow(duration)    { this.slow  = Math.max(this.slow, duration); }

  applyPoison(duration, dps) {
    this.poison    = Math.max(this.poison, duration);
    this.poisonDps = Math.max(this.poisonDps || 0, dps || 0);
  }

  applyBurn(duration, dps) {
    this.burn    = Math.max(this.burn, duration);
    this.burnDps = Math.max(this.burnDps || 0, dps || 0);
  }

  // ═══════════════════════════════════════════════════════
  //  Clear helpers (used by passives)
  // ═══════════════════════════════════════════════════════

  clearBurn() {
    this.burn     = 0;
    this.burnDps  = 0;
    this.burnTick = 0;
  }

  clearDebuffs() {
    this.stun = 0;
    this.slow = 0;
  }

  // ═══════════════════════════════════════════════════════
  //  Per-frame tick
  // ═══════════════════════════════════════════════════════

  /**
   * Tick all debuff timers and apply DoT damage.
   * @param {number} dt
   * @param {import('../effects.js').EffectSystem} effectSystem
   */
  update(dt, effectSystem) {
    this.stun = Math.max(0, this.stun - dt);
    this.slow = Math.max(0, this.slow - dt);
    this._tickPoison(dt, effectSystem);
    this._tickBurn(dt, effectSystem);
    this._tickPoisonTrail(dt, effectSystem);
  }

  /**
   * Clamp every timer to a safe finite value.
   */
  sanitise() {
    this.stun      = safeFinite(this.stun, 0);
    this.slow      = safeFinite(this.slow, 0);
    this.poison    = safeFinite(this.poison, 0);
    this.poisonDps = safeFinite(this.poisonDps, 0);
    this.burn      = safeFinite(this.burn, 0);
    this.burnDps   = safeFinite(this.burnDps, 0);
  }

  // ═══════════════════════════════════════════════════════
  //  Render debuff overlays
  // ═══════════════════════════════════════════════════════

  /**
   * Draw all debuff visuals (stun stars, slow tint, poison ring, burn ring).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} time
   */
  render(ctx, time) {
    const f = this.fighter;
    const { x, y } = f;
    const size = f.charData.size;

    this._renderSlow(ctx, x, y, size);
    this._renderPoison(ctx, time, x, y, size);
    this._renderBurn(ctx, time, x, y, size);
    this._renderStun(ctx, time, x, y, size);
  }

  // ── private tick helpers ──────────────────────────────

  _tickPoison(dt, effectSystem) {
    const f = this.fighter;
    if (this.poison <= 0 || !f.alive) return;

    this.poison = Math.max(0, this.poison - dt);
    this.poisonTick -= dt;
    if (this.poisonTick <= 0) {
      this.poisonTick = 0.5;
      effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 12, '中毒!', false, '#9C27B0');
      EffectLib.addPoisonCloudEffect(effectSystem, f.x, f.y, '#9C27B0', 28);
    }
    if (this.poison <= 0) this.poisonTick = 0;
  }

  _tickBurn(dt, effectSystem) {
    const f = this.fighter;
    if (this.burn <= 0 || this.burnDps <= 0 || !f.alive) return;

    this.burn = Math.max(0, this.burn - dt);
    this.burnTick -= dt;
    if (this.burnTick <= 0) {
      this.burnTick = 0.5;
      f.takeDamage(this.burnDps * 0.5, f.x, f.y, effectSystem);
      effectSystem.addDamageNumber(f.x, f.y - f.charData.size - 16, '着火', false, '#FFAB00');
      EffectLib.addFireBurstEffect(effectSystem, f.x, f.y, '#FF5722', 24);
    }
    if (this.burn <= 0) {
      this.burnDps  = 0;
      this.burnTick = 0;
    }
  }

  _tickPoisonTrail(dt, effectSystem) {
    const f = this.fighter;
    if (!f.hasPassive('poison_trail') || !f.alive || f.state === 'dead') return;
    if (!f._addPoisonZone) return;  // only active during fighting

    this.poisonTrail = Math.max(0, this.poisonTrail - dt);
    if (this.poisonTrail > 0) return;

    this.poisonTrail = 0.85;
    f._addPoisonZone(f.x, f.y, f.team, 56, 3.2, 3.0, 0.8);
    EffectLib.addPoisonCloudEffect(effectSystem, f.x, f.y, '#66BB6A', 42);
  }

  // ── private render helpers ────────────────────────────

  _renderSlow(ctx, x, y, size) {
    if (this.slow <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(x, y, size + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#42A5F5';
    ctx.fill();
    ctx.restore();
  }

  _renderPoison(ctx, time, x, y, size) {
    if (this.poison <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(time * 8) * 0.1;
    ctx.strokeStyle = '#76FF03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#76FF03';
    for (var p = 0; p < 3; p++) {
      var pa = time * 2 + p * Math.PI * 2 / 3;
      ctx.beginPath();
      ctx.arc(x + Math.cos(pa) * (size + 8), y + Math.sin(pa) * (size + 8), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _renderBurn(ctx, time, x, y, size) {
    if (this.burn <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.45 + Math.sin(time * 10) * 0.12;
    ctx.strokeStyle = '#FFAB00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#FF5722';
    for (var b = 0; b < 4; b++) {
      var ba = -time * 3 + b * Math.PI * 2 / 4;
      ctx.beginPath();
      ctx.arc(x + Math.cos(ba) * (size + 9), y + Math.sin(ba) * (size + 9), 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _renderStun(ctx, time, x, y, size) {
    if (this.stun <= 0) return;
    ctx.save();
    var starCount = 3;
    for (var i = 0; i < starCount; i++) {
      var starAngle = time * 4 + (i / starCount) * Math.PI * 2;
      var starX = x + Math.cos(starAngle) * 15;
      var starY = y - size - 12 + Math.sin(starAngle) * 5;

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
}
