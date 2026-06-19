import { useRef, useState, useEffect } from 'react'
import { useI18n } from '../contexts/I18nContext'

interface Props {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

export function SignaturePad({ onSave, onCancel }: Props) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = '#1E1B4B'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasDrawn(true)
  }

  function endDraw() {
    setIsDrawing(false)
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = '#1E1B4B'
    setHasDrawn(false)
  }

  function save() {
    if (!canvasRef.current || !hasDrawn) return
    onSave(canvasRef.current.toDataURL('image/png'))
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border-2 th-border">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none"
          style={{ height: '140px' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div className="absolute bottom-2 left-3 right-3 border-b border-dashed border-gray-300 pointer-events-none" />
        <div className="absolute bottom-1 left-3 text-[10px] text-gray-400 pointer-events-none">Signature</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={!hasDrawn}
          className="flex-1 px-4 py-2.5 rounded-xl bg-fanni-violet hover:bg-fanni-violet/80 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('validate')}
        </button>
        <button
          onClick={clear}
          className="px-4 py-2.5 rounded-xl border th-border th-muted text-sm font-semibold hover:border-fanni-violet transition-colors"
        >
          {t('clear')}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border th-border th-muted text-sm hover:border-priority-haute hover:text-priority-haute transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
