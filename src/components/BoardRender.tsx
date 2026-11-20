import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
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

// Indicator LEDs beside the nav column, top to bottom C / W / OS, lit white.
// C follows Caps Lock (read from key events while the page has focus), W follows
// the Windows-key lock read from the keyboard. OS has no readable state, so it stays dark.
// ponytail: OS LED unwired; light it once the OS-mode byte is known.
let ledState = { caps: false, win: false }
const ledSubs = new Set<() => void>()
export function setLeds(next: Partial<typeof ledState>) {
  if (Object.entries(next).every(([k, v]) => ledState[k as keyof typeof ledState] === v)) return
  ledState = { ...ledState, ...next }
  ledSubs.forEach(f => f())
}
const subscribeLeds = (f: () => void) => { ledSubs.add(f); return () => { ledSubs.delete(f) } }

const SOUND_KEY = 'ak820.keySound'
let soundOn = (() => { try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true } })()
const press = () => { if (soundOn) thock() }

// Shared on/off switch for the key sound, shown once above the board.
export function KeySoundToggle() {
  const [on, setOn] = useState(soundOn)
  const flip = () => {
    soundOn = !on
    try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off') } catch { /* storage blocked: keep it for this visit */ }
    if (soundOn) thock()
    setOn(soundOn)
  }
  return (
    <button type="button" className={`board-sound${on ? ' board-sound--on' : ''}`} onClick={flip} aria-pressed={on}>
      {on ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />} Key sound {on ? 'on' : 'off'}
    </button>
  )
}

// Switch acoustics: the thock is rendered once into an audio buffer, then
// replayed with slight pitch and level jitter. Building an oscillator graph per
// keypress is what made fast typing stutter and pushed the sound late.
const SAMPLE_RATE = 44100
let audio: AudioContext | null = null
let audioBus: GainNode | null = null
let thockBuffer: AudioBuffer | null = null

async function renderThock(): Promise<AudioBuffer> {
  const offline = new OfflineAudioContext(1, Math.ceil(SAMPLE_RATE * 0.09), SAMPLE_RATE)

  const body = offline.createOscillator()
  const bodyGain = offline.createGain()
  body.type = 'sine'
  body.frequency.setValueAtTime(150, 0)
  body.frequency.exponentialRampToValueAtTime(32, 0.045)
  bodyGain.gain.setValueAtTime(0.9, 0)
  bodyGain.gain.exponentialRampToValueAtTime(0.001, 0.05)
  body.connect(bodyGain).connect(offline.destination)
  body.start(0)
  body.stop(0.09)

  const clack = offline.createOscillator()
  const clackGain = offline.createGain()
  clack.type = 'triangle'
  clack.frequency.setValueAtTime(440, 0)
  clack.frequency.exponentialRampToValueAtTime(120, 0.02)
  clackGain.gain.setValueAtTime(0.32, 0)
  clackGain.gain.exponentialRampToValueAtTime(0.001, 0.022)
  clack.connect(clackGain).connect(offline.destination)
  clack.start(0)
  clack.stop(0.09)

  return offline.startRendering()
}

const thockReady = renderThock().then(buffer => { thockBuffer = buffer }).catch(() => undefined)

function ensureAudio(): AudioContext | null {
  if (!audio) {
    try {
      audio = new AudioContext({ latencyHint: 'interactive' })
      audioBus = audio.createGain()
      audioBus.gain.value = 0.55
      audioBus.connect(audio.destination)
    } catch {
      return null
    }
  }
  if (audio.state === 'suspended') void audio.resume()
  return audio
}

// Warm the context on the first gesture, so the first real press is not the one
// that pays for constructing it.
if (typeof window !== 'undefined') {
  const warm = () => { void ensureAudio() }
  window.addEventListener('pointerdown', warm, { capture: true, once: true })
  window.addEventListener('keydown', warm, { capture: true, once: true })
}

export function thock() {
  const ctx = ensureAudio()
  if (!ctx || !audioBus) return
  if (!thockBuffer) return

  const src = ctx.createBufferSource()
  src.buffer = thockBuffer
  src.playbackRate.value = 0.94 + Math.random() * 0.12
  const gain = ctx.createGain()
  gain.gain.value = 0.85 + Math.random() * 0.15
  src.connect(gain).connect(audioBus)
  src.start()
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

interface CapProps {
  k: KeyDef
  led?: string
  label?: string
  marked?: boolean
  selected: boolean
  onPick?: (k: KeyDef) => void
}

// One cap. Memoised on primitives, so painting a key or moving the selection
// re-renders that cap only instead of all 82.
const KeyCap = memo(function KeyCap({ k, led, label, marked, selected, onPick }: CapProps) {
  const tone = capTone(k)
  const isHoming = k.label === 'F' || k.label === 'J'
  const isSpace = k.id === 45
  const style = useMemo(() => ({
    left: pct(k.x - X0, W), top: pct(k.y - Y0, H), width: pct(k.w - 2, W), height: pct(k.h - 2, H),
    '--x': ((k.x - X0) / W).toFixed(3),
    ...(led ? { '--led': led } : {}),
  } as CSSProperties), [k, led])
  const cls = `cap cap--${tone} ${capRow(k.y)}${isHoming ? ' cap--homing' : ''}${led ? ' cap--led' : ''}${marked ? ' cap--marked' : ''}${selected ? ' cap--selected' : ''}`
  const glyph = ARROWS[k.label] ?? GLYPHS[k.label]
  const legend: ReactNode = label ?? (glyph || isSpace ? null : (SHORT[k.label] ?? k.label))
  const sub = label || glyph ? undefined : SHIFTED[k.label]
  const inner = (
    <>
      <i className="cap__glow" aria-hidden="true" />
      <i className="cap__shade" aria-hidden="true" />
      {isSpace && !label
        ? <span className="cap__space-line" aria-hidden="true" />
        : <span>{glyph}{legend}{sub && <i className="cap__sub" aria-hidden="true">{sub}</i>}</span>}
    </>
  )
  return onPick ? (
    <button type="button" className={cls} style={style} data-label={k.label}
      onClick={() => onPick(k)}
      aria-pressed={selected} aria-label={`${k.label}${label ? `, sends ${label}` : ''}`}>
      {inner}
    </button>
  ) : (
    <span className={cls} style={style} data-label={k.label} aria-hidden="true">{inner}</span>
  )
})

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
  const led = useSyncExternalStore(subscribeLeds, () => ledState)

  // Type on the real keyboard and the drawn caps bottom out in time with it.
  // Cells are indexed once, so a key event costs a Map lookup, not a DOM query.
  useEffect(() => {
    const root = boardRef.current
    if (!root) return
    const caps = new Map<string, HTMLElement>()
    root.querySelectorAll<HTMLElement>('[data-label]').forEach(el => {
      const label = el.dataset.label
      if (label) caps.set(label, el)
    })

    const capFor = (code: string) => {
      const label = codeLabel(code)
      return label ? caps.get(label) ?? null : null
    }
    const down = (e: KeyboardEvent) => {
      if (e.getModifierState) setLeds({ caps: e.getModifierState('CapsLock') })
      if (e.repeat) return
      const t = e.target
      if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable="true"]')) return
      const el = capFor(e.code)
      if (!el) return
      el.classList.add('cap--actuated')
      press()
    }
    const up = (e: KeyboardEvent) => {
      if (e.getModifierState) setLeds({ caps: e.getModifierState('CapsLock') })
      capFor(e.code)?.classList.remove('cap--actuated')
    }
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

  // Stable across renders so memoised caps don't re-render when the parent does.
  const onKeyClickRef = useRef(onKeyClick)
  onKeyClickRef.current = onKeyClick
  const pick = useCallback((k: KeyDef) => { onKeyClickRef.current?.(k) }, [])

  const board = (
    <div ref={boardRef} className={`board board--${fx}${dim ? ' board--dim' : ''}`} style={vars}
      role={onKeyClick ? 'group' : 'img'} aria-label={ariaLabel}
      onPointerDown={e => { if ((e.target as Element).closest('.cap')) press() }}>
      <div className="board__case" aria-hidden="true" />
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
        {([['C', led.caps], ['W', led.win], ['OS', false]] as const).map(([t, on]) => (
          <div key={t} className="board__led-item">
            <div className={`board__led-pin${on ? ' board__led-pin--on' : ''}`} />
            <span className="board__led-txt">{t}</span>
          </div>
        ))}
      </div>

      {KEY_LAYOUT.map(k => {
        const o = overlay?.(k)
        return (
          <KeyCap key={k.id} k={k} led={o?.led} label={o?.label} marked={o?.marked}
            selected={selected === k.id} onPick={onKeyClick ? pick : undefined} />
        )
      })}
      </div>
    </div>
  )
  return wake ? <div className="board-wake">{board}</div> : board
}
