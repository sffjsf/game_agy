export const rogue = {
    id: 'rogue',
    name: 'Rogue',
    nameCN: '盗贼',
    color: '#263238',
    secondaryColor: '#7E57C2',
    glowColor: 'rgba(126, 87, 194, 0.45)',
    size: 36,
    speed: 5.6,
    hp: 88,
    attackPower: 13,
    attackSpeed: 0.75,
    chargeTime: 0.16,
    attackRange: 65,
    lifesteal: 0.08,
    movePattern: 'flank',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'rogue_backstab',
        name: '背刺',
        description: '从目标背后攻击时造成额外伤害。' },
      { id: 'smoke_step',
        name: '烟步',
        description: '烟雾弹后短时间内闪避率提高。' }
    ],
    specialEffects: [
      { name: '背刺',
        description: '在目标背后命中时造成 45% 额外伤害。' },
      { name: '烟雾弹',
        description: '制造烟雾，短暂提高闪避并移动到目标侧后方。' }
    ],
    skill: {
      name: '烟雾弹',
      nameEN: 'Smoke Bomb',
      cooldown: 8,
      damage: 8,
      range: 135,
      type: 'smoke_bomb',
      duration: 2.0,
      smokeRadius: 120
    },
    /**
     * Draw Rogue decorations: dual daggers, hood and smoke wisps.
     * After ctx.rotate(angle), the +X direction faces the enemy.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Hood
      ctx.fillStyle = '#1C2529';
      ctx.strokeStyle = '#7E57C2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.45, -size * 0.25);
      ctx.quadraticCurveTo(0, -size * 0.85, size * 0.45, -size * 0.25);
      ctx.quadraticCurveTo(size * 0.2, -size * 0.05, -size * 0.2, -size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Purple eye slit
      ctx.strokeStyle = '#B39DDB';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-size * 0.22, -size * 0.25);
      ctx.lineTo(size * 0.22, -size * 0.25);
      ctx.stroke();

      // Dual daggers
      var flicker = Math.sin(time * 7) * 0.05;
      const drawDagger = function(handY, rot) {
        ctx.save();
        ctx.translate(size * 0.48, handY);
        ctx.rotate(rot + flicker);
        ctx.fillStyle = '#ECEFF1';
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(size * 0.78, 0);
        ctx.lineTo(0, -size * 0.08);
        ctx.lineTo(size * 0.08, 0);
        ctx.lineTo(0, size * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#7E57C2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-size * 0.08, 0);
        ctx.lineTo(size * 0.12, 0);
        ctx.stroke();
        ctx.restore();
      };

      drawDagger(-size * 0.45, -0.35);
      drawDagger(size * 0.45, 0.35);

      // Smoke wisps behind
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#B39DDB';
      ctx.lineWidth = 2;
      for (var i = 0; i < 3; i++) {
        var offset = i * size * 0.22;
        ctx.beginPath();
        ctx.moveTo(-size * 0.45 - offset, -size * 0.2 + i * size * 0.18);
        ctx.quadraticCurveTo(
          -size * 0.75 - offset,
          Math.sin(time * 3 + i) * size * 0.25,
          -size * 0.55 - offset,
          size * 0.35 - i * size * 0.1
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    }
  };
