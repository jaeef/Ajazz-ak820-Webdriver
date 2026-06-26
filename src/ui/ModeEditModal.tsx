import { useState } from 'react'
import { DEFAULT_MODE_ORDER } from '../protocol'

interface Props {
  modes: string[]
  onClose: () => void
  onSave: (next: string[]) => void
}

export function ModeEditModal({ modes, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<string[]>([...modes])

  return (
    <div className="modal-bg active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Edit mode names</h2>
        <p className="help" style={{ marginBottom: 12 }}>
          Map each mode ID to the effect you actually see on your keyboard. Changes save to your browser only.
        </p>
        <div>
          {DEFAULT_MODE_ORDER.map(value => (
            <div className="mode-edit-row" key={value}>
              <span className="mid">{'0x' + value.toString(16).toUpperCase().padStart(2, '0')}</span>
              <input
                type="text"
                value={draft[value] ?? ''}
                onChange={e => {
                  const next = [...draft]
                  next[value] = e.target.value
                  setDraft(next)
                }}
              />
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button onClick={() => onSave(draft.map((n, i) => (n ?? '').trim() || (DEFAULT_MODE_ORDER.includes(i) ? `Mode ${i}` : '')))}>Save</button>
        </div>
      </div>
    </div>
  )
}
