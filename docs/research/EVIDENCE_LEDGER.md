# Serato reference evidence ledger

Updated 2026-10-16. Reference: Serato DJ Pro 4.0.10, build 4.0.10.213. This is an investigation record, not an assertion of completed feature parity.

| ID | Evidence class | Finding | Boundary |
|---|---|---|---|
| E001 | FILE-VERIFIED | Installed bundle identifies 4.0.10.213; executable contains arm64 and x86_64 slices. | Bundle metadata does not prove every bundled path executes. |
| E002 | FILE-VERIFIED | Desktop contains installers 4.0.9 and 4.0.10; hashes recorded in reference-inventory.json. | Older installer has not been installed or behaviorally compared. |
| E003 | FILE-VERIFIED | REA Mach-O inspection reports Qt 6.3.0, CoreMIDI, libusb, IOKit, CoreAudio/AudioToolbox, libmp3lame, libtensorflow and Accelerate dependencies. | Imports do not establish implementation algorithms, routing, model identity or reachable features. |
| E004 | OBSERVED | Native Serato window displayed Library and Vertical views, two decks, cue/loop controls, library and streaming entries. | No causal automated interaction test established; screenshots contain private library information and remain outside the repository. |
| E005 | OBSERVED | Native UI displayed a trial with two days remaining. | This is local account state, not proof of the user's historical entitlements. |
| E006 | DOCUMENTED | Official manual API returns 168 articles in 23 sections; metadata saved in manual-index.json. | Enumeration is not complete semantic review; expansions and hardware guides extend this corpus. |
| E007 | OBSERVED | CoreAudio enumerates DJControl Inpulse 300 Mk2, four output channels, current 44,100 Hz sample rate. | No independent master/headphone output or latency test has been executed. |
| E008 | OBSERVED | IOUSB enumerates the connected device with vendor 1784 (0x06f8), product 45359 (0xb12f), device revision field 512, link speed 12 Mbps. | USB revision fields do not prove user-facing firmware version or control mapping. |
| E009 | OBSERVED | CoreMIDI enumerates one source and one destination named DJControl Inpulse 300 Mk2, manufacturer Guillemot Corporation. | Enumeration does not establish incoming control bytes, LED output behavior or timing. No MIDI output sent. |
| E010 | DOCUMENTED | Serato's device page labels this controller as Serato DJ Lite included and a paid upgrade for DJ Pro. | Does not substantiate the claim that this model previously unlocked Pro for free. |
| E011 | UNKNOWN | Hopper REA deep analysis timed out while Hopper Demo was still creating procedures. | No procedure-search result or decompilation claim is supported by that attempt. |
| E012 | OBSERVED | User confirmed Hopper is a demo and selected Ghidra. Ghidra 12.1.4 is installed. | REA rejects universal Mach-O with Ghidra; a local arm64 extraction is used for analysis. Original app unchanged. |

## Read-only binary analysis provenance

- Full executable SHA-256: `1df36a8907bf3034b174aeab7c6ceb46a87493f78704c14934eb7210e3fdd2f5`.
- Extracted arm64 SHA-256: `3c97facac6bc4928d4b3f757ea788b52c1f49bfa05932938cfa995874445abb4`.
- REA Mach-O retained evidence: `ev_91e20b69bb974c74fb03946a4de2283d2355526c8b2b6294a828988023ed78a1`.
- Dependencies evidence: `ev_25b5c72ead405d430980408471932a1abb52d89d8ca13f57baf6d5bec6f0a1da`.
- Original binaries, extracted slices, disassembler projects, raw official article bodies and private screenshots stay in ignored local evidence. Only original findings and public-source metadata are published to the private project.

## Primary sources

- [Official manual](https://support.serato.com/hc/en-us/categories/202698038-Serato-DJ-Pro-manual)
- [Current release](https://serato.com/dj/pro/downloads)
- [Hercules Inpulse 300 MK2 device page](https://serato.com/dj/hardware/hercules-djcontrol-inpulse-300-mk2)
- [Hercules Lite quickstart](https://support.serato.com/hc/en-us/articles/10327860913423-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide-Lite)

## Open proof obligations before prototype parity can be claimed

1. Reconcile all manual controls and states with 4.0.10, including historical-version notes.
2. Add expansion manuals, release changes, hardware quickstarts and platform-dependent behavior.
3. Trace hardware enumeration, input dispatch, audio routing and capability decisions as far as available evidence permits; clearly separate imports, static paths and runtime proof.
4. Observe connected-controller input and master/headphone paths with the user's participation, without altering firmware or mappings.
5. Compare each screen/state/shortcut to the reference and record unavailable states individually.
6. Keep every unresolved parity item visible. A screen mockup or a source-code dependency is not device compatibility.
