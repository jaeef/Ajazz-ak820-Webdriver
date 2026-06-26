import { hexDump, buildLightingPacket } from '../protocol'
import type { LightingState } from '../types'

interface Props {
  lighting: LightingState
}

export function WireFormatInspector({ lighting }: Props) {
  return (
    <div className="row">
      <label>Wire format:</label>
      <div className="hex-inspector">
        {hexDump(buildLightingPacket(lighting))}
      </div>
    </div>
  )
}
