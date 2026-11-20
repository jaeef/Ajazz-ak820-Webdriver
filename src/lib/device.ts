import type { DeviceInfo, SentPacket, PacketLogEntry, PacketTransport } from './types'

// The keyboard is a *composite* HID device exposing several interfaces. The
// lighting protocol lives on the EVision vendor control interface, identified
// by HID usage page 0xFF1C (Yichip / 0x320F family). Older Sonix AK820 units
// use 0xFF13 instead, so we accept either. Sending to any other interface
// (e.g. the typing interface on usage page 0x01) is silently ignored — which
// is exactly what made the keyboard "connect but do nothing".
export const EVISION_USAGE_PAGE = 0xff1c
export const SONIX_USAGE_PAGE = 0xff13
const VENDOR_USAGE_PAGES = [EVISION_USAGE_PAGE, SONIX_USAGE_PAGE]

// =====================================================================
// PacketLogger — shared raw I/O capture buffer used by both the Mock and
// WebHID controllers. This is the "environment to capture the raw output and
// input of the keyboard": every byte that crosses the HID boundary in either
// direction is recorded here with direction, transport, report id, and a
// timestamp, and subscribers are notified so the Capture tab can render live.
//
// Efficiency:
//   • Bounded ring buffer (LOG_CAP entries). Older entries are dropped so a
//     long session can't grow memory unbounded.
//   • Subscribers are notified synchronously; the React hook batches via
//     requestAnimationFrame so a burst of packets during one Apply triggers a
//     single render, not N.
// =====================================================================
const LOG_CAP = 500

class PacketLogger {
  private entries: PacketLogEntry[] = []
  private nextId = 1
  private subs = new Set<(e: PacketLogEntry) => void>()

  get log(): PacketLogEntry[] {
    return this.entries
  }

  record(dir: PacketLogEntry['dir'], transport: PacketTransport, reportId: number, data: Uint8Array): PacketLogEntry {
    const entry: PacketLogEntry = {
      id: this.nextId++,
      dir,
      transport,
      reportId,
      data: new Uint8Array(data),
      timestamp: Date.now(),
    }
    this.entries.push(entry)
    if (this.entries.length > LOG_CAP) {
      this.entries.splice(0, this.entries.length - LOG_CAP)
    }
    // Clone the subscriber set before invoking so a subscriber that unsubscribes
    // mid-dispatch doesn't mutate the set we're iterating.
    for (const cb of [...this.subs]) {
      try { cb(entry) } catch { /* subscriber error must not break the send path */ }
    }
    return entry
  }

  subscribe(cb: (e: PacketLogEntry) => void): () => void {
    this.subs.add(cb)
    return () => { this.subs.delete(cb) }
  }

  clear(): void {
    this.entries.length = 0
  }
}

export interface DeviceController {
  readonly info: DeviceInfo | null
  readonly isMock: boolean
  // Report IDs the chosen collection actually declares. Used to auto-resolve
  // numbered vs. unnumbered reports (WebHID is strict about this).
  readonly featureReportIds: number[]
  readonly outputReportIds: number[]
  // Raw I/O capture log — sent packets + received INPUT reports. The Capture
  // tab renders this live; Export uses it to dump a session to disk.
  readonly log: PacketLogEntry[]
  // Subscribe to every new captured packet (both directions). Returns an
  // unsubscribe function.
  onPacket(cb: (e: PacketLogEntry) => void): () => void
  clearLog(): void
  connect(vid: number, pid: number, showAll: boolean): Promise<DeviceInfo>
  disconnect(): Promise<void>
  sendOutputReport(reportId: number, data: Uint8Array): Promise<void>
  sendFeatureReport(reportId: number, data: Uint8Array): Promise<void>
  listGranted(): Promise<DeviceInfo[]>
}

export class MockController implements DeviceController {
  readonly info: DeviceInfo | null = null
  readonly isMock = true
  readonly featureReportIds: number[] = []
  readonly outputReportIds: number[] = []
  readonly sent: SentPacket[] = []
  private logger = new PacketLogger()
  readonly log: PacketLogEntry[] = this.logger.log

  async connect(vid: number, pid: number, _showAll: boolean): Promise<DeviceInfo> {
    return {
      vendorId: vid,
      productId: pid,
      productName: 'Ajazz AK820 (mock)',
    }
  }

  async disconnect(): Promise<void> {}

  async sendOutputReport(reportId: number, data: Uint8Array): Promise<void> {
    this.record(reportId, data, 'output')
  }

  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    this.record(reportId, data, 'feature')
  }

  private record(reportId: number, data: Uint8Array, transport: PacketTransport): void {
    this.sent.push({ reportId, data: new Uint8Array(data), timestamp: Date.now() })
    this.logger.record('out', transport, reportId, data)
  }

  onPacket(cb: (e: PacketLogEntry) => void): () => void { return this.logger.subscribe(cb) }
  clearLog(): void { this.logger.clear(); this.sent.length = 0 }

  async listGranted(): Promise<DeviceInfo[]> {
    return []
  }
}

// Collect every reportId from a list of HIDReportInfo (missing id => 0).
function reportIds(reports: HIDReportInfo[] | undefined): number[] {
  if (!reports) return []
  return reports.map(r => r.reportId ?? 0)
}

// Among the HIDDevice objects Chrome returns for a physical keyboard (one per
// interface), choose the one exposing a vendor control collection.
function pickVendorDevice(devices: HIDDevice[]): {
  device: HIDDevice
  collection: HIDCollectionInfo | null
  matched: boolean
} {
  // First pass: a device whose collection is a known vendor usage page.
  for (const up of VENDOR_USAGE_PAGES) {
    for (const d of devices) {
      const hit = d.collections.find(c => c.usagePage === up)
      if (hit) return { device: d, collection: hit, matched: true }
    }
  }
  // Second pass: any device/collection that can actually send reports and
  // isn't the standard keyboard/consumer collection (usage page < 0xFF00).
  for (const d of devices) {
    const c = d.collections.find(
      col =>
        (col.usagePage ?? 0) >= 0xff00 &&
        ((col.outputReports?.length ?? 0) > 0 || (col.featureReports?.length ?? 0) > 0),
    )
    if (c) return { device: d, collection: c, matched: false }
  }
  // Fallback: first device / first collection.
  const d = devices[0]
  return { device: d, collection: d.collections[0] ?? null, matched: false }
}

const LAST_DEVICE_KEY = 'ak820.lastDevice'

export class WebHIDController implements DeviceController {
  info: DeviceInfo | null = null
  readonly isMock = false
  featureReportIds: number[] = []
  outputReportIds: number[] = []
  private device: HIDDevice | null = null
  private logger = new PacketLogger()
  readonly log: PacketLogEntry[] = this.logger.log
  // Bound handler so we can remove it on disconnect. Typed as EventListener
  // because addEventListener expects (e: Event) => unknown; we narrow to
  // HIDInputReportEvent inside (strict-function-types safe).
  private onInputReport: EventListener | null = null

  async connect(vid: number, pid: number, showAll: boolean): Promise<DeviceInfo> {
    if (!('hid' in navigator)) {
      throw new Error('WebHID not available in this browser (use Chrome or Edge)')
    }
    // Without "Show all", list only the AK820 families (EVision 0x320F, Sonix 0x0C45)
    // plus the VID in Settings, so other USB gadgets aren't offered at all.
    const filters: HIDDeviceFilter[] = showAll ? []
      : [...new Set([vid, 0x320f, 0x0c45])].map(vendorId => ({ vendorId }))
    const requested = await navigator.hid.requestDevice({ filters })
    if (!requested || requested.length === 0) {
      throw new Error('No device selected')
    }

    // The picker often returns only one interface (e.g. the typing collection)
    // even though the OS granted every interface of the keyboard. Pull the
    // already-granted devices too and consider any that share a VID/PID with
    // what was just selected — this is how we reach the 0xFF1C vendor
    // interface that actually accepts lighting commands.
    let pool = requested
    try {
      const granted = await navigator.hid.getDevices()
      const wanted = new Set(requested.map(d => `${d.vendorId}:${d.productId}`))
      const extra = granted.filter(
        d => wanted.has(`${d.vendorId}:${d.productId}`) && !requested.includes(d),
      )
      pool = [...requested, ...extra]
    } catch {
      // getDevices unavailable — fall back to just the picked device(s).
    }
    return this.open(pool)
  }

  // Reopen a keyboard this site is already allowed to use (after a page reload
  // or a replug): no chooser, no click. Prefers the device last connected, since
  // "Show all HID devices" can connect one that doesn't match the Settings VID/PID.
  // Null when none is remembered.
  async reconnect(vid: number, pid: number): Promise<DeviceInfo | null> {
    if (!('hid' in navigator)) return null
    let last: { vid: number; pid: number } | null = null
    try { last = JSON.parse(localStorage.getItem(LAST_DEVICE_KEY) ?? 'null') } catch { /* blocked or corrupt */ }
    if (!last || typeof last.vid !== 'number' || typeof last.pid !== 'number') last = null
    if (last) { vid = last.vid; pid = last.pid }
    const granted = await navigator.hid.getDevices()
    const pool = granted.filter(d => d.vendorId === vid && (!pid || d.productId === pid))
    const why = granted.length === 0 ? 'the browser remembers no device for this site'
      : pool.length === 0 ? `no remembered device matches ${vid.toString(16)}:${pid.toString(16)}`
      : !pickVendorDevice(pool).matched ? 'the lighting interface is not available yet' : ''
    if (why) {
      console.info(`[ak820] auto-reconnect skipped: ${why}`,
        granted.map(d => `${d.vendorId.toString(16)}:${d.productId.toString(16)} pages ${d.collections.map(c => (c.usagePage ?? 0).toString(16)).join(',')}`))
      return null
    }
    return this.open(pool)
  }

  private async open(pool: HIDDevice[]): Promise<DeviceInfo> {
    const { device, collection, matched } = pickVendorDevice(pool)
    // A device without the AK820's vendor lighting interface is refused before it is
    // opened: AK820 packets must never reach another USB gadget picked by mistake.
    if (!matched) {
      throw new Error('That device isn’t an AK820 keyboard, so nothing was sent to it. Pick the AK820 (wired) in the list.')
    }
    this.device = device
    if (!this.device.opened) {
      await this.device.open()
    }

    // Attach the INPUT-report listener once. The keyboard emits unsolicited
    // reports (e.g. ACKs, key activity on the vendor interface) on this event;
    // capturing them is what makes this a complete raw-I/O environment.
    this.onInputReport = (e: Event) => {
      const ev = e as HIDInputReportEvent
      const dv = ev.data
      const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength)
      this.logger.record('in', 'input', ev.reportId, bytes)
    }
    this.device.addEventListener('inputreport', this.onInputReport)

    const featureIds = collection ? reportIds(collection.featureReports) : []
    const outputIds = collection ? reportIds(collection.outputReports) : []
    this.featureReportIds = featureIds
    this.outputReportIds = outputIds

    const info: DeviceInfo = {
      vendorId: this.device.vendorId,
      productId: this.device.productId,
      productName: this.device.productName || 'Unknown HID device',
      usagePage: collection?.usagePage,
      usage: collection?.usage,
      featureReportIds: featureIds,
      outputReportIds: outputIds,
      collectionsCount: this.device.collections.length,
      matchedVendorInterface: matched,
    }
    this.info = info
    try { localStorage.setItem(LAST_DEVICE_KEY, JSON.stringify({ vid: info.vendorId, pid: info.productId })) } catch { /* storage blocked */ }
    return info
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      if (this.onInputReport) {
        this.device.removeEventListener('inputreport', this.onInputReport)
        this.onInputReport = null
      }
      try {
        if (this.device.opened) {
          await this.device.close()
        }
        // Drop the permission too, so a manual Disconnect isn't undone by auto-reconnect.
        try { localStorage.removeItem(LAST_DEVICE_KEY) } catch { /* storage blocked */ }
        await this.device.forget?.()
      } catch {
        // ignore close errors
      }
    }
    this.device = null
    this.info = null
    this.featureReportIds = []
    this.outputReportIds = []
  }

  async sendOutputReport(reportId: number, data: Uint8Array): Promise<void> {
    if (!this.device) throw new Error('Not connected')
    await this.device.sendReport(reportId, data as BufferSource)
    this.logger.record('out', 'output', reportId, data)
  }

  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    if (!this.device) throw new Error('Not connected')
    await this.device.sendFeatureReport(reportId, data as BufferSource)
    this.logger.record('out', 'feature', reportId, data)
  }

  onPacket(cb: (e: PacketLogEntry) => void): () => void { return this.logger.subscribe(cb) }
  clearLog(): void { this.logger.clear() }

  async listGranted(): Promise<DeviceInfo[]> {
    if (!('hid' in navigator)) return []
    const devices = await navigator.hid.getDevices()
    return devices.map(d => ({
      vendorId: d.vendorId,
      productId: d.productId,
      productName: d.productName || 'Unknown HID device',
    }))
  }
}
