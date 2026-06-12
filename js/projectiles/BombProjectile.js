import { BaseProjectile } from './BaseProjectile.js';

export class BombProjectile extends BaseProjectile {
  render(ctx) {
ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.25, 0, Math.PI * 2);
            ctx.fillStyle = '#2E1A12';
            ctx.fill();
            ctx.strokeStyle = '#FFAB40';
            ctx.lineWidth = 2;
            ctx.stroke();
    
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.45, -this.size * 0.8);
            ctx.quadraticCurveTo(-this.size * 0.8, -this.size * 1.2, -this.size * 0.25, -this.size * 1.35);
            ctx.strokeStyle = '#D7CCC8';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-this.size * 0.25, -this.size * 1.35, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD54F';
            ctx.fill();
  }
}
