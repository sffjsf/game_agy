import { BaseProjectile } from './BaseProjectile.js';

export class SwordWaveProjectile extends BaseProjectile {
  render(ctx) {
    const travelAngle = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    ctx.rotate(travelAngle);

    // Draw a beautiful golden crescent wave
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 2.5, -Math.PI / 2.8, Math.PI / 2.8);
    ctx.strokeStyle = this.color || '#FFF9C4';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.stroke();
    
    // Draw an inner white wave for intense core glow
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 2.5, -Math.PI / 4, Math.PI / 4);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }
}
