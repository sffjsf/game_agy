import * as EffectLib from '../../effects_lib/index.js';

export function getArenaBoundaryIntersection(startX, startY, dirX, dirY, arenaX, arenaY, arenaWidth, arenaHeight) {
  const minX = arenaX + 30;
  const maxX = arenaX + arenaWidth - 30;
  const minY = arenaY + 30;
  const maxY = arenaY + arenaHeight - 30;

  // Clamp starting position to the valid bounds to prevent precision issues causing negative values
  const clampedStartX = Math.max(minX, Math.min(maxX, startX));
  const clampedStartY = Math.max(minY, Math.min(maxY, startY));

  let tX = Infinity;
  if (dirX > 0) tX = (maxX - clampedStartX) / dirX;
  else if (dirX < 0) tX = (minX - clampedStartX) / dirX;

  let tY = Infinity;
  if (dirY > 0) tY = (maxY - clampedStartY) / dirY;
  else if (dirY < 0) tY = (minY - clampedStartY) / dirY;

  let t = Math.min(tX, tY);
  if (!isFinite(t) || t < 0) t = 0;

  // If the dash distance is too short (less than 100px), we are touching or near the boundary 
  // and trying to dash into it. Invert the direction to dash across the arena instead.
  if (t < 100) {
    const invDirX = -dirX;
    const invDirY = -dirY;

    let invTX = Infinity;
    if (invDirX > 0) invTX = (maxX - clampedStartX) / invDirX;
    else if (invDirX < 0) invTX = (minX - clampedStartX) / invDirX;

    let invTY = Infinity;
    if (invDirY > 0) invTY = (maxY - clampedStartY) / invDirY;
    else if (invDirY < 0) invTY = (minY - clampedStartY) / invDirY;

    let invT = Math.min(invTX, invTY);
    if (isFinite(invT) && invT > t) {
      t = invT;
      dirX = invDirX;
      dirY = invDirY;
    }
  }

  return {
    x: clampedStartX + dirX * t,
    y: clampedStartY + dirY * t
  };
}

export function executeBlazingStampede(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  // Consecutively charge 3 times
  caster.seraphChargeCount = 3;

  // Initial direction vector towards target
  let dirX = dx / dist;
  let dirY = dy / dist;

  // Fallback to face direction if no direction exists
  if (isNaN(dirX) || isNaN(dirY) || (dirX === 0 && dirY === 0)) {
    dirX = Math.cos(caster.angle) || 1;
    dirY = Math.sin(caster.angle) || 0;
  }

  const ctx = caster.battleContext;
  const intersection = getArenaBoundaryIntersection(
    caster.x, caster.y, dirX, dirY,
    ctx.arenaX, ctx.arenaY, ctx.arenaWidth, ctx.arenaHeight
  );

  // Set up dashing skill
  caster.setState('dashing_skill');
  caster.dashStartX = caster.x;
  caster.dashStartY = caster.y;
  caster.dashTargetX = intersection.x;
  caster.dashTargetY = intersection.y;
  caster.dashDuration = 0.22; // Very fast, punchy dash
  caster.dashTimer = 0;
  caster.dashSkillType = 'blazing_stampede';

  EffectLib.addDashEffect(effectSystem, caster.x, caster.y, caster.charData.color, 25);
  effectSystem.screenShake(4);
}
