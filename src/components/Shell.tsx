import { useEffect, useState } from 'react'
import {
  Lightbulb, Paintbrush, Keyboard, Layers, Settings, Cable, MousePointerClick,
  Plug, Unplug, CircleCheck, CircleAlert, Info, ChevronDown, X, type LucideIcon, Laptop, Send, Copy, Play,
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
        <p className="sidebar__disclaimer">
          v{__APP_VERSION__} · <a className="sidebar__whatsnew" href="https://github.com/jaeef/Ajazz-ak820-Webdriver/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">What’s new</a>
        </p>
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

// Shown where USB can't work: phones (no WebHID) and Firefox/Safari. Instead of a
// dead Connect button it says what the app does and hands the link to a computer.
function OpenOnComputer({ onExplore }: { onExplore: () => void }) {
  const [note, setNote] = useState('')
  const url = location.origin + '/'
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setNote('Link copied. Open it on your computer in Chrome or Edge.') }
    catch { setNote(url) }
  }
  const share = async () => {
    if (!navigator.share) return copy()
    try { await navigator.share({ title: 'AK820 Web Driver', url }) } catch { /* closed the sheet */ }
  }
  return (
    <div className="pitch">
      <BoardRender ariaLabel="AJAZZ AK820" glow="#e3b419" motion="wave" speed={1} level={4} wake />
      <h1>Set up your AK820 right in the browser</h1>
      <p className="pitch__lede">No install, no account. Works on Windows, macOS and Linux, where the official app doesn’t.</p>
      <section className="pitch__desk" aria-label="Open on a computer">
        <p><Laptop aria-hidden /><span>The keyboard connects over USB, which this browser can’t do. Open this page on a computer in <b>Chrome</b> or <b>Edge</b>.</span></p>
        <div className="pitch__actions">
          <button className="btn btn--primary" onClick={share}><Send aria-hidden /> Send link to my computer</button>
          <button className="btn btn--outline" onClick={copy}><Copy aria-hidden /> Copy link</button>
        </div>
        <p className="pitch__note" aria-live="polite">{note}</p>
      </section>
      <button className="btn pitch__demo" onClick={onExplore}><Play aria-hidden /> Try the demo, no keyboard needed</button>
      <ul className="pitch__features">
        <li><Lightbulb aria-hidden /><div><b>Lighting</b><span>18 effects, colour, brightness and speed</span></div></li>
        <li><Paintbrush aria-hidden /><div><b>Per-key colour</b><span>Paint each key its own colour</span></div></li>
        <li><Keyboard aria-hidden /><div><b>Remap and macro</b><span>Move keys around, type text with one key</span></div></li>
        <li><Layers aria-hidden /><div><b>Profiles</b><span>Save setups and switch in one click</span></div></li>
      </ul>
    </div>
  )
}

export function ConnectScreen({ webHIDSupported, settings, onConnect, onExplore }: ConnectProps) {
  if (!webHIDSupported) return <OpenOnComputer onExplore={onExplore} />
  return (
    <div className="connect">
      <BoardRender ariaLabel="AK820, not connected" dim />
      <h1>Connect your AK820</h1>
      <ol className="connect__steps">
        <li><Cable aria-hidden /> Plug it in with USB-C, switch on the back set to wired.</li>
        <li><MousePointerClick aria-hidden /> Click Connect and pick the AK820 in the browser’s list.</li>
      </ol>
      <div className="connect__actions">
        <button className="btn btn--primary btn--lg" onClick={onConnect}><Plug aria-hidden /> Connect keyboard</button>
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
          <li>Keyboard acting strangely? Unplug it and plug it back in. On most AK820s, holding Fn + Space for 5–6 seconds resets it to factory settings.</li>
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
