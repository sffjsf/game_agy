export const super_summoner = {
    id: 'super_summoner',
    name: 'Superhero Summoner',
    nameCN: '超级召唤师',
    color: '#9C27B0',
    secondaryColor: '#E040FB',
    glowColor: 'rgba(156, 39, 176, 0.4)',
    size: 34,
    speed: 3.5,
    hp: 100,
    attackPower: 25,
    attackSpeed: 1.4,
    chargeTime: 0.2,
    attackRange: 280,
    projectileSpeed: 500,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'defensive',
    weaponType: 'ranged',
    projectileType: 'homing_orb',
    passives: [
      { id: 'summoner_attack', name: '石像役使', description: '普通攻击改为召唤一名短命石像。' }
    ],
    skill: {
      name: '地狱军团',
      nameEN: 'Summon Legion',
      cooldown: 7,
      damage: 0,
      range: 1000,
      type: 'summon_legion',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Wizard Hat
      ctx.fillStyle = '#4A148C';
      ctx.strokeStyle = '#E040FB';
      ctx.lineWidth = 1.5;
      
      // Hat brim
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.9, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hat peak
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, 0);
      ctx.lineTo(size * 0.2, -size * 1.5);
      ctx.lineTo(size * 0.4, 0);
      ctx.fill();
      ctx.stroke();

      // Magic Staff (Held in right hand)
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(size * 0.6, -size * 0.8);
      ctx.lineTo(size * 0.6, size * 0.8);
      ctx.stroke();

      // Glowing orb on staff
      ctx.fillStyle = '#00E5FF';
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 10 + Math.sin(time * 5) * 5;
      ctx.beginPath();
      ctx.arc(size * 0.6, -size * 0.8, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };
