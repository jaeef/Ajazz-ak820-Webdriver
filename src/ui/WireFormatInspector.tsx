import { hexDump } from '../protocol'
import type { ProtocolFamilyResolved } from '../types'

interface Props {
  packets: Uint8Array[]
  family: ProtocolFamilyResolved
}

export function WireFormatInspector({ packets, family }: Props) {
  return (
    <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <label>
        Wire format <span className="help" style={{ margin: 0 }}>({family} · {packets.length} packet{packets.length === 1 ? '' : 's'}):</span>
      </label>
      <div className="hex-inspector">
        {packets.map((p, i) => (
          <div key={i} style={{ whiteSpace: 'pre', fontFamily: 'inherit' }}>
            {packets.length > 1 && <span className="help" style={{ marginRight: 8 }}>#{i + 1}</span>}
            {hexDump(p)}
          </div>
        ))}
      </div>
    </div>
  )
}
