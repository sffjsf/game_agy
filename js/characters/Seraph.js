export const seraph = {
    id: 'seraph',
    isHero: true,
    name: 'Seraph',
    nameCN: '炽天使',
    color: '#FF3D00',
    secondaryColor: '#FFD600',
    glowColor: 'rgba(255, 61, 0, 0.5)',
    size: 34,
    speed: 4.8,
    hp: 230,
    attackPower: 18,
    attackSpeed: 1.2,
    chargeTime: 0.3,
    attackRange: 75,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      {
        id: 'blazing_wings',
        name: '炽天之翼',
        description: '当受到攻击时，对攻击者施加灼烧效果，在 2 秒内每秒造成 6 点伤害。'
      }
    ],
    skill: {
      name: '横冲直闯',
      nameEN: 'Blazing Stampede',
      cooldown: 11,
      damage: 22,
      range: 350,
      type: 'blazing_stampede',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Flapping angle
      const flap = Math.sin(time * 7.5) * 0.22;

      // Helper to draw a flame wing shape
      const drawWing = (c, sz) => {
        const grad = c.createLinearGradient(0, 0, sz * 1.6, 0);
        grad.addColorStop(0, '#FFF59D'); // Light yellow base
        grad.addColorStop(0.3, '#FFD54F'); // Gold inner
        grad.addColorStop(0.7, '#FF3D00'); // Orange-red main
        grad.addColorStop(1, 'rgba(230, 81, 0, 0)'); // Fades at tips

        c.fillStyle = grad;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(sz * 0.6, -sz * 0.5, sz * 1.6, 0);
        c.quadraticCurveTo(sz * 0.8, sz * 0.5, 0, 0);
        c.fill();

        // Inner glowing core
        c.fillStyle = '#FFFFFF';
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(sz * 0.35, -sz * 0.2, sz * 0.9, 0);
        c.quadraticCurveTo(sz * 0.45, sz * 0.2, 0, 0);
        c.fill();
      };

      // 1. Left wing (pointing back-upwards)
      ctx.save();
      ctx.translate(-size * 0.25, -size * 0.25);
      ctx.rotate(-Math.PI * 0.65 + flap);
      drawWing(ctx, size);
      ctx.restore();

      // 2. Right wing (pointing back-downwards)
      ctx.save();
      ctx.translate(-size * 0.25, size * 0.25);
      ctx.rotate(Math.PI * 0.65 - flap);
      drawWing(ctx, size);
      ctx.restore();

      // 3. Draw a burning halo on top of head (offset backwards in local space)
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#FF3D00';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      // Draw tilted ellipse for 3D look
      ctx.ellipse(-size * 0.15, 0, size * 0.25, size * 0.08, Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
};
