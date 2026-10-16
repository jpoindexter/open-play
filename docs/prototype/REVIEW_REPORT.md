# HTML prototype review — 16 October 2026 (baseline)

This report records the first candidate. The newer [functional review](FUNCTIONAL_REVIEW.md) supersedes changed behavior and retains remaining gaps.

**Deliverable: runnable browser review candidate. Full 1:1 parity is NOT verified.**
No native application has been started, and native approval remains pending.

The current inventory contains 110 feature groups, 354 source-linked interaction
requirements, 168 main-manual articles and 59 named DJ effects. Every feature group
has a review destination. Some destinations contain explicit gaps rather than an
implemented workflow. This is scope accounting, not a claim of exhaustive discovery
or per-requirement acceptance. In particular, 24 groups still have no detailed
interaction rows; their feature-level acceptance remains visible.

## Run and review

From the repository root: `python3 scripts/serve_prototype.py`.
Open http://127.0.0.1:8768/prototype/ or double-click `Start Open Play.command` on macOS.
Use a desktop browser for the dense interface. The local server binds only loopback
and excludes Git metadata and raw investigation evidence. Control-C stops it.

The browser prototype uses original HTML/CSS/JavaScript and Web Audio. No downloaded
runtime dependencies, external API, account, model weights or paid unlock are required.
The native foundation remains a separate provisional C++/Qt/Mixxx decision, pending
the evaluation and licensing gates in the full plan.

## What actually ran

Tests used the Codex in-app browser on macOS 26.7 (25G224), with desktop viewport
1512 × 982 and an initial narrow viewport of approximately 637 × 845. Exact embedded
browser version was not exposed by the test interface. The AudioContext reported
48,000 Hz. Tests were executed through visible UI controls using CUA, not by setting
hidden app state. The list below is the observed test log, not an automated regression
suite and not an assertion that every permutation was exercised.

| Test | Executed action and observed result | Limit of proof |
|---|---|---|
| UI-01 | Fresh page renders two decks, original demo tracks, mixer and library | Not exact pixel parity |
| UI-02 | Played deck 1; elapsed display advanced from 0.1 to 7.1 seconds; pause changed to stopped state | Physical speaker/headphone route not identified |
| UI-03 | Created Cue 1 at quantized 27.5 s; cue label/time displayed | Full reference cue-hold/modifier semantics not accepted |
| UI-04 | Enabled four-beat loop; playhead remained in loop interval across elapsed wall time | No sample-accurate boundary or artifact measurement |
| UI-05 | Set tempo to +4%; displayed 124 BPM becoming 129.0 BPM | Pitch-preserving stretch is not implemented |
| UI-06 | Moved crossfader to 0.4 while both decks played | Exact coefficient/response comparison unmeasured |
| UI-07 | Recorded actual browser master, stopped, downloaded 235,667-byte WebM | Browser master capture only; no external input or native format proof |
| UI-08 | Re-imported that recording; decoder reported 14.5 s; replay produced a nonzero meter value 0.03226 | No content-null/channel-isolation test or human listening assessment |
| UI-09 | Imported original 3-second stereo WAV fixture; search found one result; double-click loaded deck 2; playback entered running state and then stopped at end | One WAV fixture; not the native format matrix |
| UI-10 | Created Review crate; entry appeared in navigation | Nested tree, ordering and filesystem operations remain gaps |
| UI-11 | Right-clicked track, saved comment annotation | Prototype metadata only; source-file tags are untouched |
| UI-12 | Created smart crate BPM >=124; displayed the expected five original demo tracks | Single numeric rule only; no general rule engine |
| UI-13 | Ran waveform analysis; displayed completion with explicit BPM/key/gain limitation | Browser decode, not automatic music analysis |
| UI-14 | Opened FX, Sampler, Scratch, Flip, Video, Link, Files, Prepare and History panels | Entry-point smoke test; not all controls accepted |
| UI-15 | Opened all eight Setup tabs; counts 25/8/9/20/11/3/3/20 controls | Persistence fixtures include native-only processing options |
| UI-16 | Disabled Show Streaming Services; all six provider buttons disappeared; restored preference | One preference integration path |
| UI-17 | Simulated connect then network loss for all six providers; each showed Offline fixture | No provider network/login/playback exercised |
| UI-18 | Coverage rendered 110 entries and 354 requirements; search FX-003 returned one entry and routed to FX | Mapping completeness, not feature implementation acceptance |
| UI-19 | Opened LPF advanced parameters, edited resonance, saved a preset and selected it for recall | No FX DSP or full preset lifecycle acceptance |
| UI-20 | DVS signal-loss fixture displayed loss; internal-control fixture changed to INT | No timecode signal or actual device dropout |
| UI-21 | MIDI learn plus injected synthetic CC created a channel/controller mapping row | No hardware MIDI packet or LED output |
| UI-22 | Assigned demo to sampler slot, triggered and stopped; assigned Scratch Bank slot and loaded focused deck | Sampler advanced fields/hold behavior remain gaps |
| UI-23 | Armed Flip, triggered existing cue, saved Untitled Flip | Cue-event editor state, not timed audio automation |
| UI-24 | Applied video text; all three generated previews displayed OPEN PLAY REVIEW | No video decode, real transition catalog or Syphon output |
| UI-25 | Switched to four decks, loaded/played/stopped deck 3 | No four-deck simultaneous load/soak test |
| UI-26 | Selected all five layouts; matching layout state rendered | Exact composition and every responsive permutation unaccepted |
| UI-27 | Four-to-two deck switch followed by double-click loaded visible deck 2 after focus fix | Regression for the observed hidden-focus defect |
| UI-28 | Link join/loss controls changed joined/no-session state | No Link network packets |
| UI-29 | Stems prepare showed Queued; model-failure control displayed failure with full-mix fallback note | No model inference or stem audio |
| UI-30 | Exported 8,495-byte library JSON and restored it through file picker; success message observed | Audio files are not included; full migration/corruption matrix untested |
| UI-31 | Browser console had no new runtime errors during the successful tests; only two old startup syntax errors remained in retained log | Not a guarantee against untested errors |
| HTTP-01 | GET prototype, JavaScript and coverage JSON returned 200; Git/raw evidence/traversal paths returned 404 | Local serving checks only |

The initial startup template syntax error, double-click loading defect and hidden
deck focus defect were corrected and retested on their actual UI paths. Provider
visibility and metadata persistence were corrected. Sampler end-of-playback state
cleanup was added; that final callback is code-reviewed, not independently
end-to-end verified. No failed test is silently converted to a parity pass.

## Implemented browser behavior

- Original demo synthesis and local file decoding; play/pause/seek/rate, cues, basic
  manual/automatic/saved loops, beat jump, basic tempo matching, repeat and positioning.
- Browser gain, three-band EQ/filter, channel level and linear crossfader; master
  meter and MediaRecorder capture/download. These are independent approximations.
- Library selection/search/sort, crates, one-rule smart crates, metadata editing,
  columns, Prepare, session history and metadata backup/restore.
- Sampler trigger/stop/repeat, Scratch Bank assignment/load, Flip cue-event editor,
  generated video/text/image preview, all setup tabs and a source-linked coverage browser.

Some implementation paths above have only code-path evidence beyond the specific
executed checks. Do not turn this list into a blanket tested claim.

## Explicit simulations and open parity gaps

1. **Reference completeness:** source/control reconciliation is unfinished. The
   corpus includes version conflicts and image-only/conditional states. All 59
   effect names are inventoried but only four advanced parameter strips were observed.
   The exact Video effects/transitions and numerous loaded/error states remain open.
2. **Design:** familiar dense DJ layout, five view choices and central scrolling
   waveforms are provided. Typography, spacing, panel geometry, waveform coloring,
   zoom behavior, contextual help, drag behavior and conditional controls do not yet
   establish pixel or interaction equivalence. No copied branding or assets are used.
3. **DSP:** no stem separation, keylock, independent key shift, reverse, scratch/jog,
   full slip/slicer, Smart Sync phase engine or DJ FX processing. Toggle states are
   labeled simulations; full-mix audio continues. Exact gain/curve/filter equivalence,
   variable beatgrids, automatic BPM/key/gain and metering require native evaluation.
4. **Hardware:** device, MIDI learn/feedback, DVS, CDJ, Phase, hot-plug and separate
   cue/master channels are synthetic fixtures. The browser plays through its default
   output. The Hercules raw-input capture discrepancy is unresolved. Prior physical
   enumeration and user-reported Serato browsing do not prove Open Play compatibility.
5. **Library:** nested crates, multi-rule smart rules, folder watching, filesystem
   relocation/copy/move, native tag writes, Serato database interoperability, robust
   migrations, persistent history and large-library virtualization remain gaps.
6. **Performance panels:** sampler Hold gating and advanced parameters, timed Flip
   replay, exact Pitch Play/Slicer behavior, native Video codecs, MP3+G, Media Crate,
   linked AV effects, master effects, HD recording and Syphon are incomplete.
7. **Services:** six provider and Link fixtures use no network. Third-party accounts,
   entitlement/region limits, catalogs, offline lockers and real streaming are untested.
   Open local features need no artificial paywall; provider contracts cannot be promised away.
8. **Reliability/accessibility:** keyboard subset and native controls/focus are
   present, but screen-reader audit, all shortcuts, drag/drop permutations, offline
   reload, long-session audio stress, crash recovery, unsupported files and every
   responsive state remain untested. Browser route/UI success is not native acceptance.

See `coverage-manifest.json` and the in-app Coverage & evidence panel for per-group
destinations and boundaries. [PARITY_GATE.md](../research/PARITY_GATE.md) remains open.

## Review decision

Review the candidate and run the independent Claude audit before treating this as a
parity specification accepted for native implementation. The audit must derive its
own checklist and report omissions beyond the known gaps above. Jason's explicit
approval of an identified prototype revision remains the only entry to native work.

Private GitHub contains the review packet. Trello has 110 feature/model cards plus
three gate/evidence cards from the verified earlier checkpoint. Source-link sync
remains 59/87 verified, 28 pending; subsequent readback attempts returned 429 and a
transport error. The browser fallback reached a private-board access screen for its current signed-in account; no access request or account change was made. The local `docs/delivery/trello-pending-updates.json` file records the exact unsent descriptions.
Do not interpret this report as verification of those remote updates.

## Saved browser views

- [Desktop review](screenshots/desktop-review.jpg)
- [Setup review](screenshots/setup-review.jpg)
- [Coverage review](screenshots/coverage-review.jpg)

These show the original prototype only, not proprietary Serato screenshots. They are not pixel-difference acceptance evidence.
