export const alchemist = {
    id: 'alchemist',
    name: 'Alchemist',
    nameCN: '炼金狂人',
    color: '#8E24AA',             // Dark Purple
    secondaryColor: '#76FF03',    // Acid Green
    glowColor: 'rgba(118, 255, 3, 0.35)',

    // Stats
    size: 34,
    speed: 3.6,
    hp: 105,
    attackPower: 14,
    attackSpeed: 1.4,
    chargeTime: 0.45,
    attackRange: 280,
    lifesteal: 0,

    // AI & Mechanics
    movePattern: 'wobble',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'poison',

    // Skill Definition
    skill: {
        name: '剧毒酸雾',
        nameEN: 'Corrosive Cloud',
        cooldown: 10,
        damage: 12,
        range: 320,
        type: 'corrosive_cloud',
        duration: 3.5, // corrosive and slow duration
        poisonDps: 5.0, // DPS of the poison cloud
        area: 90 // cloud radius
    },

    /**
     * Draw Alchemist decorations: back potion tank and a test tube in hand.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // 1. Draw Potion Tank on the back (-X direction)
      ctx.save();
      ctx.translate(-size * 0.65, 0);

      // Metal straps holding the tank (behind body)
      ctx.strokeStyle = '#37474F';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(size * 0.25, -size * 0.5);
      ctx.lineTo(-size * 0.25, -size * 0.4);
      ctx.moveTo(size * 0.25, size * 0.5);
      ctx.lineTo(-size * 0.25, size * 0.4);
      ctx.stroke();

      // Glass tank canister (rounded rect-like structure)
      var w = size * 0.45;
      var h = size * 0.9;
      
      // Draw outer glass canister
      ctx.fillStyle = 'rgba(207, 216, 220, 0.15)'; // light glass sheen
      ctx.strokeStyle = '#546E7A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fill();
      ctx.stroke();

      // Canister caps (metal tops & bottoms)
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.rect(-w / 2 - 1, -h / 2 - 3, w + 2, 3);
      ctx.rect(-w / 2 - 1, h / 2, w + 2, 3);
      ctx.fill();

      // Liquid filling inside canister (lower 65%)
      var liquidHeight = h * 0.65;
      var liquidTopY = h / 2 - liquidHeight;

      // Potion liquid gradient
      var liquidGrad = ctx.createLinearGradient(0, liquidTopY, 0, h / 2);
      liquidGrad.addColorStop(0, '#76FF03');
      liquidGrad.addColorStop(1, '#33691E');

      ctx.fillStyle = liquidGrad;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 1, h / 2 - 1);
      ctx.lineTo(-w / 2 + 1, liquidTopY);
      
      // Draw sine wave liquid surface
      var waveSteps = 10;
      for (var s = 0; s <= waveSteps; s++) {
        var stepPct = s / waveSteps;
        var stepX = -w / 2 + 1 + (w - 2) * stepPct;
        var stepY = liquidTopY + Math.sin(time * 4.5 + stepPct * Math.PI * 2) * 2;
        ctx.lineTo(stepX, stepY);
      }
      ctx.lineTo(w / 2 - 1, h / 2 - 1);
      ctx.closePath();
      ctx.fill();

      // Bubbles floating in tank
      ctx.fillStyle = '#CCFF90';
      ctx.globalAlpha = 0.7;
      for (var b = 0; b < 3; b++) {
        var bubbleOffset = (time * 1.5 + b * 1.2) % 1.0; // normalised 0-1 vertical progress
        var bx = -w / 2 + 3 + ((b * 7 + 3) % (w - 6));
        var by = (h / 2 - 2) - bubbleOffset * (liquidHeight - 4);
        ctx.beginPath();
        ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2. Draw Handheld Potion Test Tube (+X, +Y direction)
      ctx.save();
      ctx.translate(size * 0.7, size * 0.45);
      ctx.rotate(-0.4); // tilt forward

      // Glass tube body (thin round-bottom rectangle)
      var tw = size * 0.18;
      var th = size * 0.55;
      
      // Glass outline
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeStyle = '#B0BEC5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Round bottom tube path
      ctx.moveTo(-tw / 2, -th / 2);
      ctx.lineTo(-tw / 2, th / 2 - tw / 2);
      ctx.arc(0, th / 2 - tw / 2, tw / 2, Math.PI, 0, true);
      ctx.lineTo(tw / 2, -th / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Green potion inside tube (bottom 55%)
      ctx.fillStyle = '#76FF03';
      ctx.beginPath();
      var tLiquidTopY = th / 2 - th * 0.55;
      ctx.moveTo(-tw / 2 + 0.5, tLiquidTopY);
      ctx.lineTo(-tw / 2 + 0.5, th / 2 - tw / 2);
      ctx.arc(0, th / 2 - tw / 2, tw / 2 - 0.5, Math.PI, 0, true);
      ctx.lineTo(tw / 2 - 0.5, tLiquidTopY);
      ctx.closePath();
      ctx.fill();

      // Tube rim cap
      ctx.fillStyle = '#CFD8DC';
      ctx.beginPath();
      ctx.rect(-tw / 2 - 1, -th / 2 - 1.5, tw + 2, 2.5);
      ctx.fill();

      // Drop of liquid hanging from tip (visual animation)
      var dropProgress = (time * 1.2) % 1.0;
      ctx.fillStyle = 'rgba(118, 255, 3, ' + (1 - dropProgress) + ')';
      ctx.beginPath();
      // Drop detaches and falls downwards (direction is +Y in local context, tilted)
      var dropY = th / 2 + dropProgress * 10;
      ctx.arc(0, dropY, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.restore();
    }
};
