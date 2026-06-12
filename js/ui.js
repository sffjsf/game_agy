import { characterData } from './characters/index.js';
import { soundSystem } from './audio.js';

/**
 * UIManager - Manages all HTML-based UI overlays
 * Character selection, battle HUD, countdown, and result screen.
 */
export class UIManager {
  constructor() {
    // ── Screens ──
    this.selectScreen = document.getElementById('select-screen');
    this.battleScreen = document.getElementById('battle-screen');
    this.resultScreen = document.getElementById('result-screen');
    this.codexScreen = document.getElementById('codex-screen');

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
    this.selectedLeft = [];
    this.selectedRight = [];

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

    const charIds = Object.keys(characterData);
    
    const heroes = [];
    const regulars = [];

    charIds.forEach(id => {
      const char = characterData[id];
      if (char.hidden) return; // Hide summoned minions from selection
      
      if (char.isHero) {
        heroes.push({ id, char });
      } else {
        regulars.push({ id, char });
      }
    });

    this._buildCategory('普通战士', regulars, 'left', this.leftGrid);
    this._buildCategory('英雄角色', heroes, 'left', this.leftGrid);
    
    this._buildCategory('普通战士', regulars, 'right', this.rightGrid);
    this._buildCategory('英雄角色', heroes, 'right', this.rightGrid);

    // Keep existing selections, just refresh visuals
    this._updateGridVisuals('left');
    this._updateGridVisuals('right');
    this._updateStartButton();
  }

  _buildCategory(title, charList, side, parentGrid) {
    if (charList.length === 0) return;

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'char-category';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <div class="category-header-title" style="flex: 1; display: flex; align-items: center; gap: 8px;">
        <span>${title} (${charList.length})</span> 
        <span class="category-toggle">▼</span>
      </div>
      <div class="category-actions">
        <button class="btn-category btn-select-all">全选</button>
        <button class="btn-category btn-clear-all">清空</button>
      </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'category-content';

    const titleDiv = header.querySelector('.category-header-title');
    titleDiv.addEventListener('click', (e) => {
      categoryDiv.classList.toggle('collapsed');
    });

    const btnSelectAll = header.querySelector('.btn-select-all');
    btnSelectAll.addEventListener('click', (e) => {
      e.stopPropagation();
      const list = side === 'left' ? this.selectedLeft : this.selectedRight;
      charList.forEach(item => {
        if (!list.includes(item.id)) list.push(item.id);
      });
      this._updateGridVisuals(side);
      this._updateStartButton();
    });

    const btnClearAll = header.querySelector('.btn-clear-all');
    btnClearAll.addEventListener('click', (e) => {
      e.stopPropagation();
      const list = side === 'left' ? this.selectedLeft : this.selectedRight;
      charList.forEach(item => {
        const index = list.indexOf(item.id);
        if (index > -1) list.splice(index, 1);
      });
      this._updateGridVisuals(side);
      this._updateStartButton();
    });

    charList.forEach(item => {
      content.appendChild(this._createCard(item.id, item.char, side));
    });

    categoryDiv.appendChild(header);
    categoryDiv.appendChild(content);
    parentGrid.appendChild(categoryDiv);
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

    // Hero badge for superheroes
    const isHero = char.isHero;
    if (isHero) {
      const badge = document.createElement('div');
      badge.className = 'hero-badge';
      badge.textContent = '⭐ 英雄';
      card.appendChild(badge);
    }

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

  _updateGridVisuals(side) {
    const list = side === 'left' ? this.selectedLeft : this.selectedRight;
    const grid = side === 'left' ? this.leftGrid : this.rightGrid;

    grid.querySelectorAll('.character-card').forEach(card => {
      const charId = card.dataset.charId;
      const index = list.indexOf(charId);
      const char = characterData[charId];

      if (index > -1) {
        card.classList.add('selected');
        card.setAttribute('data-select-index', index + 1);
        card.style.boxShadow = `0 0 24px ${char.color}80, inset 0 0 24px ${char.color}20`;
        card.style.borderColor = char.color;
      } else {
        card.classList.remove('selected');
        card.removeAttribute('data-select-index');
        card.style.boxShadow = '';
        card.style.borderColor = '';
      }
    });
  }

  _selectCard(charId, side) {
    const list = side === 'left' ? this.selectedLeft : this.selectedRight;
    const index = list.indexOf(charId);

    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(charId);
    }

    this._updateGridVisuals(side);
    this._updateStartButton();
  }

  _updateStartButton() {
    const ready = this.selectedLeft.length > 0 && this.selectedRight.length > 0;
    this.startBtn.disabled = !ready;
    if (ready) {
      this.startBtn.textContent = `⚔️ 开始战斗! (${this.selectedLeft.length} vs ${this.selectedRight.length})`;
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
    if(this.codexScreen) this.codexScreen.style.display = 'none';

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
      case 'codex':
        if(this.codexScreen) this.codexScreen.style.display = 'flex';
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

  updateHUD(teamLeft, teamRight) {
    if (!teamLeft || !teamRight) return;

    // Left Names joined (only main non-hidden heroes)
    this.leftName.innerHTML = '';
    const mainLeft = teamLeft.filter(f => !f.charData.hidden);
    mainLeft.forEach((f, idx) => {
      if (idx > 0) {
        const plus = document.createElement('span');
        plus.textContent = ' + ';
        plus.style.color = '#888';
        this.leftName.appendChild(plus);
      }
      const span = document.createElement('span');
      span.textContent = f.charData.nameCN || f.charData.name;
      span.style.color = f.charData.color;
      if (!f.isAlive()) {
        span.style.textDecoration = 'line-through';
        span.style.opacity = '0.35';
      }
      this.leftName.appendChild(span);
    });

    // Right Names joined (only main non-hidden heroes)
    this.rightName.innerHTML = '';
    const mainRight = teamRight.filter(f => !f.charData.hidden);
    mainRight.forEach((f, idx) => {
      if (idx > 0) {
        const plus = document.createElement('span');
        plus.textContent = ' + ';
        plus.style.color = '#888';
        this.rightName.appendChild(plus);
      }
      const span = document.createElement('span');
      span.textContent = f.charData.nameCN || f.charData.name;
      span.style.color = f.charData.color;
      if (!f.isAlive()) {
        span.style.textDecoration = 'line-through';
        span.style.opacity = '0.35';
      }
      this.rightName.appendChild(span);
    });

    // Update HP bars and text dynamically for both teams
    var leftTotalHp = teamLeft.reduce((sum, f) => sum + (f.isAlive() ? f.hp : 0), 0);
    if (!isFinite(leftTotalHp)) leftTotalHp = 0;
    const leftTotalMaxHp = teamLeft.reduce((sum, f) => sum + f.maxHp, 0);
    const leftPct = leftTotalMaxHp > 0 ? (leftTotalHp / leftTotalMaxHp) * 100 : 0;
    this.leftHpBar.style.width = (isFinite(leftPct) ? leftPct : 0) + '%';
    this.leftHpBar.style.background = this._hpGradient(leftPct);
    this.leftHpText.textContent = Math.ceil(leftTotalHp) + '/' + leftTotalMaxHp;

    var rightTotalHp = teamRight.reduce((sum, f) => sum + (f.isAlive() ? f.hp : 0), 0);
    if (!isFinite(rightTotalHp)) rightTotalHp = 0;
    const rightTotalMaxHp = teamRight.reduce((sum, f) => sum + f.maxHp, 0);
    const rightPct = rightTotalMaxHp > 0 ? (rightTotalHp / rightTotalMaxHp) * 100 : 0;
    this.rightHpBar.style.width = (isFinite(rightPct) ? rightPct : 0) + '%';
    this.rightHpBar.style.background = this._hpGradient(rightPct);
    this.rightHpText.textContent = Math.ceil(rightTotalHp) + '/' + rightTotalMaxHp;
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

  showResult(winnerSide, battleTime) {
    if (soundSystem) soundSystem.playVictorySound();
    
    if (winnerSide) {
      this.resultTitle.textContent = '🏆 胜利!';
      this.resultWinner.textContent = winnerSide === 'left' ? '左方队伍' : '右方队伍';
      this.resultWinner.style.color = winnerSide === 'left' ? '#00E5FF' : '#FF3D00';
      this.resultWinner.style.textShadow = `0 0 20px ${winnerSide === 'left' ? '#00E5FF' : '#FF3D00'}`;
    } else {
      this.resultTitle.textContent = '🤝 平局!';
      this.resultWinner.textContent = '势均力敌';
      this.resultWinner.style.color = '#e0e0e0';
      this.resultWinner.style.textShadow = '';
    }

    this.resultTime.textContent = `战斗时间: ${battleTime.toFixed(1)}s`;
    this.showScreen('result');
    
    // Auto-focus the rematch button when screen appears
    setTimeout(() => this.rematchBtn.focus(), 50);
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
      if (soundSystem) {
        soundSystem.init();
        soundSystem.playStartBattleSound();
      }
      if (this.selectedLeft && this.selectedRight && this._onStartBattle) {
        this._onStartBattle(this.selectedLeft, this.selectedRight);
      }
    });

    this.rematchBtn.addEventListener('click', () => {
      if (soundSystem) {
        soundSystem.init();
        soundSystem.playClickSound();
      }
      if (this._onRematch) this._onRematch();
    });

    this.reselectBtn.addEventListener('click', () => {
      if (soundSystem) {
        soundSystem.init();
        soundSystem.playClickSound();
      }
      if (this._onReselect) this._onReselect();
    });

    const openCodexBtn = document.getElementById('open-codex-btn');
    const closeCodexBtn = document.getElementById('close-codex-btn');
    if (openCodexBtn) {
      openCodexBtn.addEventListener('click', () => {
        if (soundSystem) {
          soundSystem.init();
          soundSystem.playClickSound();
        }
        this._populateCodex();
        this.showScreen('codex');
      });
    }
    if (closeCodexBtn) {
      closeCodexBtn.addEventListener('click', () => {
        if (soundSystem) soundSystem.playClickSound();
        this.showScreen('select');
      });
    }

    // Global bulk actions
    const handleGlobalSelect = (side, selectAll) => {
      const list = side === 'left' ? this.selectedLeft : this.selectedRight;
      if (!selectAll) {
        // Clear all
        list.length = 0;
      } else {
        // Select all
        const allIds = Object.keys(characterData).filter(id => !characterData[id].hidden);
        allIds.forEach(id => {
          if (!list.includes(id)) list.push(id);
        });
      }
      this._updateGridVisuals(side);
      this._updateStartButton();
    };

    const leftSelectAll = document.getElementById('left-select-all');
    const leftClearAll = document.getElementById('left-clear-all');
    const rightSelectAll = document.getElementById('right-select-all');
    const rightClearAll = document.getElementById('right-clear-all');

    if (leftSelectAll) leftSelectAll.addEventListener('click', () => handleGlobalSelect('left', true));
    if (leftClearAll) leftClearAll.addEventListener('click', () => handleGlobalSelect('left', false));
    if (rightSelectAll) rightSelectAll.addEventListener('click', () => handleGlobalSelect('right', true));
    if (rightClearAll) rightClearAll.addEventListener('click', () => handleGlobalSelect('right', false));

    // Speed Control Slider — now handled in main.js

    // Keyboard navigation for result screen
    document.addEventListener('keydown', (e) => {
      const resultScreen = document.getElementById('result-screen');
      if (resultScreen && !resultScreen.style.display.includes('none') && resultScreen.style.display !== 'none') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
          if (document.activeElement === this.rematchBtn) {
            this.reselectBtn.focus();
          } else {
            this.rematchBtn.focus();
          }
          e.preventDefault();
        } else if (e.key === 'Enter' || e.key === ' ') {
          // If focus was lost, default to rematch on enter
          if (document.activeElement !== this.rematchBtn && document.activeElement !== this.reselectBtn) {
            this.rematchBtn.click();
            e.preventDefault();
          }
        }
      }
    });
  }

  _populateCodex() {
    const codexGrid = document.getElementById('codex-grid');
    if (!codexGrid) return;
    codexGrid.innerHTML = '';

    const charIds = Object.keys(characterData);
    charIds.forEach(id => {
      const char = characterData[id];
      // Only show visible characters in codex (unless we want to show hidden minions too? Let's show all to be fully detailed)
      const isHidden = char.hidden ? '<span style="color: #ff5252; font-size: 0.8em; margin-left: 8px;">(隐藏角色)</span>' : '';

      const card = document.createElement('div');
      card.className = 'codex-card';

      let lifestealText = char.lifesteal > 0 ? (char.lifesteal * 100).toFixed(0) + '%' : '无';
      let weaponText = char.weaponType === 'melee' ? '近战' : '远程';
      const passiveItems = char.passives && char.passives.length > 0 ? char.passives : [{ name: '无', description: '没有额外被动能力。' }];
      const specialItems = char.specialEffects && char.specialEffects.length > 0 ? char.specialEffects : [{ name: '无', description: '没有额外特殊效果。' }];
      const passiveHtml = `
        <div class="codex-passives">
          <div class="skill-header">
            <span class="skill-name">被动能力</span>
          </div>
          ${passiveItems.map(passive => `
            <p class="skill-desc"><strong>${passive.name}</strong>: ${passive.description}</p>
          `).join('')}
        </div>
      `;
      const specialHtml = `
        <div class="codex-specials">
          <div class="skill-header">
            <span class="skill-name">特殊效果</span>
          </div>
          ${specialItems.map(effect => `
            <p class="skill-desc"><strong>${effect.name}</strong>: ${effect.description}</p>
          `).join('')}
        </div>
      `;
      
      const isHero = char.isHero;
      const badgeHtml = isHero ? '<div class="hero-badge" style="top: 8px; left: 8px; font-size: 12px; padding: 4px 8px;">⭐ 英雄</div>' : '';

      card.innerHTML = `
        ${badgeHtml}
        <div class="codex-card-header">
          <div class="codex-icon" style="background-color: ${char.color}; border: 2px solid ${char.secondaryColor};"></div>
          <div class="codex-title">
            <h2>${char.nameCN}${isHidden}</h2>
            <p>${char.name}</p>
          </div>
        </div>
        <div class="codex-stats">
          <div class="stat-item"><span class="stat-label">血量 (HP)</span><span class="stat-value hp">${char.hp}</span></div>
          <div class="stat-item"><span class="stat-label">攻击力 (ATK)</span><span class="stat-value damage">${char.attackPower}</span></div>
          <div class="stat-item"><span class="stat-label">攻速 (ATK SPD)</span><span class="stat-value">${char.attackSpeed}s/次</span></div>
          <div class="stat-item"><span class="stat-label">射程 (RANGE)</span><span class="stat-value">${char.attackRange}</span></div>
          <div class="stat-item"><span class="stat-label">移速 (SPEED)</span><span class="stat-value speed">${char.speed}</span></div>
          <div class="stat-item"><span class="stat-label">武器 (WEAPON)</span><span class="stat-value">${weaponText}</span></div>
          <div class="stat-item"><span class="stat-label">吸血 (LIFESTEAL)</span><span class="stat-value">${lifestealText}</span></div>
          <div class="stat-item"><span class="stat-label">施法前摇</span><span class="stat-value">${char.chargeTime}s</span></div>
          <div class="stat-item"><span class="stat-label">移动模式</span><span class="stat-value">${char.movePattern}</span></div>
          <div class="stat-item"><span class="stat-label">AI倾向</span><span class="stat-value">${char.aiTendency}</span></div>
        </div>
        <div class="codex-skill">
          <div class="skill-header">
            <span class="skill-name">⭐ ${char.skill.name}</span>
            <span class="skill-cd">CD: ${char.skill.cooldown}s</span>
          </div>
          <p class="skill-desc">
            类型: ${char.skill.type} <br/>
            伤害: ${char.skill.damage} <br/>
            射程: ${char.skill.range} <br/>
            持续时间: ${char.skill.duration}s
          </p>
        </div>
        ${passiveHtml}
        ${specialHtml}
      `;
      codexGrid.appendChild(card);
    });
  }
}
