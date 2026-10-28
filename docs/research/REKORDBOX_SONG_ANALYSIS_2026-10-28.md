# rekordbox song-analysis inventory

28 October 2026. User-requested feature catalog/backlog, not new analysis implementation or a parity claim. Installed rekordbox **7.2.19.0342**, executable SHA-256 `07dcecbaf304f777e435539c83c7dcc02e41de1eaf2e0a75e8a9852e4411a244`.

## Evidence and boundaries

Observed the actual Preferences → Analysis → Track Analysis and CUE Analysis screens. Three standalone REA native-helper captures contain 77 / 60 / 73 nodes, each untruncated with no reported gaps. Screenshots also retain disabled fields absent from AX. CUA supplied supplemental labels/tooltips. No songs were analyzed, settings enabled, tags written or audio started. Returned Preferences to its original View / Display Type category and top scroll position.

The current REA MCP capture rejects this 301,587,792-byte executable at its 256 MiB guard. Reused the user's previously authorized 512 MiB expansion **only in an isolated copy** of REA 6.8.0's helper. Executable hash, PID/window identity and permissions checks remain; installed REA files are unchanged. These are raw standalone-helper captures, **not authenticated MCP Evidence records**. Provenance/hashes and original JSON/PNG live in ignored `local-evidence/rekordbox-analysis-2026-10-28/`.

REA's Hopper string-analysis startup hit the license prompt and timed out. The owned Hopper process was subsequently terminated after normal Quit did not close it; process absence was observed. REA still reports an unacknowledged cleanup record and retains `/private/tmp/rea-6KmsVc`; it was not erased or forged. No algorithm disassembly was obtained. No unrelated app/session was closed.

## Catalog and Open Play mapping

“Observed” means visible controls, not verified algorithm quality. Documentation-only details are distinguished below; manual version 7.2.14 is older than the installed build.

| Capability | Reference evidence | Open Play disposition |
|---|---|---|
| BPM and beatgrid analysis | Observed selectable BPM / Grid output | Existing ANA-002 / ANA-003; improve measured coverage/metrical ambiguity, preserve edits. |
| High-precision beatgrid option | Observed, currently off | Add a quality/runtime specification to ANA-002/003; no vendor accuracy claim. |
| Fixed / varying / automatic tempo analysis | Normal observed; Dynamic/Auto and precision prerequisite documented | Existing drift proposals are not full automatic dynamic-grid parity. ANA-002/003. |
| BPM search range | Observed 70–180 selection | Existing ANA-007; retain range/half-double policy and per-track override. Full reference option enumeration pending. |
| Musical key | Observed independent KEY option | Existing estimator in analysis.js; ANA-004 owns accuracy/ambiguity and notation. |
| Key metadata write-back | Observed optional ID3 write, off | ANA-004 / LIB-002; preserve source files unless separately authorized. |
| Phrase / song-structure analysis | Observed independent Phrase option | New ANA-008: boundaries/types, editable overlays and persistence. |
| Vocal-position detection | Observed independent Vocal option | New ANA-009: timestamp regions and waveform overlay, separate from stem separation. |
| Waveform and full-track preview generation | Native library/deck reference plus manual | Existing ANA-001 / ANA-FIX-09; retain readable previews and main waveforms. |
| Auto Gain / level measurement | Main-deck tooltip and manual grid-panel Auto Gain | Existing ANA-005; Open Play PCM gain/LUFS already exist, exact vendor method unextracted. |
| Analyze on import / selective reanalysis | Observed auto-analysis switch and independent outputs | Existing ANA-007; cancellation/priority stays ANA-006. |
| Analysis protection | Manual describes lock/reanalysis behavior | Preserve reviewed grids, key and cues; ANA-003/007. Do not duplicate a lock feature already present. |
| Processing priority | Observed Performance / Normal / Power saving; Normal selected | ANA-006; protect four-deck playback before background throughput. |
| Cloud-assisted analysis | Observed participation/upload option, already on | Parent backlog only; no Open Play service/upload authorized. Local-first behavior remains. |
| Radar / musical-similarity data | Observed Radar switch; recommendation semantics documented | New ANA-011; local Collection similarity first, provider integration separately scoped. |
| Cue analysis: fixed rules | Observed Manual, Hot/Memory cue choices, 1.1Bars | New ANA-010; configurable limits and bar spacing, review before applying. |
| Cue analysis: learned preferences | Auto is visibly locked on this installation; personal/overall preferences documented | ANA-010 later stage; independent implementation, not copied vendor models. |
| Cue overwrite protection/comments | Visible disabled controls in CUE screenshot | ANA-010; default to preserving user cues, make proposed changes explicit. |

Reference CUE screenshot shows limits of 4 and bar spacing 8 as current field values, not global maximums. Auto and several cue options display lock symbols; no license change was attempted. Vocal position detection is not equivalent to vocal stem audio. Library tags such as artist/title/genre are not evidence of automatic song identification or genre detection; those claims remain unestablished.

## Delivery order and acceptance

1. **Core:** existing BPM/grid, key, gain, selective analysis and cancellation cards. Use varied real tracks and clear unsupported/ambiguous states; preserve manual values, current audio, deck controls and library previews.
2. **Preparation:** phrase and vocal proposals, then rule-based automatic cues. Version analysis data; review/reject proposals without changing current playback or overwriting edits.
3. **Later:** learned cue preferences, similarity/recommendation data and any separately approved cloud/provider work. These do not block the immediate core mixing acceptance.

Each implementation needs its actual settings, output schema, progress/cancellation/error states, cache invalidation and affected native workflow recorded. Visible reference controls do not prove detection accuracy. No proprietary DSP/weights/assets are copied. This catalog covers the inspected analysis surfaces and named documented extensions; hidden feature completeness and numerical equivalence remain unknown.

## Hopper decision

UI capture, shipped metadata and official documentation answer this inventory question. Hopper is useful for a separately scoped compiled-code question, but its availability does not establish algorithm quality or solve the native capture size guard. The first attempt used a demo copy and reached its activation prompt. Jason subsequently installed full Hopper 6.6.0 in `/Applications`. Its stale Xcode PythonPath was corrected, with Hopper closed, to the existing Command Line Tools Python 3.9 framework. Restarted that full app and executed `print('HOPPER_PYTHON_OK', __import__('sys').version.split()[0])`; the native log returned `HOPPER_PYTHON_OK 3.9.6`. No Python/Xcode installation, license-key handling, vendor disassembly or Open Play runtime change was needed. Full-app Python availability does not clear the earlier REA cleanup record or prove the REA launcher uses this new copy. [Official features](https://www.hopperapp.com/) and [demo restrictions](https://www.hopperapp.com/download).

Trello parent: [ANA-RB-01](https://trello.com/c/sVY7Iy9c). New work: [phrase](https://trello.com/c/ncGGD5qa), [vocal regions](https://trello.com/c/VDSh4lnG), [cue analysis](https://trello.com/c/fFYcpx3y), [similarity](https://trello.com/c/AI1s2q7o). Existing ANA-002–007 cards are linked without replacement; all criteria/history/model recommendations preserved. Board readback: 199 cards, 17 complete; no unsupported closures.

Sources: [official rekordbox manual, pp. 14, 35–44, 230–231](https://cdn.rekordbox.com/files/20260409151936/rekordbox7.214_manual_EN.pdf), [rekordbox 7 FAQ](https://rekordbox.com/en/support/faq/rekordbox7/), [rekordbox 7 overview](https://rekordbox.com/en/feature/overview/). Local captures take precedence for the actual installed settings; documentation supplements capability meaning only.
