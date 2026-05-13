/**
 * Génère automatiquement un nouveau cycle en appliquant
 * des règles de progression sur le cycle précédent.
 */

// Parse "8 × 3 min" → { reps: 8, duration: 3, unit: 'min' }
function parseContent(content) {
  const match = content.match(/(\d+)\s*[×x]\s*(\d+(?:[',.]?\d*)?)\s*(min|s|'|")?/i)
  if (!match) return null
  return {
    reps: parseInt(match[1]),
    duration: parseFloat(match[2].replace(',', '.')),
    unit: match[3] || 'min',
    raw: content,
  }
}

// Parse "1 min trot" → { value: 1, unit: 'min' }
function parseRecovery(recovery) {
  if (!recovery) return null
  const match = recovery.match(/(\d+(?:[',.]?\d*)?)\s*(min|s|'|")?/i)
  if (!match) return null
  const val = parseFloat(match[1].replace(',', '.'))
  const unit = match[2] || 'min'
  return { value: val, unit, seconds: unit === 's' ? val : val * 60 }
}

function formatRecovery(seconds) {
  if (seconds < 60) return `${seconds} s récup`
  const mins = seconds / 60
  if (Number.isInteger(mins)) return `${mins} min récup`
  const m = Math.floor(mins)
  const s = (mins - m) * 60
  return `${m}'${String(s).padStart(2, '0')} récup`
}

// ─── VMA progression (Lundi) ──────────────────────────────────────────────
function progressVmaSession(session, weekType) {
  if (weekType === 'recovery') return { ...session } // Semaine allégée → ne pas progresser

  const parsed = parseContent(session.content)
  const rec = parseRecovery(session.recovery)

  if (!parsed || !rec) return { ...session }

  let { reps, duration, unit } = parsed
  let recSeconds = rec.seconds

  // Règle 1 : réduire récupération si > 45s
  if (recSeconds > 45) {
    recSeconds = Math.max(45, recSeconds - 15)
    return {
      ...session,
      recovery: formatRecovery(recSeconds),
      objective: session.objective + ' — récupération réduite',
    }
  }

  // Règle 2 : ajouter des répétitions (si < 12 pour fractions courtes, < 8 pour longues)
  const maxReps = duration <= 2 ? 14 : duration <= 3 ? 10 : 8
  if (reps < maxReps) {
    reps += (duration <= 1 ? 2 : 1)
    return {
      ...session,
      content: `${reps} × ${duration} ${unit}`,
      objective: session.objective + ' — +répétitions',
    }
  }

  // Règle 3 : allonger les fractions
  const maxDuration = 5
  if (duration < maxDuration) {
    duration = Math.min(maxDuration, duration + (duration < 2 ? 0.5 : 1))
    reps = Math.max(4, reps - 2) // réduire les reps quand on allonge
    const newRecSeconds = Math.min(rec.seconds + 15, 90)
    return {
      ...session,
      content: `${reps} × ${duration} min`,
      recovery: formatRecovery(newRecSeconds),
      objective: session.objective + ' — fractions allongées',
    }
  }

  return { ...session }
}

// ─── Spécifique 10 km progression (Jeudi) ────────────────────────────────
const SPECIFIQUE_PROGRESSION = [
  { reps: 5, duration: 4, next: { reps: 6, duration: 4 } },
  { reps: 6, duration: 4, next: { reps: 5, duration: 5 } },
  { reps: 5, duration: 5, next: { reps: 4, duration: 6 } },
  { reps: 3, duration: 10, next: { reps: 3, duration: 12 } },
  { reps: 3, duration: 12, next: { reps: 2, duration: 15 } },
  { reps: 2, duration: 15, next: { reps: 2, duration: 18 } },
]

function progressSpecifiqueSession(session, weekType) {
  if (weekType === 'recovery') return { ...session }

  const parsed = parseContent(session.content)
  if (!parsed) return { ...session }

  const { reps, duration } = parsed

  const found = SPECIFIQUE_PROGRESSION.find(
    (p) => p.reps === reps && Math.abs(p.duration - duration) < 0.5
  )

  if (found) {
    const { next } = found
    return {
      ...session,
      content: `${next.reps} × ${next.duration} min`,
      objective: session.objective + ' — volume progressé',
    }
  }

  // Default : add 1 rep
  return {
    ...session,
    content: `${reps + 1} × ${duration} min`,
    objective: session.objective + ' — +1 répétition',
  }
}

// ─── Seuil progression ────────────────────────────────────────────────────
function progressSeuilSession(session, weekType) {
  if (weekType === 'recovery') return { ...session }

  const parsed = parseContent(session.content)
  if (!parsed) return { ...session }

  const { reps, duration } = parsed

  if (duration < 12) {
    return { ...session, content: `${reps} × ${duration + 2} min` }
  }
  if (reps > 1) {
    return { ...session, content: `${reps - 1} × ${duration + 3} min` }
  }
  return { ...session, content: `${reps} × ${Math.min(duration + 5, 30)} min` }
}

// ─── Sortie longue progression ────────────────────────────────────────────
function progressSlSession(session, weekType) {
  if (weekType === 'recovery') return { ...session }
  const match = session.content.match(/(\d+)/)
  if (!match) return { ...session }
  const km = parseInt(match[1])
  const newKm = Math.min(km + 1, 22)
  return {
    ...session,
    content: session.content.replace(/\d+/, String(newKm)),
  }
}

// ─── Endurance fondamentale ────────────────────────────────────────────────
function progressEfSession(session, weekType) {
  if (weekType === 'recovery') return { ...session }
  const match = session.content.match(/(\d+)/)
  if (!match) return { ...session }
  const km = parseInt(match[1])
  const newKm = Math.min(km + 1, 14)
  return { ...session, content: session.content.replace(/\d+/, String(newKm)) }
}

// ─── Main progression function ───────────────────────────────────────────
export function generateNextCycle(previousCycle, allCycles) {
  const newCycleId = previousCycle.id + 1
  const phases = ['Construction', 'Développement', 'Spécifique Performance', 'Affûtage', 'Performance']
  const colors = ['#4D9FFF', '#00D68F', '#A78BFA', '#FF6635', '#F59E0B']

  const newCycle = {
    id: newCycleId,
    name: `Cycle ${newCycleId}`,
    phase: phases[(newCycleId - 1) % phases.length] || `Performance ${Math.ceil(newCycleId / phases.length)}`,
    color: colors[(newCycleId - 1) % colors.length],
    generatedFrom: previousCycle.id,
    weeks: previousCycle.weeks.map((week) => ({
      ...week,
      sessions: week.sessions.map((session) => {
        const newId = session.id.replace(`c${previousCycle.id}`, `c${newCycleId}`)
        const base = { ...session, id: newId, status: 'pending', completedAt: null, notes: '' }

        switch (session.type) {
          case 'vma':
            return progressVmaSession(base, week.type)
          case 'specifique':
            return progressSpecifiqueSession(base, week.type)
          case 'seuil':
            return progressSeuilSession(base, week.type)
          case 'sl':
            return progressSlSession(base, week.type)
          case 'ef':
            return progressEfSession(base, week.type)
          default:
            return base
        }
      }),
    })),
  }

  return newCycle
}

// ─── Weekly stats ─────────────────────────────────────────────────────────
export function getWeekStats(sessions) {
  const done = sessions.filter((s) => s.status === 'done').length
  const missed = sessions.filter((s) => s.status === 'missed').length
  const total = sessions.length
  const completion = total > 0 ? Math.round((done / total) * 100) : 0
  const totalMinutes = sessions
    .filter((s) => s.status === 'done')
    .reduce((acc, s) => acc + (s.estimatedDuration || 0), 0)

  return { done, missed, total, completion, totalMinutes }
}

// ─── Chrono estimation ────────────────────────────────────────────────────
export function estimateChronoFrom10kmPace(paceStr) {
  const match = paceStr?.match(/(\d)'(\d{2})/)
  if (!match) return null
  const minutes = parseInt(match[1]) + parseInt(match[2]) / 60
  const totalMinutes = minutes * 10
  const m = Math.floor(totalMinutes)
  const s = Math.round((totalMinutes - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
