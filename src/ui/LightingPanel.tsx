import { useMemo } from 'react'
import type { LightingState } from '../types'
import { ColorPalette } from './ColorPalette'
import { WireFormatInspector } from './WireFormatInspector'
import { hexToRgb, rgbToHex, clampDirection, DEFAULT_MODE_ORDER, isPerKeyMode, isColorMode, modeName } from '../protocol'

interface Props {
  lighting: LightingState
  modes: string[]
  onChange: (next: LightingState) => void
  onApply: () => void
  isLive: boolean
}

export function LightingPanel({ lighting, modes, onChange, onApply, isLive }: Props) {
  const colorHex = rgbToHex(lighting.r, lighting.g, lighting.b)
  const colorCapable = isColorMode(lighting.mode)

  const previewStyle = useMemo(() => {
    const glow = `rgba(${lighting.r}, ${lighting.g}, ${lighting.b}, ${0.4 * (lighting.brightness / 4)})`
    return { background: colorHex, boxShadow: `0 0 8px ${glow}` }
  }, [colorHex, lighting.r, lighting.g, lighting.b, lighting.brightness])

  return (
    <div className="tab-panel active">
      <div className="row">
        <label>Mode:</label>
        <select
          id="modeSelect"
          style={{ flex: 1 }}
          value={lighting.mode}
          onChange={e => onChange({ ...lighting, mode: parseInt(e.target.value, 10) })}
        >
          {DEFAULT_MODE_ORDER.map(value => (
            <option key={value} value={value}>
              {modeName(value, modes)}
            </option>
          ))}
        </select>
        <span className="preview" style={previewStyle} />
      </div>

      <div className="help" style={{ marginTop: -4 }}>
        {isPerKeyMode(lighting.mode)
          ? '“Custom (per-key)” writes the exact RGB to every key — use this for a precise static color.'
          : colorCapable
            ? '“Static” shows the single color you pick below.'
            : 'This effect runs the keyboard’s built-in colors and ignores the color picker. For a specific color, choose “Custom (per-key)” or “Static”.'}
      </div>

      {colorCapable && (
        <div className="row">
          <label>Color:</label>
          <ColorPalette
            r={lighting.r} g={lighting.g} b={lighting.b}
            onSelect={hex => onChange({ ...lighting, ...hexToRgb(hex) })}
          />
          <input
            type="color"
            value={colorHex}
            onChange={e => onChange({ ...lighting, ...hexToRgb(e.target.value) })}
            title="Custom color"
          />
        </div>
      )}

      <div className="row">
        <label>Brightness:</label>
        <div className="slider-row">
          <input
            type="range" min={0} max={4} step={1}
            value={lighting.brightness}
            onChange={e => onChange({ ...lighting, brightness: parseInt(e.target.value, 10) })}
          />
          <span className="slider-value">{lighting.brightness}</span>
        </div>
        <span className="help" style={{ margin: 0 }}>0 = off, 4 = brightest</span>
      </div>

      <div className="row">
        <label>Speed:</label>
        <div className="slider-row">
          <input
            type="range" min={0} max={5} step={1}
            value={lighting.speed}
            onChange={e => onChange({ ...lighting, speed: parseInt(e.target.value, 10) })}
          />
          <span className="slider-value">{lighting.speed}</span>
        </div>
        <span className="help" style={{ margin: 0 }}>0 = fastest, 5 = slowest</span>
      </div>

      <div className="row">
        <label>Direction:</label>
        <select
          value={lighting.direction}
          onChange={e => onChange({ ...lighting, direction: clampDirection(parseInt(e.target.value, 10)) })}
        >
          <option value={0}>Left</option>
          <option value={1}>Up</option>
          <option value={2}>Down</option>
          <option value={3}>Right</option>
        </select>
      </div>

      <div className="row" style={{ marginTop: 16 }}>
        <button onClick={onApply}>
          {isLive ? 'Apply to keyboard' : 'Apply (idle)'}
        </button>
        <span className="pill">Ctrl+Enter</span>
      </div>

      <WireFormatInspector lighting={lighting} />
    </div>
  )
}
