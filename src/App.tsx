import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookmarkPlus, Send } from 'lucide-react'
import type { LightingState, Profile, TabId, PacketSnapshot, CalibrationResult } from './types'

import { Sidebar, ConnectScreen, Toast } from './ui/Shell'
import { LightingPage } from './ui/LightingPage'
import { BoardRender, motionFor } from './ui/BoardRender'
import { KeyboardView } from './ui/KeyboardView'
import { WireFormatInspector } from './ui/WireFormatInspector'
import { ProfilesPanel } from './ui/ProfilesPanel'
import { SettingsPanel } from './ui/SettingsPanel'
import { CapturePanel } from './ui/CapturePanel'
import { KeyRemapPanel } from './ui/KeyRemapPanel'
import { KeyboardOptionsPanel } from './ui/KeyboardOptionsPanel'
import { CalibrationModal } from './ui/CalibrationModal'
import { ModeEditModal } from './ui/ModeEditModal'

import {
  modeName, resolveProtocolFamily, hexDump, rgbToHex, buildApplyPackets, MODE_STATIC,
  readKeyboardOptions, buildKeyboardOptionsPackets, type KeyboardOptions,
} from './protocol'
import {
  useDevice, useSettings, useProfiles, useLightingState, useStatus, useActiveTab, useCaptureLog, useCalibration,
  readLightingBlock,
} from './hooks'

function describeLighting(p: Profile, modes: string[]): string {
  return `${p.name} (${modeName(p.mode, modes)}, rgb(${p.r},${p.g},${p.b}), brightness ${p.brightness})`
}

function App() {
  const device = useDevice()
  const { settings, setSettings, reset: resetSettings } = useSettings()
  const { profiles, addProfile, removeProfile, importProfiles } = useProfiles()
  const { status, setStatus, ok, err, info } = useStatus()
  const [activeTab, setActiveTab] = useActiveTab('lighting')
  const [showModeModal, setShowModeModal] = useState(false)
  // ?demo opens straight into demo mode (shareable link, screenshots).
  const [exploring, setExploring] = useState(() => new URLSearchParams(location.search).has('demo'))

  // Resolve the wire protocol ONCE per connection/settings change. Disambiguate
  // by VID + PID: the bundled AK820 is 0x0C45/0x1007 = EVision; the AK820 Pro
  // is 0x0C45/0x8009 = Sonix; old Yichip is 0x320F = EVision. See protocol.ts.
  const family = useMemo(
    () => resolveProtocolFamily(settings.protocolFamily, device.info?.vendorId, device.info?.productId),
    [settings.protocolFamily, device.info],
  )

  const { lighting, setLighting, apply, sendPackets, applyPerKey } = useLightingState(device.controller, settings, family)
  const capture = useCaptureLog(device.controller)

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
  const calibration = useCalibration()

  // Build a quick lookup map mode→{works,colorWorks} so the LightingPanel
  // dropdown can badge verified modes (✓ works / ✗ broken) without scanning
  // the full results array on every render.
  const calibrationMap = useMemo(() => {
    const m: Record<number, { works: string; colorWorks: string }> = {}
    for (const r of calibration.results) m[r.mode] = { works: r.works, colorWorks: r.colorWorks }
    return m
  }, [calibration.results])

  // Pending test: the packets captured during the last "Test & Approve" send,
  // held until the user answers the modal. `null` = modal closed.
  const [pendingTest, setPendingTest] = useState<{ packets: PacketSnapshot[] } | null>(null)

  // --- Connection ---
  const handleConnect = useCallback(async () => {
    info('Opening device picker…')
    try {
      const di = await device.connect(settings.vid, settings.pid, settings.showAllDevices)
      setExploring(false)
      const base = `Connected to ${di.productName} (VID 0x${di.vendorId.toString(16).toUpperCase().padStart(4,'0')} / PID 0x${di.productId.toString(16).toUpperCase().padStart(4,'0')}).`
      if (di.matchedVendorInterface) {
        ok(base + ' Ready to send lighting.')
      } else {
        err(base + ' This entry can’t receive lighting commands. Reconnect and pick the AK820 (wired) device — or turn on “Show all HID devices” in Settings and try another entry.')
      }
    } catch (e) {
      const errObj = e as DOMException
      if (errObj && errObj.name === 'NotFoundError') {
        info('Connection cancelled.')
      } else {
        err('Connect failed: ' + (errObj?.message || String(e)))
      }
    }
  }, [device, settings.vid, settings.pid, settings.showAllDevices, ok, err, info])

  const handleListGranted = useCallback(async () => {
    if (!('hid' in navigator)) {
      err('WebHID not available in this browser.')
      return
    }
    try {
      const granted = await navigator.hid.getDevices()
      if (granted.length === 0) {
        info('No previously granted HID devices. Click Connect to open the device picker.')
        return
      }
      const lines = granted.map(d =>
        `VID 0x${d.vendorId.toString(16).toUpperCase().padStart(4,'0')} / PID 0x${d.productId.toString(16).toUpperCase().padStart(4,'0')} — ${d.productName || 'Unknown'}`
      )
      ok(`Granted devices (${granted.length}):\n` + lines.join('\n'))
    } catch (e) {
      err('List failed: ' + (e as Error).message)
    }
  }, [ok, err, info])

  const handleDisconnect = useCallback(async () => {
    try {
      await device.disconnect()
      info('Disconnected — back to idle mode. Packets are recorded but not sent.')
    } catch (e) {
      err('Disconnect error: ' + (e as Error).message)
    }
  }, [device, err, info])

  // --- Apply lighting ---
  const handleApply = useCallback(async () => {
    try {
      await apply()
      setLastApplied(lighting)
      const tag = device.isConnected ? 'Sent' : 'Recorded (demo)'
      ok(`${tag}: ${modeName(lighting.mode, settings.modes)}, rgb(${lighting.r},${lighting.g},${lighting.b}), brightness ${lighting.brightness}, speed ${lighting.speed}${lighting.rainbow ? ', rainbow' : ''}`)
    } catch (e) {
      err('Apply failed: ' + (e as Error).message)
    }
  }, [apply, device.isConnected, lighting, settings.modes, ok, err])

  // --- Test & Approve: apply the current mode+color, snapshot the exact
  // packets that went on the wire, then open the approval modal. The user
  // confirms whether the mode works and whether color changes are honored;
  // the answer + the captured packets are saved to the stable-modes table.
  const handleTestMode = useCallback(async () => {
    const before = device.controller.log.length
    try {
      await apply()
    } catch (e) {
      err('Test apply failed: ' + (e as Error).message)
      return
    }
    const sent = device.controller.log.slice(before)
    const snapshots: PacketSnapshot[] = sent.map(e => ({
      dir: e.dir,
      transport: e.transport,
      reportId: e.reportId,
      hex: hexDump(e.data),
      bytes: Array.from(e.data),
      timestamp: e.timestamp,
    }))
    setPendingTest({ packets: snapshots })
    info(`Test sent: ${modeName(lighting.mode, settings.modes)} (${snapshots.length} packet${snapshots.length === 1 ? '' : 's'}). Check the keyboard and approve below.`)
  }, [apply, device.controller, lighting.mode, settings.modes, err, info])

  const handleSaveCalibration = useCallback((result: CalibrationResult) => {
    calibration.saveResult(result)
    ok(`Saved ${result.modeName} (mode ${result.mode}) to stable modes table.`)
  }, [calibration, ok])

  // --- Per-key RGB: send a custom color map built by the KeyboardView ---
  const handleApplyPerKey = useCallback((colorPackets: Uint8Array[]) => {
    applyPerKey(colorPackets).then(() => ok(`${device.isConnected ? 'Sent' : 'Recorded (idle)'} per-key colors`))
                             .catch(e => err('Per-key apply failed: ' + (e as Error).message))
  }, [applyPerKey, device.isConnected, ok, err])

  // --- Keyboard options (Win lock, WASD swap, polling rate): read, change, write back ---
  const readBlock = useCallback(
    () => readLightingBlock(device.controller, settings.reportIdMode, family),
    [device.controller, settings.reportIdMode, family],
  )
  const handleReadOptions = useCallback(async () => {
    const block = await readBlock()
    return block ? readKeyboardOptions(block) : null
  }, [readBlock])
  const handleWriteOptions = useCallback(async (opt: KeyboardOptions) => {
    const block = await readBlock()
    if (!block) { err('Connect the keyboard first: options are read from it before writing.'); return }
    sendPackets(buildKeyboardOptionsPackets(block, opt)).then(() => ok('Sent keyboard options'))
                                                          .catch(e => err('Options apply failed: ' + (e as Error).message))
  }, [readBlock, sendPackets, ok, err])

  // --- Key remap: send the keymap built by KeyRemapPanel ---
  const handleSendKeymap = useCallback((packets: Uint8Array[], what: string) => {
    sendPackets(packets).then(() => ok(`${device.isConnected ? 'Sent' : 'Recorded (idle)'} ${what}`))
                        .catch(e => err('Keymap apply failed: ' + (e as Error).message))
  }, [sendPackets, device.isConnected, ok, err])

  // --- Profile save / load / delete / import ---
  const handleSaveProfile = useCallback((profile: Profile) => {
    addProfile(profile)
    ok(`Saved profile "${profile.name}"`)
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
    apply(next).then(() => { setLastApplied(next); ok(`Loaded profile "${describeLighting(profile, settings.modes)}"`) })
               .catch(e => err('Apply failed: ' + (e as Error).message))
  }, [setLighting, apply, settings.modes, ok, err])

  const handleDeleteProfile = useCallback((name: string) => {
    removeProfile(name)
    setStatus(`Deleted profile "${name}"`)
  }, [removeProfile, setStatus])

  const handleImportProfiles = useCallback((data: unknown) => {
    importProfiles(data)
    const n = Array.isArray(data) ? data.length : 0
    ok(`Imported ${n} profile(s).`)
  }, [importProfiles, ok])

  // --- Settings: VID/PID changes reconnect if needed ---
  const handleSettingsChange = useCallback((next: typeof settings) => {
    setSettings(next)
    if (device.isConnected) {
      // changing VID/PID mid-session is unusual; warn but don't auto-reconnect
      info('Settings changed. Disconnect and reconnect to apply a new VID/PID filter.')
    }
  }, [setSettings, device.isConnected, info])

  // --- Reset all ---
  const handleReset = useCallback(() => {
    if (!confirm('Clear all profiles, settings, and calibration data? This cannot be undone.')) return
    resetSettings()
    calibration.clearAll()
    setTimeout(() => location.reload(), 50)
  }, [resetSettings, calibration])

  // --- Mode name editor ---
  const handleSaveModes = useCallback((next: string[]) => {
    setSettings({ ...settings, modes: next })
    setShowModeModal(false)
    ok('Mode names saved.')
  }, [setSettings, settings, ok])

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

  const applyPackets = useMemo(() => buildApplyPackets(lighting, family), [lighting, family])
  const glow = rgbToHex(lighting.r, lighting.g, lighting.b)
  const ready = device.isConnected || exploring
  const page = ready ? activeTab : 'lighting'

  const stage = (withApply: boolean) => (
    <div className="stage stage--split">
      <div className="stage__board">
        <div className="pills" aria-live="polite">
          <span className={`pill${device.isConnected ? ' pill--ok' : ' pill--demo'}`}>{device.isConnected ? 'Connected' : 'Demo mode · nothing is sent'}</span>
          <span className="pill">{lighting.mode === MODE_STATIC ? 'Solid colour' : modeName(lighting.mode, settings.modes)} · {glow.toUpperCase()}</span>
          {withApply && (
            <div className="applybar">
              <span className={`apply__state${unsent.length ? ' apply__state--pending' : ''}`} aria-live="polite">
                {unsent.length ? <>Not sent yet: {unsent.join(', ')}</> : 'Keyboard matches'}
              </span>
              <button className="btn btn--primary" onClick={handleApply}><Send aria-hidden /> Apply to keyboard <kbd>Ctrl Enter</kbd></button>
            </div>
          )}
        </div>
        <BoardRender ariaLabel={`Keyboard preview: ${modeName(lighting.mode, settings.modes)}, colour ${glow}`}
          glow={glow} rainbow={lighting.rainbow} dim={lighting.brightness === 0} level={lighting.brightness}
          motion={motionFor(lighting.mode)} speed={lighting.speed} wake />
      </div>
      <section className="panel quick" aria-labelledby="quick-h">
        <h2 id="quick-h">Profiles</h2>
        {profiles.length === 0 && <p className="muted">No profiles yet. Save the current lighting to switch back in one click.</p>}
        <ul>
          {profiles.slice(0, 5).map(p => (
            <li key={p.name}>
              <button className="quick__item" onClick={() => handleLoadProfile(p)}>
                <i style={{ background: rgbToHex(p.r, p.g, p.b) }} aria-hidden />
                <span>{p.name}</span><em>{modeName(p.mode, settings.modes)}</em>
              </button>
            </li>
          ))}
        </ul>
        <button className="btn btn--ghost btn--block" onClick={() => setActiveTab('profiles')}><BookmarkPlus aria-hidden /> Save current</button>
      </section>
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
            onExplore={() => { setExploring(true); info('Demo mode: changes are recorded in the Capture log, nothing is sent.') }}
            onListGranted={handleListGranted} />
        )}

        {ready && page === 'lighting' && (
          <div className="page">
            {stage(true)}
            <LightingPage lighting={lighting} modes={settings.modes} onChange={setLighting} onTestMode={handleTestMode} />
          </div>
        )}

        {ready && page === 'perkey' && (
          <KeyboardView lighting={lighting} isLive={device.isConnected} family={family} onApplyPerKey={handleApplyPerKey} />
        )}

        {ready && page === 'keys' && (
          <KeyRemapPanel isLive={device.isConnected} onSend={handleSendKeymap}
            aside={<KeyboardOptionsPanel isLive={device.isConnected} onRead={handleReadOptions} onWrite={handleWriteOptions} />} />
        )}

        {ready && page === 'profiles' && (
          <div className="page">
            {stage(false)}
            <section className="panel" aria-label="Profiles">
              <ProfilesPanel profiles={profiles} modes={settings.modes} currentLighting={lighting}
                onSave={handleSaveProfile} onDelete={handleDeleteProfile} onLoad={handleLoadProfile} onImport={handleImportProfiles} />
            </section>
          </div>
        )}

        {ready && page === 'capture' && (
          <div className="page">
            <section className="panel" aria-label="What the next Apply sends">
              <WireFormatInspector packets={applyPackets} family={family} />
            </section>
            <section className="panel" aria-label="Capture log">
              <CapturePanel log={capture.log} version={capture.version} paused={capture.paused} setPaused={capture.setPaused}
                onClear={capture.clear} isLive={device.isConnected} calibration={calibration.results}
                onRemoveCalibration={calibration.removeResult} onClearCalibration={calibration.clearAll} />
            </section>
          </div>
        )}

        {ready && page === 'settings' && (
          <div className="page">
            <section className="panel" aria-label="Settings">
              <SettingsPanel settings={settings} onChange={handleSettingsChange} onEditModes={() => setShowModeModal(true)} onReset={handleReset} />
            </section>
          </div>
        )}
      </main>

      <Toast status={status} />

      {showModeModal && (
        <ModeEditModal modes={settings.modes} onClose={() => setShowModeModal(false)} onSave={handleSaveModes} />
      )}

      {pendingTest && (
        <CalibrationModal mode={lighting.mode} modeNames={settings.modes} lighting={lighting} family={family}
          packets={pendingTest.packets} isLive={device.isConnected} onSave={handleSaveCalibration} onClose={() => setPendingTest(null)} />
      )}
    </div>
  )
}

export default App
