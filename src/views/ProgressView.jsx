import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Clock, Zap, Award } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="px-3 py-2 rounded-xl" style={{ background: '#141B24', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="font-body text-xs" style={{ color: '#7A8BA3' }}>{label}</p>
        <p className="font-display text-lg" style={{ color: '#00D68F' }}>{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

const MinutesTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const mins = payload[0].value
    return (
      <div className="px-3 py-2 rounded-xl" style={{ background: '#141B24', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="font-body text-xs" style={{ color: '#7A8BA3' }}>{label}</p>
        <p className="font-display text-lg" style={{ color: '#4D9FFF' }}>{Math.floor(mins / 60)}h{String(mins % 60).padStart(2, '0')}</p>
      </div>
    )
  }
  return null
}

export default function ProgressView({ getProgressStats, cycles }) {
  const { stats, totalDone, totalMinutes } = useMemo(() => getProgressStats(), [getProgressStats])

  const completionData = useMemo(() => {
    return stats.flatMap((cycle) =>
      cycle.weeks.map((week) => ({
        name: `${cycle.cycleName.replace('Cycle ', 'C')}S${week.weekNum}`,
        completion: week.completion,
        minutes: week.minutes,
        done: week.done,
        total: week.total,
      }))
    )
  }, [stats])

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div className="px-4 py-6 space-y-6 pb-8">
      <div className="animate-fade-in">
        <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: '#3D4F63' }}>Tableau de bord</p>
        <h1 className="font-display text-4xl text-text-primary" style={{ letterSpacing: '-0.02em' }}>Progression</h1>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up">
        {[
          { label: 'Séances réalisées', value: totalDone, icon: <Zap size={18} />, color: '#FF6635', unit: '' },
          { label: 'Temps total', value: `${hours}h${String(mins).padStart(2, '0')}`, icon: <Clock size={18} />, color: '#4D9FFF', unit: '' },
          { label: 'Cycles actifs', value: cycles.length, icon: <TrendingUp size={18} />, color: '#A78BFA', unit: '' },
          { label: 'Complétion moy.', value: completionData.length ? Math.round(completionData.reduce((a, b) => a + b.completion, 0) / completionData.length) : 0, icon: <Award size={18} />, color: '#00D68F', unit: '%' },
        ].map(({ label, value, icon, color, unit }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: color }}>
              {icon}
              <span className="font-body text-[10px] uppercase tracking-wider">{label}</span>
            </div>
            <p className="font-display text-3xl" style={{ color, letterSpacing: '-0.02em' }}>
              {value}{unit}
            </p>
          </div>
        ))}
      </div>

      {/* Completion chart */}
      {completionData.length > 0 && (
        <div className="rounded-2xl p-4 animate-slide-up" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '80ms' }}>
          <p className="font-body text-xs uppercase tracking-widest mb-4" style={{ color: '#3D4F63' }}>
            Taux de complétion par semaine
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={completionData} barSize={16} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#3D4F63', fontSize: 9, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#3D4F63', fontSize: 9, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="completion" radius={[4, 4, 0, 0]}>
                {completionData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.completion === 100 ? '#00D68F' : entry.completion > 50 ? '#4D9FFF' : '#3D4F63'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Minutes chart */}
      {completionData.some((d) => d.minutes > 0) && (
        <div className="rounded-2xl p-4 animate-slide-up" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '140ms' }}>
          <p className="font-body text-xs uppercase tracking-widest mb-4" style={{ color: '#3D4F63' }}>
            Volume d'entraînement (minutes)
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={completionData} barSize={16} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#3D4F63', fontSize: 9, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#3D4F63', fontSize: 9, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
              <Tooltip content={<MinutesTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]} fill="#4D9FFF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-cycle breakdown */}
      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#3D4F63' }}>
          Détail par cycle
        </p>
        {stats.map((cycle) => {
          const cycleInfo = cycles.find((c) => c.id === cycle.cycleId)
          const cycleDone = cycle.weeks.reduce((a, w) => a + w.done, 0)
          const cycleTotal = cycle.weeks.reduce((a, w) => a + w.total, 0)
          const cycleCompletion = cycleTotal ? Math.round((cycleDone / cycleTotal) * 100) : 0

          return (
            <div key={cycle.cycleId} className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cycleInfo?.color}22` }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-display text-xl" style={{ color: cycleInfo?.color || '#EDF2F7' }}>
                    {cycle.cycleName}
                  </p>
                  <p className="font-body text-xs" style={{ color: '#3D4F63' }}>{cycleInfo?.phase}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl" style={{ color: cycleInfo?.color }}>
                    {cycleCompletion}%
                  </p>
                  <p className="font-body text-[10px]" style={{ color: '#3D4F63' }}>
                    {cycleDone}/{cycleTotal}
                  </p>
                </div>
              </div>
              {/* Week pills */}
              <div className="flex gap-2">
                {cycle.weeks.map((week) => (
                  <div key={week.weekNum} className="flex-1 rounded-lg p-2 text-center"
                    style={{ background: week.completion === 100 ? `${cycleInfo?.color}22` : 'rgba(255,255,255,0.03)' }}>
                    <p className="font-body text-[9px] uppercase tracking-wide mb-1" style={{ color: '#3D4F63' }}>
                      S{week.weekNum}
                    </p>
                    <p className="font-display text-base" style={{ color: week.completion === 100 ? cycleInfo?.color : '#7A8BA3' }}>
                      {week.completion}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
