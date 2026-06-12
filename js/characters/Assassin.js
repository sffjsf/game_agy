export const assassin = {
    id: 'assassin',
    name: 'Assassin',
    nameCN: '刺客',
    color: '#B71C1C',
    secondaryColor: '#7F0000',
    glowColor: 'rgba(183, 28, 28, 0.4)',
    size: 36,
    speed: 5.4,
    hp: 100,
    attackPower: 12,
    attackSpeed: 0.9,
    chargeTime: 0.15,
    attackRange: 70,
    lifesteal: 0.1,
    movePattern: 'flank',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'lifesteal', name: '割裂汲取', description: '造成伤害时回复 10% 伤害值的生命。' }
    ],
    skill: {
      name: '背刺',
      nameEN: 'Backstab',
      cooldown: 7,
      damage: 30,
      range: 80,
      type: 'backstab',
      duration: 0
    },
    /**
     * Draw two small daggers (thin triangles) on either side.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      var daggerLen = size * 1.0;
      var daggerWidth = 3;

      // Dagger 1 (upper right)
      ctx.save();
      ctx.translate(size * 0.5, -size * 0.6);
      ctx.rotate(0.3); // Slight upward angle

      ctx.beginPath();
      ctx.moveTo(daggerLen, 0);              // Tip
      ctx.lineTo(0, -daggerWidth);           // Base upper
      ctx.lineTo(2, 0);                      // Notch
      ctx.lineTo(0, daggerWidth);            // Base lower
      ctx.closePath();
      ctx.fillStyle = '#9E9E9E';
      ctx.fill();
      ctx.strokeStyle = '#616161';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Handle
      ctx.beginPath();
      ctx.moveTo(0, -daggerWidth);
      ctx.lineTo(-6, -daggerWidth * 0.8);
      ctx.lineTo(-6, daggerWidth * 0.8);
      ctx.lineTo(0, daggerWidth);
      ctx.closePath();
      ctx.fillStyle = '#4E342E';
      ctx.fill();

      ctx.restore();

      // Dagger 2 (lower right)
      ctx.save();
      ctx.translate(size * 0.5, size * 0.6);
      ctx.rotate(-0.3); // Slight downward angle

      ctx.beginPath();
      ctx.moveTo(daggerLen, 0);
      ctx.lineTo(0, -daggerWidth);
      ctx.lineTo(2, 0);
      ctx.lineTo(0, daggerWidth);
      ctx.closePath();
      ctx.fillStyle = '#9E9E9E';
      ctx.fill();
      ctx.strokeStyle = '#616161';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Handle
      ctx.beginPath();
      ctx.moveTo(0, -daggerWidth);
      ctx.lineTo(-6, -daggerWidth * 0.8);
      ctx.lineTo(-6, daggerWidth * 0.8);
      ctx.lineTo(0, daggerWidth);
      ctx.closePath();
      ctx.fillStyle = '#4E342E';
      ctx.fill();

      ctx.restore();

      ctx.restore();
    }
  };
