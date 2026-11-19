import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowBigUpDash, Delete, Volume2, VolumeX } from 'lucide-react'
import { KEY_LAYOUT, type KeyDef } from '../lib/keymap'

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
  BackSpace: 'Bksp', CapsLock: 'CapsLock', Rightshift: 'Shift', 'Right Alt': 'Alt.', 'Right Ctrl': 'Ctrl.',
  Ctrl: 'Ctrl.', Win: 'Win.', Alt: 'Alt.', Delete: 'Del', PageUp: 'PgUp', PageDown: 'PgDn',
  Enter: 'Enter ↵',
}
const ARROWS: Record<string, ReactNode> = {
  Up: <ArrowUp aria-hidden />, Down: <ArrowDown aria-hidden />, Left: <ArrowLeft aria-hidden />, Right: <ArrowRight aria-hidden />,
}
// OEM double-shot caps carry the shifted glyph beside the base one (1!, 2@, …).
const SHIFTED: Record<string, string> = {
  '`': '~', '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
  '-': '_', '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"', ',': '<', '.': '>', '/': '?',
}
const GLYPHS: Record<string, ReactNode> = {
  BackSpace: <Delete aria-hidden />, Shift: <ArrowBigUpDash aria-hidden />, Rightshift: <ArrowBigUpDash aria-hidden />,
}

export function capTone(k: KeyDef): 'accent' | 'mod' | 'alpha' {
  if (ACCENT_KEYS.has(k.id)) return 'accent'
  return MOD_LABELS.has(k.label) ? 'mod' : 'alpha'
}

function capRow(y: number): string {
  if (y < 35) return 'cap--r4'
  if (y < 70) return 'cap--r4'
  if (y < 100) return 'cap--r3'
  if (y < 130) return 'cap--r2'
  return 'cap--r1'
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`

// Real-keyboard event.code -> layout label, for keys whose code isn't KeyX / DigitN / Fn.
const CODE_LABELS: Record<string, string> = {
  Escape: 'Esc', Backspace: 'BackSpace', Tab: 'Tab', CapsLock: 'CapsLock', Enter: 'Enter', Space: 'Space',
  ShiftLeft: 'Shift', ShiftRight: 'Rightshift', ControlLeft: 'Ctrl', ControlRight: 'Right Ctrl',
  MetaLeft: 'Win', AltLeft: 'Alt', AltRight: 'Right Alt', Delete: 'Delete', Home: 'Home', End: 'End',
  PageUp: 'PageUp', PageDown: 'PageDown', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  Backquote: '`', Minus: '-', Equal: '+', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
}
export function codeLabel(code: string): string | null {
  if (CODE_LABELS[code]) return CODE_LABELS[code]
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit\d$/.test(code)) return code.slice(5)
  return /^F\d{1,2}$/.test(code) ? code : null
}

const SOUND_KEY = 'ak820.keySound'
let soundOn = localStorage.getItem(SOUND_KEY) !== 'off'
const press = () => { if (soundOn) thock() }

// Shared on/off switch for the key sound, shown once above the board.
export function KeySoundToggle() {
  const [on, setOn] = useState(soundOn)
  const flip = () => {
    soundOn = !on
    localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off')
    if (soundOn) thock()
    setOn(soundOn)
  }
  return (
    <button type="button" className={`board-sound${on ? ' board-sound--on' : ''}`} onClick={flip} aria-pressed={on}>
      {on ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />} Key sound {on ? 'on' : 'off'}
    </button>
  )
}

// Switch acoustics: a low thock body plus a short clack transient, synthesised
// on demand so the preview never ships audio files.
let audio: AudioContext | null = null
export function thock() {
  try {
    audio ??= new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audio.state === 'suspended') void audio.resume()
    const now = audio.currentTime

    const body = audio.createOscillator()
    const bodyGain = audio.createGain()
    body.type = 'sine'
    body.frequency.setValueAtTime(140 + Math.random() * 20, now)
    body.frequency.exponentialRampToValueAtTime(32, now + 0.045)
    bodyGain.gain.setValueAtTime(0.16, now)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    body.connect(bodyGain).connect(audio.destination)
    body.start(now)
    body.stop(now + 0.05)

    const clack = audio.createOscillator()
    const clackGain = audio.createGain()
    clack.type = 'triangle'
    clack.frequency.setValueAtTime(420 + Math.random() * 60, now)
    clack.frequency.exponentialRampToValueAtTime(120, now + 0.02)
    clackGain.gain.setValueAtTime(0.06, now)
    clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022)
    clack.connect(clackGain).connect(audio.destination)
    clack.start(now)
    clack.stop(now + 0.022)
  } catch { /* audio blocked until a gesture lands */ }
}

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
  const boardRef = useRef<HTMLDivElement>(null)

  // Type on the real keyboard and the drawn caps bottom out in time with it.
  useEffect(() => {
    const capFor = (e: KeyboardEvent) => {
      const label = codeLabel(e.code)
      return label ? boardRef.current?.querySelector<HTMLElement>(`[data-label="${CSS.escape(label)}"]`) ?? null : null
    }
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const t = e.target
      if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable="true"]')) return
      const el = capFor(e)
      if (!el) return
      el.classList.add('cap--actuated')
      press()
    }
    const up = (e: KeyboardEvent) => capFor(e)?.classList.remove('cap--actuated')
    const clear = () => boardRef.current?.querySelectorAll('.cap--actuated').forEach(c => c.classList.remove('cap--actuated'))
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])

  const board = (
    <div ref={boardRef} className={`board board--${fx}${dim ? ' board--dim' : ''}`} style={vars}
      role={onKeyClick ? 'group' : 'img'} aria-label={ariaLabel}
      onPointerDown={e => { if ((e.target as Element).closest('.cap')) press() }}>
      <div className="board__plate board__bed" aria-hidden="true">
        <div className="board__plate-texture" />
        <div className="board__plate-sep-f" />
        <div className="board__plate-sep-nav" />
      </div>
      <div className="board__bed">
        <div className="board__switches" aria-hidden="true">
          {KEY_LAYOUT.map(k => (
            <div key={`sw-${k.id}`} className="board__switch-socket" style={{
              left: pct(k.x - X0 + k.w / 2, W),
              top: pct(k.y - Y0 + k.h / 2, H),
            }}>
              <div className="board__switch-stem" />
            </div>
          ))}
        </div>

      <div className="board__knob-collar" style={{ left: pct(548 - X0, W), top: pct(15 - Y0, H) }} aria-hidden="true" />
      <div className="board__knob" style={{ left: pct(548 - X0, W), top: pct(15 - Y0, H) }} aria-hidden="true">
        <div className="board__knob-knurl" />
        <div className="board__knob-pip" />
      </div>

      <div className="board__leds" aria-hidden="true">
        <div className="board__led-item">
          <div className="board__led-pin" />
          <span className="board__led-txt">1</span>
        </div>
        <div className="board__led-item">
          <div className="board__led-pin board__led-pin--on" />
          <span className="board__led-txt">A</span>
        </div>
        <div className="board__led-item">
          <div className="board__led-pin" />
          <span className="board__led-txt">W</span>
        </div>
      </div>

      {KEY_LAYOUT.map(k => {
        const o = overlay?.(k)
        const isHoming = k.label === 'F' || k.label === 'J'
        const isSpace = k.id === 45
        const style = {
          left: pct(k.x - X0, W), top: pct(k.y - Y0, H), width: pct(k.w - 2, W), height: pct(k.h - 2, H),
          '--x': ((k.x - X0) / W).toFixed(3),
          ...(o?.led ? { '--led': o.led } : {}),
        } as CSSProperties
        const cls = `cap cap--${capTone(k)} ${capRow(k.y)}${isHoming ? ' cap--homing' : ''}${o?.led ? ' cap--led' : ''}${o?.marked ? ' cap--marked' : ''}${selected === k.id ? ' cap--selected' : ''}`
        const glyph = ARROWS[k.label] ?? GLYPHS[k.label]
        const legend: ReactNode = o?.label ?? (glyph || isSpace ? null : (SHORT[k.label] ?? k.label))
        const sub = o?.label || glyph ? undefined : SHIFTED[k.label]
        const inner = isSpace && !o?.label
          ? <span className="cap__space-line" aria-hidden="true" />
          : <span>{glyph}{legend}{sub && <i className="cap__sub" aria-hidden="true">{sub}</i>}</span>
        return onKeyClick ? (
          <button key={k.id} type="button" className={cls} style={style} data-label={k.label}
            onClick={() => onKeyClick(k)}
            aria-pressed={selected === k.id} aria-label={`${k.label}${o?.label ? `, sends ${o.label}` : ''}`}>
            {inner}
          </button>
        ) : (
          <span key={k.id} className={cls} style={style} data-label={k.label} aria-hidden="true">{inner}</span>
        )
      })}
      </div>
    </div>
  )
  return wake ? <div className="board-wake">{board}</div> : board
}
