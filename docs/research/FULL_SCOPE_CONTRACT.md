# Full Serato DJ Pro scope contract

**User requirement, 16 October 2026:** “we need to include everything serato does”. The reference is Serato DJ Pro for macOS, including its expansions and connected workflows. The installed baseline is 4.0.10.213. Historical features and discontinued integrations receive explicit dispositions rather than disappearing from the plan.

## No silent scope cuts

The current 110 groups are organizational containers, not a ceiling. The 354 interaction requirements are a growing inventory, not a completeness score. Add a requirement whenever investigation discovers another behavior. Add a feature group and Trello card if the behavior cannot be meaningfully represented by an existing group.

Include primary and secondary actions, modifier keys, contextual menus, labels and units, parameter ranges, stored defaults versus session values, persistence, disabled states and reasons, cancellation, recovery, library/content dependencies, device-specific modes, provider dependencies, and behavior across layouts. Matching only a main screenshot or offering a generic button for a complex feature does not satisfy this contract.

## Coverage domains

| Domain | Required coverage |
|---|---|
| Library | Local formats, artwork/tags/ratings, sorting/search/columns, crates and smart rules, nesting/favorites/colors, Prepare, History, file moves/rescan/relocation, external volumes, duplicates, metadata locks, backups, import/export and migrations |
| Analysis | Waveforms, BPM/ranges, key, gain, downbeats/bar/beat markers, variable grids, manual edits, locks, queue/import/load triggers, cancellation and prepared stems |
| Decks | Offline/Practice/Play and hardware layouts, 2/4-deck focus, load/eject, transport, temp/hot cues, cue colors/names/order, tempo/key, sync states, jog/scratch/nudge, beat jump, manual/auto/saved loops, roll, slicer, slip/reverse/censor, instant doubles, repeat/autoplay |
| Mixing/audio | Gain/EQ/filter, channel/crossfader curves and assignment, cue/master/split cue, meters/clipping, internal/external routes, device/buffer/rate, microphones/aux, virtual outputs, hot plug, conflicts, clocks and recovery |
| FX | Every named DJ FX, separate Channel FX, bank/slot assignments, timing, wet/dry, each advanced parameter, favorites/presets/reset, stem FX and hardware gestures. The 59 observed DJ effect names each have an individual requirement. |
| Performance expansions | Stems and caches, sampler banks/slots/modes/outputs/advanced controls, Scratch Banks load settings/return, Flip record/edit/play/loop/save, Pitch Play/key sync, Link session/sync behavior, Play shortcuts and mixer |
| Video | Audio/video linking, media handling, decks, mixing/transition effects, text/image overlays and presets/animation, external display, output/control settings, aspect/crop/quality, recording, synchronization, unsupported media and recovery |
| Hardware | USB identity and attach lifecycle, MIDI encodings/learn/remap/presets/feedback, HID/CDJ/media-player modes, turntable/DVS calibration and ABS/REL/INT/THRU/WIR, changeover, emergency fallback, controller-specific modes and hardware limitations |
| Streaming | Each provider independently: authentication callback, subscription/region/account failure, playlists/search/crates, quality, analysis/metadata identity, offline cache if available, capabilities/restrictions, catalog removal, migration and reconnect |
| Shell/preferences | Every layout, all Setup tabs and conditional controls, menus, tooltips/help/shortcuts, day mode/scaling/text/Unicode, keyboard focus, loading/empty/error states, account/reference entitlements and their intended account-free Open Play equivalents |
| Lifecycle | Installation/permissions/update/rollback, session persistence/crash recovery, diagnostics, provenance, extensions/mappings compatibility, long-session resources and offline operation |

## Required per-feature record

Stable ID; version-qualified source; reference screen and entry point; control/action; preconditions; normal/alternate/failure result; persistence; hardware/provider dependencies; evidence class; unresolved details; planned HTML destination and simulated behavior; native acceptance test; Codex model/effort; Claude Code model/effort; Trello card; current implementation/verification status.

An entry marked UNKNOWN is retained work, not completed parity. Every missing detail needs a specific next evidence action. No percentage based only on article or feature counts may be presented as functional completeness.

## Prototype and native gates

Jason approved documented/simulated representations of unavailable hardware, streaming accounts and audio algorithms. Clearly distinguish actual browser interaction from simulated transport/audio/device/provider results. The simulation must represent the inventoried controls and workflows; it cannot replace missing inventory with an invented generic flow.

Before presenting the HTML as full-scope, run every planned prototype route and scenario, retain a route-to-requirement manifest, and list unrepresented or unresolved items first. A visible feature label, a toast, or a static panel alone is not implementation of its workflow. Do not call a partial prototype full parity.

Native development requires Jason's approval of a specific prototype revision. Prototype approval does not establish audio quality, timing, protocol compatibility or physical output routing.

## Intentional product differences

Local functionality is account-free and has no artificial paid tiers, activation checks, trial expiry or paid hardware allowlist. Original project identity and independently authored implementation are required. External provider access and physical/technical constraints remain explicit dependencies, not promises of free third-party service or universal device support.
