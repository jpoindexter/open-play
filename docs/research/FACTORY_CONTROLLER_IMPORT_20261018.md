# Factory controller import — checkpoint 141

18 October 2026. Source baseline: `36e6e3a7605c688ddd0827fc8e974d2b7494f299`, plus this checkpoint. This advances the signed resource recovery in checkpoint140 into an actual local catalog/import/playback path. **Full Serato/controller parity is not established.**

| Evidence | Result | Limit |
|---|---|---|
| Reviewed source files processed | All197 definitions:182 MIDI,14 HID,1 audio | Not every historical controller or compiled legacy path |
| Semantic source trees reconstructed |197/197 exactly equal to the parser's normalized original tree | Not byte-for-byte XML, comments or formatting reproduction |
| Private catalogs |16 shards;88,926,831 bytes total; largest448,820 JSON value nodes | Raw/normalized vendor data stays ignored under `local-evidence/factory-catalog-141/` |
| Input adapters generated |5,223 assignments across135 definitions |62 definitions have no executable assignments; none fully translated |
| Authentic Hercules300MK2 profile |375 retained transport entries,56 assignments,309 unresolved items |374 control elements plus one SysEx entry; unresolved count is not unique missing physical controls |
| Actual browser batch workflow | Imported all197, retained through page reload and reauthenticated contents | Synthetic input identity, isolated origins8780/8781; no native or physical compatibility claim |
| Alternative provenance | Authored alternative retained under its own label; forged official claim rejected | Source authenticity is distinct from exact runtime behavior |
| Actual factory Hercules playback | Play/pause moved transport; recorded82,025 frames stereo44,100Hz; RMS0.1129058191/0.1129173630 | Authored tone, physical audio destinations muted; not reference DSP accuracy |
| Source tempo range | Imported14-bit reverse range lowered actual deck rate to0.9212403858 | No fresh physical slider test; prior physical acceptance belongs to frozen0.1.23 profile |
| Existing assignment preservation |55 of56 factory assignments added, complementary CC conflict left unchanged | No automatic replacement of existing user assignments |

## Implementation

`scripts/import_factory_controller_maps.py` processes explicit private source paths only after matching every file against the reviewed140 inventory. XML DTD/entities, unsafe source paths, size/depth/node overflow and nonstandard CC pair layouts fail closed. The adapter retains the complete root/native-device/supported-app metadata and every MIDI/HID/audio transport section. Transport children live once in `controls`; `profileControlsRange` identifies their original position in `sourceEnvelope`. Reconstruction is checked for every source. Nontransport metadata, initialization/finalization strings, conditions, output branches and unsupported actions remain data. No MIDI output, SysEx, vendor code or controller scripts are evaluated.

Supported direct inputs include explicit Play/Slip/Quantize/Vinyl toggles, a bounded set of named deck commands, normal relative browser scroll, normalized absolute mixer controls and standard14-bit CC pairs. A source-specified full-range reverse transform sets `invert`; arbitrary ranges and additional control/action options stay inactive. Compound actions and case/condition branches are retained without flattening.

Some factory actions omit their translation rule. For these named adapters, Open Play uses its existing independent action behavior. Their action names are listed in each profile's unresolved items. This is an explicit implementation policy, **not proof of the vendor's defaults, trigger rules, tapers, timing or exact DSP response**. Global device metadata/initialization is retained but does not establish the runtime mode. Full translation remains false for all197.

`prototype/controller-factory-digests.js` contains only197 raw-source/normalized-content digest pairs. The browser hashes the immutable semantic profile payload and checks both identities before granting **Official Serato**. Imported provenance/verification flags cannot grant that label. A known source hash with changed mappings or trees is rejected; unknown sources remain **User mapping** or **Alternative mapping — author/project**. Verified objects are frozen, and IndexedDB clones are authenticated again after reload. An exported authentic profile can be reimported and checked from its content. This is local provenance enforcement against untrusted catalog claims, not a substitute for securing the installed application or browser storage itself.

The catalog accepts multiple JSON files, persists each file atomically and reports rejected files alongside successful imports. Applying a selected profile requires a connected input identity. Existing mappings take precedence; conflicts include both halves of14-bit pairs. No hardware is auto-bound by a similar product name. Every applied assignment retains its source label. The existing independent272-assignment Hercules preset remains an **Alternative mapping — Open Play Hercules preset**.

## Executed checks

Three authored-XML tests cover conditional/compound isolation, full section retention, standard pair/reverse range acceptance, unsupported range rejection, DTD rejection and content-digest sensitivity. `node --experimental-default-type=module scripts/check_factory_catalog.mjs local-evidence/factory-catalog-141` parsed/authenticated all16 actual private catalogs and197 profiles; it rejected a modified known source, refused an unknown official claim and preserved a complementary-CC conflict.

`prototype/factory-catalog-harness.html` ran through the actual app's multi-file chooser change path, IndexedDB, page reload, MIDI input connection, explicit profile application, transport and audio recorder. An alternative file and an invalid file in one batch produced an honest partial-success result. Receipts: `docs/prototype/factory-catalog-141-results.json` and `factory-catalog-141.png`. The initial restored run failed because its assertion rejected a legitimate Shift-channel5 level assignment when checking a channel2 conflict. That test defect was narrowed to channel2; it is retained in `factory-catalog-141-initial-failure.json`. The corrected workflow then ran on a fresh isolated origin. No unrelated FX/physical matrices were repeated.

Reproduce with the private files available:

```sh
python3 scripts/test_factory_controller_maps.py
node --experimental-default-type=module scripts/check_factory_catalog.mjs local-evidence/factory-catalog-141
python3 scripts/serve_factory_catalog_check.py --catalog-dir local-evidence/factory-catalog-141 --port 8780
```

Open the printed harness on a fresh isolated origin, run import, reload, then run the restored workflow. The temporary server serves only the explicit catalog-file allowlist and normal review assets, never the evidence directory or repository metadata. Stop it afterward. Rebuilding private catalogs requires a new output directory, new registry path and new report path; the CLI refuses overwriting these outputs. The registry output is metadata for review, not independently trusted merely because the CLI generated it.

## Remaining work and preservation

Next: add independently implemented condition/modifier/pad-state dispatch and missing translation/range semantics, with focused input traces per new contract; preserve HID, lighting/output and initialization data until their actual adapters exist. Reconcile aliases/compiled legacy definitions with the195-card official hardware inventory;197 is a resource-definition count, not an all-controller support claim. On Jason's return, compare the imported factory profile in a separate test profile against the physical controller, including Sync, pads and jogs. No new capture windows while he is away.

Frozen desktop0.1.23, its ASAR,272-map user profile and confirmed right-tempo inversion are unchanged. No native repackaging, public release, license/entitlement modification or vendor implementation redistribution. The untouched original20,996-byte prompt remains the byte-exact final suffix of the Claude handoff. The full independent Claude audit is still unlaunched.

The original goal remains full independent visual/functional parity across110 feature groups/522 requirements/9 beta deltas/26 release checks, all55 extended FX and actual Stems/keylock. Keylocked Stems activation still needs the browser replacement API/engine/pad integration after checkpoint138's serial same-instance proof. Source recovery and successful imported Play do not close that audio gap or any full-parity flag.
