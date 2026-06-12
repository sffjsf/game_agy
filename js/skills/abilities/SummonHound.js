import * as EffectLib from '../../effects_lib/index.js';
import { Fighter } from '../../fighter.js';
import { soundSystem } from '../../audio.js';

export function executeSummonHound(caster, skill, weaponSystem, effectSystem) {
  // Hound summons next to caster
  var spawnX = caster.x + (Math.random() - 0.5) * 60;
  var spawnY = caster.y + (Math.random() - 0.5) * 60;
  
  var hound = new Fighter('xiaotian_hound', spawnX, spawnY, caster.team);
  // Hound scales with caster's stats somewhat, or just flat base stats
  hound.charData.attackPower += caster.charData.attackPower * 0.3; // Gains 30% of Erlang's attack

  if (caster._ownTeam) {
    caster._ownTeam.push(hound);
  }
  
  // Stun effect as a summon poof
  EffectLib.addStunEffect(effectSystem, spawnX, spawnY, '#424242', 40);
  soundSystem.playSummonSound();
}
