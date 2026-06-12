export const spearman = {
    id: 'spearman',
    name: 'Spearman',
    nameCN: '长枪兵',
    color: '#78909C',
    secondaryColor: '#37474F',
    glowColor: 'rgba(120, 144, 156, 0.35)',
    size: 36,
    speed: 4.7,
    hp: 100,
    attackPower: 15,
    attackSpeed: 1.25,
    chargeTime: 0.28,
    attackRange: 105,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'balanced',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'spear_pierce', name: '长枪穿刺', description: '普通攻击命中时会穿透直线上的其他敌人，造成较低伤害。' }
    ],
    specialEffects: [
      { name: '直线穿刺', description: '技能会伤害前方直线范围内的敌人。' }
    ],
    skill: {
      name: '突刺',
      nameEN: 'Piercing Thrust',
      cooldown: 8,
      damage: 18,
      range: 155,
      type: 'pierce',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Long spear shaft and tip
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.9, 0);
      ctx.lineTo(size * 1.9, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size * 2.15, 0);
      ctx.lineTo(size * 1.75, -size * 0.16);
      ctx.lineTo(size * 1.75, size * 0.16);
      ctx.closePath();
      ctx.fillStyle = '#CFD8DC';
      ctx.fill();
      ctx.strokeStyle = '#607D8B';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  };
