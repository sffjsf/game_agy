export const frost_lord = {
    id: 'frost_lord',
    isLegendary: true,
    name: 'Frost Lord',
    nameCN: '极寒之主',
    color: '#E1F5FE',
    secondaryColor: '#00B0FF',
    glowColor: 'rgba(129, 212, 250, 0.7)',
    size: 38,
    speed: 4.7,
    hp: 190,
    attackPower: 24,
    attackSpeed: 1.25,
    chargeTime: 0.25,
    attackRange: 230,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      {
        id: 'frost_shield',
        name: '冰盾',
        description: '单次受到的非灼烧伤害最多不超过自身最大生命值 5%；每次承受非灼烧伤害后，向正前方释放一道大冰刃。'
      },
      {
        id: 'frost_lord_basic',
        name: '冰山王令',
        description: '普通攻击分两段：第一段从天而降一座必定命中最近目标的冰山，随后冰山化为冰人；第二段化为冰杖冲刺穿到血量最低敌人身后，对路径敌人造成伤害并眩晕，到达后立即挥舞冰杖重击目标，穿透期间无敌。'
      }
    ],
    specialEffects: [
      { name: '冰山坠落', description: '普攻第一段必定命中最近目标并召唤冰人。' },
      { name: '冰杖穿身', description: '普攻第二段锁定血量最低敌人，化为冰杖冲刺穿透路径，落到身后后立即挥杖攻击。' },
      { name: '极寒之地', description: '主动技能制造封锁领域，吸入附近敌人，期间自身无敌但不能普攻。' }
    ],
    skill: {
      name: '极寒之地',
      nameEN: 'Absolute Frostland',
      cooldown: 14,
      damage: 8,
      range: 360,
      type: 'frost_land',
      duration: 3.0,
      area: 190
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Ice crown
      ctx.fillStyle = '#E1F5FE';
      ctx.strokeStyle = '#00B0FF';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.15, i * size * 0.22);
        ctx.lineTo(size * 0.15, i * size * 0.06);
        ctx.lineTo(-size * 0.15, i * size * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Great ice sword
      const pulse = 1 + Math.sin(time * 4) * 0.04;
      ctx.save();
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      ctx.moveTo(size * 1.9, 0);
      ctx.lineTo(size * 0.45, -size * 0.18);
      ctx.lineTo(size * 0.25, 0);
      ctx.lineTo(size * 0.45, size * 0.18);
      ctx.closePath();
      ctx.fillStyle = '#B3E5FC';
      ctx.fill();
      ctx.strokeStyle = '#00B0FF';
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  };
