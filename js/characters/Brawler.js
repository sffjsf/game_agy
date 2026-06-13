export const brawler = {
    id: 'brawler',
    name: 'Brawler',
    nameCN: '拳斗士',
    color: '#E64A19',
    secondaryColor: '#6D4C41',
    glowColor: 'rgba(230, 74, 25, 0.45)',
    size: 36,
    speed: 5.3,
    hp: 110,
    attackPower: 11,
    attackSpeed: 0.68,
    chargeTime: 0.12,
    attackRange: 62,
    lifesteal: 0.06,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'combo_strikes',
        name: '连打',
        description: '连续攻击同一目标会叠加伤害，换目标后重置，最多 5 层。' }
    ],
    specialEffects: [
      { name: '连打压制',
        description: '每次连续命中同一目标提升 8% 伤害，最多 40%。' },
      { name: '上勾拳',
        description: '重拳击晕目标，适合打断和贴身压制。' }
    ],
    skill: {
      name: '上勾拳',
      nameEN: 'Uppercut',
      cooldown: 7,
      damage: 15,
      range: 72,
      type: 'stun',
      duration: 1.0
    },
    /**
     * Draw Brawler decorations: heavy gloves and wrapped fists.
     * After ctx.rotate(angle), the +X direction faces the enemy.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      var bob = Math.sin(time * 8) * 2;

      // Left glove
      ctx.save();
      ctx.translate(size * 0.55, -size * 0.42 + bob);
      ctx.rotate(-0.25);
      ctx.fillStyle = '#D84315';
      ctx.strokeStyle = '#BF360C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.28, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFAB91';
      ctx.beginPath();
      ctx.arc(size * 0.1, -size * 0.04, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Right glove
      ctx.save();
      ctx.translate(size * 0.62, size * 0.35 - bob);
      ctx.rotate(0.25);
      ctx.fillStyle = '#D84315';
      ctx.strokeStyle = '#BF360C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.28, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFAB91';
      ctx.beginPath();
      ctx.arc(size * 0.1, size * 0.04, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Chest strap
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 0.35);
      ctx.lineTo(size * 0.35, size * 0.35);
      ctx.stroke();

      // Fighting aura marks
      ctx.strokeStyle = '#FFCCBC';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.55;
      for (var i = 0; i < 3; i++) {
        var a = time * 5 + i * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * size * 0.55, Math.sin(a) * size * 0.45, size * 0.08, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    }
  };
