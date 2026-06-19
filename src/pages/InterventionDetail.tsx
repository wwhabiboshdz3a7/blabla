import { useState } from 'react'
import { useIntervention, useClient, useTechnician, useTechnicians, updateIntervention } from '../data/hooks'
import { useI18n } from '../contexts/I18nContext'
import type { User, InterventionStatus } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { PriorityBadge } from '../components/PriorityBadge'
import { PhotoCapture } from '../components/PhotoCapture'
import { SignaturePad } from '../components/SignaturePad'

export function InterventionDetail({ id, user, onBack }: { id: string; user: User; onBack: () => void }) {
  const { t } = useI18n()
  const intervention = useIntervention(id)
  const client = useClient(intervention?.clientId)
  const tech = useTechnician(intervention?.technicianId)
  const technicians = useTechnicians()
  const isManager = user.role === 'manager'
  const [report, setReport] = useState('')
  const [showSig, setShowSig] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  if (!intervention) return <div className="p-6 text-center" style={{ color: 'var(--muted)' }}>...</div>

  const date = new Date(intervention.scheduledAt)

  const checklist = [
    { label: t('photos_taken'), done: intervention.photosBefore.length > 0 },
    { label: t('intervention_done'), done: intervention.status === 'fait' || intervention.status === 'en_cours' },
    { label: t('photos_after_taken'), done: intervention.photosAfter.length > 0 },
    { label: t('report_written'), done: !!intervention.report },
    { label: t('client_signature'), done: !!intervention.signature },
  ]

  async function handleStatusChange(status: InterventionStatus) {
    await updateIntervention(id, { status })
  }

  async function handleDispatch(techId: string) {
    await updateIntervention(id, { technicianId: techId })
  }

  async function handleSaveReport() {
    if (report.trim()) await updateIntervention(id, { report: report.trim() })
  }

  async function handlePhoto(type: 'before' | 'after', dataUrl: string) {
    if (type === 'before') {
      await updateIntervention(id, { photosBefore: [...(intervention?.photosBefore ?? []), dataUrl] })
    } else {
      await updateIntervention(id, { photosAfter: [...(intervention?.photosAfter ?? []), dataUrl] })
    }
  }

  async function handleSignature(dataUrl: string) {
    await updateIntervention(id, { signature: dataUrl })
    setShowSig(false)
  }

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4">
      {viewingPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingPhoto(null)}>
          <img src={viewingPhoto} alt="" className="max-w-full max-h-full rounded-xl" />
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">✕</button>
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-1 text-sm transition-colors hover:text-fanni-violet" style={{ color: 'var(--muted)' }}>
        <svg className="w-5 h-5 rtl-flip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
        {t('back')}
      </button>

      <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold leading-tight">{intervention.title}</h1>
          <PriorityBadge priority={intervention.priority} />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={intervention.status} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {!isManager && intervention.status !== 'fait' && (
          <div className="flex gap-2 pt-1">
            {intervention.status === 'a_faire' && (
              <button onClick={() => handleStatusChange('en_cours')} className="px-4 py-2 rounded-lg bg-fanni-indigo hover:bg-fanni-indigo/80 text-white text-sm font-semibold transition-colors">
                {t('start')}
              </button>
            )}
            {intervention.status === 'en_cours' && (
              <button onClick={() => handleStatusChange('fait')} className="px-4 py-2 rounded-lg bg-priority-basse hover:bg-priority-basse/80 text-white text-sm font-semibold transition-colors">
                {t('finish')}
              </button>
            )}
          </div>
        )}

        {isManager && (
          <div className="pt-1">
            <label className="text-xs block mb-1" style={{ color: 'var(--muted)' }}>{t('assign_to')}</label>
            <select
              value={intervention.technicianId}
              onChange={(e) => handleDispatch(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {technicians.map((tt) => (
                <option key={tt.id} value={tt.id}>{tt.name} — {tt.zone}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {client && (
        <Card title={t('client')}>
          <div className="text-sm font-medium">{client.name}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>{client.address}</div>
          <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1 text-xs text-fanni-violet">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            {client.phone}
          </a>
        </Card>
      )}

      <Card title={t('location')}>
        <div className="text-sm">{intervention.location}</div>
        <div className="h-32 rounded-lg border flex items-center justify-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--muted)' }}><path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
      </Card>

      <Card title={t('checklist')}>
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-priority-basse' : 'border'}`} style={!item.done ? { borderColor: 'var(--border)' } : undefined}>
              {item.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
            <span style={{ color: item.done ? 'var(--text)' : 'var(--muted)' }}>{item.label}</span>
          </div>
        ))}
      </Card>

      <Card title={t('photos_before')}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {intervention.photosBefore.map((p, i) => (
            <img key={i} src={p} alt="" onClick={() => setViewingPhoto(p)} className="w-28 h-20 rounded-lg object-cover flex-shrink-0 border cursor-pointer hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--border)' }} />
          ))}
          {!isManager && <PhotoCapture onCapture={(d) => handlePhoto('before', d)} />}
        </div>
      </Card>

      <Card title={t('photos_after')}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {intervention.photosAfter.map((p, i) => (
            <img key={i} src={p} alt="" onClick={() => setViewingPhoto(p)} className="w-28 h-20 rounded-lg object-cover flex-shrink-0 border cursor-pointer hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--border)' }} />
          ))}
          {!isManager && <PhotoCapture onCapture={(d) => handlePhoto('after', d)} />}
        </div>
      </Card>

      <Card title={t('report')}>
        {intervention.report ? (
          <p className="text-sm">{intervention.report}</p>
        ) : !isManager ? (
          <div className="space-y-2">
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder={t('describe_intervention')}
              className="w-full border rounded-lg px-3 py-2 text-sm placeholder:opacity-50 resize-none h-24"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <button onClick={handleSaveReport} className="px-4 py-2 rounded-lg bg-fanni-violet hover:bg-fanni-violet/80 text-white text-sm font-semibold transition-colors">
              {t('save')}
            </button>
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--muted)' }}>{t('no_report')}</p>
        )}
      </Card>

      <Card title={t('signature')}>
        {intervention.signature ? (
          <img src={intervention.signature} alt="Signature" className="h-20 bg-white rounded-lg p-2" />
        ) : !isManager ? (
          showSig ? (
            <SignaturePad onSave={handleSignature} onCancel={() => setShowSig(false)} />
          ) : (
            <button onClick={() => setShowSig(true)} className="px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:border-fanni-violet hover:text-fanni-violet" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              {t('collect_signature')}
            </button>
          )
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--muted)' }}>{t('pending')}</p>
        )}
      </Card>

      {tech && (
        <Card title={t('assigned_tech')}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fanni-violet to-fanni-indigo flex items-center justify-center text-xs font-bold text-white">{tech.name[0]}</div>
            <div>
              <div className="text-sm font-medium">{tech.name}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{tech.zone}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
