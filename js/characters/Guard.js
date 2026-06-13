export const guard = {
    id: 'guard',
    name: 'Guard',
    nameCN: '守卫',
    color: '#607D8B',
    secondaryColor: '#263238',
    glowColor: 'rgba(96, 125, 139, 0.35)',
    size: 36,
    speed: 4.2,
    hp: 120,
    attackPower: 16,
    attackSpeed: 1.45,
    chargeTime: 0.45,
    attackRange: 78,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'balanced',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'none', name: '无', description: '没有额外被动效果。' }
    ],
    specialEffects: [
      { name: '盾牌猛击', description: '技能会击晕近距离目标，适合稳扎稳打地保护阵线。' }
    ],
    skill: {
      name: '盾牌猛击',
      nameEN: 'Shield Slam',
      cooldown: 9,
      damage: 14,
      range: 85,
      type: 'stun',
      duration: 1.2
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Tower shield
      ctx.fillStyle = '#78909C';
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.35, -size * 0.55);
      ctx.lineTo(size * 0.95, -size * 0.35);
      ctx.lineTo(size * 0.95, size * 0.28);
      ctx.quadraticCurveTo(size * 0.65, size * 0.65, size * 0.35, size * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.48, -size * 0.34);
      ctx.lineTo(size * 0.82, -size * 0.2);
      ctx.moveTo(size * 0.46, size * 0.05);
      ctx.lineTo(size * 0.85, size * 0.18);
      ctx.stroke();

      // Short mace
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, size * 0.28);
      ctx.lineTo(size * 0.45, size * 0.42);
      ctx.stroke();

      ctx.fillStyle = '#B0BEC5';
      ctx.beginPath();
      ctx.arc(size * 0.55, size * 0.44, size * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };
