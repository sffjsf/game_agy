import { BaseProjectile } from './BaseProjectile.js';

export class ShurikenProjectile extends BaseProjectile {
  render(ctx) {
ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
    
            var points = 4;
            var outerR = this.size * 1.4;
            var innerR = this.size * 0.5;
    
            ctx.beginPath();
            for (var i = 0; i < points * 2; i++) {
              var r = (i % 2 === 0) ? outerR : innerR;
              var a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
              if (i === 0) {
                ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
              } else {
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
              }
            }
            ctx.closePath();
            ctx.fillStyle = '#546E7A';
            ctx.fill();
            ctx.strokeStyle = '#B0BEC5';
            ctx.lineWidth = 0.8;
            ctx.stroke();
    
            
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#263238';
            ctx.fill();
  }
}
