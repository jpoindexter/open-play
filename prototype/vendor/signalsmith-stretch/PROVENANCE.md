# Signalsmith Stretch browser dependency

- Version: npm `signalsmith-stretch@1.3.2`.
- Publisher source: https://github.com/Signalsmith-Audio/signalsmith-stretch
- Exact release archive: https://registry.npmjs.org/signalsmith-stretch/-/signalsmith-stretch-1.3.2.tgz
- Archive SHA-256: `345e774c8d5f680bc0156d788ff0f3f08d47bd307a8a262a7c0d5d887b230909`.
- Vendored `SignalsmithStretch.mjs` SHA-256: `97530b11d5bc01015af4cde40d6aa55ff10c40aa1294ca4c8c5762027d517a46`.
- The ES module is copied byte-for-byte from that npm archive. It includes its WebAssembly DSP in the published JavaScript; no runtime CDN/model download, compilation, or native app is required.
- `package.json` and `UPSTREAM_README.md` are copied from the same archive. npm declares MIT but omits the license file. `LICENSE.txt` is copied from official repository commit `a670068d9aeb64913331d5cc29337b19a457a7df` (the fetched HEAD on 2026-10-16), https://raw.githubusercontent.com/Signalsmith-Audio/signalsmith-stretch/a670068d9aeb64913331d5cc29337b19a457a7df/LICENSE.txt . License SHA-256: `ee2ef82481ffb445ecdd4b3a4c1f82c0cddb2da8fe39d8e8dc384fffb3e7f06f`.
- Local adapter: `../../keylock-dsp.js` provides the clock and message-port interface expected by this version's published processor inside a dedicated Worker. The DSP algorithm is unmodified. The adapter's version-specific dependency on that processor interface is covered by signal tests. Re-run those tests when updating the dependency.

Reproduce: download the exact archive URL, verify its SHA-256, extract `package/SignalsmithStretch.mjs`, and verify the vendored module hash. Preserve this notice and the MIT license in redistribution.


## Original-stereo reference backend — checkpoint155

18 October2026. `SignalsmithStretch-open-play-reference-dsp.mjs` is a locally rebuilt MIT backend selected only for reserved eighteen-channel groups by the existing replacement worklet. Other configured geometries retain the published embedded factory. The two/ten-channel before/after actual-WASM fixture outputs match bit for bit; this is a bounded serial check, not all-setting or hardware acceptance.

- Stretch source: official commita670068d9aeb64913331d5cc29337b19a457a7df, header version1.3.2; Linear source: official commit146b26f91b48835d665fa0498d64d9617818d27a. Exact source URLs/hashes: `docs/research/keylock-reference-154-source-inputs.json`.
- Build: official Emscripten4.0.18/tagfae107463db4d20a276a27ede393048deaeebf76. Recipe: `scripts/build_reference_keylock_155.py`; exact commands/identities: `docs/prototype/reference-policy-155-build-results.json`. SDK/cache stay ignored; no external runtime download.
- `reference-policy.patch` anchors maximum-energy phase reference and aggregate mapped-frequency energy to channels0/1 for eighteen-channel groups, while retaining every channel's own prediction energy and the remaining synthesis. All other channel counts retain upstream reference policy. The matched rebuilt stock−2case changes active audio when the inactive bank is filled; the candidate removes that influence in the two recorded cases and retains identical control outputs.
- The generated loader has an AudioWorklet-specific environment correction in copied `pre.js`: AudioWorklet exposes neither window nor WorkerGlobalScope, so Emscripten's generic shell fallback otherwise tries d8 `os.system` during random-device initialization. Both stock/candidate loaders use the same correction. Complete decoded WASM is byte-identical before/after the loader correction. This supplies non-cryptographic audio random fallback only, inherited from upstream; it is not used for security.
- Vendored JS module100664bytes/SHA256`0512cae2a33873956026e64cb47854c1c677baf1beb1bc0242edfb9557987f21`; decoded WASM79354bytes/SHA256`1036c1f5deb845696bc6f8b4ef912c24a1444adede15dee96eb25ee8ce83c084`. Emscripten embeds a binary-encoded string in the single module. The source/header minimal patch and build recipe remain readable and reproducible.
- Retain both exact MIT notices in `SignalsmithStretch-open-play-reference-dsp.LICENSE.txt`, alongside the existing notices. This backend contains no Serato code/resources.

The rebuilt stock waveform is not byte-identical to the published package: the stock−2minimum ratio is0.917497656versus the published0.935193077, with the same first differing sample407437. Candidate controls match rebuilt stock controls, separating the reference-policy effect from rebuild drift. Actual browser observations and all limits: `docs/prototype/REFERENCE_POLICY_155_REVIEW.md`. This is authored-fixture continuity evidence, not vendor sonic parity, musical/model quality, full transport/resources/native/physical acceptance. The strict post-mix bit-zero mute flag remains false for residues up to8.23e−23; no threshold or PCM correction was applied.
