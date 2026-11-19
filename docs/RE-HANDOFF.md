# AJAZZ AK820 reverse-engineering handoff

Date: 2026-11-18
Purpose: complete state of the fresh reverse-engineering pass, so another agent (Claude Code) can continue without redoing work or losing context.

---

## 1. Executive summary

We performed a fresh reverse-engineering pass on the AJAZZ AK820 vendor driver installer in the repo root, deliberately ignoring the existing `src/` implementation and existing notes during discovery, then cross-checked at the end.

Major results:

- Root `.exe` is an NSIS installer; unpacked to a stable directory on `E:`.
- Real driver is a 32-bit PE (`FUN_00486F50` etc.), not .NET.
- HID protocol is a 64-byte frame with leading report ID `0x04`, a 16-bit additive checksum, command `0x06`, and RGB at packet bytes 14–16.
- Saved capture checksum solved: 46/46.
- Live vendor app captured with an IAT hook: 36/36 live HID writes pass the same checksum; color swatch clicks verified RGB bytes; apply icon emits command triplets.
- Vendor app writes HID reports through `WriteFile`, **not** `HidD_SetOutputReport`.
- A separate 17-byte init routine using `HidD_SetOutputReport` was decompiled and its command markers recovered.
- Key-remap, macro, named-mode mapping and saved-capture parameter `0x15` remain unresolved.

No existing source files were modified. New files added: `docs/re-fresh-findings.md`, `docs/re-fresh-data.json`, `docs/rea-protocol.md`, `src/reaFrame.ts`. `npm run lint` passes.

No background jobs are running.

---

## 2. Repo files changed/added by this work

| File | Purpose |
| --- | --- |
| `docs/re-fresh-findings.md` | Chronological findings + work log |
| `docs/re-fresh-data.json` | Structured manifest: targets, hashes, evidence IDs, protocol facts, artifacts, unknowns |
| `docs/rea-protocol.md` | Fresh protocol specification |
| `docs/RE-HANDOFF.md` | This handoff |
| `src/reaFrame.ts` | Isolated reference implementation of the verified 64-byte frame; **not imported by the app** |

Existing files (including `src/protocol.ts`) were only read, never modified.

Before continuing, run `git status` to see the actual working-tree state. Do **not** commit or push without explicit user approval.

---

## 3. Verified / inferred / unknown

### Verified (direct observation or 100% cross-check)

- Root installer SHA-256 `ab398b4abf7e231c3cf4bdd055d0f876d01d4c8045b7bc00e1ab4cca4b97e548`, 44,508,432 bytes.
- Embedded driver SHA-256 `93316d45e62776bf1099c8c57ecb326fd8eadbde4fefa9a13ad491fc203e3b5b`, 3,678,792 bytes, PE32 x86.
- Driver imports `HID.DLL`, `SETUPAPI.dll`, `WINHTTP.dll`, `WriteFile`, `ReadFile`.
- 64-byte HID output report with leading `0x04`.
- Checksum: `packet[1] | packet[2]<<8 == sum(packet[3..63]) & 0xFFFF`; 46/46 saved records and 36/36 live writes.
- Saved capture: 46 command-shaped outbound records, all exactly echoed inbound (reportId 4).
- Live color clicks map RGB to packet bytes 14–16: red `ff 00 00`, green `00 d7 0f`, blue `31 53 ff`, light blue `00 99 ff`.
- Vendor app uses `WriteFile` for these reports (IAT RVA `0x239B7C`), not `HidD_SetOutputReport`.
- `FUN_00486F50` issues 12 `HidD_SetOutputReport` calls with 17-byte reports.
- Lighting mode selection alone emits no HID traffic; the bottom device/save icon emits command triplets.
- 12 function-type IDs exist in `KeySetControl.xml` (`userdata` 0–11).
- 126 `KeyList` entries in `Keyboard.json`; assignment high-16 groups `0x20` (keyboard), `0xA0` (mouse), `0xD0` (macro).

### Inferred (supported but not proven)

- Byte 3 `0x06` = set-parameter command; byte 4 `0x1d` = parameter/opcode for the live color/config commands.
- Bytes 9–11 encode page/submode/fixed fields; byte 9 may identify active UI page (`0x02` color clicks, `0x01` Button Settings, `0x08`/`0x05` apply).
- Command markers `AA22/AD22 … AC44/AF44` are paired write/verify operations.
- `0x6949A0`-style pointer table at `0x6949DC`–`0x694AA4` is a vtable/function-pointer table; `0x694A00` holds `0x486F50`.
- Saved-capture byte 4 `0x15` is a different operation from live `0x1d`.

### Unknown (do not claim as fact)

- Which UI action produces parameter `0x15`.
- Named-mode → bytes 9–10 mapping.
- Key-remap and macro wire formats.
- Exact 17-byte init report field layout.
- Owning class/caller of the `0x6949DC` table.

---

## 4. Artifact inventory

All paths are absolute and stable; do not rely on `C:\Users\Jaeef\AppData\Local\Temp\opencode\ajazz-rea` — Windows cleaned that folder once.

| Path | Description |
| --- | --- |
| `E:\Ajazz Web driver\AJAZZ AK820 ╙╨╧▀RGB Keyboard.exe` | Original NSIS installer |
| `E:\Tools\ajazz-rea\` | Full extracted payload (1,492 files) |
| `E:\Tools\ajazz-rea\target.exe` | ASCII-named copy of unpacked driver; use this for tools |
| `E:\Tools\ajazz-rea\HookDLL.dll` | Proxy hook DLL currently in place |
| `E:\Tools\ajazz-rea\HookDLL_orig.dll` | Original HookDLL, preserved |
| `E:\Tools\ghidra-dist\ghidra_12.2_PUBLIC_20261016.zip` | Verified Ghidra 12.2 archive |
| `E:\Tools\ghidra_12.2_PUBLIC\` | Ghidra installation |
| `E:\Tools\ghidra-dist\project\ak820` | Persistent Ghidra project (program `/target.exe`) |
| `E:\Tools\ghidra-dist\ak820-main.reasnap` | REA analysis snapshot (CLI re-imports anyway) |
| `E:\Tools\ghidra-dist\scripts\` | Ghidra Java scripts written for this pass |
| `E:\Tools\ghidra-dist\io-hook.log` | Latest live HID/short-write log |
| `E:\Tools\ghidra-dist\live-hid-analysis.txt` | Color-click analysis |
| `E:\Tools\ghidra-dist\mode-apply-analysis.txt` | Apply-icon analysis |
| `E:\Tools\ghidra-dist\button-settings-analysis.txt` | Button Settings probe |
| `E:\Tools\ghidra-dist\capture-crypto.txt` | Offline capture checksum result |
| `E:\Tools\ghidra-dist\data-files-summary.txt` | Extracted JSON/XML summary |
| `E:\Tools\ghidra-dist\callees-decomp.txt` | Helper callee decompilation |
| `E:\Tools\ghidra-dist\decomp-candidates.txt` | Candidate vcall decompilation |
| `E:\Tools\ghidra-dist\vcall-scan.txt`, `vcall-decomp.txt` | Virtual-call analysis |
| `E:\Tools\ghidra-dist\app-ui.png`, `mode-combo.png`, `mode-selected.png`, `button-settings.png` | UI screenshots |
| `E:\Tools\ghidra-dist\hook.c`, `hook2.c`, `hook.def` | Hook sources |
| `E:\Tools\ghidra-dist\capture_crypto.py` | Checksum analysis script |
| `E:\Tools\ghidra-dist\rea-fresh-investigation.json` (temp path, if still present) | Saved REA Evidence bundle; import to restore old Evidence IDs |
| `E:\Ajazz Web driver\ak820-capture-1784532299305.json` | Original HID capture, 500 records |

The structured manifest lists 37 artifacts: `docs/re-fresh-data.json`.

---

## 5. Toolchain setup

Already installed and verified:

- Ghidra 12.2 at `E:\Tools\ghidra_12.2_PUBLIC` (official SHA-256 matched).
- Temurin JDK 25.0.5 LTS at `C:\Program Files\Eclipse Adoptium\jdk-25.0.5.8-hotspot`.
- `GHIDRA_INSTALL_DIR` and `JAVA_HOME` set at user scope via `setx`.
- MinGW gcc 6.3.0 (`C:\MinGW\bin\gcc.exe`) — can build 32-bit DLLs.
- Python 3.12.10.
- 7-Zip from `C:\Program Files (x86)\VMware\VMware Workstation\7za.exe`.
- REA CLI 6.9.0 via `npx -y rea-agents@6.9.0`.

Important: the currently running OpenCode/REA MCP process started before those env vars existed, so in-session MCP tools may not see Ghidra. Restart OpenCode to fix that. Until then use REA CLI.

For CLI commands, set in each shell:

```powershell
$env:GHIDRA_INSTALL_DIR='E:\Tools\ghidra_12.2_PUBLIC'
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-25.0.5.8-hotspot'
$env:REA_GHIDRA_STARTUP_TIMEOUT_MS='900000'
```

`rea doctor` confirmed ghidra/platform/version/headless/native-decompiler/Java 25 all healthy.

---

## 6. Reproduction recipes

### 6.1 Re-extract installer

```powershell
$arc=(Get-ChildItem 'E:\Ajazz Web driver' -Filter *.exe | Select-Object -First 1).FullName
$out='E:\Tools\ajazz-rea'
& 'C:\Program Files (x86)\VMware\VMware Workstation\7za.exe' x -bso0 -bsp0 -y "-o$out" $arc
Copy-Item (Get-ChildItem $out -Filter 'AJAZZ*.exe' | Select-Object -First 1).FullName "$out\target.exe" -Force
```

Do **not** pass the Unicode filename directly to Ghidra headless — it fails with `InvalidInputException: Failed to get canonical form`. Always use `target.exe`.

### 6.2 Fast Ghidra queries against existing project

```powershell
$env:GHIDRA_INSTALL_DIR='E:\Tools\ghidra_12.2_PUBLIC'
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-25.0.5.8-hotspot'
$headless='E:\Tools\ghidra_12.2_PUBLIC\support\analyzeHeadless.bat'
& $headless 'E:\Tools\ghidra-dist\project' ak820 -process target.exe -noanalysis `
  -scriptPath 'E:\Tools\ghidra-dist\scripts' -postScript FindAddr.java 0x486f50
```

Available scripts in `E:\Tools\ghidra-dist\scripts`: `FindAddr.java`, `FindRange.java`, `FindVCall.java`, `FindSymbol.java`, `FindSymbolContains.java`, `ListSymbolsInRange.java`, `DumpWords.java`, `DumpDecomp.java`, `FindTableRefs.java`.

### 6.3 Rebuild proxy hook and capture live traffic

Original `HookDLL.dll` must be preserved as `HookDLL_orig.dll`. The proxy exports the two mangled functions and patches `WriteFile` (and `HidD_SetOutputReport`) IATs.

```powershell
$app='E:\Tools\ajazz-rea'
Copy-Item "$app\HookDLL_orig.dll" "$app\HookDLL.dll" -Force
gcc -shared -o "$app\HookDLL.dll" 'E:\Tools\ghidra-dist\hook2.c' 'E:\Tools\ghidra-dist\hook.def'
```

Then launch the app with working directory `E:\Tools\ajazz-rea`. The log is `E:\Tools\ghidra-dist\io-hook.log`.

Pitfalls:
- Kill leftover `target.exe` processes before rebuilding the DLL (file lock).
- PowerShell `$pid` is a reserved variable — use `$procId`.
- The app window must be foregrounded with `SetForegroundWindow`; `WScript.Shell.AppActivate` alone was insufficient.
- Fixed coordinates worked for color clicks and one apply, then became unreliable. Prefer manual clicks or screenshots between actions.

### 6.4 Parse live log

`E:\Tools\ghidra-dist\capture_crypto.py` contains the checksum logic. For the live log, parse lines like:

```text
WR99 t=8447078 h=00000650 len=64: 04 c5 02 06 1d ...
```

Strip the leading `04`, then `data[0] | data[1]<<8 == sum(data[2:]) & 0xFFFF`.

---

## 7. Protocol reference

### 7.1 64-byte frame

Packet offsets (the full WebHID report):

| Offset | Meaning |
| --- | --- |
| 0 | `0x04` report prefix |
| 1–2 | 16-bit LE checksum over bytes 3–63 |
| 3 | command, `0x06` observed |
| 4 | parameter/opcode, `0x1d` live color/config, `0x15` in saved capture |
| 9–11 | page / submode / fixed `0x04` |
| 14–16 | RGB, verified |
| 28 | `0xff` |
| 33 | `0x02` |

When using the saved capture JSON, which omits the leading `0x04`, subtract 1 from each packet offset above.

Checksum:

```ts
packet[1] | packet[2] << 8 === sum(packet[3..63]) & 0xffff
```

### 7.2 Handshake triplets

Every observed command is bracketed by:

- Begin: `04 01 00 01 00 00 …`
- Command packet
- End: `04 02 00 02 00 00 …`

### 7.3 Verified color bytes

| UI color | Packet bytes 14–16 |
| --- | --- |
| red | `ff 00 00` |
| green | `00 d7 0f` |
| blue | `31 53 ff` |
| light blue | `00 99 ff` |

### 7.4 Observed page/submode values

| Action | Bytes 9–11 |
| --- | --- |
| Color click | `02 03 04` |
| Apply (one run) | `08 04 04`, `08 03 04`, `05 03 04` |
| Button Settings | `01 03 04`, `01 01 04`, `01 02 04`, `01 02 03` |
| Per-mode attempt (one command) | `02 03 04` |
| Saved capture command records | varies; byte 4 = `0x15` |

### 7.5 17-byte init routine

`FUN_00486F50` at `0x486F50`–`0x4876EA` (1,947 bytes):

- 12 `HidD_SetOutputReport(handle, &local_14, 0x11)` calls.
- Command markers in `local_13`: `AA22, AD22, AA44, AD44, AB22, AE22, AB44, AE44, AC22, AF22, AC44, AF44`.
- HID handle at `param_1 + 0x8b4`.
- Payload copied to `auStack_1d + 0x0d`, clamped to `0xf7`.
- Stranded call at `0x486FF0` is an indirect virtual call through vtable slot `+0x114`.

Helper callees:

| Address | Behavior |
| --- | --- |
| `0x417fc0` | `FUN_0040fcd0(base) + index*4` array lookup |
| `0x449e80` | element count `(Bx() - FUN_0040fcd0()) >> 2` |
| `0x4839d0` | writes device fields `+0xc78`, `+0xc7c`, `+0xc80` |
| `0x4b46c0` | reads device field `+0x1898` |

---

## 8. UI map and reliability

Screenshots: `app-ui.png`, `mode-combo.png`, `mode-selected.png`, `button-settings.png`, `kbd-mode.png`.

Useful coordinates from the vendor app window (1920×1080 screenshot):

| Element | Approx coordinates |
| --- | --- |
| Mode combo | `(735, 737)` |
| Dropdown items | y = 778, 807, 836, 865, 894, 923, 952, 981 |
| Color swatches | y ≈ 740; x = 1016, 1070, 1123, 1175, 1227, 1279, 1331 |
| Device/save icon | `(500, 940)` |
| Button Settings tab | `(370, 355)` |
| Virtual keyboard | center around `(1090, 430)` |

Reliability notes:

- Color swatch clicks reliably produced report triplets.
- Mode selection itself emits nothing; apply icon emits.
- After the first apply, fixed coordinates became unreliable and keyboard selection stole focus. Use screenshots or manual clicks for further UI work.
- Always confirm the app window is foreground before clicking.

---

## 9. Remaining work, priority and rationale

### P0 — Wire `src/reaFrame.ts` into the app

Why: currently it is an isolated reference module; no runtime benefit until imported. Lowest risk.

### P1 — Map saved-capture parameter `0x15`

Why: 46 records in the repo capture use `0x15`; live clicks only reproduced `0x1d`. Without this, that traffic is undecodable. Approach: use the hook and try lighting-related UI actions (mode apply, brightness/speed sliders, direction radios) until `0x15` appears.

### P1 — Named-mode → bytes 9–10

Why: needed to implement mode selection in the web driver. Approach: manual clicks (not automated), one mode → apply once per run, screenshot each selection to confirm.

### P2 — Key-remap protocol

Why: repo README lists remap as missing; Button Settings probe only re-sent lighting config. Approach: click a key to select it, choose a function from the combo, click apply; capture reports.

### P2 — Macro protocol

Why: repo README lists macro as missing; not probed yet. Approach: Macro Management tab, record a simple macro, capture.

### P3 — 17-byte init markers

Why: `AA22…AF44` recovered but not tied to a UI action. May be configuration upload important for full compatibility.

### P4 — Vtable owner / caller at `0x6949DC`

Why: all static xref and operand scans returned empty. Lowest value; runtime dispatch observation is the practical route.

---

## 10. Constraints and gotchas

- Vendor EXE execution was explicitly approved by the user on 2026-11-18. Re-confirm if local policy requires it.
- The hook proxy replaces `HookDLL.dll` in the extracted copy only; original saved as `HookDLL_orig.dll`.
- The connected device reports VID `0x320F` / PID `0x505B`; extracted `Keyboard.json` says `0x0C45` / `0x1007`. README notes multiple AK820 hardware families.
- Do not trust the old temp extraction path; it was cleaned once by Windows.
- Ghidra CLI re-imports the binary on every invocation even with `--snapshot`; use the persistent project with `-process target.exe -noanalysis` for fast follow-ups.
- `rea doctor` and MCP tools require env vars present at process start; restart OpenCode for in-session Ghidra.
- Do not delete or overwrite `src/protocol.ts`; it already contains the existing implementation and the new spec cross-checks it.
- Never `git push`, `git add`, `git commit`, `git stash`, `git rebase`, or `git reset --hard` without explicit user approval. Leave changes in the working tree.

---

## 11. Acceptance criteria for the next agent

A successful continuation should:

1. Keep all findings in `docs/re-fresh-findings.md`, `docs/re-fresh-data.json`, and this handoff.
2. Distinguish observation / inference / unknown for every new claim.
3. Save raw hook logs and screenshots to `E:\Tools\ghidra-dist\` before closing the app.
4. Validate `docs/re-fresh-data.json` with `ConvertFrom-Json` after editing.
5. Run `npm run lint` after any TypeScript change.
6. Avoid modifying existing app behavior unless explicitly asked.
7. Report bounded negatives honestly — several searches returned empty and that is data, not failure.

## 12. Space cleanup performed 2026-11-19

Deleted (675 MB total): Ghidra 12.2 ZIP (543.3 MB), Ghidra Local cache (30.8 MB), Ghidra Roaming config (1.9 MB), REA Ghidra temp runtime dir (98.3 MB), opencode config backup, old temp extraction folder.

Kept: Ghidra install (866.5 MB), `E:\Tools\ghidra-dist` logs/project/scripts (180.8 MB), extracted payload (72.5 MB), Temurin JDK 25 (290 MB), both REA npx caches (316.2 MB each), REA skill and MCP registration. The npx cache `af752b…` is likely the running MCP server binary — restart OpenCode before deleting it.

`docs/re-fresh-data.json` has a `cleanup` section with the full list.

## 13. REA toolchain removed 2026-11-19

User requested full cleanup of REA downloads. Removed: Ghidra install, `E:\Tools\ghidra-dist`, `E:\Tools\ajazz-rea`, both REA npx caches, REA skill, REA MCP registration in `opencode.jsonc`, and user env vars `GHIDRA_INSTALL_DIR` / `JAVA_HOME`. Total freed across both cleanup passes: ~2,427 MB.

Recheck confirmed JDK 25 removal too: `C:\Program Files\Eclipse Adoptium\jdk-25.0.5.8-hotspot` is gone and winget no longer lists Temurin 25. The initial exit-1603 error was transient; the uninstall completed asynchronously.

All Ghidra/E:\Tools paths in this handoff are historical records only — the toolchain no longer exists on this machine. The REA MCP namespace and skill are no longer available in the current session.

End of handoff.
