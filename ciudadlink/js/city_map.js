/**
 * CIUDAD LINK - CITY MAP GENERATOR, HIERARCHICAL QUADRANTS & PRIORITY ROUTING
 * Manages 100x100 city grid, 10x10x10 Hierarchical Spatial Partitioning (10 Groups, 10 Subgroups, 10 Sub-subgroups),
 * Numeric Tile Priority Routing System (Levels 1, 2, 3, 4 for Pedestrian vs. Driver), and A* Pathfinding.
 */

window.CiudadLinkMap = (function () {
  'use strict';

  const MAP_WIDTH = 100;
  const MAP_HEIGHT = 100;
  const TILE_SIZE = 32;

  // TILE TYPES
  const TILE = {
    STREET: 0,
    ROAD: 1,
    PARK: 2,
    PRESIDENCIA: 3,
    POLICE: 4,
    COURT: 5,
    HOSPITAL: 6,
    CEMETERY: 7,
    SCHOOL: 8,
    STORE: 9,
    HOTEL: 10,
    ELEVATOR: 11,
    WALL: 12,
    WATER: 13,
    CROSSWALK: 14,
    TRAFFIC_LIGHT: 15,
    BANK: 16,
    FIRE_STATION: 17,
    GAS_STATION: 18,
    LAKE: 19,
    FOUNTAIN: 20,
    PALADAR: 21,
    DISCOTECA: 22,
    CLUB_VIP: 23,
    HOUSE: 24,
    BARRIO_BAJERO: 25
  };

  let grid = [];
  let buildings = [];
  let hotels = [];
  let environmentalObjects = []; // Trees, Streetlights, Benches

  // 10x10x10 HIERARCHICAL QUADRANT GRID PARTITIONING
  // The 100x100 city is divided into 10 Main Groups (each 10x10 tiles or 100 tiles)
  // Each Main Group contains 10 Subgroups (each 10 tiles)
  // Each Subgroup contains 10 Sub-subgroups (individual micro-quadrant units / tiles)
  function getQuadrantHierarchy(x, y) {
    const clampedX = Math.max(0, Math.min(MAP_WIDTH - 1, Math.floor(x)));
    const clampedY = Math.max(0, Math.min(MAP_HEIGHT - 1, Math.floor(y)));

    const tileIndex = clampedY * MAP_WIDTH + clampedX; // 0..9999
    const group = Math.floor(tileIndex / 1000) + 1;    // Group 1..10
    const groupRem = tileIndex % 1000;
    const subgroup = Math.floor(groupRem / 100) + 1;   // Subgroup 1..10
    const subSubgroup = (groupRem % 10) + 1;           // Sub-subgroup 1..10

    return {
      group,
      subgroup,
      subSubgroup,
      code: `G${group}-SG${subgroup}-SSG${subSubgroup}`,
      title: `Grupo ${group} • Subgrupo ${subgroup} • Micro ${subSubgroup}`,
      x: clampedX,
      y: clampedY
    };
  }

  // Active micro-quadrant area surrounding a given tile position
  function getSurroundingQuadrantTiles(centerTileX, centerTileY, radiusInTiles = 15) {
    const minX = Math.max(0, centerTileX - radiusInTiles);
    const maxX = Math.min(MAP_WIDTH - 1, centerTileX + radiusInTiles);
    const minY = Math.max(0, centerTileY - radiusInTiles);
    const maxY = Math.min(MAP_HEIGHT - 1, centerTileY + radiusInTiles);

    return { minX, maxX, minY, maxY };
  }

  // 10 DISTINCT SECTORS / BARRIOS WITH ON-DEMAND INDEPENDENT LOADING
  const BARRIOS = [
    { id: 'B1', num: 1, name: 'Barrio 1: Cívico & Comisaría Central', desc: 'Comisaría de policía, celdas y zona cívica.', xMin: 0, xMax: 31, yMin: 0, yMax: 31, spawnX: 16, spawnY: 16, color: '#38bdf8' },
    { id: 'B2', num: 2, name: 'Barrio 2: Presidencial Norte', desc: 'Palacio de la Presidencia Link y plazas de gobierno.', xMin: 32, xMax: 67, yMin: 0, yMax: 31, spawnX: 50, spawnY: 16, color: '#fbbf24' },
    { id: 'B3', num: 3, name: 'Barrio 3: Tribunal & Cementerio', desc: 'Corte Judicial, juzgados y cementerio municipal.', xMin: 68, xMax: 99, yMin: 0, yMax: 31, spawnX: 84, spawnY: 16, color: '#c084fc' },
    { id: 'B4', num: 4, name: 'Barrio 4: Hospital & Emergencias', desc: 'Hospital General Link y estación de bomberos.', xMin: 0, xMax: 31, yMin: 32, yMax: 67, spawnX: 16, spawnY: 50, color: '#34d399' },
    { id: 'B5', num: 5, name: 'Barrio 5: Centro Histórico & Hotel Sol', desc: 'Hotel Rascacielos Sol y torres de apartamentos.', xMin: 32, xMax: 67, yMin: 32, yMax: 67, spawnX: 50, spawnY: 50, color: '#eab308' },
    { id: 'B6', num: 6, name: 'Barrio 6: Comercial & Banco Central', desc: 'Banco Central Financiero y centro comercial.', xMin: 68, xMax: 99, yMin: 32, yMax: 67, spawnX: 84, spawnY: 50, color: '#2dd4bf' },
    { id: 'B7', num: 7, name: 'Barrio 7: Residencial & Escuela Central', desc: 'Casas familiares Sims y Escuela Central.', xMin: 0, xMax: 31, yMin: 68, yMax: 99, spawnX: 16, spawnY: 84, color: '#f472b6' },
    { id: 'B8', num: 8, name: 'Barrio 8: Gran Parque & Lago Ecológico', desc: 'Lago central, fuentes y parques recreativos.', xMin: 32, xMax: 49, yMin: 68, yMax: 99, spawnX: 40, spawnY: 84, color: '#22c55e' },
    { id: 'B9', num: 9, name: 'Barrio 9: Nocturno & Discoteca Neon', desc: 'Gastronomía, Paladar Don Link y Club Velvet.', xMin: 50, xMax: 74, yMin: 68, yMax: 99, spawnX: 62, spawnY: 84, color: '#a855f7' },
    { id: 'B10', num: 10, name: 'Barrio 10: Bajero Gangster & Mercado Negro', desc: 'Barrio peligroso, callejones y banda nocturna.', xMin: 75, xMax: 99, yMin: 68, yMax: 99, spawnX: 86, spawnY: 84, color: '#ef4444' }
  ];

  let activeBarrioId = 'B2';

  function getBarrioForPos(x, y) {
    for (let i = 0; i < BARRIOS.length; i++) {
      const b = BARRIOS[i];
      if (x >= b.xMin && x <= b.xMax && y >= b.yMin && y <= b.yMax) {
        return b;
      }
    }
    return BARRIOS[1]; // Default B2
  }

  function getActiveBarrio() {
    return BARRIOS.find(b => b.id === activeBarrioId) || BARRIOS[1];
  }

  function setActiveBarrioId(id) {
    const found = BARRIOS.find(b => b.id === id);
    if (found) {
      activeBarrioId = id;
    }
  }

  function getNeighboringBarrio(currentId, dir) {
    const curr = BARRIOS.find(b => b.id === currentId);
    if (!curr) return null;

    let targetX = (curr.xMin + curr.xMax) / 2;
    let targetY = (curr.yMin + curr.yMax) / 2;

    if (dir === 'N') targetY = curr.yMin - 2;
    if (dir === 'S') targetY = curr.yMax + 2;
    if (dir === 'W') targetX = curr.xMin - 2;
    if (dir === 'E') targetX = curr.xMax + 2;

    if (targetX < 0 || targetX >= MAP_WIDTH || targetY < 0 || targetY >= MAP_HEIGHT) return null;
    return getBarrioForPos(targetX, targetY);
  }

  // LEGACY SECTORS COMPATIBILITY
  const SECTORS = {
    NW: { id: 'NW', name: 'Sector Noroeste (Cívico & Salud)', xMin: 0, xMax: 49, yMin: 0, yMax: 49, spawnX: 25, spawnY: 25 },
    NE: { id: 'NE', name: 'Sector Noreste (Tribunal & Comercio)', xMin: 50, xMax: 99, yMin: 0, yMax: 49, spawnX: 75, spawnY: 25 },
    SW: { id: 'SW', name: 'Sector Suroeste (Residencial & Escolar)', xMin: 0, xMax: 49, yMin: 50, yMax: 99, spawnX: 25, spawnY: 75 },
    SE: { id: 'SE', name: 'Sector Sureste (Parque & Ocio Nocturno)', xMin: 50, xMax: 99, yMin: 50, yMax: 99, spawnX: 75, spawnY: 75 }
  };

  let activeSector = 'NW';

  // DYNAMIC OCCUPANCY TILE STATE (ON = Free/Passable, OFF = Occupied/Impassable)
  let tileOccupancyGrid = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill('ON'));
  let baseOccupancyGrid = null;

  function initBaseOccupancyGrid() {
    baseOccupancyGrid = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill('ON'));
    for (let r = 0; r < MAP_HEIGHT; r++) {
      for (let c = 0; c < MAP_WIDTH; c++) {
        baseOccupancyGrid[r][c] = isTileWalkable(c, r) ? 'ON' : 'OFF';
      }
    }
  }

  function updateOccupancyState(npcs = [], vehicles = [], player = null) {
    if (!baseOccupancyGrid) initBaseOccupancyGrid();

    // Fast copy of static base map occupancy
    for (let r = 0; r < MAP_HEIGHT; r++) {
      for (let c = 0; c < MAP_WIDTH; c++) {
        tileOccupancyGrid[r][c] = baseOccupancyGrid[r][c];
      }
    }

    // Mark active dynamic entities
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      if (n.x >= 0 && n.x < MAP_WIDTH && n.y >= 0 && n.y < MAP_HEIGHT) {
        tileOccupancyGrid[n.y][n.x] = 'OFF';
      }
    }

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const vx = Math.floor(v.x);
      const vy = Math.floor(v.y);
      if (vx >= 0 && vx < MAP_WIDTH && vy >= 0 && vy < MAP_HEIGHT) {
        tileOccupancyGrid[vy][vx] = 'OFF';
      }
    }

    if (player && player.x >= 0 && player.x < MAP_WIDTH && player.y >= 0 && player.y < MAP_HEIGHT) {
      tileOccupancyGrid[player.y][player.x] = 'OFF';
    }
  }

  function isTileOccupiedON(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    return tileOccupancyGrid[y][x] === 'ON';
  }

  function getSectorForPos(x, y) {
    if (x < 50 && y < 50) return 'NW';
    if (x >= 50 && y < 50) return 'NE';
    if (x < 50 && y >= 50) return 'SW';
    return 'SE';
  }

  function setActiveSector(sectorId) {
    if (SECTORS[sectorId]) {
      activeSector = sectorId;
    }
  }

  // TILE PRIORITY SYSTEM (LEVELS 1, 2, 3, 4)
  // Each tile always has base cost 1, but priority multiplier alters choice in pathfinding:
  // - Pedestrians: Sidewalk (STREET), Crosswalk, Park = Priority 1. Road = Priority 2. Dirt/Unpaved = Priority 3.
  // - Drivers: Road, Crosswalk = Priority 1. Sidewalk (STREET) = Priority 3. Park / Dirt = Priority 4.
  function getTilePriority(x, y, mode = 'pedestrian') {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return 999;
    const tileType = grid[y][x];

    if (mode === 'driver') {
      if (tileType === TILE.ROAD || tileType === TILE.CROSSWALK || tileType === TILE.TRAFFIC_LIGHT) return 1; // Highest priority for driving
      if (tileType === TILE.GAS_STATION) return 2;
      if (tileType === TILE.STREET) return 3; // Sidewalk (can enter if needed)
      if (tileType === TILE.PARK || tileType === TILE.BARRIO_BAJERO) return 4; // Dirt / Offroad
      return 10; // Impassable for cars
    } else {
      // Pedestrian
      if (tileType === TILE.STREET || tileType === TILE.CROSSWALK || tileType === TILE.PARK || tileType === TILE.FOUNTAIN) return 1; // Highest priority for walking
      if (tileType === TILE.HOUSE || tileType === TILE.STORE || tileType === TILE.PALADAR || tileType === TILE.DISCOTECA) return 2;
      if (tileType === TILE.ROAD) return 2; // Road passable but secondary priority to sidewalk
      if (tileType === TILE.BARRIO_BAJERO) return 3;
      return 10;
    }
  }

  // Generate City Grid with Real-World District Layout
  function initCityMap() {
    grid = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(TILE.PARK));
    buildings = [];
    hotels = [];
    environmentalObjects = [];

    // 1. Create Avenue and Road Network with Sidewalks & Crosswalks
    for (let r = 0; r < MAP_HEIGHT; r++) {
      for (let c = 0; c < MAP_WIDTH; c++) {
        const isRoadRow = (r % 20 === 0 || r % 20 === 1);
        const isRoadCol = (c % 20 === 0 || c % 20 === 1);

        if (isRoadRow || isRoadCol) {
          grid[r][c] = TILE.ROAD;

          // Crosswalks near intersections
          if ((isRoadRow && (c % 20 === 3 || c % 20 === 18)) ||
              (isRoadCol && (r % 20 === 3 || r % 20 === 18))) {
            grid[r][c] = TILE.CROSSWALK;
          }
        } else if (r % 20 === 2 || r % 20 === 19 || c % 20 === 2 || c % 20 === 19) {
          grid[r][c] = TILE.STREET; // Sidewalk
        }
      }
    }

    // 2. District 1: Civic & Government Center (North District)
    createBuildingZone(42, 4, 16, 14, TILE.PRESIDENCIA, 'Presidencia Link', '👑 Casa del Presidente & Palacio Municipal', {
      height: 18, wallColor: '#b45309', roofColor: '#78350f', accentColor: '#fbbf24', style: 'PALACE'
    });

    createBuildingZone(5, 4, 12, 12, TILE.POLICE, 'Estación de Policía Central', '🚔 Comisaría, Celdas y Custodia', {
      height: 14, wallColor: '#1e3a8a', roofColor: '#1e40af', accentColor: '#38bdf8', style: 'POLICE'
    });

    createBuildingZone(82, 4, 12, 12, TILE.COURT, 'Tribunal & Juzgados', '⚖️ Corte Judicial y Colegio de Abogados', {
      height: 15, wallColor: '#581c87', roofColor: '#6b21a8', accentColor: '#c084fc', style: 'COURT'
    });

    // 3. District 2: Healthcare & Emergency Services (West District)
    createBuildingZone(5, 24, 12, 12, TILE.HOSPITAL, 'Hospital General Link', '🏥 Centro de Urgencias, Quirófanos y Sanidad', {
      height: 16, wallColor: '#047857', roofColor: '#065f46', accentColor: '#34d399', style: 'HOSPITAL'
    });

    createBuildingZone(5, 64, 12, 12, TILE.FIRE_STATION, 'Estación de Bomberos Link', '🚒 Cuartel de Bomberos y Rescate', {
      height: 13, wallColor: '#991b1b', roofColor: '#7f1d1d', accentColor: '#f87171', style: 'FIRE_STATION'
    });

    // 4. District 3: Financial & Commercial District (East & Central Districts)
    createBuildingZone(82, 64, 12, 12, TILE.BANK, 'Banco Central Financiero', '🏦 Banco Nacional, Cajas Fuertes y Finanzas', {
      height: 18, wallColor: '#0f766e', roofColor: '#115e59', accentColor: '#2dd4bf', style: 'BANK'
    });

    createBuildingZone(82, 44, 12, 12, TILE.STORE, 'Gran Mercado & Malls', '🛒 Centro Comercial, Supermercado y Tiendas', {
      height: 12, wallColor: '#0d9488', roofColor: '#115e59', accentColor: '#facc15', style: 'MARKET'
    });

    createBuildingZone(82, 84, 12, 12, TILE.GAS_STATION, 'Estación de Gasolina & Taller', '⛽ Combustible, Lavado y Servicio Mecánico', {
      height: 10, wallColor: '#ea580c', roofColor: '#c2410c', accentColor: '#fbbf24', style: 'GAS_STATION'
    });

    // 5. District 4: Education & Culture (South-West & East)
    createBuildingZone(5, 44, 12, 12, TILE.SCHOOL, 'Escuela Central Link', '🏫 Aulas Escolares, Laboratorios y Patio', {
      height: 12, wallColor: '#be185d', roofColor: '#9d174d', accentColor: '#f472b6', style: 'SCHOOL'
    });

    createBuildingZone(82, 24, 12, 12, TILE.CEMETERY, 'Cementerio Municipal', '🪦 Criptas, Mausoleos y Capilla', {
      height: 10, wallColor: '#374151', roofColor: '#1f2937', accentColor: '#9ca3af', style: 'CEMETERY'
    });

    // 6. District 5: Central Park, Lake & Recreation Zone (Center x: 42..58, y: 64..78)
    for (let r = 64; r < 78; r++) {
      for (let c = 42; c < 58; c++) {
        if (r >= 68 && r <= 74 && c >= 46 && c <= 54) {
          grid[r][c] = TILE.LAKE; // Central Lake
        } else if (r === 66 && c === 50) {
          grid[r][c] = TILE.FOUNTAIN; // Grand Park Fountain
        } else {
          grid[r][c] = TILE.PARK;
        }
      }
    }
    buildings.push({
      id: 'parque_central_link',
      name: 'Gran Parque Urbano & Lago',
      desc: '⛲ Parque ecológico con lago natural, puente, glorietas y fuentes.',
      x: 42, y: 64, w: 16, h: 14, tileType: TILE.PARK
    });

    // 7. Multi-floor Skyscrapers & Hotels
    createHotelTower('hotel_alpha', 'Hotel Rascacielos Sol', 25, 24, 10);
    createHotelTower('hotel_beta', 'Hotel Rascacielos Luna', 62, 24, 10);
    createHotelTower('hotel_gamma', 'Hotel Rascacielos Estella', 42, 44, 10);

    // 7b. District 6: Paladares, Restaurants, Discotecas & VIP Nightclubs (South District)
    createBuildingZone(22, 82, 12, 12, TILE.PALADAR, 'Paladar & Restaurante Don Link', '🍽️ Gastronomía, Jefe de Cocina, Meseros y Bar', {
      height: 12, wallColor: '#854d0e', roofColor: '#a16207', accentColor: '#facc15', style: 'RESTAURANT'
    });

    createBuildingZone(42, 82, 12, 12, TILE.DISCOTECA, 'Discoteca & Club Neon', '💃 Pista de baile, Luces Neón, DJ y Fiestas Sims', {
      height: 16, wallColor: '#581c87', roofColor: '#3b0764', accentColor: '#f472b6', style: 'DISCO'
    });

    createBuildingZone(62, 82, 12, 12, TILE.CLUB_VIP, 'Club VIP Puticlub Velvet', '🍸 Zona Exclusiva VIP, Fiestas Nocturnas y Espectáculos', {
      height: 14, wallColor: '#831843', roofColor: '#500724', accentColor: '#ec4899', style: 'VIP_CLUB'
    });

    createBuildingZone(82, 82, 12, 12, TILE.BARRIO_BAJERO, 'Barrio Bajero Gangster', '🥷 Zonas peligrosas, Pandilleros, Ladrones y Mercado Negro', {
      height: 10, wallColor: '#1c1917', roofColor: '#0c0a09', accentColor: '#ef4444', style: 'GANG'
    });

    // Residential Houses
    for (let i = 0; i < 4; i++) {
      createBuildingZone(25 + (i * 12), 62, 8, 8, TILE.HOUSE, `Casa Familiar Sims N° ${i + 1}`, '🏡 Residencia Privada con Jardín', {
        height: 10, wallColor: '#334155', roofColor: '#475569', accentColor: '#38bdf8', style: 'HOUSE'
      });
    }

    // 8. Populate Street Furniture & Mini-Details (Trees, Streetlights, Benches)
    populateEnvironmentalDetails();

    return { grid, buildings, hotels, environmentalObjects };
  }

  function createBuildingZone(x, y, w, h, tileType, name, desc, styleConfig = {}) {
    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        grid[r][c] = tileType;
      }
    }
    buildings.push({
      id: name.toLowerCase().replace(/ /g, '_'),
      name,
      desc,
      x, y, w, h,
      tileType,
      height: styleConfig.height || 12,
      wallColor: styleConfig.wallColor || '#1e293b',
      roofColor: styleConfig.roofColor || '#334155',
      accentColor: styleConfig.accentColor || '#38bdf8',
      style: styleConfig.style || 'STANDARD'
    });
  }

  function createHotelTower(id, name, x, y, floorsCount = 10) {
    const w = 10;
    const h = 10;

    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        grid[r][c] = TILE.HOTEL;
      }
    }

    const elevatorX = x + 5;
    const elevatorY = y + 5;
    grid[elevatorY][elevatorX] = TILE.ELEVATOR;

    const floors = [];
    for (let f = 1; f <= floorsCount; f++) {
      const rooms = [];
      for (let rm = 1; rm <= 5; rm++) {
        rooms.push({
          roomId: `P${f}-H${rm}`,
          roomNumber: rm,
          floorNumber: f,
          maxCapacity: 3,
          residents: [],
          rentCost: 60 + (f * 10)
        });
      }
      floors.push({ floorNumber: f, rooms });
    }

    const hotelObj = {
      id,
      name,
      x, y, w, h,
      elevatorX, elevatorY,
      floorsCount,
      floors,
      height: 20, // Scaled 3D building height for screen visibility
      wallColor: '#0f172a',
      roofColor: '#1e293b',
      accentColor: '#eab308'
    };

    hotels.push(hotelObj);
    buildings.push({
      id,
      name,
      desc: `Hotel de ${floorsCount} pisos con elevadores express. 5 hab/piso (3 pers/hab).`,
      x, y, w, h,
      tileType: TILE.HOTEL,
      height: 20,
      wallColor: '#0f172a',
      roofColor: '#1e293b',
      accentColor: '#eab308',
      hotelObj
    });
  }

  function populateEnvironmentalDetails() {
    environmentalObjects = [];

    // Trees and Streetlights placed along sidewalks
    for (let r = 2; r < MAP_HEIGHT - 2; r += 4) {
      for (let c = 2; c < MAP_WIDTH - 2; c += 4) {
        if (grid[r][c] === TILE.STREET) {
          if ((r + c) % 8 === 0) {
            environmentalObjects.push({ type: 'TREE', x: c, y: r, height: 18 });
          } else if ((r + c) % 8 === 4) {
            environmentalObjects.push({ type: 'LIGHT', x: c, y: r, height: 22 });
          }
        }
      }
    }

    // Add Park Benches and Flowers
    for (let r = 64; r < 78; r += 3) {
      for (let c = 43; c < 57; c += 3) {
        if (grid[r][c] === TILE.PARK) {
          environmentalObjects.push({ type: 'BENCH', x: c, y: r, height: 8 });
        }
      }
    }
  }

  // Elevator Floor Switch Logic
  function moveElevatorToFloor(npc, hotel, targetFloor) {
    if (targetFloor < 1 || targetFloor > hotel.floorsCount) return false;
    npc.currentHotelId = hotel.id;
    npc.currentFloor = targetFloor;
    npc.x = hotel.elevatorX;
    npc.y = hotel.elevatorY;
    return true;
  }

  // Assign NPC to Hotel Room
  function assignNpcToRoom(npc, hotelId, floorNum, roomNum) {
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return false;

    const floor = hotel.floors.find(f => f.floorNumber === floorNum);
    if (!floor) return false;

    const room = floor.rooms.find(r => r.roomNumber === roomNum);
    if (!room) return false;

    if (room.residents.length < room.maxCapacity) {
      if (!room.residents.includes(npc.id)) {
        room.residents.push(npc.id);
        npc.assignedHotelId = hotelId;
        npc.assignedFloor = floorNum;
        npc.assignedRoom = roomNum;
      }
      return true;
    }
    return false;
  }

  // TILE WALKABILITY
  function isTileWalkable(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = grid[y][x];
    return tile !== TILE.WALL && tile !== TILE.WATER && tile !== TILE.LAKE;
  }

  // PRIORITY-WEIGHTED A* PATHFINDING ALGORITHM
  // mode: 'pedestrian' (sidewalk = 1, road = 2) or 'driver' (road = 1, sidewalk = 3)
  function findPath(start, target, mode = 'pedestrian', occupiedSet = new Set()) {
    if (!isTileWalkable(target.x, target.y)) return [];
    if (start.x === target.x && start.y === target.y) return [];

    const openList = [];
    const closedSet = new Set();
    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${start.x},${start.y}`;
    const targetKey = `${target.x},${target.y}`;

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start, target));

    openList.push({ x: start.x, y: start.y, f: fScore.get(startKey) });

    while (openList.length > 0) {
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift();
      const currentKey = `${current.x},${current.y}`;

      if (current.x === target.x && current.y === target.y) {
        const path = [];
        let currKey = currentKey;
        while (cameFrom.has(currKey)) {
          const prev = cameFrom.get(currKey);
          path.unshift({ x: prev.x, y: prev.y });
          currKey = `${prev.x},${prev.y}`;
        }
        path.push({ x: target.x, y: target.y });
        path.shift();
        return path;
      }

      closedSet.add(currentKey);

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (!isTileWalkable(neighbor.x, neighbor.y)) continue;
        if (closedSet.has(neighborKey)) continue;

        if (occupiedSet.has(neighborKey) && neighborKey !== targetKey) continue;

        // Step cost = 1 * priority level multiplier (1, 2, 3, 4)
        const priorityMult = getTilePriority(neighbor.x, neighbor.y, mode);
        const stepCost = 1 * priorityMult;
        const tentativeG = gScore.get(currentKey) + stepCost;

        if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          const f = tentativeG + heuristic(neighbor, target);
          fScore.set(neighborKey, f);

          if (!openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
            openList.push({ x: neighbor.x, y: neighbor.y, f });
          }
        }
      }
    }

    return [];
  }

  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  return {
    MAP_WIDTH,
    MAP_HEIGHT,
    TILE_SIZE,
    TILE,
    SECTORS,
    getQuadrantHierarchy,
    getSurroundingQuadrantTiles,
    getTilePriority,
    initCityMap,
    isTileWalkable,
    findPath,
    updateOccupancyState,
    isTileOccupiedON,
    get tileOccupancyGrid() { return tileOccupancyGrid; },
    BARRIOS,
    getBarrioForPos,
    getActiveBarrio,
    setActiveBarrioId,
    getNeighboringBarrio,
    get activeBarrioId() { return activeBarrioId; },
    getSectorForPos,
    setActiveSector,
    get activeSector() { return activeSector; },
    get hotels() { return hotels; },
    get buildings() { return buildings; },
    get grid() { return grid; },
    get environmentalObjects() { return environmentalObjects; },
    moveElevatorToFloor,
    assignNpcToRoom
  };
})();
