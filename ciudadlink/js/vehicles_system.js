/**
 * CIUDAD LINK - VEHICLES & TRAFFIC SYSTEM
 * Manages active city vehicles (sedans, police cruisers, taxis, buses, sports cars, delivery vans),
 * road lanes, traffic light signals, headlights, and realistic drawing.
 */

window.CiudadLinkVehicles = (function () {
  'use strict';

  let vehicles = [];
  let trafficLights = [];
  let trafficLightTimer = 0;
  let trafficLightState = 'GREEN'; // 'GREEN', 'YELLOW', 'RED'

  // Vehicle types configuration
  const VEHICLE_TYPES = [
    { type: 'sedan', name: 'Auto Sedán', width: 28, length: 44, color: '#0284c7', roofColor: '#38bdf8', speed: 2.2 },
    { type: 'sports', name: 'Deportivo', width: 26, length: 42, color: '#dc2626', roofColor: '#f87171', speed: 3.2 },
    { type: 'taxi', name: 'Taxi Urbano', width: 28, length: 44, color: '#eab308', roofColor: '#fef08a', speed: 2.4, isTaxi: true },
    { type: 'police', name: 'Patrulla de Policía', width: 30, length: 46, color: '#1e3a8a', roofColor: '#ffffff', speed: 2.8, isPolice: true },
    { type: 'bus', name: 'Autobús Municipal', width: 32, length: 64, color: '#059669', roofColor: '#34d399', speed: 1.6 },
    { type: 'van', name: 'Camioneta de Reparto', width: 30, length: 50, color: '#d97706', roofColor: '#fbbf24', speed: 1.9 }
  ];

  // Initialize Traffic Lanes based on City Map roads
  function initTraffic(mapWidth, mapHeight, tileSize) {
    vehicles = [];

    // Define major driving lanes along the road grid (roads are at x,y % 20 === 0 or 1)
    const lanes = [];

    for (let r = 0; r < mapHeight; r += 20) {
      // Horizontal Eastbound lane (row r, moving right)
      lanes.push({ dir: 'E', startX: 2, startY: r + 0.4, endX: mapWidth - 2, endY: r + 0.4 });
      // Horizontal Westbound lane (row r+1, moving left)
      lanes.push({ dir: 'W', startX: mapWidth - 2, startY: r + 1.4, endX: 2, endY: r + 1.4 });
    }

    for (let c = 0; c < mapWidth; c += 20) {
      // Vertical Southbound lane (col c, moving down)
      lanes.push({ dir: 'S', startX: c + 0.4, startY: 2, endX: c + 0.4, endY: mapHeight - 2 });
      // Vertical Northbound lane (col c+1, moving up)
      lanes.push({ dir: 'N', startX: c + 1.4, startY: mapHeight - 2, endX: c + 1.4, endY: 2 });
    }

    // Spawn 24 initial vehicles on road lanes
    for (let i = 0; i < 24; i++) {
      const lane = lanes[i % lanes.length];
      const vt = VEHICLE_TYPES[i % VEHICLE_TYPES.length];

      // Progress along the lane
      const progress = (i * 0.18 + Math.random() * 0.1) % 0.95;
      const x = lane.startX + (lane.endX - lane.startX) * progress;
      const y = lane.startY + (lane.endY - lane.startY) * progress;

      vehicles.push({
        id: `VEH_${i + 1}`,
        type: vt.type,
        name: vt.name,
        x: x,
        y: y,
        dir: lane.dir,
        speed: vt.speed * (0.85 + Math.random() * 0.3),
        baseSpeed: vt.speed,
        currentSpeed: vt.speed,
        color: vt.color,
        roofColor: vt.roofColor,
        isTaxi: !!vt.isTaxi,
        isPolice: !!vt.isPolice,
        lane: lane,
        lightPhase: Math.random() * Math.PI
      });
    }

    // Define Traffic Light Intersections
    trafficLights = [];
    for (let r = 0; r < mapHeight; r += 20) {
      for (let c = 0; c < mapWidth; c += 20) {
        trafficLights.push({
          x: c,
          y: r,
          state: 'GREEN'
        });
      }
    }
  }

  // Update Vehicle Simulation
  function updateVehicles(deltaSec, playerX, playerY) {
    // Traffic Light timer loop (10s green, 3s yellow, 8s red)
    trafficLightTimer += deltaSec;
    if (trafficLightTimer < 10) {
      trafficLightState = 'GREEN';
    } else if (trafficLightTimer < 13) {
      trafficLightState = 'YELLOW';
    } else if (trafficLightTimer < 21) {
      trafficLightState = 'RED';
    } else {
      trafficLightTimer = 0;
      trafficLightState = 'GREEN';
    }

    // Update each vehicle position
    vehicles.forEach(v => {
      let isBlocked = false;

      // Check traffic light signal at nearest intersection
      if (trafficLightState === 'RED') {
        if (v.dir === 'E' && Math.floor(v.x + 1) % 20 === 0) isBlocked = true;
        if (v.dir === 'W' && Math.floor(v.x) % 20 === 1) isBlocked = true;
      } else if (trafficLightState === 'GREEN') {
        if (v.dir === 'S' && Math.floor(v.y + 1) % 20 === 0) isBlocked = true;
        if (v.dir === 'N' && Math.floor(v.y) % 20 === 1) isBlocked = true;
      }

      // Check distance to player (slow down / stop for player)
      const distToPlayer = Math.hypot(v.x - playerX, v.y - playerY);
      if (distToPlayer < 1.8) {
        isBlocked = true;
      }

      // Target speed calculation
      const targetSpeed = isBlocked ? 0 : v.baseSpeed;
      v.currentSpeed += (targetSpeed - v.currentSpeed) * 0.1;

      // Move vehicle along its direction
      const step = v.currentSpeed * deltaSec * 1.5;

      if (v.dir === 'E') {
        v.x += step;
        if (v.x >= v.lane.endX) v.x = v.lane.startX;
      } else if (v.dir === 'W') {
        v.x -= step;
        if (v.x <= v.lane.endX) v.x = v.lane.startX;
      } else if (v.dir === 'S') {
        v.y += step;
        if (v.y >= v.lane.endY) v.y = v.lane.startY;
      } else if (v.dir === 'N') {
        v.y -= step;
        if (v.y <= v.lane.endY) v.y = v.lane.startY;
      }
    });
  }

  // Draw Vehicle on Canvas with 2.5D details, headlights & lights
  function renderVehicle(ctx, v, tileSize, isNight) {
    const px = v.x * tileSize;
    const py = v.y * tileSize;

    ctx.save();
    ctx.translate(px, py);

    // Rotate according to vehicle direction
    let angle = 0;
    if (v.dir === 'E') angle = 0;
    if (v.dir === 'S') angle = Math.PI / 2;
    if (v.dir === 'W') angle = Math.PI;
    if (v.dir === 'N') angle = -Math.PI / 2;

    ctx.rotate(angle);

    const length = v.type === 'bus' ? 48 : (v.type === 'van' ? 38 : 32);
    const width = 18;
    const height = 12; // pseudo 3D elevation

    // 1. Drop Shadow under vehicle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-length / 2 + 3, -width / 2 + 3, length, width, 6);
    ctx.fill();

    // 2. Headlight Beams (if evening/night or police)
    if (isNight || v.isPolice) {
      ctx.save();
      const beamGrad = ctx.createRadialGradient(length / 2, 0, 2, length / 2 + 50, 0, 45);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(length / 2, -width / 2);
      ctx.lineTo(length / 2 + 70, -width);
      ctx.lineTo(length / 2 + 70, width);
      ctx.lineTo(length / 2, width / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Wheels / Tires
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-length / 2 + 6, -width / 2 - 2, 8, 3);
    ctx.fillRect(length / 2 - 12, -width / 2 - 2, 8, 3);
    ctx.fillRect(-length / 2 + 6, width / 2 - 1, 8, 3);
    ctx.fillRect(length / 2 - 12, width / 2 - 1, 8, 3);

    // 4. Car Chassis Base & 3D Side extrusion
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-length / 2, -width / 2, length, width, 5);
    ctx.fill();

    // Body Paint
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.roundRect(-length / 2 + 1, -width / 2 + 1, length - 2, width - 2, 4);
    ctx.fill();

    // 5. Roof and Glass Windows
    const roofLen = length * 0.5;
    const roofWid = width * 0.75;
    ctx.fillStyle = '#1e293b'; // Glass frame
    ctx.beginPath();
    ctx.roundRect(-roofLen / 2 - 2, -roofWid / 2, roofLen + 4, roofWid, 3);
    ctx.fill();

    // Windshield & Roof top
    ctx.fillStyle = v.roofColor;
    ctx.beginPath();
    ctx.roundRect(-roofLen / 2, -roofWid / 2 + 2, roofLen, roofWid - 4, 3);
    ctx.fill();

    // Glass Windshield highlight
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(roofLen / 2 - 3, -roofWid / 2 + 3, 3, roofWid - 6); // Front windshield
    ctx.fillRect(-roofLen / 2, -roofWid / 2 + 3, 3, roofWid - 6); // Rear windshield

    // 6. Police / Taxi Roof Light Indicators
    if (v.isPolice) {
      const flash = Math.sin(performance.now() * 0.01) > 0;
      ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
      ctx.fillRect(-2, -5, 5, 10);
    } else if (v.isTaxi) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-3, -3, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('TAXI', -6, 2);
    }

    // 7. Taillights (Red LED)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-length / 2, -width / 2 + 2, 2, 3);
    ctx.fillRect(-length / 2, width / 2 - 5, 2, 3);

    // 8. Headlights (Bright Yellow LED)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(length / 2 - 2, -width / 2 + 2, 2, 3);
    ctx.fillRect(length / 2 - 2, width / 2 - 5, 2, 3);

    ctx.restore();
  }

  return {
    initTraffic,
    updateVehicles,
    renderVehicle,
    get vehicles() { return vehicles; },
    get trafficLightState() { return trafficLightState; }
  };
})();
