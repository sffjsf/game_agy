export const monkey_king = {
  isHero: true,
  nameCN: '大圣',
  color: '#FF9800', // Orange fur/armor
  secondaryColor: '#F44336', // Red trim/cape
  glowColor: '#FFEB3B', // Golden glow
  weaponType: 'melee',
  movePattern: 'dash', // Nimble and aggressive
  attackPower: 22,
  attackSpeed: 0.8, // Very fast strikes
  attackRange: 100, // Long reach with Jingu Bang
  chargeTime: 0.2, // Fast wind-up
  size: 32,
  projectileType: null,
  aiTendency: 'aggressive',
  hp: 130,
  maxHp: 130,
  speed: 6.0, // High movement speed
  lifesteal: 0,
  skill: {
    name: '大闹天宫',
    type: 'havoc_in_heaven',
    cooldown: 12,
    range: 400,
    damage: 15,
    duration: 0,
    description: '挥舞如意金箍棒横扫周围大范围内的所有敌人，造成巨额真实伤害并附带震荡效果。'
  },
  passives: [
    {
      id: 'jingu_bang',
      type: 'jingu_bang',
      name: '如意金箍棒',
      description: '大圣的普攻可以无限延伸，穿透一条直线上的所有敌人，并在末端产生爆裂效果。'
    },
    {
      id: 'life_saving_hair',
      type: 'life_saving_hair',
      name: '救命毫毛',
      description: '大圣受到致命伤害时，会拔下救命毫毛，清除自身眩晕和减速状态，并立即恢复 50% 生命值。（每场战斗限触发一次）'
    },
    {
      id: 'havoc_proc',
      type: 'havoc_proc',
      name: '狂暴大圣',
      description: '大圣每次普攻命中敌人时，都有 50% 的概率直接触发一次全屏大闹天宫！'
    }
  ],
  drawDecorations: function(ctx, x, y, angle, size, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Ruyi Jingu Bang (Golden Hooped Rod)
    // The staff is held out in front, extending quite far
    var staffLength = size * 3.5;
    var staffY = size * 0.7; // Held slightly offset
    
    ctx.beginPath();
    ctx.moveTo(0, staffY);
    ctx.lineTo(staffLength, staffY);
    ctx.strokeStyle = '#D32F2F'; // Red staff body
    ctx.lineWidth = 5;
    ctx.stroke();

    // Golden hoops on the ends of the staff
    ctx.beginPath();
    ctx.moveTo(staffLength - 15, staffY);
    ctx.lineTo(staffLength, staffY);
    ctx.moveTo(0, staffY);
    ctx.lineTo(15, staffY);
    ctx.strokeStyle = '#FFD700'; // Gold ends
    ctx.lineWidth = 6;
    ctx.stroke();

    // Golden Headband (Jingu)
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.strokeStyle = '#FFD700'; // Gold headband
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pheasant tail feathers (Lingzi) extending backward
    var featherSway = Math.sin(time * 8) * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.quadraticCurveTo(-size * 1.5, -size * 1.5 - featherSway * 20, -size * 2.5, -size * 1.0 + featherSway * 10);
    ctx.moveTo(0, size * 0.5);
    ctx.quadraticCurveTo(-size * 1.5, size * 1.5 + featherSway * 20, -size * 2.5, size * 1.0 - featherSway * 10);
    ctx.strokeStyle = '#F44336'; // Red feathers
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Small glowing red cape
    var capeSway = Math.cos(time * 12) * 0.3;
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, -size * 0.6);
    ctx.lineTo(-size * 1.8, -size * 0.8 + capeSway * 15);
    ctx.lineTo(-size * 2.2, capeSway * 20);
    ctx.lineTo(-size * 1.8, size * 0.8 - capeSway * 15);
    ctx.lineTo(-size * 0.8, size * 0.6);
    ctx.fillStyle = 'rgba(244, 67, 54, 0.8)';
    ctx.fill();

    ctx.restore();
  }
};
