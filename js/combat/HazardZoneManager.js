import * as EffectLib from '../effects_lib/index.js';
import { safeFinite, safeDirection } from '../utils.js';
import { soundSystem } from '../audio.js';

export class HazardZoneManager {
  constructor() {
    this.poisonZones = [];
    this.gravityWells = [];
    this.burnZones = [];
    this.temporalFields = [];
    this.swordArrays = [];
    this.frostLands = [];
  }

  clear() {
    this.poisonZones = [];
    this.gravityWells = [];
    this.burnZones = [];
    this.temporalFields = [];
    this.swordArrays = [];
    this.frostLands = [];
  }

  addPoisonZone(x, y, ownerTeam, radius, duration, poisonDps, slowDuration) {
    this.poisonZones.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam: ownerTeam,
      radius: radius,
      duration: duration,
      maxDuration: duration,
      poisonDps: poisonDps || 3.0,
      slowDuration: slowDuration || 0
    });
  }

  addGravityWell(x, y, ownerTeam, radius, duration, damage) {
    this.gravityWells.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam: ownerTeam,
      radius: radius || 130,
      duration: duration || 2.5,
      maxDuration: duration || 2.5,
      damage: damage || 38
    });
  }

  addBurnZone(x, y, ownerTeam, radius, duration, burnDps) {
    this.burnZones.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam: ownerTeam,
      radius: radius || 40,
      duration: duration || 2.0,
      maxDuration: duration || 2.0,
      burnDps: burnDps || 8.0
    });
  }

  addTemporalField(x, y, ownerTeam, radius, duration) {
    this.temporalFields.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam: ownerTeam,
      radius: radius || 150,
      duration: duration || 3.5,
      maxDuration: duration || 3.5
    });
  }

  addSwordArray(x, y, ownerTeam, radius, duration) {
    this.swordArrays.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam: ownerTeam,
      radius: radius || 280,
      duration: duration || 5.0,
      maxDuration: duration || 5.0,
      tickTimer: 0
    });
  }

  addFrostLand(x, y, ownerTeam, radius, duration, damage, caster) {
    this.frostLands.push({
      x: safeFinite(x, 400),
      y: safeFinite(y, 300),
      ownerTeam,
      radius: radius || 190,
      duration: duration || 3.0,
      maxDuration: duration || 3.0,
      damage: damage || 8,
      tickTimer: 0,
      caster
    });
  }

  update(dt, battle) {
    this.updatePoisonZones(dt, battle);
    this.updateGravityWells(dt, battle);
    this.updateBurnZones(dt, battle);
    this.updateTemporalFields(dt, battle);
    this.updateSwordArrays(dt, battle);
    this.updateFrostLands(dt, battle);
  }

  updatePoisonZones(dt, battle) {
    for (let i = this.poisonZones.length - 1; i >= 0; i--) {
      const zone = this.poisonZones[i];
      zone.duration -= dt;
      if (zone.duration <= 0) {
        this.poisonZones.splice(i, 1);
        continue;
      }

      const enemies = getEnemies(zone.ownerTeam, battle);
      if (!enemies) continue;

      enemies.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const dir = safeDirection(enemy.x - zone.x, enemy.y - zone.y);
        if (dir.dist <= zone.radius) {
          enemy.applyPoison(Math.min(1.0, zone.duration), zone.poisonDps);
          if (zone.slowDuration > 0) enemy.applySlow(zone.slowDuration);
        }
      });
    }
  }

  updateGravityWells(dt, battle) {
    const effectSystem = battle.effectSystem;

    for (let i = this.gravityWells.length - 1; i >= 0; i--) {
      const well = this.gravityWells[i];
      well.duration -= dt;

      if (Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const dist = well.radius * (0.3 + Math.random() * 0.7);
        const px = well.x + Math.cos(angle) * dist;
        const py = well.y + Math.sin(angle) * dist;
        const speed = 140;
        const vx = -Math.sin(angle) * speed - Math.cos(angle) * 90;
        const vy = Math.cos(angle) * speed - Math.sin(angle) * 90;

        effectSystem.addParticle({
          x: px,
          y: py,
          vx: vx,
          vy: vy,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.7,
          color: '#FF6D00',
          size: 2.0 + Math.random() * 2,
          gravity: 0,
          friction: 0.96,
          type: 'circle'
        });
      }

      if (Math.random() < 0.12) {
        effectSystem.addParticle({
          x: well.x,
          y: well.y,
          vx: 0,
          vy: 0,
          life: 0.25,
          maxLife: 0.25,
          color: '#3E2723',
          size: 20 + Math.sin(Date.now() * 0.015) * 6,
          gravity: 0,
          friction: 1.0,
          type: 'ring'
        });
      }

      if (well.duration <= 0) {
        battle.applyAreaDamage(well.x, well.y, well.ownerTeam, well.damage, well.radius, null);
        EffectLib.addFireBurstEffect(effectSystem, well.x, well.y, '#FF6D00', well.radius);
        effectSystem.screenShake(10);
        this.gravityWells.splice(i, 1);
        continue;
      }

      const enemies = getEnemies(well.ownerTeam, battle);
      if (enemies) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive()) return;
          const dx = enemy.x - well.x;
          const dy = enemy.y - well.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist <= well.radius) {
            enemy.applySlow(0.2, 0.5);

            if (!enemy.hasPassive('stone_shell')) {
              const pullPower = 150 * dt * (1 - dist / well.radius);
              const pullAngle = Math.atan2(dy, dx);
              enemy.x -= Math.cos(pullAngle) * pullPower;
              enemy.y -= Math.sin(pullAngle) * pullPower;
            }

            if (Math.random() < 0.15) {
              const pullAngle = Math.atan2(dy, dx);
              effectSystem.addParticle({
                x: enemy.x,
                y: enemy.y,
                vx: -Math.cos(pullAngle) * 250,
                vy: -Math.sin(pullAngle) * 250,
                life: 0.25,
                maxLife: 0.25,
                color: '#FF6D00',
                size: 2,
                gravity: 0,
                friction: 0.95,
                type: 'spark'
              });
            }
          }
        });
      }
    }
  }

  updateBurnZones(dt, battle) {
    const effectSystem = battle.effectSystem;

    for (let i = this.burnZones.length - 1; i >= 0; i--) {
      const zone = this.burnZones[i];
      zone.duration -= dt;
      if (zone.duration <= 0) {
        this.burnZones.splice(i, 1);
        continue;
      }

      if (Math.random() < 0.25) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * zone.radius;
        const px = zone.x + Math.cos(angle) * dist;
        const py = zone.y + Math.sin(angle) * dist;

        effectSystem.addParticle({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 20,
          vy: -20 - Math.random() * 30,
          life: 0.3 + Math.random() * 0.25,
          maxLife: 0.55,
          color: Math.random() < 0.6 ? '#FF3D00' : '#FFC400',
          size: 2.0 + Math.random() * 2.5,
          gravity: -60,
          friction: 0.94,
          type: 'spark'
        });
      }

      const enemies = getEnemies(zone.ownerTeam, battle);
      if (!enemies) continue;

      enemies.forEach(enemy => {
        if (!enemy.isAlive()) return;
        const dx = enemy.x - zone.x;
        const dy = enemy.y - zone.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist <= zone.radius) {
          enemy.applyBurn(1.0, zone.burnDps);
        }
      });
    }
  }

  updateTemporalFields(dt, battle) {
    const effectSystem = battle.effectSystem;
    for (let i = this.temporalFields.length - 1; i >= 0; i--) {
      const field = this.temporalFields[i];
      field.duration -= dt;

      // Spawn golden/orange particles in the temporal field
      if (Math.random() < 0.25) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * field.radius;
        const px = field.x + Math.cos(angle) * dist;
        const py = field.y + Math.sin(angle) * dist;
        effectSystem.addParticle({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 0.3 + Math.random() * 0.3,
          maxLife: 0.6,
          color: Math.random() < 0.5 ? '#E6C229' : '#F17105',
          size: 1.5 + Math.random() * 2,
          gravity: 0,
          friction: 0.95,
          type: 'spark'
        });
      }

      if (field.duration <= 0) {
        this.temporalFields.splice(i, 1);
        continue;
      }
    }
  }

  updateSwordArrays(dt, battle) {
    const effectSystem = battle.effectSystem;
    for (let i = this.swordArrays.length - 1; i >= 0; i--) {
      const array = this.swordArrays[i];
      array.duration -= dt;
      array.tickTimer += dt;

      // 1. High frequency sword rain ticks (every 0.25 seconds)
      if (array.tickTimer >= 0.25) {
        array.tickTimer = 0;
        const enemies = getEnemies(array.ownerTeam, battle);
        enemies.forEach(enemy => {
          if (enemy.isAlive()) {
            const dx = enemy.x - array.x;
            const dy = enemy.y - array.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= array.radius) {
              enemy.takeDamage(2, array.x, array.y, effectSystem);
              
              effectSystem.addParticle({
                x: enemy.x + (Math.random() - 0.5) * 10,
                y: enemy.y - 40,
                vx: 0,
                vy: 180,
                life: 0.25,
                maxLife: 0.25,
                color: '#FFF9C4',
                size: 2,
                type: 'circle'
              });
            }
          }
        });
      }

      // 2. Spawn golden spark/sword particles in the array
      if (Math.random() < 0.35) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * array.radius;
        const px = array.x + Math.cos(angle) * dist;
        const py = array.y + Math.sin(angle) * dist;
        effectSystem.addParticle({
          x: px,
          y: py,
          vx: 0,
          vy: 50 + Math.random() * 50,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.7,
          color: '#FFD700',
          size: 1.5 + Math.random() * 1.5,
          gravity: 0,
          friction: 0.96,
          type: 'spark'
        });
      }

      // 3. Cleave with giant Xuanyuan sword on expiration
      if (array.duration <= 0) {
        const enemies = getEnemies(array.ownerTeam, battle);
        enemies.forEach(enemy => {
          if (enemy.isAlive()) {
            const dx = enemy.x - array.x;
            const dy = enemy.y - array.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= array.radius) {
              const lostHp = enemy.maxHp - enemy.hp;
              const finalDmg = 35 + lostHp * 0.20;
              enemy.takeDamage(finalDmg, array.x, array.y, effectSystem);
              effectSystem.addHitEffect(enemy.x, enemy.y, '#FFD700');
              effectSystem.addDamageNumber(enemy.x, enemy.y - enemy.charData.size, '轩辕斩!', true, '#FFD700');
            }
          }
        });

        // Slam visual effects
        effectSystem.screenShake(15);
        for (let k = 0; k < 45; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 100 + Math.random() * 250;
          effectSystem.addParticle({
            x: array.x,
            y: array.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.4 + Math.random() * 0.4,
            maxLife: 0.8,
            color: k % 2 === 0 ? '#FFF9C4' : '#FFD700',
            size: 3.0 + Math.random() * 4.0,
            gravity: 0,
            friction: 0.91,
            type: 'circle'
          });
        }

        if (soundSystem) soundSystem.playSkillSound();

        this.swordArrays.splice(i, 1);
        continue;
      }
    }
  }

  updateFrostLands(dt, battle) {
    const effectSystem = battle.effectSystem;
    for (let i = this.frostLands.length - 1; i >= 0; i--) {
      const land = this.frostLands[i];
      land.duration -= dt;
      land.tickTimer += dt;

      if (land.caster && land.caster.isAlive && land.caster.isAlive()) {
        land.caster.x = land.x;
        land.caster.y = land.y;
        land.caster.ultInvincibilityTimer = Math.max(land.caster.ultInvincibilityTimer || 0, 0.2);
        land.caster.frostLandTimer = Math.max(land.caster.frostLandTimer || 0, land.duration);
      }

      const enemies = getEnemies(land.ownerTeam, battle);
      if (enemies) {
        enemies.forEach(enemy => {
          if (!enemy.isAlive()) return;
          const dx = enemy.x - land.x;
          const dy = enemy.y - land.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const pullReach = land.radius + 45;
          const affectedByFrostLand = dist <= pullReach;

          if (affectedByFrostLand && !enemy.hasPassive('stone_shell')) {
            const pull = (dist > land.radius ? 150 : 90) * dt;
            enemy.x -= (dx / dist) * pull;
            enemy.y -= (dy / dist) * pull;
          }

          const nextDx = enemy.x - land.x;
          const nextDy = enemy.y - land.y;
          const nextDist = Math.sqrt(nextDx * nextDx + nextDy * nextDy) || 1;
          if (affectedByFrostLand && nextDist > land.radius) {
            enemy.x = land.x + (nextDx / nextDist) * land.radius;
            enemy.y = land.y + (nextDy / nextDist) * land.radius;
          }

          if (affectedByFrostLand && nextDist <= land.radius) {
            enemy.applySlow(0.25, 0.45);
          }
        });
      }

      if (land.tickTimer >= 0.35) {
        land.tickTimer = 0;
        const victims = getEnemies(land.ownerTeam, battle);
        victims.forEach(enemy => {
          if (!enemy.isAlive()) return;
          const dx = enemy.x - land.x;
          const dy = enemy.y - land.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= land.radius) {
            enemy.takeDamage(land.damage, land.x, land.y, effectSystem);
            effectSystem.addHitEffect(enemy.x, enemy.y, '#B3E5FC');
          }
        });
      }

      if (Math.random() < 0.55) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * land.radius;
        effectSystem.addParticle({
          x: land.x + Math.cos(angle) * dist,
          y: land.y + Math.sin(angle) * dist,
          vx: -Math.sin(angle) * 90,
          vy: Math.cos(angle) * 90,
          life: 0.35,
          maxLife: 0.35,
          color: Math.random() < 0.5 ? '#E1F5FE' : '#81D4FA',
          size: 2.5,
          gravity: 0,
          friction: 0.95,
          type: 'spark'
        });
      }

      if (land.duration <= 0) {
        if (land.caster) land.caster.frostLandTimer = 0;
        this.frostLands.splice(i, 1);
      }
    }
  }
}

function getEnemies(ownerTeam, battle) {
  return ownerTeam === 'left' ? battle.fightersRight : battle.fightersLeft;
}
