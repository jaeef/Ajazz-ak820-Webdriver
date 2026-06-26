import type { Settings, ReportIdMode } from '../types'

interface Props {
  settings: Settings
  onChange: (next: Settings) => void
  onEditModes: () => void
  onReset: () => void
}

export function SettingsPanel({ settings, onChange, onEditModes, onReset }: Props) {
  const vidText = '0x' + settings.vid.toString(16).toUpperCase().padStart(4, '0')
  const pidText = settings.pid ? '0x' + settings.pid.toString(16).toUpperCase().padStart(4, '0') : '0'

  return (
    <div className="tab-panel">
      <div className="row">
        <label>Vendor ID:</label>
        <input
          type="text" value={vidText} disabled
          style={{ width: 100 }}
        />
        <label style={{ minWidth: 'auto' }}>Product ID:</label>
        <input
          type="text" value={pidText} disabled
          style={{ width: 100 }}
        />
        <span className="help" style={{ margin: 0 }}>
          These are the USB IDs used to identify and connect to the AK820 keyboard.
        </span>
      </div>
      <div className="row">
        <label>Report ID mode:</label>
        <select
          value={settings.reportIdMode}
          onChange={e => onChange({ ...settings, reportIdMode: e.target.value as ReportIdMode })}
          style={{ flex: 1 }}
        >
          <option value="auto">Auto — detect from the device descriptor (recommended)</option>
          <option value="native">Mode as HID report ID (numbered reports)</option>
          <option value="payload">0x00 + mode as payload byte 0 (unnumbered)</option>
        </select>
      </div>
      <div className="help" style={{ marginTop: -4 }}>
        <b>Auto</b> reads the connected keyboard's HID descriptor and sends numbered vs. unnumbered
        feature reports accordingly. If lighting still does nothing, connect, open the browser
        console to see the detected feature report IDs, then try forcing <b>native</b> or <b>payload</b> here.
      </div>
      <div className="row">
        <label>Edit mode names:</label>
        <button className="secondary" onClick={onEditModes}>Edit</button>
        <span className="help" style={{ margin: 0 }}>
          The 20 mode IDs (0x00–0x13) are documented, but their friendly names are guesses. Rename to match what your keyboard actually does.
        </span>
      </div>
      <div className="row">
        <label>Show all HID devices:</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.showAllDevices}
            onChange={e => onChange({ ...settings, showAllDevices: e.target.checked })}
          />
          <span className="slider-toggle" />
        </label>
        <span className="help" style={{ margin: 0 }}>
          When on, the device picker shows <i>all</i> HID devices (bypassing the VID/PID filter). Turn off if you have many USB devices and want a focused list.
        </span>
      </div>
      <div className="row">
        <label>Reset all data:</label>
        <button className="danger" onClick={onReset}>Clear profiles &amp; settings</button>
      </div>
      <div className="row">
        <label>About:</label>
        <span style={{ color: 'var(--fg-2)', fontSize: 12, lineHeight: 1.6 }}>
          v0.2 · Runs entirely in your browser — no install, no account, no network. Your settings stay on this device.
        </span>
      </div>
    </div>
  )
}
