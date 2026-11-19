import { Binary } from 'lucide-react'
import { hexDump } from '../protocol'
import type { ProtocolFamilyResolved } from '../types'

interface Props {
  packets: Uint8Array[]
  family: ProtocolFamilyResolved
}

// The exact reports the next Apply will send, one row per 64-byte packet.
export function WireFormatInspector({ packets, family }: Props) {
  return (
    <div className="stack">
      <div className="panel__head">
        <h2><Binary aria-hidden /> Next Apply sends</h2>
        <span className="pill">{family} · {packets.length} packet{packets.length === 1 ? '' : 's'}</span>
      </div>
      <div className="table-wrap">
        <table className="table table--mono">
          <tbody>
            {packets.map((p, i) => (
              <tr key={i}><td className="num">#{i + 1}</td><td className="table__hex">{hexDump(p)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
