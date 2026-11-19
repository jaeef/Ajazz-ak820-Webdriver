import { useMemo, useState } from 'react'
import type { PacketLogEntry, PacketDirection, CalibrationResult, TriState } from '../lib/types'
import { Check, X, CircleHelp, Pause, Play, Eraser, Download, FileText, ArrowDownLeft, ArrowUpRight, Activity, ListChecks } from 'lucide-react'
import { hexDump } from '../lib/protocol'

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
  const triClass = (v: TriState) => v === 'yes' ? 'tri--yes' : v === 'no' ? 'tri--no' : 'tri--unk'

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

  const seg = (f: Filter, label: string) => (
    <button role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>{label}</button>
  )

  return (
    <div className="stack">
      <div className="panel__head">
        <h2><Activity aria-hidden /> Capture log</h2>
        <div className="pills">
          <span className="pill">{log.length} buffered</span>
          <span className="pill"><ArrowDownLeft aria-hidden /> {countIn} in</span>
          <span className="pill"><ArrowUpRight aria-hidden /> {countOut} out</span>
        </div>
      </div>
      <p className="muted">
        Every report that crosses the USB boundary: what the app sends and what the keyboard answers. The buffer keeps the last 500;
        the table shows the newest {RENDER_CAP}.{!isLive && ' In demo mode packets are recorded but not sent.'}
      </p>
      <div className="toolbar-row">
        <button className={`btn ${paused ? 'btn--primary' : 'btn--outline'}`} onClick={() => setPaused(!paused)}>
          {paused ? <><Play aria-hidden /> Resume</> : <><Pause aria-hidden /> Pause</>}
        </button>
        <button className="btn btn--outline" onClick={onClear}><Eraser aria-hidden /> Clear</button>
        <button className="btn btn--outline" onClick={exportJson} disabled={log.length === 0}><Download aria-hidden /> JSON</button>
        <button className="btn btn--outline" onClick={exportText} disabled={log.length === 0}><FileText aria-hidden /> Hex text</button>
        <div className="seg seg--pill toolbar-row__end" role="radiogroup" aria-label="Direction">
          {seg('all', 'All')}{seg('out', 'Sent')}{seg('in', 'Received')}
        </div>
      </div>

      <div className="table-wrap">
        {rows.length === 0 ? (
          <p className="empty">No packets yet. Apply a lighting change or connect the keyboard to start capturing.</p>
        ) : (
          <table className="table table--mono">
            <thead><tr><th>Time</th><th>Dir</th><th>Type</th><th>ID</th><th>Len</th><th>Bytes</th></tr></thead>
            <tbody>
              {rows.map(e => (
                <tr key={e.id}>
                  <td>{fmtTime(e.timestamp)}</td>
                  <td><span className={`dir dir--${e.dir}`}>{e.dir === 'in' ? <ArrowDownLeft aria-hidden /> : <ArrowUpRight aria-hidden />}{e.dir === 'in' ? 'in' : 'out'}</span></td>
                  <td>{e.transport}</td>
                  <td>{e.reportId}</td>
                  <td>{e.data.length}</td>
                  <td className="table__hex">{hexDump(e.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel__head panel__head--section">
        <h2><ListChecks aria-hidden /> Tested modes</h2>
        <span className="pill">{calibration.length} tested</span>
      </div>
      <p className="muted">Modes you checked with “Test &amp; approve” on the Lighting page, with your answers and the exact packets sent.</p>
      <div className="toolbar-row">
        <button className="btn btn--outline" onClick={exportCalibration} disabled={calibration.length === 0}><Download aria-hidden /> JSON</button>
        <button className="btn btn--outline" onClick={exportCalibrationText} disabled={calibration.length === 0}><FileText aria-hidden /> Text</button>
        <button className="btn btn--danger toolbar-row__end" onClick={onClearCalibration} disabled={calibration.length === 0}>Clear all</button>
      </div>
      {calibration.length === 0 ? (
        <p className="empty">No tested modes yet. Pick an effect on the Lighting page and click “Test &amp; approve this mode”.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mode</th><th>Name</th><th>Works</th><th>Colour</th><th>Tested</th><th>Packets</th><th><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {calibration.map(r => (
                <tr key={r.mode}>
                  <td className="num">{String(r.mode).padStart(2, '0')}</td>
                  <td>{r.modeName}{r.notes && <span className="muted"> · {r.notes}</span>}</td>
                  <td><span className={`tri ${triClass(r.works)}`}>{triIcon(r.works)}</span></td>
                  <td><span className={`tri ${triClass(r.colorWorks)}`}>{triIcon(r.colorWorks)}</span></td>
                  <td className="num">{new Date(r.testedAt).toLocaleDateString()} {new Date(r.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="num">{r.packets.length}</td>
                  <td><button className="icon-btn icon-btn--danger" onClick={() => onRemoveCalibration(r.mode)} aria-label={`Remove mode ${r.mode}`} title="Remove"><X aria-hidden /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
