class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3; // Master volume
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
      this.enabled = false;
    }
  }

  // ───────────────────────────────────────────────
  // Helper: Play a tone with frequency envelope
  // ───────────────────────────────────────────────
  _playTone(type, startFreq, endFreq, duration, volMulti = 1) {
    if (!this.enabled || !this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    }

    gain.gain.setValueAtTime(this.volume * volMulti, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  // ───────────────────────────────────────────────
  // Helper: Play noise (for explosions/hits)
  // ───────────────────────────────────────────────
  _playNoise(duration, volMulti = 1) {
    if (!this.enabled || !this.ctx) return;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound more like an explosion/hit
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * volMulti, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // ───────────────────────────────────────────────
  // Specific Sound Effects
  // ───────────────────────────────────────────────

  playHitSound() {
    this._playNoise(0.1, 0.5); // Short, soft noise burst
  }

  playCritSound() {
    this._playNoise(0.2, 1.0); // Louder noise burst
    this._playTone('square', 800, 100, 0.2, 0.8);
  }

  playShootSound() {
    // Pew pew!
    this._playTone('square', 600, 200, 0.1, 0.3);
  }

  playSwingSound() {
    // Whoosh
    this._playTone('sine', 200, 50, 0.15, 0.3);
  }

  playSkillSound() {
    // Magical chime/charge up
    this._playTone('sine', 400, 1200, 0.4, 0.5);
    setTimeout(() => {
      this._playTone('sine', 600, 1800, 0.3, 0.5);
    }, 100);
  }

  playSummonSound() {
    // Deep rumbling magic
    this._playTone('triangle', 150, 50, 0.5, 0.6);
  }

  playDeathSound() {
    // Descending sad tone
    this._playTone('sawtooth', 300, 50, 0.5, 0.5);
  }

  playClickSound() {
    // Simple UI beep
    this._playTone('sine', 800, 800, 0.05, 0.2);
  }

  playStartBattleSound() {
    // Epic ascending gong/chime
    this._playTone('square', 400, 800, 0.3, 0.5);
    setTimeout(() => this._playTone('square', 600, 1200, 0.4, 0.5), 150);
  }

  playVictorySound() {
    // Tada!
    this._playTone('sine', 400, 400, 0.2, 0.5);
    setTimeout(() => this._playTone('sine', 500, 500, 0.2, 0.5), 200);
    setTimeout(() => this._playTone('sine', 600, 600, 0.4, 0.6), 400);
  }
}

// Global instance
window.soundSystem = new SoundSystem();
