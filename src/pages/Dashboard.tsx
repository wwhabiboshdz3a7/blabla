import { useState, useEffect } from 'react'
import { useInterventions, useTechnicians } from '../data/hooks'
import type { User, InterventionStatus } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import heroImg from '../assets/images/hero.jpg'

function AnimatedCounter({ target, delay = 0 }: { target: number; delay?: number }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0
      const step = Math.max(1, Math.ceil(target / 20))
      const interval = setInterval(() => {
        start += step
        if (start >= target) {
          setValue(target)
          clearInterval(interval)
        } else {
          setValue(start)
        }
      }, 40)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay])
  return <span className="animate-count-up">{value}</span>
}

export function Dashboard({ user }: { user: User }) {
  const interventions = useInterventions()
  const technicians = useTechnicians()
  const isManager = user.role === 'manager'

  const myInterventions = isManager
    ? interventions
    : interventions.filter((i) => {
        const tech = technicians.find((t) => t.userId === user.id)
        return tech && i.technicianId === tech.id
      })

  const today = new Date().toDateString()
  const todayInterventions = myInterventions.filter(
    (i) => new Date(i.scheduledAt).toDateString() === today
  )

  const counts: Record<InterventionStatus, number> = {
    a_faire: todayInterventions.filter((i) => i.status === 'a_faire').length,
    en_cours: todayInterventions.filter((i) => i.status === 'en_cours').length,
    fait: todayInterventions.filter((i) => i.status === 'fait').length,
  }

  const stats = [
    { label: 'A faire', value: counts.a_faire, color: 'from-fanni-muted to-fanni-muted', status: 'a_faire' as InterventionStatus },
    { label: 'En cours', value: counts.en_cours, color: 'from-fanni-violet to-fanni-indigo', status: 'en_cours' as InterventionStatus },
    { label: 'Terminées', value: counts.fait, color: 'from-priority-basse to-emerald-400', status: 'fait' as InterventionStatus },
  ]

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-6">
      <div className="relative rounded-2xl overflow-hidden h-40">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-fanni-bg/90 to-transparent" />
        <div className="relative p-5 flex flex-col justify-end h-full">
          <p className="text-fanni-muted text-sm">
            {isManager ? 'Vue Manager' : 'Mes interventions'}
          </p>
          <h1 className="text-2xl font-bold">
            Bonjour, <span className="bg-gradient-to-r from-fanni-violet to-fanni-indigo bg-clip-text text-transparent">{user.name}</span>
          </h1>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-fanni-muted uppercase tracking-wider mb-3">Aujourd'hui</h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <div key={s.status} className="bg-fanni-card rounded-xl p-4 border border-fanni-border text-center space-y-1">
              <div className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                <AnimatedCounter target={s.value} delay={i * 150} />
              </div>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-fanni-muted uppercase tracking-wider mb-3">
          Total : {myInterventions.length} intervention{myInterventions.length > 1 ? 's' : ''}
        </h2>
        <div className="bg-fanni-card rounded-xl border border-fanni-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 rounded-full bg-fanni-border overflow-hidden flex">
                {myInterventions.length > 0 && (
                  <>
                    <div
                      className="h-full bg-priority-basse transition-all"
                      style={{ width: `${(myInterventions.filter(i => i.status === 'fait').length / myInterventions.length) * 100}%` }}
                    />
                    <div
                      className="h-full bg-fanni-indigo transition-all"
                      style={{ width: `${(myInterventions.filter(i => i.status === 'en_cours').length / myInterventions.length) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
            <span className="text-xs text-fanni-muted whitespace-nowrap">
              {myInterventions.filter(i => i.status === 'fait').length}/{myInterventions.length}
            </span>
          </div>
        </div>
      </div>

      {isManager && (
        <div>
          <h2 className="text-sm font-semibold text-fanni-muted uppercase tracking-wider mb-3">Techniciens</h2>
          <div className="space-y-2">
            {technicians.map((t) => {
              const techInterventions = interventions.filter((i) => i.technicianId === t.id)
              const done = techInterventions.filter((i) => i.status === 'fait').length
              return (
                <div key={t.id} className="bg-fanni-card rounded-xl border border-fanni-border p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fanni-violet to-fanni-indigo flex items-center justify-center text-xs font-bold">
                    {t.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-xs text-fanni-muted">{t.zone}</div>
                  </div>
                  <div className="text-xs text-fanni-muted">{done}/{techInterventions.length}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
