---
name: AK820 Web Driver
description: The AJAZZ AK820 drawn in its own colorway, as the interface for its lighting, keys and profiles.
colors:
  ink: "#18191b"
  ink-2: "#5b5e63"
  ink-3: "#6b6e73"
  ground: "#f2f2f0"
  surface: "#ffffff"
  surface-2: "#f7f7f5"
  line: "#e2e2de"
  line-2: "#d1d1cc"
  track: "#ececea"
  toggle-off: "#d6d6d2"
  mustard: "#e3b419"
  mustard-hover: "#ecc232"
  mustard-edge: "#c99d0f"
  mustard-ring: "#d9b440"
  mustard-edge-soft: "#ecd68a"
  mustard-2: "#f8e9b4"
  mustard-ink: "#7a5b00"
  case: "#1c1d1f"
  case-top: "#26272a"
  cap-alpha: "#d4d6d7"
  cap-alpha-top: "#e0e2e3"
  cap-mod: "#5c5f63"
  cap-accent-top: "#efc23a"
  legend: "#2b2d31"
  legend-accent: "#2a2205"
  legend-mod-dim: "#e9eaeb"
  knob: "#8d9094"
  knob-rim: "#6f7276"
  ok: "#1f8a4c"
  ok-wash: "#e4f4ea"
  ok-edge: "#c4e6d1"
  ok-ink: "#146b39"
  danger-wash: "#fbe9e8"
  danger-wash-hover: "#f8dcda"
  danger-edge: "#f0c3c0"
  danger-ink: "#8f1f1b"
  warn: "#a35a06"
typography:
  headline:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  brand:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.45
  body:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
  label-sm:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.45
  mono:
    fontFamily: "Cascadia Mono, Consolas, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  xs: "4px"
  chip: "6px"
  swatch: "7px"
  sm: "8px"
  field: "9px"
  control: "10px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.mustard-hover}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "38px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "38px"
  button-danger:
    backgroundColor: "{colors.danger-wash}"
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "38px"
  button-danger-hover:
    backgroundColor: "{colors.danger-wash-hover}"
  button-sm:
    typography: "{typography.body-sm}"
    padding: "0 12px"
    height: "32px"
  button-lg:
    padding: "0 22px"
    height: "44px"
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    size: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 10px"
    height: "36px"
  segmented:
    backgroundColor: "{colors.track}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "3px"
  segmented-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "30px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    width: "min(480px, calc(100vw - 32px))"
  dialog-actions:
    backgroundColor: "{colors.surface-2}"
    padding: "14px 20px"
  tile:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.field}"
    padding: "0 10px"
    height: "40px"
  tile-selected:
    backgroundColor: "{colors.mustard-2}"
  profile-chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "0 12px 0 8px"
    height: "30px"
  profile-chip-add:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 12px 0 10px"
    height: "30px"
  picker-trigger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.control}"
    padding: "0 10px 0 6px"
    height: "40px"
  picker-popover:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px"
    width: "272px"
  color-dot:
    rounded: "{rounded.pill}"
    size: "24px"
  color-dot-sm:
    rounded: "{rounded.pill}"
    size: "20px"
  list-row:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  table-header:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "8px 10px"
  table-cell:
    typography: "{typography.body-sm}"
    padding: "6px 10px"
  status-cell-yes:
    backgroundColor: "{colors.ok-wash}"
    textColor: "{colors.ok-ink}"
    rounded: "{rounded.chip}"
    size: "24px"
  status-cell-no:
    backgroundColor: "{colors.danger-wash}"
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.chip}"
    size: "24px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.field}"
    padding: "9px 10px"
  nav-item-active:
    backgroundColor: "{colors.mustard-2}"
    textColor: "{colors.ink}"
  pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
    typography: "{typography.label}"
  pill-ok:
    backgroundColor: "{colors.ok-wash}"
    textColor: "{colors.ok-ink}"
  pill-demo:
    backgroundColor: "{colors.mustard-2}"
    textColor: "{colors.mustard-ink}"
  notice-error:
    backgroundColor: "{colors.danger-wash}"
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  toast:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 10px 14px 14px"
    width: "min(380px, calc(100vw - 36px))"
---

# Design System: AK820 Web Driver

## Overview

**Creative North Star: "The Board Is the Interface"**

The AK820 itself carries the screen. Its own colorway (black case, light-ash alphas, dark-ash modifiers, mustard Esc, Enter and Space) is drawn large and central, and the rest of the app is a quiet light-ash workroom around it: white panels on an ash ground, ink type, one stroke of Lucide line icons. The interface borrows its only accent from the yellow keycaps, and spends it where the keycaps would: on what is selected and on the one action that sends changes to the keyboard.

Density is that of a settings tool, not a dashboard, and the main pages fit one window: a 248px sidebar, a stage with the board and its status row, then compact one-line effect tiles with a row of profile chips beneath them, beside a 320px controls panel. Nothing on Lighting or Profiles scrolls the page at 1440 by 900 or 1366 by 768; the board shrinks with the viewport height instead. Settings and dialogs speak the same language at a denser grain: setting rows and native modal dialogs. Depth is soft and ambient; the only dramatic shadow belongs to the physical board. Motion is purposeful: the board's legends and underglow take the current lighting colour and cross-fade when it changes, and the board lights up once when you connect or explore. The system refuses the dark gamer dashboard and the wall of flat tabs.

**Key Characteristics:**
- The rendered keyboard is the hero on every lighting and key surface.
- Ash neutrals, ink text, mustard as the single accent; green and red appear only as status washes.
- System UI face; mono only for hex, packets, capture data, mode numbers and shortcuts.
- Lucide line icons at one stroke weight (1.9).
- Soft, keycap-like radii stepping from 4px chips to 16px panels; soft ambient shadows.
- Explicit Apply: changes are staged, the status row says so, mustard sends them.
- One window: Lighting and Profiles fit the viewport without page scroll.

## Colors

A cool-warm ash neutral family with one saturated voice, mustard, taken from the keyboard's accent caps; status hues appear only as pale washes with dark ink.

### Primary
- **Keycap Mustard** (mustard): primary action fill (Apply, Connect, Save), toggle on-state, meter fill, the toast's countdown bar, marked-key ring, the accent caps on the board. Lightens to **Mustard Glow** (mustard-hover) on hover and is edged by **Mustard Edge** (mustard-edge) on buttons.
- **Mustard Wash** (mustard-2): selection background for the active nav item, selected effect tile, demo pill, icon-button hover, the focus halo on inputs and the open colour-picker trigger, and text selection. Its rings: **Tile Ring** (mustard-ring) around a selected tile, **Soft Mustard Edge** (mustard-edge-soft) around the demo pill.
- **Mustard Ink** (mustard-ink): icon and mode-number colour on mustard-wash surfaces, and the outbound direction marker in packet tables.

### Neutral
- **Ink** (ink): body text, headings, focus outline, the selected-swatch and colour-dot ring, step-number discs.
- **Graphite** (ink-2): secondary text, inactive nav, field and chip-row labels, table headers, idle icons, toast detail line.
- **Pewter** (ink-3): tertiary text, group labels, hints, tile mode numbers, the toast close icon; 4.5:1 or better on ground.
- **Ash Ground** (ground): the page.
- **Paper White** (surface): panels, sidebar, dialogs, colour popover, toasts, inputs, outline buttons.
- **Soft Ash** (surface-2): tiles, profile chips, list rows and device card at rest, table headers and row hover, dialog action bar, ghost-button hover.
- **Hairline** (line) and **Firm Line** (line-2): container and table borders; input, outline-button, picker-trigger and dashed add-chip and empty-state borders.
- **Recess** (track): segmented-control track, meter track, unknown status cell. **Switch Off** (toggle-off): toggle track when off.

### The Board's Own Palette
- **Case Black** (case, gradient from case-top): keyboard case.
- **Light Ash Cap** (cap-alpha, gradient from cap-alpha-top): alpha keys; legends in **Legend Graphite** (legend) mixed toward the light colour.
- **Dark Ash Cap** (cap-mod): modifiers, navigation cluster, F5 to F8; legends white mixed toward the light, **Mod Legend** (legend-mod-dim) when the board is dimmed.
- **Accent Cap** (gradient cap-accent-top to mustard): Esc, Enter, Space; legends in **Accent Legend** (legend-accent), never tinted.
- **Knob** (knob, rim knob-rim): the rotary knob.

### The Colour Instruments
The colour picker shows the colour space itself, so its surfaces are spectrum, not palette: the saturation and brightness area is the current hue under a white-to-transparent (left to right) and black-to-transparent (bottom to top) overlay; the hue slider track runs red, yellow, lime, cyan, blue, magenta, red; the custom swatch on Per-key RGB uses the same spectrum as a conic gradient. Swatches, colour dots and profile-chip dots carry the user's colour inside a 1px inset edge of black at 14 to 15% so white and pale colours stay visible on white. These surfaces never appear in chrome.

### Status
- **Signal Green** (ok): connection dot and its 15% halo, the "Keyboard matches" dot, the success toast icon, inbound direction marker. Its wash pair, **Green Wash** (ok-wash) with **Green Edge** (ok-edge) and **Green Ink** (ok-ink), fills the Connected pill and "yes" status cells.
- **Signal Red** (danger-ink on danger-wash, edged danger-edge, deepening to danger-wash-hover): danger buttons, danger icon-button hover, error notices, "no" status cells, and the error toast's icon and border.
- **Amber Pending** (warn): the pulsing "Not sent yet" dot and text.

### Named Rules
**The Keycap Rule.** Mustard is used the way the yellow caps are: on the selected thing and the one primary action. A screen or dialog carries one mustard-filled button; a destructive confirmation carries none.

**The Board Owns Its Colours Rule.** Case, cap, legend and knob colours live on the keyboard render only; UI chrome never borrows Case Black as a surface.

**The Wash Rule.** Status colour never fills at full strength in chrome: green and red appear as a pale wash with a darker edge and dark ink; full-strength green is reserved for dots, icons and direction markers.

## Typography

**Body Font:** Segoe UI Variable Text (with Segoe UI, system-ui, -apple-system, sans-serif)
**Label/Mono Font:** Cascadia Mono (with Consolas, ui-monospace), tabular numerals

**Character:** The operating system's own face, so the tool reads like a native utility and the keyboard stays the visual event.

### Hierarchy
- **Headline** (700, 28px, 1.15, -0.02em, balanced wrap): page headline on the connect screen.
- **Brand** (700, 16px, -0.01em): the app name in the sidebar, over a 12px Graphite subline.
- **Title** (650, 15px): panel and dialog headings, paired with a 16px icon. Toast titles take 650 at body size.
- **Body** (400, 14px, 1.45): everything else; buttons and active nav at 600.
- **Body small** (13px): effect tiles (names at 600), profile chips (500), the picker trigger, secondary lines in list and setting rows, table body, small buttons, the apply state, toast detail.
- **Label** (600, 12px): field labels, the chip-row label, pills, table headers and section labels (650).
- **Label small** (600, 11px): `kbd` hints, picker field labels (Hex, R, G, B), and the sidebar group label (uppercase, 0.06em tracking).
- **Mono** (12px, tabular): hex values, the picker's hex and RGB readout, packet tables, `code`, `kbd`; 11px for tile mode numbers (two digits, "06").
- **Key legends** (600, 1.25cqi of board width): scale with the board via container units.

### Named Rules
**The Native Face Rule.** No display face. Hierarchy comes from weight (400 / 500 / 600 / 650 / 700) and size, not from a second family.

## Layout

A two-column app grid: 248px sticky sidebar, fluid main (padding 16px 20px, page max-width 1320px, 14px gaps between blocks). Not connected, the main column becomes a centred 820px connect guide over the same shell.

**One window.** Lighting and Profiles are fit pages: the page fills the viewport height (100vh less main padding) as two rows, the board row and a work row that takes the rest. The board's width is capped by the height left over, `max(520px, calc((100vh - 426px) * 2.436))` (2.436 is the board's 492:202 aspect), and centred, so the board shrinks before anything scrolls; 520px is the floor. Per-key RGB and Keys & macro use the same board cap without the fill. On Lighting the work row is the effect panel (tiles, then a footer pinned to its bottom by a hairline: profile chips on the left, the pending line and Apply on the right) beside a 320px controls panel with label-left rows; side-by-side cards stretch to one height, and the tile grid scrolls inside its panel if it ever runs out of room. The status row above the board carries only the pills.

Developer pages stack inside a single panel and may scroll: a wrapping toolbar row of segmented filter and buttons (end-aligned actions), scrolling tables capped at 420px (180px inside dialogs), and section breaks drawn as a hairline with 18px above. Settings run as full-width rows, text left (max 68ch) and control right, separated by hairlines and grouped under section labels. Dialogs are 480px (680px wide variant), with a head, a scrolling body at 16px gaps, and an action bar.

Responsive: at 1180px the lighting and split layouts collapse to one column and fit pages stop filling the height. At 760px the sidebar becomes a top bar (device card full width, nav scrolls horizontally, brand and group labels hidden), the Apply bar wraps with a full-width button, setting rows stack, list-row actions drop below, and main padding becomes 16px all round. Spacing rhythm runs 6 / 8 / 10 / 14 / 18 / 20px; panels pad 14px 16px.

### Named Rules
**The One Window Rule.** On desktop sizes (1366 by 768 and up) Lighting and Profiles never scroll the page. When space runs short, the board shrinks and lists scroll inside their panels.

## Elevation & Depth

A hybrid: flat ash and white tonal layering with one soft ambient shadow for panels, a moderate lift for floating layers (colour popover, toast) and modal dialogs, and a dramatic shadow reserved for the physical keyboard.

### Shadow Vocabulary
- **Panel** (`0 1px 2px rgba(24,25,27,.06), 0 8px 24px -12px rgba(24,25,27,.18)`): panels at rest.
- **Tile hover** (`0 2px 6px -3px rgba(24,25,27,.25)`): a compact tile lifting under the pointer.
- **Popover** (`0 18px 40px -16px rgba(24,25,27,.45)`): the colour popover.
- **Toast** (`0 18px 40px -18px rgba(24,25,27,.5)`).
- **Dialog** (`0 30px 60px -20px rgba(24,25,27,.45)`, over a 40% ink backdrop with 2px blur): modal dialogs only.
- **Board** (`0 1px 0 rgba(255,255,255,.06) inset, 0 22px 40px -22px rgba(24,25,27,.55), 0 2px 6px rgba(24,25,27,.2)`): the keyboard render only.
- **Underglow** (per cap, colour-mixed from the current lighting colour): the light the board emits; scales with brightness.
- **Primary press** (`inset 0 -2px 0 rgba(0,0,0,.12)`, plus a mustard bloom on hover): the mustard button's keycap-like bottom edge.
- **Segment chip** (`0 1px 2px rgba(0,0,0,.1), 0 0 0 1px` hairline): the raised selected segment.
- **Picker thumb** (`0 0 0 1px rgba(0,0,0,.3), 0 2px 6px rgba(0,0,0,.35)` under a 2px white border): the draggable thumb, legible on any colour.
- **Selected ring** (`0 0 0 2px` Paper White, then `0 0 0 4px` Ink): selected swatch and checked colour dot.

### Named Rules
**The One Object Rule.** Only the keyboard casts a deep shadow on the page. UI surfaces stay at the panel shadow or flat; floating layers and modal dialogs lift above the page, never alongside the board's shadow on the same plane.

## Shapes

Soft, keycap-like rounding that grows with the object: 4px for inline code, 5 to 7px for `kbd`, list colour chips, status cells and swatches (7px for the picker trigger's 28px swatch and the 26px per-key swatches), 8px for icon buttons, segments and the picker's colour area, 9px for inputs, nav items and effect tiles, 10px for buttons, segmented tracks, the picker trigger and notices, 12px for list rows, table frames, device card, the colour popover and toasts, 16px for panels and dialogs, fully round for pills, profile chips, colour dots, toggles, meters, the hue slider and the pill segmented control. Borders are 1px hairlines; empty states and the add chip use a dashed line; selected states add a 1px or 2px ring rather than a heavier border. The board scales its radii with its width (case 2.2cqi, caps 0.9cqi, knob mark 1cqi).

## Components

### Buttons
- **Shape:** gently rounded (10px), 38px tall; small 32px with 13px type; large 44px with 15px type.
- **Primary:** Keycap Mustard fill, ink text, mustard-edge border, inset bottom edge like a keycap; carries a `kbd` shortcut hint when it has one (Ctrl Enter).
- **Hover / Active:** Mustard Glow with a soft mustard bloom; press scales to 0.98; disabled at 50%.
- **Outline:** Paper White with firm-line border, border darkens to Pewter on hover.
- **Ghost:** transparent, Graphite text, Soft Ash on hover.
- **Danger:** red wash with red edge and dark red text, deepening on hover; for clear, delete and reset.
- **Icon button:** 32px square, 8px radius, Mustard Wash on hover (red wash for the danger variant), scales to 0.94 on press.

### Chips (Pills, profile chips, direction and status cells)
- **Pills:** 12px / 600 label, fully round, Paper White with hairline border; Connected (green wash) and Demo (mustard wash) report state above the board; not interactive.
- **Profile chips:** 30px fully round Soft Ash buttons with a hairline border: a 14px colour dot, then the profile name (13px / 500). Hover turns white with a firm line; press scales to 0.97. They sit in a wrapping row after a 12px Graphite "Profiles" label, up to six, and load on click. The last chip, "Save current", is dashed, transparent and Graphite with a 14px icon, and leads to the Profiles page.
- **Direction markers:** 600 text with a 13px arrow icon; inbound Signal Green, outbound Mustard Ink.
- **Status cells:** 24px squares at 6px radius holding a 14px icon: yes in green wash, no in red wash, unknown on Recess.

### Cards / Containers
- **Panel:** 16px radius, Paper White, hairline border, panel shadow, 14px 16px padding, 15px / 650 title with icon and an optional 12px Graphite count at the end of the head.
- **Effect tile:** a compact one-line row, 40px tall, 9px radius, Soft Ash with hairline border, laid in an auto-fill grid of 150px-minimum columns with 6px gaps: an 18px Lucide icon, the mode name (13px / 600, truncated), the two-digit mode number in 11px mono Pewter. Solid colour (mode 06) is the first tile; the rest follow firmware order. On hover the tile turns white with a firm line and the tile-hover shadow while its icon tilts (-8deg, 1.15); press scales to 0.98; selected turns Mustard Wash with a 1px inset Tile Ring, Mustard Ink icon and number, and the icon pops once.
- **List row:** 12px radius Soft Ash row: 18px colour chip, name over a 13px Graphite meta line, then actions (small outline Load, danger icon button). Hover turns white with a firm line.
- **Empty state:** dashed firm-line box, 12px radius, centred Graphite text.

### Tables
- **Frame:** hairline border, 12px radius, scrolls inside a capped height.
- **Header:** sticky, Soft Ash, 12px / 650 Graphite labels.
- **Rows:** 13px cells (12px tabular mono in packet tables), hairline separators, Soft Ash on hover; hex columns in Graphite.

### Inputs / Fields
- **Style:** 36px tall, 9px radius, firm-line border, Paper White, tabular numerals; hex input is uppercase 600; text areas grow vertically.
- **Focus:** border goes to Ink with a 3px Mustard Wash halo.
- **Field label:** 12px / 600 Graphite, with an optional right-aligned 400 Pewter hint ("0 is fastest").
- **Segmented control:** recessed track, 3px padding, 30px segments; the selected segment is a white raised chip. Pill variant fully round; the tri-state variant pairs each answer with an icon; the direction control is icon-only (arrow right, arrow left) with the words in its label and tooltip.
- **Toggle:** 38 by 22px track, mustard when on, white knob slides 16px; may carry a 16px Graphite icon before its word.
- **Inapplicable fields:** stay in place and dim to 45% inside a disabled fieldset, with the hint saying why ("not used by solid colour").
- **Swatches:** 26px (48px large) squares at 7px with an inset edge; selected gets the selected ring.
- **Setting row:** text (label over 13px Graphite help) left, control right, hairline below.

### Colour Picker (signature)
A swatch trigger with inline presets, and a popover for exact colour.
- **Trigger:** 40px tall, 10px radius, Paper White with firm line: a 28px swatch at 7px radius, the hex in mono, and the RGB triple in 12px Graphite mono at the end. Hover darkens the border to Pewter; open, it takes the input focus treatment (Ink border, Mustard Wash halo).
- **Presets:** nine 24px colour dots spread across one row as a radio group; hover scales 1.15; the checked dot gets the selected ring and a white Lucide check (13px, stroke 3, with a soft dark drop shadow so it reads on yellow).
- **Popover:** 272px, opens upward and right-aligned above the trigger, Paper White, hairline border, 12px radius, popover shadow, 12px padding and gaps; enters by rising 4px from 0.98 over 0.22s. Escape or a click outside closes it.
- **Contents:** a 150px saturation and brightness area (8px radius, crosshair cursor) with a 16px white-bordered thumb that the arrow keys move (Shift for larger steps); a 12px fully round hue slider with a 16px white thumb; Hex, R, G and B fields (32px, 12px mono, 11px labels) in a 1.6 : 1 : 1 : 1 row; then all thirteen presets as 20px dots.

### Navigation
- **Style:** sidebar of 14px / 500 items with a 16px Lucide icon, 9px radius, Graphite text.
- **States:** hover Soft Ash; active Mustard Wash, Ink text at 600, Mustard Ink icon; disabled 45% opacity.
- **Groups:** a hairline separates Settings from the task pages.
- **Device card:** product photo, name, status dot (green halo when connected) and a connect / disconnect icon button.
- **Mobile:** collapses to a horizontal scrolling row under the device card.

### Dialog
A native modal dialog: Escape and backdrop click close it, focus is trapped by the browser. 16px radius Paper White with hairline border and the dialog shadow; a title row with a close icon button; a scrolling body; an action bar on Soft Ash with a hairline above, actions right-aligned (one primary). Enters by rising 10px from 0.98 scale over 0.35s. Confirmations are always this dialog, never the browser's: a destructive one names what it removes and that it cannot be undone, and pairs an outline keep option in plain words ("Keep my data") with a danger action ("Clear all"), no mustard.

### Toast
A white card bottom-right (18px from the edges, up to 380px wide, 12px radius, hairline border, toast shadow): a 20px status icon (Signal Green success, Signal Red error, Graphite info), a bold 650 title, an optional 13px Graphite detail line under it, and a close icon button. Messages are written as a title and a detail ("Title\nDetail"). A 3px Keycap Mustard bar along the bottom edge counts down 5s, then the toast leaves; errors take a red edge, have no bar and stay until dismissed. Enters by rising 10px from 0.98 over 0.4s.

### The Board (signature)
The AK820 render: black case gradient, light-ash alphas, dark-ash modifiers, mustard Esc / Enter / Space, a grey knob. Legends are tinted by the current lighting colour while staying legible on every cap; underglow below each cap takes the lighting colour (or a per-key LED colour) and cross-fades over 0.5s on change. Effect previews: breath (pulse), wave (staggered by key x position), rainbow (hue cycle). The board lights up once on connect or explore (1.2s). Clickable caps lift on hover; marked caps get a mustard ring, the selected cap a white ring. All motion collapses under reduced-motion.

## Do's and Don'ts

### Do:
- **Do** keep the keyboard render visible and central on lighting and key surfaces.
- **Do** spend mustard only on selection and the single primary action (The Keycap Rule).
- **Do** stage changes and state them ("Not sent yet") until the user presses Apply; keep Apply at the foot of the effect panel, right under the tiles.
- **Do** fit Lighting and Profiles in one window; shrink the board and scroll inside panels before the page ever scrolls (The One Window Rule).
- **Do** use Lucide line icons at the shared 1.9 stroke, 16px in chrome, 18px on tiles, 20px in toasts, 12 to 14px inside pills, chips, markers and status cells.
- **Do** show status as a pale wash with dark ink (The Wash Rule).
- **Do** keep inapplicable controls in place, dimmed in a disabled fieldset with a reason, rather than hiding them.
- **Do** use the native dialog for modal tasks and confirmations, with one primary action in its action bar.
- **Do** write toast messages as a short title and a detail line.
- **Do** ease every state change with `cubic-bezier(.16, 1, .3, 1)` and honour reduced-motion.
- **Do** use mono only for hex, packets, mode numbers and shortcuts.

### Don't:
- **Don't** turn the app into a dark gamer dashboard or a wall of flat tabs.
- **Don't** add a second accent hue; status colours report state and are never decoration.
- **Don't** give UI surfaces the board's deep shadow or Case Black fill.
- **Don't** apply lighting changes live; Apply is explicit.
- **Don't** use `window.confirm` or `alert`; confirm in the app's own dialog.
- **Don't** use spectrum gradients outside the colour instruments.
