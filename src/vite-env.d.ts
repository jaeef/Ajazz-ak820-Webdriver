/// <reference types="vite/client" />

declare const __APP_VERSION__: string

// =====================================================================
// WebHID API type declarations
//
// WebHID is not yet in TypeScript's built-in lib.dom.d.ts, so we
// declare the minimal slice our app uses here. The full spec lives at
// https://wicg.github.io/webhid/.
// =====================================================================

interface HIDDeviceFilter {
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}

interface HIDInputReportEvent extends Event {
  readonly data: DataView
  readonly device: HIDDevice
  readonly reportId: number
}

// A single report (input / output / feature) declared in a collection.
interface HIDReportInfo {
  readonly reportId?: number
  readonly items?: unknown[]
}

// A top-level HID collection. A composite device (like the AK820) exposes
// several — one per interface — each identified by usagePage / usage.
interface HIDCollectionInfo {
  readonly usagePage?: number
  readonly usage?: number
  readonly type?: number
  readonly inputReports?: HIDReportInfo[]
  readonly outputReports?: HIDReportInfo[]
  readonly featureReports?: HIDReportInfo[]
  readonly children?: HIDCollectionInfo[]
}

interface HIDDevice extends EventTarget {
  readonly vendorId: number
  readonly productId: number
  readonly productName: string
  readonly opened: boolean
  readonly collections: HIDCollectionInfo[]
  open(): Promise<void>
  close(): Promise<void>
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>
  sendReport(reportId: number, data: BufferSource): Promise<void>
  receiveFeatureReport(reportId: number): Promise<DataView>
  forget?(): Promise<void>
  oninputreport: ((this: HIDDevice, ev: HIDInputReportEvent) => unknown) | null
}

interface HID extends EventTarget {
  requestDevice(options: { filters: HIDDeviceFilter[] }): Promise<HIDDevice[]>
  getDevices(): Promise<HIDDevice[]>
  onconnect: ((this: HID, ev: HIDConnectionEvent) => unknown) | null
  ondisconnect: ((this: HID, ev: HIDConnectionEvent) => unknown) | null
}

interface HIDConnectionEvent extends Event {
  readonly device: HIDDevice
}

interface Navigator {
  readonly hid: HID
}
