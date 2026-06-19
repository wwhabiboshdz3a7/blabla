import type { User } from '../types'
import { resetDatabase } from '../data/seed'

export function Profile({ user, onLogout }: { user: User; onLogout: () => void }) {
  async function handleReset() {
    if (confirm('Réinitialiser toutes les données ?')) {
      await resetDatabase()
      onLogout()
    }
  }

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Profil</h1>

      <div className="bg-fanni-card rounded-xl border border-fanni-border p-6 flex flex-col items-center gap-4">
        <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-fanni-violet/30" />
        <div className="text-center">
          <div className="text-lg font-bold">{user.name}</div>
          <div className="text-sm text-fanni-muted capitalize">{user.role === 'manager' ? 'Manager' : 'Technicien'}</div>
          <div className="text-xs text-fanni-muted mt-1">Zone : {user.zone}</div>
        </div>
      </div>

      <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-3">
        <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider">Actions</h2>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-fanni-surface transition-colors text-left"
        >
          <svg className="w-5 h-5 text-fanni-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <div>
            <div className="text-sm font-medium">Changer de compte</div>
            <div className="text-xs text-fanni-muted">Basculer vers un autre utilisateur</div>
          </div>
        </button>

        <button
          onClick={handleReset}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-priority-haute/10 transition-colors text-left group"
        >
          <svg className="w-5 h-5 text-priority-haute" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div>
            <div className="text-sm font-medium text-priority-haute">Réinitialiser les données</div>
            <div className="text-xs text-fanni-muted">Supprimer et recréer les données de démo</div>
          </div>
        </button>
      </div>

      <div className="text-center text-xs text-fanni-muted/50 pt-4">
        FANNI Pro v1.0 · 100% hors-ligne · PWA
      </div>
    </div>
  )
}
