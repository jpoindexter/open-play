# Binary investigation findings

2026-10-16. Reference: Serato DJ Pro 4.0.10.213, arm64 slice SHA-256 `3c97facac6bc4928d4b3f757ea788b52c1f49bfa05932938cfa995874445abb4`.

## Tool execution

REA 6.5.0 with Ghidra 12.1.4 completed default auto-analysis and a procedure-name search after increasing the process-local Java heap from 2 GiB to 8 GiB and the startup budget to 1,200 seconds. The Mac reports 48 GiB of physical memory. No installed application or persistent Java setting was modified.

The initial universal Mach-O request was rejected because this provider requires a selected thin slice. The initial thin-slice pass exhausted Java heap and timed out. The successful retry used a local `lipo -thin arm64` extraction. Ghidra emitted decompiler warnings during analysis; successful analysis does not make every inferred function boundary or decompilation correct.

Evidence: `ev_1d908e123485ec887e8e02ee0f91f52d8096bf57a28f3c4ccbb67d02278feea8`. The retained result and snapshot live under ignored local-evidence. REA's imported Ghidra project is ephemeral and is deleted on provider close; the snapshot caches completed queries, not a persistent full Ghidra database.

## File-verified MIDI path

Ghidra identifies named import stubs for CoreMIDI source/destination enumeration, input/output port creation, endpoint connection, MIDI packet handling and sending. A bounded ARM64 direct-branch scan was then cross-checked with Apple's LLVM disassembler. This goes beyond the existence of imported names while still remaining static evidence.

| Finding | Static locations | Interpretation boundary |
|---|---|---|
| Input count queried, source index bounds checked | Function-start record `0x1009e5834`; count call `0x1009e58a8` | Candidate port-open routine, not proof that this path handled the connected Hercules |
| Input callback registered | `MIDIInputPortCreate` call `0x1009e58f4`; callback argument resolves to `0x1009e5ccc` | Callback address is visible in argument construction; downstream mapping not yet established |
| Selected source connected | `MIDIGetSource` at `0x1009e5a58`, `MIDIPortConnectSource` at `0x1009e5a6c` | Nonzero endpoint and API result branches are visible; runtime outcomes unobserved |
| Failure cleanup | Port/client disposal branches after connection failure | Supports an error-handling path, not fault-injection validation |
| Separate source/destination enumeration loop | Function-start record `0x100b0bb70`; branch chooses source or destination APIs and loops over count | Result-building helpers are not fully identified; device-capability decisions remain unknown |
| MIDI output call | `MIDISend` call `0x1009e7fa8` within function-start interval beginning `0x1009e7dc4` | Supports outbound MIDI capability, not a specific Hercules LED/display protocol |

Nearby diagnostic strings identify the first routine as a CoreMidiIn port-open path and distinguish existing-connection, missing-source and port-creation errors. They do not identify the manufacturer-specific mapping layer.

The binary's LC_FUNCTION_STARTS data contains 164,990 entries. Scanning immediate ARM64 B/BL instructions against the Ghidra MIDI/USB stub results found 113 matching direct branches. This is a bounded search, not a complete call graph: indirect calls, callbacks and dynamically resolved targets are excluded. The scope and raw results are retained locally.

## Important disassembly limitation

LLVM sometimes prints the nearest preceding exported C++ symbol as a heading for a large region. That heading is not the true name of every stripped function in the region. Function addresses above come from LC_FUNCTION_STARTS and explicit call instructions; no arbitrary nearby symbol has been presented as a recovered source function name.

## What remains hidden or unresolved

- Vendor/model matching and the complete Hercules mapping/feedback tables.
- CDJ HID negotiation, DVS algorithms, Phase-specific paths and hardware activation decision flow.
- Exact audio-engine scheduling, resampling/stretching algorithms, internal buffers and latency under load.
- Stem network identity, weights, training data and quality/performance characteristics. TensorFlow linkage alone proves none of these.
- Packed resource contents and the exact full effects/parameter catalog. The effect-manifest file is present but a basic format/string probe did not reveal a readable catalog.
- Remote service behavior, account-side policies and historical feature-entitlement changes.

No activation patching or entitlement bypass was attempted. The purpose is an independent implementation with documented behavior and original code/assets.

## Re-entry

Use the retained hashes and call-site evidence to target the callback and device-specific decision paths. For sustained Ghidra exploration, keep a persistent local project or a single provider session instead of repeatedly importing the entire binary for one CLI query. Keep all recovered code and original artifacts outside Git; publish original behavioral findings with their proof limits.


## Supplementary Hopper attempt

A later REA function-dossier request remained blocked by the previous Hopper bridge startup/cleanup failure. Native inspection showed the demo/license chooser. Try the Demo was selected within the user's authorization; Hopper then showed an empty document. REA still could not confirm authenticated bridge shutdown. No additional decompilation result was obtained, and the retained temporary runtime was not force-deleted. Ghidra and the retained LLVM cross-check remain the usable binary evidence. Buying Hopper is not a prerequisite for continuing the Ghidra investigation.
