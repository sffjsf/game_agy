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

export function createProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker) {
  switch (type) {
    case 'skill_projectile': return new SkillProjectileProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'bat': return new BatProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'bomb': return new BombProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'arrow': return new ArrowProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'shuriken': return new ShurikenProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'poison': return new PoisonProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'magic': return new MagicProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'train': return new TrainProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'banana': return new BananaProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);
    case 'homing_orb': return new HomingOrbProjectile(x, y, vx, vy, damage, ownerId, color, size, type, attacker);

    default: return new BaseProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
  }
}
