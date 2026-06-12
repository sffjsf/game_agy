import { BaseProjectile } from './BaseProjectile.js';

export class TrainProjectile extends BaseProjectile {
  render(ctx) {
var travelAngle = Math.atan2(this.vy, this.vx);
            if (isNaN(travelAngle) || !isFinite(travelAngle)) travelAngle = 0;
            ctx.translate(this.x, this.y);
            ctx.rotate(travelAngle);
    
            
            ctx.save();
            ctx.globalAlpha = 0.35 + Math.sin(this.lifetime * 20) * 0.1;
            ctx.fillStyle = 'rgba(240, 240, 240, 0.7)';
            ctx.beginPath();
            ctx.arc(-2, -32, 11, 0, Math.PI * 2);
            ctx.arc(-18, -38, 15, 0, Math.PI * 2);
            ctx.arc(-38, -44, 19, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
    
            
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-20, 0); 
            ctx.lineTo(-34, 0);
            ctx.moveTo(-64, 0); 
            ctx.lineTo(-78, 0);
            ctx.stroke();
    
            
            ctx.fillStyle = '#1A237E';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.rect(-108, -15, 30, 30);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#FFEB3B';
            ctx.fillRect(-102, -10, 8, 8);
            ctx.fillRect(-90, -10, 8, 8);
            
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.arc(-100, 16, 5, 0, Math.PI * 2);
            ctx.arc(-86, 16, 5, 0, Math.PI * 2);
            ctx.arc(-100, -16, 5, 0, Math.PI * 2);
            ctx.arc(-86, -16, 5, 0, Math.PI * 2);
            ctx.fill();
    
            
            ctx.fillStyle = '#1A237E';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.rect(-64, -15, 30, 30);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#FFEB3B';
            ctx.fillRect(-58, -10, 8, 8);
            ctx.fillRect(-46, -10, 8, 8);
            
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.arc(-56, 16, 5, 0, Math.PI * 2);
            ctx.arc(-42, 16, 5, 0, Math.PI * 2);
            ctx.arc(-56, -16, 5, 0, Math.PI * 2);
            ctx.arc(-42, -16, 5, 0, Math.PI * 2);
            ctx.fill();
    
            
            
            ctx.fillStyle = '#0D47A1';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(-20, -18, 44, 36);
            ctx.fill();
            ctx.stroke();
    
            
            ctx.fillStyle = '#0D47A1';
            ctx.beginPath();
            ctx.rect(-20, -24, 18, 6);
            ctx.fill();
            ctx.stroke();
    
            
            ctx.fillStyle = '#FFEB3B';
            ctx.fillRect(-16, -12, 10, 12);
    
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(24, -12);
            ctx.lineTo(34, 0);
            ctx.lineTo(24, 12);
            ctx.closePath();
            ctx.fill();
    
            
            ctx.fillStyle = '#1A237E';
            ctx.beginPath();
            ctx.rect(10, -26, 8, 8);
            ctx.fill();
            ctx.stroke();
    
            
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.arc(-10, 18, 7, 0, Math.PI * 2);
            ctx.arc(12, 18, 7, 0, Math.PI * 2);
            ctx.arc(-10, -18, 7, 0, Math.PI * 2);
            ctx.arc(12, -18, 7, 0, Math.PI * 2);
            ctx.fill();
  }
}
