# Claude → Codex: Sync fixed-offset diagnosis — 20 October 2026

Reviewer: Claude Code, Fable 5.1 / High. Read-only pass: no production code, tests, settings, metadata, native app, recordings or Trello changed. One subagent (authorized by Jason mid-task) produced the vendor section at the end. Scratch evidence copied to the ignored folder `local-evidence/sync-alignment-030/claude-fable-032/` (scripts + JSON).

Source identity: HEAD `a6403fd`; `git diff --stat f11275f HEAD -- prototype/ scripts/` touches only `prototype/README.md`, so the code read here is the installed 0.1.32 source. Originals (SHA256 prefixes): Moonglow `4cfecc8ea42174a0…`, Can You Feel It `be20a102d0d260ab…` (48 kHz stereo MP3s). Recordings: `phase-offset-032.webm` `bf2950c2…` (299.6 s), `nudge-followthrough-032.webm` `7502bd89fa0fe6ec…` (290.3 s, decoded and hashed here for the first time; single deck only, see §3.4).

## 1. Verdict

**Reproduced cause (measured, not inferred): the audible offset is a source-grid phase error that varies by song section, not a transport/scheduling error.**

- The engine's Smart Sync output is bar-exact. In the only two-deck recording, the beat-phase difference between the two decks' actual audio is **0.0 ms (≤0.1 ms resolution) in every 1 s window from the first second after the armed launch (rec 96 s) to the end of the overlap (rec 220 s)**, and in every 10 s window in between.
- Both saved grids sit on the measured kick attacks within ±4 ms over the first ~3 minutes. **After ~180 s, Can You Feel It's kicks run ahead of its saved constant grid by −8 → −37 ms** (section medians), because the source tempo is not constant and the analyzer fits one BPM to the first 180 s only (`maxSeconds: 180`) and extrapolates. Moonglow stays within ±8 ms except two sections at +9…+14 ms.
- With grids aligned exactly, the kicks therefore differ by the per-section residual difference: ≈ +6 ms at the 21:41 launch, ≈ +9 ms at the 21:45 "still off" moment, and **15–30 ms (CYFI early) during the recorded overlap** (CYFI 200–280 s against Moonglow 290–370 s). 9–30 ms between two kicks is the "tiny bit off" flam; a slow ≈0.3 ms/s drift reads as "stayed about the same".
- Codex's hypothesis (fixed per-track phase error from analyzer bias) is **not** supported: the analyzer's own onset definition lands within ±4 ms of the kicks where it fitted. The rounding of the stored BPM to two decimals (app.js:1256) is a real but minor contributor (−5 ms at CYFI 142 s, −8 ms at 210 s).

## 2. Mechanism, with files and lines

**Scheduling path (correct).** Play on an armed follower → `smartSync.start` (prototype/smart-sync.js:183–206) → `align` (76–104) → `engine.synchronize` (prototype/engine.js:598–612) → `engine.start` with `positionAt`: `syncWhen = ctx.currentTime + .03`, `aligned = positionAt(syncWhen)` (497–504), where `positionAt` = `alignedBarPosition` (smart-sync.js:27–37) evaluated against the primary's `voiceClock` (engine.js:295–309: `anchorPosition + (at − anchorTime)·rate`). The follower is a plain `AudioBufferSourceNode` started with `source.start(when, position)` (engine.js:575–585); the primary was started the same way with a 10 ms lead (504). Keylock was OFF on both decks (AX `Key lock … Value: 0`), so no time-stretch adapter or latency compensation is involved; engine ran at 44100 Hz. Both decks read the same `ctx` clock, so any common output latency cancels. Measured result: exact.

**Grid path (the defect).** `prototype/analysis.js:261–264` analyses `min(duration, maxSeconds)`; app.js:98 sets `maxSeconds: 180`. `tempoFromOnsets` (analysis.js:116–192) fits one period/phase by weighted least squares over the first 180 s (154–176) and returns `grid:{type:'constant', bpm, firstBeat}` (190). app.js:1255–1261 stores `t.bpm = Math.round(result.bpm*100)/100`, `t.grid = firstBeat`, `t.gridWarpMarkers = []`. `createBeatgrid` (prototype/beatgrid.js:9–42) then extends that single tempo over the whole track. Smart Sync aligns those lines perfectly (`beatAt`/`timeAt`), so wherever the lines leave the kicks, the music leaves the other deck's music by the same amount. Nothing in the display is wrong: the lines really are aligned; the lines are simply not on CYFI's kicks after 3:00.

**Why a nudge "aligns it and it stays together".** A G/H hold (app.js:1896–1899 → prototype/jog-bend.js:57–61, ±4 %) → `engine.setJogBend` (engine.js:657–686) bends only that voice and re-anchors its clock, leaving a one-time position offset. The residual drift is ≈0.3 ms/s, so a corrected state holds for 30–60 s before diverging by another 10–20 ms. Note: `setJogBend` calls `onManualPosition` → `smartSync.manipulated` → `syncState='tempo'` (smart-sync.js:214–216). The 21:51 AX capture shows deck 2 still `beat`, and the recording shows **no relative movement of either deck's audio at any point of the overlap** (CYFI advances at exactly 1.047344 source-s per s, Moonglow at 1.000000). So no bend reached a playing deck inside the captured overlap. The nudge report is unverified by audio and must not be used as evidence for or against transport. The mechanism above does not depend on it.

## 3. Measurements (all offline, read-only)

### 3.1 Analyzer reproduction (provenance)
`node` + `prototype/analysis.js` on FFmpeg 44.1 kHz stereo decodes (`ffmpeg -ar 44100 -ac 2 -f f32le`), default options (partial = first 180 s):

| Track | Re-analysed BPM / firstBeat | Saved (AX) | Δ |
|---|---|---|---|
| Moonglow | 121.00721 / 0.34671 s | 121.00969677 / 0.3495964 | −0.0025 BPM, −2.9 ms |
| Can You Feel It | 115.52967 / 0.50353 s | 115.53569812 / 0.509729 | −0.0060 BPM, −6.2 ms |

Saved values are this analyzer's output on these files (small deltas = FFmpeg vs Chrome decode/resample of the 48 kHz source). Confidence 0.49 / 0.70; both `partial: true`.

### 3.2 Grid vs kick attack, per 20 s section
Zero-phase bass band (the analyzer's own 35 Hz/250 Hz poles run forward and backward, so no group delay), 5 ms RMS envelope, per saved grid line the strongest bass event in [−80, +120] ms; residual = attack − grid line, **positive = kick after the line**. Two definitions per section: 50 %-of-peak crossing / steepest-rise time, medians in ms. Grid = the saved UI grid (121.01 / 115.54).

Moonglow: `20:-7.3/-2.0 40:-2.5/-3.5 60:0.4/3.8 80:3.4/1.6 100:0.0/4.2 120:-2.4/-0.5 140:-1.5/-5.3 160:-4.7/-8.0 180:-2.1/-5.6 200:7.4/13.7 220:5.2/8.6 240:2.0/2.7 260:-2.1/-3.6 280:-4.5/-7.9 300:1.9/-1.1 320:12.7/14.4`

Can You Feel It: `20:-1.0/-1.1 40:0.8/6.3 60:-1.6/4.7 80:-1.8/4.5 100:-1.1/-1.8 120:0.2/1.4 140:4.0/7.9 160:2.2/1.6 180:-7.9/-6.1 200:-18.2/-17.2 220:-19.5/-14.8 240:-19.2/-18.2 260:-29.3/-29.3 280:-37.1/-33.9 300:-20.4/-18.2 320:-13.1/-13.7`

Whole-track medians (20–300 s): Moonglow −1.6 / +0.2 ms (MAD 3.8 / 6.2); CYFI −4.0 / −3.4 ms (MAD 9.8 / 10.6). Against the exact (unrounded) CYFI fit the 20–300 median is −8.5 ms: the two-decimal rounding moves lines earlier and partly masks the drift. Slope 180→280 s ≈ −0.29 ms/s ⇒ local tempo ≈ 115.57 BPM, then back toward the grid by 320 s: a wobble, not a single step. Codex's independent scipy windows (115.46–115.68 BPM) agree.

Limitation: bass-rise candidates, not human-verified kicks; the two definitions agree within a few ms, and the drift pattern is consistent across them.

### 3.3 Deck audio phase inside `phase-offset-032.webm`
Cross-correlation of the master recording against the originals (CYFI linearly resampled by 121.01/115.54, the same operation `playbackRate` performs), sub-sample refinement, beat phase from the saved grids.

- rec 0–95 s: Moonglow alone (CYFI correlation q ≤ 0.18 — paused). Moonglow 136→231 s.
- **rec 96 s: CYFI appears at 141.423 s** (its paused position was 141.6 s at 21:45; the armed launch snapped it to the bar). From that first second: `dBeat = −0.0 ms`, q 0.53–0.83 for both decks.
- 10 s windows 102→212 s and 1 s windows 205→220 s: `dBeat = 0.0 ms` throughout; CYFI 147.707→262.915 s (rate 1.047344/s), Moonglow 238.075→348.075 s (1.000000/s).
- rec 221–223 s: Moonglow ends (q → 0.03); afterwards CYFI alone to 272 s, then silence.

Any net bend ≥ 0.5 ms on either deck would show as a step in these series. None exists.

### 3.4 `nudge-followthrough-032.webm`
Contains CYFI only (q 0.81–0.99) from rec 2–82 s with a pause around 52–72 s, then silence; Moonglow is absent (q ≤ 0.2 everywhere). It cannot measure relative phase. Decoded 290.3 s; kept untouched.

### 3.5 Commands
```
ffmpeg -ar 44100 -ac 2 -f f32le  (both originals) · ffmpeg -ar 44100 -ac 1 -f f32le (both webm)
node scripts/test_analysis_core_tempo.mjs            → phase error 2.5 ms on synthetic kicks (existing check, passes)
node grid-attack-check.mjs · python3 -I deck-phase-from-recording.py · fine-launch.py · section-residuals.py
```
Scripts and JSON outputs: `local-evidence/sync-alignment-030/claude-fable-032/`. Nothing was written to the library, settings, originals or the running app.

## 4. Smallest correction

**A. Data (these two tracks, user-confirmed, not silent):** add Beat Warp Markers to Can You Feel It through the existing Edit grid dialog (prototype/panels.js:565–600: "Source time" + "Tempo from marker", "use playhead", Save). From the residual slopes: a marker near **185 s at ≈115.57 BPM** and one near **290 s at ≈115.50 BPM** flatten the −8…−37 ms run; confirm each by watching the lines on the kicks and listening. Moonglow may take one marker near 200 s (+8…+14 ms) and 320 s if the same section is used. Plain BufferSource decks follow warp maps via `playbackRate.setValueAtTime(event.rate, event.when)` (engine.js:517), keylock off, no loop. No code change; Smart Sync `edited()` (smart-sync.js:252–276) realigns a playing deck on Save.

**B. Code (small, root-cause facing):** stop extrapolating a constant grid silently. In `analysis.js`, after the constant fit, score the pulse onsets against the fitted grid in sliding windows over the **full** track (not just `maxSeconds`), and when the windowed residual exceeds ~10 ms emit `tempo.warnings += 'tempo_drift_detected'` plus `grid.warpSuggestions: [{time, bpm}]`. Surface those in the Edit grid dialog as one-click stageable markers; do not auto-apply. Callers: app.js:1255–1261 (keep `gridWarpMarkers = []`, store suggestions on `t.analysisResult`), panels.js grid dialog (render suggestions), `createBeatgrid` unchanged. Regression: extend `scripts/test_analysis_core_tempo.mjs` with a two-segment synthetic (115.54 BPM for 150 s, then 115.60) asserting the drift flag and a suggested marker within ±5 s / ±0.03 BPM, and that the constant-tempo fixtures still produce no suggestion.

**C. Optional, smaller win:** keep the exact fitted BPM in `t.bpm` (app.js:1256) and round only for display; removes the −5…−8 ms rounding term on long tracks. Touches Edit grid's `step=".01"` input and the BPM readouts; verify `currentDeckBPM` still displays two decimals.

Do not: shift waveforms cosmetically, add a hidden ms constant, relax thresholds, or rewrite library grids without the user's Save.

**Listening acceptance (one path):** Smart Sync, LEFT Moonglow at 0 %, RIGHT CYFI armed and launched from ≈141 s; mix through CYFI 200–280 s (the previously 15–30 ms-early region) with warp markers applied. Pass = no flam audible and the REC capture, run through `deck-phase-from-recording.py` + `section-residuals.py`, shows deck phase 0.0 ms and CYFI section residuals within ±8 ms.

## 5. Dispositions

- **Initial alignment:** transport exact (0.0 ms measured). Audible offset = grid residual difference (+6 → +9 ms at the two early moments, −15 → −30 ms late in CYFI). Stays OPEN until A is applied and the listening path passes.
- **Steady tempo:** both decks held rate exactly for 116 s. The 2-decimal rounding makes the follower's true tempo 121.0055 vs leader 121.0097 BPM (≈2 ms/min, negligible). CYFI's own tempo wobbles ≈0.03 %, which is why "stays together" is section-dependent without markers.
- **Pops/clicks:** not assessed here (no discontinuity scan run). CORE-FIX-01 unchanged.
- **Waveform lag:** not assessed. ANA-001 unchanged; the 108–117 % CPU observation is unexplained by anything here.
- **EQ:** not assessed; do not retune.
- **Hardware / headphone routing:** not assessed.
- **Vendor parity:** none claimed. See §7 for behavior-level comparison only.

## 6. Suggested board text

CORE-FIX-07 (https://trello.com/c/QGW47XIJ): "Diagnosed 2026-10-20 (Claude/Fable): Smart Sync transport is bar-exact — 0.0 ms deck phase measured in phase-offset-032.webm over the full 116 s overlap. The audible offset is the saved constant grid leaving the kicks: Can You Feel It drifts −8 → −37 ms after 3:00 (source tempo wobble, analyzer fits first 180 s only). Next: add Beat Warp Markers to CYFI via Edit grid (~185 s @115.57, ~290 s @115.50) and re-listen through 200–280 s; then analyzer drift detection + Edit grid suggestions; optional exact-BPM storage. No transport/DSP change warranted."

CORE-FIX-01 (https://trello.com/c/6cK0v0iy): unchanged; nothing here touches the pop.

## 7. Vendor Sync behavior — rekordbox 7.2.19 / Serato DJ Pro 4.0.10 / Traktor Pro 3.11.1 (added at Jason's request)

Produced by one read-only research subagent (official manuals + `strings` over the three installed binaries; no app launched, no decompilation). Two of its open questions are answered from the code read above:

- **Keyboard bend wiring:** T/Y/G/H → `jogBend.hold` → `engine.setJogBend` → `onManualPosition` → `smartSync.manipulated()` → `syncState='tempo'` (engine.js:670, smart-sync.js:214–216). So Open Play already demotes Beat → Tempo on a nudge, Serato-style. A re-align is a second `press()`? No: `press()` on an engaged deck disengages (app.js:1014); re-lock today is OFF then SYNC.
- **Phase readout:** `smartSyncIndicator` (app.js:450) already shows "beat N of 4" per deck (AX: "Deck 2: beat, beat 4 of 4"); there is no numeric offset meter.

Pushback (ponytail ultra): Open Play already holds the union of the three vendors' user-facing behaviors (Simple = Serato one-shot transient/grid; Smart = bar-locked, armed launch, shared tempo). The defect measured in §1–3 is grid quality on a wobbling source, which every vendor also fixes with grid markers, not with another Sync mode. Adding vendor presets before a real user is platform-thinking (CLAUDE.md §4); park it on PARKED.md. The subagent's full comparison follows unchanged so the facts are on record.

---
# Vendor Sync semantics vs Open Play — rekordbox 7.2.19 / Serato DJ Pro 4.0.10 / Traktor Pro 3.11.1

Read-only research, 2026-10-20. Evidence tags: `[doc]` official page/manual (URL), `[bin]` string in the installed binary, `[3p]` third party, `[OP]` Open Play source read, `[UNVERIFIED]` inference not backed by a doc or string. Serato's support site returned HTTP 403 to fetch; its sentences below come from search-engine extracts of those pages and are tagged `[doc-snippet]`. rekordbox's current 7.x manual was not reachable; the official 5.5.0 PDF plus 7.2.19 binary strings are used (mode names are unchanged in the 7 binary).

## 1. rekordbox (AlphaTheta)

- **Modes.** Preference `[BEAT/BPM SYNC] → [Sync Type]: Select [BEAT SYNC] or [BPM SYNC]` [doc rb5.5.0 manual, Preferences table](https://cdn.rekordbox.com/files/20200214194946/rekordbox5.5.0_manual_EN.pdf). Binary: `BEAT SYNC`, `BPM SYNC`, `SYNC (BPM/BEAT)`, `Automatically changes the BEAT/BPM SYNC setting`, `Allow BEAT/BPM SYNC with double/half BPM.` [bin]. Sync is one deck button plus a global type; there is no per-press mode choice.
- **What each aligns.** BEAT SYNC: "The BPM and beat positions of the track playing is in sync with a track playing on the sync master" [doc rb5.5.0 p.136]. Beat position = beat phase. Bar/downbeat lock is not stated in the manual; rb7 has an explicit bar-1 marker (`Click to set 1.1 Bars. The 1.1 Bars is set to the nearest Beatgrid point.` [bin]) and a phase-meter component (`MySettingPhaseMeterComponent` [bin]), so bar phase is at least displayed. Whether BEAT SYNC aligns to the bar or only the beat: [UNVERIFIED]. BPM SYNC: tempo only — the name plus `BPM Sync on. Turn Sync off -> on to Beat Sync again.` [bin] imply BPM SYNC is the phase-free fallback state.
- **Demotion after disturbance.** The string above reads as: once a Beat-Synced deck has been knocked out of phase (nudge/jog/scratch), rekordbox keeps tempo (BPM Sync) and does NOT self-realign; the user toggles Sync off→on to re-beat-sync. [UNVERIFIED — inferred from binary string; manual does not describe nudging a synced deck.] Forum reports (non-official) say a synced deck cannot be nudged in Beat Sync because it snaps back [3p](https://forums.pioneerdj.com/hc/en-us/community/posts/206091536-Rekordbox-Sync-Can-t-Nudge-track). Both readings agree on one thing: a nudge never silently turns Sync off.
- **Master.** Explicit `[MASTER]` per deck; "If you click [MASTER] on the other deck, the sync master is switched"; "When changing or unloading a track on the deck of the sync master the sync master is switched to the other deck" [doc rb5.5.0 p.136]. Export-mode tutorial: "The Player which starts the playback first becomes the Sync Master" [doc rb5.5.0 p.91]. `Click here to set this deck as the master for Beat/BPM Sync.` [bin]. rekordbox itself can be PRO DJ LINK sync master with a `Master BPM` value [doc rb5.5.0 Preferences].
- **Tempo authority.** `Invalid operation. In Sync mode, Tempo Slider is only available for Master Deck.` [bin] — followers' sliders are rejected.
- **Quantize / snap.** "When the Quantize function is enabled, all cue and loop points are automatically set to the nearest beat position" [doc rb5.5.0 p.10]; per-deck `[Q]`, `Quantize Beat Value` [bin]; fractional quantize/loop values disable BEAT SYNC ("When the fraction loop (1/32 to 1/2) is set, [BEAT SYNC] of tracks is disabled" [doc rb5.5.0 p.129]). Quantize affects cue/loop/hot-cue placement, not playback alignment.
- **Phase meter.** Component exists [bin]; its semantics (bar position vs master) not found in the fetched manual: [UNVERIFIED].
- **Beatgrid anchoring.** Analysis writes the grid; GRID EDIT offers move ±1/3 ms, widen/narrow, TAP, double/halve BPM, "Re-set the beat grid from the current position", whole-track vs partial range (`Adjust whole Beatgrid` / `Adjust partial Beatgrid` [bin]), 1.1 Bars (downbeat) marker [bin], Analysis Lock (`Beatgrid adjustment error. Turn off Analysis Lock.` [bin]); re-analysis overwrites edits [doc rb5.5.0 p.68]. Sync needs analysed grid: `Beat Sync is unavailable. The track has no beat grid information.` [bin].
- **Sync off → pitch.** Tempo stays where Sync left it; "To get back to the original BPM on each player after turning the SYNC function off, click [RST]" [doc rb5.5.0 p.91]; hardware: "If the position of the TEMPO slider doesn't match the playback tempo (BPM), the Beat Sync tempo is maintained" [doc XDJ-AZ](https://downloads.support.alphatheta.com/manuals/all-in-one-dj-systems/XDJ-AZ/html/en/000COV_en/Beat_Sync/Beat_Sync.htm); `DVS - Reset the synced tempo` [bin]. Net: relative pitch with an explicit reset, i.e. "keep tempo, slider needs pickup".
- **DVS.** `BPM SYNC invalid. Spin the vinyl (play a track) to enable BPM SYNC in RELATIVE mode.` [bin]; DVS guide: in relative mode the deck is synced to the master deck, not the grid [doc-snippet rb 7.2.16 DVS guide](https://cdn.rekordbox.com/files/20260709200752/rekordbox7.2.16_dvs_setup_guide_EN.pdf).

## 2. Serato DJ Pro

- **Modes.** Setup → Sync Preferences: `Simple Sync` / `Smart Sync`, `Snap to Beatgrid`, `Maintain Sync on Track Load` [doc](https://support.serato.com/hc/en-us/articles/227785587-Sync-Preferences) [bin: `sync_mode`, `sync_enable_beatgrid_snap`, `sync_maintain_sync_on_track_load`, `Sync option - Enable beatgrid snap`].
- **Simple Sync.** "Beat sync works by snapping the two closest transients together and matching the BPM" [doc-snippet](https://support.serato.com/hc/en-us/articles/203056994-SYNC-with-Serato-DJ). One-shot: afterwards "the tracks will drift ... nudging the pitch of the decks and keeping them in time" [3p DJTT 2014](https://djtechtools.com/2014/04/23/how-to-set-beatgrids-and-use-sync-properly-in-serato-dj). With Snap to Beatgrid: "when first pressing sync it will sync the track using the tracks Beatgrid information rather than the transients" [doc-snippet Serato manual](https://www.bhphotovideo.com/lit_files/623206.pdf). Grid editing blocked: `Cannot edit Beatgrids in Simple Sync mode. Choose Smart Sync in the setup screen` [bin]. Usable with DVS relative/internal [doc-snippet].
- **Smart Sync sub-states.** *Beat Sync*: "will snap the Beatgrids, speed and the bar position of this track to any other tracks in Sync mode. Beat Sync will maintain this snap even if the track's Beatgrid changes (i.e. you have manually set a Beat Warp Marker)" — tempo + beat + **bar** lock, continuous. *Tempo Sync*: "the deck tempo will match decks in Sync mode, but the track's position in the Bar will not be locked". *Arm Beat Sync*: "You can arm Sync by pausing the deck and pressing Sync" (launches bar-aligned on play). Indicator "blue for Beat Sync, gold for Tempo Sync, or grey for Arm Beat Sync" [doc-snippet Serato manual]; binary states `SYNC_DISPLAY_ARMED / IN_SYNC / OUT_OF_SYNC / RELATIVE_PITCH / DISABLED / NONE` [bin].
- **Nudge/platter while synced.** "Adjusting the platter or playhead while a track has Sync engaged will disable Beat Sync and put ..." [doc-snippet, sentence truncated]; destination is Tempo Sync (gold) — consistent with the Tempo Sync definition and `SYNC_DISPLAY_OUT_OF_SYNC` [UNVERIFIED end of sentence]. Pressing Sync again re-engages Beat Sync [UNVERIFIED — manual TOC lists "Disengage Sync"; exact re-engage wording not fetched]. Sync state is kept (tempo), only phase lock is dropped.
- **Master.** No master deck; a deck syncs "to any other tracks in Sync mode" and "altering the pitch of any one deck will affect the pitch of all other synced decks" [doc-snippet] — a shared sync tempo, any synced deck may change it. `Sync must be engaged from deck 1 or 2 while in Dual Deck mode` [bin].
- **Quantize / snap.** Snap to Beatgrid only changes what Simple Sync's first press aligns to (grid instead of transients). Serato's separate Quantize (cue/loop trigger timing) is not part of Sync and was not fetched: [UNVERIFIED].
- **Phase meter.** None found in docs or strings; the on-waveform beatgrid overlay is the phase display [UNVERIFIED as absence].
- **Beatgrid anchoring.** Grid Edit: set Beat Marker (downbeat/start), Beat Warp markers for tempo changes, tap, slip/stretch, double/halve, lock [bin: `BeatgridSetStartMarker`, `BeatgridSetMarker`, `BeatgridSlip`, `BeatgridStretch`, `BeatgridTapTempo`, `BeatgridDoubleBPM`, `BeatgridHalveBPM`, `Beatgrid Fine/Coarse Adjust/Slip`, `is_beatgrid_locked`]. Smart Sync requires a grid: `Cannot SYNC, track has no beat grid or BPM. Click Grid Edit to set BPM.` [bin]; "SYNC require your Beatgrids to be on point" [doc](https://support.serato.com/hc/en-us/articles/202856014-Beatgrids-in-Serato-DJ).
- **Sync off → pitch.** "Disengaging Sync on a deck keeps the pitch in relative pitch mode"; vinyl/CDJ: "the first press of OFF will disengage Sync, but will keep the decks in Relative Pitch. A controller's single OFF press fully disengages Sync. To return to absolute pitch ... double clicking the OFF button" [doc-snippet 203056994]. Relative pitch = deck keeps the synced tempo until the fader is picked up / OFF double-clicked.

## 3. Traktor Pro 3

- **Modes.** Preferences → Transport → Sync Mode: `TempoSync` | `BeatSync` [bin: `Transport.SyncMode`, `IDS_TRANSPORT_TEMPOSYNC`, `IDS_TRANSPORT_BEATSYNC`]. "BeatSync will always maintain tempo and phase synchronization between decks"; "TempoSync ensures the tempo is locked but not the phase" [doc global-concepts](https://docs.native-instruments.com/online-guides/traktor-pro-manual/en/global-concepts). Phase is locked to the **Beatgrid** (gridmarker-relative), not merely the nearest beat. Downbeat/bar: phase meter is "relative to the current bar" in the Link section; Traktor "is not automatically synchronized to the first downbeat of a bar" in Link [doc advanced-operation](https://docs.native-instruments.com/online-guides/traktor-pro-manual/en/advanced-operation-of-traktor). Deck-to-deck bar lock: [UNVERIFIED] (manual says phase, not bar).
- **Nudge/bend while synced.** TempoSync: "you can always pitch bend on the phase while the tracks are playing" — bend shifts phase, sync (tempo) stays on, "the SYNC buttons will change appearance and the phase meter will show an offset" [doc global-concepts]. BeatSync: bending the phase is "not possible"; "SYNC turns dim when the phase of the Deck is shifted manually ... Traktor will re-align the phase when the Deck plays normally again" [doc advanced-operation, Link context]. Re-sync: "You can quickly re-align the tempo and phase by pressing the Deck's SYNC button twice"; "The phase of the Deck is aligned when the SYNC button is turned on" [doc advanced-operation]. Phase Sync is also a discrete action (`Phase Sync`, `MC_ID_DECK_PHASE_SYNC`, `Copy Phase from Tempo Master` [bin]). Tempo bend controls: `Tempo Bend Up/Down`, `Tempo Bend (stepless)`, `Tempo Bend Progressive`, sensitivities [bin].
- **Master.** One Tempo Master at a time; `AUTO` ("Auto Master Mode" [bin]): the deck that starts playback becomes master; when the master stops or ends "the synced deck automatically becomes the new Tempo Master"; with nothing playing "the Master Clock automatically becomes the new Tempo Master"; manual: disable AUTO then press a deck's MASTER [doc global-concepts]; `Set as Tempo Master`, `Only On Air Decks can be Tempo Master` (`Transport.OnAirDecksMaster`, `Transport.MasterQualified`) [bin]. Master Clock is a tempo+phase source (`Master Clock Beat`, `Master Clock Phase`, `app.traktor.masterclock.active_tempo/mode/source_id` [bin]) usable as global tempo.
- **Tempo authority.** "the tempo for the synced deck cannot be adjusted manually" [doc global-concepts] — follower faders inert; only the master (or Master Clock) sets tempo.
- **Quantize / snap.** Snap (cue/loop placement to grid) and Quantize (jumps stay in phase) exist in the Master panel; not in the fetched pages: [UNVERIFIED from doc]. Beatgrid "is used for quantized beat jumps as well as snapping Hotcues and loops" [doc global-concepts]. `Transport.Loops.PhaseSyncOnExit` [bin] — a loop-exit re-phase option; semantics [UNVERIFIED].
- **Phase meter.** Per deck (`Deck Show Phase Meter`, `Show Phase Meter` [bin]); shows offset from master; dims SYNC when offset [doc].
- **Beatgrid anchoring.** "Beatgrids are defined by one or more Grid Markers, each one setting the tempo until the following Grid Marker"; "Analyze ... will automatically set a single Grid Marker with a constant tempo"; manual adjust via Grid panel; BPM range in Analyze Options; "Beatgrids ... need to be properly set for BeatSync" [doc]. `Beatgrid Offset` [bin]. No explicit downbeat flag in the manual text fetched; gridmarker position acts as phase origin [UNVERIFIED].
- **Sync off → pitch.** Not in fetched pages. Common behaviour (tempo stays, fader needs pickup) [UNVERIFIED].

## 4. Comparison

| Aspect | rekordbox 7 | Serato DJ Pro 4 | Traktor Pro 3 | Open Play (prototype) |
|---|---|---|---|---|
| Mode selector | Global pref: BEAT SYNC / BPM SYNC [doc][bin] | Pref: Simple / Smart (+Snap to Beatgrid, Maintain on load) [doc][bin] | Pref: TempoSync / BeatSync [doc][bin] | Setting "Sync Mode": Off / Simple / Smart; "Snap to Beatgrid"; "Maintain Sync on Track Load" [OP] |
| Continuous vs one-shot | Continuous | Simple = one-shot snap; Smart = continuous | Both continuous | Simple = one-shot (`synchronizeSimple` returns alignment) [OP sync.js]; Smart = continuous (timeline) [OP smart-sync.js] |
| Aligns | BEAT: tempo+beat (bar [UNVERIFIED]); BPM: tempo | Simple: tempo+nearest transient/grid beat; Smart Beat: tempo+beat+bar; Tempo: tempo | BeatSync: tempo+grid phase; TempoSync: tempo | Simple: tempo+nearest transient (or grid beat); Smart `beat`: tempo+4-beat bar (`alignedBarPosition`); `tempo`: tempo [OP] |
| Paused follower | Not stated | Arm Beat Sync (grey) → launches aligned | Not stated (phase aligned at SYNC-on) | `armed` → launches bar-aligned on play [OP] |
| Master | Explicit MASTER; first-to-play; auto-handoff on master unload [doc] | None; shared tempo among synced decks [doc-snippet] | AUTO (first-to-play, handoff on stop, Master Clock fallback) or manual [doc] | Explicit or first playing deck [OP sync-master.js]; no handoff on stop/unload [UNVERIFIED] |
| Who may move tempo | Master only [bin] | Any synced deck, changes all [doc-snippet] | Master only [doc] | Any engaged deck (`tempo()` rewrites shared `syncBPM`) [OP] |
| Nudge in beat-locked state | Drops to BPM Sync; re-arm by Sync off→on [bin, UNVERIFIED] | Drops to Tempo Sync (gold); press Sync to re-lock [doc-snippet, partial] | Not possible / auto re-aligns when deck plays normally; SYNC dims [doc] | `manipulated()` → `tempo` (Serato style) [OP]; jog-bend → manipulated wiring [UNVERIFIED] |
| Nudge in tempo-only state | Free phase, tempo kept | Free phase, tempo kept | Free phase, tempo kept, phase meter shows offset | Free phase, tempo kept [OP] |
| Re-align action | Sync off→on [bin] | Press Sync again [UNVERIFIED] | Press SYNC twice / Phase Sync [doc][bin] | `press()` on engaged deck = disengage [OP] — no dedicated re-align |
| Phase meter | Exists [bin]; semantics [UNVERIFIED] | None found | Per deck, bar-relative [doc][bin] | Not found in files read [UNVERIFIED] |
| Quantize | Cue/loop to nearest beat; fractional disables Beat Sync [doc] | Separate; not tied to Sync [UNVERIFIED] | Snap/Quantize separate [UNVERIFIED] | "Snap to Beatgrid" only selects grid vs transient for Simple [OP] |
| Grid anchor / tools | Analysis + GRID EDIT, 1.1 Bars marker, partial/whole, lock [doc][bin] | Grid Edit: start marker, warp markers, slip/stretch, lock [bin] | Gridmarkers (multi), analyze single marker, Grid panel [doc] | `track.grid` + `track.bpm` (+ `gridMarkers`/`gridWarpMarkers`) [OP] |
| Sync off → pitch | Keeps synced tempo; RST resets [doc] | Relative pitch; double-click OFF → absolute [doc-snippet] | [UNVERIFIED] | `disengage()` → `relative` state [OP]; explicit reset-to-fader [UNVERIFIED] |

## 5. Feasibility: vendor behaviours as presets over Open Play's Simple/Smart machinery

**Verdict: yes, as policy presets over Smart Sync, with Simple Sync kept as the Serato-only one-shot path.** Open Play's Smart state machine (`off/armed/beat/tempo/relative`, shared `syncBPM`, explicit-or-first-playing master) already is Serato Smart Sync; Traktor and rekordbox differ from it in four policies, not in alignment math.

Already present [OP]:
- Serato Simple Sync (transient or grid, one-shot, tempo-only if a deck is paused) — `prototype/sync.js`.
- Serato Smart Sync: Beat (bar lock), Tempo, Arm-on-paused, relative pitch on disengage, shared tempo any-deck, Maintain Sync on Track Load — `prototype/smart-sync.js`.
- rekordbox/Traktor "explicit master or first playing deck" — `prototype/sync-master.js`.
- Traktor TempoSync / rekordbox BPM SYNC ≈ Smart `tempo` state (bar lock off, phase free, tempo held).
- A bend that does not touch nominal tempo (`jog-bend.js` voice-level factor) — the precondition for Traktor's "re-align after bend" and rekordbox's "tempo kept".

Missing, smallest additions (each is a branch on a `syncPreset` setting, not new alignment code):
1. **Manipulation policy** in `manipulated()`: `demote` (Serato/rekordbox: beat→tempo) | `realign` (Traktor BeatSync: stay `beat`, re-run `alignedBarPosition` when the bend releases — hook `jog-bend` release → `start()`-style re-align) | `ignore` (tempo-only modes). ~15 lines.
2. **Tempo authority gate** in `tempo()`: `anyEngaged` (Serato) | `masterOnly` (rekordbox/Traktor: reject with the rekordbox-style message). ~5 lines.
3. **Master handoff** in `sync-master.js`: on master pause/unload, promote the next engaged playing deck (rekordbox "switched to the other deck", Traktor AUTO). ~10 lines. Traktor's Master Clock fallback (free-running clock as master when nothing plays) is the only genuinely new object; park unless Link/MIDI clock is in scope.
4. **Re-align action** distinct from `press()`: rekordbox = off→on (already possible via two presses, but must land in `beat`, not `relative`); Traktor = double-press / Phase Sync (= `realign` without disengaging). ~10 lines plus a key binding.
5. **Tempo-only preset flag**: force `barLock=false` so `beat` is never entered (Traktor TempoSync, rekordbox BPM SYNC). 1 line in the two `barLock` computations.
6. **Sync-off pitch**: `relative` exists; add explicit "reset to fader" (rekordbox RST / Serato double-OFF). ~5 lines + binding.
7. **Phase meter**: bar-phase value is already computable from `beatPosition(primaryTrack, pos)`; UI readout is additive. [UNVERIFIED whether a meter already exists outside the four files read.]

Proposed preset table (all over Smart machinery except the first row):

| Preset | Base | Bar lock | On manipulate | Tempo authority | Master handoff | Re-align |
|---|---|---|---|---|---|---|
| Serato Simple | Simple (one-shot) | n/a | n/a (drifts) | n/a | none | press again |
| Serato Smart | Smart | yes | demote → tempo | any engaged | none | press again |
| rekordbox BEAT SYNC | Smart | yes [UNVERIFIED bar vs beat] | demote → tempo [UNVERIFIED] | master only | on master unload/change | off→on |
| rekordbox BPM SYNC | Smart | no | ignore | master only | on master unload/change | n/a |
| Traktor BeatSync | Smart | phase (beat; bar [UNVERIFIED]) | realign after release | master only | AUTO: on master stop | double-press / Phase Sync |
| Traktor TempoSync | Smart | no | ignore (phase meter shows offset) | master only | AUTO: on master stop | double-press |

Caveats:
- rekordbox BEAT SYNC may lock to beat rather than bar; if so, Open Play's 4-beat `alignedBarPosition` is stricter than the vendor. Needs a listening test or the 7.x manual.
- Open Play's `barCompatible` demotion to `tempo` on non-whole-bar loops has no vendor analogue found; vendors are silent on loops except Traktor's `PhaseSyncOnExit` [bin].
- Whether keyboard T/Y/G/H bends currently call `manipulated()` was not traced; if they do not, Serato/rekordbox demotion on nudge is already absent in Open Play and preset 1 must add the call.
- Serato's "Snap to Beatgrid" is a Simple-Sync-only switch; Open Play exposes it the same way, so it should not appear in the Smart-based presets.

Sources: rekordbox 5.5.0 manual (cdn.rekordbox.com, p.10/68/91/129/136, Preferences table); XDJ-AZ Beat Sync page (downloads.support.alphatheta.com); rekordbox 7.2.16 DVS guide; Serato support 203056994, 227785587, 202856014 (403 on fetch, search extracts); Serato manual mirror bhphotovideo.com/lit_files/623206.pdf (search extract); DJTT 2014 article; Traktor Pro manual global-concepts and advanced-operation-of-traktor (docs.native-instruments.com, © 2024, version not stated); `strings -n 6` over the three installed binaries.
