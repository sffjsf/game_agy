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
}
