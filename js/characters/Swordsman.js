export const swordsman = {
    id: 'swordsman',
    name: 'Swordsman',
    nameCN: '剑士',
    color: '#4A90D9',
    secondaryColor: '#2C5F8A',
    glowColor: 'rgba(74, 144, 217, 0.4)',
    size: 36,
    speed: 4.8,
    hp: 100,
    attackPower: 18,
    attackSpeed: 1.4,
    chargeTime: 0.3,
    attackRange: 80,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    skill: {
      name: '旋风斩',
      nameEN: 'Whirlwind',
      cooldown: 10,
      damage: 25,
      range: 100,
      type: 'aoe_melee',
      duration: 0
    },
    /**
     * Draw a sword blade pointing in the facing direction.
     * Silver triangular blade with a gold crossguard.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Sword blade (silver triangle extending from body)
      var bladeLength = size * 1.6;
      var bladeWidth = size * 0.25;
      ctx.beginPath();
      ctx.moveTo(size + bladeLength, 0);          // Tip
      ctx.lineTo(size + 2, -bladeWidth);           // Base left
      ctx.lineTo(size + 2, bladeWidth);            // Base right
      ctx.closePath();
      ctx.fillStyle = '#C0C0C0';
      ctx.fill();
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Blade shine (thin white line down center)
      ctx.beginPath();
      ctx.moveTo(size + 4, 0);
      ctx.lineTo(size + bladeLength - 4, 0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Gold crossguard
      ctx.beginPath();
      ctx.moveTo(size, -bladeWidth * 1.5);
      ctx.lineTo(size + 4, -bladeWidth * 1.5);
      ctx.lineTo(size + 4, bladeWidth * 1.5);
      ctx.lineTo(size, bladeWidth * 1.5);
      ctx.closePath();
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  };
