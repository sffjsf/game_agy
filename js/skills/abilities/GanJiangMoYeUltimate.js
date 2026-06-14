import { createProjectile } from '../../combat/Projectile.js';
import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

export function executeGanJiangMoYeUltimate(caster, skill, weaponSystem, effectSystem) {
  const opposingTeam = caster.battleContext && caster.battleContext.opposingTeam
    ? caster.battleContext.opposingTeam.filter(enemy => enemy.isAlive() && !(enemy.invisibleTimer > 0))
    : [];

  if (opposingTeam.length === 0 || !weaponSystem) return;

  caster.ultInvincibilityTimer = Math.max(caster.ultInvincibilityTimer || 0, skill.duration || 1.2);
  const count = 10;
  const speed = 820;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const spawnX = caster.x + Math.cos(angle) * (caster.charData.size + 12);
    const spawnY = caster.y + Math.sin(angle) * (caster.charData.size + 12);
    const target = opposingTeam[Math.floor(Math.random() * opposingTeam.length)];
    const isGanJiang = i % 2 === 0;
    const proj = createProjectile(
      spawnX,
      spawnY,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      skill.damage || 1,
      caster.team,
      isGanJiang ? '#F44336' : '#2196F3',
      18,
      'ganjiang_moye_sword'
    );

    proj.attacker = caster;
    proj.opposingTeam = caster.battleContext.opposingTeam;
    proj.preferredTarget = target;
    proj.swordName = isGanJiang ? 'ganjiang' : 'moye';
    proj.curveSign = isGanJiang ? 1 : -1;
    proj.batchId = `gm_ult_${Date.now()}_${i}`;
    proj.basicSword = false;
    proj.ultimateSword = true;
    proj.markOnHit = true;
    proj.piercing = true;
    proj.giantScale = 2.8;
    proj.lifetime = 3.0;
    proj.arenaBounds = {
      x: caster.battleContext.arenaX,
      y: caster.battleContext.arenaY,
      width: caster.battleContext.arenaWidth,
      height: caster.battleContext.arenaHeight
    };
    weaponSystem.projectiles.push(proj);
  }

  EffectLib.addAoeMeleeEffect(effectSystem, caster.x, caster.y, '#E040FB', 210);
  effectSystem.addDamageNumber(caster.x, caster.y - caster.charData.size - 30, '十剑交锋!', false, '#E040FB');
  effectSystem.screenShake(8);
  if (soundSystem) soundSystem.playSkillSound();
}
