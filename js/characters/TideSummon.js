export const tide_summon = {
    id: 'tide_summon',
    name: 'Tide Sprite',
    nameCN: '水元素残响',
    color: 'rgba(128, 222, 234, 0.45)', // Translucent tide blue
    secondaryColor: '#00838F',
    glowColor: 'rgba(128, 222, 234, 0.35)',

    // Stats
    size: 24, // Smaller
    speed: 4.0,
    hp: 88,
    attackPower: 6,
    attackSpeed: 1.2,
    chargeTime: 0.3,
    attackRange: 280,
    lifesteal: 0,
    hidden: true, // Hide from select UI

    // AI & Movement
    movePattern: 'keepDistance',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'water_orb',

    skill: {
        name: '水流弹喷射',
        cooldown: 99,
        damage: 0,
        range: 0,
        type: 'none',
        duration: 0
    },

    /**
     * Draw water sprite: translucent watery orb with orbiting bubbles.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Force transparency for water elemental look
      ctx.globalAlpha = 0.55;
      
      // Floating bubble details inside the body
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-size * 0.2, -size * 0.25, size * 0.2, 0, Math.PI * 2);
      ctx.arc(size * 0.35, size * 0.15, size * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting water drops
      ctx.fillStyle = '#00E5FF';
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 4;
      var bubbleRadius = size * 1.35;
      for (var i = 0; i < 3; i++) {
        var a = time * 2.5 + i * (Math.PI * 2 / 3);
        var bx = Math.cos(a) * bubbleRadius;
        var by = Math.sin(a) * bubbleRadius;

        ctx.beginPath();
        ctx.arc(bx, by, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
};
