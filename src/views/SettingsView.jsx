import { useState } from 'react'
import { Save, RotateCcw, Download, Upload, ChevronRight, Info } from 'lucide-react'
import { PACES } from '../data/trainingData'
import { estimateChronoFrom10kmPace } from '../utils/progression'

export default function SettingsView({ settings, onUpdate, onReset, onExport, onImport, cycles }) {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ ...settings })
  const [showReset, setShowReset] = useState(false)

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSave = () => {
    onUpdate(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => onImport(e.target.files[0])
    input.click()
  }

  const estimatedChrono = estimateChronoFrom10kmPace(form.pace10km)

  return (
    <div className="px-4 py-6 space-y-6 pb-8">
      <div className="animate-fade-in">
        <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: '#3D4F63' }}>Configuration</p>
        <h1 className="font-display text-4xl text-text-primary" style={{ letterSpacing: '-0.02em' }}>Réglages</h1>
      </div>

      {/* Performance settings */}
      <div className="rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#3D4F63' }}>Paramètres sportifs</p>
        </div>

        {[
          { field: 'pace10km', label: 'Allure 10 km', placeholder: "3'58–4'02", hint: "min/km" },
          { field: 'paceSemi', label: 'Allure Semi', placeholder: "4'15–4'20", hint: "min/km" },
          { field: 'vma', label: 'VMA', placeholder: "3'20–3'30", hint: "min/km" },
          { field: 'objective', label: 'Objectif chrono', placeholder: "Sub 40'", hint: '10 km' },
        ].map(({ field, label, placeholder, hint }, i) => (
          <div key={field} className="px-4 py-3 flex items-center gap-3"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div className="flex-1">
              <p className="font-body text-sm font-medium text-text-primary">{label}</p>
              <p className="font-body text-xs" style={{ color: '#3D4F63' }}>{hint}</p>
            </div>
            <input
              type="text"
              value={form[field] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={placeholder}
              className="w-28 text-right px-3 py-2 rounded-xl font-body text-sm text-text-primary outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        ))}

        {estimatedChrono && (
          <div className="mx-4 mb-4 mt-1 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(0,214,143,0.08)', border: '1px solid rgba(0,214,143,0.2)' }}>
            <Info size={14} style={{ color: '#00D68F' }} />
            <p className="font-body text-xs" style={{ color: '#00D68F' }}>
              Objectif estimé : <strong>{estimatedChrono}</strong> sur 10 km
            </p>
          </div>
        )}

        <div className="px-4 pb-4">
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl font-body text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
            style={{ background: saved ? 'rgba(0,214,143,0.2)' : 'rgba(0,214,143,0.1)', color: '#00D68F', border: '1px solid rgba(0,214,143,0.3)' }}>
            <Save size={15} />
            {saved ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Reference paces */}
      <div className="rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '80ms' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#3D4F63' }}>Allures de référence</p>
        </div>
        {Object.entries(PACES).map(([key, { label, range }], i) => (
          <div key={key} className="px-4 py-3 flex items-center justify-between"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <p className="font-body text-sm text-text-primary">{label}</p>
            <p className="font-body text-sm font-semibold" style={{ color: '#00D68F' }}>{range}</p>
          </div>
        ))}
      </div>

      {/* Data management */}
      <div className="rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', animationDelay: '120ms' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#3D4F63' }}>Données</p>
        </div>

        {[
          {
            label: 'Exporter les données',
            sub: `${cycles.length} cycle(s) • JSON`,
            icon: <Download size={16} />,
            color: '#4D9FFF',
            action: onExport,
          },
          {
            label: 'Importer des données',
            sub: 'Restaurer depuis un fichier',
            icon: <Upload size={16} />,
            color: '#A78BFA',
            action: handleImport,
          },
        ].map(({ label, sub, icon, color, action }, i) => (
          <button key={label} onClick={action}
            className="w-full px-4 py-3 flex items-center gap-3 active:bg-white/5 transition-colors"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
              <span style={{ color }}>{icon}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-body text-sm font-medium text-text-primary">{label}</p>
              <p className="font-body text-xs" style={{ color: '#3D4F63' }}>{sub}</p>
            </div>
            <ChevronRight size={16} style={{ color: '#3D4F63' }} />
          </button>
        ))}
      </div>

      {/* Reset */}
      <div className="animate-slide-up" style={{ animationDelay: '160ms' }}>
        {!showReset ? (
          <button onClick={() => setShowReset(true)}
            className="w-full py-3 rounded-xl font-body text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,68,68,0.08)', color: '#FF4444AA', border: '1px solid rgba(255,68,68,0.15)' }}>
            <RotateCcw size={14} />
            Réinitialiser toutes les données
          </button>
        ) : (
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.25)' }}>
            <p className="font-body text-sm text-center" style={{ color: '#FF6666' }}>
              Êtes-vous sûr ? Toute progression sera perdue.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)}
                className="flex-1 py-2.5 rounded-lg font-body text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#7A8BA3' }}>
                Annuler
              </button>
              <button onClick={() => { onReset(); setShowReset(false) }}
                className="flex-1 py-2.5 rounded-lg font-body text-sm font-semibold"
                style={{ background: '#FF4444', color: 'white' }}>
                Confirmer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* App info */}
      <div className="text-center pb-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <p className="font-display text-lg" style={{ color: '#1A2333' }}>RunPace v1.0</p>
        <p className="font-body text-xs" style={{ color: '#1A2333' }}>Programme 10 km — Stockage local uniquement</p>
      </div>
    </div>
  )
}
