import { executeAoeMelee } from './abilities/AoeMelee.js';
import { executeMultiShot } from './abilities/MultiShot.js';
import { executeMeteor } from './abilities/Meteor.js';
import { executeBombToss } from './abilities/BombToss.js';
import { executePoisonCloud } from './abilities/PoisonCloud.js';
import { executePierce } from './abilities/Pierce.js';
import { executeFrostNova } from './abilities/FrostNova.js';
import { executeInfernoDetonation } from './abilities/InfernoDetonation.js';
import { executeDash } from './abilities/Dash.js';
import { executeClone } from './abilities/Clone.js';
import { executeStun } from './abilities/Stun.js';
import { executeBackstab } from './abilities/Backstab.js';
import { executeSlow } from './abilities/Slow.js';
import { executeSeriousPunch } from './abilities/SeriousPunch.js';
import { executeSummonHound } from './abilities/SummonHound.js';
import { executeSummonBats } from './abilities/SummonBats.js';
import { executeTrainStampede } from './abilities/TrainStampede.js';
import { executeSummonLegion } from './abilities/SummonLegion.js';
import { executeHavocInHeaven } from './abilities/HavocInHeaven.js';
import { executeWhirlwind, executeWhirlwindTick, executeWhirlwindDamage } from './abilities/Whirlwind.js';
import { executeGroundSlam } from './abilities/GroundSlam.js';
import { executeGravityWell } from './abilities/GravityWell.js';
import { executeBlazingStampede } from './abilities/BlazingStampede.js';
import { executeGaleDash } from './abilities/GaleDash.js';
import { executeChainPull } from './abilities/ChainPull.js';
import { executeSmokeBomb } from './abilities/SmokeBomb.js';
import { executeMorningStarJudgment } from './abilities/MorningStarJudgment.js';
import { executeChainLightning } from './abilities/ChainLightning.js';
import { safeFinite } from '../utils.js';

/**
 * Skill executor registry — maps skill.type → handler function.
 * Adding a new skill type only requires:
 *   1. Create the ability file
 *   2. Add one entry to this map
 * No switch statement to maintain.
 */
const skillExecutors = {
  aoe_melee:          executeAoeMelee,
  multi_shot:         executeMultiShot,
  meteor:             executeMeteor,
  bomb_toss:          executeBombToss,
  poison_cloud:       executePoisonCloud,
  pierce:             executePierce,
  frost_nova:         executeFrostNova,
  inferno_detonation: executeInfernoDetonation,
  dash:               executeDash,
  clone:              executeClone,
  stun:               executeStun,
  backstab:           executeBackstab,
  slow:               executeSlow,
  serious_punch:      executeSeriousPunch,
  summon_hound:       executeSummonHound,
  summon_bats:        executeSummonBats,
  train_stampede:     executeTrainStampede,
  summon_legion:      executeSummonLegion,
  havoc_in_heaven:    executeHavocInHeaven,
  whirlwind:          executeWhirlwind,
  ground_slam:        executeGroundSlam,
  gravity_well:       executeGravityWell,
  blazing_stampede:   executeBlazingStampede,
  gale_dash:          executeGaleDash,
  chain_pull:         executeChainPull,
  smoke_bomb:         executeSmokeBomb,
  morning_star_judgment: executeMorningStarJudgment,
  chain_lightning:    executeChainLightning,
};

/**
 * Channeling handlers — for skills that persist over time.
 * Each entry has:
 *   tick(caster, skill, effectSystem, dt)   — called every frame
 *   damage(caster, skill, effectSystem)      — called every damage interval
 */
const channelHandlers = {
  whirlwind: {
    tick:   executeWhirlwindTick,
    damage: executeWhirlwindDamage,
  },
};

export function isChannelingSkill(skillType) {
  return !!channelHandlers[skillType];
}

export function executeChannelTick(caster, skill, effectSystem, dt) {
  const h = channelHandlers[skill.type];
  if (h && h.tick) h.tick(caster, skill, effectSystem, dt);
}

export function executeChannelDamage(caster, skill, effectSystem) {
  const h = channelHandlers[skill.type];
  if (h && h.damage) h.damage(caster, skill, effectSystem);
}

export function executeSkillStrategy(caster, skill, weaponSystem, effectSystem) {
    if (!caster.target) return;

    // Safe raw offsets (not normalised — abilities may use dx/dist patterns)
    const dx = safeFinite(caster.target.x - caster.x, 0);
    const dy = safeFinite(caster.target.y - caster.y, 0);
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const executor = skillExecutors[skill.type];
    if (executor) {
      executor(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
    }
}
