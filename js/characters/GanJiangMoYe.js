export const gan_jiang_mo_ye = {
    id: 'gan_jiang_mo_ye',
    isLegendary: true,
    name: 'Gan Jiang Mo Ye',
    nameCN: '干将莫邪',
    color: '#FBE9E7',
    secondaryColor: '#1565C0',
    glowColor: 'rgba(255, 82, 82, 0.75)',

    // Stats
    size: 36,
    speed: 4.6,
    hp: 175,
    attackPower: 5,
    attackSpeed: 1.15,
    chargeTime: 0.2,
    attackRange: 9999,
    lifesteal: 0,

    // AI & Movement
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,

    passives: [
        { id: 'ganjiang_moye_basic', name: '双剑交汇', description: '普通攻击无距离限制，从身体左右两侧各发射一柄巨剑：红色「干将」与蓝色「莫邪」偏转35度弧线飞出，追踪并穿刺最近敌人。命中施加交汇剑痕；同一目标被同批双剑命中会眩晕；普攻造成的实际伤害100%转化为治疗。' },
        { id: 'ganjiang_moye_random_pierce', name: '剑遁穿身', description: '受到非灼烧伤害时有25%概率使本次受击无效，并穿刺飞到战场任意位置；沿途敌人获得交汇剑痕，穿刺期间无敌。' },
        { id: 'ganjiang_moye_death_counter', name: '双剑续命', description: '血量归0时不会立即死亡，而是无敌并立即发动一次普攻；若因此恢复生命则免死（冷却4秒）。' }
    ],

    specialEffects: [
        { name: '交汇剑痕', description: '被双剑穿透的敌人会留下红蓝剑痕，下次受到干将莫邪或其友方扣血时伤害翻倍。' },
        { name: '干将莫邪', description: '红蓝双剑分别从身体左右两侧弧线飞出，追踪并穿刺敌阵。' },
        { name: '十剑交锋', description: '大招召唤十柄巨剑向四周飞出，随机追踪敌人并穿透到战场边缘。' }
    ],

    // Skill Definition
    skill: {
        name: '十剑交锋',
        nameCN: '十剑交锋',
        nameEN: 'Ten Converging Swords',
        cooldown: 14,
        damage: 1,
        range: 9999,
        type: 'ganjiang_moye_ultimate',
        duration: 1.2
    },

    /**
     * Draw Gan Jiang Mo Ye decorations: red/blue twin sword aura.
     */
    drawDecorations: function(ctx, x, y, angle, size, time, fighter) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const markedGlow = fighter && fighter.ultInvincibilityTimer > 0;
      ctx.shadowBlur = markedGlow ? 14 : 7;

      // Twin sword orbit ring
      ctx.save();
      ctx.rotate(time * 1.6);
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = '#E040FB';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.35, size * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const drawSword = (side, color, edgeColor) => {
        ctx.save();
        ctx.translate(0, side * size * 0.52);
        ctx.rotate(side * 0.18);
        ctx.shadowColor = color;
        ctx.shadowBlur = markedGlow ? 16 : 8;

        ctx.fillStyle = edgeColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(size * 1.15, 0);
        ctx.lineTo(size * 0.22, -size * 0.12);
        ctx.lineTo(-size * 0.55, -size * 0.05);
        ctx.lineTo(-size * 0.55, size * 0.05);
        ctx.lineTo(size * 0.22, size * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.fillRect(-size * 0.72, -size * 0.13, size * 0.16, size * 0.26);
        ctx.fillRect(-size * 0.92, -size * 0.04, size * 0.22, size * 0.08);
        ctx.restore();
      };

      drawSword(-1, '#F44336', '#FFCDD2');
      drawSword(1, '#2196F3', '#BBDEFB');

      // Crossed sword glint
      ctx.save();
      ctx.rotate(Math.sin(time * 2.2) * 0.18);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, -size * 0.7);
      ctx.lineTo(size * 0.7, size * 0.7);
      ctx.moveTo(-size * 0.7, size * 0.7);
      ctx.lineTo(size * 0.7, -size * 0.7);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
};
