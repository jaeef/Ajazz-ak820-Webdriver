import { useCallback, useEffect, useState } from 'react'
import type { LightingState, Profile, TabId } from './types'

import { Header } from './ui/Header'
import { ConnectionPanel } from './ui/ConnectionPanel'
import { LightingPanel } from './ui/LightingPanel'
import { EffectsPanel } from './ui/EffectsPanel'
import { ProfilesPanel } from './ui/ProfilesPanel'
import { SettingsPanel } from './ui/SettingsPanel'
import { StatusBar } from './ui/StatusBar'
import { ModeEditModal } from './ui/ModeEditModal'

import { modeName, MODE_STATIC, resolveProtocolFamily, hexToRgb } from './protocol'
import {
  useDevice, useSettings, useProfiles, useLightingState, useStatus, useActiveTab,
} from './hooks'

const TABS: { id: TabId; label: string }[] = [
  { id: 'lighting', label: 'Lighting' },
  { id: 'effects', label: 'Effects' },
  { id: 'profiles', label: 'Profiles' },
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

  const { lighting, setLighting, apply, sendPackets } = useLightingState(device.controller, settings, resolveProtocolFamily(settings.protocolFamily, device.info?.vendorId))

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
  // Forces Static mode (firmware 0x06), the one mode both EVision and Sonix
  // honor the R/G/B bytes for. Picks update state immediately so the wire
  // preview reflects Static + color; the apply passes an explicit override so
  // there's no stale-state race between picking and clicking Apply.
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

  // --- Per-key RGB: send a custom color map built by the KeyboardView ---
  const handleApplyPerKey = useCallback((packets: Uint8Array[]) => {
    sendPackets(packets).then(() => ok(`${device.isConnected ? 'Sent' : 'Recorded (idle)'} per-key colors (${packets.length} packets)`))
                        .catch(e => err('Per-key apply failed: ' + (e as Error).message))
  }, [sendPackets, device.isConnected, ok, err])

  // --- Live color sink for the Effects tab (Audio React / Screen Color) ---
  // Pushes a Static-color frame using the current brightness. Effects call this
  // many times a second; apply() already serializes onto the working transport.
  const pushColor = useCallback((r: number, g: number, b: number) => {
    return apply({ ...lighting, mode: MODE_STATIC, r, g, b, rainbow: false })
  }, [apply, lighting])

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
    if (!confirm('Clear all profiles and settings? This cannot be undone.')) return
    resetSettings()
    setTimeout(() => location.reload(), 50)
  }, [resetSettings])

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
            <LightingPanel
              lighting={lighting}
              modes={settings.modes}
              onChange={setLighting}
              onSolidColor={handleSolidColor}
              onApply={handleApply}
              onApplySolid={handleApplySolid}
              onApplyPerKey={handleApplyPerKey}
              isLive={device.isConnected}
              family={resolveProtocolFamily(settings.protocolFamily, device.info?.vendorId)}
            />
          )}

          {activeTab === 'effects' && (
            <EffectsPanel sink={pushColor} isLive={device.isConnected} />
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
    </>
  )
}

export default App
