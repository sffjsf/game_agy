export const poisoner = {
    id: 'poisoner',
    name: 'Poisoner',
    nameCN: '放毒者',
    color: '#66BB6A',
    secondaryColor: '#1B5E20',
    glowColor: 'rgba(102, 187, 106, 0.35)',
    size: 34,
    speed: 3.0,
    hp: 100,
    attackPower: 10,
    attackSpeed: 1.0,
    chargeTime: 0.35,
    attackRange: 310,
    projectileSpeed: 760,
    lifesteal: 0,
    movePattern: 'arc',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'poison',
    passives: [
      { id: 'poison_trail', name: '毒雾足迹', description: '移动时在身后留下毒雾，使敌人中毒沉默0.5秒。' }
    ],
    specialEffects: [
      { name: '毒弹', description: '普通攻击命中后使敌人中毒沉默0.5秒。' },
      { name: '持续毒雾', description: '毒雾区域会持续让敌人中毒并沉默技能。' }
    ],
    skill: {
      name: '毒雾瓶',
      nameEN: 'Toxic Flask',
      cooldown: 9,
      damage: 10,
      range: 240,
      type: 'poison_cloud',
      duration: 3.0,
      area: 110,
      poisonDps: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Potion bottle
      ctx.fillStyle = '#A5D6A7';
      ctx.strokeStyle = '#1B5E20';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(size * 0.45, -size * 0.45);
      ctx.lineTo(size * 0.75, -size * 0.25);
      ctx.lineTo(size * 0.75, size * 0.25);
      ctx.lineTo(size * 0.45, size * 0.45);
      ctx.lineTo(size * 0.25, size * 0.2);
      ctx.lineTo(size * 0.25, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubbling poison
      ctx.fillStyle = '#76FF03';
      for (var i = 0; i < 3; i++) {
        var by = -size * 0.3 + i * size * 0.25 + Math.sin(time * 5 + i) * 2;
        ctx.beginPath();
        ctx.arc(size * 0.5, by, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  };
