/**
 * BattleContext - Bundles all per-frame battle state passed to fighters.
 *
 * Replaces the previous 10-parameter update() call with a single context object,
 * and eliminates transient mutable properties (_opposingTeam, _weaponSystem, etc.)
 * that were set on Fighter every frame.
 */
export class BattleContext {
  /**
   * @param {object} opts
   * @param {WeaponSystem} opts.weaponSystem
   * @param {EffectSystem} opts.effectSystem
   * @param {number} opts.arenaWidth
   * @param {number} opts.arenaHeight
   * @param {number} opts.arenaX
   * @param {number} opts.arenaY
   * @param {Fighter[]} opts.opposingTeam
   * @param {Fighter[]} opts.ownTeam
   * @param {object} [opts.battleCallbacks]
   */
  constructor({ weaponSystem, effectSystem, arenaWidth, arenaHeight, arenaX, arenaY, opposingTeam, ownTeam, battleCallbacks }) {
    this.weaponSystem = weaponSystem;
    this.effectSystem = effectSystem;

    // Arena bounds
    this.arenaWidth = arenaWidth || 800;
    this.arenaHeight = arenaHeight || 500;
    this.arenaX = arenaX || 0;
    this.arenaY = arenaY || 0;

    // Teams
    this.opposingTeam = opposingTeam || [];
    this.ownTeam = ownTeam || [];

    // Cross-cutting callbacks (poison zones, area damage, gravity wells, burn zones)
    this.addPoisonZone = (battleCallbacks && battleCallbacks.addPoisonZone) || null;
    this.applyAreaDamage = (battleCallbacks && battleCallbacks.applyAreaDamage) || null;
    this.addGravityWell = (battleCallbacks && battleCallbacks.addGravityWell) || null;
    this.addBurnZone = (battleCallbacks && battleCallbacks.addBurnZone) || null;
  }
}
