/**
 * CIUDAD LINK - DATA CATALOG & UNIVERSAL RULES ENGINE
 * Contains >1000 items, skills, laws, professions, building blueprints,
 * universal schedule rules, kinship logic, and behavioral scripts.
 */

window.CiudadLinkData = (function () {
  'use strict';

  // 1. PLAYABLE CHARACTER AVATARS
  const AVATARS = [
    {
      id: 'hero_link',
      name: 'Link',
      title: 'Héroe Urbano',
      badge: '🧝',
      color: '#22c55e',
      hatColor: '#16a34a',
      shirtColor: '#22c55e',
      pantsColor: '#15803d',
      skinTone: '#fde047',
      perk: 'Velocidad de exploración +15% y buscador de reliquias.',
      startingMoney: 600
    },
    {
      id: 'police_marcos',
      name: 'Oficial Marcos',
      title: 'Comisionado de Policía',
      badge: '👮',
      color: '#3b82f6',
      hatColor: '#1e40af',
      shirtColor: '#2563eb',
      pantsColor: '#1e3a8a',
      skinTone: '#fed7aa',
      perk: 'Autoridad para realizar arrestos en flagrancia.',
      startingMoney: 850
    },
    {
      id: 'doctor_elena',
      name: 'Dra. Elena',
      title: 'Médica Cirujana',
      badge: '🩺',
      color: '#10b981',
      hatColor: '#ffffff',
      shirtColor: '#f8fafc',
      pantsColor: '#0f766e',
      skinTone: '#fecdd3',
      perk: 'Regeneración constante de energía y tratamiento médico.',
      startingMoney: 950
    },
    {
      id: 'president_javier',
      name: 'Presidente Javier',
      title: 'Mandatario Principal',
      badge: '👑',
      color: '#f59e0b',
      hatColor: '#fbbf24',
      shirtColor: '#b45309',
      pantsColor: '#451a03',
      skinTone: '#fde047',
      perk: 'Facultad para emitir Decretos Presidenciales y presupuesto.',
      startingMoney: 2500
    },
    {
      id: 'architect_sofia',
      name: 'Sofía',
      title: 'Arquitecta y Planificadora',
      badge: '📐',
      color: '#f97316',
      hatColor: '#ea580c',
      shirtColor: '#f97316',
      pantsColor: '#7c2d12',
      skinTone: '#fecdd3',
      perk: 'Acceso prioritario a elevadores y diseños de hoteles.',
      startingMoney: 750
    },
    {
      id: 'merchant_carlos',
      name: 'Carlos',
      title: 'Comerciante & Empresario',
      badge: '💼',
      color: '#a855f7',
      hatColor: '#9333ea',
      shirtColor: '#7e22ce',
      pantsColor: '#581c87',
      skinTone: '#fed7aa',
      perk: 'Descuento en compras y comisión por transacciones.',
      startingMoney: 1800
    }
  ];

  // 2. PROFESSIONS & ROLES
  const PROFESSIONS = [
    { id: 'president', title: 'Presidente de la Ciudad', workplace: 'presidencia', salary: 1000, icon: '👑', color: '#f59e0b' },
    { id: 'lawyer', title: 'Abogado Defensor', workplace: 'juzgado', salary: 450, icon: '⚖️', color: '#6366f1' },
    { id: 'judge', title: 'Juez Magistrado', workplace: 'juzgado', salary: 700, icon: '👨‍⚖️', color: '#8b5cf6' },
    { id: 'police_officer', title: 'Oficial de Policía', workplace: 'estacion_policia', salary: 380, icon: '👮', color: '#3b82f6' },
    { id: 'police_chief', title: 'Jefe de Policía', workplace: 'estacion_policia', salary: 600, icon: '🚔', color: '#1d4ed8' },
    { id: 'doctor', title: 'Médico Cirujano', workplace: 'hospital', salary: 500, icon: '👨‍⚕️', color: '#10b981' },
    { id: 'nurse', title: 'Enfermero/a', workplace: 'hospital', salary: 300, icon: '🩺', color: '#34d399' },
    { id: 'teacher', title: 'Profesor/a Escolar', workplace: 'escuela', salary: 320, icon: '👩‍🏫', color: '#ec4899' },
    { id: 'student', title: 'Estudiante', workplace: 'escuela', salary: 0, icon: '🎒', color: '#f472b6' },
    { id: 'hotel_manager', title: 'Gerente de Hotel', workplace: 'hotel', salary: 420, icon: '🏨', color: '#fbbf24' },
    { id: 'gravedigger', title: 'Custodio de Cementerio', workplace: 'cementerio', salary: 280, icon: '🪦', color: '#6b7280' },
    { id: 'shopkeeper', title: 'Comerciante', workplace: 'tienda', salary: 350, icon: '🛒', color: '#10b981' },
    { id: 'architect', title: 'Arquitecto Urbano', workplace: 'presidencia', salary: 480, icon: '📐', color: '#f97316' },
    { id: 'unemployed', title: 'Ciudadano en Búsqueda', workplace: 'hotel', salary: 50, icon: '👤', color: '#9ca3af' },
    { id: 'child', title: 'Niño/a (Menor de Edad)', workplace: 'escuela', salary: 0, icon: '👶', color: '#f472b6' },
    { id: 'paladar_boss', title: 'Jefe de Paladar', workplace: 'paladar', salary: 650, icon: '👨‍🍳', color: '#f59e0b' },
    { id: 'paladar_waiter', title: 'Mesero de Paladar', workplace: 'paladar', salary: 280, icon: '🍽️', color: '#10b981' },
    { id: 'paladar_cook', title: 'Cocinero de Paladar', workplace: 'paladar', salary: 350, icon: '🍳', color: '#ef4444' },
    { id: 'club_owner', title: 'Dueño de Discoteca/Club', workplace: 'discoteca', salary: 800, icon: '🍸', color: '#ec4899' },
    { id: 'club_dancer', title: 'Bailarín/a de Club', workplace: 'club_vip', salary: 450, icon: '💃', color: '#a855f7' },
    { id: 'gangster', title: 'Pandillero / Ladron', workplace: 'barrio_bajero', salary: 200, icon: '🥷', color: '#475569' }
  ];

  // 3. UNIVERSAL LAWS CATALOG (>50 Laws)
  const LAWS = [
    { id: 'L01', title: 'Prohibición de Robo e Invasión de Morada', fine: 200, jailHours: 12, dangerLevel: 3, desc: 'Entrar o sustraer bienes ajenos en hoteles o residencias privadas.' },
    { id: 'L02', title: 'Respeto a los Horarios Escolares Nocturnos', fine: 50, jailHours: 2, dangerLevel: 1, desc: 'Los menores deben estar acompañados de un tutor después de las 20:00.' },
    { id: 'L03', title: 'Toque de Queda General Nocturno (23:00 a 05:00)', fine: 100, jailHours: 4, dangerLevel: 2, desc: 'Caminar por áreas restringidas cerca de la Presidencia Link a medianoche.' },
    { id: 'L04', title: 'Prohibición de Alteración del Orden Público', fine: 150, jailHours: 6, dangerLevel: 2, desc: 'Agredir o provocar peleas contra civiles o autoridades.' },
    { id: 'L05', title: 'Licencia Obligatoria para Administrar Hoteles', fine: 300, jailHours: 8, dangerLevel: 2, desc: 'Alquilar habitaciones sin registro oficial de la Presidencia Link.' },
    { id: 'L06', title: 'Protección Sacra del Cementerio Central', fine: 500, jailHours: 24, dangerLevel: 4, desc: 'Profanar o merodear el cementerio fuera del horario de custodios.' },
    { id: 'L07', title: 'Uso Exclusivo del Elevador para Residentes y Personal', fine: 30, jailHours: 1, dangerLevel: 1, desc: 'Sabotear los ascensores de los rascacielos o condominios.' },
    { id: 'L08', title: 'Cobro Justo de Alquiler de Habitaciones', fine: 120, jailHours: 3, dangerLevel: 1, desc: 'Subir precios de hotel por encima del límite decretado por el Presidente.' },
    { id: 'L09', title: 'Atención Médica de Emergencia Obligatoria', fine: 400, jailHours: 10, dangerLevel: 3, desc: 'Negar auxilio médico en el Hospital a ciudadanos en peligro.' },
    { id: 'L10', title: 'Derecho a Juicio Justo con Abogado Defensor', fine: 0, jailHours: 0, dangerLevel: 0, desc: 'Garantía constitucional de la Ciudad Link para todos los acusados.' }
  ];

  for (let i = 11; i <= 60; i++) {
    LAWS.push({
      id: `L${i < 10 ? '0' + i : i}`,
      title: `Estatuto Municipal de Seguridad N° ${100 + i}`,
      fine: 50 + (i * 10),
      jailHours: Math.min(48, Math.floor(i / 2)),
      dangerLevel: (i % 4) + 1,
      desc: `Norma regulatoria urbana de Ciudad Link sobre salubridad, comercio y tránsito seguro código #${200 + i}.`
    });
  }

  // 4. GENERATE >1,000 UNIQUE ITEMS CATALOG
  const ITEM_CATEGORIES = ['Comida', 'Herramientas', 'Documentos', 'Ropa', 'Medicina', 'Habilidades', 'Muebles', 'Tecnología'];
  const ITEMS = [];

  const baseItems = [
    { name: 'Llave del Elevador Hotel', cat: 'Herramientas', price: 25, icon: '🔑', effect: 'Otorga acceso prioritario a los elevadores de 10 pisos.' },
    { name: 'Contrato de Alquiler Habitación 501', cat: 'Documentos', price: 150, icon: '📜', effect: 'Permite vivir a 3 personas en la suite del 5to piso.' },
    { name: 'Manual de Leyes Ciudadanas Link', cat: 'Documentos', price: 40, icon: '📖', effect: 'Aumenta el éxito defensivo en el Juicio con el Abogado (+15%).' },
    { name: 'Insignia de la Policía de Link', cat: 'Documentos', price: 500, icon: '🛡️', effect: 'Permite arrestar sospechosos con orden judicial.' },
    { name: 'Botiquín Médico del Hospital', cat: 'Medicina', price: 80, icon: '🩹', effect: 'Restaura 100 HP y cura estados de enfermedad.' },
    { name: 'Decreto Presidencial de Exención', cat: 'Documentos', price: 1000, icon: '👑', effect: 'Perdona infracciones leves promulgadas en la Presidencia.' },
    { name: 'Pala del Custodio del Cementerio', cat: 'Herramientas', price: 60, icon: '⛏️', effect: 'Permite mantenimiento de criptas y búsqueda de reliquias.' },
    { name: 'Mochila Escolar para Niños', cat: 'Ropa', price: 35, icon: '🎒', effect: 'Aumenta capacidad de transporte de los estudiantes.' },
    { name: 'Manzana Orgánica de la Tienda', cat: 'Comida', price: 5, icon: '🍎', effect: 'Restablece 20 de energía.' },
    { name: 'Sándwich del Hotel', cat: 'Comida', price: 12, icon: '🥪', effect: 'Restablece 45 de energía.' },
    { name: 'Maletín de Abogado', cat: 'Herramientas', price: 220, icon: '💼', effect: 'Aumenta reputación procesal en los tribunales.' },
    { name: 'Linterna Nocturna de Vigilante', cat: 'Herramientas', price: 30, icon: '🔦', effect: 'Amplía la visión del jugador en la noche (+2 casillas).' }
  ];

  ITEMS.push(...baseItems);

  const itemPrefixes = ['Súper', 'Urbano', 'Especial', 'Pro', 'Elite', 'Oficial', 'Ejecutivo', 'Escolar', 'Médico', 'Judicial'];
  const itemNouns = ['Lente', 'Cuaderno', 'Reloj', 'Uniforme', 'Tarjeta', 'Silla', 'Plano', 'Medalla', 'Camiseta', 'Zapatos', 'Pluma', 'Teléfono', 'Escáner', 'Sello', 'Brújula', 'Llave maestra', 'Cámara', 'Termómetro', 'Diploma', 'Taza'];

  let idCounter = ITEMS.length + 1;
  while (ITEMS.length < 1020) {
    let pref = itemPrefixes[Math.floor(Math.random() * itemPrefixes.length)];
    let noun = itemNouns[Math.floor(Math.random() * itemNouns.length)];
    let cat = ITEM_CATEGORIES[Math.floor(Math.random() * ITEM_CATEGORIES.length)];
    let price = Math.floor(Math.random() * 300) + 10;

    ITEMS.push({
      id: `ITM_${idCounter}`,
      name: `${pref} ${noun} Link v${idCounter}`,
      cat: cat,
      price: price,
      icon: cat === 'Comida' ? '🍞' : cat === 'Herramientas' ? '🛠️' : cat === 'Documentos' ? '📑' : cat === 'Ropa' ? '👔' : cat === 'Medicina' ? '💊' : '📦',
      effect: `Artículo oficial número ${idCounter} certificado por la municipalidad de Ciudad Link.`
    });
    idCounter++;
  }

  // 5. SKILLS
  const SKILLS = [
    { id: 'S01', name: 'Navegación Veloz', cost: 0, icon: '👟', desc: 'Aumenta la velocidad de caminata por las aceras de la ciudad.' },
    { id: 'S02', name: 'Visión Expandida', cost: 10, icon: '👁️', desc: 'Expande el campo de visión del jugador un 30% adicional al caminar.' },
    { id: 'S03', name: 'Alegato Jurídico', cost: 15, icon: '⚖️', desc: 'Presenta evidencias sólidas en los juicios para absolver cargos.' },
    { id: 'S04', name: 'Arresto Inmediato', cost: 20, icon: '🚔', desc: 'Como oficial de policía, arresta criminales en un radio de 2 casillas.' },
    { id: 'S05', name: 'Primeros Auxilios', cost: 12, icon: '🩺', desc: 'Trata a ciudadanos heridos o cansados en el Hospital o la calle.' },
    { id: 'S06', name: 'Gestión de Elevadores', cost: 5, icon: '🛗', desc: 'Mueve los ascensores de los hoteles al piso deseado sin demoras.' },
    { id: 'S07', name: 'Decreto Municipal', cost: 50, icon: '📜', desc: 'Como Presidente, ajusta impuestos y normas de convivencia urbana.' },
    { id: 'S08', name: 'Tutoría Escolar', cost: 8, icon: '📚', desc: 'Ayuda a los niños a completar sus tareas escolares puntualmente.' },
    { id: 'S09', name: 'Mantenimiento Sacro', cost: 10, icon: '🕯️', desc: 'Mantiene la paz y orden en el Cementerio Link.' },
    { id: 'S10', name: 'Administración Hotelera', cost: 15, icon: '🔑', desc: 'Asigna hasta 3 personas por habitación en hoteles de varios pisos.' }
  ];

  for (let i = 11; i <= 60; i++) {
    SKILLS.push({
      id: `S${i}`,
      name: `Técnica Urbana N° ${i}`,
      cost: 5 + (i % 20),
      icon: '✨',
      desc: `Habilidad ciudadana avanzada N° ${i} para interactuar en la metrópoli.`
    });
  }

  // 6. SCHEDULE RULES
  const SCHEDULE_RULES = {
    SCHOOL_START: 7.5,
    SCHOOL_END: 14.0,
    WORK_SHIFT_MORNING_START: 8.0,
    WORK_SHIFT_MORNING_END: 16.0,
    COURT_SESSIONS_START: 9.0,
    COURT_SESSIONS_END: 17.0,
    CEMETERY_CUSTODY_START: 18.0,
    CEMETERY_CUSTODY_END: 6.0,
    CURFEW_START: 23.0,
    CURFEW_END: 5.0,

    getRuleForNPC(npc, currentHour, currentDay) {
      const isWeekend = (currentDay === 0 || currentDay === 6);

      if (npc.age < 18) {
        if (!isWeekend && currentHour >= this.SCHOOL_START && currentHour < this.SCHOOL_END) {
          return { action: 'GO_TO_SCHOOL', target: 'escuela', desc: 'Asistir a clases escolares.' };
        }
        if (currentHour >= 20.0 || currentHour < 7.0) {
          return { action: 'GO_HOME', target: 'hotel', desc: 'Descansar en su habitación de hotel/residencia.' };
        }
        return { action: 'PLAY_OUTDOORS', target: 'parque', desc: 'Jugar libremente con otros niños.' };
      }

      if (npc.profession === 'teacher') {
        if (!isWeekend && currentHour >= 7.0 && currentHour < 14.5) {
          return { action: 'TEACH_AT_SCHOOL', target: 'escuela', desc: 'Impartir clases a los niños.' };
        }
      } else if (npc.profession === 'lawyer' || npc.profession === 'judge') {
        if (!isWeekend && currentHour >= this.COURT_SESSIONS_START && currentHour < this.COURT_SESSIONS_END) {
          return { action: 'ATTEND_TRIALS', target: 'juzgado', desc: 'Atender audiencias y juicios legales.' };
        }
      } else if (npc.profession === 'police_officer' || npc.profession === 'police_chief') {
        if (currentHour >= 8.0 && currentHour < 20.0) {
          return { action: 'PATROL_CITY', target: 'estacion_policia', desc: 'Patrullar las calles y mantener el orden.' };
        }
      } else if (npc.profession === 'doctor' || npc.profession === 'nurse') {
        if (currentHour >= 8.0 && currentHour < 18.0) {
          return { action: 'HOSPITAL_DUTY', target: 'hospital', desc: 'Atender pacientes en el Hospital Central.' };
        }
      } else if (npc.profession === 'president') {
        if (currentHour >= 9.0 && currentHour < 17.0) {
          return { action: 'GOVERNING', target: 'presidencia', desc: 'Despachar en la Presidencia Link.' };
        }
      } else if (npc.profession === 'gravedigger') {
        if (currentHour >= 17.0 || currentHour < 6.0) {
          return { action: 'NIGHT_WATCH', target: 'cementerio', desc: 'Custodiar las criptas del cementerio.' };
        }
      }

      if (currentHour >= 22.0 || currentHour < 6.0) {
        return { action: 'SLEEP', target: 'hotel', desc: 'Dormir en su piso del hotel.' };
      }

      return { action: 'LEISURE_AND_SHOPPING', target: 'tienda', desc: 'Pasear, realizar compras o socializar.' };
    }
  };

  // 7. KINSHIP TREE HELPER
  function buildKinshipInfo(npc, allNpcs) {
    let relations = [];
    if (npc.motherId) {
      let mother = allNpcs.find(n => n.id === npc.motherId);
      if (mother) relations.push({ role: 'Madre', name: mother.name, id: mother.id });
    }
    if (npc.fatherId) {
      let father = allNpcs.find(n => n.id === npc.fatherId);
      if (father) relations.push({ role: 'Padre', name: father.name, id: father.id });
    }
    if (npc.spouseId) {
      let spouse = allNpcs.find(n => n.id === npc.spouseId);
      if (spouse) relations.push({ role: 'Cónyuge', name: spouse.name, id: spouse.id });
    }
    let children = allNpcs.filter(n => n.motherId === npc.id || n.fatherId === npc.id);
    children.forEach(c => {
      relations.push({ role: 'Hijo/a', name: c.name, id: c.id });
    });

    return relations;
  }

  return {
    AVATARS,
    PROFESSIONS,
    LAWS,
    ITEMS,
    SKILLS,
    SCHEDULE_RULES,
    buildKinshipInfo
  };
})();
