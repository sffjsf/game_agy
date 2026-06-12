export const one_punch_man = {
    id: 'one_punch_man',
    isHero: true,
  name: 'One Punch Man',
    nameCN: '一拳超人',
    color: '#FFEB3B',
    secondaryColor: '#D32F2F',
    glowColor: 'rgba(255, 235, 59, 0.4)',
    size: 36,
    speed: 5.2,
    hp: 100,
    attackPower: 22,
    attackSpeed: 0.8,
    chargeTime: 0.2,
    attackRange: 85,
    lifesteal: 0,
    movePattern: 'dash',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'saitama_dodge', isHero: true,
  name: '直觉闪避', description: '受到伤害时有 35% 概率闪避。' },
      { id: 'saitama_splash', isHero: true,
  name: '拳风余波', description: '普通攻击命中时造成小范围溅射。' }
    ],
    skill: {
      isHero: true,
  name: '认真一拳',
      nameEN: 'Serious Punch',
      cooldown: 14,
      damage: 80,
      range: 120,
      type: 'serious_punch',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // White Cape (drawn behind the body)
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, 0);
      ctx.lineTo(-size * 2.2, -size * 0.6 + Math.sin(time * 8) * 4);
      ctx.lineTo(-size * 2.0, size * 0.1);
      ctx.lineTo(-size * 2.2, size * 0.6 - Math.sin(time * 8) * 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red Gloves (two circles at the front)
      ctx.fillStyle = '#D32F2F';
      ctx.strokeStyle = '#B71C1C';
      ctx.lineWidth = 1.5;
      // Left glove
      ctx.beginPath();
      ctx.arc(size * 0.8, -size * 0.4, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Right glove
      ctx.beginPath();
      ctx.arc(size * 0.8, size * 0.4, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Simple black eyes/mouth (Saitama classic simple face)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.fillRect(size * 0.4, -size * 0.2, 4, 2);
      ctx.fillRect(size * 0.4, size * 0.2, 4, 2);
      ctx.fillRect(size * 0.45, -2, 2, 4);

      ctx.restore();
    }
  };
