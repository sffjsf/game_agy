export const chain_fighter = {
    id: 'chain_fighter',
    name: 'Chain Fighter',
    nameCN: '铁链斗士',
    color: '#616161',
    secondaryColor: '#BDBDBD',
    glowColor: 'rgba(189, 189, 189, 0.45)',
    size: 36,
    speed: 4.8,
    hp: 105,
    attackPower: 14,
    attackSpeed: 1.2,
    chargeTime: 0.32,
    attackRange: 130,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'balanced',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'chain_tether',
        name: '链刃牵制',
        description: '普通攻击命中时有 35% 概率轻微拉近目标并减速。' }
    ],
    specialEffects: [
      { name: '链刃牵制',
        description: '中距离近战攻击，命中后概率拉扯敌人。' },
      { name: '锁链拖拽',
        description: '甩出锁链，将目标拉向自己并造成伤害。' }
    ],
    skill: {
      name: '锁链拖拽',
      nameEN: 'Chain Pull',
      cooldown: 9,
      damage: 16,
      range: 230,
      type: 'chain_pull',
      duration: 0
    },
    /**
     * Draw Chain Fighter decorations: chain blade and metal wraps.
     * After ctx.rotate(angle), the +X direction faces the enemy.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Chain arc in front
      var swing = Math.sin(time * 5) * 0.12;
      ctx.strokeStyle = '#BDBDBD';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(size * 0.35, 0, size * 0.9, -Math.PI * 0.35 + swing, Math.PI * 0.35 + swing);
      ctx.stroke();

      // Chain links along the arc
      for (var i = 0; i < 6; i++) {
        var t = -Math.PI * 0.32 + i * (Math.PI * 0.64 / 5) + swing;
        var lx = size * 0.35 + Math.cos(t) * size * 0.9;
        var ly = Math.sin(t) * size * 0.9;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(t + Math.PI / 2);
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.09, size * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Hook blade at the chain end
      var hookAngle = Math.PI * 0.35 + swing;
      var hookX = size * 0.35 + Math.cos(hookAngle) * size * 0.9;
      var hookY = Math.sin(hookAngle) * size * 0.9;
      ctx.save();
      ctx.translate(hookX, hookY);
      ctx.rotate(hookAngle);
      ctx.fillStyle = '#CFD8DC';
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(size * 0.35, size * 0.05, size * 0.2, size * 0.35);
      ctx.quadraticCurveTo(size * 0.05, size * 0.2, -size * 0.08, size * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Metal arm wraps
      ctx.strokeStyle = '#9E9E9E';
      ctx.lineWidth = 2;
      for (var w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.25 + w * size * 0.14, -size * 0.25);
        ctx.lineTo(-size * 0.1 + w * size * 0.14, size * 0.25);
        ctx.stroke();
      }

      // Heavy belt
      ctx.fillStyle = '#424242';
      ctx.fillRect(-size * 0.45, size * 0.08, size * 0.9, size * 0.16);
      ctx.fillStyle = '#BDBDBD';
      ctx.beginPath();
      ctx.rect(-size * 0.1, size * 0.06, size * 0.2, size * 0.2);
      ctx.fill();

      ctx.restore();
    }
  };
