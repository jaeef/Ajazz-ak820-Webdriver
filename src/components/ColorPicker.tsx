import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Check } from 'lucide-react'
import { DEFAULT_PALETTE, hexToRgb, rgbToHex } from '../lib/protocol'

// RGB <-> HSV (h 0..360, s/v 0..1)
function toHsv(r: number, g: number, b: number) {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), d = max - Math.min(R, G, B)
  let h = 0
  if (d) h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max }
}
function toRgb(h: number, s: number, v: number) {
  const f = (n: number) => { const k = (n + h / 60) % 6; return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))) }
  return { r: f(5), g: f(3), b: f(1) }
}

interface Props {
  r: number; g: number; b: number
  onChange: (rgb: { r: number; g: number; b: number }) => void
}

// Swatch trigger + popover: saturation/value area, hue slider, hex + RGB, presets.
export function ColorPicker({ r, g, b, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const hex = rgbToHex(r, g, b)
  const [hsv, setHsv] = useState(() => toHsv(r, g, b))
  const [hexDraft, setHexDraft] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLDivElement>(null)

  // Follow outside changes (profiles, presets) without losing hue on greys.
  useEffect(() => {
    const cur = toRgb(hsv.h, hsv.s, hsv.v)
    if (cur.r !== r || cur.g !== g || cur.b !== b) {
      const n = toHsv(r, g, b)
      setHsv(n.s === 0 ? { ...n, h: hsv.h } : n)
    }
  }, [r, g, b]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])

  const commit = (next: { h: number; s: number; v: number }) => { setHsv(next); onChange(toRgb(next.h, next.s, next.v)) }
  const pick = (e: RPointerEvent) => {
    const box = area.current!.getBoundingClientRect()
    const s = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    const v = Math.min(1, Math.max(0, 1 - (e.clientY - box.top) / box.height))
    commit({ ...hsv, s, v })
  }
  const nudge = (ds: number, dv: number) => commit({ ...hsv, s: Math.min(1, Math.max(0, hsv.s + ds)), v: Math.min(1, Math.max(0, hsv.v + dv)) })

  return (
    <div className="picker" ref={root}>
      <button className="picker__trigger" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="dialog">
        <i style={{ background: hex }} aria-hidden />
        <span className="mono">{hex.toUpperCase()}</span>
        <span className="muted mono">{r} {g} {b}</span>
      </button>
      <div className="picker__presets" role="radiogroup" aria-label="Preset colours">
        {DEFAULT_PALETTE.slice(0, 9).map(c => {
          const on = c.toLowerCase() === hex.toLowerCase()
          return (
            <button key={c} role="radio" aria-checked={on} className="cdot" style={{ background: c }} onClick={() => onChange(hexToRgb(c))}
              aria-label={c.toUpperCase()} title={c.toUpperCase()}>{on && <Check aria-hidden />}</button>
          )
        })}
      </div>

      {open && (
        <div className="picker__pop" role="dialog" aria-label="Choose colour">
          <div ref={area} className="picker__area" style={{ background: `hsl(${hsv.h} 100% 50%)` }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); pick(e) }}
            onPointerMove={e => { if (e.buttons) pick(e) }}>
            <span className="picker__thumb" role="slider" tabIndex={0} aria-label="Saturation and brightness"
              aria-valuetext={`saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }}
              onKeyDown={e => {
                const step = e.shiftKey ? .1 : .02
                const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
                if (map[e.key]) { e.preventDefault(); nudge(...map[e.key]) }
              }} />
          </div>
          <input className="picker__hue" type="range" min={0} max={359} value={Math.round(hsv.h)} aria-label="Hue"
            onChange={e => commit({ ...hsv, h: +e.target.value, s: hsv.s || 1, v: hsv.v || 1 })} />
          <div className="picker__fields">
            <label><span>Hex</span>
              <input className="input mono" value={hexDraft ?? hex.toUpperCase()} maxLength={7}
                onChange={e => { setHexDraft(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(hexToRgb(e.target.value)) }}
                onBlur={() => setHexDraft(null)} />
            </label>
            {(['r', 'g', 'b'] as const).map((ch, i) => (
              <label key={ch}><span>{ch.toUpperCase()}</span>
                <input className="input mono" type="number" min={0} max={255} value={[r, g, b][i]}
                  onChange={e => { const v = Math.max(0, Math.min(255, +e.target.value || 0)); onChange({ r, g, b, [ch]: v }) }} />
              </label>
            ))}
          </div>
          <div className="picker__swatches">
            {DEFAULT_PALETTE.map(c => (
              <button key={c} className="cdot cdot--sm" style={{ background: c }} onClick={() => onChange(hexToRgb(c))} aria-label={c.toUpperCase()} title={c.toUpperCase()} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
