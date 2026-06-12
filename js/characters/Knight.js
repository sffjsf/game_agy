export const knight = {
    id: 'knight',
    name: 'Knight',
    nameCN: '骑士',
    color: '#FFB300',
    secondaryColor: '#FF8F00',
    glowColor: 'rgba(255, 179, 0, 0.4)',
    size: 36,
    speed: 5.0,
    hp: 100,
    attackPower: 22,
    attackSpeed: 2.0,
    chargeTime: 0.8,
    attackRange: 80,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    skill: {
      name: '盾击',
      nameEN: 'Shield Bash',
      cooldown: 10,
      damage: 15,
      range: 90,
      type: 'stun',
      duration: 1.5
    },
    /**
     * Draw a shield shape on one side with cross pattern.
     * Semi-circle with golden cross emblem.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Shield on the front-left side
      var shieldX = size * 0.6;
      var shieldY = -size * 0.1;
      var shieldW = size * 0.8;
      var shieldH = size * 1.2;

      // Shield body (rounded rectangle approximation)
      ctx.beginPath();
      ctx.moveTo(shieldX, shieldY - shieldH / 2);
      ctx.lineTo(shieldX + shieldW * 0.8, shieldY - shieldH / 2);
      ctx.quadraticCurveTo(shieldX + shieldW, shieldY - shieldH / 2, shieldX + shieldW, shieldY - shieldH * 0.2);
      ctx.lineTo(shieldX + shieldW, shieldY + shieldH * 0.2);
      ctx.quadraticCurveTo(shieldX + shieldW, shieldY + shieldH * 0.4, shieldX + shieldW * 0.5, shieldY + shieldH / 2);
      ctx.quadraticCurveTo(shieldX, shieldY + shieldH * 0.4, shieldX, shieldY + shieldH * 0.2);
      ctx.lineTo(shieldX, shieldY - shieldH / 2);
      ctx.closePath();
      ctx.fillStyle = '#FFC107';
      ctx.fill();
      ctx.strokeStyle = '#FF8F00';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cross pattern on shield
      var crossCX = shieldX + shieldW * 0.5;
      var crossCY = shieldY;

      // Vertical bar
      ctx.beginPath();
      ctx.moveTo(crossCX, shieldY - shieldH * 0.3);
      ctx.lineTo(crossCX, shieldY + shieldH * 0.3);
      ctx.strokeStyle = '#E65100';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Horizontal bar
      ctx.beginPath();
      ctx.moveTo(shieldX + shieldW * 0.2, crossCY - shieldH * 0.05);
      ctx.lineTo(shieldX + shieldW * 0.8, crossCY - shieldH * 0.05);
      ctx.stroke();

      ctx.restore();
    }
  };
