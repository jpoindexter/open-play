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
