# Live four-deck mixer controls — plan119

18October2026. Browser source after7f83b5948725906661cab299255f0acfaeaebfb9. Frozen desktop0.1.16 is unchanged; this change is not in that package.

## Gap and implementation

Code inspection found Crossfader Curve/Reverse/Disable and Upfader Curve were only stored preferences. Audio always used a fixed alternating A/B law. `mixer-curves.js` now supplies normalized settings and independent gain laws. Setup changes, tab reset, saved preferences and per-channel A/Thru/B controls reach the same engine method; existing GUI and MIDI crossfader inputs use it. Settings can be restored before AudioContext initialization, and initialization retains the requested fader position. Existing default Linear/amount50 and upfader50 reproduce the previous coefficients exactly. Thru bypasses the crossfader, retaining channel level/trim; Disable bypasses it for all channels. Reverse changes direction once. Four deck assignments persist in preferences.

The selected Stem Slip sources use the assigned crossfader coefficient; the complementary sources retain unity route gain, and the channel upfader still applies to the resulting mix. Pre-fader cue routing is not moved behind the fader. Existing smoothing remains10ms for main gain and3ms for selected-stem routes; this is code-path evidence, not a new zipper-noise/transition listening pass.

## Reference and independent equations

[Official Mixer manual](https://support.serato.com/hc/en-us/articles/223446728-Mixer), read18October2026: curve amount affects Linear/Power, reverse swaps direction, disable bypasses the crossfader and upfader changes from gradual fade to fast cut. Hardware can own some settings. These facts do not publish DSP equations or prove the exact installed-version response.

For normalized side position t=0..1 and amount s=0..1: Linear=min(1,t/max(.02,1-s)); Power=t^(2^(1-2s)). Thus slow Linear midpoint=.5 and fast Linear midpoint=1; slow Power=.25 and fast Power=sqrt(.5). Upfader gain=level^(4^(1-2u)): u=.5 is unchanged linear, u=0 gradual, u=1 fast. These are explicit independent approximations. A/B/Thru is Open Play's channel assignment UI, not a proven copy of every reference hardware layout. No exact numerical vendor-equivalence claim.

## Executed evidence

- `node scripts/test_mixer_curves.mjs`: six focused check groups cover documented anchors, endpoint symmetry/monotonicity/reverse/bypass, default preservation, bounds and actual engine routing with controlled AudioParams including selected Stem Slip/PFL separation. This controlled layer does not establish rendered audio or hardware behavior.
- Actual app in isolated port18865, loaded through CUA. Owned stationary stereo fixtures220/440/660/880Hz on all four decks. Production Play, Setup changes/reset, channel assignment and MIDI editor/injection control the graph. MediaRecorder captures the real master before physical output. Complete decoded recording finite/stereo: **7.739977s,341333frames,44100Hz;125175bytes;SHA256ff6326663ede405e7ae6de29c1554aa0f84bca5ebb91bdec74b62bc8c4427f13**.
-13 declared windows: bypass baseline; slow Linear center/quarter; slow/fast Power center; fast Linear center; reversed endpoint; B/A/Thru/B assignment; Disable; slow/fast half upfader; reset default; synthetic MIDI endpoint. Each uses fixed250ms settling and300ms measurement, known-frequency sine/cosine projection normalized to its own deck/channel baseline. Baseline amplitude>.005, absolute gain error<=.04; observed worst **.027748708**. Every case passes for both stereo channels. This is a stationary gain check, not a transient, phase, headroom or subjective-quality test.
- Actual full reload via visible harness button: Power/amount37/Reverse/on/upfader62/A/Thru/B/Thru restored exactly; decks stopped. Seven declared served source hashes are unchanged across recording and reload and match disk. The recorded graph was physically muted; the newly reloaded stopped graph is not claimed muted.

Initial harness attempts retained: first asserted mute state before its async routing operation completed and produced no recording; corrected by waiting for the actual flag. Next recorded all gain cases correctly but sent MIDI editor's refreshed default address after adding the mapping; corrected only the harness address setup. Production code and declared tolerances unchanged for these harness fixes. Reports `mixer-curves-initial-results.json` and `mixer-curves-input-fixture-results.json` retain these failures. No broad green suite repeated.

Final sanitized report: `mixer-curves-browser-results.json`. Full raw recordings/reports/source capsules are ignored under `local-evidence/mixer-curves/{initial,input-fixture,final}`. No model/audio/proprietary assets uploaded.

## Remaining scope

Exact Serato curve/installed hardware measurements, continuous fast sweeps/zipper-noise, composed rendered Stem Slip paths, EQ Boost's stored setting, hardware control/LED/physical sockets/current desktop acceptance, routing ownership/external mixer, pressure and music listening remain open. The13 windows are not full MIX-001/MIX-002 or all-parity acceptance. All110groups/522requirements plus9beta deltas/26release checks, full flags, original prompt and Codex/Claude routing are retained. Full independent Claude audit unlaunched.

Human away; no timed controller capture. Native0.1.16 retains its prepared stopped state. When available: left physical Play→deck1/RCA sound→samebuttonstop, one action at a time. Future desktop packaging must declare new `mixer-curves.js` and preceding `stem-crate.js`; do not change the frozen16ASAR.
