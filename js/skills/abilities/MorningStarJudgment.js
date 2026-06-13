import * as EffectLib from '../../effects_lib/index.js';
import * as Passives from '../Passives.js';
import { soundSystem } from '../../audio.js';

function applyRandomDebuff(target) {
  const roll = Math.floor(Math.random() * 4);
  switch (roll) {
    case 0:
      target.applyBurn(3.0, 6.0);
      return '灼烧';
    case 1:
      target.applyPoison(3.0, 4.0);
      return '中毒';
    case 2:
      target.applySlow(2.0, 0.6);
      return '减速';
    default:
      target.applyStun(0.8);
      return '眩晕';
  }
}

export function executeMorningStarJudgment(caster, skill, weaponSystem, effectSystem) {
  const enemies = caster.battleContext && caster.battleContext.opposingTeam
    ? caster.battleContext.opposingTeam.filter(enemy => enemy.isAlive())
    : [];
  if (enemies.length === 0) return;

  // Shuffle shallow copy and pick up to targetCount enemies.
  const shuffled = enemies.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  const count = Math.min(skill.targetCount || 3, shuffled.length);
  for (let i = 0; i < count; i++) {
    const enemy = shuffled[i];
    const debuffName = applyRandomDebuff(enemy);
    let damage = caster.charData.attackPower;
    damage = Passives.applyDawnDebuffBonus(caster, enemy, damage, effectSystem);
    enemy.takeDamage(damage, caster.x, caster.y, effectSystem);
    Passives.triggerDawnBlessing(caster, effectSystem);
    if (enemy.hp <= 0 || enemy.state === 'dead') {
      Passives.triggerDawnKillRevive(caster, effectSystem);
    }
    effectSystem.addDamageNumber(enemy.x, enemy.y - enemy.charData.size - 28, debuffName, false, '#FFF176');
    EffectLib.addStunEffect(effectSystem, enemy.x, enemy.y, '#FFF176', 28);
  }

  EffectLib.addMeteorEffect(effectSystem, caster.x, caster.y, '#FFF176', 75);
  effectSystem.screenShake(6);
  if (soundSystem) soundSystem.playSkillSound();
}
