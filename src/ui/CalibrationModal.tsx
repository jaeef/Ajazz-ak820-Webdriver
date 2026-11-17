import { useState } from 'react'
import type { CalibrationResult, TriState, PacketSnapshot, ProtocolFamilyResolved, LightingState } from '../types'
import { modeName } from '../protocol'

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

// Tri-state toggle: unknown (not yet answered) → yes → no → unknown.
// Cycles so the user can always undo a misclick without a separate reset.
function TriToggle({ value, onChange, labels }: {
  value: TriState
  onChange: (v: TriState) => void
  labels: { yes: string; no: string; unknown: string }
}) {
  return (
    <div className="tri-toggle">
      <button
        className={value === 'yes' ? 'tri-yes-active' : 'secondary'}
        onClick={() => onChange(value === 'yes' ? 'unknown' : 'yes')}
      >
        {labels.yes}
      </button>
      <button
        className={value === 'no' ? 'tri-no-active' : 'secondary'}
        onClick={() => onChange(value === 'no' ? 'unknown' : 'no')}
      >
        {labels.no}
      </button>
      <button
        className={value === 'unknown' ? 'tri-unk-active' : 'secondary'}
        onClick={() => onChange('unknown')}
      >
        {labels.unknown}
      </button>
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

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal calibration-modal" onClick={e => e.stopPropagation()}>
        <h2>Test &amp; Approve Mode</h2>
        <div className="help" style={{ marginBottom: 12 }}>
          Mode <b>{name}</b> (ID {mode}) was just sent to the keyboard
          {isLive ? '' : ' (idle — packets were recorded, not transmitted)'}.
          Look at your keyboard and answer the questions below. Your answers + the captured
          packets are saved to the <b>stable modes</b> table on the Capture tab.
        </div>

        <div className="calib-question">
          <label>1. Did the mode take effect?</label>
          <TriToggle
            value={works}
            onChange={setWorks}
            labels={{ yes: 'Yes — it works', no: 'No — nothing changed', unknown: 'Unsure' }}
          />
        </div>

        <div className="calib-question">
          <label>2. Can you change the color in this mode?</label>
          <div className="help" style={{ margin: '2px 0 6px 0' }}>
            Pick a different color above, click Apply, and see if the keyboard's color changes.
          </div>
          <TriToggle
            value={colorWorks}
            onChange={setColorWorks}
            labels={{ yes: 'Yes — color changes', no: 'No — fixed colors', unknown: 'Unsure' }}
          />
        </div>

        <div className="calib-question">
          <label>Notes (optional):</label>
          <textarea
            className="calib-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. 'wave direction is reversed' or 'only brightness 3+ shows color'"
            rows={2}
          />
        </div>

        <div className="calib-packets">
          <div className="help" style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>
            Captured output ({packets.length} packet{packets.length === 1 ? '' : 's'}):
          </div>
          {hasPackets ? (
            <div className="capture-log" style={{ maxHeight: 160 }}>
              {packets.map((p, i) => (
                <div key={i} className={`capture-row ${p.dir}`}>
                  <span className="c-time">{new Date(p.timestamp).toLocaleTimeString()}</span>
                  <span className={`c-dir ${p.dir}`}>{p.dir === 'in' ? 'IN ←' : 'OUT →'}</span>
                  <span className="c-transport">{p.transport}</span>
                  <span className="c-rid">rid {p.reportId}</span>
                  <span className="c-len">{p.bytes.length}B</span>
                  <span className="c-hex">{p.hex}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="capture-empty">No packets captured.</div>
          )}
        </div>

        <div className="modal-actions">
          <button className="secondary" onClick={downloadLog} disabled={!hasPackets}>
            Save log file
          </button>
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={works === 'unknown' && colorWorks === 'unknown'}
            title={works === 'unknown' && colorWorks === 'unknown' ? 'Answer at least one question first' : 'Save to stable modes table'}
          >
            Approve &amp; Save
          </button>
        </div>
      </div>
    </div>
  )
}
