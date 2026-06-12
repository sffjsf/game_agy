export const vampire = {
    id: 'vampire',
    name: 'Vampire',
    nameCN: '吸血鬼',
    color: '#E53935',
    secondaryColor: '#B71C1C',
    glowColor: 'rgba(229, 57, 53, 0.4)',
    size: 36,
    speed: 4.6,
    hp: 100,
    attackPower: 14,
    attackSpeed: 1.3,
    chargeTime: 0.3,
    attackRange: 80,
    lifesteal: 0.3,
    movePattern: 'dash',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'lifesteal', name: '吸血体质', description: '造成伤害时回复 30% 伤害值的生命。' }
    ],
    skill: {
      name: '暗影冲刺',
      nameEN: 'Shadow Dash',
      cooldown: 8,
      damage: 20,
      range: 150,
      type: 'dash',
      duration: 0
    },
    /**
     * Draw bat wings on left and right sides.
     * Curved triangular shapes with visible wing structure.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Slight wing flap animation
      var flapOffset = Math.sin(time * 5) * 3;

      // --- Right wing (top side) ---
      ctx.beginPath();
      ctx.moveTo(-2, -size * 0.3);
      // Wing tip
      ctx.quadraticCurveTo(-size * 0.8, -size * 1.5 - flapOffset, -size * 1.4, -size * 0.8 - flapOffset);
      // Wing scallop 1
      ctx.quadraticCurveTo(-size * 1.0, -size * 0.5, -size * 1.1, -size * 0.3);
      // Wing scallop 2
      ctx.quadraticCurveTo(-size * 0.7, -size * 0.2, -size * 0.6, -size * 0.1);
      ctx.lineTo(-2, -size * 0.1);
      ctx.closePath();
      ctx.fillStyle = '#8B0000';
      ctx.fill();
      ctx.strokeStyle = '#5C0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Wing bone structure (right)
      ctx.beginPath();
      ctx.moveTo(-2, -size * 0.3);
      ctx.lineTo(-size * 1.1, -size * 1.2 - flapOffset);
      ctx.strokeStyle = '#6D0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-2, -size * 0.2);
      ctx.lineTo(-size * 0.9, -size * 0.6 - flapOffset * 0.5);
      ctx.stroke();

      // --- Left wing (bottom side) ---
      ctx.beginPath();
      ctx.moveTo(-2, size * 0.3);
      ctx.quadraticCurveTo(-size * 0.8, size * 1.5 + flapOffset, -size * 1.4, size * 0.8 + flapOffset);
      ctx.quadraticCurveTo(-size * 1.0, size * 0.5, -size * 1.1, size * 0.3);
      ctx.quadraticCurveTo(-size * 0.7, size * 0.2, -size * 0.6, size * 0.1);
      ctx.lineTo(-2, size * 0.1);
      ctx.closePath();
      ctx.fillStyle = '#8B0000';
      ctx.fill();
      ctx.strokeStyle = '#5C0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Wing bone structure (left)
      ctx.beginPath();
      ctx.moveTo(-2, size * 0.3);
      ctx.lineTo(-size * 1.1, size * 1.2 + flapOffset);
      ctx.strokeStyle = '#6D0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-2, size * 0.2);
      ctx.lineTo(-size * 0.9, size * 0.6 + flapOffset * 0.5);
      ctx.stroke();

      ctx.restore();
    }
  };
