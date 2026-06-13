export const stone_golem = {
    id: 'stone_golem',
    name: 'Stone Golem',
    nameCN: '岩石魔像',
    color: '#616161',
    secondaryColor: '#4CAF50',
    glowColor: 'rgba(97, 97, 97, 0.35)',
    size: 34,
    speed: 3.0,
    hp: 120,
    attackPower: 28,
    attackSpeed: 2.4,
    chargeTime: 0.6,
    attackRange: 52,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      {
        id: 'stone_shell',
        name: '石质外壳',
        description: '单次伤害上限不超过最大血量的15%，且自带10%减伤，免疫任何击退效果。'
      }
    ],
    skill: {
      name: '大地践踏',
      nameEN: 'Ground Slam',
      cooldown: 10,
      damage: 24,
      range: 95,
      type: 'ground_slam',
      duration: 1.0 // 1.0s stun
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // 1. Draw heavy shoulder rocks (left & right)
      ctx.fillStyle = '#424242';
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 2.5;

      // Left shoulder rock
      ctx.beginPath();
      ctx.arc(size * 0.1, -size * 0.85, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right shoulder rock
      ctx.beginPath();
      ctx.arc(size * 0.1, size * 0.85, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. Draw moss green cracks/highlights on shoulders
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      // Left shoulder moss patch
      ctx.arc(size * 0.05, -size * 0.85, size * 0.15, 0, Math.PI * 2);
      // Right shoulder moss patch
      ctx.arc(size * 0.05, size * 0.85, size * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw huge stone fists that bob dynamically
      ctx.fillStyle = '#616161';
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 2;

      const bobLeft = Math.sin(time * 5) * 4;
      const bobRight = -Math.sin(time * 5) * 4;

      // Left Fist (extended slightly forward-left)
      ctx.beginPath();
      ctx.arc(size * 0.8 + bobLeft, -size * 0.5, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right Fist (extended slightly forward-right)
      ctx.beginPath();
      ctx.arc(size * 0.8 + bobRight, size * 0.5, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 4. Glowing green rune eye in center-front of Golem
      ctx.fillStyle = '#00E676';
      ctx.shadowColor = '#00E676';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(size * 0.55, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
};
