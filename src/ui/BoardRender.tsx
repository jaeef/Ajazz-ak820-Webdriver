import type { CSSProperties, ReactNode } from 'react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { KEY_LAYOUT, type KeyDef } from '../keymap'

// The AK820 drawn in its own colorway (black case, light-ash alphas, dark-ash
// modifiers, mustard Esc / Enter / Space). Positions come from the vendor
// skin, mapped to percentages so the board scales with its container.
const X0 = 92, Y0 = 9, W = 492, H = 202

const ACCENT_KEYS = new Set([0, 107, 45]) // Esc, Enter, Space (slots)
const MOD_LABELS = new Set([
  'Tab', 'CapsLock', 'Shift', 'Rightshift', 'Ctrl', 'Win', 'Alt', 'Right Alt', 'Fn', 'Right Ctrl',
  'BackSpace', 'Delete', 'Home', 'PageUp', 'PageDown', 'End', 'Up', 'Down', 'Left', 'Right',
  'F5', 'F6', 'F7', 'F8',
])
const SHORT: Record<string, string> = {
  BackSpace: 'Bksp', CapsLock: 'Caps', Rightshift: 'Shift', 'Right Alt': 'Alt', 'Right Ctrl': 'Ctrl',
  Delete: 'Del', PageUp: 'PgUp', PageDown: 'PgDn',
}
const ARROWS: Record<string, ReactNode> = {
  Up: <ArrowUp aria-hidden />, Down: <ArrowDown aria-hidden />, Left: <ArrowLeft aria-hidden />, Right: <ArrowRight aria-hidden />,
}

export function capTone(k: KeyDef): 'accent' | 'mod' | 'alpha' {
  if (ACCENT_KEYS.has(k.id)) return 'accent'
  return MOD_LABELS.has(k.label) ? 'mod' : 'alpha'
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`

export interface KeyOverlay {
  led?: string      // per-key LED colour (overrides the board glow)
  label?: string    // replaces the legend (remapped key)
  marked?: boolean  // highlight ring (remapped / painted)
}

export type BoardMotion = 'static' | 'breath' | 'wave' | 'rainbow'

// Which on-screen preview each firmware mode gets (approximation, not the firmware's exact effect).
const MOTION: Record<number, BoardMotion> = {
  1: 'wave', 2: 'wave', 3: 'wave', 4: 'rainbow', 5: 'breath', 9: 'wave', 12: 'wave', 13: 'wave',
  15: 'wave', 16: 'wave', 17: 'wave', 18: 'wave',
}
export const motionFor = (mode: number): BoardMotion => MOTION[mode] ?? 'static'

interface Props {
  glow?: string                      // current lighting colour
  rainbow?: boolean
  dim?: boolean                      // unlit: brightness 0 or not connected
  level?: number                     // brightness 1..4 scales the glow
  motion?: BoardMotion
  speed?: number                     // 0 fastest .. 4 slowest
  wake?: boolean                     // fade the light in on mount
  overlay?: (k: KeyDef) => KeyOverlay | undefined
  selected?: number | null
  onKeyClick?: (k: KeyDef) => void
  ariaLabel: string
}

export function BoardRender({ glow = '#ffffff', rainbow, dim, level = 4, motion = 'static', speed = 2, wake, overlay, selected, onKeyClick, ariaLabel }: Props) {
  const fx = rainbow ? 'rainbow' : motion
  const vars = { '--glow': glow, '--glow-a': dim ? 0 : 0.35 + 0.15 * Math.min(4, Math.max(1, level)), '--dur': `${1.6 + speed * 0.7}s` } as CSSProperties
  const board = (
    <div className={`board board--${fx}${dim ? ' board--dim' : ''}`} style={vars}
      role={onKeyClick ? 'group' : 'img'} aria-label={ariaLabel}>
      <div className="board__knob" style={{ left: pct(548 - X0, W), top: pct(15 - Y0, H) }} aria-hidden="true" />
      {KEY_LAYOUT.map(k => {
        const o = overlay?.(k)
        const style = {
          left: pct(k.x - X0, W), top: pct(k.y - Y0, H), width: pct(k.w - 2, W), height: pct(k.h - 2, H),
          '--x': ((k.x - X0) / W).toFixed(3),
          ...(o?.led ? { '--led': o.led } : {}),
        } as CSSProperties
        const cls = `cap cap--${capTone(k)}${o?.led ? ' cap--led' : ''}${o?.marked ? ' cap--marked' : ''}${selected === k.id ? ' cap--selected' : ''}`
        const legend: ReactNode = o?.label ?? ARROWS[k.label] ?? SHORT[k.label] ?? k.label
        return onKeyClick ? (
          <button key={k.id} type="button" className={cls} style={style} onClick={() => onKeyClick(k)}
            aria-pressed={selected === k.id} aria-label={`${k.label}${o?.label ? `, sends ${o.label}` : ''}`}>
            <span>{legend}</span>
          </button>
        ) : (
          <span key={k.id} className={cls} style={style} aria-hidden="true"><span>{legend}</span></span>
        )
      })}
    </div>
  )
  return wake ? <div className="board-wake">{board}</div> : board
}
