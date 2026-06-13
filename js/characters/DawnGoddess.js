export const dawn_goddess = {
    id: 'dawn_goddess',
    isHero: true,
    name: 'Dawn Goddess',
    nameCN: '曙光女神',
    color: '#FFD54F',
    secondaryColor: '#FFF8E1',
    glowColor: 'rgba(255, 213, 79, 0.6)',
    size: 34,
    speed: 4.6,
    hp: 180,
    attackPower: 16,
    attackSpeed: 1.1,
    chargeTime: 0.28,
    attackRange: 360,
    projectileSpeed: 950,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'magic',
    passives: [
      { id: 'dawn_blessing',
        name: '曙光祝福',
        description: '命中敌人后，所有友方回复 10 点生命，并短暂提升移动速度。' },
      { id: 'dawn_resurrection',
        name: '黎明复苏',
        description: '击杀敌人后随机复活一位非召唤友方。' },
      { id: 'final_sunrise',
        name: '终末曙光',
        description: '自己死亡后随机复活一位友方，可包括自己。' },
      { id: 'purifying_light',
        name: '净化之光',
        description: '对带有负面状态的敌人造成 300% 额外伤害。' }
    ],
    specialEffects: [
      { name: '曙光祝福', description: '命中后为所有友军治疗并加速。' },
      { name: '黎明复苏', description: '击杀后复活一名阵亡的非召唤友方。' },
      { name: '终末曙光', description: '死亡后随机复活友方，可能复活自己。' },
      { name: '净化之光', description: '对灼烧、中毒、眩晕、减速等负面状态目标伤害大幅提升。' },
      { name: '晨星裁决', description: '随机影响最多 3 名敌人，施加随机负面状态并造成一次普攻伤害。' }
    ],
    skill: {
      name: '晨星裁决',
      nameEN: 'Morning Star Judgment',
      cooldown: 9,
      damage: 0,
      range: 520,
      type: 'morning_star_judgment',
      duration: 0,
      targetCount: 3
    },
    /**
     * Draw Dawn Goddess decorations: radiant halo, sun staff, and light ribbons.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Sun halo
      ctx.save();
      ctx.translate(-size * 0.15, -size * 0.55);
      ctx.strokeStyle = '#FFF176';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#FFD54F';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.38, size * 0.16, Math.sin(time * 2) * 0.15, 0, Math.PI * 2);
      ctx.stroke();

      // Halo rays
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      for (var i = 0; i < 8; i++) {
        var ray = time * 1.5 + i * Math.PI * 2 / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ray) * size * 0.5, Math.sin(ray) * size * 0.22);
        ctx.lineTo(Math.cos(ray) * size * 0.65, Math.sin(ray) * size * 0.3);
        ctx.stroke();
      }
      ctx.restore();

      // Staff shaft
      ctx.strokeStyle = '#FFF8E1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(size * 0.35, -size * 0.75);
      ctx.lineTo(size * 0.35, size * 0.75);
      ctx.stroke();

      // Sun crystal on staff
      ctx.save();
      ctx.translate(size * 0.35, -size * 0.85);
      ctx.fillStyle = '#FFD54F';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#FFD54F';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (var j = 0; j < 8; j++) {
        var a = j * Math.PI * 2 / 8;
        var r = j % 2 === 0 ? size * 0.22 : size * 0.11;
        var px = Math.cos(a) * r;
        var py = Math.sin(a) * r;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Light ribbons behind
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#FFF59D';
      ctx.lineWidth = 2;
      for (var k = 0; k < 3; k++) {
        var wave = Math.sin(time * 3 + k) * 5;
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, -size * 0.35 + k * size * 0.35);
        ctx.quadraticCurveTo(-size * 0.85, -size * 0.45 + k * size * 0.35 + wave, -size * 1.25, -size * 0.2 + k * size * 0.35);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    }
  };
