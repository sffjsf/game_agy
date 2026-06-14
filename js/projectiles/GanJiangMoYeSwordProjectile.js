import { BaseProjectile } from './BaseProjectile.js';

export class GanJiangMoYeSwordProjectile extends BaseProjectile {
  constructor(x, y, vx, vy, damage, ownerId, color, size, type) {
    super(x, y, vx, vy, damage, ownerId, color, size, type);
    this.piercing = true;
    this.lifetime = 2.8;
    this.curveTimer = 0.26;
    this.curveSign = 1;
    this.homingSpeed = 820;
    this.turnRate = 0.28;
    this.swordName = 'ultimate';
    this.batchId = null;
    this.markOnHit = true;
    this.basicSword = false;
    this.ultimateSword = false;
    this.giantScale = 3.0;
    this.preferredTarget = null;
    this.arenaBounds = null;
  }

  update(dt) {
    const target = this.findTarget();
    if (target) {
      const tx = target.x - this.x;
      const ty = target.y - this.y;
      const dist = Math.sqrt(tx * tx + ty * ty);
      if (isFinite(dist) && dist > 1) {
        const baseAngle = Math.atan2(ty, tx);
        const curveAmount = this.curveTimer > 0 ? (35 * Math.PI / 180) * (this.curveTimer / 0.26) * this.curveSign : 0;
        const desiredAngle = baseAngle + curveAmount;
        const targetVx = Math.cos(desiredAngle) * this.homingSpeed;
        const targetVy = Math.sin(desiredAngle) * this.homingSpeed;
        this.vx = this.vx * (1 - this.turnRate) + targetVx * this.turnRate;
        this.vy = this.vy * (1 - this.turnRate) + targetVy * this.turnRate;
      }
    }

    this.curveTimer = Math.max(0, this.curveTimer - dt);
    super.update(dt);
  }

  findTarget() {
    if (this.hitFighters && this.hitFighters.length > 0) {
      return null;
    }

    if (this.preferredTarget && this.preferredTarget.isAlive && this.preferredTarget.isAlive()) {
      return this.preferredTarget;
    }

    const opposingTeam = this.opposingTeam;
    if (!opposingTeam) return null;

    let target = null;
    let minDist = Infinity;
    opposingTeam.forEach(enemy => {
      if (!enemy.isAlive() || enemy.invisibleTimer > 0) return;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    });
    return target;
  }

  isExpired() {
    if (super.isExpired()) return true;
    if (!this.arenaBounds) return false;
    const margin = 80;
    return this.x < this.arenaBounds.x - margin ||
      this.x > this.arenaBounds.x + this.arenaBounds.width + margin ||
      this.y < this.arenaBounds.y - margin ||
      this.y > this.arenaBounds.y + this.arenaBounds.height + margin;
  }

  render(ctx) {
    const travelAngle = Math.atan2(this.vy, this.vx);
    const isGanJiang = this.swordName === 'ganjiang';
    const isMoYe = this.swordName === 'moye';
    const bladeColor = isGanJiang ? '#FFCDD2' : (isMoYe ? '#BBDEFB' : '#E1BEE7');
    const edgeColor = isGanJiang ? '#F44336' : (isMoYe ? '#2196F3' : '#E040FB');
    const hiltColor = isGanJiang ? '#B71C1C' : (isMoYe ? '#0D47A1' : '#4A148C');
    const scale = this.giantScale || 3;

    ctx.translate(this.x, this.y);
    ctx.rotate(travelAngle);
    ctx.scale(scale, scale);

    ctx.shadowColor = edgeColor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = bladeColor;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(this.size * 2.9, 0);
    ctx.lineTo(this.size * 0.55, -this.size * 0.42);
    ctx.lineTo(-this.size * 0.7, -this.size * 0.15);
    ctx.lineTo(-this.size * 0.7, this.size * 0.15);
    ctx.lineTo(this.size * 0.55, this.size * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hiltColor;
    ctx.fillRect(-this.size * 1.05, -this.size * 0.35, this.size * 0.22, this.size * 0.7);
    ctx.fillRect(-this.size * 1.45, -this.size * 0.08, this.size * 0.42, this.size * 0.16);

    ctx.font = `bold ${Math.max(7, this.size * 0.42)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = edgeColor;
    const label = isGanJiang ? '干' : (isMoYe ? '莫' : '剑');
    ctx.fillText(label, this.size * 0.25, 0);
  }
}
