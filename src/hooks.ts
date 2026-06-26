import { useCallback, useEffect, useRef, useState } from 'react'
import type { DeviceInfo, LightingState, Profile, Settings, StatusMessage, TabId } from './types'
import type { DeviceController } from './device'
import { MockController, WebHIDController } from './device'
import { profileStore, settingsStore } from './store'
import { defaultSettings } from './store'
import { DEFAULT_LIGHTING, buildLightingPacket, buildSolidColorPackets, isPerKeyMode, resolveSend } from './protocol'
import type { ReportIdMode } from './types'

// Send one fully-built 64-byte packet, choosing transport (OUTPUT vs feature)
// and report-ID split from what the device actually declares. EVision uses
// OUTPUT reports; demo/mock has no declared reports so we default to output.
async function sendPacket(
  controller: DeviceController,
  reportIdMode: ReportIdMode,
  pkt: Uint8Array,
): Promise<void> {
  const useOutput =
    controller.outputReportIds.length > 0 || controller.featureReportIds.length === 0
  const ids = useOutput ? controller.outputReportIds : controller.featureReportIds
  const { reportId, data } = resolveSend(pkt, reportIdMode, ids)
  if (useOutput) await controller.sendOutputReport(reportId, data)
  else await controller.sendFeatureReport(reportId, data)
}

// =====================================================================
// useDevice — owns the controller + connection lifecycle
// =====================================================================
export function useDevice() {
  const [controller, setController] = useState<DeviceController>(new MockController())
  const [info, setInfo] = useState<DeviceInfo | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [webHIDSupported, setWebHIDSupported] = useState(true)
  const controllerRef = useRef(controller)
  controllerRef.current = controller

  useEffect(() => {
    setWebHIDSupported(typeof navigator !== 'undefined' && 'hid' in navigator)
  }, [])

  const connect = useCallback(async (vid: number, pid: number, showAll: boolean) => {
    const next = new WebHIDController()
    const deviceInfo = await next.connect(vid, pid, showAll)
    setController(next)
    setInfo(deviceInfo)
    setIsConnected(true)
    return deviceInfo
  }, [])

  const disconnect = useCallback(async () => {
    try {
      await controllerRef.current.disconnect()
    } finally {
      setController(new MockController())
      setInfo(null)
      setIsConnected(false)
    }
  }, [])

  const switchToMock = useCallback(() => {
    setController(new MockController())
    setInfo(null)
    setIsConnected(false)
  }, [])

  return { controller, info, isConnected, webHIDSupported, connect, disconnect, switchToMock }
}

// =====================================================================
// useSettings — load + persist Settings
// =====================================================================
export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(() => settingsStore.load())

  const setSettings = useCallback((updater: Settings | ((prev: Settings) => Settings)) => {
    setSettingsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      settingsStore.save(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    settingsStore.reset()
    setSettingsState(defaultSettings())
  }, [])

  return { settings, setSettings, reset }
}

// =====================================================================
// useProfiles — load + persist Profile[]
// =====================================================================
export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>(() => profileStore.load())

  const refresh = useCallback(() => setProfiles(profileStore.load()), [])

  const addProfile = useCallback((profile: Profile) => {
    setProfiles(profileStore.add(profile))
  }, [])

  const removeProfile = useCallback((name: string) => {
    setProfiles(profileStore.remove(name))
  }, [])

  const importProfiles = useCallback((data: unknown) => {
    if (!Array.isArray(data)) throw new Error('Imported file is not a profile array')
    profileStore.save(data as Profile[])
    setProfiles(data as Profile[])
  }, [])

  return { profiles, addProfile, removeProfile, importProfiles, refresh }
}

// =====================================================================
// useLightingState — owns the live LightingState, applies on demand
// =====================================================================
export function useLightingState(controller: DeviceController, settings: Settings) {
  const [lighting, setLightingState] = useState<LightingState>(DEFAULT_LIGHTING)

  const setLighting = useCallback((updater: LightingState | ((prev: LightingState) => LightingState)) => {
    setLightingState(prev => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])

  const apply = useCallback(async (override?: LightingState) => {
    const l = override ?? lighting
    // Per-key "Solid Color" sends a mode switch + a sequence of LED color
    // packets for accurate full-RGB; effect modes are a single packet.
    const packets = isPerKeyMode(l.mode) ? buildSolidColorPackets(l) : [buildLightingPacket(l)]
    for (const pkt of packets) {
      await sendPacket(controller, settings.reportIdMode, pkt)
    }
  }, [controller, lighting, settings.reportIdMode])

  return { lighting, setLighting, apply }
}

// =====================================================================
// useStatus — last feedback message
// =====================================================================
export function useStatus() {
  const [status, setStatus] = useState<StatusMessage>({
    message: 'Ready. Idle — no hardware needed. Click Connect when your keyboard is plugged in.',
    type: '',
  })

  const update = useCallback((message: string, type: StatusMessage['type'] = '') => {
    setStatus({ message, type })
  }, [])

  const ok = useCallback((m: string) => update(m, 'success'), [update])
  const err = useCallback((m: string) => update(m, 'error'), [update])
  const info = useCallback((m: string) => update(m, 'info'), [update])

  return { status, setStatus: update, ok, err, info }
}

// =====================================================================
// useActiveTab — selected tab id
// =====================================================================
export function useActiveTab(initial: TabId = 'lighting') {
  const [tab, setTab] = useState<TabId>(initial)
  return [tab, setTab] as const
}
