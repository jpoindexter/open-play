import {packager} from '@electron/packager';
import {mkdtemp,cp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here),stage=await mkdtemp(path.join(tmpdir(),'open-play-package-'));
const approved='f8b0abf33c8e8468c7bec27eabc5be2930ed0086';
// Explicit immutable implementation candidate; original approved baseline retained.
const candidate='dd068e4dc9338d1f4f131e0c64c9195073fbebed';
const version=JSON.parse(await readFile(path.join(here,'package.json'),'utf8')).version;
await mkdir(path.join(stage,'assets'));
const archive=execFileSync('git',['archive',candidate,'--','prototype','docs','handoffs','README.md','FULL_BUILD_PLAN.md','PROJECT_PROMPT.md'],{cwd:root,maxBuffer:200*1024*1024});
execFileSync('tar',['-xf','-','-C',path.join(stage,'assets')],{input:archive});
for(const file of ['main.cjs','server.cjs','menu-bar.cjs','package.json'])await cp(path.join(here,file),path.join(stage,file));
for(const file of ['menuTemplate.png','menuTemplate@2x.png','open-play.icns'])await cp(path.join(here,'assets',file),path.join(stage,'assets',file));
await writeFile(path.join(stage,'BUILD_PROVENANCE.json'),JSON.stringify({approvedHTMLCommit:approved,sourceCommit:candidate,hostVersion:version,builtAt:new Date().toISOString(),scope:'Local desktop test of current reviewed browser Key Shift and Video MIDI controls; existing interface/audio implementation preserved. Original approval baseline and prior0.1.5 retained; packaging does not establish main-app mapping/reload/audio, physical device, quality or full parity acceptance.'},null,2));
const outputs=await packager({dir:stage,out:path.join(root,'local-evidence/desktop-builds',version),name:'Open Play Test',platform:'darwin',arch:process.arch,electronVersion:'44.9.0',appBundleId:'org.openplay.dj.localtest',appVersion:version,icon:path.join(stage,'assets','open-play.icns'),asar:true,overwrite:false,prune:true,osxSign:false});
console.log(JSON.stringify({outputs,stage,approvedHTMLCommit:approved,sourceCommit:candidate}));
