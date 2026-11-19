import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { POLLING_RATES, type KeyboardOptions } from '../protocol'

interface Props {
  isLive: boolean
  onRead: () => Promise<KeyboardOptions | null>
  onWrite: (opt: KeyboardOptions) => void
}

const DEFAULTS: KeyboardOptions = { wasdSwap: false, winLock: false, pollingRate: 0 }

// The vendor app's "Other Settings": stored in the keyboard's lighting block
// (bytes 19 / 21 / 22), read from the device so nothing else changes on write.
export function KeyboardOptionsPanel({ isLive, onRead, onWrite }: Props) {
  const [opt, setOpt] = useState<KeyboardOptions>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isLive) { setLoaded(false); return }
    onRead().then(o => { if (o) { setOpt(o); setLoaded(true) } })
  }, [isLive, onRead])

  const change = (next: KeyboardOptions) => { setOpt(next); onWrite(next) }

  return (
    <section className="panel" aria-labelledby="opts-h">
      <div className="panel__head"><h2 id="opts-h"><SlidersHorizontal aria-hidden /> Keyboard options</h2></div>
      <p className="muted">
        {isLive
          ? (loaded ? 'Read from the keyboard. Changes are written right away.' : 'Reading from the keyboard…')
          : 'Connect the keyboard to read and change these.'}
      </p>
      <label className="toggle">
        <input type="checkbox" disabled={!loaded} checked={opt.winLock} onChange={e => change({ ...opt, winLock: e.target.checked })} />
        <span className="toggle__track" aria-hidden /> Lock the Windows key
      </label>
      <label className="toggle">
        <input type="checkbox" disabled={!loaded} checked={opt.wasdSwap} onChange={e => change({ ...opt, wasdSwap: e.target.checked })} />
        <span className="toggle__track" aria-hidden /> Swap WASD and arrow keys
      </label>
      <div className="field">
        <span className="field__label">USB report rate</span>
        <div className="seg" role="radiogroup" aria-label="USB report rate">
          {POLLING_RATES.map((r, i) => (
            <button key={r} role="radio" aria-checked={opt.pollingRate === i} disabled={!loaded}
              onClick={() => change({ ...opt, pollingRate: i as KeyboardOptions['pollingRate'] })}>{r}</button>
          ))}
        </div>
      </div>
    </section>
  )
}
