export const minion = {
    id: 'minion',
    name: 'Minion',
    nameCN: '小黄人',
    color: '#FDD835',
    secondaryColor: '#F9A825',
    glowColor: 'rgba(253, 216, 53, 0.4)',
    size: 36,
    speed: 4.3,
    hp: 100,
    attackPower: 10,
    attackSpeed: 0.85,
    chargeTime: 0.3,
    attackRange: 340,
    projectileSpeed: 900,
    lifesteal: 0.05,
    movePattern: 'wobble',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'banana',
    passives: [
      { id: 'lifesteal', name: '偷吃回复', description: '造成伤害时回复 5% 伤害值的生命。' }
    ],
    skill: {
      name: '香蕉皮',
      nameEN: 'Banana Peel',
      cooldown: 9,
      damage: 8,
      range: 210,
      type: 'slow',
      duration: 2
    },
    /**
     * Draw goggle/eye and a small weapon circle.
     * Mimics the classic minion look with a single large goggle.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // --- Goggle (large eye) ---
      var goggleX = size * 0.3;
      var goggleY = -size * 0.1;
      var goggleRadius = size * 0.4;

      // Goggle frame (silver ring)
      ctx.beginPath();
      ctx.arc(goggleX, goggleY, goggleRadius + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#BDBDBD';
      ctx.fill();
      ctx.strokeStyle = '#757575';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Goggle strap (goes around)
      ctx.beginPath();
      ctx.moveTo(goggleX + goggleRadius + 2, goggleY - 2);
      ctx.lineTo(goggleX + goggleRadius + 8, goggleY - 3);
      ctx.moveTo(goggleX + goggleRadius + 2, goggleY + 2);
      ctx.lineTo(goggleX + goggleRadius + 8, goggleY + 3);
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Eye white
      ctx.beginPath();
      ctx.arc(goggleX, goggleY, goggleRadius - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Iris (brown, follows angle slightly)
      var irisOffX = Math.cos(0) * 2; // Slight look direction
      var irisOffY = Math.sin(0) * 2;
      ctx.beginPath();
      ctx.arc(goggleX + irisOffX, goggleY + irisOffY, goggleRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#5D4037';
      ctx.fill();

      // Pupil
      ctx.beginPath();
      ctx.arc(goggleX + irisOffX, goggleY + irisOffY, goggleRadius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Eye glint
      ctx.beginPath();
      ctx.arc(goggleX + irisOffX + 2, goggleY + irisOffY - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();

      // --- Small weapon circle (banana launcher) ---
      var weapX = -size * 0.5;
      var weapY = size * 0.5;
      ctx.beginPath();
      ctx.arc(weapX, weapY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#8D6E63';
      ctx.fill();
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tiny banana on weapon
      ctx.beginPath();
      ctx.arc(weapX, weapY, 3, -Math.PI * 0.3, Math.PI * 0.7, false);
      ctx.strokeStyle = '#FDD835';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  };
