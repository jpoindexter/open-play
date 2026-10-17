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
const sourceCommit=git(['rev-parse','80744b7']).toString().trim();
const get=file=>git(['show',`${sourceCommit}:${file}`]);
const version='0.1.11',name='Open Play Warp Test',port=18774,bundle='org.openplay.dj.warp.localtest';
const profile=name+' '+version,partition='persist:open-play-warp-test-0111';
const stage=await mkdtemp(path.join(tmpdir(),'open-play-warp-'));
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
main=change(main,"const {createAssetServer}=require('./server.cjs');","const {createAssetServer}=require('./server.cjs');\nconst {createWarpCheckWindow}=require('./warp-check-window.cjs');");
main=change(main,"app.setName('Open Play Test');",`app.setName(${JSON.stringify(name)});\napp.setPath('userData',path.join(app.getPath('appData'),${JSON.stringify(profile)}));`);
main=change(main,'Open Play Test ${app.getVersion()} — MIDI controls test','Open Play Warp Test ${app.getVersion()} — current source test');
main=change(main,'createAssetServer({root:assets})',`createAssetServer({root:assets,port:${port}})`);
main=change(main,'persist:open-play-test',partition);
main=change(main,"{label:'Window',submenu:","{label:'Checks',submenu:[{label:'Run shared-stem audio check (isolated)',click:()=>createWarpCheckWindow({BrowserWindow,host,version:app.getVersion()})}]},{label:'Window',submenu:");
main=change(main,'current browser controls source dd068e4, approved baseline f8b0abf; prior0.1.5 retained.',`current browser source ${sourceCommit.slice(0,7)}, original local-test approval f8b0abf; all earlier apps/default launcher retained. Separate profile and port ${port}. Browser Signalsmith keylock with shared original/stem channels and warp maps; no installed Rubber Band helper required. Checks opens an ephemeral isolated profile; it uses known prepared fixtures, not a new model-quality benchmark.`);
await put('main.cjs',main);await put('server.cjs',get('desktop/server.cjs'));
await put('warp-check-window.cjs',await readFile(path.join(root,'desktop/warp-check-window.cjs')));
const manifest=JSON.parse(get('desktop/package.json'));
Object.assign(manifest,{name:'open-play-warp-local-test',productName:name,version,description:'Optional current-source desktop test; full parity unverified'});delete manifest.scripts;
await put('package.json',JSON.stringify(manifest,null,2)+'\n');
const modules=['app.js','engine.js','keylock-shadow-live.js','beatgrid.js','smart-sync.js','stem-coherence-harness.js','panels.js'];
const provenance={builtAt:new Date().toISOString(),approvedPrototype:'f8b0abf33c8e8468c7bec27eabc5be2930ed0086',sourceCommit,version,name,bundle,port,profile,partition,electronVersion:'44.9.0',prototypeFiles:modules.map(file=>({file:'prototype/'+file,sha256:sha(get('prototype/'+file))})),packagingSources:await Promise.all(['desktop/package-warp.mjs','desktop/warp-check-window.cjs'].map(async file=>({file,sha256:sha(await readFile(path.join(root,file)))}))),stagedWrites:writes,scope:'Optional private local test. Complete prototype archived from the declared commit; no adapter substitution or native R3 helper. Main app uses a separate persistent profile; check windows use isolated ephemeral sessions with all device permissions denied. Package identity does not prove runtime, physical hardware, music quality or full parity. Prior apps/defaults untouched.'};
await put('BUILD_PROVENANCE.json',JSON.stringify(provenance,null,2)+'\n');
const outputs=await packager({dir:stage,out:path.join(root,'local-evidence/desktop-builds',version),name,platform:'darwin',arch:process.arch,electronVersion:'44.9.0',appBundleId:bundle,appVersion:version,asar:true,overwrite:false,prune:true,osxSign:false});
const asarPath=path.join(outputs[0],name+'.app','Contents','Resources','app.asar');
const receipt={...provenance,stage,outputs,asarPath,asarSHA256:sha(await readFile(asarPath))};
await writeFile(path.join(root,'docs/prototype/desktop-0.1.11-warp-package.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({outputs,asarPath,asarSHA256:receipt.asarSHA256,sourceCommit}));
