# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] - 2026-11-20

### Added

- Diagnostics report for bug reports: open the site with `?debug`, reproduce the problem, then
  Settings → Diagnostics → Read keyboard now → Copy report. It lists the keyboard's USB IDs, its
  info and lighting blocks, every remapped key and the packets sent and received. Read-only.
- *Report a problem* links to a GitHub issue template (Settings → About, and the diagnostics card).
- Factory-reset hint (hold Fn + Space for 5–6 seconds) on Keys & macro and in the connect help.

## [0.4.1] - 2026-11-20

### Fixed

- Chrome on phones showed the Connect screen; phones are now detected and always get the
  open-on-a-computer screen.
- The "Link copied" note on the phone screen showed one or two letters per line.
- The phone share sheet showed the old keyboard photo; it now uses the AK820 logo.
- `npm run dev` crashed with `__APP_VERSION__ is not defined` because of a stale compiled
  `vite.config.js`.

### Added

- A link-preview image, so shared links show the app name and the keyboard.
- Anonymous visit counts with Vercel Web Analytics (no cookies). Keyboard data and settings
  stay on your computer.

### Changed

- On the phone screen, the demo button sits right under the share buttons, highlighted with a
  gentle pulse (still when the system asks for reduced motion).

## [0.4.0] - 2026-11-20

### Added

- A first screen for phones and browsers without WebHID (Firefox, Safari): what the app
  does, plus Send link to my computer, Copy link and a demo, instead of a dead Connect button.
- Version number with a What's new link in the sidebar and in Settings.
- Page links (`#perkey`, `#keys`, `#profiles`, `#settings`); a refresh keeps you on the same page.
- C / W / OS indicator LEDs on the board: C follows Caps Lock, W follows the Windows-key lock.
- A crash screen with Reload and Clear saved data, instead of a blank page.
- AK820 icon as the favicon and sidebar image.
- Reverse-engineering findings in `docs/`.

### Changed

- The board on Keys & macro is the same size as on every other page.
- Cards on Keys & macro, Profiles and Settings size to their content instead of
  stretching to the bottom of the window; Settings lines up with the other pages.
- Larger, sharper keyboard image in the sidebar.
- Phone layout: no disabled navigation before connecting, and the status bar fits one line.
- Speed reads 1 (slow) to 5 (fast).
- Keyboard writes run one at a time, and USB errors are explained in plain words.
- Keys & macro panel is more compact.

### Security

- Devices without the AK820 lighting interface are refused before anything is sent, and the
  device list shows only AK820 families by default.
- Profile import is limited to 512 KB and 200 profiles; saved data is validated on load.
- Content-Security-Policy and a stricter Permissions-Policy on Vercel.

### Removed

- `DESIGN.md`.

## [0.3.0] - 2026-11-19

### Added

- On-screen AK820 that presses along with your typing, with optional switch sound.
- Reconnect to the keyboard this browser remembers, and detect when it is unplugged.
- Vercel deploy config with security headers, including `Permissions-Policy: hid=(self)`.

### Changed

- Board redrawn as the AK820 itself: case bevels, recessed switch plate, OEM keycaps
  with dual legends, rotary knob and status LEDs.
- Compact one-screen layout; Apply sits under the effect tiles.
- Profiles and Settings rebuilt on the new design.
- Colour picker moved into a popover.

### Removed

- Developer tools (calibration, capture, wire-format inspector, mode editor) from the
  shipped build.
- Build output and local capture data are no longer tracked in git.

## [0.2.0] - 2026-11-19

### Added

- Key remap: point any key at any standard key, or disable it.
- Typed-text macro assignment, up to 20 characters.
- Keyboard options: Windows-key lock, WASD ↔ arrow swap, USB report rate
  (1000, 500, 250 or 125 Hz).
- Read-modify-write for the lighting block, so unknown bytes are preserved.

### Changed

- Protocol replaced with the vendor-verified AK820 framing; packets checked byte for
  byte against captures.

## [0.1.0] - 2026-07-20

### Added

- WebHID driver for the AK820: connect from Chrome or Edge with no install.
- Lighting effects with colour, brightness, speed and direction.
- Profiles stored in the browser.

### Fixed

- Lighting packet layout corrected against the official driver's disassembly.

Earlier work (June 2026) established the initial driver and UI.
