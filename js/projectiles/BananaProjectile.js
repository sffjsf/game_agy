import { BaseProjectile } from './BaseProjectile.js';

export class BananaProjectile extends BaseProjectile {
  render(ctx) {
ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.2, -Math.PI * 0.7, Math.PI * 0.3, false);
            ctx.strokeStyle = '#FDD835';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.stroke();
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.2, -Math.PI * 0.7, Math.PI * 0.3, false);
            ctx.strokeStyle = '#F9A825';
            ctx.lineWidth = 2;
            ctx.stroke();
    
            
            var tipAngle1 = -Math.PI * 0.7;
            var tipAngle2 = Math.PI * 0.3;
            ctx.beginPath();
            ctx.arc(
              Math.cos(tipAngle1) * this.size * 1.2,
              Math.sin(tipAngle1) * this.size * 1.2,
              2, 0, Math.PI * 2
            );
            ctx.fillStyle = '#8D6E63';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(
              Math.cos(tipAngle2) * this.size * 1.2,
              Math.sin(tipAngle2) * this.size * 1.2,
              2, 0, Math.PI * 2
            );
            ctx.fill();
  }
}
