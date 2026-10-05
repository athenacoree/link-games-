/**
 * CIUDAD LINK - CITY MAP GENERATOR, MULTI-FLOOR HOTELS & PATHFINDING
 * Manages the 100x100 city grid, landmark buildings, 10-floor hotel towers
 * with elevators (5 rooms/floor, 3 residents/room), and A* pathfinding.
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
    WATER: 13
  };

  let grid = [];
  let buildings = [];
  let hotels = [];

  // Generate City Grid
  function initCityMap() {
    grid = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(TILE.PARK));
    buildings = [];
    hotels = [];

    // Main Roads Grid (Avenues and Streets)
    for (let r = 0; r < MAP_HEIGHT; r++) {
      for (let c = 0; c < MAP_WIDTH; c++) {
        if (r % 20 === 0 || r % 20 === 1 || c % 20 === 0 || c % 20 === 1) {
          grid[r][c] = TILE.ROAD;
        } else if (r % 20 === 2 || r % 20 === 19 || c % 20 === 2 || c % 20 === 19) {
          grid[r][c] = TILE.STREET; // Sidewalk
        }
      }
    }

    // Place Key Landmarks & Buildings

    // 1. PRESIDENCIA LINK (President's Palace) - North Center (x: 40..60, y: 3..17)
    createBuildingZone(42, 4, 16, 14, TILE.PRESIDENCIA, 'Presidencia Link', '👑 Casa del Presidente de la Ciudad');

    // 2. POLICE STATION (Estación de Policía) - North-West (x: 5..18, y: 3..17)
    createBuildingZone(5, 4, 12, 12, TILE.POLICE, 'Estación de Policía Central', '🚔 Comisaría, Celdas y Custodia');

    // 3. COURTROOM (Juzgados de Link) - North-East (x: 80..95, y: 3..17)
    createBuildingZone(82, 4, 12, 12, TILE.COURT, 'Tribunal & Juzgados', '⚖️ Corte Judicial, Abogados y Jueces');

    // 4. HOSPITAL CENTRAL - Mid-West (x: 5..18, y: 23..37)
    createBuildingZone(5, 24, 12, 12, TILE.HOSPITAL, 'Hospital General Link', '🏥 Centro de Urgencias y Sanidad');

    // 5. CEMETERY (Cementerio Link) - Mid-East (x: 80..95, y: 23..37)
    createBuildingZone(82, 24, 12, 12, TILE.CEMETERY, 'Cementerio Municipal', '🪦 Criptas y Casa del Custodio');

    // 6. SCHOOL (Escuela Municipal) - South-West (x: 5..18, y: 43..57)
    createBuildingZone(5, 44, 12, 12, TILE.SCHOOL, 'Escuela Link Central', '🏫 Aulas Escolares y Patio');

    // 7. STORES / MARKETPLACE - South-East (x: 80..95, y: 43..57)
    createBuildingZone(82, 44, 12, 12, TILE.STORE, 'Gran Mercado & Tiendas', '🛒 Centro Comercial de Productos');

    // 8. HOTELS (3 Multi-Floor Skyscrapers with Elevators)
    // Hotel Alpha (x: 25..36, y: 23..35)
    createHotelTower('hotel_alpha', 'Hotel Rascacielos Sol', 25, 24, 10);

    // Hotel Beta (x: 62..73, y: 23..35)
    createHotelTower('hotel_beta', 'Hotel Rascacielos Luna', 62, 24, 10);

    // Hotel Gamma (x: 42..53, y: 43..55)
    createHotelTower('hotel_gamma', 'Hotel Rascacielos Estella', 42, 44, 10);

    return { grid, buildings, hotels };
  }

  function createBuildingZone(x, y, w, h, tileType, name, desc) {
    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        grid[r][c] = tileType;
      }
    }
    buildings.push({ id: name.toLowerCase().replace(/ /g, '_'), name, desc, x, y, w, h, tileType });
  }

  function createHotelTower(id, name, x, y, floorsCount = 10) {
    const w = 10;
    const h = 10;

    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        grid[r][c] = TILE.HOTEL;
      }
    }

    // Place Elevator inside the hotel tower
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
          residents: [], // NPC IDs (max 3 people)
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
      floors
    };

    hotels.push(hotelObj);
    buildings.push({ id, name, desc: `Hotel de ${floorsCount} pisos con elevadores. 5 hab/piso (3 pers/hab).`, x, y, w, h, tileType: TILE.HOTEL, hotelObj });
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

  // Assign NPC to Hotel Room (3 people max per room)
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
    return false; // Room full!
  }

  // TILE WALKABILITY
  function isTileWalkable(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = grid[y][x];
    return tile !== TILE.WALL && tile !== TILE.WATER;
  }

  // A* PATHFINDING ALGORITHM (Avoids occupied tiles)
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
      // Get node with lowest fScore
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift();
      const currentKey = `${current.x},${current.y}`;

      if (current.x === target.x && current.y === target.y) {
        // Reconstruct path
        const path = [];
        let currKey = currentKey;
        while (cameFrom.has(currKey)) {
          const prev = cameFrom.get(currKey);
          path.unshift({ x: prev.x, y: prev.y });
          currKey = `${prev.x},${prev.y}`;
        }
        path.push({ x: target.x, y: target.y });
        path.shift(); // Remove starting tile
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

        // Check if tile is occupied by another NPC/Player (unless it's target)
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

    return []; // No path found
  }

  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance
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
    moveElevatorToFloor,
    assignNpcToRoom
  };
})();
