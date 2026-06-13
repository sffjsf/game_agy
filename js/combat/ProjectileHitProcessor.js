import * as EffectLib from '../effects_lib/index.js';

export class ProjectileHitProcessor {
  constructor(effectSystem, applyAreaDamage) {
    this.effectSystem = effectSystem;
    this.applyAreaDamage = applyAreaDamage;
  }

  process(hit) {
    if (!hit.projectile) return;

    const projectile = hit.projectile;
    const attacker = projectile.attacker;

    if (attacker && attacker.hasPassive && attacker.hasPassive('train_stun') && projectile.type === 'train') {
      hit.target.applyStun(1.8);
      EffectLib.addStunEffect(this.effectSystem, hit.target.x, hit.target.y, '#FFD700', 30);
    }

    switch (projectile.type) {
      case 'bomb':
        this.applyAreaDamage(projectile.x, projectile.y, projectile.ownerId, hit.damage, 105, attacker);
        EffectLib.addBombEffect(this.effectSystem, projectile.x, projectile.y, projectile.color, 105);
        this.effectSystem.screenShake(6);
        return;

      case 'poison':
        hit.target.applyPoison(3.0, 3.5);
        hit.target.applySlow(1.2);
        EffectLib.addPoisonCloudEffect(this.effectSystem, hit.target.x, hit.target.y, projectile.color, 55);
        break;
    }

    if (!attacker || !attacker.isAlive()) return;

    attacker.healFromDamage(hit.damage, this.effectSystem, projectile.type === 'bat' ? 1.0 : undefined);
  }
}
