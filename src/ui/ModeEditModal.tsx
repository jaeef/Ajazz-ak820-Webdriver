import { useState } from 'react'
import { DEFAULT_MODE_ORDER } from '../protocol'
import { Dialog } from './Dialog'
import { modeIcon } from './modeIcons'

interface Props {
  modes: string[]
  onClose: () => void
  onSave: (next: string[]) => void
}

export function ModeEditModal({ modes, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<string[]>([...modes])
  const save = () => onSave(draft.map((n, i) => (n ?? '').trim() || (DEFAULT_MODE_ORDER.includes(i) ? `Mode ${i}` : '')))
  return (
    <Dialog title="Mode names" onClose={onClose} actions={<>
      <button className="btn btn--outline" onClick={onClose}>Cancel</button>
      <button className="btn btn--primary" onClick={save}>Save names</button>
    </>}>
      <p className="muted">Name each firmware mode after what your keyboard shows. Saved in this browser only.</p>
      <div className="mode-names">
        {DEFAULT_MODE_ORDER.map(value => {
          const Icon = modeIcon(value)
          return (
            <label className="mode-names__row" key={value}>
              <Icon aria-hidden />
              <span className="num">{String(value).padStart(2, '0')}</span>
              <input className="input" value={draft[value] ?? ''} aria-label={`Name for mode ${value}`}
                onChange={e => { const next = [...draft]; next[value] = e.target.value; setDraft(next) }} />
            </label>
          )
        })}
      </div>
    </Dialog>
  )
}
