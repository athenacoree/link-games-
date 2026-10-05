/**
 * CIUDAD LINK - MAIN GAME LOOP, CANVAS RENDERING, INPUT & MODALS
 * Handles rendering of the vast city, dynamic field of vision (FOV) smooth expansion,
 * day/night cycle, multi-floor hotels with elevators, inspection of citizens & legal trials.
 */

(function () {
  'use strict';

  let canvas, ctx;
  let player = {
    name: 'Link',
    title: 'Ciudadano Ejemplar',
    x: 50, y: 12, // Starting near Presidencia Link
    money: 500,
    health: 100, maxHealth: 100,
    energy: 100, maxEnergy: 100,
    isWalking: false,
    path: [],
    currentHotelId: null,
    currentFloor: 1,
    inventory: []
  };

  let lastTime = performance.now();
  let camera = { x: 0, y: 0 };

  function initGame() {
    canvas = document.getElementById('cityCanvas');
    ctx = canvas.getContext('2d');

    // Initialize Map & NPCs
    window.CiudadLinkMap.initCityMap();
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
    // Handle Player Path Walking
    if (player.path && player.path.length > 0) {
      player.isWalking = true;
      let nextTile = player.path.shift();
      player.x = nextTile.x;
      player.y = nextTile.y;

      // SFX step
      if (window.SuperEngine && window.SuperEngine.Audio) {
        window.SuperEngine.Audio.playSFX('step');
      }
    } else {
      player.isWalking = false;
    }

    // Update NPC AI Simulation, Dynamic FOV radius & Time
    window.CiudadLinkNPCs.updateNPCSimulation(deltaSec, player.isWalking);

    // Update Camera Center on Player
    const tileSize = window.CiudadLinkMap.TILE_SIZE;
    camera.x = player.x * tileSize - canvas.width / 2 + tileSize / 2;
    camera.y = player.y * tileSize - canvas.height / 2 + tileSize / 2;

    // Update HUD Metrics
    document.getElementById('lblTimeOfDay').textContent = window.CiudadLinkNPCs.getTimeFormatted();
    document.getElementById('lblPlayerMoney').textContent = `$${player.money}`;
    document.getElementById('lblPlayerHealth').textContent = `${player.health}/100`;
    document.getElementById('lblPlayerEnergy').textContent = `${player.energy}/100`;
  }

  function render() {
    // Clear Canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tileSize = window.CiudadLinkMap.TILE_SIZE;
    const grid = window.CiudadLinkMap.grid;
    const mapW = window.CiudadLinkMap.MAP_WIDTH;
    const mapH = window.CiudadLinkMap.MAP_HEIGHT;

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Map Tiles
    for (let r = 0; r < mapH; r++) {
      for (let c = 0; c < mapW; c++) {
        const sx = c * tileSize;
        const sy = r * tileSize;

        // Skip off-screen tiles
        if (sx + tileSize < camera.x || sx > camera.x + canvas.width ||
            sy + tileSize < camera.y || sy > camera.y + canvas.height) {
          continue;
        }

        const tileType = grid[r][c];

        if (tileType === window.CiudadLinkMap.TILE.ROAD) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.STREET) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.PARK) {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.PRESIDENCIA) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.strokeStyle = '#f59e0b';
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.POLICE) {
          ctx.fillStyle = '#1e40af';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.COURT) {
          ctx.fillStyle = '#6b21a8';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.HOSPITAL) {
          ctx.fillStyle = '#047857';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.CEMETERY) {
          ctx.fillStyle = '#374151';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.SCHOOL) {
          ctx.fillStyle = '#be185d';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.STORE) {
          ctx.fillStyle = '#0d9488';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.HOTEL) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx, sy, tileSize, tileSize);
          ctx.strokeStyle = '#eab308';
          ctx.strokeRect(sx, sy, tileSize, tileSize);
        } else if (tileType === window.CiudadLinkMap.TILE.ELEVATOR) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(sx, sy, tileSize, tileSize);
        }
      }
    }

    // 2. Draw Buildings Labels & Icons
    window.CiudadLinkMap.buildings.forEach(b => {
      const bx = b.x * tileSize;
      const by = b.y * tileSize;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(b.name, bx + 4, by + 16);
    });

    // 3. Draw NPCs
    const npcs = window.CiudadLinkNPCs.npcs;
    npcs.forEach(npc => {
      const nx = npc.x * tileSize;
      const ny = npc.y * tileSize;

      if (nx + tileSize >= camera.x && nx <= camera.x + canvas.width &&
          ny + tileSize >= camera.y && ny <= camera.y + canvas.height) {
        ctx.fillStyle = npc.gender === 'Masculino' ? '#38bdf8' : '#f472b6';
        ctx.beginPath();
        ctx.arc(nx + tileSize / 2, ny + tileSize / 2, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(npc.profession === 'president' ? '👑' : npc.profession.startsWith('police') ? '👮' : '👤', nx + tileSize / 2, ny + tileSize / 2 + 3);
        ctx.textAlign = 'left';
      }
    });

    // 4. Draw Player
    const px = player.x * tileSize;
    const py = player.y * tileSize;
    ctx.fillStyle = '#22c55e'; // Green Hero Link
    ctx.beginPath();
    ctx.arc(px + tileSize / 2, py + tileSize / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('🧝 Link', px - 4, py - 4);

    ctx.restore();

    // 5. Dynamic Field of Vision (FOV Spotlight Mask)
    // The player's view expands while walking and contracts smoothly when stopped.
    const playerScreenX = canvas.width / 2;
    const playerScreenY = canvas.height / 2;
    const fovRadiusPx = window.CiudadLinkNPCs.currentFOVRadius * tileSize;

    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(playerScreenX, playerScreenY, fovRadiusPx, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // 6. Day/Night Light Tint
    const darkness = window.CiudadLinkNPCs.getLightingOverlay();
    if (darkness > 0) {
      ctx.fillStyle = `rgba(15, 23, 42, ${darkness})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // CONTROLS & INTERACTION
  function setupEventListeners() {
    // Canvas Touch / Mouse Tap to Walk using A* Pathfinding
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

      // Find path
      const path = window.CiudadLinkMap.findPath({ x: player.x, y: player.y }, { x: targetX, y: targetY });
      if (path && path.length > 0) {
        player.path = path;
      }
    });

    // Keyboard Controls WASD / Arrows
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
        }
      }
    });

    // D-Pad Touch Buttons
    document.getElementById('btnUp')?.addEventListener('click', () => movePlayerBy(0, -1));
    document.getElementById('btnDown')?.addEventListener('click', () => movePlayerBy(0, 1));
    document.getElementById('btnLeft')?.addEventListener('click', () => movePlayerBy(-1, 0));
    document.getElementById('btnRight')?.addEventListener('click', () => movePlayerBy(1, 0));

    // Nav Menu Buttons
    document.getElementById('btnOpenLaws')?.addEventListener('click', openLawsModal);
    document.getElementById('btnOpenPresidencia')?.addEventListener('click', openPresidenciaModal);
    document.getElementById('btnOpenCatalog')?.addEventListener('click', openCatalogModal);
    document.getElementById('btnOpenCitizens')?.addEventListener('click', openCitizensListModal);
  }

  function movePlayerBy(dx, dy) {
    let nx = player.x + dx;
    let ny = player.y + dy;
    if (window.CiudadLinkMap.isTileWalkable(nx, ny)) {
      player.x = nx;
      player.y = ny;
      player.isWalking = true;
    }
  }

  // MODALS LOGIC
  function inspectNPC(npc) {
    const kinship = window.CiudadLinkData.buildKinshipInfo(npc, window.CiudadLinkNPCs.npcs);
    const schedule = window.CiudadLinkData.SCHEDULE_RULES.getRuleForNPC(npc, window.CiudadLinkNPCs.timeOfDay, window.CiudadLinkNPCs.currentDay - 1);

    const body = `
      <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
        <div style="font-size:2.5rem;">${npc.gender === 'Masculino' ? '👨' : '👩'}</div>
        <div>
          <h3 style="margin:0; color:#38bdf8;">${npc.name}</h3>
          <p style="margin:0; font-size:0.85rem; color:#94a3b8;">${npc.profession} • ${npc.age} años • Género: ${npc.gender}</p>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.05); padding:0.85rem; border-radius:8px; margin-bottom:1rem;">
        <strong style="color:#fbbf24;">📍 Actividad Actual (Regla General):</strong>
        <p style="margin:0.25rem 0; font-size:0.85rem;">${schedule.desc}</p>
        <span class="badge badge-purple">Lugar: ${schedule.target.toUpperCase()}</span>
      </div>
      <div style="margin-bottom:1rem;">
        <strong style="color:#c084fc;">👨‍👩‍👧‍👦 Lazos Familiares:</strong>
        <ul style="margin:0.25rem 0; padding-left:1.25rem; font-size:0.85rem; color:#e2e8f0;">
          ${kinship.length > 0 ? kinship.map(k => `<li>${k.role}: <strong>${k.name}</strong></li>`).join('') : '<li>Sin lazos directos registrados en la municipalidad.</li>'}
        </ul>
      </div>
      <div>
        <strong style="color:#34d399;">🏢 Habitación de Hotel/Residencia:</strong>
        <p style="margin:0.25rem 0; font-size:0.85rem; color:#e2e8f0;">
          ${npc.assignedHotelId ? `Hotel: ${npc.assignedHotelId.toUpperCase()} • Piso ${npc.assignedFloor} • Habitación ${npc.assignedRoom} (3 pers/hab)` : 'Sin habitación asignada actualmente.'}
        </p>
      </div>
      <div style="margin-top:1rem; text-align:right;">
        <button class="btn btn-secondary" onclick="triggerPoliceArrest('${npc.id}')">🚔 Arrestar por Infracción</button>
      </div>
    `;

    openModalCard('👤 Ficha Oficial del Ciudadano', body);
  }

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
    // Canvas responsiveness
    canvas.width = Math.min(800, window.innerWidth - 32);
    canvas.height = 500;
  }

  window.addEventListener('resize', updateUI);
  window.addEventListener('load', initGame);
})();
