export const blood_demon = {
    id: 'blood_demon',
    isHero: true,
  name: 'Blood Demon',
    nameCN: '血魔',
    color: '#880E4F',
    secondaryColor: '#FF1744',
    glowColor: 'rgba(255, 23, 68, 0.4)',
    size: 36,
    speed: 4.6,
    hp: 100,
    attackPower: 15,
    attackSpeed: 1.1,
    chargeTime: 0.3,
    attackRange: 90,
    lifesteal: 0.40, // 40% Lifesteal
    movePattern: 'zigzag',
    aiTendency: 'balanced',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'lifesteal', isHero: true,
  name: '鲜血汲取', description: '造成伤害时回复 40% 伤害值的生命。' },
      { id: 'blood_shield', isHero: true,
  name: '血红护盾', description: '低生命受击时生成 35 点护盾，15 秒冷却。' }
    ],
    skill: {
      isHero: true,
  name: '蝙蝠召唤',
      nameEN: 'Summon Bats',
      cooldown: 8,
      damage: 22,
      range: 250,
      type: 'summon_bats',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Blood wings (large crimson wings on back)
      ctx.fillStyle = '#310015';
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 2;
      
      const wingSwing = Math.sin(time * 5) * 0.2;

      // Left Wing
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size * 0.3);
      ctx.lineTo(-size * 1.8, -size * 1.5 - wingSwing * size);
      ctx.lineTo(-size * 1.2, -size * 0.5);
      ctx.lineTo(-size * 2.2, -size * 0.2 - wingSwing * size);
      ctx.lineTo(-size * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, size * 0.3);
      ctx.lineTo(-size * 1.8, size * 1.5 + wingSwing * size);
      ctx.lineTo(-size * 1.2, size * 0.5);
      ctx.lineTo(-size * 2.2, size * 0.2 + wingSwing * size);
      ctx.lineTo(-size * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Floating blood orb above
      ctx.save();
      const orbY = y - size - 15 + Math.sin(time * 6) * 5;
      ctx.beginPath();
      ctx.arc(x, orbY, 7, 0, Math.PI * 2);
      var grad = ctx.createRadialGradient(x, orbY, 1, x, orbY, 7);
      grad.addColorStop(0, '#FF5252');
      grad.addColorStop(1, '#880E4F');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  };
