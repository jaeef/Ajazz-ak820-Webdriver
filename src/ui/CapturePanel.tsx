import { useMemo, useState } from 'react'
import type { PacketLogEntry, PacketDirection, CalibrationResult, TriState } from '../types'
import { Check, X, CircleHelp } from 'lucide-react'
import { hexDump } from '../protocol'

interface Props {
  log: PacketLogEntry[]
  version: number
  paused: boolean
  setPaused: (p: boolean) => void
  onClear: () => void
  isLive: boolean
  // Stable modes table — empirical per-mode verification results.
  calibration: CalibrationResult[]
  onRemoveCalibration: (mode: number) => void
  onClearCalibration: () => void
}

// Cap the number of rows we actually render to keep the DOM small even when
// the ring buffer holds its full 500-entry capacity. Older entries are still
// in the buffer and included in exports; only the rendered slice is bounded.
const RENDER_CAP = 200

type Filter = 'all' | PacketDirection

function fmtTime(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

function download(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function CapturePanel({ log, version, paused, setPaused, onClear, isLive, calibration, onRemoveCalibration, onClearCalibration }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  // Recompute the visible slice only when the buffer version or filter changes.
  // The ring buffer can hold up to 500 entries; we render only the last
  // RENDER_CAP of the filtered set so a long session never slows the DOM.
  const { rows, countIn, countOut } = useMemo(() => {
    let inN = 0, outN = 0
    for (const e of log) {
      if (e.dir === 'in') inN++
      else outN++
    }
    const filtered = filter === 'all' ? log : log.filter(e => e.dir === filter)
    const slice = filtered.slice(-RENDER_CAP)
    return { rows: slice, countIn: inN, countOut: outN }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, version, filter])

  const exportJson = () => {
    const payload = log.map(e => ({
      id: e.id,
      t: e.timestamp,
      dir: e.dir,
      transport: e.transport,
      reportId: e.reportId,
      hex: hexDump(e.data),
      bytes: Array.from(e.data),
    }))
    download(`ak820-capture-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json')
  }

  const exportText = () => {
    const lines = log.map(e =>
      `${fmtTime(e.timestamp)}  ${e.dir === 'in' ? 'IN ' : 'OUT'}  ${e.transport.padEnd(7)} rid=${e.reportId}  len=${e.data.length}\n  ${hexDump(e.data)}\n`,
    )
    download(`ak820-capture-${Date.now()}.txt`, lines.join('\n'), 'text/plain')
  }

  const triIcon = (v: TriState) => v === 'yes' ? <Check aria-label="yes" /> : v === 'no' ? <X aria-label="no" /> : <CircleHelp aria-label="unknown" />
  const triClass = (v: TriState) => v === 'yes' ? 'calib-yes' : v === 'no' ? 'calib-no' : 'calib-unknown'

  const exportCalibration = () => {
    download(
      `ak820-stable-modes-${Date.now()}.json`,
      JSON.stringify(calibration, null, 2),
      'application/json',
    )
  }

  const exportCalibrationText = () => {
    const lines = calibration.map(r =>
      `Mode ${r.mode} (${r.modeName})  family=${r.family}  tested=${new Date(r.testedAt).toISOString()}\n` +
      `  works=${r.works}  colorWorks=${r.colorWorks}` +
      (r.notes ? `  notes="${r.notes}"` : '') + '\n' +
      `  packets: ${r.packets.length}\n` +
      r.packets.map(p => `    ${p.dir === 'in' ? 'IN ' : 'OUT'} ${p.transport} rid=${p.reportId} ${p.hex}`).join('\n') + '\n',
    )
    download(`ak820-stable-modes-${Date.now()}.txt`, lines.join('\n'), 'text/plain')
  }

  return (
    <div className="tab-panel active">
      <div className="row" style={{ fontWeight: 600 }}>
        Raw I/O Capture
        <span className="pill">{log.length} buffered</span>
        <span className="pill" style={{ background: 'rgba(76,175,80,0.15)', color: 'var(--success)' }}>↓ {countIn}</span>
        <span className="pill" style={{ background: 'rgba(255,208,75,0.15)', color: 'var(--accent)' }}>↑ {countOut}</span>
      </div>
      <div className="help" style={{ marginTop: -2 }}>
        Every byte that crosses the HID boundary is recorded here — OUTPUT and FEATURE reports the app sends,
        plus INPUT reports the keyboard emits (via WebHID <code>inputreportevent</code>). Compare the hex
        against a Wireshark/USBPcap capture of the official driver to verify the wire format. The buffer holds
        the last 500 packets; the view shows the most recent {RENDER_CAP}.
      </div>

      <div className="row" style={{ alignItems: 'center' }}>
        <button
          className={paused ? '' : 'secondary'}
          onClick={() => setPaused(!paused)}
          title={paused ? 'Resume live updates' : 'Freeze the view to inspect packets'}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="secondary" onClick={onClear}>Clear</button>
        <button className="secondary" onClick={exportJson} disabled={log.length === 0}>Export JSON</button>
        <button className="secondary" onClick={exportText} disabled={log.length === 0}>Export hex</button>
        <span style={{ flex: 1 }} />
        <label className="switch" title="Filter by direction">
          <input type="checkbox" checked={filter === 'in'} onChange={() => setFilter(f => f === 'in' ? 'all' : 'in')} />
          <span className="slider-toggle" />
        </label>
        <span className="help" style={{ margin: 0 }}>Only received</span>
        <label className="switch" title="Filter by direction">
          <input type="checkbox" checked={filter === 'out'} onChange={() => setFilter(f => f === 'out' ? 'all' : 'out')} />
          <span className="slider-toggle" />
        </label>
        <span className="help" style={{ margin: 0 }}>Only sent</span>
      </div>

      {!isLive && (
        <div className="help" style={{ background: 'var(--bg-3)', padding: 8, borderRadius: 6, marginBottom: 8 }}>
          Idle mode — packets are recorded by the mock controller but not transmitted. Click <b>Connect</b> to
          capture real traffic to and from the keyboard.
        </div>
      )}

      <div className="capture-log">
        {rows.length === 0 ? (
          <div className="capture-empty">No packets yet. Apply a lighting change or connect the keyboard to start capturing.</div>
        ) : (
          rows.map(e => (
            <div key={e.id} className={`capture-row ${e.dir}`}>
              <span className="c-time">{fmtTime(e.timestamp)}</span>
              <span className={`c-dir ${e.dir}`}>{e.dir === 'in' ? 'IN ←' : 'OUT →'}</span>
              <span className="c-transport">{e.transport}</span>
              <span className="c-rid">rid {e.reportId}</span>
              <span className="c-len">{e.data.length}B</span>
              <span className="c-hex">{hexDump(e.data)}</span>
            </div>
          ))
        )}
      </div>

      {/* ===== Stable Modes — empirically verified per-mode table ===== */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
      <div className="row" style={{ fontWeight: 600 }}>
        Stable Modes
        <span className="pill">{calibration.length} verified</span>
      </div>
      <div className="help" style={{ marginTop: -2, marginBottom: 8 }}>
        Each row is a mode you tested with <b>Test &amp; Approve</b> on the Lighting tab. The app applied
        the mode + color, captured the exact packets, and you confirmed whether it worked and whether
        color changes are honored. This is the <b>stable, verified</b> mode table for your specific keyboard.
        Export it to keep a known-good reference or share it.
      </div>
      <div className="row" style={{ alignItems: 'center' }}>
        <button className="secondary" onClick={exportCalibration} disabled={calibration.length === 0}>Export JSON</button>
        <button className="secondary" onClick={exportCalibrationText} disabled={calibration.length === 0}>Export text</button>
        <button className="danger small" onClick={onClearCalibration} disabled={calibration.length === 0}>Clear all</button>
      </div>

      {calibration.length === 0 ? (
        <div className="calib-table-empty">
          No verified modes yet. Go to the <b>Lighting</b> tab, pick a mode, and click <b>Test &amp; Approve</b>.
        </div>
      ) : (
        <div className="calib-table">
          <div className="calib-header">
            <span>ID</span>
            <span>Mode</span>
            <span>Works</span>
            <span>Color</span>
            <span>Tested</span>
            <span>Pkts</span>
            <span></span>
          </div>
          {calibration.map(r => (
            <div key={r.mode} className="calib-row">
              <span className="calib-id">{r.mode}</span>
              <span className="calib-name">{r.modeName}{r.notes ? <em className="calib-notes-inline"> — {r.notes}</em> : ''}</span>
              <span className={`calib-mark ${triClass(r.works)}`}>{triIcon(r.works)}</span>
              <span className={`calib-mark ${triClass(r.colorWorks)}`}>{triIcon(r.colorWorks)}</span>
              <span className="calib-date">{new Date(r.testedAt).toLocaleDateString()} {new Date(r.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="calib-pkts">{r.packets.length}</span>
              <span className="calib-del">
                <button className="danger small" onClick={() => onRemoveCalibration(r.mode)} title="Remove this calibration entry" aria-label="Remove this calibration entry"><X aria-hidden /></button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
