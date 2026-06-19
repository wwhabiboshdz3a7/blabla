import type { User } from '../types'
import { resetDatabase } from '../data/seed'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n, type Lang } from '../contexts/I18nContext'

export function Profile({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { theme, toggle } = useTheme()
  const { t, lang, setLang } = useI18n()

  async function handleReset() {
    if (confirm(t('reset_confirm'))) {
      await resetDatabase()
      onLogout()
    }
  }

  const languages: { code: Lang; label: string }[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
  ]

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t('profile')}</h1>

      <div className="rounded-xl border p-6 flex flex-col items-center gap-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-fanni-violet/30" />
        <div className="text-center">
          <div className="text-lg font-bold">{user.name}</div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>{user.role === 'manager' ? t('manager') : t('technician')}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{t('zone')} : {user.zone}</div>
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>{t('theme')}</h2>
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-fanni-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-priority-moyenne" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            )}
            <span className="text-sm font-medium">{theme === 'dark' ? t('dark') : t('light')}</span>
          </div>
          <div className={`w-12 h-7 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-fanni-violet' : 'bg-priority-moyenne'}`}>
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${theme === 'dark' ? '' : 'translate-x-5'}`} />
          </div>
        </button>
      </div>

      <div className="rounded-xl border p-4 space-y-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>{t('language')}</h2>
        <div className="flex gap-2">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                lang === l.code ? 'bg-fanni-violet text-white' : 'border'
              }`}
              style={lang !== l.code ? { borderColor: 'var(--border)', color: 'var(--muted)' } : undefined}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Actions</h2>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors"
          style={{ color: 'var(--text)' }}
        >
          <svg className="w-5 h-5" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <div className="text-left">
            <div className="text-sm font-medium">{t('switch_account')}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{t('switch_desc')}</div>
          </div>
        </button>

        <button
          onClick={handleReset}
          className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-priority-haute/10"
        >
          <svg className="w-5 h-5 text-priority-haute" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div className="text-left">
            <div className="text-sm font-medium text-priority-haute">{t('reset_data')}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{t('reset_desc')}</div>
          </div>
        </button>
      </div>

      <div className="text-center text-xs pt-4" style={{ color: 'var(--muted)', opacity: 0.5 }}>
        FANNI Pro v1.0 · 100% hors-ligne · PWA
      </div>
    </div>
  )
}
