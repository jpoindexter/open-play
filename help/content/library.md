![Library focus view with eight generated demo tracks and full-track waveform thumbnails in the Preview column](/assets/screenshots/library-previews.jpg "Library focus makes room for browsing. Preview thumbnails show the full song before loading; these examples use generated demo audio.")

## Import local music

Use **Import** to select audio from disk. Retain the original files separately. A successful import for the current session does not prove durable storage; check the **Files** panel for saved/session-only status.

If local saving fails, the song can remain usable in memory. Use **Retry local audio storage** where offered and read the resulting status before quitting. Supported decoding depends on the current browser/desktop runtime and the actual file; a filename extension alone is not a compatibility guarantee.

## Browse and load

Select a song row and use the intended deck’s **Load**. **Shift + left/right arrow** loads the selection into the A/B decks. Use the visible Load controls for C/D or when keyboard focus is in an input/dialog.

The search field filters the library. **Command + F** focuses it. Library columns include track metadata such as title, artist, BPM and key; use **Columns** to choose available fields. A missing estimate should remain unknown rather than being treated as an accurate zero BPM or musical key.

## Waveform previews

The **Preview** column shows a full-track waveform before you load a song. In supported layouts, enable **Columns → Preview waveform**. This is separate from the deck’s overview and the detailed moving waveform.

- **Preparing waveform…:** wait for thumbnail work to finish.
- **Preview unavailable:** use the offered retry action and check that local audio is available.
- An empty preview while preparation is pending does not necessarily mean the track is missing.

Previews are visual aids, not proof of BPM accuracy, clipping safety or musical structure. Preserve previews when changing layouts; a layout switch is not intended to remove the underlying library.

## Crates and smart crates

**New crate** creates a named collection. Use the crate’s editing controls for organization. **New smart crate** uses field/rule criteria to select matching tracks; inspect the rules when a song unexpectedly appears or disappears.

Crate membership is library metadata. A crate or metadata export is not a copy of the original audio. Use [Save, back up and recover](/backup/) for the distinction.

## Prepare and History

**Prepare** holds songs you want to play next. The current binding **Command + P** adds the selected song. **History** records session activity; it should not be treated as a recording or a perfect external play-count ledger.

Right-click a track to open **Track Details** and other available actions. Some missing-file/file-operation surfaces are explicitly simulated; do not assume they moved, relinked or deleted a real filesystem file unless the app states and performs that action.
