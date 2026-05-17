import { useState } from 'react'
import { Clock, Target, Zap, RefreshCw, ChevronDown, ChevronUp, Edit3 } from 'lucide-react'
import { SESSION_TYPES, STATUS_CONFIG } from '../data/trainingData'
import FitExportButton from './FitExportButton'

const STATUS_CYCLE = ['pending', 'done', 'missed', 'moved']

export default function SessionCard({ session, cycleColor, onStatusChange, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const typeInfo = SESSION_TYPES[session.type] || SESSION_TYPES.ef
  const statusInfo = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending

  const handleStatusToggle = (e) => {
    e.stopPropagation()
    const idx = STATUS_CYCLE.indexOf(session.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    onStatusChange(session.id, next)
  }

  const isDone = session.status === 'done'
  const isMissed = session.status === 'missed'

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up"
      style={{
        background: '#0D1117',
        border: `1px solid ${typeInfo.border}`,
        boxShadow: isDone ? `0 0 0 1px ${typeInfo.color}33, 0 4px 20px rgba(0,0,0,0.3)` : '0 4px 20px rgba(0,0,0,0.3)',
        opacity: isMissed ? 0.6 : 1,
      }}>
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-start gap-3 active:bg-white/5 transition-colors">
        {/* Left accent bar */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-0.5">
          <div className="w-1 h-8 rounded-full" style={{ background: typeInfo.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-body text-xs font-semibold tracking-widest uppercase"
              style={{ color: typeInfo.color }}>
              {session.day}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-body font-semibold tracking-wide uppercase"
              style={{ background: typeInfo.bg, color: typeInfo.color }}>
              {typeInfo.label}
            </span>
          </div>
          <h3 className="font-display text-xl text-text-primary leading-tight mb-1"
            style={{ letterSpacing: '-0.01em' }}>
            {session.title}
          </h3>
          <p className="font-body text-base font-semibold" style={{ color: '#EDF2F7' }}>
            {session.content}
          </p>
          <p className="font-body text-sm mt-1" style={{ color: typeInfo.color }}>
            {session.pace}
          </p>
        </div>

        {/* Right controls */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Status button */}
          <button
            onClick={handleStatusToggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all duration-200 active:scale-90"
            style={{
              background: isDone ? '#00D68F22' : isMissed ? '#FF444422' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${isDone ? '#00D68F55' : isMissed ? '#FF444455' : 'rgba(255,255,255,0.1)'}`,
            }}
            title="Changer le statut">
            <span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>
          </button>

          {/* Expand */}
          <div style={{ color: '#3D4F63' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 animate-fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="pt-3 grid grid-cols-2 gap-3">
            {session.recovery && (
              <div className="flex items-start gap-2">
                <RefreshCw size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#3D4F63' }} />
                <div>
                  <p className="font-body text-[10px] uppercase tracking-wider" style={{ color: '#3D4F63' }}>
                    Récupération
                  </p>
                  <p className="font-body text-sm font-medium text-text-primary">{session.recovery}</p>
                </div>
              </div>
            )}
            {session.estimatedDuration && (
              <div className="flex items-start gap-2">
                <Clock size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#3D4F63' }} />
                <div>
                  <p className="font-body text-[10px] uppercase tracking-wider" style={{ color: '#3D4F63' }}>
                    Durée estimée
                  </p>
                  <p className="font-body text-sm font-medium text-text-primary">
                    ~{session.estimatedDuration} min
                  </p>
                </div>
              </div>
            )}
            {session.objective && (
              <div className="col-span-2 flex items-start gap-2">
                <Target size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#3D4F63' }} />
                <div>
                  <p className="font-body text-[10px] uppercase tracking-wider" style={{ color: '#3D4F63' }}>
                    Objectif
                  </p>
                  <p className="font-body text-sm text-text-secondary">{session.objective}</p>
                </div>
              </div>
            )}
            {session.notes && (
              <div className="col-span-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="font-body text-xs text-text-secondary italic">{session.notes}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {STATUS_CYCLE.filter((s) => s !== session.status).map((s) => {
              const cfg = STATUS_CONFIG[s]
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(session.id, s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#7A8BA3', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              )
            })}
            <button
              onClick={() => onEdit(session)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-all active:scale-95"
              style={{ background: 'rgba(0,214,143,0.1)', color: '#00D68F', border: '1px solid rgba(0,214,143,0.2)' }}>
              <Edit3 size={12} />
              Modifier
            </button>
            <FitExportButton session={session} compact={true} />
          </div>

          {session.completedAt && (
            <p className="font-body text-[10px] mt-2" style={{ color: '#3D4F63' }}>
              Complété le {new Date(session.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
