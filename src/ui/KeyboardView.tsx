import { useCallback, useState } from 'react'
import { PaintBucket, Eraser, Pipette, Send } from 'lucide-react'
import { KEY_LAYOUT, type KeyDef } from '../keymap'
import { LED_COUNT, buildCustomColorPackets, hexToRgb, rgbToHex, DEFAULT_PALETTE } from '../protocol'
import type { LightingState, ProtocolFamilyResolved } from '../types'
import { BoardRender } from './BoardRender'

interface Props {
  lighting: LightingState
  isLive: boolean
  family: ProtocolFamilyResolved
  onApplyPerKey: (packets: Uint8Array[]) => void
}

// Per-key RGB: paint keys on the board, then send all 128 LEDs (CMD 0x0B) and
// switch to Custom mode. Colours are indexed by firmware slot (KeyDef.id).
export function KeyboardView({ lighting, isLive, family, onApplyPerKey }: Props) {
  const [keyColors, setKeyColors] = useState<string[]>(() =>
    Array.from({ length: LED_COUNT }, () => rgbToHex(lighting.r, lighting.g, lighting.b)))
  const [selected, setSelected] = useState<number | null>(null)
  const [paint, setPaint] = useState(() => rgbToHex(lighting.r, lighting.g, lighting.b))

  const paintKey = useCallback((k: KeyDef) => {
    setSelected(k.id)
    setKeyColors(prev => prev.map((c, i) => (i === k.id ? paint : c)))
  }, [paint])
  const fill = (hex: string) => setKeyColors(Array.from({ length: LED_COUNT }, () => hex))

  const apply = () => {
    const buf = new Uint8Array(LED_COUNT * 3)
    keyColors.forEach((hex, i) => { const { r, g, b } = hexToRgb(hex); buf.set([r, g, b], i * 3) })
    onApplyPerKey(buildCustomColorPackets(buf))
  }
  const sel = KEY_LAYOUT.find(k => k.id === selected)

  return (
    <div className="page">
      <div className="stage">
        <BoardRender ariaLabel="Keyboard, click a key to paint it" overlay={k => ({ led: keyColors[k.id] })}
          selected={selected} onKeyClick={paintKey} dim={lighting.brightness === 0} />
      </div>
      <section className="panel toolbar" aria-label="Paint tools">
        <div className="field field--inline">
          <span className="field__label">Paint colour</span>
          <div className="swatches">
            {DEFAULT_PALETTE.map(c => (
              <button key={c} className={`swatch${c === paint ? ' swatch--on' : ''}`} style={{ background: c }}
                onClick={() => setPaint(c)} aria-label={`Paint colour ${c.toUpperCase()}`} />
            ))}
            <label className="swatch swatch--custom" title="Any colour">
              <Pipette aria-hidden />
              <input type="color" value={paint} onChange={e => setPaint(e.target.value)} aria-label="Pick any paint colour" />
            </label>
          </div>
        </div>
        <div className="toolbar__actions">
          <button className="btn btn--outline" onClick={() => fill(paint)}><PaintBucket aria-hidden /> Fill all</button>
          <button className="btn btn--outline" onClick={() => fill('#000000')}><Eraser aria-hidden /> Clear all</button>
          <button className="btn btn--primary" onClick={apply}><Send aria-hidden /> {isLive ? 'Apply per-key colours' : 'Apply (demo)'}</button>
        </div>
        <p className="muted toolbar__note">
          {sel ? <>Painted <strong>{sel.label}</strong> {keyColors[sel.id].toUpperCase()}. </> : 'Click any key to paint it. '}
          Sends all {LED_COUNT} LEDs, then switches the board to Custom mode.
          {family === 'sonix' && ' Per-key colour is not verified on the Sonix AK820 Pro.'}
        </p>
      </section>
    </div>
  )
}
