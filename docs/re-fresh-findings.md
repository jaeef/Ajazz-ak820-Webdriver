# Fresh RE pass — AJAZZ AK820 vendor driver (2026-11-18)

Goal: start from the shipped artifact, not from existing repo notes or `src/`.
No existing source, config, or documentation was modified. Extracted files now live at `E:\Tools\ajazz-rea` (stable path; the earlier temp copy was cleaned by Windows and re-extracted with matching SHA-256).

## Checklist status

| Question | Status |
| --- | --- |
| What is the 44 MB root `.exe`? | Answered: NSIS installer stub |
| What real application does it ship? | Answered: embedded `AJAZZ AK820 有线RGB Keyboard.exe` (PE32 x86) |
| Does the real app talk HID directly? | Answered: imports `HID.DLL` + `SETUPAPI.dll` |
| Command IDs / payload layouts from static analysis | Unresolved: no decompiler provider configured |
| What does the in-repo HID capture show? | Partially answered: raw report structure derived below |

## Target identity

Root artifact: `E:\Ajazz Web driver\AJAZZ AK820 ╙╨╧▀RGB Keyboard.exe`
- Size 44,508,432 bytes; SHA-256 `ab398b4abf7e231c3cf4bdd055d0f876d01d4c8045b7bc00e1ab4cca4b97e548`
- PE32, machine 0x014c (x86), 8 imported DLLs / 172 imports (installer-style: `WriteINIStr`, `ExecShell`, `Reg*`, `SHBrowseForFolderW`, `created uninstaller`)
- UTF-16 strings are NSIS script-runtime messages (`WriteINIStr`, `CopyFiles`, `Pop: stack empty`, `Exch: stack < %d elements`) — observation
- File entropy 7.9977/8; low-entropy stub through roughly offset 0x43000, then compressed body — observation
- PE sections have overlapping raw ranges; `inspect_pe_resources` rejected this file with `invalid_format` — limitation
- No CLI data directory: native, not .NET

REA Evidence IDs from this pass:
- outer imports `ev_8ba717a4a2f1b4eff4610e491406657b0355eb3e8332dae184ff33cc0499ec3b`
- artifact summary `ev_108f836a0a76ad4768e1ff3d1048f9bd6dc1975c4d335892d431521fb5d66a48`
- release exposure `ev_0037a67e5ac0adeeea4ed8fd68835d0f845b329b553a5855676e0b4447cf629c`
- managed classification `ev_77fe7ab11f9282a864b78b794e3e6674f0b6f79cec9d824508f788e3d4fd2a05`
- entropy `ev_eb9ed46c75e86098d626af2e025a623a590a85fe68783b36de459f0a146ff35f`
- unpacked driver imports `ev_74b4f8c45c375a47e5ec8f895753f712d61575f4e2897865058d36738afa400c`

Full checkpoint: `C:\Users\Jaeef\AppData\Local\Temp\opencode\ajazz-rea\rea-fresh-investigation.json` (8 records).

## Payload extraction

7-Zip (existing binary at `C:\Program Files (x86)\VMware\VMware Workstation\7za.exe`) reads the tail as a solid archive:
`LZMA2:24 BCJ`, 6 blocks, offset 731555, physical size 42,630,881.

Selected members extracted (no execution) to `E:\Tools\ajazz-rea`:
- `AJAZZ AK820 有线RGB Keyboard.exe`, `DefaultData\*`, `Skin\XML\*`, `SDK\*`, `Updata\*`, `DuiLib.dll`, `HookDLL.dll`, `AudioRecord.exe`

Real driver:
- SHA-256 `93316d45e62776bf1099c8c57ecb326fd8eadbde4fefa9a13ad491fc203e3b5b`
- 3,678,792 bytes, PE32 x86, 21 DLLs, 1,118 imports
- `HID.DLL` (11): `HidD_SetOutputReport`, `HidD_GetAttributes`, `HidD_GetPreparsedData`, `HidP_GetCaps`, `HidP_GetUsages`, `HidP_GetUsageValue`, `HidP_GetScaledUsageValue`, …
- `SETUPAPI.dll` (4): `SetupDiGetClassDevsW`, `SetupDiEnumDeviceInterfaces`, `SetupDiGetDeviceInterfaceDetailW`, `SetupDiDestroyDeviceInfoList`
- `WINHTTP.dll` (16): updater/network — inference, not executed
- `DuiLib.dll` (478 imports): UI framework
- `HookDLL.dll` (2): `InstallHook`, `UnInstallHook`
- Embedded PDB path string: `E:\xk\…\Output\NeoUsb.pdb` — source module name `NeoUsb` (inference from string only)

## Static strings of interest (from unpacked driver)

`WM_HOOK_KEY_KBMACRO_MSG`, `WM_HOOK_KEY_MSMACRO_MSG`, `WM_HOOK_KEY_KBMACROSINGLE_MSG`, `MacroInfo`, `newmacroinfo_21080109`, `LightInfo`, `newlightinfo_21080109`, `ZZCCLedMode`, `LEDREGMode`, `AudioLightInfo`, `ReportStages`, `acrox_macro.config`, `acrox_light.config`, `gamemodeupload`.

## Raw HID capture (repo file, parsed independently)

`ak820-capture-1784532299305.json` is an array of 500 records with `id`, `t`, `dir`, `transport`, `reportId`, `hex`, `bytes`.
Provenance of who produced the capture was not established in this pass.

- 139 outbound / reportId 4, 139 inbound / reportId 4, 222 inbound / reportId 3
- reportId 3 inbound payloads are 2 bytes, e.g. `3B 05`, `3B 06`, `3A 05`, `3A 06` — consistent with key event + transition, not proven
- reportId 4 outbound payloads are 63 bytes
- Two dominant 63-byte shapes (`01 00 01 00 …`, `02 00 02 00 …`, 46–47 each) look like handshake/ack
- Command-shaped records share bytes 2..7 = `06 15 00 00 00 03`; bytes 0..1 vary (`AD 01`, `AE 01`, `AF 01`, `B0 01`, `B1 01`, `B2 01`, `EF 00` … `FA 00`) and trend upward with time — inference: rolling sequence or checksum
- Bytes 8..15 carry varying parameters, e.g. `01 03 00 00 FF 00 8A 03`, `02 01 00 00 FF 00 8A 03` — layout not yet mapped

### Derived capture field layout (this pass)

Observations from `ak820-capture-1784532299305.json`:

- 46 outbound command-shaped records; all 46 have an exact byte-for-byte echo in inbound reportId 4.
- Every command-shaped record is 63 bytes; bytes 2..7 are always `06 15 00 00 00 03`.
- Bytes 0..1 form two time-separated clusters: early `AD 01`/`AE 01`/`AF 01`/`B0 01`/`B1 01`/`B2 01`/`B4 01`/`B5 01`/`B6 01`/`B7 01`, plus `0F 01`, `1D 02`, `08 02`, `42 02`; late `EF 00`, `F4 00`…`FB 00`. Values trend upward with record id/time.
- Early cluster bytes 8..15 are mostly `NN 03|01|02|04 00 00 FF 00 8A 03`, with exceptions `06 02 00 00 00 D7 0F 03`, `06 02 00 00 FF F0 05 03`, `06 02 00 00 EE 00 F1 03`, `06 02 00 00 8D FF 8D 03`.
- Late cluster bytes 8..15 are consistently `NN 02 00 00 19 94 19 03`, where NN runs `06, 0B, 0C, 0D, 0E, 0F, 10, 11, 12` alongside the rising word.

Inferences:

- Bytes 0..1 look like a rolling sequence or checksum, not a fixed opcode — the same parameter payload appears under different words.
- Bytes 2..7 are a fixed command envelope.
- Bytes 8..9 behave like a counter plus a phase/subcommand discriminator (`03` early, `02` late); bytes 10..11 are zero in all observed commands.
- Exact echo on input suggests the firmware acknowledges by returning the whole report, but this is not proven.

Unknowns: opcode-to-operation mapping, meaning of bytes 12..15, and whether bytes 0..1 are CRC, sequence, or both. No decompiled evidence yet supports a stronger claim.

## Analysis toolchain (installed 2026-11-18)

- Ghidra 12.2 at `E:\Tools\ghidra_12.2_PUBLIC` (official SHA-256 `2c2cd776…67be67` verified)
- Temurin JDK 25.0.5 LTS at `C:\Program Files\Eclipse Adoptium\jdk-25.0.5.8-hotspot`
- `GHIDRA_INSTALL_DIR` and `JAVA_HOME` set at user scope via `setx`
- `rea doctor` confirms ghidra, platform, installation, version, headless, native decompiler, Java 25, and native authority all healthy

Important: the already-running REA MCP process does not see the new environment variables. Ghidra work therefore runs through a fresh REA CLI process until the MCP client (OpenCode) is restarted. After restart, `open_binary(..., provider_id: "ghidra")` will work in-session.

## Ghidra analysis snapshot

`E:\Tools\ghidra-dist\ak820-main.reasnap` holds the Ghidra import/analysis of the unpacked driver:
- image base `0x400000`
- 17,511 procedures, 6,857 strings
- segments `.text` 0x401000–0x639000, `.rdata` 0x639000–0x6c4000, `.data`, `.rsrc`, `.reloc`

### HID send routine located (this pass)

`rea trace HidD_SetOutputReport` (900 s startup budget) succeeded:

- String match at `0x6babd2`; imported procedure `EXTERNAL:0x1` = `HID.DLL::HidD_SetOutputReport`.
- 13 references total. Twelve call sites at `0x48721d`, `0x48727b`, `0x4872e6`, `0x487344`, `0x4873af`, `0x48740d`, `0x487478`, `0x4874e8`, `0x487565`, `0x4875d5`, `0x487652`, `0x4876c2` all sit inside `FUN_00486f50`.
- `FUN_00486f50` spans `0x486f50`–`0x4876ea`, 1,947 bytes. It is the HID output-report send routine (observation).
- One further reference at `0x639940` is in `.rdata`, outside any procedure — consistent with the import address table (inference).

### Decompilation of `FUN_00486f50` (this pass)

`rea function 0x486f50` succeeded. Ghidra pseudocode (decompiler-derived, not original source) shows:

- Entry guard `FUN_004b46c0()`; loop over `FUN_00449e80()` entries, fetching per-entry data through `FUN_00417fc0()`.
- For each entry it builds three 7-byte arrays (`abStack_44`, `abStack_34`, `abStack_24`) from bytes 0, 1 and 2 of that entry, multiplied by the entry's byte 3 and shifted right 8; each result is clamped to `0xf7`.
- It then issues **12** `HidD_SetOutputReport(handle, &local_14, 0x11)` calls — 17-byte output reports, not the 63-byte reportId 4 records in the repo capture. Do not equate the two report types.
- Command markers written into `local_13` before each send, in order: `0xaa22`, `0xad22`, `0xaa44`, `0xad44`, `0xab22`, `0xae22`, `0xab44`, `0xae44`, `0xac22`, `0xaf22`, `0xac44`, `0xaf44`. Inference: paired write/verify command IDs (`0xAA/0xAB/0xAC` with `+3` counterparts `0xAD/0xAE/0xAF`), with `0x22`/`0x44` selecting data width or bank.
- Seven bytes are copied into the report at offset `0x0d` before each send; `local_14` starts at `0xff`.
- Only one incoming reference: a **DATA** reference at `0x694a00` (in `.data`), with `source_procedure: null` — the function is reached indirectly through a function pointer, not a direct call.
- Callees: `HidD_SetOutputReport`, small helpers `0x417fc0`, `0x449e80`, `0x4839d0`, `0x4b46c0`, and `__security_check_cookie`.
- Unresolved call at `0x486ff0` (decoder sees a call, reference manager has no destination).

Observations vs inferences kept separate above. Unknowns: exact 17-byte report field layout, meaning of the `0x22`/`0x44` selector, and which indirect caller at `0x694a00` registers this routine.

Caller tracing attempted (this pass):

- `rea xrefs 0x694a00` returned an empty result.
- Raw byte scan for little-endian `00 4A 69 00` across the unpacked driver found 0 hits.
- Both are bounded negative searches: they do not prove the slot is unused. The indirect caller remains unknown.

Next options: identify the routine that writes the slot through a wider Ghidra script, or observe the vendor app at runtime (requires explicit approval to execute it), then correlate the 12 command markers with the 63-byte capture records.

## Work log (keep updated)

- 2026-11-18 — Started wider Ghidra scan for instruction operands containing the value `0x694a00`. Script: `E:\Tools\ghidra-dist\scripts\FindAddr.java`. Plan: import the unpacked driver once into a persistent Ghidra project at `E:\Tools\ghidra-dist\project` (name `ak820`), run the script, append results here.
- 2026-11-18 — First headless launch failed: `InvalidInputException: Failed to get canonical form of` the Unicode driver filename. Fix: copy the driver to ASCII path `E:\Tools\ajazz-rea\target.exe` (same SHA-256) and import that.
- 2026-11-18 — Headless import + full auto-analysis succeeded (439 s). Persistent Ghidra project now exists at `E:\Tools\ghidra-dist\project\ak820` (program `/target.exe`).
- 2026-11-18 — `FindAddr.java 0x694a00` result: `SCAN_TARGET 694a00`, `TOTAL_HITS 0`. Bounded negative: no instruction operand contains that exact value.
- 2026-11-18 — `FindAddr.java 0x486f50` result: `TOTAL_HITS 0`. No instruction stores the function address as an immediate either.
- 2026-11-18 — PE header decode confirmed the slot: raw file offset `0x293C00` maps to RVA `0x294A00` / VA `0x694A00` in `.rdata`, and the 4 bytes there are `0x00486F50`. So `0x694A00` is a real function-pointer slot, initialized by the linker/relocation rather than by an instruction immediate.
- 2026-11-18 — Next: scan for instruction scalars in the table region `0x694000`–`0x694FFF` to catch base-relative accesses to the slot.
- 2026-11-18 — `FindRange.java 0x694000 0x694fff` result: 158 hits across the region, but **no hit at `0x694a00` itself**. Nearest candidates are `0x694ae4`, `0x694abc`, `0x694ab4`, `0x694aac` used around `0x48e6ca`–`0x48e92c`. Conclusion: the slot is reached by computed table addressing, not a direct operand; caller still unknown. Both negative searches are bounded, not proof of absence.
- 2026-11-18 — Work log paused here. Persistent Ghidra project `E:\Tools\ghidra-dist\project\ak820` can be reused with `-process target.exe -noanalysis` for follow-up scans without re-import.
- 2026-11-18 — Started decompilation of candidate functions containing the `0x694Axx` region hits (`0x48e6ca`, `0x48e6d3`, `0x48e6e0`, `0x48e6ed`, `0x48e909`). Script: `E:\Tools\ghidra-dist\scripts\DumpDecomp.java`. Full output target: `E:\Tools\ghidra-dist\decomp-candidates.txt`. Status: done.
- 2026-11-18 — Decompilation result: candidates are constructors `FUN_0048e690` and `FUN_0048e8e0` for class `CEevisionKeyboardDevice`. They write `CEevisionKeyboardDevice::vftable` at object offsets `0x1bc`, `0x21a`, `0x21e`.
- 2026-11-18 — Symbol lookup: `CEevisionKeyboardDevice::vftable` labels are at `0x694aac`, `0x694ab4`, `0x694abc`, `0x694ae4` (plus `vftable_meta_ptr` immediately before each). `0x694A00` is 0xAC bytes before the first one, so it is NOT a `CEevisionKeyboardDevice` vtable entry. Symbol listing in `0x694000`–`0x694b00` shows many class vtables but no label at `0x694A00`.
- 2026-11-18 — Word dump `0x6949c0`–`0x694ac0`: `0x6949dc` onward is a contiguous array of code pointers (`0x483d40`, `0x484bf0`, `0x4876f0`, …, `0x486f50` at `0x694a00`, …, `0x487e20` at `0x694aa4`), followed by `0x694aa8 = 0x6a06b4` (RTTI pointer). Observation: `0x694A00` is one entry of a vtable/function-pointer table, not a standalone slot.
- 2026-11-18 — Operand scan for the inferred table base `0x6949dc` also returned 0 hits; no direct reference to the table base exists in code. Conclusion: the HID send routine is a virtual method; its callers dispatch through the vtable, which is why direct xref/operand searches found nothing. Inference: if the table starts at `0x6949dc`, `FUN_00486f50` is entry index `(0x694a00-0x6949dc)/4 = 9`. This index is inferred from the dump boundary, not confirmed by the compiler.
- 2026-11-18 — Work log complete for previous pass. No jobs running.
- 2026-11-18 — Started virtual-call-site scan: find CALL instructions whose operand contains displacement `0x24` (vtable slot 9). Script: `E:\Tools\ghidra-dist\scripts\FindVCall.java`. Output: `E:\Tools\ghidra-dist\vcall-scan.txt`.
- 2026-11-18 — Virtual-call scan result: 13 `CALL dword ptr [reg+0x24]` sites saved to `E:\Tools\ghidra-dist\vcall-scan.txt`. Several belong to unrelated ATL/DuiLib code (`AtlIAccessibleInvokeHelper`, `DockPane`, `OnDraw`, etc.); none confirmed to the `0x6949DC` table. Slot index 9 remains an inference.
- 2026-11-18 — Structured findings/artifact manifest saved to `docs/re-fresh-data.json` so results survive independently of this prose log.
- 2026-11-18 — Decompilation of the 13 vtable-call sites from `vcall-scan.txt` finished: 12 unique functions, 1,582 output lines saved to `E:\Tools\ghidra-dist\vcall-decomp.txt`. Searches of those bodies found no references to `FUN_00486f50`, `HidD_*`, `CEevisionKeyboardDevice`, or `0x6949xx`; the sites appear to be ATL/DuiLib UI code (`FUN_004c3ad0`, `FUN_004cc3e3`, `FUN_004df4a9`, `FUN_0058bb93`, etc.). Bounded negative: none confirmed as the caller. Exact dispatch path remains unknown.
- 2026-11-18 — Vote selected option 1: dynamic HID instrumentation. User explicitly approved executing the vendor EXE.
- 2026-11-18 — Proxy `HookDLL.dll` built (`E:\Tools\ghidra-dist\hook.c` + `hook.def`), patching IAT RVA `0x239940` (VA `0x639940`, confirmed by `inspect-pe-imports`). Original preserved as `HookDLL_orig.dll`.
- 2026-11-18 — Runtime attempt: vendor EXE executed with full payload extracted. App stayed running; hook logged `HOOK_ATTACH iat=0x239940 orig=OK`, proving the IAT patch works. **No `HidD_SetOutputReport` calls occurred** and `Get-PnpDevice` found no `VID_0C45&PID_1007` device. Conclusion: the send routine is device-gated; runtime marker mapping requires the physical keyboard to be connected.
- 2026-11-18 — Runtime mapping blocked on hardware. Moving to item 2 (offline capture cryptanalysis), no execution required.
- 2026-11-18 — Runtime hook extended to `WriteFile` (IAT RVA `0x239B7C`, decimal 2333564) after color clicks produced no `HidD_SetOutputReport` calls. The vendor app sends HID commands through `WriteFile`, not `HidD_SetOutputReport`.
- 2026-11-18 — Live traffic captured: 19 writes of 64 bytes to handle `0x600`, first byte `0x04` (report ID 4). Payload bytes match the 63-byte capture format and the additive checksum (`04 25 00 03 22 …` → checksum `0x25 = 0x03+0x22`). This is the ground-truth link between the vendor app and the saved capture.
- 2026-11-18 — Capture checksum solved. Script `E:\Tools\ghidra-dist\capture_crypto.py`, output `E:\Tools\ghidra-dist\capture-crypto.txt`: for all 46 command-shaped outbound records, `word = bytes[0] | bytes[1]<<8` equals `sum(bytes[2:]) & 0xFFFF` — 46/46 exact. CRC-16 variants, XOR16, and id-derived candidates all scored 0. Conclusion: bytes 0–1 are a 16-bit additive checksum, not a rolling sequence. This supersedes the earlier "sequence or checksum" ambiguity.
- 2026-11-18 — Echo confirmed: all 46 outbound command reports have an exact byte-for-byte inbound reportId 4 echo.
- 2026-11-18 — Refined phase statistics: byte 9 values are `2`×34, `3`×9, `4`×2, `1`×1; tail bytes 12–15 cluster as `(25,148,25,3)`×20 and `(255,0,138,3)`×22 (plus rare variants). Earlier "03 early / 02 late" wording was approximate.
- 2026-11-18 — Item 2 complete. Item 3 started and finished. Output: `E:\Tools\ghidra-dist\callees-decomp.txt` (250 lines).
  - `FUN_00417fc0(base, index)` = array lookup: `FUN_0040fcd0(base) + index*4`.
  - `FUN_00449e80()` = element count `(Bx() - FUN_0040fcd0()) >> 2`.
  - `FUN_004839d0(device, a, b, c)` writes device fields `+0xc78`, `+0xc7c`, `+0xc80`.
  - `FUN_004b46c0(device)` reads device field `+0x1898`.
  - Stranded call at `0x486ff0` resolved: indirect virtual call through object vtable slot `+0x114` (line 139 of the decompilation).
  - Refined decompilation shows HID handle at `param_1 + 0x8b4`; command word in `local_13`, payload copied to `auStack_1d + 0x0d`, report length `0x11` (17). Exact byte-by-byte layout still not fully named.
  - Reference-manager scan of every pointer in `0x6949DC`–`0x694AA4`: `TOTAL_TABLEREFS 0`. The table is accessed by computed indexing; owning class remains unknown.
  - All three planned items now done: 1 blocked on missing hardware, 2 solved checksum, 3 refined helpers but table owner unresolved.
- 2026-11-18 — Data-file pass finished. Full extracted summary saved to `E:\Tools\ghidra-dist\data-files-summary.txt` (85 lines).
  - `default_light.json`: 59 lighting entries, values -1..30. Values 6 and 21 coincide with capture envelope bytes `0x06`/`0x15`, likely coincidental.
  - `KeySetControl.xml`: 12 function-type IDs from `userdata` 0..11 = default, mouse base, mouse swing, mouse wheel, DPI, fire key, standard keyboard, multimedia, system, macro, cursor, combo/office. Matches the repo README's "12 function types".
  - `Keyboard.json`: VID `0x0C45`, PID `0x1007`, chip `VS11K34A`; `KeyList` has 126 entries. 32-bit `Assignment` values group by high 16 bits: `0x20` ×118 (keyboard), `0xA0` ×3 (mouse), `0xD0` ×5 (macro). Low 16 bits are usage codes (114 distinct).
  - Cross-check: no lighting value or function-type ID directly equals the command markers `0xAA..0xAF`, `0x22`, or `0x44`. The data files describe UI categories, not the USB command bytes.

- 2026-11-18 — LIVE BREAKTHROUGH (hardware connected, execution approved): extended hook to `WriteFile` (IAT RVA `0x239B7C`). Vendor app sends HID commands via `WriteFile`, not `HidD_SetOutputReport`. Captured 36 64-byte report-ID-4 writes; all 36 pass the additive checksum found offline. Full analysis: `E:\Tools\ghidra-dist\live-hid-analysis.txt`.
  - Each color-swatch click emits a triplet: `01 00 01 00…` handshake, color command, `02 00 02 00…`.
  - Color command layout: bytes 0–1 checksum, byte 2 `0x06`, byte 3 `0x1d`, bytes 8–10 `02 03 04`, **bytes 13–15 = R,G,B**, byte 27 `0xff`, byte 32 `0x02`.
  - Verified by clicks: red → `ff 00 00`, green → `00 d7 0f`, blue → `31 53 ff`, light blue → `00 99 ff`.
  - Saved capture uses byte 3 `0x15` and varying bytes 8–10, so it covers different operations; opcode meanings remain inference.

- 2026-11-18 — Lighting-mode mapping (partial). Full data: `E:\Tools\ghidra-dist\mode-apply-analysis.txt`.
- 2026-11-18 — Per-mode mapping attempted with fixed coordinate clicks and then keyboard selection. Result: unreliable — after the first apply the combo item positions/focus shifted, only one additional command was captured (`02 03 04`, `ff f0 05`), and the final keyboard action moved focus to Chrome/Save-As. Bounded negative: mode-name → byte8/9 mapping remains unresolved. All vendor processes stopped; no jobs running.
- 2026-11-18 — Button Settings probe finished. Full data: `E:\Tools\ghidra-dist\button-settings-analysis.txt`, screenshot `E:\Tools\ghidra-dist\button-settings.png`. Six command triplets captured, all still byte2 `0x06`/byte3 `0x1d`; bytes 8–10 were `01 03 04`, `01 01 04`, `01 02 04`, `01 02 03`. Byte 8 may identify the active UI page (0x01 here vs 0x02 color clicks, 0x08/0x05 apply). No key-remap protocol observed — the key click only re-sent lighting config. Bounded negative.
- 2026-11-18 — Wrote fresh protocol spec `docs/rea-protocol.md` and isolated reference module `src/reaFrame.ts` (build/parse/verify verified 64-byte frame, RGB at packet bytes 14–16). Module is not imported; `npm run lint` passes. No existing files were modified.
  - Selecting a mode in the combo changes the UI but emits no HID write.
  - Clicking the bottom device/save icon (~500,940) emits command triplets (`01` handshake, command, `02` handshake).
  - Emitted commands keep byte2 `0x06`, byte3 `0x1d`, byte10 `0x04`; bytes 8–9 vary (`08 04`, `08 03`, `05 03`); bytes 13–15 remain RGB.
  - The saved capture's byte3 `0x15` records were not produced; they are a different operation. Exact mode-name mapping remains unknown.

The earlier in-session REA bundle was reset and saved; use a fresh CLI process or re-import that bundle if those Evidence IDs are needed.
