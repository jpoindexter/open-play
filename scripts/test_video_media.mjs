import assert from 'node:assert/strict';
import {File} from 'node:buffer';
import {createVideoMediaLibrary,createVideoTransitionSelector,videoMediaPolicy,videoTransitionSelectionPolicy} from '../prototype/video-media.js';
import {videoTransitionCatalog} from '../prototype/video-transitions.js';
const file=(name='clip.mp4',type='video/mp4',bytes='original bytes')=>new File([bytes],name,{type});
const library=(options)=>{const media=createVideoMediaLibrary(options);const assets=media.add([file('a.mp4'),file('b.webm','video/webm'),file('c.mov','video/quicktime')]);return {media,assets};};
const tests=[];const test=(name,run)=>tests.push({name,run});

test('metadata candidates retain original immutable bytes, stable IDs and detached lists',async()=>{
  const media=createVideoMediaLibrary(), original=file();const added=media.add([original]),asset=added[0];
  assert.equal(asset.file,original);assert(Object.isFrozen(asset));assert(Object.isFrozen(asset.warnings));assert.equal(await asset.file.text(),'original bytes');
  added.length=0;const list=media.assets();list.length=0;assert.equal(media.assets().length,1);
  assert.throws(()=>{asset.name='edited';},TypeError);const id=asset.id;media.remove(id);assert.notEqual(media.add([original])[0].id,id);assert.equal(await original.text(),'original bytes');
});
test('any video MIME is eligible without an invented codec or extension restriction',()=>{
  const media=createVideoMediaLibrary();const assets=media.add([file('future.container','video/x-new-format'),file('weird.mp4','video/webm')]);
  assert.equal(assets.length,2);assert(assets.every(a=>a.warnings.length>0));assert.equal(media.assets()[0].file.type,'video/x-new-format');
});
test('known video extensions remain candidates with absent/generic/unreliable MIME',()=>{
  const media=createVideoMediaLibrary();const extensions=videoMediaPolicy.extensionHints;
  assert.equal(media.add(extensions.map((ext,i)=>file(`local.${ext}`,i%2?'application/octet-stream':''))).length,extensions.length);
  const [conflict]=media.add([file('mislabelled.mp4','audio/mpeg')]);assert(conflict.warnings.some(w=>w.includes('conflicts')));
  assert.equal(media.add([file('uppercase.MKV','')]).length,1);
});
test('clearly nonvideo metadata and fake mutable byte objects fail atomically',()=>{
  const media=createVideoMediaLibrary();assert.throws(()=>media.add([file(),file('audio.mp3','audio/mpeg')]),/No video metadata/);assert.equal(media.assets().length,0);
  for(const candidate of [file('picture.png','image/png'),file('manual.pdf','application/pdf'),{name:'fake.mp4',type:'video/mp4',arrayBuffer(){return new ArrayBuffer(0);}}])assert.throws(()=>media.add([candidate]),TypeError);
  assert.throws(()=>media.add('clip.mp4'),TypeError);assert.throws(()=>media.add([new Blob(['x'],{type:'video/mp4'})]),TypeError);
});
test('zero byte video metadata stays an explicit undecoded candidate',()=>{
  const media=createVideoMediaLibrary(),[candidate]=media.add([file('empty.mp4','video/mp4','')]);assert.equal(candidate.file.size,0);assert.equal(media.assets().length,1);
});
test('disabled fallback never auto-selects but explicit associations still win',()=>{
  const {media,assets}=library();assert.deepEqual(media.resolve('track'),{asset:null,kind:'none',reason:'fallback-disabled'});
  assert.equal(media.next('track').kind,'none');assert.equal(media.diagnostics().cursor,-1);
  media.associate('track',assets[1].id);assert.equal(media.association('track'),assets[1].id);assert.equal(media.resolve('track').asset,assets[1]);assert.equal(media.next('track').kind,'associated');
});
test('enabled empty fallback has a visible none result and adding later resolves it',()=>{
  const media=createVideoMediaLibrary();media.configure({enabled:true});assert.equal(media.resolve('track').reason,'empty-library');
  const [asset]=media.add([file()]);assert.equal(media.resolve('track').asset,asset);
});
test('sequential shared cursor wraps while repeated per-track resolution is idempotent',()=>{
  const {media,assets}=library();media.configure({enabled:true});const first=media.resolve('track-a');
  assert.equal(first.asset,assets[0]);assert.equal(media.resolve('track-a'),first);assert.equal(media.resolve('track-b').asset,assets[1]);
  assert.equal(media.resolve('track-a'),first);assert.equal(media.next('track-a').asset,assets[2]);assert.equal(media.resolve('track-c').asset,assets[0]);
});
test('only explicit advance moves an already resolved track; toggles do not move selection',()=>{
  const {media,assets}=library();media.configure({enabled:true});const first=media.resolve(0);
  media.configure({random:true});assert.equal(media.resolve(0),first);media.configure({enabled:false});assert.equal(media.resolve(0).kind,'none');
  media.configure({enabled:true,random:false});assert.equal(media.resolve(0),first);assert.equal(media.resolve(0,{advance:true}).asset,assets[1]);
});
test('association changes invalidate only their own fallback cache and clearing rejoins cursor',()=>{
  const {media,assets}=library();media.configure({enabled:true});const a=media.resolve('a'),b=media.resolve('b');
  media.associate('a',assets[2].id);assert.equal(media.resolve('a').asset,assets[2]);assert.equal(media.resolve('b'),b);
  media.associate('a',null);assert.equal(media.association('a'),null);assert.equal(media.resolve('a').asset,assets[2]);assert.notEqual(media.resolve('a'),a);
  assert.throws(()=>media.associate('a','missing'),RangeError);assert.equal(media.resolve('b'),b);
});
test('removing current media invalidates affected tracks/associations without skipping sequential successor',()=>{
  const {media,assets}=library();media.configure({enabled:true});media.resolve('a');media.resolve('b');media.associate('explicit',assets[1].id);
  assert(media.remove(assets[1].id));assert.equal(media.association('explicit'),null);assert.equal(media.resolve('b').asset,assets[2]);
  assert.equal(media.resolve('a').asset,assets[0]);assert.equal(media.remove('missing'),false);
  for(const a of media.assets())media.remove(a.id);assert.equal(media.resolve('a').reason,'empty-library');assert.equal(media.diagnostics().associationCount,0);
});
test('automatic random selection still excludes each track current item when more than one exists',()=>{
  let randomCalls=0;const {media,assets}=library({random:()=>{randomCalls++;return 0;}});media.configure({enabled:true,random:true});
  const first=media.resolve('a');assert.equal(first.asset,assets[0]);assert.equal(media.resolve('a'),first);assert.equal(randomCalls,1);
  assert.equal(media.resolve('a',{advance:true}).asset,assets[1]);media.resolve('b');assert.equal(media.resolve('a',{advance:true}).asset,assets[0]);
  while(media.assets().length>1)media.remove(media.assets().at(-1).id);assert.equal(media.resolve('a',{advance:true}).asset,assets[0]);
});
test('explicit Next follows ordered B→C→A→B while Random stays enabled and consumes no randomness',()=>{
  let calls=0;const {media,assets}=library({random:()=>{calls++;return .45;}});media.configure({enabled:true,random:true});
  assert.equal(media.resolve('a').asset,assets[1]);assert.equal(calls,1);
  for(const index of [2,0,1]){assert.equal(media.next('a').asset,assets[index]);assert.equal(calls,1);assert.equal(media.diagnostics().random,true);}
  assert.equal(media.resolve('new-track').asset,assets[0]);assert.equal(calls,2,'New automatic track load must still use the injected random provider.');
  assert.equal(media.diagnostics().random,true);assert.match(videoMediaPolicy.supersededIndependentPolicy,/Prior random-Next passes/);assert.equal(videoMediaPolicy.referenceRuntimeVerified,false);
});
test('explicit ordered Next works without consulting a broken automatic random provider',()=>{
  let calls=0;const {media,assets}=library({random:()=>{calls++;return 1;}});media.configure({enabled:true,random:true});
  assert.throws(()=>media.resolve('a'),RangeError);assert.equal(calls,1);assert.equal(media.next('a').asset,assets[0]);assert.equal(media.next('a').asset,assets[1]);assert.equal(calls,1);
});
test('invalid injected randomness does not consume selection state',()=>{
  let value=1;const {media,assets}=library({random:()=>value});media.configure({enabled:true,random:true});
  assert.throws(()=>media.resolve('a'),RangeError);assert.equal(media.diagnostics().resolvedTrackCount,0);assert.equal(media.diagnostics().cursor,-1);
  value=.999;assert.equal(media.resolve('a').asset,assets[2]);
});
test('configuration and identifier errors do not mutate the live library',()=>{
  const {media}=library();assert.throws(()=>media.configure({enabled:true,random:'yes'}),TypeError);assert.equal(media.diagnostics().enabled,false);
  for(const id of ['',undefined,null,NaN,{},Infinity])assert.throws(()=>media.resolve(id),TypeError);
  assert.throws(()=>media.resolve('a',{advance:'yes'}),TypeError);assert.throws(()=>createVideoMediaLibrary({random:5}),TypeError);
});
test('large collections and track caches have no product count cap and disposal clears references',()=>{
  const media=createVideoMediaLibrary(),shared=file();const assets=media.add(Array.from({length:20000},()=>shared));assert.equal(assets.length,20000);media.configure({enabled:true});
  for(let i=0;i<1000;i++)media.resolve(i);assert.equal(media.diagnostics().resolvedTrackCount,1000);
  media.associate('shared',assets[0].id);media.dispose();media.dispose();assert.equal(media.diagnostics().assetCount,0);assert.equal(media.diagnostics().associationCount,0);assert.equal(media.diagnostics().resolvedTrackCount,0);
  assert.throws(()=>media.assets(),/disposed/);assert.throws(()=>media.resolve('shared'),/disposed/);assert.equal(shared.size,14);
});
test('media selection exposes no clip-end, playback, URL or fader side effects',()=>{
  const {media}=library();assert.equal(media.onClipEnd,undefined);assert.equal(media.play,undefined);assert.equal(media.cross,undefined);
  assert.match(videoMediaPolicy.clipEnd,/never auto-advances/);assert.equal(videoMediaPolicy.referenceRuntimeVerified,false);
});

test('transition catalog retains observed provenance and separates baseline/candidates',()=>{
  const selector=createVideoTransitionSelector(videoTransitionCatalog),d=selector.diagnostics();assert.equal(d.catalogCount,34);assert.equal(d.manifestCount,7);assert.equal(d.candidateCount,26);assert.equal(d.baselineCount,1);
  assert.equal(selector.current(),'Crossfade');assert.equal(videoTransitionSelectionPolicy.referenceRuntimeVerified,false);
});
test('manual transition selection/Next is independent of enabled auto mode and wraps',()=>{
  const selector=createVideoTransitionSelector([{name:'a'},{name:'b'},{name:'c'}]);assert.equal(selector.current(),'a');assert.equal(selector.next(),'b');
  assert.equal(selector.select('c'),'c');assert.equal(selector.next(),'a');assert.throws(()=>selector.select('unknown'),RangeError);assert.equal(selector.current(),'a');
});
test('one logical load plus fallback produces only one automatic transition selection',()=>{
  const selector=createVideoTransitionSelector([{name:'a'},{name:'b'},{name:'c'}]);selector.configure({enabled:true});
  assert.equal(selector.onTrackLoad('deck0:load1'),'b');assert.equal(selector.onTrackLoad('deck0:load1'),'b');assert.equal(selector.onTrackLoad('deck0:load1'),'b');
  assert.equal(selector.diagnostics().automaticSelections,1);assert.equal(selector.onTrackLoad('deck1:load1'),'c');assert.equal(selector.diagnostics().automaticSelections,2);
});
test('toggles never select transitions or replay a transaction observed while disabled',()=>{
  const selector=createVideoTransitionSelector([{name:'a'},{name:'b'}]);assert.equal(selector.onTrackLoad('off-load'),'a');selector.configure({enabled:true,random:true});assert.equal(selector.current(),'a');
  assert.equal(selector.onTrackLoad('off-load'),'a');assert.equal(selector.diagnostics().automaticSelections,0);assert.equal(selector.onTrackLoad('new-load'),'b');
  selector.configure({enabled:false});assert.equal(selector.current(),'b');assert.equal(selector.next(),'a');
});
test('random transitions exclude the current name and repeated transactions consume no randomness',()=>{
  let calls=0;const selector=createVideoTransitionSelector([{name:'a'},{name:'b'},{name:'c'}],{random:()=>{calls++;return 0;}});selector.configure({enabled:true,random:true});
  assert.equal(selector.onTrackLoad(1),'b');assert.equal(selector.onTrackLoad(1),'b');assert.equal(calls,1);assert.equal(selector.onTrackLoad(2),'a');assert.equal(calls,2);
});
test('bad random provider does not consume a logical transition transaction',()=>{
  let value=Infinity;const selector=createVideoTransitionSelector([{name:'a'},{name:'b'}],{random:()=>value});selector.configure({enabled:true,random:true});
  assert.throws(()=>selector.onTrackLoad('retry'),RangeError);assert.equal(selector.diagnostics().observedTransactions,0);assert.equal(selector.current(),'a');value=.5;
  assert.equal(selector.onTrackLoad('retry'),'b');assert.equal(selector.diagnostics().automaticSelections,1);
});
test('empty and one-item catalogs have explicit stable selection policies',()=>{
  const empty=createVideoTransitionSelector([]);empty.configure({enabled:true,random:true});assert.equal(empty.current(),null);assert.equal(empty.next(),null);assert.equal(empty.onTrackLoad('a'),null);assert.equal(empty.diagnostics().automaticSelections,0);
  const one=createVideoTransitionSelector([{name:'only'}],{random:()=>0});one.configure({enabled:true,random:true});assert.equal(one.next(),'only');assert.equal(one.onTrackLoad('a'),'only');
});
test('transition catalog snapshot resists caller mutations and rejects ambiguous names',()=>{
  const input=[{name:'a'},{name:'b'}],selector=createVideoTransitionSelector(input);input[0].name='changed';input.push({name:'c'});assert.equal(selector.current(),'a');assert.equal(selector.next(),'b');assert.equal(selector.diagnostics().catalogCount,2);
  assert.throws(()=>createVideoTransitionSelector([{name:'a'},{name:'a'}]),TypeError);assert.throws(()=>createVideoTransitionSelector([{name:''}]),TypeError);assert.throws(()=>createVideoTransitionSelector(null),TypeError);
});
test('transition state validates input atomically, has no fader effect, and disposal is final',()=>{
  const selector=createVideoTransitionSelector([{name:'a'},{name:'b'}]);assert.throws(()=>selector.configure({enabled:true,random:1}),TypeError);assert.equal(selector.diagnostics().enabled,false);
  assert.throws(()=>selector.onTrackLoad(undefined),TypeError);assert.equal(selector.diagnostics().observedTransactions,0);assert.equal(selector.cross,undefined);assert.equal(selector.onClipEnd,undefined);
  selector.dispose();selector.dispose();assert.equal(selector.diagnostics().observedTransactions,0);assert.equal(selector.diagnostics().current,null);assert.throws(()=>selector.next(),/disposed/);assert.throws(()=>selector.current(),/disposed/);
});

let passed=0;
for(const {name,run} of tests){await run();passed++;console.log(`PASS ${name}`);}
console.log(`${passed}/${tests.length} pure Video media/transition selection checks passed.`);
console.log('Scope: actual selection module with original Blob/File bytes and deterministic state transitions; no decode, playback, UI, filesystem write, native or Serato behavior acceptance.');
