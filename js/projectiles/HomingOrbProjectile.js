import { BaseProjectile } from './BaseProjectile.js';

export class HomingOrbProjectile extends BaseProjectile {
  update(dt) {
    super.update(dt);
if (this.attacker.combatManager) {
            var opposingTeam = (this.ownerId === 'left') ? this.attacker.combatManager.fightersRight : this.attacker.combatManager.fightersLeft;
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
          }
          if (this.type === 'bat') {
            this.rotation = Math.sin(this.lifetime * 25) * 0.4;
          }
    
  }
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
