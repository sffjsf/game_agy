export const crossbowman = {
    id: 'crossbowman',
    name: 'Crossbowman',
    nameCN: '弩手',
    color: '#8D6E63',
    secondaryColor: '#3E2723',
    glowColor: 'rgba(141, 110, 99, 0.35)',
    size: 34,
    speed: 4.0,
    hp: 95,
    attackPower: 15,
    attackSpeed: 1.55,
    chargeTime: 0.55,
    attackRange: 430,
    projectileSpeed: 1100,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'arrow',
    passives: [
      { id: 'none', name: '无', description: '没有额外被动效果。' }
    ],
    specialEffects: [
      { name: '穿甲弩箭', description: '技能发射强力穿透箭，对直线上的敌人造成伤害。' }
    ],
    skill: {
      name: '穿甲弩箭',
      nameEN: 'Armor Piercer',
      cooldown: 8,
      damage: 18,
      range: 360,
      type: 'pierce',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Crossbow stock
      ctx.strokeStyle = '#4E342E';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, 0);
      ctx.lineTo(size * 1.35, 0);
      ctx.stroke();

      // Bow limbs
      ctx.strokeStyle = '#A1887F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(size * 0.8, -size * 0.45);
      ctx.quadraticCurveTo(size * 1.15, 0, size * 0.8, size * 0.45);
      ctx.stroke();

      // String
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(size * 0.8, -size * 0.45);
      ctx.lineTo(size * 0.42, 0);
      ctx.lineTo(size * 0.8, size * 0.45);
      ctx.stroke();

      // Bolt
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.35, 0);
      ctx.lineTo(size * 1.55, 0);
      ctx.stroke();

      ctx.fillStyle = '#CFD8DC';
      ctx.beginPath();
      ctx.moveTo(size * 1.65, 0);
      ctx.lineTo(size * 1.48, -size * 0.1);
      ctx.lineTo(size * 1.48, size * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  };
