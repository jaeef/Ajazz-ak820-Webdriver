import {
  Waves, Cloud, Spline, Rainbow, Wind, Lightbulb, Zap, Radar, MoveRight, Sparkles, Flower2, RotateCw,
  AudioWaveform, Smile, CloudRain, ScanLine, ChevronsUp, Gauge, Palette, AudioLines, MonitorUp, type LucideIcon,
} from 'lucide-react'

// One icon per firmware lighting mode (index = mode id).
const ICONS: Record<number, LucideIcon> = {
  0: Waves, 1: Waves, 2: Cloud, 3: Spline, 4: Rainbow, 5: Wind, 6: Lightbulb, 7: Zap, 8: Radar,
  9: MoveRight, 10: Sparkles, 11: Flower2, 12: RotateCw, 13: AudioWaveform, 14: Smile, 15: CloudRain,
  16: ScanLine, 17: ChevronsUp, 18: Gauge, 20: Palette, 29: AudioLines, 30: MonitorUp,
}

export const modeIcon = (mode: number): LucideIcon => ICONS[mode] ?? Lightbulb
