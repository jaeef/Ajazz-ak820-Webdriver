import { useCallback, useEffect, useRef, useState } from 'react'
import type { DeviceInfo, LightingState, Profile, Settings, StatusMessage, TabId, ProtocolFamilyResolved } from './types'
import type { DeviceController } from './device'
import { MockController, WebHIDController } from './device'
import { profileStore, settingsStore, cleanProfiles } from './store'
import { defaultSettings } from './store'
import {
  DEFAULT_LIGHTING, buildApplyPackets, buildCustomModePacket, buildReadPacket, resolveSend,
  CMD_READ_LIGHTING, LIGHTING_BLOCK_LEN,
  buildKeymapReadPackets, parseKeymap, KEYMAP_BYTES, type KeyAssignment,
} from './protocol'
import type { ReportIdMode } from './types'

// One USB conversation at a time. A second Apply (double click, held Ctrl+Enter,
// a profile click mid-write) waits for the first instead of interleaving its
// BEGIN/WRITE/END packets with it.
let usbQueue: Promise<unknown> = Promise.resolve()
export function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = usbQueue.then(fn, fn)
  usbQueue = run.catch(() => undefined)
  return run
}

// Browser USB errors in words a keyboard owner can act on.
export function friendlyError(e: unknown): string {
  const name = (e as DOMException | undefined)?.name ?? ''
  const msg = String((e as Error | undefined)?.message ?? e ?? '')
  if (/failed to open/i.test(msg) || name === 'InvalidStateError')
    return 'The keyboard is busy. Close the AJAZZ app or any other tab using it, then reconnect.'
  if (/not connected|not opened|failed to (write|send|receive)|disconnected/i.test(msg) || name === 'NetworkError' || name === 'NotFoundError')
    return 'The keyboard stopped answering. Check the cable and the wired switch, then reconnect.'
  if (name === 'SecurityError' || name === 'NotAllowedError')
    return 'The browser blocked USB access. Open the https:// address in Chrome or Edge and try again.'
  return msg || 'Something went wrong. Try again.'
}

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

// The keyboard's live 384-byte keymap, or null. One reply cannot carry it, so
// it is read window by window at the same offsets the write uses.
export async function readKeymap(
  controller: DeviceController, reportIdMode: ReportIdMode, family: ProtocolFamilyResolved,
): Promise<KeyAssignment[] | null> {
  const out = new Uint8Array(KEYMAP_BYTES)
  for (const req of buildKeymapReadPackets()) {
    const off = req[5] | (req[6] << 8)
    const chunk = await readReply(controller, reportIdMode, family, req, req[4], 400)
    if (!chunk) return null
    out.set(chunk.subarray(0, req[4]), off)
  }
  return parseKeymap(out)
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

  // Silent reconnect to an already-allowed keyboard; null if there is none.
  const reconnect = useCallback(async (vid: number, pid: number) => {
    const next = new WebHIDController()
    const deviceInfo = await next.reconnect(vid, pid)
    if (!deviceInfo) return null
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

  return { controller, info, isConnected, webHIDSupported, connect, reconnect, disconnect, switchToMock }
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

  // Merge by name; anything malformed in the file is dropped, not trusted.
  const importProfiles = useCallback((data: unknown) => {
    const incoming = cleanProfiles(data)
    if (incoming.length === 0) throw new Error('No profiles found in this file.')
    const byName = new Map(profileStore.load().map(p => [p.name, p]))
    incoming.forEach(p => byName.set(p.name, p))
    const merged = [...byName.values()]
    profileStore.save(merged)
    setProfiles(merged)
    return incoming.length
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

  const apply = useCallback((override?: LightingState) => exclusive(async () => {
    const l = override ?? lighting
    // Read-modify-write like the vendor app: keep the firmware-owned bytes and
    // keyboard options (Win lock, WASD swap, polling rate) the device reports.
    const base = await readLightingBlock(controller, settings.reportIdMode, family)
    const packets = buildApplyPackets(l, family, base ?? undefined)
    for (let i = 0; i < packets.length; i++) {
      if (i > 0) await delay(PACKET_GAP_MS)
      await sendPacket(controller, settings.reportIdMode, packets[i], family)
    }
  }), [controller, lighting, settings.reportIdMode, family])

  // Send pre-built raw packets (used by the per-key KeyboardView, which
  // builds its own BEGIN + CMD_WRITE_CONFIG color chunks + END sequence).
  // Same transport + pacing as apply() so the firmware gets the same cadence.
  const sendRaw = useCallback(async (packets: Uint8Array[]) => {
    for (let i = 0; i < packets.length; i++) {
      if (i > 0) await delay(PACKET_GAP_MS)
      await sendPacket(controller, settings.reportIdMode, packets[i], family)
    }
  }, [controller, settings.reportIdMode, family])
  const sendPackets = useCallback((packets: Uint8Array[]) => exclusive(() => sendRaw(packets)), [sendRaw])

  // Per-key: color chunks first, then Custom mode on top of the device's block.
  const applyPerKey = useCallback((colorPackets: Uint8Array[]) => exclusive(async () => {
    const base = await readLightingBlock(controller, settings.reportIdMode, family)
    await sendRaw([...colorPackets, ...buildCustomModePacket(lighting, base ?? undefined)])
  }), [controller, settings.reportIdMode, family, lighting, sendRaw])

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

