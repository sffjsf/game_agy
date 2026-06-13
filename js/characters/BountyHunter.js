export const bounty_hunter = {
    id: 'bounty_hunter',
    name: 'Bounty Hunter',
    nameCN: '赏金猎手',
    color: '#2E7D32',
    secondaryColor: '#FF6F00',
    glowColor: 'rgba(255, 111, 0, 0.45)',
    size: 34,
    speed: 4.8,
    hp: 95,
    attackPower: 13,
    attackSpeed: 1.05,
    chargeTime: 0.35,
    attackRange: 410,
    projectileSpeed: 1100,
    lifesteal: 0.05,
    movePattern: 'keepDistance',
    aiTendency: 'aggressive',
    weaponType: 'ranged',
    projectileType: 'arrow',
    passives: [
      { id: 'bounty_mark',
        name: '赏金标记',
        description: '自动锁定血量最低的敌人，对其伤害+40%。击杀目标后永久提升 4% 攻速，最多叠加 25 层。' }
    ],
    specialEffects: [
      { name: '猎杀标记',
        description: '优先攻击血量最低的敌人，对生命值低于 50% 的目标造成 40% 额外伤害。' },
      { name: '赏金收割',
        description: '每击杀一个敌人，永久提升 4% 攻击速度，最多 100%（25 层）。' },
      { name: '猎杀射击',
        description: '射出一支穿透箭矢，对直线上的敌人造成伤害。' }
    ],
    skill: {
      name: '猎杀射击',
      nameEN: 'Hunting Shot',
      cooldown: 8,
      damage: 14,
      range: 350,
      type: 'pierce',
      duration: 0,
      width: 30
    },
    /**
     * Draw Bounty Hunter decorations: wide-brim hat and crossbow.
     * After ctx.rotate(angle), the +X direction faces the enemy.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // ── Wide-brim hunter hat (on top of body) ──
      ctx.fillStyle = '#3E2723';
      ctx.strokeStyle = '#1B0000';
      ctx.lineWidth = 1.5;

      // Hat brim (wide ellipse)
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.55, size * 0.85, size * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hat crown (dome shape)
      ctx.fillStyle = '#4E342E';
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.62, size * 0.38, size * 0.22, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3E2723';
      ctx.stroke();

      // Hat band (golden)
      ctx.strokeStyle = '#FFB300';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.55, size * 0.4, size * 0.06, 0, 0, Math.PI * 2);
      ctx.stroke();

      // ── Crossbow (held forward, on the right side) ──
      var bowWobble = Math.sin(time * 3.5) * 0.03;
      ctx.save();
      ctx.translate(size * 0.3, size * 0.1);
      ctx.rotate(-0.15 + bowWobble);

      // Stock
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, 0);
      ctx.lineTo(size * 0.3, 0);
      ctx.stroke();

      // Bow limbs (horizontal arc)
      ctx.strokeStyle = '#795548';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(size * 0.15, -size * 0.35);
      ctx.quadraticCurveTo(size * 0.5, 0, size * 0.15, size * 0.35);
      ctx.stroke();

      // Bowstring
      ctx.strokeStyle = '#BCAAA4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(size * 0.1, -size * 0.35);
      ctx.lineTo(-size * 0.1, 0);
      ctx.lineTo(size * 0.1, size * 0.35);
      ctx.stroke();

      // Bolt loaded
      ctx.strokeStyle = '#9E9E9E';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, 0);
      ctx.lineTo(size * 0.5, 0);
      ctx.stroke();

      // Bolt tip
      ctx.fillStyle = '#B0BEC5';
      ctx.beginPath();
      ctx.moveTo(size * 0.5, 0);
      ctx.lineTo(size * 0.4, -2.5);
      ctx.lineTo(size * 0.4, 2.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // ── Cape/cloak flowing behind ──
      ctx.save();
      ctx.fillStyle = '#1B5E20';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.25);
      ctx.quadraticCurveTo(-size * 0.7, size * 0.3 + Math.sin(time * 2) * 3, -size * 0.35, size * 0.65);
      ctx.lineTo(size * 0.2, size * 0.65);
      ctx.quadraticCurveTo(size * 0.5, size * 0.3 + Math.cos(time * 2.5) * 3, size * 0.1, -size * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // ── Bounty badge on chest ──
      ctx.fillStyle = '#FFB300';
      ctx.beginPath();
      ctx.arc(0, size * 0.05, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FF6F00';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Star in badge
      var starSize = size * 0.08;
      ctx.fillStyle = '#FF6F00';
      ctx.beginPath();
      for (var i = 0; i < 5; i++) {
        var starAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        var sx = Math.cos(starAngle) * starSize;
        var sy = Math.sin(starAngle) * starSize + size * 0.05;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  };
