import { useMemo, useState } from 'react'
import { KEY_LAYOUT, type KeyDef } from '../keymap'
import {
  buildKeymapPackets, buildMacroPackets, defaultKeymap, hexDump, textToMacro, MACRO_KEY, type KeyAssignment,
} from '../protocol'
import { keymapStore } from '../store'

// Same skin → px scaling as KeyboardView.
const scale = (k: KeyDef) => ({
  left: (k.x - 100) * 0.72, top: (k.y - 15) * 0.72, width: k.w * 0.72, height: k.h * 0.72,
})

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
}

export function KeyRemapPanel({ isLive, onSend }: Props) {
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

  return (
    <div className="tab-panel active">
      <div className="row" style={{ fontWeight: 600 }}>Key Remap</div>
      <div className="help" style={{ marginTop: -2 }}>
        Click a key, choose what it should send, then <strong>Apply keymap</strong>. The whole
        128-slot keymap is written to the keyboard (CMD 0x09) and survives unplugging.
      </div>

      <div className="kb-container">
        {KEY_LAYOUT.map(k => {
          const remapped = !same(map[k.id], DEFAULTS[k.id])
          return (
            <div
              key={k.id}
              className={`kb-key ${selected === k.id ? 'kb-key-selected' : ''}`}
              style={{
                ...scale(k),
                background: remapped ? 'var(--accent)' : 'var(--bg-2)',
                boxShadow: selected === k.id ? '0 0 0 2px var(--accent)' : undefined,
              }}
              onClick={() => setSelected(k.id)}
              title={`${k.label} (slot ${k.id}) → ${targetLabel(map[k.id])}`}
            >
              <span className="kb-key-label">{remapped ? targetLabel(map[k.id]) : k.label}</span>
            </div>
          )
        })}
      </div>

      <div className="row" style={{ alignItems: 'center', gap: 8 }}>
        <label style={{ minWidth: 'auto' }}><strong>{sel.label}</strong> sends:</label>
        <select
          value={TARGETS.findIndex(t => same(t.a, map[selected]))}
          onChange={e => assign(TARGETS[+e.target.value].a)}
        >
          {TARGETS.findIndex(t => same(t.a, map[selected])) < 0 && <option value={-1}>{targetLabel(map[selected])}</option>}
          {TARGETS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
        </select>
        <button className="small secondary" onClick={() => assign(DEFAULTS[selected])}>Reset key</button>
      </div>

      <div className="row" style={{ fontSize: 12, color: 'var(--fg-2)' }}>
        {changed.length
          ? <>Remapped: {changed.map(k => `${k.label} → ${targetLabel(map[k.id])}`).join(', ')}</>
          : 'No keys remapped.'}
      </div>

      <div className="row" style={{ alignItems: 'center', gap: 8, marginTop: 12 }}>
        <label style={{ minWidth: 'auto' }}>Macro text:</label>
        <input
          type="text"
          value={macroText}
          onChange={e => setMacroText(e.target.value)}
          placeholder="a-z, 0-9, space"
          maxLength={20}
          style={{ width: 180 }}
        />
        <button className="small secondary" disabled={!macroEvents.length} onClick={sendMacro}>
          Assign macro to {sel.label}
        </button>
      </div>
      <div className="help" style={{ marginTop: -4 }}>
        Types the text when the key is pressed. One macro at a time: assigning it moves it off any other key.
      </div>

      <div className="row" style={{ marginTop: 8, gap: 8 }}>
        <button onClick={() => send(map, `keymap (${changed.length} remapped)`)}>
          {isLive ? 'Apply keymap' : 'Apply keymap (idle)'}
        </button>
        <button className="secondary" onClick={() => { setMap(DEFAULTS); send(DEFAULTS, 'default keymap') }}>
          Restore defaults
        </button>
      </div>
    </div>
  )
}
