# Serato Video reference findings (Claude Fable second opinion)

Date: 2026-10-16. Scope: read-only research and installed-metadata inspection. No Serato UI, shared browser, library, preference, license, remote record or project file was touched. This is the only file written. Nothing here declares parity; it separates what primary sources establish from what remains unknown.

## Verdict first

1. **The official current manual is retrievable.** `https://serato.com/downloads/files/141226/Serato+Video+Software+Manual+for+Serato+DJ.pdf` answers HTTP 302 to a short-lived signed CloudFront URL, and that URL answers HTTP 200 when the request carries a normal browser `User-Agent` and follows the redirect in the same client. The 403 seen earlier is a fetcher artefact (cross-host redirect handled by a different client, or no UA), not an access control. The legacy 95193 link also answers 200 today, not 404.
2. **The manual defines every disputed Output/Control setting in prose, with no numeric defaults or algorithms** except: recording default 480p at 24 fps, Delay Compensation range ±0.5 s, and V-Sync "on by default". Contour Faders is absent from both manual editions; its only primary definition is the 2009 Video-SL 1.1 release note.
3. **Media Treatment equations: all four are confirmed at the description level** by the manual (two editions, identical wording). What stays unknown is the target rectangle (output window, not a fixed 16:9 canvas), the processing stage, matte alpha and sampling filter.
4. **A runtime-written file on this machine proves the slot-effect registration question.** `~/Music/_Serato_/SeratoVideo/effects_list.xml` lists 55 effects in 5 categories plus "No Effect": all 47 manifest IDs by identical ID and name, plus the 8 localized-only names with built-in IDs 17825793–17825800. The 55-name union is therefore the registered slot menu as of 2026-09-19 on this GPU. Transitions and the 31 AUDIO_LINKED definitions do not appear in that file; they remain unproven at runtime.
5. **The 31 AUDIO_LINKED definitions:** static files prove names, flags, shader sharing and the uniform interface the host feeds. Nothing static proves which host FX name triggers which definition or how parameters map. The manual documents the mechanism (a global "Audio Linked Video Effects" checkbox on the Effects tab; linked effects run "on top of the existing effects slots" and "respond to changes in parameters" of the audio FX). Trigger and transfer functions are runtime-only.
6. **Any playback-based reference observation requires loading media into Serato, which writes the library database.** Under the current "no library change" rule the smallest experiments are limited to settings-panel readings. The ranked experiments below state exactly which ones need a one-line authorization to add and later remove two generated test clips.

## Q1. Primary sources

| Source | Identity / date | Status today | Supports | Does not support |
|---|---|---|---|---|
| Serato Video Software Manual for Serato DJ, file 141226 | PDF created 2015-04-09 (InDesign CC 2014); S3 `last-modified` 2025-12-08; 27 pages; 425,843 bytes; SHA-256 `85c57756dc96587b7b4822e2911decb4b9202f5a1d6b1cba047e1159236ae66c`; ETag `49851a7527747e680888d9cbec5eb832` | 302 → 200 via browser UA | Definitions of every Output/Control/Effects/Info option (pp. 22–24); 54-effect / 27-transition descriptions (pp. 19–21); recording defaults (p. 16); slot processing order (p. 13) | Numeric defaults/ranges (other than those noted), algorithms, 4.0.10-specific behaviour. Content is Serato DJ 1.x era (QuickTime 7, OS X 10.8.5) and still the only manual the current downloads page links. |
| Serato Video User Manual 1.1, file 95193 | 27 pages (not 8; `file` misreports the linearized header); PDF 1.3; SHA-256 `4fdc3ee92d61015f1b9b00792b62006c3fd56952575e8dd22dddcf9b2ed63463`; S3 `last-modified` 2025-12-08; no resolvable creation date | 302 → 200 | Scratch Live/ITCH edition. Media Treatment, Output, Arrangement, V-Sync, Frame Blending, Buffer Size, Delay Compensation, Auto Crossfade Speed, Cursors Crossfade Video text is **identical** to 141226. Adds the "Audio Effects" paragraph (p. 12) and "Enable Audio Effects in Scratch Live" checkbox (p. 23), and a TTM 57SL "Cue" crossfader link (p. 9). | Current Serato DJ Pro behaviour. Use only to show the definitions have been stable since 1.1. |
| Video-SL 1.1 release notes, `https://serato.com/video-sl/downloads/1.1.0/releasenotes` | 2009 | 200 | Only primary definition of Contour Faders: "The fader positions used in Video-SL can now be contoured in the same way as the audio faders on the TTM 57SL." Also: frame blending bug fix, Mac VSYNC timing change. | Current contour curve, whether contour follows hardware fader curve settings in Serato DJ Pro. |
| Serato Video 1.1 legacy release notes, `https://serato.com/video-legacy/downloads/1.1.0/releasenotes` | 2012-09-25 | 200 | Media treatment interacts with transitions (smudge/melt/swap fixes under Preserve and mixed 4:3/16:9). Implies treatment is applied per source before the transition stage; this is inference from bug wording, not a stated pipeline. | Current pipeline order. |
| Legacy downloads page, `https://serato.com/video-legacy/downloads/1.1.0` | current | 200 | Links 141226 (Serato DJ edition) and 141227 (Scratch Live/ITCH edition). | — |
| Zendesk support articles (203015254 recording issues, 202538660 secondary display, 202305724 formats, 204211070 Video 101) | current | **403 to every fetcher used here** (WebFetch, curl with browser UA). Not re-verified in this session. | Earlier session readings stand as recorded in VIDEO_CATALOG_EVALUATION.md. Search-engine snippet of 203015254 states "Recording frames per second is always 24" and advises lowering output and recording quality on dropouts; treat as unverified until re-read. | — |

Third-party mirrors seen in search (Scribd, manualzz, B&H `lit_files/623206.pdf`, Juno Video-SL operator's manual) were not used as authority.

### Per-setting evidence (manual 141226 pp. 22–24 unless noted)

| Setting | Documented meaning (paraphrase; quotes ≤ 12 words) | Default / range stated | Still unknown |
|---|---|---|---|
| Window Aspect Ratio | Constrains the **output window** to 16:9 or 4:3 "while not in fullscreen mode"; a preview aid. No constraints = unconstrained. | none | Behaviour when fullscreen display aspect differs; persistence. |
| Output Quality | "Improves output quality at the expense of speed." Medium is the recommended setting for standard video; High/Best only for HD sources; higher settings "use extra CPU for no visible gain" otherwise. | No default stated; Medium is the recommendation, not a declared default | What resource changes per step (render resolution, filtering, decode path). |
| Recording Quality | Choose 360p/480p/720p/1080p for recording the output. p. 16: "Default recording quality is 480p, 24fps and the output window aspect ratio is respected." | **480p, 24 fps default; aspect follows output window** | Exact width at each height; encoder/bitrate; whether fullscreen aspect is used. |
| Arrangement | Normal = un-split window; Left-Right = split of left and right channels; Left-Output-Right = split of all three; intended for feeding a video splitter / analog mixer. | none | Whether channel panes are pre- or post-fader, effected or raw (p. 8 says the panel's deck screens show "un-mixed, effected content", which is the panel, not Arrangement). |
| Media Treatment | See Q4. | none stated; Preserve was the observed session value | Target rectangle, stage, alpha, filtering. |
| Use V-SYNC | "on by default"; syncs frame rate to monitor refresh; turning it off is a benchmarking aid. | **default on** | Jason's session showed it unchecked: either a prior change or a 4.0.10 default change. Not resolvable from docs. |
| Use Frame Blending | Blends adjacent frames so playback below full speed is smoother; "increases CPU load". | none | Blend method, whether it applies at 1.0× speed, default state. |
| Buffer Size | "how much system RAM to set aside" for buffering. | none (observed slider labels 200Mb/1Gb/2Gb) | Step size, what is buffered, eviction. Info tab "Buffered Frames Left/Right" counts GPU-buffered frames, a separate quantity. |
| Delay Compensation | Shifts the post-mix output video "forward or backwards 0.5s" for front-of-house AV sync. | **range ±0.5 s** | Sign convention, step, whether recording includes it. |
| Auto Crossfade Speed | Slider; left slower, right faster. | none | Time range, curve. |
| Contour Faders | Not in either manual. Video-SL 1.1 note only: contoured like TTM 57SL audio faders. | none | Everything numeric. |
| Cursors Crossfade Video | Left/right cursor keys drive the video crossfader; disables cursor-key library scrolling (p. 13). | default unchecked implied by "check this box" | Step per keypress, repeat rate. |
| Effects tab | "Effect Restrictions" (GPU gating readout) and "Audio Linked Video Effects" checkbox. | none | Checkbox state on this machine (tab never opened in the recorded session). |
| Info tab | Video Resolution L/R, Buffered Frames L/R, Colorspace L/R, Output Resolution, Output FPS ("rate at which faders, effects and transitions are currently being calculated"), YUV Handling (Default / Software only / RGB only), Debug Panel (needs MovieInfoBatch). | — | — |

Other documented facts useful to the implementation contract: two slots per deck run **in series**, slot 2 consumes slot 1's output (p. 13); channel faders set video opacity 0–100% (p. 8); with 4-channel hardware video uses decks 1 and 2 only (p. 7); transitions "Center" acts in the centre 50% of the fader, "Latch 50" cuts at centre, "Scratch" cuts at the fader ends, "Scratch Fade" allows upfader mixing (p. 21).

## Q2. What installed metadata can and cannot prove

Inspected paths (all read-only):

- `/Applications/Serato DJ Pro.app/Contents/MacOS/Serato Video.app/Contents/Info.plist` — 4.0.10 / 4.0.10.213, built with Xcode 16.2 SDK 15.2, `LSMinimumSystemVersion` 10.14.
- `.../Resources/version` — contents `12001`.
- `.../Resources/options` — 1,370 bytes of 32-bit integers, no labels; opaque.
- `.../Resources/audio_effects/audioeffects.xml` — 31 `<effect>` entries; children `name`, `class`, `defaultValue`, `effectType`, `fragmentFile`, `vertexFile`, optional `firstpass`, `textureFile`, `numXDivisions/numYDivisions`, `requirements` (empty in all 31).
- `.../Resources/audio_effects/*.effect` — 60 ASCII GLSL files. Only `uniform` declaration names were read; no shader bodies were copied.
- `~/Music/_Serato_/SeratoVideo/effects_list.xml` — runtime-written 2026-09-19 22:40:53, 3,019 bytes, SHA-256 `bd448f9956afe525d7ac0460972959282fb1f936163e697c9ca650508d5b50d1`.
- `~/Library/Application Support/Serato/` — folders `IPC/tmp`, `Library`, `Licenses`, `Serato DJ` (only `user_tokens.json`, not opened), `Serato DJ Pro` (only `Drivers`). No video preference file with readable keys was found; host resource packs (`dj_resources_*.bin`) contain none of the settings labels as plain strings, so they are compressed and out of scope.

Evidence ladder:

| Claim | Proven by static files | Inference only | Runtime-only |
|---|---|---|---|
| 55 slot effects are registered and categorised on this machine | `effects_list.xml`: 47/47 manifest IDs match by ID and name; 8 further entries `Rotate, Zoom, Tile, Zoom Tile, False Color, Analyzer, Analyzer Line, Block Columns` carry consecutive IDs 17825793–17825800 and `No Effect` is 17825792. The manual's "Title" is this file's "Tile"; the localized "Zoom/Tile" label is the same entry as "Zoom Tile". | That the consecutive IDs mean compiled-in effects rather than XML ones. That the list already reflects GPU gating (the manual says availability is GPU-dependent; the file was written by a running instance, so it most likely does, but the write trigger is unknown). | Menu order inside each category, whether every entry is enabled for the current GPU, parameter ranges. |
| 33 transition names are registered | Nothing. `effects_list.xml` has no transition section. Manual documents 27; the 6 localized names not in the manual (`Grid Pop, Tornado, Water Bar H/V, Wipe H/V`) are unverified. No "Crossfade" transition is documented; "Default" is "A standard transition". | — | Active transition menu. |
| 31 audio-linked definitions exist and are hidden from the slot menu | `audioeffects.xml` flags `HIDDEN \| AUDIO_LINKED` (17 also `TWO_PASS`); absence from `effects_list.xml` is consistent. | — | — |
| Which host FX triggers which definition | Names are lowercase Serato DJ Pro FX names (`delay, echo, reverb, phaser, flanger, lp filter, hp filter, combo filter, distortion, pan delay, epic reverb, bit crush, tremolo, repeater, braker, brake echo, tape echo, looper, time stretch, spiral echo, auto filter, spiral flanger, pitch delay, crush echo, particle delay, noise sweep, shepard filter, space verb, filter echo, filter gate, noise pulse`). | Name equality implies a name- or ID-keyed lookup from the host. Plausible, unproven. The host's effect manifest is a packed binary; no cross-reference table exists in readable form. | Observed trigger per FX. |
| How many distinct visual programs the 31 names map to | 20 distinct fragment and 20 distinct vertex files. Shared: `FS_audio_Delay` ×4 (delay, pan delay, pitch delay, particle delay), `FS_audio_EchoSecondPass` ×4 (echo, tape echo, spiral echo, filter echo), `FS_audio_Reverb` ×3 (reverb, epic reverb, space verb), `FS_audiobpfilter` ×3 (lp/hp/combo filter, each with its own vertex file), `FS_audio_Flanger` ×2. `distortion` is the only entry with a `textureFile` (`deformTex3.png`, not present in the folder listing; its load location is unknown). | Shared fragment + distinct name suggests the host passes a per-effect parameter that differentiates them, or they are visually identical. | Which. |
| What the host feeds a linked effect | Uniform names across the 60 files: `AudioEffectMix` (28 files), `AudioEffectTimeSinceActivation` (14), `AudioEffectBPM` (10), `AudioEffectParam1` (7), `AudioEffectParam2` (8), `AudioEffectParam3` (1), `time` (7), plus `texture`, `first_pass_texture`, `back_buffer_texture`, `externalTexture`, `ratio`. Slot effects instead use `kSSV_SeratoDataOutputLMHBins`, `kSSV_SeratoDataOutputGain`, `kSSV_SeratoData{Low,Mid,High}EQControl`, `kSSV_SeratoDataSongPositionInBars`, FFT-bin vec4s. | The linked path is parameter-driven (mix, up to three params, BPM, activation time), not audio-analysis-driven, which matches the manual's "respond to changes in parameters". | Scaling and sign of each uniform. |
| Processing position of linked effects | Manual 1.1 p. 12: applied "on top of the existing effects slots". Manual 141226 p. 24: engaged automatically when applying Serato DJ FX, gated by one checkbox. | After slot 2, before transition, per channel. Reasonable reading, not stated. | Confirmed order. |

Nothing in the above required or involved decompilation, license inspection or IPC inspection. The `IPC` folder exists and is where a runtime observation would look, but its contents are runtime state and were not read.

## Q3. Ranked reference-observation experiments

Constraint check first. Every playback experiment needs a video loaded into Serato DJ Pro, which adds rows to `~/Music/_Serato_/database V2` and the "All Videos" crate. That is a library change under the current rules. Reversible path: copy `database V2` and `neworder.pref` to a backup folder beforehand, load the two generated clips, observe, then "Remove from library" and delete the clips. Recording also writes to `~/Music/_Serato_/Recording`. Codex owns the shared UI; these are procedures, not actions taken here. Items 1 and 2 need no media.

1. **Delay Compensation range (settings only, no media).** Turn the knob to both extremes, read the label, return to 0 ms. Prediction from the manual: ±500 ms. Falsified if an extreme reads a different magnitude or the two sides are asymmetric. Also note the Buffer Size slider's actual stops by dragging and reading, if it shows a value. Cost: under 2 minutes; restores exactly.
2. **Effects tab readout (settings only).** The earlier attempt could not switch to Effects/Info. Retry with keyboard focus on the sub-tab strip (Tab/arrow keys) or by resizing the Setup window; the tabs may be clipped. Outcome: state of "Audio Linked Video Effects" and any "Effect Restrictions" text for this GPU, plus Info tab "YUV Handling" and "Output Resolution". Falsifiable: if Effect Restrictions lists excluded effects, `effects_list.xml` should omit them; a mismatch shows that file is not GPU-gated.
3. **Media Treatment geometry (needs two generated clips, library write).** Generate two short clips with ffmpeg: 640×480 and 840×360, each with four uniquely coloured 32 px corner squares, a centred circle of known pixel radius, and a frame counter. Set Window Aspect Ratio to 16:9 so the output window is a known rectangle (restore to No Constraints afterwards). Load one clip at a time on the left deck with No Effect in both slots, crossfader hard left, Default transition. For each of the four treatments take one screenshot of the output window and measure. Predictions, with the output window as the target rectangle:
   - 4:3 clip: Preserve shows all four corners with side pillars; Stretch shows all four corners, circle width/height ratio 1.333; Center-Cut and Letterbox both show the top and bottom corner squares cut and the circle round. Center-Cut and Letterbox are **indistinguishable** on this clip.
   - 2.33:1 clip: Preserve and Letterbox both show top/bottom bars, all corners, circle round; Center-Cut loses the left and right corner squares. Preserve and Letterbox are indistinguishable on this clip.
   - Falsifiers: any treatment where circle ratio and visible corners contradict the row above; padding colour not black; padding present in Stretch or Center-Cut. The pair of clips is the minimum that separates all four modes, matching the fixture reasoning already in VIDEO_CONTROL_GAPS.md.
   - Second pass, same clips, Window Aspect Ratio = No Constraints and the window dragged to a 1:1 shape: if the geometry re-fits to the square window, the target is the window, not a fixed 16:9 canvas. This is the single most useful fact for the Open Play contract and cannot be learned from the manual.
4. **Audio-linked trigger existence (needs one clip and the checkbox from item 2).** With Audio Linked enabled, both slots No Effect, static clip paused on the left deck: enable host FX Echo on that deck, screenshot; disable, screenshot; repeat with Distortion and one unrelated FX such as Phaser. Prediction: Echo and Distortion produce a visible change (manual and expansion page both name them); Phaser also should, since `phaser` is a definition. Falsified if Phaser does nothing while Echo does (name-keyed mapping is then incomplete), or if nothing changes (checkbox or paused-deck gating). Vary the FX depth knob and confirm the visual follows it, which tests the `AudioEffectMix`/`Param` reading above.
5. **Recording dimensions (writes a recording).** Record 3 s at 480p with the window at 16:9, then at 4:3. Run `ffprobe` on the two files. Prediction: height 480 both times, width 854 (or 852/856) and 640. Falsified by a fixed 16:9 width or by a container height other than 480. Also reads the stated 24 fps.

Items 3 to 5 produce measurements; items 1 and 2 produce readings. None establishes Output Quality, Frame Blending or Buffer Size internals; those need frame-timing capture and are out of scope for a minimal pass.

## Q4. Media Treatment equations against primary evidence

Manual 141226 p. 23 (identical in the 1.1 edition p. 22), framed as behaviour "when your video file is a different aspect ratio to the display you are outputting to":

| Open Play equation | Manual statement | Verdict |
|---|---|---|
| Preserve = contain, centred, black padding | Original aspect "maintained and is never cropped"; a letterbox or pillar box of black lines fills the remaining space. | **Confirmed**, including black matte. Centring is not stated but is the only reading consistent with "letterbox" / "pillar box". |
| Stretch = fill both axes | Always stretched to fill the entire output display; distortion possible. | **Confirmed.** |
| Center-Cut = cover, centred crop | Aspect maintained, zoomed to always fill; cropping can occur. | **Confirmed** as cover. "Center" is in the name; crop symmetry is not stated. |
| Letterbox = fit width; taller source crops vertically, shorter source gets top/bottom bars | Aspect preserved and "will always fit the width of the display"; a taller file (4:3 on 16:9) or shorter file (16:9 on 4:3) is either cropped or has a letterbox inserted. | **Confirmed.** The two outcomes map exactly: taller → crop, shorter → bars. The equation `s = W/sw`, `dy = (H − dh)/2` is the direct formalisation. Vertical centring of the crop is not stated. |

Caveats that keep this short of "recovered behaviour":

- **Target rectangle.** The manual's target is the output display or window, whose shape follows Window Aspect Ratio (or the user's drag under No Constraints) and the fullscreen display. Open Play's target is a fixed 16:9 processing canvas. The equations agree with Serato only when the Serato window is 16:9. Experiment 3, second pass, tests this.
- **Stage.** The manual does not say whether treatment is applied per source before effects and transitions, or once at output. The 2012 release notes fix melt/smudge/swap artefacts "when media treatment is set to preserve", which only makes sense if the transition sees already-treated sources, so per-source-before-transition is the better-supported reading. Open Play's choice (per decoded input before channel FX) is consistent with it but not proven by it.
- **Matte alpha and filtering.** Black is documented for Preserve; nothing is said about alpha, interpolation or edge sampling. Open Play's "opaque black only outside the content rectangle" remains an independent choice.
- **Applicability to overlays and MP3+G.** Not addressed in any source read. Open Play's exclusion of CDG and overlays from the setting is unconfirmed either way.
- **Observed Preserve selection** in Jason's session is a session value; the manual states no factory default for Media Treatment.

## Catalog cross-check (bonus, bounded)

| Set | Manual 141226 | Installed | Runtime list | Note |
|---|---|---|---|---|
| Slot effects | 54 named (5 menus claimed, 6 headings printed) | 47 XML + 8 localized = 55 | 55 + No Effect | Manual "Title" = runtime "Tile". Manual lacks "Filter" (XML ID 3749054, runtime category Lighting). Manual "Zoom Tile" = localized "Zoom/Tile". |
| Transitions | 27 named | 7 XML + 26 localized = 33 | not listed | 6 localized names have no documentation: Grid Pop, Tornado, Water Bar H, Water Bar V, Wipe H, Wipe V. No "Crossfade" entry exists in any source; Open Play's separate Crossfade is an independent addition. |
| Audio-linked | mechanism only | 31 hidden | not listed | Trigger mapping unproven. |

## Retrieval notes for Codex

- Fetch the manual with one client that follows the 302 and sends a browser `User-Agent`; the signed URL expires within hours, so never store it. Example: `curl -L -A 'Mozilla/5.0 ...' -o manual.pdf '<official 141226 URL>'`. The `+` form of the filename works; the `%2B` form was not retried.
- Zendesk (`support.serato.com`) returned 403 to both fetchers used here. Do not attempt to bypass; the earlier successful web-reader readings are the record.
- Local copies of both PDFs are in this session's scratchpad only and were not added to the repository.

## Unverified / not established

- Numeric mapping of Output Quality steps, Auto Crossfade Speed, Contour Faders, Buffer Size stops, Frame Blending method.
- V-Sync factory default in 4.0.10 (manual says on; session showed off).
- Active transition menu and the six undocumented localized transitions.
- Host FX → audio-linked definition mapping and parameter scaling.
- Any 4.0.10-specific change: the only manual Serato links is a 2015 document.

Skills applied: use, source-grounded, blind-falsification, si-calibration-gate, vd-report-the-gap.
