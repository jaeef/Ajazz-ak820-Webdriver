import type { Profile, Settings, CalibrationResult } from './types'
import { VID_DEFAULT, PID_DEFAULT, DEFAULT_MODES, type KeyAssignment } from './protocol'

// v4: corrected from the official driver RE — real VID/PID (0x0C45/0x1007) and
// the firmware mode table (default_light.json). Must bump the key so cached v3
// settings (old OpenRGB mode names + wrong VID/PID) don't mask the new table.
const PROFILES_KEY = 'ak820_profiles_v2'
const SETTINGS_KEY = 'ak820_settings_v4'
const CALIBRATION_KEY = 'ak820_calibration_v1'

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('localStorage write failed', err)
  }
}

// =====================================================================
// PROFILES
// =====================================================================
export const profileStore = {
  load(): Profile[] {
    return safeRead<Profile[]>(PROFILES_KEY, [])
  },

  save(profiles: Profile[]): void {
    safeWrite(PROFILES_KEY, profiles)
  },

  add(profile: Profile): Profile[] {
    const all = this.load()
    const i = all.findIndex(p => p.name === profile.name)
    if (i >= 0) all[i] = profile
    else all.push(profile)
    this.save(all)
    return all
  },

  remove(name: string): Profile[] {
    const all = this.load().filter(p => p.name !== name)
    this.save(all)
    return all
  },

  get(name: string): Profile | undefined {
    return this.load().find(p => p.name === name)
  },
}

// =====================================================================
// SETTINGS
// =====================================================================
export function defaultSettings(): Settings {
  return {
    vid: VID_DEFAULT,
    pid: PID_DEFAULT,
    reportIdMode: 'auto',
    protocolFamily: 'auto',
    modes: [...DEFAULT_MODES],
    showAllDevices: true,
  }
}

export const settingsStore = {
  load(): Settings {
    const raw = safeRead<Partial<Settings>>(SETTINGS_KEY, {})
    return { ...defaultSettings(), ...raw, modes: raw.modes ?? [...DEFAULT_MODES] }
  },

  save(s: Settings): void {
    safeWrite(SETTINGS_KEY, s)
  },

  reset(): void {
    try {
      localStorage.removeItem(PROFILES_KEY)
      localStorage.removeItem(SETTINGS_KEY)
      localStorage.removeItem(CALIBRATION_KEY)
    } catch {
      // ignore
    }
  },
}

// =====================================================================
// CALIBRATION — empirical per-mode verification results.
// Keyed by mode number: re-testing a mode overwrites its entry so the log
// always reflects the latest approval for each mode.
// =====================================================================
export const calibrationStore = {
  load(): CalibrationResult[] {
    return safeRead<CalibrationResult[]>(CALIBRATION_KEY, [])
  },

  save(results: CalibrationResult[]): void {
    safeWrite(CALIBRATION_KEY, results)
  },

  // Upsert: if a result for the same mode exists, replace it; else append.
  upsert(result: CalibrationResult): CalibrationResult[] {
    const all = this.load()
    const i = all.findIndex(r => r.mode === result.mode)
    if (i >= 0) all[i] = result
    else all.push(result)
    all.sort((a, b) => a.mode - b.mode)
    this.save(all)
    return all
  },

  remove(mode: number): CalibrationResult[] {
    const all = this.load().filter(r => r.mode !== mode)
    this.save(all)
    return all
  },

  clear(): void {
    try { localStorage.removeItem(CALIBRATION_KEY) } catch { /* ignore */ }
  },
}

// =====================================================================
// KEYMAP (last keymap sent from the Keys tab; null = firmware default)
// =====================================================================
const KEYMAP_KEY = 'ak820_keymap_v1'

export const keymapStore = {
  load(): KeyAssignment[] | null {
    return safeRead<KeyAssignment[] | null>(KEYMAP_KEY, null)
  },
  save(map: readonly KeyAssignment[]): void {
    safeWrite(KEYMAP_KEY, map)
  },
}
