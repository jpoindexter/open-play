import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,unlink,rm,access} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const repo=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=await readFile(path.join(repo,'desktop/package-playback.mjs'),'utf8');
const body=source.slice(source.indexOf('const stage=await mkdtemp'));
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
// Actual builder body and real filesystem; controlled Git/archive/packager endpoints.
for(const fail of [false,true])test(`packaging ${fail?'failure':'success'} removes only its staging directory`,async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'open-play-cleanup-probe-'));let stage;
 const output=path.join(root,'output'),asar=path.join(output,'Open Play Playback Test.app/Contents/Resources/app.asar'),error=Error('Controlled packaging failure');
 try{
  await mkdir(path.join(root,'docs/prototype'),{recursive:true});await mkdir(path.join(root,'desktop'));
  for(const file of ['package-playback.mjs','playback-check-window.cjs'])await writeFile(path.join(root,'desktop',file),await readFile(path.join(repo,'desktop',file)));
  const get=file=>file==='docs/prototype/auto-gain-fixture-reference.json'?Buffer.from('{"fixtures":[]}'):readFileSync(path.join(repo,file));
  const scope={root,path,tmpdir:()=>root,mkdtemp:async prefix=>(stage=await mkdtemp(prefix)),mkdir,readFile,writeFile,unlink,rm,get,git:()=>Buffer.alloc(0),execFileSync(){},sha:bytes=>createHash('sha256').update(bytes).digest('hex'),sourceCommit:'controlled-cleanup-probe',version:'probe',name:'Open Play Playback Test',port:18775,bundle:'org.openplay.cleanup.probe',profile:'probe',partition:'probe',console:{log(){}},packager:async()=>{if(fail)throw error;await mkdir(path.dirname(asar),{recursive:true});await writeFile(asar,'retained output');return[output];}};
  const run=()=>new AsyncFunction(...Object.keys(scope),body)(...Object.values(scope));
  if(fail)await assert.rejects(run(),value=>value===error);else{await run();assert.equal(await readFile(asar,'utf8'),'retained output');}
  await assert.rejects(access(stage),{code:'ENOENT'});
  await access(root);
 }finally{await rm(root,{recursive:true,force:true});}
});
