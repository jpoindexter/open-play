// Optional current-source test. Existing app bundles, profiles and defaults stay intact.
import {packager} from '@electron/packager';
import {mkdtemp,mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
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
const version='0.1.58',name='Open Play Playback Test',port=18775,bundle='org.openplay.dj.playback.localtest';
const profile='Open Play Playback Test',partition='persist:open-play-playback-test';
const stage=await mkdtemp(path.join(tmpdir(),'open-play-playback-'));
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
main=change(main,'current browser controls source dd068e4, approved baseline f8b0abf; prior0.1.5 retained.',`current browser source ${sourceCommit.slice(0,7)}, original local-test approval f8b0abf; all earlier apps/default launcher retained. Separate profile and port ${port}. Playback and independent Hercules starter MIDI controls. Stable separate playback-test profile. Full controller acceptance and Serato parity remain open. No public release.`);
main=change(main,"const {createAssetServer}=require('./server.cjs');","const {createAssetServer}=require('./server.cjs');\nconst {openPlaybackCheck,openAutoGainCheck,openRelativeTempoCheck,openGUITempoCheck,openSimpleControllerCheck}=require('./playback-check-window.cjs');");
main=change(main,"{label:'Window',submenu:","{label:'Checks',submenu:[{label:'Rapid Sync and Play',click:()=>openPlaybackCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Measured Auto Gain',click:()=>openAutoGainCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Relative Controller Tempo',click:()=>openRelativeTempoCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'GUI Tempo after Sync',click:()=>openGUITempoCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Simple Sync Controller',click:()=>openSimpleControllerCheck({BrowserWindow,origin:host.origin,title:testTitle})},{label:'Device permission decisions',click:()=>dialog.showMessageBox(window,{type:'info',title:'Local permission decisions',message:'Last80 device permission decisions',detail:JSON.stringify(permissionDecisions,null,2)})}]},{label:'Window',submenu:");
await put('main.cjs',main);await put('server.cjs',get('desktop/server.cjs'));await put('playback-check-window.cjs',get('desktop/playback-check-window.cjs'));
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

Built from immutable source ${sourceCommit}. Opens the existing rekordbox workspace directly in the sandboxed main frame, retaining layouts, core controls, headphone knobs and library waveform previews. No framework or native audio rewrite.

The performance header now uses a single row of quiet Astryx icons. Layout/display choices and Link/MIDI/diagnostics live in Settings, with Back navigation from nested pages. Original controls and waveform previews remain. Clean restart restores the loaded track references, positions and deck count without automatic playback. Tempo/Sync and transient controls start reset; unavailable track references are retained for recovery. This does not establish abrupt-crash or native restart acceptance.

Cached library waveform previews skip redundant geometry reads during viewport changes. The actual-pump regression and two owned four-real-track native captures retain controls, focus and previews; the full transition remained slow, so broader waveform stalls stay open. Prepare and manual History edits still save through the existing session owner. New session archives the prior list, with a selector to read/export it; history display uses local time while CSV retains ISO timestamps. Existing legacy history, play counts, fader resets, DJ controls and waveform previews remain.

Use saved library songs and Horizontal / Compact. Prior0.1.53 listening accepted four-deck Sync/crossfade, manual tempo/jog transition, A/B EQ, temporary Cue and clean stop; do not repeat clean cases automatically. Current work continues hardware-independent core defects with one focused check each. Preserve controls, focus and library previews. Rare pops/stalls remain open for concrete events; computer stereo does not prove independent headphone routing.

The intermittent Sync pop remains open. Capture the next actual occurrence; do not repeat clean matrices or declare full-core completion from packaging. Source safety changes and limits are documented in CORE_SYNC_ROLLBACK_2026-10-25.md and CORE_NATIVE_STALL_CAPTURE_2026-10-24.md. Use one focused check per reproduced bug; reserve a full suite for a release checkpoint or a concrete regression risk. Native sound, physical MIDI/headphone isolation and full parity remain separate gates.

Uses the existing playback-test profile and port ${port}. Close another playback-test version before launching this one. Previous bundles/default launcher remain unchanged. Private local unsigned test; no public release. Existing Checks menus remain available, with separate volatile/device-denied sessions; broad advanced checks are not prerequisites for the core listening pass.
`);
const modules=['deck-session.js','design-system.css','workspace-toolbar.js','workspace-toolbar.css','astryx-preview.css','vendor/astryx/controls.js','vendor/astryx/controls.css','decoded-cache.js','library-state.js','session-storage.js','session-status.js','workspace-preview.html','holds.js','layout-preview.js','rekordbox-preview.js','library-waveform-preview.js','headphone-preview.js','rotary-preview.js','fader-preview.js','index.html','source-waveform.js','performance-theme.css','performance-tokens.css','performance-tokens.js','design-tokens/serato-core.tokens.json','lpf-parameters.js','lpf-kernel.js','tempo-slider.js','gui-tempo-harness.js','gui-tempo-harness.html','simple-sync-controller-harness.js','simple-sync-controller-harness.html','relative-tempo-harness.js','relative-tempo-harness.html','audio-monitor.js','audio-output.js','analysis.js','analysis-input.js','analysis-presentation.js','tempo-drift.js','grid-proposal-check.js','grid-drift-controls.js','analysis-worker.js','loudness.js','auto-gain.js','track-gain.js','master-output.js','master-output-kernel.js','master-output-worklet.js','mixer-curves.js','stem-crate.js','stems.js','auto-gain-harness.js','auto-gain-harness.html','fx-tempo-capture-worklet.js','app.js','detail-waveform.js','engine.js','censor.js','censor-backing.js','reverse-censor-plan.js','pitch-time-map.js','deck-scratch.js','deck-scratch-ui.js','deck-scratch-kernel.js','deck-scratch-worklet.js','silent-audio-pull.js','silent-audio-pull-worklet.js','rapid-sync-play-harness.js','rapid-sync-play-harness.html','keylock-shadow-live.js','pcm-resample.js','vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs','beatgrid.js','smart-sync.js','sync.js','sync-tempo-handoff.js','deck-midi.js','deck-tap-tempo.js','deck-tempo.js','midi.js','session-panels.js','panels.js','jog-bend.js','midi-jog-touch.js','loop-pads.js','manual-loops.js','pitchplay.js','instant-double.js','effects.js','extended-effects.js','keylock.js','keylock-dsp.js','keylock-worker.js','warp-loop.js','warp-loop-kernel.js','warp-loop-worklet.js','styles.css'];
const provenance={builtAt:new Date().toISOString(),approvedPrototype:'f8b0abf33c8e8468c7bec27eabc5be2930ed0086',sourceCommit,version,name,bundle,port,profile,partition,entry:'/prototype/workspace-preview.html',electronVersion:'44.9.0',prototypeFiles:modules.map(file=>({file:'prototype/'+file,sha256:sha(get('prototype/'+file))})),packagingSources:await Promise.all(['desktop/package-playback.mjs','desktop/playback-check-window.cjs'].map(async file=>({file,sha256:sha(await readFile(path.join(root,file)))}))),stagedWrites:writes,diagnosticFixtures:fixtureManifest.fixtures.map(f=>({name:f.name,url:f.url,sha256:f.wavSHA256,reference:f.reference})),scope:'Optional private local test. Complete prototype archived from the declared commit; no adapter substitution or native R3 helper. Main app uses a separate persistent playback-test profile and own-origin MIDI/speaker permissions; microphone and camera remain denied. Package identity does not prove runtime, physical hardware, music quality or full parity. Prior apps/defaults untouched.'};
await put('BUILD_PROVENANCE.json',JSON.stringify(provenance,null,2)+'\n');
const outputs=await packager({dir:stage,out:path.join(root,'local-evidence/desktop-builds',version),name,platform:'darwin',arch:process.arch,electronVersion:'44.9.0',appBundleId:bundle,appVersion:version,asar:true,overwrite:false,prune:true,osxSign:false});
const asarPath=path.join(outputs[0],name+'.app','Contents','Resources','app.asar');
const receipt={...provenance,stage,outputs,asarPath,asarSHA256:sha(await readFile(asarPath))};
await writeFile(path.join(root,`docs/prototype/desktop-${version}-playback-package.json`),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({outputs,asarPath,asarSHA256:receipt.asarSHA256,sourceCommit}));
