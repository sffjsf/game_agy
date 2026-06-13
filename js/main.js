import { CombatManager } from './combat.js';
import { UIManager } from './ui.js';

/**
 * main.js - Game entry point
 * Wires CombatManager + UIManager, runs the game loop.
 */
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('battle-canvas');
  const combatManager = new CombatManager(canvas);
  window.combatManager = combatManager; // Expose for debugging and testing
  const uiManager = new UIManager();

  // Zoom & Pan state variables declared early to avoid Temporal Dead Zone (TDZ) issues during startup resize
  let zoom = parseFloat(localStorage.getItem('battle_zoom')) || 1.0;
  let panX = parseFloat(localStorage.getItem('battle_panX')) || 0;
  let panY = parseFloat(localStorage.getItem('battle_panY')) || 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  /* ── Canvas sizing ────────────────────────────────────── */
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const sizeSelect = document.getElementById('arena-size-select');
  const customWidthInput = document.getElementById('custom-width');
  const customHeightInput = document.getElementById('custom-height');

  // Load saved map size settings from localStorage
  if (sizeSelect) {
    const savedMode = localStorage.getItem('battle_size_mode');
    if (savedMode) {
      sizeSelect.value = savedMode;
      const customSizeInputs = document.getElementById('custom-size-inputs');
      if (customSizeInputs) {
        customSizeInputs.style.display = savedMode === 'custom' ? 'flex' : 'none';
      }
    }
  }
  if (customWidthInput) {
    const savedWidth = localStorage.getItem('battle_custom_width');
    if (savedWidth) customWidthInput.value = savedWidth;
  }
  if (customHeightInput) {
    const savedHeight = localStorage.getItem('battle_custom_height');
    if (savedHeight) customHeightInput.value = savedHeight;
  }

  function resizeCanvas() {
    const sizeMode = sizeSelect ? sizeSelect.value : 'auto';
    const container = canvas.parentElement;

    if (sizeMode === 'auto') {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      if (canvasWrapper) {
        canvasWrapper.style.width = '100%';
        canvasWrapper.style.height = '100%';
      }
      canvas.classList.remove('fixed-size');
    } else {
      let w = 800;
      let h = 600;
      if (sizeMode === 'custom') {
        w = parseInt(customWidthInput.value) || 1000;
        h = parseInt(customHeightInput.value) || 600;
      } else {
        const parts = sizeMode.split('x');
        w = parseInt(parts[0]) || 800;
        h = parseInt(parts[1]) || 600;
      }
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      if (canvasWrapper) {
        canvasWrapper.style.width = w + 'px';
        canvasWrapper.style.height = h + 'px';
      }
      canvas.classList.add('fixed-size');
    }
    combatManager.updateDimensions();
    if (typeof updateTransform === 'function') {
      updateTransform();
    }
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (sizeSelect) {
    sizeSelect.addEventListener('change', () => {
      localStorage.setItem('battle_size_mode', sizeSelect.value);
      resizeCanvas();
    });
  }
  if (customWidthInput) {
    const saveWidth = () => {
      localStorage.setItem('battle_custom_width', customWidthInput.value);
      resizeCanvas();
    };
    customWidthInput.addEventListener('input', saveWidth);
    customWidthInput.addEventListener('blur', saveWidth);
  }
  if (customHeightInput) {
    const saveHeight = () => {
      localStorage.setItem('battle_custom_height', customHeightInput.value);
      resizeCanvas();
    };
    customHeightInput.addEventListener('input', saveHeight);
    customHeightInput.addEventListener('blur', saveHeight);
  }

  /* ── Zoom and Pan System ────────────────────────────────── */

  function clampPanOffsets() {
    const container = canvas.parentElement;
    if (!container) return;

    const W_container = container.clientWidth;
    const H_container = container.clientHeight;
    const W_canvas = canvas.width * zoom;
    const H_canvas = canvas.height * zoom;

    // Horizontally clamp
    if (W_canvas > W_container) {
      const maxX = (W_canvas - W_container) / 2;
      panX = Math.max(-maxX, Math.min(maxX, panX));
    } else {
      panX = 0; // Lock centered if it fits completely
    }

    // Vertically clamp
    if (H_canvas > H_container) {
      const maxY = (H_canvas - H_container) / 2;
      panY = Math.max(-maxY, Math.min(maxY, panY));
    } else {
      panY = 0; // Lock centered if it fits completely
    }
  }

  function updateTransform() {
    clampPanOffsets();
    if (canvasWrapper) {
      canvasWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    }
    const zoomText = document.getElementById('zoom-percentage');
    if (zoomText) {
      zoomText.textContent = Math.round(zoom * 100) + '%';
    }
    localStorage.setItem('battle_zoom', zoom);
    localStorage.setItem('battle_panX', panX);
    localStorage.setItem('battle_panY', panY);
  }

  function resetZoomPan() {
    zoom = 1.0;
    panX = 0;
    panY = 0;
    updateTransform();
  }

  // Restore zoom and pan visual state immediately
  updateTransform();

  const container = canvas.parentElement;
  if (canvasWrapper && container) {
    container.style.cursor = 'grab';

    // Click-and-drag panning (bound to container)
    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      // Do not initiate drag if user clicks on UI control panels
      if (e.target.closest('#zoom-controls') || e.target.closest('#speed-control')) return;
      
      isDragging = true;
      container.style.cursor = 'grabbing';
      canvasWrapper.style.cursor = 'grabbing';
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
        canvasWrapper.style.cursor = 'grab';
      }
    });

    // Mouse wheel / Pinch-to-zoom (bound to container)
    container.addEventListener('wheel', (e) => {
      // Do not zoom if scrolling over UI panels
      if (e.target.closest('#zoom-controls') || e.target.closest('#speed-control')) return;
      
      e.preventDefault();
      const zoomFactor = 1.08;
      
      if (e.deltaY < 0) {
        zoom = Math.min(zoom * zoomFactor, 4.0);
      } else {
        zoom = Math.max(zoom / zoomFactor, 0.15);
      }
      updateTransform();
    }, { passive: false });
  }

  // Bind zoom control buttons
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomResetBtn = document.getElementById('zoom-reset-btn');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoom = Math.min(zoom * 1.15, 4.0);
      updateTransform();
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoom = Math.max(zoom / 1.15, 0.15);
      updateTransform();
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', resetZoomPan);
  }

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
