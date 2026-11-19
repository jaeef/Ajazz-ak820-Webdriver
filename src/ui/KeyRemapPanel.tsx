import { useMemo, useState, type ReactNode } from 'react'
import { RotateCcw, Send, Keyboard as KeyboardIcon, TextCursorInput } from 'lucide-react'
import { KEY_LAYOUT } from '../keymap'
import {
  buildKeymapPackets, buildMacroPackets, defaultKeymap, hexDump, textToMacro, MACRO_KEY, type KeyAssignment,
} from '../protocol'
import { keymapStore } from '../store'

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
  onSend: (packets: Uint8Array[], what: string) => void
  aside?: ReactNode
}

export function KeyRemapPanel({ isLive, onSend, aside }: Props) {
  const [map, setMap] = useState<KeyAssignment[]>(() => keymapStore.load() ?? DEFAULTS)
  const [selected, setSelected] = useState<number>(KEY_LAYOUT[0].id)
  const [macroText, setMacroText] = useState('')
  const macroEvents = useMemo(() => textToMacro(macroText), [macroText])
  const changed = useMemo(() => KEY_LAYOUT.filter(k => !same(map[k.id], DEFAULTS[k.id])), [map])
  const sel = KEY_LAYOUT.find(k => k.id === selected)!

  const assign = (a: KeyAssignment) => setMap(m => m.map((x, i) => (i === selected ? a : x)))
  const send = (next: KeyAssignment[], what: string) => {
    keymapStore.save(next)
    onSend(buildKeymapPackets(next), what)
  }
  // One macro slot: assigning it to a key moves it off any other key first.
  const sendMacro = () => {
    const next = map.map((x, i) => (i === selected ? MACRO_KEY : same(x, MACRO_KEY) ? DEFAULTS[i] : x))
    setMap(next)
    keymapStore.save(next)
    onSend([...buildMacroPackets(macroEvents), ...buildKeymapPackets(next)], `macro "${macroText}" on ${sel.label}`)
  }

  const current = TARGETS.findIndex(t => same(t.a, map[selected]))
  return (
    <div className="page">
      <div className="stage">
        <BoardRender ariaLabel="Keyboard, click a key to remap it" selected={selected} onKeyClick={k => setSelected(k.id)}
          overlay={k => (same(map[k.id], DEFAULTS[k.id]) ? undefined : { label: targetLabel(map[k.id]), marked: true })} />
      </div>
      <div className="split">
        <section className="panel" aria-labelledby="remap-h">
          <div className="panel__head"><h2 id="remap-h"><KeyboardIcon aria-hidden /> Remap</h2></div>
          <div className="field">
            <label className="field__label" htmlFor="remap-target"><strong>{sel.label}</strong> sends</label>
            <div className="field__row">
              <select id="remap-target" className="input" value={current} onChange={e => assign(TARGETS[+e.target.value].a)}>
                {current < 0 && <option value={-1}>{targetLabel(map[selected])}</option>}
                {TARGETS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
              </select>
              <button className="btn btn--outline" onClick={() => assign(DEFAULTS[selected])}><RotateCcw aria-hidden /> Reset key</button>
            </div>
          </div>
          <p className="muted">
            {changed.length
              ? <>Remapped: {changed.map(k => `${k.label} → ${targetLabel(map[k.id])}`).join(', ')}</>
              : 'No keys remapped. Click a key on the board to change it.'}
          </p>
          <div className="field">
            <label className="field__label" htmlFor="macro-text"><TextCursorInput aria-hidden /> Macro text for {sel.label}</label>
            <div className="field__row">
              <input id="macro-text" className="input" type="text" value={macroText} maxLength={MACRO_MAX}
                onChange={e => setMacroText(e.target.value)} placeholder="a–z, 0–9, space" />
              <button className="btn btn--outline" disabled={!macroEvents.length} onClick={sendMacro}>Assign macro</button>
            </div>
            <div className="meter" aria-hidden><i style={{ width: `${(macroText.length / MACRO_MAX) * 100}%` }} /></div>
            <span className="muted">{macroText.length} / {MACRO_MAX} characters. One macro at a time; assigning it moves it off any other key.</span>
          </div>
          <div className="actions">
            <button className="btn btn--primary" onClick={() => send(map, `keymap (${changed.length} remapped)`)}>
              <Send aria-hidden /> {isLive ? 'Apply keymap' : 'Apply keymap (demo)'}
            </button>
            <button className="btn btn--ghost" onClick={() => { setMap(DEFAULTS); send(DEFAULTS, 'default keymap') }}>
              Restore defaults
            </button>
          </div>
        </section>
        {aside}
      </div>
    </div>
  )
}
