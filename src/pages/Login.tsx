import { useUsers } from '../data/hooks'
import { useI18n } from '../contexts/I18nContext'
import type { User } from '../types'
import { logoSvg } from '../assets/images'

export function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const users = useUsers()
  const { t } = useI18n()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(to bottom, var(--bg), var(--surface), var(--bg))' }}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <img src={logoSvg()} alt="FANNI Pro" className="w-24 h-24 mx-auto drop-shadow-lg" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-fanni-violet to-fanni-indigo bg-clip-text text-transparent">
            {t('login_title')}
          </h1>
          <p className="th-muted text-sm" style={{ color: 'var(--muted)' }}>{t('login_subtitle')}</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--muted)' }}>{t('login_as')}</p>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => onLogin(u)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-fanni-violet/50 transition-all group"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover ring-2 group-hover:ring-fanni-violet transition-all" style={{ '--tw-ring-color': 'var(--border)' } as React.CSSProperties} />
              <div className="text-left">
                <div className="font-semibold" style={{ color: 'var(--text)' }}>{u.name}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {u.role === 'manager' ? t('manager') : t('technician')} · {u.zone}
                </div>
              </div>
              <svg className="w-5 h-5 ml-auto group-hover:text-fanni-violet transition-colors rtl-flip" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
