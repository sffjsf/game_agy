export const tidebringer = {
    id: 'tidebringer',
    isHero: true,
    name: 'Tidebringer',
    nameCN: '潮汐之主',
    color: '#006064',             // Deep Ocean Green
    secondaryColor: '#80DEEA',    // Tide Blue
    glowColor: 'rgba(0, 96, 100, 0.6)',

    // Stats
    size: 34,
    speed: 4.4,
    hp: 120,
    attackPower: 15,
    attackSpeed: 0.85,
    chargeTime: 0.3,
    attackRange: 340,
    lifesteal: 0,

    // AI & Movement
    movePattern: 'keepDistance',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'water_orb',

    passives: [
        { id: 'tide_shield', name: '潮汐壁垒', description: '每 7 秒获得 15% 生命值护盾。护盾破碎时冰冻周围敌军 1.2 秒。' },
        { id: 'abyssal_weight', name: '深渊重压', description: '普通攻击使目标的攻击速度和移动速度降低 20%，可叠加 2 层。' },
        { id: 'oceanic_unity', name: '百川归海', description: '场上每存在一个友方召唤物，自身与友方召唤物伤害提升 8%。' }
    ],

    specialEffects: [
        { name: '深海狂澜', description: '召唤巨浪击退路线上的敌人，并在终点召唤小潮汐人。' },
        { name: '冰冻打击', description: '护盾爆破时，将大范围敌军冰封禁锢。' }
    ],

    // Skill Definition
    skill: {
        name: '深海狂澜',
        nameEN: 'Abyssal Torrent',
        cooldown: 11,
        damage: 24,
        range: 420,
        type: 'abyssal_torrent',
        duration: 0
    },

    /**
     * Draw Tidebringer decorations: gold-cyan trident and rotating wave whirlpools.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // 1. Draw foot water whirlpools (underneath body)
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.shadowColor = '#80DEEA';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 1.5;

      // Whirlpool 1: Outer ellipse rotating slowly
      ctx.save();
      ctx.rotate(time * 1.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.4, size * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Whirlpool 2: Mid ellipse rotating faster in opposite direction
      ctx.save();
      ctx.rotate(-time * 2.2 + 1.0);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.15, size * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Whirlpool 3: Inner ellipse
      ctx.save();
      ctx.rotate(time * 3.0 + 2.0);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.9, size * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // 2. Draw ocean trident (Right hand side: rotated slightly slanting)
      ctx.save();
      ctx.translate(size * 0.35, size * 0.5);
      ctx.rotate(0.12);

      // Trident Shaft (Gold and cyan)
      ctx.strokeStyle = '#00838F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.9, 0);
      ctx.lineTo(size * 0.9, 0);
      ctx.stroke();

      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, 0);
      ctx.lineTo(size * 0.4, 0);
      ctx.stroke();

      // Trident Tip Guard (Gold crossguard)
      ctx.fillStyle = '#FFD54F';
      ctx.beginPath();
      ctx.rect(size * 0.82, -5, 2, 10);
      ctx.fill();

      // Trident Prongs (three cyan blades)
      ctx.fillStyle = '#80DEEA';
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 0.8;

      // Middle Prong (longer)
      ctx.beginPath();
      ctx.moveTo(size * 0.9, -2.5);
      ctx.lineTo(size * 1.25, 0);
      ctx.lineTo(size * 0.9, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left Prong (curved)
      ctx.beginPath();
      ctx.moveTo(size * 0.85, -2);
      ctx.quadraticCurveTo(size * 1.0, -10, size * 1.15, -12);
      ctx.lineTo(size * 1.12, -9);
      ctx.quadraticCurveTo(size * 0.98, -5, size * 0.85, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Prong (curved)
      ctx.beginPath();
      ctx.moveTo(size * 0.85, 2);
      ctx.quadraticCurveTo(size * 1.0, 10, size * 1.15, 12);
      ctx.lineTo(size * 1.12, 9);
      ctx.quadraticCurveTo(size * 0.98, 5, size * 0.85, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Water droplet dripping off the tip
      var dropProgress = (time * 1.3) % 1.0;
      ctx.fillStyle = 'rgba(128, 222, 234, ' + (1 - dropProgress) + ')';
      ctx.beginPath();
      ctx.arc(size * 1.25 + dropProgress * 8, 0, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.restore();
    }
};
