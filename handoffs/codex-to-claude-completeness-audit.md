# Codex → Claude: independent Serato completeness audit

**Status: ready for an independent audit of this checkpoint. Full 1:1 parity remains NOT PASSED; native development is NOT approved.** Jason requested continued browser implementation and an independent Claude audit. Claude has not been launched automatically.

Project: `/Users/jasonpoindexter/Documents/GitHub/Open Play`
Prepared: 2026-10-16
Current browser candidate: `WORKTREE_DSP_CONTINUATION`
Content hashes: `docs/prototype/candidate-hashes.json`
Private repository: https://github.com/jpoindexter/open-play
Private board: https://trello.com/b/OqMGEjpe/open-play-serato-parity

## Outcome, authority and constraints

Run the complete original brief below as an independent investigation and completeness review. Find what Codex missed, misinterpreted, assumed or inadequately implemented. Derive your own checklist before comparing Codex's inventory. A title, route, disabled control, toast, simulated success or source-level check is not behavioral parity.

Jason has approved investigation, private project records, a functional HTML prototype and continuing fixes. He explicitly requires all Serato DJ Pro capabilities, including expansions, device-specific modes, secondary controls and failures. He has permitted labeled simulations for unavailable hardware/providers, but later emphasized actual functionality. Simulation remains an open implementation/acceptance gap. Do not silently cut scope.

**Do not build or start the native application until Jason explicitly approves an identified prototype revision.** Review completion, a commit or a successful browser test does not grant that approval. Do not publish the repository/board, purchase services, activate trials or alter Serato licensing. Reuse existing private resources.

Hercules DJControl Inpulse 300 MK2 is the test device; Jason reported RCA speakers and 3.5 mm headphones connected. He may unplug it during browser DSP work. Refresh physical connection state before hardware checks. He reports its browser knob moves Serato selection even though our passive capture recorded zero messages. Enumeration and user reports are not raw-input or LED/audio-output proof.

Ghidra is available; Hopper is a demo. Jason explicitly authorized native app navigation and AppleScript/System Events/JXA fallback when accessibility control failed. Preserve his media, Serato preferences and mappings. Raw binaries, screenshots, model weights and disassembly stay in ignored local evidence; do not commit or redistribute them.

This packet requests an audit, not automatic implementation edits or acceptance. Return findings first. Never infer native approval.

## Independent review procedure

1. Read `docs/approvals.md`, applicable instructions, installed-version inventory and `git status`. Record the exact audited revision and any worktree differences. Preserve newer work.
2. Independently enumerate reference controls, states, settings, errors and hardware/provider conditions from installed Serato DJ Pro 4.0.10.213, official manuals, expansion/device guides and applicable release notes. Do not stop at the existing count.
3. Compare that inventory with `interaction-requirements.json`, feature registry, source crosswalk, full plan, Trello and every prototype destination. Resolve conflicting or superseded documentation against the installed version.
4. Reproduce selected binary and UI claims. Distinguish observed, documented, user-reported, inferred, proposed and unknown. Linked libraries and reachable call sites do not prove runtime behavior.
5. Execute public UI workflows and independent signal tests. Cover normal/alternate states, cancellation, pointer release/blur, asynchronous races, empty/error/recovery, persistence, keyboard/drag/drop and matching-size visuals. A module test does not establish its UI integration.
6. Challenge all FX labels, ranges, units, enums, DSP responses, routing/tails; Channel FX; stems; sampler; Pitch Play; Flip; Scratch Banks; slicer; Video; Sync; Link; CDJ/DVS/Phase; MIDI input/feedback; multichannel output; providers and filesystem interoperability.
7. Audit dependency/model licenses and quality/resource evidence. Revalidate per-feature Codex/Claude model names and supported effort settings. Recommendations do not mean those models were executed.
8. Return reproducible findings, sources and proposed corrections. Do not mark a domain complete solely because its labels exist or a test suite is green.

## Current implementation and evidence

Read `docs/prototype/DSP_FUNCTIONAL_REVIEW.md` first for current evidence, and `FUNCTIONAL_REVIEW.md` for the earlier functional baseline. The inventory contains 110 groups and 495 detailed requirements. Two groups (AUD-005 independent-device clock drift, SYS-006 reproducible builds) are Open Play engineering goals without invented vendor manual rows. All 59 FX strips and 236 labels were observed; ranges/enums and sonic matching remain open. Spotify crate behavior uses the applicable 4.0.4+ rule.

Implemented browser behavior includes local decode/playback, cues/loops/reverse/Slip, library metadata/crates/smart rules, backup/restore, sampler, Flip event playback, slicer, local video compositing/capture and browser master recording. Earlier 20/20 module checks and selected UI recording/download/reimport flows are historical evidence for those paths; rerun against this candidate.

New independently implemented audio paths:

| Path actually executed | Scoped result | Remaining boundary |
|---|---|---|
| 55 extended DJ + four Channel AudioWorklet processors | 59/59 browser graphs | Exact vendor sound and full parameter space |
| Original four FX live-update/replacement lifecycle | 5/5 | Clickless transitions and sustained load |
| Observed-control contrast graphs | 220/220 extended +16/16 original | All236 observed labels have executable independent controls; ranges/sonic matching remain open |
| Signalsmith Stretch 1.3.2 MIT WASM Worker | 12/12 browser; 8/8 signal | Buffered preparation latency and music-corpus quality |
| Actual AudioEngine transport/rate/pitch/reverse/loops/cancellation/stem isolation | 18/18 | Physical hardware and exact reference semantics |
| Channel/Stems routes, live history and tail lifetime | 27/27 | Exact reference envelope and transport policy remain unverified |
| Finite captured Stems exit sources | 2/2 | Exact reference transfer functions |
| Sampler keylock/cancellation/repeat/global output bus | 17/17 | Physical cue output, remaining advanced sampler workflows |
| Pitch Play ranges/cues/release/latch/key sync/reset | 13/13 engine; 20/20 policy | Generic/device range conflict and independent harmonic tie-break |
| Analysis Worker | 13/13 | Music-corpus tempo/key/downbeat accuracy |
| Analysis controller | 14/14 | Main-UI long-file cancellation remains untested |
| Local stems preparation from main UI | Four real SCNet buffers ready | Separation quality is not parity |
| Loopback service boundary/cancellation/timeouts | 10/10 | Production deployment/security/uptime |

Evidence lives in `docs/prototype/*results*`, with exact test names and measured values. Counts are not additive feature coverage. Main UI verified key changes, Pitch range/Shift-cue, saved Echo controls, analysis import/reanalysis/locked metadata/reload/reimport, and SCNet preparation. The historical sampler route observation occurred after natural track end and was inconclusive; the new route artifact supersedes it with Playing-state bus measurements. The Stems brake/release UI observation also ended naturally and does not independently prove signal isolation. New main UI evidence verifies first-action preparation, Analyze Stems on load, cancellation feedback and retry with two queued pad actions. Matching preparation coalesces with12 separately labeled adapter checks.

SCNet-large is the current local model candidate: official MIT code and explicit author MIT checkpoint grant, local ignored weights/environment, measured runtime and two held-out excerpts documented in `STEMS_RUNTIME_EVALUATION.md`. All eight source SI-SDR values improved versus Spleeter, but one reconstruction-error test **failed** its unchanged 3% threshold at 3.025%. Do not claim best model, production readiness or Serato quality parity. HTDemucs is research-only until checkpoint terms justify use. Preparation requires the documented local Python/model setup; ordinary browser playback does not.

## Remaining work — challenge these and find others

- All exact FX ranges/enums/defaults and sonic matching; four-deck load and long-session soak. All 236 controls have audio contrasts; four later DSP defects were corrected and passed nine longer browser regressions, with the frozen runtime rechecked at 220/220 extended controls and 59/59 graphs. Exact vendor ranges and sound remain unproven.
- Model-quality failure, Stem Slip independent-clock implementation/state edges and long-file memory/latency. Active captured Stems tails now survive internal transport replacement and natural end; explicit/emergency stop reaches zero in actual browser checks.
- Exact sampler advanced workflows, harmonic Sync/reference conflicts, variable-tempo/beatgrid/downbeat behavior and metadata accuracy.
- Complete Video effect/transition catalogs; conditional settings, keyboard/accessibility and visual equivalence.
- Real library file/tag/interoperability and recovery behavior.
- Raw Hercules input discrepancy, LEDs/jogs, independent headphone/master, latency/hotplug; CDJ/DVS/Phase equipment acceptance.
- Actual Link network and provider integration, accounts and service-specific capabilities. A local account-free design does not remove third-party restrictions.
- Historical gating/removal claims need version-specific evidence; current paid access alone proves no historical removal.

## Files and reproducibility

Start with `PROJECT_PROMPT.md`, `FULL_BUILD_PLAN.md` sections 23–26, `docs/approvals.md`, `docs/research/PARITY_GATE.md`, `FULL_SCOPE_CONTRACT.md`, `FEATURE_COVERAGE.md`, `INTERACTION_REQUIREMENTS.md`, `REQUIREMENT_GAPS_REVIEW.md`, `SOURCE_CONFLICTS.md`, `UI_OBSERVATIONS.md`, `EVIDENCE_LEDGER.md`, `BINARY_FINDINGS.md`, `HARDWARE_HERCULES.md`, `HISTORICAL_GATING.md`.

DSP research: `KEYLOCK_EVALUATION.md`, `STEMS_RUNTIME_EVALUATION.md`, `AUDIO_ANALYSIS_EVALUATION.md`, `SAMPLER_DSP_EVALUATION.md`, `PITCH_PLAY_EVALUATION.md`, `FX_BEHAVIOR_CONTRACTS.md`, `FX_OBSERVED_PARAMETERS.md`, `FX_CONTROL_GAP_MATRIX.md`. Independent review: `docs/prototype/ADVERSARIAL_AUDIO_REVIEW.md`.

Implementation: `prototype/*`, `scripts/serve_prototype.py`, `stem_service.py`, `stem_worker.py`, `scripts/test_*.mjs`, `test_stem_service.py`. Vendor WASM is pinned and licensed under `prototype/vendor`; do not conflate it with proprietary Serato code.

```sh
cd '/Users/jasonpoindexter/Documents/GitHub/Open Play'
python3 scripts/serve_prototype.py
```

Reuse an existing server at http://127.0.0.1:8768/prototype/ . It binds loopback only and blocks raw evidence/Git paths. `Start Open Play.command` is the macOS launcher. Closing/reloading the page stops browser audio; Control-C stops the server. Test pages have public Run buttons and disconnect speaker output; main-interface playback uses the browser default device. Stop playback after tests.

Run the matching `*-test.html` pages for keylock, extended-effects, observed-fx-controls, native-fx-controls, audio-integration, channel-stems-integration, fx-adversarial, stem-exit, sampler-integration, pitchplay-integration, analysis and the historical `behavior-tests.html`. Read each page's real path and tolerances before interpreting green results.

Eight original generated demo tracks are included. Imported audio bytes are session-only; SHA-based identity reattaches saved metadata after reimport. Prototype state is browser-local. Export a metadata backup before reset; never reset Serato's library. Local model/fixture files and user Downloads are not repository assets or authorized upload material.

## Remote records and model routing

All 110 feature cards have existing Codex/Claude recommendation fields. Preserve and revalidate them. Native recommendations remain planning only. Current DSP annotations are being reconciled in `docs/delivery/trello-dsp-sync.json` (19DSP/sampler descriptions have exact readback, plus GATE-P); all 87 source-link jobs now have exact readback; 13 historical functional annotations passed exact readback and four were superseded by newer DSP evidence; zero pending annotations remain. Details are tracked in `trello-source-sync.json`, `trello-functional-sync.json` and `trello-pending-updates.json`. Read back remote descriptions before asserting consistency or replaying updates. Do not overwrite human changes with stale drafts. No card's existence means acceptance.

## Required Claude return

Write `handoffs/claude-to-codex-completeness-audit.md` and a machine-readable findings companion containing:

1. Verdict and gaps first, exact revision/environment, sources/screens/states examined and inaccessible conditions.
2. Each finding's ID, severity, feature/requirement IDs, classification (omission, defect, source conflict, unsupported claim or external acceptance gap), source and exact reproduction steps.
3. Expected versus observed behavior, screenshots/signal evidence where appropriate, and concrete proposed fix with a falsifiable acceptance test.
4. New inventory rows and per-feature Codex/Claude model/effort recommendations where scope changes.
5. License/model/service risks and hardware required for unresolved proof, without silently replacing functionality with simulation.
6. A coverage verdict that does not equate counts with completeness. State native approval remains absent.

Next action: independently derive the reference checklist, then run the actual candidate and challenge it. Do not launch native work or automatically accept the prototype.

Current follow-up proof: `fx-adversarial-browser-results.json` is 9/9; `behavior-results-dsp-integration.txt` is 20/20. Initial 8/9 ordering failure is retained with explanation. Main UI Stems first-use/on-load/cancel/retry/coalesced actions and Prepared-crate drag reached real four-source readiness. Sampler route proof in `sampler-main-ui-route-results.json` supersedes the earlier inconclusive stopped-playback sample. Physical outputs remain unverified.

Stem Slip research now adds REQ-493–495: latched chord, selected-stem clock and vocal-only crossfader behavior. Serato quickstart conflicts with the Hercules manual on release wording; see `docs/research/STEM_SLIP_EVALUATION.md` and SC-12. These newly documented requirements have not yet been implemented or accepted.

## Original full project prompt — verbatim snapshot

Prompt SHA-256: `699d5f1556d148800fda22362be86b6f4acdcaac06dca0f5801b025af1291c8e`

---

# Open Play — complete project prompt

Investigate **Serato DJ Pro for macOS**, then design an independently implemented, **open-source DJ application that closely matches Serato’s interface and functionality without artificial feature limits, subscriptions, paid device unlocks, or a mandatory account**.

**Do not execute this prompt yet. First present your proposed approach and wait for my approval. Once approved, complete the investigation and a full interactive HTML prototype. I must review and approve that prototype before native application development begins.**

### 1. Locate and inspect Serato

Find Serato in my `~/Desktop` folder, including application bundles, installers, disk images, or aliases. Identify the exact product, version, architecture, and available artifacts. If multiple versions exist, inventory them and explain which will serve as the reference.

Use **REA** as the primary inspection tool. I also have **Hopper and Ghidra** installed; select the best tool for each investigation question.

Inspect relevant resources, frameworks, libraries, configuration, device definitions, and executable code. Combine static inspection with controlled runtime observation where appropriate.

Use these official sources as background, checking their applicability to the installed version:

- [Serato website](https://serato.com/)
- [Serato DJ Pro manual](https://support.serato.com/hc/en-us/categories/202698038-Serato-DJ-Pro-manual)

Preserve the installed application and existing music libraries, settings, and device configurations.

### 2. Build a comprehensive feature inventory

Document every discoverable user-facing feature, including:

- **Music libraries:** importing, MP3 and other formats, metadata, artwork, search, sorting, crates, smart crates, playlists, missing files, and external drives.
- **Track analysis:** BPM, beat grids, key detection, waveforms, gain analysis, and caching.
- **Deck operation:** playback, cueing, hot cues, loops, beat jump, sync, pitch, key lock, scratching, slip mode, and transport controls.
- **Performance:** multiple decks, mixing, EQ, filters, effects, sampler, stems, recording, and routing.
- **Audio:** interfaces, master output, headphone monitoring, latency, buffering, sample rates, and device changes.
- **Hardware:** controllers, mixers, CDJs/media players, turntables, and digital vinyl systems.
- **Connectivity:** MIDI, HID, USB audio, drivers, device identification, mappings, handshakes, hot plugging, and reconnection.
- **Access and integrations:** activation, subscriptions, expansions, hardware entitlements, streaming services, and offline operation.
- **Application behavior:** preferences, shortcuts, accessibility, layouts, recovery, and error states.

Distinguish USB storage from USB audio and control devices. Explain how analog turntables, timecode signals, and audio interfaces work together.

Assign each feature a stable ID. Record its user workflow, inputs, outputs, implementation evidence, dependencies, failure modes, and verification method. Maintain a coverage ledger so uninspected features remain visible.

### 3. Trace hardware support and feature restrictions

Trace representative workflows from a user action or hardware connection through the relevant application components to the observable result.

Investigate how Serato identifies devices and determines which capabilities become available. Distinguish:

- Hardware and technical limitations.
- Driver, protocol, and operating-system requirements.
- Account, subscription, expansion, and hardware entitlement checks.
- Commercial partnerships and third-party service restrictions.

I am particularly interested in features that previously worked with a device but later became restricted. Treat this as a hypothesis to verify using version-specific evidence.

Inspect these mechanisms without patching Serato or bypassing activation. Use the findings to inform an independent implementation.

### 4. Separate evidence from uncertainty

Label findings consistently:

- **Observed:** reproduced directly in the running application.
- **Verified in files:** supported by identifiable artifacts or code.
- **Documented:** stated by an official source relevant to the specified version.
- **Inferred:** a supported interpretation that needs further verification.
- **Unknown:** inaccessible or unverified behavior.

Cite documentation URLs, versions, file paths, symbols or addresses where useful, and reproduction steps.

Identify anything requiring physical hardware, proprietary protocol information, server access, or additional testing. Static inspection must not be presented as proof of runtime behavior.

### 5. Select the best open-source foundation, product models, and technology stack

Research current options and make a concrete recommendation. Do not assume building everything from scratch or adding an LLM is necessary.

Compare extending or forking an existing open-source DJ application with building a new application around reusable open-source components. Assess licensing, architecture, maintenance, hardware support, contributor activity, and the effort required to achieve reliable live performance.

Evaluate components and models for:

- Real-time audio, decoding, mixing, routing, and device integration.
- Time stretching, pitch shifting, effects, and digital vinyl processing.
- BPM, beat tracking, key detection, and track analysis.
- Stem separation and other features where machine learning provides measurable value.
- Optional local language-model features only where they address a concrete need.

Distinguish **open-source code, open-weight models, and licenses with usage or redistribution restrictions**. Check code and model-weight licenses separately, including compatibility with the proposed application license.

Rank the top three viable approaches, then recommend one using:

- Audio quality, latency, reliability, and resource use.
- Apple Silicon and Intel Mac support.
- Offline operation and realistic minimum hardware.
- License compatibility, redistribution, maintenance, and integration effort.
- Reproducible benchmarks or focused technical experiments where feasible.

Recommend exact components and versions with primary sources. Label untested recommendations. Keep inference and unpredictable work outside the real-time audio callback.

**Distinguish models shipped inside the DJ application from models used in Codex or Claude Code to develop it.** Development tools must not become mandatory runtime dependencies of the finished application.

### 6. Recommend a Codex and Claude Code model for every feature

For **every feature and actionable work item**, recommend:

- The exact model to use in **Codex**.
- The supported **Codex reasoning-effort setting**.
- The exact model to use in **Claude Code**.
- The supported **Claude Code effort or thinking configuration**.
- Which tool/model combination should be the primary choice.
- A concise explanation based on task difficulty, ambiguity, risk, context needs, expected quality, latency, and cost.
- When to escalate to a stronger model or higher effort.
- Whether independent review is warranted, and the recommended reviewer model and setting.

Verify model names, availability, and supported settings against the installed tools and current official documentation when the work begins. Date the recommendations. Do not invent model identifiers, assume both tools use the same reasoning levels, or claim a setting is available without checking.

If a model or setting cannot be verified, mark it **unverified** and provide a verified alternative where possible. Do not change subscriptions, purchase credits, or modify account settings.

Choose the least expensive configuration likely to meet the acceptance criterion reliably. Reserve stronger models and higher effort for work such as ambiguous reverse engineering, real-time audio architecture, DSP, concurrency, device protocols, and difficult debugging.

Where investigation, implementation, and verification need different configurations, specify them separately. Do not assign one expensive model indiscriminately to every task.

Include these recommendations in:

1. The feature inventory.
2. The implementation plan and milestone breakdown.
3. Every corresponding Trello card.

Keep recommendations synchronized using stable feature and task IDs. Record any later model changes and the reason.

These are **recommendations for executing the work**, not proof that the recommended model has performed it. Distinguish recommended assignments from actual execution history.

### 7. Match Serato’s design and functionality

Use the inspected Serato version as the reference for **visual design, interaction patterns, workflows, and functional behavior**.

Closely match:

- Screen layout, panel arrangement, information hierarchy, density, colors, typography, spacing, and control placement.
- Deck views, waveforms, library browser, mixer controls, cues, loops, effects, sampler, and settings.
- Mouse interactions, keyboard shortcuts, drag and drop, contextual menus, resizing, and visual feedback.
- Hardware connection flows, mappings, routing, playback behavior, and recovery.

Do not replace this with a simplified dashboard or an unrelated redesign. Someone familiar with Serato should recognize where controls are and how common tasks work.

Create a **screen-by-screen and feature-by-feature parity matrix** connecting reference behavior to implementation plans and acceptance tests. Capture reference screenshots and interaction sequences where accessible. Mark inaccessible states explicitly.

Use an original application name, branding, and independently created assets. Implement behavior independently using compatible open-source components.

### 8. Build a full interactive HTML prototype before the native app

After the investigation, create a **complete, locally runnable HTML/CSS/JavaScript prototype** demonstrating the proposed application. It must be a coherent interactive experience, not a landing page, static mockup, or collection of disconnected screens.

Include:

- The main performance interface and supported deck layouts.
- Library browsing, search, sorting, crates, track selection, and loading tracks onto decks.
- Transport controls, waveforms, playheads, cues, loops, tempo controls, mixer controls, and headphone-monitoring controls.
- Effects, sampler, stems controls, recording controls, and relevant panels.
- Preferences, audio routing, controller mappings, device connection states, and hardware setup flows.
- Empty, loading, analysis, disconnected-device, missing-file, and error states.
- Keyboard shortcuts, drag and drop, menus, panel toggles, and resizing.
- Representative demo content and a clear way to reset the demonstration.

Where practical, implement real browser behavior, including local audio-file import, playback, seeking, gain control, and basic mixing. Keep imported audio local.

Where browser APIs, unavailable hardware, or project scope prevent genuine functionality, provide an explicit simulation. Document the boundary between **working browser behavior, simulated behavior, and planned native functionality**.

Do not imply that an animated waveform or simulated device proves audio processing or hardware integration.

Cover every inventoried feature with an interactive implementation, a clearly identified simulation, or an explicit gap with its reason.

Deliver:

- Prototype source and simple launch instructions.
- A running local preview opened for my review.
- A guided walkthrough of the main workflows.
- Screenshots compared with the reference at matching window sizes.
- A feature coverage report and known limitations.
- Results from executing the prototype’s key workflows.
- Codex and Claude Code model recommendations for remaining prototype work and the proposed native implementation.

**Stop at the prototype review gate. Do not begin native application development until I explicitly approve the prototype.** Research experiments and browser prototype code are permitted during this phase; they do not authorize building the native product.

### 9. Specify the unrestricted open-source application

The proposed application should provide:

- All implemented core features without payment or subscription gates.
- No artificial limits on decks, tracks, crates, cues, loops, recordings, or sessions.
- Hardware support based on technical compatibility, without paid device unlocks.
- Local library management and playback without an account or internet connection.
- User-editable mappings and extensible device support.
- Open source code, reproducible builds, and a clear contribution process.

“No limits” means **no artificial product restrictions**. Document practical resource limits and external service restrictions honestly.

Specify the language, desktop framework, audio engine, storage, extension architecture, model runtime, packaging, updates, and testing strategy. Prioritize macOS and assess a practical path to Windows and Linux.

Separate required and optional services. Prefer **no mandatory backend**. Explain unavoidable third-party costs or dependencies.

Define a smallest usable release, followed by milestones covering the full inventory. Include acceptance criteria, hardware tests, performance targets, dependencies, risks, and effort ranges.

For every implementation task, include the recommended Codex model and reasoning effort, Claude Code model and effort configuration, primary choice, rationale, and escalation conditions.

### 10. Create and maintain the repository and Trello board

After execution is approved, create a **private GitHub repository** and a **new Trello board**. Verify their visibility and return their links.

Keep the repository private during investigation and development. Prepare it for an eventual open-source release without publishing it automatically.

Store:

- Research scope and installed-version inventory.
- Feature and visual parity matrices.
- Evidence ledger and reproduction instructions.
- Hardware compatibility and test matrices.
- Component, product-model, and technology-stack comparisons.
- License decisions and dependency inventory.
- Architecture, prototype source, and launch instructions.
- Validation results, known gaps, and implementation roadmap.
- A dated Codex and Claude Code model-selection matrix.

Do not commit Serato binaries, extracted proprietary code or assets, credentials, or sensitive local data.

Organize Trello around research, prototype, review, implementation, hardware validation, and completion. Keep native implementation work pending until prototype approval.

Each actionable card must contain:

- **Task ID and related feature IDs.**
- **Outcome and scope.**
- **Reference behavior and supporting evidence.**
- **Dependencies and blockers.**
- **Implementation approach and relevant components.**
- **Codex recommendation:** exact model, supported reasoning effort, and rationale.
- **Claude Code recommendation:** exact model, supported effort/thinking configuration, and rationale.
- **Primary execution choice and escalation trigger.**
- **Reviewer recommendation**, or an explanation that separate review is unnecessary.
- **Acceptance criteria and concrete verification steps.**
- **Required hardware, fixtures, or test data.**
- **Estimated effort and uncertainty.**
- **Actual execution and verification results**, populated only after the work occurs.

If Trello custom fields are unavailable, include these as clearly labeled sections in the card description. Do not omit model recommendations because a board feature is unavailable.

### 11. Completion criteria for the first approved phase

The first phase is ready for my review when:

- The inspected Serato version and investigation coverage are documented.
- Features, hardware behavior, restrictions, and unknowns are traceable to evidence.
- A specific open-source foundation, product-model selection, and technology stack are recommended.
- Every feature and actionable plan item has a Codex and Claude Code model recommendation with supported effort settings and reasoning.
- Those recommendations appear consistently in the repository plan and corresponding Trello cards.
- The full interactive HTML prototype is runnable and available for inspection.
- Key prototype workflows have been executed and their results recorded.
- Visual and functional differences, simulations, and unverified hardware behavior are clearly listed.
- The private repository and Trello board contain the research, prototype, and proposed build plan.

Report what was actually observed and tested. Clearly distinguish **proposed, implemented, simulated, and verified functionality**, as well as **recommended versus actually used development models**.

**Do not execute anything yet. Present the approach first and wait for my approval. After approval, investigate and deliver the HTML prototype for review before building the native application.**

### 12. Deliver and maintain a thorough Markdown build plan

Create a standalone **FULL_BUILD_PLAN.md** in the project repository, in addition to the interactive HTML prototype and Trello board. It must be a complete, usable planning artifact rather than a brief summary or a promise to document later.

Start with a clearly labeled provisional plan, then update it with verified findings after investigation. Preserve the distinction between a planning assumption and a selected, tested implementation. A pre-approval planning file does not authorize execution of the investigation or build.

Include:

- Project outcome, user workflows, scope, constraints, authority, approval gates, and explicit definitions of done.
- Reference product/version inventory; evidence labels, sources, uncertainties, and a coverage ledger.
- Every discoverable feature, stable IDs, behavior/state requirements, visual and functional parity, dependencies, failure/recovery behavior, and acceptance tests.
- Comparative open-source foundation and technology-stack evaluation, exact chosen versions when verified, license compatibility, tradeoffs, alternatives, and architecture decisions.
- Audio engine, DSP, timing, concurrency, decoding, analysis, caching, library data, persistence, routing, device protocols, and extension architecture.
- Product-model evaluation for stems and analysis, including exact code/weight licenses, runtime, resource budgets, quality evaluation, and offline provisioning.
- A full HTML prototype specification, screen/state inventory, real versus simulated behavior, launch instructions, user walkthroughs, and prototype review criteria.
- A per-feature and per-task Codex/Claude Code model matrix: exact model, supported reasoning/effort setting, verification date/source, primary choice, rationale, escalation/fallback, reviewer, and actual execution history.
- Native delivery milestones, smallest usable vertical slice, task dependencies, best/realistic/worst estimates with assumptions, and re-estimation checkpoints.
- Hardware compatibility matrix and access requirements, including turntables/DVS, mixers, controllers, CDJs, USB audio and storage; no unsupported universal compatibility claims.
- Performance targets, test fixtures, DSP and audio tests, visual comparisons, keyboard/accessibility checks, offline tests, failure recovery, installed runtime tests, and release evidence.
- Required versus optional services, account-free local operation, security/privacy boundaries, packaging, updates, reproducible builds, and eventual open-source release preparation.
- GitHub/Trello structure, required card template, task IDs, synchronization rules, complete task/model recommendations, blockers, decisions, risks, handoffs, and exact re-entry steps.

Use readable sections, a navigation list, and tables for comparison. Be thorough without repeating the same requirements in multiple places. Put detailed supporting inventories and raw evidence in linked companion documents as they are created. Keep this Markdown plan the canonical source of scope and sequencing; reconcile Trello with it without overwriting human changes.

Every feature and task must resolve to actual verified model recommendations before execution. Do not fill unknown Claude Code model names, reasoning settings, prices, licenses, or hardware results with guesses. State unresolved fields plainly and specify the action needed to resolve them.

Return clickable links to the full Markdown build plan, the complete saved project prompt, and—only after execution approval—the running HTML prototype, private repository, and Trello board. Document checks prove the files exist and are structurally complete; they do not prove the proposed application works.

**Maintain both approval gates: obtain execution approval before investigation/prototype work, and explicit approval of the presented HTML prototype before native application development.**
