# Core controls191 — actual native cue, EQ and filter audio

Continue only the core DJ workflow. Jason is unavailable for hardware and explicitly asked to keep preparing without the Hercules. No app source, candidate, mapping or profile reset was needed. This evidence belongs to running0.1.24/source2b0c785, not a new build.

## Observed software behavior

Native i set a quantized temporary cue at20.243s on real trackA. A subsequent1.8s key hold/release returned to the same cue and left both decks paused. Native accessibility observations serialize behind the key hold, so an attempted held-state snapshot showed only the released state; that snapshot did not establish audition playback. The normal REC → Start → i hold/release → Stop → Download → macOS Save path captured the actual master. Independent ffmpeg decode finds finite stereo48k/11.76s, peak0.122965 and20active100ms windows between0.6–2.6s. Both decks otherwise remained paused. This proves software cue audition audio plus release/return, not speakers or headphones.

One additional normal master capture contains repeated auditions of that same source phrase with neutral, EQ and filter settings. All raw music/captures/AX/timing remain private. The complete capture decodes finite stereo48k/137.94s; its long silent gaps are test operation time, not sustained audio playback.10audition bursts were identified; initial invalid setups are retained and excluded from isolated-response claims.

| Clean action | Broad frequency-band change against clean neutral |
| --- | --- |
| Low cut−24dB |30–250Hz power−20.56dB |
| Mid cut−24dB |250–4000Hz power−9.69dB |
| High cut−24dB |4000–18000Hz power−21.09dB |
| Filter−0.5 / low-pass |4000–18000Hz power−32.30dB |
| Filter+0.5 / high-pass |30–250Hz power−26.75dB |

These are measured broad-band changes across actual full audition bursts, not fitted acceptance thresholds, exact equalizer gain at center frequency, Serato-equivalent curves or listening-quality ratings. Detection:10msRMS>1e-6, merge gaps≤200ms, retain bursts>1s; all10 bursts correspond in order to the10 recorded native cue actions. FFT4096Hann/2048hop, average windows/channels, bands30–250/250–4000/4000–18000Hz. No fitted time alignment, synthetic tone or post-hoc source replacement. The repeated clean neutral differs from initial neutral by under0.04dB in these broad bands. Public numeric results are in CORE_CONTROLS_191_RESULTS.json.

## Test-control failure retained

The native accessibility value setter did not dispatch the expected range change. It appeared to set0 but subsequent real keys exposed−8.630408dB. This was an automation/setup failure, not evidence of an app EQ defect. Initial mid/high auditions therefore had other bands partly cut and are explicitly excluded. Used ordinary End plus20Left keys to reach0 on the−24..+6dB sliders, read all three0 values, then repeated only those affected isolated cases and the reference. Filter resets used ordinary Home/Right keys and native readback. Do not use AX setValue as proof of an audio range change.

Normal software Play plus forward y/backward t jog holds also executed on the real track; it kept advancing with nonzero master meter, no rejection message, and nominal pitch0/115.5BPM after release. That is a command/path smoke observation; bend-rate magnitude, transient audio quality and actual musical beatmatching remain unverified. Do not promote it to physical jog acceptance.

Native Setup readback: Cue Mix0%, Cue Volume10%, Master Cue off, Split Cue off, Stereo, EQ Boost6dB, Linear crossfader and default midpoint curves. Merely reading these settings does not establish monitor audio or independent outputs.

## Restored and remaining

Both real tracks are paused at20s. Both decks' high/mid/low/filter values read0, master meter reads silence, recorder is stopped. Both original MP3s still match the retained bytes/mtime/SHA256.272mappings and the existing candidate were not changed. No hardware, stems, FX catalog or full-parity work occurred.

Next useful step is a practical software or Hercules two-track manual and synced transition when Jason can listen; cue/master blend and independent headphone outputs need that physical confirmation. Reuse prior scoped mixer/output evidence and these focused checks rather than rerunning them. The core goal remains active and unaccepted.
