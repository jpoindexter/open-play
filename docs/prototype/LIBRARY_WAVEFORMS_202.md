# Library waveform previews — HTML202

19 October 2026. Native-style library Preview column now uses actual decoded-source RGB waveform thumbnails. No app rebuild, player/audio engine/MIDI/source renderer changes. Existing four-deck mixer and layout remain intact. User visual approval pending.

## Behavior

Preview sits between status and title, at160px column width with150×22px source waveform images. Every row uses that track's source audio, including original local MP3s; generated demo tracks use their own decoded demo buffer. Static thumbnails support scanning track structure/frequency content, not undocumented audition/seek controls. Image alternative text identifies the track; queued, preparing and unavailable/retry states replace empty rectangles. The existing Columns dialog includes a keyboard-operable Preview waveform checkbox, with visibility saved separately for this HTML preview. Other layout variants retain their existing columns.

One visible-row job runs at a time. Existing decoded buffers/profile cache are reused. Unloaded local files decode into a temporary OfflineAudioContext, without loading a deck, playing audio, storing another full-song buffer in the engine or changing metadata. PNG thumbnails use this origin's local CacheStorage; bounded512-entry disk/256-entry session caches may evict old thumbnails, which regenerate on demand. There is no track-count feature gate or external service/upload. Cache identity uses local content hash or demo generation parameters. Blocked storage falls back to session thumbnails; missing/undecodable files show unavailable and Retry.

## Executed evidence

The actual running HTML page rendered ten distinct track-bound thumbnail entries, including two user-imported real MP3s with loaded320px image data. The two MP3 waveforms are visibly different. Title sorting reverses row order while preserving each track ID → same image URL association. Search filters to the two real tracks without remapping thumbnails. Header and row cell counts match. Preview hide/show via Columns executed with both native checkbox and keyboard Space; hidden preference survives reload. Restored previews after reload report local-cache and load image data without repeating audio analysis. Deck titles and paused clocks stay unchanged during thumbnail generation/sort/filter/visibility operations. Four-deck switching retains both real previews; Hybrid hides the added column and returning to rekordbox restores it. Final view is four-deck Vertical Full, both local MP3s loaded A/B paused, C/D empty and library filtered to Trax Records to show both previews. See LIBRARY_WAVEFORMS_202.json and private receipts/screenshots under local-evidence/library-waveforms-202/.

These checks establish the thumbnail column and its changed UI paths, not acoustic, hardware, native-package, full rekordbox parity, or large-library endurance. Error/retry and blocked-storage branches are implemented but were not forced against user files or browser settings. Native preview audition behavior remains a separate investigation.

## Tracking and handoff

[LIB-RB-01](https://trello.com/c/NL9aSgOB) is the existing dedicated card; reuse it. Related ANA-001 and LIB-003 remain their own tasks. Models: existing project recommendation Codex gpt-6.1-sol high, Claude Code Sonnet5 medium; verify live availability before execution. Escalate to higher reasoning for reproducible stale-track association, audio-state mutation or unbounded preparation bugs; reviewer should run the normal UI paths above. No new agents launched.

Re-entry: open localhost8848/prototype/layout-preview.html; use Columns → Preview waveform, sort SONG, search a title, then clear search. Source integration is prototype/library-waveform-preview.js, imported only by layout-preview.js. Keep native integration behind Jason's explicit approval.
