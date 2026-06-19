import { useState } from 'react'
import { useI18n } from '../contexts/I18nContext'

interface Props {
  onCapture: (dataUrl: string) => void
}

export function PhotoCapture({ onCapture }: Props) {
  const { t } = useI18n()
  const [showMenu, setShowMenu] = useState(false)

  function openInput(capture: boolean) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/webp'
    if (capture) input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => onCapture(reader.result as string)
      reader.readAsDataURL(file)
    }
    input.click()
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-28 h-20 rounded-lg border-2 border-dashed th-border flex flex-col items-center justify-center th-muted hover:border-fanni-violet hover:text-fanni-violet transition-colors flex-shrink-0 gap-1"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
        <span className="text-[10px]">Photo</span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 th-card rounded-xl border th-border shadow-xl overflow-hidden min-w-[180px]" style={{ backgroundColor: 'var(--card)' }}>
            <button
              onClick={() => openInput(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm th-text hover:bg-fanni-violet/10 transition-colors"
            >
              <svg className="w-5 h-5 text-fanni-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {t('camera')}
            </button>
            <button
              onClick={() => openInput(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm th-text hover:bg-fanni-violet/10 transition-colors border-t th-border"
            >
              <svg className="w-5 h-5 text-fanni-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('gallery')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
