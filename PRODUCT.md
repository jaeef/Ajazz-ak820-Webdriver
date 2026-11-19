# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Owners of an AJAZZ AK820 keyboard, on any OS, who want to configure it from the browser instead of the Windows-only vendor app. Mac and Linux users have no vendor app at all. The job is short, task-shaped sessions: change the lighting, paint keys, remap a key, set a macro, then close the tab.

## Product Purpose

A browser-based driver for the AK820: lighting effects, solid and per-key color, key remap, a typed-text macro, keyboard options (Windows key lock, WASD ↔ arrow swap, USB report rate), saved profiles. Success is a change that lands on the keyboard on the first try, with no install.

## Positioning

Runs entirely in the browser over WebHID: no download, no admin rights, works where the vendor app doesn't. Its protocol is reverse-engineered from the vendor app's live traffic and checked byte for byte (`scripts/check-protocol.ts`, `docs/protocol.md`), and every feature is verified on real hardware.

## Operating Context

- Chrome or Edge (WebHID); Firefox and Safari can't connect. Without a keyboard the app runs in an idle/demo mode and records packets instead of sending them.
- The user picks the keyboard in the browser's device chooser after clicking Connect.
- Settings are written to the keyboard and survive unplugging; profiles live in the browser's localStorage.

## Capabilities and Constraints

- Tabs today: Solid Color (incl. per-key paint), Effects, Keys (keyboard options, remap, macro), Profiles, Capture, Settings.
- One macro slot (typed text, a–z / 0–9 / space, up to 20 characters).
- Remap targets are standard keys only (no media/mouse/Fn yet).
- Developer tools stay but move out of the way: Capture log, wire-format hex inspector, Report ID / protocol-family settings, calibration test flow.
- Two hardware families exist under the AK820 name; the EVision (`0x320F`/`0x505B`) one is the verified target, Sonix (AK820 Pro) is best-effort.

## Brand Commitments

Independent and unofficial. Names the AK820 for compatibility only; must not imitate AJAZZ's logo, wordmark or vendor-app look, or imply endorsement.

## Evidence on Hand

- Real product photo: `public/wired-keyboard.png`.
- Protocol spec and hardware-verification notes: `docs/protocol.md`.
- No users, testimonials, download counts or press exist; don't invent any.

## Product Principles

1. Everyday controls first; protocol tools one step away, never in the way.
2. What the screen shows is what the keyboard will get: state, connection and success/failure are always explicit.
3. Works without the hardware: idle mode stays usable for exploring.
4. Honest about limits (one macro, standard-key remap, browser support) instead of hiding them.
