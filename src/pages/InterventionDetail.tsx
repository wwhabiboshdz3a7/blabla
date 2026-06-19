import { useState, useRef } from 'react'
import { useIntervention, useClient, useTechnician, useTechnicians, updateIntervention } from '../data/hooks'
import type { User, InterventionStatus } from '../types'
import { StatusBadge } from '../components/StatusBadge'
import { PriorityBadge } from '../components/PriorityBadge'

export function InterventionDetail({ id, user, onBack }: { id: string; user: User; onBack: () => void }) {
  const intervention = useIntervention(id)
  const client = useClient(intervention?.clientId)
  const tech = useTechnician(intervention?.technicianId)
  const technicians = useTechnicians()
  const isManager = user.role === 'manager'
  const [report, setReport] = useState('')
  const [showSig, setShowSig] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  if (!intervention) return <div className="p-6 text-center text-fanni-muted">Chargement...</div>

  const date = new Date(intervention.scheduledAt)

  const checklist = [
    { label: 'Photos avant prises', done: intervention.photosBefore.length > 0 },
    { label: 'Intervention réalisée', done: intervention.status === 'fait' || intervention.status === 'en_cours' },
    { label: 'Photos après prises', done: intervention.photosAfter.length > 0 },
    { label: 'Rapport rédigé', done: !!intervention.report },
    { label: 'Signature client', done: !!intervention.signature },
  ]

  async function handleStatusChange(status: InterventionStatus) {
    await updateIntervention(id, { status })
  }

  async function handleDispatch(techId: string) {
    await updateIntervention(id, { technicianId: techId })
  }

  async function handleSaveReport() {
    if (report.trim()) {
      await updateIntervention(id, { report: report.trim() })
    }
  }

  async function handlePhotoUpload(type: 'before' | 'after') {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        if (type === 'before') {
          await updateIntervention(id, { photosBefore: [...(intervention?.photosBefore ?? []), dataUrl] })
        } else {
          await updateIntervention(id, { photosAfter: [...(intervention?.photosAfter ?? []), dataUrl] })
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.strokeStyle = '#7C3AED'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  async function saveSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL()
    await updateIntervention(id, { signature: dataUrl })
    setShowSig(false)
  }

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-fanni-muted hover:text-fanni-violet text-sm transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
        Retour
      </button>

      <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold leading-tight">{intervention.title}</h1>
          <PriorityBadge priority={intervention.priority} />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={intervention.status} />
          <span className="text-xs text-fanni-muted">
            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {!isManager && intervention.status !== 'fait' && (
          <div className="flex gap-2 pt-1">
            {intervention.status === 'a_faire' && (
              <button onClick={() => handleStatusChange('en_cours')} className="px-4 py-2 rounded-lg bg-fanni-indigo hover:bg-fanni-indigo/80 text-white text-sm font-semibold transition-colors">
                Commencer
              </button>
            )}
            {intervention.status === 'en_cours' && (
              <button onClick={() => handleStatusChange('fait')} className="px-4 py-2 rounded-lg bg-priority-basse hover:bg-priority-basse/80 text-white text-sm font-semibold transition-colors">
                Terminer
              </button>
            )}
          </div>
        )}

        {isManager && (
          <div className="pt-1">
            <label className="text-xs text-fanni-muted block mb-1">Assigner à</label>
            <select
              value={intervention.technicianId}
              onChange={(e) => handleDispatch(e.target.value)}
              className="w-full bg-fanni-surface border border-fanni-border rounded-lg px-3 py-2 text-sm text-fanni-text"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name} — {t.zone}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {client && (
        <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-2">
          <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider">Client</h2>
          <div className="text-sm font-medium">{client.name}</div>
          <div className="text-xs text-fanni-muted">{client.address}</div>
          <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1 text-xs text-fanni-violet">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            {client.phone}
          </a>
        </div>
      )}

      <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-2">
        <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider">Localisation</h2>
        <div className="text-sm">{intervention.location}</div>
        <div className="h-32 rounded-lg bg-fanni-surface border border-fanni-border flex items-center justify-center text-fanni-muted text-xs">
          <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
      </div>

      <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-3">
        <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider">Checklist</h2>
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-priority-basse' : 'border border-fanni-border'}`}>
              {item.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
            <span className={item.done ? 'text-fanni-text' : 'text-fanni-muted'}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-3">
        <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider">Photos Avant</h2>
        <div className="flex gap-2 overflow-x-auto">
          {intervention.photosBefore.map((p, i) => (
            <img key={i} src={p} alt={`Avant ${i + 1}`} className="w-28 h-20 rounded-lg object-cover flex-shrink-0 border border-fanni-border" />
          ))}
          {!isManager && (
            <button onClick={() => handlePhotoUpload('before')} className="w-28 h-20 rounded-lg border-2 border-dashed border-fanni-border flex items-center justify-center text-fanni-muted hover:border-fanni-violet hover:text-fanni-violet transition-colors flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          )}
        </div>

        <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider pt-2">Photos Après</h2>
        <div className="flex gap-2 overflow-x-auto">
          {intervention.photosAfter.map((p, i) => (
            <img key={i} src={p} alt={`Après ${i + 1}`} className="w-28 h-20 rounded-lg object-cover flex-shrink-0 border border-fanni-border" />
          ))}
          {!isManager && (
            <button onClick={() => handlePhotoUpload('after')} className="w-28 h-20 rounded-lg border-2 border-dashed border-fanni-border flex items-center justify-center text-fanni-muted hover:border-fanni-violet hover:text-fanni-violet transition-colors flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-3">
        <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider">Rapport</h2>
        {intervention.report ? (
          <p className="text-sm text-fanni-text">{intervention.report}</p>
        ) : !isManager ? (
          <div className="space-y-2">
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Décrire l'intervention..."
              className="w-full bg-fanni-surface border border-fanni-border rounded-lg px-3 py-2 text-sm text-fanni-text placeholder:text-fanni-muted/50 resize-none h-24"
            />
            <button onClick={handleSaveReport} className="px-4 py-2 rounded-lg bg-fanni-violet hover:bg-fanni-violet/80 text-white text-sm font-semibold transition-colors">
              Enregistrer
            </button>
          </div>
        ) : (
          <p className="text-sm text-fanni-muted italic">Aucun rapport</p>
        )}
      </div>

      <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-3">
        <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider">Signature</h2>
        {intervention.signature ? (
          <img src={intervention.signature} alt="Signature" className="h-16 bg-white rounded-lg p-1" />
        ) : !isManager ? (
          showSig ? (
            <div className="space-y-2">
              <canvas
                ref={canvasRef}
                width={300}
                height={100}
                className="w-full bg-white rounded-lg border border-fanni-border cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={() => setIsDrawing(false)}
              />
              <button onClick={saveSignature} className="px-4 py-2 rounded-lg bg-fanni-violet text-white text-sm font-semibold">
                Valider
              </button>
            </div>
          ) : (
            <button onClick={() => setShowSig(true)} className="px-4 py-2 rounded-lg border border-fanni-border text-fanni-muted hover:border-fanni-violet hover:text-fanni-violet text-sm transition-colors">
              Recueillir la signature
            </button>
          )
        ) : (
          <p className="text-sm text-fanni-muted italic">En attente</p>
        )}
      </div>

      {tech && (
        <div className="bg-fanni-card rounded-xl border border-fanni-border p-4 space-y-1">
          <h2 className="text-xs font-semibold text-fanni-muted uppercase tracking-wider">Technicien assigné</h2>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fanni-violet to-fanni-indigo flex items-center justify-center text-xs font-bold">{tech.name[0]}</div>
            <div>
              <div className="text-sm font-medium">{tech.name}</div>
              <div className="text-xs text-fanni-muted">{tech.zone}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
