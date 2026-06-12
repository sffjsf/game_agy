import { BaseProjectile } from './BaseProjectile.js';

export class BatProjectile extends BaseProjectile {
  update(dt) {
    super.update(dt);
    var opposingTeam = this.opposingTeam;
    if (opposingTeam) {
      var target = null;
      var minDist = Infinity;
      opposingTeam.forEach(enemy => {
        if (enemy.isAlive()) {
          var dx = enemy.x - this.x;
          var dy = enemy.y - this.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) {
            minDist = d;
            target = enemy;
          }
        }
      });

      if (target) {
        var tx = target.x - this.x;
        var ty = target.y - this.y;
        var tdist = Math.sqrt(tx * tx + ty * ty);
        if (!isFinite(tx) || !isFinite(ty) || !isFinite(tdist) || tdist < 1) {
          tx = (this.ownerId === 'left') ? 1 : -1;
          ty = 0;
          tdist = 1;
        }

        var homingSpeed = this.type === 'homing_orb' ? 550 : 380;
        var targetVx = (tx / tdist) * homingSpeed;
        var targetVy = (ty / tdist) * homingSpeed;

        // Interpolate velocity for smooth steering
        if (isFinite(targetVx) && isFinite(targetVy)) {
          var turnRate = this.type === 'homing_orb' ? 0.25 : 0.12;
          this.vx = this.vx * (1 - turnRate) + targetVx * turnRate;
          this.vy = this.vy * (1 - turnRate) + targetVy * turnRate;
        }
      }
    }
    if (this.type === 'bat') {
      this.rotation = Math.sin(this.lifetime * 25) * 0.4;
    }
  }
  render(ctx) {
var travelAngle = Math.atan2(this.vy, this.vx);
            if (isNaN(travelAngle) || !isFinite(travelAngle)) travelAngle = 0;
            ctx.translate(this.x, this.y);
            ctx.rotate(travelAngle);
    
            var flap = this.rotation; 
    
            
            ctx.fillStyle = '#1A0008';
            ctx.strokeStyle = '#FF1744';
            ctx.lineWidth = 1.2;
    
            
            ctx.save();
            ctx.rotate(-flap);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-12, -18, -18, -12);
            ctx.quadraticCurveTo(-10, -6, -4, -2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
    
            
            ctx.save();
            ctx.rotate(flap);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-12, 18, -18, 12);
            ctx.quadraticCurveTo(-10, 6, -4, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
    
            
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FF1744';
            ctx.shadowColor = '#FF1744';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
    
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(1, -2, 1.5, 1);
            ctx.fillRect(1, 1, 1.5, 1);
  }
}
