# Illustrated Help update — 28 October 2026

Published: https://open-play-help.vercel.app

Ten unedited screenshots now illustrate fifteen of the twenty manual articles. Each image has descriptive alt text, a caption and a full-size image link. Scope is documentation only: no desktop rebuild, playback/DSP/layout/control change, original-media import or main-profile input. Current native0.1.89 remains paused; the owner’s listening/controller session remains deferred.

## Captures and provenance

The actual current workspace and dialogs were captured at1280×720 through computer use, using generated demo tracks in a separate browser origin. Source matches0.1.89’s prototype revision `4d507de41ef0f863ae022e4bc4d75c34ca658714`. Master was muted and all decks paused. No private library, recordings, personal paths or physical device photos are included. Raw browser JPEGs were retained without cropping, conversion or recompression.

Views: two-deck Horizontal/Compact; four-deck Vertical/Compact; library focus with full-track previews; Layouts; staged beatgrid marker; track metadata; keyboard Help; recording controls; audio routing; metadata backup tools. The grid marker was a cancelled draft, not a saved musical correction. Routing fixtures and other limits remain explicitly labelled.

`help/screenshots.json` records source, dimensions, sizes and SHA256 hashes. Assets total1,144,883bytes; generated site1,369,151bytes. The build uses the existing Markdown renderer, escaping helper and stylesheet tokens; no new dependency, image service or client lightbox.

## Executed delivery checks

- Existing build/check:20articles,15illustrated,10asset signatures/hashes and intrinsic-size attributes, internal links/fragments/assets, source coverage, search index/private-content guards and404route. All source JPEG dimensions were inspected as1280×720.
- Local actual browser: home screenshot loaded1280×720 with no horizontal overflow at1280width. A390px embedded Settings article visibly preserved image aspect ratio, caption and full-size link. This was phone-width rendering, not a physical-device test.
- Public actual browser: library image loaded1280×720; full-size link opened the actual JPEG in a separate tab. Responsive library screenshot/caption inspected at565px width. Public proof retained privately, with no new app playback.
- Unauthenticated production: all ten image bytes match source hashes and return200/image/jpeg; workspace article includes current image/version; CSP observed. Receipt: `HELP_SCREENSHOTS_PUBLIC_2026-10-28.json`.
- Existing DOC-001 updated and read back, historical criteria/model recommendations preserved, card remainsOPEN. No duplicate card. Receipt: `HELP_SCREENSHOTS_TRELLO_2026-10-28.json`.
- Isolated demo origin cleared; iframe closed; both owned temporary servers stopped; temporary phone fixture removed. Main desktop and original workspace tab retained. No Downloads or additional desktop bundles created.

## Publication and limits

Manual prebuilt Vercel deployment `dpl_CpVctJsZozhGwheCUXMPgDTgHGip`:
https://open-play-help-ydwxh0jh7-jasons-projects-998d5f27.vercel.app

Production alias: https://open-play-help.vercel.app

Git push does not auto-deploy this project. No environment secret or new permission was needed. This documentation publication is not a public desktop release.

Not checked: current owner walkthrough, new listening/controller acceptance, physical-device photography, exhaustive advanced parameter coverage, VoiceOver or in-app external Help opening. These captures establish real interface appearance, not native hardware/Sync reliability. Existing in-app external-navigation guard remains unchanged.

Core re-entry: return to the pending private0.1.89 core reliability/listening/distribution gates; keep CORE-FIX-42 and remaining audible/native checks open until their own acceptance runs.
