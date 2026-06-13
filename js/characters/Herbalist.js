export const herbalist = {
    id: 'herbalist',
    name: 'Herbalist',
    nameCN: '药草师',
    color: '#81C784',
    secondaryColor: '#2E7D32',
    glowColor: 'rgba(129, 199, 132, 0.35)',
    size: 34,
    speed: 3.8,
    hp: 105,
    attackPower: 9,
    attackSpeed: 1.05,
    chargeTime: 0.35,
    attackRange: 320,
    projectileSpeed: 760,
    lifesteal: 0,
    movePattern: 'arc',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'poison',
    passives: [
      { id: 'none', name: '无', description: '没有额外被动效果。' }
    ],
    specialEffects: [
      { name: '迷草粉', description: '技能制造小片毒雾区域，持续干扰敌人的技能释放。' }
    ],
    skill: {
      name: '迷草粉',
      nameEN: 'Dazing Herbs',
      cooldown: 10,
      damage: 8,
      range: 230,
      type: 'poison_cloud',
      duration: 2.5,
      area: 90,
      poisonDps: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Herb satchel
      ctx.fillStyle = '#6D4C41';
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, size * 0.15);
      ctx.lineTo(-size * 0.05, size * 0.15);
      ctx.quadraticCurveTo(0, size * 0.15, 0, size * 0.2);
      ctx.lineTo(0, size * 0.52);
      ctx.quadraticCurveTo(0, size * 0.57, -size * 0.05, size * 0.57);
      ctx.lineTo(-size * 0.5, size * 0.57);
      ctx.quadraticCurveTo(-size * 0.55, size * 0.57, -size * 0.55, size * 0.52);
      ctx.lineTo(-size * 0.55, size * 0.2);
      ctx.quadraticCurveTo(-size * 0.55, size * 0.15, -size * 0.5, size * 0.15);
      ctx.fill();
      ctx.stroke();

      // Leaf sprigs
      ctx.strokeStyle = '#1B5E20';
      ctx.lineWidth = 2;
      for (var i = 0; i < 3; i++) {
        var sway = Math.sin(time * 4 + i) * 0.12;
        ctx.save();
        ctx.translate(size * 0.35 + i * size * 0.14, -size * 0.18 + i * 2);
        ctx.rotate(-0.6 + sway);
        ctx.beginPath();
        ctx.moveTo(0, size * 0.25);
        ctx.lineTo(0, -size * 0.28);
        ctx.stroke();

        ctx.fillStyle = i % 2 === 0 ? '#A5D6A7' : '#C5E1A5';
        ctx.beginPath();
        ctx.ellipse(-size * 0.08, -size * 0.08, size * 0.1, size * 0.18, -0.8, 0, Math.PI * 2);
        ctx.ellipse(size * 0.08, -size * 0.18, size * 0.1, size * 0.18, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }
  };
