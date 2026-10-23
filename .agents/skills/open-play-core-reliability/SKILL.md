---
name: open-play-core-reliability
description: Reproduce and repair a bounded core DJ transport or rendering defect with isolated real-track evidence and Trello readback.
---

# Open Play core reliability

**Status:** Candidate procedure for owner review. Not a standing approved skill or expanded permission grant. No global installation. Runtime proof, automated tests and owner sign-off are separate.

## Purpose

Reduce one reproduced core mixing failure without redesigning layouts, hiding controls, dropping waveform previews or claiming full vendor parity.

## Inputs

- Current user scope, branch, build-plan/handoff prefix and original prompt.
- Reproduction, last executed evidence and current Trello cards.
- A pinned manifest of local real audio with hashes, sizes and mtimes; no original audio in Git or Trello.

## Steps

1. Refresh instructions, Git status, current delivery receipts and hardware/listening boundaries. Preserve unrelated work.
2. Find existing harnesses and evidence before adding a diagnostic helper. Pin the unmodified product baseline and use separate labeled session, audio-library and thumbnail namespaces.
3. Reproduce the actual failing path and save its failure before changing product code. Keep unattended physical outputs muted and assert that mute remains active.
4. Enumerate callers and state/DOM ownership. Make one bounded repair, preserving cancellation, error handling, focus/accessibility and structural fallbacks.
5. Run focused regressions and the existing Node suite. Compare matched real-track sessions through the actual HTML controls/worker, retaining event timing, controls/previews, master ownership, PCM and source hashes.
6. Inspect complete captured windows independently. Source-grid phase and finite/gap telemetry do not prove musical alignment or absence of audible pops.
7. If desktop packaging is authorized, package an immutable commit and inspect the ASAR. Observe native startup separately; if locked, leave it pending and do not bypass the lock or disturb an unobserved session.
8. Update existing Trello summaries before adding cards. Preserve history/criteria/model guidance; read back exact changes and board dispositions. Update current handoffs while retaining historical tails.
9. Push the verified slice to the existing feature branch/draft PR when authorized. Close only owned test tabs/services. Record residual defects and one exact re-entry step.

## Decisions and edge cases

- Analyze completion uses current deck ownership, not the track's deck when work began. Cover duplicate, hidden and replaced tracks.
- Distinguish row/node removal counts from mutation records. Keep explicit layout/schema changes separate from avoidable refresh work.
- Do not change audio clocks/DSP against an unreproduced pop. Save the next actual event before attributing a cause.
- A clean automated run does not close human listening or physical headphone/master/controller gates.

## Format

One bounded report and compact JSON receipts in `docs/prototype/`; private raw traces/audio/manifests in ignored `local-evidence/`. Trello gets results, scope, remaining gates and linked evidence, not raw audio or credentials.

## Toolbox

Existing assets, reused under task authorization; owner approval of an asset version is not independently recorded here:

| Asset | Purpose | Version/evidence |
|---|---|---|
| `../../../prototype/four-deck-soak-harness.js` | Real-track muted transport, controls and PCM sessions | Git history; delivery0.1.47 report |
| `../../../prototype/four-deck-trace.js` | Event-aligned frame/layout and removed-node evidence | Git history; delivery0.1.47 report |
| `../../../scripts/inspect_playback_package.mjs` | Immutable ASAR/host/profile checks | Existing versioned package receipts |
| `../../../learnings/INDEX.md` | Successful reasoning and ownership constraints | Dated project notes |
| `../../../docs/prototype/CORE_FOUR_DECK_COLD_ANALYSIS_2026-10-23.md` | Actual cold-worker and fixture-scheduling reproduction/results | Current bounded execution; delivery gates labeled separately |

Resolve Toolbox paths relative to this skill directory; these entries identify existing project assets, not copied global tools.

## Authority

The user's current request controls scope. Preserve original music, normal profile, recordings, unrelated apps/files, existing controls/layouts and approval gates. Trello writes require explicit task authorization; unrelated communications, account changes, destructive cleanup, merging or new services are not implied.

## Proof of Done

- Save an actual failing reproduction, then execute that same path after repair and observe the required result.
- Run `node --test prototype/*.test.mjs` and affected actual-workspace checks; retain hashes and explicit limits.
- Verify originals and normal session unchanged; assert mute and stopped/no-queued-restart cleanup.
- If packaged, run the versioned package inspector; label native UI and listening checks executed or pending separately.
- Read back Trello descriptions/comments and list/completion counts. Verify pushed source/draft PR and historical prompt/handoff preservation.
- Report pass/fail/unverified. This draft has no owner sign-off or two-run approved-asset adoption claim.
