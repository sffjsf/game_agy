export const shield_lancer = {
    id: 'shield_lancer',
    name: 'Shield Lancer',
    nameCN: '盾枪卫士',
    color: '#607D8B',
    secondaryColor: '#455A64',
    glowColor: 'rgba(96, 125, 139, 0.45)',
    size: 36,
    speed: 4.2,
    hp: 125,
    attackPower: 16,
    attackSpeed: 1.45,
    chargeTime: 0.38,
    attackRange: 115,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'balanced',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'shield_wall',
        name: '盾阵',
        description: '正面受到的伤害降低 25%。受到近战攻击时有 30% 概率击退攻击者。' }
    ],
    specialEffects: [
      { name: '正面防御',
        description: '面对攻击来源时受到的伤害降低，适合顶在前排。' },
      { name: '盾阵反推',
        description: '被近战攻击时概率用小盾反推敌人。' },
      { name: '突刺阵列',
        description: '向前方直线刺击，对路径敌人造成伤害并短暂减速。' }
    ],
    skill: {
      name: '突刺阵列',
      nameEN: 'Lance Array',
      cooldown: 8,
      damage: 18,
      range: 165,
      type: 'pierce',
      duration: 0,
      width: 38,
      slowDuration: 1.4,
      slowMultiplier: 0.6
    },
    /**
     * Draw Shield Lancer decorations: long lance and compact front shield.
     * After ctx.rotate(angle), the +X direction faces the enemy.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // ── Long lance shaft ──
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.9, size * 0.08);
      ctx.lineTo(size * 2.0, size * 0.08);
      ctx.stroke();

      // Lance metal tip
      ctx.beginPath();
      ctx.moveTo(size * 2.25, size * 0.08);
      ctx.lineTo(size * 1.9, -size * 0.08);
      ctx.lineTo(size * 1.9, size * 0.24);
      ctx.closePath();
      ctx.fillStyle = '#ECEFF1';
      ctx.fill();
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Small banner below lance
      var bannerWave = Math.sin(time * 4) * 2;
      ctx.fillStyle = '#90A4AE';
      ctx.beginPath();
      ctx.moveTo(size * 0.65, size * 0.1);
      ctx.lineTo(size * 0.65, size * 0.6 + bannerWave);
      ctx.lineTo(size * 0.25, size * 0.48 - bannerWave);
      ctx.lineTo(size * 0.25, size * 0.1);
      ctx.closePath();
      ctx.fill();

      // ── Compact round shield, held front-left ──
      var shieldX = size * 0.55;
      var shieldY = -size * 0.25;
      var shieldR = size * 0.42;

      ctx.beginPath();
      ctx.arc(shieldX, shieldY, shieldR, 0, Math.PI * 2);
      ctx.fillStyle = '#546E7A';
      ctx.fill();
      ctx.strokeStyle = '#CFD8DC';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shield rim
      ctx.beginPath();
      ctx.arc(shieldX, shieldY, shieldR * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = '#37474F';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shield boss
      ctx.beginPath();
      ctx.arc(shieldX, shieldY, shieldR * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#B0BEC5';
      ctx.fill();
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Defensive glow when idling/charging
      ctx.globalAlpha = 0.25 + Math.sin(time * 5) * 0.08;
      ctx.strokeStyle = '#E0F7FA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(shieldX, shieldY, shieldR * 1.15, -Math.PI * 0.65, Math.PI * 0.65);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.restore();
    }
  };
