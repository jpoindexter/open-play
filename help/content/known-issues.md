## Current release status

The [source repository](https://github.com/jpoindexter/open-play) is public under **MIT**, with a README, contribution guide, issue/PR templates and private security reporting. See [Source and contributions](/contributing/).

[Open Play Preview 0.1.152](https://github.com/jpoindexter/open-play/releases/tag/v0.1.152-preview.1) is available as an early Apple Silicon Mac prerelease. The app and DMG are Developer ID signed; the DMG is notarized and stapled. This is not a stable production-performance release. Final listening/visual/volume, controller/headphone routing and broader clean-machine/recovery acceptance remain unfinished.

The private Playback Test151library stays separate. The interface/screenshots in this guide retain their explicit **0.1.89** reference; this release does not claim every current control has been walked through again. Follow [installation and safe replacement](/installation/).

Earlier computer-audio sessions accepted specific manual mixing, EQ, Cue and Sync paths. They do not establish every current mode, song, device or long session. Package startup is separate from audible acceptance.

## Sync and four-deck reliability

- Intermittent Sync pops/clicks remain open, including a report with the incoming deck paused.
- Estimated beatgrids can align while musical kicks remain offset, especially with changing tempo.
- Four-deck waveform/UI stalls remain under investigation. Reducing redundant presentation writes does not establish stall-free native sessions.

Keep the outgoing song MASTER and preserve a concrete failure with timing/state. Avoid repeatedly rerunning clean cases.

## Pitch, Reverse and advanced audio

Some long-file/key-shift/Reverse combinations reach the pitch-render memory limit. Short-loop, Reverse rejection and stale-parameter repairs have bounded evidence; every native audible transition is not accepted.

Effects, Sampler, Stems, Pitch, Slicer, Flip and video have separate mode/preparation limits. No complete Serato/rekordbox/Traktor parity is claimed.

## Storage and keyboard limitations

Imported audio is durable only when local saving succeeds. Session-only tracks, clearing storage and space restrictions affect recovery. Metadata backup includes neither audio nor recordings.

The current save guard rejects invalid blank BPM on a warped track. Older private builds can save an invalid grid and encounter blocked recovery. Preserve the saved record if that occurs.

Full keyboard coverage and universal double-click reset remain unfinished. Use visible controls and the [current keyboard reference](/keyboard/).

## Hardware and services

Full current Hercules/headphone/master/controller acceptance is pending. Computer stereo cannot provide independent headphone monitoring. Physical socket mapping, hot-plug behavior and broader hardware compatibility need actual equipment tests.

Provider, Link, external-control and some file-operation surfaces remain explicitly simulated. They are not working streaming, networking, DVS/HID or native filesystem services.

## Report a problem

Use the [Open Play beta bug report](https://github.com/jpoindexter/open-play/issues/new?template=beta-bug-report.yml). The public repository also offers [a blank issue](https://github.com/jpoindexter/open-play/issues/new) with the checklist below. Filing reports requires a GitHub account; this help site has no separate support inbox or upload service.

1. App version, macOS/Mac model, audio output and controller setup.
2. Exact steps, expected result and actual result; say once/repeatedly.
3. Decks, track durations/positions, BPM/rate, Sync mode/MASTER, Key Lock/key shift, loops/Reverse and simultaneous work.
4. Whether the defect was heard, visible, in a downloaded master capture or uncertain; explain recovery.

Review screenshots/logs for private paths and names. Do not attach songs, full mixes, private backups, account credentials or other people’s data by default. Describe a recording first; agree an appropriate diagnostic excerpt if needed.


For security vulnerabilities, use [private vulnerability reporting](https://github.com/jpoindexter/open-play/security/advisories/new) instead of a public issue. See the project’s [security guidance](https://github.com/jpoindexter/open-play/blob/main/SECURITY.md).
