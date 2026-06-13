import { BattleContext } from '../BattleContext.js';

export function createBattleContexts(combatManager) {
  const shared = {
    weaponSystem: combatManager.weaponSystem,
    effectSystem: combatManager.effectSystem,
    arenaWidth: combatManager.arenaWidth,
    arenaHeight: combatManager.arenaHeight,
    arenaX: combatManager.arenaX,
    arenaY: combatManager.arenaY,
    temporalFields: combatManager.temporalFields,
    swordArrays: combatManager.swordArrays,
    frostLands: combatManager.frostLands,
    battleCallbacks: {
      addPoisonZone: (...args) => combatManager.addPoisonZone(...args),
      applyAreaDamage: (x, y, ownerTeam, damage, radius, attacker) => combatManager.applyAreaDamage(x, y, ownerTeam, damage, radius, attacker),
      addGravityWell: (...args) => combatManager.addGravityWell(...args),
      addBurnZone: (...args) => combatManager.addBurnZone(...args),
      addTemporalField: (...args) => combatManager.addTemporalField(...args),
      addSwordArray: (...args) => combatManager.addSwordArray(...args),
      addFrostLand: (...args) => combatManager.addFrostLand(...args),
    },
  };

  return {
    left: new BattleContext({ ...shared, opposingTeam: combatManager.fightersRight, ownTeam: combatManager.fightersLeft }),
    right: new BattleContext({ ...shared, opposingTeam: combatManager.fightersLeft, ownTeam: combatManager.fightersRight }),
  };
}
