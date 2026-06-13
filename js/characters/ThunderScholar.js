export const thunder_scholar = {
    id: 'thunder_scholar',
    name: 'Thunder Scholar',
    nameCN: '雷霆学者',
    color: '#00BFFF',             // Sky blue
    secondaryColor: '#FFFFFF',    // White
    glowColor: 'rgba(0, 191, 255, 0.45)', // Blue glow

    // Stats
    size: 34,
    speed: 3.8,
    hp: 95,
    attackPower: 15,
    attackSpeed: 1.5,
    chargeTime: 0.5,
    attackRange: 360,
    lifesteal: 0,

    // AI & Mechanics
    movePattern: 'keepDistance',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'magic',

    // Skill Definition
    skill: {
        name: '连锁闪电',
        nameEN: 'Chain Lightning',
        cooldown: 8,
        damage: 18,
        range: 400,
        type: 'chain_lightning',
        duration: 1.5 // slow duration
    },

    /**
     * Draw Thunder Scholar decorations: magic scroll book and orbiting electric orbs.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // 1. Draw Magic Scroll Book in front (+X direction, offset from body size)
      ctx.save();
      ctx.translate(size * 0.7, -size * 0.4);
      ctx.rotate(0.25); // Slight angle for reading/holding

      // Book cover (dark cyan)
      ctx.fillStyle = '#008B8B';
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(-10, -12, 20, 24);
      ctx.fill();
      ctx.stroke();

      // Open parchment pages
      ctx.fillStyle = '#FFFDE7';
      ctx.beginPath();
      // Left page curve
      ctx.moveTo(-8, -10);
      ctx.quadraticCurveTo(-4, -11, 0, -9);
      ctx.lineTo(0, 9);
      ctx.quadraticCurveTo(-4, 7, -8, 8);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      // Right page curve
      ctx.moveTo(0, -9);
      ctx.quadraticCurveTo(4, -11, 8, -10);
      ctx.lineTo(8, 8);
      ctx.quadraticCurveTo(4, 7, 0, 9);
      ctx.closePath();
      ctx.fill();

      // Tiny spell lines on book pages
      ctx.strokeStyle = 'rgba(0, 191, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, -5); ctx.lineTo(-2, -5);
      ctx.moveTo(-6, 0);  ctx.lineTo(-2, 0);
      ctx.moveTo(-6, 5);  ctx.lineTo(-2, 5);
      ctx.moveTo(2, -5);  ctx.lineTo(6, -5);
      ctx.moveTo(2, 0);   ctx.lineTo(6, 0);
      ctx.moveTo(2, 5);   ctx.lineTo(6, 5);
      ctx.stroke();

      ctx.restore();

      // 2. Draw Orbiting Lightning Orbs
      var orbitRadius = size * 1.35;
      var orbCount = 2;
      var orbSize = size * 0.12;

      for (var i = 0; i < orbCount; i++) {
        var orbAngle = time * 3.5 + (i * Math.PI);
        var ox = Math.cos(orbAngle) * orbitRadius;
        var oy = Math.sin(orbAngle) * orbitRadius;

        // Draw radial electric glow
        var grad = ctx.createRadialGradient(ox, oy, 1, ox, oy, orbSize * 2.5);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(0, 229, 255, 0.85)');
        grad.addColorStop(0.6, 'rgba(0, 191, 255, 0.3)');
        grad.addColorStop(1, 'rgba(0, 191, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ox, oy, orbSize * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw micro electric discharges radiating from the center of the orb
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var k = 0; k < 3; k++) {
          var sparkAngle = time * 12 + k * (Math.PI * 2 / 3);
          var sx1 = ox + Math.cos(sparkAngle) * (orbSize * 0.8);
          var sy1 = oy + Math.sin(sparkAngle) * (orbSize * 0.8);
          var sx2 = ox + Math.cos(sparkAngle + 0.25) * (orbSize * 1.8);
          var sy2 = oy + Math.sin(sparkAngle + 0.25) * (orbSize * 1.8);

          ctx.moveTo(sx1, sy1);
          // Midpoint offset to make it look zig-zagged
          ctx.lineTo((sx1 + sx2) / 2 + (Math.random() - 0.5) * 2.5, (sy1 + sy2) / 2 + (Math.random() - 0.5) * 2.5);
          ctx.lineTo(sx2, sy2);
        }
        ctx.stroke();
      }

      ctx.restore();
    }
};
