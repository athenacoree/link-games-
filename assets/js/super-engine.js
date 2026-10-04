/**
 * SuperEngine - Shared Engine for Link Minigames
 * Provides Web Audio API synthesis, Particle System (pulso, aurora, choque, particles),
 * Viewport Camera with Screen Shake, Continuous Input Controller with Hold-to-Move,
 * Dynamic Field-of-View Fog of War, NPC Mini-AI & Collision Detection, and Spawner Logic.
 */

window.SuperEngine = (function() {
  'use strict';

  // --- Web Audio API Sound Synthesizer ---
  class AudioSynthesizer {
    constructor() {
      this.ctx = null;
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

    playSFX(type) {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch(type) {
          case 'step':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            break;

          case 'pulse':
          case 'spell_pulse':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
            break;

          case 'aurora':
          case 'spell_aurora':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.15);
            osc.frequency.linearRampToValueAtTime(450, now + 0.35);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
            break;

          case 'choque':
          case 'spell_choque':
          case 'impact':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;

          case 'hit':
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;

          case 'item':
          case 'coin':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.setValueAtTime(880, now + 0.08); // A5
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;

          case 'levelup':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554.37, now + 0.1);
            osc.frequency.setValueAtTime(659.25, now + 0.2);
            osc.frequency.setValueAtTime(880, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;

          case 'death':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;

          default:
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
      } catch (e) {
        // AudioContext silent fail fallback
      }
    }
  }

  // --- Advanced Visual Effects & Particle Engine ---
  class ParticleEngine {
    constructor() {
      this.particles = [];
      this.floatingTexts = [];
    }

    addParticles(x, y, count = 10, type = 'spark', options = {}) {
      for (let i = 0; i < count; i++) {
        const angle = options.angle !== undefined ? options.angle + (Math.random() - 0.5) * (options.spread || 1) : Math.random() * Math.PI * 2;
        const speed = (options.minSpeed || 1) + Math.random() * ((options.maxSpeed || 5) - (options.minSpeed || 1));

        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (options.minSize || 2) + Math.random() * ((options.maxSize || 6) - (options.minSize || 2)),
          life: 1.0,
          decay: (options.minDecay || 0.02) + Math.random() * 0.03,
          color: options.color || this.getDefaultColor(type),
          type: type,
          radius: options.radius || 0,
          maxRadius: options.maxRadius || 40,
          spin: (Math.random() - 0.5) * 0.2
        });
      }
    }

    getDefaultColor(type) {
      switch(type) {
        case 'pulso': return '#38bdf8';
        case 'aurora': return '#a855f7';
        case 'choque': return '#f97316';
        case 'fire': return '#ef4444';
        case 'heal': return '#4ade80';
        case 'gold': return '#facc15';
        case 'blood': return '#dc2626';
        case 'magic': return '#c084fc';
        default: return '#e2e8f0';
      }
    }

    addFloatingText(x, y, text, color = '#ffffff', fontSize = 16) {
      this.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        fontSize: fontSize,
        alpha: 1.0,
        vy: -1.2,
        life: 1.0,
        decay: 0.025
      });
    }

    update() {
      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.type === 'pulso') {
          p.radius += 2.5;
        } else if (p.type === 'aurora') {
          p.vx += Math.sin(p.life * 10) * 0.3;
          p.vy -= 0.2;
        } else if (p.type === 'choque') {
          p.vx *= 0.92;
          p.vy *= 0.92;
        }

        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Update floating text
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= ft.decay;
        if (ft.alpha <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }
    }

    draw(ctx, camera) {
      ctx.save();

      // Render Particles
      for (const p of this.particles) {
        const screenPos = camera ? camera.worldToScreen(p.x, p.y) : { x: p.x, y: p.y };
        ctx.globalAlpha = Math.max(0, p.life);

        if (p.type === 'pulso') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3 * p.life;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.type === 'aurora') {
          const grad = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, p.size * 2);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Floating Text
      for (const ft of this.floatingTexts) {
        const screenPos = camera ? camera.worldToScreen(ft.x, ft.y) : { x: ft.x, y: ft.y };
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = `bold ${ft.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, screenPos.x, screenPos.y);
        ctx.fillText(ft.text, screenPos.x, screenPos.y);
      }

      ctx.restore();
    }
  }

  // --- Viewport Camera with Smooth Tracking & Screen Shake ---
  class Camera {
    constructor(viewportWidth, viewportHeight, tileSize) {
      this.viewportWidth = viewportWidth;
      this.viewportHeight = viewportHeight;
      this.tileSize = tileSize;
      this.x = 0;
      this.y = 0;
      this.shakeIntensity = 0;
      this.shakeTimer = 0;
    }

    centerOn(worldX, worldY, mapWidth, mapHeight) {
      // Calculate target top-left screen position in world coordinates
      let targetX = worldX * this.tileSize + this.tileSize / 2 - this.viewportWidth / 2;
      let targetY = worldY * this.tileSize + this.tileSize / 2 - this.viewportHeight / 2;

      const maxWorldWidth = mapWidth * this.tileSize;
      const maxWorldHeight = mapHeight * this.tileSize;

      // Clamp camera within map bounds
      this.x = Math.max(0, Math.min(targetX, maxWorldWidth - this.viewportWidth));
      this.y = Math.max(0, Math.min(targetY, maxWorldHeight - this.viewportHeight));
    }

    triggerShake(intensity = 10, duration = 15) {
      this.shakeIntensity = intensity;
      this.shakeTimer = duration;
    }

    getOffset() {
      let shakeX = 0;
      let shakeY = 0;
      if (this.shakeTimer > 0) {
        shakeX = (Math.random() - 0.5) * this.shakeIntensity;
        shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeTimer--;
      }
      return {
        x: Math.floor(this.x + shakeX),
        y: Math.floor(this.y + shakeY)
      };
    }

    worldToScreen(wx, wy) {
      const offset = this.getOffset();
      return {
        x: Math.floor(wx - offset.x),
        y: Math.floor(wy - offset.y)
      };
    }

    tileToScreen(tx, ty) {
      const offset = this.getOffset();
      return {
        x: Math.floor(tx * this.tileSize - offset.x),
        y: Math.floor(ty * this.tileSize - offset.y)
      };
    }

    getVisibleTileBounds(mapWidth, mapHeight) {
      const offset = this.getOffset();
      const minCol = Math.max(0, Math.floor(offset.x / this.tileSize) - 1);
      const maxCol = Math.min(mapWidth - 1, Math.ceil((offset.x + this.viewportWidth) / this.tileSize) + 1);
      const minRow = Math.max(0, Math.floor(offset.y / this.tileSize) - 1);
      const maxRow = Math.min(mapHeight - 1, Math.ceil((offset.y + this.viewportHeight) / this.tileSize) + 1);

      return { minCol, maxCol, minRow, maxRow };
    }
  }

  // --- Input & Continuous Movement Manager ---
  class InputController {
    constructor(onMoveCallback, onActionCallback) {
      this.onMove = onMoveCallback;
      this.onAction = onActionCallback;
      this.heldDirection = null;
      this.moveInterval = null;
      this.moveSpeedMs = 110; // Continuous step interval
      this.keysPressed = {};

      this.initListeners();
    }

    initListeners() {
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        this.keysPressed[e.key] = true;

        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { dy = -1; }
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { dy = 1; }
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { dx = -1; }
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { dx = 1; }

        if (dx !== 0 || dy !== 0) {
          this.startMoving(dx, dy);
        }

        if (e.key === ' ' || e.key === '1') this.triggerAction('skill_pulse');
        if (e.key === '2' || e.key === 'e' || e.key === 'E') this.triggerAction('skill_aurora');
        if (e.key === '3' || e.key === 'q' || e.key === 'Q') this.triggerAction('skill_choque');
        if (e.key === '4' || e.key === 'f' || e.key === 'F') this.triggerAction('skill_fireball');
      });

      window.addEventListener('keyup', (e) => {
        delete this.keysPressed[e.key];
        const hasDirectionKey = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].some(k => this.keysPressed[k]);
        if (!hasDirectionKey) {
          this.stopMoving();
        }
      });
    }

    startMoving(dx, dy) {
      this.stopMoving();
      this.heldDirection = { dx, dy };
      if (this.onMove) this.onMove(dx, dy);

      this.moveInterval = setInterval(() => {
        if (this.heldDirection && this.onMove) {
          this.onMove(this.heldDirection.dx, this.heldDirection.dy);
        }
      }, this.moveSpeedMs);
    }

    stopMoving() {
      if (this.moveInterval) {
        clearInterval(this.moveInterval);
        this.moveInterval = null;
      }
      this.heldDirection = null;
    }

    triggerAction(actionType) {
      if (this.onAction) this.onAction(actionType);
    }

    bindTouchControl(element, dx, dy) {
      if (!element) return;

      const startHandler = (e) => {
        e.preventDefault();
        this.startMoving(dx, dy);
      };

      const endHandler = (e) => {
        e.preventDefault();
        this.stopMoving();
      };

      element.addEventListener('touchstart', startHandler, { passive: false });
      element.addEventListener('touchend', endHandler, { passive: false });
      element.addEventListener('mousedown', startHandler);
      element.addEventListener('mouseup', endHandler);
      element.addEventListener('mouseleave', endHandler);
    }
  }

  // --- Dynamic Vision & Fog of War ---
  class FogOfWar {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.grid = Array(height).fill(0).map(() => Array(width).fill(0)); // 0: Hidden, 1: Shadowed, 2: Visible
    }

    reset() {
      this.grid = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
    }

    update(playerX, playerY, radius = 6) {
      // Step 1: Convert previously visible tiles to shadowed
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          if (this.grid[r][c] === 2) {
            this.grid[r][c] = 1;
          }
        }
      }

      // Step 2: Radius FOV reveal around player
      for (let r = playerY - radius; r <= playerY + radius; r++) {
        for (let c = playerX - radius; c <= playerX + radius; c++) {
          if (r >= 0 && r < this.height && c >= 0 && c < this.width) {
            const dist = Math.hypot(c - playerX, r - playerY);
            if (dist <= radius) {
              this.grid[r][c] = 2; // Fully visible
            }
          }
        }
      }
    }

    isVisible(x, y) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        return this.grid[y][x] === 2;
      }
      return false;
    }

    isExplored(x, y) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        return this.grid[y][x] > 0;
      }
      return false;
    }
  }

  // --- NPC Mini-AI & Collision System ---
  class NPCManager {
    constructor() {
      this.npcs = [];
    }

    addNPC(npc) {
      this.npcs.push({
        id: npc.id || Math.random().toString(36).substr(2, 9),
        name: npc.name || 'Aldeano',
        symbol: npc.symbol || '👤',
        x: npc.x,
        y: npc.y,
        homeX: npc.x,
        homeY: npc.y,
        wanderRadius: npc.wanderRadius || 3,
        dialog: npc.dialog || ['Hola aventurero.'],
        role: npc.role || 'villager',
        emote: null,
        emoteTimer: 0,
        moveCooldown: Math.floor(Math.random() * 20) + 10
      });
    }

    update(collisionCheckFn) {
      for (const npc of this.npcs) {
        // Emote timer
        if (npc.emoteTimer > 0) {
          npc.emoteTimer--;
          if (npc.emoteTimer <= 0) npc.emote = null;
        }

        // Mini-AI Wandering
        npc.moveCooldown--;
        if (npc.moveCooldown <= 0) {
          npc.moveCooldown = Math.floor(Math.random() * 40) + 20;

          if (Math.random() < 0.4) {
            const dirs = [{dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:1}, {dx:0,dy:-1}];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const nx = npc.x + d.dx;
            const ny = npc.y + d.dy;

            // Check home wander radius and collision
            const distFromHome = Math.hypot(nx - npc.homeX, ny - npc.homeY);
            if (distFromHome <= npc.wanderRadius && !collisionCheckFn(nx, ny, npc.id)) {
              npc.x = nx;
              npc.y = ny;
            }
          }

          // Random emote
          if (Math.random() < 0.15) {
            const emotes = ['💬', '💭', '🎵', '✨'];
            npc.emote = emotes[Math.floor(Math.random() * emotes.length)];
            npc.emoteTimer = 30;
          }
        }
      }
    }

    getNPCAt(x, y) {
      return this.npcs.find(n => n.x === x && n.y === y);
    }
  }

  // --- Dynamic Enemy Spawner & Invasion Controller ---
  class SpawnerEngine {
    constructor(maxEnemies = 30) {
      this.spawners = [];
      this.maxEnemies = maxEnemies;
      this.timer = 0;
    }

    addSpawner(x, y, enemyType = 'Goblin', spawnRate = 120) {
      this.spawners.push({
        x: x,
        y: y,
        enemyType: enemyType,
        spawnRate: spawnRate,
        cooldown: spawnRate
      });
    }

    update(enemiesList, mapWidth, mapHeight, isValidSpawnTileFn) {
      this.timer++;
      for (const spawner of this.spawners) {
        spawner.cooldown--;
        if (spawner.cooldown <= 0 && enemiesList.length < this.maxEnemies) {
          spawner.cooldown = spawner.spawnRate;

          // Spawn near spawner
          const dirs = [{dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:1}, {dx:0,dy:-1}, {dx:1,dy:1}, {dx:-1,dy:-1}];
          for (const d of dirs) {
            const sx = spawner.x + d.dx;
            const sy = spawner.y + d.dy;
            if (isValidSpawnTileFn(sx, sy)) {
              let hp = 40, atk = 10, xp = 30, gold = 15, symbol = '👾';
              if (spawner.enemyType === 'Esqueleto') { symbol = '💀'; hp = 55; atk = 14; xp = 45; gold = 20; }
              else if (spawner.enemyType === 'Ogro') { symbol = '👹'; hp = 100; atk = 22; xp = 80; gold = 40; }
              else if (spawner.enemyType === 'Traidor') { symbol = '🗡️'; hp = 70; atk = 18; xp = 60; gold = 30; }

              enemiesList.push({
                x: sx,
                y: sy,
                type: spawner.enemyType,
                symbol: symbol,
                hp: hp,
                maxHp: hp,
                atk: atk,
                xpReward: xp,
                goldReward: gold,
                isLeader: Math.random() < 0.1
              });
              break;
            }
          }
        }
      }
    }
  }

  return {
    Audio: new AudioSynthesizer(),
    Particles: new ParticleEngine(),
    Camera: Camera,
    Input: InputController,
    Fog: FogOfWar,
    NPCs: new NPCManager(),
    Spawner: SpawnerEngine
  };
})();
