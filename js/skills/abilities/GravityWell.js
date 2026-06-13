import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

export function executeGravityWell(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  if (!caster.target) return;

  const targetX = caster.target.x;
  const targetY = caster.target.y;

  // Flash tech aura at Viktor
  EffectLib.addMultiShotEffect(effectSystem, caster.x, caster.y, '#FF6D00', 30);

  if (soundSystem) {
    soundSystem.playSkillSound();
  }

  // Create the Gravity Well in the combat area
  if (caster.battleContext.addGravityWell) {
    caster.battleContext.addGravityWell(
      targetX,
      targetY,
      caster.team,
      130, // Pull radius
      skill.duration || 2.5,
      skill.damage || 38
    );
  }
}
