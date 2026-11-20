import type { Profile, Settings } from './types'
import { VID_DEFAULT, PID_DEFAULT, DEFAULT_MODES, KEYMAP_SLOTS, cleanProfiles, num, type KeyAssignment } from './protocol'
export { cleanProfiles }

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
    return cleanProfiles(safeRead<unknown>(PROFILES_KEY, []))
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
    showAllDevices: false,
  }
}

export const settingsStore = {
  load(): Settings {
    const stored = safeRead<unknown>(SETTINGS_KEY, {})
    const raw = (stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}) as Partial<Settings>
    const d = defaultSettings()
    return {
      vid: num(raw.vid, 0, 0xffff, d.vid),
      pid: num(raw.pid, 0, 0xffff, d.pid),
      reportIdMode: ['auto', 'native', 'payload'].includes(raw.reportIdMode as string) ? raw.reportIdMode! : d.reportIdMode,
      protocolFamily: ['auto', 'evision', 'sonix'].includes(raw.protocolFamily as string) ? raw.protocolFamily! : d.protocolFamily,
      modes: Array.isArray(raw.modes) && raw.modes.length === DEFAULT_MODES.length && raw.modes.every(m => typeof m === 'string') ? raw.modes : [...DEFAULT_MODES],
      showAllDevices: typeof raw.showAllDevices === 'boolean' ? raw.showAllDevices : d.showAllDevices,
    }
  },

  save(s: Settings): void {
    safeWrite(SETTINGS_KEY, s)
  },

  reset(): void {
    try {
      localStorage.removeItem(PROFILES_KEY)
      localStorage.removeItem(SETTINGS_KEY)
      localStorage.removeItem(CALIBRATION_KEY)
      localStorage.removeItem(KEYMAP_KEY)
    } catch {
      // ignore
    }
  },
}

// =====================================================================
// KEYMAP (last keymap sent from the Keys tab; null = firmware default)
// =====================================================================
const KEYMAP_KEY = 'ak820_keymap_v1'

export const keymapStore = {
  load(): KeyAssignment[] | null {
    const raw = safeRead<unknown>(KEYMAP_KEY, null)
    if (!Array.isArray(raw) || raw.length !== KEYMAP_SLOTS) return null
    const ok = raw.every(e => Array.isArray(e) && e.length === 3 && e.every(n => Number.isInteger(n) && n >= 0 && n <= 255))
    return ok ? (raw as KeyAssignment[]) : null
  },
  save(map: readonly KeyAssignment[]): void {
    safeWrite(KEYMAP_KEY, map)
  },
}
