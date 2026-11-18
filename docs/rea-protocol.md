# Fresh RE protocol notes — AJAZZ AK820 (vendor driver)

Source: independent reverse-engineering pass, 2026-11-18.
Evidence: Ghidra 12.2 decompilation, live IAT hook on the vendor app, saved HID capture, extracted vendor data files.
Raw data: `E:\Tools\ghidra-dist\live-hid-analysis.txt`, `mode-apply-analysis.txt`, `button-settings-analysis.txt`, `capture-crypto.txt`.

## Transport

- The vendor Windows app sends 64-byte HID OUTPUT reports with leading report ID `0x04` through `WriteFile`.
- It does **not** use `HidD_SetOutputReport` for these commands (that import is used by a separate 17-byte init routine, `FUN_00486F50`).
- The web driver uses WebHID `sendReport`; byte layout is the same.

## 64-byte frame layout (packet offsets)

| Packet byte(s) | Meaning | Verified value(s) |
| --- | --- | --- |
| 0 | report prefix | `0x04` |
| 1–2 | checksum, little-endian | `sum(packet[3..63]) & 0xFFFF` |
| 3 | command | see command table below |
| 4 | data length | `0x1d` (29) lighting, `0x38` (56) per chunk otherwise |
| 5–6 | data offset, LE | `00 00`; per-key colors start at `0x0400` |
| 8.. | data | see below |

### Lighting data block (29 bytes, packet byte = data index + 8)

| Data idx | Packet | Meaning | Evidence |
| --- | --- | --- | --- |
| 1 | 9 | mode id (`default_light.json`) | `01` Corrugated, `02` Cloud, `05` Breath, `08` Ripples, `12` Speed, `14` Custom, `FE` Audio wave |
| 2 | 10 | brightness 0–4 | observed 1–4, stepped during Button Settings probe |
| 3 | 11 | speed 0–4 | observed 2–4 |
| 4 | 12 | direction | verified: `00` left→right / inside, `01` right→left / outside |
| 5 | 13 | random-color flag | verified: rainbow swatch → `01` |
| 6–8 | 14–16 | R, G, B | verified by swatch clicks |
| 20 | 28 | `0xff` | constant, meaning unknown |
| 25 | 33 | `0x02` | constant, meaning unknown |

Implemented in `src/protocol.ts` (`buildLightingData`); self-check: `node scripts/check-protocol.ts`. Hardware-verified: Static, Cloud and Breath applied from the web app all took effect.

### The saved capture is not vendor traffic

`ak820-capture-1784532299305.json` has the shape of this app's own CapturePanel export (`id, t, dir, transport, reportId, hex, bytes`). Its `0x15` records are the web app's old 21-byte block (`0x15` = length 21), and the inbound copies are the keyboard echoing every report. An echo does not show the firmware accepted the data.

Offsets in that JSON omit the leading `0x04`: subtract 1 from every packet offset above.

## Checksum

`packet[1] | packet[2] << 8 === sum(packet[3..63]) & 0xFFFF`

- Verified 46/46 command-shaped records in `ak820-capture-1784532299305.json`.
- Verified 36/36 live 64-byte HID writes from the vendor app.
- CRC-16 variants, XOR16 and id-derived candidates all scored 0/46.

## Handshake

Each command is framed by two reports:

- Begin: `04 01 00 01 00 …` (all remaining bytes zero)
- Command: frame above
- End: `04 02 00 02 00 …`

## Verified color mapping

Clicking palette swatches in the vendor UI (hook active) produced:

| UI color | RGB bytes 14–16 |
| --- | --- |
| red | `ff 00 00` |
| green | `00 d7 0f` |
| blue | `31 53 ff` |
| light blue | `00 99 ff` |

These match the palette in the extracted `DefaultData`/`Skin` data and the existing `DEFAULT_PALETTE` in `src/protocol.ts`.

## Cross-check with existing code

`src/protocol.ts` already models the same frame: byte 0 `0x04`, bytes 1–2 unsigned LE checksum, byte 3 command, `CMD_SET_PARAMETER = 0x06`, begin/end packets, and the firmware mode table from `default_light.json` (values 0–30, 12 visible function types in `KeySetControl.xml`). The fresh pass independently confirms those facts and corrects the lighting block to the vendor's 29-byte layout.

## 17-byte init routine

`FUN_00486F50` (`0x486F50`–`0x4876EA`, 1,947 bytes) issues 12 `HidD_SetOutputReport` calls with 17-byte reports. Command markers written into `local_13`:

`AA22, AD22, AA44, AD44, AB22, AE22, AB44, AE44, AC22, AF22, AC44, AF44`

Inference: paired write/verify operations. Not yet mapped to a UI action; no device-side confirmation.

## Commands (session 2, 2026-11-19)

Hardware-verified from the web app: `06` (direction, random color), `09` (remap + restore), `0B` (per-key on Esc / W / Enter).

Every write is framed BEGIN (`01`) → data packets → END (`02`), data split into `0x38`-byte chunks.

| Cmd | Kind | Payload | Evidence |
| --- | --- | --- | --- |
| `03` | — | len `0x22`, no data; sent once before keymap/macro writes | purpose unknown |
| `05` | read? | len `01` / `1d`, no data, at startup | inferred read of lighting block |
| `06` | write | 29-byte lighting block at offset 0 | verified, hardware-tested from the web app |
| `07` | read? | len `0x38`, offsets `0..0x150` at startup (384 bytes) | inferred keymap read |
| `09` | write | keymap: 128 × `[type, modifier, usage]` at offset 0 | verified: Caps → Esc wrote slot 3 = `20 00 29`; restore wrote `20 00 39` |
| `0B` | write | per-key colors: 128 × `[R, G, B]` at offset `0x400` | verified: Esc blue → `31 53 FF` at `0x400`; W → LED 18; Enter → LED 107 |
| `12` | write | len `0x38`, streamed continuously in Audio wave mode | visualizer levels, not needed |
| `15` | write | macro table, see below | one sample only |
| `1A` | — | `1a 06`, every ~5 s | poll |
| `1B` | read? | startup only | unknown |

### Slots

Keymap slot = LED index, column-major: Esc 0, `` ` `` 1, Tab 2, Caps 3, LShift 4, LCtrl 5, F1 8, 1 9, Q 10 … Enter 107. Full default table: `DEFAULT_KEYMAP_HEX` in `src/protocol.ts`.

Entry types: `20` keyboard (`[20, modifier-mask, usage]`), `30` consumer, `70` macro (`[70, macro-index, 0]`), `A0` Fn, `D0` Fn layer.

### Macro block (cmd `15`, two samples)

The vendor uploads only assigned macros; the first is index 0 and its key slot becomes `[70, 00, 00]`.

```
macro_1 (A/B):   AA 55 | 26 00 | 01 00 | 5C 00 43 00 3A 00 5C 00 55 00 | 12 00 | 04 00 | 72 00 | 1F 00 8A 04 | 77 01 0A 04 | …
macro_2 (X/Y/Z): AA 55 | 2E 00 | 01 00 | 59 04 48 3D 59 04 01 00 5A 74 | 12 00 | 06 00 | 19 00 | 1F 00 8A 1B | 68 01 0A 1B | …
                 magic  total   count   junk (differs per upload)        offset  events  junk    delay u16 | 8A down / 0A up | usage
```

`offset` = `0x12`, measured from byte 4 to the first event. The web app sends zeros for the junk bytes; hardware-verified (a "hi" macro typed correctly). Implemented for one macro (`buildMacroPackets`); the multi-macro directory layout was never captured. Vendor-app gotcha: Save in Button Settings only fires after the window has been dragged once.

## Unknowns

- Meaning of lighting data `[20]=0xff` and `[25]=0x02`.
- Commands `03`, `1B`; whether `05`/`07` are reads.
- Multi-macro directory layout; whether the junk bytes matter to the firmware.
- Owning class / call path for the `0x6949DC` function-pointer table.
