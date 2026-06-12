/**
 * FighterRenderer - Handles all canvas rendering for a Fighter.
 *
 * Extracted from fighter.js to keep rendering logic separate from game logic.
 * All methods are static — they read Fighter state but never mutate it.
 */
export class FighterRenderer {
  /**
   * Render the fighter on the canvas.
   * @param {Fighter} f - The fighter to render
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} time - Elapsed time in seconds (for animations)
   */
  static render(f, ctx, time) {
    if (f.state === 'dead' && !f.alive) return;

    ctx.save();

    // ── Foot ground indicator ring (for team color) ──
    const teamColor = f.team === 'left' ? '#00E5FF' : '#FF3D00';

    ctx.save();
    // Solid base
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.charData.size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Thick glowing border
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = teamColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.charData.size * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // ── Body circle with glow ──
    ctx.shadowColor = f.charData.glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.charData.size, 0, Math.PI * 2);
    ctx.fillStyle = f.charData.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Body border
    ctx.strokeStyle = f.charData.secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render Blood Shield Bubble
    if (f.bloodShield > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.85)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 8;
      ctx.setLineDash([4, 2]); // dotted shield line
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.charData.size * 1.25 + Math.sin(time * 10) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Hit flash (white overlay) ──
    if (f.hitFlashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = f.hitFlashTimer / 0.15;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.charData.size, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();
    }

    // ── Debuff overlays (slow / poison / burn / stun) ──
    f.buffs.render(ctx, time);

    // ── Character decorations ──
    if (typeof f.charData.drawDecorations === 'function') {
      f.charData.drawDecorations(ctx, f.x, f.y, f.angle, f.charData.size, time);
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
    ctx.fillText(Math.ceil(f.hp), f.x, f.y);
    ctx.restore();

    // ── Charge glow ring (during charge state) ──
    if (f.state === 'charge') {
      var chargeProgress = f.stateTimer / f.charData.chargeTime;
      var ringRadius = f.charData.size + 5 + chargeProgress * 10;

      ctx.save();
      ctx.globalAlpha = 0.3 + chargeProgress * 0.3;
      ctx.beginPath();
      ctx.arc(f.x, f.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = f.charData.color;
      ctx.lineWidth = 2 + chargeProgress * 2;
      ctx.stroke();
      ctx.restore();
    }

    // ── Clone rendering (ninja) ──
    if (f.clones.length > 0 && f.cloneTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.4;

      for (var i = 0; i < f.clones.length; i++) {
        var clone = f.clones[i];

        // Clone body
        ctx.beginPath();
        ctx.arc(clone.x, clone.y, f.charData.size, 0, Math.PI * 2);
        ctx.fillStyle = f.charData.color;
        ctx.fill();
        ctx.strokeStyle = f.charData.secondaryColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Clone decorations
        f.charData.drawDecorations(ctx, clone.x, clone.y, f.angle, f.charData.size, time);
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
