import { BaseProjectile } from './BaseProjectile.js';

export class ArrowProjectile extends BaseProjectile {
  render(ctx) {
var travelAngle = Math.atan2(this.vy, this.vx);
            if (isNaN(travelAngle) || !isFinite(travelAngle)) travelAngle = 0;
            ctx.translate(this.x, this.y);
            ctx.rotate(travelAngle);
    
            
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(6, 0);
            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 2;
            ctx.stroke();
    
            
            ctx.beginPath();
            ctx.moveTo(10, 0);        
            ctx.lineTo(4, -3);        
            ctx.lineTo(4, 3);         
            ctx.closePath();
            ctx.fillStyle = '#9E9E9E';
            ctx.fill();
            ctx.strokeStyle = '#616161';
            ctx.lineWidth = 0.5;
            ctx.stroke();
    
            
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-8, -3);
            ctx.moveTo(-10, 0);
            ctx.lineTo(-8, 3);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
  }
}
