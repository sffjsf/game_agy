export const vulcan = {
    id: 'vulcan',
    isHero: true,
  name: 'Vulcan',
    nameCN: '火神',
    color: '#FF5722',
    secondaryColor: '#FFD54F',
    glowColor: 'rgba(255, 87, 34, 0.55)',
    size: 38,
    speed: 4.8,
    hp: 120,
    attackPower: 18,
    attackSpeed: 0.95,
    chargeTime: 0.25,
    attackRange: 190,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'fire_cone_basic', isHero: true,
  name: '神焰吐息', description: '普通攻击改为扇形放火，使敌人进入着火状态。' },
      { id: 'inferno_rebirth', isHero: true,
  name: '浴火重生', description: '每场战斗首次受到致命伤害时恢复 45 生命，并点燃周围敌人。' }
    ],
    specialEffects: [
      { isHero: true,
  name: '着火状态', description: '着火敌人会持续扣血，并成为火神技能的爆炸核心。' },
      { isHero: true,
  name: '连锁爆燃', description: '技能会引爆场上所有着火敌人及其四周区域。' }
    ],
    skill: {
      isHero: true,
  name: '天火爆燃',
      nameEN: 'Inferno Detonation',
      cooldown: 9,
      damage: 34,
      range: 1000,
      type: 'inferno_detonation',
      duration: 0,
      area: 115,
      burnDuration: 3.5,
      burnDps: 6
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Crown-like flame plume
      var flamePulse = Math.sin(time * 9) * 4;
      ctx.fillStyle = '#FFD54F';
      ctx.strokeStyle = '#FF6F00';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.55);
      ctx.quadraticCurveTo(size * 0.2, -size * 1.45 - flamePulse, size * 0.55, -size * 0.55);
      ctx.quadraticCurveTo(size * 0.2, -size * 0.8, -size * 0.2, -size * 0.55);
      ctx.fill();
      ctx.stroke();

      // Burning gauntlets
      ctx.fillStyle = '#FF6F00';
      ctx.shadowColor = '#FFAB00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(size * 0.85, -size * 0.36, size * 0.22, 0, Math.PI * 2);
      ctx.arc(size * 0.85, size * 0.36, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };
