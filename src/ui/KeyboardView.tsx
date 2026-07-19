import { useCallback, useMemo, useRef, useState } from 'react'
import { KEY_LAYOUT, FULL_LED_COUNT, type KeyDef } from '../keymap'
import { LED_COUNT, buildCustomModePacket, buildCustomColorPackets, buildBeginPacket, buildEndPacket, hexToRgb, rgbToHex, DEFAULT_PALETTE } from '../protocol'
import type { LightingState, ProtocolFamilyResolved } from '../types'

// Scale factor: the official skin coords span ~100..575 x and ~17..202 y.
// We scale to fit the container width and compute proportional positions.
const SKIN_OFFSET_X = 100
const SKIN_OFFSET_Y = 15
const SKIN_SCALE = 0.72

interface Props {
  lighting: LightingState
  isLive: boolean
  family: ProtocolFamilyResolved
  onApplyPerKey: (packets: Uint8Array[]) => void
}

function scaleKey(k: KeyDef) {
  return {
    left: (k.x - SKIN_OFFSET_X) * SKIN_SCALE,
    top: (k.y - SKIN_OFFSET_Y) * SKIN_SCALE,
    width: k.w * SKIN_SCALE,
    height: k.h * SKIN_SCALE,
  }
}

export function KeyboardView({ lighting, isLive, family, onApplyPerKey }: Props) {
  // Per-key color state: 126 LEDs, each a hex color string. Default to the
  // current lighting color so the first render matches what the user picked.
  const [keyColors, setKeyColors] = useState<string[]>(() => {
    const c = rgbToHex(lighting.r, lighting.g, lighting.b)
    return Array.from({ length: FULL_LED_COUNT }, () => c)
  })
  const [selectedKey, setSelectedKey] = useState<number | null>(null)
  const [paintColor, setPaintColor] = useState<string>(() => rgbToHex(lighting.r, lighting.g, lighting.b))
  const containerRef = useRef<HTMLDivElement>(null)

  const isSonix = family === 'sonix'

  const handleKeyClick = useCallback((keyDef: KeyDef) => {
    setSelectedKey(keyDef.id)
    setKeyColors(prev => {
      const next = [...prev]
      next[keyDef.id] = paintColor
      return next
    })
  }, [paintColor])

  const fillAll = useCallback((hex: string) => {
    setKeyColors(Array.from({ length: FULL_LED_COUNT }, () => hex))
  }, [])

  const buildPackets = useCallback((): Uint8Array[] => {
    const buf = new Uint8Array(LED_COUNT * 3)
    for (let i = 0; i < LED_COUNT; i++) {
      const hex = keyColors[i] ?? '#000000'
      const { r, g, b } = hexToRgb(hex)
      buf[i * 3] = r
      buf[i * 3 + 1] = g
      buf[i * 3 + 2] = b
    }
    const modePkts = buildCustomModePacket(lighting)
    return [...modePkts, buildBeginPacket(), ...buildCustomColorPackets(buf), buildEndPacket()]
  }, [keyColors, lighting])

  const handleApply = useCallback(() => {
    onApplyPerKey(buildPackets())
  }, [buildPackets, onApplyPerKey])

  const layout = useMemo(() => KEY_LAYOUT.map(k => ({ k, pos: scaleKey(k) })), [])

  const selectedHex = selectedKey !== null ? keyColors[selectedKey] ?? '#000000' : paintColor

  return (
    <div className="keyboard-view">
      <div className="row" style={{ fontWeight: 600 }}>
        Per-Key RGB (Custom mode)
      </div>
      <div className="help" style={{ marginTop: -2, marginBottom: 8 }}>
        Click any key to paint it with the selected color. Then click <strong>Apply per-key</strong> to
        send the full color map to the keyboard. This uses Custom mode (firmware mode 20) and sends
        {LED_COUNT} LEDs × 3 bytes of RGB data in chunked CMD_WRITE_COLORS packets.
        {isSonix && ' ⚠ Sonix family: per-key Custom is not fully RE\u2019d; this may not work on your unit.'}
      </div>

      {/* Color picker for painting keys */}
      <div className="row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ minWidth: 'auto' }}>Paint color:</label>
        <div className="palette" style={{ gap: 4 }}>
          {DEFAULT_PALETTE.map(hex => (
            <div
              key={hex}
              className={`swatch ${paintColor.toLowerCase() === hex ? 'selected' : ''}`}
              style={{ background: hex, width: 22, height: 22 }}
              onClick={() => setPaintColor(hex)}
            />
          ))}
        </div>
        <input
          type="color"
          value={paintColor}
          onChange={e => setPaintColor(e.target.value)}
          style={{ width: 32, height: 28, padding: 2, cursor: 'pointer' }}
        />
        <input
          type="text"
          value={paintColor.toUpperCase()}
          onChange={e => {
            const v = e.target.value.trim()
            if (/^#[0-9a-fA-F]{6}$/.test(v)) setPaintColor(v)
          }}
          style={{ width: 80 }}
        />
      </div>

      {/* Quick fill buttons */}
      <div className="row" style={{ gap: 8 }}>
        <button className="small secondary" onClick={() => fillAll(paintColor)}>Fill all</button>
        <button className="small secondary" onClick={() => fillAll('#000000')}>Clear all</button>
        <button className="small secondary" onClick={() => {
          const c = rgbToHex(lighting.r, lighting.g, lighting.b)
          fillAll(c)
        }}>Use lighting color</button>
      </div>

      {/* Visual keyboard */}
      <div className="kb-container" ref={containerRef}>
        {layout.map(({ k, pos }) => (
          <div
            key={k.id}
            className={`kb-key ${selectedKey === k.id ? 'kb-key-selected' : ''}`}
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              background: keyColors[k.id] ?? '#000000',
              boxShadow: selectedKey === k.id ? '0 0 0 2px var(--accent)' : undefined,
            }}
            onClick={() => handleKeyClick(k)}
            title={`${k.label} (LED ${k.id})`}
          >
            <span className="kb-key-label">{k.label}</span>
          </div>
        ))}
      </div>

      {/* Selected key info */}
      <div className="row" style={{ fontSize: 12, color: 'var(--fg-2)' }}>
        {selectedKey !== null
          ? <>Selected: <strong>{KEY_LAYOUT.find(k => k.id === selectedKey)?.label}</strong> (LED {selectedKey}) — {selectedHex.toUpperCase()}</>
          : 'Click a key to paint it'}
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <button onClick={handleApply}>
          {isLive ? 'Apply per-key colors' : 'Apply per-key colors (idle)'}
        </button>
        <span className="pill">{buildPackets().length} packets</span>
      </div>
    </div>
  )
}
