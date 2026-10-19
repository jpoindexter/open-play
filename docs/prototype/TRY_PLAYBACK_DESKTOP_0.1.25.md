# Open Play Playback Test0.1.25 — RGB source-frequency waveforms

The running app has two real local MP3s loaded, paused at20s in **Horizontal** view. Master−12dB, pitch0, Sync off, crossfader centered and recorder stopped. Hercules is unavailable; output remains system-default stereo.

This replaces the rejected0.1.24salmon waveform renderer. Actual bass/mid/treble content now mixes red/green/blue per source-time slice, producing changing colors inside and between tracks. Signed peaks and RMS detail render as thin Retina strips. Horizontal has two full-width close-up lanes; Vertical retains center lanes. Shared zoom is1–16playback seconds, with pitch-scaled source/grid/cue geometry. Use the+/−buttons or keys while focus is outside an input. Whole-track overviews retain seek and now show minute/five-minute time marks.

The same source file can change from red bass to blue treble. No genre classifier or arbitrary per-deck hue is used. Display filters/balancing are independent approximations; exact Serato proprietary rendering and Jason's visual acceptance remain open. Main-detail drag/scrub is still open; overview seek remains available.

## Observed in this exact candidate

Both saved real files loaded normally, produced their distinct RGB detail/overviews, and played/synced at115.5BPM with nonzero master meter. Native zoom keys executed4→8→4s. Both Pause returned the meter to silence. This focused display/control smoke check does not establish acoustic headphone/master separation or a perceptually accepted manual/synced musical transition. Prior24cue/EQ/jog evidence remains scoped to24.

Source4af70e7a699f46b1fad76004a69812b58f082ec7; ASAR5b2d0944d623e28cfa7bf6022670febe6b5c099b84a77f1757cb0ae06223ac2d. Native executable/title and five served files match. Package inspection5checks passed. Closed-profile backup198files/36822452B has equal before/after/copy hashes. No profile reset or mapping import/replacement occurred. Keep the saved272Alternative mappings; physical acceptance remains open.

Use **Start Open Play Current Test.command**, **Start Open Play Playback Test.command**, or **Start Open Play Playback Test 0.1.25.command**. Close one playback version before another; they share the saved profile and port18775. Versioned24/23apps and launchers remain. On restart deck selection resets to demos; real imports/maps remain and can be loaded normally. No source music was changed or included in the package.

Read [waveform review](CORE_WAVEFORM_194_REVIEW.md), [native observation](desktop-0.1.25-playback-observation.json), and [core DJ plan](../delivery/CORE_DJ_FIRST.md). Follow the existing core controls; no advanced-feature work before the practical two-track session.
