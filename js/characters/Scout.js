export const scout = {
    id: 'scout',
    name: 'Scout',
    nameCN: '斥候',
    color: '#26A69A',
    secondaryColor: '#00695C',
    glowColor: 'rgba(38, 166, 154, 0.35)',
    size: 33,
    speed: 5.8,
    hp: 90,
    attackPower: 13,
    attackSpeed: 0.95,
    chargeTime: 0.2,
    attackRange: 70,
    lifesteal: 0,
    movePattern: 'flank',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'none', name: '无', description: '没有额外被动效果。' }
    ],
    specialEffects: [
      { name: '疾步突袭', description: '技能快速冲向敌人并造成一次轻量伤害。' }
    ],
    skill: {
      name: '疾步突袭',
      nameEN: 'Quick Raid',
      cooldown: 7,
      damage: 14,
      range: 150,
      type: 'dash',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Light scarf
      var flutter = Math.sin(time * 6) * size * 0.08;
      ctx.fillStyle = '#80CBC4';
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.2);
      ctx.quadraticCurveTo(-size * 0.9, -size * 0.25 + flutter, -size * 1.05, -size * 0.02);
      ctx.quadraticCurveTo(-size * 0.72, size * 0.08 + flutter, -size * 0.1, size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Twin daggers
      ctx.strokeStyle = '#B2DFDB';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.15, -size * 0.28);
      ctx.lineTo(size * 1.05, -size * 0.48);
      ctx.moveTo(size * 0.18, size * 0.25);
      ctx.lineTo(size * 1.05, size * 0.45);
      ctx.stroke();

      ctx.fillStyle = '#ECEFF1';
      ctx.beginPath();
      ctx.moveTo(size * 1.16, -size * 0.5);
      ctx.lineTo(size * 0.98, -size * 0.58);
      ctx.lineTo(size * 1.02, -size * 0.38);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(size * 1.16, size * 0.48);
      ctx.lineTo(size * 0.98, size * 0.58);
      ctx.lineTo(size * 1.02, size * 0.38);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  };
