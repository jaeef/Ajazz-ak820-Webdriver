// Plain-text problem report behind Settings → Report a problem: app and browser,
// the keyboard's USB IDs, its info and lighting blocks, every keymap slot that
// differs from factory, and the packets sent and received this session.
import type { DeviceInfo } from './types'
import type { DeviceController } from './device'
import { defaultKeymap, hexDump, type KeyAssignment } from './protocol'
import { KEY_LAYOUT } from './keymap'

export interface KeyboardReads { infoBlock: Uint8Array | null; lighting: Uint8Array | null; keymap: KeyAssignment[] | null }

const h4 = (n?: number) => (n === undefined ? '?' : '0x' + n.toString(16).toUpperCase().padStart(4, '0'))
const time = (t: number) => new Date(t).toISOString().slice(11, 23)
const slotName = (slot: number) => KEY_LAYOUT.find(k => k.id === slot)?.label ?? `slot ${slot}`
const triple = (a: KeyAssignment) => a.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')

export function buildReport(controller: DeviceController, info: DeviceInfo | null, family: string, reads: KeyboardReads | null) {
  const out: string[] = []
  out.push(`AK820 Web Driver v${__APP_VERSION__} · ${new Date().toISOString()}`)
  out.push(`Browser: ${navigator.userAgent}`)
  out.push(info
    ? `Device: ${info.productName} · VID ${h4(info.vendorId)} PID ${h4(info.productId)} · usage page ${h4(info.usagePage)} · output [${info.outputReportIds?.join(', ') ?? ''}] feature [${info.featureReportIds?.join(', ') ?? ''}] · ${family}`
    : 'Device: not connected')
  if (reads) {
    out.push(`Info block (03 22): ${reads.infoBlock ? hexDump(reads.infoBlock) : 'no reply'}`)
    out.push(`Lighting block (05 1D): ${reads.lighting ? hexDump(reads.lighting) : 'no reply'}`)
    if (!reads.keymap) out.push('Keymap (07): no reply')
    else {
      const factory = defaultKeymap()
      const diff = reads.keymap.map((a, i) => [a, i] as const).filter(([a, i]) => triple(a) !== triple(factory[i]))
      out.push(`Keymap (07): ${diff.length} key(s) differ from factory`)
      diff.forEach(([a, i]) => out.push(`  ${slotName(i)} (slot ${i}): ${triple(a)}, factory ${triple(factory[i])}`))
    }
  }
  const summary = out.join('\n')
  const log = controller.log.slice(-400)
  const packets = [`Packets this session (last ${log.length}):`,
    ...log.map(e => `${time(e.timestamp)} ${e.dir === 'in' ? 'IN ' : 'OUT'} rid=${e.reportId} ${hexDump(e.data)}`)].join('\n')
  const title = `Problem report: ${info ? `${h4(info.vendorId)}:${h4(info.productId)}` : 'not connected'} v${__APP_VERSION__}`
  return { title, summary, full: `${summary}\n\n${packets}` }
}
