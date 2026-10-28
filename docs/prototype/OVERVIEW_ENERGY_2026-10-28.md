# Readable deck and library overviews — 28 October2026

Jason reported that the deck full-track strips and playlist thumbnails looked like solid color bars; large top scrolling waveforms were acceptable and must stay unchanged. Actual private91 native screenshot confirms the overviews filling most of their wells.

The shared source painter used whole-bucket minimum/maximum peaks for both time scales. Each full-song pixel spans many transients on mastered music, so nearly every bucket reaches similar peaks. Overviews now paint the existing measured RMS body without the outer peak union. They retain their original44/32px wells, source spectrum colors, full-track duration, cue/warp/loop markers, seek controls and accessible names. Large detail still uses its unchanged peak/body painting. No audio gain, PCM, grid, Sync timing, layout/CSS or new dependency.

Both consumers use paintSourceOverview: deck strips and playlist thumbnails. Generated thumbnail cache advances v1→v2 and removes only the obsolete generated cache, so existing songs receive the new display without reimporting or changing metadata/audio. The display source remains147lines, thumbnail module119and focused regression17.

Actual old/new same-source44px rendering: Constant Change median painted height36→24px,90th percentile36→26; Prism32→22and33→24. Shorter-height rendering preserves measured sections rather than manufacturing peaks or breakdowns absent from the audio. The original compressed recordings can still have fairly even energy through loud sections.

One new regression fails before the repair and passes afterward: equal isolated peaks no longer flatten quiet/loud energy, dense body retains headroom and PCM remains identical. Two directly affected detail-raster checks also pass. Actual same-track400×96large-detail pixels match baseline exactly. Isolated current four-deck workspace has4Play/351observed controls/1materialized library preview, all positions0/stopped/master0, generated thumbnail cachev2. Materialization continued later; this is not an all-library readiness claim. Native92delivery is recorded separately. No broad suite, repeated audio soak or listening claim.

Private comparison/source baseline: local-evidence/overview-energy-2026-10-28/. [Compact observations](OVERVIEW_ENERGY_2026-10-28.json). Original music is read for offline decoding only; no new music copies or playback. Owner visual acceptance of the changed native previews remains pending.
