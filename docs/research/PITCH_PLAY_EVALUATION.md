# Pitch Play and Key Sync implementation contract

2026-10-16. Browser prototype only. Native application remains unstarted.

The [official Hercules300MK2 guide](https://support.serato.com/hc/en-us/articles/10173727435151-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide) defines8-pad Up/Middle/Down maps, root highlighting, Shift cue selection/creation, reset to Middle/Cue1 on track load, and range retention across pad-mode changes. The prototype follows that device-specific map: Up `[4,5,6,7,0,1,2,3]`, Middle `[0,1,2,3,-4,-3,-2,-1]`, Down `[-3,-2,-1,0,-7,-6,-5,-4]`.

Reference conflict: the current [generic Pitch Play article](https://support.serato.com/hc/en-us/articles/115003094007-Using-Pitch-Play) reverses the two Middle rows. The connected hardware's official guide is the chosen authority; physical pad mapping remains unverified. No undocumented16-pad extended ranges are claimed.

Pitch Play triggers a cue, so the prototype uses existing cue transport semantics: paused audition stops and returns to the cue on release; an already playing deck continues; Play while holding latches playback. The generic Pitch Play page does not independently spell out every release edge. This is an explicit integration interpretation requiring native reference comparison, not a claim of observed reference behavior.

[Key Shift and Key Sync](https://support.serato.com/hc/en-us/articles/207748178-Key-Shift-and-Key-Sync-with-Pitch-n-Time-DJ) describes nearest harmonically compatible circle-of-fifths matching rather than always exact matching, requires known key tags, and disables sync on key edit, load or eject. The independent policy accepts conventional major/minor, Camelot and Open Key notation. Compatibility means the same Camelot cell, adjacent cells of the same mode, or the relative major/minor cell. The nearest semitone shift wins; an equal-distance tie goes upward. This tie-break and target selection when no decks are already synced are independent policies, not observed Serato internals. Unknown/unsupported keys and incompatible multi-deck constraints return an explicit refusal instead of fabricating a key.

Actual pitch processing uses the existing Signalsmith Worker renderer. Trigger offsets remain on original track time. A released paused audition cancels pending rendering; newer pad presses own the deck so an older release cannot stop them. Key Shift controls are bounded by the prototype renderer's±24-semitone limit, labelled as a prototype processing limit rather than a verified reference range.

## Executed acceptance

`node --experimental-default-type=module scripts/test_pitchplay.mjs` passes **20/20** map/key-policy checks. The saved `docs/prototype/pitchplay-policy-results.json` covers the Hercules maps, eight notation examples, unknown-key rejection, relative/adjacent compatibility, parallel-mode rejection, nearest-compatible selection, incompatible synced groups, and rejection of a microtonally detuned unlocked reference deck.

Parent CUA executed **13/13 actual-engine checks passing**, saved in `docs/prototype/pitchplay-browser-results.txt` and read by this implementer. Measured outputs: Middle+1 at468.75Hz (466.16Hz target), Up+7 at662.11Hz (659.26Hz target), Down−7 at292.97Hz (293.66Hz target), harmonic sync−1 at416.02Hz (415.30Hz target), and reset439.45Hz (440Hz target). FFT-bin resolution accounts for these small differences. Paused release returned to the cue with RMS0; release during an active Worker render left no source/preparation; an older release did not stop a newer note; latch/playing continuation and Shift cue creation/selection passed.

These tests run the real AudioEngine/Workers, not a mocked pitch module. They establish the listed synthetic browser behavior, not native mapping, exact vendor policy, subjective stretch quality, or low-latency performance. Main UI controls were separately reported visible by parent after fresh reload; its range/Shift-cue workflow checks remain a separate evidence layer.

## Integration API

`createPitchPlay({engine,render,persist,notify,quantized})` returns `press(inputKey,deck,pad,selectCue)`, `release(inputKey)`, `latch(deck)`, `cancelDeck(deck)` and `releaseAll()`. `cancelDeck` drops interaction ownership; the caller performs the transport stop or new operation, allowing track load/eject to invalidate old releases without replay. Paused Hold release itself invokes engine pause to abort pending rendering.

App pointer/keyboard handlers own Pitch Play presses and ignore the later synthetic click. Shift-press selects/creates without deleting; context-menu deletion is unavailable in Pitch mode. New track load resets range/Cue1/key shift and sync. Mode changes retain range. Key-tag changes clear the sync flag; sync-off retains the current transposition. Key −/+ and reset use actual pitch processing; the deck label reports its shifted musical key.

App ownership was released to parent after reading the13/13 result. No native application was built.
