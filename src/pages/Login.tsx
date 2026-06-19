import { useUsers } from '../data/hooks'
import type { User } from '../types'
import logoImg from '../assets/images/logo.png'

export function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const users = useUsers()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-fanni-bg via-fanni-surface to-fanni-bg">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <img src={logoImg} alt="FANNI Pro" className="w-24 h-24 mx-auto drop-shadow-lg" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-fanni-violet to-fanni-indigo bg-clip-text text-transparent">
            FANNI Pro
          </h1>
          <p className="text-fanni-muted text-sm">Gestion d'interventions terrain</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-fanni-muted uppercase tracking-wider font-semibold">Se connecter en tant que</p>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => onLogin(u)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-fanni-card hover:bg-fanni-card/80 border border-fanni-border hover:border-fanni-violet/50 transition-all group"
            >
              <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-fanni-border group-hover:ring-fanni-violet transition-all" />
              <div className="text-left">
                <div className="font-semibold text-fanni-text">{u.name}</div>
                <div className="text-xs text-fanni-muted capitalize">{u.role === 'manager' ? 'Manager' : 'Technicien'} · {u.zone}</div>
              </div>
              <svg className="w-5 h-5 ml-auto text-fanni-muted group-hover:text-fanni-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
