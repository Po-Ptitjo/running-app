import { useState } from 'react'
import { Download, Calendar, Zap, Flame, ChevronDown, ChevronUp } from 'lucide-react'
import { downloadFitFile, getWeekDayDate, parseIntervalContent, IS_INTERVAL_SESSION } from '../utils/fitGenerator'

const SESSION_TYPE_ICON = {
  vma:       { icon: '⚡', color: '#FF6635', bg: 'rgba(255,102,53,0.12)', border: 'rgba(255,102,53,0.25)', label: 'VMA' },
  seuil:     { icon: '🔥', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', label: 'Seuil' },
  specifique:{ icon: '🎯', color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)', label: 'Spécif.' },
}

/**
 * Panel affiché dans TodayView pour créer rapidement les séances .FIT
 * du lundi et jeudi de la semaine courante
 */
export default function WeeklyFitPanel({ currentWeek, currentCycle }) {
  const [expanded, setExpanded] = useState(true)
  const [exported, setExported] = useState({})

  if (!currentWeek) return null

  // Trouver les séances lundi et jeudi de type fractionné
  const intervalSessions = currentWeek.sessions.filter(
    s => IS_INTERVAL_SESSION(s) && (s.day === 'Lundi' || s.day === 'Jeudi')
  )

  if (intervalSessions.length === 0) return null

  const handleExport = (session) => {
    const date = getWeekDayDate(session.day)
    try {
      downloadFitFile(session, date)
      setExported(prev => ({ ...prev, [session.id]: true }))
      setTimeout(() => setExported(prev => ({ ...prev, [session.id]: false })), 3000)
    } catch (err) {
      console.error('FIT export error:', err)
    }
  }

  const handleExportAll = () => {
    intervalSessions.forEach((s, i) => {
      setTimeout(() => handleExport(s), i * 400) // léger délai entre les téléchargements
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden animate-slide-up"
      style={{
        background: 'rgba(13,17,23,0.95)',
        border: '1px solid rgba(77,159,255,0.2)',
        boxShadow: '0 0 0 1px rgba(77,159,255,0.08), 0 4px 24px rgba(0,0,0,0.3)',
      }}>

      {/* Header cliquable */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(77,159,255,0.25), rgba(77,159,255,0.12))', border: '1px solid rgba(77,159,255,0.3)' }}>
          <Download size={14} style={{ color: '#4D9FFF' }} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-body text-sm font-semibold text-text-primary leading-tight">
            Séances GPS — Semaine {currentWeek.number}
          </p>
          <p className="font-body text-[10px]" style={{ color: '#3D4F63' }}>
            {intervalSessions.length} fractionné{intervalSessions.length > 1 ? 's' : ''} · Export .FIT Garmin / Wahoo
          </p>
        </div>
        <div style={{ color: '#3D4F63' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>

          {intervalSessions.map(session => {
            const typeInfo = SESSION_TYPE_ICON[session.type] || SESSION_TYPE_ICON.vma
            const parsed = parseIntervalContent(session.content)
            const date = getWeekDayDate(session.day)
            const dateLabel = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
            const isExported = exported[session.id]

            return (
              <div key={session.id}
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${typeInfo.border}`, background: typeInfo.bg }}>

                {/* Infos séance */}
                <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {typeInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-body text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: typeInfo.color }}>
                        {session.day}
                      </span>
                      <span className="font-body text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(0,0,0,0.3)', color: typeInfo.color }}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="font-body text-sm font-semibold text-text-primary truncate">{session.title}</p>
                    <p className="font-body text-xs" style={{ color: '#7A8BA3' }}>
                      {session.content}
                      {session.pace && <span style={{ color: typeInfo.color }}> · {session.pace}</span>}
                    </p>
                  </div>

                  {/* Date badge */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Calendar size={9} style={{ color: '#3D4F63' }} />
                      <span className="font-body text-[9px] font-medium" style={{ color: '#7A8BA3' }}>
                        {dateLabel}
                      </span>
                    </div>
                    {parsed && (
                      <p className="font-body text-[9px] mt-0.5 text-right" style={{ color: '#3D4F63' }}>
                        {parsed.reps} × {parsed.workSeconds}s
                      </p>
                    )}
                  </div>
                </div>

                {/* Bouton export */}
                <div className="px-3 pb-3">
                  <button
                    onClick={() => handleExport(session)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-body text-xs font-semibold transition-all duration-200 active:scale-95"
                    style={{
                      background: isExported
                        ? 'rgba(0,214,143,0.2)'
                        : 'rgba(0,0,0,0.35)',
                      color: isExported ? '#00D68F' : '#EDF2F7',
                      border: `1.5px solid ${isExported ? 'rgba(0,214,143,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                    {isExported ? (
                      <>✓ Téléchargé</>
                    ) : (
                      <><Download size={11} /> Créer .FIT pour {session.day}</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}

          {/* Bouton tout exporter */}
          {intervalSessions.length > 1 && (
            <button
              onClick={handleExportAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-body text-xs font-semibold transition-all active:scale-95"
              style={{
                background: 'rgba(77,159,255,0.15)',
                color: '#4D9FFF',
                border: '1.5px solid rgba(77,159,255,0.3)',
              }}>
              <Download size={12} />
              Tout télécharger — Lundi + Jeudi
            </button>
          )}

          {/* Note compatibilité */}
          <p className="font-body text-[9px] text-center" style={{ color: '#3D4F63' }}>
            Compatible Garmin Connect · Wahoo · Polar Flow · Suunto · TrainingPeaks
          </p>
        </div>
      )}
    </div>
  )
}
