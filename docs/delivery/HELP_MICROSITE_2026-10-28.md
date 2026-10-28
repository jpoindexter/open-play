# Open Play help microsite — 28 October 2026

**Published:** https://open-play-help.vercel.app

The user requested a full help/manual microsite on Vercel. The first edition has20source-controlled Markdown articles and task-based navigation covering first mix, install/update, workspace/layouts, decks, Sync/master/manual beatmatching, waveforms/grids, mixer/headphones, cues/loops, recording, library/previews, analysis, backup/recovery, Settings, shortcuts, MIDI, advanced features, troubleshooting, limitations and glossary.

## Source and scope

`help/` is separate from the desktop build. Current app remains private0.1.88/source1fecc28. No desktop rebuild, playback, audio/DSP/control/layout change, library/profile access or new listening session occurred. The owner chose listening later; core reliability and hardware gates retain their existing status.

Canonical Markdown is paired with source references and explicit gaps in `help/coverage.json`. Keyboard rows are generated from the real `helpKeys`; font/palette are resolved from canonical app tokens. Site reading geometry is centralized separately from dense DJ controls. New authored code files are30–124lines; no whole-repository size-compliance claim.

One pinned build-time Markdown parser; no client framework/backend/search provider/analytics/external font. Local search renders query/result strings through textContent. Trusted authored Markdown is not an untrusted user-content renderer. The site contains no original songs, user library captures, profile backups, credentials, internal traces or evidence directory.

## Publication

Dedicated `open-play-help` project in the existing Vercel team. The user authorized this help publication; it does not authorize a public desktop release. Local build→focused check→prebuilt static Build Output API upload. Only generated static help files/routes/security headers published. GitHub auto-connection failed; no automatic Git deploy is claimed. The generated OIDC environment file was deleted unread because the site needs no environment secrets. Project link remains ignored.

Production alias: https://open-play-help.vercel.app

Immutable deployment: https://open-play-help-oshxy7s3e-jasons-projects-998d5f27.vercel.app

Deployment ID: `dpl_FEfS72pkVyxGDYKLhnbC781YDxpu`

## Executed acceptance

- Build/check:20articles, all internal page/fragment/asset references, unique IDs, source coverage paths, search index and404route. Public-content guard excludes local paths/ARI/private-key markers.209554static bytes before transport compression. These checks are not a full security/a11y certification.
- Actual local browser: home rendered, headphones search→mixer article;390px embedded document uses actual responsive stylesheet and Contents collapsed→expanded. Phone-width rendering is not a physical-mobile-device test.
- Actual public browser: home rendered without sign-in; beatgrid search→9results with waveform guide first; zero-result message and return-to-article observed; screenshot retained privately. Static articles remain readable without JS; interactive search needs JS.
- Unauthenticated HTTP: home, Sync, keyboard and search index200; unknown route404. CSP, nosniff/referrer/permissions headers configured; CSP observed on each inspected response. No private deployment bypass used.
- No broad audio suite/soak or repeated clean Sync attempts. Original current Mac session untouched. Owned temporary phone fixture removed by final build; only the public deliverable tab retained. Temporary local server stopped.

## Remaining DOC-001 acceptance

Keep the broad manual card OPEN. Release-candidate screenshots, current owner walk-through, verified public install/update/rollback procedure, comprehensive per-parameter advanced reference and complete keyboard/device coverage remain incomplete.

In-app Help integration remains with UI-009/DOC-001: the current desktop denies external new windows/navigation. A future narrowly allowed help-opening path needs its own actual desktop acceptance; do not claim a website link works inside0.1.88or weaken all external navigation for convenience. This pass adds the published manual to the repository entry, without changing the test host.

The site clearly labels private-beta status, simulations, unresolved Sync/stalls, storage caveats and hardware limits. It offers a GitHub template link plus blank-issue fallback while the template is on the feature branch. Actual issue submission, VoiceOver, physical controller and fresh listening were not performed.

Re-entry: update the relevant Markdown when core behavior changes, build/check locally, deploy prebuilt manually, verify the affected public path, then update DOC-001. Core-beta priority returns to current listening and distribution gates when the owner is available.
