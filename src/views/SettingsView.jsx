import { useState } from 'react'
import { Save, RotateCcw, Download, Upload, ChevronRight, Zap, RefreshCw, CheckCircle } from 'lucide-react'
import { PACES } from '../data/trainingData'

const TYPE_LABELS = {
  vma: 'VMA courte',
  specifique: 'Allure 10 km',
  seuil: 'Seuil',
  enduranceActive: 'Endurance active',
  ef: 'Endurance fondamentale',
  sl: 'Sortie longue',
}

const TYPE_COLORS = {
  vma: '#FF6635',
  specifique: '#00D68F',
  seuil: '#A78BFA',
  enduranceActive: '#4D9FFF',
  ef: '#4D9FFF',
  sl: '#F59E0B',
}

export default function SettingsView({ settings, onUpdate, onApplyVma, onReset, onExport, onImport, cycles, paceTable, estimatedChrono }) {
  const [applied, setApplied] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const handleVmaChange = (value) => {
    onUpdate({ vmaInput: value })
  }

  const handleApply = () => {
    onApplyVma()
    setApplied(true)
    setTimeout(() => setApplied(false), 2500)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => onImport(e.target.files[0])
    input.click()
  }

  const handleDownloadPythonScript = () => {
    const a = document.createElement('a')
    a.href = '/generate_fit.py'
    a.download = 'generate_fit.py'
    a.click()
  }

  const vmaIsValid = settings.vmaKmh && settings.vmaKmh > 0

  return (
    <div className="px-4 py-6 space-y-5 pb-8">
      <div className="animate-fade-in">
        <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: '#3D4F63' }}>Configuration</p>
        <h1 className="font-display text-4xl text-text-primary" style={{ letterSpacing: '-0.02em' }}>Réglages</h1>
      </div>

      {/* VMA input */}
      <div className="rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(255,102,53,0.06)', border: '1px solid rgba(255,102,53,0.25)' }}>
        <div className="px-4 pt-4 pb-3 flex items-center gap-2">
          <Zap size={16} style={{ color: '#FF6635' }} />
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#FF6635' }}>
            VMA — Vitesse Maximale Aérobie
          </p>
        </div>

        <div className="px-4 pb-2">
          <p className="font-body text-xs mb-3" style={{ color: '#7A8BA3' }}>
            Saisir en <strong style={{ color: '#EDF2F7' }}>km/h</strong> (ex: 17.5) 
            ou en <strong style={{ color: '#EDF2F7' }}>allure min/km</strong> (ex: 3'26)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.vmaInput || ''}
              onChange={(e) => handleVmaChange(e.target.value)}
              placeholder="Ex: 17.5 ou 3'26"
              className="flex-1 px-4 py-3 rounded-xl font-body text-base text-text-primary outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${vmaIsValid ? 'rgba(255,102,53,0.5)' : 'rgba(255,255,255,0.1)'}`,
              }}
            />
            {vmaIsValid && (
              <div className="flex items-center justify-center px-3 rounded-xl"
                style={{ background: 'rgba(255,102,53,0.15)', minWidth: '70px' }}>
                <span className="font-display text-lg" style={{ color: '#FF6635' }}>
                  {settings.vmaKmh?.toFixed(1)} km/h
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Estimated chrono */}
        {estimatedChrono && (
          <div className="mx-4 my-3 px-3 py-2.5 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(0,214,143,0.08)', border: '1px solid rgba(0,214,143,0.2)' }}>
            <p className="font-body text-sm" style={{ color: '#7A8BA3' }}>
              Objectif 10 km estimé
            </p>
            <p className="font-display text-2xl" style={{ color: '#00D68F' }}>
              {estimatedChrono}
            </p>
          </div>
        )}

        {/* Apply button */}
        {vmaIsValid && (
          <div className="px-4 pb-4">
            <button onClick={handleApply}
              className="w-full py-3 rounded-xl font-body text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
              style={{
                background: applied ? 'rgba(0,214,143,0.2)' : 'rgba(255,102,53,0.15)',
                color: applied ? '#00D68F' : '#FF6635',
                border: `1px solid ${applied ? 'rgba(0,214,143,0.3)' : 'rgba(255,102,53,0.3)'}`,
              }}>
              {applied ? <CheckCircle size={15} /> : <RefreshCw size={15} />}
              {applied ? 'Allures recalculées ✓' : 'Recalculer toutes les allures'}
            </button>
          </div>
        )}
      </div>

      {/* Calculated pace table */}
      {paceTable && (
        <div className="rounded-2xl overflow-hidden animate-slide-up"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-4 pt-4 pb-2">
            <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#3D4F63' }}>
              Allures calculées depuis ta VMA
            </p>
          </div>
          {Object.entries(paceTable).filter(([k]) => k !== 'chrono10km').map(([key, pace], i) => (
            <div key={key} className="px-4 py-3 flex items-center justify-between"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[key] || '#7A8BA3' }} />
                <p className="font-body text-sm text-text-primary">{TYPE_LABELS[key] || key}</p>
              </div>
              <p className="font-body text-sm font-semibold" style={{ color: TYPE_COLORS[key] || '#00D68F' }}>
                {pace}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Objective */}
      <div className="rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#3D4F63' }}>Objectif</p>
        </div>
        <div className="px-4 pb-4 flex items-center gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex-1">
            <p className="font-body text-sm font-medium text-text-primary">Chrono cible 10 km</p>
          </div>
          <input
            type="text"
            value={settings.objective || ''}
            onChange={(e) => onUpdate({ objective: e.target.value })}
            placeholder="Sub 40'"
            className="w-28 text-right px-3 py-2 rounded-xl font-body text-sm text-text-primary outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>

      {/* Data management */}
      <div className="rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: '#3D4F63' }}>Données</p>
        </div>
        {[
          { label: 'Exporter les données', sub: `${cycles.length} cycle(s) • JSON`, icon: <Download size={16} />, color: '#4D9FFF', action: onExport },
          { label: 'Importer des données', sub: 'Restaurer depuis un fichier', icon: <Upload size={16} />, color: '#A78BFA', action: handleImport },
          { label: 'Script Python .FIT', sub: 'Générer des séances localement · Aucune dépendance', icon: <span style={{fontSize:'14px'}}>🐍</span>, color: '#00D68F', action: handleDownloadPythonScript },
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
      <div className="animate-slide-up">
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

      <div className="text-center pb-4">
        <p className="font-display text-lg" style={{ color: '#1A2333' }}>RunPace v2.0</p>
        <p className="font-body text-xs" style={{ color: '#1A2333' }}>Allures dynamiques depuis la VMA</p>
      </div>
    </div>
  )
}
