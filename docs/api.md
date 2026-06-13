# API & Interface Specification

This document details the core object fields, public method signatures, and parameter specifications used by internal systems.

---

## 1. Fighter Entity (`Fighter`)

Instances of `Fighter` represent the active fighters on the field.

### Key Instance Properties
- `id` (String): Unique identifier corresponding to the hero config (e.g. `'berserker'`).
- `team` (String): Either `'left'` or `'right'`.
- `x`, `y` (Float): Coordinates representing the center of the entity.
- `hp` (Float): Current health. Bounds checked to remain between `0` and `maxHp`.
- `alive` (Boolean): Flag denoting active state. `false` indicates death.
- `state` (String): One of 11 state strings (e.g., `'idle'`, `'chase'`, `'dead'`).
- `stateTimer` (Float): Time accumulated in the current state.
- `attackTimer` (Float): Countdown timer in seconds before the next normal attack is ready.
- `skillCooldown` (Float): Cooldown timer in seconds for ultimate skill.
- `shield` (Float): Temporary shield point barrier absorbing damage before health depletion.

### Public Methods
- `update(dt, context)`: Updates status timers, debuffs, AI pathfinding, and executes the state machine handler.
- `takeDamage(amount, attacker, reason)`: Reduces `hp` (and `shield` if applicable). Spawns floating damage text and hit sound/particles.
- `heal(amount)`: Restores `hp` up to `maxHp`. Spawns green healing floaters.
- `applyKnockback(forceX, forceY, duration = 0.15)`: Applies horizontal/vertical force vectors and transitions state to `'hit'` for duration.
- `setState(newState)`: Resets `stateTimer = 0`, sets `state = newState`.
- `canCastSkillNow()`: Returns `true` if `skillCooldown === 0`, alive, and target in range.

---

## 2. Environment Context (`BattleContext`)

The read-only wrapper passed into entities during updates.

### Properties
- `arenaX`, `arenaY`, `arenaWidth`, `arenaHeight` (Float): Dimension boundaries of the play arena.
- `opposingTeam` (Array<Fighter>): Array of living opponent fighter instances.
- `friendlyTeam` (Array<Fighter>): Array of living friendly fighter instances.
- `weaponSystem` (WeaponSystem): Reference to project/projectile manager.
- `effectSystem` (EffectSystem): Reference to screen shake, particle, and floating text manager.
- `addHazardField(field)`: Adds a damage-over-time (DoT) pool (e.g. Poisoner cloud).

---

## 3. Audio System (`SoundSystem`)

Uses standard `Web Audio API` oscillators to synthesize sound waveforms.

### Main Methods
- `playHit(strength = 1)`: Triggers high-to-low triangle wave sound.
- `playShoot()`: Triggers square wave frequency slide.
- `playExplode()`: Triggers lowpass-filtered white noise decay.
- `playHeal()`: Triggers low-to-high ascending wave tone.
- `playDeath()`: Triggers pitch-decaying saw wave.

---

## 4. Weapon System (`WeaponSystem`)

Manages projectiles and collision checks.

### Main Methods
- `addProjectile(proj)`: Places a `Projectile` subclass into the active collision queue.
- `update(dt, effectSystem)`: Updates positions of all flying projectiles, check bounds, and resolves impacts with enemies.
- `checkSweepDamage(attacker, range, angle, sectorAngle, damage)`: Calculates a sector area (cone) slice and inflicts damage to any enemy fighter overlapping the sector. Used for melee sweeps.
