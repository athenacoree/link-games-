/**
 * CIUDAD LINK - LEGAL SYSTEM, COURTROOM TRIALS & POLICE ARRESTS
 * Handles law infractions, police arrests, courtroom trials with lawyers and judges,
 * bail fines, prison sentences, and legal record tracking.
 */

window.CiudadLinkLawCourt = (function () {
  'use strict';

  let legalRecords = [];

  // Register a law violation
  function reportCrime(offenderName, lawId, location) {
    const law = window.CiudadLinkData.LAWS.find(l => l.id === lawId) || window.CiudadLinkData.LAWS[0];

    const crimeRecord = {
      id: `CRIME_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      offenderName,
      lawId: law.id,
      lawTitle: law.title,
      fine: law.fine,
      jailHours: law.jailHours,
      location,
      status: 'PENDIENTE_DE_JUICIO', // 'PENDIENTE_DE_JUICIO', 'ABSOLUTO', 'CONDENADO'
      date: window.CiudadLinkNPCs.getTimeFormatted()
    };

    legalRecords.push(crimeRecord);
    return crimeRecord;
  }

  // Conduct a Courtroom Trial (Juicio Legal con Abogado y Juez)
  function conductTrial(crimeId, lawyerSkillBonus = 0) {
    const record = legalRecords.find(r => r.id === crimeId);
    if (!record) return { success: false, message: 'Expediente no encontrado en la Corte de Ciudad Link.' };

    const judge = window.CiudadLinkNPCs.npcs.find(n => n.profession === 'judge') || { name: 'Juez Magistrado' };
    const lawyer = window.CiudadLinkNPCs.npcs.find(n => n.profession === 'lawyer') || { name: 'Abogado Defensor' };

    // Defense Success Chance (50% base + Lawyer bonus)
    const defenseScore = Math.floor(Math.random() * 100) + lawyerSkillBonus;

    if (defenseScore >= 45) {
      record.status = 'ABSUELTO';
      return {
        success: true,
        record,
        judgeName: judge.name,
        lawyerName: lawyer.name,
        verdict: 'ABSOLUCIÓN',
        message: `⚖️ ¡EL TRIBUNAL DE CIUDAD LINK DECLARA AL ACUSADO ABSUELTO DE TODOS LOS CARGOS! El ${lawyer.name} presentó defensas irrefutables ante la ${judge.name}.`
      };
    } else {
      record.status = 'CONDENADO';
      return {
        success: false,
        record,
        judgeName: judge.name,
        lawyerName: lawyer.name,
        verdict: 'CONDENA',
        message: `⚖️ CONDENA PRONUNCIADA: La ${judge.name} ha hallado culpable al acusado por violación del '${record.lawTitle}'. Multa de $${record.fine} y ${record.jailHours} hrs de presidio.`
      };
    }
  }

  // Police Arrest Action
  function arrestCriminal(npc, officerName = 'Oficial de Policía') {
    npc.isArrested = true;
    npc.x = 12; // Police Station Holding Cells
    npc.y = 12;

    const crime = reportCrime(npc.name, 'L01', 'Estación de Policía Central');

    return {
      success: true,
      crime,
      message: `🚔 ¡${npc.name} HAS SIDO ARRESTADO POR EL ${officerName}! Trasladado a las celdas de la Comisaría Central para audiencia judicial.`
    };
  }

  return {
    reportCrime,
    conductTrial,
    arrestCriminal,
    get legalRecords() { return legalRecords; }
  };
})();
