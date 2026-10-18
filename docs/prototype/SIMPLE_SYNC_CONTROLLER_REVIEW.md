# Simple Sync controller tempo and OFF

18 October2026, browser source based on44651b6. **Desktop0.1.22 remains unchanged. Physical hardware, native execution of these changes, DVS/CDJ modes and full parity acceptance remain open.**

Serato's[Simple Sync documentation](https://support.serato.com/hc/en-us/articles/203056994-SYNC-with-Serato-DJ) distinguishes controller behavior from vinyl/CDJ behavior. Controller pitch movement in Sync changes the tempo of synced decks. One controller OFF fully disengages Sync and returns to the hardware's absolute pitch. The documented vinyl/CDJ relative-mode and preferences exceptions are separate requirements; this implementation/test cohort covers the MIDI-controller/internal-deck route only. Plan132's paused installed reference showed a one-OFF return, but its selected Sync preference was not inspected. That observation is consistent with, and does not independently prove, Simple Sync behavior.

## Reproduced defects

The production MIDI relative branch was limited to Smart Sync. A100BPM track synced to120BPM therefore waited for an absolute±8% controller to cross an unreachable+20% target. Three focused controller checks failed: movement, rebasing after a shared/software change and resuming after Shift reposition. The pre-existing explicit absolute-reset helper passed its controlled check; Simple OFF never called it.

An actual production browser run then retained the failures in audio. A received−2% physical coordinate was cached before Sync. After Sync to+20%, moving that coordinate to−1% left both decks at rates1/1.2 and330/660Hz rather than1.008333333/1.21 and332.75/665.5Hz. Clicking one GUI OFF also left the secondary at+20%/660Hz rather than−1%/544.5Hz. Both normal Stop buttons produced exact-zero audio. The before report's Stop case is marked false only because the earlier failed rates differ from the intended scenario; it is not evidence for a Stop defect.

## Change

Absolute controller travel now uses the existing relative-movement path while Simple Sync is engaged. Its first relative packet anchors against the latest received physical position; further movement offsets current software tempo. Shared-tempo changes, Shift-ignore reposition and coalescing use the existing implementation. Simple Sync's OFF path explicitly clears Sync/role/state and calls the same cached absolute-reset helper used by Smart Sync's second OFF. Known physical pitch restores immediately. If no physical position has been received, actual software rate is preserved and the first subsequent packet gets absolute takeover. No zero position is fabricated.

Ordinary absolute pickup remains in place outside these explicit takeover transitions. Smart Sync still retains relative mode after its first OFF and restores absolute pitch after the second. The OFF tooltip now explains the mode-specific action. This patch changes seven app lines and the MIDI mode predicate/comment; it does not change DSP, controller addresses, saved mappings, device permissions, packages or native-engine architecture.

## Executed evidence

Four focused controlled Simple Sync router cases pass; the original three failures are retained separately. The existing ten Smart Sync/ordinary pickup/reset neighbor contracts also pass, because both modes use the same branch. These are controlled collaborators, not audio or physical acceptance.

One final production browser Run executes11states through actual app GUI handlers and MIDI-editor synthetic paired14-bit/Note input:

1. Receive−2% controller pitch, Sync to+20%, then repeat the same coordinate without a jump.
2. Move the controller coordinate by+1%; both synced decks change coherently.
3. One GUI OFF restores the cached−1% on the secondary while primary tempo stays unchanged.
4. Unsynced movement resumes ordinary absolute−2% pitch.
5. Synthetic MIDI Sync re-engages Simple Sync.
6. GUI primary-tempo movement followed by controller movement rebases relative pitch.
7. Mapped Shift-ignore/release retains tempo.
8. Subsequent controller movement resumes relative adjustment.
9. Synthetic MIDI OFF immediately restores the cached−3% pitch.
10. Primary OFF with no received physical position preserves its actual1.034333333rate; the first center packet takes over at1.0.
11. Both normal Play buttons stop; captured output is silent.

The test uses two generated60s engine buffers,330Hz isolated left and550Hz right. Physical output is muted before Play. Snap to Beatgrid is explicitly enabled for the re-Sync action. This grades tempo and OFF behavior; it does not grade transient/beat alignment, real-file import, music quality or keylocked/warped/StemSlip combinations.

All22post-master Float32 windows contain13230finite samples at44100Hz. Independent hash/full-window finite checks and a global20–20000Hz Hann16xFFT estimate yield worst frequency error0.000031315256Hz, below the fixed0.3Hz criterion. Active RMS exceeds0.005; both final windows are exactly zero. Declared rate tolerance remains1e−8; the re-Sync rate1.2099999904632568 reflects the existing audible-rate precision and is inside that criterion. No tolerance was changed after observing it.

Original JSON1715211bytes SHA`f9082b31acdf0b57bdb32ba521b7d0e27e3c7928a3cdf11af4d528530770bff9` and raw22windows are retained privately under ignored`local-evidence/simple-sync-controller-133/`. The whole Opus/WebM master is108088bytes SHA`b1c58ab5bfb0a60216492d7306a5e11498fb86b79c0d091fb3d79d8e9151c7d8`. Browser decode reports44100Hz/stereo298998frames; independent FFmpeg decode reports48000Hz/stereo325440frames, all finite/nonzero. These are distinct decoder sample rates. This is not a continuous-dropout, acoustic latency or phase measurement.

The normal Download original report link was executed in the browser. Its downloaded1715211bytes exactly match the retained original and hash. Ten before/after fetched module hashes remain stable and match final local files. Final app SHA`131f2278e3db5460c0b5008c8328a3b073f1d8d03cff01e694ee8027f04a54b4`; MIDI router SHA`5e939909bfd6ed820a6c888d69d405fce7dcc81835a0a7ff42c6d7f5fce1e040`. The initial observation deadline expired while the before run was still finishing; the same tab was reread and its completed original retained. The run was not restarted because of that timeout.

## Remaining scope and next step

Physical fader packets/listening, exact vendor taper/timing, controller reconnect, multi-device contention, in-flight engine failures, phase/transient accuracy, real files, music and keylock/warp/StemSlip/loop compositions remain open. Mapped Shift-ignore was exercised as an independently supported controller command; no new claim about a specific Hercules firmware gesture is made. DVS/CDJ relative behavior and the Tempo Slider affects all synced decks preference are not implemented or accepted by this controller patch. Full55extendedFX, Stems/keylock quality, all110groups/522requirements and release checks retain their existing independent acceptance boundaries.

The two concrete core patches132/133 now justify one fresh approved local desktop batch. Prepare0.1.23 only after freezing its source version, retaining22bundle/versioned launcher, stable closed-profile backup and272mapping export. Add`tempo-slider.js`and the GUI/Simple controller diagnostics to critical assets and isolated Checks entries. Execute the packaged GUI input and Simple controller audio paths with their normal exports; preserve source/runtime scope and restore the named Hercules master1/2+headphones3/4, Master−12dB, stopped setup before promotion. No native-engine rewrite or public release is authorized by this step. Do not rerun broad green FX/Stems matrices. Keep22prepared until a replacement meets those scoped checks.

Jason remains away; no timed physical capture/readiness request. His next physical action stays leftHerculesPlay→deck1/RCA sound→samebuttonstop, then one action at a time. The full independent Claude audit remains unlaunched; the handoff is updated without altering its original prompt suffix.

[Before controlled failures](simple-sync-controller-before-policy-results.json) · [Before browser audio](simple-sync-controller-before-browser-results.json) · [Controlled cases](simple-sync-controller-policy-results.json) · [Smart Sync neighbor checks](simple-sync-smart-neighbor-results.json) · [Actual browser audio](simple-sync-controller-browser-results.json) · [Current desktop](TRY_CURRENT_DESKTOP.md) · [Full plan](../../FULL_BUILD_PLAN.md)
