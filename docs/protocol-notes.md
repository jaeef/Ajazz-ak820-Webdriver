# Ajazz AK820 — Protocol Notes (WebHID)

> ## ✅ CORRECTION — verified against the official driver (2026-06)
> The bundled official app **`AJAZZ AK820 有线RGB Keyboard.exe`** (NSIS → 7z →
> native DuiLib app) was reverse-engineered. Findings that override older notes:
>
> | Field | **This unit (official driver)** | Old notes said |
> |---|---|---|
> | VID | `0x0C45` (3141) | 0x320F |
> | PID | `0x1007` (4103) | 0x505B |
> | Chip | `VS11K34A` ("eevision" family) | Yichip |
> | Lighting transport | `HidD_SetOutputReport` | OUTPUT report ✓ |
> | Per-key custom report | **17 bytes**, `FF 22/44 AA/AB/AD …`, color scaled `c*bright>>8`, clamped ≤`0xF7` | 64-byte EVision |
> | Mode IDs | **Ajazz firmware table** (default_light.json), see below | OpenRGB generic |
>
> Source of truth for mode IDs is `DefaultData/default_light.json` (keyboard
> profile). The 64-byte command frame still drives effect-mode select on this
> unit; only the **mode-ID numbering** differed from OpenRGB — that mismatch was
> the "wrong modes" bug. `protocol.ts` `DEFAULT_MODES` now uses the firmware IDs:
>
> | ID | Mode | ID | Mode | ID | Mode |
> |---|---|---|---|---|---|
> | 1 | Wave | 8 | Stone | 15 | Rain |
> | 2 | Cloud | 9 | Traverse | 16 | Scan |
> | 3 | Vortex | 10 | Starlight | 17 | Marquee |
> | 4 | Mixed Color | 11 | Firework | 18 | Speed |
> | 5 | Breathing | 12 | Roll | 20 | Custom (per-key) |
> | 6 | Static | 13 | Wave Bar | 29 | Audio React (PC) |
> | 7 | Reactive | 14 | Cartoon | 30 | Screen Color (PC) |
>
> ### Checksum is UNSIGNED (the "many modes don't change" bug)
> The real keyboard data path is `WriteFile` of a **64-byte** report (SendReport
> @`0x4781c0`), built by 15 command functions (@`0x478ff0`+). Confirmed frame:
> ```
> [0]=0x04  [1..2]=checksum LE  [3]=cmd  [4]=len  [5..6]=offset  [8..]=data
> ```
> Commands: **1 = BEGIN, 2 = END, 5/6 = write data to offset**. The lighting
> state ({mode,brightness,speed,direction,random,R,G,B}) is written as 8 bytes
> at config offset 0 via cmd 6 — exactly what `buildLightingPacket` does.
>
> The checksum (`@0x47af75`, `@0x47b1bd`) sums `bytes[3..63]` as **UNSIGNED**
> bytes (`movzx`) → `[1]=sum&0xff, [2]=(sum>>8)&0xff`. The old code summed them
> as **signed** char (OpenRGB's 0x320F behavior). Low byte is identical, but the
> **high byte is off by one for every payload byte ≥ 0x80** — so any packet with
> a bright color channel or a high parameter got a bad `byte[2]` and the firmware
> dropped it silently. Switching to an unsigned sum (`protocol.ts applyChecksum`)
> is the fix.
>
> **Still un-RE'd:** the per-key Custom blob's exact key→LED ordering (the
> `SetOutputReport` path @`0x486f50` covers a ≤13-LED secondary channel; the main
> 126-key data streams as cmd-6 chunks). For pixel-exact per-key, capture with
> USBPcap.

> ## ✅ UPDATE — full app extraction (2026-07)
> The complete NSIS → 7z archive was extracted (1529 files). The app's
> `Skin/XML/DeviceXml/keyboarddevice.xml` defines **126 DeviceKeyButton**
> elements, each with `name="key_N"` and `userdata="light_N"` — confirming
> the **key ID == LED index** (1:1 mapping) for all 126 entries. 82 keys
> are visible on the 75% AK820 layout; 44 are hidden (numpad, M1-M5,
> K14/K45/K56/K107, etc.). The mapping is now in `src/keymap.ts`.
>
> Additional findings from the extracted app:
>
> | Source file | Finding |
> |---|---|
> | `Skin/XML/CustomControlXML/LightControl.xml` | Speed slider `max="4"` (not 5); brightness `max="4"`; 13 preset colors; direction is a 2-option checkbox (left/right only in the official UI, but firmware supports 4) |
> | `DefaultData/color_option_info.config` | The exact 13 preset colors in ARGB: #FF0000, #FF7200, #FFF005, #00D70F, #0099FF, #3153FF, #5E01D2, #EE00F1, #FF008A, #FFA800, #8DFF8D, #3DEFFF, #004891 |
> | `Skin/XML/CustomControlXML/KeySetControl.xml` | Key remapping has 12 function types: 0=Default, 1=Mouse, 2=MouseSwing(hidden), 3=MouseWheel(hidden), 4=DPI, 5=FireKey, 6=StandardKeyboard, 7=Multimedia, 8=System, 9=Macro, 10=Mechanician, 11=Office(combo) |
> | `Skin/XML/CustomControlXML/MacroControl.xml` | Macro management: record/stop, fixed-time or ignore-delay, insert mouse moves, per-macro name, list of keystroke+action+delay(ms) entries |
> | `DefaultData/Keyboard.json` | `CustomLightMode.LightColorInfo` is an array of 126×{Alpha,Red,Green,Blue} per LED group — the per-key color data format |
> | `DefaultData/AudioFile.json` | Audio mode has 4 style groups, each with RGB values (e.g. group 0 = R:5,G:5,B:0) and style names |
> | `Skin/lan_en.xml` | All UI strings — confirms mode names match the labels already in `protocol.ts` |


> ## ⚠ Two different AK820 hardware families
>
> "AK820" is sold with **two completely different controllers**. They share
> nothing at the USB level — VID, usage page, transport, and packet format all
> differ. Identify yours by USB VID/PID (Windows: Device Manager → Properties →
> Details → Hardware IDs; Linux/macOS: `lsusb` / System Report):
>
> | Family | VID | PID (wired) | Vendor usage page | Transport | This app |
> |---|---|---|---|---|---|
> | **EVision / Yichip** (AK820, non-Pro) | `0x320F` | `0x505B` | `0xFF1C` | OUTPUT report | ✅ implemented |
> | **Sonix / Microdia** (AK820 Pro) | `0x0C45` | `0x8009` | `0xFF13` | Feature report | legacy (see git history) |
>
> The driver in this repo targets the **EVision** family (the unit it was tested
> against). The EVision protocol is documented below and ported from OpenRGB's
> `EVisionKeyboardController` (GPL-2.0) — the authoritative RE of this silicon,
> which also powers Redragon, Glorious GMMK, Tecware, Womier and SKILLKORP boards.

---

## EVision protocol (VID 0x320F — the implemented one)

**Device identification**

| Field | Value |
|---|---|
| Vendor ID | `0x320F` (Yichip / "EVision") |
| Product ID (wired) | `0x505B` (also 0x5000/0x5004/0x5044/0x5064/0x5078/0x5084/0x502A … across rebrands) |
| Vendor control interface | number `1`, **HID usage page `0xFF1C`** |
| Transport | **HID OUTPUT report** (`device.sendReport`), 64 bytes |

**Packet frame (all 64 bytes)**

```
offset:  0    1    2    3    4    5    6   7   8 ...
value:  04  CKL  CKH  CMD  ...payload...
```

- byte 0 — `0x04` report-id / command-class prefix
- bytes 1–2 — 16-bit **little-endian checksum** = `sum(bytes[3..63])`
- byte 3 — command: `0x01` begin, `0x02` end, `0x06` set-parameter, `0x11` write-colors

**Effect-mode packet** (command `0x06`, parameter `0x00`, 8 data bytes):

```
offset:  0   3   4   5   8   9   10  11  12  13 14 15
value:  04  06  08  00   M   BR  SP  DR  RND  R  G  B   + checksum @1-2
```

- `M` mode id (see table), `BR` brightness `0..4` (0 = off), `SP` speed `0..5` (0 = fastest), `DR` direction (Left=0, Right=1, Up=2, Down=3), `RND` random-color flag, `R/G/B` color

**Mode IDs**: 0x01 Color Wave (short), 0x02 Color Wave, 0x03 Color Wheel, 0x04 Spectrum Cycle, 0x05 Breathing, 0x06 Static, 0x07 Reactive, 0x08 Reactive Ripple, 0x09 Reactive Line, 0x0A Starlight (fast), 0x0B Blooming, 0x0C Vertical Rainbow, 0x0D Hurricane, 0x0E Accumulate, 0x0F Starlight (slow), 0x10 Visor, 0x11 Surmount, 0x12 Rainbow Circle, 0x14 Custom (per-key, not wired yet).

**WebHID report-ID note**: byte 0 (`0x04`) is sent as the report ID only if the
device's output report is *numbered*. The app auto-detects this from the
collection's declared output report IDs (`resolveSend` in `protocol.ts`); manual
`native` / `payload` overrides exist in Settings.

**Not supported on this hardware**: time sync and sleep timer (those are TFT /
AK820 Pro features of the Sonix family).

---

## Legacy: Sonix / Microdia AK820 Pro (VID 0x0C45)

The notes below describe the *other* family and are kept for reference. They do
**not** apply to a 0x320F unit.

## Device identification

| Field | Value | Notes |
|---|---|---|
| Vendor ID (USB VID) | `0x0C45` (Microdia/Sonix) | Confirmed across all 3 sources |
| Product ID — wired USB | `0x8009` | Confirmed across all 3 sources |
| Product ID — 2.4 GHz dongle | `0xFEFE` | AKS075 only; **NOT confirmed for AK820 Pro** |
| Product ID — Bluetooth | Unknown | Not yet published for any Ajazz keyboard |
| Control HID interface number | `3` | Confirmed |
| Data HID interface number | `2` | Confirmed |
| Data interface interrupt-OUT endpoint | `0x03` | Confirmed |
| Control interface HID usage page | `0xFF13` | Use in WebHID filter to disambiguate |
| Data interface HID usage page | `0xFF68` | Same |
| Standard 64-byte feature-report packet length | `64` | All sources agree |

## Sources

- **gohv/EPOMAKER-Ajazz-AK820-Pro** (Rust) — primary reference for time sync and lighting on AK820 Pro
- **aar-rafi/aks075-linux** (Python + Ghidra-decompiled C) — primary reference for image upload (sibling AKS075)
- **TaxMachine/ajazz-keyboard-software-linux** (C++) — cross-check for AK820 Pro control reports

## Lighting packet (Feature: lighting)

**Packet length:** 64 bytes. **HID report ID:** `0x00` (treat the mode byte as payload byte 0, NOT as the report ID).

```
offset:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15  ...  63
value:   M  R  G  B  0  0  0  0 RB BS SP DR  0  0 55 AA  ...  00
```

| Offset | Field | Encoding |
|---|---|---|
| 0 | mode (lighting mode) | uint8, 0x00..0x13 |
| 1 | red | uint8, 0..255 |
| 2 | green | uint8, 0..255 |
| 3 | blue | uint8, 0..255 |
| 4-7 | padding | 0x00 |
| 8 | rainbow toggle | 0 or 1 |
| 9 | brightness | 0..5 |
| 10 | speed | 0..5 |
| 11 | direction | 0=Left, 1=Up, 2=Down, 3=Right (gohv); 0=LEFT, 1=UP, 2=DOWN, 3=RIGHT (TaxMachine) — **sources disagree on direction enum** |
| 12-13 | padding | 0x00 |
| 14 | trailer (low byte) | `0x55` |
| 15 | trailer (high byte) | `0xAA` |
| 16-63 | padding | 0x00 |

## Time sync (Feature: clock — AK820 Pro / Max / Max HE only)

Four feature reports sent in sequence, each 64 bytes:

1. **START** — `[04 18 00 ... 00 01 ...]`
2. **TIME_CFG** — `[04 28 00 ... 00 01 ...]`
3. **TIME_DATA** — `[00 01 5A YY MM DD HH mm ss 00 04 ... AA 55]`
4. **SAVE** — `[04 02 00 ... 00 00 ...]`

`YY` is `year - 2000` (e.g. 2026 → `0x1A`). All time fields are **binary**, NOT BCD.

After all 4 packets, wait 100 ms.

## Sleep timer (Feature: sleep)

```
offset:  0  1  2  3  4  5  6  7  8  ... 62 63
value:  04  07  0  0  0  0  0  0 MM  ... AA 55
```

`MM` is the number of minutes (0 = off, or 5/10/30/60 per the official driver).

**Caveat:** the command byte `0x07` is a **placeholder** — the official driver's sleep command code is not yet published. If it doesn't work, the next step is a Wireshark capture.

## Image upload (Feature: TFT image — AK820 Pro / Max / Max HE only)

NOT implemented in this project. See [Beattrey/ajazz-ak820-config](https://github.com/Beattrey/ajazz-ak820-config) for a working WebHID implementation.

## Known unknowns

1. **Bluetooth Product ID** — not published for any Ajazz keyboard. Discover via macOS System Report → Bluetooth, or Windows Device Manager.
2. **AK820 Pro 2.4 GHz dongle PID** — AKS075 uses `0xFEFE`; AK820 Pro's dongle PID is unconfirmed.
3. **Whether AK820 Pro tolerates `04 F0` FINISH packet after image upload** — gohv ships it; AKS075 docs say it breaks persistence.
4. **Whether `0x04` first-payload-byte must be passed as `reportId` in WebHID, or as `payload[0]` with `reportId=0`** — for safety we use `reportId=0, payload[0]=0x04`. If your device rejects, try the alternative in Settings → Report ID mode.
5. **Direction enum ordering** — gohv and TaxMachine disagree. The official driver may use either order.
6. **Mode names** — the 20 mode IDs (0x00-0x13) are documented but their friendly names are inferred from common Ajazz keyboards. Rename them in Settings → Edit mode names to match what your unit actually does.

## Cross-check matrix (lighting)

| Aspect | gohv | TaxMachine | Resolution |
|---|---|---|---|
| HID report ID | 0x04 (= mode) | 0x04 (= mode) | For WebHID: use `reportId=0x00` with `payload[0]=mode`. The hidapi `send_feature_report` API fuses the two, but WebHID separates them. |
| Direction encoding | 0=Left, 1=Down, 2=Up, 3=Right | 0=LEFT, 1=UP, 2=DOWN, 3=RIGHT | **Unresolved.** Test both orderings on real hardware. |
| Brightness range | 0..5 | 0..5 | Confirmed |
| Speed range | 0..5 | 0..5 | Confirmed |
| Trailer | 0xAA 0x55 at bytes 14-15 | Same | Confirmed |
