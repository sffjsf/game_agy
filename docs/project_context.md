# Project Context: 2D Auto-Battle Arena

This document serves as the high-level context, design goals, and directory structure index for AI coding assistants (e.g., Claude Code, Cursor, Windsurf, Cline). Use it to gain a quick semantic understanding of the codebase's purpose and philosophy before implementing code modifications.

---

## 1. Project Vision & Philosophy

The **2D Auto-Battle Arena** is a sandbox simulation game built using vanilla HTML5, Canvas 2D, and native JavaScript. It simulates automatic battles between two teams composed of various hero classes. 

### Core Design Philosophy
- **Zero-Dependency & Zero-Build**: Built completely using ES Modules (ESM) and standard browser APIs. There is no bundler (Webpack/Vite), no transpiler (Babel for production), and no framework (React/PixiJS). Just static JS, HTML, and CSS.
- **Data-Driven Entities**: All characters, passive mechanics, active skills, and projectiles are loaded from character static configs and registered dynamically. The core `Fighter` class contains no hardcoded hero logic.
- **Web Audio Wave Synthesis**: Zero external audio file dependency. Synthesizes hit, shoot, heal, and explosion sounds in real time using CPU-based Web Audio oscillators (`AudioContext`).
- **Strict Decoupling**: Separation of concerns between:
  - Data Configs (`js/characters/`)
  - AI Decision Trees (`js/FighterAI.js`)
  - Physics/State Loop (`js/combat.js`, `js/fighter.js`)
  - Rendering (`js/FighterRenderer.js`, `js/effects.js`)
  - Sound Effects (`js/audio.js`)

---

## 2. Directory Structure

```text
game_agy/
├── index.html                   # HTML Entry point & screen layouts
├── style.css                    # Main UI stylesheet (Glassmorphism layout)
├── js/
│   ├── main.js                  # App bootstrap, RAF loop scheduler
│   ├── combat.js                # CombatManager: physics, timeline, collision solver
│   ├── fighter.js               # Fighter: behavior state machine (11 states)
│   ├── FighterAI.js             # FighterAI: target search, pathfinding & kiting
│   ├── FighterRenderer.js       # FighterRenderer: static character drawing utility
│   ├── BattleContext.js         # BattleContext: environment reader for Fighters
│   ├── ui.js                    # UIManager: select screens, health bars, codex
│   ├── audio.js                 # SoundSystem: oscillator-based synthesizer
│   ├── effects.js               # EffectSystem: particle pool, text pops, screen shake
│   ├── utils.js                 # Helper library (safe math, normalisation)
│   ├── weapon.js                # WeaponSystem: projectile updating & sweep checks
│   │
│   ├── characters/              # Static hero configuration configs
│   │   ├── index.js             # Character registration hub
│   │   ├── Berserker.js         # Berserker (Blood Rage passive)
│   │   ├── Assassin.js          # Assassin (Backstab active)
│   │   ├── Swordsman.js         # Swordsman (Sweep attack)
│   │   └── ...                  # 22 heroes in total
│   │
│   ├── skills/
│   │   ├── SkillRegistry.js     # Action dispatcher registry
│   │   └── abilities/           # Unique active skill payloads
│   │       ├── Whirlwind.js     # Channeled whirlwind spin damage
│   │       ├── Backstab.js      # Teleport-and-damage payload
│   │       └── ...              # 20+ skill scripts
│   │
│   └── projectiles/             # Unique projectile trajectory handlers
│       ├── Projectile.js        # BaseProjectile base class
│       └── projectiles_lib/     # Subclasses (laser, fireball, hook, etc.)
└── tests/                       # Integrated test suites (Puppeteer, JSDOM)
```

---

## 3. High-Value Documentation Matrix

For specialized details, AI tools should consult these files:
- **Architecture & Dependencies**: Refer to [docs/architecture.md](file:///Users/zzx/all/game_agy/docs/architecture.md)
- **API & Interface Specifications**: Refer to [docs/api.md](file:///Users/zzx/all/game_agy/docs/api.md)
- **Execution Lifecycle & State Machines**: Refer to [docs/workflow.md](file:///Users/zzx/all/game_agy/docs/workflow.md)
- **Coding Style & Conventions**: Refer to [docs/coding_rules.md](file:///Users/zzx/all/game_agy/docs/coding_rules.md)
