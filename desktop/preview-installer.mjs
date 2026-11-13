// Prepare a signed DMG; finalize only after Apple's recorded submission is Accepted.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,copyFile,symlink,rm,stat,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sign} from '@electron/osx-sign';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [mode,version,credential]=process.argv.slice(2);
assert(['prepare','finalize'].includes(mode),'Use prepare VERSION CERTIFICATE_SHA1 or finalize VERSION KEYCHAIN_PROFILE');
assert(/^0\.1\.\d+$/.test(version||''),'Explicit numeric preview version required');
assert(credential,'Signing identity or Keychain profile required');
const run=(command,args)=>execFileSync(command,args,{encoding:'utf8',maxBuffer:30*1024*1024});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const receipt=JSON.parse(await readFile(path.join(root,`docs/prototype/desktop-${version}-playback-package.json`)));
assert.equal(receipt.releaseChannel,'public-preview');
assert.equal(receipt.name,'Open Play Preview');
assert.equal(receipt.bundle,'org.openplay.dj.preview');
assert.equal(receipt.version,version);
assert.equal(sha(await readFile(receipt.asarPath)),receipt.asarSHA256,'Packaged source changed');
const app=path.dirname(path.dirname(path.dirname(receipt.asarPath)));
assert.equal(path.basename(app),'Open Play Preview.app');
const output=path.join(root,'local-evidence/releases',version);
const dmg=path.join(output,`Open-Play-Preview-${version}-arm64.dmg`);
const proof=path.join(output,'installer.json');
await mkdir(output,{recursive:true});

if(mode==='prepare'){
 assert(/^[A-F0-9]{40}$/.test(credential),'Use an exact certificate SHA1, not an ambiguous common name');
 try{await access(dmg);throw Error('Installer already exists; never overwrite a release candidate');}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const licenses=path.join(app,'Contents/Resources/Licenses');
 await mkdir(licenses,{recursive:true});
 for(const [source,target]of [['LICENSE','Electron-LICENSE.txt'],['LICENSES.chromium.html','Chromium-LICENSES.html']]){
  await copyFile(path.join(path.dirname(app),source),path.join(licenses,target));
 }
 for(const file of ['LICENSE','NOTICE']){
  const bytes=execFileSync('git',['show',`${receipt.sourceCommit}:${file}`],{cwd:root});
  await writeFile(path.join(licenses,file),bytes);
 }
 await sign({app,identity:credential,platform:'darwin',type:'distribution',preAutoEntitlements:false,
  preEmbedProvisioningProfile:false,optionsForFile:()=>({hardenedRuntime:true,
   entitlements:path.join(root,'desktop/preview-entitlements.plist')})});
 run('codesign',['--verify','--deep','--strict','--verbose=2',app]);
 const stage=await mkdtemp(path.join(tmpdir(),'open-play-installer-'));
 try{
  // ditto preserves relative framework symlinks; fs.cp rewrites their targets.
  run('ditto',[app,path.join(stage,path.basename(app))]);
  run('codesign',['--verify','--deep','--strict',path.join(stage,path.basename(app))]);
  await symlink('/Applications',path.join(stage,'Applications'));
  await copyFile(path.join(root,'desktop/PREVIEW_INSTALL.txt'),path.join(stage,'READ ME FIRST.txt'));
  run('hdiutil',['create','-volname',`Open Play Preview ${version}`,'-srcfolder',stage,'-format','UDZO',dmg]);
 }finally{await rm(stage,{recursive:true,force:true});}
 run('codesign',['--force','--sign',credential,'--timestamp',dmg]);
 run('hdiutil',['verify',dmg]);
 await writeFile(proof,JSON.stringify({version,sourceCommit:receipt.sourceCommit,asarSHA256:receipt.asarSHA256,
  dmg:path.basename(dmg),preNotarizationSHA256:sha(await readFile(dmg)),certificateSHA1:credential,
  status:'signed-not-notarized',preparedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({dmg,status:'signed-not-notarized',next:'Submit this exact DMG with notarytool, save submission.json beside it, then finalize.'}));
}else{
 const submission=JSON.parse(await readFile(path.join(output,'submission.json')));
 assert(/^[a-f0-9-]{36}$/i.test(submission.id),'Recorded Apple submission ID required');
 const info=JSON.parse(run('xcrun',['notarytool','info',submission.id,'--keychain-profile',credential,'--output-format','json']));
 assert.equal(info.status,'Accepted','Notarization must finish successfully before release');
 const log=path.join(output,'notarization-log.json');
 run('xcrun',['notarytool','log',submission.id,'--keychain-profile',credential,log]);
 const result=JSON.parse(await readFile(log));
 const prior=JSON.parse(await readFile(proof));
 assert.equal(result.status,'Accepted');
 assert(!result.issues?.length,'Review every notarization warning before distribution');
 assert.equal(prior.sourceCommit,receipt.sourceCommit);
 assert.equal(sha(await readFile(dmg)),prior.preNotarizationSHA256,'Installer changed after signing');
 assert.equal(result.sha256,prior.preNotarizationSHA256,'Apple accepted a different installer');
 run('xcrun',['stapler','staple',dmg]);
 run('xcrun',['stapler','validate',dmg]);
 run('codesign',['--verify','--strict',dmg]);
 run('spctl',['--assess','--type','open','--context','context:primary-signature','--verbose=2',dmg]);
 const digest=sha(await readFile(dmg));
 await writeFile(path.join(output,'SHA256SUMS'),`${digest}  ${path.basename(dmg)}\n`,{flag:'wx'});
 await writeFile(proof,JSON.stringify({...prior,status:'notarized',submissionId:submission.id,
  sha256:digest,bytes:(await stat(dmg)).size,finalizedAt:new Date().toISOString()},null,2)+'\n');
 console.log(JSON.stringify({dmg,sha256:digest,status:'notarized'}));
}
