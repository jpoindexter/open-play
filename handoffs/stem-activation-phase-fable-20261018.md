# Bounded Fable consultation: preserve keylocked original while Stems activate

18October2026 · Open Play · Codex→Claude Fable · diagnosis/recommendation only.

Jason explicitly authorized taking control of Claude Code, starting a fresh conversation and selecting Fable if Codex gets stuck. This is that narrow DSP consultation, **not** the unlaunched full independent Serato parity audit. Use Fable with High reasoning if available. Do not edit production, build native packages, touch Git/Trello, restart services, install anything, or operate the controller. Optional diagnostic output must use a fresh directory under ignored`local-evidence/stem-activation-phase-138/`; do not overwrite prior recordings.

## Goal and evidence

Find a phase-preserving way to attach four prepared Stems during playing keylocked original audio, retaining working controls, cancellation and ownership. Do not mask the gap with gain compensation or relax acceptance.

Read`docs/prototype/STEM_ACTIVATION_REVIEW.md`, `prototype/engine.js` methods`attachStems`, `startForwardKeylock`, `routeOrdinaryVoice`, `retireVoiceAt`, `setRate`, `setPitch`; `prototype/keylock-shadow-live.js`; actual wrapper`prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs`; `experiments/stem_activation_phase.mjs`.

Current source checkpointfd46713; worktree additionally has this handoff and the new serial-WASM experiment, no production edits in plan138. Prior plan137 replaced pause/restart with existing readiness/arming barriers. Ordinary-loop activation now passes actual browser capture: longest nearzero one sample, min10msRMSratio.9772/1.0≥.85, maxjump.01524<.03, clocklag0. Actual rate1.1/keylock-on replacement still fails min10msRMS at.6454/.8148 despite no nearzero dropout/clocklag. Known330/550Hz steady phase changes157.02/−62.09degrees with near-identical amplitudes. Exact raw failure:`local-evidence/stem-activation-137/pitch-original.json`, its diagnostic source`pitch-harness.js`; afterreport`docs/prototype/stem-activation-pitch-results.json`. All audio generated locally, existing real SCNet-large completed cache; no musical quality claim.

New executed unchanged-WASM serial128-frame test isolates startup/channel layout at44.1k/1.1tempo/zero transpose. Original2channels and actual cached4stems in10channels; same logical source trajectory. Results under`local-evidence/stem-activation-phase-138/original.json` and full perchannel`.f32`. Compare window1.0–1.8seconds, warm2reference:

- Late2: phase−82.89/−135.07degrees; relativeRMS1.324/1.848.
- Warm10: phase13.02/24.90degrees; relativeRMS.227/.431.
- Late10: phase−100.03/−165.55degrees; relativeRMS1.532/1.984.

Serial direct WASM evidence is not browser acceptance. Existing experiment refuses to overwrite outputs; inspect them before considering any rerun. The wrapper continually `_seek`s an analysis window then `_process`es128frames; old two-channel instance and new ten-channel instance can differ in phase even when logical clocks match.

## Questions

1. Is the evidence/cause inference sound? Distinguish proven behavior from likely internal mechanism. Identify missing decisive evidence.
2. Propose the smallest correct architecture preserving the original active pitch state during Stems availability. Current all-on/no-FX route intentionally uses the original; partial Stems share one processor for coherent cancellation. Can the adapter add a Stems-only processing node within the same owned group while retaining original node, with one clock/scheduler? What must change in fill/drop/budget/outputs/control/lifecycle/failure handling? Or is there a smaller credible backend-state solution?
3. Avoid a hidden second original owner that drifts when rate/key/seek/Sync changes. Avoid equal-power/shortened fades selected only to pass these tone windows. List one bounded falsifiable next experiment and concrete acceptance, including original continuity and real partial-Stems controls.

## Return artifact

Write`docs/research/claude-fable/stem-activation-phase-20261018.md` only. Include actual chosen model/effort, inspected source hashes, any executed diagnostic command/PCM/metrics, recommended change and rejected approaches, remaining unknowns. Recommendations may be code-path only; do not call them fixed. Preserve original prompt/full audit handoff and current desktop0.1.23, which remains stopped/Master−12/Hercules prepared. Main8768service must stay running. Human away: no timed hardware captures or readiness questions.
