import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { SESSION_TYPES } from '../data/trainingData'

export default function SessionEditor({ session, cycleId, weekNum, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    pace: '',
    recovery: '',
    objective: '',
    notes: '',
    estimatedDuration: '',
    type: 'vma',
  })

  useEffect(() => {
    if (session) {
      setForm({
        title: session.title || '',
        content: session.content || '',
        pace: session.pace || '',
        recovery: session.recovery || '',
        objective: session.objective || '',
        notes: session.notes || '',
        estimatedDuration: session.estimatedDuration || '',
        type: session.type || 'vma',
      })
    }
  }, [session])

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSave = () => {
    onSave(cycleId, weekNum, session.id, {
      ...form,
      estimatedDuration: parseInt(form.estimatedDuration) || session.estimatedDuration,
    })
    onClose()
  }

  if (!session) return null

  const typeInfo = SESSION_TYPES[form.type] || SESSION_TYPES.ef

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="w-full max-w-lg rounded-t-3xl overflow-hidden animate-slide-up"
        style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div>
            <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#3D4F63' }}>
              {session.day}
            </p>
            <h2 className="font-display text-2xl text-text-primary" style={{ letterSpacing: '-0.01em' }}>
              Modifier la séance
            </h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X size={18} style={{ color: '#7A8BA3' }} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          {/* Type selector */}
          <div>
            <label className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: '#3D4F63' }}>
              Type de séance
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SESSION_TYPES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => handleChange('type', key)}
                  className="px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all"
                  style={{
                    background: form.type === key ? val.bg : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${form.type === key ? val.border : 'rgba(255,255,255,0.06)'}`,
                    color: form.type === key ? val.color : '#7A8BA3',
                  }}>
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {[
            { field: 'title', label: 'Titre', placeholder: 'Ex: VMA courte' },
            { field: 'content', label: 'Contenu', placeholder: 'Ex: 10 × 2 min' },
            { field: 'pace', label: 'Allure cible', placeholder: "Ex: 3'30–3'40/km" },
            { field: 'recovery', label: 'Récupération', placeholder: 'Ex: 1 min trot' },
            { field: 'objective', label: 'Objectif', placeholder: 'Rester fluide, ne pas forcer' },
            { field: 'estimatedDuration', label: 'Durée estimée (min)', placeholder: '45', type: 'number' },
          ].map(({ field, label, placeholder, type }) => (
            <div key={field}>
              <label className="font-body text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#3D4F63' }}>
                {label}
              </label>
              <input
                type={type || 'text'}
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl font-body text-sm text-text-primary outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => (e.target.style.border = `1px solid ${typeInfo.color}55`)}
                onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.08)')}
              />
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="font-body text-xs uppercase tracking-wider mb-1.5 block" style={{ color: '#3D4F63' }}>
              Notes personnelles
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Ressenti, conditions météo, commentaires..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl font-body text-sm text-text-primary outline-none resize-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>

        {/* Save button */}
        <div className="p-4 border-t border-border-subtle" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-98"
            style={{ background: 'linear-gradient(135deg, #00D68F, #00A36B)', color: '#07090F' }}>
            <Save size={18} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
