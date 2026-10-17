# Audio capture startup clock diagnostic and repaired measurement boundary

17 October 2026. Parent-executed browser evidence; exact backend/OS root cause remains unknown. No native application work.

## What changed the diagnosis

The three incomplete patched keylock runs remain untouched. Each of the two fenced runs had all11 functional audio assertions passing but failed complete capture because a128-frame block at frame0 was followed by frame384. A finish fence fixed no startup gap. Constructor readiness and an explicit early arm also did not establish uninterrupted processing.

The new [independent diagnostic](../../prototype/audio-capture-continuity-harness.html) loads **no Signalsmith module**. Each processor retains its own call sequence, absolute `currentFrame`, `currentTime` and block size, then sends a single final report. That separates missing processing/clock steps from missing per-block capture messages. Outputs are forced to zero through a zero-gain destination; the optional upstream oscillator is also inaudible.

[Actual four-context result](../prototype/audio-capture-continuity-browser-results.json): each context executed2048 calls. In the third context, retained consecutive sequence0→1 had frame256→640, rather than384; `currentTime` changed consistently. Thus256 frames were skipped between consecutive calls even with no keylock dependency. The other three startup sequences were contiguous in this run. Both contexts with64-call preflight had contiguous armed spans. This demonstrates a startup processing/clock discontinuity in this environment; it does not prove which browser, device, OS or graph optimization caused it, or that every context experiences it.

## Smallest tested measurement correction

The real keylock probe requests preflight **after its factory and capture processor are ready**, then requires64 consecutive actual processor calls. A frame discontinuity restarts that consecutive count; startup gaps are retained in the acknowledgement. This is processing readiness, not a fixed wall-clock sleep. No test audio starts until preflight and a separate exact-frame arm acknowledgement succeed.

Every actual PCM block after arm remains mandatory. The report validates both producer sequence and absolute frame continuity through the final same-port fence. Any gap in that span is fatal; no samples are filled, trimmed, ignored or inferred. The original eleven functional criteria and pitch/rate/silence tolerances are unchanged. [Exact-source serial host check](../../scripts/test_keylock_capture_clock.mjs) executed4 checks, including preflight restart and finite terminal processing; it is not browser evidence.

[Actual patched browser result](../prototype/keylock-live-patched-browser-preflight-results.json): **11/11 functional checks, completed:true, fatalErrors:[], captureCoverage:1**. Preflight retains the original startup jump expected128→actual384 at sequence1. It then observes64 consecutive blocks384..8576; capture arms at8704/sequence66 and ends at825472/sequence6446:6381 contiguous128-frame blocks,816768 stereo samples per channel. The entire armed functional span is17.016s.

The actual Download button produced a stereo48kHz16-bit WAV with816768 frames,3,267,116bytes. [Container inspection](../prototype/keylock-live-patched-wav-inspection.json) records SHA256 `49e7dfa82272526a17520b963f48cf4f442069e894492484f569dfe722884897`. This proves the bounded synthetic capture/container path, not listening quality, general glitch freedom, production integration, physical output, long-file memory, ordinary scratch or vendor sonic equivalence.

A new Fable5.1/High local debugging conversation was already running after the third failed approach. Parent sent this independent evidence to the same bounded conversation. Its findings remain separately reviewed; this result is not attributed to an unreturned external diagnosis or the full independent Claude audit.

Skills applied: use, adversarial-verify, dec-quality-testing, dec-software-principles.
