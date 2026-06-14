import { BaseProjectile } from '../projectiles/BaseProjectile.js';
import { SkillProjectileProjectile } from '../projectiles/SkillProjectileProjectile.js';
import { BatProjectile } from '../projectiles/BatProjectile.js';
import { BombProjectile } from '../projectiles/BombProjectile.js';
import { ArrowProjectile } from '../projectiles/ArrowProjectile.js';
import { ShurikenProjectile } from '../projectiles/ShurikenProjectile.js';
import { PoisonProjectile } from '../projectiles/PoisonProjectile.js';
import { MagicProjectile } from '../projectiles/MagicProjectile.js';
import { TrainProjectile } from '../projectiles/TrainProjectile.js';
import { BananaProjectile } from '../projectiles/BananaProjectile.js';
import { HomingOrbProjectile } from '../projectiles/HomingOrbProjectile.js';
import { LaserProjectile } from '../projectiles/LaserProjectile.js';
import { WaterOrbProjectile } from '../projectiles/WaterOrbProjectile.js';
import { TimeBoltProjectile } from '../projectiles/TimeBoltProjectile.js';
import { FlyingSwordProjectile } from '../projectiles/FlyingSwordProjectile.js';
import { SwordWaveProjectile } from '../projectiles/SwordWaveProjectile.js';
import { GanJiangMoYeSwordProjectile } from '../projectiles/GanJiangMoYeSwordProjectile.js';

/**
 * Projectile type → constructor map.
 * Add a new projectile type: import it, add one entry here — done.
 */
const projectileTypes = {
  skill_projectile: SkillProjectileProjectile,
  bat:              BatProjectile,
  bomb:             BombProjectile,
  arrow:            ArrowProjectile,
  shuriken:         ShurikenProjectile,
  poison:           PoisonProjectile,
  magic:            MagicProjectile,
  train:            TrainProjectile,
  banana:           BananaProjectile,
  homing_orb:       HomingOrbProjectile,
  laser:            LaserProjectile,
  water_orb:        WaterOrbProjectile,
  time_bolt:        TimeBoltProjectile,
  flying_sword:     FlyingSwordProjectile,
  sword_wave:       SwordWaveProjectile,
  ganjiang_moye_sword: GanJiangMoYeSwordProjectile,
};

export function createProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker) {
  const Cls = projectileTypes[type] || BaseProjectile;
  return new Cls(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
}
