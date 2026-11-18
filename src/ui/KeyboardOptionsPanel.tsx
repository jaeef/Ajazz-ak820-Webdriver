import { useEffect, useState } from 'react'
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
    <div className="tab-panel active">
      <div className="row" style={{ fontWeight: 600 }}>Keyboard Options</div>
      <div className="help" style={{ marginTop: -2 }}>
        {isLive
          ? (loaded ? 'Read from the keyboard. Changes are written immediately.' : 'Reading from the keyboard…')
          : 'Connect the keyboard to read and change these.'}
      </div>

      <div className="row" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ minWidth: 'auto' }}>
          <input type="checkbox" disabled={!loaded} checked={opt.winLock}
            onChange={e => change({ ...opt, winLock: e.target.checked })} /> Lock Windows key
        </label>
        <label style={{ minWidth: 'auto' }}>
          <input type="checkbox" disabled={!loaded} checked={opt.wasdSwap}
            onChange={e => change({ ...opt, wasdSwap: e.target.checked })} /> Swap WASD and arrow keys
        </label>
        <label style={{ minWidth: 'auto' }}>
          USB report rate{' '}
          <select disabled={!loaded} value={opt.pollingRate}
            onChange={e => change({ ...opt, pollingRate: +e.target.value as KeyboardOptions['pollingRate'] })}>
            {POLLING_RATES.map((r, i) => <option key={r} value={i}>{r}</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}
