export class CombatRenderer {
  constructor(canvas, getRenderState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.getRenderState = getRenderState;
  }

  render() {
    const state = this.getRenderState();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    const shake = state.effectSystem.getShakeOffset();
    if (shake.x || shake.y) {
      ctx.translate(shake.x, shake.y);
    }

    this.drawArena(ctx, state.arena);

    if (state.battleState === 'countdown' || state.battleState === 'fighting' || state.battleState === 'finished') {
      const time = performance.now() / 1000;
      this.drawPoisonZones(ctx, state.hazards.poisonZones, time);
      this.drawBurnZones(ctx, state.hazards.burnZones, time);
      this.drawTemporalFields(ctx, state.hazards.temporalFields, time);
      this.drawSwordArrays(ctx, state.hazards.swordArrays, time);
      this.drawFrostLands(ctx, state.hazards.frostLands, time);

      state.fightersLeft.forEach(f => f.render(ctx, time));
      state.fightersRight.forEach(f => f.render(ctx, time));
      state.weaponSystem.render(ctx);
      state.effectSystem.render(ctx);
    }

    ctx.restore();
  }

  drawArena(ctx, arena) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(arena.x, arena.y, arena.width, arena.height);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(arena.x, arena.y, arena.width, arena.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let gx = arena.x + gridStep; gx < arena.x + arena.width; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, arena.y);
      ctx.lineTo(gx, arena.y + arena.height);
      ctx.stroke();
    }
    for (let gy = arena.y + gridStep; gy < arena.y + arena.height; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(arena.x, gy);
      ctx.lineTo(arena.x + arena.width, gy);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,215,0,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    const cx = arena.x + arena.width / 2;
    ctx.beginPath();
    ctx.moveTo(cx, arena.y);
    ctx.lineTo(cx, arena.y + arena.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawPoisonZones(ctx, poisonZones, time) {
    if (!poisonZones || poisonZones.length === 0) return;

    poisonZones.forEach(zone => {
      ctx.save();
      const grad = ctx.createRadialGradient(zone.x, zone.y, 2, zone.x, zone.y, zone.radius);
      grad.addColorStop(0, 'rgba(76, 175, 80, 0.25)');
      grad.addColorStop(0.6, 'rgba(156, 39, 176, 0.12)');
      grad.addColorStop(1, 'rgba(156, 39, 176, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(76, 175, 80, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius * (0.95 + Math.sin(time * 3 + zone.x) * 0.03), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  drawBurnZones(ctx, burnZones, time) {
    if (!burnZones || burnZones.length === 0) return;

    burnZones.forEach(zone => {
      ctx.save();
      const pulseRadius = zone.radius * (0.95 + Math.sin(time * 8 + zone.x * zone.y) * 0.05);

      const grad = ctx.createRadialGradient(zone.x, zone.y, 2, zone.x, zone.y, pulseRadius);
      grad.addColorStop(0, 'rgba(255, 110, 0, 0.35)');
      grad.addColorStop(0.5, 'rgba(255, 61, 0, 0.18)');
      grad.addColorStop(0.8, 'rgba(230, 81, 0, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 61, 0, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  drawTemporalFields(ctx, temporalFields, time) {
    if (!temporalFields || temporalFields.length === 0) return;

    temporalFields.forEach(zone => {
      ctx.save();

      // 1. Draw a golden glowing radial gradient base
      const grad = ctx.createRadialGradient(zone.x, zone.y, 2, zone.x, zone.y, zone.radius);
      grad.addColorStop(0, 'rgba(230, 194, 41, 0.22)');
      grad.addColorStop(0.5, 'rgba(241, 113, 5, 0.12)');
      grad.addColorStop(0.85, 'rgba(230, 194, 41, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw the outer ticking dial border
      ctx.strokeStyle = 'rgba(230, 194, 41, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Draw tick marks around the border (clock dial)
      ctx.strokeStyle = 'rgba(230, 194, 41, 0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const startDist = zone.radius - 8;
        const endDist = zone.radius;
        ctx.beginPath();
        ctx.moveTo(zone.x + Math.cos(angle) * startDist, zone.y + Math.sin(angle) * startDist);
        ctx.lineTo(zone.x + Math.cos(angle) * endDist, zone.y + Math.sin(angle) * endDist);
        ctx.stroke();
      }

      // 4. Draw rotating gear shape in the background
      ctx.strokeStyle = 'rgba(241, 113, 5, 0.15)';
      ctx.lineWidth = 2;
      const gearRadius = zone.radius * 0.6;
      const teethCount = 8;
      const rotation = time * 0.4; // Rotate gear slowly
      ctx.beginPath();
      for (let i = 0; i < teethCount * 2; i++) {
        const angle = rotation + (i * Math.PI) / teethCount;
        const r = (i % 2 === 0) ? gearRadius + 10 : gearRadius - 5;
        const px = zone.x + Math.cos(angle) * r;
        const py = zone.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // 5. Draw ticking clock hands (Hour, Minute)
      // Hour hand (slow rotation)
      const hourAngle = time * 0.2;
      ctx.strokeStyle = 'rgba(230, 194, 41, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(zone.x, zone.y);
      ctx.lineTo(zone.x + Math.cos(hourAngle) * (zone.radius * 0.4), zone.y + Math.sin(hourAngle) * (zone.radius * 0.4));
      ctx.stroke();

      // Minute hand (faster rotation)
      const minuteAngle = time * 1.5;
      ctx.strokeStyle = 'rgba(230, 194, 41, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(zone.x, zone.y);
      ctx.lineTo(zone.x + Math.cos(minuteAngle) * (zone.radius * 0.75), zone.y + Math.sin(minuteAngle) * (zone.radius * 0.75));
      ctx.stroke();

      // Clock center pivot
      ctx.fillStyle = '#E6C229';
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  drawSwordArrays(ctx, swordArrays, time) {
    if (!swordArrays || swordArrays.length === 0) return;

    swordArrays.forEach(array => {
      // 1. Draw rotating Taiji (Yin-Yang) central symbol
      ctx.save();
      ctx.translate(array.x, array.y);
      ctx.rotate(time * 0.5); // rotate slowly

      // Draw outer circle
      ctx.fillStyle = 'rgba(255, 235, 59, 0.03)';
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.18)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, array.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const r = array.radius * 0.45; // size of the Taiji central motif

      // Yin half (light gold)
      ctx.fillStyle = 'rgba(255, 215, 0, 0.07)';
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Yang half (transparent)
      ctx.fillStyle = 'rgba(255, 235, 59, 0.02)';
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2);
      ctx.fill();

      // Small s-curve circles
      ctx.fillStyle = 'rgba(255, 215, 0, 0.07)';
      ctx.beginPath();
      ctx.arc(0, r / 2, r / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 235, 59, 0.02)';
      ctx.beginPath();
      ctx.arc(0, -r / 2, r / 2, 0, Math.PI * 2);
      ctx.fill();

      // Small dots
      ctx.fillStyle = 'rgba(255, 235, 59, 0.02)';
      ctx.beginPath();
      ctx.arc(0, r / 2, r / 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 215, 0, 0.07)';
      ctx.beginPath();
      ctx.arc(0, -r / 2, r / 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 2. Draw outer Bagua (Eight Trigrams) octagonal markers
      ctx.save();
      ctx.translate(array.x, array.y);
      ctx.rotate(-time * 0.3); // opposite rotation
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.16)';
      ctx.lineWidth = 2;

      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        // Inner trigram bar
        ctx.moveTo(array.radius - 22, -12);
        ctx.lineTo(array.radius - 22, 12);
        // Outer trigram bar
        ctx.moveTo(array.radius - 12, -8);
        ctx.lineTo(array.radius - 12, 8);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Draw falling sword rain particle indicators
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 235, 59, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 6;

      for (let s = 0; s < 5; s++) {
        const seed = (Math.floor(time * 24) + s * 137) % 200;
        // Pseudo-random offset based on seed
        const randX = array.x + Math.sin(seed * 7.7) * (array.radius * 0.75);
        const randY = array.y + Math.cos(seed * 3.3) * (array.radius * 0.75);
        const progress = (time * 2.8 + s * 0.2) % 1.0;
        const sy = randY - 70 + progress * 70;

        ctx.beginPath();
        ctx.moveTo(randX, sy - 14);
        ctx.lineTo(randX, sy);
        ctx.stroke();

        // Crossguard
        ctx.beginPath();
        ctx.moveTo(randX - 3, sy - 4);
        ctx.lineTo(randX + 3, sy - 4);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Draw central condensing Xuanyuan Giant Sword during the last 1.0 second
      if (array.duration <= 1.0) {
        const chargeProgress = 1 - array.duration; // 0 to 1
        ctx.save();
        ctx.translate(array.x, array.y - 100 * (1 - chargeProgress));
        ctx.globalAlpha = chargeProgress * 0.85;

        ctx.fillStyle = '#FFFDE7';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;

        // Giant Blade pointing straight down (+Y)
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(0, 90); // tip
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crossguard and Hilt
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-22, -6, 44, 6);
        ctx.fillRect(-5, -30, 10, 24);

        ctx.restore();
      }
    });
  }

  drawFrostLands(ctx, frostLands, time) {
    if (!frostLands || frostLands.length === 0) return;

    frostLands.forEach(land => {
      ctx.save();
      ctx.translate(land.x, land.y);

      ctx.fillStyle = 'rgba(129, 212, 250, 0.08)';
      ctx.strokeStyle = 'rgba(179, 229, 252, 0.72)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, land.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.rotate(time * 5);
      ctx.strokeStyle = 'rgba(225, 245, 254, 0.55)';
      ctx.shadowColor = '#81D4FA';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 5;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(land.radius * 0.82, 0);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(179, 229, 252, 0.22)';
      ctx.lineWidth = 2;
      for (let r = 0.35; r <= 0.85; r += 0.25) {
        ctx.beginPath();
        ctx.arc(0, 0, land.radius * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }
}
