import { useState } from 'react'
import { useInterventions, useTechnicians } from '../data/hooks'
import type { User } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { PriorityBadge } from '../components/PriorityBadge'

type View = 'jour' | 'semaine'

export function Planning({ user, onSelect }: { user: User; onSelect: (id: string) => void }) {
  const interventions = useInterventions()
  const technicians = useTechnicians()
  const isManager = user.role === 'manager'
  const [view, setView] = useState<View>('jour')
  const [currentDate, setCurrentDate] = useState(new Date())

  const myTech = technicians.find((t) => t.userId === user.id)
  const filtered = isManager
    ? interventions
    : interventions.filter((i) => myTech && i.technicianId === myTech.id)

  function getWeekDays(date: Date): Date[] {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  const weekDays = getWeekDays(currentDate)
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  function navigate(dir: number) {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + (view === 'jour' ? dir : dir * 7))
    setCurrentDate(d)
  }

  const dayInterventions = (date: Date) =>
    filtered.filter((i) => new Date(i.scheduledAt).toDateString() === date.toDateString())

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Planning</h1>
        <div className="flex bg-fanni-card rounded-lg border border-fanni-border overflow-hidden">
          {(['jour', 'semaine'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === v ? 'bg-fanni-violet text-white' : 'text-fanni-muted hover:text-fanni-text'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-fanni-card transition-colors">
          <svg className="w-5 h-5 text-fanni-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-semibold text-sm">
          {view === 'jour'
            ? currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
            : `${weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
          }
        </span>
        <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-fanni-card transition-colors">
          <svg className="w-5 h-5 text-fanni-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {view === 'semaine' && (
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === new Date().toDateString()
            const isSelected = d.toDateString() === currentDate.toDateString()
            const count = dayInterventions(d).length
            return (
              <button
                key={i}
                onClick={() => { setCurrentDate(d); setView('jour') }}
                className={`flex flex-col items-center py-2 rounded-lg text-xs transition-colors ${
                  isSelected ? 'bg-fanni-violet text-white' : isToday ? 'bg-fanni-card text-fanni-violet' : 'text-fanni-muted hover:bg-fanni-card'
                }`}
              >
                <span className="font-medium">{dayNames[i]}</span>
                <span className="text-lg font-bold">{d.getDate()}</span>
                {count > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-fanni-violet'}`} />
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="space-y-2">
        {view === 'jour' ? (
          dayInterventions(currentDate).length === 0 ? (
            <div className="text-center py-12 text-fanni-muted text-sm">Aucune intervention ce jour</div>
          ) : (
            dayInterventions(currentDate).map((intervention) => {
              const tech = technicians.find((t) => t.id === intervention.technicianId)
              const time = new Date(intervention.scheduledAt)
              return (
                <button
                  key={intervention.id}
                  onClick={() => onSelect(intervention.id)}
                  className="w-full text-left bg-fanni-card rounded-xl border border-fanni-border hover:border-fanni-violet/50 p-3 flex gap-3 transition-all"
                >
                  <div className="text-xs text-fanni-muted font-mono pt-0.5 w-12 flex-shrink-0">
                    {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{intervention.title}</div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={intervention.status} />
                      <PriorityBadge priority={intervention.priority} />
                    </div>
                    {isManager && tech && (
                      <div className="text-xs text-fanni-muted">{tech.name}</div>
                    )}
                  </div>
                </button>
              )
            })
          )
        ) : (
          weekDays.map((d, i) => {
            const items = dayInterventions(d)
            if (items.length === 0) return null
            return (
              <div key={i} className="space-y-1">
                <div className="text-xs font-semibold text-fanni-muted uppercase">{dayNames[i]} {d.getDate()}</div>
                {items.map((intervention) => (
                  <button
                    key={intervention.id}
                    onClick={() => onSelect(intervention.id)}
                    className="w-full text-left bg-fanni-card rounded-lg border border-fanni-border p-2.5 flex items-center gap-2 hover:border-fanni-violet/50 transition-all"
                  >
                    <StatusBadge status={intervention.status} />
                    <span className="text-sm truncate flex-1">{intervention.title}</span>
                    <PriorityBadge priority={intervention.priority} />
                  </button>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
