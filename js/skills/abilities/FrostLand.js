import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

export function executeFrostLand(caster, skill, weaponSystem, effectSystem) {
  if (!caster.battleContext || !caster.battleContext.addFrostLand) return;

  const radius = skill.area || 190;
  const duration = skill.duration || 3.0;
  caster.frostLandTimer = duration;
  caster.ultInvincibilityTimer = Math.max(caster.ultInvincibilityTimer || 0, duration);

  caster.battleContext.addFrostLand(
    caster.x,
    caster.y,
    caster.team,
    radius,
    duration,
    skill.damage || 8,
    caster
  );

  EffectLib.addAoeMeleeEffect(effectSystem, caster.x, caster.y, '#B3E5FC', radius);
  effectSystem.addDamageNumber(caster.x, caster.y - caster.charData.size - 28, '极寒之地!', false, '#B3E5FC');
  effectSystem.screenShake(8);
  if (soundSystem) soundSystem.playSkillSound();
}
