/**
 * utils.js - Shared math & safety helpers
 *
 * Centralises NaN / Infinity guards so the rest of the codebase
 * can stay focused on game logic instead of defensive checks.
 */

/**
 * Return `value` if it is a finite number, otherwise `fallback`.
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
export function safeFinite(value, fallback = 0) {
  return (typeof value === 'number' && isFinite(value)) ? value : fallback;
}

/**
 * Clamp a value between min and max (inclusive).
 * Also guards against NaN → returns min.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  if (typeof value !== 'number' || !isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Normalise a (dx, dy) vector.  Returns {dx, dy, dist}.
 * If the vector is degenerate (zero-length or non-finite), returns a
 * safe fallback direction (1, 0) and dist = 1.
 *
 * @param {number} dx
 * @param {number} dy
 * @param {{dx:number, dy:number}} [fallbackDir] - default {dx:1, dy:0}
 * @returns {{dx: number, dy: number, dist: number}}
 */
export function safeDirection(dx, dy, fallbackDir) {
  dx = safeFinite(dx, 0);
  dy = safeFinite(dy, 0);
  let dist = Math.sqrt(dx * dx + dy * dy);
  if (!isFinite(dist) || dist < 1) {
    const fb = fallbackDir || { dx: 1, dy: 0 };
    return { dx: fb.dx, dy: fb.dy, dist: 1 };
  }
  return { dx: dx / dist, dy: dy / dist, dist };
}

/**
 * Clamp a position object {x, y} inside an arena rectangle.
 * Missing / NaN coords are reset to the arena centre.
 *
 * @param {{x: number, y: number}} pos - mutated in place
 * @param {number} arenaX
 * @param {number} arenaY
 * @param {number} arenaWidth
 * @param {number} arenaHeight
 * @param {number} [margin=30] - pixels from edge
 */
export function clampPosition(pos, arenaX, arenaY, arenaWidth, arenaHeight, margin) {
  margin = margin || 30;
  const cx = arenaX + arenaWidth / 2;
  const cy = arenaY + arenaHeight / 2;
  pos.x = clamp(pos.x, arenaX + margin, arenaX + arenaWidth - margin);
  pos.y = clamp(pos.y, arenaY + margin, arenaY + arenaHeight - margin);
  // If we ended up with the fallback (min), it was NaN; reset to centre
  if (pos.x === arenaX + margin && (typeof pos.x !== 'number' || !isFinite(pos.x))) pos.x = cx;
  if (pos.y === arenaY + margin && (typeof pos.y !== 'number' || !isFinite(pos.y))) pos.y = cy;
  // Ensure final values are finite
  if (!isFinite(pos.x)) pos.x = cx;
  if (!isFinite(pos.y)) pos.y = cy;
}

/**
 * Normalise an angle to [-PI, PI].
 * @param {number} angle
 * @returns {number}
 */
export function normaliseAngle(angle) {
  if (!isFinite(angle)) return 0;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}
