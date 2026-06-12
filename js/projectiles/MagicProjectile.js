import { BaseProjectile } from './BaseProjectile.js';

export class MagicProjectile extends BaseProjectile {
  render(ctx) {
ctx.translate(this.x, this.y);
            var pulse = 1.0 + Math.sin(this.rotation * 3) * 0.2;
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.8 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace(')', ', 0.15)').replace('rgb', 'rgba');
            
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1.0;
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.3 * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
  }
}
