import { useEffect, useState } from 'react'
import {
  Lightbulb, Paintbrush, Keyboard, Layers, Settings, Cable, MousePointerClick,
  Plug, Unplug, CircleCheck, CircleAlert, Info, ChevronDown, X, type LucideIcon,
} from 'lucide-react'
import type { DeviceInfo, Settings as AppSettings, StatusMessage, TabId } from '../lib/types'
import { BoardRender } from './BoardRender'

const NAV: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  { id: 'perkey', label: 'Per-key RGB', icon: Paintbrush },
  { id: 'keys', label: 'Keys & macro', icon: Keyboard },
  { id: 'profiles', label: 'Profiles', icon: Layers },
]
const SETTINGS = { id: 'settings' as TabId, label: 'Settings', icon: Settings }

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
        <img src="/favicon.svg" alt="" className="device__img" />
        <div className="device__text">
          <strong>{info?.productName || 'AJAZZ AK820'}</strong>
          <span><i className="dot" aria-hidden />{isConnected ? 'Connected' : exploring ? 'Demo mode' : 'Not connected'}</span>
        </div>
        {isConnected
          ? <button className="icon-btn" onClick={onDisconnect} aria-label="Disconnect" title="Disconnect"><Unplug aria-hidden /></button>
          : <button className="icon-btn" onClick={onConnect} disabled={!webHIDSupported} aria-label="Connect" title="Connect"><Plug aria-hidden /></button>}
      </div>
      <nav className="nav" aria-label="Sections">
        {NAV.map(item)}
        <span className="nav__sep" aria-hidden />
        {item(SETTINGS)}
      </nav>
      <div className="sidebar__foot">
        <div className="sidebar__credit">
          <span>Developed by</span>
          <a
            href="https://github.com/jaeef"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar__link sidebar__link--github"
            title="GitHub @jaeef"
            aria-label="GitHub @jaeef"
          >
            <svg className="sidebar__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>jaeef</span>
          </a>
        </div>
        <p className="sidebar__disclaimer">Not affiliated with AJAZZ</p>
      </div>
    </aside>
  )
}

interface ConnectProps {
  webHIDSupported: boolean
  settings: AppSettings
  onConnect: () => void
  onExplore: () => void
}

export function ConnectScreen({ webHIDSupported, settings, onConnect, onExplore }: ConnectProps) {
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
          <li>Use the USB-C cable and the wired position of the switch, or try another USB port.</li>
          <li>{settings.showAllDevices
            ? 'Every USB device is listed. The AK820 may show up under its chip name rather than “AK820”.'
            : 'Turn on “Show all HID devices” in Settings to list every USB device.'}</li>
          <li>On Linux, your user may need a udev rule to reach the keyboard.</li>
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
