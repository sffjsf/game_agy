export const ice_servant = {
    id: 'ice_servant',
    name: 'Ice Servant',
    nameCN: '冰人',
    color: '#B3E5FC',
    secondaryColor: '#0288D1',
    glowColor: 'rgba(179, 229, 252, 0.45)',
    size: 30,
    speed: 4.1,
    hp: 45,
    attackPower: 8,
    attackSpeed: 1.2,
    chargeTime: 0.35,
    attackRange: 58,
    lifesteal: 0,
    hidden: true,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'none', name: '无', description: '没有额外被动效果。' }
    ],
    specialEffects: [
      { name: '冰山化身', description: '由极寒之主普通攻击召唤出的冰山化身。' }
    ],
    skill: {
      name: '寒冰重击',
      nameEN: 'Ice Slam',
      cooldown: 8,
      damage: 12,
      range: 70,
      type: 'aoe_melee',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = 'rgba(225, 245, 254, 0.75)';
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = -0.5 + i * 0.5;
        ctx.beginPath();
        ctx.moveTo(size * 0.15, Math.sin(a) * size * 0.55);
        ctx.lineTo(size * 0.65, Math.sin(a) * size * 0.8);
        ctx.lineTo(size * 0.35, Math.sin(a) * size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  };
