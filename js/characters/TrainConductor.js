export const train_conductor = {
    id: 'train_conductor',
    name: 'Train Conductor',
    nameCN: '列车长',
    color: '#1A237E',
    secondaryColor: '#FFD700',
    glowColor: 'rgba(26, 35, 126, 0.4)',
    size: 36,
    speed: 4.8,
    hp: 100,
    attackPower: 15,
    attackSpeed: 1.0,
    chargeTime: 0.4,
    attackRange: 360,
    projectileSpeed: 850,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'train',
    passives: [
      { id: 'steam_whistle', name: '蒸汽鸣笛', description: '敌人靠近时自动击退并减速，6 秒冷却。' },
      { id: 'train_stun', name: '铁轨震荡', description: '火车投射物命中时额外眩晕。' }
    ],
    skill: {
      name: '列车出站',
      nameEN: 'Train Stampede',
      cooldown: 10,
      damage: 35,
      range: 250,
      type: 'train_stampede',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Pocket watch chain dangling
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-size * 0.3, size * 0.3, size * 0.4, 0, Math.PI * 0.7, false);
      ctx.stroke();

      // Conductor Hat visor cap
      ctx.fillStyle = '#0D47A1';
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(size * 0.3, 0, size * 0.6, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hat Visor
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(size * 0.5, 0, size * 0.55, -Math.PI * 0.3, Math.PI * 0.3, false);
      ctx.lineTo(size * 0.8, size * 0.25);
      ctx.arc(size * 0.5, 0, size * 0.55, Math.PI * 0.3, -Math.PI * 0.3, true);
      ctx.closePath();
      ctx.fill();

      // Gold Badge
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(size * 0.4, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };
