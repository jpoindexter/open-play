Independent bounded diagnosis in /Users/jasonpoindexter/Documents/GitHub/Open Play. Use Fable5.1 High (the current selected model). Jason explicitly authorized a fresh Fable Claude Code conversation when Codex gets stuck. Two measured return approaches still fail, so investigate the evidence and recommend the smallest justified next implementation. This is NOT the full independent Serato completeness audit.

Hard boundary: browser prototype only. No native app until Jason approves an identified HTML revision. Do not bypass Serato licensing, extract secrets, alter the installed app/library or contact services. No browser/computer/hardware control, downloads/installations, model-weight changes, Git/index/commits/remotes/Trello, background agents or changes to production/harness/vendor sources. Other Codex agents own active files. Read only, except you may CREATE exactly one NEW file: docs/research/claude-fable/keylock-return-findings.md. If it already exists, stop and report instead of overwriting. Do not write learnings/memory/CLAUDE/AGENTS or other files. No uploading audio/project files. Existing local tools/tests may be read; do not execute volatile parent cache tests or a new experiment. Official public upstream source/documentation read is allowed when needed; no project data in requests.

Read the current source and these finite artifacts (preserve their scopes):
- docs/prototype/deck-scratch-main-ui-observations.json
- docs/prototype/deck-scratch-main-ui-audio-inspection.json
- docs/prototype/keylock-live-adapter-browser-results.json
- docs/prototype/keylock-engine-browser-results.json
- docs/prototype/keylock-live-lead-browser-results.json
- docs/research/KEYLOCK_LIVE_LEAD_EXPERIMENT_REVIEW.md
- docs/prototype/keylock-retained-return-browser-initial-results.json
- docs/research/KEYLOCK_RETAINED_RETURN_REVIEW.md
- prototype/keylock-live.js, keylock-live-lead-experiment.js, keylock-retained-return-harness.js
- prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs and PATCHES.md
- prototype/engine.js only to understand source ownership; raw-PCM cache/preload changes are concurrent WIP. Do not edit/revert or count them as reviewed acceptance.

Observed problem: actual main UI imported an original synthetic440Hz source, shifted+12, keylock on, tempo1.08. Master MediaRecorder download decoded24.42s;90 active250ms bins at880Hz and10.5s AM fit4.32Hz confirm real functionality. A1s stationary platter hold/release briefly returns raw476Hz (440*1.08) in bins15.0/15.25 before880Hz. Bins do not establish exact duration. begin currently replaces/disposes the live voice with raw PCM scratch; end resumes raw while building and scheduling live keylock. Green six-case production tests missed the pitch defect because they tested low-RMS gaps/settled tones, not release pitch.

Actual eight-point ready/prewarmed lead experiment: completed8, no fatal, full captured spans,4/8 meet declared finite criteria (40/60/120/200ms).0/5/10/20ms show late onset and/or stale-region early pitch. Queried vendor latency is120ms, not proven universal wall-lead minimum. Same-tone prewarmed restart passing does not prove arbitrary post-scratch cursor return.

Actual retained-return experiment: only46/54 measured, zero overallpass, six fatal entries.46 settled pitches pass but silent gaps remain roughly39-46/59-67/169-176ms for40/60/170ms leads. Four pause-mute prerequisites failed; helper computes metrics then ASSERTS BEFORE SAVING, so failed amplitudes/tail timing are unavailable. Do not invent those measurements or assign a root cause from them. One real armed frame/sequence duplicate/skip caused two fatal entries; never trim/drop those blocks or call its span continuous. Other strict spans remain scoped evidence. Node3/3 and54 settled Node conditions are not browser completion.

Questions to resolve:
1. What exactly does this vendor wrapper's queried latency/schedule input/output mean with preloaded PCM? Distinguish algorithm lookahead, explicit scheduling lead, main-thread ACK, actual audible output, old-clock bridging and processor history. What is proven versus inferred?
2. Is a retained/prewarmed owner sufficient for immediate pitch-correct return at an arbitrary original cursor? If not, propose a concrete small implementation (e.g. continuously prepared return path/window, scheduled alignment, latency compensation/ownership change or a narrowly scoped renderer experiment) with no raw wrong-pitch bridge, hidden silence, full-file offline fallback or relaxed acceptance. Explain tradeoffs and missing proof; do not claim impossible without evidence.
3. How should pause observability be corrected BEFORE assertions while preserving the exact existing mute criterion and all failed rows? What minimum capture would distinguish genuine residual output from stale-context/output-edge timing? No rerun merely to obtain green.
4. Give an explicit patch order and real browser acceptance for immediate/held/quick/far-cursor, shifted/unshifted, tempo and multi-source returns, cancellation/pause/load races. Preserve current full1:1 incomplete/native forbidden labels and per-feature model/effort recommendations.

Deliver one concise but substantive findings Markdown: executed/source-proven/inferred/unknown; exact file/function evidence; strongest alternative explanation; smallest next reversible implementation; numerical acceptance and rejection criteria. No production changes. Report the new file path and any genuine blocker when finished, then stop.
