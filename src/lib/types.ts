export type ReportIdMode = 'auto' | 'payload' | 'native'

// Which wire protocol the keyboard speaks. 'auto' picks by USB VID:
// 0x0C45 (Microdia/Sonix) -> 'sonix', 0x320F (Yichip/EVision) -> 'evision'.
// The two families share nothing on the wire — see docs/legacy-protocol-notes.md.
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

export type TabId = 'lighting' | 'perkey' | 'keys' | 'profiles' | 'settings'

export interface SentPacket {
  reportId: number
  data: Uint8Array
  timestamp: number
}

// One entry in the raw I/O capture log. The capture environment records every
// byte that crosses the HID boundary in either direction so the user can
// compare the web driver's wire format against the official driver (e.g. with
// a Wireshark/USBPcap capture) and verify the keyboard's replies.
//   • dir 'out' = host → device (OUTPUT or FEATURE report we sent)
//   • dir 'in'  = device → host (INPUT report the keyboard sent unsolicited,
//     delivered via WebHID's `inputreportevent`)
export type PacketDirection = 'in' | 'out'
export type PacketTransport = 'output' | 'feature' | 'input'

export interface PacketLogEntry {
  id: number
  dir: PacketDirection
  transport: PacketTransport
  reportId: number
  data: Uint8Array
  timestamp: number
}

