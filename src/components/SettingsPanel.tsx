import { Settings as SettingsIcon, Trash2 } from 'lucide-react'
import type { Settings } from '../lib/types'

interface Props {
  settings: Settings
  onChange: (next: Settings) => void
  onReset: () => void
}

export function SettingsPanel({ settings, onChange, onReset }: Props) {
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
          <span className="muted">Runs entirely in your browser: no install, no account, no network.</span>
        </div>
        <a className="btn btn--outline" href="https://github.com/jaeef/Ajazz-ak820-Webdriver/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">What’s new</a>
      </div>
    </div>
  )
}
