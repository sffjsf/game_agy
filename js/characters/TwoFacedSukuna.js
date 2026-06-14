export const two_faced_sukuna = {
    id: 'two_faced_sukuna',
    isLegendary: true,
    name: 'Two-Faced Sukuna',
    nameCN: '两面宿傩',
    color: '#B71C1C',
    secondaryColor: '#2B0B0B',
    glowColor: 'rgba(244, 67, 54, 0.75)',

    // Stats
    size: 38,
    speed: 5.0,
    hp: 190,
    attackPower: 30,
    attackSpeed: 1.35,
    chargeTime: 0.2,
    attackRange: 195,
    lifesteal: 0,
    passiveSlashDamage: 9,

    // AI & Movement
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,

    passives: [
        { id: 'sukuna_basic_spin', name: '巨斧回天', description: '普通攻击以巨斧大范围旋转，连续命中10次，每次造成3点伤害。旋转期间高速移动，受到的伤害会转化为治疗。' },
        { id: 'sukuna_overheal_hunt', name: '追猎四斩', description: '满血时再次受到治疗，或血量低于50%时发动普通攻击，会在普通攻击结束后冲向敌方当前血量最高的单位并发动四连斩，期间无敌；满血治疗触发若正在普攻或释放技能，则延后至动作结束后触发（冷却4秒），低血普攻后的触发不受冷却限制。' },
        { id: 'sukuna_debuff_immunity', name: '咒王之躯', description: '免疫一切负面效果。' }
    ],

    specialEffects: [
        { name: '双面四斧', description: '前后双面各持两把巨斧，斧刃随移动拖出血色残影。' },
        { name: '伤转为疗', description: '巨斧回天期间所有受到的伤害都会转化为生命回复。' },
        { name: '追猎四斩', description: '满血溢出治疗会唤醒咒王追猎，锁定敌方血量最高者连续斩击。' },
        { name: '前后双斧', description: '大招冲入敌阵，前后两个方向各发动一次大范围扇形挥砍，并将造成的伤害转化为治疗。' }
    ],

    // Skill Definition
    skill: {
        name: '前后双斧',
        nameCN: '前后双斧',
        nameEN: 'Twin Axe Cleave',
        cooldown: 14,
        damage: 26,
        range: 260,
        type: 'sukuna_twin_axes',
        duration: 0.8,
        healPerHit: 10,
        sectorHalfAngle: 1.05
    },

    /**
     * Draw Two-Faced Sukuna decorations: two masks and four giant axes.
     */
    drawDecorations: function(ctx, x, y, angle, size, time, fighter) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const activeSpin = fighter && fighter.sukunaBasicSpin;
      const passiveSlash = fighter && fighter.sukunaPassiveSlash;

      // Cursed aura ring
      ctx.save();
      ctx.rotate(time * (activeSpin ? 7 : 1.5));
      ctx.strokeStyle = activeSpin ? 'rgba(255, 23, 68, 0.8)' : 'rgba(183, 28, 28, 0.35)';
      ctx.lineWidth = activeSpin ? 4 : 2;
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = activeSpin || passiveSlash ? 18 : 8;
      ctx.beginPath();
      ctx.arc(0, 0, size * (activeSpin ? 1.75 : 1.28), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Front and rear masks
      ctx.fillStyle = '#FFCDD2';
      ctx.strokeStyle = '#4A0000';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#B71C1C';
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.ellipse(size * 0.28, -size * 0.18, size * 0.26, size * 0.18, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-size * 0.28, size * 0.18, size * 0.26, size * 0.18, Math.PI + 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eyes on both faces
      ctx.fillStyle = '#B71C1C';
      ctx.fillRect(size * 0.26, -size * 0.24, size * 0.16, 2);
      ctx.fillRect(-size * 0.42, size * 0.20, size * 0.16, 2);

      // Four axes: two forward, two backward
      const drawAxe = (offsetY, forward) => {
        ctx.save();
        ctx.translate(forward ? size * 0.25 : -size * 0.25, offsetY);
        ctx.rotate(forward ? 0 : Math.PI);
        ctx.strokeStyle = '#1A0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-size * 0.15, 0);
        ctx.lineTo(size * 1.25, 0);
        ctx.stroke();

        ctx.fillStyle = forward ? '#EF5350' : '#8E0000';
        ctx.strokeStyle = '#FFCDD2';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(size * 1.18, -size * 0.32);
        ctx.quadraticCurveTo(size * 1.72, 0, size * 1.18, size * 0.32);
        ctx.lineTo(size * 0.95, size * 0.12);
        ctx.lineTo(size * 0.95, -size * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      drawAxe(-size * 0.34, true);
      drawAxe(size * 0.34, true);
      drawAxe(-size * 0.34, false);
      drawAxe(size * 0.34, false);

      if (activeSpin) {
        ctx.save();
        ctx.rotate(-time * 12);
        ctx.strokeStyle = 'rgba(255, 82, 82, 0.75)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.85, -0.6, 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.85, Math.PI - 0.6, Math.PI + 0.6);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
};
