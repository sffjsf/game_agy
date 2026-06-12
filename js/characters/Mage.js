export const mage = {
    id: 'mage',
    name: 'Mage',
    nameCN: '法师',
    color: '#9C27B0',
    secondaryColor: '#6A1B9A',
    glowColor: 'rgba(156, 39, 176, 0.4)',
    size: 36,
    speed: 3.6,
    hp: 100,
    attackPower: 16,
    attackSpeed: 1.6,
    chargeTime: 0.8,
    attackRange: 400,
    projectileSpeed: 800,
    lifesteal: 0,
    movePattern: 'arc',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'magic',
    skill: {
      name: '陨石术',
      nameEN: 'Meteor',
      cooldown: 12,
      damage: 35,
      range: 300,
      type: 'meteor',
      duration: 0,
      area: 120
    },
    /**
     * Draw 3 small orbiting magic circles around the body.
     * Uses sin/cos with time for smooth orbital animation.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();

      var orbitRadius = size + 10;
      var orbCount = 3;
      var orbSize = 4;

      for (var i = 0; i < orbCount; i++) {
        var orbAngle = time * 2.0 + (i * Math.PI * 2 / orbCount);
        var ox = x + Math.cos(orbAngle) * orbitRadius;
        var oy = y + Math.sin(orbAngle) * orbitRadius;

        // Outer glow
        ctx.beginPath();
        ctx.arc(ox, oy, orbSize + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(206, 147, 216, 0.3)';
        ctx.fill();

        // Inner orb
        ctx.beginPath();
        ctx.arc(ox, oy, orbSize, 0, Math.PI * 2);
        ctx.fillStyle = '#CE93D8';
        ctx.fill();
        ctx.strokeStyle = '#AB47BC';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Tiny sparkle inside
        ctx.beginPath();
        ctx.arc(ox - 1, oy - 1, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      }

      ctx.restore();
    }
  };
