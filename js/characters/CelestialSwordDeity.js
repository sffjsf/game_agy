export const celestial_sword_deity = {
    id: 'celestial_sword_deity',
    isLegendary: true,
    name: 'Celestial Sword Deity',
    nameCN: '九霄剑仙',
    color: '#FFFDE7',             // Celestial light gold
    secondaryColor: '#FFD700',    // Bright gold
    glowColor: 'rgba(255, 215, 0, 0.75)',

    // Stats
    size: 34,
    speed: 4.8,
    hp: 150,
    attackPower: 26,
    attackSpeed: 1.2,
    chargeTime: 0.2,
    attackRange: 75,
    lifesteal: 0.12,

    // AI & Movement
    movePattern: 'linear', // Approaches targets closely
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null, // Custom basic attack handler spawns projectiles

    passives: [
        { id: 'passive_sword_array', name: '万剑归宗', description: '普通攻击打出两段攻击：原本剑波照常释放，随后眩晕大范围目标区域内敌人并连续冲刺穿刺 10 次，每次造成 4 点伤害；这段穿刺不会积攒飞剑。目标距离较近时，九霄剑仙会先闪身到敌人正前方发动普攻。普攻或受击仍会凝聚一柄飞剑（上限9）。每柄飞剑提升4%攻速与移速。' },
        { id: 'passive_invulnerable_dash', name: '人剑合一', description: '濒死时清除异常，化为金色剑意向后滑行并免死，对沿途敌人造成30点真实伤害（冷却30秒）。' }
    ],

    specialEffects: [
        { name: '太极八卦轮', description: '身后旋转的八卦金盘，展示仙人道行。' },
        { name: '穿透无敌', description: '普通攻击闪身和万剑穿刺期间，九霄剑仙会短暂处于无敌状态。' },
        { name: '剑意护体', description: '飞剑环绕产生强烈的攻速与移动增幅。' },
        { name: '轩辕天罚', description: '诛仙剑阵末尾召唤灭世轩辕巨剑劈斩。' }
    ],

    // Skill Definition
    skill: {
        name: '诛仙剑阵',
        nameCN: '诛仙剑阵',
        nameEN: 'Celestial Swords',
        cooldown: 15,
        damage: 35,
        range: 450,
        type: 'celestial_swords',
        duration: 5.0,
        area: 280
    },

    /**
     * Draw Celestial Sword Deity decorations: rotating Bagua halo and 3D orbiting swords.
     */
    drawDecorations: function(ctx, x, y, angle, size, time, fighter) {
      // Access the fighter instance if passed or retrieve it
      // Note: FighterRenderer passes (ctx, f.x, f.y, f.angle, f.charData.size, time)
      // Let's resolve the fighter instance from the rendering context if possible, or fallback to orbital rendering
      ctx.save();
      ctx.translate(x, y);

      // 1. Draw rotating golden Bagua halo behind character (-X direction or centered)
      ctx.save();
      ctx.rotate(-time * 0.4);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 6;

      // Draw octagon halo
      ctx.beginPath();
      const numSides = 8;
      for (let i = 0; i < numSides; i++) {
        const sideAngle = (i * Math.PI * 2) / numSides;
        const px = Math.cos(sideAngle) * (size * 1.05);
        const py = Math.sin(sideAngle) * (size * 1.05);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Draw trigram lines on the corners
      ctx.lineWidth = 1.0;
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(size * 0.95, -5);
        ctx.lineTo(size * 0.95, 5);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Draw 3D orbiting golden flying swords
      // If we don't have a direct reference to the fighter object's swordCount, fallback to a time-based count for preview
      let count = 0;
      if (fighter && typeof fighter.swordCount === 'number') {
        count = fighter.swordCount;
      } else {
        // Fallback: check if the global simulation state is available, or use a default count based on time for visual preview
        // To be safe in ES module environments, we try to grab the active fighter from the canvas context stack if set
        const ownTeam = ctx.canvas && ctx.canvas.__battleState && ctx.canvas.__battleState.fightersLeft;
        let found = null;
        if (ownTeam) {
          found = ownTeam.find(f => f.charData.id === 'celestial_sword_deity');
        }
        if (!found && ctx.canvas && ctx.canvas.__battleState && ctx.canvas.__battleState.fightersRight) {
          found = ctx.canvas.__battleState.fightersRight.find(f => f.charData.id === 'celestial_sword_deity');
        }
        count = found ? found.swordCount : (Math.floor(time * 0.8) % 9) + 1; // preview loop
      }

      if (count > 0) {
        ctx.shadowColor = '#FFD700';
        for (let i = 0; i < count; i++) {
          // Base angle of orbit
          const baseAngle = (i * Math.PI * 2) / count + time * 2.2;

          // 3D perspective squashed orbit coordinates
          const rx = size * 1.45;
          const ry = size * 0.45; // Squashed vertically for 3D tilt effect
          const sx = Math.cos(baseAngle) * rx;
          const sy = Math.sin(baseAngle) * ry;

          // Depth scaling: larger in front, smaller in back
          const z = Math.sin(baseAngle); // -1 (back) to 1 (front)
          const scale = 0.75 + (z + 1.0) * 0.25; // 0.75x to 1.25x

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(baseAngle + Math.PI / 2); // align tangent to path
          ctx.scale(scale, scale);

          // Draw semi-transparent flying sword
          ctx.fillStyle = 'rgba(255, 253, 231, 0.8)';
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 1.0;
          ctx.shadowBlur = 6;

          // Sword Blade pointing outwards
          ctx.beginPath();
          ctx.moveTo(0, -size * 0.4);
          ctx.lineTo(size * 0.08, -size * 0.3);
          ctx.lineTo(size * 0.04, size * 0.05);
          ctx.lineTo(-size * 0.04, size * 0.05);
          ctx.lineTo(-size * 0.08, -size * 0.3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Crossguard & Hilt
          ctx.fillStyle = '#FFA000';
          ctx.fillRect(-size * 0.12, size * 0.05, size * 0.24, size * 0.04);
          ctx.fillRect(-size * 0.03, size * 0.09, size * 0.06, size * 0.1);

          ctx.restore();
        }
      }

      ctx.restore();
    }
};
