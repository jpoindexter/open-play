# Independent marker information and Cursor32 pre-execution review

17 October 2026. **Go to collect one NEW native diagnostic with the separately identified 32 ms fixture; no new native case is accepted by this review.** The ideal-output contrast is reproducible, the new fixture materially improves the declared controlled grid's discrimination, and the new harness preserves the reviewed capture/calibration/return gates and complete exports. Actual stretcher behavior remains a required measurement. A passing 400 ms marker fit still does not establish the source position of its first samples.

This reviewer used read-only source/results plus NEW controlled scripts/results. No shared browser, native host, device, production/harness, original raw/report, old analyzer or Git state was changed. The existing native results remain separately **zero accepted** for the globally invalid original and **five of ten** for the valid-clock 73 ms run.

## Reproduced old-marker diagnostic

Read `scripts/inspect_cursor_marker_ambiguity.mjs` and its original `docs/prototype/cursor-marker-ideal-discrimination-results.json` (SHA256 `7bc30c1e1ae2239deb59ca39fafea55114650635691d34cd41c424926ee79ac5`). Independently executed the script into NEW `docs/prototype/cursor-marker-ideal-independent-rerun-results.json`: all fields reproduce exactly except the run date.

All **33** recorded planned calibration/case probe coordinates are tested at three fixed carrier phases, giving **99** ideal probes: **87 accepted, 12 unconfident, zero confident-wrong**. Maximum ideal position error is approximately **0.0890 ms**; minimum ideal uniqueness margin is **.0150261**, below the unchanged .04 threshold. This is conditional perfect-output discrimination, not evidence the native recording actually has the declared source position (`scripts/inspect_cursor_marker_ambiguity.mjs:12`–`:16`). The observed RMS arrays used for the diagnostic come from the immutable native report whose whole raw/analyzers were independently checked in the prior review.

Of the seven native-unconfident coordinates, four are unconfident at **all three** ideal phases:

| Native coordinate | Ideal margin range |
| --- | ---: |
| same / throw, offset 0 | .0183851–.0184704 |
| same / throw, offset .05 s | .0150261–.0151104 |
| different / forward, offset .05 s | .0347915–.0348977 |
| different / throw, offset .05 s | .0392227–.0392880 |

The other three—same/backward 0, same/quick 0 and different/throw 0—pass at all three ideal phases. They are first-release-probe coordinates. That localizes the observed/ideal contrast; it **does not establish release as the sole cause**, establish wrong actual position, or exclude steady stretcher/envelope/phase/calibration differences. The parent declared plan preserves exactly this boundary.

## Controlled new-fixture evidence

The new `prototype/keylock-cursor32-analysis.js` body, starting at exported criteria, is byte-identical to the old analyzer after substituting **only `/.032` → `/.073`**; introductory comments separately identify the new fixture. Seed, amplitude, smooth interpolation, carriers, global coarse/refined search, competitor exclusion, confidence and accepted-error tests are unchanged. There is no new expected-position prior.

Original global fitting searches the entire eligible source before the desired position is used for acceptance (`prototype/keylock-cursor-analysis.js:18`–`:36`). The new oracle preserves that body. NEW `scripts/test_cursor_marker_information_independent.mjs` additionally holds actual synthetic data fixed while moving the caller's claimed desired position by 180 ms: peaks, scores, competitors, margins and observed arrays remain identical; only the final error/acceptance changes. All three wrong claims reject. This executes the non-prior property rather than inferring it from names.

The grid contains regular positions **0, .025, …, 15.55 s**, plus exact eligible endpoint **15.568 s**: **624 positions ×three phases =1,872** queries (`scripts/test_cursor_marker_grid.mjs:4`–`:9`). All per-query outcomes are retained, including failures. The old 73 ms control grid retains **361 unaccepted** queries, minimum margin .012822; its additional wrong-180-ms assertion also fails due to deficient confidence. Zero confident-wrong grid probes are reported. This is an information rejection, not proof the old oracle uses the desired answer or that old native playback is wrong.

Independently reran the full new grid into NEW `docs/prototype/cursor-marker-32ms-grid-independent-results.json`: **1,872/1,872 accepted**, minimum margin **.10903145144401405**, maximum absolute error approximately **.25 ms**. The full result equals the parent's new-grid result except date. All four accompanying tests pass, including wrong-marker, flat/periodic/silent and incomplete-interval rejection.

Independently executed `scripts/test_cursor32_marker_rejections.mjs` into NEW `docs/prototype/cursor32-marker-rejections-independent-results.json`: **42/42**. These comprise thirty ±180 ms marker shifts across five positions/three phases, plus twelve flat/periodic/silent/deterministic-noise cases. The test requires shifted markers to be globally found near their actual shifted position, not merely rejected for being silent.

The independent information script also tests **18** separately declared off-grid coordinates/extra phases, all accepted, with minimum margin approximately **.11947**. Expanded result is **4/4** in NEW `docs/prototype/cursor-marker-information-independent-final-results.json`; the earlier **3/3** result remains preserved. These extra points challenge grid/phase coupling but do not convert finite samples into continuous-domain or all-carrier-phase coverage. The 32 ms period is an explicitly new stimulus selected after observing poor 73 ms information; the old failures remain intact and the native outcome must be interpreted under its own declared cohort.

## Executed first-sample limitation

One additional controlled illustration uses source position +180 ms for the **first 15 ms**, then the correct position for the remainder of the unchanged 400 ms marker window. The new oracle nevertheless returns a confident fit at **2.39975 s** against desired 2.4 s, score **.9950750**, margin **.1151451**, error **−.25 ms**.

This is not an observed product defect or a claim that such an initial error occurred in native audio. It demonstrates a real measurement limit: **a passing 400 ms interval fit can coexist with different source content in its first 15 ms**. The richer fixture does not shorten the window or prove first-sample/instantaneous cursor correctness. The native plan/harness correctly calls it a 400 ms fitted marker interval, keeps separate pitch/gap predicates and does not claim physical latency. No threshold was changed to produce this illustration.

## New harness and output ownership

Compared the new harness against the frozen scheduled-clock harness. Differences are the new analyzer import/runtime identity, cohort revision/scope, new harness identity and unique output filenames. Transport/case generation, runtime-sample-rate fixture construction (controlled checks use 44,100 Hz), left 440 Hz/right 660 Hz source carriers, +12/rate1.08, actual production engine/WASM, steady calibration, independent stereo 307 Hz control, physical mute, deadline, actual parameter snapshots and complete raw export are preserved.

Source references in `prototype/keylock-engine-cursor32-harness.js`:

- New fixture/oracle import and runtime source entries: `:3`, `:14`; actual waveform construction uses that imported fixture.
- Unchanged absolute parameter plan/schedule/arm guard: `:89`–`:94`.
- Original strict gate plus new parameter gate: `:128`; no interval interpretation before it: `:48`, `:138`.
- Calibration required for case acceptance, and `completed` distinct from `allCriteriaPassed`: `:60`–`:68`, `:145`–`:146`.
- Every original row, actual parameter bytes/lengths and four-channel PCM retained: `:131`–`:132`, `:147`–`:154`.

Initial copied download defaults still named the older render-clock cohort. This reviewer flagged misleading/collision-prone output labels. The parent corrected test-only defaults to **`keylock-engine-cursor32-complete.f32`** and **`keylock-engine-cursor32-results.json`** (`:151`, `:154`), and intends explicit unique native Save names. No old original was overwritten. The corrected harness retains the same export statements otherwise; actual browser downloads/native Saves for this new cohort remain unexecuted at this review freeze.

The separate host selects the new HTML, port **18787**, separate partition/name and the existing sandboxed official Electron path; permission/navigation restrictions are unchanged from the earlier diagnostic host. This is not another host-security audit or main-product package acceptance. Old analyzer `aadf86b0…`, old native harness `5db1b8d…`, production engine and scheduled observer are preserved.

## Frozen pre-run identities

| File | SHA256 |
| --- | --- |
| `prototype/keylock-cursor32-analysis.js` | `f71c04236897eff8025a36992000681feb4d81ccf957d09a898a243b695a1ae1` |
| `prototype/keylock-engine-cursor32-harness.js` | `4adfbe6f7ef22819e955a20c8641be4d101c50ea7ce9c20d8ef79761530b03a4` |
| New harness HTML | `45ccfe5bcddb696703223acad66d1226d14dc3dfb9097233fd8b27ee3a027dc3` |
| `scripts/run_native_cursor32_harness.cjs` | `4b34cd0882c03ef88fbbdca1f11f815104e641cbc22eb2e9ba82ea6e051661cb` |
| Independent full-grid result | `b37a9b366b0774e922a3024387722b8c7f57f56d39fe89360e00b26bfedcb992` |
| Independent 42-case rejection result | `a36211ac0af43c313126862dcaae36939eb0f93d50ad9df0b501db1ae8deede9` |
| Independent four-case information result | `3c0bf4a047eb7bfefc7c1fc25bcc106e213e3debda8cac6a82fd6c5e0c2bad52` |

**No remaining material pre-run blocker found.** The new native capture still must independently establish full clock integrity and actual steady/transient stretcher response. Faster envelope modulation may smear differently in Signalsmith; ideal evidence cannot pre-accept it. Preserve every native case/probe/row/sample and new source identity, and leave confident-wrong, unconfident, pitch/gap and clock failures separately classified. No rerun of identical stimuli merely to get green, no expected-position-conditioned oracle, no regrading of older runs and no main-product/music/hardware/reference/full-parity inference is warranted.

Skills applied: adversarial-verify, dec-quality-testing, dec-software-principles.
