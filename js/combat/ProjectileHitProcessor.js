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

    if (attacker && attacker.hasPassive) {
      if (attacker.hasPassive('abyssal_weight')) {
        hit.target.abyssalWeightStacks = Math.min((hit.target.abyssalWeightStacks || 0) + 1, 2);
        hit.target.abyssalWeightTimer = 5.0;
        this.effectSystem.addDamageNumber(hit.target.x, hit.target.y - hit.target.charData.size, `深渊重压 x${hit.target.abyssalWeightStacks}`, false, '#80DEEA');
      }

      if (attacker.hasPassive('temporal_dilation')) {
        hit.target.temporalDilationTimer = 3.0;
        this.effectSystem.addDamageNumber(hit.target.x, hit.target.y - hit.target.charData.size, '时间膨胀!', false, '#E6C229');
      }
    }

    if (projectile.type === 'ganjiang_moye_sword') {
      if (projectile.markOnHit && attacker && hit.target.applyConvergenceSwordMark) {
        hit.target.applyConvergenceSwordMark(attacker, this.effectSystem);
      }

      if (projectile.basicSword && attacker && attacker.isAlive()) {
        const batchId = projectile.batchId || 'single';
        hit.target.ganjiangMoyeSwordHitsByBatch = hit.target.ganjiangMoyeSwordHitsByBatch || {};
        const record = hit.target.ganjiangMoyeSwordHitsByBatch[batchId] || { ganjiang: false, moye: false, stunned: false };
        if (projectile.swordName === 'ganjiang') record.ganjiang = true;
        if (projectile.swordName === 'moye') record.moye = true;
        if (record.ganjiang && record.moye && !record.stunned) {
          record.stunned = true;
          hit.target.applyStun(1.2);
          EffectLib.addStunEffect(this.effectSystem, hit.target.x, hit.target.y, '#E040FB', 30);
          this.effectSystem.addDamageNumber(hit.target.x, hit.target.y - hit.target.charData.size - 18, '双剑交汇!', false, '#E040FB');
        }
        hit.target.ganjiangMoyeSwordHitsByBatch[batchId] = record;

        if ((hit.actualDamage || 0) > 0) {
          attacker.heal(hit.actualDamage * 0.4, this.effectSystem);
        }
        return;
      }
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
