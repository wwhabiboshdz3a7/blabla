import { useState } from 'react'
import { useInterventions, useTechnicians, useClients } from '../data/hooks'
import type { User, InterventionStatus, Priority } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { PriorityBadge } from '../components/PriorityBadge'

export function Interventions({ user, onSelect }: { user: User; onSelect: (id: string) => void }) {
  const interventions = useInterventions()
  const technicians = useTechnicians()
  const clients = useClients()
  const isManager = user.role === 'manager'

  const [filterStatus, setFilterStatus] = useState<InterventionStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')

  const myTech = technicians.find((t) => t.userId === user.id)
  let filtered = isManager
    ? interventions
    : interventions.filter((i) => myTech && i.technicianId === myTech.id)

  if (filterStatus !== 'all') filtered = filtered.filter((i) => i.status === filterStatus)
  if (filterPriority !== 'all') filtered = filtered.filter((i) => i.priority === filterPriority)

  filtered.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{isManager ? 'Toutes les interventions' : 'Mes interventions'}</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(['all', 'a_faire', 'en_cours', 'fait'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === s
                ? 'bg-fanni-violet text-white'
                : 'bg-fanni-card text-fanni-muted border border-fanni-border hover:border-fanni-violet/50'
            }`}
          >
            {s === 'all' ? 'Tous' : s === 'a_faire' ? 'A faire' : s === 'en_cours' ? 'En cours' : 'Fait'}
          </button>
        ))}
        <span className="border-l border-fanni-border mx-1" />
        {(['all', 'basse', 'moyenne', 'haute'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterPriority === p
                ? 'bg-fanni-violet text-white'
                : 'bg-fanni-card text-fanni-muted border border-fanni-border hover:border-fanni-violet/50'
            }`}
          >
            {p === 'all' ? 'Priorité' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-fanni-muted">Aucune intervention trouvée</div>
        )}
        {filtered.map((intervention, idx) => {
          const tech = technicians.find((t) => t.id === intervention.technicianId)
          const client = clients.find((c) => c.id === intervention.clientId)
          const date = new Date(intervention.scheduledAt)
          return (
            <button
              key={intervention.id}
              onClick={() => onSelect(intervention.id)}
              className="w-full text-left bg-fanni-card rounded-xl border border-fanni-border hover:border-fanni-violet/50 p-4 space-y-2 transition-all animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-tight flex-1">{intervention.title}</h3>
                <PriorityBadge priority={intervention.priority} />
              </div>
              <div className="flex items-center gap-3 text-xs text-fanni-muted">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {intervention.location.split(',')[0]}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge status={intervention.status} />
                <div className="flex items-center gap-1.5 text-xs text-fanni-muted">
                  {isManager && tech && (
                    <>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-fanni-violet to-fanni-indigo flex items-center justify-center text-[10px] font-bold text-white">
                        {tech.name[0]}
                      </div>
                      <span>{tech.name.split(' ')[0]}</span>
                    </>
                  )}
                  {client && <span className="text-fanni-muted/50">· {client.name}</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
