/**
 * CIUDAD LINK - NPC SIMULATION, DYNAMIC VISUAL DIVERSITY & DAY/NIGHT CYCLES
 * Manages detailed NPC profiles (Name, Gender, Profession, Visual Outfits, Age, Kinship Tree, Schedules, Morality),
 * and time/day/night cycles without blinding FOV darkness.
 */

window.CiudadLinkNPCs = (function () {
  'use strict';

  let npcs = [];
  let timeOfDay = 8.0; // 0.0 to 24.0 hours
  let currentDay = 1;  // 1 = Monday ... 7 = Sunday
  let dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // FIRST NAMES & LAST NAMES GENERATORS
  const MALE_NAMES = ['Carlos', 'Mateo', 'Lucas', 'Diego', 'Gabriel', 'Alejandro', 'Fernando', 'Javier', 'Samuel', 'Daniel', 'Andrés', 'Hugo', 'Tomás', 'Nicolás', 'Esteban', 'Rodrigo'];
  const FEMALE_NAMES = ['Sofía', 'Valentina', 'Isabela', 'Camila', 'Mariana', 'Lucía', 'Elena', 'Victoria', 'Gabriela', 'Martina', 'Daniela', 'Valeria', 'Natalia', 'Paula', 'Andrea', 'Carolina'];
  const LAST_NAMES = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez'];

  // OUTFIT COLOR PALETTES FOR NPC DIVERSITY
  const SKIN_TONES = ['#fde047', '#fed7aa', '#fecdd3', '#f59e0b', '#d97706', '#78350f'];
  const HAIR_COLORS = ['#1e293b', '#78350f', '#ca8a04', '#dc2626', '#475569', '#fef08a'];
  const SHIRT_COLORS = ['#38bdf8', '#f472b6', '#34d399', '#a78bfa', '#fbbf24', '#f87171', '#818cf8', '#2dd4bf'];
  const PANTS_COLORS = ['#1e293b', '#334155', '#475569', '#1e1b4b', '#064e3b', '#831843'];

  // Generate Initial City Population (100+ Detailed Citizens with Visual Diversity)
  function spawnPopulation(hotels) {
    npcs = [];
    let idCounter = 1;

    const professionsList = window.CiudadLinkData.PROFESSIONS;

    // 1. President
    let pres = createNPCProfile(idCounter++, 'Masculino', 'presidente_link', 'Presidente de la Ciudad', 48, 50, 4);
    pres.profession = 'president';
    pres.shirtColor = '#b45309';
    pres.x = 50; pres.y = 10;
    npcs.push(pres);

    // 2. Police Chief & Police Officers
    let chief = createNPCProfile(idCounter++, 'Masculino', 'jefe_policia', 'Jefe de Policía', 45, 10, 10);
    chief.profession = 'police_chief';
    chief.shirtColor = '#1d4ed8';
    chief.x = 10; chief.y = 10;
    npcs.push(chief);

    for (let i = 0; i < 6; i++) {
      let g = i % 2 === 0 ? 'Masculino' : 'Femenino';
      let officer = createNPCProfile(idCounter++, g, `policia_${i}`, 'Oficial de Policía', 25 + i * 2, 12, 8);
      officer.profession = 'police_officer';
      officer.shirtColor = '#2563eb';
      officer.x = 8 + (i % 3) * 2; officer.y = 8 + Math.floor(i / 3) * 2;
      npcs.push(officer);
    }

    // 3. Judges & Lawyers
    let judge = createNPCProfile(idCounter++, 'Femenino', 'juez_suprema', 'Juez Magistrada', 52, 85, 5);
    judge.profession = 'judge';
    judge.shirtColor = '#6b21a8';
    judge.x = 88; judge.y = 10;
    npcs.push(judge);

    for (let i = 0; i < 4; i++) {
      let lawyer = createNPCProfile(idCounter++, i % 2 === 0 ? 'Masculino' : 'Femenino', `abogado_${i}`, 'Abogado Defensor', 30 + i * 3, 60, 6);
      lawyer.profession = 'lawyer';
      lawyer.shirtColor = '#4338ca';
      lawyer.x = 85 + (i % 2) * 2; lawyer.y = 8 + Math.floor(i / 2) * 2;
      npcs.push(lawyer);
    }

    // 4. Doctors & Nurses
    let doc = createNPCProfile(idCounter++, 'Masculino', 'dr_sanchez', 'Médico Cirujano', 42, 10, 20);
    doc.profession = 'doctor';
    doc.shirtColor = '#059669';
    doc.x = 10; doc.y = 30;
    npcs.push(doc);

    // 5. Teachers & Children & Mothers
    for (let i = 0; i < 15; i++) {
      let isMother = (i % 3 === 0);
      let gender = isMother ? 'Femenino' : (i % 2 === 0 ? 'Masculino' : 'Femenino');
      let age = isMother ? 32 + i : (i < 8 ? 8 + i : 22 + i);
      let prof = age < 18 ? 'student' : (isMother ? 'unemployed' : 'teacher');

      let npc = createNPCProfile(idCounter++, gender, `ciudadano_${i}`, prof, age, 15 + i * 2, 35 + i);
      npc.profession = prof;
      npc.x = 8 + (i % 4) * 2; npc.y = 48 + Math.floor(i / 4) * 2;

      if (hotels && hotels.length > 0) {
        let h = hotels[i % hotels.length];
        let fl = (i % 5) + 1;
        let rm = (i % 5) + 1;
        window.CiudadLinkMap.assignNpcToRoom(npc, h.id, fl, rm);
      }

      npcs.push(npc);
    }

    // Connect Families
    let mothers = npcs.filter(n => n.gender === 'Femenino' && n.age >= 28);
    let children = npcs.filter(n => n.age < 18);

    children.forEach((c, idx) => {
      if (mothers.length > 0) {
        let mother = mothers[idx % mothers.length];
        c.motherId = mother.id;
      }
    });

    // Populate up to 105 Citizens
    while (npcs.length < 105) {
      let g = npcs.length % 2 === 0 ? 'Masculino' : 'Femenino';
      let age = 18 + (npcs.length % 55);
      let prof = professionsList[npcs.length % professionsList.length].id;
      let npc = createNPCProfile(idCounter++, g, `poblador_${npcs.length}`, prof, age, 20 + (npcs.length % 60), 20 + (npcs.length % 60));
      npc.profession = prof;

      if (hotels && hotels.length > 0) {
        let h = hotels[npcs.length % hotels.length];
        let fl = (npcs.length % 10) + 1;
        let rm = (npcs.length % 5) + 1;
        window.CiudadLinkMap.assignNpcToRoom(npc, h.id, fl, rm);
      }

      npcs.push(npc);
    }

    return npcs;
  }

  function createNPCProfile(id, gender, nameKey, title, age, x, y) {
    let fnList = gender === 'Masculino' ? MALE_NAMES : FEMALE_NAMES;
    let firstName = fnList[Math.floor(Math.random() * fnList.length)];
    let lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    let fullName = `${firstName} ${lastName}`;

    return {
      id: `NPC_${id}`,
      name: fullName,
      gender: gender,
      age: age,
      profession: title,
      x: x,
      y: y,
      targetX: x,
      targetY: y,
      path: [],
      motherId: null,
      fatherId: null,
      spouseId: null,
      relationshipState: 'Soltero', // 'Soltero', 'Amigo', 'Pareja', 'Esposa', 'Esposo'
      relationshipLevel: 0, // 0 to 100
      // Sims-Style State & Needs (0 = empty, 100 = full/good)
      hunger: 80 + Math.floor(Math.random() * 20),      // Hambre
      sleep: 80 + Math.floor(Math.random() * 20),       // Sueño / Energía
      mood: 75 + Math.floor(Math.random() * 25),        // Ánimo / Depresión (100 = Animado, <30 = Deprimido)
      social: 60 + Math.floor(Math.random() * 40),      // Social / Fiesta
      phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
      assignedHotelId: null,
      assignedFloor: 1,
      assignedRoom: 1,
      assignedHouseId: null,
      currentHotelId: null,
      currentFloor: 1,
      money: 100 + Math.floor(Math.random() * 400),
      morality: 50 + Math.floor(Math.random() * 50),
      isArrested: false,
      crimeLevel: 0,
      skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      shirtColor: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
      pantsColor: PANTS_COLORS[Math.floor(Math.random() * PANTS_COLORS.length)],
      inventory: [
        { name: 'Documento de Identidad', icon: '🪪' },
        { name: 'Teléfono Link Smart', icon: '📱' }
      ]
    };
  }

  // Synchronize NPC positions across map sectors based on game time routines
  function synchronizeNPCRoutinesWithGameTime() {
    npcs.forEach(npc => {
      const rule = window.CiudadLinkData.SCHEDULE_RULES.getRuleForNPC(npc, timeOfDay, currentDay - 1);
      const targetCoords = getTargetCoordsForAction(rule.target, npc);

      if (targetCoords) {
        npc.x = targetCoords.x;
        npc.y = targetCoords.y;
        npc.path = [];
      }
    });
  }

  // UPDATE TIME & NPC AI BEHAVIOR
  function updateNPCSimulation(deltaSec, playerIsWalking) {
    timeOfDay += (deltaSec * 0.0333);
    if (timeOfDay >= 24.0) {
      timeOfDay = 0.0;
      currentDay = (currentDay % 7) + 1;
    }

    const occupiedSet = new Set();
    npcs.forEach(n => {
      occupiedSet.add(`${n.x},${n.y}`);
    });

    npcs.forEach(npc => {
      if (npc.isArrested) return;

      // Sims-style status decay over time
      if (Math.random() < 0.05) {
        npc.hunger = Math.max(0, npc.hunger - 0.2);
        npc.sleep = Math.max(0, npc.sleep - 0.15);
        npc.social = Math.max(0, npc.social - 0.1);

        // Mood / Depression calculation
        const avgNeeds = (npc.hunger + npc.sleep + npc.social) / 3;
        npc.mood = Math.round(avgNeeds);
      }

      const scheduleRule = window.CiudadLinkData.SCHEDULE_RULES.getRuleForNPC(npc, timeOfDay, currentDay - 1);

      if (!npc.path || npc.path.length === 0) {
        if (Math.random() < 0.1) {
          let targetCoords = getTargetCoordsForAction(scheduleRule.target, npc);
          if (targetCoords) {
            let path = window.CiudadLinkMap.findPath({ x: npc.x, y: npc.y }, targetCoords, occupiedSet);
            if (path && path.length > 0) {
              npc.path = path;
            }
          }
        }
      }

      if (npc.path && npc.path.length > 0) {
        let nextStep = npc.path.shift();
        let key = `${nextStep.x},${nextStep.y}`;
        if (!occupiedSet.has(key)) {
          npc.x = nextStep.x;
          npc.y = nextStep.y;
        }
      }
    });
  }

  function getTargetCoordsForAction(targetType, npc) {
    if (targetType === 'escuela') return { x: 10, y: 50 };
    if (targetType === 'juzgado') return { x: 88, y: 10 };
    if (targetType === 'estacion_policia') return { x: 10, y: 10 };
    if (targetType === 'hospital') return { x: 10, y: 30 };
    if (targetType === 'presidencia') return { x: 50, y: 10 };
    if (targetType === 'cementerio') return { x: 88, y: 30 };
    if (targetType === 'tienda') return { x: 88, y: 50 };
    if (targetType === 'paladar') return { x: 28, y: 84 };
    if (targetType === 'discoteca') return { x: 48, y: 84 };
    if (targetType === 'club_vip') return { x: 68, y: 84 };
    if (targetType === 'barrio_bajero') return { x: 88, y: 84 };
    if (targetType === 'hotel') {
      return { x: 28, y: 28 };
    }
    return { x: npc.x + Math.floor(Math.random() * 5 - 2), y: npc.y + Math.floor(Math.random() * 5 - 2) };
  }

  function getTimeFormatted() {
    let hours = Math.floor(timeOfDay);
    let minutes = Math.floor((timeOfDay - hours) * 60);
    let hh = hours < 10 ? '0' + hours : hours;
    let mm = minutes < 10 ? '0' + minutes : minutes;
    let dayStr = dayNames[currentDay - 1];
    let timePeriod = hours >= 6 && hours < 19 ? '☀️ Día' : '🌙 Noche';
    return `${dayStr} ${hh}:${mm} (${timePeriod})`;
  }

  function getLightingOverlay() {
    // Night ambient light tint (max 0.25 opacity so vision is completely clear)
    if (timeOfDay >= 6.0 && timeOfDay < 18.0) return 0.0;
    if (timeOfDay >= 18.0 && timeOfDay < 20.0) return ((timeOfDay - 18.0) / 2.0) * 0.2;
    if (timeOfDay >= 20.0 || timeOfDay < 5.0) return 0.25;
    if (timeOfDay >= 5.0 && timeOfDay < 6.0) return (1.0 - (timeOfDay - 5.0)) * 0.2;
    return 0.0;
  }

  return {
    spawnPopulation,
    updateNPCSimulation,
    synchronizeNPCRoutinesWithGameTime,
    getTimeFormatted,
    getLightingOverlay,
    get npcs() { return npcs; },
    get timeOfDay() { return timeOfDay; },
    get currentDay() { return currentDay; }
  };
})();
