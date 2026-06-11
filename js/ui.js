/**
 * UIManager - Manages all HTML-based UI overlays
 * Character selection, battle HUD, countdown, and result screen.
 */
class UIManager {
  constructor() {
    // ── Screens ──
    this.selectScreen = document.getElementById('select-screen');
    this.battleScreen = document.getElementById('battle-screen');
    this.resultScreen = document.getElementById('result-screen');

    // ── Select screen ──
    this.leftGrid = document.getElementById('left-grid');
    this.rightGrid = document.getElementById('right-grid');
    this.startBtn = document.getElementById('start-btn');

    // ── HUD ──
    this.leftName = document.getElementById('left-name');
    this.rightName = document.getElementById('right-name');
    this.leftHpBar = document.getElementById('left-hp-bar');
    this.rightHpBar = document.getElementById('right-hp-bar');
    this.leftHpText = document.getElementById('left-hp-text');
    this.rightHpText = document.getElementById('right-hp-text');

    // ── Countdown ──
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownText = document.getElementById('countdown-text');

    // ── Result ──
    this.resultTitle = document.getElementById('result-title');
    this.resultWinner = document.getElementById('result-winner');
    this.resultTime = document.getElementById('result-time');
    this.rematchBtn = document.getElementById('rematch-btn');
    this.reselectBtn = document.getElementById('reselect-btn');

    // ── State ──
    this.selectedLeft = null;
    this.selectedRight = null;

    // ── Callbacks ──
    this._onStartBattle = null;
    this._onRematch = null;
    this._onReselect = null;

    this._setupEventListeners();
  }

  /* ═══════════════════════════════════════════════════════
     Character Selection
     ═══════════════════════════════════════════════════════ */

  initCharacterSelect() {
    this.leftGrid.innerHTML = '';
    this.rightGrid.innerHTML = '';

    const charIds = Object.keys(CHARACTERS);

    charIds.forEach(id => {
      const char = CHARACTERS[id];
      this.leftGrid.appendChild(this._createCard(id, char, 'left'));
      this.rightGrid.appendChild(this._createCard(id, char, 'right'));
    });

    // Reset selections
    this.selectedLeft = null;
    this.selectedRight = null;
    this._updateStartButton();
  }

  _createCard(charId, char, side) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.dataset.charId = charId;
    card.dataset.side = side;

    // Colored circle preview
    const preview = document.createElement('div');
    preview.className = 'card-preview';
    preview.style.background = `radial-gradient(circle, ${char.color}, ${char.secondaryColor || char.color})`;
    preview.style.boxShadow = `0 0 12px ${char.glowColor || char.color}`;

    // Name
    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = char.nameCN || char.name;

    // Stats row
    const stats = document.createElement('div');
    stats.className = 'card-stats';
    stats.innerHTML = `
      <span class="stat" title="Attack Power">⚔️ ${char.attackPower}</span>
      <span class="stat" title="Attack Speed">⚡ ${char.attackSpeed.toFixed(1)}</span>
      <span class="stat" title="Range">🎯 ${char.attackRange}</span>
    `;

    card.appendChild(preview);
    card.appendChild(name);
    card.appendChild(stats);

    // Click handler
    card.addEventListener('click', () => this._selectCard(charId, side));

    // Hover glow
    card.addEventListener('mouseenter', () => {
      if (!card.classList.contains('selected')) {
        card.style.boxShadow = `0 0 20px ${char.color}40, inset 0 0 20px ${char.color}10`;
        card.style.borderColor = `${char.color}80`;
      }
    });
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('selected')) {
        card.style.boxShadow = '';
        card.style.borderColor = '';
      }
    });

    return card;
  }

  _selectCard(charId, side) {
    const char = CHARACTERS[charId];
    const gridId = side === 'left' ? 'left-grid' : 'right-grid';
    const grid = document.getElementById(gridId);

    // Deselect previous
    grid.querySelectorAll('.character-card').forEach(c => {
      c.classList.remove('selected');
      c.style.boxShadow = '';
      c.style.borderColor = '';
    });

    // Select new
    const card = grid.querySelector(`[data-char-id="${charId}"]`);
    if (card) {
      card.classList.add('selected');
      card.style.boxShadow = `0 0 24px ${char.color}80, inset 0 0 24px ${char.color}20`;
      card.style.borderColor = char.color;
    }

    if (side === 'left') {
      this.selectedLeft = charId;
    } else {
      this.selectedRight = charId;
    }

    this._updateStartButton();
  }

  _updateStartButton() {
    const ready = this.selectedLeft !== null && this.selectedRight !== null;
    this.startBtn.disabled = !ready;
    if (ready) {
      this.startBtn.textContent = '⚔️ 开始战斗!';
    } else {
      this.startBtn.textContent = '选择角色开始战斗';
    }
  }

  /* ═══════════════════════════════════════════════════════
     Screen Management
     ═══════════════════════════════════════════════════════ */

  showScreen(screenName) {
    this.selectScreen.style.display = 'none';
    this.battleScreen.style.display = 'none';
    this.resultScreen.style.display = 'none';

    switch (screenName) {
      case 'select':
        this.selectScreen.style.display = '';
        break;
      case 'battle':
        this.battleScreen.style.display = '';
        break;
      case 'result':
        this.resultScreen.style.display = '';
        break;
    }
  }

  hideScreen(screenName) {
    switch (screenName) {
      case 'select':
        this.selectScreen.style.display = 'none';
        break;
      case 'battle':
        this.battleScreen.style.display = 'none';
        break;
      case 'result':
        this.resultScreen.style.display = 'none';
        break;
    }
  }

  /* ═══════════════════════════════════════════════════════
     Battle HUD
     ═══════════════════════════════════════════════════════ */

  updateHUD(fighter1, fighter2) {
    if (!fighter1 || !fighter2) return;

    // Names
    this.leftName.textContent = fighter1.charData.nameCN || fighter1.charData.name;
    this.leftName.style.color = fighter1.charData.color;
    this.rightName.textContent = fighter2.charData.nameCN || fighter2.charData.name;
    this.rightName.style.color = fighter2.charData.color;

    // HP bars
    const hp1Pct = Math.max(0, fighter1.hp / fighter1.maxHp * 100);
    const hp2Pct = Math.max(0, fighter2.hp / fighter2.maxHp * 100);

    this.leftHpBar.style.width = hp1Pct + '%';
    this.rightHpBar.style.width = hp2Pct + '%';

    this.leftHpBar.style.background = this._hpGradient(hp1Pct);
    this.rightHpBar.style.background = this._hpGradient(hp2Pct);

    // HP text
    this.leftHpText.textContent = `${Math.ceil(Math.max(0, fighter1.hp))}/${fighter1.maxHp}`;
    this.rightHpText.textContent = `${Math.ceil(Math.max(0, fighter2.hp))}/${fighter2.maxHp}`;
  }

  _hpGradient(pct) {
    if (pct > 60) return 'linear-gradient(90deg, #4CAF50, #66BB6A)';
    if (pct > 30) return 'linear-gradient(90deg, #FF8F00, #FFB300)';
    return 'linear-gradient(90deg, #C62828, #E53935)';
  }

  /* ═══════════════════════════════════════════════════════
     Countdown
     ═══════════════════════════════════════════════════════ */

  showCountdown(value) {
    this.countdownOverlay.style.display = 'flex';
    this.countdownText.textContent = value;
    // Trigger pop animation
    this.countdownText.classList.remove('pop');
    void this.countdownText.offsetWidth; // force reflow
    this.countdownText.classList.add('pop');

    if (value === 'FIGHT!') {
      this.countdownText.classList.add('fight-text');
    } else {
      this.countdownText.classList.remove('fight-text');
    }
  }

  hideCountdown() {
    this.countdownOverlay.style.display = 'none';
  }

  /* ═══════════════════════════════════════════════════════
     Result Screen
     ═══════════════════════════════════════════════════════ */

  showResult(winner, battleTime) {
    if (winner) {
      this.resultTitle.textContent = '🏆 胜利!';
      const winnerName = winner.charData.nameCN || winner.charData.name;
      this.resultWinner.textContent = winnerName;
      this.resultWinner.style.color = winner.charData.color;
      this.resultWinner.style.textShadow = `0 0 20px ${winner.charData.color}`;
    } else {
      this.resultTitle.textContent = '🤝 平局!';
      this.resultWinner.textContent = '势均力敌';
      this.resultWinner.style.color = '#e0e0e0';
      this.resultWinner.style.textShadow = '';
    }

    this.resultTime.textContent = `战斗时间: ${battleTime.toFixed(1)}s`;
    this.showScreen('result');
  }

  hideResult() {
    this.hideScreen('result');
  }

  /* ═══════════════════════════════════════════════════════
     Callbacks
     ═══════════════════════════════════════════════════════ */

  onStartBattle(callback) {
    this._onStartBattle = callback;
  }

  onRematch(callback) {
    this._onRematch = callback;
  }

  onReselect(callback) {
    this._onReselect = callback;
  }

  getSelectedCharacters() {
    return { left: this.selectedLeft, right: this.selectedRight };
  }

  /* ═══════════════════════════════════════════════════════
     Internal Event Listeners
     ═══════════════════════════════════════════════════════ */

  _setupEventListeners() {
    this.startBtn.addEventListener('click', () => {
      if (this.selectedLeft && this.selectedRight && this._onStartBattle) {
        this._onStartBattle(this.selectedLeft, this.selectedRight);
      }
    });

    this.rematchBtn.addEventListener('click', () => {
      if (this._onRematch) this._onRematch();
    });

    this.reselectBtn.addEventListener('click', () => {
      if (this._onReselect) this._onReselect();
    });
  }
}
