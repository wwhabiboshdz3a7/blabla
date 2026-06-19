import { useState, useEffect } from 'react'
import { seedDatabase } from './data/seed'
import type { User } from './types'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Interventions } from './pages/Interventions'
import { InterventionDetail } from './pages/InterventionDetail'
import { Planning } from './pages/Planning'
import { Profile } from './pages/Profile'
import { BottomNav } from './components/BottomNav'

type Page = 'dashboard' | 'interventions' | 'planning' | 'profile'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedDatabase().then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fanni-violet border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  if (selectedIntervention) {
    return (
      <>
        <InterventionDetail id={selectedIntervention} user={user} onBack={() => setSelectedIntervention(null)} />
        <BottomNav current={page} onChange={(p) => { setSelectedIntervention(null); setPage(p) }} />
      </>
    )
  }

  return (
    <>
      {page === 'dashboard' && <Dashboard user={user} />}
      {page === 'interventions' && <Interventions user={user} onSelect={setSelectedIntervention} />}
      {page === 'planning' && <Planning user={user} onSelect={setSelectedIntervention} />}
      {page === 'profile' && <Profile user={user} onLogout={() => setUser(null)} />}
      <BottomNav current={page} onChange={setPage} />
    </>
  )
}
