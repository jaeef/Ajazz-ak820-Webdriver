import { Settings as SettingsIcon, PencilLine, Trash2 } from 'lucide-react'
import type { Settings, ReportIdMode } from '../lib/types'

interface Props {
  settings: Settings
  onChange: (next: Settings) => void
  onEditModes: () => void
  onReset: () => void
}

const hex4 = (n: number) => '0x' + n.toString(16).toUpperCase().padStart(4, '0')

export function SettingsPanel({ settings, onChange, onEditModes, onReset }: Props) {
  return (
    <div className="stack">
      <div className="panel__head"><h2><SettingsIcon aria-hidden /> Settings</h2></div>

      <div className="setting">
        <div className="setting__text">
          <strong>Show all HID devices</strong>
          <span className="muted">The browser’s device list shows every USB device, not just {hex4(settings.vid)} / {settings.pid ? hex4(settings.pid) : 'any product'}. Turn off for a shorter list.</span>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={settings.showAllDevices} onChange={e => onChange({ ...settings, showAllDevices: e.target.checked })} />
          <span className="toggle__track" aria-hidden /><span className="sr-only">Show all HID devices</span>
        </label>
      </div>

      <div className="setting">
        <div className="setting__text">
          <strong>Mode names</strong>
          <span className="muted">Rename effects to match what your keyboard actually shows. Saved in this browser.</span>
        </div>
        <button className="btn btn--outline" onClick={onEditModes}><PencilLine aria-hidden /> Edit names</button>
      </div>

      <h3 className="section-label">Protocol (advanced)</h3>
      <div className="setting setting--stack">
        <label className="setting__text" htmlFor="family">
          <strong>Protocol family</strong>
          <span className="muted">Auto picks Sonix for the AK820 Pro (PID {hex4(0x8009)}) and EVision for everything else, including the AK820 at {hex4(0x320f)} / {hex4(0x505b)}. Force one only if Apply does nothing, then compare bytes in the Capture log.</span>
        </label>
        <select id="family" className="input" value={settings.protocolFamily}
          onChange={e => onChange({ ...settings, protocolFamily: e.target.value as Settings['protocolFamily'] })}>
          <option value="auto">Auto, from the USB IDs (recommended)</option>
          <option value="evision">EVision: 64-byte output report</option>
          <option value="sonix">Sonix / Microdia: feature report</option>
        </select>
      </div>
      <div className="setting setting--stack">
        <label className="setting__text" htmlFor="rid">
          <strong>Report ID mode</strong>
          <span className="muted">Auto reads the keyboard’s HID descriptor and chooses numbered or unnumbered reports.</span>
        </label>
        <select id="rid" className="input" value={settings.reportIdMode}
          onChange={e => onChange({ ...settings, reportIdMode: e.target.value as ReportIdMode })}>
          <option value="auto">Auto, from the device descriptor (recommended)</option>
          <option value="native">Numbered: first byte is the report ID</option>
          <option value="payload">Unnumbered: report ID 0, first byte in the payload</option>
        </select>
      </div>
      <div className="setting">
        <div className="setting__text">
          <strong>USB IDs used for the device filter</strong>
          <span className="muted mono">VID {hex4(settings.vid)} · PID {settings.pid ? hex4(settings.pid) : 'any'}</span>
        </div>
      </div>

      <h3 className="section-label">Data</h3>
      <div className="setting">
        <div className="setting__text">
          <strong>Clear profiles, settings and test results</strong>
          <span className="muted">Everything is stored only in this browser. This can’t be undone.</span>
        </div>
        <button className="btn btn--danger" onClick={onReset}><Trash2 aria-hidden /> Clear all</button>
      </div>
      <p className="muted">v0.3 · Runs entirely in your browser: no install, no account, no network.</p>
    </div>
  )
}
