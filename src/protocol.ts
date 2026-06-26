import type { LightingState, Direction, ReportIdMode } from './types'

// =====================================================================
// EVision keyboard protocol ("eevision" family)
//
// The Ajazz AK820 unit this targets (VID 0x0C45 / PID 0x1007, chip VS11K34A —
// confirmed by RE of the official driver) is an "EVision" controller, the same
// command frame found in Redragon, Glorious GMMK, Tecware, Womier and rebadged
// boards. The 64-byte frame below is ported from OpenRGB's
// EVisionKeyboardController (GPL-2.0); the MODE IDS, however, are this unit's
// own firmware table (see DEFAULT_MODES) — OpenRGB's generic IDs selected the
// wrong effects on this hardware.
//
//   • Transport: HID OUTPUT report (WebHID `sendReport`), NOT a feature
//     report. Every packet is 64 bytes.
//   • byte 0      : 0x04   (report-id / command class — see resolveSend)
//   • bytes 1..2  : 16-bit little-endian checksum = sum of bytes 3..63
//   • byte 3      : command (0x06 = set parameter, 0x11 = write colors, …)
//   • Effect modes are set with command 0x06, parameter 0x00, 8 data bytes:
//       { mode, brightness, speed, direction, random, r, g, b }
// =====================================================================

// Identifiers confirmed by reverse-engineering the official driver
// (AJAZZ AK820 有线RGB Keyboard.exe → DefaultData/Keyboard.json: VID 3141,
// PID 4103; chip VS11K34A / "eevision" family). The earlier 0x320F/0x505B
// values were OpenRGB's generic EVision IDs and did not match this unit.
export const VID_DEFAULT = 0x0c45
export const PID_DEFAULT = 0x1007

export const PACKET_LENGTH = 64

// Commands (byte 3)
const CMD_BEGIN = 0x01
const CMD_END = 0x02
const CMD_SET_PARAMETER = 0x06
const CMD_WRITE_COLORS = 0x11

// Parameter selectors (byte 5 of a SET_PARAMETER packet)
const PARAM_MODE = 0x00

// Report-id / command-class prefix the firmware expects in byte 0.
const REPORT_PREFIX = 0x04

// Brightness range for this firmware is 0..4 (0 = off). Speed is 0..5 where
// 0x00 is fastest and 0x05 is slowest (inverted vs. intuition).
export const MAX_BRIGHTNESS = 4
export const MAX_SPEED = 5

// Firmware mode IDs (mode byte). Indexed by value so the UI can show names.
// Values are the AUTHORITATIVE table for this exact unit, lifted from the
// official driver's DefaultData/default_light.json (the keyboard profile,
// "light_mode_*_text" entries). They are NOT OpenRGB's generic EVision IDs —
// e.g. firmware 0x12 (18) is "Speed", not OpenRGB's "Rainbow Circle". Using
// the generic table is what made the mode picker select the wrong effects.
export const MODE_STATIC = 0x06 // confirmed: default_light.json value 6 = static
export const MODE_CUSTOM = 0x14 // confirmed: value 20 = custom (per-key full RGB)

// Mode name table, indexed by firmware mode value. Empty strings are
// hidden/unused IDs (hidden:false in the official config) and never appear in
// the picker.
// Names are the EXACT English labels from the official driver's
// Skin/lan_en.xml (matched by the light_mode_*_text key each firmware mode
// uses in default_light.json). Not guesses.
export const DEFAULT_MODES: string[] = [
  'Corrugated',        // 0  light_mode_wave_text (hidden in official UI)
  'Corrugated',        // 1  light_mode_wave_text
  'Cloud',             // 2  light_mode_cloud_text
  'Serpentine',        // 3  light_mode_vortex_text
  'Spectrum',          // 4  light_mode_mix_color_text
  'Breath',            // 5  light_mode_breath_text
  'Normal',            // 6  light_mode_static_text — honors picked color
  'Reaction',          // 7  light_mode_reaction_text
  'Ripples',           // 8  light_mode_stone_text
  'Traverse',          // 9  light_mode_traverse_text
  'Stars',             // 10 light_mode_stars_text
  'Flowers',           // 11 light_mode_firework_open_text
  'Roll',              // 12 light_mode_roll_text
  'Wave',              // 13 light_mode_wave_bar_text
  'Cartoon',           // 14 light_mode_cartoon_text
  'Rain',              // 15 light_mode_rain_text
  'Scan',              // 16 light_mode_scan_text
  'Surmount',          // 17 light_mode_zzcc_text
  'Speed',             // 18 light_mode_speed_text
  '',                  // 19 custom (hidden duplicate)
  'Custom',            // 20 light_mode_custom_text — per-key, honors color
  '',                  // 21 (reaction — hidden)
  '',                  // 22 (4-color breath — hidden)
  '',                  // 23 (4-color blink — hidden)
  '',                  // 24 (off — hidden)
  '',                  // 25
  '',                  // 26
  '',                  // 27
  '',                  // 28
  'Audio wave',        // 29 light_mode_audiorecord_text — PC-driven (mic)
  'Capture',           // 30 light_mode_capturecolor_text — PC-driven (screen)
]

// Display order for the mode picker. Mirrors the official driver's visible
// keyboard modes (default_light.json, hidden:true === visible here), with the
// two color-capable modes first. The PC-driven effects 29 (Audio React) and 30
// (Screen Color) are omitted because they need host mic/screen capture that
// this web app does not implement yet.
export const DEFAULT_MODE_ORDER: number[] = [
  0x14, // 20 Custom (per-key) — picked color
  0x06, // 6  Static — picked color
  0x01, // 1  Wave
  0x02, // 2  Cloud
  0x03, // 3  Vortex
  0x04, // 4  Mixed Color
  0x05, // 5  Breathing
  0x07, // 7  Reactive
  0x08, // 8  Stone
  0x09, // 9  Traverse
  0x0a, // 10 Starlight
  0x0b, // 11 Firework
  0x0c, // 12 Roll
  0x0d, // 13 Wave Bar
  0x0e, // 14 Cartoon
  0x0f, // 15 Rain
  0x10, // 16 Scan
  0x11, // 17 Marquee
  0x12, // 18 Speed
]

// A per-key mode needs explicit LED color data (vs. an effect that the
// firmware animates on its own).
export function isPerKeyMode(mode: number): boolean {
  return mode === MODE_CUSTOM
}

// Modes that honor the user's picked RGB color. On this firmware only Static
// (single-color effect packet) and Solid Color (per-key custom fill) display
// the chosen color; every other effect ignores it and runs the firmware's
// built-in rainbow. The UI uses this to show/hide the color picker.
export function isColorMode(mode: number): boolean {
  return mode === MODE_STATIC || mode === MODE_CUSTOM
}

// Friendly name for a mode value from the user-editable firmware table, with a
// numeric fallback.
export function modeName(value: number, modes: string[]): string {
  return modes[value] ?? `Mode ${value}`
}

export const DEFAULT_PALETTE: string[] = [
  '#ff0000', '#ff4000', '#ff8000', '#ffff00',
  '#00ff00', '#00ffff', '#0080ff', '#0000ff',
  '#8000ff', '#ff00ff', '#ff0080', '#ffffff',
]

// App direction enum (0=Left, 1=Up, 2=Down, 3=Right) → EVision/OpenRGB enum
// (Left=0, Right=1, Up=2, Down=3).
const DIRECTION_MAP: number[] = [0, 2, 3, 1]

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v | 0))
}

// 16-bit LE checksum over bytes 3..63, written into bytes 1..2.
//
// CRITICAL — verified against the official driver. The packet builders
// (SendReport @0x4781c0; cmd builders @0x47ade0 and @0x47b060) sum bytes[3..63]
// as UNSIGNED bytes (`movzx`) into a 32-bit accumulator, then store low byte at
// [1] and high byte at [2]. This 0x0C45 / VS11K34A firmware does NOT use the
// signed-char sum that OpenRGB's 0x320F EVision variant used. A signed sum is
// identical in the low byte but off by one per byte >= 0x80 in the HIGH byte —
// so any packet with a bright channel or a high parameter got a wrong byte[2]
// and was silently rejected. That is why "many modes / colors didn't change".
function applyChecksum(pkt: Uint8Array): void {
  let sum = 0
  for (let i = 3; i < PACKET_LENGTH; i++) sum += pkt[i] // unsigned byte sum
  pkt[1] = sum & 0xff
  pkt[2] = (sum >> 8) & 0xff
}

// =====================================================================
// PACKET BUILDERS — all return a 64-byte buffer where byte 0 is the
// report-id/command prefix. resolveSend() splits it for WebHID.
// =====================================================================

// Effect-mode packet (SET_PARAMETER, parameter MODE, 8 data bytes).
export function buildLightingPacket(o: LightingState): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = CMD_SET_PARAMETER
  pkt[0x04] = 0x08 // parameter size
  pkt[0x05] = PARAM_MODE
  pkt[0x08] = clamp(o.mode, 0, 0xff)
  pkt[0x09] = clamp(o.brightness, 0, MAX_BRIGHTNESS)
  pkt[0x0a] = clamp(o.speed, 0, MAX_SPEED)
  pkt[0x0b] = DIRECTION_MAP[clamp(o.direction, 0, 3)] ?? 0
  pkt[0x0c] = o.rainbow ? 1 : 0 // random-color flag
  pkt[0x0d] = clamp(o.r, 0, 0xff)
  pkt[0x0e] = clamp(o.g, 0, 0xff)
  pkt[0x0f] = clamp(o.b, 0, 0xff)
  applyChecksum(pkt)
  return pkt
}

// Begin / End frame packets (fixed contents, no checksum).
export function buildBeginPacket(): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x01] = CMD_BEGIN
  pkt[0x03] = CMD_BEGIN
  return pkt
}

export function buildEndPacket(): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x01] = CMD_END
  pkt[0x03] = CMD_END
  return pkt
}

// Write-colors packet (per-key custom data) — one chunk, max 0x36 bytes.
export function buildColorChunkPacket(data: Uint8Array, offset: number): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = CMD_WRITE_COLORS
  pkt[0x04] = data.length & 0xff
  pkt[0x05] = offset & 0xff
  pkt[0x06] = (offset >> 8) & 0xff
  pkt.set(data.subarray(0, Math.min(data.length, COLOR_CHUNK)), 0x08)
  applyChecksum(pkt)
  return pkt
}

// Per-key color buffer is 126 LEDs × 3 bytes, sent in 0x36-byte chunks.
export const LED_COUNT = 126
const COLOR_CHUNK = 0x36 // 54 bytes = 18 LEDs per packet

// Split a full LED_COUNT×3 RGB buffer into the chunked CMD_WRITE_COLORS packets
// the firmware expects (no mode-select packet — caller selects Custom first).
export function buildCustomColorPackets(buf: Uint8Array): Uint8Array[] {
  const packets: Uint8Array[] = []
  for (let off = 0; off < buf.length; off += COLOR_CHUNK) {
    packets.push(buildColorChunkPacket(buf.subarray(off, off + COLOR_CHUNK), off))
  }
  return packets
}

// Select per-key Custom mode (carries brightness; color/random ignored here).
export function buildCustomModePacket(o: LightingState): Uint8Array {
  return buildLightingPacket({ ...o, mode: MODE_CUSTOM, rainbow: false })
}

// Accurate solid color: switch to per-key Custom mode, then write the exact
// RGB to every LED. This bypasses the firmware's quantized "mode color" so the
// keyboard shows the true picked color. Returns the full packet sequence.
export function buildSolidColorPackets(o: LightingState): Uint8Array[] {
  const buf = new Uint8Array(LED_COUNT * 3)
  for (let i = 0; i < LED_COUNT; i++) {
    buf[i * 3 + 0] = o.r & 0xff
    buf[i * 3 + 1] = o.g & 0xff
    buf[i * 3 + 2] = o.b & 0xff
  }
  return [buildCustomModePacket(o), ...buildCustomColorPackets(buf)]
}

// =====================================================================
// REPORT-ID RESOLUTION
//
// WebHID separates the report ID from the payload and is strict about it:
//   • numbered descriptor → reportId = byte 0, payload = the rest
//   • unnumbered descriptor → reportId 0, byte 0 stays in the payload
// `reportIds` is the set the device actually declares (output reports here).
// =====================================================================
export function resolveSend(
  pkt: Uint8Array,
  mode: ReportIdMode,
  reportIds: number[],
): { reportId: number; data: Uint8Array } {
  if (mode === 'native') return { reportId: pkt[0], data: pkt.slice(1) }
  if (mode === 'payload') return { reportId: 0, data: pkt }
  // auto: decide from what the device declares.
  const numbered = reportIds.filter(id => id !== 0)
  if (numbered.length > 0) return { reportId: pkt[0], data: pkt.slice(1) }
  return { reportId: 0, data: pkt }
}

// =====================================================================
// UTILITIES
// =====================================================================

export function hexDump(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

export const DEFAULT_LIGHTING: LightingState = {
  mode: MODE_CUSTOM, // Solid Color (accurate) — true full-RGB by default
  r: 255,
  g: 0,
  b: 0,
  brightness: MAX_BRIGHTNESS,
  speed: 3,
  direction: 0,
  rainbow: false,
}

export function clampDirection(n: number): Direction {
  const v = Math.max(0, Math.min(3, n | 0))
  return v as Direction
}
