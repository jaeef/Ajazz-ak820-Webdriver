export type ReportIdMode = 'auto' | 'payload' | 'native'

// Which wire protocol the keyboard speaks. 'auto' picks by USB VID:
// 0x0C45 (Microdia/Sonix) -> 'sonix', 0x320F (Yichip/EVision) -> 'evision'.
// The two families share nothing on the wire — see docs/protocol-notes.md.
export type ProtocolFamily = 'auto' | 'evision' | 'sonix'
export type ProtocolFamilyResolved = 'evision' | 'sonix'

export type Direction = 0 | 1 | 2 | 3

export interface LightingState {
  mode: number
  r: number
  g: number
  b: number
  brightness: number
  speed: number
  direction: Direction
  rainbow: boolean
}

export interface DeviceInfo {
  vendorId: number
  productId: number
  productName: string
  // Diagnostics from the chosen HID collection — populated for real WebHID
  // connections so the user can confirm we landed on the vendor control
  // interface and see what report IDs the firmware actually declares.
  usagePage?: number
  usage?: number
  featureReportIds?: number[]
  outputReportIds?: number[]
  collectionsCount?: number
  matchedVendorInterface?: boolean
}

export interface Profile extends LightingState {
  name: string
}

export interface Settings {
  vid: number
  pid: number
  reportIdMode: ReportIdMode
  protocolFamily: ProtocolFamily
  modes: string[]
  showAllDevices: boolean
}

export interface StatusMessage {
  message: string
  type: '' | 'success' | 'error' | 'info'
}

export type TabId = 'lighting' | 'effects' | 'profiles' | 'settings'

export interface SentPacket {
  reportId: number
  data: Uint8Array
  timestamp: number
}
