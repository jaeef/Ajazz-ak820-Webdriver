import { useState } from 'react'
import { Settings as SettingsIcon, Trash2, Bug, Download } from 'lucide-react'
import type { Settings } from '../lib/types'

const ISSUE_URL = 'https://github.com/jaeef/Ajazz-ak820-Webdriver/issues/new'
type Report = { title: string; summary: string; full: string }

interface Props {
  settings: Settings
  onChange: (next: Settings) => void
  onReset: () => void
  onReport: () => Promise<Report>
}

export function SettingsPanel({ settings, onChange, onReset, onReport }: Props) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  // Read the keyboard, copy the full report, open a GitHub issue with the summary
  // filled in. Copy happens before the new tab opens (a background tab can't write
  // the clipboard). The full report is too long for the issue URL, so it's pasted.
  const report = async () => {
    setBusy(true)
    setNote('Reading the keyboard…')
    try {
      const r = await onReport()
      let copied = true
      try { await navigator.clipboard.writeText(r.full) } catch { copied = false }
      const body = ['**What happened**', '', '**Steps to reproduce**', '1. ', '', '**Keyboard serial** (sticker on the back): ', '',
        '**Report**', '```', r.summary, '```', '',
        copied ? '**Full report** (on your clipboard: paste it between the lines below)' : '**Full report**: attach the file from "Download report"',
        '```', '', '```'].join('\n')
      window.open(`${ISSUE_URL}?labels=bug&title=${encodeURIComponent(r.title)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener')
      setNote(copied ? 'Report copied. In the GitHub form, paste it (Ctrl + V) where it says, describe the problem, then Submit.'
                     : 'Couldn’t copy. Use “Download report” and attach the file in the GitHub form.')
    } finally { setBusy(false) }
  }
  const download = async () => {
    const r = await onReport()
    const url = URL.createObjectURL(new Blob([r.full], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `ak820-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stack">
      <div className="panel__head"><h2><SettingsIcon aria-hidden /> Settings</h2></div>

      <div className="setting">
        <div className="setting__text">
          <strong>Show all HID devices</strong>
          <span className="muted">Lists every USB device when you connect, not just AK820 keyboards. Turn on only if your AK820 doesn’t show up; other devices are refused.</span>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={settings.showAllDevices} onChange={e => onChange({ ...settings, showAllDevices: e.target.checked })} />
          <span className="toggle__track" aria-hidden /><span className="sr-only">Show all HID devices</span>
        </label>
      </div>

      <h3 className="section-label">Data</h3>
      <div className="setting">
        <div className="setting__text">
          <strong>Clear profiles and settings</strong>
          <span className="muted">Everything is stored only in this browser. This can’t be undone.</span>
        </div>
        <button className="btn btn--danger" onClick={onReset}><Trash2 aria-hidden /> Clear all</button>
      </div>
      <h3 className="section-label">About</h3>
      <div className="setting">
        <div className="setting__text">
          <strong>AK820 Web Driver {__APP_VERSION__}</strong>
          <span className="muted">Runs in your browser: no install, no account. The site counts anonymous visits; your keyboard and settings never leave this computer.</span>
        </div>
        <a className="btn btn--outline" href="https://github.com/jaeef/Ajazz-ak820-Webdriver/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">What’s new</a>
      </div>
      <div className="setting">
        <div className="setting__text">
          <strong>Something not working?</strong>
          <span className="muted">With the keyboard connected, do the steps that go wrong, then press Report a problem. It reads the keyboard, copies a report and opens a GitHub issue. No GitHub account? Download the report and send the file instead.</span>
          {note && <span className="muted report__note" aria-live="polite">{note}</span>}
        </div>
        <div className="setting__actions">
          <button className="btn btn--outline" onClick={report} disabled={busy}><Bug aria-hidden /> {busy ? 'Reading…' : 'Report a problem'}</button>
          <button className="btn btn--ghost btn--sm" onClick={download}><Download aria-hidden /> Download report</button>
        </div>
      </div>
    </div>
  )
}
