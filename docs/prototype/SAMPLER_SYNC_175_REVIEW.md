# Persistent Sampler Sync core —175

Date:19October2026. Full Sampler Sync and full project parity remain unaccepted.

Actual baseline used one-shot Match focused deck tempo: sample stayed at124BPM after its synced leader changed to131.44, and bar-phase error reached872ms. The browser now has real Sync/Off membership, armed/beat/tempo/preparing feedback, mode override and a prepared sample transport. Samples join the existing audio-time group barrier for leader tempo changes; prior audio is retained during preparation. The one-shot match remains separate. A nonloop kernel ending path and cancellation/retirement support are implemented but their full browser lifecycle is not yet accepted.

Actual restored-file/keylocked warped-loop Play and shared tempo124→131.44 pass: bar-phase error≤2.667ms/10ms, common BPM exact, six complete channel streams finite/nonzero while playing and Stop peaks0after1s. Whole3s captures have144000frames/1125contiguous quanta; Stop14400/113. Actual stopped keyboard Space on Off restores play-mode selection and Enter on Sync restores armed membership/override. This proves that scoped core and stopped controls, not full Sampler Sync, live-Off behavior, transition continuity, BPM-only fallback, multiple slots, nonloop browser endings, source/pitch/perceptual/vendor/native/hardware/full parity.

The first implementation could not start: it sent a complete track containing File to the audio thread. A real port probe acknowledged the same command with numeric grid data but not with File. The sample path now uses the deck path's numeric grid record. Failed original/capsule retained; successful original7593072B/SHA5422ed6a31f4e6320d07387e83445e031f102f5ddd41c2fe53e79174596db09f. Independent inspector also rejects the unchanged pre-implementation baseline. Nonloop kernel algebra/end-frame test is red against old source and green against new; existing warped-loop kernel checks pass. These are collaborator proofs, not browser nonloop acceptance. All18model-cachefiles/mtimes unchanged/no inference.

Read docs/prototype/SAMPLER_SYNC_175_REVIEW.md and handoffs/stems-175-sampler-sync-lifecycle-followup.md. Next execute and close live-Off/setup-Off, bank switching/cancel/held ownership, raw/fallback/nonloop and multiple-member/leader-join gaps. Primary Sample Banks manual confirms switching banks stops current-bank audio; current bank handler only changes bank (source concern, not yet an executed failure). Full110/522/9/26/55FX/Stems/keylock goal remains active/false. Controller may stay unplugged, physical output muted. Frozen0.1.23/272Alternative/profile/user8768/18775/18768 preserved. No native package/Claude session. Formal criteria/status/model/effort/history/full original prompt retained.

## Implementation and source identity

- sampler-sync.js owns membership, phase/tempo plans and state feedback.
- sample-sync-transport.js prepares keyed/raw source data, schedules musical-clock playback and retires previous voices after commit.
- engine.js supports sample participants in the existing two-barrier tempo handoff, sample clock/cancellation/retirement and worklet ownership. Ordinary sample ending no longer removes a newer pending request.
- panels.js adds Sync/Off and status to slots/Advanced; play-mode override and shared-tempo entry; app.js connects the existing leader tempo request to active sample members.
- warp-loop kernel/worklet/wrapper accept nonloop source bounds and an ending frame event. Only kernel algebra/end-frame behavior is accepted for nonloop here. File/Blob never crosses the new sample clock boundary; source grid is numeric.

The exact declared source sets and parent Git revision are in sampler-sync-175-source-manifest.json. They bind captured paths, not every app dependency/native package. Private before/after/first-after source capsules remain under local-evidence/sampler-sync-175. No raw media/PCM/weights/proprietary files are tracked.

## Real-path evidence

Baseline original: local-evidence/stem-resource-150/browser-exports/9447255d3e5e4667ba74814ccf465319.json,7509851B/SHA24ab6b3f570263285cf142ddf01f44e5a363972fdf8846ca3d54225ff28fb26c. Same independent inspector marks false: membership absent, initial bar error872.409ms, sample124versus leader131.44after tempo change.

Successful original: local-evidence/stem-resource-150/browser-exports/34873eb0ae734985b201c5529b1018c5.json,7593072B/SHA5422ed6a31f4e6320d07387e83445e031f102f5ddd41c2fe53e79174596db09f. Normal restored-file Load/grid metadata/Sampler Load/Advanced/Sync/Play/leader tempo+6/Stop; no direct result/state injection. The saved loop is source1..3.1333333333on grid120→150at1→90at1.8, four beats. Leader is actual generated After Hours124on deck1; sample uses imported research music/keylock. Natural context48000Hz, physical output muted. Actual node uses the new worklet transport, common tempo and native audio-time plans.

The captures are settled3s windows after start/tempo preparation, not a recording of the entire transition. Six whole channel streams finite/SHA checked, activeRMS>1e-5/Stop after1speak0<1e-7, all contiguous quanta. Phase derives independently from the sample and leader source coordinates in their known grids, paired with actual nonzero native output; pitch/perceptual quality and source-PCM identity of the transformed output are not graded. No fitted timing/gain/phase, repaired/dropped/stitched PCM or relaxed thresholds. A declared exactlyzero stereo source keeps stopped sampler channels present, as in174.

Actual stopped UI receipt verifies Sync armed/aria-pressedtrue/mode disabled; Space on Off gives Sync off/pressedfalse/mode enabled; Enter on Sync returns armed/override. This is not live-Off/cancel acceptance or a general keyboard/accessibility audit.

## Failure investigation

First-after original/capsule: e48b09a056fe4f0ebab3105fbb2aefbf, summarized in sampler-sync-175-first-after-inspection.json. The sample never started and the audio-thread acknowledgment timed out. No streams/Sync acceptance was claimed.

The actual port probe first showed that an unconnected node can acknowledge load; no connection-based fix was applied. Sending a start command including a synthetic2-byte File then failed to receive an acknowledgment, while the same numeric grid-only start was acknowledged. See sampler-sync-175-port-probe.json and owned probe HTML. The sample path now matches the working deck path by transferring only BPM/grid/duration/warp markers. This conclusion is scoped to the measured browser worklet boundary. The failed original remains false and unmodified.

Nonloop raw/rendered kernel scheduled silence/end-frame contracts fail against the old kernel and pass against the new; existing warped-loop clock/PCM-kernel checks pass. See sampler-sync-175-kernel-results.json. These do not prove the real nonloop worklet end callback/lifecycle. No broad old effects/controller matrix was repeated.

## Remaining acceptance

Live-Off/setup-Off behavior, complete transition audio continuity, raw output/source-coordinate check for the new transport, BPM-only/legacy-grid fallback, browser nonloop endings, multiple sample members and a deck joining a sample-led group remain open. Current Smart Sync chooses deck leaders; joining from a sample-led group needs explicit integration and an actual test. Pending cancellation and old held-release ownership need tests before claims. A source concern remains in bank switching: the handler changes the bank without stopping its prior audio. No fix or acceptance is claimed yet.

Primary references read19October2026: [Sampler Sync](https://support.serato.com/hc/en-us/articles/227629808-Sampler-Sync-Advanced-Mode-only), [Sampler Sample Banks](https://support.serato.com/hc/en-us/articles/227629888-Sampler-Sample-Banks). The latter documents stopping audio in the current bank on a bank change. Preserve existing acceptance criteria; do not replace this with continued hidden-bank playback.

## Reproduce inspection

Use a new output path:

```sh
python3 scripts/inspect_sampler_sync_175.py local-evidence/stem-resource-150/browser-exports/34873eb0ae734985b201c5529b1018c5.json /tmp/open-play-175-new.json --sources local-evidence/sampler-sync-175/after-source-capsule/prototype
```

The unchanged baseline with before-source-capsule exits1. Node tests: test_sampler_sync_kernel_175.mjs and test_warp_loop.mjs; changed JavaScript syntax checked. All18cached model files/hashes/mtimes unchanged/no inference. No native package, hardware test or Claude audit launched.
