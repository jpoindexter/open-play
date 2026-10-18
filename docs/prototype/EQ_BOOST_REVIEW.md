# Live EQ Boost — plan120

18 October 2026. Browser source after f191e9036948c18d143077b99c984d09f5641a63. This change is not in frozen desktop0.1.16.

## Gap and implementation

Code inspection confirmed the EQ Boost preference was stored but unused. All GUI positive ranges and absolute/relative MIDI clamps stayed at +6dB. The engine itself did not enforce either boost setting.

The6dB/12dB preference now sets the positive range of all three EQ bands on all four decks. The same normalization and bounds govern the engine and MIDI router. A live range change preserves each positive knob fraction: +6/6 becomes +12/12, and +11.5/12 becomes +5.75/6. Neutral and negative values stay unchanged. Resetting the Mixer tab restores the6dB range with the same position policy. The pre-existing−24dB cut range is retained; no full-kill EQ claim. Nonfinite engine EQ values are rejected; out-of-range finite values are bounded. EQ smoothing remains15ms, applied equally to main and the separate Stem Slip cue-strip filter targets. The preference alone does not create an AudioContext.

Mixer sliders use `step=any` so the DOM does not round remapped fractional values to the old half-decibel grid. This also lets normalized absolute MIDI values remain represented in the UI. Explicit relative MIDI increments remain0.5dB.

[The official Mixer manual](https://support.serato.com/hc/en-us/articles/223446728-Mixer), read18 October2026, documents selectable6dB/12dB EQ gain and hardware-dependent ownership. It does not publish exact filter response or the behavior of a knob during a live preference change. Position-preserving remapping is the explicit independent Open Play policy, not a claim of measured Serato behavior. Existing Web Audio shelves250Hz/4000Hz and peaking1000Hz/Q0.7 remain unchanged.

## Executed evidence

`node scripts/test_eq_boost.mjs` passes. Actual engine methods with controlled AudioParams cover position preservation, neutral/cuts, bounds, main/cue-strip target consistency and no implicit audio initialization. Actual MIDI dispatch covers24deck/band/range combinations: four decks × three bands × two boost settings, each at maximum/neutral/minimum plus relative clamp/decrement. This controlled layer does not establish rendered audio or a physical MIDI input.

One actual production app workflow in isolated port18866 passes on its first recording. Owned stereo50Hz/1000Hz/12000Hz fixture; production Play, mixer sliders, Setup/reset and MIDI editor/injection change the graph. The18fixed windows cover neutral baseline; low/mid/high GUI+6dB then live6→12→6; MIDI absolute+12, relative11.5, live remap5.75; MIDI neutral; negative cut; range-change/reset cut preservation; final neutral. At every window, app state, actual engine EQ target and visible slider value agree, and all slider maxima match the active range.

The complete master is finite/stereo: **12.54s,553014frames,44100Hz,202711bytes;SHA25642b546549ab9f0933b3bfc5f3257df04e7c3b615a468e43995e9b2d8008ee141**. Each window has fixed250ms settling/400ms measurement. Known-frequency sine/cosine projection is normalized to the same channel/frequency baseline; baseline amplitude>.003. Declared maximum absolute response error=.45dB against the selected band's target and nominal0dB at the other two frequencies; observed worst **.241451538dB** across both channels/all18windows. This includes existing filter skirts and codec variation; it is not a full transfer-function fit, phase, clipping, transition-noise or subjective-quality test. No threshold adjustment or broad green-suite rerun.

Actual full reload via visible harness button restores the12dB preference and engine range; all six visible EQ sliders have max12, and decks are stopped. Seven declared served source hashes are stable across recording/reload and match disk. The recorded graph was physically muted. The freshly reloaded stopped graph is not claimed muted.

Read `eq-boost-{contract,browser,live-source}-results.json`. Full original report/master/source capsule ignored under `local-evidence/eq-boost/final/`. The normal8768service serves current source with no-store; native16ASAR hash remains a2925237fab3fe2f9064bacb6a62b91cf6cc4f6b02cb166534d90952907076df. No proprietary/model/raw audio uploaded.

## Remaining scope and re-entry

Exact vendor filters/range-switch policy,−24dB versus reference full-kill behavior, selected Stem Slip rendered audio, simultaneous-band sweeps, fast transitions/zipper-noise, all MIDI resolutions/ownership, physical Hercules knobs/current sockets and native acceptance remain open. Backup import's immediate settings application is also unverified; normal preference reload is the executed path here. This is a MIX-003 subset, not full feature or product parity.

All110groups/522requirements plus9beta deltas/26release checks, full flags, original prompt and model/effort routing are unchanged. Full independent Claude audit unlaunched. User away; no timed hardware capture. Native16/profile/launchers untouched; when ready, resume left physical Play→deck1/RCA sound→samebuttonstop, one action at a time.
