export const berserker = {
    id: 'berserker',
    name: 'Berserker',
    nameCN: '狂战士',
    color: '#D32F2F',
    secondaryColor: '#FF6F00',
    glowColor: 'rgba(211, 47, 47, 0.55)',
    size: 34,
    speed: 5.2,
    hp: 100,
    attackPower: 26,
    attackSpeed: 2.0,
    chargeTime: 0.4,
    attackRange: 78,
    lifesteal: 0.12,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'blood_rage',
        name: '血怒',
        description: '生命值越低攻击速度越快，最多提升至 2.5 倍。血量低于 35% 时移速提升 25%。' }
    ],
    specialEffects: [
      { name: '血怒加速',
        description: '血量每降低 1%，攻击速度提升 1.5%。血量低于 35% 时额外获得移速加成。' },
      { name: '旋风斩',
        description: '大风车持续 2 秒旋转，每 0.25 秒对周围敌人造成伤害并吸血。' }
    ],
    skill: {
      name: '大风车',
      nameEN: 'Whirlwind',
      cooldown: 10,
      damage: 10,             // per-tick damage
      range: 95,
      type: 'whirlwind',
      duration: 2.0,          // total spin duration
      channelTickInterval: 0.25  // damage tick interval
    },
    /**
     * Draw Berserker decorations: horned helmet and forward-facing dual axes.
     * After ctx.rotate(angle), the +X direction faces the enemy.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // ── Horned helmet (top of the body) ──
      var hornPulse = Math.sin(time * 6) * 2;
      ctx.strokeStyle = '#BF360C';
      ctx.fillStyle = '#E53935';
      ctx.lineWidth = 2.5;

      // Left horn
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.55);
      ctx.quadraticCurveTo(-size * 0.5, -size * 1.4 + hornPulse, -size * 0.25, -size * 1.3 + hornPulse);
      ctx.quadraticCurveTo(-size * 0.45, -size * 0.9, -size * 0.2, -size * 0.55);
      ctx.fill();
      ctx.stroke();

      // Right horn
      ctx.beginPath();
      ctx.moveTo(size * 0.2, -size * 0.55);
      ctx.quadraticCurveTo(size * 0.5, -size * 1.4 + hornPulse, size * 0.25, -size * 1.3 + hornPulse);
      ctx.quadraticCurveTo(size * 0.45, -size * 0.9, size * 0.2, -size * 0.55);
      ctx.fill();
      ctx.stroke();

      // ── Dual axes: one on each side, blades point forward ──
      var axeWobble = Math.sin(time * 4) * 0.06;

      // Left axe — held on the left side
      ctx.save();
      ctx.translate(-size * 0.45, size * 0.05);
      ctx.rotate(-0.6 + axeWobble);
      ctx.fillStyle = '#B0BEC5';
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#90A4AE';
      ctx.shadowBlur = 3;
      // Blade
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.35);
      ctx.lineTo(size * 0.4, -size * 0.12);
      ctx.lineTo(size * 0.3, size * 0.2);
      ctx.lineTo(-size * 0.1, size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Handle
      ctx.strokeStyle = '#6D4C41';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, 0);
      ctx.lineTo(-size * 0.45, size * 0.12);
      ctx.stroke();
      ctx.restore();

      // Right axe — held on the right side
      ctx.save();
      ctx.translate(size * 0.45, size * 0.05);
      ctx.rotate(0.6 - axeWobble);
      ctx.fillStyle = '#B0BEC5';
      ctx.strokeStyle = '#78909C';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#90A4AE';
      ctx.shadowBlur = 3;
      // Blade
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.35);
      ctx.lineTo(size * 0.4, -size * 0.12);
      ctx.lineTo(size * 0.3, size * 0.2);
      ctx.lineTo(-size * 0.1, size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Handle
      ctx.strokeStyle = '#6D4C41';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-size * 0.05, 0);
      ctx.lineTo(-size * 0.45, size * 0.12);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  };
