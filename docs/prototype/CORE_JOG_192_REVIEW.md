# Core jog192 — actual recorded software bend and release

The remaining software question from191 was whether the jog keys changed actual audio speed. One normal native master capture in existing desktop0.1.24/source2b0c785 answers that question on real trackA. No app patch/new build/mapping change was needed. Jason is unavailable for Hercules testing; core scope stays unchanged.

## Actual path and independent measurement

Both real tracks started paused at20s, pitch0, Sync off, EQ/filter neutral, Master−12dB. Normal REC Start → deck1Play → neutral section → holdY2200ms → release → holdT2200ms → release → neutral section → Pause → REC Stop → Download → native Save. Native observations retain positive master meter/advancing source position during playback and unchanged nominal pitch. Recorder and deck are stopped afterward. Wall-clock anchors identify actions only; they are not sample timestamps.

The actual capture decodes finite stereo48k,41.88s/2010240frames, peak0.140803. The longer neutral intervals reflect tool/action time between commands. Compared its played waveform with the actual original MP3, independently decoded by ffmpeg at48k. Source identity matches the retained original SHA256. Raw audio, original input names, decoded PCM, action/AX details and analysis code stay ignored/private under local-evidence/core-jog-192 and core-design-190.

Every250ms across the active clip, a200ms left-channel window is compared against the original around its expected source position±1.5s. Preselected candidate rates are the existing keyboard commands0.96/1/1.04. Polyphase-resample the candidate template, find normalized FFT cross-correlation/source center, retain all156windows. Classification threshold0.8; no windows unclassified. Fit source-position versus capture-time slope only on runs with≥4windows. This source-position slope is obtained from actual waveform matching; nominal UI BPM alone is not the evidence.

| Ordered interval | Windows | Measured source seconds / recorded second | Minimum correlation |
| --- | --- | --- | --- |
| Neutral before |70|1.000000|0.9886|
| Forward hold |9|1.040000|0.8165|
| Brief release between keys |3|1candidate, no slope fit|0.9031|
| Backward hold |9|0.960000|0.9493|
| Neutral after |65|1.000000|0.9523|

All classified windows and candidate/runner-up/source positions remain in the private original analysis. The report is speed evidence at48k sampling resolution; tiny floating-point fit residuals are not a claim of infinite clock precision. Source correlation is not a fidelity, click-free transition, phase-continuity or perceptual quality acceptance test. The0.8165forward boundary correlation remains reported; no window removed to improve it. No gate was relaxed or source replaced.

## Conclusion and limits

Normal native keyboard jog changes this real track's audio to+4%/−4% and returns to neutral on release while nominal pitch remains0. Both decks are now paused at20s with recorder stopped and meter silent. No physical jog, keylocked/reverse/warped/loop variant or acoustic test was performed; those cases cannot inherit this result. No advanced features or broad matrix was resumed.

Core acceptance remains open: Jason's audible sustained manual and synced two-track transition, current Hercules controls and independent headphone/master cue/mix confirmation. Reuse these completed software checks; do not keep repeating them while waiting for the physical/listening session.
