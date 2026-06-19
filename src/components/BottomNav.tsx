import { useI18n } from '../contexts/I18nContext'

type Page = 'dashboard' | 'interventions' | 'planning' | 'profile'

const items: { page: Page; key: 'dashboard' | 'interventions' | 'planning' | 'profile'; icon: string }[] = [
  { page: 'dashboard', key: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { page: 'interventions', key: 'interventions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { page: 'planning', key: 'planning', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { page: 'profile', key: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
]

export function BottomNav({ current, onChange }: { current: Page; onChange: (p: Page) => void }) {
  const { t } = useI18n()

  return (
    <nav className="fixed bottom-0 left-0 right-0 th-surface/95 backdrop-blur border-t th-border z-50" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex justify-around max-w-lg mx-auto">
        {items.map(({ page, key, icon }) => (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs transition-colors ${
              current === page ? 'text-fanni-violet' : 'opacity-50 hover:opacity-75'
            }`}
            style={{ color: current === page ? '#7C3AED' : 'var(--muted)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={current === page ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
            <span className="font-medium">{t(key)}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
