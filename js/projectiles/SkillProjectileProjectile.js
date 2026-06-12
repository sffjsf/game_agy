import { BaseProjectile } from './BaseProjectile.js';

export class SkillProjectileProjectile extends BaseProjectile {
  render(ctx) {
ctx.translate(this.x, this.y);
            var pulse = 1.0 + Math.sin(this.rotation * 4) * 0.15;
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 2.5 * pulse, 0, Math.PI * 2);
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1.0;
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.6 * pulse, 0, Math.PI * 2);
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.globalAlpha = 1.0;
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
    
            
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
  }
}
