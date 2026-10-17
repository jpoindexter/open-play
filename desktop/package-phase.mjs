// Optional isolated candidate. Never modifies default packaging, launcher or profile.
import {packager} from '@electron/packager';
import {mkdtemp,mkdir,writeFile,readFile,stat,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
const base='dd068e4dc9338d1f4f131e0c64c9195073fbebed',candidate='b099cda';
const version='0.1.7',name='Open Play Keylock Test',bundle='org.openplay.dj.keylockphase.localtest';
const git=(args,options={})=>execFileSync('git',args,{cwd:root,maxBuffer:300*1024*1024,...options});
const sourceCommit=git(['rev-parse',candidate]).toString().trim();
const get=(file,commit=sourceCommit)=>git(['show',`${commit}:${file}`]);
const sha=b=>createHash('sha256').update(b).digest('hex');
const replaceOnce=(s,from,to)=>{if(s.split(from).length!==2)throw Error('Expected exactly one import/host substitution: '+from);return s.replace(from,to);};
// Read-only validation against the previously recorded registry/archive/file identities.
execFileSync('python3',['scripts/prepare_keylock_soundtouch_source.py'],{cwd:root,stdio:'inherit'});
const stage=await mkdtemp(path.join(tmpdir(),'open-play-phase-'));
await mkdir(path.join(stage,'assets'));
const archive=git(['archive',base,'--','prototype','docs','handoffs','README.md','FULL_BUILD_PLAN.md','PROJECT_PROMPT.md']);
execFileSync('tar',['-xf','-','-C',path.join(stage,'assets')],{input:archive});
const writes=[],substitutions=[];
async function put(file,bytes,original){const dest=path.join(stage,file);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,bytes,{flag:'w'});writes.push({file,bytes:Buffer.byteLength(bytes),sha256:sha(bytes),...(original?{originalSha256:sha(original)}:{})});}
for(const f of ['FULL_BUILD_PLAN.md','PROJECT_PROMPT.md','handoffs/current.md'])await put('assets/'+f,get(f));
const modules=['node-factory.mjs','node-worklet.mjs','node-controller.mjs','window-source.mjs','pull-transport.mjs','phase-render-clock.mjs','phase-control.mjs'];
for(const f of modules){const original=get('experiments/keylock-soundtouch/'+f);let bytes=original;
 if(f==='pull-transport.mjs'){bytes=replaceOnce(original.toString(),"../../local-evidence/keylock-soundtouch-source/node_modules/@soundtouchjs/core/.dist/SoundTouch.js","../soundtouch/core/.dist/SoundTouch.js");substitutions.push({file:f,kind:'import-only'});}
 await put('assets/prototype/vendor/open-play-soundtouch/'+f,bytes,original);
}
const adapter=get('experiments/keylock-soundtouch/live-adapter.js');
await put('assets/prototype/keylock-shadow-live.js',replaceOnce(adapter.toString(),"/experiments/keylock-soundtouch/node-factory.mjs","./vendor/open-play-soundtouch/node-factory.mjs"),adapter);
substitutions.push({file:'prototype/keylock-shadow-live.js',kind:'select experimental adapter and import-only routing; engine/UI unchanged'});
const records=JSON.parse(get('docs/research/SOUNDTOUCH_KEYLOCK_EXPERIMENT_PROVENANCE_20261017.json')).packages;
for(const [pkg,folder] of [['@soundtouchjs/core','core'],['@soundtouchjs/interpolation-strategy-lanczos','lanczos']]){
 const record=records.find(p=>p.name===pkg);if(!record)throw Error('Pinned public source missing');
 for(const file of record.files){const original=await readFile(path.join(root,file.path));if(sha(original)!==file.sha256)throw Error('Cache identity changed');
  const relative=file.path.split('/node_modules/'+pkg+'/')[1];if(!relative)throw Error('Bad recorded package path');let bytes=original;
  if(folder==='core'&&relative==='.dist/interpolationStrategyRegistry.js'){bytes=replaceOnce(original.toString(),"'@soundtouchjs/interpolation-strategy-lanczos'","'../../lanczos/.dist/index.js'");substitutions.push({file:'vendor/soundtouch/core/'+relative,kind:'bare-import-only; upstream algorithm unchanged'});}
  await put('assets/prototype/vendor/soundtouch/'+folder+'/'+relative,bytes,original);
 }
}
for(const f of ['SOUNDTOUCH_KEYLOCK_EXPERIMENT_PROVENANCE_20261017.json','SOUNDTOUCH_PHASE_ENGINE_INDEPENDENT_REVIEW_20261017.md','SOUNDTOUCH_PHASE_LIFECYCLE_INDEPENDENT_REVIEW_20261017.md'])await put('assets/docs/research/'+f,get('docs/research/'+f));
await put('assets/prototype/vendor/soundtouch/NOTICE.md',`# Pinned public SoundTouchJS dependency\n\n@ soundtouchjs/core and interpolation-strategy-lanczos version2.1.1, from official npm registry tarballs recorded in docs/research/SOUNDTOUCH_KEYLOCK_EXPERIMENT_PROVENANCE_20261017.json. Copyright/authors/notices and MPL-2.0 LICENSE files retained in each complete package. Only core/.dist/interpolationStrategyRegistry.js bare import changed to ../../lanczos/.dist/index.js for offline browser loading; DSP algorithms unchanged. Original and staged hashes are in BUILD_PROVENANCE.json.\n\nThis is a private local test; project-wide licensing/release review remains open. No Serato code, assets, activation or device entitlement changes are included. No network download or package install runs in the app.\n`);
let main=get('desktop/main.cjs').toString();
main=replaceOnce(main,"app.setName('Open Play Test');","app.setName('Open Play Keylock Test');\napp.setPath('userData',path.join(app.getPath('appData'),'Open Play Keylock Test 0.1.7'));");
main=replaceOnce(main,'Open Play Test ${app.getVersion()} — MIDI controls test','Open Play Keylock Test ${app.getVersion()} — experimental phase keylock');
main=replaceOnce(main,'createAssetServer({root:assets})','createAssetServer({root:assets,port:18770})');
main=replaceOnce(main,"persist:open-play-test","persist:open-play-keylock-phase-017");
main=replaceOnce(main,'current browser controls source dd068e4, approved baseline f8b0abf; prior0.1.5 retained.','interface/engine base dd068e4, experimental SoundTouch phase adapter b099cda, approved baseline f8b0abf; all earlier builds/default launcher retained. Separate profile and port18770. Browser phase tests do not establish native quality or complete parity.');
await put('main.cjs',main,get('desktop/main.cjs'));await put('server.cjs',get('desktop/server.cjs'));
const manifest=JSON.parse(get('desktop/package.json'));Object.assign(manifest,{name:'open-play-keylock-phase-test',productName:name,version,description:'Optional isolated phase keylock test; previous app and profile retained'});delete manifest.scripts;
await put('package.json',JSON.stringify(manifest,null,2)+'\n');
const provenance={builtAt:new Date().toISOString(),approvedHTMLCommit:'f8b0abf33c8e8468c7bec27eabc5be2930ed0086',interfaceEngineBaseCommit:base,experimentalSourceCommit:sourceCommit,version,name,bundle,port:18770,profile:'Open Play Keylock Test 0.1.7',electronVersion:'44.9.0',substitutions,stagedWrites:writes,scope:'Separate optional local desktop candidate; unchanged interface/AudioEngine, one selected experimental adapter and pinned public offline DSP. No native/hardware/music/full parity acceptance from packaging. Defaults/prior bundles and profiles unchanged.'};
await writeFile(path.join(stage,'BUILD_PROVENANCE.json'),JSON.stringify(provenance,null,2)+'\n');
const outputs=await packager({dir:stage,out:path.join(root,'local-evidence/desktop-builds',version),name,platform:'darwin',arch:process.arch,electronVersion:'44.9.0',appBundleId:bundle,appVersion:version,asar:true,overwrite:false,prune:true,osxSign:false});
const out=path.join(root,'docs/prototype/desktop-0.1.7-phase-package.json');await writeFile(out,JSON.stringify({outputs,stage,...provenance},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({outputs,stage,sourceCommit,receipt:out}));
