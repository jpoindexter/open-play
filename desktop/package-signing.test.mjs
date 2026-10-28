import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {sign} from './node_modules/@electron/osx-sign/dist/index.js';

test('private packaging seals nested code and resources without a signing identity', {skip:process.platform!=='darwin'}, async()=>{
  const source=await readFile(new URL('./package-playback.mjs',import.meta.url),'utf8');
  const call=source.match(/^const outputs=await packager\((.*)\);$/m);assert(call);
  const options=new Function('stage','path','root','version','name','bundle','process','return '+call[1])('stage',path,'root','0.1.0','Fixture','org.openplay.fixture',process);
  const root=await mkdtemp(path.join(tmpdir(),'open-play-signature-'));
  const app=path.join(root,'Fixture.app'),helper=path.join(app,'Contents/Frameworks/Helper.app');
  try{
    for(const [bundle,name]of [[app,'Fixture'],[helper,'Helper']]){
      await mkdir(path.join(bundle,'Contents/MacOS'),{recursive:true});
      await mkdir(path.join(bundle,'Contents/Resources'),{recursive:true});
      await writeFile(path.join(bundle,'Contents/Info.plist'),`<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>${name}</string><key>CFBundleIdentifier</key><string>org.openplay.fixture.${name}</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>`);
      execFileSync('xcrun',['clang','-x','c','-','-o',path.join(bundle,'Contents/MacOS',name)],{input:'int main(void){return 0;}'});
    }
    const resource=path.join(app,'Contents/Resources/payload.txt');await writeFile(resource,'original');
    const verify=()=>spawnSync('codesign',['--verify','--deep','--strict',app],{encoding:'utf8'});
    assert.notEqual(verify().status,0,'Unsealed linker-signed fixture should fail');
    assert.equal(typeof options.osxSign,'object','Builder must request a sealed private signature');
    assert.equal(options.osxSign.identity,'-');assert.equal(options.osxSign.identityValidation,false);
    assert.equal(options.osxSign.preAutoEntitlements,false);assert.equal(options.osxSign.preEmbedProvisioningProfile,false);
    assert.equal(options.osxSign.continueOnError,false);
    assert.deepEqual(options.osxSign.optionsForFile(app),{hardenedRuntime:false,timestamp:'none'});
    await sign({app,platform:'darwin',version:'44.9.0',...options.osxSign});
    const signed=verify();assert.equal(signed.status,0,signed.stderr);
    const metadata=spawnSync('codesign',['--display','--verbose=2',app],{encoding:'utf8'}).stderr;
    assert.match(metadata,/Signature=adhoc/);assert.match(metadata,/TeamIdentifier=not set/);assert.doesNotMatch(metadata,/Sealed Resources=none/);
    await writeFile(resource,'changed');assert.notEqual(verify().status,0,'Changed resources must invalidate the seal');
  }finally{await rm(root,{recursive:true,force:true});}
});
