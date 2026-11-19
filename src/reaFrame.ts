// Isolated reference implementation of the AJAZZ AK820 64-byte HID frame
// verified by the fresh RE pass (docs/rea-protocol.md). This module is not
// imported by the app; it exists to keep the confirmed wire format usable and
// testable without changing existing behavior.

export const REA_PACKET_LENGTH = 64
export const REA_REPORT_PREFIX = 0x04
export const REA_CMD_SET_PARAMETER = 0x06
export const REA_PARAM_COLOR = 0x1d
export const REA_CMD_BEGIN = 0x01
export const REA_CMD_END = 0x02

export interface ReaFrame {
  command: number
  parameter: number
  page: number
  submode: number
  rgb: readonly [number, number, number]
}

/** Unsigned little-endian checksum over packet bytes 3..63. */
export function reaChecksum(packet: Uint8Array): number {
  let sum = 0
  for (let i = 3; i < REA_PACKET_LENGTH; i++) sum += packet[i]
  return sum & 0xffff
}

/** True when packet length, prefix and checksum match the verified format. */
export function verifyReaChecksum(packet: Uint8Array): boolean {
  if (packet.length !== REA_PACKET_LENGTH) return false
  if (packet[0] !== REA_REPORT_PREFIX) return false
  const stored = packet[1] | (packet[2] << 8)
  return stored === reaChecksum(packet)
}

/** Build a complete 64-byte command packet, checksum included. */
export function buildReaFrame(frame: ReaFrame): Uint8Array {
  const packet = new Uint8Array(REA_PACKET_LENGTH)
  packet[0] = REA_REPORT_PREFIX
  packet[3] = frame.command & 0xff
  packet[4] = frame.parameter & 0xff
  packet[9] = frame.page & 0xff
  packet[10] = frame.submode & 0xff
  packet[11] = 0x04
  packet[14] = frame.rgb[0] & 0xff
  packet[15] = frame.rgb[1] & 0xff
  packet[16] = frame.rgb[2] & 0xff
  packet[28] = 0xff
  packet[33] = 0x02
  const sum = reaChecksum(packet)
  packet[1] = sum & 0xff
  packet[2] = (sum >> 8) & 0xff
  return packet
}

/** Build the begin handshake sent before a command. */
export function buildReaBeginPacket(): Uint8Array {
  const packet = new Uint8Array(REA_PACKET_LENGTH)
  packet[0] = REA_REPORT_PREFIX
  packet[3] = REA_CMD_BEGIN
  const sum = reaChecksum(packet)
  packet[1] = sum & 0xff
  packet[2] = (sum >> 8) & 0xff
  return packet
}

/** Build the end handshake sent after a command. */
export function buildReaEndPacket(): Uint8Array {
  const packet = new Uint8Array(REA_PACKET_LENGTH)
  packet[0] = REA_REPORT_PREFIX
  packet[3] = REA_CMD_END
  const sum = reaChecksum(packet)
  packet[1] = sum & 0xff
  packet[2] = (sum >> 8) & 0xff
  return packet
}

/** Parse a verified packet back into its known fields. */
export function parseReaFrame(packet: Uint8Array): ReaFrame | null {
  if (!verifyReaChecksum(packet)) return null
  return {
    command: packet[3],
    parameter: packet[4],
    page: packet[9],
    submode: packet[10],
    rgb: [packet[14], packet[15], packet[16]] as [number, number, number],
  }
}
