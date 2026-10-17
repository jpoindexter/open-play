# Open Play R3 Test 0.1.8

Open **Start Open Play R3 Test.command** in the project folder. The window title must say **Open Play R3 Test 0.1.8 — offline DSP cache test**.

This separate local build keeps the existing interface and AudioEngine, selects a new offline native Rubber Band R3 cache, and has its own local profile. Earlier builds and the default launcher are preserved. It currently relies on the Rubber Band4.0.0 library already installed on this Mac; this is not a portable release.

- Import owned audio, select its library row, then press deck2 **Load**.
- Enable **Key lock**, adjust tempo/key, then **Play**. Initial preparation can take several seconds. This build prepares a complete transformed buffer; it is not the RealTime-mode candidate with the known endpoint failure.
- Use the existing playback/mixer/recording controls. Pause before closing.

The fresh profile has none of your old device settings or MIDI mappings. Hercules browser movement and headphone/master isolation were confirmed on earlier specific builds; those results are not a new physical0.1.8 acceptance test.

Current evidence: the native child worker returns all samples byte-exact to the accepted offline fixture and is terminable during processing. The main UI has imported the owned stereo fixture and reached playback at+8tempo/+2keyshift; the single native recording check passed its declared8–10s stereo pitch criteria (errors.000174/.000035Hz) in desktop-0.1.8-r3-audio-inspection.json. This is steady-tone evidence, not musical/cursor/physical acceptance. The app is paused.

Open work includes native five-source stems/coherence, dynamic changes while preparing, cancellation/recovery through this new endpoint, latency/progress feedback and full-buffer memory limits, music/transients/tails/cursor, reverse/loops/Stem Slip, physical hardware, provider/reference/visual parity. Full110-group/522-requirement scope remains open. This local trial is not a full-parity claim.
