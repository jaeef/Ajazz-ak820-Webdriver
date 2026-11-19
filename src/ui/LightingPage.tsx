import type { ReactNode } from 'react'
import { Shuffle, FlaskConical, ArrowRight, ArrowLeft } from 'lucide-react'
import type { LightingState } from '../types'
import { DEFAULT_MODE_ORDER, MAX_BRIGHTNESS, MAX_SPEED, MODE_STATIC, clampDirection } from '../protocol'
import { modeIcon } from './modeIcons'
import { ColorPicker } from './ColorPicker'

interface Props {
  lighting: LightingState
  modes: string[]
  onChange: (next: LightingState) => void
  onTestMode: () => void
  footer?: ReactNode
}

const range = (n: number) => Array.from({ length: n + 1 }, (_, i) => i)

export function LightingPage({ lighting, modes, onChange, onTestMode, footer }: Props) {
  const set = (patch: Partial<LightingState>) => onChange({ ...lighting, ...patch })
  const isStatic = lighting.mode === MODE_STATIC
  // Solid colour (mode 06) leads; the rest in firmware order.
  const tiles = [MODE_STATIC, ...DEFAULT_MODE_ORDER.filter(m => m !== MODE_STATIC && modes[m])]

  return (
    <div className="lighting">
      <section className="panel lighting__modes" aria-labelledby="modes-h">
        <div className="panel__head"><h2 id="modes-h">Effect</h2><span className="muted">{tiles.length} modes</span></div>
        <div className="tiles" role="radiogroup" aria-label="Effect">
          {tiles.map(m => {
            const Icon = modeIcon(m)
            const on = lighting.mode === m
            return (
              <button key={m} role="radio" aria-checked={on} className={`tile${on ? ' tile--on' : ''}`}
                onClick={() => set(m === MODE_STATIC ? { mode: m, rainbow: false } : { mode: m })}>
                <Icon className="tile__icon" aria-hidden />
                <span className="tile__name">{m === MODE_STATIC ? 'Solid colour' : modes[m]}</span>
                <span className="tile__num">{String(m).padStart(2, '0')}</span>
              </button>
            )
          })}
        </div>
        {footer}
      </section>

      <section className="panel lighting__controls" aria-label="Lighting settings">
        <div className="field">
          <span className="field__label">Colour{lighting.rainbow && <em>random colours on</em>}</span>
          <ColorPicker r={lighting.r} g={lighting.g} b={lighting.b} onChange={rgb => set(rgb)} />
        </div>

        <div className="field">
          <span className="field__label">Brightness</span>
          <div className="seg" role="radiogroup" aria-label="Brightness">
            {range(MAX_BRIGHTNESS).map(v => (
              <button key={v} role="radio" aria-checked={lighting.brightness === v} onClick={() => set({ brightness: v })}>{v === 0 ? 'Off' : v}</button>
            ))}
          </div>
        </div>

        <fieldset className="motion-fields" disabled={isStatic}>
          <div className="field">
            <span className="field__label">Speed <em>{isStatic ? 'not used by solid colour' : '0 is fastest'}</em></span>
            <div className="seg" role="radiogroup" aria-label="Speed">
              {range(MAX_SPEED).map(v => (
                <button key={v} role="radio" aria-checked={lighting.speed === v} onClick={() => set({ speed: v })}>{v}</button>
              ))}
            </div>
          </div>
          <div className="field field--split">
            <span className="field__label">Direction</span>
            <div className="seg" role="radiogroup" aria-label="Direction">
              <button role="radio" aria-checked={lighting.direction === 0} onClick={() => set({ direction: clampDirection(0) })} title="Left to right" aria-label="Left to right"><ArrowRight aria-hidden /></button>
              <button role="radio" aria-checked={lighting.direction === 1} onClick={() => set({ direction: clampDirection(1) })} title="Right to left" aria-label="Right to left"><ArrowLeft aria-hidden /></button>
            </div>
            <label className="toggle" title="Random colours">
              <input type="checkbox" checked={lighting.rainbow} onChange={e => set({ rainbow: e.target.checked })} />
              <span className="toggle__track" aria-hidden />
              <Shuffle aria-hidden className="toggle__icon" /> Random
            </label>
          </div>
        </fieldset>

        <button className="btn btn--ghost btn--sm lighting__test" onClick={onTestMode}>
          <FlaskConical aria-hidden /> Test &amp; approve this mode
        </button>
      </section>
    </div>
  )
}
