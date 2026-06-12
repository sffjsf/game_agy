export const xiaotian_hound = {
  hidden: true,
  nameCN: '啸天犬',
  color: '#424242', // Dark grey/black
  secondaryColor: '#212121',
  glowColor: '#757575',
  weaponType: 'melee',
  movePattern: 'dash', // Extremely fast dash
  attackPower: 8,
  attackSpeed: 2.0, // Bites very fast
  attackRange: 55, // Close combat bite
  chargeTime: 0.15,
  size: 26,
  projectileType: null,
  aiTendency: 'aggressive',
  hp: 60,
  maxHp: 60,
  speed: 5.5, // extremely fast
  lifesteal: 0,
  skill: {
    name: '无',
    type: 'none',
    cooldown: 999,
    range: 0,
    damage: 0,
    duration: 0,
    description: '啸天犬只有强大的被动撕咬能力。'
  },
  passives: [
    {
      type: 'hound_bite',
      name: '撕咬',
      description: '每次攻击都会死死咬住敌人，使其移动速度和攻击速度降低40%，持续2秒。'
    }
  ],
  drawDecorations: function(ctx, x, y, angle, size, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Dog ears
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.moveTo(size * 0.2, -size * 0.8);
    ctx.lineTo(size * 0.5, -size * 1.2);
    ctx.lineTo(size * 0.6, -size * 0.6);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(size * 0.2, size * 0.8);
    ctx.lineTo(size * 0.5, size * 1.2);
    ctx.lineTo(size * 0.6, size * 0.6);
    ctx.fill();

    // Tail (wagging based on time)
    var wagAngle = Math.sin(time * 15) * 0.5;
    ctx.translate(-size * 0.9, 0);
    ctx.rotate(wagAngle);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.2);
    ctx.quadraticCurveTo(-size, -size * 0.5, -size * 1.2, 0);
    ctx.quadraticCurveTo(-size, size * 0.5, 0, size * 0.2);
    ctx.fillStyle = '#424242';
    ctx.fill();

    ctx.restore();
  }
};
