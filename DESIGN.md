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
  mustard: "#e3b419"
  mustard-2: "#f8e9b4"
  mustard-ink: "#7a5b00"
  mustard-edge: "#c99d0f"
  case: "#1c1d1f"
  cap-alpha: "#d4d6d7"
  cap-mod: "#5c5f63"
  ok: "#1f8a4c"
  bad: "#c62f2a"
  warn: "#a35a06"
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
  label:
    fontFamily: "Segoe UI Variable Text, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
  mono:
    fontFamily: "Cascadia Mono, Consolas, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  sm: "8px"
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
    rounded: "10px"
    padding: "0 16px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "#ecc232"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "10px"
    padding: "0 16px"
    height: "38px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "10px"
    padding: "0 16px"
    height: "38px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "9px"
    padding: "0 10px"
    height: "36px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "18px 20px"
  tile:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
  tile-selected:
    backgroundColor: "{colors.mustard-2}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "9px"
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
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.md}"
    padding: "12px 12px 12px 14px"
---

# Design System: AK820 Web Driver

## Overview

**Creative North Star: "The Board Is the Interface"**

The AK820 itself carries the screen. Its own colorway (black case, light-ash alphas, dark-ash modifiers, mustard Esc, Enter and Space) is drawn large and central, and the rest of the app is a quiet light-ash workroom around it: white panels on an ash ground, ink type, one stroke of Lucide line icons. The interface borrows its only accent from the yellow keycaps, and spends it where the keycaps would: on what is selected and on the one action that sends changes to the keyboard.

Density is that of a settings tool, not a dashboard: a 248px sidebar, a stage with the board and its status row, then effect tiles and a controls panel. Depth is soft and ambient; the only dramatic shadow belongs to the physical board. Motion is purposeful: the board's legends and underglow take the current lighting colour and cross-fade when it changes, and the board lights up once when you connect or explore. The system refuses the dark gamer dashboard and the wall of flat tabs.

**Key Characteristics:**
- The rendered keyboard is the hero on every lighting and key surface.
- Ash neutrals, ink text, mustard as the single accent.
- System UI face; mono only for hex and capture data.
- Lucide line icons at one stroke weight (1.9).
- Soft radii (8 / 12 / 16px), soft ambient shadows.
- Explicit Apply: changes are staged, the status row says so, mustard sends them.

## Colors

A cool-warm ash neutral family with one saturated voice, mustard, taken from the keyboard's accent caps.

### Primary
- **Keycap Mustard** (mustard): primary action fill (Apply, Connect), toggle on-state, meter fill, range thumb, marked-key ring, the accent caps on the board. Edged by **Mustard Edge** (mustard-edge) on buttons.
- **Mustard Wash** (mustard-2): selection background for the active nav item, selected effect tile, demo pill, icon-button hover, input focus halo and text selection.
- **Mustard Ink** (mustard-ink): icon and text colour on mustard-wash surfaces (active nav icon, selected tile icon, demo pill text).

### Neutral
- **Ink** (ink): body text, headings, focus outline, toast background, step-number discs.
- **Graphite** (ink-2): secondary text, inactive nav, field labels, idle icons.
- **Pewter** (ink-3): tertiary text, group labels, hints; verified at 4.5:1 or better on ground.
- **Ash Ground** (ground): the page.
- **Paper White** (surface): panels, sidebar, inputs, outline buttons.
- **Soft Ash** (surface-2): tiles at rest, device card, quick-list rows, ghost-button hover.
- **Hairline** (line) and **Firm Line** (line-2): panel and tile borders; input and outline-button borders.

### The Board's Own Palette
- **Case Black** (case): keyboard case (gradient from #26272a).
- **Light Ash Cap** (cap-alpha): alpha keys (gradient from #e0e2e3).
- **Dark Ash Cap** (cap-mod): modifiers, navigation cluster, F5 to F8.

### Status
- **Signal Green** (ok), **Signal Red** (bad), **Amber Pending** (warn): connection dot, saved state, error notices and toasts, the pulsing "Not sent yet" dot. Never decorative.

### Named Rules
**The Keycap Rule.** Mustard is used the way the yellow caps are: on the selected thing and the one primary action. A screen carries one mustard-filled button.

**The Board Owns Its Colours Rule.** Case, cap and knob colours live on the keyboard render only; UI chrome never borrows Case Black as a surface.

## Typography

**Body Font:** Segoe UI Variable Text (with Segoe UI, system-ui, -apple-system, sans-serif)
**Label/Mono Font:** Cascadia Mono (with Consolas, ui-monospace), tabular numerals

**Character:** The operating system's own face, so the tool reads like a native utility and the keyboard stays the visual event.

### Hierarchy
- **Headline** (700, 28px, 1.15, -0.02em, balanced wrap): page headline on the connect screen.
- **Title** (650, 15px): panel headings, paired with a 16px icon.
- **Body** (400, 14px, 1.45): everything else; buttons and tiles at 600.
- **Label** (600, 12px): field labels, pills, tile mode numbers (tabular). Sidebar section group labels alone use 11px uppercase with 0.06em tracking.
- **Mono** (12px, tabular): hex values, capture log, `code`, `kbd` shortcuts.
- **Key legends** (600, 1.25cqi of board width): scale with the board via container units.

### Named Rules
**The Native Face Rule.** No display face. Hierarchy comes from weight (400 / 600 / 650) and size, not from a second family.

## Layout

A two-column app grid: 248px sticky sidebar, fluid main (padding 22px 26px, page max-width 1240px, 18px gaps between blocks). The lighting page stacks a stage (status row of pills, pending line and Apply above the board; board with a 248px profiles column beside it) over a two-column split of effect tiles (auto-fill, 124px min) and a 340px controls panel. Not connected, the main column becomes a centred 820px connect guide over the same shell.

Responsive: at 1180px the stage, lighting and split layouts collapse to one column. At 760px the sidebar becomes a top bar (device card full width, nav scrolls horizontally, brand and group labels hidden), the Apply bar wraps to full width with a full-width button, and main padding drops to 16px. Spacing rhythm runs 6 / 8 / 10 / 14 / 18px.

## Elevation & Depth

A hybrid: flat ash and white tonal layering with one soft ambient shadow for panels, and a single dramatic shadow reserved for the physical keyboard.

### Shadow Vocabulary
- **Panel** (`0 1px 2px rgba(24,25,27,.06), 0 8px 24px -12px rgba(24,25,27,.18)`): panels at rest, tiles on hover.
- **Board** (`0 1px 0 rgba(255,255,255,.06) inset, 0 22px 40px -22px rgba(24,25,27,.55), 0 2px 6px rgba(24,25,27,.2)`): the keyboard render only.
- **Underglow** (per cap, colour-mixed from the current lighting colour): the light the board emits; scales with brightness.
- **Primary press** (`inset 0 -2px 0 rgba(0,0,0,.12)`, plus a mustard bloom on hover): the mustard button's keycap-like bottom edge.
- **Toast** (`0 14px 34px -14px rgba(0,0,0,.55)`).

### Named Rules
**The One Object Rule.** Only the keyboard casts a deep shadow. UI surfaces stay at the panel shadow or flat.

## Shapes

Soft, keycap-like rounding throughout: 8px for small controls and icon buttons, 9 to 10px for inputs, nav items, buttons and segmented controls, 12px for tiles, device card and toasts, 16px for panels, fully round for pills, toggles and the pill segmented control. Borders are 1px hairlines; selected states add a 1px or 2px ring rather than a heavier border. The board itself scales its radii with its width (case 2.2cqi, caps 0.9cqi).

## Components

### Buttons
- **Shape:** gently rounded (10px), 38px tall; large variant 44px with 15px type.
- **Primary:** Keycap Mustard fill, ink text, mustard-edge border, inset bottom edge like a keycap; carries a `kbd` shortcut hint when it has one (Ctrl Enter).
- **Hover / Active:** lighter mustard (#ecc232) with a soft mustard bloom; press scales to 0.98.
- **Outline:** Paper White with firm-line border, border darkens to Pewter on hover.
- **Ghost:** transparent, Graphite text, Soft Ash on hover.
- **Icon button:** 32px square, 8px radius, Mustard Wash on hover, scales to 0.94 on press.

### Chips (Pills)
- **Style:** 12px / 600 label, fully round, Paper White with hairline border.
- **State:** green (ok) and mustard-wash (demo) variants report status above the board; they are not interactive.

### Cards / Containers
- **Panel:** 16px radius, Paper White, hairline border, panel shadow, 18px 20px padding, 15px / 650 title with icon.
- **Effect tile:** 12px radius, Soft Ash with hairline border; on hover lifts 2px, turns white and gains the panel shadow while its icon tilts (-6deg, 1.12); selected turns Mustard Wash with a mustard ring and the icon pops once. Content: Lucide icon (22px), mode name (600), mode number (12px tabular).

### Inputs / Fields
- **Style:** 36px tall, 9px radius, firm-line border, Paper White, tabular numerals; hex input is uppercase 600.
- **Focus:** border goes to Ink with a 3px Mustard Wash halo.
- **Segmented control:** recessed #ececea track, 3px padding; the selected segment is a white raised chip. Pill variant fully round.
- **Toggle:** 38 by 22px track, mustard when on, white knob slides 16px.
- **Swatches:** 26px (48px large) rounded squares with an inset hairline; selected gets a white gap and Ink ring.

### Navigation
- **Style:** sidebar of 14px / 500 items with a 16px Lucide icon, 9px radius, Graphite text.
- **States:** hover Soft Ash; active Mustard Wash, Ink text at 600, Mustard Ink icon; disabled 45% opacity.
- **Groups:** an "Advanced" group label separates developer tools.
- **Device card:** product photo, name, status dot (green halo when connected) and a connect / disconnect icon button.
- **Mobile:** collapses to a horizontal scrolling row under the device card.

### Toast
Ink panel with 12px corners bottom-right, ground-coloured text, coloured leading icon (green or red), rises 12px in on entry; errors switch to a deep red ground.

### The Board (signature)
The AK820 render: black case gradient, light-ash alphas, dark-ash modifiers, mustard Esc / Enter / Space, a grey knob. Legends are tinted by the current lighting colour while staying legible on every cap (4.67:1 or better at brightness 4); underglow below each cap takes the lighting colour (or a per-key LED colour) and cross-fades over 0.5s on change. Effect previews: breath (pulse), wave (staggered by key x position), rainbow (hue cycle). The board lights up once on connect or explore (1.2s). Clickable caps lift on hover; marked caps get a mustard ring, the selected cap a white ring. All motion collapses under reduced-motion.

## Do's and Don'ts

### Do:
- **Do** keep the keyboard render visible and central on lighting and key surfaces.
- **Do** spend mustard only on selection and the single primary action (The Keycap Rule).
- **Do** stage changes and state them ("Not sent yet") until the user presses Apply; keep Apply in the status row above the board.
- **Do** use Lucide line icons at the shared 1.9 stroke, 16px in chrome, 22px on tiles.
- **Do** ease every state change with `cubic-bezier(.16, 1, .3, 1)` and honour reduced-motion.
- **Do** use mono only for hex, packets and shortcuts.

### Don't:
- **Don't** turn the app into a dark gamer dashboard or a wall of flat tabs.
- **Don't** add a second accent hue; status colours report state and are never decoration.
- **Don't** give UI surfaces the board's deep shadow or Case Black fill.
- **Don't** apply lighting changes live; Apply is explicit.
