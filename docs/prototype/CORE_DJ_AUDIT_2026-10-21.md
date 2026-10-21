# Core DJ audit and reconciled execution plan — 21 October 2026

**What this repo does:** Open Play imports local audio, plays it through a browser audio engine, and exposes DJ controls in an Electron test host. This audit assumes one person mixing two real songs on this Mac, then extending practice with additional tracks. It does not assume a public release or full vendor parity.

**Verdict: meaningful core progress; not ready to call the core experience complete.** Keep the chosen rekordbox interface and existing controls/previews. Repair the narrowly demonstrated state-safety defects, finish the missing practical acceptance, and gate wider library/long-session use on resource evidence. No application implementation or rebuild was performed in this audit.

## Identity, authority and evidence

- Audited repository HEAD: `d2aa4e4`. Current local desktop remains **0.1.37**, immutable source `ce5c12420b3bbf0dda388e44bfc758126cd20972`, ASAR `4f3fcdb6340dafa8030b2ecd061bdd970a6e036b4df64bb053f3ed8ed93c8a7a` per the existing package receipt. No fresh package/runtime inspection is claimed here.
- Local desktop testing is authorized. Older HTML-only restrictions describe historical checkpoints. Public release, full parity and new native DSP implementation are not accepted.
- **Freshly executed:** `node --test prototype/*.test.mjs prototype/ui/*.test.mjs` — **35/35 passed**. Existing GUI tempo script passed eight checks; jog policy, keyboard-bend policy and pending Smart Sync start scripts passed their declared controlled checks. These are module/control evidence, not new listening results.
- **Fresh controlled reproductions:** actual extracted restore, persistence and decode-cache methods with isolated collaborators; malformed backup mutations reached persistence, forced save failure returned false, and 50 tiny distinct decoded buffers remained cached. A controlled boot expression confirms an object-valued crates field reaches an incompatible array operation. No live profile, originals or recording was modified. Private scripts/results: `local-evidence/core-audit-2026-10-21/`.
- **Reported by Jason:** independent real-track playback; level/crossfader/filter operation; manual tempo/reset and jog/release; a small nudge aligning the original pair; Anika/BX3 aligned/clean, later BX3 qualitatively on point; Jewel Kid/Prism in 0.1.37 **“Aligned and clean; easier to follow.”** Reuse this scoped acceptance; do not ask him to repeat solved segments without a relevant change.
- **Previously executed native:** all core controls and 15 library waveform previews retained in 2/4 Horizontal/Vertical Compact Medium; separate beat/bar ruler and shared NOW line; saved master captures. [Current waveform evidence](WAVEFORM_READABILITY_035.md).
- **Previously executed offline:** 225 distinct audio files, including 173 main-folder files and 52 supplemental files; 38 are shorter than 30 seconds. The frozen baseline produced 48 correction proposals: 38 improved the declared independent measure, eight worsened it and two were inconclusive. The later guard rejects unvalidated proposals. This is neither 225 musical listening passes nor an unseen annotated benchmark. [Corpus report](SYNC_CORPUS_034.md).

## Core acceptance ledger

| User outcome | Evidence we retain | Remaining gate |
|---|---|---|
| Import/load two real songs | Native loads and audible real-song playback | Preserve originals; recovery and repeated imports need safety work |
| Play/pause and independent deck operation | User-confirmed playback; native stops/meters | End the remaining practical session with audible silence, stopped timers and no queued restart |
| Channel/crossfader/filter mixing | User-confirmed level silence/return, crossfade and both filter directions/reset | Do not repeat unless changed; broad curves/assignments are separate |
| Manual tempo and jog | User confirmed independent rate/reset and G/H return; small phase correction stayed aligned | One actual manual transition with Sync off, not just equal displayed BPM |
| EQ | Earlier recorded band attenuation; current controls/source checks | Judge LOW/MID/HIGH on one channel at a time, then reset; laptop uncertainty is not failure or acceptance |
| Temporary deck Cue | Ownership/latch regressions pass, prior audition capture | Current human hold-audition/release-return and Cue+Play continuation |
| Sync/grid | Current different-song clean acceptance; guarded drift editor; broad offline corpus | Counterexamples/metrical ambiguity, unsupported coverage, pop/lag remain explicit; no cosmetic snapping |
| Waveform followability | Jason accepted clearer NOW/ruler on the current pair | No all-window/CPU/frame-time/accessibility certification |
| Save/reopen safely | Historical native clean-restart subset | Current malformed-state/restore/quota failure and recovery gates |
| Separate headphone cue/master | Historical hardware subsets only | Suitable connected hardware; computer stereo cannot prove isolation |

## Findings and smallest next fixes

### Must fix for reliable core practice

1. **Restore changes live state before full validation** (`prototype/panels.js:466–520`).
   - What this is: metadata backup import updates crates, settings and tracks.
   - Problem: the actual extracted handler accepted `cues: null` and a numeric Quantize Value, replaced crates, then called persistence before rendering failed. This reproduces partial mutation, not a native corrupted-profile test.
   - Fix: validate a complete temporary candidate, including arrays, scalar types, finite/ranged values and nested cue/loop/grid metadata, before committing; invalid input leaves live and saved state unchanged. Preserve valid older backups through explicit compatibility rules.
   - If skipped: an invalid backup can save unusable state. **LIB-011** owns restore; **SYS-002** owns boot validation.

2. **Saved state has no complete shape guard** (`prototype/app.js:57–104,341`).
   - What this is: boot parses JSON and trusts several fields.
   - Problem: `crates: {}` survives the fallback and fails at `.filter`; malformed settings/cues can break operations or the frame loop. JSON syntax validation alone is insufficient.
   - Fix: normalize validated saved state before constructing the UI, preserve a recoverable original, and expose recovery rather than silently deleting the library. Test boot/reload with invalid types in an isolated profile.
   - If skipped: a bad saved value can prevent reaching recovery controls. **SYS-002**.

3. **Imported color values reach unescaped markup** (`prototype/app.js:395`; `prototype/panels.js:369,496–513`).
   - What this is: track artwork and the color editor interpolate backup metadata.
   - Problem: restore preserves an attribute-breaking color string. Source confirms unescaped sinks. No exploit was executed; native CSP and browser policy differ, so universal script execution is not claimed.
   - Fix: validate the supported color format at import and escape attribute output; add one malformed-color regression with the restore fix.
   - If skipped: a shared backup can inject markup, and execution impact depends on the host policy. **LIB-011**, linked **SYS-002**.

4. **Save failure is easy to miss, with redundant analysis data increasing pressure** (`prototype/app.js:198–272,1216`; `prototype/panels.js:2018`).
   - What this is: settings and metadata are serialized into one localStorage record.
   - Problem: the controlled quota failure returns false and clears sessionSaved, but its generic notice disappears after 3.5 seconds. Analysis stores repeated beat arrays. Exact quota and track-count thresholds were not measured and must not be advertised as facts.
   - Fix: retain a visible unsaved state and a safe export/retry path. Reduce redundant persisted analysis data only with compatibility and analysis-dialog coverage: **the dialog reads `r.grid.beats.length`**, contrary to the older audit's unused-data claim.
   - If skipped: edits after a failed save may disappear on restart. **SYS-002**, with **LIB-011** recovery.

5. **Decoded PCM retention is unbounded** (`prototype/engine.js:149–157`; `prototype/app.js:1104–1120,1201,745`).
   - What this is: import and analysis use the engine's decoded-buffer Map; deck load also preloads scratch audio.
   - Problem: the actual buffer method retains all 50 controlled distinct decodes. Source search found manual clearing but no automatic inactive-buffer bound. Scratch preloading adds another allocation path. This proves retention, not a specific real-memory crash threshold or cause of pops.
   - Fix: measure a representative replacement/import run, then bound inactive resources while protecting active decks, pending decode/analysis/Sync/scratch owners and safe cancellation. Do not delete buffers merely because no currently visible deck names them. Review scratch preparation timing without sacrificing required jog behavior.
   - If skipped: wider imports and longer practice can accumulate memory. **AUD-006** is a gate before wider/long-session validation, not an automatic blocker for a protected two-track listening check.

6. **The practical workflow is still incompletely accepted** (ledger above).
   - What this is: individual controls have stronger evidence than a complete manual mixing workflow.
   - Problem: manual transition without Sync, audible EQ judgment, current Cue hold/release/latch and a final clean stop are outstanding. Passing tests cannot fill these observations.
   - Fix: one focused session on the current/fixed candidate; reset Sync/pitch explicitly, audition EQ one band/channel at a time, then Cue/latch and final stop. Repeat only failed or changed segments.
   - If skipped: we can ship isolated functions without a usable mixing session. **CORE-001, DEK-015, MIX-003, DEK-006/009, CORE-FIX-05/06**.

### Should fix or resolve with discriminating evidence

7. **Intermittent Sync pop/lag remains unresolved** (`prototype/engine.js:496–532`; [investigation](SYNC_POP_INVESTIGATION.md)).
   - What this is: clean recent runs coexist with earlier audible glitches.
   - Problem: the ordinary handoff chooses a 30 ms future start without a late-deadline check in this path. This remains a hypothesis, not the reproduced cause. Correct grids and scheduling are separate from device-output behavior.
   - Fix: capture the next actual occurrence with build, track positions, transport state, clicked deck and event timing; compare internal capture and user-heard output. No speculative deadline/fade patch and no endless clean-case repetition.
   - If skipped: a clean pair may be misrepresented as general audio reliability. **CORE-FIX-01**, linked **CORE-FIX-07**. Full core reliability remains unaccepted while this defect is open.

8. **Sync confidence exceeds available musical ground truth if we generalize the corpus** (`prototype/tempo-drift.js`, `grid-proposal-check.js`; corpus report).
   - What this is: conservative pulse/grid correction and musical beatmatching are distinct judgments.
   - Problem: unsupported coverage, half/double/other metrical ambiguities and downbeat identity remain. Prism's current audible pass does not establish a correct full-track grid.
   - Fix: retain an explicit counterexample set plus new unseen songs; annotate representative audible attacks/metrical interpretation before claiming accuracy. One supported and one unsupported/ambiguous case are more informative than more repetitions of the same clean pair. Preserve original/manual grids unless reviewed changes are saved.
   - If skipped: aligned lines can overstate musical accuracy. **ANA-002/003, CORE-FIX-07, DEK-008**.

9. **Current-state guidance is scattered and stale** (`desktop/README.md`; Trello CORE-001 and feature headers).
   - What this is: current0.1.37 evidence sits above many historical checkpoints and old generic build commands.
   - Problem: the parent still described0.1.31; desktop README still said listening pending, and legacy npm package/start paths differ from the current playback test. History is valuable but not current authority.
   - Fix in this pass: one current audit/queue prefix, correct candidate/listening status and explicit historical build instructions; preserve historical criteria/model guidance. Generic build-tool consolidation remains **SYS-006**, not a prerequisite for this audit.
   - If skipped: the next worker tests the wrong build or repeats accepted listening.

10. **UI cleanup and modularity need boundaries, not a new redesign** (UI-SET-01, UI-TOOL-01, UI-MIX-01, UI-RESET-01, MOD-001).
   - What this is: requested Settings return navigation, production-toolbar separation, spacing and default reset coverage remain legitimate work.
   - Problem: mixing them with audio reliability obscures the completion target. A universal 150/200/300-line rule is not an industry standard or a defect diagnosis.
   - Fix: after the bounded core gates, take Settings navigation, toolbar, reset inventory and mixer spacing as separate changes. Preserve all controls/previews. Before broad refactoring, execute the already-requested reusable skill/repository prerequisite and split by responsibility with regression evidence.
   - If skipped: scope drift repeats; if rushed, a cosmetic or file-size rewrite can regress working controls. **Next**, with full parity **Later**.

## Council verdict and limits

Five fresh same-model advisors covered contrarian, first-principles, expansionist, outsider and executor lenses. All favored narrow state/resource safety followed by practical acceptance. Five fresh reviewers received anonymized response content (condensed for the review packet); identities were withheld, not guaranteed unguessable. No external provider/model diversity is claimed, and agreement is not application proof.

Review surfaced a shared assumption: no advisor established that unbounded cache growth blocks the next short two-track session. Therefore the chair separates **mandatory state/restore protection** from **the wider-import/long-session resource gate**. A protected short listening session can proceed independently; do not make a cache redesign or broader parity its prerequisite. Source reproductions in this audit strengthen restore priority but do not establish a real crash threshold. Two reviewers misread “stale0.1.31 parent” as a stale item count; the verified board count is140 and that inference is discarded.

## Ordered plan, owners and stop conditions

Owner: Codex for bounded implementation/evidence and board updates; Jason for audible acceptance; hardware gates require connected suitable equipment.

1. **Now, audit:** finish report, reconcile all140 card dispositions, refresh current summaries, verify writes/counts. Stop this pass without implementing fixes or rebuilding.
2. **First code slice:** LIB-011 + SYS-002 validation/restore/color safety and persistent save-failure state. Done: malformed input leaves existing live/saved state unchanged, valid backup round-trip works, save failure remains visible, restart has no unexpected playback. Isolated profile first, then affected real UI. No new storage backend required by this audit.
3. **Practical acceptance:** manual transition Sync OFF, EQ per channel, Cue/release/latch, final clean stop; use existing accepted evidence elsewhere. Jason can complete a protected short session before resource work if available.
4. **Resource slice before widening practice:** AUD-006 measurement then bounded inactive ownership; verify repeated loading/import/analysis with both active decks protected, no loss of previews and no new transport interruption. Declare the tested track/session envelope and measured memory behavior; do not invent a target from unmeasured data.
5. **Sync continues as a bounded defect lane:** retain accepted different-song runs, test informative counterexamples, capture an actual pop if it recurs. No unqualified reliability completion while pop/lag remains unexplained.
6. **Next:** Settings return navigation → toolbar separation → reset coverage/mixer spacing. Quick-start content accompanies changed controls; full searchable manual/site and the global modularization skill/repo follow the core gate. No stems/video/new layout variants.
7. **Hardware gate:** independent headphone/master isolation, controller timing/mapping and multichannel routing stay Blocked / unknown until available. A computer-audio milestone must be named as such.

No calendar ETA is justified from this audit: observed failures, user listening availability and hardware determine remaining time. Reassess after the first safety patch and one practical session; do not keep auditing instead of delivering those slices.

## Trello reconciliation policy

Before: **140 open = Core23 + Next23 + Later87 + Blocked4 + Approvals2 + Evidence1**. Promote existing **LIB-011 and AUD-006** from Later and **SYS-002** from Next to Core, explicitly limiting the promoted scope to the safety work above. No new duplicate cards; no feature marked complete from a subset pass.

Verified live readback: **140 open = Core26 + Next22 + Later85 + Blocked4 + Approvals2 + Evidence1**. CORE-001 is the entry point; ordered safety/acceptance/Sync/resource dependencies are explicit. Refresh current summaries on core/Next/approval cards; annotate relevant deferred prior-audit findings without pulling stems, reverse, advanced keylock or broad cleanup into Now. Preserve descriptions' historical evidence, criteria and Codex/Claude recommendations. All140 card identities were preserved;49 descriptions,22 historical-status preservation comments and nine additional audit comments were written. Three cards changed lists; the top12 core cards were ordered. Every changed description and all nine audit comments matched live readback; no card was created, closed or archived. Actual mutation/readback counts are recorded in `../delivery/CORE_DJ_RECONCILIATION_2026-10-21.json`.

## Prior Fable audit disposition

The [20 October repo audit](../../handoffs/claude-to-codex-repo-audit-2026-10-20.md) remains useful input, not an instruction to copy its suggested patches.

| Earlier finding | Current treatment / owner |
|---|---|
|1 PCM retention|Reconfirmed; AUD-006 safety subset Now, wider-practice gate|
|2 save quota/duplicatebeats|Reconfirmed mechanism, exact quota unmeasured; SYS-002 Now; preserve analysis UI consumer|
|3 malformed state/restore|Controlled reproduction; SYS-002/LIB-011 Now|
|4 desktop chunked stems proxy|Source restriction still present; STM-001/003 Later, not exercised here|
|5 eager scratch preload|Source still present; assess under AUD-006 with latency/ownership tradeoff|
|6 long keylock loop/reverse rendering|Prior source finding retained DEK-007; not freshly reproduced|
|7 unbounded setRate/rollback|Engine-boundary gap; normal slider/MIDI/Smart Sync checks already bound rates. DEK-006 targeted adversarial case before claiming normal-control failure|
|8 constant-grid extrapolation|Partly addressed by drift proposals/guards and corpus; ambiguity/unsupported coverage remains ANA-002/003|
|9 unescaped backup color|Confirmed unsafe interpolation; LIB-011 Now; no exploit execution claim|
|10 late Sync handoff|Source hypothesis retained CORE-FIX-01; causality unproven|
|11 invalid loop bounds|Prior finding retained DEK-004, guard behavior differs across transport paths; targeted reproduction before patch|
|12 autoplay after failed load|Prior finding retained DEK-014; not required for manual two-track baseline|
|13 playcounts/time display|LIB-008 deferred; ISO UTC with Z is an explicit timezone, not inherently an incorrect timestamp|
|14 disabled-analysis performance|ANA-006 deferred; prior timing not rerun|
|15 reverse run-out|DEK-010 deferred; not freshly executed|
|16 build command mismatch|Current docs clarified; generic tooling SYS-006 deferred; no destructive packaging rerun|
|17 dev CSP/origin differences|LIB-011 trust-boundary context/SYS-006; distinguish separate-origin libraries from deletion|
|18 missing tests|Too broad as written: scripts contain transport coverage. Fresh pending-Smart-Sync script includes startTokens and cancellation and passes. Standalone sync-alignment fixture omits tokens; retain targeted persistence/engine boundary coverage gaps|
|19 repeated render/history filtering|LIB-008/ANA-006/AUD-006 profile only when relevant; no unmeasured latency claim|
|20 deletion/modularity estimates|MOD-001 deferred; no deletion list accepted from basename references, no files removed|

## Not checked

No new live native interaction, fresh listening, VoiceOver, physical headphone/controller route, memory/CPU soak, browser storage fill-to-quota, exploit execution, independent analysis of the latest recording, every advanced DSP/worklet, full vendored/dependency security review, or deletion/provenance sweep. This is a current core workflow/readiness and board audit with selected source/controlled reproductions, not whole-product security, accessibility or parity certification.

**Lean:** no dependency or code deletion proposed as a prerequisite; no credible fresh deletion total. Preserve working features and historical evidence. **Next re-entry:** reproduce and fix the LIB-011/SYS-002 state-safety slice, then record the missing practical session; do not restart layout exploration.

Skills applied: use; llm-council; pm (product-review, product-prioritization); dec (prioritization, metrics, core principles, quality testing); code-review (applicable validation/caller checks, not unrelated React/style rules); ponytail-audit.
