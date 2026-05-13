import { useState } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import CycleWeekNav from '../components/CycleWeekNav'
import SessionCard from '../components/SessionCard'
import SessionEditor from '../components/SessionEditor'
import { getWeekStats } from '../utils/progression'
import { STATUS_CONFIG } from '../data/trainingData'

export default function ProgramView({
  cycles, activeCycle, activeWeek, currentCycle, currentWeek, currentSessions,
  onCycleChange, onWeekChange, onStatusChange, onUpdateSession, onGenerateCycle,
}) {
  const [editingSession, setEditingSession] = useState(null)
  const stats = currentWeek ? getWeekStats(currentWeek.sessions) : null

  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <CycleWeekNav
        cycles={cycles}
        activeCycle={activeCycle}
        activeWeek={activeWeek}
        onCycleChange={onCycleChange}
        onWeekChange={onWeekChange}
        onGenerateCycle={onGenerateCycle}
        currentCycle={currentCycle}
      />

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-8">
        {/* Week header */}
        {currentWeek && (
          <div className="flex items-start justify-between animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="font-display text-3xl text-text-primary" style={{ letterSpacing: '-0.02em' }}>
                  {currentWeek.label}
                </h1>
                {currentWeek.type === 'recovery' && (
                  <span className="px-2 py-0.5 rounded-full font-body text-xs font-semibold"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                    ↓ Allégée
                  </span>
                )}
              </div>
              <p className="font-body text-sm" style={{ color: '#3D4F63' }}>
                {currentCycle?.name} — {currentCycle?.phase}
              </p>
            </div>

            {/* Mini stats */}
            {stats && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-center">
                  <p className="font-display text-xl leading-tight"
                    style={{ color: stats.done === stats.total ? '#00D68F' : '#EDF2F7' }}>
                    {stats.done}/{stats.total}
                  </p>
                  <p className="font-body text-[9px] uppercase tracking-wider" style={{ color: '#3D4F63' }}>
                    Séances
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Week progress bar */}
        {stats && stats.total > 0 && (
          <div className="rounded-xl p-3 flex items-center gap-3 animate-fade-in"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex gap-1.5">
              {currentWeek.sessions.map((s) => {
                const cfg = STATUS_CONFIG[s.status]
                return (
                  <span key={s.id} className="text-base" title={`${s.day} — ${cfg.label}`}>
                    {cfg.icon}
                  </span>
                )
              })}
            </div>
            <div className="flex-1">
              <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.completion}%`,
                    background: stats.completion === 100 ? '#00D68F' : 'linear-gradient(90deg, #00D68F, #4D9FFF)',
                  }}
                />
              </div>
            </div>
            <span className="font-display text-lg" style={{ color: stats.completion === 100 ? '#00D68F' : '#7A8BA3' }}>
              {stats.completion}%
            </span>
          </div>
        )}

        {/* Sessions */}
        {currentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <TrendingUp size={28} style={{ color: '#3D4F63' }} />
            </div>
            <p className="font-body text-sm text-center" style={{ color: '#3D4F63' }}>
              Aucune séance pour cette semaine.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSessions.map((session, i) => (
              <div key={session.id} style={{ animationDelay: `${i * 60}ms` }}>
                <SessionCard
                  session={session}
                  cycleColor={currentCycle?.color}
                  onStatusChange={onStatusChange}
                  onEdit={setEditingSession}
                />
              </div>
            ))}
          </div>
        )}

        {/* Generate cycle CTA */}
        {activeCycle === cycles[cycles.length - 1]?.id && currentWeek?.number === 4 && stats?.completion === 100 && (
          <button
            onClick={onGenerateCycle}
            className="w-full py-4 rounded-2xl font-display text-xl flex items-center justify-center gap-2 transition-all active:scale-98 animate-slide-up"
            style={{ background: 'linear-gradient(135deg, rgba(0,214,143,0.2), rgba(77,159,255,0.2))', border: '1px solid rgba(0,214,143,0.3)', color: '#00D68F' }}>
            <Plus size={20} />
            Créer le Cycle {activeCycle + 1}
          </button>
        )}
      </div>

      {/* Editor modal */}
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
