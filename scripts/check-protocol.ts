// Byte-exact checks against live vendor-app traffic captured with a WriteFile hook.
// Run: node scripts/check-protocol.ts
import assert from 'node:assert/strict'
import {
  buildLightingPackets, buildKeymapPackets, buildCustomColorPackets, defaultKeymap, hexDump, LED_COUNT,
  buildMacroPackets, textToMacro, buildReadPacket, buildKeyboardOptionsPackets, readKeyboardOptions,
} from '../src/lib/protocol.ts'
import type { LightingState } from '../src/lib/types.ts'

const pad = (s: string) => {
  const b = s.trim().split(/\s+/)
  return [...b, ...Array(64 - b.length).fill('00')].join(' ')
}
const BLOCK_TAIL = '00 00 00 00 00 00 00 00 00 00 00 FF 00 00 00 00 02'
const light = (o: Partial<LightingState>): LightingState =>
  ({ mode: 1, brightness: 3, speed: 4, r: 0, g: 0, b: 0, direction: 0, rainbow: false, ...o })
const cmd = (o: Partial<LightingState>) => hexDump(buildLightingPackets(light(o))[1])

// Lighting block: WR98 (session 1), WR104 / WR193 (session 2)
const [begin, , end] = buildLightingPackets(light({}))
assert.equal(hexDump(begin), pad('04 01 00 01'))
assert.equal(hexDump(end), pad('04 02 00 02'))
assert.equal(cmd({ r: 0xff, g: 0xf0, b: 0x05 }),
  pad('04 20 03 06 1D 00 00 00 00 01 03 04 00 00 FF F0 05 ' + BLOCK_TAIL))
assert.equal(cmd({ mode: 2, brightness: 1, speed: 2, direction: 1, r: 0xff }),
  pad('04 29 02 06 1D 00 00 00 00 02 01 02 01 00 FF 00 00 ' + BLOCK_TAIL), 'direction → data[4]')
assert.equal(cmd({ mode: 2, brightness: 1, speed: 2, rainbow: true, r: 0xff }),
  pad('04 29 02 06 1D 00 00 00 00 02 01 02 00 01 FF 00 00 ' + BLOCK_TAIL), 'random color → data[5]')

// Keymap: sync, begin, 7 chunks, end. Chunk 0 is the vendor's WR3703 verbatim.
const km = buildKeymapPackets(defaultKeymap())
assert.equal(km.length, 10)
assert.equal(hexDump(km[0]), pad('04 25 00 03 22'))
assert.equal(hexDump(km[2]), pad(
  '04 EA 07 09 38 00 00 00 20 00 29 20 00 35 20 00 2B 20 00 39 20 02 00 20 01 00 20 00 53 D0 A2 01 ' +
  '20 00 3A 20 00 1E 20 00 14 20 00 04 20 00 64 20 08 00 20 00 54 D0 A2 02 20 00 3B 20 00 1F 20 00'))
// Last chunk: the vendor leaves stale bytes after its 0x30 data bytes; compare the header and data only.
assert.equal(hexDump(km[8]).slice(9, 3 * (8 + 0x30)), pad(
  '04 D0 08 09 30 50 01 00 20 00 47 20 00 49 20 00 4C 20 00 4E 20 00 52 20 00 51 20 00 63 20 00 00 ' +
  '20 00 48 20 00 4A 20 00 4B 20 00 4D 20 00 59 20 00 4F 20 00 58 20 00 00').slice(9, 3 * (8 + 0x30)))

// Per-key: Esc (LED 0) blue lands at offset 0x400, as in the vendor's percustom_blue_esc write.
const buf = new Uint8Array(LED_COUNT * 3)
buf.set([0x31, 0x53, 0xff], 0)
const pk = buildCustomColorPackets(buf)
assert.equal(pk.length, 9)
assert.equal(hexDump(pk[1]).slice(0, 3 * 11 - 1), '04 CA 01 0B 38 00 04 00 31 53 FF')
assert.equal(hexDump(pk[7]).slice(9, 3 * 7 - 1), '0B 30 50 05')

// Macro: vendor upload of macro_2 (X/Y/Z, log marker macro3_assign). Bytes 6..15 and
// 20..21 of the block are stale memory in the vendor app, so they (and the checksum) are skipped.
const VENDOR_MACRO = '04 52 07 15 2E 00 00 00 AA 55 2E 00 01 00 59 04 48 3D 59 04 01 00 5A 74 12 00 06 00 19 00 ' +
  '1F 00 8A 1B 68 01 0A 1B 2F 00 8A 1C 67 01 0A 1C 1F 00 8A 1D 00 00 0A 1D'
const ev = (usage: number, down: boolean, delay: number) => ({ usage, down, delay })
const mp = buildMacroPackets([
  ev(0x1b, true, 31), ev(0x1b, false, 360), ev(0x1c, true, 47), ev(0x1c, false, 359), ev(0x1d, true, 31), ev(0x1d, false, 0),
])
assert.equal(mp.length, 4)
assert.equal(hexDump(mp[0]), pad('04 25 00 03 22'))
const ours = hexDump(mp[2]).split(' '), theirs = pad(VENDOR_MACRO).split(' ')
const junk = (i: number) => i === 1 || i === 2 || (i >= 8 + 6 && i < 8 + 16) || i === 8 + 20 || i === 8 + 21
theirs.forEach((b, i) => { if (!junk(i)) assert.equal(ours[i], b, `macro byte ${i}`) })
assert.deepEqual(textToMacro('ab').map(e => [e.usage, e.down]), [[4, true], [4, false], [5, true], [5, false]])

// Read-modify-write. BLOCK is the keyboard's reply to `05 1d` (read 2026-11-19).
const BLOCK = Uint8Array.from(
  '00 06 04 03 00 00 FF 72 00 00 00 00 00 00 00 00 00 00 00 00 FF 00 00 00 00 02 00 00 00'.split(' '), h => parseInt(h, 16))
assert.equal(hexDump(buildReadPacket(0x05, 0x1d)), pad('04 22 00 05 1D'))
assert.deepEqual(readKeyboardOptions(BLOCK), { wasdSwap: false, winLock: false, pollingRate: 0 })
// Vendor WR108: report rate 500 Hz → only data[22] changes.
assert.equal(hexDump(buildKeyboardOptionsPackets(BLOCK, { wasdSwap: false, winLock: false, pollingRate: 1 })[1]),
  pad('04 A3 02 06 1D 00 00 00 00 06 04 03 00 00 FF 72 00 00 00 00 00 00 00 00 00 00 00 00 FF 00 01 00 00 02'))
// A lighting write on top of a block with Win lock on keeps it on.
const locked = BLOCK.slice(); locked[21] = 1
assert.equal(buildLightingPackets(light({}), locked)[1][8 + 21], 1, 'lighting write must preserve Win lock')

console.log('protocol ok: lighting, keymap, per-key, macro and options match vendor captures')
