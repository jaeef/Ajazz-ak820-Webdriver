import { useEffect, useState } from 'react'
import {
  Lightbulb, Paintbrush, Keyboard, Layers, Activity, Settings, Cable, MousePointerClick,
  Plug, Unplug, CircleCheck, CircleAlert, Info, ChevronDown, X, type LucideIcon,
} from 'lucide-react'
import type { DeviceInfo, Settings as AppSettings, StatusMessage, TabId } from '../types'
import boardPhoto from './wired-keyboard.png'
import { BoardRender } from './BoardRender'

const hex4 = (n: number) => n.toString(16).toUpperCase().padStart(4, '0')

const NAV: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  { id: 'perkey', label: 'Per-key RGB', icon: Paintbrush },
  { id: 'keys', label: 'Keys & macro', icon: Keyboard },
  { id: 'profiles', label: 'Profiles', icon: Layers },
]
const ADVANCED: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'capture', label: 'Capture log', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  active: TabId | null
  onNavigate: (t: TabId) => void
  info: DeviceInfo | null
  isConnected: boolean
  exploring: boolean
  webHIDSupported: boolean
  onConnect: () => void
  onDisconnect: () => void
}

export function Sidebar({ active, onNavigate, info, isConnected, exploring, webHIDSupported, onConnect, onDisconnect }: SidebarProps) {
  const item = (n: { id: TabId; label: string; icon: LucideIcon }) => {
    const Icon = n.icon
    return (
      <button key={n.id} className={`nav__item${active === n.id ? ' nav__item--on' : ''}`}
        aria-current={active === n.id ? 'page' : undefined} onClick={() => onNavigate(n.id)}
        disabled={!isConnected && !exploring}>
        <Icon aria-hidden /> {n.label}
      </button>
    )
  }
  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>AK820 Web Driver</strong>
        <span>Unofficial · runs in your browser</span>
      </div>
      <div className={`device${isConnected ? ' device--on' : ''}`}>
        <img src={boardPhoto} alt="" className="device__img" />
        <div className="device__text">
          <strong>{info?.productName || 'AJAZZ AK820'}</strong>
          <span><i className="dot" aria-hidden />{isConnected ? `Connected · ${hex4(info!.vendorId)}:${hex4(info!.productId)}` : exploring ? 'Demo mode' : 'Not connected'}</span>
        </div>
        {isConnected
          ? <button className="icon-btn" onClick={onDisconnect} aria-label="Disconnect" title="Disconnect"><Unplug aria-hidden /></button>
          : <button className="icon-btn" onClick={onConnect} disabled={!webHIDSupported} aria-label="Connect" title="Connect"><Plug aria-hidden /></button>}
      </div>
      <nav className="nav" aria-label="Sections">
        {NAV.map(item)}
        <span className="nav__group">Advanced</span>
        {ADVANCED.map(item)}
      </nav>
      <p className="sidebar__foot">Not affiliated with AJAZZ</p>
    </aside>
  )
}

interface ConnectProps {
  webHIDSupported: boolean
  settings: AppSettings
  onConnect: () => void
  onExplore: () => void
  onListGranted: () => void
}

export function ConnectScreen({ webHIDSupported, settings, onConnect, onExplore, onListGranted }: ConnectProps) {
  return (
    <div className="connect">
      <BoardRender ariaLabel="AK820, not connected" dim />
      <h1>Connect your AK820</h1>
      {!webHIDSupported && (
        <p className="notice notice--error"><CircleAlert aria-hidden /> This browser can’t talk to USB keyboards. Open this page in Chrome or Edge.</p>
      )}
      <ol className="connect__steps">
        <li><Cable aria-hidden /> Plug it in with USB-C, switch on the back set to wired.</li>
        <li><MousePointerClick aria-hidden /> Click Connect and pick the AK820 in the browser’s list.</li>
      </ol>
      <div className="connect__actions">
        <button className="btn btn--primary btn--lg" onClick={onConnect} disabled={!webHIDSupported}><Plug aria-hidden /> Connect keyboard</button>
        <button className="btn btn--outline btn--lg" onClick={onExplore}>Explore without a keyboard</button>
      </div>
      <details className="trouble">
        <summary>Not in the list? <ChevronDown aria-hidden /></summary>
        <ul>
          <li>Use the USB-C cable and the wired position of the switch.</li>
          <li>“Show all HID devices” is {settings.showAllDevices ? 'on' : 'off'} in Settings. {settings.showAllDevices ? 'Every device is listed.' : `Only VID 0x${hex4(settings.vid)}${settings.pid ? ` / PID 0x${hex4(settings.pid)}` : ''} is listed; turn it on to see everything.`}</li>
          <li>Connected before? <button className="link" onClick={onListGranted}>Show devices this browser remembers</button>.</li>
          <li>Find the real USB IDs in Device Manager → Keyboards → Properties → Details → Hardware IDs (Windows) or with <code>lsusb</code> (Linux), then set them in Settings.</li>
        </ul>
      </details>
    </div>
  )
}

const TOAST_ICON = { success: CircleCheck, error: CircleAlert, info: Info, '': Info } as const

export function Toast({ status }: { status: StatusMessage }) {
  const [shown, setShown] = useState(true)
  useEffect(() => {
    setShown(true)
    if (status.type === 'error') return
    const t = window.setTimeout(() => setShown(false), 5000)
    return () => window.clearTimeout(t)
  }, [status])
  if (!status.message || !shown) return null
  const Icon = TOAST_ICON[status.type]
  const [title, ...rest] = status.message.split('\n')
  return (
    <div key={status.message} className={`toast toast--${status.type || 'info'}`} role="status" aria-live="polite">
      <Icon aria-hidden />
      <span className="toast__title">{title}</span>
      <button className="toast__close" onClick={() => setShown(false)} aria-label="Dismiss"><X aria-hidden /></button>
      {rest.length > 0 && <span className="toast__detail">{rest.join('\n')}</span>}
      {status.type !== 'error' && <i className="toast__timer" aria-hidden />}
    </div>
  )
}
