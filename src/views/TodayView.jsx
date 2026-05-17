import { useState } from 'react'
import { Calendar, Flame, ChevronRight } from 'lucide-react'
import SessionCard from '../components/SessionCard'
import SessionEditor from '../components/SessionEditor'
import { SESSION_TYPES } from '../data/trainingData'

const DAY_MAP = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 0: 'Dimanche' }
const REST_DAYS = ['Mercredi', 'Vendredi', 'Dimanche']

export default function TodayView({ cycles, activeCycle, activeWeek, currentCycle, currentWeek, onStatusChange, onUpdateSession, onCycleChange, onWeekChange }) {
  const [editingSession, setEditingSession] = useState(null)

  const todayDayIndex = new Date().getDay()
  const todayDayName = DAY_MAP[todayDayIndex]
  const isRestDay = REST_DAYS.includes(todayDayName)

  const todaySession = currentWeek?.sessions.find((s) => s.day === todayDayName)

  const nextSession = currentWeek?.sessions.find((s) => {
    if (s.status === 'pending' || s.status === 'moved') return true
    return false
  })

  const totalDone = cycles.flatMap((c) => c.weeks.flatMap((w) => w.sessions)).filter((s) => s.status === 'done').length

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="px-4 py-6 space-y-5 pb-8">
      {/* Header */}
      <div className="animate-fade-in">
        <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: '#3D4F63' }}>
          {dateStr}
        </p>
        <h1 className="font-display text-4xl text-text-primary leading-tight" style={{ letterSpacing: '-0.02em' }}>
          Aujourd'hui
        </h1>
      </div>

      {/* Streak / stats pill */}
      <div className="flex gap-3 animate-slide-up">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,102,53,0.12)', border: '1px solid rgba(255,102,53,0.25)' }}>
          <Flame size={20} style={{ color: '#FF6635' }} />
          <div>
            <p className="font-display text-2xl leading-tight" style={{ color: '#FF6635' }}>{totalDone}</p>
            <p className="font-body text-[10px] uppercase tracking-wider" style={{ color: '#FF663588' }}>
              Séances totales
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(0,214,143,0.10)', border: '1px solid rgba(0,214,143,0.22)' }}>
          <Calendar size={20} style={{ color: '#00D68F' }} />
          <div>
            <p className="font-display text-2xl leading-tight" style={{ color: '#00D68F' }}>
              {currentCycle?.name || 'C1'}
            </p>
            <p className="font-body text-[10px] uppercase tracking-wider" style={{ color: '#00D68F88' }}>
              {currentWeek?.label || 'S1'}
            </p>
          </div>
        </div>
      </div>

      {/* Today's session */}
      <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
        <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: '#3D4F63' }}>
          Séance du jour
        </p>

        {isRestDay ? (
          <div className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-4xl">🛌</span>
            <h2 className="font-display text-2xl text-text-primary">Jour de repos</h2>
            <p className="font-body text-sm" style={{ color: '#3D4F63' }}>
              Récupération, étirements, nutrition.
            </p>
          </div>
        ) : todaySession ? (
          <SessionCard
            session={todaySession}
            cycleColor={currentCycle?.color}
            onStatusChange={onStatusChange}
            onEdit={setEditingSession}
          />
        ) : (
          <div className="rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-3xl">🎯</span>
            <p className="font-body text-sm" style={{ color: '#3D4F63' }}>
              Pas de séance prévue ce {todayDayName.toLowerCase()}.<br />
              Profitez ou ajoutez une sortie libre.
            </p>
          </div>
        )}
      </div>

      {/* Next pending session */}
      {nextSession && nextSession.id !== todaySession?.id && (
        <div className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: '#3D4F63' }}>
            Prochaine séance
          </p>
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: SESSION_TYPES[nextSession.type]?.bg }}>
              <span style={{ color: SESSION_TYPES[nextSession.type]?.color, fontSize: '16px' }}>
                {nextSession.type === 'vma' ? '⚡' : nextSession.type === 'sl' ? '🏃' : nextSession.type === 'seuil' ? '🔥' : '🎯'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-body text-xs mb-0.5" style={{ color: SESSION_TYPES[nextSession.type]?.color }}>
                {nextSession.day}
              </p>
              <p className="font-body text-sm font-semibold text-text-primary">{nextSession.title}</p>
              <p className="font-body text-xs" style={{ color: '#7A8BA3' }}>{nextSession.content}</p>
            </div>
            <ChevronRight size={16} style={{ color: '#3D4F63' }} />
          </div>
        </div>
      )}

      {editingSession && (
        <SessionEditor
          session={editingSession}
          cycleId={activeCycle}
          weekNum={activeWeek}
          onSave={onUpdateSession}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  )
}
