---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles.css"]
---

# App shell — surface brief

Scope: the whole web app (src/App.tsx and src/components/*). Mode: Operate.
Audience and job: AK820 owners on desktop Chrome/Edge; mostly change lighting, sometimes keys, macro, profiles. The keyboard must stay visible and central. Constraints: keep every feature; explicit Apply (no live apply); light theme; developer tools stay but move under Advanced.
Approved sketches: .impeccable/mocks/proposal-lighting.html and proposal-connect.html (user-approved layout: light theme, sidebar, keyboard with profiles beside it, effect tiles, controls panel with explicit Apply). The user's later colorway request (AK820 photo: black case, ash keys, mustard Esc/Enter/Space) replaced the sketches' cobalt accent with mustard and added Lucide icons and motion.
References for craft bar: VIA (one-button empty state), Keychron Launcher (sidebar + device card, keyboard on top, profiles beside it, effect tile grid, settings panel, "try without a keyboard"), ZSA Oryx (huge legible keyboard, function-tinted keys, status pills).

## Direction contract

THESIS: The AK820 itself is the interface: the on-screen board, drawn in its own black / ash / mustard colorway, sits above every lighting and key task. Refuses both the dark gamer dashboard and the old wall of flat tabs.

OWN-WORLD: Light ash ground #f2f2f0 with white panels and ink #18191b. The keyboard's colorway is the palette: case black #1c1d1f, dark-ash modifiers #5c5f63, light-ash alphas #d3d5d6, mustard #e3b419 as the only accent, used the way the yellow keycaps are (selection, the primary action). Lucide line icons at one stroke, the system UI face, 10–14px radii, soft offset shadows.

STORY: The owner sees their own keyboard lit in the current colour, picks an effect tile, tunes colour, brightness and speed, watches the "unsent changes" line, presses Apply. Keys, macro and profiles sit one click away in the sidebar.

FIRST VIEWPORT: 248px sidebar (app name, device card with connect state, icon nav: Lighting, Per-key RGB, Keys & macro, Profiles; Advanced: Capture log, Settings). Main: status pills, the keyboard render full width, capped by the window height (profiles moved to a chip row under the effect tiles, 2026-11-19); above the board, a status row carries the pills; the "Not sent" line and the mustard "Apply to keyboard" sit at the foot of the effect panel, right after the tiles (user decision 2026-11-19, replacing the earlier above-the-board placement); below, effect tiles (icon, name, mode number) on the left and the controls panel on the right. Not connected: same shell; main shows a two-step connect guide, Connect, and "Explore without a keyboard".

FORM: The category standard (canon), chosen after re-roll 1 and refined against VIA, Keychron Launcher and ZSA Oryx with the user's colorway, icon and motion requests. seed:0d82276e46ce2e3f. Signature move: the keyboard's legends and underglow take the current lighting colour and cross-fade when it changes; effect tiles animate their icon on hover and selection.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
