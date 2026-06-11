/**
 * characters.js - Character Definitions for 2D Auto-Battle Game
 * 
 * Defines a global CHARACTERS object containing 8 unique characters,
 * each with stats, skills, and visual decoration drawing functions.
 * No modules/imports - loaded via script tag.
 */

const CHARACTERS = {

  // ═══════════════════════════════════════════════════════════════
  // 1. SWORDSMAN (剑士) - Melee, Aggressive, Linear movement
  // ═══════════════════════════════════════════════════════════════
  swordsman: {
    id: 'swordsman',
    name: 'Swordsman',
    nameCN: '剑士',
    color: '#4A90D9',
    secondaryColor: '#2C5F8A',
    glowColor: 'rgba(74, 144, 217, 0.4)',
    size: 36,
    speed: 4.8,
    hp: 100,
    attackPower: 18,
    attackSpeed: 1.4,
    chargeTime: 0.3,
    attackRange: 80,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    skill: {
      name: '旋风斩',
      nameEN: 'Whirlwind',
      cooldown: 10,
      damage: 25,
      range: 100,
      type: 'aoe_melee',
      duration: 0
    },
    /**
     * Draw a sword blade pointing in the facing direction.
     * Silver triangular blade with a gold crossguard.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Sword blade (silver triangle extending from body)
      var bladeLength = size * 1.6;
      var bladeWidth = size * 0.25;
      ctx.beginPath();
      ctx.moveTo(size + bladeLength, 0);          // Tip
      ctx.lineTo(size + 2, -bladeWidth);           // Base left
      ctx.lineTo(size + 2, bladeWidth);            // Base right
      ctx.closePath();
      ctx.fillStyle = '#C0C0C0';
      ctx.fill();
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Blade shine (thin white line down center)
      ctx.beginPath();
      ctx.moveTo(size + 4, 0);
      ctx.lineTo(size + bladeLength - 4, 0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Gold crossguard
      ctx.beginPath();
      ctx.moveTo(size, -bladeWidth * 1.5);
      ctx.lineTo(size + 4, -bladeWidth * 1.5);
      ctx.lineTo(size + 4, bladeWidth * 1.5);
      ctx.lineTo(size, bladeWidth * 1.5);
      ctx.closePath();
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. ARCHER (弓手) - Ranged, Cautious, Keep Distance
  // ═══════════════════════════════════════════════════════════════
  archer: {
    id: 'archer',
    name: 'Archer',
    nameCN: '弓手',
    color: '#4CAF50',
    secondaryColor: '#2E7D32',
    glowColor: 'rgba(76, 175, 80, 0.4)',
    size: 36,
    speed: 4.5,
    hp: 100,
    attackPower: 11,
    attackSpeed: 1.1,
    chargeTime: 0.4,
    attackRange: 420,
    projectileSpeed: 1000,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'arrow',
    skill: {
      name: '三连射',
      nameEN: 'Triple Shot',
      cooldown: 8,
      damage: 10,
      range: 300,
      type: 'multi_shot',
      duration: 0
    },
    /**
     * Draw a bow shape (arc) on the side facing the angle direction.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Bow arc (wooden brown)
      ctx.beginPath();
      ctx.arc(size + 4, 0, size * 0.9, -Math.PI * 0.45, Math.PI * 0.45, false);
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Bowstring
      var bowRadius = size * 0.9;
      var stringStartY = -Math.sin(Math.PI * 0.45) * bowRadius;
      var stringEndY = Math.sin(Math.PI * 0.45) * bowRadius;
      var stringStartX = size + 4 + Math.cos(Math.PI * 0.45) * bowRadius;
      ctx.beginPath();
      ctx.moveTo(stringStartX, stringStartY);
      ctx.lineTo(size + 2, 0); // Drawn back slightly
      ctx.lineTo(stringStartX, stringEndY);
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Arrow nocked on string (subtle)
      ctx.beginPath();
      ctx.moveTo(size + 2, 0);
      ctx.lineTo(size + 4 + bowRadius + 5, 0);
      ctx.strokeStyle = '#795548';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(size + 4 + bowRadius + 5, 0);
      ctx.lineTo(size + 4 + bowRadius + 1, -3);
      ctx.lineTo(size + 4 + bowRadius + 1, 3);
      ctx.closePath();
      ctx.fillStyle = '#9E9E9E';
      ctx.fill();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. MAGE (法师) - Ranged, Cautious, Arc movement
  // ═══════════════════════════════════════════════════════════════
  mage: {
    id: 'mage',
    name: 'Mage',
    nameCN: '法师',
    color: '#9C27B0',
    secondaryColor: '#6A1B9A',
    glowColor: 'rgba(156, 39, 176, 0.4)',
    size: 36,
    speed: 3.6,
    hp: 100,
    attackPower: 16,
    attackSpeed: 1.6,
    chargeTime: 0.8,
    attackRange: 400,
    projectileSpeed: 800,
    lifesteal: 0,
    movePattern: 'arc',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'magic',
    skill: {
      name: '陨石术',
      nameEN: 'Meteor',
      cooldown: 12,
      damage: 35,
      range: 300,
      type: 'meteor',
      duration: 0,
      area: 120
    },
    /**
     * Draw 3 small orbiting magic circles around the body.
     * Uses sin/cos with time for smooth orbital animation.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();

      var orbitRadius = size + 10;
      var orbCount = 3;
      var orbSize = 4;

      for (var i = 0; i < orbCount; i++) {
        var orbAngle = time * 2.0 + (i * Math.PI * 2 / orbCount);
        var ox = x + Math.cos(orbAngle) * orbitRadius;
        var oy = y + Math.sin(orbAngle) * orbitRadius;

        // Outer glow
        ctx.beginPath();
        ctx.arc(ox, oy, orbSize + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(206, 147, 216, 0.3)';
        ctx.fill();

        // Inner orb
        ctx.beginPath();
        ctx.arc(ox, oy, orbSize, 0, Math.PI * 2);
        ctx.fillStyle = '#CE93D8';
        ctx.fill();
        ctx.strokeStyle = '#AB47BC';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Tiny sparkle inside
        ctx.beginPath();
        ctx.arc(ox - 1, oy - 1, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      }

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. VAMPIRE (吸血鬼) - Melee, Aggressive, Blink movement
  // ═══════════════════════════════════════════════════════════════
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    nameCN: '吸血鬼',
    color: '#E53935',
    secondaryColor: '#B71C1C',
    glowColor: 'rgba(229, 57, 53, 0.4)',
    size: 36,
    speed: 4.6,
    hp: 100,
    attackPower: 14,
    attackSpeed: 1.3,
    chargeTime: 0.3,
    attackRange: 80,
    lifesteal: 0.3,
    movePattern: 'dash',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'lifesteal', name: '吸血体质', description: '造成伤害时回复 30% 伤害值的生命。' }
    ],
    skill: {
      name: '暗影冲刺',
      nameEN: 'Shadow Dash',
      cooldown: 8,
      damage: 20,
      range: 150,
      type: 'dash',
      duration: 0
    },
    /**
     * Draw bat wings on left and right sides.
     * Curved triangular shapes with visible wing structure.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Slight wing flap animation
      var flapOffset = Math.sin(time * 5) * 3;

      // --- Right wing (top side) ---
      ctx.beginPath();
      ctx.moveTo(-2, -size * 0.3);
      // Wing tip
      ctx.quadraticCurveTo(-size * 0.8, -size * 1.5 - flapOffset, -size * 1.4, -size * 0.8 - flapOffset);
      // Wing scallop 1
      ctx.quadraticCurveTo(-size * 1.0, -size * 0.5, -size * 1.1, -size * 0.3);
      // Wing scallop 2
      ctx.quadraticCurveTo(-size * 0.7, -size * 0.2, -size * 0.6, -size * 0.1);
      ctx.lineTo(-2, -size * 0.1);
      ctx.closePath();
      ctx.fillStyle = '#8B0000';
      ctx.fill();
      ctx.strokeStyle = '#5C0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Wing bone structure (right)
      ctx.beginPath();
      ctx.moveTo(-2, -size * 0.3);
      ctx.lineTo(-size * 1.1, -size * 1.2 - flapOffset);
      ctx.strokeStyle = '#6D0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-2, -size * 0.2);
      ctx.lineTo(-size * 0.9, -size * 0.6 - flapOffset * 0.5);
      ctx.stroke();

      // --- Left wing (bottom side) ---
      ctx.beginPath();
      ctx.moveTo(-2, size * 0.3);
      ctx.quadraticCurveTo(-size * 0.8, size * 1.5 + flapOffset, -size * 1.4, size * 0.8 + flapOffset);
      ctx.quadraticCurveTo(-size * 1.0, size * 0.5, -size * 1.1, size * 0.3);
      ctx.quadraticCurveTo(-size * 0.7, size * 0.2, -size * 0.6, size * 0.1);
      ctx.lineTo(-2, size * 0.1);
      ctx.closePath();
      ctx.fillStyle = '#8B0000';
      ctx.fill();
      ctx.strokeStyle = '#5C0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Wing bone structure (left)
      ctx.beginPath();
      ctx.moveTo(-2, size * 0.3);
      ctx.lineTo(-size * 1.1, size * 1.2 + flapOffset);
      ctx.strokeStyle = '#6D0000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-2, size * 0.2);
      ctx.lineTo(-size * 0.9, size * 0.6 + flapOffset * 0.5);
      ctx.stroke();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. NINJA (忍者) - Ranged, Balanced, Zigzag movement
  // ═══════════════════════════════════════════════════════════════
  ninja: {
    id: 'ninja',
    name: 'Ninja',
    nameCN: '忍者',
    color: '#37474F',
    secondaryColor: '#1B2631',
    glowColor: 'rgba(55, 71, 79, 0.4)',
    size: 36,
    speed: 5.2,
    hp: 100,
    attackPower: 8,
    attackSpeed: 0.65,
    chargeTime: 0.2,
    attackRange: 320,
    projectileSpeed: 1200,
    lifesteal: 0,
    movePattern: 'zigzag',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'shuriken',
    skill: {
      name: '分身术',
      nameEN: 'Shadow Clone',
      cooldown: 12,
      damage: 8,
      range: 150,
      type: 'clone',
      duration: 0
    },
    /**
     * Draw a trailing scarf behind the movement direction.
     * Wavy line that flows opposite to facing direction.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Scarf trails behind (opposite direction = negative x in rotated coords)
      var scarfSegments = 5;
      var segmentLen = 8;

      ctx.beginPath();
      // Start from the back of the character
      ctx.moveTo(-size * 0.8, -3);

      for (var i = 1; i <= scarfSegments; i++) {
        var sx = -size * 0.8 - i * segmentLen;
        var sy = Math.sin(time * 6 + i * 0.8) * (3 + i * 1.5) - 3;
        ctx.lineTo(sx, sy);
      }

      // Return path for thickness
      for (var j = scarfSegments; j >= 1; j--) {
        var sx2 = -size * 0.8 - j * segmentLen;
        var sy2 = Math.sin(time * 6 + j * 0.8) * (3 + j * 1.5) + 3;
        ctx.lineTo(sx2, sy2);
      }

      ctx.lineTo(-size * 0.8, 3);
      ctx.closePath();

      // Gradient-like effect: darker at base, lighter at tip
      ctx.fillStyle = '#D32F2F';
      ctx.fill();
      ctx.strokeStyle = '#B71C1C';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Scarf tip accent
      var tipX = -size * 0.8 - scarfSegments * segmentLen;
      var tipY = Math.sin(time * 6 + scarfSegments * 0.8) * (3 + scarfSegments * 1.5);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FF5252';
      ctx.fill();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. KNIGHT (骑士) - Melee, Aggressive, Linear movement
  // ═══════════════════════════════════════════════════════════════
  knight: {
    id: 'knight',
    name: 'Knight',
    nameCN: '骑士',
    color: '#FFB300',
    secondaryColor: '#FF8F00',
    glowColor: 'rgba(255, 179, 0, 0.4)',
    size: 36,
    speed: 5.0,
    hp: 100,
    attackPower: 22,
    attackSpeed: 2.0,
    chargeTime: 0.8,
    attackRange: 80,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    skill: {
      name: '盾击',
      nameEN: 'Shield Bash',
      cooldown: 10,
      damage: 15,
      range: 90,
      type: 'stun',
      duration: 1.5
    },
    /**
     * Draw a shield shape on one side with cross pattern.
     * Semi-circle with golden cross emblem.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Shield on the front-left side
      var shieldX = size * 0.6;
      var shieldY = -size * 0.1;
      var shieldW = size * 0.8;
      var shieldH = size * 1.2;

      // Shield body (rounded rectangle approximation)
      ctx.beginPath();
      ctx.moveTo(shieldX, shieldY - shieldH / 2);
      ctx.lineTo(shieldX + shieldW * 0.8, shieldY - shieldH / 2);
      ctx.quadraticCurveTo(shieldX + shieldW, shieldY - shieldH / 2, shieldX + shieldW, shieldY - shieldH * 0.2);
      ctx.lineTo(shieldX + shieldW, shieldY + shieldH * 0.2);
      ctx.quadraticCurveTo(shieldX + shieldW, shieldY + shieldH * 0.4, shieldX + shieldW * 0.5, shieldY + shieldH / 2);
      ctx.quadraticCurveTo(shieldX, shieldY + shieldH * 0.4, shieldX, shieldY + shieldH * 0.2);
      ctx.lineTo(shieldX, shieldY - shieldH / 2);
      ctx.closePath();
      ctx.fillStyle = '#FFC107';
      ctx.fill();
      ctx.strokeStyle = '#FF8F00';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cross pattern on shield
      var crossCX = shieldX + shieldW * 0.5;
      var crossCY = shieldY;

      // Vertical bar
      ctx.beginPath();
      ctx.moveTo(crossCX, shieldY - shieldH * 0.3);
      ctx.lineTo(crossCX, shieldY + shieldH * 0.3);
      ctx.strokeStyle = '#E65100';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Horizontal bar
      ctx.beginPath();
      ctx.moveTo(shieldX + shieldW * 0.2, crossCY - shieldH * 0.05);
      ctx.lineTo(shieldX + shieldW * 0.8, crossCY - shieldH * 0.05);
      ctx.stroke();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. ASSASSIN (刺客) - Melee, Aggressive, Flank movement
  // ═══════════════════════════════════════════════════════════════
  assassin: {
    id: 'assassin',
    name: 'Assassin',
    nameCN: '刺客',
    color: '#B71C1C',
    secondaryColor: '#7F0000',
    glowColor: 'rgba(183, 28, 28, 0.4)',
    size: 36,
    speed: 5.4,
    hp: 100,
    attackPower: 12,
    attackSpeed: 0.9,
    chargeTime: 0.15,
    attackRange: 70,
    lifesteal: 0.1,
    movePattern: 'flank',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'lifesteal', name: '割裂汲取', description: '造成伤害时回复 10% 伤害值的生命。' }
    ],
    skill: {
      name: '背刺',
      nameEN: 'Backstab',
      cooldown: 7,
      damage: 30,
      range: 80,
      type: 'backstab',
      duration: 0
    },
    /**
     * Draw two small daggers (thin triangles) on either side.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      var daggerLen = size * 1.0;
      var daggerWidth = 3;

      // Dagger 1 (upper right)
      ctx.save();
      ctx.translate(size * 0.5, -size * 0.6);
      ctx.rotate(0.3); // Slight upward angle

      ctx.beginPath();
      ctx.moveTo(daggerLen, 0);              // Tip
      ctx.lineTo(0, -daggerWidth);           // Base upper
      ctx.lineTo(2, 0);                      // Notch
      ctx.lineTo(0, daggerWidth);            // Base lower
      ctx.closePath();
      ctx.fillStyle = '#9E9E9E';
      ctx.fill();
      ctx.strokeStyle = '#616161';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Handle
      ctx.beginPath();
      ctx.moveTo(0, -daggerWidth);
      ctx.lineTo(-6, -daggerWidth * 0.8);
      ctx.lineTo(-6, daggerWidth * 0.8);
      ctx.lineTo(0, daggerWidth);
      ctx.closePath();
      ctx.fillStyle = '#4E342E';
      ctx.fill();

      ctx.restore();

      // Dagger 2 (lower right)
      ctx.save();
      ctx.translate(size * 0.5, size * 0.6);
      ctx.rotate(-0.3); // Slight downward angle

      ctx.beginPath();
      ctx.moveTo(daggerLen, 0);
      ctx.lineTo(0, -daggerWidth);
      ctx.lineTo(2, 0);
      ctx.lineTo(0, daggerWidth);
      ctx.closePath();
      ctx.fillStyle = '#9E9E9E';
      ctx.fill();
      ctx.strokeStyle = '#616161';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Handle
      ctx.beginPath();
      ctx.moveTo(0, -daggerWidth);
      ctx.lineTo(-6, -daggerWidth * 0.8);
      ctx.lineTo(-6, daggerWidth * 0.8);
      ctx.lineTo(0, daggerWidth);
      ctx.closePath();
      ctx.fillStyle = '#4E342E';
      ctx.fill();

      ctx.restore();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. MINION (小黄人) - Ranged, Balanced, Wobble movement
  // ═══════════════════════════════════════════════════════════════
  minion: {
    id: 'minion',
    name: 'Minion',
    nameCN: '小黄人',
    color: '#FDD835',
    secondaryColor: '#F9A825',
    glowColor: 'rgba(253, 216, 53, 0.4)',
    size: 36,
    speed: 4.3,
    hp: 100,
    attackPower: 10,
    attackSpeed: 0.85,
    chargeTime: 0.3,
    attackRange: 340,
    projectileSpeed: 900,
    lifesteal: 0.05,
    movePattern: 'wobble',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'banana',
    passives: [
      { id: 'lifesteal', name: '偷吃回复', description: '造成伤害时回复 5% 伤害值的生命。' }
    ],
    skill: {
      name: '香蕉皮',
      nameEN: 'Banana Peel',
      cooldown: 9,
      damage: 8,
      range: 210,
      type: 'slow',
      duration: 2
    },
    /**
     * Draw goggle/eye and a small weapon circle.
     * Mimics the classic minion look with a single large goggle.
     */
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // --- Goggle (large eye) ---
      var goggleX = size * 0.3;
      var goggleY = -size * 0.1;
      var goggleRadius = size * 0.4;

      // Goggle frame (silver ring)
      ctx.beginPath();
      ctx.arc(goggleX, goggleY, goggleRadius + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#BDBDBD';
      ctx.fill();
      ctx.strokeStyle = '#757575';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Goggle strap (goes around)
      ctx.beginPath();
      ctx.moveTo(goggleX + goggleRadius + 2, goggleY - 2);
      ctx.lineTo(goggleX + goggleRadius + 8, goggleY - 3);
      ctx.moveTo(goggleX + goggleRadius + 2, goggleY + 2);
      ctx.lineTo(goggleX + goggleRadius + 8, goggleY + 3);
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Eye white
      ctx.beginPath();
      ctx.arc(goggleX, goggleY, goggleRadius - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Iris (brown, follows angle slightly)
      var irisOffX = Math.cos(0) * 2; // Slight look direction
      var irisOffY = Math.sin(0) * 2;
      ctx.beginPath();
      ctx.arc(goggleX + irisOffX, goggleY + irisOffY, goggleRadius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#5D4037';
      ctx.fill();

      // Pupil
      ctx.beginPath();
      ctx.arc(goggleX + irisOffX, goggleY + irisOffY, goggleRadius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Eye glint
      ctx.beginPath();
      ctx.arc(goggleX + irisOffX + 2, goggleY + irisOffY - 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();

      // --- Small weapon circle (banana launcher) ---
      var weapX = -size * 0.5;
      var weapY = size * 0.5;
      ctx.beginPath();
      ctx.arc(weapX, weapY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#8D6E63';
      ctx.fill();
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tiny banana on weapon
      ctx.beginPath();
      ctx.arc(weapX, weapY, 3, -Math.PI * 0.3, Math.PI * 0.7, false);
      ctx.strokeStyle = '#FDD835';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 9. ONE PUNCH MAN (一拳超人) - Melee Superhero
  // ═══════════════════════════════════════════════════════════════
  one_punch_man: {
    id: 'one_punch_man',
    name: 'One Punch Man',
    nameCN: '一拳超人',
    color: '#FFEB3B',
    secondaryColor: '#D32F2F',
    glowColor: 'rgba(255, 235, 59, 0.4)',
    size: 36,
    speed: 5.2,
    hp: 100,
    attackPower: 22,
    attackSpeed: 0.8,
    chargeTime: 0.2,
    attackRange: 85,
    lifesteal: 0,
    movePattern: 'dash',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'saitama_dodge', name: '直觉闪避', description: '受到伤害时有 35% 概率闪避。' },
      { id: 'saitama_splash', name: '拳风余波', description: '普通攻击命中时造成小范围溅射。' }
    ],
    skill: {
      name: '认真一拳',
      nameEN: 'Serious Punch',
      cooldown: 14,
      damage: 80,
      range: 120,
      type: 'serious_punch',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // White Cape (drawn behind the body)
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, 0);
      ctx.lineTo(-size * 2.2, -size * 0.6 + Math.sin(time * 8) * 4);
      ctx.lineTo(-size * 2.0, size * 0.1);
      ctx.lineTo(-size * 2.2, size * 0.6 - Math.sin(time * 8) * 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red Gloves (two circles at the front)
      ctx.fillStyle = '#D32F2F';
      ctx.strokeStyle = '#B71C1C';
      ctx.lineWidth = 1.5;
      // Left glove
      ctx.beginPath();
      ctx.arc(size * 0.8, -size * 0.4, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Right glove
      ctx.beginPath();
      ctx.arc(size * 0.8, size * 0.4, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Simple black eyes/mouth (Saitama classic simple face)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.fillRect(size * 0.4, -size * 0.2, 4, 2);
      ctx.fillRect(size * 0.4, size * 0.2, 4, 2);
      ctx.fillRect(size * 0.45, -2, 2, 4);

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 10. BLOOD DEMON (血魔) - Melee Lifesteal Superhero
  // ═══════════════════════════════════════════════════════════════
  blood_demon: {
    id: 'blood_demon',
    name: 'Blood Demon',
    nameCN: '血魔',
    color: '#880E4F',
    secondaryColor: '#FF1744',
    glowColor: 'rgba(255, 23, 68, 0.4)',
    size: 36,
    speed: 4.6,
    hp: 100,
    attackPower: 15,
    attackSpeed: 1.1,
    chargeTime: 0.3,
    attackRange: 90,
    lifesteal: 0.40, // 40% Lifesteal
    movePattern: 'zigzag',
    aiTendency: 'balanced',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'lifesteal', name: '鲜血汲取', description: '造成伤害时回复 40% 伤害值的生命。' },
      { id: 'blood_shield', name: '血红护盾', description: '低生命受击时生成 35 点护盾，15 秒冷却。' }
    ],
    skill: {
      name: '蝙蝠召唤',
      nameEN: 'Summon Bats',
      cooldown: 8,
      damage: 22,
      range: 250,
      type: 'summon_bats',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Blood wings (large crimson wings on back)
      ctx.fillStyle = '#310015';
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 2;
      
      const wingSwing = Math.sin(time * 5) * 0.2;

      // Left Wing
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size * 0.3);
      ctx.lineTo(-size * 1.8, -size * 1.5 - wingSwing * size);
      ctx.lineTo(-size * 1.2, -size * 0.5);
      ctx.lineTo(-size * 2.2, -size * 0.2 - wingSwing * size);
      ctx.lineTo(-size * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, size * 0.3);
      ctx.lineTo(-size * 1.8, size * 1.5 + wingSwing * size);
      ctx.lineTo(-size * 1.2, size * 0.5);
      ctx.lineTo(-size * 2.2, size * 0.2 + wingSwing * size);
      ctx.lineTo(-size * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Floating blood orb above
      ctx.save();
      const orbY = y - size - 15 + Math.sin(time * 6) * 5;
      ctx.beginPath();
      ctx.arc(x, orbY, 7, 0, Math.PI * 2);
      var grad = ctx.createRadialGradient(x, orbY, 1, x, orbY, 7);
      grad.addColorStop(0, '#FF5252');
      grad.addColorStop(1, '#880E4F');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 11. TRAIN CONDUCTOR (列车长) - Ranged Control Superhero
  // ═══════════════════════════════════════════════════════════════
  train_conductor: {
    id: 'train_conductor',
    name: 'Train Conductor',
    nameCN: '列车长',
    color: '#1A237E',
    secondaryColor: '#FFD700',
    glowColor: 'rgba(26, 35, 126, 0.4)',
    size: 36,
    speed: 4.8,
    hp: 100,
    attackPower: 15,
    attackSpeed: 1.0,
    chargeTime: 0.4,
    attackRange: 360,
    projectileSpeed: 850,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'train',
    passives: [
      { id: 'steam_whistle', name: '蒸汽鸣笛', description: '敌人靠近时自动击退并减速，6 秒冷却。' },
      { id: 'train_stun', name: '铁轨震荡', description: '火车投射物命中时额外眩晕。' }
    ],
    skill: {
      name: '列车出站',
      nameEN: 'Train Stampede',
      cooldown: 10,
      damage: 35,
      range: 250,
      type: 'train_stampede',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Pocket watch chain dangling
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-size * 0.3, size * 0.3, size * 0.4, 0, Math.PI * 0.7, false);
      ctx.stroke();

      // Conductor Hat visor cap
      ctx.fillStyle = '#0D47A1';
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(size * 0.3, 0, size * 0.6, -Math.PI * 0.5, Math.PI * 0.5, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hat Visor
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(size * 0.5, 0, size * 0.55, -Math.PI * 0.3, Math.PI * 0.3, false);
      ctx.lineTo(size * 0.8, size * 0.25);
      ctx.arc(size * 0.5, 0, size * 0.55, Math.PI * 0.3, -Math.PI * 0.3, true);
      ctx.closePath();
      ctx.fill();

      // Gold Badge
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(size * 0.4, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 12. SUPERHERO SUMMONER (超级召唤师) - Summoner Superhero
  // ═══════════════════════════════════════════════════════════════
  super_summoner: {
    id: 'super_summoner',
    name: 'Superhero Summoner',
    nameCN: '超级召唤师',
    color: '#9C27B0',
    secondaryColor: '#E040FB',
    glowColor: 'rgba(156, 39, 176, 0.4)',
    size: 34,
    speed: 3.5,
    hp: 100,
    attackPower: 25,
    attackSpeed: 1.4,
    chargeTime: 0.2,
    attackRange: 280,
    projectileSpeed: 500,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'defensive',
    weaponType: 'ranged',
    projectileType: 'homing_orb',
    passives: [
      { id: 'summoner_attack', name: '石像役使', description: '普通攻击改为召唤一名短命石像。' }
    ],
    skill: {
      name: '地狱军团',
      nameEN: 'Summon Legion',
      cooldown: 7,
      damage: 0,
      range: 1000,
      type: 'summon_legion',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Wizard Hat
      ctx.fillStyle = '#4A148C';
      ctx.strokeStyle = '#E040FB';
      ctx.lineWidth = 1.5;
      
      // Hat brim
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.9, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hat peak
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, 0);
      ctx.lineTo(size * 0.2, -size * 1.5);
      ctx.lineTo(size * 0.4, 0);
      ctx.fill();
      ctx.stroke();

      // Magic Staff (Held in right hand)
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(size * 0.6, -size * 0.8);
      ctx.lineTo(size * 0.6, size * 0.8);
      ctx.stroke();

      // Glowing orb on staff
      ctx.fillStyle = '#00E5FF';
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 10 + Math.sin(time * 5) * 5;
      ctx.beginPath();
      ctx.arc(size * 0.6, -size * 0.8, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 13. BOMBER (炸弹人) - Ranged Area Damage, Ordinary Fighter
  // ═══════════════════════════════════════════════════════════════
  bomber: {
    id: 'bomber',
    name: 'Bomber',
    nameCN: '炸弹人',
    color: '#FF7043',
    secondaryColor: '#5D4037',
    glowColor: 'rgba(255, 112, 67, 0.35)',
    size: 35,
    speed: 3.8,
    hp: 100,
    attackPower: 12,
    attackSpeed: 1.45,
    chargeTime: 0.45,
    attackRange: 560,
    projectileSpeed: 760,
    lifesteal: 0,
    movePattern: 'wobble',
    aiTendency: 'balanced',
    weaponType: 'ranged',
    projectileType: 'bomb',
    specialEffects: [
      { name: '范围炸弹', description: '普通攻击命中后会在目标附近爆炸，造成范围伤害。' }
    ],
    skill: {
      name: '爆裂炸弹',
      nameEN: 'Blast Bomb',
      cooldown: 10,
      damage: 27,
      range: 520,
      type: 'bomb_toss',
      duration: 0,
      area: 125
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Round bomb pack behind the body
      ctx.beginPath();
      ctx.arc(-size * 0.75, 0, size * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = '#2E1A12';
      ctx.fill();
      ctx.strokeStyle = '#FFAB40';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spark fuse
      var spark = 2 + Math.sin(time * 16) * 1.5;
      ctx.beginPath();
      ctx.moveTo(-size * 0.95, -size * 0.28);
      ctx.quadraticCurveTo(-size * 1.18, -size * 0.62, -size * 1.0, -size * 0.82);
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-size * 1.0, -size * 0.82, spark, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD54F';
      ctx.shadowColor = '#FF6F00';
      ctx.shadowBlur = 8;
      ctx.fill();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 14. POISONER (放毒者) - Ranged Debuff, Ordinary Fighter
  // ═══════════════════════════════════════════════════════════════
  poisoner: {
    id: 'poisoner',
    name: 'Poisoner',
    nameCN: '放毒者',
    color: '#66BB6A',
    secondaryColor: '#1B5E20',
    glowColor: 'rgba(102, 187, 106, 0.35)',
    size: 34,
    speed: 4.0,
    hp: 100,
    attackPower: 10,
    attackSpeed: 1.0,
    chargeTime: 0.35,
    attackRange: 310,
    projectileSpeed: 760,
    lifesteal: 0,
    movePattern: 'arc',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'poison',
    passives: [
      { id: 'poison_trail', name: '毒雾足迹', description: '移动时在身后留下数秒毒雾，使敌人中毒。' }
    ],
    specialEffects: [
      { name: '毒弹', description: '普通攻击命中后使敌人中毒并短暂减速。' },
      { name: '持续毒雾', description: '毒雾区域会持续让敌人中毒。' }
    ],
    skill: {
      name: '毒雾瓶',
      nameEN: 'Toxic Flask',
      cooldown: 9,
      damage: 10,
      range: 240,
      type: 'poison_cloud',
      duration: 3.0,
      area: 110,
      poisonDps: 4.0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Potion bottle
      ctx.fillStyle = '#A5D6A7';
      ctx.strokeStyle = '#1B5E20';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(size * 0.45, -size * 0.45);
      ctx.lineTo(size * 0.75, -size * 0.25);
      ctx.lineTo(size * 0.75, size * 0.25);
      ctx.lineTo(size * 0.45, size * 0.45);
      ctx.lineTo(size * 0.25, size * 0.2);
      ctx.lineTo(size * 0.25, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bubbling poison
      ctx.fillStyle = '#76FF03';
      for (var i = 0; i < 3; i++) {
        var by = -size * 0.3 + i * size * 0.25 + Math.sin(time * 5 + i) * 2;
        ctx.beginPath();
        ctx.arc(size * 0.5, by, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 15. SPEARMAN (长枪兵) - Melee Reach, Ordinary Fighter
  // ═══════════════════════════════════════════════════════════════
  spearman: {
    id: 'spearman',
    name: 'Spearman',
    nameCN: '长枪兵',
    color: '#78909C',
    secondaryColor: '#37474F',
    glowColor: 'rgba(120, 144, 156, 0.35)',
    size: 36,
    speed: 4.7,
    hp: 100,
    attackPower: 15,
    attackSpeed: 1.25,
    chargeTime: 0.28,
    attackRange: 105,
    lifesteal: 0,
    movePattern: 'linear',
    aiTendency: 'balanced',
    weaponType: 'melee',
    projectileType: null,
    passives: [
      { id: 'spear_pierce', name: '长枪穿刺', description: '普通攻击命中时会穿透直线上的其他敌人，造成较低伤害。' }
    ],
    specialEffects: [
      { name: '直线穿刺', description: '技能会伤害前方直线范围内的敌人。' }
    ],
    skill: {
      name: '突刺',
      nameEN: 'Piercing Thrust',
      cooldown: 8,
      damage: 18,
      range: 155,
      type: 'pierce',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Long spear shaft and tip
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.9, 0);
      ctx.lineTo(size * 1.9, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size * 2.15, 0);
      ctx.lineTo(size * 1.75, -size * 0.16);
      ctx.lineTo(size * 1.75, size * 0.16);
      ctx.closePath();
      ctx.fillStyle = '#CFD8DC';
      ctx.fill();
      ctx.strokeStyle = '#607D8B';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 16. FROST APPRENTICE (寒冰学徒) - Ranged Slow, Ordinary Fighter
  // ═══════════════════════════════════════════════════════════════
  frost_apprentice: {
    id: 'frost_apprentice',
    name: 'Frost Apprentice',
    nameCN: '寒冰学徒',
    color: '#4FC3F7',
    secondaryColor: '#0277BD',
    glowColor: 'rgba(79, 195, 247, 0.35)',
    size: 34,
    speed: 3.9,
    hp: 100,
    attackPower: 12,
    attackSpeed: 1.25,
    chargeTime: 0.5,
    attackRange: 350,
    projectileSpeed: 720,
    lifesteal: 0,
    movePattern: 'keepDistance',
    aiTendency: 'cautious',
    weaponType: 'ranged',
    projectileType: 'magic',
    specialEffects: [
      { name: '大范围冰霜', description: '技能会在超大范围内减速敌人。' }
    ],
    skill: {
      name: '冰霜新星',
      nameEN: 'Frost Nova',
      cooldown: 10,
      damage: 12,
      range: 360,
      type: 'frost_nova',
      duration: 3.0,
      area: 360
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * 1.4);

      // Small rotating snowflake
      ctx.strokeStyle = '#B3E5FC';
      ctx.lineWidth = 2;
      for (var i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 0.72, 0);
        ctx.moveTo(size * 0.45, 0);
        ctx.lineTo(size * 0.55, -size * 0.12);
        ctx.moveTo(size * 0.45, 0);
        ctx.lineTo(size * 0.55, size * 0.12);
        ctx.stroke();
      }

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 17. VULCAN (火神) - Fire Superhero
  // ═══════════════════════════════════════════════════════════════
  vulcan: {
    id: 'vulcan',
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
      { id: 'fire_cone_basic', name: '神焰吐息', description: '普通攻击改为扇形放火，使敌人进入着火状态。' },
      { id: 'inferno_rebirth', name: '浴火重生', description: '每场战斗首次受到致命伤害时恢复 45 生命，并点燃周围敌人。' }
    ],
    specialEffects: [
      { name: '着火状态', description: '着火敌人会持续扣血，并成为火神技能的爆炸核心。' },
      { name: '连锁爆燃', description: '技能会引爆场上所有着火敌人及其四周区域。' }
    ],
    skill: {
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
  },

  // ═══════════════════════════════════════════════════════════════
  // 18. SUMMONED GOLEM (召唤巨石) - Minion (Hidden)
  // ═══════════════════════════════════════════════════════════════
  summoned_golem: {
    id: 'summoned_golem',
    name: 'Stone Golem',
    nameCN: '召唤巨石',
    color: '#795548',
    secondaryColor: '#D7CCC8',
    glowColor: 'rgba(121, 85, 72, 0.4)',
    size: 28,
    speed: 4.5,
    hp: 15,
    attackPower: 5,
    attackSpeed: 1.0,
    chargeTime: 0.4,
    attackRange: 45,
    lifesteal: 0,
    hidden: true, // Not selectable in UI
    movePattern: 'linear',
    aiTendency: 'aggressive',
    weaponType: 'melee',
    projectileType: null,
    skill: {
      name: '巨石重击',
      nameEN: 'Slam',
      cooldown: 8,
      damage: 15,
      range: 55,
      type: 'aoe_melee',
      duration: 0
    },
    drawDecorations: function(ctx, x, y, angle, size, time) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Golem rocky shoulders
      ctx.fillStyle = '#5D4037';
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 2;
      
      // Left shoulder rock
      ctx.beginPath();
      ctx.arc(size * 0.2, -size * 0.8, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right shoulder rock
      ctx.beginPath();
      ctx.arc(size * 0.2, size * 0.8, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing rune eye
      ctx.fillStyle = '#E040FB';
      ctx.shadowColor = '#E040FB';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(size * 0.5, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
};
