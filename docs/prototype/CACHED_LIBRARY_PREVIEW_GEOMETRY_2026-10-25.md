# Cached library preview geometry — 25 October 2026

Source `f061853` reorders one cache guard in the existing preview pump. Already cached rows no longer read geometry when the viewport changes. All existing custom controls, layouts and library previews remain.

A real four-song Compact Vertical→Horizontal native capture identified the unnecessary work. One new regression executes the actual pump: original source measures12cached rows; repaired source measures0and still loads visible misses and misses revealed by scrolling. The affected file passes3/3. No broad suite or listening rerun.

Two complete owned native traces were independently inspected by hash, renderer/main thread, actual event markers and complete scope intervals. Both retain270original nodes, unchanged non-position values, four public playing states and12preview images. Thirty-two immutable source pins and four private media identities match before/after; actual originals were separately rehashed. Host mute was asserted. Normal0.1.56 remains stopped at its original positions with16saved tracks.

| Observed scope | Before | After |
| --- | ---: | ---: |
| Preview IntersectionObserver callback |6.111ms|0.070ms|
| Style/layout union within that callback |6.021ms|0ms|
| Event to second RAF |70.901ms|80.907ms|
| Largest overlapping main-thread task |54.052ms|64.235ms|

**This fixes redundant geometry, not the entire waveform-lag problem.** The after callback runs after the second-RAF boundary; scheduling/playback positions differ. The whole transition did not become faster in this pair. No GC, DSP or audible-pop attribution is established. Second RAF is a paint opportunity, not presentation; active buttons are not acoustic/voice continuity proof.

The baseline/current source was3667d6f; the post-fix source isf061853. The normal installed0.1.56 app has not been replaced by this source repair. No new desktop build/public release is claimed.

Earlier setup/launch failures and an operator-missed armed deadline remain recorded. Saving the two existing phase notifications to a private progress file enabled the bounded captures. No broad soak was restarted. Root IOConsoleLocked is not the screen-session lock flag; a later confirmed lock does not explain earlier failures retroactively. The project playbook remains an owner-review candidate, without global installation/adoption.

[Executed receipt and limits](cached-library-preview-geometry-results.json). Raw traces/media/manifests/profiles remain ignored. Trello ANA-FIX-07 covers only this narrow defect; CORE-FIX-07/10 and the intermittent pop remain open.
