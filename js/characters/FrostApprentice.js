export const frost_apprentice = {
    id: 'frost_apprentice',
    name: 'Frost Apprentice',
    nameCN: '寒冰学徒',
    color: '#4FC3F7',
    secondaryColor: '#0277BD',
    glowColor: 'rgba(79, 195, 247, 0.35)',
    size: 34,
    speed: 3.9,
    hp: 100,
    attackPower: 12,
    attackSpeed: 1.25,
    chargeTime: 0.5,
    attackRange: 350,
    projectileSpeed: 720,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'magic',
    specialEffects: [
      { name: '大范围冰霜', description: '技能会在超大范围内减速敌人。' }
    ],
    skill: {
      name: '冰霜新星',
      nameEN: 'Frost Nova',
      cooldown: 10,
      damage: 12,
      range: 360,
      type: 'frost_nova',
      duration: 3.0,
      area: 360
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 1.4);

      // Small rotating snowflake
      ctx.strokeStyle = '#B3E5FC';
      ctx.lineWidth = 2;
      for (var i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 0.72, 0);
        ctx.moveTo(size * 0.45, 0);
        ctx.lineTo(size * 0.55, -size * 0.12);
        ctx.moveTo(size * 0.45, 0);
        ctx.lineTo(size * 0.55, size * 0.12);
        ctx.stroke();
      }

      ctx.restore();
    }
  };
