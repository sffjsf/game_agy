# System Architecture & Layer Dependencies

This document details the system layers, module relations, and decoupling strategies of the 2D Auto-Battle Arena project.

---

## 1. Architectural Layers Overview

The codebase is organized into 6 strict layers to maintain clean decoupling, enabling fast UI refactoring and headless battle simulations:

```mermaid
graph TD
    %% Define Layers
    subgraph UI_Layer ["1. UI & View Layer"]
        HTML["index.html"]
        CSS["style.css"]
        UI["ui.js: UIManager"]
    end

    subgraph Loop_Layer ["2. Control & Loop Layer"]
        MAIN["main.js: Entry Point"]
        COMBAT["combat.js: CombatManager"]
    end

    subgraph Entity_Layer ["3. Entity & AI Layer"]
        FIGHTER["fighter.js: Fighter Entity"]
        AI["FighterAI.js: Pathfinding/Kiting"]
        BUFF["BuffManager.js: DoT & Stun Timers"]
        CTX["BattleContext.js: Environment Info"]
    end

    subgraph Action_Layer ["4. Action & Subsystems"]
        ATTACK["AttackHandler.js: Action Dispatcher"]
        WEAPON["weapon.js: WeaponSystem"]
        PROJ_BASE["Projectile.js: BaseProjectile"]
        PROJ_SUB["projectiles/*: Projectile Subclasses"]
        SKILLS["SkillRegistry.js: Registry"]
        ABILITIES["abilities/*: Active Skill Payload"]
        PASSIVES["Passives.js: Lifecycle Hooks"]
    end

    subgraph Render_Audio_Layer ["5. Rendering & Audio Layer"]
        RENDER["FighterRenderer.js: Static Renderer"]
        EFFECTS["effects.js: EffectSystem"]
        EFFECTS_LIB["effects_lib/*: Visual Assets"]
        AUDIO["audio.js: SoundSystem"]
    end

    subgraph Data_Layer ["6. Static Data Layer"]
        CHAR_REG["characters/index.js: Register"]
        CHAR_DATA["characters/*: Hero Configs"]
    end

    %% Dependency & Control flows
    HTML -->|Mounts Canvas & UI controls| MAIN
    CSS -->|Styles controls/animations| HTML
    MAIN -->|1. Drives Frame updates| COMBAT
    MAIN -->|2. Updates selection HUD| UI

    COMBAT -->|Ticks active instances| FIGHTER
    COMBAT -->|Updates projectiles| WEAPON
    COMBAT -->|Ticks AoE DOT hazard fields| COMBAT
    COMBAT -->|Draws background & HUD| COMBAT

    FIGHTER -->|1. Pathfinding decisions| AI
    FIGHTER -->|2. Ticks debuffs/stuns| BUFF
    FIGHTER -->|3. Delegating attack payload| ATTACK
    FIGHTER -->|4. Passed to static drawing| RENDER

    CTX -.->|Read-only env variables| FIGHTER
    CTX -.->|Read-only env variables| AI

    ATTACK -->|Normal Attack Sweep / Bullet| WEAPON
    ATTACK -->|Ultimate Cast| SKILLS

    SKILLS -->|Route active skill| ABILITIES
    ABILITIES -->|1. Spawn visuals| EFFECTS
    ABILITIES -->|2. Direct HP deduction| FIGHTER
    ABILITIES -->|3. Spawn custom bullets| WEAPON

    WEAPON -->|Manages BaseProjectile list| PROJ_BASE
    PROJ_BASE -->|Subclass overrides| PROJ_SUB

    RENDER -->|1. Reads decorations draw function| CHAR_DATA
    RENDER -->|2. Draws debuff icons| BUFF

    EFFECTS -->|Calls custom particle shapes| EFFECTS_LIB
    ATTACK -.->|Fires synth oscillators| AUDIO
    ABILITIES -.->|Fires synth oscillators| AUDIO

    CHAR_REG -->|Collects character profiles| CHAR_DATA
    FIGHTER -->|Copies initial attributes| CHAR_REG
```

---

## 2. Decoupling & Isolation Principles

### 2.1 Logic-to-Render Separation
- **`fighter.js`** is a pure mathematical simulator. It stores coordinates (`x`, `y`), attributes (`hp`, `shield`, `speed`), status timers, and the state name. It does **not** perform any canvas rendering.
- **`FighterRenderer.js`** is a static helper class. It takes a canvas context (`ctx`) and a `Fighter` instance, reads the fighter's coordinates and rotation angle, and paints it on the canvas. 

### 2.2 Entity-to-Manager Isolation via `BattleContext`
Fighter entities need to know about the environment (e.g., arena boundaries, where the nearest enemies are, how to apply AoE damage) but shouldn't reference `CombatManager` directly (which would create a circular dependency).
- The **`BattleContext`** class acts as an environmental facade. It encapsulates:
  - Arena bounds (`arenaX`, `arenaY`, `arenaWidth`, `arenaHeight`)
  - Opposing team array (`opposingTeam`)
  - Friendly team array (`friendlyTeam`)
  - Callback functions for adding projectiles, spawning screen shake, or creating poison AoE pools.
- When `CombatManager` calls `Fighter.update(dt, context)`, it feeds this transient context. The fighter reads what it needs and drops the reference at the end of the frame.

### 2.3 Audio Independence
- The `SoundSystem` (`audio.js`) runs a client-side `AudioContext`. If audio is blocked by user browser permissions, it silently falls back, enabling the game's update loop to function seamlessly.
