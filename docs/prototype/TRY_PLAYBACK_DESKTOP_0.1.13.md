# Current desktop test: Open Play Playback Test 0.1.13

Launch **Start Open Play Current Test.command** or **Start Open Play Playback Test.command**. Window: **Open Play Playback Test 0.1.13 — controller mixing test**. It is open with After Hours124BPM and Glass Transit126BPM at00:00.0, both stopped, Master0. Package source0c2af74. Local desktop test approved; full Serato parity remains open.

The existing interface/audio engine is packaged in Electron. This build includes accumulated jog bend/touch, per-deck Quantize/transport modifiers, Sampler, Auto Loop/Roll/Beat Jump, Stems/Pitch inputs, Manual Loop fine editing, Scratch Bank, browser/Prepare/FX selection, actual Instant Double and the mutable effect-constructor baseline fix. That is implementation/package scope; only the native workflow below was executed here.

**When Jason returns, first action:** press the left Hercules Play button once, confirm deck1 starts and RCA speakers play, then stop with that same button. Continue one action at a time: right Play; faders/crossfader; gain/EQ/filter; headphone CUE; tempo pickup/jog; Sync with two playing tracks. No timed capture while away. Keep controller/headphones/speakers attached for physical checks.

The editor-installed v8 starter has266candidate assignments bound to the enumerated Hercules input; exact count/preset/single binding verified from an actual native mapping export. These are not266verified physical functions. The [semantics ledger](../research/HERCULES_MIDI_SEMANTICS_20261017.md) identifies inferred addresses and independent behavior choices. In particular several shifted/pad pages are hypotheses. No device SysEx/output/firmware/LED path or entitlement bypass.

Explicit native output selection applied: **Hercules master1/2, cue3/4, CueMix0%, CueVolume10%**. On restart, use Devices → Refresh outputs → named Hercules → Use selected output → Four channels → Apply channels. Output selection deliberately returns to stereo before explicit pair application. Do not assume a restored ID/socket route; analog speaker/headphone knobs and current physical isolation need human observation.

Executed on this exact package: all17declared served modules match package hashes and no-store responses; one main0.1.13 process. Actual MIDI editor enumerates Hercules, explicitly installs v8 and exports266maps. Labeled SYNTHETIC Notech2/7on starts1deck/Master0.09938293; original Note Off logged. Normal deck2Double starts the same playing source: both display00:29.6,2decks/Master0.1739961. Normal controls stop both, then reload A/B at starts, Master0. Meters/displayed times do not prove sample phase, socket sound or musical Sync.

No new physical response, current cue/master isolation, latency/quality, live compound pads/DSP, restart persistence, imported MP3 or full reference acceptance. Older0.1.1knob and0.1.3routing human confirmations keep their original scope. Browser recordings are separate evidence, not native passes. Full independent Claude audit unlaunched; no full feature/requirement promotion/public release.

Stable dedicated profile preserved at ~/Library/Application Support/Open Play Playback Test; an8MiB pre-switch copy is retained ignored under local-evidence/profile-backups/playback-before-0.1.13/. Original0.1.12app remains, with **Start Open Play Playback Test 0.1.12.command** and [historical guide](TRY_PLAYBACK_DESKTOP_0.1.12.md). Earlier apps/default original launcher remain available. Do not open0.1.12and0.1.13simultaneously: they share this test profile/port.

[Native observations](desktop-0.1.13-playback-observation.json) · [Package receipt](desktop-0.1.13-playback-package.json) · [Full plan](../../FULL_BUILD_PLAN.md) · [Current Claude handoff](../../handoffs/current.md).
