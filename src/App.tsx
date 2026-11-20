import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookmarkPlus, Send } from 'lucide-react'
import type { LightingState, Profile, TabId } from './lib/types'

import { Sidebar, ConnectScreen, Toast } from './components/Shell'
import { LightingPage } from './components/LightingPage'
import { BoardRender, KeySoundToggle, motionFor, setLeds } from './components/BoardRender'
import { KeyboardView } from './components/KeyboardView'
import { ProfilesPanel } from './components/ProfilesPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { KeyRemapPanel } from './components/KeyRemapPanel'
import { KeyboardOptionsPanel } from './components/KeyboardOptionsPanel'
import { Dialog } from './components/Dialog'

import {
  modeName, resolveProtocolFamily, rgbToHex, MODE_STATIC, MAX_SPEED,
  readKeyboardOptions, buildKeyboardOptionsPackets, type KeyboardOptions,
} from './lib/protocol'
import {
  useDevice, useSettings, useProfiles, useLightingState, useStatus, useActiveTab,
  readLightingBlock, readKeymap, exclusive, friendlyError,
} from './lib/hooks'

function describeLighting(p: Profile, modes: string[]): string {
  return `${p.name} · ${p.mode === MODE_STATIC ? 'Solid colour' : modeName(p.mode, modes)} · ${rgbToHex(p.r, p.g, p.b).toUpperCase()} · brightness ${p.brightness}`
}

function App() {
  const device = useDevice()
  const { settings, setSettings, reset: resetSettings } = useSettings()
  const { profiles, addProfile, removeProfile, importProfiles } = useProfiles()
  const { status, setStatus, ok, err, info } = useStatus()
  const [activeTab, setActiveTab] = useActiveTab('lighting')
  // ?demo opens straight into demo mode (shareable link, screenshots).
  const [confirmReset, setConfirmReset] = useState(false)
  const [exploring, setExploring] = useState(() => new URLSearchParams(location.search).has('demo'))

  // Resolve the wire protocol ONCE per connection/settings change. Disambiguate
  // by VID + PID: the bundled AK820 is 0x0C45/0x1007 = EVision; the AK820 Pro
  // is 0x0C45/0x8009 = Sonix; old Yichip is 0x320F = EVision. See protocol.ts.
  const family = useMemo(
    () => resolveProtocolFamily(settings.protocolFamily, device.info?.vendorId, device.info?.productId),
    [settings.protocolFamily, device.info],
  )

  const { lighting, setLighting, apply, sendPackets, applyPerKey } = useLightingState(device.controller, settings, family)

  // What the keyboard last received, so the Apply panel can say what is unsent.
  const [lastApplied, setLastApplied] = useState<LightingState | null>(null)
  const unsent = useMemo(() => {
    const a = lastApplied
    if (!a) return ['everything']
    const out: string[] = []
    if (a.mode !== lighting.mode) out.push('effect')
    if (a.r !== lighting.r || a.g !== lighting.g || a.b !== lighting.b) out.push('colour')
    if (a.brightness !== lighting.brightness) out.push('brightness')
    if (a.speed !== lighting.speed) out.push('speed')
    if (a.direction !== lighting.direction) out.push('direction')
    if (a.rainbow !== lighting.rainbow) out.push('random colours')
    return out
  }, [lastApplied, lighting])

  // --- Connection ---
  const handleConnect = useCallback(async () => {
    info('Choose your AK820\nPick it in the list the browser just opened.')
    try {
      const di = await device.connect(settings.vid, settings.pid, settings.showAllDevices)
      setExploring(false)
      if (di.matchedVendorInterface) {
        ok(`Connected to ${di.productName || 'AK820'}\nPick an effect, then press Apply.`)
      } else {
        err(`This entry can’t take lighting commands\nReconnect and pick the AK820 (wired), or turn on “Show all HID devices” in Settings and try another entry.`)
      }
    } catch (e) {
      const errObj = e as DOMException
      if (errObj && errObj.name === 'NotFoundError') {
        info('Connection cancelled\nNothing was changed.')
      } else {
        err('Couldn’t connect\n' + friendlyError(e))
      }
    }
  }, [device, settings.vid, settings.pid, settings.showAllDevices, ok, err, info])

  const handleDisconnect = useCallback(async () => {
    try {
      await device.disconnect()
      info('Disconnected\nYour keyboard keeps its last settings. Connect again to pick it in the browser list.')
    } catch (e) {
      err('Disconnect error: ' + friendlyError(e))
    }
  }, [device, err, info])

  // --- Auto-reconnect ---
  // A page reload closes the device, but the browser remembers the permission:
  // reopen it on load and whenever the keyboard is plugged back in.
  // Unplugging drops back to the connect screen.
  const reconnecting = useRef(false)
  const { isConnected, info: devInfo, reconnect, switchToMock } = device
  useEffect(() => {
    if (!('hid' in navigator)) return
    const tryReconnect = () => {
      if (isConnected || reconnecting.current) return
      reconnecting.current = true
      reconnect(settings.vid, settings.pid)
        .then(di => { if (di) { setExploring(false); ok(`Reconnected to ${di.productName || 'AK820'}\nPicked up the keyboard this browser remembers.`) } })
        .catch(e => console.info('[ak820] auto-reconnect failed:', e))
        .finally(() => { reconnecting.current = false })
    }
    const onUnplug = (e: Event) => {
      const d = (e as HIDConnectionEvent).device
      if (isConnected && d.vendorId === devInfo?.vendorId && d.productId === devInfo?.productId) {
        switchToMock()
        err('Keyboard unplugged\nPlug it back in and it reconnects on its own.')
      }
    }
    // A replug arrives as one connect event per interface; wait for the last one.
    let timer = 0
    const onPlug = () => { clearTimeout(timer); timer = window.setTimeout(tryReconnect, 600) }
    tryReconnect()
    navigator.hid.addEventListener('connect', onPlug)
    navigator.hid.addEventListener('disconnect', onUnplug)
    return () => {
      clearTimeout(timer)
      navigator.hid.removeEventListener('connect', onPlug)
      navigator.hid.removeEventListener('disconnect', onUnplug)
    }
  }, [isConnected, devInfo, reconnect, switchToMock, settings.vid, settings.pid, ok, err])

  // --- Apply lighting ---
  const handleApply = useCallback(async () => {
    try {
      await apply()
      setLastApplied(lighting)
      const what = lighting.mode === MODE_STATIC ? 'Solid colour' : modeName(lighting.mode, settings.modes)
      ok(`${device.isConnected ? 'Applied to keyboard' : 'Recorded in demo mode'}\n${what} · ${rgbToHex(lighting.r, lighting.g, lighting.b).toUpperCase()} · brightness ${lighting.brightness}${lighting.mode === MODE_STATIC ? '' : ` · speed ${MAX_SPEED - lighting.speed + 1}`}${lighting.rainbow ? ' · random colours' : ''}`)
    } catch (e) {
      err('Couldn’t apply\n' + friendlyError(e))
    }
  }, [apply, device.isConnected, lighting, settings.modes, ok, err])

  // --- Per-key RGB: send a custom color map built by the KeyboardView ---
  const handleApplyPerKey = useCallback((colorPackets: Uint8Array[]) => {
    applyPerKey(colorPackets).then(() => ok(`${device.isConnected ? 'Per-key colours applied' : 'Per-key colours recorded (demo)'}\nThe board switched to Custom mode.`))
                             .catch(e => err('Couldn’t apply per-key colours\n' + friendlyError(e)))
  }, [applyPerKey, device.isConnected, ok, err])

  // --- Keyboard options (Win lock, WASD swap, polling rate): read, change, write back ---
  const readBlock = useCallback(
    () => exclusive(() => readLightingBlock(device.controller, settings.reportIdMode, family)),
    [device.controller, settings.reportIdMode, family],
  )
  const handleReadOptions = useCallback(async () => {
    const block = await readBlock()
    const opt = block ? readKeyboardOptions(block) : null
    setLeds({ win: !!opt?.winLock })
    return opt
  }, [readBlock])
  // Light the W LED from the keyboard's real Win-lock state as soon as it connects.
  useEffect(() => { if (device.isConnected) void handleReadOptions(); else setLeds({ win: false }) }, [device.isConnected, handleReadOptions])
  const handleWriteOptions = useCallback(async (opt: KeyboardOptions) => {
    const block = await readBlock()
    if (!block) { err('Connect the keyboard first\nOptions are read from it before anything is written.'); return }
    sendPackets(buildKeyboardOptionsPackets(block, opt)).then(() => setLeds({ win: opt.winLock })).then(() => ok(`Keyboard options saved\nWindows lock ${opt.winLock ? 'on' : 'off'} · WASD swap ${opt.wasdSwap ? 'on' : 'off'} · ${['1000', '500', '250', '125'][opt.pollingRate]} Hz`))
                                                          .catch(e => err('Couldn’t save keyboard options\n' + friendlyError(e)))
  }, [readBlock, sendPackets, ok, err])

  // --- Key remap: send the keymap built by KeyRemapPanel ---
  const handleSendKeymap = useCallback((packets: Uint8Array[], what: string) => {
    return sendPackets(packets).then(() => ok(`${device.isConnected ? 'Sent to keyboard' : 'Recorded (demo)'}\n${what[0].toUpperCase()}${what.slice(1)}`))
                              .catch(e => err('Couldn’t save the keymap\n' + friendlyError(e)))
  }, [sendPackets, device.isConnected, ok, err])

  const handleReadKeymap = useCallback(
    () => exclusive(() => readKeymap(device.controller, settings.reportIdMode, family)),
    [device.controller, settings.reportIdMode, family],
  )

  // --- Profile save / load / delete / import ---
  const handleSaveProfile = useCallback((profile: Profile) => {
    addProfile(profile)
    ok(`Profile saved\n“${profile.name}” is in the list beside the keyboard.`)
  }, [addProfile, ok])

  const handleLoadProfile = useCallback((profile: Profile) => {
    const next: LightingState = {
      mode: profile.mode,
      r: profile.r, g: profile.g, b: profile.b,
      brightness: profile.brightness,
      speed: profile.speed,
      direction: profile.direction,
      rainbow: profile.rainbow,
    }
    setLighting(next)
    // Pass `next` explicitly so the packet reflects the just-loaded state,
    // not the stale value captured by `apply`'s closure.
    apply(next).then(() => { setLastApplied(next); ok(`Profile loaded\n${describeLighting(profile, settings.modes)}`) })
               .catch(e => err('Couldn’t load the profile\n' + friendlyError(e)))
  }, [setLighting, apply, settings.modes, ok, err])

  const handleDeleteProfile = useCallback((name: string) => {
    removeProfile(name)
    info(`Profile deleted\n“${name}” was removed from this browser.`)
  }, [removeProfile, setStatus])

  const handleImportProfiles = useCallback((data: unknown) => {
    const n = importProfiles(data)
    ok(`Profiles imported\n${n} profile${n === 1 ? '' : 's'} added or updated.`)
  }, [importProfiles, ok])

  // --- Settings: VID/PID changes reconnect if needed ---
  const handleSettingsChange = useCallback((next: typeof settings) => {
    setSettings(next)
    if (device.isConnected) {
      // changing VID/PID mid-session is unusual; warn but don't auto-reconnect
      info('Setting saved\nReconnect for a new device filter to take effect.')
    }
  }, [setSettings, device.isConnected, info])

  // --- Reset all ---
  const handleReset = useCallback(() => {
    resetSettings()
    setTimeout(() => location.reload(), 50)
  }, [resetSettings])

  // --- Global shortcut: Ctrl+Enter to apply ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleApply()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleApply])

  const glow = rgbToHex(lighting.r, lighting.g, lighting.b)
  const ready = device.isConnected || exploring
  const page = ready ? activeTab : 'lighting'

  const stage = (
    <div className="stage">
      <div className="stage__board">
        <BoardRender ariaLabel={`Keyboard preview: ${modeName(lighting.mode, settings.modes)}, colour ${glow}`}
          glow={glow} rainbow={lighting.rainbow} dim={lighting.brightness === 0} level={lighting.brightness}
          motion={motionFor(lighting.mode)} speed={lighting.speed} wake />
      </div>
    </div>
  )

  return (
    <div className="app">
      <Sidebar active={ready ? page : null} onNavigate={setActiveTab} info={device.info} isConnected={device.isConnected}
        exploring={exploring} webHIDSupported={device.webHIDSupported}
        onConnect={handleConnect} onDisconnect={handleDisconnect} />

      <main className="main" key={ready ? page : 'connect'}>
        {!ready && (
          <ConnectScreen webHIDSupported={device.webHIDSupported} settings={settings} onConnect={handleConnect}
            onExplore={() => { setExploring(true); info('Demo mode\nTry everything; nothing is sent to a keyboard.') }} />
        )}

        {ready && ['lighting', 'perkey', 'keys', 'profiles'].includes(page) && (
          <div className="topbar">
            <div className="pills" aria-live="polite">
              <span className={`pill${device.isConnected ? ' pill--ok' : ' pill--demo'}`}>{device.isConnected ? 'Connected' : 'Demo mode · nothing is sent'}</span>
              <span className="pill">{lighting.mode === MODE_STATIC ? 'Solid colour' : modeName(lighting.mode, settings.modes)} · {glow.toUpperCase()}</span>
            </div>
            <KeySoundToggle />
          </div>
        )}

        {ready && page === 'lighting' && (
          <div className="page page--fit page--fill">
            {stage}
            <LightingPage lighting={lighting} modes={settings.modes} onChange={setLighting} footer={
              <div className="effect-foot">
                <div className="chips" aria-label="Profiles">
                  <span className="chips__label">Profiles</span>
                  {profiles.slice(0, 4).map(p => (
                    <button key={p.name} className="chip" onClick={() => handleLoadProfile(p)} title={`Load ${p.name}`}>
                      <i style={{ background: rgbToHex(p.r, p.g, p.b) }} aria-hidden />{p.name}
                    </button>
                  ))}
                  <button className="chip chip--add" onClick={() => setActiveTab('profiles')}><BookmarkPlus aria-hidden /> Save current</button>
                </div>
                <div className="applybar">
                  <span className={`apply__state${unsent.length ? ' apply__state--pending' : ''}`} aria-live="polite">
                    {!lastApplied ? 'Not sent yet' : unsent.length ? <>Not sent: {unsent.join(', ')}</> : 'Keyboard matches'}
                  </span>
                  <button className="btn btn--primary" onClick={handleApply}><Send aria-hidden /> Apply to keyboard <kbd>Ctrl Enter</kbd></button>
                </div>
              </div>
            } />
          </div>
        )}

        {ready && page === 'perkey' && (
          <KeyboardView lighting={lighting} isLive={device.isConnected} family={family} onApplyPerKey={handleApplyPerKey} />
        )}

        {ready && page === 'keys' && (
          <KeyRemapPanel isLive={device.isConnected} onSend={handleSendKeymap} onRead={handleReadKeymap}
            aside={<KeyboardOptionsPanel isLive={device.isConnected} onRead={handleReadOptions} onWrite={handleWriteOptions} />} />
        )}

        {ready && page === 'profiles' && (
          <div className="page page--fit page--fill">
            {stage}
            <section className="panel" aria-label="Profiles">
              <ProfilesPanel profiles={profiles} modes={settings.modes} currentLighting={lighting}
                onSave={handleSaveProfile} onDelete={handleDeleteProfile} onLoad={handleLoadProfile} onImport={handleImportProfiles} />
            </section>
          </div>
        )}

        {ready && page === 'settings' && (
          <div className="page page--settings">
            <section className="panel" aria-label="Settings">
              <SettingsPanel settings={settings} onChange={handleSettingsChange} onReset={() => setConfirmReset(true)} />
            </section>
          </div>
        )}
      </main>

      <Toast status={status} />

      {confirmReset && (
        <Dialog title="Clear everything?" onClose={() => setConfirmReset(false)} actions={<>
          <button className="btn btn--outline" onClick={() => setConfirmReset(false)}>Keep my data</button>
          <button className="btn btn--danger" onClick={handleReset}>Clear all</button>
        </>}>
          <p className="muted">This removes {profiles.length} profile{profiles.length === 1 ? '' : 's'}, and your settings from this browser. The keyboard itself keeps its settings. This can’t be undone.</p>
        </Dialog>
      )}

    </div>
  )
}

export default App
