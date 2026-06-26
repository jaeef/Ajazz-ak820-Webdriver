import { useRef, useState } from 'react'
import type { LightingState, Profile } from '../types'
import { rgbToHex } from '../protocol'

interface Props {
  profiles: Profile[]
  modes: string[]
  currentLighting: LightingState
  onSave: (profile: Profile) => void
  onDelete: (name: string) => void
  onLoad: (profile: Profile) => void
  onImport: (data: unknown) => void
}

export function ProfilesPanel({
  profiles, modes, currentLighting, onSave, onDelete, onLoad, onImport,
}: Props) {
  const [name, setName] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({ name: trimmed, ...currentLighting })
    setName('')
  }

  const handleExport = () => {
    const data = JSON.stringify(profiles, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ak820-profiles.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    setImportError(null)
    fileInput.current?.click()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        onImport(data)
      } catch (err) {
        setImportError((err as Error).message)
      }
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  return (
    <div className="tab-panel">
      <div className="row">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder='Profile name (e.g. "Coding red")'
        />
        <button onClick={handleSave}>Save current</button>
      </div>
      <div className="help" style={{ marginBottom: 12 }}>
        Profiles save the full lighting state (mode, color, brightness, speed, direction, rainbow).
      </div>
      <ul className="profile-list">
        {profiles.length === 0 ? (
          <li className="profile-empty">No saved profiles yet. Set up the lighting above, then save it here.</li>
        ) : (
          profiles.map(p => {
            const hex = rgbToHex(p.r, p.g, p.b)
            return (
              <li key={p.name}>
                <div className="pcolor" style={{ background: hex }} />
                <div className="pinfo">
                  <div className="pname">{p.name}</div>
                  <div className="pmeta">
                    {modes[p.mode] ?? 'Mode ' + p.mode} · rgb({p.r},{p.g},{p.b}) · brightness {p.brightness} · speed {p.speed}
                    {p.rainbow ? ' · rainbow' : ''}
                  </div>
                </div>
                <div className="pactions">
                  <button className="secondary small" onClick={() => onLoad(p)}>Load</button>
                  <button className="secondary small" onClick={() => onDelete(p.name)}>Delete</button>
                </div>
              </li>
            )
          })
        )}
      </ul>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="secondary" onClick={handleExport}>Export to JSON</button>
        <button className="secondary" onClick={handleImportClick}>Import from JSON</button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
      {importError && <div className="help" style={{ color: 'var(--error)' }}>Import error: {importError}</div>}
    </div>
  )
}
