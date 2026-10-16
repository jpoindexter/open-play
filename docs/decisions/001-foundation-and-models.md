# Foundation and product-model recommendation

Date: 2026-10-16. Status: provisional research recommendation; no native implementation, benchmark, fork or dependency installation performed.

## Recommended direction

Evaluate a maintained Mixxx-based C++/Qt foundation first. This offers the strongest starting point for the requested open-source desktop DJ behavior because its existing project already addresses decks, library, audio processing, controller mappings and cross-platform distribution. The work remains substantial: a Serato-familiar interface, behavior differences, missing integrations and device validation cannot be reduced to a new skin.

Use an independently authored HTML/CSS/JavaScript prototype to validate the complete interaction specification before changing any native engine. A browser prototype will not establish native callback deadlines, DVS performance, CDJ HID support or hardware audio routing.

## Ranked candidates

| Candidate | Benefit for this project | Principal cost and decision gate |
|---|---|---|
| Mixxx foundation, C++/Qt, existing engine and controller system | Reuses an established open-source DJ application and its test/mapping infrastructure | Pin an appropriate stable commit; audit feature deltas and licenses; avoid permanent divergence where upstream fixes can be retained |
| Independent C++ audio engine with Qt interface | Maximum control over exact state machines and UI | Reimplements transport, routing, scratching, library and compatibility; higher engineering and validation burden |
| Rust engine with a separate desktop interface | Strong ownership boundaries and portable components | More integration work for DJ-specific DSP and hardware; evidence has not shown this reduces total risk or reaches parity faster |

Selection is an engineering recommendation, not a measured speed or quality ranking. Do not claim a wrapper delivers full parity. A native stack decision becomes accepted only after the parity delta and a measured audio/hardware spike following prototype approval.

## Proposed module boundaries

| Module | Proposed responsibility | Acceptance boundary |
|---|---|---|
| Audio callback | Preallocated transport, mixing, DSP and output buffers | No blocking filesystem, network, model inference, logging or UI locks in callback |
| Control engine | Commands, deck ownership, cue/loop/sync state, smoothing | Defined timestamp/order semantics, no stale UI overwrites |
| Device layer | CoreAudio, CoreMIDI, USB/HID adapters and device profiles | Identity, control transport and audio routes independently verified |
| Library | SQLite-backed identity, crates, cues, analysis references and migrations | Transactions, recovery, read-only Serato import first, no implicit tag overwrite |
| Analysis workers | Decode, waveforms, BPM/key, stem jobs | Cancellation, priorities, content/model cache versioning and bounded resource use |
| Interface | Measured reference layouts, keyboard input, panels, preference state | Original assets; dense performance controls; explicit connected/missing/failed states |
| Optional services | Provider authentication, update metadata, opt-in sharing | Failure cannot block local library/playback/recording; no core account service |

For macOS, test CoreAudio and CoreMIDI against the connected Hercules before promising a minimum latency or device capability. Retain existing foundation abstractions where suitable; do not replace them merely to satisfy a preferred language. Native real-time work remains behind prototype approval.

## Product AI selection

There is no need for a general LLM in the performance engine. Development models are listed separately in DEVELOPMENT_ROUTING.md. For four-part stems, use **HTDemucs as the first reproducible evaluation baseline**, not an asserted final winner. Its four-source output matches the required vocal/bass/drums/other interaction contract. Keep cached/offline preparation as the first integration path; do not advertise real-time separation without measurements.

Compare an appropriate four-source SCNet checkpoint as the resource-efficiency challenger, and a licensed RoFormer checkpoint for quality-focused preparation. A vocals/instrumental model alone cannot satisfy four-part separation. Exact checkpoint, hash, weight license, sample rate, output order, memory and accelerator support must be recorded before distribution. MIT code licensing does not automatically establish rights for every downloadable checkpoint.

| Evaluation | Required evidence |
|---|---|
| Quality | Rights-cleared mixed/stem fixtures across genres, blind listening, leakage/transient/artifact checks and per-source metrics |
| Timing | Input/output alignment, reconstruction consistency and measured first-result/whole-track throughput |
| Resources | Peak unified memory, CPU/GPU load, battery impact and cancellation behavior during 2/4-deck playback |
| Reliability | Unsupported device, allocation failure, worker crash, invalid model/cache and interrupted write recovery |
| Distribution | Exact code/weight notices, redistribution permissions, dependency hashes and reproducible model download verification |

No weights have been downloaded or run. The best production checkpoint remains an evidence gate; claims of a measured winner would be premature.

## Source evidence

- [Mixxx source](https://github.com/mixxxdj/mixxx), inspected main commit `0fffd3d0d07b755c34c1730f7b87afadd8f2be19` for repository paths, not as an approved release base.
- [Mixxx licensing](https://github.com/mixxxdj/mixxx/blob/main/LICENSE): core GPL licensing and separately attributed dependencies require retaining the applicable notices.
- [Existing Inpulse 300 mapping](https://github.com/mixxxdj/mixxx/blob/0fffd3d0d07b755c34c1730f7b87afadd8f2be19/res/controllers/Hercules-DJControl-Inpulse-300-script.js): useful comparison for controls and feedback. It does not itself prove MK2 compatibility.
- [Demucs](https://github.com/facebookresearch/demucs): four-source baseline; upstream repository is archived, so maintenance and runtime packaging need a separate decision.
- [Source-separation training implementations](https://github.com/ZFTurbo/Music-Source-Separation-Training): includes HTDemucs, SCNet and RoFormer architecture options. Architecture support is not evidence for a particular checkpoint's quality or redistribution rights.
- [Audio Separator](https://github.com/nomadkaraoke/python-audio-separator): useful candidate evaluation harness, not a required native runtime dependency.

## Services and unrestricted operation

Required hosted services for local DJ operation: **none proposed**. GitHub and Trello support development, not the running app. Optional distribution may use static release hosting and signed update manifests; optional live-playlist sharing needs an explicitly opted-in service. Third-party streaming remains subject to the provider's authentication and supported SDK/API capabilities. Unavailable provider access must not disable local playback or be disguised as an Open Play paywall.
