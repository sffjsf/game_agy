export const shadow_clone = {
    id: 'shadow_clone',
    name: 'Shadow Decoy',
    nameCN: '影刃残影',
    color: 'rgba(156, 39, 176, 0.4)', // Semi-transparent purple body
    secondaryColor: '#4A148C',
    glowColor: 'rgba(156, 39, 176, 0.3)',

    // Stats (stationary decoy)
    size: 34,
    speed: 0,
    hp: 40,
    attackPower: 0,
    attackSpeed: 9.9, // extremely slow
    chargeTime: 0.9,
    attackRange: 0,
    lifesteal: 0,
    hidden: true, // Hide from character select UI

    // AI & Movement
    movePattern: 'linear',
    aiTendency: 'cautious',
    weaponType: 'melee',
    projectileType: null,

    skill: {
        name: '残影消逝',
        cooldown: 99,
        damage: 0,
        range: 0,
        type: 'none',
        duration: 0
    },

    /**
     * Draw decoy: a shadowy, translucent version of the Blade Master.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Force high translucency for shadow effect
      ctx.globalAlpha = 0.45;

      // Draw flowing ribbon/scarf behind (-X direction)
      ctx.strokeStyle = '#4A148C';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, -size * 0.25);
      var wave1 = Math.sin(time * 5) * 5;
      ctx.quadraticCurveTo(-size * 1.3, -size * 0.45 + wave1, -size * 1.8, -size * 0.3 + wave1 * 0.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-size * 0.7, size * 0.25);
      var wave2 = Math.sin(time * 5 + Math.PI * 0.5) * 5;
      ctx.quadraticCurveTo(-size * 1.3, size * 0.45 + wave2, -size * 1.8, size * 0.3 + wave2 * 0.5);
      ctx.stroke();

      // Draw twin shadow blades (+X direction)
      ctx.fillStyle = '#6A1B9A';
      ctx.strokeStyle = '#7B1FA2';
      ctx.lineWidth = 1;

      // Left Blade
      ctx.save();
      ctx.translate(size * 0.3, -size * 0.45);
      ctx.rotate(-0.08);
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(size * 1.25, -1.5);
      ctx.lineTo(size * 1.4, 0);
      ctx.lineTo(size * 1.25, 1.5);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Right Blade
      ctx.save();
      ctx.translate(size * 0.3, size * 0.45);
      ctx.rotate(0.08);
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(size * 1.25, -1.5);
      ctx.lineTo(size * 1.4, 0);
      ctx.lineTo(size * 1.25, 1.5);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
};
