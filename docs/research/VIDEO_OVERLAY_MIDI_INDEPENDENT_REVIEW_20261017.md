# Independent overlay MIDI ownership review — 2026-10-17

Source/controlled-execution review only. No product edits, GUI, physical devices, native acceptance, Git or external service actions. Learning and registry integration are still parent-owned work in progress and excluded. Applied adversarial verification, integration-level testing and explicit ownership boundaries.

## Confirmed initial failures

Owned `scripts/test_video_overlay_independent_review.mjs` executes the real `createVideoMixer` and real overlay MIDI helper with real Blob/object URLs and a controlled resolving Image.decode. It does not decode real pixels. Initial immutable evidence `docs/prototype/video-overlay-independent-initial-results.json` records **0/3** desired-state checks at helper `bb1e33cc1faac9d0f8667daa519b476f391238bcd02612e9f343e34e99a2bf16`, mixer `d09978db2178d009281ff38ab8923d33e2c18a5129c8188f7d4066db92f15823`, state `5207f031efcb72f683fd7aecd36a6747bf52d3ed229d60cfd1cca83a740f0e0e`.

1. **Metadata reload clears another overlay's shared decoded image.** `prototype/video-overlay-midi.js:62–64` calls clearOverlayImage on the old reference unconditionally. Two unique image overlay IDs a/b can share stable reference shared; loading a's preset deletes shared decoded bytes while b remains enabled and still references shared. The actual mixer exposes `hasOverlayImage(left,shared) === false` afterward. This contradicts the shared-reference protection already present in moveOverlay (`prototype/video.js:222–224`). Preserve other consumers' asset ownership, detach safely, or explicitly refuse before any metadata/resource mutation.

2. **Metadata reload can silently adopt a different layer's bytes and bypass the reimport requirement.** Start a with imageRef own and b with imageRef a, with both decoded keys present. Reloading a clears own then overwrites imageRef with a (`prototype/video-overlay-midi.js:64`). Its next On command sees b's existing asset under a and succeeds (`43–45`), although no image was reimported for a. The raw result preserves imageRef a, enableError null, enabled true. Preflight new reference collisions or allocate genuinely independent ownership; being temporarily off is insufficient.

3. **Selecting an image with a colliding ID can activate a text layer instead.** The candidate list is filtered by kind, but `activate` finds the first target/id match without a uniqueness/kind check (`prototype/video-overlay-midi.js:16–18`, called at29–31). With text collision preceding image a/image collision, next-image selection returns kind text and sets the text selection; image selection stays a. Overlay snapshot/restore retains duplicate IDs (`prototype/video-state.js:67–80`,97–103), so sanitizer behavior does not refute the reproduction. Resolve the intended unique candidate or refuse ambiguous identities atomically.

After preserving initial evidence, the owned test was extended to accept either correct independent behavior or an explicit identity/reference-related refusal with unchanged metadata and resources. This is a safe-policy alternative, not acceptance of arbitrary exceptions; regressions still require existing consumers' bytes to remain present.

## Source observations without a new failure claim

- moveOverlay validates disposed state, source uniqueness, destination ID/reference collisions and shared source references before moving either array or asset (`prototype/video.js:214–228`). It invalidates both source/destination decode tokens before resource adoption. Existing parent controlled move tests cover completion after relocation; no independent browser image-decode/pixel proof is claimed.
- New persisted selections read own data descriptors through the existing sanitizer and require matching kind/target/id; unknown selection targets and non-string preset names are excluded (`prototype/video-state.js:99–105`). This does not ensure IDs are unique.
- Preset selection is per kind, while preset replacement by name is globally shared with the pre-existing UI storage policy. This review does not label equal-name cross-kind replacement a new defect without a distinct-name-namespace requirement.
- No evidence here establishes immediate URL reclamation for a decoder that never settles. This review does not manufacture a production leak claim from an indefinitely pending mock; actual asynchronous token/resource acceptance remains separate.

Parent controls production corrections. Initial red artifacts remain immutable. No full overlay catalog, animation/reference transfer, all 26 mapping groups or complete Serato parity claim follows from this unit.

## Independent correction verification

After the parent corrected the helper, the owned collision regressions executed **3/3** in `docs/prototype/video-overlay-independent-corrected-results.json`, then **3/3** again in `video-overlay-independent-final-results.json` after explicitly adding the other-layer resource-retention assertion. Source SHA256: helper `802b7a12e155f6fb0973d641cb113b88d001da9a225fa2d0c61fd6f43994dae9`; mixer/state remain the exact initial hashes above. The original failing result was not overwritten.

- Shared-reference preset reload now refuses **before** clearing bytes or replacing metadata. The test asserts the complete state is unchanged and the shared resource is still present.
- Image reload preserves the selected existing reference rather than switching to its ID. In the actual collision fixture, a stays imageRef own/off, its old resource is cleared, another overlay's asset under a is untouched, and enabling a throws the explicit reimport error.
- Activation now requires exactly one matching target/id. The duplicate-kind collision refuses without changing either image or text selection.

The parent helper changes are at `prototype/video-overlay-midi.js:16–20` and `64–72` at this freeze. The test accepts correct behavior or explicit atomic safety refusals; it does not accept arbitrary exceptions or mutation-before-failure. I additionally executed the existing policy suite **10/10** and actual mixer relocation suite **5/5** against the corrected source, writing new `video-overlay-policy-independent-current-results.json` and `video-overlay-move-independent-current-results.json`. The latter includes disposal, identity collision, shared reference and pending decode completion after move. These are controlled tests with mocked Image.decode; no real decoded pixel, app event integration, physical MIDI or reference-equivalence acceptance follows.

No further defended source blocker was identified within this bounded three-file unit. Learning/registry integration was being changed by the parent and was not reviewed here. In particular, a source/controlled pass is not a browser acceptance claim.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
