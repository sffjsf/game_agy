export const bomber = {
    id: 'bomber',
    name: 'Bomber',
    nameCN: '炸弹人',
    color: '#FF7043',
    secondaryColor: '#5D4037',
    glowColor: 'rgba(255, 112, 67, 0.35)',
    size: 35,
    speed: 3.8,
    hp: 100,
    attackPower: 12,
    attackSpeed: 1.45,
    chargeTime: 0.45,
    attackRange: 560,
    projectileSpeed: 760,
    lifesteal: 0,
    movePattern: 'wobble',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'bomb',
    specialEffects: [
      { name: '范围炸弹', description: '普通攻击命中后会在目标附近爆炸，造成范围伤害。' }
    ],
    skill: {
      name: '爆裂炸弹',
      nameEN: 'Blast Bomb',
      cooldown: 10,
      damage: 27,
      range: 520,
      type: 'bomb_toss',
      duration: 0,
      area: 125
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Round bomb pack behind the body
      ctx.beginPath();
      ctx.arc(-size * 0.75, 0, size * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = '#2E1A12';
      ctx.fill();
      ctx.strokeStyle = '#FFAB40';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spark fuse
      var spark = 2 + Math.sin(time * 16) * 1.5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.95, -size * 0.28);
      ctx.quadraticCurveTo(-size * 1.18, -size * 0.62, -size * 1.0, -size * 0.82);
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-size * 1.0, -size * 0.82, spark, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD54F';
      ctx.shadowColor = '#FF6F00';
      ctx.shadowBlur = 8;
      ctx.fill();

      ctx.restore();
    }
  };
