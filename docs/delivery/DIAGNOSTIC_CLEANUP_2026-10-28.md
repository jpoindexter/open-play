# Diagnostic cleanup — 28 October 2026

Removed 78 owned obsolete paths totaling **510,152,704 allocated bytes (~486.5 MiB)**: two old diagnostic app bundles, 74 regenerable diagnostic cache folders and two temporary prototype fixture files. The fixture files matched their retained ignored evidence copies byte for byte before removal. No corresponding diagnostic app process was running. This is file allocation accounting, not a measured APFS free-space gain.

Only the current 0.1.80 desktop bundle remains in the build root. Its ASAR SHA256 remains `48c879bb7b37b253687c78d400fd5f62e2df136df37592077c6ec5aa0c658f37`; all 241 normal-profile file hashes match before/after. Music, recordings, recovery profiles, unique evidence, stems runtime and toolchains were excluded. No Open Play names were found at the inspected top levels of Downloads or Applications; unrelated downloads were not touched. No main-app process or prototype server was observed during cleanup. The current app was not relaunched.

The owned stutter diagnostic's Stop/close/clear action returned “Stopped; frame closed; owned origin cleared”; its tab was closed. The user-facing workspace tab was retained. An older unreachable diagnostic tab could not be acquired for closure because the browser tool rejected its generated error-page URL; no bypass was attempted.

[Removal receipt](diagnostic-cleanup-2026-10-28.json). Private inventory and protected-profile hash manifests remain in ignored `local-evidence/cleanup-2026-10-28/`. Historical cleanup receipts remain linked from [build cleanup](BUILD_CLEANUP_2026-10-27.md).

## Preserved unfinished core work

The pending stutter presentation change replaces the final global deck redraw with the existing transport-only refresh. Its 25-line composed regression and prior red/green evidence remain preserved; this is a draft source checkpoint, **not a delivered or browser-accepted repair**. No DSP, rate or seek/start ownership guard changed. The current 0.1.80 package does not contain this draft.

Baseline browser execution retained only 114/355 controls and lost the other fader's focus after stutter; three library previews remained. The repaired comparison never reached stutter because the fixture timed out awaiting an advancing deck clock. Its `repaired.json` contains the literal `Ready`, not valid acceptance evidence. All raw baseline/setup artifacts stay in ignored `local-evidence/stutter-controls-2026-10-27/`.

Exact re-entry: restore the retained fixture only when resuming core work, confirm its isolated foreground audio clock advances, then execute the same playing/paused stutter action once and compare control identity/focus/previews. Leave the normal session and physical outputs protected. Do not rerun a broad suite or build another app before that observation.
