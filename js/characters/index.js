import { swordsman } from './Swordsman.js';
import { archer } from './Archer.js';
import { mage } from './Mage.js';
import { vampire } from './Vampire.js';
import { ninja } from './Ninja.js';
import { knight } from './Knight.js';
import { assassin } from './Assassin.js';
import { minion } from './Minion.js';
import { one_punch_man } from './OnePunchMan.js';
import { blood_demon } from './BloodDemon.js';
import { train_conductor } from './TrainConductor.js';
import { super_summoner } from './SuperSummoner.js';
import { bomber } from './Bomber.js';
import { poisoner } from './Poisoner.js';
import { spearman } from './Spearman.js';
import { frost_apprentice } from './FrostApprentice.js';
import { berserker } from './Berserker.js';
import { vulcan } from './Vulcan.js';
import { summoned_golem } from './SummonedGolem.js';
import { erlang_shen } from './ErlangShen.js';
import { xiaotian_hound } from './XiaotianHound.js';
import { monkey_king } from './MonkeyKing.js';
import { stone_golem } from './StoneGolem.js';
import { mecha_pioneer } from './MechaPioneer.js';
import { seraph } from './Seraph.js';
import { bounty_hunter } from './BountyHunter.js';
import { wind_dancer } from './WindDancer.js';
import { shield_lancer } from './ShieldLancer.js';
import { ronin } from './Ronin.js';
import { chain_fighter } from './ChainFighter.js';
import { brawler } from './Brawler.js';
import { rogue } from './Rogue.js';
import { dawn_goddess } from './DawnGoddess.js';
import { guard } from './Guard.js';
import { crossbowman } from './Crossbowman.js';
import { herbalist } from './Herbalist.js';
import { scout } from './Scout.js';
import { thunder_scholar } from './ThunderScholar.js';
import { alchemist } from './Alchemist.js';
import { blade_master } from './BladeMaster.js';
import { shadow_clone } from './ShadowClone.js';

/**
 * Required fields every character data object must have.
 * `null` means "must exist but any type is fine".
 */
const REQUIRED_FIELDS = {
  id:              'string',
  name:            'string',
  nameCN:          'string',
  color:           'string',
  secondaryColor:  'string',
  glowColor:       'string',
  size:            'number',
  speed:           'number',
  hp:              'number',
  attackPower:     'number',
  attackSpeed:     'number',
  chargeTime:      'number',
  attackRange:     'number',
  lifesteal:       'number',
  movePattern:     'string',
  aiTendency:      'string',
  weaponType:      'string',
  projectileType:  null,     // nullable
  skill:           'object',
  drawDecorations: 'function',
};

const SKILL_FIELDS = {
  name:     'string',
  cooldown: 'number',
  damage:   'number',
  range:    'number',
  type:     'string',
  duration: 'number',
};

/**
 * Validate a single character data object at import time.
 * Logs warnings to the console for dev; does not throw in production.
 * @param {object} char - Character data object
 * @returns {string[]} List of missing/invalid field names (empty = valid)
 */
export function validateCharacterData(char) {
  const issues = [];

  if (!char || typeof char !== 'object') {
    console.error('[CharacterData] Not an object:', char);
    return ['root'];
  }

  for (const [field, expected] of Object.entries(REQUIRED_FIELDS)) {
    const value = char[field];
    if (value === undefined || value === null) {
      if (expected !== null) {
        issues.push(field);
      }
      continue;
    }
    if (expected && typeof value !== expected) {
      issues.push(`${field}(expected ${expected}, got ${typeof value})`);
    }
  }

  // Validate skill sub-object
  const skill = char.skill;
  if (skill && typeof skill === 'object') {
    for (const [sf, st] of Object.entries(SKILL_FIELDS)) {
      if (typeof skill[sf] !== st) {
        issues.push(`skill.${sf}(expected ${st}, got ${typeof skill[sf]})`);
      }
    }
  }

  if (issues.length > 0) {
    console.warn(
      `[CharacterData] ${char.id || '???'} has ${issues.length} issue(s):`,
      issues.join(', ')
    );
  }

  return issues;
}

export const characterData = {
  swordsman,
  archer,
  mage,
  vampire,
  ninja,
  knight,
  assassin,
  minion,
  one_punch_man,
  blood_demon,
  train_conductor,
  super_summoner,
  bomber,
  poisoner,
  spearman,
  frost_apprentice,
  guard,
  crossbowman,
  herbalist,
  scout,
  berserker,
  vulcan,
  summoned_golem,
  erlang_shen,
  xiaotian_hound,
  monkey_king,
  stone_golem,
  mecha_pioneer,
  seraph,
  bounty_hunter,
  wind_dancer,
  shield_lancer,
  ronin,
  chain_fighter,
  brawler,
  rogue,
  dawn_goddess,
  thunder_scholar,
  alchemist,
  blade_master,
  shadow_clone
};

// ── Validate all characters on import (dev-only safety net) ──
if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
  Object.values(characterData).forEach(validateCharacterData);
}
