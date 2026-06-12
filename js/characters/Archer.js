export const archer = {
    id: 'archer',
    name: 'Archer',
    nameCN: '弓手',
    color: '#4CAF50',
    secondaryColor: '#2E7D32',
    glowColor: 'rgba(76, 175, 80, 0.4)',
    size: 36,
    speed: 4.5,
    hp: 100,
    attackPower: 11,
    attackSpeed: 1.1,
    chargeTime: 0.4,
    attackRange: 420,
    projectileSpeed: 1000,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'arrow',
    skill: {
      name: '三连射',
      nameEN: 'Triple Shot',
      cooldown: 8,
      damage: 10,
      range: 300,
      type: 'multi_shot',
      duration: 0
    },
    /**
     * Draw a bow shape (arc) on the side facing the angle direction.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Bow arc (wooden brown)
      ctx.beginPath();
      ctx.arc(size + 4, 0, size * 0.9, -Math.PI * 0.45, Math.PI * 0.45, false);
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Bowstring
      var bowRadius = size * 0.9;
      var stringStartY = -Math.sin(Math.PI * 0.45) * bowRadius;
      var stringEndY = Math.sin(Math.PI * 0.45) * bowRadius;
      var stringStartX = size + 4 + Math.cos(Math.PI * 0.45) * bowRadius;
      ctx.beginPath();
      ctx.moveTo(stringStartX, stringStartY);
      ctx.lineTo(size + 2, 0); // Drawn back slightly
      ctx.lineTo(stringStartX, stringEndY);
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Arrow nocked on string (subtle)
      ctx.beginPath();
      ctx.moveTo(size + 2, 0);
      ctx.lineTo(size + 4 + bowRadius + 5, 0);
      ctx.strokeStyle = '#795548';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(size + 4 + bowRadius + 5, 0);
      ctx.lineTo(size + 4 + bowRadius + 1, -3);
      ctx.lineTo(size + 4 + bowRadius + 1, 3);
      ctx.closePath();
      ctx.fillStyle = '#9E9E9E';
      ctx.fill();

      ctx.restore();
    }
  };
