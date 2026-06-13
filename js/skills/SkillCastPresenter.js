import { soundSystem } from '../audio.js';

export class SkillCastPresenter {
  static startSkillCast(f, effectSystem, skill, displayName) {
    if (!skill) return;

    f.skillCooldown = skill.cooldown || 0;
    f.skillReady = false;

    if (soundSystem) soundSystem.playSkillSound();
    SkillCastPresenter.showSkillName(f, effectSystem, displayName || skill.name);
  }

  static showSkillName(f, effectSystem, skillName) {
    if (!effectSystem || !skillName) return;
    effectSystem.addSkillName(f.x, f.y - f.charData.size - 34, skillName, f.team);
  }
}
