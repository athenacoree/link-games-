/**
 * CIUDAD LINK - CITY MAP GENERATOR, REALISTIC MINI WORLD & DISTRICTS
 * Manages the 100x100 city grid, 3D building height/depth metadata, 10-floor hotel towers
 * with elevators (5 rooms/floor, 3 residents/room), parks, lakes, and A* pathfinding.
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
    FOUNTAIN: 20
  };

  let grid = [];
  let buildings = [];
  let hotels = [];
  let environmentalObjects = []; // Trees, Streetlights, Benches, Trash cans

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
      height: 38, wallColor: '#b45309', roofColor: '#78350f', accentColor: '#fbbf24', style: 'PALACE'
    });

    createBuildingZone(5, 4, 12, 12, TILE.POLICE, 'Estación de Policía Central', '🚔 Comisaría, Celdas y Custodia', {
      height: 28, wallColor: '#1e3a8a', roofColor: '#1e40af', accentColor: '#38bdf8', style: 'POLICE'
    });

    createBuildingZone(82, 4, 12, 12, TILE.COURT, 'Tribunal & Juzgados', '⚖️ Corte Judicial y Colegio de Abogados', {
      height: 30, wallColor: '#581c87', roofColor: '#6b21a8', accentColor: '#c084fc', style: 'COURT'
    });

    // 3. District 2: Healthcare & Emergency Services (West District)
    createBuildingZone(5, 24, 12, 12, TILE.HOSPITAL, 'Hospital General Link', '🏥 Centro de Urgencias, Quirófanos y Sanidad', {
      height: 32, wallColor: '#047857', roofColor: '#065f46', accentColor: '#34d399', style: 'HOSPITAL'
    });

    createBuildingZone(5, 64, 12, 12, TILE.FIRE_STATION, 'Estación de Bomberos Link', '🚒 Cuartel de Bomberos y Rescate', {
      height: 26, wallColor: '#991b1b', roofColor: '#7f1d1d', accentColor: '#f87171', style: 'FIRE_STATION'
    });

    // 4. District 3: Financial & Commercial District (East & Central Districts)
    createBuildingZone(82, 64, 12, 12, TILE.BANK, 'Banco Central Financiero', '🏦 Banco Nacional, Cajas Fuertes y Finanzas', {
      height: 36, wallColor: '#0f766e', roofColor: '#115e59', accentColor: '#2dd4bf', style: 'BANK'
    });

    createBuildingZone(82, 44, 12, 12, TILE.STORE, 'Gran Mercado & Malls', '🛒 Centro Comercial, Supermercado y Tiendas', {
      height: 24, wallColor: '#0d9488', roofColor: '#115e59', accentColor: '#facc15', style: 'MARKET'
    });

    createBuildingZone(82, 84, 12, 12, TILE.GAS_STATION, 'Estación de Gasolina & Taller', '⛽ Combustible, Lavado y Servicio Mecánico', {
      height: 20, wallColor: '#ea580c', roofColor: '#c2410c', accentColor: '#fbbf24', style: 'GAS_STATION'
    });

    // 5. District 4: Education & Culture (South-West & East)
    createBuildingZone(5, 44, 12, 12, TILE.SCHOOL, 'Escuela Central Link', '🏫 Aulas Escolares, Laboratorios y Patio', {
      height: 25, wallColor: '#be185d', roofColor: '#9d174d', accentColor: '#f472b6', style: 'SCHOOL'
    });

    createBuildingZone(82, 24, 12, 12, TILE.CEMETERY, 'Cementerio Municipal', '🪦 Criptas, Mausoleos y Capilla', {
      height: 18, wallColor: '#374151', roofColor: '#1f2937', accentColor: '#9ca3af', style: 'CEMETERY'
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
      height: styleConfig.height || 24,
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
      height: 52, // High-rise 3D building
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
      height: 52,
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

  // A* PATHFINDING ALGORITHM
  function findPath(start, target, occupiedSet = new Set()) {
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

        const tentativeG = gScore.get(currentKey) + 1;

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
    initCityMap,
    isTileWalkable,
    findPath,
    hotels,
    buildings,
    get grid() { return grid; },
    get environmentalObjects() { return environmentalObjects; },
    moveElevatorToFloor,
    assignNpcToRoom
  };
})();
