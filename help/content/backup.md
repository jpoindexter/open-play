![Library tools dialog with Export prototype backup and Restore backup controls](/assets/screenshots/library-tools.jpg "Performance panels → Library tools. Metadata backup is separate from original audio and downloaded mix recordings.")

## Keep three kinds of data separate

| Data | How to keep it |
|---|---|
| Original music | Retain your own files and independent backup. |
| Library metadata/settings | Use **Export prototype backup** and keep the file. |
| Mix recording | Stop recording and **Download capture** before quitting. |

No one export contains all three. A metadata backup is also not a complete transport/session snapshot.

## Check local audio storage

Open **Files**. Saved local audio can be reused when storage succeeds. A **session-only** track may disappear after quitting; select **Retry local audio storage** if offered.

If saving fails, keep the original file and read the exact warning. Browser storage clearing, space limits, permissions and profile changes can affect recovery. Do not delete application data to make a warning disappear.

## Export metadata

Open **Performance panels (…) → Library tools → Export prototype backup**. This includes application metadata/settings/crates, including cues and grids where present. It contains **no audio and no recordings**.

Keep a current export before experimenting with another backup, upgrading or changing library data. Review exports for private track names and comments before sharing them.

## Restore carefully

1. Pause all decks and stop samples.
2. Export your current metadata first.
3. Choose **Restore backup** and select the intended file.
4. Read the result. Restore updates matching entries; unmatched audio needs importing separately.
5. Confirm the library and local-storage status before quitting. A session-only result is not durable.

Invalid backup data should be rejected without replacing valid current state. Preserve an unexpected error and both the existing profile and original backup instead of repeatedly retrying or resetting the app.

## Recovery after a failure

Keep original media, downloaded captures and metadata exports. If the app reports blocked recovery, do not overwrite the stored record or delete the profile. Record the version, visible error and last action, then [report the problem](/known-issues/#report-a-problem).

Private upgrade/reload checks cover specific paths. Full clean-machine, crash, downgrade and all-version migration acceptance remains incomplete. Follow an owner-supplied recovery procedure for your exact build.
