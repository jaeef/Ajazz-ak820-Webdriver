import { useCallback, useEffect, useRef, useState } from 'react'
import type { DeviceInfo, LightingState, Profile, Settings, StatusMessage, TabId, ProtocolFamilyResolved, PacketLogEntry, CalibrationResult } from './types'
import type { DeviceController } from './device'
import { MockController, WebHIDController } from './device'
import { profileStore, settingsStore, calibrationStore } from './store'
import { defaultSettings } from './store'
import {
  DEFAULT_LIGHTING, buildApplyPackets, buildCustomModePacket, buildReadPacket, resolveSend,
  CMD_READ_LIGHTING, LIGHTING_BLOCK_LEN,
} from './protocol'
import type { ReportIdMode } from './types'

// Send one fully-built 64-byte packet, choosing transport (OUTPUT vs feature)
// and report-ID split from the device's declared reports.
//   • EVision (0x320F): OUTPUT report, cmd 0x06 frame (byte 0 = 0x04 prefix).
//   • Sonix  (0x0C45): FEATURE report, mode at byte 0, reportId 0x00 + 64-byte
//     payload (or reportId = mode + 63-byte payload if the descriptor is
//     numbered — selected by Report ID mode = native).
async function sendPacket(
  controller: DeviceController,
  reportIdMode: ReportIdMode,
  pkt: Uint8Array,
  family: ProtocolFamilyResolved,
): Promise<void> {
  if (family === 'sonix') {
    // Sonix lighting lives on a FEATURE report. Default to the unnumbered
    // form (reportId 0, mode as payload byte 0) per docs/legacy-protocol-notes.md; 'native'
    // is the escape hatch for a numbered feature descriptor.
    const ids = controller.featureReportIds.length > 0 ? controller.featureReportIds : [0]
    const effective = reportIdMode === 'auto' ? 'payload' : reportIdMode
    const { reportId, data } = resolveSend(pkt, effective, ids)
    await controller.sendFeatureReport(reportId, data)
    return
  }
  // EVision: OUTPUT report; fall back to feature only if the device declares
  // no output reports (mock/demo has none — output is the safe default).
  const useOutput =
    controller.outputReportIds.length > 0 || controller.featureReportIds.length === 0
  const ids = useOutput ? controller.outputReportIds : controller.featureReportIds
  const { reportId, data } = resolveSend(pkt, reportIdMode, ids)
  if (useOutput) await controller.sendOutputReport(reportId, data)
  else await controller.sendFeatureReport(reportId, data)
}

// Gap between successive packets in a multi-packet send. OpenRGB's reference
// EVision driver does a blocking hid_read after every hid_write, which paces
// the stream so the firmware can ingest each 64-byte frame. WebHID's
// sendReport resolves as soon as the OS accepts the buffer, so without a gap
// the per-key Custom color chunks (mode-select + 7 cmd-0x11 chunks) fire
// back-to-back and the firmware drops the color data — only the mode-switch
// lands, which is why "Custom mode switches but the picked color never shows".
// 30ms empirically matches the read-after-write cadence and is far below the
// threshold a user notices on a one-shot Apply.
const PACKET_GAP_MS = 30

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// Send a read request (cmd, len, offset) and resolve with the `len` reply
// bytes, or null on timeout / demo mode. The keyboard answers on input report 4
// with the request header followed by the data.
async function readReply(
  controller: DeviceController, reportIdMode: ReportIdMode, family: ProtocolFamilyResolved,
  pkt: Uint8Array, len: number, timeoutMs = 300,
): Promise<Uint8Array | null> {
  if (controller.isMock || family !== 'evision') return null
  return new Promise(resolve => {
    let timer = 0
    const off = controller.onPacket(e => {
      if (e.dir !== 'in') return
      const d = e.reportId === 0 ? e.data.subarray(1) : e.data // drop prefix on unnumbered reports
      if (d[2] !== pkt[3] || d[3] !== pkt[4] || d[4] !== pkt[5] || d[5] !== pkt[6]) return
      window.clearTimeout(timer); off(); resolve(d.slice(7, 7 + len))
    })
    timer = window.setTimeout(() => { off(); resolve(null) }, timeoutMs)
    sendPacket(controller, reportIdMode, pkt, family).catch(() => { window.clearTimeout(timer); off(); resolve(null) })
  })
}

// The keyboard's current 29-byte lighting block (CMD 0x05), or null.
export function readLightingBlock(controller: DeviceController, reportIdMode: ReportIdMode, family: ProtocolFamilyResolved) {
  return readReply(controller, reportIdMode, family, buildReadPacket(CMD_READ_LIGHTING, LIGHTING_BLOCK_LEN), LIGHTING_BLOCK_LEN)
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
export function useLightingState(controller: DeviceController, settings: Settings, family: ProtocolFamilyResolved) {
  const [lighting, setLightingState] = useState<LightingState>(DEFAULT_LIGHTING)

  const setLighting = useCallback((updater: LightingState | ((prev: LightingState) => LightingState)) => {
    setLightingState(prev => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])

  const apply = useCallback(async (override?: LightingState) => {
    const l = override ?? lighting
    // Read-modify-write like the vendor app: keep the firmware-owned bytes and
    // keyboard options (Win lock, WASD swap, polling rate) the device reports.
    const base = await readLightingBlock(controller, settings.reportIdMode, family)
    const packets = buildApplyPackets(l, family, base ?? undefined)
    for (let i = 0; i < packets.length; i++) {
      if (i > 0) await delay(PACKET_GAP_MS)
      await sendPacket(controller, settings.reportIdMode, packets[i], family)
    }
  }, [controller, lighting, settings.reportIdMode, family])

  // Send pre-built raw packets (used by the per-key KeyboardView, which
  // builds its own BEGIN + CMD_WRITE_CONFIG color chunks + END sequence).
  // Same transport + pacing as apply() so the firmware gets the same cadence.
  const sendPackets = useCallback(async (packets: Uint8Array[]) => {
    for (let i = 0; i < packets.length; i++) {
      if (i > 0) await delay(PACKET_GAP_MS)
      await sendPacket(controller, settings.reportIdMode, packets[i], family)
    }
  }, [controller, settings.reportIdMode, family])

  // Per-key: color chunks first, then Custom mode on top of the device's block.
  const applyPerKey = useCallback(async (colorPackets: Uint8Array[]) => {
    const base = await readLightingBlock(controller, settings.reportIdMode, family)
    await sendPackets([...colorPackets, ...buildCustomModePacket(lighting, base ?? undefined)])
  }, [controller, settings.reportIdMode, family, lighting, sendPackets])

  return { lighting, setLighting, apply, sendPackets, applyPerKey }
}

// =====================================================================
// useStatus — last feedback message
// =====================================================================
export function useStatus() {
  const [status, setStatus] = useState<StatusMessage>({
    message: '',
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

// =====================================================================
// useCaptureLog — live view of the controller's raw I/O capture buffer.
//
// The controller records every sent and received packet into a bounded ring
// buffer and notifies subscribers synchronously. To keep a multi-packet
// Apply (BEGIN + WRITE + END + up to 7 color chunks = ~10 packets) from
// triggering ~10 React renders, we coalesce notifications into a single
// requestAnimationFrame tick. `paused` stops the re-render cadence while the
// buffer keeps filling (so no packets are lost while the user inspects a
// frozen view).
// =====================================================================
export function useCaptureLog(controller: DeviceController) {
  const [version, setVersion] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const scheduledRef = useRef(false)

  useEffect(() => {
    const unsub = controller.onPacket(() => {
      if (pausedRef.current) return
      if (scheduledRef.current) return
      scheduledRef.current = true
      requestAnimationFrame(() => {
        scheduledRef.current = false
        setVersion(v => (v + 1) & 0x3fffffff)
      })
    })
    return unsub
  }, [controller])

  const clear = useCallback(() => {
    controller.clearLog()
    setVersion(v => (v + 1) & 0x3fffffff)
  }, [controller])

  // `log` is the live buffer reference; `version` is the render signal. Read
  // the buffer (e.g. via `.slice(-N)`) in the consumer keyed on `version`.
  return { log: controller.log, version, paused, setPaused, clear }
}

// =====================================================================
// useCalibration — load + persist + delete mode verification results.
//
// The test flow itself (apply → snapshot capture log → open modal) lives in
// App.tsx where `apply` is already wired to the correct controller/settings.
// This hook just manages the persisted results collection: load on mount,
// upsert on save, remove on delete, clear on reset. The "stable modes" table
// in the Capture tab reads `results` directly.
// =====================================================================
export function useCalibration() {
  const [results, setResults] = useState<CalibrationResult[]>(() => calibrationStore.load())

  const saveResult = useCallback((result: CalibrationResult) => {
    setResults(calibrationStore.upsert(result))
  }, [])

  const removeResult = useCallback((mode: number) => {
    setResults(calibrationStore.remove(mode))
  }, [])

  const clearAll = useCallback(() => {
    calibrationStore.clear()
    setResults([])
  }, [])

  return { results, saveResult, removeResult, clearAll }
}
