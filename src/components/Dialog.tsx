import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  actions: ReactNode
  wide?: boolean
}

// Native <dialog> shown modally: focus trap, Escape and backdrop come from the browser.
export function Dialog({ title, onClose, children, actions, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => d?.close()
  }, [])
  return (
    <dialog ref={ref} className={`dialog${wide ? ' dialog--wide' : ''}`} aria-labelledby="dialog-title"
      onCancel={e => { e.preventDefault(); onClose() }}
      onClick={e => { if (e.target === ref.current) onClose() }}>
      <div className="dialog__head">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><X aria-hidden /></button>
      </div>
      <div className="dialog__body">{children}</div>
      <div className="dialog__actions">{actions}</div>
    </dialog>
  )
}
