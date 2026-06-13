export const wind_dancer = {
    id: 'wind_dancer',
    name: 'Wind Dancer',
    nameCN: '御风剑侍',
    color: '#81D4FA',
    secondaryColor: '#E0F7FA',
    glowColor: 'rgba(129, 212, 250, 0.5)',
    size: 30,
    speed: 6.0,
    hp: 85,
    attackPower: 15,
    attackSpeed: 0.8,
    chargeTime: 0.25,
    attackRange: 70,
    lifesteal: 0.08,
    movePattern: 'dash',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'wind_walker',
        name: '御风',
        description: '25% 概率闪避攻击。闪避或使用技能后进入御风状态：移速 +40%，伤害 +25%，持续 2.5 秒。' }
    ],
    specialEffects: [
      { name: '御风步',
        description: '25% 闪避概率，闪避后立刻获得御风增益。' },
      { name: '御风之力',
        description: '御风状态下移速 +40%，造成的所有伤害 +25%，持续 2.5 秒。' },
      { name: '疾风突刺',
        description: '穿透目标冲刺，对路径上的所有敌人造成伤害并进入御风状态。' }
    ],
    skill: {
      name: '疾风突刺',
      nameEN: 'Gale Dash',
      cooldown: 7,
      damage: 12,
      range: 180,
      type: 'gale_dash',
      duration: 0
    },
    /**
     * Draw Wind Dancer decorations: flowing ribbons, slender blade, wind swirls.
     * After ctx.rotate(angle), the +X direction faces the enemy.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // ── Flowing wind ribbons (back) ──
      var ribbonWave1 = Math.sin(time * 5 + 0) * 8;
      var ribbonWave2 = Math.sin(time * 5 + 2) * 7;
      var ribbonWave3 = Math.sin(time * 4.5 + 1) * 6;

      ctx.strokeStyle = '#B0E0E6';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;

      // Top ribbon
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.3);
      ctx.quadraticCurveTo(-size * 0.8, -size * 0.6 + ribbonWave1, -size * 1.1, -size * 0.2 + ribbonWave1);
      ctx.stroke();

      // Middle ribbon
      ctx.strokeStyle = '#81D4FA';
      ctx.beginPath();
      ctx.moveTo(-size * 0.15, 0);
      ctx.quadraticCurveTo(-size * 0.9, ribbonWave2, -size * 1.2, size * 0.15 + ribbonWave2);
      ctx.stroke();

      // Bottom ribbon
      ctx.strokeStyle = '#B0E0E6';
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, size * 0.3);
      ctx.quadraticCurveTo(-size * 0.8, size * 0.55 + ribbonWave3, -size * 1.05, size * 0.45 + ribbonWave3);
      ctx.stroke();

      ctx.globalAlpha = 1;

      // ── Slender blade (held forward) ──
      var bladeWobble = Math.sin(time * 6) * 0.04;
      ctx.save();
      ctx.translate(size * 0.15, -size * 0.05);
      ctx.rotate(0.08 + bladeWobble);

      // Blade
      ctx.fillStyle = '#E0F7FA';
      ctx.strokeStyle = '#81D4FA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.06);
      ctx.lineTo(size * 0.9, -size * 0.02);
      ctx.lineTo(size * 0.95, 0);
      ctx.lineTo(size * 0.9, size * 0.02);
      ctx.lineTo(0, size * 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blade edge highlight
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(size * 0.3, -size * 0.02);
      ctx.lineTo(size * 0.92, 0);
      ctx.lineTo(size * 0.3, size * 0.02);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Guard
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, -size * 0.14);
      ctx.lineTo(size * 0.05, size * 0.14);
      ctx.stroke();

      // Hilt wrap
      ctx.strokeStyle = '#81D4FA';
      ctx.lineWidth = 1.5;
      for (var w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.08 + w * size * 0.06, -size * 0.16);
        ctx.lineTo(-size * 0.03 + w * size * 0.06, size * 0.16);
        ctx.stroke();
      }

      ctx.restore();

      // ── Wind swirl particles around body ──
      var swirlCount = 3;
      for (var i = 0; i < swirlCount; i++) {
        var swirlAngle = time * 3 + i * Math.PI * 2 / swirlCount;
        var swirlRadius = size * 0.7;
        var sx = Math.cos(swirlAngle) * swirlRadius;
        var sy = Math.sin(swirlAngle) * swirlRadius * 0.5;

        ctx.fillStyle = '#E0F7FA';
        ctx.globalAlpha = 0.35 + Math.sin(time * 4 + i) * 0.15;
        ctx.beginPath();
        ctx.arc(sx, sy, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Headband/headpiece (floating above) ──
      ctx.strokeStyle = '#B0E0E6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.35, -size * 0.5);
      ctx.quadraticCurveTo(0, -size * 0.7 + Math.sin(time * 3) * 3, size * 0.35, -size * 0.5);
      ctx.stroke();

      // Headpiece jewel
      ctx.fillStyle = '#E0F7FA';
      ctx.beginPath();
      ctx.arc(0, -size * 0.58 + Math.sin(time * 3) * 1.5, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  };
