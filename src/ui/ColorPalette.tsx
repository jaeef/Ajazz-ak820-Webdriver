import { DEFAULT_PALETTE } from '../protocol'

interface Props {
  r: number
  g: number
  b: number
  onSelect: (hex: string) => void
}

export function ColorPalette({ r, g, b, onSelect }: Props) {
  const currentHex = ('#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')).toLowerCase()
  return (
    <div className="palette">
      {DEFAULT_PALETTE.map(c => {
        const selected = c.toLowerCase() === currentHex
        return (
          <div
            key={c}
            className={`swatch ${selected ? 'selected' : ''}`}
            style={{ background: c }}
            title={c.toUpperCase()}
            onClick={() => onSelect(c)}
          />
        )
      })}
    </div>
  )
}
