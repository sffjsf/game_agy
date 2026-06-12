import { CombatManager } from './combat.js';
import { UIManager } from './ui.js';

/**
 * main.js - Game entry point
 * Wires CombatManager + UIManager, runs the game loop.
 */
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('battle-canvas');
  const combatManager = new CombatManager(canvas);
  const uiManager = new UIManager();

  /* ── Canvas sizing ────────────────────────────────────── */

  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    combatManager.updateDimensions();
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  /* ── Initialize character select ──────────────────────── */

  uiManager.initCharacterSelect();
  uiManager.showScreen('select');

  /* ── Event handlers ───────────────────────────────────── */

  uiManager.onStartBattle((leftIds, rightIds) => {
    uiManager.showScreen('battle');
    uiManager.hideCountdown();
    // Ensure canvas dimensions are up to date after screen switch
    requestAnimationFrame(() => {
      resizeCanvas();
      combatManager.startBattle(leftIds, rightIds);
    });
  });

  uiManager.onRematch(() => {
    const chars = uiManager.getSelectedCharacters();
    uiManager.showScreen('battle');
    uiManager.hideResult();
    uiManager.hideCountdown();
    requestAnimationFrame(() => {
      resizeCanvas();
      combatManager.startBattle(chars.left, chars.right);
    });
  });

  uiManager.onReselect(() => {
    uiManager.showScreen('select');
    uiManager.hideResult();
    uiManager.initCharacterSelect();
  });

  /* ── Wire CombatManager → UIManager via observer callbacks ── */

  combatManager.onCountdownTick = (info) => {
    if (info.type === 'number') {
      uiManager.showCountdown(info.count);
    } else if (info.type === 'fight') {
      uiManager.showCountdown('FIGHT!');
    } else if (info.type === 'end') {
      uiManager.hideCountdown();
    }
  };

  combatManager.onBattleEnd = (winner, battleTime) => {
    uiManager.showResult(winner, battleTime);
  };

  /* ── Speed control ────────────────────────────────────── */
  const speedSlider = document.getElementById('speed-slider');
  const speedDisplay = document.getElementById('speed-display');
  if (speedSlider && speedDisplay) {
    speedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      combatManager.speedMultiplier = val;
      speedDisplay.textContent = val.toFixed(1) + 'x';
    });
  }

  /* ── Game loop ────────────────────────────────────────── */

  let lastTime = 0;

  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap dt at 50ms
    lastTime = timestamp;

    // CombatManager handles countdown, speedMultiplier, finished delay internally.
    // UI notifications come via onCountdownTick / onBattleEnd callbacks.
    combatManager.update(dt);

    // Thin orchestration: refresh HUD during fighting, render every frame
    const state = combatManager.getState();
    if (state === 'fighting') {
      uiManager.updateHUD(combatManager.fightersLeft, combatManager.fightersRight);
    }
    if (state !== 'waiting') {
      combatManager.render();
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
