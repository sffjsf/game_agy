export const ninja = {
    id: 'ninja',
    name: 'Ninja',
    nameCN: '忍者',
    color: '#37474F',
    secondaryColor: '#1B2631',
    glowColor: 'rgba(55, 71, 79, 0.4)',
    size: 36,
    speed: 5.2,
    hp: 100,
    attackPower: 8,
    attackSpeed: 0.65,
    chargeTime: 0.2,
    attackRange: 320,
    projectileSpeed: 1200,
    lifesteal: 0,
    movePattern: 'zigzag',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'shuriken',
    skill: {
      name: '分身术',
      nameEN: 'Shadow Clone',
      cooldown: 12,
      damage: 8,
      range: 150,
      type: 'clone',
      duration: 0
    },
    /**
     * Draw a trailing scarf behind the movement direction.
     * Wavy line that flows opposite to facing direction.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Scarf trails behind (opposite direction = negative x in rotated coords)
      var scarfSegments = 5;
      var segmentLen = 8;

      ctx.beginPath();
      // Start from the back of the character
      ctx.moveTo(-size * 0.8, -3);

      for (var i = 1; i <= scarfSegments; i++) {
        var sx = -size * 0.8 - i * segmentLen;
        var sy = Math.sin(time * 6 + i * 0.8) * (3 + i * 1.5) - 3;
        ctx.lineTo(sx, sy);
      }

      // Return path for thickness
      for (var j = scarfSegments; j >= 1; j--) {
        var sx2 = -size * 0.8 - j * segmentLen;
        var sy2 = Math.sin(time * 6 + j * 0.8) * (3 + j * 1.5) + 3;
        ctx.lineTo(sx2, sy2);
      }

      ctx.lineTo(-size * 0.8, 3);
      ctx.closePath();

      // Gradient-like effect: darker at base, lighter at tip
      ctx.fillStyle = '#D32F2F';
      ctx.fill();
      ctx.strokeStyle = '#B71C1C';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Scarf tip accent
      var tipX = -size * 0.8 - scarfSegments * segmentLen;
      var tipY = Math.sin(time * 6 + scarfSegments * 0.8) * (3 + scarfSegments * 1.5);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FF5252';
      ctx.fill();

      ctx.restore();
    }
  };
