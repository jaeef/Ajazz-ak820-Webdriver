// "Your keyboard": what the connected AK820 reports about itself, styled like the
// QC sticker on its back. Only facts the keyboard actually sends: USB IDs, the board
// code (undecoded info-block bytes, handy for telling batches apart), what the lighting
// is set to right now, its options and how many keys are remapped.
import { useEffect, useState } from 'react'
import { RefreshCw, BadgeCheck, CircleHelp } from 'lucide-react'
import type { DeviceInfo } from '../lib/types'
import type { KeyboardReads } from '../lib/report'
import { MAX_SPEED, MODE_STATIC, defaultKeymap, modeName, readKeyboardOptions, rgbToHex } from '../lib/protocol'

interface Props {
  info: DeviceInfo | null
  modes: string[]
  readKeyboard: () => Promise<KeyboardReads | null>
}

const hex = (n: number, w = 2) => n.toString(16).toUpperCase().padStart(w, '0')
const RATES = ['1000 Hz', '500 Hz', '250 Hz', '125 Hz']

export function KeyboardCard({ info, modes, readKeyboard }: Props) {
  const [reads, setReads] = useState<KeyboardReads | null>(null)
  const [busy, setBusy] = useState(false)
  const refresh = () => { setBusy(true); readKeyboard().then(setReads).finally(() => setBusy(false)) }
  useEffect(() => { if (info) refresh(); else setReads(null) }, [info]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!info) {
    return (
      <div className="kbcard kbcard--empty">
        <img src="/favicon.svg" alt="" className="kbcard__img" />
        <p>Connect your AK820 to see what it reports about itself: its USB ID, board code and what it’s set to right now.</p>
      </div>
    )
  }

  const verified = info.vendorId === 0x320f && info.productId === 0x505b
  const code = reads?.infoBlock ? [...reads.infoBlock.subarray(4, 9)].map(b => hex(b)).join('') : null
  const l = reads?.lighting
  const colour = l ? rgbToHex(l[6], l[7], l[8]) : null
  const opt = l ? readKeyboardOptions(l) : null
  const factory = defaultKeymap()
  const remapped = reads?.keymap ? reads.keymap.filter((a, i) => a.join() !== factory[i].join()).length : null
  const tag = code ? hex(info.vendorId, 4) + hex(info.productId, 4) + code : ''
  const bars = [...tag].flatMap(ch => { const v = parseInt(ch, 16); return [v >> 2, v & 3] })

  return (
    <div className="kbcard">
      <div className="kbcard__head">
        <img src="/favicon.svg" alt="" className="kbcard__img" />
        <div>
          <strong>{info.productName || 'AK820'}</strong>
          <span className={`kbcard__badge${verified ? '' : ' kbcard__badge--warn'}`}>
            {verified ? <><BadgeCheck aria-hidden /> Verified model</> : <><CircleHelp aria-hidden /> Untested model</>}
          </span>
        </div>
        <button className="icon-btn" onClick={refresh} disabled={busy} aria-label="Read the keyboard again" title="Read again">
          <RefreshCw aria-hidden className={busy ? 'spin' : undefined} />
        </button>
      </div>

      <dl className="kbcard__specs">
        <dt>USB ID</dt><dd className="mono">{hex(info.vendorId, 4)}:{hex(info.productId, 4)}</dd>
        <dt>Board code</dt><dd className="mono">{code ? code.replace(/(.{4})(.{4})(.*)/, '$1 $2 $3') : busy ? 'reading…' : 'no reply'}</dd>
        <dt>Lighting now</dt>
        <dd>{l
          ? <><i className="kbcard__swatch" style={{ background: colour! }} aria-hidden />
              {l[1] === MODE_STATIC ? 'Solid colour' : modeName(l[1], modes)} · {l[2] === 0 ? 'off' : `brightness ${l[2]}`}
              {l[1] !== MODE_STATIC && ` · speed ${MAX_SPEED - l[3] + 1}`}</>
          : busy ? 'reading…' : 'no reply'}</dd>
        <dt>Options</dt>
        <dd>{opt ? `Win lock ${opt.winLock ? 'on' : 'off'} · WASD swap ${opt.wasdSwap ? 'on' : 'off'} · ${RATES[opt.pollingRate]}` : '…'}</dd>
        <dt>Remapped keys</dt>
        <dd>{remapped === null ? '…' : remapped === 0 ? 'none, factory layout' : remapped}</dd>
      </dl>

      {bars.length > 0 && (
        <div className="kbcard__barcode" aria-hidden title="Board code as a barcode, just for fun">
          {bars.map((v, i) => <i key={i} style={{ width: 1 + v, opacity: i % 2 ? 0.55 : 0.9 }} />)}
          <span className="mono">{tag}</span>
        </div>
      )}
    </div>
  )
}
