import { BaseProjectile } from './BaseProjectile.js';

export class TimeBoltProjectile extends BaseProjectile {
  render(ctx) {
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = '#F17105';
    ctx.shadowBlur = 7;

    // Draw clock hand arrow pointing forward (+X direction)
    ctx.fillStyle = '#E6C229'; // brass gold
    ctx.strokeStyle = '#F17105'; // glowing orange
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(this.size * 1.8, 0); // Tip
    ctx.lineTo(-this.size * 0.4, -this.size * 0.65); // base left
    ctx.lineTo(-this.size * 0.1, 0); // inner base indent
    ctx.lineTo(-this.size * 0.4, this.size * 0.65); // base right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center circular pivot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-this.size * 0.1, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Golden trail line stretching back (-X direction)
    ctx.strokeStyle = 'rgba(230, 194, 41, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.3, 0);
    ctx.lineTo(-this.size * 2.2, 0);
    ctx.stroke();

    ctx.restore();
  }
}
