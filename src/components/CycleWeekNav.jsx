import { ChevronRight, Plus } from 'lucide-react'

export default function CycleWeekNav({ cycles, activeCycle, activeWeek, onCycleChange, onWeekChange, onGenerateCycle, currentCycle }) {
  const weeks = currentCycle?.weeks || []

  return (
    <div className="sticky top-0 z-40" style={{ background: 'rgba(7,9,15,0.97)', backdropFilter: 'blur(24px)' }}>
      {/* Cycle nav */}
      <div className="border-b border-border-subtle">
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
          {cycles.map((cycle) => {
            const isActive = cycle.id === activeCycle
            return (
              <button
                key={cycle.id}
                onClick={() => onCycleChange(cycle.id)}
                className="flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
                style={{
                  background: isActive ? `${cycle.color}22` : 'transparent',
                  border: `1px solid ${isActive ? cycle.color + '55' : 'transparent'}`,
                }}>
                <span
                  className="font-display text-sm tracking-wide"
                  style={{ color: isActive ? cycle.color : '#3D4F63', fontSize: '15px' }}>
                  {cycle.name}
                </span>
                {cycle.phase && (
                  <span className="font-body text-[9px] tracking-widest uppercase"
                    style={{ color: isActive ? cycle.color + 'AA' : '#2A3A4A', letterSpacing: '0.1em' }}>
                    {cycle.phase}
                  </span>
                )}
              </button>
            )
          })}
          {/* Generate new cycle button */}
          <button
            onClick={onGenerateCycle}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
            style={{ border: '1px dashed rgba(255,255,255,0.15)', color: '#3D4F63' }}
            title="Générer le prochain cycle">
            <Plus size={14} />
            <span className="font-body text-xs">Nouveau</span>
          </button>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center px-3 py-1.5 gap-1 overflow-x-auto scrollbar-hide border-b border-border-subtle">
        {weeks.map((week) => {
          const isActive = week.number === activeWeek
          const isRecovery = week.type === 'recovery'
          const doneCount = week.sessions.filter((s) => s.status === 'done').length
          const total = week.sessions.length
          const allDone = doneCount === total && total > 0

          return (
            <button
              key={week.number}
              onClick={() => onWeekChange(week.number)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
              style={{
                background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(255,255,255,0.14)' : 'transparent'}`,
              }}>
              <div className="flex flex-col items-start">
                <span
                  className="font-body text-xs font-medium"
                  style={{ color: isActive ? '#EDF2F7' : '#3D4F63' }}>
                  {week.label}
                </span>
                {isRecovery && (
                  <span className="font-body text-[9px]" style={{ color: '#F59E0B88' }}>
                    Allégée
                  </span>
                )}
              </div>
              {/* Progress pills */}
              <div className="flex gap-0.5">
                {week.sessions.map((s) => (
                  <span
                    key={s.id}
                    className="block w-1.5 h-1.5 rounded-full"
                    style={{
                      background: s.status === 'done' ? '#00D68F'
                        : s.status === 'missed' ? '#FF4444'
                        : s.status === 'moved' ? '#F59E0B'
                        : 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
              {allDone && <span className="text-[10px]">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
