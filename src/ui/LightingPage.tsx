import { useState } from 'react'
import { Shuffle, FlaskConical, ArrowRight, ArrowLeft, Pipette } from 'lucide-react'
import type { LightingState } from '../types'
import {
  DEFAULT_MODE_ORDER, DEFAULT_PALETTE, MAX_BRIGHTNESS, MAX_SPEED, MODE_STATIC,
  clampDirection, hexToRgb, rgbToHex,
} from '../protocol'
import { modeIcon } from './modeIcons'

interface Props {
  lighting: LightingState
  modes: string[]
  onChange: (next: LightingState) => void
  onTestMode: () => void
}

const range = (n: number) => Array.from({ length: n + 1 }, (_, i) => i)

export function LightingPage({ lighting, modes, onChange, onTestMode }: Props) {
  const [tab, setTab] = useState<'effects' | 'solid'>(lighting.mode === MODE_STATIC ? 'solid' : 'effects')
  const hex = rgbToHex(lighting.r, lighting.g, lighting.b)
  const [hexDraft, setHexDraft] = useState<string | null>(null)
  const set = (patch: Partial<LightingState>) => onChange({ ...lighting, ...patch })
  const setHex = (h: string) => { const { r, g, b } = hexToRgb(h); set({ r, g, b }) }
  const isStatic = lighting.mode === MODE_STATIC
  const effects = DEFAULT_MODE_ORDER.filter(m => m !== MODE_STATIC && modes[m])

  const chooseTab = (t: 'effects' | 'solid') => {
    setTab(t)
    if (t === 'solid') set({ mode: MODE_STATIC, rainbow: false })
    else if (isStatic) set({ mode: effects[0] })
  }

  return (
    <div className="lighting">
      <section className="panel lighting__modes" aria-labelledby="modes-h">
        <div className="panel__head">
          <h2 id="modes-h">Lighting</h2>
          <div className="seg seg--pill" role="tablist" aria-label="Lighting type">
            <button role="tab" aria-selected={tab === 'effects'} onClick={() => chooseTab('effects')}>Effects</button>
            <button role="tab" aria-selected={tab === 'solid'} onClick={() => chooseTab('solid')}>Solid colour</button>
          </div>
        </div>

        {tab === 'effects' ? (
          <div className="tiles" role="radiogroup" aria-label="Effect">
            {effects.map(m => {
              const Icon = modeIcon(m)
              const on = lighting.mode === m
              return (
                <button key={m} role="radio" aria-checked={on} className={`tile${on ? ' tile--on' : ''}`} onClick={() => set({ mode: m })}>
                  <Icon className="tile__icon" aria-hidden />
                  <span className="tile__name">{modes[m]}</span>
                  <span className="tile__num">Mode {String(m).padStart(2, '0')}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="solid">
            <div className="swatches swatches--lg">
              {DEFAULT_PALETTE.map(c => (
                <button key={c} className={`swatch${c.toLowerCase() === hex.toLowerCase() ? ' swatch--on' : ''}`}
                  style={{ background: c }} onClick={() => setHex(c)} aria-label={`Colour ${c.toUpperCase()}`} />
              ))}
              <label className="swatch swatch--custom" title="Any colour">
                <Pipette aria-hidden />
                <input type="color" value={hex} onChange={e => setHex(e.target.value)} aria-label="Pick any colour" />
              </label>
            </div>
            <p className="muted">One steady colour across the whole board. The keyboard above shows it.</p>
          </div>
        )}
      </section>

      <section className="panel lighting__controls" aria-label="Lighting settings">
        <div className="field">
          <span className="field__label">Colour</span>
          {tab === 'effects' && <div className="swatches">
            {DEFAULT_PALETTE.map(c => (
              <button key={c} className={`swatch${c.toLowerCase() === hex.toLowerCase() ? ' swatch--on' : ''}`}
                style={{ background: c }} onClick={() => setHex(c)} aria-label={`Colour ${c.toUpperCase()}`} />
            ))}
            <label className="swatch swatch--custom" title="Any colour">
              <Pipette aria-hidden />
              <input type="color" value={hex} onChange={e => setHex(e.target.value)} aria-label="Pick any colour" />
            </label>
          </div>}
          <div className="rgb">
            <input className="input input--hex" value={hexDraft ?? hex.toUpperCase()} aria-label="Hex colour"
              onChange={e => { setHexDraft(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) setHex(e.target.value) }}
              onBlur={() => setHexDraft(null)} />
            {(['r', 'g', 'b'] as const).map(ch => (
              <label key={ch} className="rgb__ch">
                <span>{ch.toUpperCase()}</span>
                <input className="input" type="number" min={0} max={255} value={lighting[ch]}
                  onChange={e => set({ [ch]: Math.max(0, Math.min(255, +e.target.value || 0)) })} />
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Brightness</span>
          <div className="seg" role="radiogroup" aria-label="Brightness">
            {range(MAX_BRIGHTNESS).map(v => (
              <button key={v} role="radio" aria-checked={lighting.brightness === v} onClick={() => set({ brightness: v })}>{v === 0 ? 'Off' : v}</button>
            ))}
          </div>
        </div>

        {!isStatic && (
          <>
            <div className="field">
              <span className="field__label">Speed <em>0 is fastest</em></span>
              <div className="seg" role="radiogroup" aria-label="Speed">
                {range(MAX_SPEED).map(v => (
                  <button key={v} role="radio" aria-checked={lighting.speed === v} onClick={() => set({ speed: v })}>{v}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field__label">Direction</span>
              <div className="seg" role="radiogroup" aria-label="Direction">
                <button role="radio" aria-checked={lighting.direction === 0} onClick={() => set({ direction: clampDirection(0) })}><ArrowRight aria-hidden /> Left to right</button>
                <button role="radio" aria-checked={lighting.direction === 1} onClick={() => set({ direction: clampDirection(1) })}><ArrowLeft aria-hidden /> Right to left</button>
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={lighting.rainbow} onChange={e => set({ rainbow: e.target.checked })} />
              <span className="toggle__track" aria-hidden />
              <Shuffle aria-hidden className="toggle__icon" /> Random colours
            </label>
          </>
        )}

        <button className="btn btn--ghost btn--block" onClick={onTestMode}>
          <FlaskConical aria-hidden /> Test &amp; approve this mode
        </button>
      </section>
    </div>
  )
}
