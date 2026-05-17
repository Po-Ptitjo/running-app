import { useState } from 'react'
import { Download, CheckCircle, AlertCircle, FileCode } from 'lucide-react'
import { downloadFitFile, getWeekDayDate, IS_INTERVAL_SESSION, parseIntervalContent } from '../utils/fitGenerator'

/**
 * Bouton d'export .FIT pour les séances de fractionné (lundi/jeudi)
 * Génère un fichier .FIT binaire compatible Garmin, Wahoo, Polar, Suunto
 */
export default function FitExportButton({ session, compact = false }) {
  const [status, setStatus] = useState('idle') // idle | success | error
  const [showScript, setShowScript] = useState(false)

  // N'afficher que pour les séances de fractionné lundi/jeudi
  if (!IS_INTERVAL_SESSION(session)) return null
  if (session.day !== 'Lundi' && session.day !== 'Jeudi') return null

  const parsed = parseIntervalContent(session.content)
  if (!parsed) return null

  const workoutDate = getWeekDayDate(session.day)
  const dateLabel = workoutDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleDownload = () => {
    try {
      downloadFitFile(session, workoutDate)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      console.error('FIT generation error:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const pythonCommand = buildPythonCommand(session, parsed, workoutDate)

  if (compact) {
    return (
      <button
        onClick={handleDownload}
        title={`Exporter en .FIT — ${dateLabel}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-body text-xs font-medium transition-all active:scale-95"
        style={{
          background: status === 'success'
            ? 'rgba(0,214,143,0.15)'
            : status === 'error'
              ? 'rgba(255,68,68,0.1)'
              : 'rgba(77,159,255,0.12)',
          color: status === 'success' ? '#00D68F' : status === 'error' ? '#FF4444' : '#4D9FFF',
          border: `1px solid ${status === 'success' ? 'rgba(0,214,143,0.3)' : status === 'error' ? 'rgba(255,68,68,0.25)' : 'rgba(77,159,255,0.25)'}`,
        }}>
        {status === 'success'
          ? <><CheckCircle size={11} /> .FIT exporté</>
          : status === 'error'
            ? <><AlertCircle size={11} /> Erreur</>
            : <><Download size={11} /> .FIT</>}
      </button>
    )
  }

  return (
    <div className="mt-3 animate-fade-in">
      {/* Séparateur */}
      <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.05)' }} />

      <p className="font-body text-[10px] uppercase tracking-widest mb-2" style={{ color: '#3D4F63' }}>
        Export montre / GPS
      </p>

      {/* Info de la séance parsée */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(77,159,255,0.07)', border: '1px solid rgba(77,159,255,0.15)' }}>
        <div className="text-xs" style={{ color: '#4D9FFF' }}>📅</div>
        <div>
          <p className="font-body text-xs font-semibold" style={{ color: '#4D9FFF' }}>
            {dateLabel}
          </p>
          <p className="font-body text-[10px]" style={{ color: '#3D4F63' }}>
            {parsed.reps} × {parsed.workSeconds >= 60
              ? `${Math.floor(parsed.workSeconds / 60)}min${parsed.workSeconds % 60 ? (parsed.workSeconds % 60) + 's' : ''}`
              : `${parsed.workSeconds}s`} · récup {session.recovery || '60s'}
          </p>
        </div>
      </div>

      {/* Bouton principal */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold transition-all duration-200 active:scale-95"
        style={{
          background: status === 'success'
            ? 'rgba(0,214,143,0.15)'
            : status === 'error'
              ? 'rgba(255,68,68,0.1)'
              : 'linear-gradient(135deg, rgba(77,159,255,0.2), rgba(77,159,255,0.12))',
          color: status === 'success' ? '#00D68F' : status === 'error' ? '#FF4444' : '#4D9FFF',
          border: `1.5px solid ${status === 'success' ? 'rgba(0,214,143,0.4)' : status === 'error' ? 'rgba(255,68,68,0.35)' : 'rgba(77,159,255,0.35)'}`,
        }}>
        {status === 'success' ? (
          <><CheckCircle size={15} /> Fichier .FIT téléchargé !</>
        ) : status === 'error' ? (
          <><AlertCircle size={15} /> Impossible de générer le fichier</>
        ) : (
          <><Download size={15} /> Télécharger .FIT (Garmin / Wahoo)</>
        )}
      </button>

      {/* Lien script Python */}
      <div className="mt-2">
        <button
          onClick={() => setShowScript(v => !v)}
          className="flex items-center gap-1.5 font-body text-[10px] transition-colors"
          style={{ color: showScript ? '#4D9FFF' : '#3D4F63' }}>
          <FileCode size={10} />
          {showScript ? 'Masquer' : 'Générer localement via Python'}
        </button>

        {showScript && (
          <div className="mt-2 rounded-xl overflow-hidden animate-fade-in"
            style={{ border: '1px solid rgba(77,159,255,0.15)' }}>
            <div className="flex items-center justify-between px-3 py-1.5"
              style={{ background: 'rgba(77,159,255,0.08)' }}>
              <span className="font-body text-[10px] font-semibold" style={{ color: '#4D9FFF' }}>
                Terminal / Script Python
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(pythonCommand)}
                className="font-body text-[9px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(77,159,255,0.2)', color: '#4D9FFF' }}>
                Copier
              </button>
            </div>
            <pre className="px-3 py-2 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap"
              style={{ color: '#7A8BA3', background: 'rgba(0,0,0,0.3)', lineHeight: 1.6 }}>
              {pythonCommand}
            </pre>
            <div className="px-3 py-2 font-body text-[9px]" style={{ color: '#3D4F63', background: 'rgba(0,0,0,0.15)' }}>
              Téléchargez generate_fit.py depuis les paramètres · Aucune dépendance requise
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function buildPythonCommand(session, parsed, workoutDate) {
  const dateStr = workoutDate.toISOString().split('T')[0]
  const day = session.day === 'Lundi' ? 'lundi' : 'jeudi'

  // Extraire l'allure sans la plage
  const paceMatch = session.pace?.match(/(\d+)'(\d+)/)
  const pace = paceMatch ? `${paceMatch[1]}'${paceMatch[2]}` : "3'35"

  // Récupération en secondes
  const recoveryMatch = session.recovery?.match(/(\d+)'?(\d+)?/)
  let recSec = 60
  if (recoveryMatch) {
    recSec = recoveryMatch[2]
      ? parseInt(recoveryMatch[1]) * 60 + parseInt(recoveryMatch[2])
      : parseInt(recoveryMatch[1]) * 60
  }

  return [
    `# Télécharger generate_fit.py depuis RunPace > Paramètres`,
    `python generate_fit.py \\`,
    `  --title "${session.title}" \\`,
    `  --reps ${parsed.reps} \\`,
    `  --work ${parsed.workSeconds} \\`,
    `  --recovery ${recSec} \\`,
    `  --pace "${pace}" \\`,
    `  --day ${day} \\`,
    `  --date ${dateStr}`,
  ].join('\n')
}
