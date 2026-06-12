import { Fighter } from '../fighter.js';
import { createProjectile } from '../combat/Projectile.js';
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

export function executeSkillStrategy(caster, skill, weaponSystem, effectSystem) {
    if (!caster.target) return;
    var dx = caster.target.x - caster.x;
    var dy = caster.target.y - caster.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(dist) || dist < 1) {
      dx = 0;
      dy = 0;
      dist = 1;
    }
    
    switch (skill.type) {
      case 'aoe_melee':
        executeAoeMelee(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'multi_shot':
        executeMultiShot(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'meteor':
        executeMeteor(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'bomb_toss':
        executeBombToss(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'poison_cloud':
        executePoisonCloud(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'pierce':
        executePierce(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'frost_nova':
        executeFrostNova(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'inferno_detonation':
        executeInfernoDetonation(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'dash':
        executeDash(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'clone':
        executeClone(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'stun':
        executeStun(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'backstab':
        executeBackstab(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'slow':
        executeSlow(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'serious_punch':
        executeSeriousPunch(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'summon_hound':
        executeSummonHound(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'summon_bats':
        executeSummonBats(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'train_stampede':
        executeTrainStampede(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;
      case 'summon_legion':
        executeSummonLegion(caster, skill, weaponSystem, effectSystem, dx, dy, dist);
        break;

    }
}
