// Optional current-source test. Existing app bundles, profiles and defaults stay intact.
import {packager} from '@electron/packager';
import {assertBuildRetention} from './build-retention.mjs';
import {mkdtemp,mkdir,readFile,writeFile,unlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const git=args=>execFileSync('git',args,{cwd:root,maxBuffer:150*1024*1024});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceCommit=git(['rev-parse','HEAD']).toString().trim();
const get=file=>git(['show',`${sourceCommit}:${file}`]);
const version='0.1.130',name='Open Play Playback Test',port=18775,bundle='org.openplay.dj.playback.localtest';
const profile='Open Play Playback Test',partition='persist:open-play-playback-test';
await assertBuildRetention(path.join(root,'local-evidence/desktop-builds'),name);
const stage=await mkdtemp(path.join(tmpdir(),'open-play-playback-'));
try{
await mkdir(path.join(stage,'assets'));
const archive=stage+'.tar';
try{
  git(['archive','--output',archive,sourceCommit,'--','prototype','docs','handoffs','README.md','FULL_BUILD_PLAN.md','PROJECT_PROMPT.md']);
  execFileSync('tar',['-xf',archive,'-C',path.join(stage,'assets')]);
}finally{await unlink(archive).catch(()=>{});}
const writes=[];
async function put(file,data){const target=path.join(stage,file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data);writes.push({file,bytes:Buffer.byteLength(data),sha256:sha(data)});}
function change(source,oldValue,newValue){if(source.split(oldValue).length!==2)throw Error('Expected one host substitution: '+oldValue);return source.replace(oldValue,newValue);}
let main=get('desktop/main.cjs').toString();
main=change(main,"app.setName('Open Play Test');",`app.setName(${JSON.stringify(name)});\napp.setPath('userData',path.join(app.getPath('appData'),${JSON.stringify(profile)}));`);
main=change(main,'Open Play Test ${app.getVersion()} — MIDI controls test','Open Play Playback Test ${app.getVersion()} — controller mixing test');
main=change(main,'createAssetServer({root:assets})',`createAssetServer({root:assets,port:${port}})`);
main=change(main,'persist:open-play-test',partition);
main=change(main,"window.loadURL(host.origin+'/prototype/');","window.loadURL(host.origin+'/prototype/workspace-preview.html');");
const inlineScripts=file=>[...get(file).toString().matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
if(inlineScripts('prototype/workspace-preview.html').some(script=>!inlineScripts('prototype/index.html').includes(script)))throw Error('Workspace bootstrap must match the existing server CSP hashes.');
main=change(main,'current browser controls source dd068e4, approved baseline f8b0abf; prior0.1.5 retained.',`current browser source ${sourceCommit.slice(0,7)}, original local-test approval f8b0abf; current app/default launcher preserved; superseded generated builds removed at user request. Separate profile and port ${port}. Playback and independent Hercules starter MIDI controls. Stable separate playback-test profile. Full controller acceptance and Serato parity remain open. No public release.`);
main=change(main,"const {createAssetServer}=require('./server.cjs');","const {createAssetServer}=require('./server.cjs');\nconst {openPlaybackCheck,openAutoGainCheck,openRelativeTempoCheck,openGUITempoCheck,openSimpleControllerCheck,openCoreOwnershipCheck}=require('./playback-check-window.cjs');");
main=change(main,"{label:'Window',submenu:","{label:'Checks',submenu:[{label:'Rapid Sync and Play',click:()=>openPlaybackCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Measured Auto Gain',click:()=>openAutoGainCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Relative Controller Tempo',click:()=>openRelativeTempoCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'GUI Tempo after Sync',click:()=>openGUITempoCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Simple Sync Controller',click:()=>openSimpleControllerCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Core transport ownership',click:()=>openCoreOwnershipCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Device permission decisions',click:()=>dialog.showMessageBox(window,{type:'info',title:'Local permission decisions',message:'Last80 device permission decisions',detail:JSON.stringify(permissionDecisions,null,2)})}]},{label:'Window',submenu:");
await put('main.cjs',main);await put('server.cjs',get('desktop/server.cjs'));await put('playback-check-window.cjs',get('desktop/playback-check-window.cjs'));
await put('menu-bar.cjs',get('desktop/menu-bar.cjs'));
for(const file of ['menuTemplate.png','menuTemplate@2x.png','open-play.icns'])await put('assets/'+file,get('desktop/assets/'+file));
const manifest=JSON.parse(get('desktop/package.json'));
Object.assign(manifest,{name:'open-play-playback-local-test',productName:name,version,description:'Optional current-source desktop test; full parity unverified'});delete manifest.scripts;
await put('package.json',JSON.stringify(manifest,null,2)+'\n');
// Own generated diagnostic WAVs only. No user audio/raw evidence is archived.
const fixtureManifest=JSON.parse(get('docs/prototype/auto-gain-fixture-reference.json'));
for(const fixture of fixtureManifest.fixtures){
  if(!['A','B','silence','mono'].includes(fixture.name))throw Error('Unexpected diagnostic fixture.');
  const bytes=await readFile(path.join(root,'local-evidence/auto-gain/fixtures',fixture.name+'.wav'));
  if(sha(bytes)!==fixture.wavSHA256)throw Error('Diagnostic WAV does not match its independent reference.');
  fixture.url='/prototype/test-fixtures/auto-gain/'+fixture.name+'.wav';
  await put('assets'+fixture.url,bytes);
}
await put('assets/docs/prototype/auto-gain-fixture-reference.json',JSON.stringify(fixtureManifest,null,2)+'\n');
// The archived workspace guide describes the previous installed candidate. Generate
// only this package's identity/instructions; keep prototype source byte-for-byte.
await put('assets/docs/prototype/TRY_CURRENT_DESKTOP.md',`# Core desktop test ${version}

Queued Auto Loop requests now yield to newer transport ownership, and canceled preparations cannot publish loop metadata. Successful owned requests still carry legitimate queued input. Four directly affected source checks and one isolated queued Auto Loop native check cover this repair; no broad rerun. The existing cold loop-pad checker is reused; its original Beat Jump button remains.

Ordinary autosave now checks that its previously read durable session is still current before writing, using the same ownership guard as explicit recovery. A stale window preserves the newer or deleted record, pauses saving and requests reopening. Source and a real two-tab crate/save/reload workflow are recorded; this is not atomic concurrent-edit support. Product audio/transport code is unchanged from127. The isolated Core transport ownership window adds one cold Beat Jump/newer saved-loop check using the real pitch Worker with its first completed result held before engine continuation. It asserts physical mute, newer transport ownership, retained sibling controls/ready previews and stopped cleanup; no musical/hardware acceptance is implied.

Pending looped Beat Jump now yields to a newer saved-loop recall before its follow-up seek. One focused actual-engine/app-handler regression reproduces the old cancellation, retains the newer loop after repair and accepts a fresh Beat Jump afterward. Controlled Worker/graph evidence is not native race, DSP, music or controller acceptance. Prior graphite shared controls, independent deck tool rails, optional filters, layouts and live waveform previews remain included. No broad test rerun or public-beta clearance.

CORE-FIX-60: bounded, memory-only recent Play-command diagnostics are available in Settings → Advanced → System diagnostics and its existing export. This is instrumentation, not a startup repair; preserve the next actual event context before attributing a cause.

Jog release during pending grouped Sync now restores retained nominal tempo and rebases captured raw clocks before a delayed handoff. One focused controlled regression covers rejection and success; native generated-graph/changed-path and listening acceptance remain separate. GUI actual-pitch faders and direct headerH/Vshortcut from105remain included; all normal controls/layouts/library previews are retained. No speculative pop-causality claim.\n\nThe Open Play app icon and macOS menu-bar shortcut menu are included. Show Open Play, Settings, Audio Devices and Help reuse the existing window/panels; Quit retains normal app behavior. Reverse failure rollback uses the committed voice direction; absent-audio backup metadata survives export, reload and later import. Listening/hardware acceptance remains separate.

Accepted Load now cancels old queued tempo intentions and promptly settles the owned aborted group before rearming Sync; old initialization can finish later without overwriting new input. Headphone MIX uses the existing10ms per-gain transition policy. Current musical/headphone acceptance remains separate.

Current source also cancels pending manual Play when temporary Cue sets a new cue, smooths headphone LEVEL over10ms, and commits continuous GUI master/track-gain edits once at release. MIDI/keyboard/explicit gain setters retain immediate persistence. Musical/controller acceptance remains separate.

Current core fixes retire pending Sync rate ownership on accepted same-track Load and retain focused artwork cards during routine refresh. Shared channel filter routing crossfades bypass changes; generated-signal continuity checks are separate from owner listening.

Mixer filter knobs now default Off/hidden. Settings→Mixer→Channel Filters enables/shows them. Off bypasses assigned channel effects while retaining stored amounts; On restores them. All original controls/layouts/library previews remain; musical bypass-transition acceptance is separate.

Current source also cancels pending Autoplay when a newer temporary Cue or existing hot cue is triggered, preserving release-to-pause and explicit Cue+Play latch. Empty cue creation/deletion keeps its metadata-only behavior. Private packaging now seals nested code/resources ad-hoc without a certificate/account; this is not Developer ID/notarization or public-distribution acceptance. The isolated Core transport ownership check uses a volatile device-denied session and generated audio only.

Current source includes CORE-FIX-45: pending Autoplay yields to newer manual Play, Stop or replacement instead of canceling playback or restarting unexpectedly. Actual isolated four-deck Compact buttons/engine with a controlled buffer boundary preserve transport and controls/previews. Relevant native/listening acceptance remains separate; no Sync-pop resolution is claimed.

Current source includes CORE-FIX-44: queued tempo inputs yield to a newer selected MASTER, Sync mode or Smart Sync tempo owner. Queue-owned changes preserve valid later input; stale input never reaches transport. Actual paused/muted four-deck failure-path and three focused regression results are recorded. Native failure/playing/listening acceptance remains separate. The blue Oxide study remains a separate preview and is not applied to this workspace.

The outer GUI same-fader queue also discards its older waiting movement before an explicit Sync, OFF, MASTER or mode choice. Idle fader coordinates and valid fresh movement remain. This closes the source/browser companion that was still present in the never-launched93candidate; native failed-request/playing/listening remains separate.

Current source also carries CORE-FIX-43 through the per-deck GUI tempo controller: a newer same-fader gesture survives rejection of the older in-flight gesture, retaining absolute/relative coordinates and coalescing. Actual paused/muted four-deck source controls reach127.7instead of reverting124.0; native failure/playing/listening remains separate.

Current source includes CORE-FIX-43 per-operation Sync-tempo queue outcomes: a rejected in-flight request no longer discards a newer queued deck adjustment; latest waiting inputs still coalesce and the original error remains visible. Actual paused/muted four-deck controls retain their nodes and reach the new requested tempo after a controlled old failure. Native playing/listening acceptance remains separate.

Current source includes CORE-FIX-42 ownership of shared Smart Sync tempo rollback: an older failed request cannot replace a newer MASTER/Sync tempo, including equal-BPM newer writes. The focused request module preserves existing routing, sampler/Slicer coordination and errors. Actual paused four-deck Compact controlled-rejection evidence is recorded; native playing/listening acceptance remains separate. CORE-FIX-41 validates warped-track BPM before metadata save; CORE-FIX-40 avoids redundant Sync presentation writes. None is established audible-pop or long-session-stall causation.

Current source includes CORE-FIX-38 owned Reverse preparation and direction rollback, CORE-FIX-37 windowed ordinary pitch-loop preparation with original-time offsets and safe loop transitions, CORE-FIX-36 legal quantized Cue/loop boundaries, CORE-FIX-35 deck-owned performance-mode rendering and CORE-FIX-34 stutter completion control retention with existing transport-only presentation, plus prior CORE-FIX-32 Double and CORE-FIX-33 key-shift/reset repairs. Key buttons and mapped MIDI use the same focused request module; feedback updates existing controls. Controlled stopped/muted four-deck browser retention is recorded; native held/playing, physical MIDI and listening acceptance remain separate.

Deck and library full-track overviews now show the measured energy envelope rather than unioned full-track peak buckets. The large scrolling detail retains its original transient/peak rendering. Existing cue/seek/loop markers and controls remain; old generated thumbnail cache is replaced. No PCM, audio graph, time grid or layout sizing change.

Built from immutable source ${sourceCommit}. Opens the existing rekordbox workspace directly in the sandboxed main frame, retaining layouts, core controls, headphone knobs and library waveform previews. No framework or native audio rewrite.

Loop, length, beat-jump, manual-loop and Auto/Roll feedback refresh existing controls and affected overview shading. A pending Instant Double is canceled by incoming Stop instead of restarting after older FX preparation. Native/held/playing acceptance remains separately recorded.

Reverse, Repeat, Slip and Key Lock refresh existing controls instead of replacing the deck/mixer tree. Ordinary Slip still refreshes Stem Slip feedback. The flat-black shared palette retains deck/status accents, RGB waveform previews, custom DJ controls and all layout choices. These source checks do not establish native playing/held-control acceptance.

Settings Back restores its selected tab, scroll and keyboard focus. FX catalog navigation also returns to the originating Settings tab, including an already-open FX panel. Close returns to the Settings trigger when the former opener is hidden. Native/playing acceptance remains separately scoped in the delivery receipts.

The performance header now uses a single row of quiet Astryx icons. Layout/display choices and Link/MIDI/diagnostics live in Settings, with Back navigation from nested pages. Original controls and waveform previews remain. Clean restart restores the loaded track references, positions and deck count without automatic playback. Tempo/Sync and transient controls start reset; unavailable track references are retained for recovery. This does not establish abrupt-crash or native restart acceptance.

Cached library waveform previews skip redundant geometry reads during viewport changes. The actual-pump regression and two owned four-real-track native captures retain controls, focus and previews; the full transition remained slow, so broader waveform stalls stay open. Prepare and manual History edits still save through the existing session owner. New session archives the prior list, with a selector to read/export it; history display uses local time while CSV retains ISO timestamps. Existing legacy history, play counts, fader resets, DJ controls and waveform previews remain.

Use saved library songs and Horizontal / Compact. Prior0.1.53 listening accepted four-deck Sync/crossfade, manual tempo/jog transition, A/B EQ, temporary Cue and clean stop; do not repeat clean cases automatically. Current work continues hardware-independent core defects with one focused check each. Preserve controls, focus and library previews. Rare pops/stalls remain open for concrete events; computer stereo does not prove independent headphone routing.

The intermittent Sync pop remains open. Capture the next actual occurrence; do not repeat clean matrices or declare full-core completion from packaging. Source safety changes and limits are documented in CORE_SYNC_ROLLBACK_2026-10-25.md and CORE_NATIVE_STALL_CAPTURE_2026-10-24.md. Use one focused check per reproduced bug; reserve a full suite for a release checkpoint or a concrete regression risk. Native sound, physical MIDI/headphone isolation and full parity remain separate gates.

Uses the existing playback-test profile and port ${port}. Close another playback-test version before launching this one. Previous bundles/default launcher remain unchanged. Private local unsigned test; no public release. Existing Checks menus remain available, with separate volatile/device-denied sessions; broad advanced checks are not prerequisites for the core listening pass.
`);
const modules=['loop-pad-recall-check.js','grid-cancel-play-check.js','pitch-presentation.js','slicer-presentation.js','flip.js','live-key-failure-check.js','manual-loop-load-check.js','tempo-only-off-check.js','fader-start.js','fresh-jog-handoff-check.js','playback-intents.js','jog-sync-release-check.js','core-ownership-check.js','core-ownership-check.html','jog-focus-check.js','deck-session.js','design-system.css','workspace-toolbar.js','performance-panel-navigation.js','workspace-toolbar.css','astryx-preview.css','vendor/astryx/controls.js','vendor/astryx/controls.css','decoded-cache.js','library-state.js','session-storage.js','session-status.js','workspace-preview.html','holds.js','layout-preview.js','rekordbox-preview.js','library-waveform-preview.js','headphone-preview.js','rotary-preview.js','fader-preview.js','index.html','source-waveform.js','performance-theme.css','performance-tokens.css','performance-tokens.js','design-tokens/serato-core.tokens.json','lpf-parameters.js','lpf-kernel.js','tempo-slider.js','gui-tempo-harness.js','gui-tempo-harness.html','simple-sync-controller-harness.js','simple-sync-controller-harness.html','relative-tempo-harness.js','relative-tempo-harness.html','audio-monitor.js','audio-output.js','analysis.js','analysis-input.js','analysis-presentation.js','tempo-drift.js','grid-proposal-check.js','grid-drift-controls.js','analysis-worker.js','loudness.js','auto-gain.js','track-gain.js','master-output.js','master-output-kernel.js','master-output-worklet.js','mixer-curves.js','channel-filter-routing.js','library-rows.js','stem-crate.js','stems.js','auto-gain-harness.js','auto-gain-harness.html','fx-tempo-capture-worklet.js','app.js','transport-presentation.js','sync-presentation.js','loop-presentation.js','detail-waveform.js','engine.js','censor.js','censor-backing.js','reverse-censor-plan.js','pitch-time-map.js','deck-scratch.js','deck-scratch-ui.js','deck-scratch-kernel.js','deck-scratch-worklet.js','silent-audio-pull.js','silent-audio-pull-worklet.js','rapid-sync-play-harness.js','rapid-sync-play-harness.html','keylock-shadow-live.js','pcm-resample.js','vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs','beatgrid.js','smart-sync.js','sync.js','sync-tempo-handoff.js','sync-tempo-requests.js','deck-midi.js','deck-tap-tempo.js','deck-key-shift.js','deck-reverse.js','deck-tempo.js','midi.js','session-panels.js','track-details.js','beatgrid-save.js','panels.js','jog-bend.js','midi-jog-touch.js','loop-pads.js','manual-loops.js','pitchplay.js','instant-double.js','effects.js','extended-effects.js','keylock.js','keylock-dsp.js','keylock-worker.js','warp-loop.js','warp-loop-kernel.js','warp-loop-worklet.js','styles.css'];
const provenance={builtAt:new Date().toISOString(),approvedPrototype:'f8b0abf33c8e8468c7bec27eabc5be2930ed0086',sourceCommit,version,name,bundle,port,profile,partition,entry:'/prototype/workspace-preview.html',electronVersion:'44.9.0',prototypeFiles:modules.map(file=>({file:'prototype/'+file,sha256:sha(get('prototype/'+file))})),packagingSources:await Promise.all(['desktop/package-playback.mjs','desktop/build-retention.mjs','desktop/playback-check-window.cjs'].map(async file=>({file,sha256:sha(await readFile(path.join(root,file)))}))),stagedWrites:writes,diagnosticFixtures:fixtureManifest.fixtures.map(f=>({name:f.name,url:f.url,sha256:f.wavSHA256,reference:f.reference})),scope:'Optional private local test. Complete prototype archived from the declared commit; no adapter substitution or native R3 helper. Main app uses a separate persistent playback-test profile and own-origin MIDI/speaker permissions; microphone and camera remain denied. Package identity does not prove runtime, physical hardware, music quality or full parity. Prior apps/defaults untouched.'};
await put('BUILD_PROVENANCE.json',JSON.stringify(provenance,null,2)+'\n');
// Private builds seal resources without discovering certificates or provisioning profiles.
const outputs=await packager({dir:stage,out:path.join(root,'local-evidence/desktop-builds',version),name,platform:'darwin',arch:process.arch,electronVersion:'44.9.0',appBundleId:bundle,appVersion:version,icon:path.join(stage,'assets','open-play.icns'),asar:true,overwrite:false,prune:true,osxSign:{identity:'-',identityValidation:false,preAutoEntitlements:false,preEmbedProvisioningProfile:false,continueOnError:false,optionsForFile:()=>({hardenedRuntime:false,timestamp:'none'})}});
const asarPath=path.join(outputs[0],name+'.app','Contents','Resources','app.asar');
const receipt={...provenance,stage,outputs,asarPath,asarSHA256:sha(await readFile(asarPath))};
await writeFile(path.join(root,`docs/prototype/desktop-${version}-playback-package.json`),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({outputs,asarPath,asarSHA256:receipt.asarSHA256,sourceCommit}));

}finally{await rm(stage,{recursive:true,force:true});}
