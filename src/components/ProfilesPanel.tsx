import { useRef, useState } from 'react'
import { BookmarkPlus, Download, Upload, Play, Trash2, Layers } from 'lucide-react'
import type { LightingState, Profile } from '../lib/types'
import { rgbToHex } from '../lib/protocol'

interface Props {
  profiles: Profile[]
  modes: string[]
  currentLighting: LightingState
  onSave: (profile: Profile) => void
  onDelete: (name: string) => void
  onLoad: (profile: Profile) => void
  onImport: (data: unknown) => void
}

export function ProfilesPanel({ profiles, modes, currentLighting, onSave, onDelete, onLoad, onImport }: Props) {
  const [name, setName] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const exists = profiles.some(p => p.name === name.trim())

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({ name: trimmed, ...currentLighting })
    setName('')
  }

  const handleExport = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'ak820-profiles.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try { onImport(JSON.parse(String(reader.result))); setImportError(null) }
      catch (err) { setImportError((err as Error).message) }
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  return (
    <div className="stack">
      <div className="panel__head"><h2><Layers aria-hidden /> Profiles</h2></div>
      <form className="field" onSubmit={e => { e.preventDefault(); handleSave() }}>
        <label className="field__label" htmlFor="profile-name">Save the current lighting as</label>
        <div className="field__row">
          <input id="profile-name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Desk orange" />
          <button className="btn btn--primary" type="submit" disabled={!name.trim()}>
            <BookmarkPlus aria-hidden /> {exists ? 'Replace' : 'Save'}
          </button>
        </div>
        <span className="muted">Stores effect, colour, brightness, speed, direction and random colours in this browser.</span>
      </form>

      {profiles.length === 0 ? (
        <p className="empty">No profiles yet. Set up the lighting, name it above, and it will appear here and beside the keyboard.</p>
      ) : (
        <ul className="list">
          {profiles.map(p => (
            <li key={p.name} className="list__row">
              <i className="list__chip" style={{ background: rgbToHex(p.r, p.g, p.b) }} aria-hidden />
              <div className="list__main">
                <strong>{p.name}</strong>
                <span className="muted">
                  {modes[p.mode] || `Mode ${p.mode}`} · {rgbToHex(p.r, p.g, p.b).toUpperCase()} · brightness {p.brightness} · speed {p.speed}{p.rainbow ? ' · random colours' : ''}
                </span>
              </div>
              <div className="list__actions">
                <button className="btn btn--outline btn--sm" onClick={() => onLoad(p)}><Play aria-hidden /> Load</button>
                <button className="icon-btn icon-btn--danger" onClick={() => onDelete(p.name)} aria-label={`Delete ${p.name}`} title="Delete"><Trash2 aria-hidden /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button className="btn btn--outline" onClick={handleExport} disabled={profiles.length === 0}><Download aria-hidden /> Export JSON</button>
        <button className="btn btn--outline" onClick={() => fileInput.current?.click()}><Upload aria-hidden /> Import JSON</button>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={handleFile} />
      </div>
      {importError && <p className="notice notice--error">Couldn’t import that file: {importError}</p>}
    </div>
  )
}
