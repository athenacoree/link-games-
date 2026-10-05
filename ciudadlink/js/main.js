/**
 * CIUDAD LINK - MAIN GAME LOOP, PSEUDO-3D RENDERING, CONTINUOUS TOUCH CONTROLS & AVATAR SELECTION
 * Handles 3D depth rendering of the city, selective local quadrant simulation, priority routing,
 * smooth natural movement animations, radio music integration, and citizen interactions.
 */

(function () {
  'use strict';

  let canvas, ctx;

  // Active Player Character State with Leveling, Pet, Equipment & Achievements
  let player = {
    avatarId: 'hero_link',
    name: 'Link',
    title: 'Héroe Urbano',
    badge: '🧝',
    level: 1,
    xp: 0,
    nextXp: 500,
    color: '#22c55e',
    hatColor: '#16a34a',
    shirtColor: '#22c55e',
    pantsColor: '#15803d',
    skinTone: '#fde047',
    hairColor: '#1e293b',
    accessory: 'cap', // 'none', 'cap', 'glasses', 'sunglasses', 'mask', 'crown'
    equippedWeapon: 'taser', // 'none', 'taser', 'shield', 'flashlight', 'laser'
    bankSavings: 500,
    ownedProperties: [],
    bountiesClaimed: 0,
    pet: { name: 'Firulais', badge: '🐕', x: 50, y: 13, renderX: 50, renderY: 13 },
    phoneWallpaper: 'cyberpunk', // 'dark', 'cyberpunk', 'sunset', 'matrix'
    achievements: [],
    activeEmote: null,
    emoteTimer: 0,
    x: 50, y: 12,
    renderX: 50, renderY: 12,
    walkAnimPhase: 0,
    money: 600,
    health: 100, maxHealth: 100,
    energy: 100, maxEnergy: 100,
    stamina: 100, maxStamina: 100,
    hunger: 90, maxHunger: 100,
    sleep: 90, maxSleep: 100,
    mood: 85, maxMood: 100,
    spouse: null,
    isWalking: false,
    isSprinting: false,
    gameMode: 'SIMS',
    facing: 'S',
    path: [],
    insideBuilding: null,
    interiorFloor: 1,
    currentHotelId: null,
    currentFloor: 1,
    inventory: [],
    logHistory: ['🌟 Bienvenido a Ciudad Link — Simulador Urbano 3D.']
  };

  let showMiniMap = false;

  let camera = { x: 0, y: 0 };
  let lastTime = performance.now();

  // Weather System State
  let currentWeather = 'CLEAR';
  let weatherTimer = 0;

  // Radio Audio State
  let isRadioPlaying = false;
  let currentRadioStationIdx = 0;

  // Continuous Pointer/Touch Interaction
  let isPointerDown = false;
  let pointerWorldPos = { x: 50, y: 12 };

  function addLog(msg) {
    const timeStr = window.CiudadLinkNPCs ? window.CiudadLinkNPCs.getTimeFormatted() : '08:00';
    player.logHistory.unshift(`[${timeStr}] ${msg}`);
    if (player.logHistory.length > 50) player.logHistory.pop();
  }

  function initGame() {
    canvas = document.getElementById('cityCanvas');
    ctx = canvas.getContext('2d');

    // Initialize City Map, Traffic Vehicles & NPCs
    window.CiudadLinkMap.initCityMap();
    window.CiudadLinkVehicles.initTraffic(window.CiudadLinkMap.MAP_WIDTH, window.CiudadLinkMap.MAP_HEIGHT, window.CiudadLinkMap.TILE_SIZE);
    window.CiudadLinkNPCs.spawnPopulation(window.CiudadLinkMap.hotels);

    // Initial player inventory from catalog
    player.inventory = [
      window.CiudadLinkData.ITEMS[0],
      window.CiudadLinkData.ITEMS[2],
      window.CiudadLinkData.ITEMS[8]
    ];

    setupEventListeners();
    updateUI();
    requestAnimationFrame(gameLoop);
  }

  function gameLoop(now) {
    let deltaSec = (now - lastTime) / 1000;
    if (deltaSec > 0.1) deltaSec = 0.1;
    lastTime = now;

    update(deltaSec);
    render();

    requestAnimationFrame(gameLoop);
  }

  function update(deltaSec) {
    const tileSize = window.CiudadLinkMap.TILE_SIZE;

    // Handle Continuous Pointer Drag/Hold Walking towards touch target
    if (isPointerDown) {
      const targetTileX = Math.floor(pointerWorldPos.x / tileSize);
      const targetTileY = Math.floor(pointerWorldPos.y / tileSize);

      if (targetTileX !== player.x || targetTileY !== player.y) {
        const dx = Math.sign(targetTileX - player.x);
        const dy = Math.sign(targetTileY - player.y);

        let nextX = player.x;
        let nextY = player.y;

        if (Math.abs(targetTileX - player.x) >= Math.abs(targetTileY - player.y)) {
          nextX = player.x + dx;
        } else {
          nextY = player.y + dy;
        }

        if (window.CiudadLinkMap.isTileWalkable(nextX, nextY)) {
          player.x = nextX;
          player.y = nextY;
          player.isWalking = true;
          player.facing = dx > 0 ? 'E' : (dx < 0 ? 'W' : (dy > 0 ? 'S' : 'N'));

          if (window.SuperEngine && window.SuperEngine.Audio && Math.random() < 0.2) {
            window.SuperEngine.Audio.playSFX('step');
          }
        }
      }
    } else if (player.path && player.path.length > 0) {
      // Pathwalking priority A*
      player.isWalking = true;
      let nextTile = player.path.shift();
      player.facing = nextTile.x > player.x ? 'E' : (nextTile.x < player.x ? 'W' : (nextTile.y > player.y ? 'S' : 'N'));
      player.x = nextTile.x;
      player.y = nextTile.y;

      if (window.SuperEngine && window.SuperEngine.Audio && Math.random() < 0.25) {
        window.SuperEngine.Audio.playSFX('step');
      }
    } else {
      player.isWalking = false;
    }

    // Smooth Sub-Tile Interpolation for Natural Human Movement
    const isDriving = !!window.CiudadLinkVehicles.hijackedVehicle;
    const lerpSpeed = isDriving ? 0.35 : (player.isSprinting ? 0.25 : 0.18);
    player.renderX += (player.x - player.renderX) * lerpSpeed;
    player.renderY += (player.y - player.renderY) * lerpSpeed;

    if (player.isWalking) {
      player.walkAnimPhase += deltaSec * (player.isSprinting ? 14 : 9);
    } else {
      player.walkAnimPhase = 0;
    }

    // Weather Cycle logic
    weatherTimer += deltaSec;
    if (weatherTimer > 90) {
      weatherTimer = 0;
      const weathers = ['CLEAR', 'RAIN', 'THUNDERSTORM', 'FOG'];
      currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
      addLog(`🌤️ Clima Urbano cambió a: ${currentWeather}`);
    }

    // Track Player's Active World Sector & 10x10x10 Hierarchical Quadrant
    const currentSector = window.CiudadLinkMap.getSectorForPos(player.x, player.y);
    window.CiudadLinkMap.setActiveSector(currentSector);

    // Update Tile Occupancy Grid (ON / OFF states)
    window.CiudadLinkMap.updateOccupancyState(window.CiudadLinkNPCs.npcs, window.CiudadLinkVehicles.vehicles, player);

    // Update Persistent NPC AI Simulation & Traffic Vehicles
    window.CiudadLinkNPCs.updateNPCSimulation(deltaSec, player.isWalking);
    window.CiudadLinkVehicles.updateVehicles(deltaSec, player.x, player.y);

    // Update Active Mission Objectives & Progress
    if (window.CiudadLinkMissions) {
      window.CiudadLinkMissions.updateMissionProgress(player.x, player.y);
    }

    // Update Multiplayer Networking & Proximity Voice Spatial Volume Calculation
    if (window.CiudadLinkMultiplayer) {
      if (window.CiudadLinkMultiplayer.isConnected) {
        window.CiudadLinkMultiplayer.broadcastPlayerState(player);
      }
      window.CiudadLinkMultiplayer.updateProximityAudio(player.renderX, player.renderY);
    }

    // Update Pet Dog Companion Position (Follows Player smoothly 1 tile behind)
    if (player.pet) {
      const petDx = player.x - player.pet.x;
      const petDy = player.y - player.pet.y;
      if (Math.abs(petDx) > 1 || Math.abs(petDy) > 1) {
        player.pet.x += Math.sign(petDx);
        player.pet.y += Math.sign(petDy);
      }
      player.pet.renderX += (player.pet.x - player.pet.renderX) * 0.2;
      player.pet.renderY += (player.pet.y - player.pet.renderY) * 0.2;
    }

    // Stamina Regeneration & Sprint Consumption
    if (player.isSprinting && player.isWalking) {
      player.stamina = Math.max(0, player.stamina - deltaSec * 15);
      if (player.stamina <= 0) toggleSprint();
    } else {
      player.stamina = Math.min(100, player.stamina + deltaSec * 10);
    }

    // Update Camera smoothly centered on Player's smooth render position
    const targetCamX = player.renderX * tileSize - canvas.width / 2 + tileSize / 2;
    const targetCamY = player.renderY * tileSize - canvas.height / 2 + tileSize / 2;
    camera.x += (targetCamX - camera.x) * 0.15;
    camera.y += (targetCamY - camera.y) * 0.15;

    // Update HUD Metrics
    const elemTime = document.getElementById('hudTime');
    if (elemTime) elemTime.textContent = '🕒 ' + window.CiudadLinkNPCs.getTimeFormatted();

    const quadHier = window.CiudadLinkMap.getQuadrantHierarchy(player.x, player.y);
    const elemSector = document.getElementById('hudSubSector');
    if (elemSector) elemSector.textContent = `📍 ${quadHier.code}`;

    const elemAvatar = document.getElementById('hudAvatar');
    if (elemAvatar) elemAvatar.textContent = `${player.badge} ${player.name}`;

    const elemLevel = document.getElementById('hudLevel');
    if (elemLevel) elemLevel.textContent = `⭐ Nivel ${player.level} (${player.xp}/${player.nextXp} XP)`;

    const elemState = document.getElementById('hudState');
    if (elemState) {
      const modeStr = isDriving ? '🚘 Conduciendo' : (player.insideBuilding ? `🏢 ${player.insideBuilding.name}` : (player.isWalking ? '🏃 Caminando' : '🧘 Descansando'));
      elemState.textContent = modeStr;
    }

    const elemMoney = document.getElementById('hudMoney');
    if (elemMoney) elemMoney.textContent = `💰 $${player.money}`;

    const elemHealth = document.getElementById('hudHealth');
    if (elemHealth) elemHealth.textContent = `❤️ ${player.health}/${player.maxHealth} HP`;

    const elemEnergy = document.getElementById('hudEnergy');
    if (elemEnergy) elemEnergy.textContent = `⚡ ${Math.round(player.energy)}/${player.maxEnergy}`;

    const elemWanted = document.getElementById('hudWanted');
    if (elemWanted) {
      const wantedStars = window.CiudadLinkVehicles.wantedLevel;
      elemWanted.textContent = wantedStars > 0 ? '⭐'.repeat(wantedStars) : '⭐ Limpio';
    }
  }

  // Weather Particle Engine
  let rainParticles = [];
  let fogClouds = [];

  function initVisualParticles() {
    rainParticles = [];
    for (let i = 0; i < 120; i++) {
      rainParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: 8 + Math.random() * 12,
        speed: 12 + Math.random() * 8
      });
    }

    fogClouds = [];
    for (let i = 0; i < 8; i++) {
      fogClouds.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: 100 + Math.random() * 150,
        speedX: 0.2 + Math.random() * 0.3
      });
    }
  }

  // MAIN PSEUDO-3D CITY RENDERER WITH ENHANCED GRAPHICS & VISUAL FX
  function render() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (rainParticles.length === 0) initVisualParticles();

    // IF PLAYER IS INSIDE A BUILDING INTERIOR -> RENDER INTERIOR MODE
    if (player.insideBuilding) {
      renderBuildingInteriorMode();
      return;
    }

    const tileSize = window.CiudadLinkMap.TILE_SIZE;
    const grid = window.CiudadLinkMap.grid;
    const mapW = window.CiudadLinkMap.MAP_WIDTH;
    const mapH = window.CiudadLinkMap.MAP_HEIGHT;
    const timeOfDay = window.CiudadLinkNPCs.timeOfDay;
    const isNight = (timeOfDay < 6.0 || timeOfDay >= 19.0);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Ground Tiles Grid within local micro-quadrants visible on viewport
    const minCol = Math.max(0, Math.floor((camera.x - 64) / tileSize));
    const maxCol = Math.min(mapW - 1, Math.ceil((camera.x + canvas.width + 64) / tileSize));
    const minRow = Math.max(0, Math.floor((camera.y - 64) / tileSize));
    const maxRow = Math.min(mapH - 1, Math.ceil((camera.y + canvas.height + 64) / tileSize));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const sx = c * tileSize;
        const sy = r * tileSize;
        const tileType = grid[r][c];

        if (tileType === window.CiudadLinkMap.TILE.ROAD) {
          // Asphalt texture with subtle dark gradient
          const roadGrad = ctx.createLinearGradient(sx, sy, sx + tileSize, sy + tileSize);
          roadGrad.addColorStop(0, '#1e293b');
          roadGrad.addColorStop(1, '#334155');
          ctx.fillStyle = roadGrad;
          ctx.fillRect(sx, sy, tileSize, tileSize);

          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.CROSSWALK) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.fillStyle = '#f8fafc'; // Crisp zebra lines
          ctx.fillRect(sx + 4, sy + 2, tileSize - 8, 5);
          ctx.fillRect(sx + 4, sy + 12, tileSize - 8, 5);
          ctx.fillRect(sx + 4, sy + 22, tileSize - 8, 5);
        } else if (tileType === window.CiudadLinkMap.TILE.STREET) {
          // Polished concrete sidewalk pavement
          ctx.fillStyle = '#475569';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(sx + 1, sy + 1, tileSize - 2, tileSize - 2);
          // 3D Curb highlight
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(sx, sy, tileSize, 2);
        } else if (tileType === window.CiudadLinkMap.TILE.PARK) {
          // Rich vibrant grass with texture dots
          const grassGrad = ctx.createLinearGradient(sx, sy, sx, sy + tileSize);
          grassGrad.addColorStop(0, '#15803d');
          grassGrad.addColorStop(1, '#166534');
          ctx.fillStyle = grassGrad;
          ctx.fillRect(sx, sy, tileSize, tileSize);

          ctx.fillStyle = '#22c55e';
          ctx.fillRect(sx + 4, sy + 6, 2, 3);
          ctx.fillRect(sx + 18, sy + 20, 2, 3);
        } else if (tileType === window.CiudadLinkMap.TILE.LAKE) {
          // Dynamic water sheen with moving ripples
          const waterGrad = ctx.createLinearGradient(sx, sy, sx + tileSize, sy + tileSize);
          waterGrad.addColorStop(0, '#0284c7');
          waterGrad.addColorStop(1, '#0369a1');
          ctx.fillStyle = waterGrad;
          ctx.fillRect(sx, sy, tileSize, tileSize);

          const ripple = Math.sin((performance.now() * 0.003) + (c + r)) * 4;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.fillRect(sx + 6 + ripple, sy + 12, 12, 2);
        } else if (tileType === window.CiudadLinkMap.TILE.FOUNTAIN) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(sx + tileSize / 2, sy + tileSize / 2, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(sx + tileSize / 2, sy + tileSize / 2, 7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        }
      }
    }

    // 2. Y-SORTING ENTITIES WITHIN VISIBLE ACTIVE QUADRANTS
    const renderList = [];

    // Buildings
    window.CiudadLinkMap.buildings.forEach(b => {
      if (b.x + b.w >= minCol && b.x <= maxCol && b.y + b.h >= minRow && b.y <= maxRow) {
        renderList.push({
          type: 'BUILDING',
          yOrder: (b.y + b.h) * tileSize,
          data: b
        });
      }
    });

    // Environmental Objects (Trees, Streetlights, Benches)
    window.CiudadLinkMap.environmentalObjects.forEach(obj => {
      if (obj.x >= minCol && obj.x <= maxCol && obj.y >= minRow && obj.y <= maxRow) {
        renderList.push({
          type: 'ENV_OBJ',
          yOrder: (obj.y + 1) * tileSize,
          data: obj
        });
      }
    });

    // Cars & Vehicles
    window.CiudadLinkVehicles.vehicles.forEach(v => {
      if (v.x >= minCol - 2 && v.x <= maxCol + 2 && v.y >= minRow - 2 && v.y <= maxRow + 2) {
        renderList.push({
          type: 'VEHICLE',
          yOrder: (v.y + 0.5) * tileSize,
          data: v
        });
      }
    });

    // NPCs with smooth sub-tile rendering coordinates
    window.CiudadLinkNPCs.npcs.forEach(npc => {
      if (npc.x >= minCol - 1 && npc.x <= maxCol + 1 && npc.y >= minRow - 1 && npc.y <= maxRow + 1) {
        renderList.push({
          type: 'NPC',
          yOrder: ((npc.renderY !== undefined ? npc.renderY : npc.y) + 0.5) * tileSize,
          data: npc
        });
      }
    });

    // Dogs
    window.CiudadLinkVehicles.dogs.forEach(d => {
      if (d.x >= minCol && d.x <= maxCol && d.y >= minRow && d.y <= maxRow) {
        renderList.push({
          type: 'DOG',
          yOrder: (d.y + 0.5) * tileSize,
          data: d
        });
      }
    });

    // Player Character (If not driving inside a car)
    if (!window.CiudadLinkVehicles.hijackedVehicle) {
      renderList.push({
        type: 'PLAYER',
        yOrder: (player.renderY + 0.5) * tileSize,
        data: player
      });
    }

    // Sort by Y-coordinate for correct depth overlap
    renderList.sort((a, b) => a.yOrder - b.yOrder);

    // 3. Render all Depth-Sorted Entities
    renderList.forEach(item => {
      if (item.type === 'BUILDING') {
        renderBuilding3D(ctx, item.data, tileSize, isNight);
      } else if (item.type === 'ENV_OBJ') {
        renderEnvironmentalObject3D(ctx, item.data, tileSize, isNight);
      } else if (item.type === 'VEHICLE') {
        window.CiudadLinkVehicles.renderVehicle(ctx, item.data, tileSize, isNight);
      } else if (item.type === 'DOG') {
        window.CiudadLinkVehicles.renderDog(ctx, item.data, tileSize);
      } else if (item.type === 'NPC') {
        renderNPC3D(ctx, item.data, tileSize, isNight);
      } else if (item.type === 'PLAYER') {
        renderPlayer3D(ctx, player, tileSize, isNight);
      }
    });

    // Render Pet Dog Companion
    if (player.pet) {
      const px = player.pet.renderX * tileSize + tileSize / 2;
      const py = player.pet.renderY * tileSize + tileSize / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(px, py + 6, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.pet.badge, px, py + 2);
      ctx.restore();
    }

    // Render Overhead Helicopters on Top Z-Layer
    window.CiudadLinkVehicles.helicopters.forEach(h => {
      window.CiudadLinkVehicles.renderHelicopterOverhead(ctx, h, tileSize, isNight);
    });

    // Render Multiplayer Remote Player Avatars
    if (window.CiudadLinkMultiplayer && window.CiudadLinkMultiplayer.isConnected) {
      window.CiudadLinkMultiplayer.renderRemotePlayers(ctx, tileSize, isNight);
    }

    ctx.restore();

    // 4. Day/Night Lighting Blend & Dynamic Streetlamp Lighting Glow
    const nightTint = window.CiudadLinkNPCs.getLightingOverlay();
    if (nightTint > 0) {
      ctx.fillStyle = `rgba(15, 23, 42, ${nightTint})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 5. Enhanced Weather Particle Systems & Lighting Flashes
    if (currentWeather === 'RAIN' || currentWeather === 'THUNDERSTORM') {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 1.2;

      rainParticles.forEach(pt => {
        pt.y += pt.speed;
        pt.x -= 2;
        if (pt.y > canvas.height) {
          pt.y = -10;
          pt.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x - 3, pt.y + pt.length);
        ctx.stroke();
      });

      if (currentWeather === 'THUNDERSTORM' && Math.random() < 0.02) {
        // Soft thunder flash light
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else if (currentWeather === 'FOG') {
      fogClouds.forEach(cloud => {
        cloud.x += cloud.speedX;
        if (cloud.x - cloud.radius > canvas.width) {
          cloud.x = -cloud.radius;
        }

        const fogGrad = ctx.createRadialGradient(cloud.x, cloud.y, 10, cloud.x, cloud.y, cloud.radius);
        fogGrad.addColorStop(0, 'rgba(203, 213, 225, 0.18)');
        fogGrad.addColorStop(1, 'rgba(203, 213, 225, 0)');
        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 6. Interactive Canvas Mini-Map Radar Overlay
    if (showMiniMap) {
      renderMiniMapRadar(ctx);
    }

    // 7. Mission Target Indicator Pointer Arrow
    if (window.CiudadLinkMissions && window.CiudadLinkMissions.activeMissionIdx >= 0) {
      const activeM = window.CiudadLinkMissions.MISSIONS[window.CiudadLinkMissions.activeMissionIdx];
      const stIdx = window.CiudadLinkMissions.currentStageIdx;
      const stage = activeM.stages[stIdx];

      if (stage && stage.targetX !== undefined) {
        const tx = stage.targetX * tileSize - camera.x + tileSize / 2;
        const ty = stage.targetY * tileSize - camera.y + tileSize / 2;

        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        const pulse = Math.sin(Date.now() * 0.008) * 6;
        ctx.beginPath();
        ctx.arc(tx, ty - 30 + pulse, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎯', tx, ty - 26 + pulse);
        ctx.restore();
      }
    }
  }

  // BUILDING INTERIOR RENDERER
  function renderBuildingInteriorMode() {
    const b = player.insideBuilding;
    const floor = player.interiorFloor || 1;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const marginX = 80;
    const marginY = 60;
    const roomW = canvas.width - (marginX * 2);
    const roomH = canvas.height - (marginY * 2);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(marginX, marginY, roomW, roomH);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(marginX + 4, marginY + 4, roomW - 8, roomH - 8);

    ctx.fillStyle = '#334155';
    ctx.fillRect(marginX + roomW * 0.5 - 2, marginY + 4, 4, roomH - 8);
    ctx.fillRect(marginX + 4, marginY + roomH * 0.5 - 2, roomW - 8, 4);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(marginX + roomW * 0.5 - 15, marginY + roomH * 0.25, 30, 20);
    ctx.fillRect(marginX + roomW * 0.25, marginY + roomH * 0.5 - 15, 20, 30);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(marginX + 30, marginY + 30, 60, 40);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(marginX + roomW - 90, marginY + 30, 60, 80);
    ctx.fillRect(marginX + 30, marginY + roomH - 70, 70, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`🏢 ${b.name} — Floor ${floor} (Interior Cargado)`, marginX + 10, marginY - 15);

    const px = canvas.width / 2;
    const py = canvas.height / 2 + 20;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + 8, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = player.shirtColor || '#22c55e';
    ctx.fillRect(px - 10, py - 14, 20, 14);

    ctx.fillStyle = player.skinTone || '#fde047';
    ctx.beginPath();
    ctx.arc(px, py - 20, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.badge} ${player.name} (Piso ${floor})`, px, py - 35);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(10, 10, 300, 40);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 300, 40);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🚪 Toca la pantalla o usa el botón para salir.`, 20, 34);
  }

  // 2.5D PSEUDO-3D BUILDING RENDERER
  function renderBuilding3D(ctx, b, tileSize, isNight) {
    const bx = b.x * tileSize;
    const by = b.y * tileSize;
    const bw = b.w * tileSize;
    const bh = b.h * tileSize;
    const height = b.height || 28;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(bx + height * 0.4, by + bh, bw, height * 0.3);

    ctx.fillStyle = b.wallColor || '#1e293b';
    ctx.fillRect(bx, by - height, bw, bh);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(bx + bw, by - height);
    ctx.lineTo(bx + bw + height * 0.3, by - height - height * 0.2);
    ctx.lineTo(bx + bw + height * 0.3, by + bh - height * 0.2);
    ctx.lineTo(bx + bw, by + bh);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = b.roofColor || '#334155';
    ctx.fillRect(bx, by - height, bw, 10);

    const numCols = Math.min(8, Math.max(2, Math.floor(bw / 48)));
    const numRows = Math.min(8, Math.max(2, Math.floor((bh - 20) / 36)));
    const winW = Math.floor((bw - 16) / numCols) - 8;
    const winH = Math.floor((bh - 20) / numRows) - 8;

    if (winW > 4 && winH > 4) {
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          const wx = bx + 10 + c * (winW + 8);
          const wy = by - height + 16 + r * (winH + 8);

          ctx.fillStyle = isNight && Math.sin(wx * 0.1 + wy * 0.2) > -0.1 ? '#fef08a' : '#38bdf8';
          ctx.fillRect(wx, wy, winW, winH);
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(wx, wy, winW, winH);
        }
      }
    }

    ctx.fillStyle = b.accentColor || '#38bdf8';
    ctx.fillRect(bx + bw / 2 - 10, by + bh - 16 - height, 20, 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(b.name, bx + 6, by - height + 12);

    ctx.restore();
  }

  // 3D ENVIRONMENTAL OBJECTS RENDERER
  function renderEnvironmentalObject3D(ctx, obj, tileSize, isNight) {
    const ox = obj.x * tileSize + tileSize / 2;
    const oy = obj.y * tileSize + tileSize / 2;

    ctx.save();

    if (obj.type === 'TREE') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(ox + 4, oy + 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.fillRect(ox - 3, oy - 14, 6, 14);

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(ox, oy - 22, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(ox - 2, oy - 25, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === 'LIGHT') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox - 2, oy - 22, 4, 22);

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(ox, oy - 22, 5, 0, Math.PI * 2);
      ctx.fill();

      if (isNight) {
        const lightGrad = ctx.createRadialGradient(ox, oy, 2, ox, oy, 35);
        lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, 35, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (obj.type === 'BENCH') {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(ox - 10, oy - 4, 20, 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(ox - 9, oy - 4, 2, 8);
      ctx.fillRect(ox + 7, oy - 4, 2, 8);
    }

    ctx.restore();
  }

  // 3D CHARACTER / NPC RENDERER WITH NATURAL SMOOTH SUB-TILE MOVEMENTS
  function renderNPC3D(ctx, npc, tileSize, isNight) {
    const rx = (npc.renderX !== undefined ? npc.renderX : npc.x);
    const ry = (npc.renderY !== undefined ? npc.renderY : npc.y);
    const nx = rx * tileSize + tileSize / 2;
    const ny = ry * tileSize + tileSize / 2;

    ctx.save();

    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(nx, ny + 8, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Pants
    ctx.fillStyle = npc.pantsColor || '#1e293b';
    ctx.fillRect(nx - 5, ny, 4, 8);
    ctx.fillRect(nx + 1, ny, 4, 8);

    // Torso / Shirt
    ctx.fillStyle = npc.shirtColor || '#38bdf8';
    ctx.fillRect(nx - 7, ny - 10, 14, 10);

    // Head / Skin
    ctx.fillStyle = npc.skinTone || '#fde047';
    ctx.beginPath();
    ctx.arc(nx, ny - 14, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = npc.hairColor || '#1e293b';
    ctx.beginPath();
    ctx.arc(nx, ny - 17, 7, Math.PI, Math.PI * 2);
    ctx.fill();

    // Profession Badge Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const badge = npc.profession === 'president' ? '👑' : (npc.profession.startsWith('police') ? '👮' : (npc.profession === 'doctor' ? '🩺' : '👤'));
    ctx.fillText(badge, nx, ny - 20);

    ctx.restore();
  }

  // 3D PLAYER RENDERER WITH SMOOTH SUB-TILE NATURAL MOVEMENT & ANIMATION
  function renderPlayer3D(ctx, p, tileSize, isNight) {
    const px = p.renderX * tileSize + tileSize / 2;
    const py = p.renderY * tileSize + tileSize / 2;

    // Natural leg swing & gait animation offset
    const legSwing = Math.sin(p.walkAnimPhase) * 4;

    ctx.save();

    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + 8, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Pants with gait swing
    ctx.fillStyle = p.pantsColor || '#15803d';
    ctx.fillRect(px - 6, py + legSwing, 5, 9);
    ctx.fillRect(px + 1, py - legSwing, 5, 9);

    // Body / Shirt
    ctx.fillStyle = p.shirtColor || '#22c55e';
    ctx.fillRect(px - 8, py - 11, 16, 11);

    // Head / Skin
    ctx.fillStyle = p.skinTone || '#fde047';
    ctx.beginPath();
    ctx.arc(px, py - 15, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hat / Hair Accent
    ctx.fillStyle = p.hatColor || '#16a34a';
    ctx.beginPath();
    ctx.arc(px, py - 18, 8, Math.PI, Math.PI * 2);
    ctx.fill();

    // Custom Accessories (Glasses, Sunglasses, Crown, Cap Visor, Mask)
    if (p.accessory === 'cap') {
      ctx.fillStyle = p.hatColor || '#16a34a';
      ctx.fillRect(px - 10, py - 18, 12, 3); // Cap visor
    } else if (p.accessory === 'glasses') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 5, py - 17, 4, 4);
      ctx.strokeRect(px + 1, py - 17, 4, 4);
    } else if (p.accessory === 'sunglasses') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 6, py - 17, 5, 4);
      ctx.fillRect(px + 1, py - 17, 5, 4);
    } else if (p.accessory === 'crown') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(px - 7, py - 22);
      ctx.lineTo(px - 4, py - 27);
      ctx.lineTo(px, py - 22);
      ctx.lineTo(px + 4, py - 27);
      ctx.lineTo(px + 7, py - 22);
      ctx.closePath();
      ctx.fill();
    } else if (p.accessory === 'mask') {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(px - 6, py - 14, 12, 5);
    }

    // Selection Ring around Hero
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px, py + 8, 12, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Player Name Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.badge} ${p.name}`, px, py - 24);

    ctx.restore();
  }

  // CONTROLS & CONTINUOUS TOUCH LISTENERS
  function setupEventListeners() {
    canvas.addEventListener('pointerdown', (e) => {
      isPointerDown = true;
      updatePointerPos(e);
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (isPointerDown) {
        updatePointerPos(e);
      }
      e.preventDefault();
    });

    window.addEventListener('pointerup', () => {
      isPointerDown = false;
    });

    canvas.addEventListener('click', (e) => {
      if (player.insideBuilding) {
        alert(`🚪 Saliste de ${player.insideBuilding.name}. Volviendo al mapa exterior.`);
        player.insideBuilding = null;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left + camera.x;
      const clickY = e.clientY - rect.top + camera.y;

      const tileSize = window.CiudadLinkMap.TILE_SIZE;
      const targetX = Math.floor(clickX / tileSize);
      const targetY = Math.floor(clickY / tileSize);

      const clickedNpc = window.CiudadLinkNPCs.npcs.find(n => n.x === targetX && n.y === targetY);
      if (clickedNpc) {
        inspectNPC(clickedNpc);
        return;
      }

      const hotel = window.CiudadLinkMap.hotels.find(h => h.elevatorX === targetX && h.elevatorY === targetY);
      if (hotel) {
        openElevatorModal(hotel);
        return;
      }

      const bldg = window.CiudadLinkMap.buildings.find(b => targetX >= b.x && targetX < b.x + b.w && targetY >= b.y && targetY < b.y + b.h);
      if (bldg && bldg.tileType !== window.CiudadLinkMap.TILE.PARK) {
        openBuildingInteriorEntryModal(bldg);
        return;
      }

      // Priority-Weighted A* Pathfinding (pedestrian vs driver)
      const routingMode = window.CiudadLinkVehicles.hijackedVehicle ? 'driver' : 'pedestrian';
      const path = window.CiudadLinkMap.findPath({ x: player.x, y: player.y }, { x: targetX, y: targetY }, routingMode);
      if (path && path.length > 0) {
        player.path = path;
      }
    });

    // Keyboard WASD Controls for PC Desktop
    window.addEventListener('keydown', (e) => {
      let dx = 0, dy = 0;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = 1;

      if (dx !== 0 || dy !== 0) {
        let nx = player.x + dx;
        let ny = player.y + dy;
        if (window.CiudadLinkMap.isTileWalkable(nx, ny)) {
          player.x = nx;
          player.y = ny;
          player.isWalking = true;
          player.facing = dx > 0 ? 'E' : (dx < 0 ? 'W' : (dy > 0 ? 'S' : 'N'));
        }
      }
    });

    // Nav & Bottom HUD Floating Buttons
    document.getElementById('btnToggleSprint')?.addEventListener('click', toggleSprint);
    document.getElementById('btnOpenLog')?.addEventListener('click', openLogModal);
    document.getElementById('btnOpenMainMenu')?.addEventListener('click', openOptionsMenu);

    document.getElementById('btnOpenWorldMap')?.addEventListener('click', openWorldMapModal);
    document.getElementById('btnOpenWife')?.addEventListener('click', openWifeModal);
    document.getElementById('btnOpenJobs')?.addEventListener('click', openJobsModal);
    document.getElementById('btnOpenHospitalMenu')?.addEventListener('click', openHospitalMenuModal);
    document.getElementById('btnHijackVehicle')?.addEventListener('click', () => {
      window.CiudadLinkVehicles.hijackNearbyVehicle(player.x, player.y);
    });
    document.getElementById('btnChooseAvatar')?.addEventListener('click', openAvatarSelectorModal);
    document.getElementById('btnOpenPhone')?.addEventListener('click', openSmartphoneModal);
    document.getElementById('btnOpenLaws')?.addEventListener('click', openLawsModal);
    document.getElementById('btnOpenPresidencia')?.addEventListener('click', openPresidenciaModal);
    document.getElementById('btnOpenCatalog')?.addEventListener('click', openCatalogModal);
    document.getElementById('btnOpenCitizens')?.addEventListener('click', openCitizensListModal);

    // Live Radio Buttons
    document.getElementById('btnToggleRadio')?.addEventListener('click', toggleRadio);
    document.getElementById('btnNextRadioStation')?.addEventListener('click', nextRadioStation);
  }

  function toggleSprint() {
    player.isSprinting = !player.isSprinting;
    const btn = document.getElementById('btnToggleSprint');
    if (btn) {
      btn.textContent = player.isSprinting ? '⚡ Modo: Correr' : '🏃 Modo: Caminar';
      btn.classList.toggle('active', player.isSprinting);
    }
    addLog(player.isSprinting ? '⚡ Modo Correr activado.' : '🏃 Modo Caminar activado.');
  }

  function openGameModeSelectorModal() {
    const modes = [
      { id: 'SIMS', title: '🧘 Modo Vida Sims Libre', desc: 'Simulación social, necesidades, matrimonio, hogar, compras y libertad total.' },
      { id: 'POLICE', title: '👮 Modo Carrera Policial & Vigilante', desc: 'Patrullaje urbano, arrestos de pandilleros, persecuciones y recompensas.' },
      { id: 'MAYOR', title: '👑 Modo Presidencia / Alcalde', desc: 'Emisión de Decretos Presidenciales, gestión de impuestos y regulaciones.' },
      { id: 'DRIVER', title: '🚘 Modo Conductor / Gran Robo de Autos', desc: 'Robo de vehículos, carreras callejeras y transportes de mercancía.' },
      { id: 'DOCTOR', title: '🩺 Modo Emergencias Médicas', desc: 'Conducción de ambulancias, curación de enfermos y urgencias del Hospital.' },
      { id: 'LAWYER', title: '⚖️ Modo Abogado Defensor', desc: 'Audiencias judiciales, alegatos procesales en la Corte y modificación de leyes.' },
      { id: 'TYCOON', title: '🏦 Modo Magnate de Negocios', desc: 'Inversiones inmobiliarias, cobro de alquileres en hoteles y depósitos bancarios.' },
      { id: 'SEWER', title: '🕳️ Modo Explorador Subterráneo', desc: 'Exploración de alcantarillas, contrabando y pasadizos secretos.' }
    ];

    const modesHTML = modes.map(m => `
      <div style="background:${player.gameMode === m.id ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)'}; border:2px solid ${player.gameMode === m.id ? '#38bdf8' : '#334155'}; padding:0.75rem; border-radius:10px; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h4 style="margin:0; color:#38bdf8;">${m.title} ${player.gameMode === m.id ? ' (ACTIVO)' : ''}</h4>
          <p style="margin:0.2rem 0 0; font-size:0.78rem; color:#cbd5e1;">${m.desc}</p>
        </div>
        <button class="btn ${player.gameMode === m.id ? 'btn-secondary' : 'btn-primary'}" style="font-size:0.75rem; white-space:nowrap;" onclick="setPlayerGameMode('${m.id}')">
          ${player.gameMode === m.id ? '✅ Seleccionado' : '⚡ Activar Modo'}
        </button>
      </div>
    `).join('');

    const body = `
      <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:1rem;">
        🎮 <b>Selección de Modo de Juego Principal:</b> Puedes cambiar el enfoque de juego en cualquier momento para experimentar diferentes roles urbanos:
      </p>
      <div style="max-height:340px; overflow-y:auto;">
        ${modesHTML}
      </div>
    `;

    openModalCard('🎮 Modos de Juego (8 Modos Activos)', body);
  }

  window.setPlayerGameMode = function(modeId) {
    player.gameMode = modeId;
    addLog(`🎮 Cambiaste al Modo de Juego: ${modeId}`);
    alert(`🎮 ¡Modo de Juego activado! Tu rol activo en la ciudad ahora es: ${modeId}.`);
    closeModalCard();
  };

  window.openGameModeSelectorModal = openGameModeSelectorModal;

  function openAvatarCustomizerModal() {
    const skinTones = ['#fde047', '#fed7aa', '#fecdd3', '#f59e0b', '#d97706', '#78350f'];
    const shirtColors = ['#22c55e', '#38bdf8', '#f472b6', '#ef4444', '#a855f7', '#eab308', '#0f172a', '#ffffff'];
    const pantsColors = ['#15803d', '#1e293b', '#334155', '#1d4ed8', '#7c2d12', '#4c1d95'];
    const hatColors = ['#16a34a', '#0284c7', '#be185d', '#dc2626', '#1e293b', '#ca8a04'];

    const body = `
      <div style="text-align:center; margin-bottom:1rem;">
        <h3 style="color:#ec4899; margin:0 0 0.25rem;">🎨 Personalizador Completo de Avatar</h3>
        <p style="font-size:0.82rem; color:#cbd5e1;">Ajusta la vestimenta, tonos de piel, gorra y accesorios de tu personaje:</p>
      </div>

      <div style="display:flex; flex-direction:column; gap:0.85rem; max-height:340px; overflow-y:auto; padding-right:0.25rem;">
        <div>
          <label style="font-size:0.8rem; font-weight:bold; color:#38bdf8; display:block; margin-bottom:0.25rem;">👤 Nombre del Avatar:</label>
          <input type="text" id="custNameInput" value="${player.name}" style="width:100%; padding:0.4rem; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px; box-sizing:border-box;">
        </div>

        <div>
          <label style="font-size:0.8rem; font-weight:bold; color:#38bdf8; display:block; margin-bottom:0.25rem;">🏽 Tono de Piel:</label>
          <div style="display:flex; gap:0.4rem;">
            ${skinTones.map(c => `
              <div onclick="setAvatarCustomProp('skinTone', '${c}')" style="width:28px; height:28px; background:${c}; border:${player.skinTone === c ? '3px solid #38bdf8' : '1px solid #64748b'}; border-radius:50%; cursor:pointer;"></div>
            `).join('')}
          </div>
        </div>

        <div>
          <label style="font-size:0.8rem; font-weight:bold; color:#38bdf8; display:block; margin-bottom:0.25rem;">👕 Color de Camiseta:</label>
          <div style="display:flex; gap:0.4rem;">
            ${shirtColors.map(c => `
              <div onclick="setAvatarCustomProp('shirtColor', '${c}')" style="width:28px; height:28px; background:${c}; border:${player.shirtColor === c ? '3px solid #38bdf8' : '1px solid #64748b'}; border-radius:50%; cursor:pointer;"></div>
            `).join('')}
          </div>
        </div>

        <div>
          <label style="font-size:0.8rem; font-weight:bold; color:#38bdf8; display:block; margin-bottom:0.25rem;">👖 Color de Pantalón:</label>
          <div style="display:flex; gap:0.4rem;">
            ${pantsColors.map(c => `
              <div onclick="setAvatarCustomProp('pantsColor', '${c}')" style="width:28px; height:28px; background:${c}; border:${player.pantsColor === c ? '3px solid #38bdf8' : '1px solid #64748b'}; border-radius:50%; cursor:pointer;"></div>
            `).join('')}
          </div>
        </div>

        <div>
          <label style="font-size:0.8rem; font-weight:bold; color:#38bdf8; display:block; margin-bottom:0.25rem;">🧢 Color de Gorra / Cabello:</label>
          <div style="display:flex; gap:0.4rem;">
            ${hatColors.map(c => `
              <div onclick="setAvatarCustomProp('hatColor', '${c}')" style="width:28px; height:28px; background:${c}; border:${player.hatColor === c ? '3px solid #38bdf8' : '1px solid #64748b'}; border-radius:50%; cursor:pointer;"></div>
            `).join('')}
          </div>
        </div>

        <div>
          <label style="font-size:0.8rem; font-weight:bold; color:#38bdf8; display:block; margin-bottom:0.25rem;">🕶️ Accesorios de Rostro:</label>
          <select id="custAccessorySelect" onchange="setAvatarCustomProp('accessory', this.value)" style="width:100%; padding:0.4rem; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px; box-sizing:border-box;">
            <option value="none" ${player.accessory === 'none' ? 'selected' : ''}>Sin Accesorio</option>
            <option value="cap" ${player.accessory === 'cap' ? 'selected' : ''}>🧢 Visera de Gorra</option>
            <option value="glasses" ${player.accessory === 'glasses' ? 'selected' : ''}>👓 Lentes de Aumento</option>
            <option value="sunglasses" ${player.accessory === 'sunglasses' ? 'selected' : ''}>🕶️ Gafas de Sol VIP</option>
            <option value="mask" ${player.accessory === 'mask' ? 'selected' : ''}>😷 Mascarilla Médica</option>
            <option value="crown" ${player.accessory === 'crown' ? 'selected' : ''}>👑 Corona Real</option>
          </select>
        </div>
      </div>

      <div style="margin-top:1rem; text-align:center;">
        <button class="btn btn-primary" onclick="saveAvatarCustomization()">✨ Guardar Personalización</button>
      </div>
    `;

    openModalCard('🎨 Personalizar Avatar', body);
  }

  window.setAvatarCustomProp = function(prop, value) {
    player[prop] = value;
    openAvatarCustomizerModal();
  };

  function openMultiplayerModal() {
    const isConn = window.CiudadLinkMultiplayer ? window.CiudadLinkMultiplayer.isConnected : false;
    const currentRoom = window.CiudadLinkMultiplayer ? window.CiudadLinkMultiplayer.roomId : 'Ninguna';
    const isMicOn = window.CiudadLinkMultiplayer ? window.CiudadLinkMultiplayer.isMicActive : false;
    const remPlayers = window.CiudadLinkMultiplayer ? Object.values(window.CiudadLinkMultiplayer.remotePlayers) : [];

    const remoteListHTML = remPlayers.length > 0 ? remPlayers.map(rp => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:0.5rem; border-radius:6px; margin-bottom:0.4rem;">
        <div>
          <span style="font-size:1.1rem;">${rp.badge || '👤'}</span> <b>${rp.name}</b>
          <span style="font-size:0.75rem; color:#38bdf8;"> (${Math.round(rp.distance || 0)} tiles)</span>
        </div>
        <span style="font-size:0.75rem; color:${rp.isMicOn ? '#22c55e' : '#94a3b8'};">
          ${rp.isMicOn ? '🎙️ Mic Activo' : '🔇 Silenciado'}
        </span>
      </div>
    `).join('') : '<p style="font-size:0.8rem; color:#94a3b8; margin:0;">Esperando otros jugadores en la sala...</p>';

    const body = `
      <div style="text-align:center; margin-bottom:1rem;">
        <h3 style="color:#38bdf8; margin:0 0 0.25rem;">🌐 Multijugador Co-op & Chat de Voz de Proximidad</h3>
        <p style="font-size:0.82rem; color:#cbd5e1;">Conéctate con amigos en tiempo real. ¡Al acercarse sus avatares se escuchará su voz con volumen espacial según la distancia!</p>
      </div>

      <div style="background:rgba(255,255,255,0.05); border:1px solid #334155; padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span style="font-size:0.85rem; font-weight:bold;">Estado: <span style="color:${isConn ? '#22c55e' : '#ef4444'};">${isConn ? '🟢 Conectado (' + currentRoom + ')' : '🔴 Desconectado'}</span></span>
          <button class="btn ${isConn ? 'btn-secondary' : 'btn-primary'}" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="${isConn ? 'toggleNetConnect(false)' : 'toggleNetConnect(true)'}">
            ${isConn ? '🚪 Salir de Sala' : '⚡ Unirse a Sala'}
          </button>
        </div>

        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
          <input type="text" id="netRoomInput" value="${currentRoom !== 'Ninguna' ? currentRoom : 'CIUDADLINK_SALA_1'}" style="flex:1; padding:0.35rem; background:#1e293b; border:1px solid #334155; color:#fff; border-radius:6px; font-size:0.8rem;">
          <button class="btn btn-secondary" style="font-size:0.75rem;" onclick="joinNetRoomFromInput()">🔑 Cambiar Sala</button>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05); border:1px solid #10b981; padding:0.75rem; border-radius:10px; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:0.85rem; font-weight:bold; color:#10b981;">🎙️ Chat de Voz de Proximidad</div>
          <p style="font-size:0.72rem; color:#cbd5e1; margin:0.2rem 0 0;">El volumen de voz baja automáticamente si los avatares se alejan.</p>
        </div>
        <button class="btn ${isMicOn ? 'btn-secondary' : 'btn-primary'}" id="btnToggleMic" style="font-size:0.75rem; padding:0.4rem 0.75rem;" onclick="toggleNetMicrophone()">
          ${isMicOn ? '🎙️ Micrófono: ON' : '🔇 Activar Micrófono'}
        </button>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="font-size:0.8rem; font-weight:bold; color:#38bdf8; display:block; margin-bottom:0.3rem;">💬 Reacciones & Emotes Rápidos:</label>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          <button class="btn btn-secondary" style="font-size:0.9rem; padding:0.25rem 0.6rem;" onclick="sendNetEmote('👋')">👋 Saludo</button>
          <button class="btn btn-secondary" style="font-size:0.9rem; padding:0.25rem 0.6rem;" onclick="sendNetEmote('🔥')">🔥 Fuego</button>
          <button class="btn btn-secondary" style="font-size:0.9rem; padding:0.25rem 0.6rem;" onclick="sendNetEmote('🚔')">🚔 Policía</button>
          <button class="btn btn-secondary" style="font-size:0.9rem; padding:0.25rem 0.6rem;" onclick="sendNetEmote('💰')">💰 Dinero</button>
          <button class="btn btn-secondary" style="font-size:0.9rem; padding:0.25rem 0.6rem;" onclick="sendNetEmote('💖')">💖 Amor</button>
        </div>
      </div>

      <div style="margin-bottom:0.5rem;">
        <label style="font-size:0.8rem; font-weight:bold; color:#38bdf8; display:block; margin-bottom:0.3rem;">👥 Jugadores Conectados en la Sala:</label>
        <div style="max-height:160px; overflow-y:auto;">
          ${remoteListHTML}
        </div>
      </div>
    `;

    openModalCard('🌐 Multijugador Co-op & Chat de Voz', body);
  }

  window.toggleNetConnect = function(connect) {
    if (connect) {
      const roomInput = document.getElementById('netRoomInput');
      const rId = roomInput ? roomInput.value.trim() : 'CIUDADLINK_SALA_1';
      window.CiudadLinkMultiplayer.joinRoom(rId);
    } else {
      window.CiudadLinkMultiplayer.leaveRoom();
    }
    openMultiplayerModal();
  };

  window.joinNetRoomFromInput = function() {
    const roomInput = document.getElementById('netRoomInput');
    if (roomInput && roomInput.value.trim()) {
      window.CiudadLinkMultiplayer.joinRoom(roomInput.value.trim());
      openMultiplayerModal();
    }
  };

  window.toggleNetMicrophone = function() {
    window.CiudadLinkMultiplayer.toggleMicrophone();
  };

  window.sendNetEmote = function(emoteSymbol) {
    window.CiudadLinkMultiplayer.sendEmote(emoteSymbol);
    addLog(`💬 Enviaste emote: ${emoteSymbol}`);
  };

  function openMissionsModal() {
    const missions = window.CiudadLinkMissions ? window.CiudadLinkMissions.MISSIONS : [];
    const activeIdx = window.CiudadLinkMissions ? window.CiudadLinkMissions.activeMissionIdx : -1;
    const completedList = window.CiudadLinkMissions ? window.CiudadLinkMissions.missionCompletedList : [];

    let activeBannerHTML = '';
    if (activeIdx >= 0) {
      const activeM = missions[activeIdx];
      const stIdx = window.CiudadLinkMissions.currentStageIdx;
      const stage = activeM.stages[stIdx];

      activeBannerHTML = `
        <div style="background:rgba(220,38,38,0.2); border:2px solid #ef4444; border-radius:12px; padding:0.85rem; margin-bottom:1rem;">
          <h4 style="margin:0; color:#f87171;">🚨 MISIÓN EN CURSO: ${activeM.title}</h4>
          <p style="font-size:0.8rem; color:#cbd5e1; margin:0.3rem 0;">Peligro: <b>${activeM.danger}</b></p>
          <div style="background:rgba(0,0,0,0.4); padding:0.5rem; border-radius:6px; margin:0.5rem 0; font-size:0.82rem; color:#fbbf24;">
            <b>Objetivo Actual (Etapa ${stIdx + 1}/${activeM.stages.length}):</b><br>
            ${stage ? stage.desc : 'Completado'}
          </div>
          ${stage && stage.reqType === 'ACTION' ? `
            <button class="btn btn-primary" style="font-size:0.8rem; padding:0.4rem 0.8rem; width:100%;" onclick="triggerActiveMissionAction()">⚡ Ejecutar Acción de Misión</button>
          ` : ''}
        </div>
      `;
    }

    const missionsListHTML = missions.map((m, idx) => {
      const isDone = completedList.includes(m.id);
      const isActive = activeIdx === idx;

      return `
        <div style="background:${isActive ? 'rgba(234,179,8,0.2)' : (isDone ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)')}; border:1px solid ${isActive ? '#eab308' : (isDone ? '#22c55e' : '#334155')}; border-radius:10px; padding:0.75rem; margin-bottom:0.6rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <h4 style="margin:0; font-size:0.9rem; color:${isActive ? '#facc15' : (isDone ? '#4ade80' : '#38bdf8')};">${m.title}</h4>
            <span style="font-size:0.7rem; color:#f87171; font-weight:bold;">${m.danger}</span>
          </div>
          <p style="font-size:0.75rem; color:#cbd5e1; margin:0.2rem 0;">Recompensa: <b>💰 $${m.rewardMoney} | ⭐ ${m.rewardXP} XP</b></p>
          <p style="font-size:0.72rem; color:#94a3b8; margin:0 0 0.5rem;">${m.rewardItem}</p>
          <button class="btn ${isActive ? 'btn-secondary' : (isDone ? 'btn-secondary' : 'btn-primary')}" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="acceptMissionById(${idx})" ${isActive ? 'disabled' : ''}>
            ${isActive ? '🟡 Misión Activa' : (isDone ? '✅ Repetir Misión' : '⚡ Aceptar Misión Peligrosa')}
          </button>
        </div>
      `;
    }).join('');

    const body = `
      <div style="text-align:center; margin-bottom:1rem;">
        <h3 style="color:#ef4444; margin:0 0 0.25rem;">🚨 10 Misiones Peligrosas de Gran Escala</h3>
        <p style="font-size:0.82rem; color:#cbd5e1;">Misiones largas y arriesgadas con altas recompensas monetarias, XP y accesorios exclusivos:</p>
      </div>

      ${activeBannerHTML}

      <div style="max-height:300px; overflow-y:auto; padding-right:0.25rem;">
        ${missionsListHTML}
      </div>
    `;

    openModalCard('🚨 Misiones Peligrosas Co-op', body);
  }

  window.acceptMissionById = function(idx) {
    if (window.CiudadLinkMissions) {
      window.CiudadLinkMissions.startMission(idx);
      openMissionsModal();
    }
  };

  window.triggerActiveMissionAction = function() {
    if (window.CiudadLinkMissions) {
      window.CiudadLinkMissions.triggerMissionAction();
      openMissionsModal();
    }
  };

  function addReward(money, xp) {
    player.money += money;
    addLog(`🎁 Recompensa Ganada: +$${money} en efectivo | +${xp} XP.`);
  }

  // XP & Level Progression System
  function addXP(amount) {
    player.xp += amount;
    addLog(`⭐ Ganaste +${amount} XP.`);

    if (player.xp >= player.nextXp) {
      player.level++;
      player.xp -= player.nextXp;
      player.nextXp = Math.floor(player.nextXp * 1.5);
      player.maxHealth += 10;
      player.health = player.maxHealth;
      player.maxEnergy += 10;
      player.energy = player.maxEnergy;
      player.money += 250;

      unlockAchievement('LEVEL_UP', `Level ${player.level} Alcanzado`);
      addLog(`🎉 ¡LEVEL UP! Has subido al Nivel ${player.level}. Salud & Energía aumentadas +10. Premio: +$250.`);
      alert(`🎉 ¡FELICITACIONES! HAS SUBIDO AL NIVEL ${player.level}!\n\n❤️ HP Máximo: ${player.maxHealth}\n⚡ Energía Máxima: ${player.maxEnergy}\n💰 Bonificación: +$250`);
    }
  }

  function unlockAchievement(id, name) {
    if (!player.achievements.includes(id)) {
      player.achievements.push(id);
      addLog(`🏆 ¡LOGRO DESBLOQUEADO! ${name}`);
    }
  }

  // Interactive Mini-Map Radar Renderer
  function renderMiniMapRadar(ctx) {
    const mapW = 160;
    const mapH = 160;
    const mx = canvas.width - mapW - 12;
    const my = 50;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(mx, my, mapW, mapH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mapW, mapH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🗺️ MINI-MAPA RADAR', mx + 8, my + 14);

    // Player position dot
    const px = mx + (player.x / 100) * mapW;
    const py = my + (player.y / 100) * mapH;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    // NPCs dots
    ctx.fillStyle = '#38bdf8';
    window.CiudadLinkNPCs.npcs.forEach(n => {
      const nx = mx + (n.x / 100) * mapW;
      const ny = my + (n.y / 100) * mapH;
      ctx.fillRect(nx - 1, ny - 1, 2, 2);
    });

    ctx.restore();
  }

  function toggleMiniMapRadar() {
    showMiniMap = !showMiniMap;
    addLog(showMiniMap ? '🗺️ Mini-Mapa Radar activado.' : '🗺️ Mini-Mapa Radar desactivado.');
  }

  window.toggleMiniMapRadar = toggleMiniMapRadar;
  window.addXP = addXP;
  window.addReward = addReward;
  window.addLog = addLog;
  window.openMissionsModal = openMissionsModal;

  // Global namespace export for inter-module communication
  window.CiudadLinkMain = {
    addReward: addReward,
    addLog: addLog,
    getPlayerState: () => player
  };

  window.saveAvatarCustomization = function() {
    const inputName = document.getElementById('custNameInput');
    if (inputName && inputName.value.trim()) {
      player.name = inputName.value.trim();
    }
    addLog(`✨ Personalizaste a tu avatar: ${player.name}.`);
    alert(`✨ ¡Avatar personalizado con éxito! Nombre: ${player.name}.`);
    closeModalCard();
  };

  window.openAvatarCustomizerModal = openAvatarCustomizerModal;

  function openOptionsMenu() {
    const modal = document.getElementById('optionsModal');
    if (modal) modal.classList.add('active');
  }

  function closeOptionsMenu() {
    const modal = document.getElementById('optionsModal');
    if (modal) modal.classList.remove('active');
  }

  window.openOptionsMenu = openOptionsMenu;
  window.closeOptionsMenu = closeOptionsMenu;

  function toggleRadio() {
    isRadioPlaying = !isRadioPlaying;
    const btn = document.getElementById('btnToggleRadio');
    const audioElem = document.getElementById('radioAudioPlayer');

    if (isRadioPlaying) {
      if (btn) btn.textContent = '⏸️ Pausar';
      if (audioElem) {
        audioElem.play().catch(e => console.log('Audio play error:', e));
      }
    } else {
      if (btn) btn.textContent = '▶️ Reproducir';
      if (audioElem) {
        audioElem.pause();
      }
    }
  }

  function nextRadioStation() {
    const streams = window.CiudadLinkVehicles.RADIO_STREAMS;
    currentRadioStationIdx = (currentRadioStationIdx + 1) % streams.length;
    const st = streams[currentRadioStationIdx];

    const elemTitle = document.getElementById('mediaTitle');
    const elemSub = document.getElementById('mediaSub');
    if (elemTitle) elemTitle.textContent = `📻 ${st.title}`;
    if (elemSub) elemSub.textContent = '🎶 Radio en Vivo de Internet';

    const audioElem = document.getElementById('radioAudioPlayer');
    if (audioElem) {
      audioElem.src = st.url;
      if (isRadioPlaying) audioElem.play().catch(e => console.log('Audio play error:', e));
    }
  }

  function openLogModal() {
    const logsHTML = player.logHistory.map(entry => `
      <div style="background:rgba(255,255,255,0.05); border-left:3px solid #38bdf8; padding:0.5rem 0.75rem; border-radius:4px; margin-bottom:0.4rem; font-size:0.82rem;">
        ${entry}
      </div>
    `).join('');

    const body = `
      <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">
        📜 Historial de Eventos y Bitácora de la Ciudad:
      </p>
      <div style="max-height:320px; overflow-y:auto;">
        ${logsHTML || '<p style="color:#cbd5e1;">Sin registro de eventos aún.</p>'}
      </div>
    `;

    openModalCard('📜 Historial & Bitácora Urbana', body);
  }

  function openWifeModal() {
    const npcs = window.CiudadLinkNPCs.npcs;
    let spouseNpc = npcs.find(n => n.name === player.spouse || n.spouseId === player.avatarId);

    if (spouseNpc) {
      const quad = window.CiudadLinkMap.getQuadrantHierarchy(spouseNpc.x, spouseNpc.y);
      const body = `
        <div style="text-align:center; padding:0.5rem;">
          <div style="font-size:3rem; margin-bottom:0.5rem;">👰</div>
          <h3 style="color:#ec4899; margin:0 0 0.25rem;">${spouseNpc.name} — Tu Esposa</h3>
          <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:1rem;">
            📍 Ubicación Actual: <b>${quad.title} (${spouseNpc.x}, ${spouseNpc.y})</b><br>
            💖 Vínculo Matrimonial: <b>${spouseNpc.relationshipLevel}%</b> | Tel: 📞 <b>${spouseNpc.phone}</b>
          </p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
            <button class="btn btn-primary" onclick="teleportToSpouse('${spouseNpc.id}')">🌀 Rastrear y Teletransportar</button>
            <button class="btn btn-secondary" onclick="sendSpouseGift('${spouseNpc.id}')">🎁 Enviar Regalo ($50)</button>
          </div>
        </div>
      `;
      openModalCard('👰 Esposa & Vida Matrimonial', body);
    } else {
      const singleNpcs = npcs.filter(n => n.relationshipState === 'Soltero' || n.relationshipState === 'Amigo').slice(0, 10);
      const listHTML = singleNpcs.map(n => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:0.5rem; border-radius:6px; margin-bottom:0.35rem;">
          <span>${n.gender === 'Masculino' ? '👨' : '👩'} <b>${n.name}</b> (${n.profession})</span>
          <button class="btn btn-secondary" style="font-size:0.75rem;" onclick="inspectNPCById('${n.id}')">💘 Coquetear</button>
        </div>
      `).join('');

      const body = `
        <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:1rem;">
          💍 Aún no estás casado. Explora la ciudad o conoce solteros en el Padrón Municipal para iniciar un romance Sims:
        </p>
        <div style="max-height:280px; overflow-y:auto;">
          ${listHTML}
        </div>
      `;
      openModalCard('👰 Esposa & Rastreo de Citas', body);
    }
  }

  window.teleportToSpouse = function(spouseId) {
    const npc = window.CiudadLinkNPCs.npcs.find(n => n.id === spouseId);
    if (!npc) return;
    player.x = npc.x;
    player.y = npc.y;
    player.renderX = npc.x;
    player.renderY = npc.y;
    addLog(`👰 Te has desplazado junto a tu Esposa (${npc.name}).`);
    alert(`🌀 Te has desplazado junto a ${npc.name} en (${npc.x}, ${npc.y}).`);
    closeModalCard();
  };

  window.sendSpouseGift = function(spouseId) {
    const npc = window.CiudadLinkNPCs.npcs.find(n => n.id === spouseId);
    if (!npc) return;
    if (player.money >= 50) {
      player.money -= 50;
      npc.relationshipLevel = Math.min(100, npc.relationshipLevel + 15);
      alert(`🎁 ¡Le enviaste un hermoso regalo a ${npc.name}! Amor +15%.`);
      openWifeModal();
    } else {
      alert('❌ Dinero insuficiente ($50).');
    }
  };

  function openJobsModal() {
    const body = `
      <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:1rem;">
        💼 <b>Bolsa de Trabajo y Empleos de Ciudad Link:</b> Selecciona una vacante laboral para ganar salario y completar misiones:
      </p>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; max-height:340px; overflow-y:auto;">
        <div style="background:rgba(255,255,255,0.05); border:1px solid #38bdf8; border-radius:10px; padding:0.75rem;">
          <h4 style="margin:0; color:#38bdf8;">🚖 Taxista Urbano</h4>
          <p style="font-size:0.75rem; color:#cbd5e1; margin:0.25rem 0;">Recoge pasajeros en las avenidas y llévalos a su destino.</p>
          <button class="btn btn-primary" style="font-size:0.75rem; padding:0.3rem;" onclick="acceptJobMission('TAXI')">⚡ Iniciar Misión ($50/carrera)</button>
        </div>

        <div style="background:rgba(255,255,255,0.05); border:1px solid #eab308; border-radius:10px; padding:0.75rem;">
          <h4 style="margin:0; color:#eab308;">🍕 Delivery Express</h4>
          <p style="font-size:0.75rem; color:#cbd5e1; margin:0.25rem 0;">Entrega pedidos de pizza a los hoteles de 10 pisos.</p>
          <button class="btn btn-primary" style="font-size:0.75rem; padding:0.3rem;" onclick="acceptJobMission('DELIVERY')">⚡ Iniciar Misión ($40/pedido)</button>
        </div>

        <div style="background:rgba(255,255,255,0.05); border:1px solid #3b82f6; border-radius:10px; padding:0.75rem;">
          <h4 style="margin:0; color:#3b82f6;">👮 Oficial de Policía</h4>
          <p style="font-size:0.75rem; color:#cbd5e1; margin:0.25rem 0;">Patrulla la ciudad y arresta a los pandilleros en flagrancia.</p>
          <button class="btn btn-primary" style="font-size:0.75rem; padding:0.3rem;" onclick="acceptJobMission('POLICE')">⚡ Iniciar Misión ($100/arresto)</button>
        </div>

        <div style="background:rgba(255,255,255,0.05); border:1px solid #10b981; border-radius:10px; padding:0.75rem;">
          <h4 style="margin:0; color:#10b981;">🩺 Médico / Paramédico</h4>
          <p style="font-size:0.75rem; color:#cbd5e1; margin:0.25rem 0;">Trata y cura a los ciudadanos enfermos del Hospital.</p>
          <button class="btn btn-primary" style="font-size:0.75rem; padding:0.3rem;" onclick="acceptJobMission('DOCTOR')">⚡ Iniciar Misión ($80/curación)</button>
        </div>

        <div style="background:rgba(255,255,255,0.05); border:1px solid #c084fc; border-radius:10px; padding:0.75rem;">
          <h4 style="margin:0; color:#c084fc;">⚖️ Abogado Defensor</h4>
          <p style="font-size:0.75rem; color:#cbd5e1; margin:0.25rem 0;">Representa acusados en la Corte Judicial de Ciudad Link.</p>
          <button class="btn btn-primary" style="font-size:0.75rem; padding:0.3rem;" onclick="acceptJobMission('LAWYER')">⚡ Iniciar Misión ($120/juicio)</button>
        </div>

        <div style="background:rgba(255,255,255,0.05); border:1px solid #f97316; border-radius:10px; padding:0.75rem;">
          <h4 style="margin:0; color:#f97316;">🍽️ Cocinero / Mesero</h4>
          <p style="font-size:0.75rem; color:#cbd5e1; margin:0.25rem 0;">Prepara y sirve platillos típicos en el Paladar Don Link.</p>
          <button class="btn btn-primary" style="font-size:0.75rem; padding:0.3rem;" onclick="acceptJobMission('PALADAR')">⚡ Iniciar Misión ($60/servicio)</button>
        </div>
      </div>
    `;

    openModalCard('💼 Bolsa de Empleos & Misiones', body);
  }

  window.acceptJobMission = function(type) {
    if (type === 'TAXI') {
      player.money += 50;
      addLog('🚖 Completaste una carrera de Taxi Express (+$50).');
      alert('🚖 ¡Misión de Taxi completada! Recogiste un pasajero en la avenida y lo llevaste a su hotel. +$50 ganados.');
    } else if (type === 'DELIVERY') {
      player.money += 40;
      addLog('🍕 Entregaste una orden de pizza en el Hotel Sol (+$40).');
      alert('🍕 ¡Misión de Delivery completada! Entregaste pizza caliente en el Piso 4 del Hotel Sol. +$40 ganados.');
    } else if (type === 'POLICE') {
      player.money += 100;
      addLog('👮 Arrestaste a un sospecchoso en el Barrio Bajero (+$100).');
      alert('👮 ¡Patrullaje exitoso! Arrestaste a un pandillero en flagrancia y lo llevaste a la comisaría. +$100 ganados.');
    } else if (type === 'DOCTOR') {
      player.money += 80;
      addLog('🩺 Curaste a un paciente en Urgencias del Hospital (+$80).');
      alert('🩺 ¡Tratamiento médico completado! Curaste a un poblador herido en Urgencias. +$80 ganados.');
    } else if (type === 'LAWYER') {
      player.money += 120;
      addLog('⚖️ Defendiste a tu cliente en la Corte con éxito (+$120).');
      alert('⚖️ ¡Juicio ganado! Absolviste a tu cliente de los cargos ante el Juez. +$120 ganados.');
    } else if (type === 'PALADAR') {
      player.money += 60;
      addLog('🍽️ Serviste banquetes en el Paladar Don Link (+$60).');
      alert('🍽️ ¡Servicio de restaurante completado! Serviste la mesa VIP en Paladar Don Link. +$60 ganados.');
    }
    closeModalCard();
  };

  function openHospitalMenuModal() {
    const body = `
      <div style="text-align:center; margin-bottom:1rem;">
        <h3 style="color:#10b981; margin:0 0 0.3rem;">🏥 Hospital General & Red Subterránea</h3>
        <p style="font-size:0.85rem; color:#cbd5e1;">Centro de Tratamiento Médico e Infraestructura Subterránea de Ciudad Link.</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
        <div style="background:rgba(255,255,255,0.05); border:1px solid #10b981; border-radius:12px; padding:0.85rem; text-align:center;">
          <div style="font-size:2rem;">🩺</div>
          <h4 style="margin:0.25rem 0; color:#10b981;">Tratamiento Integral</h4>
          <p style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.75rem;">Restaura la Salud (HP) y Energía al 100%.</p>
          <button class="btn btn-primary" style="font-size:0.78rem;" onclick="healPlayerHospital()">🏥 Curar HP y Energía ($50)</button>
        </div>

        <div style="background:rgba(255,255,255,0.05); border:1px solid #f97316; border-radius:12px; padding:0.85rem; text-align:center;">
          <div style="font-size:2rem;">🕳️</div>
          <h4 style="margin:0.25rem 0; color:#f97316;">Túneles Subterráneos</h4>
          <p style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.75rem;">Red secreta de pasadizos para conectar distritos.</p>
          <button class="btn btn-secondary" style="font-size:0.78rem;" onclick="openSewerTunnelsModal()">🕳️ Explorar Túneles</button>
        </div>
      </div>
    `;

    openModalCard('🏥 Hospital General & Red de Túneles', body);
  }

  window.healPlayerHospital = function() {
    if (player.money >= 50) {
      player.money -= 50;
      player.health = player.maxHealth;
      player.energy = player.maxEnergy;
      addLog('🏥 Fuiste atendido en el Hospital General. Salud y Energía restauradas a 100.');
      alert('🏥 ¡Tratamiento completado! Tu Salud y Energía han sido restauradas al 100%. -$50.');
      closeModalCard();
    } else {
      alert('❌ Dinero insuficiente ($50).');
    }
  };

  window.openSewerTunnelsModal = function() {
    const body = `
      <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:1rem;">
        🕳️ <b>Red Subterránea de Alcantarillado y Túneles:</b> Elige una escotilla para desplazarte de forma sigilosa sin tráfico:
      </p>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
        <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="teleportTunnel(10, 30, 'Hospital General')">🏥 Salida Hospital (NW)</button>
        <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="teleportTunnel(88, 70, 'Banco Central')">🏦 Salida Bóveda Banco (NE)</button>
        <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="teleportTunnel(10, 10, 'Estación Policía')">🚔 Salida Comisaría (NW)</button>
        <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="teleportTunnel(88, 88, 'Barrio Bajero')">🥷 Salida Escondite Gang (SE)</button>
      </div>
    `;

    openModalCard('🕳️ Túneles Subterráneos de la Ciudad', body);
  };

  window.teleportTunnel = function(x, y, destName) {
    player.x = x;
    player.y = y;
    player.renderX = x;
    player.renderY = y;
    player.insideBuilding = null;
    addLog(`🕳️ Viajaste por los túneles subterráneos hacia ${destName}.`);
    alert(`🕳️ ¡Saliste del túnel subterráneo en ${destName}! Ubicación: (${x}, ${y}).`);
    closeModalCard();
  };

  function updatePointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    pointerWorldPos.x = (e.clientX - rect.left) * scaleX + camera.x;
    pointerWorldPos.y = (e.clientY - rect.top) * scaleY + camera.y;
  }

  // WORLD MAP & HIERARCHICAL QUADRANT NAVIGATION MODAL
  function openWorldMapModal() {
    const activeQuad = window.CiudadLinkMap.getQuadrantHierarchy(player.x, player.y);

    let mainGroupsHTML = '';
    for (let g = 1; g <= 10; g++) {
      const isCurrentGroup = g === activeQuad.group;
      mainGroupsHTML += `
        <div style="background:${isCurrentGroup ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; border:2px solid ${isCurrentGroup ? '#38bdf8' : '#334155'}; border-radius:12px; padding:0.6rem; text-align:center;">
          <div style="font-size:0.9rem; font-weight:bold; color:${isCurrentGroup ? '#38bdf8' : '#f8fafc'};">
            ${isCurrentGroup ? '📍 ' : ''}Grupo ${g}
          </div>
          <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.2rem;">
            10 Subgrupos • 10 Sub-subgrupos
          </div>
          <button class="btn ${isCurrentGroup ? 'btn-secondary' : 'btn-primary'}" style="font-size:0.7rem; padding:0.25rem 0.5rem; margin-top:0.4rem;" onclick="teleportToMainGroup(${g})">
            ${isCurrentGroup ? '✅ Activo' : '🌀 Teletransportar'}
          </button>
        </div>
      `;
    }

    const body = `
      <div style="text-align:center; margin-bottom:1rem;">
        <p style="font-size:0.85rem; color:#cbd5e1; margin:0 0 0.5rem;">
          🗺️ <b>Jerarquía de 10 Grupos con 10 Subgrupos y 10 Sub-subgrupos:</b><br>
          Ubicación actual: <b>${activeQuad.title} (${activeQuad.code})</b>.
        </p>
        <span style="font-size:0.75rem; background:rgba(34, 197, 94, 0.15); border:1px solid rgba(34, 197, 94, 0.4); color:#4ade80; padding:0.3rem 0.6rem; border-radius:6px;">
          ⚡ Micro-Cuadrantes: Simulación pesada solo en cuadrante local. Tráfico y NPCs en segundo plano continuo sin congelarse.
        </span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.6rem; max-height:280px; overflow-y:auto;">
        ${mainGroupsHTML}
      </div>
    `;

    openModalCard('🗺️ Jerarquía de 10 Grupos y Micro-Cuadrantes', body);
  }

  window.teleportToMainGroup = function(groupId) {
    const targetX = ((groupId - 1) * 10) + 5;
    const targetY = ((groupId - 1) * 10) + 5;

    player.x = targetX;
    player.y = targetY;
    player.renderX = targetX;
    player.renderY = targetY;
    player.path = [];

    window.CiudadLinkNPCs.synchronizeNPCRoutinesWithGameTime();

    const newQuad = window.CiudadLinkMap.getQuadrantHierarchy(player.x, player.y);
    alert(`🌀 ¡Te has desplazado a ${newQuad.title} (${newQuad.code})! Ubicación: (${targetX}, ${targetY}).`);
    closeModalCard();
  };

  // MODALS & AVATAR SELECTION LOGIC
  function openAvatarSelectorModal() {
    const avatars = window.CiudadLinkData.AVATARS;
    const avatarsHTML = avatars.map(av => `
      <div class="avatar-card ${player.avatarId === av.id ? 'active' : ''}" onclick="selectPlayerAvatar('${av.id}')">
        <div style="font-size:2.2rem;">${av.badge}</div>
        <div style="flex:1;">
          <h4 style="margin:0; color:#38bdf8;">${av.name} — ${av.title}</h4>
          <p style="margin:0.2rem 0 0; font-size:0.78rem; color:#cbd5e1;">${av.perk}</p>
          <span style="font-size:0.75rem; color:#facc15;">Fondos Iniciales: $${av.startingMoney}</span>
        </div>
      </div>
    `).join('');

    const body = `
      <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">
        👥 Selecciona tu personaje para explorar Ciudad Link con habilidades y apariencia únicas:
      </p>
      <div style="display:flex; flex-direction:column; gap:0.6rem; max-height:340px; overflow-y:auto;">
        ${avatarsHTML}
      </div>
    `;

    openModalCard('👥 Selección de Personaje Link', body);
  }

  window.selectPlayerAvatar = function (avatarId) {
    const av = window.CiudadLinkData.AVATARS.find(a => a.id === avatarId);
    if (!av) return;

    player.avatarId = av.id;
    player.name = av.name;
    player.title = av.title;
    player.badge = av.badge;
    player.color = av.color;
    player.hatColor = av.hatColor;
    player.shirtColor = av.shirtColor;
    player.pantsColor = av.pantsColor;
    player.skinTone = av.skinTone;
    player.money = av.startingMoney;

    alert(`✨ ¡Has seleccionado a ${av.badge} ${av.name} (${av.title})!`);
    closeModalCard();
  };

  // SMARTPHONE UI
  function openSmartphoneModal() {
    const body = `
      <div style="background:#020617; border:3px solid #38bdf8; border-radius:24px; padding:1rem; max-width:380px; margin:0 auto; box-shadow:0 0 20px rgba(56,189,248,0.4);">
        <div style="text-align:center; padding-bottom:0.5rem; border-bottom:1px solid #1e293b; color:#38bdf8; font-weight:bold;">
          📱 Teléfono Link Smart Pro
        </div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem; padding:1.25rem 0; text-align:center;">
          <div style="cursor:pointer; background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:12px;" onclick="openPhoneApp('contacts')">
            <div style="font-size:2rem;">📞</div>
            <span style="font-size:0.75rem; color:#cbd5e1;">Contactos</span>
          </div>

          <div style="cursor:pointer; background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:12px;" onclick="openPhoneApp('delivery')">
            <div style="font-size:2rem;">🍕</div>
            <span style="font-size:0.75rem; color:#cbd5e1;">Delivery Food</span>
          </div>

          <div style="cursor:pointer; background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:12px;" onclick="openPhoneApp('dating')">
            <div style="font-size:2rem;">💘</div>
            <span style="font-size:0.75rem; color:#cbd5e1;">Citas Sims</span>
          </div>

          <div style="cursor:pointer; background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:12px;" onclick="openPhoneApp('taxi')">
            <div style="font-size:2rem;">🚖</div>
            <span style="font-size:0.75rem; color:#cbd5e1;">Taxi Express</span>
          </div>

          <div style="cursor:pointer; background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:12px;" onclick="openPhoneApp('bank')">
            <div style="font-size:2rem;">🏦</div>
            <span style="font-size:0.75rem; color:#cbd5e1;">Banco Link</span>
          </div>

          <div style="cursor:pointer; background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:12px;" onclick="openPhoneApp('jobs')">
            <div style="font-size:2rem;">💼</div>
            <span style="font-size:0.75rem; color:#cbd5e1;">Empleos</span>
          </div>
        </div>

        <div style="text-align:center; font-size:0.75rem; color:#64748b; border-top:1px solid #1e293b; pt:0.5rem;">
          Batería 100% • Red 5G Ciudad Link
        </div>
      </div>
    `;
    openModalCard('📱 Teléfono Inteligente', body);
  }

  window.openPhoneApp = function(app) {
    if (app === 'delivery') {
      if (player.money >= 25) {
        player.money -= 25;
        player.hunger = Math.min(100, player.hunger + 45);
        alert('🍕 ¡Delivery express entregado! Tu Hambre ha sido satisfecha (+45 Hambre). -$25.');
      } else {
        alert('❌ No tienes suficiente dinero para pedir comida ($25).');
      }
    } else if (app === 'taxi') {
      if (player.money >= 15) {
        player.money -= 15;
        player.x = 50; player.y = 50;
        player.renderX = 50; player.renderY = 50;
        alert('🚖 ¡Taxi te ha trasladado al Gran Parque Central! -$15.');
      } else {
        alert('❌ Dinero insuficiente para el taxi ($15).');
      }
    } else if (app === 'contacts') {
      const contactsHTML = window.CiudadLinkNPCs.npcs.slice(0, 10).map(n => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:0.5rem; border-radius:6px; margin-bottom:0.3rem;">
          <span>📞 ${n.name} (${n.phone})</span>
          <button class="btn btn-secondary" style="font-size:0.75rem;" onclick="callNpc('${n.id}')">Llamar</button>
        </div>
      `).join('');
      openModalCard('📞 Agenda de Contactos', `<div style="max-height:300px; overflow-y:auto;">${contactsHTML}</div>`);
    } else if (app === 'dating') {
      alert('💘 App Citas Sims: Has emparejado con pobladores solteros de la ciudad. ¡Visítalos en las Discotecas o Paladares para coquetear!');
    } else if (app === 'bank') {
      alert(`🏦 Banco Link App: Tu saldo actual disponible es $${player.money}. Sin deudas pendientes.`);
    } else if (app === 'jobs') {
      alert('💼 Portal de Empleos: Hay vacantes disponibles en los Paladares (Mesero/Cocinero) y Discotecas.');
    }
  };

  window.callNpc = function(npcId) {
    const npc = window.CiudadLinkNPCs.npcs.find(n => n.id === npcId);
    if (!npc) return;
    alert(`📞 En llamada con ${npc.name}: "¡Hola Link! Nos vemos pronto en la ciudad."`);
  };

  function inspectNPC(npc) {
    const kinship = window.CiudadLinkData.buildKinshipInfo(npc, window.CiudadLinkNPCs.npcs);
    const schedule = window.CiudadLinkData.SCHEDULE_RULES.getRuleForNPC(npc, window.CiudadLinkNPCs.timeOfDay, window.CiudadLinkNPCs.currentDay - 1);
    const moodStatus = npc.mood >= 75 ? '😄 Animado/a' : (npc.mood >= 40 ? '😐 Normal' : '😭 Deprimido/a');

    const body = `
      <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
        <div style="font-size:2.8rem;">${npc.gender === 'Masculino' ? '👨' : '👩'}</div>
        <div>
          <h3 style="margin:0; color:#38bdf8;">${npc.name}</h3>
          <p style="margin:0; font-size:0.85rem; color:#94a3b8;">${npc.profession} • ${npc.age} años • Tel: 📞 ${npc.phone}</p>
          <p style="margin:0.2rem 0 0; font-size:0.8rem; color:#facc15;">Estado: <strong>${npc.relationshipState}</strong> | Vínculo: ${npc.relationshipLevel}%</p>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:8px; margin-bottom:1rem; display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.8rem;">
        <div>🍗 Hambre: <strong>${Math.round(npc.hunger)}/100</strong></div>
        <div>😴 Sueño: <strong>${Math.round(npc.sleep)}/100</strong></div>
        <div>🎭 Ánimo: <strong>${moodStatus}</strong></div>
        <div>💬 Social: <strong>${Math.round(npc.social)}/100</strong></div>
      </div>

      <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:8px; margin-bottom:1rem;">
        <strong style="color:#fbbf24;">📍 Actividad Actual:</strong>
        <p style="margin:0.25rem 0; font-size:0.82rem;">${schedule.desc}</p>
      </div>

      <strong style="color:#38bdf8; display:block; margin-bottom:0.5rem;">💬 Interacciones Tipo Sims:</strong>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:1rem;">
        <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="interactNpcAction('${npc.id}', 'TALK')">🗣️ Hablar y Chismear</button>
        <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="interactNpcAction('${npc.id}', 'FLIRT')">💖 Coquetear / Enamorar</button>
        <button class="btn btn-secondary" style="font-size:0.8rem;" onclick="interactNpcAction('${npc.id}', 'PARTY')">🎉 Invitar a Fiesta / Discoteca</button>
        <button class="btn btn-primary" style="font-size:0.8rem;" onclick="interactNpcAction('${npc.id}', 'MARRY')">💍 Proponer Matrimonio</button>
      </div>

      <div style="text-align:right;">
        <button class="btn btn-secondary" style="font-size:0.8rem; color:#f87171;" onclick="triggerPoliceArrest('${npc.id}')">🚔 Arrestar Policialmente</button>
      </div>
    `;

    openModalCard('👤 Ficha & Interacción Sims', body);
  }

  window.interactNpcAction = function(npcId, action) {
    const npc = window.CiudadLinkNPCs.npcs.find(n => n.id === npcId);
    if (!npc) return;

    if (action === 'TALK') {
      npc.relationshipLevel = Math.min(100, npc.relationshipLevel + 12);
      npc.social = Math.min(100, npc.social + 20);
      player.mood = Math.min(100, player.mood + 10);
      alert(`🗣️ Has charlado con ${npc.name}. ¡Le ha encantado la conversación! Relación +12%.`);
    } else if (action === 'FLIRT') {
      if (npc.relationshipLevel < 25) {
        alert(`😅 ${npc.name} dice: "Aún no nos conocemos lo suficiente..." (Requiere relación 25%)`);
      } else {
        npc.relationshipLevel = Math.min(100, npc.relationshipLevel + 20);
        npc.relationshipState = 'Pareja';
        alert(`💖 ¡Coqueteo exitoso! ${npc.name} ahora es tu Pareja Amorosa.`);
      }
    } else if (action === 'PARTY') {
      player.mood = Math.min(100, player.mood + 25);
      npc.mood = Math.min(100, npc.mood + 30);
      alert(`🎉 ¡Fiesta total en la Discoteca con ${npc.name}! Ambos están de excelente ánimo.`);
    } else if (action === 'MARRY') {
      if (npc.relationshipLevel < 80) {
        alert(`💍 ${npc.name} sonríe pero reponde: "¡Es muy pronto! Necesitamos más amor (80%+)."`);
      } else {
        npc.relationshipState = 'Esposa';
        npc.spouseId = player.avatarId;
        player.spouse = npc.name;
        alert(`👩‍❤️‍👨 ¡FELICITACIONES! Te has casado con ${npc.name}. ¡Ahora es tu Esposa en Ciudad Link!`);
      }
    }
    inspectNPC(npc);
  };

  window.triggerPoliceArrest = function (npcId) {
    const npc = window.CiudadLinkNPCs.npcs.find(n => n.id === npcId);
    if (!npc) return;
    const res = window.CiudadLinkLawCourt.arrestCriminal(npc, player.name);
    alert(res.message);
    closeModalCard();
  };

  // BUILDING INTERIOR ENTRY & FLOOR LOADING SYSTEM
  function openBuildingInteriorEntryModal(bldg) {
    const totalFloors = bldg.hotelObj ? bldg.hotelObj.floorsCount : 3;

    let floorButtonsHTML = '';
    for (let f = 1; f <= totalFloors; f++) {
      floorButtonsHTML += `
        <button class="btn btn-secondary" style="font-size:0.82rem; padding:0.5rem;" onclick="enterBuildingInteriorFloorById('${bldg.id}', ${f})">
          🏢 Entrar al Piso ${f}
        </button>
      `;
    }

    const body = `
      <div style="text-align:center; margin-bottom:1rem;">
        <h4 style="color:#38bdf8; margin:0 0 0.3rem;">${bldg.name}</h4>
        <p style="font-size:0.82rem; color:#cbd5e1; margin:0;">${bldg.desc}</p>
        <div style="font-size:0.75rem; color:#facc15; margin-top:0.5rem; background:rgba(250,204,21,0.1); padding:0.4rem; border-radius:6px;">
          💡 <b>Carga por Planta:</b> Al entrar se eliminará el techo y solo cargará el piso seleccionado para evitar que la app se trabe.
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; max-height:280px; overflow-y:auto;">
        ${floorButtonsHTML}
      </div>
    `;

    openModalCard(`🏢 Entrar a ${bldg.name}`, body);
  }

  function enterBuildingInteriorFloor(bldg, floorNum) {
    player.insideBuilding = bldg;
    player.interiorFloor = floorNum;
    player.path = [];
    closeModalCard();
    alert(`🏢 Entraste a ${bldg.name} (Piso ${floorNum}). Techo eliminado. Solo este piso está cargado en ejecución.`);
  }

  window.enterBuildingInteriorFloorById = function(bldgId, floorNum) {
    const bldg = window.CiudadLinkMap.buildings.find(b => b.id === bldgId);
    if (bldg) {
      enterBuildingInteriorFloor(bldg, floorNum);
    }
  };

  function openElevatorModal(hotel) {
    let floorsHTML = '';
    for (let f = hotel.floorsCount; f >= 1; f--) {
      const flData = hotel.floors.find(fl => fl.floorNumber === f);
      let occCount = 0;
      flData.rooms.forEach(r => occCount += r.residents.length);

      floorsHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:0.6rem 1rem; border-radius:8px; margin-bottom:0.4rem;">
          <div>
            <strong>Piso ${f}</strong> — 5 Habitaciones (${occCount}/15 residentes)
          </div>
          <button class="btn btn-primary" style="padding:0.25rem 0.75rem; font-size:0.8rem;" onclick="selectElevatorFloor('${hotel.id}', ${f})">🛗 Entrar al Piso ${f}</button>
        </div>
      `;
    }

    const body = `
      <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">
        🏢 <strong>${hotel.name}</strong> — Rascacielos de ${hotel.floorsCount} pisos con elevadores express. Cada piso cuenta con 5 habitaciones (capacidad para 3 personas por habitación).
      </p>
      <div style="max-height:300px; overflow-y:auto;">
        ${floorsHTML}
      </div>
    `;

    openModalCard('🛗 Panel del Elevador Express', body);
  }

  window.selectElevatorFloor = function (hotelId, floorNum) {
    const bldg = window.CiudadLinkMap.buildings.find(b => b.id === hotelId);
    player.currentHotelId = hotelId;
    player.currentFloor = floorNum;

    if (bldg) {
      enterBuildingInteriorFloor(bldg, floorNum);
    } else {
      alert(`🛗 Has tomado el elevador hasta el Piso ${floorNum} del ${hotelId.toUpperCase()}.`);
      closeModalCard();
    }
  };

  function openLawsModal() {
    const laws = window.CiudadLinkData.LAWS;
    const lawsHTML = laws.map(l => `
      <div style="background:rgba(26,33,51,0.8); border:1px solid #334155; padding:0.75rem; border-radius:8px; margin-bottom:0.5rem;">
        <div style="display:flex; justify-content:space-between; font-weight:700; color:#c084fc;">
          <span>${l.id}: ${l.title}</span>
          <span>Multa: $${l.fine}</span>
        </div>
        <p style="margin:0.25rem 0; font-size:0.8rem; color:#cbd5e1;">${l.desc}</p>
      </div>
    `).join('');

    const body = `
      <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">
        📜 Código Penal y Reglamento General Urbano de Ciudad Link:
      </p>
      <div style="max-height:350px; overflow-y:auto;">
        ${lawsHTML}
      </div>
    `;

    openModalCard('📜 Catálogo Oficial de Leyes', body);
  }

  function openPresidenciaModal() {
    const body = `
      <div style="text-align:center; padding:1rem;">
        <div style="font-size:3rem; margin-bottom:0.5rem;">👑</div>
        <h3 style="color:#f59e0b; margin-bottom:0.5rem;">Presidencia Link — Sede de Gobierno</h3>
        <p style="font-size:0.85rem; color:#cbd5e1; line-height:1.4;">
          Desde aquí se promulgan los Decretos Presidenciales, se regulan los alquileres de los hoteles de 10 pisos y se fiscaliza el cumplimiento de los horarios escolares y laborales.
        </p>
        <button class="btn btn-primary" style="margin-top:1rem;" onclick="issuePresidentialDecree()">📜 Emitir Decreto Presidencial</button>
      </div>
    `;
    openModalCard('👑 Presidencia Link', body);
  }

  window.issuePresidentialDecree = function () {
    alert('📜 ¡Decreto Presidencial Promulgado! Se ha decretado bonificación de transporte para los estudiantes y trabajadores.');
    closeModalCard();
  };

  function openCatalogModal() {
    const items = window.CiudadLinkData.ITEMS.slice(0, 30);
    const itemsHTML = items.map(i => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:0.5rem; border-radius:6px; margin-bottom:0.35rem;">
        <span>${i.icon} <strong>${i.name}</strong> (${i.cat})</span>
        <span style="color:#facc15;">$${i.price}</span>
      </div>
    `).join('');

    const body = `
      <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">
        📦 Muestra del Catálogo General (>1,000 Artículos Certificados de Ciudad Link):
      </p>
      <div style="max-height:320px; overflow-y:auto;">
        ${itemsHTML}
      </div>
    `;
    openModalCard('📦 Catálogo de Artículos (>1,000)', body);
  }

  function openCitizensListModal() {
    const npcs = window.CiudadLinkNPCs.npcs.slice(0, 30);
    const profs = window.CiudadLinkData.PROFESSIONS;
    const listHTML = npcs.map(n => {
      const profObj = profs.find(p => p.id === n.profession);
      const profTitle = profObj ? profObj.title : n.profession;
      return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:0.5rem; border-radius:6px; margin-bottom:0.35rem; cursor:pointer;" onclick="inspectNPCById('${n.id}')">
        <span>${n.gender === 'Masculino' ? '👨' : '👩'} <strong>${n.name}</strong> (${profTitle})</span>
        <span style="font-size:0.75rem; color:#38bdf8;">Ver Ficha →</span>
      </div>
    `;
    }).join('');

    const body = `
      <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">
        👥 Padrón Municipal de Ciudadanos (100+ Pobladores):
      </p>
      <div style="max-height:320px; overflow-y:auto;">
        ${listHTML}
      </div>
    `;
    openModalCard('👥 Censo Municipal de Ciudad Link', body);
  }

  window.inspectNPCById = function (id) {
    const npc = window.CiudadLinkNPCs.npcs.find(n => n.id === id);
    if (npc) inspectNPC(npc);
  };

  function openModalCard(title, bodyHTML) {
    const overlay = document.getElementById('gameModal');
    document.getElementById('gameModalTitle').textContent = title;
    document.getElementById('gameModalBody').innerHTML = bodyHTML;
    overlay.classList.add('active');
  }

  function closeModalCard() {
    const overlay = document.getElementById('gameModal');
    overlay.classList.remove('active');
  }

  window.closeModalCard = closeModalCard;

  function updateUI() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', updateUI);
  window.addEventListener('load', initGame);
})();
