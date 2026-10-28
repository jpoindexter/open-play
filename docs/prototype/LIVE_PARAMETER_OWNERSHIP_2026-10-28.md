# Late live-parameter failure across replacement — 28 October 2026

An old live-keylock pitch or tempo update could reject after its deck loaded a replacement. The catch handler compared only the requested value, so it could restore the old track's settings onto the replacement when both requested the same value. The replacement voice remained intact; its parameter state was wrong.

Four existing engine lines now capture track identity and require both that track and the same live adapter before rolling settings back. Current-owner errors still roll back and surface normally. Public callers, success/AbortError handling, DSP, source clocks, routing and layouts are unchanged. No new runtime module or dependency; the regression is24lines. Existing oversized engine debt is unchanged in line count.

## Executed evidence

On baseline6423047, an actual isolated four-deck Compact workspace starts generated audio through its real live adapter, holds Key Up's update, normally loads another track, and sets the new track to+1. Deliberately rejecting the old update changes the replacement back to0. After repair the same actual controls retain+1, all354observed post-replacement controls,4Play controls and3currently materialized library waveform previews. Physical output remains muted; replacement stays paused with no processing/queued start. Baseline352/352controls and1preview are retained as observed; asynchronous preview counts are not a performance comparison.

Four focused engine checks give2pass/2fail before and4pass after: current-owner pitch/rate failures still restore their own settings; replacement pitch/rate settings survive older failures. The actual GUI witness covers pitch; the rate branch uses a controlled adapter in the real engine. No suite, soak or DSP matrix was run.

The late error is injected at the adapter boundary. This proves stale rollback behavior, not a naturally occurring worker error or a cause of the intermittent Sync pop. Native/playback/listening/controller acceptance remains separate. The normal0.1.85session remains paused and no original audio is used. Owned frame, storage, tab and server are stopped/cleared; temporary fixture sources were removed after exact-copy retention.

[Structured result](live-parameter-ownership-2026-10-28.json). Raw results, before/after screenshots, four-check RED/GREEN logs and fixture copies are private under `local-evidence/live-parameter-ownership-2026-10-28/`.
