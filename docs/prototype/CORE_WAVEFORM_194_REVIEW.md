# Waveform194 — replace the rejected salmon rendering

Jason rejected the0.1.24 waveform appearance and supplied two official Serato pages plus a concrete image. This is an active core visual correction, not another broad parity investigation. The interim193 two-track mixing exercise was interrupted before an accepted transition; its partial normal recording is private native24-interrupted-mix193.webm. Both decks and recorder were stopped before visual work. No193 manual-mix acceptance is claimed. The final paused24session had Sync enabled/crossfader−0.16 and changed source positions; those states were observed, not attributed to an accepted automated sequence.

## Reference contract

- [Main screen overview](https://support.serato.com/hc/en-us/articles/360000067635-Main-Screen-Overview): spectral bass-red, mids-green and treble-blue; overview of the whole source, source-position marker and minute/five-minute divisions.
- [Main waveform display](https://support.serato.com/hc/en-us/articles/224969307-Main-Waveform-Display): local close-up around current position, pitch-scaled waveforms for beat alignment and +/-zoom. It also documents drag/scrub; that interaction remains open in this change and must not be claimed implemented.
- User's supplied image: thin, sharply defined peaks and changing red/orange/green/blue/magenta regions. It is a visual target, not a source raster to embed in the application. Private image identity is in the results JSON.

The source docs describe frequency content, not a genre label or arbitrary deck hue. Different spectral mixtures must change the waveform's color within and between real tracks.

## What was wrong

190used cumulative nested areas: paint highs, paint mids over them, paint a warm bass shape last. Bass amplitude concealed the other layers, producing the same salmon fill on nearly every hit. Symmetric peak fills and broad muted colors also concealed source polarity and transient detail. A token palette alone did not match the reference. The detailed timeline used the same source-second window for both decks, so changing pitch could leave beat spacing different even at matched playback BPM.

## Changed implementation

prototype/source-waveform.js now measures display-only bass/mid/treble energy with second-order Butterworth low-pass/high-pass/band-pass filters (250/2500Hz). It never enters the audio graph or modifies PCM. Source min/max/peak/RMS is cached in128-frame buckets (about2.67ms at48k). Full sampling/stereo union still preserves transients and avoids cancellation. Async work yields while preparing; loading remains labeled.

Each rendered time slice mixes its measured bands into RGB. Fixed display compensation(mid2/treble3) and a1.3ratio exponent keep smaller high-frequency details visible; these are explicit independent display choices, not measured vendor constants. Pure100/1000/8000Hz sources produce predominantly red/green/blue. A changing source changes color inside the same overview. Thin Retina-resolution strips draw signed peak detail with a quieter outer peak and brighter RMS body; no nested fixed-color area conceals other frequencies. Semantic RGB basis tokens now match the documented encoding.

Horizontal mode gains two stacked full-width detail lanes; Vertical retains its two center lanes. Both use the same decoded source and frequency colors. Source window span is shared playback span×nominal rate, and beat/cue/warp overlays use that same coordinate mapping. The source is still pre-FX. Horizontal detail always displays original decoded source; selected-Stems vertical behavior is retained, with no new Stems feature work. +/-keys and existing buttons share1–16szoom. Overview marks show minutes/five minutes behind the waveform.

## Focused evidence and limits

scripts/test_source_waveform.mjs retains the missed-transient/stereo/unchanged-input checks and now exercises the actual drawing path with known changing bass→treble and separate midrange data. It requires dominant red/blue/green from the actual marks, not merely a token or helper name. Passed. No audio DSP matrices were rerun for this display-only change.

Actual source preview loaded the same two real MP3s through normal library controls. Both layouts' changing colors and transient shape were inspected; source screenshots remain private. Initial screenshots during asynchronous preparation are retained; the second real source then completed and rendered. Native25 and user visual acceptance need their own observations. An attractive source screenshot alone is not native or1:1acceptance.

Existing cue191, jog192 and tempo189 evidence remains scoped to the identified0.1.24 candidate. Do not substitute visual changes for the still-pending audible manual/Sync/headphone/controller session. Current source is a review candidate; no full parity is declared.

## Native25 observed

Built from4af70e7a699f46b1fad76004a69812b58f082ec7; ASAR5b2d0944d623e28cfa7bf6022670febe6b5c099b84a77f1757cb0ae06223ac2d. Actual title/executable and five served production files matched. Both saved MP3s loaded normally; actual RGB Horizontal detail/overviews inspected. Both Play/Sync advanced with nonzero master meter and matching115.5BPM; visual grid intervals match despite different original BPM/rates. Native−/=keys zoom4→8→4s. Both Pause returned meter silence. Final Horizontal state: both real tracks20s, pitch0, Sync off, Master−12dB, crossfader center, recorder stopped. Profile backup198files/36822452B, before/after/copy hashes equal; old24retained. Package inspection5checks passed separately from runtime. This is executed source/native visual/control evidence, not user visual or audible mixing acceptance.
