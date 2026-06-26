import type { Profile, Settings } from './types'
import { VID_DEFAULT, PID_DEFAULT, DEFAULT_MODES } from './protocol'

// v4: corrected from the official driver RE — real VID/PID (0x0C45/0x1007) and
// the firmware mode table (default_light.json). Must bump the key so cached v3
// settings (old OpenRGB mode names + wrong VID/PID) don't mask the new table.
const PROFILES_KEY = 'ak820_profiles_v2'
const SETTINGS_KEY = 'ak820_settings_v4'

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
    } catch {
      // ignore
    }
  },
}
