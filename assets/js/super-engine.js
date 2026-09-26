/**
 * Super Engine - Link Minigames Common Library
 * Audio Synthesizer, Particle System, Juice FX, Achievements & Local Stats
 */

class SuperAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'point':
      case 'score':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'eat':
      case 'pop':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'hit':
      case 'bounce':
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'jump':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'powerup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(400, now + 0.06);
        osc.frequency.setValueAtTime(500, now + 0.12);
        osc.frequency.setValueAtTime(700, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'combo':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'win':
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + idx * 0.1);
          g.connect(this.ctx.destination);
          o.connect(g);
          g.gain.setValueAtTime(0.2, now + idx * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
          o.start(now + idx * 0.1);
          o.stop(now + idx * 0.1 + 0.25);
        });
        break;

      case 'gameover':
      case 'lose':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'explosion':
        // White noise simulation for explosion
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.25);
        noise.connect(filter);
        filter.connect(gain);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        noise.start(now);
        noise.stop(now + 0.25);
        break;
    }
  }
}

class ParticleSystem {
  constructor(canvasCtx) {
    this.ctx = canvasCtx;
    this.particles = [];
    this.floatingTexts = [];
  }

  burst(x, y, color = '#6366f1', count = 16, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 4 + 2,
        color: color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.05
      });
    }
  }

  addFloatingText(text, x, y, color = '#f59e0b', fontSize = 16) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.2,
      alpha: 1,
      color: color,
      fontSize: fontSize
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw() {
    if (!this.ctx) return;
    this.ctx.save();
    for (const p of this.particles) {
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    for (const ft of this.floatingTexts) {
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.fillStyle = ft.color;
      this.ctx.font = `bold ${ft.fontSize}px system-ui, sans-serif`;
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = '#000';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
    }
    this.ctx.restore();
  }
}

class SuperStats {
  constructor(gameId) {
    this.gameId = gameId;
    this.storageKey = `super_stats_${gameId}`;
    this.data = this.load();
  }

  load() {
    const defaultData = {
      highScore: 0,
      gamesPlayed: 0,
      totalScore: 0,
      maxCombo: 0,
      achievements: []
    };
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData;
    } catch (e) {
      return defaultData;
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {}
  }

  recordGame(score, combo = 0) {
    this.data.gamesPlayed++;
    this.data.totalScore += score;
    if (score > this.data.highScore) {
      this.data.highScore = score;
    }
    if (combo > this.data.maxCombo) {
      this.data.maxCombo = combo;
    }
    this.save();
  }

  unlockAchievement(id, title, description) {
    if (!this.data.achievements.includes(id)) {
      this.data.achievements.push(id);
      this.save();
      this.showToast(title, description);
    }
  }

  showToast(title, description) {
    let container = document.getElementById('achievement-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'achievement-toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.style.cssText = `
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      border: 1px solid #818cf8;
      border-radius: 12px;
      padding: 12px 16px;
      color: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: toastSlideIn 0.4s ease-out;
      min-width: 260px;
    `;

    toast.innerHTML = `
      <div style="font-size: 1.8rem;">🏆</div>
      <div>
        <div style="font-size: 0.75rem; text-transform: uppercase; color: #a5b4fc; font-weight: bold; letter-spacing: 0.05em;">¡LOGRO DESBLOQUEADO!</div>
        <div style="font-size: 0.95rem; font-weight: bold; color: #ffffff;">${title}</div>
        <div style="font-size: 0.8rem; color: #cbd5e1;">${description}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.4s ease-in forwards';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
}

// Global Instances Helper
window.SuperEngine = {
  Audio: new SuperAudio(),
  ParticleSystem: ParticleSystem,
  Stats: SuperStats,
  shakeCanvas: (canvas, intensity = 6, duration = 200) => {
    const start = Date.now();
    const origTransform = canvas.style.transform || '';
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        canvas.style.transform = origTransform;
        clearInterval(interval);
      } else {
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    }, 16);
  }
};
