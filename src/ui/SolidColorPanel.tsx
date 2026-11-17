import { useMemo } from 'react'
import type { LightingState, ProtocolFamilyResolved } from '../types'
import { ColorPalette } from './ColorPalette'
import { WireFormatInspector } from './WireFormatInspector'
import {
  rgbToHex, hexToRgb, buildApplyPackets, MODE_STATIC, MAX_BRIGHTNESS,
} from '../protocol'

interface Props {
  lighting: LightingState
  onChange: (next: LightingState) => void
  onSolidColor: (hex: string) => void
  onApplySolid: () => void
  onTestMode: () => void
  isLive: boolean
  family: ProtocolFamilyResolved
  calibrated?: Record<number, { works: string; colorWorks: string }>
}

// Dedicated Solid Color tab — the simplest path: pick a color, set
// brightness, apply. Forces Static mode (firmware 6), the one mode that
// honors the picked RGB. No mode dropdown, no speed/direction — those live
// on the Effects tab. This separation matches how the user thinks: "I just
// want to set a color" vs "I want to pick an effect."
export function SolidColorPanel({ lighting, onChange, onSolidColor, onApplySolid, onTestMode, isLive, family, calibrated }: Props) {
  const colorHex = rgbToHex(lighting.r, lighting.g, lighting.b)

  const previewStyle = useMemo(() => {
    const glow = `rgba(${lighting.r}, ${lighting.g}, ${lighting.b}, ${0.55 * (lighting.brightness / 4)})`
    return { background: colorHex, boxShadow: `0 0 16px ${glow}` }
  }, [colorHex, lighting.r, lighting.g, lighting.b, lighting.brightness])

  // For the wire inspector, show what a solid-color apply sends.
  const packets = useMemo(
    () => buildApplyPackets({ ...lighting, mode: MODE_STATIC, rainbow: false }, family),
    [lighting, family],
  )

  const calib = calibrated?.[MODE_STATIC]

  return (
    <div className="tab-panel active">
      <div className="row" style={{ fontWeight: 600 }}>
        Solid Color
        {calib && (
          <span className="pill" style={{
            background: calib.works === 'yes' ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
            color: calib.works === 'yes' ? 'var(--success)' : 'var(--error)',
          }}>
            {calib.works === 'yes' ? '✓ verified' : calib.works === 'no' ? '✗ not working' : '? unverified'}
          </span>
        )}
      </div>
      <div className="help" style={{ marginTop: -2 }}>
        Pick any RGB color and apply it — the whole keyboard lights up in that color.
        This uses Static mode (firmware mode 6, &ldquo;Normal&rdquo;), the one mode that
        honors the picked color.
      </div>

      <div className="row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <ColorPalette r={lighting.r} g={lighting.g} b={lighting.b} onSelect={onSolidColor} />
        <input
          type="color"
          value={colorHex}
          onChange={e => onSolidColor(e.target.value)}
          title="Full RGB color picker"
        />
        <input
          type="text"
          value={colorHex.toUpperCase()}
          onChange={e => {
            const v = e.target.value.trim()
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onSolidColor(v)
          }}
          style={{ width: 90 }}
          title="Hex color (e.g. #FF00AA)"
        />
        <span className="preview" style={previewStyle} title="Live color preview" />
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

      <div className="row" style={{ marginTop: 12 }}>
        <button onClick={onApplySolid}>
          {isLive ? 'Apply solid color' : 'Apply solid color (idle)'}
        </button>
        <button className="secondary" onClick={onTestMode}>
          Test &amp; Approve
        </button>
      </div>

      <WireFormatInspector packets={packets} family={family} />
    </div>
  )
}
