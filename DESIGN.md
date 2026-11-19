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
  toast-error: "#4a1210"
  toast-ok-icon: "#6fdc9b"
  toast-error-icon: "#ff8a80"
typography:
  headline:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
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
  xl: "26px"
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
    height: "32px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "18px 20px"
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
    rounded: "{rounded.md}"
    padding: "12px"
  tile-selected:
    backgroundColor: "{colors.mustard-2}"
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
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.md}"
    padding: "12px 12px 12px 14px"
  toast-error:
    backgroundColor: "{colors.toast-error}"
---

# Design System: AK820 Web Driver

## Overview

**Creative North Star: "The Board Is the Interface"**

The AK820 itself carries the screen. Its own colorway (black case, light-ash alphas, dark-ash modifiers, mustard Esc, Enter and Space) is drawn large and central, and the rest of the app is a quiet light-ash workroom around it: white panels on an ash ground, ink type, one stroke of Lucide line icons. The interface borrows its only accent from the yellow keycaps, and spends it where the keycaps would: on what is selected and on the one action that sends changes to the keyboard.

Density is that of a settings tool, not a dashboard: a 248px sidebar, a stage with the board and its status row, then effect tiles and a controls panel. The developer surfaces (capture log, wire-format inspector, settings, calibration and mode-name dialogs) speak the same language at a denser grain: soft-ash tables with sticky headers and mono cells, list rows, setting rows, and native modal dialogs. Depth is soft and ambient; the only dramatic shadow belongs to the physical board. Motion is purposeful: the board's legends and underglow take the current lighting colour and cross-fade when it changes, and the board lights up once when you connect or explore. The system refuses the dark gamer dashboard and the wall of flat tabs.

**Key Characteristics:**
- The rendered keyboard is the hero on every lighting and key surface.
- Ash neutrals, ink text, mustard as the single accent; green and red appear only as status washes.
- System UI face; mono only for hex, packets, capture data and shortcuts.
- Lucide line icons at one stroke weight (1.9).
- Soft, keycap-like radii stepping from 4px chips to 16px panels; soft ambient shadows.
- Explicit Apply: changes are staged, the status row says so, mustard sends them.

## Colors

A cool-warm ash neutral family with one saturated voice, mustard, taken from the keyboard's accent caps; status hues appear only as pale washes with dark ink.

### Primary
- **Keycap Mustard** (mustard): primary action fill (Apply, Connect, Save), toggle on-state, meter fill, marked-key ring, the accent caps on the board. Lightens to **Mustard Glow** (mustard-hover) on hover and is edged by **Mustard Edge** (mustard-edge) on buttons.
- **Mustard Wash** (mustard-2): selection background for the active nav item, selected effect tile, demo pill, icon-button hover, input focus halo and text selection. Its rings: **Tile Ring** (mustard-ring) around a selected tile, **Soft Mustard Edge** (mustard-edge-soft) around the demo pill.
- **Mustard Ink** (mustard-ink): icon and text colour on mustard-wash surfaces, and the outbound direction marker in packet tables.

### Neutral
- **Ink** (ink): body text, headings, focus outline, toast background, step-number discs.
- **Graphite** (ink-2): secondary text, inactive nav, field labels, table headers, idle icons.
- **Pewter** (ink-3): tertiary text, group labels, hints; 4.5:1 or better on ground.
- **Ash Ground** (ground): the page.
- **Paper White** (surface): panels, sidebar, dialogs, inputs, outline buttons.
- **Soft Ash** (surface-2): tiles, list rows and device card at rest, table headers and row hover, dialog action bar, ghost-button hover.
- **Hairline** (line) and **Firm Line** (line-2): container and table borders; input, outline-button and dashed empty-state borders.
- **Recess** (track): segmented-control track, meter track, unknown status cell. **Switch Off** (toggle-off): toggle track when off.

### The Board's Own Palette
- **Case Black** (case, gradient from case-top): keyboard case.
- **Light Ash Cap** (cap-alpha, gradient from cap-alpha-top): alpha keys; legends in **Legend Graphite** (legend) mixed toward the light colour.
- **Dark Ash Cap** (cap-mod): modifiers, navigation cluster, F5 to F8; legends white mixed toward the light, **Mod Legend** (legend-mod-dim) when the board is dimmed.
- **Accent Cap** (gradient cap-accent-top to mustard): Esc, Enter, Space; legends in **Accent Legend** (legend-accent), never tinted.
- **Knob** (knob, rim knob-rim): the rotary knob.

### Status
- **Signal Green** (ok): connection dot and its halo, saved state, inbound direction marker. Its wash pair, **Green Wash** (ok-wash) with **Green Edge** (ok-edge) and **Green Ink** (ok-ink), fills the Connected pill and "yes" status cells.
- **Signal Red** (danger-ink on danger-wash, edged danger-edge, deepening to danger-wash-hover): danger buttons, danger icon-button hover, error notices, "no" status cells.
- **Amber Pending** (warn): the pulsing "Not sent yet" dot and text.
- **Toast tones**: success icon (toast-ok-icon) on Ink; errors switch the toast to **Oxblood** (toast-error) with a coral icon (toast-error-icon).

### Named Rules
**The Keycap Rule.** Mustard is used the way the yellow caps are: on the selected thing and the one primary action. A screen or dialog carries one mustard-filled button.

**The Board Owns Its Colours Rule.** Case, cap, legend and knob colours live on the keyboard render only; UI chrome never borrows Case Black as a surface.

**The Wash Rule.** Status colour never fills at full strength in chrome: green and red appear as a pale wash with a darker edge and dark ink; full-strength green is reserved for dots and direction markers.

## Typography

**Body Font:** Segoe UI Variable Text (with Segoe UI, system-ui, -apple-system, sans-serif)
**Label/Mono Font:** Cascadia Mono (with Consolas, ui-monospace), tabular numerals

**Character:** The operating system's own face, so the tool reads like a native utility and the keyboard stays the visual event.

### Hierarchy
- **Headline** (700, 28px, 1.15, -0.02em, balanced wrap): page headline on the connect screen.
- **Title** (650, 15px): panel and dialog headings, paired with a 16px icon.
- **Body** (400, 14px, 1.45): everything else; buttons, tiles and active nav at 600.
- **Body small** (13px): secondary lines in list and setting rows, table body, small buttons, the apply state.
- **Label** (600, 12px): field labels, pills, table headers and section labels (650), tile mode numbers (tabular).
- **Label small** (600, 11px): `kbd` hints, RGB channel letters, and the sidebar group label (uppercase, 0.06em tracking).
- **Mono** (12px, tabular): hex values, packet tables, `code`, `kbd`.
- **Key legends** (600, 1.25cqi of board width): scale with the board via container units.

### Named Rules
**The Native Face Rule.** No display face. Hierarchy comes from weight (400 / 600 / 650) and size, not from a second family.

## Layout

A two-column app grid: 248px sticky sidebar, fluid main (padding 22px 26px, page max-width 1240px, 18px gaps between blocks). The lighting page stacks a stage (status row of pills, pending line and Apply above the board; board with a 248px profiles column beside it) over a two-column split of effect tiles (auto-fill, 124px min) and a 340px controls panel. Not connected, the main column becomes a centred 820px connect guide over the same shell.

Developer pages stack inside a single panel: a wrapping toolbar row of segmented filter and buttons (end-aligned actions), scrolling tables capped at 420px (180px inside dialogs), and section breaks drawn as a hairline with 18px above. Settings run as full-width rows, text left (max 68ch) and control right, separated by hairlines and grouped under section labels. Dialogs are 480px (680px wide variant), with a head, a scrolling body at 16px gaps, and an action bar.

Responsive: at 1180px the stage, lighting and split layouts collapse to one column. At 760px the sidebar becomes a top bar (device card full width, nav scrolls horizontally, brand and group labels hidden), the Apply bar wraps with a full-width button, setting rows stack, list-row actions drop below, and main padding drops to 16px. Spacing rhythm runs 6 / 8 / 10 / 14 / 18px.

## Elevation & Depth

A hybrid: flat ash and white tonal layering with one soft ambient shadow for panels, a single deeper lift for modal dialogs, and a dramatic shadow reserved for the physical keyboard.

### Shadow Vocabulary
- **Panel** (`0 1px 2px rgba(24,25,27,.06), 0 8px 24px -12px rgba(24,25,27,.18)`): panels at rest, tiles on hover.
- **Dialog** (`0 30px 60px -20px rgba(24,25,27,.45)`, over a 40% ink backdrop with 2px blur): modal dialogs only.
- **Board** (`0 1px 0 rgba(255,255,255,.06) inset, 0 22px 40px -22px rgba(24,25,27,.55), 0 2px 6px rgba(24,25,27,.2)`): the keyboard render only.
- **Underglow** (per cap, colour-mixed from the current lighting colour): the light the board emits; scales with brightness.
- **Primary press** (`inset 0 -2px 0 rgba(0,0,0,.12)`, plus a mustard bloom on hover): the mustard button's keycap-like bottom edge.
- **Segment chip** (`0 1px 2px rgba(0,0,0,.1), 0 0 0 1px` hairline): the raised selected segment.
- **Toast** (`0 14px 34px -14px rgba(0,0,0,.55)`).

### Named Rules
**The One Object Rule.** Only the keyboard casts a deep shadow on the page. UI surfaces stay at the panel shadow or flat; a modal dialog lifts above a dimmed backdrop, never alongside the board's shadow on the same plane.

## Shapes

Soft, keycap-like rounding that grows with the object: 4px for inline code and colour dots, 5 to 7px for `kbd`, list colour chips, status cells and swatches, 8px for icon buttons and segments, 9px for inputs and nav items, 10px for buttons, segmented tracks and notices, 12px for tiles, list rows, table frames, device card and toasts, 16px for panels and dialogs, fully round for pills, toggles, meters and the pill segmented control. Borders are 1px hairlines; empty states use a dashed firm line; selected states add a 1px or 2px ring rather than a heavier border. The board scales its radii with its width (case 2.2cqi, caps 0.9cqi).

## Components

### Buttons
- **Shape:** gently rounded (10px), 38px tall; small 32px with 13px type; large 44px with 15px type.
- **Primary:** Keycap Mustard fill, ink text, mustard-edge border, inset bottom edge like a keycap; carries a `kbd` shortcut hint when it has one (Ctrl Enter).
- **Hover / Active:** Mustard Glow with a soft mustard bloom; press scales to 0.98; disabled at 50%.
- **Outline:** Paper White with firm-line border, border darkens to Pewter on hover.
- **Ghost:** transparent, Graphite text, Soft Ash on hover.
- **Danger:** red wash with red edge and dark red text, deepening on hover; for clear, delete and reset.
- **Icon button:** 32px square, 8px radius, Mustard Wash on hover (red wash for the danger variant), scales to 0.94 on press.

### Chips (Pills, direction and status cells)
- **Pills:** 12px / 600 label, fully round, Paper White with hairline border; Connected (green wash) and Demo (mustard wash) report state above the board; not interactive.
- **Direction markers:** 600 text with a 13px arrow icon; inbound Signal Green, outbound Mustard Ink.
- **Status cells:** 24px squares at 6px radius holding a 14px icon: yes in green wash, no in red wash, unknown on Recess.

### Cards / Containers
- **Panel:** 16px radius, Paper White, hairline border, panel shadow, 18px 20px padding, 15px / 650 title with icon.
- **Effect tile:** 12px radius, Soft Ash with hairline border; on hover lifts 2px, turns white and gains the panel shadow while its icon tilts (-6deg, 1.12); selected turns Mustard Wash with a mustard ring and the icon pops once. Content: Lucide icon (22px), mode name (600), mode number (12px tabular).
- **List row:** 12px radius Soft Ash row: 18px colour chip, name over a 13px Graphite meta line, then actions (small outline Load, danger icon button). Hover turns white with a firm line.
- **Empty state:** dashed firm-line box, 12px radius, centred Graphite text.

### Tables
- **Frame:** hairline border, 12px radius, scrolls inside a capped height.
- **Header:** sticky, Soft Ash, 12px / 650 Graphite labels.
- **Rows:** 13px cells (12px tabular mono in packet tables), hairline separators, Soft Ash on hover; hex columns in Graphite.

### Inputs / Fields
- **Style:** 36px tall, 9px radius, firm-line border, Paper White, tabular numerals; hex input is uppercase 600; text areas grow vertically.
- **Focus:** border goes to Ink with a 3px Mustard Wash halo.
- **Segmented control:** recessed track, 3px padding; the selected segment is a white raised chip. Pill variant fully round; the tri-state variant pairs each answer with an icon.
- **Toggle:** 38 by 22px track, mustard when on, white knob slides 16px.
- **Swatches:** 26px (48px large) rounded squares with an inset hairline; selected gets a white gap and Ink ring.
- **Setting row:** text (label over 13px Graphite help) left, control right, hairline below.

### Navigation
- **Style:** sidebar of 14px / 500 items with a 16px Lucide icon, 9px radius, Graphite text.
- **States:** hover Soft Ash; active Mustard Wash, Ink text at 600, Mustard Ink icon; disabled 45% opacity.
- **Groups:** an "Advanced" group label separates developer tools.
- **Device card:** product photo, name, status dot (green halo when connected) and a connect / disconnect icon button.
- **Mobile:** collapses to a horizontal scrolling row under the device card.

### Dialog
A native modal dialog: Escape and backdrop click close it, focus is trapped by the browser. 16px radius Paper White with hairline border and the dialog shadow; a title row with a close icon button; a scrolling body; an action bar on Soft Ash with a hairline above, actions right-aligned (one primary). Enters by rising 10px from 0.98 scale over 0.35s.

### Toast
Ink panel with 12px corners bottom-right, ground-coloured text, coloured leading icon (green or coral), rises 12px in on entry; errors switch to Oxblood.

### The Board (signature)
The AK820 render: black case gradient, light-ash alphas, dark-ash modifiers, mustard Esc / Enter / Space, a grey knob. Legends are tinted by the current lighting colour while staying legible on every cap; underglow below each cap takes the lighting colour (or a per-key LED colour) and cross-fades over 0.5s on change. Effect previews: breath (pulse), wave (staggered by key x position), rainbow (hue cycle). The board lights up once on connect or explore (1.2s). Clickable caps lift on hover; marked caps get a mustard ring, the selected cap a white ring. All motion collapses under reduced-motion.

## Do's and Don'ts

### Do:
- **Do** keep the keyboard render visible and central on lighting and key surfaces.
- **Do** spend mustard only on selection and the single primary action (The Keycap Rule).
- **Do** stage changes and state them ("Not sent yet") until the user presses Apply; keep Apply in the status row above the board.
- **Do** use Lucide line icons at the shared 1.9 stroke, 16px in chrome, 22px on tiles, 12 to 14px inside pills, markers and status cells.
- **Do** show status as a pale wash with dark ink (The Wash Rule).
- **Do** use the native dialog for modal tasks, with one primary action in its action bar.
- **Do** ease every state change with `cubic-bezier(.16, 1, .3, 1)` and honour reduced-motion.
- **Do** use mono only for hex, packets and shortcuts.

### Don't:
- **Don't** turn the app into a dark gamer dashboard or a wall of flat tabs.
- **Don't** add a second accent hue; status colours report state and are never decoration.
- **Don't** give UI surfaces the board's deep shadow or Case Black fill.
- **Don't** apply lighting changes live; Apply is explicit.
