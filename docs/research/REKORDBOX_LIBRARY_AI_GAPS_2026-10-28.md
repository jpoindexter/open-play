# Rekordbox library and DJ preparation gap catalog

28 October 2026. Parent: [LIB-RB-02](https://trello.com/c/grXPc65W). Research/backlog delivery; no runtime implementation, desktop build or full parity claim.

## Evidence

Installed rekordbox **7.2.19.0342**, executable SHA-256 `07dcecbaf304f777e435539c83c7dcc02e41de1eaf2e0a75e8a9852e4411a244`. Captured main library, Information, My Tag, Related tracks, Track Suggestion and Automix surfaces with REA's standalone native helper. Each PNG/AX capture retained target PID, executable hash and window identity; 280/281 nodes, no reported truncation/gaps. Qt custom controls still omit labels from accessibility, so “no gaps” does not mean every visible control is semantically exposed. Native menu inventories supplement screenshots; disabled commands were not executed.

Reused the isolated 512 MiB size-guard expansion documented in the [analysis inventory](REKORDBOX_SONG_ANALYSIS_2026-10-28.md). Installed REA unchanged. Raw standalone-helper captures are **not authenticated MCP evidence records**. REA MCP's old Hopper cleanup remains unresolved; no compiled vendor algorithm/weights extracted. Full Hopper Python works, but disassembly is unnecessary for this feature inventory.

Private capture directory: `local-evidence/rekordbox-library-catalog-2026-10-28/`. Compact committed [manifest](rekordbox-library-captures-2026-10-28.json) contains source/capture hashes. Reference transport remained paused; no analysis, tags, files, playback or cloud preferences changed. Inspected optional panels closed after capture. Some custom tab/coordinate input could not route; no repeated clicking or artwork edits attempted.

Prior analysis screens and phrase/vocal/automatic-cue work remain in [ANA-RB-01](https://trello.com/c/sVY7Iy9c); this catalog extends them rather than creating duplicates.

## Capability mapping

Statuses refer to the inspected Open Play source, not newly executed feature acceptance. “Partial” is deliberately not a passing parity claim.

| Capability | Reference / observed surface | Open Play status and owner |
|---|---|---|
| Embedded title, artist, album and other tags | Information summary, table columns; Reload Tag in native Track menu | **MISSING import path**: app.js importLocalFiles uses filename / Local file / Imported. Manual metadata edits exist. [LIB-002](https://trello.com/c/yeToZypO), now Next. |
| Cover art | Artwork column and Information Artwork tab; summary displays placeholder cover | **MISSING inspected extraction/schema**. Add bounded embedded/local artwork, persistence and fallback to LIB-002; optional online matching belongs LIB-018. |
| Technical file information | Actual selected House 3 summary includes format, duration, sample rate, bitrate, size, path and play count | **PARTIAL** metadata/duration/counts. Complete safe information presentation under LIB-002/003; don't invent imported artist/album. |
| BPM / beatgrid / dynamic timing | Prior real Analysis capture; loaded deck/grid controls | **PARTIAL** existing ANA-002/003; reference accuracy is unproven. |
| Musical key detection and notation | Prior real KEY analysis setting and optional ID3 write | **PARTIAL** existing chroma/profile estimator in analysis.js. [ANA-004](https://trello.com/c/hFi94aYW) owns annotated music accuracy, tuning/ambiguity, notation and preserved manual edits. |
| Gain / loudness | Prior analysis/deck reference | **PARTIAL** existing ANA-005; no vendor DSP extraction. |
| Phrase, vocal regions, automatic cues | Prior Track/CUE Analysis captures | **MISSING parity**; ANA-008/009/010 already created, unchanged. Vocal regions differ from vocal stem audio. |
| Waveform previews | Main library Preview column and deck overview visibly present | **PARTIAL / PRESERVE** existing ANA-001, ANA-FIX-09, LIB-RB-01; this request does not change renderers or remove previews. |
| Custom DJ labels and facets | Actual My Tag panel shows Genre and Components lists | **MISSING persisted taxonomy in inspected schema**. [LIB-019](https://trello.com/c/EBKotA4L) for configurable tags, batch changes and filtering; distinguish user tags from inferred labels. |
| Intelligent playlists | Native Playlist menu contains Create New Intelligent Playlist (disabled in inspected context); official manual explains rules | **PARTIAL** existing all/any live/cached smart rules in library.js. [LIB-005](https://trello.com/c/rm5hdCAS); no second rule engine needed. Some rule-named fields lack persistence. |
| Playlist/folder organization and export | Native Playlist menu includes folders, ordering and txt/m3u8 commands, disabled in inspected context | **PARTIAL** LIB-004/009/012. No successful vendor export claim. |
| Related tracks and suggestions | Actual separate Related tracks / Track Suggestion panels; latter exposes Collection / Auto and master/deck selection | **MISSING recommendation parity** [ANA-011](https://trello.com/c/AI1s2q7o). Results/settings not exercised. |
| Metadata vs sound recommendations | Official FAQ distinguishes metadata Era/Mood/Association from AI-learned Radar similarity | Use metadata rules first, optional similarity ranking later. Don't label all suggestions as audio AI detection. |
| Relink / relocate / duplicate identity | Track menu Relocate / Auto Relocate; no relink executed | Existing LIB-006/007/015; preserve path vs content vs recording-version distinctions. |
| Prepare, History, ratings and key-friendly search | Native collection/library plus documented preparation workflow | Existing LIB-003/008/013/016; scoped partial history evidence remains its own acceptance. |
| Automix | Actual empty Automix panel accepts playlist; start never pressed | Existing sequential Autoplay is not automatic-transition parity. [DEK-021](https://trello.com/c/O5FKMea4) separately scoped after reliability, DEK-014 retained. |
| Audio-based recording identification | Not established in inspected rekordbox surfaces/docs | **USER-REQUESTED ADDITION**, [LIB-018](https://trello.com/c/BmuIW33J). Fingerprint lookup is different from key, genre, structure and file hashes. |
| AI set creation | Proposed Open Play workflow, not claimed extracted vendor feature | **PROPOSAL**, [AI-001](https://trello.com/c/IYx831ny). |
| AI crate organization / natural-language library intent | Proposed Open Play workflow | **PROPOSAL**, [AI-002](https://trello.com/c/11nDJse3). Reuse smart queries; preview/accept/undo. |

This is a bounded catalog of analysis/library/preparation surfaces and named extensions, not every license tier, settings permutation, controller, streaming provider or hidden rekordbox implementation. Existing full-scope/reference registers continue to own broader parity.

## Practical implementation order

1. **Core reliability stays first.** Do not turn this list into 20 new beta blockers. Keep current Sync/pop/queue issues and deferred listening/hardware gates explicit.
2. **Preparation foundation next:** import correct embedded tags and artwork (LIB-002); validate musical-key quality (ANA-004); persist richer facets before using them for recommendations. Preserve source files, user corrections, backups and audio responsiveness.
3. **Optional assistance later:** local related-track ranking, then reviewable set/playlist and crate proposals. Acoustic ID needs provider/terms evidence; Automix requires its own transport/listening acceptance.

Key detection is already implemented in source. “Song detection” now has separate cards for recording identification, musical key, phrase structure, vocal regions and optional genre/mood/energy inference; those are different capabilities and confidence levels.

### Identity and artwork route

First read embedded tags/covers locally. A missing cover does not justify guessing an album from a song title.

Possible later route: local Chromaprint fingerprint → explicit AcoustID lookup → candidate MusicBrainz recording/release → cover matched to a release ID. [AcoustID](https://acoustid.org/webservice) requires application registration, limits public service to three requests/second and noncommercial use; commercial integration needs separate terms. [Cover Art Archive](https://musicbrainz.org/doc/Cover_Art_Archive) indexes artwork by release ID and does not grant blanket image rights. No provider selected, account/key created, track uploaded or lookup executed.

Require confidence and provenance, remix/live-version disambiguation, no-match state, per-field review, undo, safe image bounds/decoding/cache and no silent tag write-back. Offline playback must survive all provider failures.

## AI fit: help prepare sets, preserve DJ control

**Job:** reduce searching and organizing while the DJ selects a coherent next track/set. Manual filtering costs time; deterministic smart rules are the baseline. AI earns its place for interpreting intent and ranking/sequence suggestions, not clock/Sync decisions or facts.

Smallest experiment: “Build a 90-minute warm-up, 118–123 BPM, vocal-light, avoid yesterday's set.” Existing rules prefilter available local track IDs; optional AI interprets/ranks; deterministic validation checks hard constraints. Show ordered candidates with reasons, unknowns and conflicts. DJ edits, accepts or rejects. Natural-language search shares this intent path.

Crate assistant proposes hierarchy/membership/rule changes as a diff. Preserve cues, grids, artwork, history and edits; conflict-check against changes since proposal; undo the accepted transaction. Never delete originals or invent BPM/key/genre/availability. User labels and inferred properties stay separate.

Compare a rule-only prototype against assisted results using actual collection and later DJ review: usable-set rate, constraint failures, edit/review time and accepted changes. No fabricated quality/latency/cost targets. Before service selection, measure bounded time/cost per request, cancel/background priority, cache and failure handling; prefer local metadata and explicit data minimization/consent. No private audio sent by default. Offline rule-only operation remains useful.

No model/provider choice or cloud deployment is required to finish this catalog.

## Trello reconciliation and delivery proof

- Created six distinct cards: catalog parent, fingerprint identity, custom tags, AI playlist/set assistant, AI crate assistant, Automix.
- Updated seven existing cards: LIB-002/003/004/005, ANA-004/011 and ANA-RB-01. Existing full criteria/history/model guidance remain verbatim beneath current status.
- LIB-002 moved Later → Next; core queue and every completion/archive state preserved.
- Explicit status headings mark MISSING / PARTIAL / PROPOSAL / REFERENCE CAPTURED; unused unnamed color labels would not communicate these distinctions.
- Board reread: **199 → 205 cards; 17 complete unchanged**. Exact changed descriptions, unique new names, list destinations and untouched descriptions/dispositions checked.
- [Readback receipt](../delivery/REKORDBOX_LIBRARY_AI_TRELLO_2026-10-28.json). No runtime code, tests, desktop build or main session changed.

## Official sources

[rekordbox manual 7.2.14](https://cdn.rekordbox.com/files/20260409151936/rekordbox7.214_manual_EN.pdf), especially library information/artwork, My Tag, related/suggested tracks, Intelligent Playlists and Automix; older than installed 7.2.19.0342.
[rekordbox 7 FAQ](https://rekordbox.com/en/support/faq/rekordbox7/) supports the metadata-versus-Radar distinction.
Actual installed captures support visible panel/menu claims; documentation supplements semantics and does not prove Open Play parity.

