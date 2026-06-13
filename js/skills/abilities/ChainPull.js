import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

export function executeChainPull(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  if (!caster.target || !caster.target.isAlive()) return;

  const target = caster.target;
  const pullDirX = caster.x - target.x;
  const pullDirY = caster.y - target.y;
  const pullDist = Math.sqrt(pullDirX * pullDirX + pullDirY * pullDirY) || 1;
  const pullAmount = Math.min(130, Math.max(45, pullDist - caster.charData.attackRange * 0.75));

  target.takeDamage(skill.damage, caster.x, caster.y, effectSystem);
  if (target.isAlive() && !target.hasPassive('stone_shell')) {
    target.x += (pullDirX / pullDist) * pullAmount;
    target.y += (pullDirY / pullDist) * pullAmount;
    target.applySlow(1.2, 0.6);
  }

  // Draw a rough chain line with hit effects along it.
  const segments = 6;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const px = caster.x + (target.x - caster.x) * t;
    const py = caster.y + (target.y - caster.y) * t;
    effectSystem.addHitEffect(px, py, '#BDBDBD');
  }

  EffectLib.addMultiShotEffect(effectSystem, caster.x, caster.y, caster.charData.color, 35);
  effectSystem.addDamageNumber(target.x, target.y - target.charData.size, '拖拽!', false, '#BDBDBD');
  effectSystem.screenShake(4);
  if (soundSystem) soundSystem.playSwingSound();
}
