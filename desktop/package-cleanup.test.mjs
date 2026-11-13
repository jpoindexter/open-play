import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,unlink,rm,access} from 'node:fs/promises';
import {readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const repo=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=await readFile(path.join(repo,'desktop/package-playback.mjs'),'utf8');
const body=source.slice(source.indexOf('const stage=await mkdtemp'));
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
// Actual builder body and real filesystem; controlled Git/archive/packager endpoints.
for(const [fail,publicPreview] of [[false,false],[true,false],[false,true]])test(`${publicPreview?'public preview':'private'} packaging ${fail?'failure':'success'} removes only its staging directory`,async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'open-play-cleanup-probe-'));let stage;
 const get=file=>file==='docs/prototype/auto-gain-fixture-reference.json'?Buffer.from('{"fixtures":[]}'):readFileSync(path.join(repo,file));
 const config=new Function('process','get',source.slice(source.indexOf('const publicPreview='),source.indexOf('await assertBuildRetention'))+';return{publicPreview,version,name,port,bundle,profile,partition};')({argv:publicPreview?['--public-preview']:[]},get);
 assert.equal(config.version,publicPreview?'0.1.152':'0.1.153');assert.equal(config.name,publicPreview?'Open Play Preview':'Open Play Playback Test');assert.equal(config.port,publicPreview?18776:18775);
 const output=path.join(root,'output'),asar=path.join(output,config.name+'.app/Contents/Resources/app.asar'),error=Error('Controlled packaging failure');
 try{
  await mkdir(path.join(root,'docs/prototype'),{recursive:true});await mkdir(path.join(root,'desktop'));
  for(const file of ['package-playback.mjs','build-retention.mjs','playback-check-window.cjs'])await writeFile(path.join(root,'desktop',file),await readFile(path.join(repo,'desktop',file)));
  const scope={root,path,tmpdir:()=>root,mkdtemp:async prefix=>(stage=await mkdtemp(prefix)),mkdir,readFile,writeFile,unlink,rm,get,git:()=>Buffer.alloc(0),execFileSync(){if(publicPreview)for(const file of ['LICENSE','NOTICE'])writeFileSync(path.join(stage,'assets',file),get(file));},sha:bytes=>createHash('sha256').update(bytes).digest('hex'),sourceCommit:'controlled-cleanup-probe',...config,console:{log(){}},packager:async options=>{assert.equal(options.name,config.name);assert.equal(options.appBundleId,config.bundle);new Function(await readFile(path.join(stage,'main.cjs'),'utf8'));const pkg=JSON.parse(await readFile(path.join(stage,'package.json'),'utf8'));assert.equal(pkg.name,publicPreview?'open-play-preview':'open-play-playback-local-test');assert.equal(pkg.version,config.version);if(publicPreview){const main=await readFile(path.join(stage,'main.cjs'),'utf8');assert(main.includes("label:'About Open Play Preview'"));assert(main.includes('known-issues/'));}if(fail)throw error;await mkdir(path.dirname(asar),{recursive:true});await writeFile(asar,'retained output');return[output];}};
  const run=()=>new AsyncFunction(...Object.keys(scope),body)(...Object.values(scope));
  if(fail)await assert.rejects(run(),value=>value===error);else{await run();assert.equal(await readFile(asar,'utf8'),'retained output');}
  await assert.rejects(access(stage),{code:'ENOENT'});
  await access(root);
 }finally{await rm(root,{recursive:true,force:true});}
});
