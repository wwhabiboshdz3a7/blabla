import type { Priority } from '../types'
import { useI18n } from '../contexts/I18nContext'

const config: Record<Priority, { key: 'low' | 'medium' | 'high'; color: string; bg: string }> = {
  basse: { key: 'low', color: 'text-priority-basse', bg: 'bg-priority-basse/20' },
  moyenne: { key: 'medium', color: 'text-priority-moyenne', bg: 'bg-priority-moyenne/20' },
  haute: { key: 'high', color: 'text-priority-haute', bg: 'bg-priority-haute/20' },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useI18n()
  const c = config[priority]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.color}`}>
      <PriorityIcon priority={priority} />
      {t(c.key)}
    </span>
  )
}

function PriorityIcon({ priority }: { priority: Priority }) {
  if (priority === 'basse')
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="8 10 12 14 16 10" />
      </svg>
    )
  if (priority === 'moyenne')
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="16" y2="14" />
      </svg>
    )
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 14 12 8 16 14" />
      <line x1="12" y1="16" x2="12" y2="16.5" strokeWidth="3" />
    </svg>
  )
}
