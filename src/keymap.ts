// Key layout and LED index mapping for the Ajazz AK820 (75% layout).
// Extracted from the official driver's Skin/XML/DeviceXml/keyboarddevice.xml.
// Each entry maps a physical key to its LED index (0-125). The LED index
// is identical to the key ID on this firmware (1:1 mapping confirmed by
// the userdata="light_N" attribute matching name="key_N" for all 126 keys).
// Only the 82 visible keys are listed; the 44 hidden entries (numpad,
// M1-M5, K14/K45/K56/K107, etc.) are omitted because the AK820 has no
// numpad and those LEDs are not addressable from the physical layout.

export interface KeyDef {
  id: number       // firmware key ID (matches LED index on this hardware)
  label: string     // key label for display
  x: number         // X position in the official driver's skin coordinate system
  y: number        // Y position
  w: number         // width in skin pixels
  h: number        // height
}

export const KEY_LAYOUT: KeyDef[] = [
  { id: 0, label: 'Esc', x: 100, y: 18, w: 27, h: 26 },
  { id: 1, label: 'F1', x: 136, y: 17, w: 28, h: 28 },
  { id: 2, label: 'F2', x: 165, y: 17, w: 28, h: 28 },
  { id: 3, label: 'F3', x: 194, y: 17, w: 28, h: 28 },
  { id: 4, label: 'F4', x: 223, y: 17, w: 28, h: 28 },
  { id: 5, label: 'F5', x: 259, y: 17, w: 28, h: 28 },
  { id: 6, label: 'F6', x: 288, y: 17, w: 28, h: 28 },
  { id: 7, label: 'F7', x: 317, y: 17, w: 28, h: 28 },
  { id: 8, label: 'F8', x: 346, y: 17, w: 28, h: 28 },
  { id: 9, label: 'F9', x: 382, y: 17, w: 28, h: 28 },
  { id: 10, label: 'F10', x: 411, y: 17, w: 28, h: 28 },
  { id: 11, label: 'F11', x: 440, y: 17, w: 28, h: 28 },
  { id: 12, label: 'F12', x: 469, y: 17, w: 27, h: 28 },
  { id: 21, label: '`', x: 100, y: 53, w: 27, h: 27 },
  { id: 22, label: '1', x: 129, y: 54, w: 27, h: 26 },
  { id: 23, label: '2', x: 158, y: 54, w: 27, h: 26 },
  { id: 24, label: '3', x: 187, y: 54, w: 27, h: 26 },
  { id: 25, label: '4', x: 216, y: 54, w: 27, h: 26 },
  { id: 26, label: '5', x: 245, y: 54, w: 27, h: 26 },
  { id: 27, label: '6', x: 274, y: 54, w: 27, h: 26 },
  { id: 28, label: '7', x: 303, y: 54, w: 27, h: 26 },
  { id: 29, label: '8', x: 332, y: 54, w: 27, h: 26 },
  { id: 30, label: '9', x: 361, y: 54, w: 26, h: 26 },
  { id: 31, label: '0', x: 390, y: 54, w: 26, h: 26 },
  { id: 32, label: '-', x: 419, y: 54, w: 26, h: 26 },
  { id: 33, label: '+', x: 448, y: 54, w: 26, h: 26 },
  { id: 34, label: 'BackSpace', x: 476, y: 54, w: 56, h: 26 },
  { id: 36, label: 'Home', x: 547, y: 53, w: 27, h: 27 },
  { id: 37, label: 'PageUp', x: 547, y: 82, w: 27, h: 27 },
  { id: 42, label: 'Tab', x: 100, y: 82, w: 42, h: 27 },
  { id: 43, label: 'Q', x: 143, y: 82, w: 27, h: 27 },
  { id: 44, label: 'W', x: 172, y: 82, w: 27, h: 27 },
  { id: 45, label: 'E', x: 201, y: 82, w: 27, h: 27 },
  { id: 46, label: 'R', x: 230, y: 82, w: 27, h: 27 },
  { id: 47, label: 'T', x: 259, y: 82, w: 27, h: 27 },
  { id: 48, label: 'Y', x: 288, y: 82, w: 27, h: 27 },
  { id: 49, label: 'U', x: 317, y: 82, w: 27, h: 27 },
  { id: 50, label: 'I', x: 346, y: 82, w: 27, h: 27 },
  { id: 51, label: 'O', x: 375, y: 82, w: 27, h: 27 },
  { id: 52, label: 'P', x: 404, y: 82, w: 27, h: 27 },
  { id: 53, label: '[', x: 433, y: 82, w: 27, h: 27 },
  { id: 54, label: ']', x: 462, y: 82, w: 27, h: 27 },
  { id: 55, label: '\\', x: 491, y: 82, w: 41, h: 27 },
  { id: 56, label: 'Delete', x: 505, y: 17, w: 28, h: 28 },
  { id: 57, label: 'End', x: 547, y: 140, w: 27, h: 27 },
  { id: 58, label: 'PageDown', x: 547, y: 111, w: 27, h: 27 },
  { id: 63, label: 'CapsLock', x: 100, y: 111, w: 49, h: 27 },
  { id: 64, label: 'A', x: 150, y: 111, w: 28, h: 27 },
  { id: 65, label: 'S', x: 179, y: 111, w: 28, h: 27 },
  { id: 66, label: 'D', x: 208, y: 111, w: 28, h: 27 },
  { id: 67, label: 'F', x: 237, y: 111, w: 28, h: 27 },
  { id: 68, label: 'G', x: 266, y: 111, w: 28, h: 27 },
  { id: 69, label: 'H', x: 295, y: 111, w: 28, h: 27 },
  { id: 70, label: 'J', x: 324, y: 111, w: 28, h: 27 },
  { id: 71, label: 'K', x: 353, y: 111, w: 28, h: 27 },
  { id: 72, label: 'L', x: 382, y: 111, w: 28, h: 27 },
  { id: 73, label: ';', x: 411, y: 111, w: 28, h: 27 },
  { id: 74, label: '\'', x: 440, y: 111, w: 28, h: 27 },
  { id: 75, label: 'Enter', x: 469, y: 111, w: 63, h: 27 },
  { id: 84, label: 'Shift', x: 100, y: 140, w: 63, h: 27 },
  { id: 85, label: 'Z', x: 165, y: 140, w: 27, h: 27 },
  { id: 86, label: 'X', x: 194, y: 140, w: 27, h: 27 },
  { id: 87, label: 'C', x: 223, y: 140, w: 27, h: 27 },
  { id: 88, label: 'V', x: 252, y: 140, w: 27, h: 27 },
  { id: 89, label: 'B', x: 281, y: 140, w: 27, h: 27 },
  { id: 90, label: 'N', x: 310, y: 140, w: 27, h: 27 },
  { id: 91, label: 'M', x: 339, y: 140, w: 27, h: 27 },
  { id: 92, label: ',', x: 368, y: 140, w: 27, h: 27 },
  { id: 93, label: '.', x: 397, y: 140, w: 27, h: 27 },
  { id: 94, label: '/', x: 426, y: 140, w: 27, h: 27 },
  { id: 95, label: 'Rightshift', x: 454, y: 140, w: 49, h: 27 },
  { id: 96, label: 'Up', x: 512, y: 147, w: 26, h: 26 },
  { id: 105, label: 'Ctrl', x: 100, y: 170, w: 34, h: 26 },
  { id: 106, label: 'Win', x: 136, y: 170, w: 34, h: 26 },
  { id: 107, label: 'Alt', x: 172, y: 170, w: 35, h: 26 },
  { id: 108, label: 'Space', x: 208, y: 170, w: 179, h: 26 },
  { id: 109, label: 'Right Alt', x: 389, y: 170, w: 28, h: 26 },
  { id: 110, label: 'Fn', x: 418, y: 170, w: 28, h: 26 },
  { id: 112, label: 'Right Ctrl', x: 447, y: 170, w: 28, h: 26 },
  { id: 113, label: 'Left', x: 483, y: 176, w: 26, h: 26 },
  { id: 114, label: 'Down', x: 512, y: 176, w: 26, h: 26 },
  { id: 115, label: 'Right', x: 541, y: 176, w: 26, h: 26 },
]

export const VISIBLE_KEY_COUNT = 82

// The full LED count (126) includes hidden/non-physical LEDs that have no
// corresponding visible key. Per-key Custom mode still addresses all 126.
export const FULL_LED_COUNT = 126
