# Browser test candidate and desktop gate — 17 October 2026

Open [Open Play](http://127.0.0.1:8768/prototype/) or double-click `Start Open Play.command` in the project folder. The current interface remains HTML/CSS/JavaScript; no rewrite or native application has begun.

## First hands-on test

1. Click **Import audio** and choose two local tracks. Import retains bytes locally for this browser session; a reload requires importing again.
2. Select a track and use deck1 **Load**, then load the other onto deck2. Start both. Move the crossfader left, center and right; confirm the expected track is heard.
3. On one deck, set a cue and a four-beat loop; release the loop and change tempo with key lock enabled. Report dropouts, unexpected pitch or incorrect positions. Scratch-return edge cases remain under active verification.
4. Open **FX**, choose/enable an effect and vary depth. Open **REC**, start, stop, download and replay the actual capture.
5. Stop both decks. Keep the Hercules connected for a separately agreed physical input/output test. Browser playback currently uses its default output; the headphone cue control still labels simulated routing.

A successful browser music test would establish useful playback/mixing on your files. It would not establish hardware compatibility, separated headphone/master audio, full Serato parity, or a native app. Record the actual browser/version, files/formats, actions, symptoms and expected result; do not replace observed results with a feature checkbox.

## Observed by Codex

The visible main interface played both generated demos with advancing clocks and a nonzero master meter, saved a13.2s master recording, and paused both. The actual downloaded WebM decoded to finite nonzero stereo audio. The source artifact and bounds are in `real-test-main-master-observation.json`. This has not tested your music or your speakers/headphones acoustically.

## Desktop approval

Next proposed step after your review: package the same UI/code in a desktop host, then test import/relaunch, controller input and physical master/headphone separation. An installable wrapper alone does not close these hardware/audio gaps. Native work requires your explicit approval of the identified review revision; approval has not been inferred from architectural questions.
