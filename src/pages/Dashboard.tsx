import { useState, useEffect } from 'react'
import { useInterventions, useTechnicians } from '../data/hooks'
import { useI18n } from '../contexts/I18nContext'
import type { User, InterventionStatus } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { heroSvg } from '../assets/images'

function AnimatedCounter({ target, delay = 0 }: { target: number; delay?: number }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0
      const step = Math.max(1, Math.ceil(target / 20))
      const interval = setInterval(() => {
        start += step
        if (start >= target) { setValue(target); clearInterval(interval) }
        else setValue(start)
      }, 40)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay])
  return <span className="animate-count-up">{value}</span>
}

export function Dashboard({ user }: { user: User }) {
  const { t } = useI18n()
  const interventions = useInterventions()
  const technicians = useTechnicians()
  const isManager = user.role === 'manager'

  const myInterventions = isManager
    ? interventions
    : interventions.filter((i) => {
        const tech = technicians.find((tt) => tt.userId === user.id)
        return tech && i.technicianId === tech.id
      })

  const today = new Date().toDateString()
  const todayItems = myInterventions.filter((i) => new Date(i.scheduledAt).toDateString() === today)

  const counts: Record<InterventionStatus, number> = {
    a_faire: todayItems.filter((i) => i.status === 'a_faire').length,
    en_cours: todayItems.filter((i) => i.status === 'en_cours').length,
    fait: todayItems.filter((i) => i.status === 'fait').length,
  }

  const stats = [
    { value: counts.a_faire, color: 'from-status-a_faire to-status-a_faire', status: 'a_faire' as InterventionStatus },
    { value: counts.en_cours, color: 'from-fanni-violet to-fanni-indigo', status: 'en_cours' as InterventionStatus },
    { value: counts.fait, color: 'from-priority-basse to-emerald-400', status: 'fait' as InterventionStatus },
  ]

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-6">
      <div className="relative rounded-2xl overflow-hidden h-40">
        <img src={heroSvg()} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }} />
        <div className="relative p-5 flex flex-col justify-end h-full">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {isManager ? t('manager_view') : t('my_interventions')}
          </p>
          <h1 className="text-2xl font-bold">
            {t('hello')}, <span className="bg-gradient-to-r from-fanni-violet to-fanni-indigo bg-clip-text text-transparent">{user.name}</span>
          </h1>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>{t('today')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <div key={s.status} className="rounded-xl p-4 border text-center space-y-1" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                <AnimatedCounter target={s.value} delay={i * 150} />
              </div>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
          {t('total')} : {myInterventions.length} {t('intervention')}{myInterventions.length > 1 ? 's' : ''}
        </h2>
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--border)' }}>
              {myInterventions.length > 0 && (
                <>
                  <div className="h-full bg-priority-basse transition-all" style={{ width: `${(myInterventions.filter(i => i.status === 'fait').length / myInterventions.length) * 100}%` }} />
                  <div className="h-full bg-fanni-indigo transition-all" style={{ width: `${(myInterventions.filter(i => i.status === 'en_cours').length / myInterventions.length) * 100}%` }} />
                </>
              )}
            </div>
            <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>
              {myInterventions.filter(i => i.status === 'fait').length}/{myInterventions.length}
            </span>
          </div>
        </div>
      </div>

      {isManager && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>{t('technicians')}</h2>
          <div className="space-y-2">
            {technicians.map((tech) => {
              const techItems = interventions.filter((i) => i.technicianId === tech.id)
              const done = techItems.filter((i) => i.status === 'fait').length
              return (
                <div key={tech.id} className="rounded-xl border p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fanni-violet to-fanni-indigo flex items-center justify-center text-xs font-bold text-white">
                    {tech.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{tech.name}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{tech.zone}</div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{done}/{techItems.length}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
