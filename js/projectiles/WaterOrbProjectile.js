import { BaseProjectile } from './BaseProjectile.js';

export class WaterOrbProjectile extends BaseProjectile {
  render(ctx) {
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Glowing outer water ring
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#80DEEA';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.stroke();

    // Radial gradient fill for water orb
    var grad = ctx.createRadialGradient(-this.size * 0.25, -this.size * 0.25, 1, 0, 0, this.size);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, '#E0F7FA');
    grad.addColorStop(0.8, '#00E5FF');
    grad.addColorStop(1, '#00838F');
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    ctx.arc(0, 0, this.size - 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Highlight sheen (tiny white arc)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-this.size * 0.35, -this.size * 0.35, this.size * 0.45, Math.PI * 0.9, Math.PI * 1.6);
    ctx.stroke();
    
    ctx.restore();
  }
}
