/**
 * CIUDAD LINK - MAIN GAME LOOP, PSEUDO-3D RENDERING, CONTINUOUS TOUCH CONTROLS & AVATAR SELECTION
 * Handles 3D depth rendering of the city, clear unblinded map vision, vehicle traffic,
 * touch-anywhere controls for phone screens, multi-floor hotel elevators, and citizen profiles.
 */

(function () {
  'use strict';

  let canvas, ctx;

  // Active Player Character State
  let player = {
    avatarId: 'hero_link',
    name: 'Link',
    title: 'Héroe Urbano',
    badge: '🧝',
    color: '#22c55e',
    hatColor: '#16a34a',
    shirtColor: '#22c55e',
    pantsColor: '#15803d',
    skinTone: '#fde047',
    x: 50, y: 12, // Starting position near Presidencia Link
    money: 600,
    health: 100, maxHealth: 100,
    energy: 100, maxEnergy: 100,
    hunger: 90, maxHunger: 100,
    sleep: 90, maxSleep: 100,
    mood: 85, maxMood: 100, // Ánimo / Depresión (100 = Animado, <30 = Deprimido)
    spouse: null, // Married NPC
    isWalking: false,
    facing: 'S', // 'N', 'S', 'E', 'W'
    path: [],
    currentHotelId: null,
    currentFloor: 1,
    inventory: []
  };

  let camera = { x: 0, y: 0 };
  let lastTime = performance.now();

  // Continuous Pointer/Touch Interaction
  let isPointerDown = false;
  let pointerWorldPos = { x: 50, y: 12 };

  function initGame() {
    canvas = document.getElementById('cityCanvas');
    ctx = canvas.getContext('2d');

    // Initialize City Map, Traffic Vehicles & NPCs
    window.CiudadLinkMap.initCityMap();
    window.CiudadLinkVehicles.initTraffic(window.CiudadLinkMap.MAP_WIDTH, window.CiudadLinkMap.MAP_HEIGHT, window.CiudadLinkMap.TILE_SIZE);
    window.CiudadLinkNPCs.spawnPopulation(window.CiudadLinkMap.hotels);

    // Initial player inventory from catalog
    player.inventory = [
      window.CiudadLinkData.ITEMS[0], // Llave del Elevador
      window.CiudadLinkData.ITEMS[2], // Manual de Leyes
      window.CiudadLinkData.ITEMS[8]  // Manzana
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

        // Move step by step towards target
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
      // Pathwalking A*
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

    // Update NPC AI Simulation & Traffic Vehicles
    window.CiudadLinkNPCs.updateNPCSimulation(deltaSec, player.isWalking);
    window.CiudadLinkVehicles.updateVehicles(deltaSec, player.x, player.y);

    // Update Camera smoothly centered on Player
    const targetCamX = player.x * tileSize - canvas.width / 2 + tileSize / 2;
    const targetCamY = player.y * tileSize - canvas.height / 2 + tileSize / 2;
    camera.x += (targetCamX - camera.x) * 0.15;
    camera.y += (targetCamY - camera.y) * 0.15;

    // Update HUD Metrics
    document.getElementById('lblTimeOfDay').textContent = window.CiudadLinkNPCs.getTimeFormatted();
    document.getElementById('lblPlayerAvatar').textContent = `${player.badge} ${player.name}`;
    document.getElementById('lblPlayerMoney').textContent = `$${player.money}`;
    document.getElementById('lblPlayerHealth').textContent = `${player.health}/100`;
    document.getElementById('lblPlayerEnergy').textContent = `${player.energy}/100`;
    if (document.getElementById('lblPlayerHunger')) document.getElementById('lblPlayerHunger').textContent = `${Math.round(player.hunger)}/100`;
    if (document.getElementById('lblPlayerMood')) document.getElementById('lblPlayerMood').textContent = `${Math.round(player.mood)}/100`;
  }

  // MAIN PSEUDO-3D CITY RENDERER
  function render() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tileSize = window.CiudadLinkMap.TILE_SIZE;
    const grid = window.CiudadLinkMap.grid;
    const mapW = window.CiudadLinkMap.MAP_WIDTH;
    const mapH = window.CiudadLinkMap.MAP_HEIGHT;
    const timeOfDay = window.CiudadLinkNPCs.timeOfDay;
    const isNight = (timeOfDay < 6.0 || timeOfDay >= 19.0);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Ground Tiles Grid (Streets, Sidewalks, Grass, Lake)
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
          ctx.fillStyle = '#334155';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.CROSSWALK) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.fillStyle = '#f8fafc'; // White zebra lines
          ctx.fillRect(sx + 4, sy + 2, tileSize - 8, 5);
          ctx.fillRect(sx + 4, sy + 12, tileSize - 8, 5);
          ctx.fillRect(sx + 4, sy + 22, tileSize - 8, 5);
        } else if (tileType === window.CiudadLinkMap.TILE.STREET) {
          ctx.fillStyle = '#64748b'; // Sidewalk pavement
          ctx.fillRect(sx, sy, tileSize, tileSize);
          // 3D Curb lines
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(sx, sy, tileSize, 2);
        } else if (tileType === window.CiudadLinkMap.TILE.PARK) {
          ctx.fillStyle = '#15803d'; // Park grass
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.fillStyle = '#166534';
          ctx.fillRect(sx + 2, sy + 2, 4, 4);
        } else if (tileType === window.CiudadLinkMap.TILE.LAKE) {
          ctx.fillStyle = '#0284c7'; // Water lake
          ctx.fillRect(sx, sy, tileSize, tileSize);
          // Water ripples animation
          const ripple = Math.sin((performance.now() * 0.003) + (c + r)) * 3;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(sx + 6 + ripple, sy + 12, 10, 2);
        } else if (tileType === window.CiudadLinkMap.TILE.FOUNTAIN) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(sx + tileSize / 2, sy + tileSize / 2, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(sx + tileSize / 2, sy + tileSize / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Building base ground
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        }
      }
    }

    // 2. Y-SORTING ENTITIES (Buildings, Environmental Objects, Cars, NPCs, Player)
    const renderList = [];

    // Add Buildings with 3D Depth
    window.CiudadLinkMap.buildings.forEach(b => {
      renderList.push({
        type: 'BUILDING',
        yOrder: (b.y + b.h) * tileSize,
        data: b
      });
    });

    // Add Environmental Objects (Trees, Streetlights, Benches)
    window.CiudadLinkMap.environmentalObjects.forEach(obj => {
      renderList.push({
        type: 'ENV_OBJ',
        yOrder: (obj.y + 1) * tileSize,
        data: obj
      });
    });

    // Add Cars & Vehicles
    window.CiudadLinkVehicles.vehicles.forEach(v => {
      renderList.push({
        type: 'VEHICLE',
        yOrder: (v.y + 0.5) * tileSize,
        data: v
      });
    });

    // Add NPCs
    window.CiudadLinkNPCs.npcs.forEach(npc => {
      renderList.push({
        type: 'NPC',
        yOrder: (npc.y + 0.5) * tileSize,
        data: npc
      });
    });

    // Add Dogs
    window.CiudadLinkVehicles.dogs.forEach(d => {
      renderList.push({
        type: 'DOG',
        yOrder: (d.y + 0.5) * tileSize,
        data: d
      });
    });

    // Add Player Character
    renderList.push({
      type: 'PLAYER',
      yOrder: (player.y + 0.5) * tileSize,
      data: player
    });

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

    // Render Overhead Helicopters on Top Z-Layer
    window.CiudadLinkVehicles.helicopters.forEach(h => {
      window.CiudadLinkVehicles.renderHelicopterOverhead(ctx, h, tileSize, isNight);
    });

    ctx.restore();

    // 4. Subtle Day/Night Lighting Blend (Map remains 100% visible and unblinded)
    const nightTint = window.CiudadLinkNPCs.getLightingOverlay();
    if (nightTint > 0) {
      ctx.fillStyle = `rgba(15, 23, 42, ${nightTint})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // 2.5D PSEUDO-3D BUILDING RENDERER
  function renderBuilding3D(ctx, b, tileSize, isNight) {
    const bx = b.x * tileSize;
    const by = b.y * tileSize;
    const bw = b.w * tileSize;
    const bh = b.h * tileSize;
    const height = b.height || 28; // 3D Elevation

    ctx.save();

    // Drop Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(bx + height * 0.4, by + bh, bw, height * 0.3);

    // 1. Front Wall Facade
    ctx.fillStyle = b.wallColor || '#1e293b';
    ctx.fillRect(bx, by - height, bw, bh);

    // 2. 3D Side Shadow Wall (Depth)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(bx + bw, by - height);
    ctx.lineTo(bx + bw + height * 0.3, by - height - height * 0.2);
    ctx.lineTo(bx + bw + height * 0.3, by + bh - height * 0.2);
    ctx.lineTo(bx + bw, by + bh);
    ctx.closePath();
    ctx.fill();

    // 3. Roof Top Plate
    ctx.fillStyle = b.roofColor || '#334155';
    ctx.fillRect(bx, by - height, bw, 10);

    // 4. Windows Grid with Glowing Frame at Night
    const cols = Math.floor(bw / 20);
    const rows = Math.floor((bh - 16) / 20);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = bx + 8 + c * 18;
        const wy = by - height + 16 + r * 18;

        ctx.fillStyle = isNight && Math.sin(wx + wy) > -0.2 ? '#fef08a' : '#38bdf8';
        ctx.fillRect(wx, wy, 10, 10);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, 10, 10);
      }
    }

    // 5. Entrance Door & Building Sign Title
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
      // Tree Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(ox + 4, oy + 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tree Trunk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(ox - 3, oy - 14, 6, 14);

      // Layered Canopy
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(ox, oy - 22, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(ox - 2, oy - 25, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === 'LIGHT') {
      // Streetlamp pole
      ctx.fillStyle = '#475569';
      ctx.fillRect(ox - 2, oy - 22, 4, 22);

      // Light bulb
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(ox, oy - 22, 5, 0, Math.PI * 2);
      ctx.fill();

      // Night light cone projected on ground
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

  // 3D CHARACTER / NPC RENDERER
  function renderNPC3D(ctx, npc, tileSize, isNight) {
    const nx = npc.x * tileSize + tileSize / 2;
    const ny = npc.y * tileSize + tileSize / 2;

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

  // 3D PLAYER RENDERER
  function renderPlayer3D(ctx, p, tileSize, isNight) {
    const px = p.x * tileSize + tileSize / 2;
    const py = p.y * tileSize + tileSize / 2;

    ctx.save();

    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(px, py + 8, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Pants
    ctx.fillStyle = p.pantsColor || '#15803d';
    ctx.fillRect(px - 6, py, 5, 9);
    ctx.fillRect(px + 1, py, 5, 9);

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
    // Canvas Touch & Pointer Event Handlers for Touch-Anywhere Movement
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
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left + camera.x;
      const clickY = e.clientY - rect.top + camera.y;

      const tileSize = window.CiudadLinkMap.TILE_SIZE;
      const targetX = Math.floor(clickX / tileSize);
      const targetY = Math.floor(clickY / tileSize);

      // Check if clicked on an NPC to inspect
      const clickedNpc = window.CiudadLinkNPCs.npcs.find(n => n.x === targetX && n.y === targetY);
      if (clickedNpc) {
        inspectNPC(clickedNpc);
        return;
      }

      // Check if clicked on Elevator / Hotel
      const hotel = window.CiudadLinkMap.hotels.find(h => h.elevatorX === targetX && h.elevatorY === targetY);
      if (hotel) {
        openElevatorModal(hotel);
        return;
      }

      // A* Pathfinding to tapped position
      const path = window.CiudadLinkMap.findPath({ x: player.x, y: player.y }, { x: targetX, y: targetY });
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

    // Nav Menu Buttons
    document.getElementById('btnChooseAvatar')?.addEventListener('click', openAvatarSelectorModal);
    document.getElementById('btnOpenPhone')?.addEventListener('click', openSmartphoneModal);
    document.getElementById('btnOpenLaws')?.addEventListener('click', openLawsModal);
    document.getElementById('btnOpenPresidencia')?.addEventListener('click', openPresidenciaModal);
    document.getElementById('btnOpenCatalog')?.addEventListener('click', openCatalogModal);
    document.getElementById('btnOpenCitizens')?.addEventListener('click', openCitizensListModal);
  }

  function updatePointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    pointerWorldPos.x = (e.clientX - rect.left) * scaleX + camera.x;
    pointerWorldPos.y = (e.clientY - rect.top) * scaleY + camera.y;
  }

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

  // SMARTPHONE UI (TELÉFONO LINK / LARA TELÉFONO)
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
        player.x = 50; player.y = 50; // Central Park dropoff
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

      <!-- Sims Needs Meters for NPC -->
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
          <button class="btn btn-primary" style="padding:0.25rem 0.75rem; font-size:0.8rem;" onclick="selectElevatorFloor('${hotel.id}', ${f})">🛗 Ir al Piso ${f}</button>
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
    player.currentHotelId = hotelId;
    player.currentFloor = floorNum;
    alert(`🛗 Has tomado el elevador hasta el Piso ${floorNum} del ${hotelId.toUpperCase()}.`);
    closeModalCard();
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
    canvas.width = Math.min(800, window.innerWidth - 32);
    canvas.height = 520;
  }

  window.addEventListener('resize', updateUI);
  window.addEventListener('load', initGame);
})();
