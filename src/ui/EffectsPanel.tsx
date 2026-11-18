import { useMemo } from 'react'
import type { LightingState, ProtocolFamilyResolved } from '../types'
import { WireFormatInspector } from './WireFormatInspector'
import {
  clampDirection, DEFAULT_MODE_ORDER, isPerKeyMode,
  modeName, buildApplyPackets, MAX_BRIGHTNESS, MAX_SPEED,
} from '../protocol'

interface Props {
  lighting: LightingState
  modes: string[]
  onChange: (next: LightingState) => void
  onApply: () => void
  onApplyPerKey: (packets: Uint8Array[]) => void
  onTestMode: () => void
  isLive: boolean
  family: ProtocolFamilyResolved
  calibrated?: Record<number, { works: string; colorWorks: string }>
}

export function EffectsPanel({
  lighting, modes, onChange, onApply, onApplyPerKey, onTestMode,
  isLive, family, calibrated,
}: Props) {
  const packets = useMemo(() => buildApplyPackets(lighting, family), [lighting, family])

  return (
    <div className="tab-panel active">
      <div className="row" style={{ fontWeight: 600 }}>Firmware Effects</div>
      <div className="help" style={{ marginTop: -2 }}>
        Pick a mode and apply it. Use <b>Test &amp; Approve</b> to verify which modes
        work on your keyboard. To set a specific color, use the <b>Solid Color</b> tab.
      </div>

      <div className="row">
        <label>Mode:</label>
        <select
          style={{ flex: 1 }}
          value={lighting.mode}
          onChange={e => onChange({ ...lighting, mode: parseInt(e.target.value, 10) })}
        >
          {DEFAULT_MODE_ORDER.map(value => {
            const c = calibrated?.[value]
            const badge = c ? (c.works === 'yes' ? ' ✓' : c.works === 'no' ? ' ✗' : '') : ''
            return (
              <option key={value} value={value}>
                {modeName(value, modes)}{badge}
              </option>
            )
          })}
        </select>
        <button className="secondary" onClick={onTestMode} title="Apply this mode, capture packets, and record whether it works">
          Test &amp; Approve
        </button>
      </div>

      <div className="row">
        <label>Brightness:</label>
        <div className="slider-row">
          <input
            type="range" min={0} max={MAX_BRIGHTNESS} step={1}
            value={lighting.brightness}
            onChange={e => onChange({ ...lighting, brightness: parseInt(e.target.value, 10) })}
          />
          <span className="slider-value">{lighting.brightness}</span>
        </div>
        <span className="help" style={{ margin: 0 }}>0 = off, {MAX_BRIGHTNESS} = brightest</span>
      </div>

      <div className="row">
        <label>Speed:</label>
        <div className="slider-row">
          <input
            type="range" min={0} max={MAX_SPEED} step={1}
            value={lighting.speed}
            onChange={e => onChange({ ...lighting, speed: parseInt(e.target.value, 10) })}
          />
          <span className="slider-value">{lighting.speed}</span>
        </div>
        <span className="help" style={{ margin: 0 }}>0 = fastest, {MAX_SPEED} = slowest</span>
      </div>

      <div className="row">
        <label>Direction:</label>
        <select
          value={lighting.direction}
          onChange={e => onChange({ ...lighting, direction: clampDirection(parseInt(e.target.value, 10)) })}
        >
          {/* vendor-verified: data[4] = 0 / 1; the meaning depends on the effect */}
          <option value={0}>Left → right (or inside)</option>
          <option value={1}>Right → left (or outside)</option>
        </select>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button onClick={onApply}>
          {isLive ? 'Apply effect' : 'Apply effect (idle)'}
        </button>
        <span className="pill">Ctrl+Enter</span>
      </div>

      <WireFormatInspector packets={packets} family={family} />
    </div>
  )
}
