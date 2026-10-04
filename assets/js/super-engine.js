/**
 * SuperEngine - Shared Engine for Link Minigames (V3.0 Extended)
 * Provides Web Audio API synthesis, Particle System, Viewport Camera,
 * A* Pathfinding (Touch Destination Movement), Vector 3D Canvas Renderer,
 * FOV Fog of War, NPC Mini-AI, Enemy Spawner, and RPG World System Helpers.
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

          case 'splash':
          case 'fish':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(150, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;

          case 'alarm':
          case 'guards':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(900, now + 0.1);
            osc.frequency.setValueAtTime(600, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
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
        case 'water': return '#38bdf8';
        case 'smoke': return '#94a3b8';
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
      let targetX = worldX * this.tileSize + this.tileSize / 2 - this.viewportWidth / 2;
      let targetY = worldY * this.tileSize + this.tileSize / 2 - this.viewportHeight / 2;

      const maxWorldWidth = mapWidth * this.tileSize;
      const maxWorldHeight = mapHeight * this.tileSize;

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

    screenToTile(sx, sy) {
      const offset = this.getOffset();
      const wx = sx + offset.x;
      const wy = sy + offset.y;
      return {
        x: Math.floor(wx / this.tileSize),
        y: Math.floor(wy / this.tileSize)
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

  // --- A* / BFS Pathfinding for Tap-to-Move ---
  class Pathfinder {
    static findPath(start, goal, mapWidth, mapHeight, isBlockedFn) {
      if (start.x === goal.x && start.y === goal.y) return [];
      if (goal.x < 0 || goal.x >= mapWidth || goal.y < 0 || goal.y >= mapHeight) return [];

      // Breadth-First Search (BFS) for reliable tile grid navigation
      const queue = [{ x: start.x, y: start.y, path: [] }];
      const visited = new Set();
      visited.add(`${start.x},${start.y}`);

      const dirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 },
        { x: -1, y: -1 }, { x: 1, y: -1 },
        { x: -1, y: 1 }, { x: 1, y: 1 }
      ];

      let iterations = 0;
      const maxIterations = 1200; // Fast cap for realtime frame

      while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const curr = queue.shift();

        if (curr.x === goal.x && curr.y === goal.y) {
          return curr.path;
        }

        for (const d of dirs) {
          const nx = curr.x + d.x;
          const ny = curr.y + d.y;
          const key = `${nx},${ny}`;

          if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight && !visited.has(key)) {
            // Check if goal itself or if tile is free
            const isGoal = (nx === goal.x && ny === goal.y);
            if (isGoal || !isBlockedFn(nx, ny)) {
              visited.add(key);
              const nextPath = curr.path.concat([{ x: nx, y: ny, dx: d.x, dy: d.y }]);
              queue.push({ x: nx, y: ny, path: nextPath });
            }
          }
        }
      }

      return [];
    }
  }

  // --- Input & Touch Pathfinding Controller ---
  class InputController {
    constructor(onMoveCallback, onActionCallback, onTileTapCallback) {
      this.onMove = onMoveCallback;
      this.onAction = onActionCallback;
      this.onTileTap = onTileTapCallback;
      this.heldDirection = null;
      this.moveInterval = null;
      this.moveSpeedMs = 110;
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

    bindCanvasTouchTap(canvas, camera, mapWidth, mapHeight) {
      if (!canvas) return;

      const handleTap = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const sx = (clientX - rect.left) * scaleX;
        const sy = (clientY - rect.top) * scaleY;

        const tilePos = camera.screenToTile(sx, sy);
        if (this.onTileTap) {
          this.onTileTap(tilePos.x, tilePos.y);
        }
      };

      canvas.addEventListener('click', (e) => handleTap(e.clientX, e.clientY));
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          handleTap(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
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
      this.grid = Array(height).fill(0).map(() => Array(width).fill(0));
    }

    reset() {
      this.grid = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
    }

    update(playerX, playerY, radius = 6) {
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          if (this.grid[r][c] === 2) {
            this.grid[r][c] = 1;
          }
        }
      }

      for (let r = playerY - radius; r <= playerY + radius; r++) {
        for (let c = playerX - radius; c <= playerX + radius; c++) {
          if (r >= 0 && r < this.height && c >= 0 && c < this.width) {
            const dist = Math.hypot(c - playerX, r - playerY);
            if (dist <= radius) {
              this.grid[r][c] = 2;
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

  // --- NPC Mini-AI System ---
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
        moveCooldown: Math.floor(Math.random() * 20) + 10,
        affection: npc.affection || 0,
        isGuarded: npc.isGuarded || false
      });
    }

    update(collisionCheckFn) {
      for (const npc of this.npcs) {
        if (npc.emoteTimer > 0) {
          npc.emoteTimer--;
          if (npc.emoteTimer <= 0) npc.emote = null;
        }

        npc.moveCooldown--;
        if (npc.moveCooldown <= 0) {
          npc.moveCooldown = Math.floor(Math.random() * 40) + 20;

          if (Math.random() < 0.4) {
            const dirs = [{dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:1}, {dx:0,dy:-1}];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const nx = npc.x + d.dx;
            const ny = npc.y + d.dy;

            const distFromHome = Math.hypot(nx - npc.homeX, ny - npc.homeY);
            if (distFromHome <= npc.wanderRadius && !collisionCheckFn(nx, ny, npc.id)) {
              npc.x = nx;
              npc.y = ny;
            }
          }

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

  // --- PROCEDURAL 3D VECTOR GRAPHICS ENGINE ---
  class Vector3DRenderer {
    // Render 3D Vector Hero Character (Cap, Cloak, Armor, Sword, Shield, Shadow, Walk Wobble)
    static drawHero(ctx, px, py, size = 32, isWalking = false) {
      ctx.save();
      const wobble = isWalking ? Math.sin(Date.now() / 100) * 3 : 0;
      const x = px + size / 2;
      const y = py + size / 2 + wobble;

      // Drop Shadow Oval
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x, py + size - 2, size * 0.4, size * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flowing 3D Cape / Cloak
      const capeGrad = ctx.createLinearGradient(x - 12, y - 10, x + 12, y + 10);
      capeGrad.addColorStop(0, '#dc2626');
      capeGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = capeGrad;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 4);
      ctx.lineTo(x + 8, y - 4);
      ctx.lineTo(x + 12 + Math.sin(Date.now() / 150) * 2, y + 12);
      ctx.lineTo(x - 12 - Math.sin(Date.now() / 150) * 2, y + 12);
      ctx.closePath();
      ctx.fill();

      // Boots / Legs
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x - 6, y + 6, 4, 6);
      ctx.fillRect(x + 2, y + 6, 4, 6);

      // Body Armor / Tunic
      const tunicGrad = ctx.createLinearGradient(x - 8, y - 6, x + 8, y + 6);
      tunicGrad.addColorStop(0, '#2563eb');
      tunicGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = tunicGrad;
      ctx.beginPath();
      ctx.roundRect(x - 8, y - 6, 16, 12, 3);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Gold Belt Buckle
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x - 3, y + 2, 6, 3);

      // Head / Skin Tone
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(x, y - 10, 6, 0, Math.PI * 2);
      ctx.fill();

      // Golden Royal Cap / Helmet with Feather Plume
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(x, y - 12, 7, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.stroke();

      // Feather Plume
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 15);
      ctx.quadraticCurveTo(x + 8, y - 20, x + 10, y - 14);
      ctx.stroke();

      // Right Hand - Gleaming 3D Sword
      const swordGrad = ctx.createLinearGradient(x + 8, y - 12, x + 12, y + 4);
      swordGrad.addColorStop(0, '#ffffff');
      swordGrad.addColorStop(0.5, '#94a3b8');
      swordGrad.addColorStop(1, '#475569');
      ctx.strokeStyle = swordGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 2);
      ctx.lineTo(x + 14, y - 10);
      ctx.stroke();

      // Hilt
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 6, y + 1, 5, 2);

      // Left Hand - Shield
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(x - 9, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }

    // Render 3D Vector Monster / NPC (Goblins, Skeletons, Ogres, Demon, Traitor, King, Princess, Guard)
    static drawEntity(ctx, px, py, size = 32, type = 'Goblin', isLeader = false) {
      ctx.save();
      const x = px + size / 2;
      const y = py + size / 2;

      // Drop Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(x, py + size - 2, size * 0.35, size * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      if (type === 'Rey' || type === 'Rey Eldrin') {
        // King Eldrin: Crown, Crimson Mantle, Royal Scepter
        ctx.fillStyle = '#991b1b'; // Mantle
        ctx.beginPath();
        ctx.roundRect(x - 9, y - 6, 18, 14, 4);
        ctx.fill();

        ctx.fillStyle = '#fde047'; // Head
        ctx.beginPath();
        ctx.arc(x, y - 8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Golden Crown
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 12);
        ctx.lineTo(x - 6, y - 18);
        ctx.lineTo(x - 2, y - 14);
        ctx.lineTo(x, y - 19);
        ctx.lineTo(x + 2, y - 14);
        ctx.lineTo(x + 6, y - 18);
        ctx.lineTo(x + 6, y - 12);
        ctx.closePath();
        ctx.fill();

        // Scepter
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 4);
        ctx.lineTo(x + 11, y - 8);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x + 11, y - 9, 3, 0, Math.PI * 2);
        ctx.fill();

      } else if (type === 'Princesa' || type === 'Princesa Elena') {
        // Princess Elena: Elegant Silk Gown, Tiara, Glowing Flowers
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(x - 9, y + 8);
        ctx.lineTo(x, y - 6);
        ctx.lineTo(x + 9, y + 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(x, y - 9, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Tiara
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - 12, 4, Math.PI, 0);
        ctx.stroke();

      } else if (type === 'Guardia' || type === 'Capitán Bruno' || type === 'Guardia Traidor') {
        // Guard / Traitor Knight: Full Steel Armor, Visor Helm, Halberd
        ctx.fillStyle = (type === 'Guardia Traidor') ? '#450a0a' : '#1e293b';
        ctx.fillRect(x - 7, y - 5, 14, 11);

        // Steel Helm
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(x, y - 9, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a'; // Visor slit
        ctx.fillRect(x - 4, y - 10, 8, 2);

        // Halberd / Spear
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 8);
        ctx.lineTo(x + 8, y - 15);
        ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(x + 8, y - 18);
        ctx.lineTo(x + 5, y - 13);
        ctx.lineTo(x + 11, y - 13);
        ctx.closePath();
        ctx.fill();

      } else if (type === 'Goblin' || type === 'Goblin Salvaje') {
        // Goblin: Green skin, pointed ears, dagger
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(x, y - 6, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Pointed ears
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 8);
        ctx.lineTo(x - 10, y - 10);
        ctx.lineTo(x - 5, y - 4);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 5, y - 8);
        ctx.lineTo(x + 10, y - 10);
        ctx.lineTo(x + 5, y - 4);
        ctx.fill();

        // Leather vest
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 6, y - 1, 12, 8);

        // Red glowing eyes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 3, y - 7, 2, 2);
        ctx.fillRect(x + 1, y - 7, 2, 2);

      } else if (type === 'Esqueleto') {
        // Skeleton: Bone ribs, skull, wooden shield
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(x, y - 7, 5, 0, Math.PI * 2);
        ctx.fill();

        // Black eye sockets
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 3, y - 8, 2, 2);
        ctx.fillRect(x + 1, y - 8, 2, 2);

        // Ribs
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 1); ctx.lineTo(x + 5, y - 1);
        ctx.moveTo(x - 4, y + 2); ctx.lineTo(x + 4, y + 2);
        ctx.moveTo(x - 3, y + 5); ctx.lineTo(x + 3, y + 5);
        ctx.stroke();

      } else if (type === 'Señor Demonio' || type === 'Ogro' || type === 'Ogro Devastador' || type === 'Capataz Rebelde') {
        // Demon / Ogre: Massive muscular frame, horns, spiked iron club, flame aura
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (type === 'Señor Demonio') ? '#881337' : '#9a3412';
        ctx.beginPath();
        ctx.roundRect(x - 10, y - 7, 20, 15, 4);
        ctx.fill();

        // Horned Head
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(x, y - 9, 7, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 12); ctx.lineTo(x - 11, y - 18);
        ctx.moveTo(x + 5, y - 12); ctx.lineTo(x + 11, y - 18);
        ctx.stroke();

        // Spiked Club
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.arc(x + 11, y - 2, 5, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Generic Townsfolk / NPC
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(x - 6, y - 4, 12, 10, 3);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(x, y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Render 3D Vector Castle Gate & Towers
    static drawCastleStructure(ctx, px, py, size = 32, type = 'wall') {
      ctx.save();

      if (type === 'gate') {
        // Grand 3D Castle Gate with Conical Roof Towers
        ctx.fillStyle = '#475569';
        ctx.fillRect(px, py, size, size);

        // Arch Gate Passage
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(px + size / 2, py + size, size * 0.35, Math.PI, 0);
        ctx.fill();

        // Iron Portcullis Grate
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -10; i <= 10; i += 4) {
          ctx.moveTo(px + size / 2 + i, py + size - 10);
          ctx.lineTo(px + size / 2 + i, py + size);
        }
        ctx.stroke();

        // Fluttering Royal Banner
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + size / 2 - 2, py + 2, 4, 8);

      } else if (type === 'tower') {
        // Round 3D Tower with Conical Roof
        const wallGrad = ctx.createLinearGradient(px, py, px + size, py);
        wallGrad.addColorStop(0, '#64748b');
        wallGrad.addColorStop(0.5, '#94a3b8');
        wallGrad.addColorStop(1, '#334155');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(px, py + 8, size, size - 8);

        // Conical Roof
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.moveTo(px - 2, py + 8);
        ctx.lineTo(px + size / 2, py - 6);
        ctx.lineTo(px + size + 2, py + 8);
        ctx.closePath();
        ctx.fill();

      } else {
        // Standard 3D Castle Wall with Battlements
        const wallGrad = ctx.createLinearGradient(px, py, px, py + size);
        wallGrad.addColorStop(0, '#64748b');
        wallGrad.addColorStop(1, '#334155');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(px, py, size, size);

        // Battlements
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 2, py, 6, 5);
        ctx.fillRect(px + 13, py, 6, 5);
        ctx.fillRect(px + 24, py, 6, 5);
        ctx.strokeStyle = '#0f172a';
        ctx.strokeRect(px, py, size, size);
      }

      ctx.restore();
    }

    // Render 3D Vector House with Shingled Roof & Glowing Window
    static drawHouseStructure(ctx, px, py, size = 32) {
      ctx.save();

      // House Body
      const bodyGrad = ctx.createLinearGradient(px, py, px + size, py + size);
      bodyGrad.addColorStop(0, '#78350f');
      bodyGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(px + 2, py + 10, size - 4, size - 10);

      // 3D Roof
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(px, py + 10);
      ctx.lineTo(px + size / 2, py);
      ctx.lineTo(px + size, py + 10);
      ctx.closePath();
      ctx.fill();

      // Glowing Window
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px + 6, py + 14, 6, 6);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 6, py + 14, 6, 6);

      // Wooden Door
      ctx.fillStyle = '#27272a';
      ctx.fillRect(px + 18, py + 16, 8, 12);

      ctx.restore();
    }

    // Render 3D Vector Tree with Layered Canopy
    static draw3DTree(ctx, px, py, size = 32) {
      ctx.save();
      const x = px + size / 2;
      const y = py + size / 2;

      // Trunk
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x - 3, y + 2, 6, size / 2 - 2);

      // Layered Canopy
      const c1 = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 12);
      c1.addColorStop(0, '#34d399');
      c1.addColorStop(1, '#065f46');
      ctx.fillStyle = c1;

      ctx.beginPath();
      ctx.arc(x, y - 6, 12, 0, Math.PI * 2);
      ctx.arc(x - 5, y + 2, 8, 0, Math.PI * 2);
      ctx.arc(x + 5, y + 2, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Render 3D Vector Animals (Horses, Deer, Sheep, Dogs, Fish)
    static drawAnimal(ctx, px, py, size = 32, type = 'horse') {
      ctx.save();
      const x = px + size / 2;
      const y = py + size / 2;

      if (type === 'horse') {
        // Brown Horse with Saddle
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head & Neck
        ctx.beginPath();
        ctx.ellipse(x - 8, y - 5, 5, 3, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Saddle
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x - 3, y - 5, 6, 8);

      } else if (type === 'sheep') {
        // Wooly White Sheep
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.arc(x - 4, y - 2, 5, 0, Math.PI * 2);
        ctx.arc(x + 4, y - 2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x - 8, y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

      } else if (type === 'fish') {
        // Fish in water
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 6, y);
        ctx.lineTo(x + 10, y - 3);
        ctx.lineTo(x + 10, y + 3);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- RPG SYSTEM & LIVING WORLD GAMEPLAY HELPERS ---
  class RPGSystem {
    // Stealing / Pickpocketing System
    static attemptSteal(player, targetNpc) {
      const chance = 0.5 + (player.lvl || 1) * 0.05;
      const success = Math.random() < chance;

      if (success) {
        const goldStolen = 20 + Math.floor(Math.random() * 40);
        player.gold = (player.gold || 0) + goldStolen;
        return { success: true, gold: goldStolen, message: `💰 ¡Le robaste ${goldStolen} monedas de oro a ${targetNpc.name}!` };
      } else {
        return { success: false, message: `🚨 ¡${targetNpc.name} te descubrió! "¡ALADRÓN! ¡GUARDIAS!"` };
      }
    }

    // Poison System
    static applyPoison(target, damage = 30) {
      target.hp -= damage;
      target.isPoisoned = true;
      if (target.hp <= 0) target.hp = 0;
      return { killed: target.hp <= 0, damage: damage };
    }

    // Jailbreak / Prison Mechanics
    static attemptPrisonEscape(player, method = 'lockpick') {
      if (method === 'lockpick') {
        const success = Math.random() < 0.6;
        return { success: success, message: success ? '🔓 ¡Forzaste la cerradura y escapaste!' : '💥 La ganzúa se rompió...' };
      } else if (method === 'bribe') {
        if ((player.gold || 0) >= 50) {
          player.gold -= 50;
          return { success: true, message: '💰 Sobornaste al carcelero y te dejó ir en silencio.' };
        }
        return { success: false, message: '⚠️ No tienes 50 de oro para el soborno.' };
      }
      return { success: false, message: 'Acción fallida.' };
    }

    // Romance & Courting System
    static courtNpc(player, targetNpc) {
      targetNpc.affection = (targetNpc.affection || 0) + 25;
      if (targetNpc.affection >= 100) {
        return { maxed: true, message: `💍 ¡${targetNpc.name} se ha enamorado locamente de ti! Puedes proponer matrimonio.` };
      }
      return { maxed: false, message: `💖 Le diste un regalo a ${targetNpc.name}. Afecto: ${targetNpc.affection}%` };
    }

    // Fishing System
    static startFishing(player) {
      const roll = Math.random();
      if (roll < 0.5) {
        const goldVal = 15 + Math.floor(Math.random() * 25);
        player.gold = (player.gold || 0) + goldVal;
        return { type: 'fish', value: goldVal, message: `🐟 ¡Atrapaste una Trucha Dorada (+${goldVal} Oro)!` };
      } else if (roll < 0.8) {
        player.hpPots = (player.hpPots || 0) + 1;
        return { type: 'item', message: '🧪 ¡Pescaste un Cofre Hundido con una Poción de Vida!' };
      } else {
        return { type: 'boot', message: '👟 Pescaste una bota vieja del río...' };
      }
    }
  }

  return {
    Audio: new AudioSynthesizer(),
    Particles: new ParticleEngine(),
    Camera: Camera,
    Pathfinder: Pathfinder,
    Input: InputController,
    Fog: FogOfWar,
    NPCs: new NPCManager(),
    Spawner: SpawnerEngine,
    VectorRenderer: Vector3DRenderer,
    RPG: RPGSystem
  };
})();
