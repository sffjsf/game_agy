export const mecha_pioneer = {
    id: 'mecha_pioneer',
    isHero: true,
    name: 'Mecha Pioneer',
    nameCN: '机械先驱',
    color: '#37474F',
    secondaryColor: '#FF6D00',
    glowColor: 'rgba(255, 109, 0, 0.5)',
    size: 32,
    speed: 4.2,
    hp: 140,
    attackPower: 11,
    attackSpeed: 1.5,
    chargeTime: 0.3,
    attackRange: 160,
    lifesteal: 0,
    movePattern: 'wobble',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'laser_pulse',
    passives: [
      {
        id: 'sentry_drones',
        name: '浮游子机',
        description: '身旁常驻两只自动射击的科技浮游炮，每 0.8s 自动射击最近的敌方单位，造成 5 点伤害。'
      },
      {
        id: 'electromagnetic_shield',
        name: '电磁护盾',
        description: '当生命值首次低于 35% 时，瞬间获得一个相当于最大生命值 30% 的护盾，持续 4.0 秒。'
      }
    ],
    skill: {
      name: '重力力场',
      nameEN: 'Gravity Well',
      cooldown: 13,
      damage: 38,
      range: 160,
      type: 'gravity_well',
      duration: 2.5
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // 1. Draw connecting energy beams to drones
      ctx.strokeStyle = 'rgba(255, 109, 0, 0.35)';
      ctx.lineWidth = 1.5;

      const bobL = Math.sin(time * 6) * 3;
      const bobR = -Math.sin(time * 6) * 3;

      const leftDroneY = -size * 0.9 + bobL;
      const rightDroneY = size * 0.9 + bobR;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size * 0.2, leftDroneY);
      ctx.moveTo(0, 0);
      ctx.lineTo(-size * 0.2, rightDroneY);
      ctx.stroke();

      // 2. Draw the two floating drones
      ctx.fillStyle = '#455A64';
      ctx.strokeStyle = '#FF6D00';
      ctx.lineWidth = 2;

      // Left Drone (Slightly behind and left)
      ctx.beginPath();
      ctx.arc(-size * 0.2, leftDroneY, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Left Drone core eye
      ctx.fillStyle = '#FF9100';
      ctx.shadowColor = '#FF9100';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(-size * 0.15, leftDroneY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Right Drone (Slightly behind and right)
      ctx.fillStyle = '#455A64';
      ctx.shadowBlur = 0; // Reset shadow
      ctx.beginPath();
      ctx.arc(-size * 0.2, rightDroneY, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right Drone core eye
      ctx.fillStyle = '#FF9100';
      ctx.shadowColor = '#FF9100';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(-size * 0.15, rightDroneY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw tech details on Viktor's main body
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FF6D00';
      ctx.beginPath();
      // Tech-pattern triangle on top of body
      ctx.moveTo(size * 0.4, -size * 0.25);
      ctx.lineTo(size * 0.45, 0);
      ctx.lineTo(size * 0.4, size * 0.25);
      ctx.lineTo(size * 0.1, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
};
