import type { LightingState, Direction, ReportIdMode, ProtocolFamily, ProtocolFamilyResolved } from './types'

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
const CMD_WRITE_CONFIG = 0x05 // chunked write to config/LED region
const CMD_SET_PARAMETER = 0x06 // chunked write to parameter region

// Report-id / command-class prefix the firmware expects in byte 0.
const REPORT_PREFIX = 0x04

// Brightness range for this firmware is 0..4 (0 = off). Speed is 0..4 per
// the official driver's LightControl.xml slider (min="0" max="4"). 0 is
// fastest and 4 is slowest (inverted vs. intuition).
export const MAX_BRIGHTNESS = 4
export const MAX_SPEED = 4

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

// Preset color palette — the exact 13 colors from the official driver's
// LightControl.xml (color_option_0 through color_option_12) and
// DefaultData/color_option_info.config. These are ARGB values in the XML
// (#AARRGGBB) converted to #RRGGBB.
export const DEFAULT_PALETTE: string[] = [
  '#ff0000', '#ff7200', '#fff005', '#00d70f',
  '#0099ff', '#3153ff', '#5e01d2', '#ee00f1',
  '#ff008a', '#ffa800', '#8dff8d', '#3defff',
  '#004891',
]

// App direction enum (0=Left, 1=Up, 2=Down, 3=Right) — passed through
// directly to the firmware. The official driver's struct at this+0x17E0
// stores direction in byte 7 (SelectItem) and mirrors it to byte 0.

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

// Begin frame packet (CMD 0x01). All bytes 4-63 are zero; checksum at 1-2.
// Confirmed from disassembly: byte 0=0x04, byte 3=0x01, bytes 4-7=0, checksum.
export function buildBeginPacket(): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = CMD_BEGIN
  applyChecksum(pkt)
  return pkt
}

// End frame packet (CMD 0x02). Same layout as BEGIN; the official driver
// also does Sleep(10ms) before sending END — we add a delay in the caller.
export function buildEndPacket(): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = CMD_END
  applyChecksum(pkt)
  return pkt
}

// Build the 21-byte lighting state data block that the firmware expects
// at config offset 0. Confirmed by disassembling the official driver's
// struct-population code (this+0x21C8, copied from this+0x17E0).
//
// Byte layout (21 bytes):
//   0: direction (0=Left, 1=Up, 2=Down, 3=Right — same as UI enum)
//   1: mode (firmware mode ID from default_light.json)
//   2: speed (0-4, 0=fastest)
//   3: brightness INVERTED (4 - actual, so 4=off, 0=max)
//   4: rainbow/multicolor flag (0 or 1)
//   5: Red
//   6: Green
//   7: Blue
//   8: selectItem / direction confirmation (mirror of byte 0)
//   9-20: zeros (padding / reserved by firmware)
function buildLightingData(o: LightingState): Uint8Array {
  const data = new Uint8Array(0x15) // 21 bytes
  data[0] = clamp(o.direction, 0, 3)
  data[1] = clamp(o.mode, 0, 0xff)
  data[2] = clamp(o.speed, 0, MAX_SPEED)
  data[3] = MAX_BRIGHTNESS - clamp(o.brightness, 0, MAX_BRIGHTNESS) // INVERTED
  data[4] = o.rainbow ? 1 : 0
  data[5] = clamp(o.r, 0, 0xff)
  data[6] = clamp(o.g, 0, 0xff)
  data[7] = clamp(o.b, 0, 0xff)
  data[8] = clamp(o.direction, 0, 3)
  return data
}

// Chunked write-data packet (CMD 0x06). Writes `data.length` bytes at
// `offset` in the device's config memory. One packet per chunk.
function buildWriteDataPacket(data: Uint8Array, offset: number): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = CMD_SET_PARAMETER // 0x06 — write data command
  pkt[0x04] = data.length & 0xff
  pkt[0x05] = offset & 0xff
  pkt[0x06] = (offset >> 8) & 0xff
  pkt.set(data.subarray(0, Math.min(data.length, PACKET_LENGTH - 0x08)), 0x08)
  applyChecksum(pkt)
  return pkt
}

// Full lighting apply sequence: BEGIN + WRITE(21 bytes) + END.
// This is what the official driver sends for every lighting change.
export function buildLightingPacket(o: LightingState): Uint8Array {
  // Single packet representation for the wire inspector — but the real
  // transport sends 3 packets (see buildLightingPackets below).
  const data = buildLightingData(o)
  return buildWriteDataPacket(data, 0)
}

// The actual packet sequence sent to the keyboard for a lighting update.
export function buildLightingPackets(o: LightingState): Uint8Array[] {
  const data = buildLightingData(o)
  return [
    buildBeginPacket(),
    buildWriteDataPacket(data, 0),
    buildEndPacket(),
  ]
}

// Write-colors packet (per-key custom data) — one chunk, max 0x38 bytes.
// Uses CMD 0x05 (CMD_WRITE_CONFIG), same frame as the config writer.
export function buildColorChunkPacket(data: Uint8Array, offset: number): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = CMD_WRITE_CONFIG
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
// Now returns the full BEGIN + WRITE + END sequence.
export function buildCustomModePacket(o: LightingState): Uint8Array[] {
  return buildLightingPackets({ ...o, mode: MODE_CUSTOM, rainbow: false })
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
  // Send mode switch (BEGIN + config write + END), then color data (BEGIN + color chunks + END)
  return [
    ...buildCustomModePacket(o),
    buildBeginPacket(),
    ...buildCustomColorPackets(buf),
    buildEndPacket(),
  ]
}

// =====================================================================
// PROTOCOL FAMILY RESOLUTION
//
// "AK820" is sold on two unrelated controllers. USB VID is the only reliable
// disambiguator (see docs/protocol-notes.md):
//   • 0x0C45 = Microdia / Sonix  -> 64-byte FEATURE report, mode at byte 0
//   • 0x320F = Yichip / "EVision" -> 64-byte OUTPUT report, cmd 0x06 frame
// protocol.ts originally drove every unit as EVision, so a Sonix keyboard
// (VID 0x0C45) received EVision packets and silently ignored them — which is
// why "single color does nothing" on those units.
// =====================================================================
export function resolveProtocolFamily(setting: ProtocolFamily, vid?: number): ProtocolFamilyResolved {
  if (setting === 'sonix') return 'sonix'
  if (setting === 'evision') return 'evision'
  // auto: 0x0C45 is Sonix; anything else (incl. 0x320F and unknown/demo) -> EVision
  return vid === VID_DEFAULT ? 'sonix' : 'evision'
}

// =====================================================================
// SONIX / MICRODIA LIGHTING FRAME (VID 0x0C45)
//
// A single 64-byte FEATURE report (NOT the EVision OUTPUT cmd-0x06 frame).
// Documented in docs/protocol-notes.md "Legacy: Sonix / Microdia" from
// gohv + TaxMachine RE of the AK820 Pro. Layout:
//   0      mode (firmware id; Static = 0x06)
//   1..3   R, G, B
//   4..7   0x00
//   8      rainbow flag (0/1)
//   9      brightness (0..5)
//   10     speed (0..4; 0 = fastest)
//   11     direction (0=L,1=U,2=D,3=R — sources disagree; passed through)
//   12..13 0x00
//   14     0x55 trailer (low byte)
//   15     0xAA trailer (high byte)
//   16..63 0x00
// Transport: WebHID sendFeatureReport(0, data64) with byte 0 = mode (report
// ID 0x00, mode as payload[0]); if the descriptor is numbered, Settings →
// Report ID mode = native sends reportId = mode with a 63-byte payload.
// =====================================================================
export const SONIX_TRAILER_LO = 0x55
export const SONIX_TRAILER_HI = 0xaa

export function buildSonixLightingPacket(o: LightingState): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = clamp(o.mode, 0, 0xff)
  pkt[0x01] = clamp(o.r, 0, 0xff)
  pkt[0x02] = clamp(o.g, 0, 0xff)
  pkt[0x03] = clamp(o.b, 0, 0xff)
  pkt[0x08] = o.rainbow ? 1 : 0
  pkt[0x09] = clamp(o.brightness, 0, 5)
  pkt[0x0a] = clamp(o.speed, 0, MAX_SPEED)
  pkt[0x0b] = clamp(o.direction, 0, 3)
  pkt[0x0e] = SONIX_TRAILER_LO
  pkt[0x0f] = SONIX_TRAILER_HI
  return pkt
}

// Single source of truth for "what packets does Apply send" — shared by the
// apply path (hooks.ts) and the wire inspector (LightingPanel) so the hex the
// user sees is exactly what goes on the wire.
export function buildApplyPackets(l: LightingState, family: ProtocolFamilyResolved): Uint8Array[] {
  if (family === 'sonix') {
    // Sonix has no documented per-key Custom blob (protocol-notes flags it
    // un-RE'd). Route per-key "Solid Color" to the Static single-color frame
    // so the picked RGB still lights the whole board.
    const mode = isPerKeyMode(l.mode) ? MODE_STATIC : l.mode
    return [buildSonixLightingPacket({ ...l, mode, rainbow: isPerKeyMode(l.mode) ? false : l.rainbow })]
  }
  // EVision (this keyboard): per-key Custom sends a mode switch + color chunks.
  // Everything else (including Static) uses the BEGIN + WRITE(21 bytes) + END
  // transaction confirmed by disassembling the official driver.
  return isPerKeyMode(l.mode) ? buildSolidColorPackets(l) : buildLightingPackets(l)
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
