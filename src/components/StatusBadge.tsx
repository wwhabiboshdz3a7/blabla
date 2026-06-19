import type { InterventionStatus } from '../types'
import { useI18n } from '../contexts/I18nContext'

const config: Record<InterventionStatus, { key: 'todo' | 'in_progress' | 'done'; bg: string; text: string }> = {
  a_faire: { key: 'todo', bg: 'bg-status-a_faire/20', text: 'text-status-a_faire' },
  en_cours: { key: 'in_progress', bg: 'bg-status-en_cours/20', text: 'text-status-en_cours' },
  fait: { key: 'done', bg: 'bg-priority-basse/20', text: 'text-priority-basse' },
}

export function StatusBadge({ status }: { status: InterventionStatus }) {
  const { t } = useI18n()
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <StatusIcon status={status} />
      {t(c.key)}
    </span>
  )
}

function StatusIcon({ status }: { status: InterventionStatus }) {
  if (status === 'a_faire')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  if (status === 'en_cours')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 12a4 4 0 1 1-4-4" />
        <polyline points="16 8 16 12" />
      </svg>
    )
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" />
      <polyline points="9 12 11.5 14.5 16 9.5" />
    </svg>
  )
}
