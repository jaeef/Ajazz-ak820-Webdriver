import { useCallback, useEffect, useRef, useState } from 'react'

// =====================================================================
// Host-computed lighting effects that run entirely in the browser.
//
// The official AJAZZ driver exposes two PC-driven lighting modes that the
// keyboard firmware cannot produce on its own:
//   • mode 29  light_mode_audiorecord_text  → "Audio React"
//   • mode 30  light_mode_capturecolor_text → "Screen Color"
// Both are computed on the host and streamed to the board as plain color
// updates. We reproduce them with standard web APIs (Web Audio + the Screen
// Capture API) and push each frame through the app's normal Static-color path,
// so they reuse the exact transport that already works on this hardware.
// =====================================================================

// A sink the effect loops call each frame with an 8-bit RGB color. The app
// wires this to "apply Static color", so effects light the keyboard live.
export type ColorSink = (r: number, g: number, b: number) => void | Promise<void>

export interface EffectControls {
  running: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

// Wrap a ColorSink so frames never overlap on the HID bus: while one report is
// in flight, intermediate frames are dropped (only the latest matters for a
// live effect). `minIntervalMs` further caps the send rate.
function makeThrottledSink(sink: ColorSink, minIntervalMs: number) {
  let busy = false
  let lastTs = 0
  return (r: number, g: number, b: number, nowMs: number) => {
    if (busy || nowMs - lastTs < minIntervalMs) return
    lastTs = nowMs
    busy = true
    Promise.resolve(sink(r, g, b)).finally(() => {
      busy = false
    })
  }
}

// performance.now() without tripping the no-Date.now lint in some setups.
function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0
}

// =====================================================================
// useAudioReact — microphone / system audio → reactive color
//
// Splits the spectrum into low/mid/high bands and maps them to R/G/B, scaled
// by a sensitivity factor. Bass drives red, mids green, treble blue, so music
// produces a lively, beat-following wash.
// =====================================================================
export function useAudioReact(sink: ColorSink, sensitivity: number, fps: number): EffectControls {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<{
    ctx: AudioContext
    stream: MediaStream
    analyser: AnalyserNode
    raf: number
  } | null>(null)
  // Keep the latest sensitivity/fps without restarting the loop.
  const cfg = useRef({ sensitivity, fps })
  cfg.current = { sensitivity, fps }

  const stop = useCallback(() => {
    const r = ref.current
    if (r) {
      cancelAnimationFrame(r.raf)
      r.stream.getTracks().forEach(t => t.stop())
      r.ctx.close().catch(() => {})
      ref.current = null
    }
    setRunning(false)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.7
      src.connect(analyser)
      const bins = new Uint8Array(analyser.frequencyBinCount)
      const push = makeThrottledSink(sink, 1000 / Math.max(1, cfg.current.fps))

      const tick = () => {
        analyser.getByteFrequencyData(bins)
        const third = Math.floor(bins.length / 3)
        const avg = (from: number, to: number) => {
          let s = 0
          for (let i = from; i < to; i++) s += bins[i]
          return s / Math.max(1, to - from) / 255 // 0..1
        }
        const k = cfg.current.sensitivity
        const low = avg(0, third)
        const mid = avg(third, third * 2)
        const high = avg(third * 2, bins.length)
        const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255 * k)))
        push(clamp(low), clamp(mid), clamp(high), now())
        const r = ref.current
        if (r) r.raf = requestAnimationFrame(tick)
      }
      const raf = requestAnimationFrame(tick)
      ref.current = { ctx, stream, analyser, raf }
      setRunning(true)
    } catch (e) {
      setError((e as Error).message || String(e))
      setRunning(false)
    }
  }, [sink])

  useEffect(() => () => stop(), [stop])
  return { running, error, start, stop }
}

// =====================================================================
// useScreenColor — screen capture → average color (ambient / "ambilight")
//
// Grabs a display stream, downscales each frame to a tiny canvas, averages the
// pixels and sends that color. Great for matching the keyboard to whatever is
// on screen (video, games, wallpaper).
// =====================================================================
export function useScreenColor(sink: ColorSink, fps: number): EffectControls {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<{
    stream: MediaStream
    video: HTMLVideoElement
    canvas: HTMLCanvasElement
    timer: number
  } | null>(null)
  const cfg = useRef({ fps })
  cfg.current = { fps }

  const stop = useCallback(() => {
    const r = ref.current
    if (r) {
      clearInterval(r.timer)
      r.stream.getTracks().forEach(t => t.stop())
      r.video.srcObject = null
      ref.current = null
    }
    setRunning(false)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      await video.play()
      const canvas = document.createElement('canvas')
      canvas.width = 32
      canvas.height = 18
      const c2d = canvas.getContext('2d', { willReadFrequently: true })!
      const push = makeThrottledSink(sink, 1000 / Math.max(1, cfg.current.fps))

      // If the user stops sharing via the browser's own UI, tear down cleanly.
      stream.getVideoTracks()[0].addEventListener('ended', () => stop())

      const sample = () => {
        if (!ref.current || video.readyState < 2) return
        c2d.drawImage(video, 0, 0, canvas.width, canvas.height)
        const { data } = c2d.getImageData(0, 0, canvas.width, canvas.height)
        let r = 0, g = 0, b = 0
        const px = data.length / 4
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]
        }
        push(Math.round(r / px), Math.round(g / px), Math.round(b / px), now())
      }
      const timer = window.setInterval(sample, 1000 / Math.max(1, cfg.current.fps))
      ref.current = { stream, video, canvas, timer }
      setRunning(true)
    } catch (e) {
      setError((e as Error).message || String(e))
      setRunning(false)
    }
  }, [sink, stop])

  useEffect(() => () => stop(), [stop])
  return { running, error, start, stop }
}
