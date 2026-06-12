import { BaseProjectile } from './BaseProjectile.js';
import { BananaProjectile } from './BananaProjectile.js';
import { PoisonProjectile } from './PoisonProjectile.js';
import { ArrowProjectile } from './ArrowProjectile.js';
import { BombProjectile } from './BombProjectile.js';
import { MagicProjectile } from './MagicProjectile.js';
import { SkillProjectileProjectile } from './SkillProjectileProjectile.js';
import { ShurikenProjectile } from './ShurikenProjectile.js';

export function createProjectile(x, y, vx, vy, damage, ownerId, color, size, type) {
  switch (type) {
    case 'banana': return new BananaProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    case 'poison': return new PoisonProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    case 'arrow': return new ArrowProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    case 'bomb': return new BombProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    case 'magic': return new MagicProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    case 'skill_projectile': return new SkillProjectileProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    case 'shuriken': return new ShurikenProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
    default: return new BaseProjectile(x, y, vx, vy, damage, ownerId, color, size, type);
  }
}
