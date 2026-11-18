# Ajazz AK820 — Web Driver (v0.2)

A browser-based WebHID driver for the **Ajazz AK820** mechanical keyboard. Replaces the Windows-only official driver. No install, no admin rights, no network.

## What it does (v0.2)

- **Lighting control** — firmware effect modes from the **official driver's own table** (`default_light.json`): Wave, Cloud, Vortex, Mixed Color, Breathing, Static, Reactive, Stone, Traverse, Starlight, Firework, Roll, Wave Bar, Cartoon, Rain, Scan, Marquee, Speed + per-key Custom. RGB picker, preset palette (13 official colors), brightness (0-4), speed (0-4), direction.
- **Per-key RGB** — visual keyboard layout (82 keys, 75% AK820) with click-to-paint per-key colors. Sends all 128 LEDs via CMD `0x0B` (LED index = firmware key slot, captured from the vendor app), then selects Custom mode.
- **Key remap** — Keys tab: point any key at any standard key (or disable it) and write the 128-slot keymap with CMD `0x09`. Restore defaults puts the factory keymap back. A typed-text macro (CMD `0x15`) can be assigned to any key.
- **Effects (host-computed)** — the official app's PC-driven modes reproduced in the browser:
  - **Audio React** (mode 29) — microphone/system audio → reactive color (Web Audio API)
  - **Screen Color** (mode 30) — average color of a shared screen/window → ambient “ambilight” (Screen Capture API)
- **Profiles** — save / load / delete / export / import lighting setups as JSON
- **Wire-format inspector** — shows the exact bytes being sent
- **Demo mode** — full UI works without hardware; packets are recorded but not transmitted
- **Editable mode names** — rename any mode in Settings → Edit
- **Cross-platform** — works on Windows, macOS, Linux (anywhere Chrome / Edge runs)

## What it does NOT do yet (planned v0.3+)

- **Remap to mouse / multimedia / macro targets** — keymap entry types are known (`30` consumer, `70` macro, `A0`/`D0` Fn) but only standard keys are offered
- **More than one macro** — a single typed-text macro works (Keys tab); the multi-macro table layout hasn't been captured
- **Static / GIF image upload to the TFT** — this lives in a separate open-source project ([Beattrey/ajazz-ak820-config](https://github.com/Beattrey/ajazz-ak820-config))

> **Not applicable to this hardware:** time sync and a sleep timer are clock/TFT
> features of the Sonix **AK820 Pro / Max / Max HE**. This EVision unit
> (VID `0x320F`) has no on-board clock, so those features were removed rather
> than planned.

## How to run it (development)

You need **Node.js 18+** installed. Get it from <https://nodejs.org/>.

```bash
cd ak820-web
npm install
npm run dev
```

Then open the URL Vite prints (usually <http://localhost:5173/>) in **Chrome** or **Edge**.

## How to build for production

```bash
npm run build
npm run preview
```

`dist/` contains the static files you can host anywhere. The site must be served over **HTTPS** (or `http://localhost`) for WebHID to work in production.

## How to use the app

1. Plug your AK820 into USB-C (set switch to **wired**).
2. Open the app in Chrome or Edge.
3. Click **Connect keyboard** → pick your **Ajazz AK820** from the device list.
4. Adjust the **Lighting** tab — click **Apply to keyboard** (or press **Ctrl+Enter**).
5. Save the setup as a named profile from the **Profiles** tab. Profiles persist in your browser's localStorage.

### Browser requirements

- **Chrome 89+** or **Edge 89+** (or any other Chromium-based browser — Brave, Opera, Arc)
- **Firefox and Safari are NOT supported** — they don't implement the WebHID API

### Hardware requirements

- Keyboard plugged in via **USB-C** in **wired** mode
- Default USB IDs (verified by reverse-engineering the official driver —
  `DefaultData/Keyboard.json`, chip `VS11K34A`):
  - **Vendor ID:** `0x0C45` (3141)
  - **Product ID:** `0x1007` (4103)
- ⚠ **Multiple AK820 hardware families exist.** If your unit reports a different
  VID/PID, turn on **“Show all HID devices”** in Settings and pick it manually;
  the firmware mode IDs may differ. See [`docs/protocol-notes.md`](docs/protocol-notes.md).

## Project structure

```
ak820-web/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html              ← Vite entry
├── src/
│   ├── main.tsx           ← React entry
│   ├── App.tsx            ← Top-level component
│   ├── styles.css         ← All CSS
│   ├── types.ts           ← All TypeScript interfaces
│   ├── protocol.ts        ← Pure packet builders + RGB utilities
│   ├── keymap.ts          ← Key layout + LED index mapping (from official driver)
│   ├── device.ts          ← WebHID + Mock controllers
│   ├── store.ts           ← localStorage persistence
│   ├── hooks.ts           ← Custom React hooks
│   ├── vite-env.d.ts      ← Vite + WebHID type declarations
│   └── ui/                ← React components
│       ├── Header.tsx
│       ├── ConnectionPanel.tsx
│       ├── LightingPanel.tsx
│       ├── KeyboardView.tsx
│       ├── ProfilesPanel.tsx
│       ├── SettingsPanel.tsx
│       ├── StatusBar.tsx
│       ├── ModeEditModal.tsx
│       ├── ColorPalette.tsx
│       └── WireFormatInspector.tsx
├── docs/
│   └── protocol-notes.md  ← Living RE documentation
└── README.md
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| "This browser doesn't support WebHID" | Switch to Chrome or Edge. |
| Device picker shows nothing | Make sure the keyboard is plugged in and set to **wired** mode. Try a different USB port or cable. On Linux, you may need a udev rule. |
| "Connect failed: SecurityError" | The page isn't in a secure context. Use `http://localhost:5173` (Vite dev) or HTTPS (production). |
| Clicking Apply has no visible effect | (1) The mode names are guesses — try a few IDs. (2) Go to **Settings → Report ID mode** and try the other option. (3) Compare the wire format against a Wireshark capture. |
| Lighting changes work but reset on power cycle | Expected — Ajazz doesn't persist lighting to flash. Use the official driver to write to onboard memory. |
| A mode ID does nothing | That's likely the "Off" mode. Try a different ID. |
| Color looks wrong | Brightness 0 is off. Try brightness 2-4. |

## How the protocol works (under the hood)

This driver targets the AK820 whose official Windows app is bundled here
(live-enumerated as VID `0x320F` / PID `0x505B`; the vendor bundle lists `0x0C45`/`0x1007`, chip `VS11K34A`). Commands are
**HID OUTPUT reports** (`device.sendReport`) sent over the vendor control
interface (usage page `0xFF1C` / `0xFF13`). The mode IDs come straight from the
official driver's `default_light.json` — not OpenRGB's generic table, which is
what previously selected the wrong effects.

### Lighting packet (sent on every "Apply"):

The 29-byte data block written at config offset 0 (decoded from a live
`WriteFile` hook on the vendor app — see [docs/rea-protocol.md](docs/rea-protocol.md)):

```
data byte:  0    1    2    3    4    5    6    7    8    9-19  20   21-24  25   26-28
value:     00   MOD  BRT  SPD  RND  00   R    G    B    00…   FF   00…    02   00…
```

- `MOD` = mode id from `default_light.json` (verified: 1 Corrugated, 2 Cloud, 5 Breath, 8 Ripples)
- `BRT` = brightness (0-4), `SPD` = speed (0-4, 0 = fastest)
- `RND` = random-color flag (position inferred, not yet seen non-zero from the vendor app)
- `R/G/B` = color channels (verified by clicking known palette swatches)
- bytes 20 = `0xFF` and 25 = `0x02` are constant in every vendor write; meaning unknown

This data block is wrapped in the 64-byte HID frame:

```
frame:  04  CKL CKH 06  1D  00 00  00  [29-byte data]  [zeros]  …  63
```

- byte 0 = `0x04` report-id / command-class prefix (sent as WebHID reportId)
- bytes 1-2 = 16-bit little-endian **checksum** = unsigned `sum(bytes[3..63])`
- byte 3 = `0x06` (write), byte 4 = `0x1D` (length = 29), bytes 5-6 = offset `0x0000`, data from byte 8

For WebHID the call is `device.sendReport(reportId, payload)`, where the report
ID is auto-resolved from the device descriptor (see `resolveSend` in
`src/protocol.ts`). **Time sync** and **sleep timer** are TFT / AK820-Pro
features and are **not supported** on this hardware.

See [`docs/protocol-notes.md`](docs/protocol-notes.md) for the full protocol
documentation, including the legacy Sonix (0x0C45) family.

## Credits

Protocol details derived from these open-source reverse-engineering projects:

- [**OpenRGB** — `EVisionKeyboardController`](https://gitlab.com/CalcProgrammer1/OpenRGB) (GPL-2.0) — authoritative RE of the **EVision / Yichip (0x320F)** family this driver implements
- [gohv/EPOMAKER-Ajazz-AK820-Pro](https://github.com/gohv/EPOMAKER-Ajazz-AK820-Pro) — Rust, lighting + time sync (Sonix family)
- [TaxMachine/ajazz-keyboard-software-linux](https://github.com/TaxMachine/ajazz-keyboard-software-linux) — C++/ImGui, lighting
- [fpb/ajazz-ak820-pro](https://github.com/fpb/ajazz-ak820-pro) — hardware RE, QMK port
- [Beattrey/ajazz-ak820-config](https://github.com/Beattrey/ajazz-ak820-config) — WebHID time + image upload
- [aar-rafi/aks075-linux](https://github.com/aar-rafi/aks075-linux) — sibling AKS075 protocol

## License

MIT.
