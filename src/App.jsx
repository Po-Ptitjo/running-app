import { useState } from 'react'
import { useTraining } from './hooks/useTraining'
import BottomNav from './components/BottomNav'
import ProgramView from './views/ProgramView'
import TodayView from './views/TodayView'
import ProgressView from './views/ProgressView'
import SettingsView from './views/SettingsView'

export default function App() {
  const [activeTab, setActiveTab] = useState('program')

  const {
    cycles, activeCycle, activeWeek, settings,
    currentCycle, currentWeek, currentSessions,
    paceTable, estimatedChrono,
    setActiveCycle, setActiveWeek,
    updateSession, setSessionStatus,
    generateCycle, updateSettings, applyVmaToCycles,
    resetData, exportData, importData, getProgressStats,
  } = useTraining()

  const commonProps = {
    cycles, activeCycle, activeWeek, settings,
    currentCycle, currentWeek, currentSessions,
    onCycleChange: setActiveCycle,
    onWeekChange: setActiveWeek,
    onStatusChange: setSessionStatus,
    onUpdateSession: updateSession,
    onGenerateCycle: generateCycle,
  }

  return (
    <div className="flex flex-col h-full bg-grid" style={{ background: '#07090F' }}>
      {/* App header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4"
        style={{
          paddingTop: `max(12px, env(safe-area-inset-top))`,
          paddingBottom: '8px',
          background: 'rgba(7,9,15,0.97)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00D68F, #4D9FFF)' }}>
            <span style={{ fontSize: '14px' }}>🏃</span>
          </div>
          <span className="font-display text-xl tracking-wide text-text-primary">RunPace</span>
        </div>

        <div className="flex items-center gap-2">
          {/* VMA badge */}
          {settings.vmaKmh && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: 'rgba(255,102,53,0.12)', border: '1px solid rgba(255,102,53,0.25)' }}>
              <span className="font-body text-[10px] font-semibold" style={{ color: '#FF6635' }}>
                VMA {settings.vmaKmh.toFixed(1)}
              </span>
            </div>
          )}
          {/* Cycle badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,214,143,0.1)', border: '1px solid rgba(0,214,143,0.2)' }}>
            <span className="font-body text-xs font-medium" style={{ color: '#00D68F' }}>
              {currentCycle?.name}
            </span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(0,214,143,0.5)' }} />
            <span className="font-body text-xs" style={{ color: '#00D68F88' }}>
              S{activeWeek}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide" style={{ paddingBottom: '80px' }}>
        {activeTab === 'program' && <ProgramView {...commonProps} />}
        {activeTab === 'today'   && <TodayView   {...commonProps} />}
        {activeTab === 'progress' && (
          <ProgressView getProgressStats={getProgressStats} cycles={cycles} />
        )}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            paceTable={paceTable}
            estimatedChrono={estimatedChrono}
            onUpdate={updateSettings}
            onApplyVma={applyVmaToCycles}
            onReset={resetData}
            onExport={exportData}
            onImport={importData}
            cycles={cycles}
          />
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
