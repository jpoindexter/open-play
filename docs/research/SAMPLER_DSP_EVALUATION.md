# Sampler Key Lock and browser output routing

2026-10-16. Browser prototype implementation; native application remains unstarted.

## Reference scope

- [Sampler Pitch Controls](https://support.serato.com/hc/en-us/articles/227564867-Sampler-Pitch-Controls-Advanced-Mode-only): each sample slot has pitch adjustment, bend, nudge and Key Lock. Pitch adjustment is a speed percentage; Key Lock preserves pitch as speed changes. No separate semitone control was established by this source, so none was invented for the sampler.
- [Play From Selector](https://support.serato.com/hc/en-us/articles/227629828-Sampler-Play-From-Selector-Advanced-Mode-Options-only): start, existing cues and saved loop starts; saved loops repeat when Repeat is enabled.
- [Main Volume, Mute and Output Selector](https://support.serato.com/hc/en-us/articles/227629848-Sampler-Main-Volume-Mute-and-Output-Selector): output choice is global to the sampler and includes Master and available channels1–4. Hardware-specific AUX/MULTI behavior is separate. The prototype implements global browser mixer buses only; it does not claim physical device channel separation or headphone routing.

## Implemented API and behavior

`AudioEngine.sample(track,slot,options)` accepts `keylock`, `rate`, `start`, `repeat`, `loopStart`, `loopEnd`, `gain` and `muted`. It returns a promise resolving true if that request starts, false if superseded/cancelled. Preparation registers synchronously before awaiting resume, decode or Worker rendering. Key Lock uses the existing independently vendored Signalsmith renderer with tempo equal to speed and semitones0. Source offset and loop coordinates are divided by tempo; public positions stay on the original timeline.

`updateSample(slot,options)` is asynchronous. Keylocked speed changes or toggling Key Lock restart at the measured original position after a cancellable render. Unlocked speed changes update the live source rate with a rebased position anchor. Gain/mute changes apply without retriggering; gain edits during preparation apply when the source starts. Latest-request ownership prevents old completion callbacks from replacing newer sources. Buffer rendering can create a brief playback gap; continuous low-latency stretch remains a native acceptance requirement.

`stopSample` aborts preparation and stops the current source. `stopAllSamples` and emergency `silence` cover pending requests as well as voices. `onSampleState(slot,{playing,processing})` drives actual UI status and avoids stale awaited booleans overwriting new state. Hold release cancels a pending render. On/Off treats preparation as active and can cancel it. Track sample gain updates every active slot using that track.

`setSamplerOutput('Master'|'Deck 1'|'Deck 2'|'Deck 3'|'Deck 4')` changes one global output after the sampler FX chain. Deck choices enter that deck's existing mixer input, following its EQ, channel FX, fader and deck FX before master. Master enters master input. FX graph reconstruction retains the selected destination. Output is still the browser's ordinary audio device.

Advanced Play From changes apply on the next trigger; the current playback position is preserved during speed/gain edits. Per-slot transient state and selected global routing are session-scoped; file tags are not rewritten. Existing native output, exact hardware restrictions, bend/nudge UI fidelity and instant-double behavior remain independent scope items.

## Executable acceptance

`prototype/sampler-integration-test.html` runs17 actual-engine checks using generated audio, real Workers, master FFT/RMS, actual end events and browser bus routing. Speaker output is disconnected. Tests cover440Hz preservation at1.5x, original timeline advance, live speed update, unlocked660Hz behavior, gain silence, scaled repeat-loop coordinates, cue-based actual end time, Hold-release cancellation, competing rates, pending all-stop, Deck1 fader routing, Master independence, routing after FX graph reconstruction and final stop cleanup.

Executed: parent CUA ran **17/17 passing**, saved in `docs/prototype/sampler-browser-results.txt`, and this implementer read the full measurements. Locked1.5x output measured439.453Hz; unlocked1.5x measured662.109Hz; cue-based completion was0.5013s versus0.5s expected; in-flight Worker cancellation left no voices/requests; gain during preparation and emergency stop measured RMS0. Deck1 routing respected its fader, Master bypassed that fader, and FX graph rebuild preserved routing.

The initial15-check run had one false failure: it read an8192-frame analyser buffer after150ms, less than its170.67ms history at48kHz. The revised check waits the full analyser window plus two audio quanta (176ms), keeps the same RMS threshold and records both durations. No engine change was used to mask the result. Two additional checks enter the actual renderer before cancellation and update gain during preparation.

These results establish the defined browser signal paths. Main UI Hold and On/Off preparation interactions require separate user-workflow execution; generated tones do not establish subjective time-stretch quality, long-session stability, continuous tempo sweeps, device routing or reference sonic equivalence.
