import { useState } from 'react'
import type { ColorSink } from '../effects'
import { useAudioReact, useScreenColor } from '../effects'

interface Props {
  sink: ColorSink
  isLive: boolean
}

// Host-computed effects (official driver modes 29 "Audio React" and 30 "Screen
// Color"), reproduced with browser APIs. Each loop streams a live color to the
// keyboard via the app's normal Static-color path.
export function EffectsPanel({ sink, isLive }: Props) {
  const [sensitivity, setSensitivity] = useState(1.5)
  const [audioFps, setAudioFps] = useState(25)
  const [screenFps, setScreenFps] = useState(15)

  const audio = useAudioReact(sink, sensitivity, audioFps)
  const screen = useScreenColor(sink, screenFps)

  return (
    <div className="tab-panel active">
      {!isLive && (
        <div className="help" style={{ marginTop: 0 }}>
          Idle mode — effects still run and packets are recorded, but nothing
          lights up until you Connect a keyboard.
        </div>
      )}

      {/* --- Audio React --- */}
      <div className="row" style={{ marginTop: 4 }}>
        <label style={{ fontWeight: 600 }}>Audio React</label>
        <button onClick={() => (audio.running ? audio.stop() : audio.start())}>
          {audio.running ? 'Stop' : 'Start'}
        </button>
        <span className="pill">{audio.running ? 'live' : 'mode 29'}</span>
      </div>
      <div className="help" style={{ marginTop: -4 }}>
        Uses your microphone (or system audio via a virtual input). Bass → red,
        mids → green, treble → blue.
      </div>
      <div className="row">
        <label>Sensitivity:</label>
        <div className="slider-row">
          <input
            type="range" min={0.5} max={4} step={0.1}
            value={sensitivity}
            onChange={e => setSensitivity(parseFloat(e.target.value))}
          />
          <span className="slider-value">{sensitivity.toFixed(1)}×</span>
        </div>
      </div>
      <div className="row">
        <label>Frame rate:</label>
        <div className="slider-row">
          <input
            type="range" min={5} max={30} step={1}
            value={audioFps}
            onChange={e => setAudioFps(parseInt(e.target.value, 10))}
          />
          <span className="slider-value">{audioFps} fps</span>
        </div>
      </div>
      {audio.error && <div className="help" style={{ color: '#ff6b6b' }}>Audio error: {audio.error}</div>}

      <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '16px 0' }} />

      {/* --- Screen Color --- */}
      <div className="row">
        <label style={{ fontWeight: 600 }}>Screen Color</label>
        <button onClick={() => (screen.running ? screen.stop() : screen.start())}>
          {screen.running ? 'Stop' : 'Start'}
        </button>
        <span className="pill">{screen.running ? 'live' : 'mode 30'}</span>
      </div>
      <div className="help" style={{ marginTop: -4 }}>
        Pick a screen/window/tab to share; the keyboard matches its average
        color (ambient “ambilight”). Stop sharing to end.
      </div>
      <div className="row">
        <label>Frame rate:</label>
        <div className="slider-row">
          <input
            type="range" min={2} max={30} step={1}
            value={screenFps}
            onChange={e => setScreenFps(parseInt(e.target.value, 10))}
          />
          <span className="slider-value">{screenFps} fps</span>
        </div>
      </div>
      {screen.error && <div className="help" style={{ color: '#ff6b6b' }}>Screen error: {screen.error}</div>}

      <div className="help" style={{ marginTop: 16 }}>
        Both effects drive the keyboard as a live <strong>Static</strong> color
        (firmware mode 6) at your current brightness. Running both at once is not
        recommended — the last color sent wins.
      </div>
    </div>
  )
}
