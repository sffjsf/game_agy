import * as EffectLib from '../../effects_lib/index.js';
import { soundSystem } from '../../audio.js';

/**
 * Bounces a lightning bolt between multiple enemies in proximity.
 * Dealt damage decays with each jump. Targets are slowed.
 */
export function executeChainLightning(caster, skill, weaponSystem, effectSystem, dx, dy, dist) {
    if (!caster.target || !caster.target.isAlive()) return;

    const opposingTeam = caster.battleContext && caster.battleContext.opposingTeam
        ? caster.battleContext.opposingTeam.filter(enemy => enemy.isAlive())
        : [];

    if (opposingTeam.length === 0) return;

    // 1. Calculate chain sequence of targets
    const hitTargets = [];
    let currentTarget = caster.target;
    hitTargets.push(currentTarget);

    const maxBounces = 2; // Total 3 targets hit (Initial + 2 bounces)
    const bounceRange = 220;

    for (let b = 0; b < maxBounces; b++) {
        let nextTarget = null;
        let minDistance = bounceRange;

        for (let i = 0; i < opposingTeam.length; i++) {
            const enemy = opposingTeam[i];
            if (hitTargets.includes(enemy)) continue;

            const ex = enemy.x - currentTarget.x;
            const ey = enemy.y - currentTarget.y;
            const d = Math.sqrt(ex * ex + ey * ey);

            if (d < minDistance) {
                minDistance = d;
                nextTarget = enemy;
            }
        }

        if (nextTarget) {
            hitTargets.push(nextTarget);
            currentTarget = nextTarget;
        } else {
            break; // No other targets close enough
        }
    }

    // 2. Play sounds and screen shake
    if (soundSystem) soundSystem.playSkillSound();
    effectSystem.screenShake(4);

    // 3. Draw chain visual segments (from caster to T0, T0 to T1, T1 to T2)
    const lightningColor = caster.charData.color || '#00BFFF';
    
    // Shoot from caster to first target
    spawnLightningBetween(effectSystem, caster.x, caster.y, hitTargets[0].x, hitTargets[0].y, lightningColor);
    
    // Shoot between consecutive bounced targets
    for (let i = 0; i < hitTargets.length - 1; i++) {
        spawnLightningBetween(effectSystem, hitTargets[i].x, hitTargets[i].y, hitTargets[i+1].x, hitTargets[i+1].y, lightningColor);
    }

    // 4. Apply damage and slow debuffs
    let damageDecay = 1.0;
    hitTargets.forEach((target, index) => {
        const dmg = skill.damage * damageDecay;
        damageDecay *= 0.8; // 20% decay per hop

        target.takeDamage(dmg, caster.x, caster.y, effectSystem);
        target.applySlow(skill.duration || 1.5);
        
        // Slow effect particles and number overlay
        EffectLib.addSlowEffect(effectSystem, target.x, target.y, '#42A5F5', 30);
        effectSystem.addDamageNumber(target.x, target.y - target.charData.size, '减速!', false, '#42A5F5');
        effectSystem.addHitEffect(target.x, target.y, lightningColor);
    });
}

/**
 * Spawns a zig-zagging line of spark and circle particles between two coordinates.
 */
function spawnLightningBetween(effectSystem, ax, ay, bx, by, color) {
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Segment count depends on distance
    const steps = Math.max(4, Math.floor(dist / 35));
    let lastX = ax;
    let lastY = ay;

    for (let s = 1; s <= steps; s++) {
        const pct = s / steps;
        let px = ax + dx * pct;
        let py = ay + dy * pct;

        // Apply perpendicular displacement (jitter) on inner nodes
        if (s < steps) {
            const nx = -dy / dist;
            const ny = dx / dist;
            // Introduce a zig-zag jitter displacement
            const jitter = (Math.random() - 0.5) * 22;
            px += nx * jitter;
            py += ny * jitter;
        }

        // Draw sub-segment by generating particles
        const subSteps = 3;
        for (let k = 0; k < subSteps; k++) {
            const subPct = k / subSteps;
            const x = lastX + (px - lastX) * subPct;
            const y = lastY + (py - lastY) * subPct;

            // White core circle particle
            effectSystem.addParticle({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 0.12 + Math.random() * 0.1,
                maxLife: 0.22,
                color: '#FFFFFF',
                size: 2.0 + Math.random() * 1.5,
                gravity: 0,
                friction: 0.9,
                type: 'circle'
            });

            // Lightning color spark particle
            effectSystem.addParticle({
                x: x + (Math.random() - 0.5) * 5,
                y: y + (Math.random() - 0.5) * 5,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60,
                life: 0.18 + Math.random() * 0.12,
                maxLife: 0.32,
                color: color,
                size: 1.5 + Math.random() * 2.0,
                gravity: 0,
                friction: 0.88,
                type: 'spark'
            });
        }

        lastX = px;
        lastY = py;
    }
}
