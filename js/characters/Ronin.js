export const ronin = {
    id: 'ronin',
    name: 'Ronin',
    nameCN: '流浪武士',
    color: '#795548',
    secondaryColor: '#D7CCC8',
    glowColor: 'rgba(121, 85, 72, 0.45)',
    size: 36,
    speed: 5.0,
    hp: 105,
    attackPower: 18,
    attackSpeed: 1.15,
    chargeTime: 0.3,
    attackRange: 82,
    lifesteal: 0.05,
    movePattern: 'dash',
    aiTendency: 'balanced',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'counter_stance',
        name: '反击架势',
        description: '受到近战攻击后进入反击架势，下一次普攻更快且伤害提升。' }
    ],
    specialEffects: [
      { name: '反击架势',
        description: '被近战命中后 3 秒内获得反击：攻速提升，下一次普攻伤害 +35%。' },
      { name: '拔刀斩',
        description: '瞬步到目标身边，造成高伤害斩击。' }
    ],
    skill: {
      name: '拔刀斩',
      nameEN: 'Iaijutsu',
      cooldown: 8,
      damage: 24,
      range: 150,
      type: 'backstab',
      duration: 0
    },
    /**
     * Draw Ronin decorations: straw hat, katana, and worn cloak.
     * After ctx.rotate(angle), the +X direction faces the enemy.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Straw hat
      ctx.fillStyle = '#D7CCC8';
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.55, size * 0.9, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-size * 0.45, -size * 0.55);
      ctx.lineTo(0, -size * 0.95);
      ctx.lineTo(size * 0.45, -size * 0.55);
      ctx.closePath();
      ctx.fillStyle = '#BCAAA4';
      ctx.fill();
      ctx.stroke();

      // Katana drawn along the body, ready to unsheathe
      var bladePulse = Math.sin(time * 4) * 0.04;
      ctx.save();
      ctx.translate(size * 0.1, size * 0.15);
      ctx.rotate(-0.35 + bladePulse);

      // Sheath
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-size * 0.65, size * 0.18);
      ctx.lineTo(size * 0.55, -size * 0.1);
      ctx.stroke();

      // Blade glimpse
      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.15, -size * 0.02);
      ctx.lineTo(size * 0.95, -size * 0.18);
      ctx.stroke();

      // Guard
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.05, -size * 0.18);
      ctx.lineTo(size * 0.14, size * 0.12);
      ctx.stroke();

      ctx.restore();

      // Worn cloak behind
      ctx.fillStyle = '#4E342E';
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.25);
      ctx.quadraticCurveTo(-size * 0.8, size * 0.2 + Math.sin(time * 2) * 3, -size * 0.55, size * 0.75);
      ctx.lineTo(size * 0.15, size * 0.6);
      ctx.quadraticCurveTo(size * 0.35, size * 0.2, size * 0.05, -size * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Simple waist cord
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, size * 0.1);
      ctx.lineTo(size * 0.35, size * 0.1);
      ctx.stroke();

      ctx.restore();
    }
  };
