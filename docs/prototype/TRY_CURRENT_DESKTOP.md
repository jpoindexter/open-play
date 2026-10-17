# Current optional desktop test: 0.1.10

Double-click **Start Open Play Current Test.command**. The window title is **Open Play R3 Transport Test 0.1.10 — offline DSP cache test**. Earlier apps and launchers remain available.

The existing interface uses the new local offline Rubber Band cache. Import owned audio, select its row, load a deck, enable Key lock and press Play. The first preparation takes time. Multiple preparation requests now queue; one deck no longer fails solely because another is preparing.

Use the existing Stems pads to prepare real separated audio through the local SCNet service on port8768. With the service running, the normal preparation flow loads four sources. If unavailable, the app reports the missing service; ordinary playback still works. This Mac's already installed Rubber Band4.0.0 library is also required. Nothing is downloaded by this test app.

Executed evidence is scoped by version:

- 0.1.8: native import/play/+8tempo/+2keyshift/record/save passed the declared steady-pitch check.
- 0.1.9: overlapping deck preparations both reached playback. One bounded native recording had exact zero with all four stems muted, then nonzero stereo audio with only Drums enabled. This does not establish separation quality or all pad combinations. Two earlier recordings overran the short track and remain failed evidence.
- 0.1.10: the new completion handler was exercised through native import/load/keylock/+8/play; a six-second track stopped itself at its end, with0decksplaying/Master0 and no Pause click. Audio-quality and stem checks above retain their earlier candidate identities.

This build has a separate local profile. Previous MIDI maps and Hercules output routing have not been copied or physically retested here. Use its existing Devices/MIDI controls or mapping import. Controller/headphone/speaker confirmations remain scoped to the earlier builds that were tested.

Open work includes preparation feedback and memory/long-file behavior, queued cancellation/recovery, dynamic changes and compound transport, source quality/transients/tails/cursor, physical hardware, sync/Link/providers, library/interoperability and reference/visual matching. It is not a portable release or complete Serato replacement yet. All110featuregroups/522requirements remain tracked; no full-feature acceptance flag was promoted.
