import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RotateCcw, Send, Keyboard as KeyboardIcon, TextCursorInput } from 'lucide-react'
import { KEY_LAYOUT } from '../lib/keymap'
import {
  buildKeymapPackets, buildMacroPackets, defaultKeymap, hexDump, textToMacro, MACRO_KEY, type KeyAssignment,
} from '../lib/protocol'
import { keymapStore } from '../lib/store'

import { BoardRender } from './BoardRender'

const MACRO_MAX = 20

const DEFAULTS = defaultKeymap()
const same = (a: KeyAssignment, b: KeyAssignment) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

// Targets: every key on the board (its own default assignment) plus a few
// keys the 75% layout lacks. ponytail: no consumer/mouse targets yet.
const TARGETS: { label: string; a: KeyAssignment }[] = [
  { label: '— Disabled —', a: [0x20, 0, 0] },
  ...KEY_LAYOUT.filter(k => DEFAULTS[k.id][0] === 0x20).map(k => ({ label: k.label, a: DEFAULTS[k.id] })),
  { label: 'Insert', a: [0x20, 0, 0x49] },
  { label: 'Print Screen', a: [0x20, 0, 0x46] },
  { label: 'Scroll Lock', a: [0x20, 0, 0x47] },
  { label: 'Pause', a: [0x20, 0, 0x48] },
  { label: 'Menu', a: [0x20, 0, 0x65] },
]
const targetLabel = (a: KeyAssignment) =>
  same(a, MACRO_KEY) ? 'Macro' : TARGETS.find(t => same(t.a, a))?.label ?? hexDump(Uint8Array.from(a))

interface Props {
  isLive: boolean
  onRead: () => Promise<KeyAssignment[] | null>
  onSend: (packets: Uint8Array[], what: string) => Promise<void>
  aside?: ReactNode
}

export function KeyRemapPanel({ isLive, onRead, onSend, aside }: Props) {
  const [map, setMap] = useState<KeyAssignment[]>(() => keymapStore.load() ?? DEFAULTS)
  const [device, setDevice] = useState<KeyAssignment[] | null>(null)
  const [read, setRead] = useState<'reading' | 'failed' | null>(null)
  const [selected, setSelected] = useState<number>(KEY_LAYOUT[0].id)
  const [macroText, setMacroText] = useState('')
  const macroEvents = useMemo(() => textToMacro(macroText), [macroText])
  const changed = useMemo(() => KEY_LAYOUT.filter(k => !same(map[k.id], DEFAULTS[k.id])), [map])
  const matches = useMemo(() => (device ? map.every((a, i) => same(a, device[i])) : null), [map, device])
  const sel = KEY_LAYOUT.find(k => k.id === selected)!

  const assign = (a: KeyAssignment) => setMap(m => m.map((x, i) => {
    if (i === selected) return a
    return same(a, MACRO_KEY) && same(x, MACRO_KEY) ? DEFAULTS[i] : x
  }))

  useEffect(() => {
    if (!isLive) { setDevice(null); setRead(null); return }
    let alive = true
    setRead('reading')
    onRead().then(back => {
      if (!alive) return
      if (back) { setDevice(back); setMap(back); setRead(null) } else setRead('failed')
    })
    return () => { alive = false }
  }, [isLive, onRead])

  const send = async (next: KeyAssignment[], what: string, extra: Uint8Array[] = []) => {
    keymapStore.save(next)
    const packets = [...extra, ...buildKeymapPackets(next, device ?? undefined)]
    if (!packets.length) { setMap(next); return }
    try { await onSend(packets, what) } catch { return }
    const back = await onRead()
    if (back) { setDevice(back); setMap(back); setRead(null) } else { setMap(next); setDevice(null); setRead('failed') }
  }
  const sendMacro = () => {
    const next = map.map((x, i) => (i === selected ? MACRO_KEY : same(x, MACRO_KEY) ? DEFAULTS[i] : x))
    setMap(next)
    void send(next, `macro "${macroText}" on ${sel.label}`, buildMacroPackets(macroEvents))
  }

  const current = TARGETS.findIndex(t => same(t.a, map[selected]))
  return (
    <div className="page page--fit page--keys">
      <div className="stage">
        <BoardRender ariaLabel="Keyboard, click a key to remap it" selected={selected} onKeyClick={k => setSelected(k.id)}
          overlay={k => (same(map[k.id], DEFAULTS[k.id]) ? undefined : { label: targetLabel(map[k.id]), marked: true })} />
      </div>
      <div className="split split--compact">
        <section className="panel panel--remap" aria-labelledby="remap-h">
          <div className="panel__head">
            <h2 id="remap-h"><KeyboardIcon aria-hidden /> Remap & Macro</h2>
            <div className="actions actions--compact">
              <button className="btn btn--primary btn--sm" onClick={() => void send(map, `keymap (${changed.length} remapped)`)}>
                <Send aria-hidden /> {isLive ? 'Apply keymap' : 'Apply keymap (demo)'}
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => void send(DEFAULTS, 'default keymap')}>
                Restore defaults
              </button>
            </div>
          </div>

          <div className="remap__body">
            <div className="remap__section">
              <div className="field">
                <label className="field__label" htmlFor="remap-target">
                  <strong>{sel.label}</strong> sends
                </label>
                <div className="field__row">
                  <select id="remap-target" className="input input--sm" value={current} onChange={e => assign(TARGETS[+e.target.value].a)}>
                    {current < 0 && <option value={-1}>{targetLabel(map[selected])}</option>}
                    {TARGETS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                  </select>
                  <button className="btn btn--outline btn--sm" onClick={() => assign(DEFAULTS[selected])}>
                    <RotateCcw aria-hidden /> Reset key
                  </button>
                </div>
              </div>
              <div className="remap__status-line">
                <span className="muted">
                  {device
                    ? (matches ? 'The keyboard already holds this table.' : 'Not on keyboard yet: apply to send.')
                    : !isLive ? 'Connect keyboard to read table.'
                      : read === 'failed' ? 'Couldn’t read table; apply writes all slots.'
                        : 'Reading keyboard table…'}
                </span>
                <span className="remap__status-sep" aria-hidden>·</span>
                <span className="muted">
                  {changed.length
                    ? <>Remapped: {changed.map(k => `${k.label} → ${targetLabel(map[k.id])}`).join(', ')}</>
                    : 'No keys remapped. Click a key on the board to change it.'}
                </span>
              </div>
            </div>

            <div className="remap__section">
              <div className="field">
                <div className="field__label-row">
                  <label className="field__label" htmlFor="macro-text">
                    <TextCursorInput aria-hidden /> Macro text for {sel.label}
                  </label>
                  <span className="field__counter">{macroText.length} / {MACRO_MAX} chars</span>
                </div>
                <div className="field__row">
                  <input id="macro-text" className="input input--sm" type="text" value={macroText} maxLength={MACRO_MAX}
                    onChange={e => setMacroText(e.target.value)} placeholder="a–z, 0–9, space" />
                  <button className="btn btn--outline btn--sm" disabled={!macroEvents.length} onClick={sendMacro}>
                    Assign macro
                  </button>
                </div>
              </div>
              <div className="meter meter--sm" aria-hidden>
                <i style={{ width: `${(macroText.length / MACRO_MAX) * 100}%` }} />
              </div>
              <p className="remap__micro-hint muted">
                One macro at a time; assigning it moves it off any other key.
              </p>
              <p className="remap__micro-hint muted">
                Something stuck on the keyboard? On most AK820s, holding <kbd>Fn</kbd> + <kbd>Space</kbd> for
                5–6 seconds resets it to factory settings (lighting, remaps and macros).
              </p>
            </div>
          </div>
        </section>
        {aside}
      </div>
    </div>
  )
}
