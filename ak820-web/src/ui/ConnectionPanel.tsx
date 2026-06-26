import type { DeviceInfo, Settings } from '../types'

interface Props {
  info: DeviceInfo | null
  isConnected: boolean
  isMock: boolean
  webHIDSupported: boolean
  settings: Settings
  onConnect: () => void
  onDisconnect: () => void
  onListGranted: () => void
}

export function ConnectionPanel({
  info, isConnected, isMock, webHIDSupported, settings, onConnect, onDisconnect, onListGranted,
}: Props) {
  const status = isConnected ? 'connected' : 'disconnected'
  const statusText = isConnected ? 'Connected' : 'Disconnected'
  const devLabel = info
    ? `VID 0x${info.vendorId.toString(16).toUpperCase().padStart(4, '0')} · PID 0x${info.productId.toString(16).toUpperCase().padStart(4, '0')} · ${info.productName}`
    : ''

  return (
    <div className="panel">
      <div className="row">
        <span className={`badge ${status}`}>{statusText}</span>
        <span className="device-info">{devLabel}</span>
        <span style={{ flex: 1 }} />
        {!isConnected && (
          <button id="connectBtn" onClick={onConnect} disabled={!webHIDSupported}>
            Connect keyboard
          </button>
        )}
        {isConnected && (
          <button id="disconnectBtn" className="secondary" onClick={onDisconnect}>
            Disconnect
          </button>
        )}
        <button id="listGrantedBtn" className="secondary small" onClick={onListGranted} disabled={!webHIDSupported} title="Show devices that were previously granted access">
          Show granted
        </button>
      </div>
      <div className="help">
        <b>Not seeing your keyboard in the picker?</b>
        <ul style={{ marginTop: 6, marginBottom: 6, paddingLeft: 22 }}>
          <li>Make sure it's plugged in via <b>USB-C</b> and the mode switch is set to <b>wired</b> (not Bluetooth or 2.4GHz).</li>
          <li>The <b>Show all HID devices</b> option in Settings is on by default — if your keyboard is missing, the filter is too strict. Disable it to broaden.</li>
          <li>If you've connected before, click <b>Show granted</b> to see devices the browser remembers.</li>
          <li>Find the keyboard's real USB IDs: <b>Device Manager → Keyboards → Properties → Details → Hardware IDs</b> on Windows, or <code>lsusb</code> on Linux.</li>
          <li>Then update <b>Vendor ID</b> and <b>Product ID</b> in Settings and reconnect.</li>
        </ul>
        Currently filtering: {settings.showAllDevices
          ? <b>all HID devices</b>
          : <>VID <code>0x{settings.vid.toString(16).toUpperCase().padStart(4,'0')}</code>
              {settings.pid ? <> · PID <code>0x{settings.pid.toString(16).toUpperCase().padStart(4,'0')}</code></> : ' (any product)'}</>
        }.
      </div>
    </div>
  )
}
