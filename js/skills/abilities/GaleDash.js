import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { createProjectile } from '../../combat/Projectile.js';
import { soundSystem } from '../../audio.js';

/**
 * Gale Dash — Wind Dancer dashes THROUGH the target, damaging all enemies
 * along the dash path and gaining wind fury afterwards.
 */
export function executeGaleDash(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  // Calculate destination: dash past the target by 60px
  var dashDestX = caster.target.x + (dx / dist) * 60;
  var dashDestY = caster.target.y + (dy / dist) * 60;

  // Clamp to arena bounds (read from battle context)
  const ctx = caster.battleContext;
  if (ctx) {
    dashDestX = Math.max(ctx.arenaX + 30, Math.min(ctx.arenaX + ctx.arenaWidth - 30, dashDestX));
    dashDestY = Math.max(ctx.arenaY + 30, Math.min(ctx.arenaY + ctx.arenaHeight - 30, dashDestY));
  }

  // Set up dashing_skill state
  caster.setState('dashing_skill');
  caster.dashStartX = caster.x;
  caster.dashStartY = caster.y;
  caster.dashTargetX = dashDestX;
  caster.dashTargetY = dashDestY;
  caster.dashDuration = 0.14;
  caster.dashTimer = 0;
  caster.dashSkillType = 'gale_dash';

  // Wind dash visual
  EffectLib.addDashEffect(effectSystem, caster.x, caster.y, caster.charData.color, 25);
  if (soundSystem) soundSystem.playSkillSound();
}
