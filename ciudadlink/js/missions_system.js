/**
 * CIUDAD LINK - DANGEROUS CO-OP MISSIONS SYSTEM
 * Manages 10 multi-stage, high-stakes, dangerous missions with progression tracking,
 * multi-player co-op sync, HUD objective banners, and high monetary/XP rewards.
 */

window.CiudadLinkMissions = (function () {
  'use strict';

  const MISSIONS = [
    {
      id: 'M1_BANK_DEFENSE',
      title: '🚨 1. Defensiva del Asalto al Banco Central',
      danger: '💥💥💥💥💥 (EXTREMO)',
      rewardMoney: 5000,
      rewardXP: 1000,
      rewardItem: '👑 Titulo Protector Bancario & Recompensa $5,000',
      stages: [
        { desc: '1️⃣ Ve al Banco Central Financiero (Sector NE) y asegura la puerta de la bóveda.', targetX: 82, targetY: 64, reqType: 'LOCATION' },
        { desc: '2️⃣ Defiende la bóveda repeliendo a los atracadores fuertemente armados.', reqType: 'ACTION', actionMsg: '🛡️ Defendiste la Bóveda con éxito.' },
        { desc: '3️⃣ Escolta el furgón blindado hasta la Comisaría de Policía.', targetX: 10, targetY: 10, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M2_NUCLEAR_WASTE',
      title: '☢️ 2. Transporte de Residuos Nucleares Tóxicos',
      danger: '☣️☣️☣️☣️☣️ (EXTREMO)',
      rewardMoney: 6500,
      rewardXP: 1200,
      rewardItem: '🥼 Traje Anti-Radiación & $6,500',
      stages: [
        { desc: '1️⃣ Desciende a los túneles subterráneos del Hospital y recupera el barril radiactivo.', targetX: 10, targetY: 30, reqType: 'LOCATION' },
        { desc: '2️⃣ Conduce el camión cisterna a través de la ciudad sin colisionar.', reqType: 'ACTION', actionMsg: '🚚 Transportaste la carga radiactiva sin fugas.' },
        { desc: '3️⃣ Entrega el residuo en el búnker subterráneo de la Presidencia.', targetX: 50, targetY: 10, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M3_SEWER_MUTANT',
      title: '👾 3. Caza de la Criatura Mutante en la Alcantarilla',
      danger: '☠️☠️☠️☠️☠️ (EXTREMO)',
      rewardMoney: 7000,
      rewardXP: 1500,
      rewardItem: '🔫 Dispositivo Láster Bio-Gunn & $7,000',
      stages: [
        { desc: '1️⃣ Entra por la escotilla secreta del Barrio Bajero.', targetX: 88, targetY: 88, reqType: 'LOCATION' },
        { desc: '2️⃣ Sigue el rastro de la criatura mutante en los túneles oscuros.', reqType: 'ACTION', actionMsg: '⚡ Colocaste la trampa bio-electrica.' },
        { desc: '3️⃣ Derrota a la bestia y limpia el alcantarillado.', targetX: 50, targetY: 50, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M4_VIP_HELICOPTER',
      title: '🚁 4. Rescate Aéreo VIP en Tormenta de Nieve',
      danger: '⚡⚡⚡⚡ (ALTO PELIGRO)',
      rewardMoney: 8000,
      rewardXP: 1800,
      rewardItem: '🎟️ Pase Dorado VIP & $8,000',
      stages: [
        { desc: '1️⃣ Toma el helicóptero en el helipuerto de la Comisaría.', targetX: 10, targetY: 10, reqType: 'LOCATION' },
        { desc: '2️⃣ Vuela hasta la azotea del Hotel Sol durante la tormenta.', targetX: 25, targetY: 24, reqType: 'LOCATION' },
        { desc: '3️⃣ Evacúa al Alcalde y aterriza a salvo en el Palacio Presidencial.', targetX: 50, targetY: 10, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M5_MAFIA_BOSS',
      title: '🥷 5. Infiltración y Captura del Capo de la Mafia',
      danger: '💥💥💥💥💥 (EXTREMO)',
      rewardMoney: 10000,
      rewardXP: 2000,
      rewardItem: '🛡️ Placa de Agente Federal FBI & $10,000',
      stages: [
        { desc: '1️⃣ Infíltrate en el escondite secreto del Barrio Bajero.', targetX: 82, targetY: 82, reqType: 'LOCATION' },
        { desc: '2️⃣ Desactiva las trampas explosivas y elimina la guardia del Capo.', reqType: 'ACTION', actionMsg: '💣 Explosivos desactivados a tiempo.' },
        { desc: '3️⃣ Arresta a Don Corleone y llévalo a la Corte de Justicia.', targetX: 88, targetY: 10, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M6_CYBER_HACK',
      title: '💻 6. Ciber-Ataque y Rescate del Firewall Presidencial',
      danger: '⚡⚡⚡⚡ (ALTO PELIGRO)',
      rewardMoney: 6000,
      rewardXP: 1100,
      rewardItem: '💾 Terminal Ciber-Deck Quantum & $6,000',
      stages: [
        { desc: '1️⃣ Ve a la Presidencia Link e ingresa a la sala de servidores.', targetX: 50, targetY: 10, reqType: 'LOCATION' },
        { desc: '2️⃣ Repara los 3 nodos encriptados del mainframe.', reqType: 'ACTION', actionMsg: '💻 Servidores presidenciales restaurados.' },
        { desc: '3️⃣ Rastra el origen del ciber-ataque hasta el Centro Comercial.', targetX: 82, targetY: 44, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M7_DRAG_RACE',
      title: '🏎️ 7. Carrera Clandestina Nocturna & Secuestro de Hypercar',
      danger: '🔥 🔥 🔥 🔥 (ALTO PELIGRO)',
      rewardMoney: 8500,
      rewardXP: 1600,
      rewardItem: '🚘 Supercar Personalizado Clandestino & $8,500',
      stages: [
        { desc: '1️⃣ Encuentra el coche deportivo frente a la Discoteca Neon.', targetX: 42, targetY: 82, reqType: 'LOCATION' },
        { desc: '2️⃣ Completa el circuito perimetral de la ciudad en menos de 2 minutos.', reqType: 'ACTION', actionMsg: '🏎️ ¡Circuito completado a máxima velocidad!' },
        { desc: '3️⃣ Esquiva los clavos policiales y guarda el coche en el garaje del Hotel Luna.', targetX: 62, targetY: 24, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M8_BIOHAZARD_OUTBREAK',
      title: '☣️ 8. Contención del Brote Biológico en Urgencias',
      danger: '☣️☣️☣️☣️☣️ (EXTREMO)',
      rewardMoney: 7500,
      rewardXP: 1400,
      rewardItem: '🩺 Licencia Cirujano Maestro & $7,500',
      stages: [
        { desc: '1️⃣ Corre al Hospital General Link y bloquea el ala de cuarentena.', targetX: 5, targetY: 24, reqType: 'LOCATION' },
        { desc: '2️⃣ Sintetiza la vacuna y cura a 5 ciudadanos infectados.', reqType: 'ACTION', actionMsg: '💉 Pacientes administrados con antídoto.' },
        { desc: '3️⃣ Transporta las muestras biológicas purificadas a la Presidencia.', targetX: 50, targetY: 10, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M9_TURF_WAR',
      title: '⚔️ 9. Guerra de Bandas & Liberación de Distritos',
      danger: '💥💥💥💥💥 (EXTREMO)',
      rewardMoney: 9000,
      rewardXP: 1900,
      rewardItem: '🏅 Medalla de Oro Alguacil Urbano & $9,000',
      stages: [
        { desc: '1️⃣ Acude al Paladar Don Link donde se desarrolla el tiroteo.', targetX: 22, targetY: 82, reqType: 'LOCATION' },
        { desc: '2️⃣ Establece puestos de control en las 4 avenidas principales.', reqType: 'ACTION', actionMsg: '🛡️ Puestos de control asegurados.' },
        { desc: '3️⃣ Restablece el orden total en el Sector Sur.', targetX: 50, targetY: 80, reqType: 'LOCATION' }
      ]
    },
    {
      id: 'M10_ANCIENT_VAULT',
      title: '🏆 10. Búsqueda del Tesoro Ancestral en la Cripta Olvidada',
      danger: '🌟 🌟 🌟 🌟 🌟 (MÁXIMA LEYENDA)',
      rewardMoney: 15000,
      rewardXP: 3000,
      rewardItem: '👑 Gran Corona de Leyenda Urbana & $15,000',
      stages: [
        { desc: '1️⃣ Inspecciona las tumbas antiguas del Cementerio Municipal.', targetX: 82, targetY: 24, reqType: 'LOCATION' },
        { desc: '2️⃣ Resuelve el acertijo rúnico en la cripta del subterráneo.', reqType: 'ACTION', actionMsg: '🗝️ Acertijo ancestral resuelto.' },
        { desc: '3️⃣ Abre la gran bóveda de oro y reclama el tesoro legendario.', targetX: 50, targetY: 50, reqType: 'LOCATION' }
      ]
    }
  ];

  let activeMissionIdx = -1;
  let currentStageIdx = 0;
  let missionCompletedList = [];

  function startMission(idx) {
    if (idx < 0 || idx >= MISSIONS.length) return;
    activeMissionIdx = idx;
    currentStageIdx = 0;

    const m = MISSIONS[activeMissionIdx];
    addMissionLog(`🚨 Misión Iniciada: ${m.title}`);
    alert(`🚨 ¡Has aceptado la Misión Peligrosa!\n\n${m.title}\nPeligro: ${m.danger}\n\nObjetivo: ${m.stages[0].desc}`);
  }

  function updateMissionProgress(playerX, playerY) {
    if (activeMissionIdx < 0) return;

    const m = MISSIONS[activeMissionIdx];
    const stage = m.stages[currentStageIdx];

    if (!stage) return;

    if (stage.reqType === 'LOCATION') {
      const dist = Math.abs(playerX - stage.targetX) + Math.abs(playerY - stage.targetY);
      if (dist <= 3) {
        advanceMissionStage();
      }
    }
  }

  function triggerMissionAction() {
    if (activeMissionIdx < 0) return;

    const m = MISSIONS[activeMissionIdx];
    const stage = m.stages[currentStageIdx];

    if (stage && stage.reqType === 'ACTION') {
      alert(`✨ ${stage.actionMsg}`);
      advanceMissionStage();
    }
  }

  function advanceMissionStage() {
    const m = MISSIONS[activeMissionIdx];
    currentStageIdx++;

    if (currentStageIdx >= m.stages.length) {
      // Mission Fully Complete!
      completeActiveMission();
    } else {
      const nextStage = m.stages[currentStageIdx];
      addMissionLog(`📍 Siguiente Objetivo: ${nextStage.desc}`);
      alert(`✅ ¡Etapa completada!\n\n📍 Siguiente Objetivo:\n${nextStage.desc}`);
    }
  }

  function completeActiveMission() {
    if (activeMissionIdx < 0) return;

    const m = MISSIONS[activeMissionIdx];
    if (!missionCompletedList.includes(m.id)) {
      missionCompletedList.push(m.id);
    }

    if (window.CiudadLinkMain && window.CiudadLinkMain.addReward) {
      window.CiudadLinkMain.addReward(m.rewardMoney, m.rewardXP);
    }

    addMissionLog(`🎉 ¡MISIÓN CUMPLIDA! ${m.title}. Recompensa: $${m.rewardMoney} + ${m.rewardXP} XP.`);
    alert(`🎉 ¡FELICITACIONES! MISION COMPLETADA EXITOSAMENTE:\n\n${m.title}\n\n🎁 Recompensas Ganadas:\n💰 +$${m.rewardMoney}\n⭐ +${m.rewardXP} XP\n${m.rewardItem}`);

    activeMissionIdx = -1;
    currentStageIdx = 0;
  }

  function addMissionLog(msg) {
    if (window.CiudadLinkMain && window.CiudadLinkMain.addLog) {
      window.CiudadLinkMain.addLog(msg);
    }
  }

  function handleRemoteMissionUpdate(packet) {
    if (packet && packet.missionTitle) {
      addMissionLog(`🤝 [Co-op Net] ${packet.senderName} avanzó en la misión: ${packet.missionTitle}`);
    }
  }

  return {
    MISSIONS,
    startMission,
    updateMissionProgress,
    triggerMissionAction,
    handleRemoteMissionUpdate,
    get activeMissionIdx() { return activeMissionIdx; },
    get currentStageIdx() { return currentStageIdx; },
    get missionCompletedList() { return missionCompletedList; }
  };
})();
