import type { DeviceInfo, SentPacket } from './types'

// The keyboard is a *composite* HID device exposing several interfaces. The
// lighting protocol lives on the EVision vendor control interface, identified
// by HID usage page 0xFF1C (Yichip / 0x320F family). Older Sonix AK820 units
// use 0xFF13 instead, so we accept either. Sending to any other interface
// (e.g. the typing interface on usage page 0x01) is silently ignored — which
// is exactly what made the keyboard "connect but do nothing".
export const EVISION_USAGE_PAGE = 0xff1c
export const SONIX_USAGE_PAGE = 0xff13
const VENDOR_USAGE_PAGES = [EVISION_USAGE_PAGE, SONIX_USAGE_PAGE]

export interface DeviceController {
  readonly info: DeviceInfo | null
  readonly isMock: boolean
  // Report IDs the chosen collection actually declares. Used to auto-resolve
  // numbered vs. unnumbered reports (WebHID is strict about this).
  readonly featureReportIds: number[]
  readonly outputReportIds: number[]
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

  async connect(vid: number, pid: number, _showAll: boolean): Promise<DeviceInfo> {
    return {
      vendorId: vid,
      productId: pid,
      productName: 'Ajazz AK820 (mock)',
    }
  }

  async disconnect(): Promise<void> {}

  async sendOutputReport(reportId: number, data: Uint8Array): Promise<void> {
    this.record(reportId, data)
  }

  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    this.record(reportId, data)
  }

  private record(reportId: number, data: Uint8Array): void {
    this.sent.push({ reportId, data: new Uint8Array(data), timestamp: Date.now() })
  }

  async listGranted(): Promise<DeviceInfo[]> {
    return []
  }

  clearLog(): void {
    this.sent.length = 0
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

export class WebHIDController implements DeviceController {
  info: DeviceInfo | null = null
  readonly isMock = false
  featureReportIds: number[] = []
  outputReportIds: number[] = []
  private device: HIDDevice | null = null

  async connect(vid: number, pid: number, showAll: boolean): Promise<DeviceInfo> {
    if (!('hid' in navigator)) {
      throw new Error('WebHID not available in this browser (use Chrome or Edge)')
    }
    let filters: HIDDeviceFilter[]
    if (showAll) {
      filters = []
    } else {
      filters = [{ vendorId: vid }]
      if (pid) filters[0].productId = pid
    }
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

    const { device, collection, matched } = pickVendorDevice(pool)
    this.device = device
    if (!this.device.opened) {
      await this.device.open()
    }

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

    return info
  }

  async disconnect(): Promise<void> {
    try {
      if (this.device && this.device.opened) {
        await this.device.close()
      }
    } catch {
      // ignore close errors
    }
    this.device = null
    this.info = null
    this.featureReportIds = []
    this.outputReportIds = []
  }

  async sendOutputReport(reportId: number, data: Uint8Array): Promise<void> {
    if (!this.device) throw new Error('Not connected')
    await this.device.sendReport(reportId, data as BufferSource)
  }

  async sendFeatureReport(reportId: number, data: Uint8Array): Promise<void> {
    if (!this.device) throw new Error('Not connected')
    await this.device.sendFeatureReport(reportId, data as BufferSource)
  }

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
