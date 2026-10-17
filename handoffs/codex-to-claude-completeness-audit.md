# Codex → Claude: independent Serato completeness audit

**Full 1:1 parity remains NOT PASSED. Native development is NOT approved.**

Project: `/Users/jasonpoindexter/Documents/GitHub/Open Play`
Prepared: 2026-10-16
Current browser candidate: `e36596379377bfb4778db97aa7a3bc9cd2aa8a8a`
Content hashes: `docs/prototype/candidate-hashes.json`
Private repository: https://github.com/jpoindexter/open-play
Private board: https://trello.com/b/OqMGEjpe/open-play-serato-parity

## Goal and authority

Run the full original brief below independently. Find what Codex missed,
misinterpreted, assumed or inadequately implemented. Derive your own reference
checklist before comparing the existing inventory. A label, route, simulation,
source trace or green adjacent test does not establish behavioral parity.

Jason authorized investigation, private records, functional HTML implementation
and continued fixes across all Serato DJ Pro capabilities, expansions, device
modes, secondary controls and failure states. He permits clearly labeled
simulations where hardware/providers are unavailable, but requires actual
functionality; simulations remain open acceptance gaps. Preserve that scope.

**Do not start native development until Jason explicitly approves an identified
prototype revision.** Do not publish the repository/board, activate trials,
purchase services or alter Serato licensing. Preserve media, preferences and
mappings. Raw Serato binaries/screenshots/disassembly, weights and private audio
stay in ignored local evidence; do not commit or redistribute them.

The Hercules DJControl Inpulse 300 MK2 is the available test device. Jason reported
RCA speakers and 3.5 mm headphones connected, but may unplug it during browser DSP
work. Refresh physical state before testing. He reports Serato's browser selection
moves with its knob despite zero messages in our passive capture. Enumeration and
reports do not prove raw input, LEDs, jogs or audio routes.

Ghidra is available; Hopper is a demo. Native navigation plus AppleScript/System
Events/JXA fallback were explicitly authorized when accessibility failed.

This packet requests an independent review, not automatic acceptance or native
implementation. Claude has not been automatically launched for this audit. Jason
separately authorized using the open Cloud Code app, a new conversation and Fable
**if Codex gets stuck**. Verify the actual app/model option before using it. That
conditional debugging permission does not remove the native approval gate.
A bounded local reference-research session was subsequently started with the
observed Fable5.1/High selector (session local_501fea16-fb28-4e3c-bba7-2e24e6ef696b);
see docs/research/claude-fable/video-reference-debug-prompt.md and approvals.md.
It is not the full completeness audit; its source claims need independent checks.

## Read first

- `AGENTS.md` if present; `PROJECT_PROMPT.md`; `docs/approvals.md`.
- `FULL_BUILD_PLAN.md` sections23–35, with older sections retained as dated history.
- `docs/research/PARITY_GATE.md`, `FULL_SCOPE_CONTRACT.md`, `FEATURE_COVERAGE.md`,
  `INTERACTION_REQUIREMENTS.md`, `REQUIREMENT_GAPS_REVIEW.md`, `SOURCE_CONFLICTS.md`,
  `UI_OBSERVATIONS.md`, `EVIDENCE_LEDGER.md`, `BINARY_FINDINGS.md`,
  `HARDWARE_HERCULES.md` and `HISTORICAL_GATING.md` (all in `docs/research/`).
- `docs/prototype/DSP_FUNCTIONAL_REVIEW.md`, `STEM_SLIP_FUNCTIONAL_REVIEW.md`,
  `ADVERSARIAL_AUDIO_REVIEW.md`, `VIDEO_FUNCTIONAL_REVIEW.md`,
  `KARAOKE_FUNCTIONAL_REVIEW.md`, `MEDIA_CRATE_FUNCTIONAL_REVIEW.md`, and the
  historical `FUNCTIONAL_REVIEW.md`.
- `docs/research/KEYLOCK_EVALUATION.md`, `STEMS_RUNTIME_EVALUATION.md`,
  `AUDIO_ANALYSIS_EVALUATION.md`, `SAMPLER_DSP_EVALUATION.md`,
  `PITCH_PLAY_EVALUATION.md`, `FX_BEHAVIOR_CONTRACTS.md`,
  `FX_OBSERVED_PARAMETERS.md`, `FX_CONTROL_GAP_MATRIX.md`,
  `STEM_SLIP_EVALUATION.md` and `VIDEO_CATALOG_EVALUATION.md`.

## Current implementation and executed evidence

The working inventory has110 groups and521 detailed requirements. AUD-005 clock
drift and SYS-006 reproducible builds are independent engineering goals without
invented vendor interaction rows. Counts do not prove exhaustive coverage.

| Executed path | Result | Important limit |
|---|---|---|
| 55 extended DJ +4 separate Channel Worklet graphs |59/59|Not59 DJ reference algorithms|
| Original four processors, update/replacement lifecycle |5/5|Not every topology is proven gapless|
| Observed controls |220/220 extended +16/16 original|Ranges/full enums/sound matching open|
| Longer adversarial FX audio |9/9|Specific decay/update/sweep/Stretch regressions|
| Pitch Worker / actual engine integration |12/12;18/18|Buffered processing, native latency unproven|
| Channel/Stems live history and finite-tail lifetime |27/27; separate finite graph2/2|Vendor envelopes/topology unmeasured|
| Sampler keylock/global bus |17/17 +main UI route proof|Physical headphones unverified|
| Pitch Play |13/13 engine;20/20 policy|Device/generic range conflict retained|
| Analysis Worker/controller |13/13;14/14|Music accuracy/long-import cancellation open|
| Actual Stem Slip Worklet/engine/cue controller |30/30|Independent policy, no T10 acceptance|
| Stem Slip kernel/engine boundaries; UI controller collaborators |30/30;19/19|Do not substitute for browser/hardware proof|
| Ordinary cue/Slip/audio/module baseline |20/20|Not full UI parity|
| Local service ownership/traversal/cancel/timeouts |10/10|Not full production security/uptime|

Evidence lives in `docs/prototype/*results*`; inspect exact cases and thresholds.
The final Stem Slip browser artifact is `stem-slip-browser-results.json`. Real
main UI SCNet preparation retained focus; quick/held keyboard scratching entered
musical release, rejoined while armed, and explicit pause stopped playback.
`stem-slip-main-ui-results.json` and its screenshot record that path. Source and
controller tests retain narrower scope labels. The initial27/28 analyser-window
failure and earlier FX8/9 ordering failure remain saved and explained; thresholds
were not loosened. Rate/first-arm ownership, rapid control reuse, focus and paused
release/resume regressions are included.

SCNet-large runs actual local four-source inference under explicit author MIT
permission. All eight source SI-SDR values improved over Spleeter on two held-out
excerpts, but one reconstruction-error result failed the unchanged3% gate at3.025%.
Do not claim best model, production quality or Serato separation parity. Local
weights/environments are ignored. HTDemucs remains research-only pending terms.
Prototype preparation has10-minute/128MiB inputs, four queued/running jobs and a
15-minute worker timeout; the no-limits product objective is not achieved.

Stem Slip is actual independent selected/backing transport, not muting the full
mix. Its declared release/mixer policies remain distinct from reference facts.
The Serato T10 quickstart and Hercules manual conflict on release wording; the
manual documents latched selection and vocal-only crossfader behavior. REQ-266 and
REQ-493–495 preserve that distinction. Exact initial states, T10 mapping, vendor
quantization/topology and combined Pitch Play/Flip/Slicer workflows remain open.

Video now executes55 original effects and34 original transitions (separate
Crossfade baseline included), six ordered channel/master slots, text/image layers,
real FFT/linked/reverse transport, actual first-frame File decode, recording/replay,
CDG karaoke and Media Crate. Reference provenance is47 manifest effects +8
localized candidates and7 transitions +26 candidates; active menus and vendor
algorithms/ranges/defaults remain unverified. No vendor code/assets copied.

| Actual browser path | Result | Limit |
|---|---:|---|
| Video effects / transitions / overlays |72/72;51/51;32/32|Independent pixel contracts only|
| Full pipeline |32/32|Real File/AudioEngine/FFT, six slots, reverse/queued-seek pixels and actual container video/audio decode; no sustained/HD/native claim|
| CDG decoder / karaoke integration |21/21;19/19|Original packets, actual clock/GPU/capture; physical/commercial/reference parity open|
| Media Crate |32/32|Real files/pixels/association/fallback/Random/Next/ownership and six fresh paused imports|

Thirteen separate Node scripts exited0; each controlled/pure scope is recorded in
`video-node-checks.json`. Main UI executed FX/presets/image and flag persistence,
recording across panel changes, actual downloaded replay, MP3+CDG import/play/pause
and Media association/Next/fallback. Initial alpha/seek/first-frame failures remain
saved. First-frame replacement waits for an actual muted presented frame; capture
and import generations preserve newer user intent. Read current reviews, exact
raw results and independent contracts in `video-implementation-contracts.json`.
A≈25.64fps short pipeline capture is not sustained30fps or nativeHD acceptance.

Semantic exact-name Echo/Distortion links now pass24/24 actual GPU/audio checks;
Media Treatment passes21/21 with decoded aspect fixtures and actual captured
video/audio. Current pipeline32/32, Media32/32 and karaoke19/19 pass again. Read
VIDEO_LINK_TREATMENT_REVIEW.md; zero-feedback shader and seek/resize failures
remain saved. Sixteen Node scripts exit0 with separate scopes. REQ-496–507 add12
omitted observed settings; labels and menus do not prove behavior.

Next: generic Video control/quality/window/recording/arrangement workflows, output/
Syphon and codec/long-session matrices. All31 hidden audio-linked definitions and
reference visual matching remain unknown. CDG selective channels/parity repair
and physical AV sync remain open. Continue full scope; do not equate these
independent browser subsets with full1:1.

## Independent audit procedure

1. Record exact revision, worktree differences and environment before testing.
2. Independently enumerate installed4.0.10.213 controls/states/settings/errors,
   expansions, device/provider guides and applicable release notes. Do not stop at507.
3. Compare that checklist with requirements, registry, source crosswalk, full plan,
   Trello and every prototype destination. Resolve sources against exact versions.
4. Reproduce binary/UI claims; separate observed, documented, reported, inferred,
   proposed and unknown. A library symbol or manifest is not runtime acceptance.
5. Run public UI/audio paths: alternate states, cancellation, pointer/key release,
   blur, async replacement, empty/error/recovery, persistence, keyboard/drag and
   matching-size visuals. Derive tests that can refute the existing green checks.
6. Challenge all FX parameters/ranges/enums/routing/tails; Stems/Stem Slip; sampler;
   Pitch Play; Flip; Scratch Banks; Slicer; Video; Sync/Link; DVS/CDJ/Phase;
   raw MIDI/feedback; multichannel output; providers; filesystem interoperability.
7. Revalidate dependency/model licenses and quality/resource evidence. Routine
   execution uses Codex Sol/high; bounded Astra escalation needs an unresolved
   measured dispute. Claude model/effort recommendations are planning choices,
   not proof of installed availability or authorization to launch an agent.

## Remaining work — challenge these and find others

Exact FX ranges/modes/defaults and sonic matching; four-deck load/long-session soak;
model-quality failure; Stem Slip source conflict and combined workflows; sampler
advanced state paths; variable tempo/downbeat/key/gain accuracy; exact Video catalog/controls/semantic links,
CDG channels/parity/HD/Syphon; library files/tags/interoperability/recovery; conditional
settings, shortcuts, accessibility and exact visual states; real Link/providers;
Hercules raw input discrepancy/LED/jog/headphone/master/latency/hotplug; unavailable
CDJ/DVS/Phase acceptance. A browser fixture does not remove external restrictions.
Historical feature-removal/gating claims need version-specific evidence.

## Reproduce and project records

```sh
cd '/Users/jasonpoindexter/Documents/GitHub/Open Play'
python3 scripts/serve_prototype.py
```

Reuse the server if already running at http://127.0.0.1:8768/prototype/ . It binds
loopback and blocks raw evidence/Git paths. `Start Open Play.command` is the launcher.
Test pages expose Run buttons and disconnect speakers. Main UI uses the default
browser audio device; stop playback after testing. Imported audio bytes are
session-only; reimport reattaches SHA-identified metadata. Back up before resetting
prototype state; never reset Serato's library. Generated demos are original assets.

Run the actual `*-test.html` pages for extended/observed/native/adversarial FX,
keylock, audio integration, Channel/Stems, finite exits, sampler, Pitch Play,
analysis and Stem Slip, plus `behavior-tests.html`. Also run video-audio-fx-harness.html and
video-treatment-harness.html, and the Video FX,
transition, overlay, pipeline, CDG, karaoke and Media Crate public harnesses listed
in `prototype/README.md`. Read each scope/tolerance first.

All110 feature cards retain model/effort recommendations. Source sync is87 verified,
zero pending;13 historical functional additions passed exact readback and4 were
superseded by newer DSP evidence. Nineteen earlier DSP/sampler records, Stem Slip,
GATE-P and VID-002 research have separate readbacks. Consult `docs/delivery/trello-*.json`.
VID-001, VID-002 and GATE-P current Video annotations passed3/3 exact readbacks
(`docs/delivery/trello-video-functional-sync.json`); all remained open/incomplete.
Fresh-read descriptions before updates; preserve human/source/model sections.
Latest semantic/treatment/507-row annotations also passed3/3 exact readbacks
(`docs/delivery/trello-video-link-treatment-sync.json`), with cards open/incomplete.
Record synchronization is not feature acceptance.

## Required return

Write `handoffs/claude-to-codex-completeness-audit.md` and machine-readable findings:

1. Gaps/verdict first, exact audited revision/environment, sources/screens/states
   examined, and inaccessible conditions.
2. Finding ID/severity, feature/requirement IDs, omission/defect/source-conflict/
   unsupported-claim/external-gap classification, source and exact reproduction.
3. Expected versus observed, screenshots/signal evidence, concrete correction and
   a falsifiable acceptance test.
4. New inventory rows and per-feature Codex/Claude model/effort recommendations.
5. License/model/service/resource risks and hardware needed for unresolved proof.
6. Coverage verdict without equating counts with completeness. Native approval
   remains absent. Do not silently replace functionality with simulation.

## Latest recovered-manual checkpoint

Read `docs/prototype/VIDEO_MANUAL_RECORDING_REVIEW.md` first. Actual corrected
Video FX74/74,transitions55/55,Media32/32,recording-quality23/23 and pipeline32/32
pass. Main UI480p persists after reload and downloads854×480VP9/Opus while live
output remains640×360. Prior contracts remain historical. Manual crosswalk89
entries and provisional workflow gaps require independent review; these are not
claims of current visual equivalence. REQ-498 is implemented independently. Recovered manual reconciliation adds
REQ-508–521 for14 distinct workflows; all47 proposals have explicit dispositions
in docs/research/video-manual-registry-merge.json. None is automatically accepted.

Fable5.1/High bounded research completed in its separate session. Read
`docs/research/claude-fable/video-reference-findings.md` together with
`PARENT_VALIDATION.md`; stronger cache/current-registration claims were rejected.
The public141226manual was independently recovered/hashed and has2015metadata.
Installed Effects/Info controls were observed; Video restoredOFF and Setup closed.
Do not treat historical manual prose, a55-effect cache or NoRestrictions readout
as proof of current GPU algorithms. Native approval remains absent.

## Current menu/color/traversal/finite-fade checkpoint — 17 October

Read docs/prototype/VIDEO_COLOR_CROSSFADE_REVIEW.md first, then the two
independent reviews. Actual FX81/81,transitions65/65,finite fades11/11 and current
assembled pipeline32/32 pass. Main UI7 observations execute real speed/buttons,
link states, stop/persistence and completion after panel replacement. Hidden-panel
scheduling defect was independently reproduced, fixed and regression tested.
Initial fade-oracle and stale Gamma-oracle failures are retained with explanations.
18 current Node Video scripts exit0 with their declared controlled/pure limits.

Mac is unlocked. Installed4.0.10 menus now directly observed55 FX/29 transitions;
four extra localized transitions are resource-only in this session, alongside
Open Play's Crossfade baseline. Menu names are not reference shader acceptance.
Video restoredOFF,Setupclosed; prior window-mode restoration remains unverified.
Source observation: docs/research/VIDEO_CURRENT_MENUS_20261017.json.

Finite fade is independent linear.25..10s, duration snapshot, exact target/stop,
reversal and Reduced Motion. Speed measured416ms versus10065ms including UI
overhead. Separate crossLinked no longer couples crossfade to transport/upfaders.
REQ505/513 record executed independent paths; REQ512 still lacks per-channel
opacity controls/links. Isolator Bass, finite Frame Freeze, actual eight-band
Analyzer and further manual meanings remain open. Preserve all broader gaps and
model/effort routing. Full parity and native approval remain false.

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
