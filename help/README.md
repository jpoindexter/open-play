# Open Play help microsite

Live: https://open-play-help.vercel.app

Canonical content lives in `content/*.md`. `pages.mjs` owns titles, descriptions and navigation. This static guide is separate from the desktop build: publishing it does not publish a desktop beta or change playback.

## Build and check

From this directory:

```sh
npm ci --ignore-scripts
npm run build
npm run check
python3 -m http.server 18889 --bind 127.0.0.1 --directory dist
```

The only package is the pinned build-time Markdown parser. No client framework, backend, account, analytics, external fonts or search service is required. Content is trusted, source-reviewed Markdown; this is not an untrusted user-content renderer. Search builds a local index and renders query/result strings with textContent.

The build reads the app's canonical palette/font tokens and current Help shortcut bindings. Documentation reading sizes/spacing are centralized in the site's root tokens. It does not copy dense DJ target sizes to a reading interface. `coverage.json` records source references and remaining acceptance; it is not published.

## Vercel deployment

Build from the repository checkout so canonical app sources are available. Deploy **prebuilt output only**, not the repository or a remote source build:

```sh
vercel link --yes --project open-play-help
npm run build
npm run check
vercel deploy --prebuilt --prod
```

Use the authenticated owner's intended Vercel scope. The static Build Output API tree is generated under `.vercel/output`; only explicit help assets/pages/index are copied. Original audio, app/profile backups, internal reports and repository files are excluded. Security headers are configured in `vercel.json`; verify them on the real deployment.

The first publication uses the existing `jasons-projects-998d5f27` team. GitHub auto-linking did not connect; deployment is intentionally manual/prebuilt. A Git push alone does not update the website. No environment file is required; the CLI-generated `.env.local` was removed without reading its token.

The local project link remains under ignored `.vercel/project.json`. Updating content rebuilds only `.vercel/output`, preserving that link. Review the deployed home, a deep article, search, mobile navigation and a real 404. Keep the previous deployment for rollback; use `vercel rollback` only for an actual bad publication.

## Content maintenance

1. Change the relevant Markdown and source coverage when controls change.
2. Update the version/date in `pages.mjs` only for the documented baseline.
3. Build/check and inspect the affected reading/search/navigation path.
4. Publish the exact reviewed output, record its URL/revision and update the existing DOC-001 card.

No full parameter-parity, screen-reader, current listening or physical compatibility certification is implied. Ten unedited screenshots from the current candidate’s actual browser interface illustrate fifteen articles. Generated demo tracks keep private library data out of the site; they do not establish native/device or listening acceptance. A current owner walk-through and public installation procedures remain documented gaps.

## Screenshots

`screenshots.json` records capture provenance, source revision, dimensions, byte sizes and hashes. Only privacy-reviewed captures of generated demo tracks belong in `assets/screenshots/`. The Markdown image alt text describes the controls; its title becomes the visible caption. The build preserves aspect ratio and adds full-size links. Keep images on their own Markdown paragraph. Run the image checks and inspect the actual published page after replacing a capture.
