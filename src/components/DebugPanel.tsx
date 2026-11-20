// Hidden diagnostics, shown on Settings only when the URL has ?debug.
// A user with a misbehaving keyboard opens ?debug, reproduces the problem, then
// copies one plain-text report: USB IDs, the firmware info block, the lighting
// block, the live keymap (with every slot that differs from factory) and the raw
// packets sent and received since connecting.
import { useState } from 'react'
import { Bug, Copy, Download, RefreshCw, Send } from 'lucide-react'
import type { DeviceInfo } from '../lib/types'
import type { DeviceController } from '../lib/device'
import { defaultKeymap, hexDump, type KeyAssignment } from '../lib/protocol'
import { KEY_LAYOUT } from '../lib/keymap'

interface Props {
  controller: DeviceController
  info: DeviceInfo | null
  family: string
  readInfo: () => Promise<Uint8Array | null>
  readLighting: () => Promise<Uint8Array | null>
  readKeymap: () => Promise<KeyAssignment[] | null>
}

interface Snapshot { at: string; infoBlock: Uint8Array | null; lighting: Uint8Array | null; keymap: KeyAssignment[] | null }

const h4 = (n?: number) => (n === undefined ? '?' : '0x' + n.toString(16).toUpperCase().padStart(4, '0'))
const time = (t: number) => new Date(t).toISOString().slice(11, 23)
const slotName = (slot: number) => KEY_LAYOUT.find(k => k.id === slot)?.label ?? `slot ${slot}`
const triple = (a: KeyAssignment) => a.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')

const ISSUE_URL = 'https://github.com/jaeef/Ajazz-ak820-Webdriver/issues/new'

// withPackets=false gives the short summary that fits in an issue link.
function buildReport({ controller, info, family }: Props, snap: Snapshot | null, withPackets = true): string {
  const out: string[] = []
  out.push('AK820 Web Driver diagnostics')
  out.push(`App v${__APP_VERSION__} · ${new Date().toISOString()}`)
  out.push(`Browser: ${navigator.userAgent}`)
  out.push('')
  out.push(info
    ? `Device: ${info.productName} · VID ${h4(info.vendorId)} PID ${h4(info.productId)}`
    : 'Device: not connected (demo mode)')
  if (info) {
    out.push(`Interface: usage page ${h4(info.usagePage)} usage ${h4(info.usage)} · lighting interface ${info.matchedVendorInterface ? 'found' : 'NOT found'}`)
    out.push(`Report IDs: output [${info.outputReportIds?.join(', ') ?? ''}] feature [${info.featureReportIds?.join(', ') ?? ''}] · collections ${info.collectionsCount ?? '?'} · protocol ${family}`)
  }
  out.push('')
  if (!snap) {
    out.push('Keyboard state: not read yet (press "Read keyboard now").')
  } else {
    out.push(`Keyboard state read at ${snap.at}`)
    out.push(`Info block (03 22): ${snap.infoBlock ? hexDump(snap.infoBlock) : 'no reply'}`)
    out.push(`Lighting block (05 1D): ${snap.lighting ? hexDump(snap.lighting) : 'no reply'}`)
    if (!snap.keymap) {
      out.push('Keymap (07): no reply')
    } else {
      const defaults = defaultKeymap()
      const diff = snap.keymap.map((a, i) => [a, i] as const).filter(([a, i]) => triple(a) !== triple(defaults[i]))
      out.push(`Keymap (07): ${diff.length} slot(s) differ from factory`)
      diff.forEach(([a, i]) => out.push(`  ${slotName(i).padEnd(10)} slot ${String(i).padStart(3)}: ${triple(a)}  (factory ${triple(defaults[i])})`))
    }
  }
  if (!withPackets) return out.join('\n')
  out.push('')
  const log = controller.log.slice(-400)
  out.push(`Packets since connecting (last ${log.length}, oldest first):`)
  log.forEach(e => out.push(`${time(e.timestamp)} ${e.dir === 'in' ? 'IN ' : 'OUT'} ${e.transport.padEnd(7)} rid=${e.reportId} ${hexDump(e.data)}`))
  return out.join('\n')
}

export function DebugPanel(props: Props) {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const report = buildReport(props, snap)

  const readNow = async () => {
    setBusy(true)
    try {
      const infoBlock = await props.readInfo()
      const lighting = await props.readLighting()
      const keymap = await props.readKeymap()
      setSnap({ at: new Date().toISOString(), infoBlock, lighting, keymap })
      setNote('')
    } finally { setBusy(false) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(report); setNote('Report copied. Paste it in your message.') }
    catch { setNote('Copy was blocked; use Download instead.') }
  }
  // Copy the full report, then open a new issue with the summary filled in; the user
  // pastes the full report (it's on the clipboard) and submits. Copy first: the new
  // tab takes focus, and the clipboard can't be written from a background tab.
  // ponytail: the full report is too long for an issue URL (~8 KB limit), so only the summary is prefilled.
  const reportIssue = async () => {
    let copied = true
    try { await navigator.clipboard.writeText(report) } catch { copied = false }
    const body = [
      '**What happened**', '<!-- describe it here -->', '',
      '**Steps to reproduce**', '1. ', '', '**Keyboard serial** (sticker on the back): ', '',
      '**Diagnostics summary**', '```', buildReport(props, snap, false), '```', '',
      '**Full report**',
      copied ? '<!-- The full report is on your clipboard: paste it between the lines below. -->'
             : '<!-- Copy failed: use Download .txt on the site and attach the file here. -->',
      '```', '', '```',
    ].join('\n')
    const title = `Diagnostics: ${props.info ? `${h4(props.info.vendorId)}:${h4(props.info.productId)}` : 'demo'} v${__APP_VERSION__}`
    window.open(`${ISSUE_URL}?labels=bug&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener')
    setNote(copied ? 'Issue form opened. Paste the report (Ctrl+V) where it says, then press Submit.'
                   : 'Issue form opened, but copy was blocked: use Download .txt and attach the file.')
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `ak820-diagnostics-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stack">
      <div className="panel__head"><h2><Bug aria-hidden /> Diagnostics</h2></div>
      <ol className="debug__steps">
        <li>Connect the keyboard.</li>
        <li>Do the steps that go wrong (for example on Keys &amp; macro: assign the macro, clear it, press Apply).</li>
        <li>Come back here, press <b>Read keyboard now</b>, then <b>Copy report &amp; open issue</b>. In the
          form that opens, paste (<kbd>Ctrl</kbd> + <kbd>V</kbd>) where it says, then press Submit. No GitHub
          account? Use <b>Download .txt</b> and send the file to the developer.</li>
        <li>Only after sending the report: if the keyboard is still stuck, hold <kbd>Fn</kbd> + <kbd>Space</kbd> for
          5–6 seconds to reset it to factory settings.</li>
      </ol>
      <div className="actions">
        <button className="btn btn--primary" onClick={readNow} disabled={busy || !props.info}><RefreshCw aria-hidden /> {busy ? 'Reading…' : 'Read keyboard now'}</button>
        <button className="btn btn--outline" onClick={reportIssue}><Send aria-hidden /> Copy report &amp; open issue</button>
        <button className="btn btn--ghost" onClick={copy}><Copy aria-hidden /> Copy only</button>
        <button className="btn btn--ghost" onClick={download}><Download aria-hidden /> Download .txt</button>
      </div>
      {note && <p className="muted" aria-live="polite">{note}</p>}
      <textarea className="debug__report" readOnly value={report} aria-label="Diagnostics report" spellCheck={false} />
    </div>
  )
}
