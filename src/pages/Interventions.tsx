import { useState } from 'react'
import { useInterventions, useTechnicians, useClients } from '../data/hooks'
import { useI18n } from '../contexts/I18nContext'
import type { User, InterventionStatus, Priority } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { PriorityBadge } from '../components/PriorityBadge'

export function Interventions({ user, onSelect }: { user: User; onSelect: (id: string) => void }) {
  const { t } = useI18n()
  const interventions = useInterventions()
  const technicians = useTechnicians()
  const clients = useClients()
  const isManager = user.role === 'manager'

  const [filterStatus, setFilterStatus] = useState<InterventionStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')

  const myTech = technicians.find((tt) => tt.userId === user.id)
  let filtered = isManager
    ? interventions
    : interventions.filter((i) => myTech && i.technicianId === myTech.id)

  if (filterStatus !== 'all') filtered = filtered.filter((i) => i.status === filterStatus)
  if (filterPriority !== 'all') filtered = filtered.filter((i) => i.priority === filterPriority)
  filtered.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const statusFilters: { value: InterventionStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('all') },
    { value: 'a_faire', label: t('todo') },
    { value: 'en_cours', label: t('in_progress') },
    { value: 'fait', label: t('done') },
  ]

  const priorityFilters: { value: Priority | 'all'; label: string }[] = [
    { value: 'all', label: t('priority') },
    { value: 'basse', label: t('low') },
    { value: 'moyenne', label: t('medium') },
    { value: 'haute', label: t('high') },
  ]

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">{isManager ? t('all_interventions') : t('my_interventions')}</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusFilters.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === s.value
                ? 'bg-fanni-violet text-white'
                : 'border'
            }`}
            style={filterStatus !== s.value ? { backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted)' } : undefined}
          >
            {s.label}
          </button>
        ))}
        <span className="border-l mx-1" style={{ borderColor: 'var(--border)' }} />
        {priorityFilters.map((p) => (
          <button
            key={p.value}
            onClick={() => setFilterPriority(p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filterPriority === p.value
                ? 'bg-fanni-violet text-white'
                : 'border'
            }`}
            style={filterPriority !== p.value ? { backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted)' } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>{t('no_intervention')}</div>
        )}
        {filtered.map((intervention, idx) => {
          const tech = technicians.find((tt) => tt.id === intervention.technicianId)
          const client = clients.find((c) => c.id === intervention.clientId)
          const date = new Date(intervention.scheduledAt)
          return (
            <button
              key={intervention.id}
              onClick={() => onSelect(intervention.id)}
              className="w-full text-left rounded-xl border p-4 space-y-2 transition-all animate-fade-in hover:border-fanni-violet/50"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-tight flex-1">{intervention.title}</h3>
                <PriorityBadge priority={intervention.priority} />
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
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
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                  {isManager && tech && (
                    <>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-fanni-violet to-fanni-indigo flex items-center justify-center text-[10px] font-bold text-white">
                        {tech.name[0]}
                      </div>
                      <span>{tech.name.split(' ')[0]}</span>
                    </>
                  )}
                  {client && <span style={{ opacity: 0.5 }}>· {client.name}</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
