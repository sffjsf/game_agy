export const time_traveler = {
    id: 'time_traveler',
    isHero: true,
    name: 'Time Traveler',
    nameCN: '时间旅者',
    color: '#E6C229',             // Gold/Brass
    secondaryColor: '#F17105',    // Clock Glowing Orange
    glowColor: 'rgba(230, 194, 41, 0.5)',

    // Stats
    size: 34,
    speed: 4.5,
    hp: 160,
    attackPower: 13,
    attackSpeed: 0.7,
    chargeTime: 0.1,
    attackRange: 360,
    lifesteal: 0,

    // AI & Movement
    movePattern: 'arc', // Circles targets in orbital path
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'time_bolt',

    passives: [
        { id: 'chronoshift', name: '时光倒流', description: '友军或自己受到致命伤害时免疫死亡，使其处于 1 秒无敌，之后倒流回 3 秒前状态。单局仅限一次。' },
        { id: 'temporal_dilation', name: '时空膨胀', description: '普通攻击使目标的技能冷却速度减缓 30%，持续 2.5 秒。' }
    ],

    specialEffects: [
        { name: '时空跃迁', description: '受到攻击时有机率闪避伤害并触发短距离瞬移。' },
        { name: '时针结界', description: '创造时间场加速友军的移速、攻速和技能冷却，大幅度迟滞敌军。' }
    ],

    // Skill Definition
    skill: {
        name: '时间结界',
        nameEN: 'Temporal Field',
        cooldown: 6,
        damage: 25,
        range: 480, // Restored to original range
        type: 'temporal_field',
        duration: 999, // Permanent duration
        area: 150 // Restored to original area radius
    },

    /**
     * Draw Time Traveler decorations: rotating back gears and chrono-gun.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // 1. Draw back rotating gear system (-X direction)
      ctx.save();
      ctx.translate(-size * 0.5, 0);

      // 1a. Large central brass gear
      ctx.save();
      ctx.rotate(time * 1.2);
      ctx.fillStyle = '#D4AF37'; // Brass Gold
      ctx.strokeStyle = '#9E7815';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Gear teeth (8 teeth)
      for (var i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI * 2 / 8);
        ctx.fillRect(size * 0.46, -4, 5, 8);
        ctx.strokeRect(size * 0.46, -4, 5, 8);
        ctx.restore();
      }

      // Center hole
      ctx.fillStyle = '#1A1A24';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 1b. Small copper gear (top-right of the large gear)
      ctx.save();
      ctx.translate(size * 0.35, -size * 0.4);
      ctx.rotate(-time * 2.4); // spins opposite and faster
      ctx.fillStyle = '#B87333'; // Copper
      ctx.strokeStyle = '#8D4F1E';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Small gear teeth (6 teeth)
      for (var j = 0; j < 6; j++) {
        ctx.save();
        ctx.rotate(j * Math.PI * 2 / 6);
        ctx.fillRect(size * 0.26, -2.5, 4, 5);
        ctx.strokeRect(size * 0.26, -2.5, 4, 5);
        ctx.restore();
      }
      ctx.restore();

      ctx.restore();

      // 2. Draw Chrono-Gun in hand (+X, -Y direction)
      ctx.save();
      ctx.translate(size * 0.65, -size * 0.4);
      ctx.rotate(-0.15);

      // Gun stock and body (bronze / yellow)
      ctx.fillStyle = '#E6C229';
      ctx.strokeStyle = '#9E7815';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.rect(-10, -3, 22, 6);
      ctx.rect(0, 1, 3, 5); // handle
      ctx.fill();
      ctx.stroke();

      // Glowing power core on gun barrel
      ctx.fillStyle = '#F17105';
      ctx.shadowColor = '#F17105';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-2, -0.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Small clock dial on weapon
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(-6, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // clock pointer
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-6 + Math.cos(time * 4) * 3, -4 + Math.sin(time * 4) * 3);
      ctx.stroke();

      // Golden clock hands hologram at the tip of the barrel (flashing)
      ctx.save();
      ctx.translate(15, 0);
      ctx.strokeStyle = 'rgba(241, 113, 5, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#F17105';
      ctx.shadowBlur = 6;
      
      // Outer hologram ring
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();

      // clock hand 1 (rotates)
      ctx.rotate(time * 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();

      ctx.restore();

      ctx.restore();

      ctx.restore();
    }
};
