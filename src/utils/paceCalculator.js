/**
 * Calcul des allures à partir de la VMA (vitesse maximale aérobie)
 * Toutes les allures sont dérivées d'un % de la VMA en km/h
 */

// ─── % de VMA par type de séance ─────────────────────────────────────────────
export const PACE_PERCENTS = {
  vma_short:       { min: 100, max: 107 }, // Fractions ≤ 2 min
  vma_medium:      { min: 95,  max: 102 }, // Fractions 2–4 min
  vma_long:        { min: 90,  max: 97  }, // Fractions ≥ 5 min
  specifique:      { min: 87,  max: 92  }, // Allure 10 km
  seuil:           { min: 82,  max: 87  }, // Seuil lactique
  enduranceActive: { min: 75,  max: 80  }, // Tempo / endurance active
  ef:              { min: 63,  max: 70  }, // Endurance fondamentale
  sl:              { min: 60,  max: 68  }, // Sortie longue
}

// ─── Progression des % par cycle ─────────────────────────────────────────────
// Tous les 2 cycles, on gagne X% de VMA → allure plus rapide
export const PACE_PROGRESSION_PER_CYCLE = {
  vma:       0.8,  // +0.8% VMA par cycle → ~1-2 sec/km plus rapide
  specifique: 0.5, // +0.5% VMA par cycle
  seuil:     0.4,  // +0.4% VMA par cycle
  ef:        0,    // EF inchangée
  sl:        0,    // SL inchangée
}

// ─── Conversion km/h → allure min/km ────────────────────────────────────────
export function kmhToPaceStr(kmh) {
  if (!kmh || kmh <= 0) return null
  const totalSeconds = 3600 / kmh
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${minutes}'${String(seconds).padStart(2, '0')}`
}

// ─── Allure min/km → km/h ────────────────────────────────────────────────────
export function paceStrToKmh(paceStr) {
  // Accepte "3'30" ou "3'30/km" ou "3:30"
  const match = paceStr?.replace(/\/km.*/, '').trim().match(/^(\d+)[':'](\d{2})$/)
  if (!match) return null
  const minutes = parseInt(match[1]) + parseInt(match[2]) / 60
  return 60 / minutes
}

// ─── Parser la VMA saisie par l'utilisateur ──────────────────────────────────
// Accepte : "17.5" (km/h), "17,5", "3'20" (allure VMA)
export function parseVmaInput(input) {
  if (!input) return null
  const str = String(input).trim().replace(',', '.')

  // Si c'est un nombre direct → km/h
  const asFloat = parseFloat(str)
  if (!isNaN(asFloat) && asFloat > 8 && asFloat < 30) return asFloat

  // Si c'est une allure (ex: "3'20") → convertir en km/h
  const fromPace = paceStrToKmh(str)
  if (fromPace) return fromPace

  return null
}

// ─── Détecter le sous-type VMA selon la durée des fractions ─────────────────
function detectVmaSubtype(content) {
  const match = content?.match(/(\d+(?:[.,]\d+)?)\s*(min|'|s|")/i)
  if (!match) return 'vma_short'
  const val = parseFloat(match[1].replace(',', '.'))
  const unit = match[2]
  const minutes = unit === 's' || unit === '"' ? val / 60 : val
  if (minutes <= 2) return 'vma_short'
  if (minutes <= 4) return 'vma_medium'
  return 'vma_long'
}

// ─── Calculer une plage d'allure ─────────────────────────────────────────────
export function calcPaceRange(vmaKmh, percentMin, percentMax, cycleBonus = 0) {
  const effectiveMin = percentMin + cycleBonus
  const effectiveMax = percentMax + cycleBonus
  const speedMin = vmaKmh * (effectiveMin / 100)
  const speedMax = vmaKmh * (effectiveMax / 100)
  // speedMax → allure la plus rapide (min/km plus petit)
  const paceMin = kmhToPaceStr(speedMax) // plus rapide
  const paceMax = kmhToPaceStr(speedMin) // plus lente
  return `${paceMin}–${paceMax}/km`
}

// ─── Calculer l'allure d'une séance selon son type ───────────────────────────
export function calcSessionPace(session, vmaKmh, cycleNum = 1) {
  if (!vmaKmh) return session.pace

  const bonus = (cycleNum - 1) * (PACE_PROGRESSION_PER_CYCLE[session.type] || 0)

  switch (session.type) {
    case 'vma': {
      const sub = detectVmaSubtype(session.content)
      const p = PACE_PERCENTS[sub]
      return calcPaceRange(vmaKmh, p.min, p.max, bonus)
    }
    case 'specifique': {
      const p = PACE_PERCENTS.specifique
      return calcPaceRange(vmaKmh, p.min, p.max, bonus)
    }
    case 'seuil': {
      // Seuil ou tempo
      const isLight = session.content?.toLowerCase().includes('léger') ||
                      session.content?.toLowerCase().includes('leger')
      const p = isLight ? PACE_PERCENTS.enduranceActive : PACE_PERCENTS.seuil
      return calcPaceRange(vmaKmh, p.min, p.max, bonus)
    }
    case 'ef': {
      const p = PACE_PERCENTS.ef
      return calcPaceRange(vmaKmh, p.min, p.max, 0) // pas de progression EF
    }
    case 'sl': {
      const p = PACE_PERCENTS.sl
      return calcPaceRange(vmaKmh, p.min, p.max, 0)
    }
    default:
      return session.pace
  }
}

// ─── Recalculer toutes les allures d'un cycle ────────────────────────────────
export function recalcCyclePaces(cycle, vmaKmh) {
  if (!vmaKmh) return cycle
  return {
    ...cycle,
    weeks: cycle.weeks.map((week) => ({
      ...week,
      sessions: week.sessions.map((session) => ({
        ...session,
        pace: calcSessionPace(session, vmaKmh, cycle.id),
      })),
    })),
  }
}

// ─── Recalculer tous les cycles ──────────────────────────────────────────────
export function recalcAllPaces(cycles, vmaKmh) {
  if (!vmaKmh) return cycles
  return cycles.map((cycle) => recalcCyclePaces(cycle, vmaKmh))
}

// ─── Estimation chrono 10 km depuis VMA ──────────────────────────────────────
export function estimateChronoFromVma(vmaKmh) {
  if (!vmaKmh) return null
  // 10 km ≈ 89.5% de la VMA (formule empirique coureur régulier)
  const speed10km = vmaKmh * 0.895
  const timeMinutes = 10 / speed10km * 60
  const m = Math.floor(timeMinutes)
  const s = Math.round((timeMinutes - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Tableau des allures de référence depuis la VMA ──────────────────────────
export function getAllPaceTable(vmaKmh) {
  if (!vmaKmh) return null
  return {
    vma: calcPaceRange(vmaKmh, PACE_PERCENTS.vma_short.min, PACE_PERCENTS.vma_short.max),
    specifique: calcPaceRange(vmaKmh, PACE_PERCENTS.specifique.min, PACE_PERCENTS.specifique.max),
    seuil: calcPaceRange(vmaKmh, PACE_PERCENTS.seuil.min, PACE_PERCENTS.seuil.max),
    enduranceActive: calcPaceRange(vmaKmh, PACE_PERCENTS.enduranceActive.min, PACE_PERCENTS.enduranceActive.max),
    ef: calcPaceRange(vmaKmh, PACE_PERCENTS.ef.min, PACE_PERCENTS.ef.max),
    sl: calcPaceRange(vmaKmh, PACE_PERCENTS.sl.min, PACE_PERCENTS.sl.max),
    chrono10km: estimateChronoFromVma(vmaKmh),
  }
}
