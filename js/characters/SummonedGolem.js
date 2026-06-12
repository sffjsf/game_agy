export const summoned_golem = {
    id: 'summoned_golem',
    name: 'Stone Golem',
    nameCN: '召唤巨石',
    color: '#795548',
    secondaryColor: '#D7CCC8',
    glowColor: 'rgba(121, 85, 72, 0.4)',
    size: 28,
    speed: 4.5,
    hp: 15,
    attackPower: 5,
    attackSpeed: 1.0,
    chargeTime: 0.4,
    attackRange: 45,
    lifesteal: 0,
    hidden: true, // Not selectable in UI
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    skill: {
      name: '巨石重击',
      nameEN: 'Slam',
      cooldown: 8,
      damage: 15,
      range: 55,
      type: 'aoe_melee',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Golem rocky shoulders
      ctx.fillStyle = '#5D4037';
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 2;
      
      // Left shoulder rock
      ctx.beginPath();
      ctx.arc(size * 0.2, -size * 0.8, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right shoulder rock
      ctx.beginPath();
      ctx.arc(size * 0.2, size * 0.8, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing rune eye
      ctx.fillStyle = '#E040FB';
      ctx.shadowColor = '#E040FB';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(size * 0.5, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };
