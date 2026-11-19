import type { LightingState, Direction, ReportIdMode, ProtocolFamily, ProtocolFamilyResolved } from './types'

// =====================================================================
// EVision keyboard protocol ("eevision" family)
//
// The Ajazz AK820 unit this targets (live-enumerated as VID 0x320F / PID 0x505B)
// is an "EVision" controller, the same
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
//   • byte 3      : command (0x01 begin, 0x02 end, 0x06 write parameter block)
//   • byte 4      : data length (0x1d = 29 for the lighting block)
//   • bytes 5..6  : data offset, little-endian
//   • bytes 8..   : data
// Ground truth: live WriteFile hook on the vendor app driving a real AK820,
// 36/36 writes decoded — see docs/protocol.md.
// =====================================================================

// IDs the live AK820 reports (docs/protocol.md). The vendor bundle's
// Keyboard.json lists 0x0C45/0x1007, but the board the vendor app actually
// talked to during the live capture enumerated as 0x320F/0x505B.
export const VID_DEFAULT = 0x320f
export const PID_DEFAULT = 0x505b

export const PACKET_LENGTH = 64

// Commands (byte 3)
const CMD_BEGIN = 0x01
const CMD_END = 0x02
const CMD_SYNC = 0x03 // `03 22`: device-info read (AA 55 block); vendor issues it before keymap/macro writes
const CMD_WRITE_LIGHTING = 0x06 // 29-byte lighting block at offset 0
const CMD_WRITE_KEYMAP = 0x09 // 128 × [type, modifier, usage] at offset 0
const CMD_READ_KEYMAP = 0x07 // same layout as 0x09
const CMD_WRITE_PERKEY = 0x0b // 128 × [R, G, B] at offset 0x400
const CMD_WRITE_MACROS = 0x15 // macro table, see buildMacroPackets

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
  0x06, // 6  Static — picked color (confirmed by capture)
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

// The 29-byte (0x1d) lighting block the vendor app writes at offset 0.
// Decoded from live vendor-app traffic (docs/protocol.md), e.g.
//   04 20 03 06 1d 00 00 00 | 00 01 03 04 00 00 ff f0 05 … ff@28 … 02@33
//
//   data[1]   mode       verified: 01 Corrugated / 02 Cloud / 05 Breath / 08 Ripples / 14 Custom
//   data[2]   brightness observed 1..4
//   data[3]   speed      observed 2..4
//   data[4]   direction  verified: 0 = left→right / inside, 1 = right→left / outside
//   data[5]   random-color flag, verified: rainbow swatch sets 1
//   data[6..8] R,G,B     verified by clicking known palette swatches
//   data[19]  WASD ↔ arrow swap (vendor "Exchange Key"), 1 = on
//   data[21]  Windows key lock, 1 = on
//   data[22]  USB report rate: 0 1000 Hz / 1 500 / 2 250 / 3 125
//   data[0], [20] (0xff), [25] (0x02) and the zero bytes are firmware-owned:
//   the vendor app never sets them, it reads the block (CMD 0x05) and writes
//   them back unchanged. We do the same when a `base` block is available.
//
// The previous 21-byte block (0x03 / RGB at data[5..7] / 0x03) was "confirmed"
// against ak820-capture-*.json — but that file is this app's own CapturePanel
// export, so it only echoed what we sent. The keyboard echoes every report,
// so an echo is not acceptance.
export const LIGHTING_BLOCK_LEN = 0x1d
// What the keyboard reported for a fresh unit; used when no read-back is available.
const LIGHTING_DEFAULTS = (() => { const d = new Uint8Array(LIGHTING_BLOCK_LEN); d[20] = 0xff; d[25] = 0x02; return d })()

function buildLightingData(o: LightingState, base: Uint8Array = LIGHTING_DEFAULTS): Uint8Array {
  const data = Uint8Array.from(base.subarray(0, LIGHTING_BLOCK_LEN))
  data[1] = clamp(o.mode, 0, 0xff)
  data[2] = clamp(o.brightness, 0, MAX_BRIGHTNESS)
  data[3] = clamp(o.speed, 0, MAX_SPEED)
  data[4] = clamp(o.direction, 0, 3)
  data[5] = o.rainbow ? 1 : 0
  data[6] = clamp(o.r, 0, 0xff)
  data[7] = clamp(o.g, 0, 0xff)
  data[8] = clamp(o.b, 0, 0xff)
  return data
}

// Keyboard options that live in the lighting block.
export interface KeyboardOptions { wasdSwap: boolean; winLock: boolean; pollingRate: 0 | 1 | 2 | 3 }
export const POLLING_RATES = ['1000 Hz', '500 Hz', '250 Hz', '125 Hz'] as const

export function readKeyboardOptions(block: Uint8Array): KeyboardOptions {
  return { wasdSwap: block[19] === 1, winLock: block[21] === 1, pollingRate: (block[22] & 3) as KeyboardOptions['pollingRate'] }
}

// Rewrite the device's own block with new options; every other byte unchanged.
export function buildKeyboardOptionsPackets(block: Uint8Array, opt: KeyboardOptions): Uint8Array[] {
  const data = Uint8Array.from(block.subarray(0, LIGHTING_BLOCK_LEN))
  data[19] = opt.wasdSwap ? 1 : 0
  data[21] = opt.winLock ? 1 : 0
  data[22] = opt.pollingRate
  return buildChunkedWrite(CMD_WRITE_LIGHTING, data)
}

// Read request: cmd, length, offset, no data. The keyboard answers with the
// same header and the requested bytes from byte 8 (input report 4).
//   05 len 0x1d → lighting block   07 → keymap   1B → 128-entry key→LED map
//   03 len 0x22 → device info (AA 55 magic, VID at bytes 21..22)
export const CMD_READ_LIGHTING = 0x05
export function buildReadPacket(cmd: number, length: number, offset = 0): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = cmd
  pkt[0x04] = length
  pkt[0x05] = offset & 0xff
  pkt[0x06] = (offset >> 8) & 0xff
  applyChecksum(pkt)
  return pkt
}

// One write packet: byte 3 cmd, byte 4 length, bytes 5..6 offset LE, data from byte 8.
function buildWritePacket(cmd: number, data: Uint8Array, offset: number): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = cmd
  pkt[0x04] = data.length & 0xff
  pkt[0x05] = offset & 0xff
  pkt[0x06] = (offset >> 8) & 0xff
  pkt.set(data, 0x08)
  applyChecksum(pkt)
  return pkt
}

// BEGIN + data split into 0x38-byte chunks + END — the vendor's framing for
// every multi-packet write (keymap, per-key colors).
const WRITE_CHUNK = 0x38
function buildChunkedWrite(cmd: number, data: Uint8Array, baseOffset = 0): Uint8Array[] {
  const pkts = [buildBeginPacket()]
  for (let off = 0; off < data.length; off += WRITE_CHUNK) {
    pkts.push(buildWritePacket(cmd, data.subarray(off, off + WRITE_CHUNK), baseOffset + off))
  }
  pkts.push(buildEndPacket())
  return pkts
}

// Single packet representation for the wire inspector.
export function buildLightingPacket(o: LightingState): Uint8Array {
  return buildWritePacket(CMD_WRITE_LIGHTING, buildLightingData(o), 0)
}

// The packet sequence the vendor sends for any lighting change, Static included.
export function buildLightingPackets(o: LightingState, base?: Uint8Array): Uint8Array[] {
  return buildChunkedWrite(CMD_WRITE_LIGHTING, buildLightingData(o, base))
}

// Per-key colors: 128 LEDs × RGB, LED index = keymap slot (column-major,
// Esc 0 / W 18 / Enter 107 verified). Vendor order: colors, then Custom mode.
export const LED_COUNT = 128
const PERKEY_OFFSET = 0x400

export function buildCustomColorPackets(buf: Uint8Array): Uint8Array[] {
  return buildChunkedWrite(CMD_WRITE_PERKEY, buf, PERKEY_OFFSET)
}

export function buildCustomModePacket(o: LightingState, base?: Uint8Array): Uint8Array[] {
  return buildLightingPackets({ ...o, mode: MODE_CUSTOM, rainbow: false }, base)
}

// --- Key remap ---------------------------------------------------------
// 128 slots × [type, modifier, usage]. type 0x20 = keyboard (modifier is the
// HID modifier bitmask, usage the HID usage), 0x70 = macro (modifier = macro
// index), 0x30 = consumer, 0xA0 = Fn, 0xD0 = Fn-layer. Default table captured
// from the vendor app's keymap write; index = slot.
export type KeyAssignment = readonly [number, number, number]
export const KEYMAP_SLOTS = 128

// ponytail: verbatim from the live capture (E:\Tools\ghidra-dist\default-keymap.txt).
const DEFAULT_KEYMAP_HEX =
  '20002920003520002B200039200200200100200053D0A201' +
  '20003A20001E200014200004200064200800200054D0A202' +
  '20003B20001F20001A20001620001D200400200055D0A203' +
  '20003C20002020000820000720001B200000200056D0A204' +
  '20003D20002120001520000920000620000020005FD0A205' +
  '20003E20002220001720000A20001920002C200060D0A206' +
  '20003F20002320001C20000B200005200000200061D0A207' +
  '20004020002420001820000D20001120000020005CD0A208' +
  '20004120002520000C20000E20001020000020005D200000' +
  '20004220002620001220000F20003620400020005E200000' +
  '200043200027200013200033200037A0010020005730E900' +
  '20004420002D20002F20003420003820100020005A308301' +
  '20004520002E20003020003220000020006520005B30E200' +
  '30E20020002A20003120002820200020005020006230EA00' +
  '20004720004920004C20004E200052200051200063200000' +
  '20004820004A20004B20004D20005920004F200058200000'

export function defaultKeymap(): KeyAssignment[] {
  const out: KeyAssignment[] = []
  for (let i = 0; i < KEYMAP_SLOTS; i++) {
    const h = DEFAULT_KEYMAP_HEX.slice(i * 6, i * 6 + 6)
    out.push([parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)])
  }
  return out
}

// `04 25 00 03 22 00…` — device-info read the vendor issues before each keymap/macro write.
export function buildSyncPacket(): Uint8Array {
  const pkt = new Uint8Array(PACKET_LENGTH)
  pkt[0x00] = REPORT_PREFIX
  pkt[0x03] = CMD_SYNC
  pkt[0x04] = 0x22
  applyChecksum(pkt)
  return pkt
}

// --- Macros --------------------------------------------------------------
// The vendor uploads only assigned macros, the first as index 0, and the key
// slot gets [0x70, index, 0]. Block (two live samples):
//   AA 55 | total len u16 | count u16 | 10 junk | 12 00 | n events u16 | 2 junk | events
//   event = delay u16 (ms, after this event) | 0x8A down / 0x0A up | HID usage
// The junk bytes differ between uploads (stale memory in the vendor app); we send zeros.
// ponytail: one macro only — the multi-macro directory layout was never captured.
export interface MacroEvent { usage: number; down: boolean; delay: number }
export const MACRO_KEY: KeyAssignment = [0x70, 0, 0]

export function buildMacroPackets(events: readonly MacroEvent[]): Uint8Array[] {
  const data = new Uint8Array(22 + events.length * 4)
  data.set([0xaa, 0x55, data.length & 0xff, data.length >> 8, 1, 0], 0)
  data.set([0x12, 0, events.length & 0xff, events.length >> 8], 16)
  events.forEach((e, i) => {
    const d = clamp(e.delay, 0, 0xffff)
    data.set([d & 0xff, d >> 8, e.down ? 0x8a : 0x0a, e.usage & 0xff], 22 + i * 4)
  })
  return [buildSyncPacket(), ...buildChunkedWrite(CMD_WRITE_MACROS, data)]
}

// Text → press/release events for a-z, 0-9, space and Enter.
export function textToMacro(text: string, delay = 20): MacroEvent[] {
  const usage = (c: string) =>
    c >= 'a' && c <= 'z' ? 0x04 + c.charCodeAt(0) - 97
    : c >= '1' && c <= '9' ? 0x1e + c.charCodeAt(0) - 49
    : c === '0' ? 0x27 : c === ' ' ? 0x2c : c === '\n' ? 0x28 : -1
  return [...text.toLowerCase()].map(usage).filter(u => u >= 0)
    .flatMap(u => [{ usage: u, down: true, delay }, { usage: u, down: false, delay }])
}

export const KEYMAP_BYTES = KEYMAP_SLOTS * 3

export function buildKeymapReadPackets(): Uint8Array[] {
  const out: Uint8Array[] = []
  for (let off = 0; off < KEYMAP_BYTES; off += WRITE_CHUNK) {
    out.push(buildReadPacket(CMD_READ_KEYMAP, Math.min(WRITE_CHUNK, KEYMAP_BYTES - off), off))
  }
  return out
}

export function parseKeymap(bytes: Uint8Array): KeyAssignment[] | null {
  if (bytes.length < KEYMAP_BYTES) return null
  const out: KeyAssignment[] = []
  for (let i = 0; i < KEYMAP_SLOTS; i++) out.push([bytes[i * 3], bytes[i * 3 + 1], bytes[i * 3 + 2]])
  return out
}

// With `base` (the table the keyboard holds) only windows that differ are sent,
// so a one-key remap can never zero a slot the app does not model.
export function buildKeymapPackets(map: readonly KeyAssignment[], base?: readonly KeyAssignment[]): Uint8Array[] {
  const data = new Uint8Array(KEYMAP_BYTES)
  map.forEach((a, i) => data.set(a, i * 3))
  const before = new Uint8Array(KEYMAP_BYTES)
  if (base) base.forEach((a, i) => before.set(a, i * 3))

  const pkts = [buildBeginPacket()]
  let wrote = false
  for (let off = 0; off < KEYMAP_BYTES; off += WRITE_CHUNK) {
    const end = Math.min(off + WRITE_CHUNK, KEYMAP_BYTES)
    const chunk = data.subarray(off, end)
    if (base && chunk.every((b, i) => b === before[off + i])) continue
    pkts.push(buildWritePacket(CMD_WRITE_KEYMAP, chunk, off))
    wrote = true
  }
  if (!wrote) return []
  pkts.push(buildEndPacket())
  return [buildSyncPacket(), ...pkts]
}

// =====================================================================
// PROTOCOL FAMILY RESOLUTION
//
// "AK820" is sold on two unrelated controllers. USB VID *alone* is NOT a
// reliable disambiguator: the bundled official-driver unit (VID 0x0C45 /
// PID 0x1007, chip VS11K34A — the "eevision" family, see the CORRECTION block
// in docs/legacy-protocol-notes.md) is **EVision** and speaks a 64-byte OUTPUT
// report, while the AK820 *Pro* reuses the same VID 0x0C45 with PID 0x8009
// and is **Sonix** (64-byte FEATURE report, mode at byte 0). The older
// Yichip/EVision boards used VID 0x320F.
//
// So `auto` decides by PID first, then VID:
//   • PID 0x8009                -> Sonix  (AK820 Pro)
//   • VID 0x320F                -> EVision (old Yichip family)
//   • anything else (incl. the bundled 0x0C45/0x1007 and unknown/demo)
//                              -> EVision (the default AK820 this driver targets)
//
// Before this fix, `auto` mapped VID 0x0C45 -> 'sonix', so the bundled AK820
// received Sonix feature-report packets (mode at byte 0, 0x55 0xAA trailer)
// which its EVision controller silently ignored — which is exactly why
// "toggling the software did nothing" and the color/mode never matched.
// =====================================================================
export const VID_EVISION_OLD = 0x320f // legacy Yichip / OpenRGB generic EVision
export const PID_SONIX_AK820_PRO = 0x8009 // AK820 Pro (Sonix) wired PID

export function resolveProtocolFamily(
  setting: ProtocolFamily,
  vid?: number,
  pid?: number,
): ProtocolFamilyResolved {
  if (setting === 'sonix') return 'sonix'
  if (setting === 'evision') return 'evision'
  // auto: PID 0x8009 is the Sonix AK820 Pro regardless of VID.
  if (pid === PID_SONIX_AK820_PRO) return 'sonix'
  // Old Yichip VID 0x320F is the EVision family.
  if (vid === VID_EVISION_OLD) return 'evision'
  // The bundled AK820 (0x0C45/0x1007) and any unknown/demo unit default to
  // EVision — the protocol this driver was built against.
  return 'evision'
}

// =====================================================================
// SONIX / MICRODIA LIGHTING FRAME (VID 0x0C45)
//
// A single 64-byte FEATURE report (NOT the EVision OUTPUT cmd-0x06 frame).
// Documented in docs/legacy-protocol-notes.md "Legacy: Sonix / Microdia" from
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
// apply path (hooks.ts) and the wire inspector so the hex the user sees is
// exactly what goes on the wire.
//
//   • EVision: BEGIN + 29-byte lighting block + END for every mode.
export function buildApplyPackets(l: LightingState, family: ProtocolFamilyResolved, base?: Uint8Array): Uint8Array[] {
  if (family === 'sonix') {
    return [buildSonixLightingPacket({ ...l, rainbow: l.rainbow })]
  }
  // EVision: the vendor sends only the lighting block, Static included.
  return buildLightingPackets(l, base)
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
  mode: MODE_STATIC, // Static (firmware 6) — the one mode confirmed by capture
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
