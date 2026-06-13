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

    // Invisibility shroud (stealth alpha)
    if (f.invisibleTimer > 0) {
      ctx.globalAlpha = 0.20;
    }

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

    // If ascended/airborne (during ultimate), draw a hover shadow on the ground
    if (f.isAscended || f.celestialSwordsTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, f.charData.size * 0.9, f.charData.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Translate context vertically so everything else (body, hp, decorations, etc.) draws floating
      const hoverOffset = -50 - Math.sin(time * 6) * 5;
      ctx.translate(0, hoverOffset);
    }

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

    // Render Tide Shield Bubble
    if (f.tideShield > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(128, 222, 234, 0.8)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#80DEEA';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.charData.size * 1.35 + Math.sin(time * 6) * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Draw small bubbles on the water shield
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) {
        const bubbleAngle = time * 2.2 + i * (Math.PI / 2);
        const bx = f.x + Math.cos(bubbleAngle) * (f.charData.size * 1.35);
        const by = f.y + Math.sin(bubbleAngle) * (f.charData.size * 1.35);
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Render Frozen Ice Block
    if (f.freezeTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(time * 10) * 0.1;
      ctx.fillStyle = 'rgba(128, 222, 234, 0.4)';
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 10;
      
      const size = f.charData.size * 1.35;
      ctx.beginPath();
      ctx.roundRect(f.x - size, f.y - size, size * 2, size * 2, 8);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(f.x - size * 0.7, f.y - size * 0.7);
      ctx.lineTo(f.x - size * 0.2, f.y - size * 0.8);
      ctx.moveTo(f.x + size * 0.6, f.y + size * 0.5);
      ctx.lineTo(f.x + size * 0.3, f.y + size * 0.8);
      ctx.stroke();

      ctx.restore();
    }

    // Render Chronoshift Backwards Clock
    if (f.chronoshiftTimer > 0) {
      ctx.save();
      ctx.translate(f.x, f.y);
      
      ctx.strokeStyle = 'rgba(230, 194, 41, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#E6C229';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, f.charData.size * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(230, 194, 41, 0.6)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * (f.charData.size * 1.3), Math.sin(angle) * (f.charData.size * 1.3));
        ctx.lineTo(Math.cos(angle) * (f.charData.size * 1.5), Math.sin(angle) * (f.charData.size * 1.5));
        ctx.stroke();
      }

      const backRotation = -time * 10;
      ctx.strokeStyle = '#E6C229';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(backRotation) * (f.charData.size * 1.0), Math.sin(backRotation) * (f.charData.size * 1.0));
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(backRotation * 1.7) * (f.charData.size * 1.3), Math.sin(backRotation * 1.7) * (f.charData.size * 1.3));
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

    // ── Corrosion overlay (pulsing acid green dashed ring) ──
    if (f.corrosionTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.45 + Math.sin(time * 12) * 0.15;
      ctx.strokeStyle = '#76FF03';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#76FF03';
      ctx.shadowBlur = 8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.charData.size + 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Bleed overlay (dripping blood droplets) ──
    if (f.bleedTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#C2185B'; // Deep crimson pink
      const radius = f.charData.size;
      for (let d = 0; d < 3; d++) {
        const dropProgress = (time * 1.6 + d * 0.33) % 1.0;
        const angle = d * Math.PI * 2 / 3;
        const dx = Math.cos(angle) * radius;
        // drops fall downwards (+Y direction)
        const dy = Math.sin(angle) * radius + dropProgress * 14;

        ctx.beginPath();
        ctx.arc(f.x + dx, f.y + dy, 2.5 * (1 - dropProgress), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ── Character decorations ──
    if (typeof f.charData.drawDecorations === 'function') {
      f.charData.drawDecorations(ctx, f.x, f.y, f.angle, f.charData.size, time, f);
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

    // ── Blood rage aura (Berserker passive) ──
    if (f.hasPassive('blood_rage') && f.hp < f.maxHp) {
      const hpPercent = f.hp / f.maxHp;
      const rageIntensity = (1 - hpPercent) * 0.45; // stronger glow at lower HP
      const pulseSize = Math.sin(time * 8) * 3;

      ctx.save();
      ctx.globalAlpha = rageIntensity;
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 10 + rageIntensity * 8;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.charData.size + 6 + pulseSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Whirlwind spin visual (continuous rotating slashes) ──
    if (f.state === 'channeling' && f.channelTimer > 0) {
      var spinProgress = 1 - (f.channelTimer / (f.charData.skill.duration || 2.0));
      var spinAlpha = 0.5 + Math.sin(time * 12) * 0.15;

      ctx.save();
      // Rotating slash arcs
      for (var s = 0; s < 3; s++) {
        var slashAngle = f.angle + (s * Math.PI * 2 / 3) + time * 12;
        ctx.save();
        ctx.globalAlpha = spinAlpha * 0.7;
        ctx.strokeStyle = f.charData.secondaryColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = f.charData.secondaryColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.charData.size + 18,
                slashAngle - 0.6, slashAngle + 0.6);
        ctx.stroke();
        ctx.restore();
      }

      // Expanding ring pulsing outward
      ctx.globalAlpha = 0.25 + Math.sin(time * 15) * 0.1;
      ctx.strokeStyle = f.charData.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = f.charData.glowColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.charData.size + 22 + Math.sin(time * 10) * 5, 0, Math.PI * 2);
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
        f.charData.drawDecorations(ctx, clone.x, clone.y, f.angle, f.charData.size, time, clone);
      }

      ctx.restore();
    }

    // ── Render spawn name next to fighter during first 3 seconds ──
    const nameTimer = f.spawnNameTimer !== undefined ? f.spawnNameTimer : 3.0;
    if (nameTimer > 0 && !f.charData.hidden) {
      ctx.save();
      
      // Fade out in the last 1.2 seconds of the timer
      const alpha = Math.min(1.0, nameTimer / 1.2);
      ctx.globalAlpha = alpha;
      
      const nameText = (f.charData.isHero ? '⭐' : '') + (f.charData.nameCN || f.charData.name);
      ctx.font = "bold 30px 'Noto Sans SC', 'Outfit', sans-serif";
      
      const teamColor = f.team === 'left' ? '#00E5FF' : '#FF3D00';
      ctx.fillStyle = teamColor;
      
      // Shadow for high readability against grid background
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      if (f.team === 'left') {
        // Left team name on the right side (inner side)
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, f.x + f.charData.size + 32, f.y);
        
        // Draw team-colored circular indicator dot
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = teamColor;
        ctx.beginPath();
        ctx.arc(f.x + f.charData.size + 14, f.y, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Right team name on the left side (inner side)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, f.x - f.charData.size - 32, f.y);
        
        // Draw team-colored circular indicator dot
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = teamColor;
        ctx.beginPath();
        ctx.arc(f.x - f.charData.size - 14, f.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}
