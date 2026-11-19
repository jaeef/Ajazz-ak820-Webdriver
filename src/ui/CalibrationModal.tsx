import { useState } from 'react'
import type { CalibrationResult, TriState, PacketSnapshot, ProtocolFamilyResolved, LightingState } from '../types'
import { Check, X, CircleHelp, Download, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { modeName } from '../protocol'
import { Dialog } from './Dialog'

interface Props {
  mode: number
  modeNames: string[]
  lighting: LightingState
  family: ProtocolFamilyResolved
  packets: PacketSnapshot[]
  isLive: boolean
  onSave: (result: CalibrationResult) => void
  onClose: () => void
}

// Three-way answer: yes / no / unsure.
function TriToggle({ value, onChange, labels, name }: {
  value: TriState
  onChange: (v: TriState) => void
  labels: { yes: string; no: string; unknown: string }
  name: string
}) {
  return (
    <div className="seg seg--tri" role="radiogroup" aria-label={name}>
      <button role="radio" aria-checked={value === 'yes'} onClick={() => onChange('yes')}><Check aria-hidden /> {labels.yes}</button>
      <button role="radio" aria-checked={value === 'no'} onClick={() => onChange('no')}><X aria-hidden /> {labels.no}</button>
      <button role="radio" aria-checked={value === 'unknown'} onClick={() => onChange('unknown')}><CircleHelp aria-hidden /> {labels.unknown}</button>
    </div>
  )
}

export function CalibrationModal({ mode, modeNames, lighting, family, packets, isLive, onSave, onClose }: Props) {
  const [works, setWorks] = useState<TriState>('unknown')
  const [colorWorks, setColorWorks] = useState<TriState>('unknown')
  const [notes, setNotes] = useState('')

  const name = modeName(mode, modeNames)
  const hasPackets = packets.length > 0

  const handleSave = () => {
    const result: CalibrationResult = {
      mode,
      modeName: name,
      works,
      colorWorks,
      notes: notes.trim(),
      testedAt: Date.now(),
      family,
      lighting: { ...lighting },
      packets,
    }
    onSave(result)
    onClose()
  }

  const downloadLog = () => {
    const payload: CalibrationResult = {
      mode,
      modeName: name,
      works,
      colorWorks,
      notes: notes.trim(),
      testedAt: Date.now(),
      family,
      lighting: { ...lighting },
      packets,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ak820-mode-${mode}-test-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const unanswered = works === 'unknown' && colorWorks === 'unknown'
  return (
    <Dialog title={`Test ${name}`} onClose={onClose} wide actions={<>
      <button className="btn btn--ghost" onClick={downloadLog} disabled={!hasPackets}><Download aria-hidden /> Save log file</button>
      <button className="btn btn--outline" onClick={onClose}>Cancel</button>
      <button className="btn btn--primary" onClick={handleSave} disabled={unanswered}
        title={unanswered ? 'Answer at least one question first' : undefined}>Save result</button>
    </>}>
      <p className="muted">
        Mode {String(mode).padStart(2, '0')} was just {isLive ? 'sent to the keyboard' : 'recorded (demo mode, nothing was sent)'}.
        Look at the keyboard and answer below. The result and packets go to “Tested modes” in the Capture log.
      </p>
      <div className="field">
        <span className="field__label">Did the effect change on the keyboard?</span>
        <TriToggle name="Did the effect change" value={works} onChange={setWorks} labels={{ yes: 'Yes', no: 'No change', unknown: 'Unsure' }} />
      </div>
      <div className="field">
        <span className="field__label">Does it follow the colour you pick?</span>
        <span className="muted">Pick another colour, press Apply, and watch the keyboard.</span>
        <TriToggle name="Does it follow the colour" value={colorWorks} onChange={setColorWorks} labels={{ yes: 'Yes', no: 'Fixed colours', unknown: 'Unsure' }} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="calib-notes">Notes (optional)</label>
        <textarea id="calib-notes" className="input input--area" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="For example: the wave runs the other way" />
      </div>
      <div className="field">
        <span className="field__label">Packets sent ({packets.length})</span>
        {hasPackets ? (
          <div className="table-wrap table-wrap--short">
            <table className="table table--mono">
              <tbody>
                {packets.map((p, i) => (
                  <tr key={i}>
                    <td><span className={`dir dir--${p.dir}`}>{p.dir === 'in' ? <ArrowDownLeft aria-hidden /> : <ArrowUpRight aria-hidden />}{p.dir}</span></td>
                    <td>{p.bytes.length}</td>
                    <td className="table__hex">{p.hex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="empty">No packets captured.</p>}
      </div>
    </Dialog>
  )
}
