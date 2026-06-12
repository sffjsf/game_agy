import { BaseProjectile } from './BaseProjectile.js';
import { soundSystem } from '../audio.js';

export class LaserProjectile extends BaseProjectile {
  constructor(x, y, vx, vy, damage, ownerId, color, size, type, attacker) {
    super(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    this.maxLife = 0.5; // Lasts 0.5 seconds
    this.life = 0;
    // Laser does not actually move, it just stretches across the screen from the attacker's position
    // Wait, if it's a projectile, it can move really fast.
    // Let's make it an incredibly fast projectile.
    this.hitFighters = []; // For piercing logic
  }

  update(dt) {
    super.update(dt);
    this.life += dt;
    if (this.life > this.maxLife) {
      this.hit = true;
    }
  }

  render(ctx) {
    var travelAngle = Math.atan2(this.vy, this.vx);
    if (isNaN(travelAngle) || !isFinite(travelAngle)) travelAngle = 0;

    ctx.translate(this.x, this.y);
    ctx.rotate(travelAngle);

    // Fade out over its life
    var alpha = Math.max(0, 1 - (this.life / this.maxLife));
    ctx.globalAlpha = alpha;

    // The laser is a long glowing line
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(40, 0);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(60, 0);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-80, 0);
    ctx.lineTo(80, 0);
    ctx.strokeStyle = this.color + '66';
    ctx.lineWidth = 24;
    ctx.stroke();
  }
}
