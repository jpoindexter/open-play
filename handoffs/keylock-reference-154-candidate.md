# Handoff: Codex to next implementer — browser DSP reference candidate

Date:18 October2026. Project:`/Users/jasonpoindexter/Documents/GitHub/Open Play`. No agent/reviewer was launched by writing this packet.

## Goal and current fact

Remove inaudible-bank influence on active audio while preserving coherent original/Stem playback and all existing source/owner/transport behavior. This is one gap within the full110group/522requirement/9beta/26release,55extendedFX/Stems/keylock goal; all full-parity flags remain false. Read `docs/prototype/REPLACEMENT_CLOCK_154_REVIEW.md`, `FULL_BUILD_PLAN.md`, `docs/delivery/ACTIVE_EXECUTION.md` and the full `handoffs/codex-to-claude-completeness-audit.md`.

The actual eighteen-channel published WASM differential at−2semitones changes original and active old Melody when only inactive-bank PCM is populated.150259samples differ per stream, first global frame407437, original control/treatment min10msRMS0.9899878577/0.9351930767. Browser−2monitor matches the treatment's minimum time/ratio, but no raw−2browser stream was captured. On +3both active control/treatment streams are identical; after source-aware future PCM availability, all three actual +3browser raw streams match replay bit for bit,529200samples each. Keep initial missing-future-fill replay's failed full comparisons. Old151 +3dip0.7320637461 remains open.

## Exact implementation candidate

Use one reference-policy change in pinned MIT C++, with no gain/phase fitting: for reserved eighteen-channel Stem groups, derive common phase reference and mapped-frequency aggregate energy from the original stereo pair. Keep each channel's own input/prediction energy and the remaining stereo/relative-phase synthesis. Ordinary geometries must retain existing policy. Upstream `signalsmith-stretch.h` selects the maximum-energy channel in `processSpectrum`; `smoothEnergy` aggregates all inputs. Exact published-WASM instruction provenance is not proved; a same-source/compiler stock-versus-candidate experiment must test this hypothesis before promotion.

First compile stock and candidate from the same source/dependency/compiler. Separate the policy effect from a compiler/dependency rebuild. A compile-time option scoped to eighteen channels is sufficient for the bounded experiment; do not introduce a generic configuration product flow or rewrite the audio engine. Keep the published wrapper/module intact until actual evidence justifies integration.

## Build inputs already available

- SDK:`local-evidence/toolchains/emsdk-open-play`, Git3b3963d86a5c97adaf6eaa845cdfe0b811c2f960; Emscripten4.0.18/tagfae107463db4d20a276a27ede393048deaeebf76; compiler version executed. No candidate has been compiled yet.
- Set `EM_CONFIG` to the absolute SDK`.emscripten` path in the build process environment. `EM_CACHE` can remain under SDK`upstream/emscripten/cache`. Invoke SDK`upstream/emscripten/em++` directly; no shell startup changes or install-latest script.
- Source:`local-evidence/replacement-clock-154/upstream-build/`; `signalsmith-stretch.h`, `web/emscripten/main.cpp`, `pre.js`, upstream compile script and MIT licenses. Header/bridge pinned to official commita670068d9aeb64913331d5cc29337b19a457a7df, Linear inputs under`signalsmith-linear/` pinned146b26f91b48835d665fa0498d64d9617818d27a. Public source/toolchain hashes:`docs/research/keylock-reference-154-{source-inputs,toolchain}.json`.
- Original compile flags are in fetched`web/emscripten/compile.sh`: C++11/O3/fast-math/no exceptions/no RTTI, modularized single-file WASM, filesystem off, dynamic execution off, memory growth enabled. Keep stock/candidate flags equal. Add ES module factory export as needed for an isolated diagnostic; do not execute the upstream auto-install code. Some legacy flags may require adaptation to Emscripten4; record exact commands and output identities.
- Preserve fetched originals; build a copied candidate tree and retain the minimal MIT patch. Additional missing header dependencies must come from the same pinned official Linear tree, with hashes.

## Exact reproduction inputs and scripts

Browser original:`local-evidence/stem-resource-150/browser-exports/852078ad6f654b6986751629bcf35304.json`,21584879bytes/SHA17a3428bb0397108ad7d559313f84eb06cf79aaa2d325be3b98d8714c2c8fcb4.

Source-aware producer:`experiments/replacement_sources_154.mjs`. Private originals/whole PCM:`local-evidence/replacement-clock-154/source-aware-replay/`. Inspector:`scripts/inspect_replacement_clock_154.py`. Public results:`docs/prototype/replacement-sources-154-results.json`.

The producer replays exact recorded startup, first command and all recorded replacement render counts/ranges for +3and−2. Future first-bank availability is declared synthetic, before seek visibility, following actual fill source semantics. It does not emulate actual async transfer/append/drop/gate fades. Keep these limits. Create distinct stock/candidate output folders; do not overwrite earlier source hashes/PCM or relabel a new cohort as the old one.

## Required evidence before promotion

1. Execute the recorded differential with the rebuilt stock module and establish that the observed interaction is retained; report any baseline divergence from the published module. If stock does not reproduce, investigate source/build differences before interpreting candidate success.
2. Execute the same candidate schedule/data and inspect all complete original/old/new outputs. Inactive-bank population must not perturb original/old output in either recorded case; require actual new-bank nonzero output so a muted/no-op candidate cannot pass. Retain whole PCM, source hashes and failed cases. Do not relax0.85 or fit gain/time/phase.
3. Only then integrate the browser candidate and run actual production four-deck Prepare/first-pad/mute/restore/Stop, including repeat/cancel ownership where changed. Preserve existing no-click/no-gap/original-PCM/clock criteria. This is still authored-fixture evidence; musical quality, old151startup, other transports, resources/deadlines, native/hardware/reference acceptance remain separately open.

## Preservation and return

No native app/package/repackage or edits to frozen0.1.23/tested272mappings/launchers/user8768. No timed MIDI capture, hardware output or readiness questions while Jason is away. Official Serato source and Alternative mappings stay distinct. Never commit raw Serato resources, ignored audio/PCM, SDK binaries or credentials. MIT source patches/build recipes are acceptable with license/provenance. Keep plan, three STM-001/STM-003/DEK-007 Trello records, model-effort routing and full Claude handoff current, preserving the exact original20996byte prompt suffix. FullClaudeaudit remains unlaunched.

Return exact source/build identities, minimal patch, observed stock/candidate results, actual browser evidence if reached, failures/limits and next action. A successful build or serial lower-layer check alone is not browser/full-parity acceptance.
