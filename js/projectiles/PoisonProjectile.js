import { BaseProjectile } from './BaseProjectile.js';

export class PoisonProjectile extends BaseProjectile {
  render(ctx) {
ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.25, 0, Math.PI * 2);
            ctx.fillStyle = '#1B5E20';
            ctx.fill();
            ctx.strokeStyle = '#76FF03';
            ctx.lineWidth = 2;
            ctx.stroke();
    
            ctx.fillStyle = '#76FF03';
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(-2, -2, this.size * 0.45, 0, Math.PI * 2);
            ctx.arc(4, 3, this.size * 0.28, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
  }
}
