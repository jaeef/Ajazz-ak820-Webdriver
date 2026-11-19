// Key layout for the Ajazz AK820 (75% layout). Positions come from the
// official driver's Skin/XML/DeviceXml/keyboarddevice.xml.
// `id` is the firmware slot: the index into both the 128-entry keymap
// (CMD 0x09) and the per-key LED buffer (CMD 0x0B). Slots run column-major
// (Esc 0, ` 1, Tab 2, Caps 3, …). Each id was matched by HID usage against
// the keymap captured from the vendor app; Esc 0 / W 18 / Enter 107 were
// verified by painting single keys in the vendor app.

export interface KeyDef {
  id: number       // firmware slot (keymap index = LED index)
  label: string     // key label for display
  x: number         // X position in the official driver's skin coordinate system
  y: number        // Y position
  w: number         // width in skin pixels
  h: number        // height
}

export const KEY_LAYOUT: KeyDef[] = [
  { id: 0, label: 'Esc', x: 100, y: 18, w: 27, h: 26 },
  { id: 8, label: 'F1', x: 136, y: 17, w: 28, h: 28 },
  { id: 16, label: 'F2', x: 165, y: 17, w: 28, h: 28 },
  { id: 24, label: 'F3', x: 194, y: 17, w: 28, h: 28 },
  { id: 32, label: 'F4', x: 223, y: 17, w: 28, h: 28 },
  { id: 40, label: 'F5', x: 259, y: 17, w: 28, h: 28 },
  { id: 48, label: 'F6', x: 288, y: 17, w: 28, h: 28 },
  { id: 56, label: 'F7', x: 317, y: 17, w: 28, h: 28 },
  { id: 64, label: 'F8', x: 346, y: 17, w: 28, h: 28 },
  { id: 72, label: 'F9', x: 382, y: 17, w: 28, h: 28 },
  { id: 80, label: 'F10', x: 411, y: 17, w: 28, h: 28 },
  { id: 88, label: 'F11', x: 440, y: 17, w: 28, h: 28 },
  { id: 96, label: 'F12', x: 469, y: 17, w: 27, h: 28 },
  { id: 1, label: '`', x: 100, y: 53, w: 27, h: 27 },
  { id: 9, label: '1', x: 129, y: 54, w: 27, h: 26 },
  { id: 17, label: '2', x: 158, y: 54, w: 27, h: 26 },
  { id: 25, label: '3', x: 187, y: 54, w: 27, h: 26 },
  { id: 33, label: '4', x: 216, y: 54, w: 27, h: 26 },
  { id: 41, label: '5', x: 245, y: 54, w: 27, h: 26 },
  { id: 49, label: '6', x: 274, y: 54, w: 27, h: 26 },
  { id: 57, label: '7', x: 303, y: 54, w: 27, h: 26 },
  { id: 65, label: '8', x: 332, y: 54, w: 27, h: 26 },
  { id: 73, label: '9', x: 361, y: 54, w: 26, h: 26 },
  { id: 81, label: '0', x: 390, y: 54, w: 26, h: 26 },
  { id: 89, label: '-', x: 419, y: 54, w: 26, h: 26 },
  { id: 97, label: '+', x: 448, y: 54, w: 26, h: 26 },
  { id: 105, label: 'BackSpace', x: 476, y: 54, w: 56, h: 26 },
  { id: 121, label: 'Home', x: 547, y: 53, w: 27, h: 27 },
  { id: 122, label: 'PageUp', x: 547, y: 82, w: 27, h: 27 },
  { id: 2, label: 'Tab', x: 100, y: 82, w: 42, h: 27 },
  { id: 10, label: 'Q', x: 143, y: 82, w: 27, h: 27 },
  { id: 18, label: 'W', x: 172, y: 82, w: 27, h: 27 },
  { id: 26, label: 'E', x: 201, y: 82, w: 27, h: 27 },
  { id: 34, label: 'R', x: 230, y: 82, w: 27, h: 27 },
  { id: 42, label: 'T', x: 259, y: 82, w: 27, h: 27 },
  { id: 50, label: 'Y', x: 288, y: 82, w: 27, h: 27 },
  { id: 58, label: 'U', x: 317, y: 82, w: 27, h: 27 },
  { id: 66, label: 'I', x: 346, y: 82, w: 27, h: 27 },
  { id: 74, label: 'O', x: 375, y: 82, w: 27, h: 27 },
  { id: 82, label: 'P', x: 404, y: 82, w: 27, h: 27 },
  { id: 90, label: '[', x: 433, y: 82, w: 27, h: 27 },
  { id: 98, label: ']', x: 462, y: 82, w: 27, h: 27 },
  { id: 106, label: '\\', x: 491, y: 82, w: 41, h: 27 },
  { id: 114, label: 'Delete', x: 505, y: 17, w: 28, h: 28 },
  { id: 123, label: 'End', x: 547, y: 140, w: 27, h: 27 },
  { id: 115, label: 'PageDown', x: 547, y: 111, w: 27, h: 27 },
  { id: 3, label: 'CapsLock', x: 100, y: 111, w: 49, h: 27 },
  { id: 11, label: 'A', x: 150, y: 111, w: 28, h: 27 },
  { id: 19, label: 'S', x: 179, y: 111, w: 28, h: 27 },
  { id: 27, label: 'D', x: 208, y: 111, w: 28, h: 27 },
  { id: 35, label: 'F', x: 237, y: 111, w: 28, h: 27 },
  { id: 43, label: 'G', x: 266, y: 111, w: 28, h: 27 },
  { id: 51, label: 'H', x: 295, y: 111, w: 28, h: 27 },
  { id: 59, label: 'J', x: 324, y: 111, w: 28, h: 27 },
  { id: 67, label: 'K', x: 353, y: 111, w: 28, h: 27 },
  { id: 75, label: 'L', x: 382, y: 111, w: 28, h: 27 },
  { id: 83, label: ';', x: 411, y: 111, w: 28, h: 27 },
  { id: 91, label: '\'', x: 440, y: 111, w: 28, h: 27 },
  { id: 107, label: 'Enter', x: 469, y: 111, w: 63, h: 27 },
  { id: 4, label: 'Shift', x: 100, y: 140, w: 63, h: 27 },
  { id: 20, label: 'Z', x: 165, y: 140, w: 27, h: 27 },
  { id: 28, label: 'X', x: 194, y: 140, w: 27, h: 27 },
  { id: 36, label: 'C', x: 223, y: 140, w: 27, h: 27 },
  { id: 44, label: 'V', x: 252, y: 140, w: 27, h: 27 },
  { id: 52, label: 'B', x: 281, y: 140, w: 27, h: 27 },
  { id: 60, label: 'N', x: 310, y: 140, w: 27, h: 27 },
  { id: 68, label: 'M', x: 339, y: 140, w: 27, h: 27 },
  { id: 76, label: ',', x: 368, y: 140, w: 27, h: 27 },
  { id: 84, label: '.', x: 397, y: 140, w: 27, h: 27 },
  { id: 92, label: '/', x: 426, y: 140, w: 27, h: 27 },
  { id: 108, label: 'Rightshift', x: 454, y: 140, w: 49, h: 27 },
  { id: 116, label: 'Up', x: 512, y: 147, w: 26, h: 26 },
  { id: 5, label: 'Ctrl', x: 100, y: 170, w: 34, h: 26 },
  { id: 13, label: 'Win', x: 136, y: 170, w: 34, h: 26 },
  { id: 21, label: 'Alt', x: 172, y: 170, w: 35, h: 26 },
  { id: 45, label: 'Space', x: 208, y: 170, w: 179, h: 26 },
  { id: 77, label: 'Right Alt', x: 389, y: 170, w: 28, h: 26 },
  { id: 85, label: 'Fn', x: 418, y: 170, w: 28, h: 26 },
  { id: 93, label: 'Right Ctrl', x: 447, y: 170, w: 28, h: 26 },
  { id: 109, label: 'Left', x: 483, y: 176, w: 26, h: 26 },
  { id: 117, label: 'Down', x: 512, y: 176, w: 26, h: 26 },
  { id: 125, label: 'Right', x: 541, y: 176, w: 26, h: 26 },
]

export const VISIBLE_KEY_COUNT = 82
