export const blade_master = {
    id: 'blade_master',
    isHero: true,
    name: 'Blade Master',
    nameCN: '影刃宗师',
    color: '#1A1A24',             // Shadow black
    secondaryColor: '#9C27B0',    // Evil purple
    glowColor: 'rgba(156, 39, 176, 0.55)',

    // Stats
    size: 34,
    speed: 4.9,
    hp: 140,
    attackPower: 28,
    attackSpeed: 1.6,
    chargeTime: 0.2,
    attackRange: 65,
    lifesteal: 0.1, // 10% lifesteal

    // AI & Movement
    movePattern: 'flank', // Flanks behind targets
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,

    passives: [
        { id: 'shadow_strike', name: '影袭', description: '从背后攻击敌人时必定暴击（180% 伤害）并施加流血。' },
        { id: 'shadow_clone_save', name: '残影免死', description: '生命值首次低于 30% 时原地留下残影分担仇恨，隐形 1 秒并闪现至最弱敌人身后。' }
    ],

    specialEffects: [
        { name: '暗影闪击', description: '贴近目标时施加快速侧斩。' },
        { name: '影袭背刺', description: '处于敌人后方攻击有高额伤害加成。' },
        { name: '残影分身', description: '危机时刻脱离仇恨，由分身承受后续攻击。' }
    ],

    // Skill Definition
    skill: {
        name: '影刃风暴',
        nameEN: 'Shadowblade Storm',
        cooldown: 12,
        damage: 24,
        range: 450,
        type: 'shadowblade_storm',
        duration: 0
    },

    /**
     * Draw Blade Master decorations: dual shadow blades and floating back ribbons.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // 1. Draw flowing ribbon/scarf behind (-X direction)
      ctx.save();
      ctx.strokeStyle = '#7B1FA2';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      
      // Scarf left stream
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, -size * 0.25);
      var wave1 = Math.sin(time * 5) * 6;
      ctx.quadraticCurveTo(-size * 1.3, -size * 0.45 + wave1, -size * 1.8, -size * 0.3 + wave1 * 0.5);
      ctx.stroke();

      // Scarf right stream
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, size * 0.25);
      var wave2 = Math.sin(time * 5 + Math.PI * 0.5) * 6;
      ctx.quadraticCurveTo(-size * 1.3, size * 0.45 + wave2, -size * 1.8, size * 0.3 + wave2 * 0.5);
      ctx.stroke();
      ctx.restore();

      // 2. Draw Dual Shadow Blades (+X direction, angled slightly)
      // Blade gradient: Purple to semi-transparent white tip
      var bladeGrad = ctx.createLinearGradient(size * 0.6, 0, size * 1.7, 0);
      bladeGrad.addColorStop(0, '#4A148C');
      bladeGrad.addColorStop(0.4, '#9C27B0');
      bladeGrad.addColorStop(0.8, '#E040FB');
      bladeGrad.addColorStop(1, '#FFFFFF');

      // Left Shadow Blade
      ctx.save();
      ctx.translate(size * 0.3, -size * 0.45);
      ctx.rotate(-0.08); // Slight outward angle
      
      // Draw hilt
      ctx.fillStyle = '#111111';
      ctx.fillRect(-6, -2, 6, 4);
      ctx.fillStyle = '#7B1FA2';
      ctx.fillRect(-8, -1.5, 2, 3); // pommel

      // Draw guard
      ctx.fillStyle = '#6A1B9A';
      ctx.fillRect(0, -6, 2, 12);

      // Draw purple glowing blade
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(2, -2.5);
      ctx.lineTo(size * 1.25, -1.8);
      ctx.lineTo(size * 1.4, 0); // blade tip
      ctx.lineTo(size * 1.25, 1.8);
      ctx.lineTo(2, 2.5);
      ctx.closePath();
      ctx.fill();

      // Blade shine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(size * 1.3, 0);
      ctx.stroke();
      ctx.restore();

      // Right Shadow Blade
      ctx.save();
      ctx.translate(size * 0.3, size * 0.45);
      ctx.rotate(0.08); // Slight outward angle

      // Draw hilt
      ctx.fillStyle = '#111111';
      ctx.fillRect(-6, -2, 6, 4);
      ctx.fillStyle = '#7B1FA2';
      ctx.fillRect(-8, -1.5, 2, 3); // pommel

      // Draw guard
      ctx.fillStyle = '#6A1B9A';
      ctx.fillRect(0, -6, 2, 12);

      // Draw purple glowing blade
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(2, -2.5);
      ctx.lineTo(size * 1.25, -1.8);
      ctx.lineTo(size * 1.4, 0); // blade tip
      ctx.lineTo(size * 1.25, 1.8);
      ctx.lineTo(2, 2.5);
      ctx.closePath();
      ctx.fill();

      // Blade shine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(size * 1.3, 0);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
};
