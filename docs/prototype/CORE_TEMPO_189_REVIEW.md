# Core tempo/grid checkpoint189

19 October2026. The two real MP3s previously imported into native0.1.23 both returned unknown tempo. Their first180s independent PCM reproductions had strong autocorrelation candidates but failed the old transient-alignment confidence rule. This prevented a useful Sync workflow for the pair.

## Change

Only prototype/analysis.js production code changed. Tempo candidates still come from full-spectrum onset autocorrelation. Grid phase now uses repeated bass-transient support, one strongest event per beat and bounded weighted regression. It no longer replaces a precise period with the median of frame-quantized onset intervals or anchors the entire grid to the first transient. A short causal35–250Hz energy envelope avoids the early phase bias of the centered2048-sample tonal FFT. Original PCM is never changed.

Confidence is explicitly a new heuristic conjunction of periodicity and beat coverage, not a calibrated probability or the old product under another name. Autocorrelation must still reach0.45, at least half the distinct beats must be supported, and the combined heuristic must reach0.45. Strong candidate preference is retained, with a supported double-time alternative allowed for accent-driven half-time. Downbeats remain unverified; constant grids are editable/extrapolated beyond the analyzed window. This is not a general music-analysis accuracy claim.

## Executed evidence

The new constructed accented/syncopated rhythms failed before with unknown BPM. After:115.54011 and120.99977BPM against construction115.54/121, phase error about2.51ms against the unchanged65ms phase criterion. The65 existing PCM checks pass, including fast174BPM, steady tone/noise/silence rejection and key/gain/selective-analysis behavior. Earlier attempts recovered BPM but selected offbeat phase or a slower tempo; all failed logs remain private. No guard was relaxed to hide those failures.

The same two private real files independently decoded at44100Hz now produce115.52967 and121.00721BPM. The actual normal browser chooser/48000Hz worker produces115.53570 and121.00970BPM. Both imported songs were loaded onto separate decks; actual Play/Sync controls produced two moving decks and positive master-meter output. Both Sync controls read active, with deck2 adjusted to deck1's115.5BPM. Turning deck2 Sync off and moving its tempo control changed deck2 to115.7 while deck1 stayed115.5. Both decks were stopped afterward. Matching displayed BPMs and positive meters do not prove perceptual beat alignment or acoustic output.

Read CORE_TEMPO_189_RESULTS.json. Real music, decoded PCM, original UI captures, failed attempts and screenshots are retained only under ignored local-evidence/core-tempo-189. The stable native0.1.23/profile/maps were not modified or restarted. This change is not packaged in it. No new native/physical/manual-mix/headphone or complete core acceptance is claimed.

## Current next action

Jason additionally requested extracting and implementing Serato's design system for the core decks/waveforms/mixer/library; reskinning comes later. This is part of the core goal. Preserve control bindings, audio behavior, profile and272 Alternative mappings while changing the visual structure. Fresh Serato empty-practice capture and earlier loaded Vertical capture are available privately. Extract observed/inferred tokens, apply the core visual system and waveform improvements, then prepare one versioned desktop candidate with both core tempo and visual changes for the practical two-track test. Do not resume stems, advanced FX, video or broad parity work.
