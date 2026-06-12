import { soundSystem } from '../audio.js';

export class BaseProjectile {
  constructor(x, y, vx, vy, damage, ownerId, color, size, type) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.ownerId = ownerId;
    this.color = color;
    this.size = size;
    this.type = type;
    this.lifetime = 2.0;
    this.rotation = 0;
    this.hit = false;
    this.hitFighters = [];
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;
  }

  render(ctx) {
    ctx.save();
    // Default drawing (a glowing circle)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  isExpired() {
    return this.lifetime <= 0;
  }

  getBounds() {
    return { x: this.x, y: this.y, radius: this.size };
  }
}
