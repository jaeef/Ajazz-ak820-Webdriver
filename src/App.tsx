import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LightingState, Profile, TabId, PacketSnapshot, CalibrationResult } from './types'

import { Header } from './ui/Header'
import { ConnectionPanel } from './ui/ConnectionPanel'
import { SolidColorPanel } from './ui/SolidColorPanel'
import { EffectsPanel } from './ui/EffectsPanel'
import { ProfilesPanel } from './ui/ProfilesPanel'
import { SettingsPanel } from './ui/SettingsPanel'
import { CapturePanel } from './ui/CapturePanel'
import { KeyRemapPanel } from './ui/KeyRemapPanel'
import { CalibrationModal } from './ui/CalibrationModal'
import { StatusBar } from './ui/StatusBar'
import { ModeEditModal } from './ui/ModeEditModal'

import { modeName, MODE_STATIC, resolveProtocolFamily, hexToRgb, hexDump } from './protocol'
import {
  useDevice, useSettings, useProfiles, useLightingState, useStatus, useActiveTab, useCaptureLog, useCalibration,
} from './hooks'

const TABS: { id: TabId; label: string }[] = [
  { id: 'lighting', label: 'Solid Color' },
  { id: 'effects', label: 'Effects' },
  { id: 'keys', label: 'Keys' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'capture', label: 'Capture' },
  { id: 'settings', label: 'Settings' },
]

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

  // Resolve the wire protocol ONCE per connection/settings change. Disambiguate
  // by VID + PID: the bundled AK820 is 0x0C45/0x1007 = EVision; the AK820 Pro
  // is 0x0C45/0x8009 = Sonix; old Yichip is 0x320F = EVision. See protocol.ts.
  const family = useMemo(
    () => resolveProtocolFamily(settings.protocolFamily, device.info?.vendorId, device.info?.productId),
    [settings.protocolFamily, device.info],
  )

  const { lighting, setLighting, apply, sendPackets } = useLightingState(device.controller, settings, family)
  const capture = useCaptureLog(device.controller)
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
      const base = `Connected to ${di.productName} (VID 0x${di.vendorId.toString(16).toUpperCase().padStart(4,'0')} / PID 0x${di.productId.toString(16).toUpperCase().padStart(4,'0')}).`
      if (di.matchedVendorInterface) {
        ok(base + ' Ready to send lighting.')
      } else {
        err(base + ' ⚠ This entry can’t receive lighting commands. Reconnect and pick the AK820 (wired) device — or turn on “Show all HID devices” in Settings and try another entry.')
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
      const tag = device.isConnected ? 'Sent' : 'Recorded (idle)'
      ok(`${tag}: ${modeName(lighting.mode, settings.modes)}, rgb(${lighting.r},${lighting.g},${lighting.b}), brightness ${lighting.brightness}, speed ${lighting.speed}${lighting.rainbow ? ', rainbow' : ''}`)
    } catch (e) {
      err('Apply failed: ' + (e as Error).message)
    }
  }, [apply, device.isConnected, lighting, settings.modes, ok, err])

  // --- Solid color: pick a full-RGB color and light the whole keyboard in it.
  // Forces Static mode (firmware 0x06) and persists it — when the user applies
  // a solid color, the mode IS Static. The per-key color data in the packet
  // sequence overwrites whatever the previous effect left in the LED buffer.
  const handleSolidColor = useCallback((hex: string) => {
    const { r, g, b } = hexToRgb(hex)
    setLighting({ ...lighting, mode: MODE_STATIC, rainbow: false, r, g, b })
  }, [setLighting, lighting])

  const handleApplySolid = useCallback(() => {
    const next: LightingState = { ...lighting, mode: MODE_STATIC, rainbow: false }
    setLighting(next)
    apply(next).then(() => ok(`${device.isConnected ? 'Sent' : 'Recorded (idle)'} solid color: rgb(${next.r},${next.g},${next.b}), brightness ${next.brightness}`))
                .catch(e => err('Apply failed: ' + (e as Error).message))
  }, [setLighting, apply, lighting, device.isConnected, ok, err])

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
  const handleApplyPerKey = useCallback((packets: Uint8Array[]) => {
    sendPackets(packets).then(() => ok(`${device.isConnected ? 'Sent' : 'Recorded (idle)'} per-key colors (${packets.length} packets)`))
                        .catch(e => err('Per-key apply failed: ' + (e as Error).message))
  }, [sendPackets, device.isConnected, ok, err])

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
    apply(next).then(() => ok(`Loaded profile "${describeLighting(profile, settings.modes)}"`))
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

  return (
    <>
      <Header isLive={device.isConnected} />

      <div className="container">
        <ConnectionPanel
          info={device.info}
          isConnected={device.isConnected}
          isMock={device.controller.isMock}
          webHIDSupported={device.webHIDSupported}
          settings={settings}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onListGranted={handleListGranted}
        />

        <div className="panel">
          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'lighting' && (
            <SolidColorPanel
              lighting={lighting}
              onChange={setLighting}
              onSolidColor={handleSolidColor}
              onApplySolid={handleApplySolid}
              onTestMode={handleTestMode}
              isLive={device.isConnected}
              family={family}
              calibrated={calibrationMap}
            />
          )}

          {activeTab === 'effects' && (
            <EffectsPanel
              lighting={lighting}
              modes={settings.modes}
              onChange={setLighting}
              onApply={handleApply}
              onApplyPerKey={handleApplyPerKey}
              onTestMode={handleTestMode}
              isLive={device.isConnected}
              family={family}
              calibrated={calibrationMap}
            />
          )}

          {activeTab === 'keys' && (
            <KeyRemapPanel isLive={device.isConnected} onSend={handleSendKeymap} />
          )}

          {activeTab === 'profiles' && (
            <ProfilesPanel
              profiles={profiles}
              modes={settings.modes}
              currentLighting={lighting}
              onSave={handleSaveProfile}
              onDelete={handleDeleteProfile}
              onLoad={handleLoadProfile}
              onImport={handleImportProfiles}
            />
          )}

          {activeTab === 'capture' && (
            <CapturePanel
              log={capture.log}
              version={capture.version}
              paused={capture.paused}
              setPaused={capture.setPaused}
              onClear={capture.clear}
              isLive={device.isConnected}
              calibration={calibration.results}
              onRemoveCalibration={calibration.removeResult}
              onClearCalibration={calibration.clearAll}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              settings={settings}
              onChange={handleSettingsChange}
              onEditModes={() => setShowModeModal(true)}
              onReset={handleReset}
            />
          )}
        </div>
      </div>

      <StatusBar status={status} />

      {showModeModal && (
        <ModeEditModal
          modes={settings.modes}
          onClose={() => setShowModeModal(false)}
          onSave={handleSaveModes}
        />
      )}

      {pendingTest && (
        <CalibrationModal
          mode={lighting.mode}
          modeNames={settings.modes}
          lighting={lighting}
          family={family}
          packets={pendingTest.packets}
          isLive={device.isConnected}
          onSave={handleSaveCalibration}
          onClose={() => setPendingTest(null)}
        />
      )}
    </>
  )
}

export default App
