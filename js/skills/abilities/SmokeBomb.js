import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

export function executeSmokeBomb(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
  if (!caster.target || !caster.target.isAlive()) return;

  const target = caster.target;
  const side = Math.random() < 0.5 ? 1 : -1;
  const behindX = target.x - Math.cos(target.angle) * 45;
  const behindY = target.y - Math.sin(target.angle) * 45;
  const sideX = -Math.sin(target.angle) * 35 * side;
  const sideY = Math.cos(target.angle) * 35 * side;

  const ctx = caster.battleContext;
  let nextX = behindX + sideX;
  let nextY = behindY + sideY;
  if (ctx) {
    nextX = Math.max(ctx.arenaX + 30, Math.min(ctx.arenaX + ctx.arenaWidth - 30, nextX));
    nextY = Math.max(ctx.arenaY + 30, Math.min(ctx.arenaY + ctx.arenaHeight - 30, nextY));
  }

  // Smoke burst: every enemy caught in the cloud takes a backstab strike.
  const smokeX = target.x;
  const smokeY = target.y;
  const smokeRadius = skill.smokeRadius || 120;
  const backstabDamage = caster.charData.attackPower * 1.45;
  const opposingTeam = caster.battleContext ? caster.battleContext.opposingTeam : null;
  if (opposingTeam) {
    opposingTeam.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const ex = enemy.x - smokeX;
      const ey = enemy.y - smokeY;
      const edist = Math.sqrt(ex * ex + ey * ey);
      if (edist <= smokeRadius) {
        enemy.takeDamage(backstabDamage, caster.x, caster.y, effectSystem);
        enemy.applySlow(1.2, 0.65);
        enemy.applyStun(0.8);
        effectSystem.addDamageNumber(enemy.x, enemy.y - enemy.charData.size - 12, '背刺!', false, '#B39DDB');
      }
    });
  }

  EffectLib.addPoisonCloudEffect(effectSystem, smokeX, smokeY, '#7E57C2', smokeRadius);
  caster.x = nextX;
  caster.y = nextY;
  caster.smokeDodgeTimer = skill.duration || 2.0;

  EffectLib.addCloneEffect(effectSystem, caster.x, caster.y, '#B39DDB', 35);
  effectSystem.addDamageNumber(caster.x, caster.y - caster.charData.size, '烟雾!', false, '#B39DDB');

  // Immediately follow up from the smoke with a basic attack.
  // Otherwise the normal post-skill reposition flow can waste the smoke-step window.
  caster.attackTimer = 0;
  if (target.isAlive()) {
    caster.setState('charge');
  }

  if (soundSystem) soundSystem.playSkillSound();
}
