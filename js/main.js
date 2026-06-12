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

  /* ── Game loop ────────────────────────────────────────── */

  let lastTime = 0;
  let resultShown = false;
  let lastCountdownVal = -1;

  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap dt at 50ms
    lastTime = timestamp;

    const state = combatManager.getState();

    // ── Update phase ──
    if (state === 'countdown' || state === 'fighting') {
      combatManager.update(dt);
      resultShown = false;
    }

    // ── Countdown UI ──
    if (state === 'countdown') {
      const count = Math.ceil(combatManager.countdownTimer);
      if (count !== lastCountdownVal) {
        if (count > 0) {
          uiManager.showCountdown(count);
        } else {
          uiManager.showCountdown('FIGHT!');
          setTimeout(() => uiManager.hideCountdown(), 500);
        }
        lastCountdownVal = count;
      }
    } else {
      lastCountdownVal = -1;
    }

    // ── HUD update ──
    if (state === 'fighting') {
      uiManager.updateHUD(combatManager.fightersLeft, combatManager.fightersRight);
    }

    // ── Finished ──
    if (state === 'finished' && !resultShown) {
      combatManager.update(dt); // continue rendering remaining effects
      uiManager.updateHUD(combatManager.fightersLeft, combatManager.fightersRight);
      setTimeout(() => {
        uiManager.showResult(combatManager.getWinner(), combatManager.getBattleTime());
      }, 1500);
      resultShown = true;
    }

    // ── Render ──
    if (state !== 'waiting') {
      combatManager.render();
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
