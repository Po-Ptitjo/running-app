import { useState, useEffect, useCallback } from 'react'
import { BASE_CYCLES } from '../data/trainingData'
import { generateNextCycle } from '../utils/progression'
import { loadState, saveState, cloneDeep } from '../utils/storage'
import { parseVmaInput, recalcAllPaces, getAllPaceTable, estimateChronoFromVma } from '../utils/paceCalculator'

const DEFAULT_SETTINGS = {
  vmaKmh: null,
  vmaInput: '',
  objective: "Sub 40'",
}

function buildInitialState() {
  return {
    cycles: cloneDeep(BASE_CYCLES),
    activeCycle: 1,
    activeWeek: 1,
    settings: DEFAULT_SETTINGS,
  }
}

export function useTraining() {
  const [state, setState] = useState(() => {
    const saved = loadState()
    if (saved?.cycles?.length) return saved
    return buildInitialState()
  })

  useEffect(() => {
    saveState(state)
  }, [state])

  const { cycles, activeCycle, activeWeek, settings } = state

  // ─── Navigation ──────────────────────────────────────────────────────────
  const setActiveCycle = useCallback((cycleId) => {
    setState((s) => ({ ...s, activeCycle: cycleId, activeWeek: 1 }))
  }, [])

  const setActiveWeek = useCallback((weekNum) => {
    setState((s) => ({ ...s, activeWeek: weekNum }))
  }, [])

  // ─── Current data ─────────────────────────────────────────────────────────
  const currentCycle = cycles.find((c) => c.id === activeCycle) || cycles[0]
  const currentWeek = currentCycle?.weeks.find((w) => w.number === activeWeek) || currentCycle?.weeks[0]
  const currentSessions = currentWeek?.sessions || []

  // ─── Session update ───────────────────────────────────────────────────────
  const updateSession = useCallback((cycleId, weekNum, sessionId, updates) => {
    setState((s) => {
      const next = cloneDeep(s)
      const cycle = next.cycles.find((c) => c.id === cycleId)
      if (!cycle) return s
      const week = cycle.weeks.find((w) => w.number === weekNum)
      if (!week) return s
      const session = week.sessions.find((sess) => sess.id === sessionId)
      if (!session) return s
      Object.assign(session, updates)
      if (updates.status === 'done') session.completedAt = new Date().toISOString()
      return next
    })
  }, [])

  const setSessionStatus = useCallback((sessionId, status) => {
    updateSession(activeCycle, activeWeek, sessionId, { status })
  }, [activeCycle, activeWeek, updateSession])

  // ─── Generate next cycle ──────────────────────────────────────────────────
  const generateCycle = useCallback(() => {
    setState((s) => {
      const lastCycle = s.cycles[s.cycles.length - 1]
      if (!lastCycle) return s
      const newCycle = generateNextCycle(lastCycle, s.cycles, s.settings.vmaKmh)
      return {
        ...s,
        cycles: [...s.cycles, newCycle],
        activeCycle: newCycle.id,
        activeWeek: 1,
      }
    })
  }, [])

  // ─── Settings + recalc paces ──────────────────────────────────────────────
  const updateSettings = useCallback((updates) => {
    setState((s) => {
      const newSettings = { ...s.settings, ...updates }
      // Si la VMA change → recalculer toutes les allures
      if (updates.vmaInput !== undefined) {
        const parsed = parseVmaInput(updates.vmaInput)
        newSettings.vmaKmh = parsed
        if (parsed) {
          return {
            ...s,
            settings: newSettings,
            cycles: recalcAllPaces(s.cycles, parsed),
          }
        }
      }
      return { ...s, settings: newSettings }
    })
  }, [])

  // Recalc manuel (bouton "Appliquer")
  const applyVmaToCycles = useCallback(() => {
    setState((s) => {
      if (!s.settings.vmaKmh) return s
      return { ...s, cycles: recalcAllPaces(s.cycles, s.settings.vmaKmh) }
    })
  }, [])

  // ─── Pace table depuis la VMA courante ────────────────────────────────────
  const paceTable = settings.vmaKmh ? getAllPaceTable(settings.vmaKmh) : null
  const estimatedChrono = settings.vmaKmh ? estimateChronoFromVma(settings.vmaKmh) : null

  // ─── Reset ────────────────────────────────────────────────────────────────
  const resetData = useCallback(() => {
    setState(buildInitialState())
  }, [])

  // ─── Export / Import ──────────────────────────────────────────────────────
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `runpace-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  const importData = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result)
        if (imported.cycles) setState(imported)
      } catch { /* ignore */ }
    }
    reader.readAsText(file)
  }, [])

  // ─── Stats ────────────────────────────────────────────────────────────────
  const getProgressStats = useCallback(() => {
    const stats = cycles.map((cycle) => ({
      cycleId: cycle.id,
      cycleName: cycle.name,
      weeks: cycle.weeks.map((week) => {
        const total = week.sessions.length
        const done = week.sessions.filter((s) => s.status === 'done').length
        const minutes = week.sessions
          .filter((s) => s.status === 'done')
          .reduce((acc, s) => acc + (s.estimatedDuration || 0), 0)
        return { weekNum: week.number, total, done, minutes, completion: total ? Math.round((done / total) * 100) : 0 }
      }),
    }))
    const allSessions = cycles.flatMap((c) => c.weeks.flatMap((w) => w.sessions))
    const totalDone = allSessions.filter((s) => s.status === 'done').length
    const totalMinutes = allSessions
      .filter((s) => s.status === 'done')
      .reduce((acc, s) => acc + (s.estimatedDuration || 0), 0)
    return { stats, totalDone, totalMinutes }
  }, [cycles])

  return {
    cycles, activeCycle, activeWeek, settings,
    currentCycle, currentWeek, currentSessions,
    paceTable, estimatedChrono,
    setActiveCycle, setActiveWeek,
    updateSession, setSessionStatus,
    generateCycle, updateSettings, applyVmaToCycles,
    resetData, exportData, importData, getProgressStats,
  }
}
