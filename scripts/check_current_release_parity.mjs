import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// Reconciles evidence and release obligations. It never runs or grades audio/hardware.
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const registry=json('docs/delivery/feature-registry.json');
const byId=new Map(registry.features.map(f=>[f.id,f]));
const audit=json('docs/research/CURRENT_PARITY_AUDIT_20261017.json');
const beta=json('docs/research/CURRENT_VERSION_DELTAS_20261017.json');
const reference=json('docs/research/REA_CURRENT_REFERENCE_PLIST_20261017.json');
const observation=json('docs/prototype/current-feature-check-native-observation.json');
const candidate=json('docs/prototype/candidate-hashes.json');
const keyShiftCandidate=json('docs/prototype/midi-keyshift-candidate.json');
const videoMIDICandidate=json('docs/prototype/video-midi-candidate.json');
const overlayDraft=json('docs/prototype/video-overlay-midi-draft-candidate.json');
const overlayMatrix=json('docs/prototype/video-overlay-midi-matrix-candidate.json');
const renderClock=json('docs/prototype/render-clock-native-candidate.json');
for(const item of [...renderClock.runtime_source_hashes,...renderClock.native_evidence,...renderClock.controlled_evidence,...renderClock.independent_evidence,...renderClock.review_files,renderClock.pre_run_manifest])assert.equal(hash(item.path),item.sha256,'Render-clock identity drift '+item.path);
assert.equal(renderClock.full_parity_verified,false);assert.equal(renderClock.allCriteriaPassed,false);assert.equal(renderClock.counts.case_passes,5);assert.equal(renderClock.counts.case_unaccepted,5);
const referenceRecheck=json('docs/research/REA_PARITY_RECHECK_IDENTITY_20261017.json');
const source='https://serato.com/dj/pro/downloads';

// Each entry is an independently proposed regression test derived from the current
// public release page. Recent-update entries do not claim introduction in 4.0.10.
// These provisional checks supplement, and do not inflate, the canonical 522.
const specification=[
 ['REL-01','4.0.10 feature','HW-001,HW-005,HW-004,STM-005','Hercules T10','With the named device, exercise motorized platters, stem controls, Slip Release and display/LED feedback; preserve unavailable-device status.'],
 ['REL-02','4.0.10 drivers','SYS-004,AUD-001,AUD-004','Tahoe driver compatibility','For each listed device on macOS Tahoe, test driver availability, connection, audio routes and reconnect; do not bundle proprietary drivers as open-source code.'],
 ['REL-03','4.0.10 regression','SYS-009,LIB-003','Spotify playlist completeness','With authorized provider access, traverse a playlist exceeding one API page; check IDs, ordering, duplicates, expiry and complete enumeration.'],
 ['REL-04','4.0.10 regression','LIB-008,LIB-016,MIX-002','History with crossfader disabled','Disable the crossfader, audition a channel, expose it to the mix, then restart; compare played/unplayed history with the reference.'],
 ['REL-05','4.0.10 regression','HW-002,DEK-007','MIDI Key Shift','Learn a controller for each deck Key Shift, move it in both directions, measure semitones and independence from tempo, then save/reload the mapping.'],
 ['REL-06','4.0.10 regression','DEK-018,HW-004','XDJ-AZ sync-load BPM display','With Maintain Sync on Track Load enabled, replace a track and compare deck BPM, device BPM and audio rate before and after takeover.'],
 ['REL-07','4.0.10 regression','AUD-004,HW-004,HW-005','XDJ-AZ connection completeness','On the documented Windows 11 configuration, connect/reconnect and verify all interfaces, display and button feedback; a macOS result cannot pass this case.'],
 ['REL-08','4.0.10 regression','LIB-002,HW-004,HW-010','SYSTEM ONE computer changeover artwork','Switch the device between two authorized computers with loaded media; confirm stale artwork is cleared and the new owner alone updates the display.'],
 ['REL-09','4.0.10 regression','ANA-001,HW-004','SYSTEM ONE waveform continuity','With the named device and owned long fixtures, compare complete overview/detail waveforms during scrolling and transport changes.'],
 ['REL-10','4.0.10 regression','LIB-003,HW-004','SYSTEM ONE selection centering','Toggle Center on Library Selection and navigate enough rows to scroll; confirm device and software keep the intended row centered.'],
 ['REL-11','4.0.10 regression','SYS-009,LIB-003,HW-004','SYSTEM ONE streaming selection stability','Populate a provider catalog in multiple pages while selecting a track; confirm asynchronous insertions preserve the selected identity.'],
 ['REL-12','4.0.10 regression','DEK-004,HW-004','SEVENTY-TWO MKII auto-loop feedback','Enter Auto Loop, trigger each supported size, and compare pad colors/state with the reference during loop changes.'],
 ['REL-13','4.0.10 regression','DEK-003,HW-004,AUD-004','DJM-S11 hot-cue reconnect feedback','Set owned-fixture cues, reconnect the mixer, then verify every pad displays the current cue state without stale lights.'],
 ['REL-14','4.0.10 regression','DEK-004,HW-003','DDJ-FLX6 and DDJ-400 long-press loop','For both named devices, hold the four-beat loop action across a beat boundary; measure unchanged loop start, length, release and retrigger.'],
 ['REL-15','4.0.10 regression','DEK-003,ANA-001,HW-004,HW-006','CDJ-3000 cue overview','Create cues at known fixture samples; compare hardware overview markers with software and audible recall at zoom/track changes.'],
 ['REL-16','4.0.10 regression','HW-004,HW-005','PRIME 4 deck color','Change deck color/state and verify the named hardware LEDs update for the correct deck after reconnect.'],
 ['REL-17','4.0.10 regression','SYS-004,AUD-001','Reloop ELITE driver prompt','On a disposable supported driver-missing setup, connect the device; distinguish install guidance from a generic connection failure and retry safely.'],
 ['REL-18','4.0.10 regression','SYS-004,AUD-001','Beatmix 2 and Beatmix 4 Windows prompt','On Windows with each supported device, distinguish actual driver requirements from an unnecessary install prompt; verify connection remains usable.'],
 ['REL-19','4.0.10 regression','MIX-001,ANA-001,HW-004','AlphaTheta/Pioneer waveform fader interaction','During playback on named display devices, raise the channel fader; check waveform position/continuity and audible output independently.'],
 ['REL-20','recent update on current page','HW-001,HW-004,HW-005,DEK-005','XDJ-AN','With the device, exercise touch library navigation, pad modes, Beat Jump and available independent functionality; document each missing protocol.'],
 ['REL-21','recent update on current page','HW-001,HW-004,HW-005,FX-004','Party Mix III','Test both decks, eight-pad modes, stems, Fade FX and beat-synchronized lights with owned fixtures.'],
 ['REL-22','recent update on current page','HW-001,HW-003,HW-005,FX-004','MixTrack Go','Test both channels, all five pad modes, stem actions and Fade FX through the physical controls and audio routes.'],
 ['REL-23','recent update on current page','HW-006,HW-004','CDJ-1500X','Identify the actual interfaces, then exercise connection, decks, browse/load, jog, feedback and reconnect with the named media player.'],
 ['REL-24','recent update on current page','HW-001,HW-003,HW-005','Inpulse 200 MK3','Use the named device rather than extrapolating the Inpulse 300 MK2 test; capture controls, audio routing, feedback and reconnect.'],
 ['REL-25','recent update on current page','HW-001,HW-007,HW-008,AUD-003','DJM-250MK2 / DJM-750MK2 / DJM-450','For each mixer, verify routing, inputs, calibration, internal/relative/absolute/THRU transitions and changeover using the required physical equipment.'],
 ['REL-26','recent update on current page','SYS-009,LIB-009,LIB-011','Beatsource migration','With authorized disposable provider/library data, migrate to Beatport and verify retained metadata, identity, missing-media handling and rollback.'],
];
const drivers=['DDJ-1000SRT','DDJ-SR2','DDJ-SX3','DJM-250MK2','DJM-450','DJM-750MK2','DJM-900NXS2','DJM-S3','DJM-S5','DJM-S7','DJM-S11','XDJ-XZ'];
const checks=specification.map(([id,section,groups,subject,acceptance])=>{
 const ids=groups.split(',');ids.forEach(id=>assert(byId.has(id),`Unknown group ${id}`));
 return {id,section,subject,source,existing_feature_groups:ids,proposed_independent_acceptance:acceptance,
  status:['REL-07','REL-18'].includes(id)?'WINDOWS_ONLY_REFERENCE_NOT_MACOS_PARITY_BLOCKER':id==='REL-05'?'BROWSER_SUBSET_EXECUTED_NATIVE015_TARGET_STILL_MISSING':'NOT_EXECUTED_FOR_THIS_RELEASE_CASE',
  macos_parity_obligation:!['REL-07','REL-18'].includes(id),
  reference_runtime_verified:false,open_play_full_parity_verified:false,
  requirement_namespace:'PROVISIONAL_RELEASE_CHECK_NOT_MERGED_INTO_522',
  model_routing:ids.map(id=>({feature_id:id,routing:byId.get(id).routing})),
  ...(id==='REL-02'?{named_driver_devices:drivers}:{}),
  ...(id==='REL-05'?{current_evidence:['docs/prototype/current-feature-check-native-observation.json','docs/prototype/screenshots/parity-current-midi-targets-0.1.5.png'],source_evidence:[{path:'docs/prototype/midi-keyshift-candidate.json',line:1},{path:'docs/prototype/MIDI_KEYSHIFT_FUNCTIONAL_REVIEW.md',line:1}],browser_subset_evidence:['docs/prototype/midi-keyshift-browser-final-initial-results.json','docs/prototype/midi-keyshift-browser-restored-results.json']}:{})};
});
assert.equal(checks.length,26); assert.equal(new Set(checks.map(c=>c.id)).size,26);
assert.equal(checks.filter(c=>c.section==='4.0.10 regression').length,17);
assert.equal(drivers.length,12); assert.equal(beta.delta_count,9); assert.equal(beta.deltas.length,9);
assert.equal(audit.features.length,110);assert.equal(registry.features.length,110);
assert.equal(audit.features.reduce((n,f)=>n+f.requirement_count,0),522);
assert(audit.features.every(f=>f.full_feature_parity_verified===false));
const protoFiles=Object.keys(candidate.files).filter(p=>p.startsWith('prototype/'));
assert.equal(protoFiles.length,200);
const changed=protoFiles.filter(p=>hash(p)!==candidate.files[p]);
assert.deepEqual([...changed].sort(),[...overlayMatrix.existing_baseline_production_files_changed].sort(),'Unrecorded source drift from the current scoped overlay matrix');
for(const item of [...overlayMatrix.source_hashes,...overlayMatrix.runtime_source_hashes])assert.equal(hash(item.path),item.sha256,'Current overlay matrix source drift '+item.path);
for(const item of overlayDraft.source_hashes){const bytes=execFileSync('git',['show',overlayMatrix.previous_browser_commit+':'+item.path],{cwd:root});assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256,'Historical overlay draft drift '+item.path);}
for(const item of [...overlayMatrix.browser_evidence,...overlayMatrix.controlled_evidence,...overlayMatrix.independent_artifact_evidence,...overlayMatrix.review_files,overlayMatrix.browser_control_smoke])assert.equal(hash(item.path),item.sha256,'Current overlay evidence drift '+item.path);
assert.equal(overlayMatrix.full_parity_verified,false);assert.equal(overlayMatrix.all_overlay_workflows_accepted,false);assert.equal(overlayMatrix.counts.overlay_target_witnesses,28);
const matrixInitial=json(overlayMatrix.browser_evidence[0].path),matrixReload=json(overlayMatrix.browser_evidence[1].path);
assert(matrixInitial.completed&&matrixReload.completed);assert.equal(matrixInitial.checks.length,21);assert.equal(matrixReload.checks.length,5);assert.deepEqual(matrixInitial.sourceAfter,matrixReload.sourceBefore);
// This checks retained report identities and declared outcomes, not runtime replay.
assert.deepEqual(matrixInitial.savedMappings,matrixReload.checks[0].evidence.mappings);assert.equal(matrixInitial.savedMappings.length,29);assert.equal(new Set(matrixInitial.executedTargets).size,28);
for(const item of videoMIDICandidate.source_hashes){const bytes=execFileSync('git',['show',overlayDraft.previous_browser_commit+':'+item.path],{cwd:root});assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256,'Historical core Video candidate drift '+item.path);}
for(const p of videoMIDICandidate.new_production_files)assert(!(p in candidate.files),'New production module was already in native baseline');
// Prior audio evidence belongs to its historical candidate. Do not silently
// demand current identity or transfer that acceptance to newer dispatcher bytes.
for(const item of keyShiftCandidate.source_hashes) {
 const original=execFileSync('git',['show',videoMIDICandidate.previous_browser_commit+':'+item.path],{cwd:root});
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),item.sha256,'Prior Key Shift candidate history drift '+item.path);
}
for(const item of [...keyShiftCandidate.browser_evidence,...videoMIDICandidate.browser_evidence,...overlayDraft.browser_evidence,...overlayDraft.controlled_evidence])assert.equal(hash(item.path),item.sha256,'Retained browser evidence drift '+item.path);
for(const item of observation.evidence_files)assert.equal(hash(item.path),item.sha256,`Observation bytes changed: ${item.path}`);
const asar='local-evidence/desktop-builds/0.1.5/Open Play Test-darwin-arm64/Open Play Test.app/Contents/Resources/app.asar';
assert.equal(hash(asar),audit.desktop_ASAR_sha256,'Current desktop bundle differs from audited candidate');
const inputPaths=['docs/prototype/render-clock-native-candidate.json','docs/research/ENGINE_RENDER_CLOCK_NATIVE_EVIDENCE_REVIEW.md','docs/prototype/render-clock-native-initial-results.json','docs/prototype/video-overlay-midi-matrix-candidate.json','docs/prototype/VIDEO_OVERLAY_MIDI_MATRIX_REVIEW.md','docs/prototype/overlay-matrix-final-initial-results.json','docs/prototype/overlay-matrix-final-restored-results.json','docs/prototype/video-overlay-midi-draft-candidate.json','docs/research/REA_PARITY_RECHECK_IDENTITY_20261017.json','docs/research/CURRENT_PARITY_AUDIT_20261017.json','docs/research/CURRENT_VERSION_DELTAS_20261017.json','docs/research/REA_CURRENT_REFERENCE_PLIST_20261017.json','docs/prototype/current-feature-check-native-observation.json','docs/delivery/feature-registry.json','prototype/panels.js','prototype/midi.js','prototype/engine.js','prototype/app.js','docs/prototype/midi-keyshift-candidate.json','docs/prototype/MIDI_KEYSHIFT_FUNCTIONAL_REVIEW.md','docs/prototype/midi-keyshift-browser-final-initial-results.json','docs/prototype/midi-keyshift-browser-restored-results.json','docs/prototype/midi-keyshift-audio-independent-results.json','prototype/video-midi.js','prototype/video-controls.js','docs/prototype/video-midi-candidate.json','docs/prototype/VIDEO_MIDI_FUNCTIONAL_REVIEW.md','docs/prototype/video-midi-browser-final-results.json','docs/prototype/video-midi-browser-final-restored-results.json','docs/research/VIDEO_MIDI_SOURCE_REVIEW_20261017.md','docs/research/VIDEO_MIDI_FINAL_ARTIFACT_REVIEW_20261017.md'];
const report={generated_at:new Date().toISOString(),source_checked_at:json('docs/research/PARITY_RECHECK_SOURCES_20261017.json').checked_at,prior_native_source_checked_at:observation.source_checked_at,
 kind:'CURRENT_FEATURE_EVIDENCE_RECONCILIATION_NOT_ALL_FEATURE_RUNTIME_TEST',
 git_head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 outcome:'FULL_PARITY_NOT_ESTABLISHED',full_parity_verified:false,complete_latest_inventory:false,
 reference:{version:reference.bundle.version,executable_sha256:reference.executable_sha256,REA_plist_evidence:referenceRecheck.evidence_id,current_production_page:source,production_page_heading:'What’s New in 4.0.10',beta_separate:true},
 desktop:{version:'0.1.5',source_commit:candidate.candidateCommit,ASAR_sha256:hash(asar),frozen_prototype_files_checked:protoFiles.length,frozen_prototype_mismatches:changed},
 browser_keyshift_candidate:keyShiftCandidate,
 browser_video_midi_candidate:videoMIDICandidate,
 browser_overlay_midi_draft:overlayDraft,
 browser_overlay_midi_matrix:overlayMatrix,
 native_render_clock_diagnostic:renderClock,
 reference_identity_rechecked:referenceRecheck,
 scope:{canonical_features:110,canonical_requirements:522,beta_deltas_separate:9,provisional_current_release_checks:26,macos_release_checks:24,windows_only_reference_checks:2,release_regression_checks:17,release_checks_passed:0,not_exhaustive:true},
 actual_this_check:['Current source/candidate/evidence reconciliation only; no behavior rerun by this generator'],
 prior_reference_native_observations_this_date:['REA version/declaration inspection','Native main-window screenshots of both applications','Open Play0.1.5 MIDI target menu inspection'],
 current_overlay_browser_subset:{...overlayMatrix.counts,physical_or_native:false,full_REQ_516_verified:false,full_workflow_accepted:false,evidence:'docs/prototype/VIDEO_OVERLAY_MIDI_MATRIX_REVIEW.md'},
 previous_overlay_browser_subset:{initial_checks:9,actual_reload_checks:3,saved_mappings:7,whole_PNGs:12,physical_or_native:false,full_REQ_516_verified:false,full_workflow_accepted:false,evidence:'docs/prototype/VIDEO_OVERLAY_MIDI_FUNCTIONAL_REVIEW.md'},
 previous_core_browser_unit:{initial_checks:14,actual_reload_checks:4,saved_mappings:37,whole_PNGs:20,physical_or_native:false,full_REQ_516_verified:false,evidence:'docs/prototype/VIDEO_MIDI_FUNCTIONAL_REVIEW.md'},
 not_rerun:['Full audio/DSP suites','Earlier native persistence/keylock recordings','Any physical controller operation','Provider, DVS, CDJ or other-device acceptance'],
 new_defended_gap:{severity:'high',feature_groups:['HW-002','DEK-007'],observation:'The running 0.1.5 target menu has eight targets and no Key Shift or Video target. The packaged source list and dispatcher have no corresponding handler; newer browser source is separately implemented and tested.',boundary:'Direct UI/source absence in this candidate. Does not measure Serato MIDI Key Shift at runtime or prove all MIDI workflows are missing.',next:'Preserve the newer browser candidate/evidence; package and execute native mapping later while retaining0.1.5. Core Video targets now have bounded browser evidence; every28overlay target now has a defaultCC browser witness, while remaining commands, all encodings/compound/error paths, physical/native and full mapping/reference acceptance remain open.'},
 current_visual_result:'The inspected Vertical states still differ in mode/loop controls and the always-visible Open Play mixer; different dimensions/tracks prohibit pixel-identity or waveform-quality conclusions.',
 class_counts:Object.fromEntries([...new Set(audit.features.map(f=>f.classification))].map(k=>[k,audit.features.filter(f=>f.classification===k).length])),
 release_checks:checks,input_hashes:inputPaths.map(path=>({path,sha256:hash(path)})),
 constraints:{native_rewrite:false,public_release:false,reference_modified:false,original_prototype_files_modified:changed.length>0,claim_of_all_features_tested:false},
};
const out='docs/research/CURRENT_FEATURE_MATCH_20261017';
fs.writeFileSync(path.join(root,out+'.json'),JSON.stringify(report,null,2)+'\n');
const link=p=>`[${path.basename(p)}](../../${p})`;
const lines=[
 '# Current-feature match check — 17 October 2026','',
 '**Open Play 0.1.5 does not have established 1:1 parity with Serato DJ Pro.** This check preserves the 110-group / 522-requirement baseline, nine separate beta deltas, and adds 26 explicit release-page checks: 24 relevant to macOS and two Windows-only reference cases. These are not 26 new canonical requirements or passed implementations. The full current inventory remains unfinished.','',
 `REA freshly read installed version **${referenceRecheck.bundle.version}**, evidence \`${referenceRecheck.evidence_id}\`. Its plist permissions, custom URL scheme and stem extension are declarations, not runtime compatibility. The [official current download page](${source}) still identifies 4.0.10. The [5.0 beta](https://the-drop.serato.com/announcements/lucid-beatgrids-just-dropped-in-the-serato-dj-5-0-beta/) remains separately scoped and uninstalled.`, '',
 '## Native gap and newer browser implementation','',
 '**Key Shift cannot be selected in the unchanged0.1.5 desktop MIDI mapper.** Native MIDI → Target exposed eight options: Library browse, two play targets, two cue targets, Crossfader, Sampler 1 and FX depth. Video targets are also absent. The original packaged source confirms that bounded absence; the newer browser source now has four Key Shift targets. A real browser-knob mapping does not establish these other targets.', '',
 `Evidence: ${link('docs/prototype/current-feature-check-native-observation.json')}, ${link('docs/prototype/screenshots/parity-current-midi-targets-0.1.5.png')}, [preserved original comparison](../../docs/research/CURRENT_FEATURE_MATCH_20261017_NATIVE015.md). The official release-page Key Shift fix makes this a specific current-version obligation. Serato’s own MIDI behavior was not exercised in this check.`, '',
 'The newer browser source has actual four-deck Key Shift and saved-mapping audio evidence: [functional review](../../docs/prototype/MIDI_KEYSHIFT_FUNCTIONAL_REVIEW.md), eight initial plus three reload checks and eight complete recordings. The prior accepted core Video MIDI candidate changed four existing files relative to0.1.5 and added its router. The current overlay matrix changes seven existing files relative to0.1.5 and includes four new production modules. All28overlay targets have default7bitCC browser witnesses; all encodings/compound/error paths and full72target workflows remain unaccepted. The audio engine is unchanged. Key Shift recordings retain the preceding candidate identity. These browser results are not a new native or physical test and do not establish complete REL-05 equivalence.', '',
 'Core Video MIDI now has [functional review](../../docs/prototype/VIDEO_MIDI_FUNCTIONAL_REVIEW.md):14initial/4actual-reload browser checks,37saved mappings and20wholeGPU PNGs. Independent review corrected compound dispatch and held edges. The overlay source registers 28 additional targets and visible-control assignment. Prior scoped9/3 browser evidence retains its original checkpoint. The newer [overlay matrix](../../docs/prototype/VIDEO_OVERLAY_MIDI_MATRIX_REVIEW.md) executes21initial/5actualreload checks with29savedmaps and115wholePNGs, including all28defaultCC target witnesses and a non-first owner reopen regression. Three further editor/MIDI name/feedback/ownership defects were corrected. Other encodings/compound/error paths and full72target workflows remain open. Some core commands, physical/native transfer and full REQ-516 remain open.', '',
 '## New scheduled-clock engine diagnostic','',
 'A separate official Electron host executes the unchanged production engine/WASM and a new test-only clock observer. [Whole original review](../../docs/research/ENGINE_RENDER_CLOCK_NATIVE_EVIDENCE_REVIEW.md): valid full capture/calibration, 5/10 bounded cursor cases, all eleven pitch/control intervals pass. Five cases remain unaccepted solely due to seven nonunique marker probes. All 985,728 parameter values and four-channel PCM/7,701 rows were independently inspected. This does not explain or repair the older globally failed run, prove common-mode freedom or accept the main packaged app, physical/musical/compound/reference behavior. No production engine or native bundle changes.','',
 '## Executed observations and accounting: separate phases','',
 '- This recheck: official production download/manual/product/beta pages were opened and REA re-read installed Info.plist identity as4.0.10.213; no reference runtime comparison or repeated deep Ghidra import. See REA_PARITY_RECHECK_IDENTITY_20261017.json.',
 '- Earlier this date: screenshots of the installed reference and running Open Play 0.1.5; actual MIDI menu inspection, with no mapping or connection change. App restored to paused main view.',
 `- Of the200baseline production files, ${changed.length} current browser files differ and four new production modules are present, as recorded by the current scoped overlay matrix manifest. Earlier overlay/core/KeyShift sources are verified through their exact historical commits, not regraded as current runs. Current ASAR still matches the unchanged0.1.5 bundle. Source correspondence alone is not a feature test.`,
 '- This generator reconciles evidence for every canonical group and requirement; no runtime test or full-feature pass is awarded. Earlier physical, storage, FX, stem and keylock evidence retains its original scope.', '',
 '## Current release obligations','',
 'Each row inherits the existing per-feature Codex and Claude Code model/effort recommendations in the JSON companion. Recommendations are not a live model-catalog verification. No full release-case parity pass is awarded. REL-05 has newer browser subset evidence while its0.1.5 native target remains absent. REL-07 and REL-18 are Windows-only facts, outside the current macOS parity gate. Recent-update rows are not claimed to have debuted in 4.0.10.', '',
 '| Check | Feature groups | Subject | Proposed test |','|---|---|---|---|',
 ...checks.map(c=>`| ${c.id} | ${c.existing_feature_groups.join(', ')} | ${c.subject} | ${c.proposed_independent_acceptance} |`),'',
 `REL-02 includes these 12 named driver devices individually: ${drivers.join(', ')}. REL-07 and REL-18 remain separate Windows references, not missing macOS features. They become acceptance obligations only if Windows is explicitly added to the build scope.`, '',
 '## Remaining match gates','',
 `See the existing complete ${link('docs/research/CURRENT_PARITY_AUDIT_20261017.md')} for all 110 groups and all 522 requirement IDs in its JSON. Explicit backend gaps include providers, Link, Smart Sync phase/takeover, files/tags/interoperability, DVS/HID/CDJs, mic/aux and recording input/split/recovery. Exact FX response, stem quality, keylock return/composition, video outputs, controller feedback and long-session acceptance remain open.`, '',
 'The fresh main-view comparison still shows different mode/loop-control presentation and an always-visible mixer in Open Play absent from the inspected Serato state. Different viewport sizes, loaded tracks and play positions prevent pixel or waveform-quality comparison. Other layouts/settings remain untested.', '',
 'Done means exact-candidate, end-to-end comparison against reconciled current-reference behavior, including failures, compound actions, quality and required devices/services. Feature names, matching file hashes, a packaged wrapper and passing subsets cannot satisfy that criterion.', '',
 'Reproduce **accounting only**: `node scripts/audit_current_parity.mjs` followed by `node scripts/check_current_release_parity.mjs`. The second command requires the preserved local screenshot/AX evidence and 0.1.5 bundle. It does not control applications or rerun tests.','',
 'Skills applied: use, gap-analysis, dec-quality-testing, reverse-engineer-anything, adversarial-verify, claude-codex-handoff, verified-done family.',''];
fs.writeFileSync(path.join(root,out+'.md'),lines.join('\n'));
console.log(JSON.stringify({full_parity_verified:false,features:110,requirements:522,beta:9,release_checks:26,release_checks_passed:0,frozen_prototype_files_checked:protoFiles.length,outputs:[out+'.md',out+'.json']},null,2));
