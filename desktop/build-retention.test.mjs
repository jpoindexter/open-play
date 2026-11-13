import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {assertBuildRetention} from './build-retention.mjs';
test('Packaging allows one current bundle but blocks before a third, preserving all existing files',async()=>{
 const workspace=await mkdtemp(path.join(tmpdir(),'open-play-retention-')),root=path.join(workspace,'local-evidence/desktop-builds'),name='Open Play Playback Test';
 const add=async version=>{const folder=path.join(root,version,`${name}-darwin-${process.arch}`,`${name}.app/Contents`);await mkdir(folder,{recursive:true});await writeFile(path.join(folder,'Info.plist'),'owned fixture');};
 try{
  assert.equal((await assertBuildRetention(path.join(root,'absent'),name)).length,0);
  await add('0.1.1');await mkdir(path.join(root,'profile-backups'));await writeFile(path.join(root,'profile-backups','keep'),'session');
  assert.equal((await assertBuildRetention(root,name)).length,1);
  await add('0.1.2');await assert.rejects(assertBuildRetention(root,name),/Clean up superseded Open Play builds/);
  const source=await readFile(new URL('./package-playback.mjs',import.meta.url),'utf8'),prefix=source.slice(source.indexOf('const version='),source.indexOf('const stage='));
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  await assert.rejects(new AsyncFunction('root','path','assertBuildRetention',prefix)(workspace,path,assertBuildRetention),/Clean up superseded Open Play builds/);
  assert.equal(await readFile(path.join(root,'profile-backups','keep'),'utf8'),'session');
  await rm(path.join(root,'0.1.1'),{recursive:true});assert.equal((await assertBuildRetention(root,name)).length,1);
 }finally{await rm(workspace,{recursive:true,force:true});}
});
