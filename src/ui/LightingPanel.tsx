import { useMemo } from 'react'
import type { LightingState, ProtocolFamilyResolved } from '../types'
import { ColorPalette } from './ColorPalette'
import { WireFormatInspector } from './WireFormatInspector'
import { KeyboardView } from './KeyboardView'
import {
  hexToRgb, rgbToHex, clampDirection, DEFAULT_MODE_ORDER, isPerKeyMode,
  modeName, buildApplyPackets, MODE_STATIC, MAX_BRIGHTNESS, MAX_SPEED,
} from '../protocol'

interface Props {
  lighting: LightingState
  modes: string[]
  onChange: (next: LightingState) => void
  onSolidColor: (hex: string) => void
  onApply: () => void
  onApplySolid: () => void
  onApplyPerKey: (packets: Uint8Array[]) => void
  onTestMode: () => void
  isLive: boolean
  family: ProtocolFamilyResolved
  // Map of mode → last calibration result, so the dropdown can badge
  // verified modes. Optional — App may omit it if no results exist yet.
  calibrated?: Record<number, { works: string; colorWorks: string }>
}

export function LightingPanel({ lighting, modes, onChange, onSolidColor, onApply, onApplySolid, onApplyPerKey, onTestMode, isLive, family, calibrated }: Props) {
  const colorHex = rgbToHex(lighting.r, lighting.g, lighting.b)
  const isStatic = lighting.mode === MODE_STATIC

  const previewStyle = useMemo(() => {
    const glow = `rgba(${lighting.r}, ${lighting.g}, ${lighting.b}, ${0.55 * (lighting.brightness / 4)})`
    return { background: colorHex, boxShadow: `0 0 16px ${glow}` }
  }, [colorHex, lighting.r, lighting.g, lighting.b, lighting.brightness])

  const packets = useMemo(() => buildApplyPackets(lighting, family), [lighting, family])

  return (
    <div className="tab-panel active">
      {/* ===== Solid Color — full RGB, always available, separate from effects ===== */}
      <div className="row" style={{ fontWeight: 600 }}>Solid Color</div>
      <div className="help" style={{ marginTop: -2 }}>
        Pick any RGB color and apply it — the whole keyboard lights up in that color.
        This uses Static mode (firmware mode 6, &ldquo;Normal&rdquo;), the one mode that
        honors the picked color on both EVision and Sonix keyboards.
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
        <span className="pill">{isStatic ? 'Static mode' : 'switches to Static'}</span>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '16px 0' }} />

      {/* ===== Effects ===== */}
      <div className="row" style={{ fontWeight: 600 }}>Effects</div>
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
        <button
          className="secondary"
          onClick={onTestMode}
          title="Apply this mode to the keyboard, capture the packets sent, and record whether the mode works and whether color can be changed"
        >
          Test &amp; Approve
        </button>
      </div>
      <div className="help" style={{ marginTop: -4 }}>
        {isPerKeyMode(lighting.mode)
          ? '"Custom (per-key)" writes the exact RGB to every key (EVision only).'
          : isStatic
            ? '"Static" shows the single color you picked above.'
            : 'This effect runs the keyboard\u2019s built-in colors and ignores the color picker. For a specific color, use "Apply solid color" above.'}
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

      {isPerKeyMode(lighting.mode) && (
        <KeyboardView
          lighting={lighting}
          isLive={isLive}
          family={family}
          onApplyPerKey={onApplyPerKey}
        />
      )}
    </div>
  )
}
