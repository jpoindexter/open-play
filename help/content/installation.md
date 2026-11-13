## Download the Mac preview

[Download Open Play Preview 0.1.152](https://github.com/jpoindexter/open-play/releases/tag/v0.1.152-preview.1) from the versioned GitHub prerelease. Choose the **arm64 DMG** for an Apple Silicon Mac. The release also includes SHA256SUMS.

The app and disk image are Developer ID signed, and the disk image is notarized with a stapled ticket. This establishes distribution trust, not musical quality or controller certification. It is an early evaluation preview; read [known issues](/known-issues/) before relying on it.

Intel and a fully tested macOS compatibility range are not established. The app declares a macOS13 minimum, but that declaration is not a test across every supported OS. Do not disable Gatekeeper or macOS security if installation is blocked; report the exact message.

## Install and open

1. Open the downloaded DMG.
2. Drag **Open Play Preview.app** onto **Applications**.
3. Eject the disk image and open **Open Play Preview** from Applications.
4. Lower your output volume, keep separate copies of your original songs, then follow [Your first mix](/first-mix/).

This app uses its own **Open Play Preview** profile. It does not migrate or overwrite the private **Open Play Playback Test** library. Import your songs into the preview; no personal music is bundled. Do not run two copies of the same preview at once.

The [MIT source](https://github.com/jpoindexter/open-play) and [README quickstart](https://github.com/jpoindexter/open-play#run-locally) remain available for browser use and contribution. See [Source and contributions](/contributing/).

## Before updating or restarting

1. Pause every deck and stop Sampler playback.
2. Stop and download any recording you need. An unfinished or undownloaded capture is not saved.
3. Check **Files** for session-only audio and retry local storage where offered.
4. Export your metadata backup and keep original music separately.
5. Quit normally before replacing the app in Applications. Keep a recoverable profile copy when following an owner-supplied recovery procedure.

Updates are manual; no automatic updater is provided by this preview. Avoid switching old/new versions against one live library. A fresh profile/restart observation does not establish every crash, downgrade, migration or disk-full recovery path.

## Remove the app safely

Quit normally, then move **Open Play Preview.app** from Applications to Trash. Removing the app does not remove its separate profile, metadata or music. Do not delete application data to troubleshoot missing tracks; preserve it for recovery first.

## Licenses and reporting

Original code is MIT licensed. The installed app retains Electron/Chromium and original notices in **Contents → Resources → Licenses**, plus component terms in the bundled source archive. Use Finder’s **Show Package Contents** to inspect these files.

[Report installation problems](https://github.com/jpoindexter/open-play/issues/new/choose) with the version, Mac architecture, macOS version and exact error. Do not attach personal music, whole library backups or credentials.
