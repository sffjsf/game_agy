export const erlang_shen = {
  isHero: true,
  nameCN: '二郎神',
  color: '#90CAF9', // Heavenly blue
  secondaryColor: '#FFD700', // Gold trim
  glowColor: '#FFF176',
  weaponType: 'melee',
  movePattern: 'dash', // Aggressive dash
  attackPower: 20,
  attackSpeed: 1.0,
  attackRange: 90, // Longer melee reach for his lance
  chargeTime: 0.25,
  size: 34,
  projectileType: null,
  aiTendency: 'aggressive',
  hp: 120,
  maxHp: 120,
  speed: 3.8,
  lifesteal: 0,
  skill: {
    name: '放肆！啸天犬',
    type: 'summon_hound',
    cooldown: 6,
    range: 400,
    damage: 0,
    duration: 0,
    description: '召唤神兽啸天犬协助作战。啸天犬攻速极快，且其撕咬能大幅减速敌人。'
  },
  passives: [
    {
      type: 'heavenly_eye',
      name: '天眼',
      description: '每5秒自动向最远的敌人发射一道贯穿全场的毁灭激光，对沿途敌人造成真实伤害。'
    }
  ],
  drawDecorations: function(ctx, x, y, angle, size, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Three-Point Two-Edged Lance
    var lanceLength = size * 2.5;
    var lanceY = size * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, lanceY);
    ctx.lineTo(lanceLength, lanceY);
    ctx.strokeStyle = '#BDBDBD'; // Silver shaft
    ctx.lineWidth = 4;
    ctx.stroke();

    // Lance head (three points)
    ctx.beginPath();
    ctx.moveTo(lanceLength, lanceY - 10);
    ctx.lineTo(lanceLength + 20, lanceY);
    ctx.lineTo(lanceLength, lanceY + 10);
    ctx.lineTo(lanceLength + 5, lanceY);
    ctx.closePath();
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    // Heavenly Eye on forehead
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 8, Math.PI / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF176';
    ctx.fill();
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
};
