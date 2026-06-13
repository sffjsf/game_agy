import { BaseProjectile } from './BaseProjectile.js';

export class FlyingSwordProjectile extends BaseProjectile {
  update(dt) {
    super.update(dt);
    
    // Homing behavior targeting the closest living enemy
    const opposingTeam = this.opposingTeam;
    if (opposingTeam) {
      let target = null;
      let minDist = Infinity;
      opposingTeam.forEach(enemy => {
        if (enemy.isAlive()) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) {
            minDist = d;
            target = enemy;
          }
        }
      });

      if (target) {
        const tx = target.x - this.x;
        const ty = target.y - this.y;
        const tdist = Math.sqrt(tx * tx + ty * ty);
        if (isFinite(tx) && isFinite(ty) && tdist > 1) {
          const homingSpeed = 750; // Fast and highly agile
          const targetVx = (tx / tdist) * homingSpeed;
          const targetVy = (ty / tdist) * homingSpeed;

          // Interpolate velocity for tight steering
          const turnRate = 0.35; 
          this.vx = this.vx * (1 - turnRate) + targetVx * turnRate;
          this.vy = this.vy * (1 - turnRate) + targetVy * turnRate;
        }
      }
    }
  }

  render(ctx) {
    const travelAngle = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    ctx.rotate(travelAngle);

    // Draw a small glowing golden sword pointing right (+X)
    ctx.fillStyle = '#FFF59D'; // Blade core
    ctx.strokeStyle = '#FFD700'; // Blade edge
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;

    // Blade
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(this.size * 2, 0); // Tip
    ctx.lineTo(0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Guard & Hilt
    ctx.fillStyle = '#FFB300';
    ctx.fillRect(-2, -4, 2, 8); // Guard
    ctx.fillRect(-6, -1, 4, 2); // Hilt
  }
}
