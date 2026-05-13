import { Activity, BarChart2, Calendar, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'program', label: 'Programme', Icon: Calendar },
  { id: 'today', label: "Aujourd'hui", Icon: Activity },
  { id: 'progress', label: 'Progression', Icon: BarChart2 },
  { id: 'settings', label: 'Réglages', Icon: Settings },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-border-subtle"
      style={{ background: 'rgba(9,12,20,0.95)', backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button key={id} onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 active:scale-95"
            style={{ color: isActive ? '#00D68F' : '#3D4F63' }}>
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8}
              style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(0,214,143,0.5))' : 'none' }} />
            <span className="font-body text-[10px] font-medium tracking-wide"
              style={{ color: isActive ? '#00D68F' : '#3D4F63' }}>
              {label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full"
                style={{ background: '#00D68F', bottom: 'calc(env(safe-area-inset-bottom) + 2px)' }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
