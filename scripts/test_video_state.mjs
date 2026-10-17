import assert from 'node:assert/strict';
import {snapshotVideoState,restoreVideoState} from '../prototype/video-state.js';
import {videoEffectCatalog} from '../prototype/video-effects-catalog.js';
import {videoTransitionCatalog} from '../prototype/video-transitions.js';
const checks=[];
function test(name,run){run();checks.push({name,passed:true});}
const stateWith = (spec,target='left') => ({fx:{[target]:[spec]}});
const effect = (name,params={},value=.65,on=true) => ({name,params,value,on});

test('Empty and malformed roots restore six OFF slots and no legacy overlay',()=>{
  for(const value of [undefined,null,false,42,'state',[],NaN,Infinity,{text:'OPEN PLAY',image:'blob:old'},{version:99,overlays:{master:[{on:true,text:'future'}]}}]){
    const restored=restoreVideoState(value);
    assert.deepEqual([restored.width,restored.height,restored.transition,restored.cross,restored.auto,restored.linked],[640,360,'Crossfade',0,false,true]);
    assert.equal(Object.values(restored.fx).flat().length,6);
    assert(Object.values(restored.fx).flat().every(spec=>!spec.on));
    assert.deepEqual(restored.overlays,{left:[],right:[],master:[]});
    assert(!('text' in restored));
  }
});
test('Only supported dimension pairs survive; unrelated valid sides do not form a new resolution',()=>{
  for(const [width,height] of [[640,360],[1280,720],[1920,1080]]) assert.deepEqual([restoreVideoState({width,height}).width,restoreVideoState({width,height}).height],[width,height]);
  for(const [width,height] of [[640,720],[1920,360],[0,0],['1280',720],[Infinity,1080],[1280.5,720]]) assert.equal(restoreVideoState({width,height}).width,640);
});
test('Every catalog transition survives and unknown values use the baseline',()=>{
  assert.equal(videoTransitionCatalog.length,34);
  for(const {name} of videoTransitionCatalog) assert.equal(restoreVideoState({transition:name}).transition,name);
  for(const transition of ['Wipe — illustrative',{},'__proto__']) assert.equal(restoreVideoState({transition}).transition,'Crossfade');
});
test('Cross and boolean settings preserve literal zero/false without truthy-string coercion',()=>{
  assert.equal(restoreVideoState({cross:9}).cross,1);assert.equal(restoreVideoState({cross:-9}).cross,-1);
  assert.equal(restoreVideoState({cross:0}).cross,0);
  for(const cross of [NaN,Infinity,-Infinity,'0.5',{},null]) assert.equal(restoreVideoState({cross}).cross,0);
  assert.deepEqual([restoreVideoState({linked:false,auto:true}).linked,restoreVideoState({linked:false,auto:true}).auto],[false,true]);
  assert.deepEqual([restoreVideoState({linked:'false',auto:'true'}).linked,restoreVideoState({linked:'false',auto:'true'}).auto],[true,false]);
});
test('Semantic-link opt-in and treatment metadata preserve only supported own scalar values',()=>{
  for(const mediaTreatment of ['preserve','stretch','center-cut','letterbox']){
    const value={audioFXLink:true,mediaTreatment};
    const round=restoreVideoState(snapshotVideoState(value));
    assert.equal(round.audioFXLink,true);assert.equal(round.mediaTreatment,mediaTreatment);
  }
  for(const mediaTreatment of ['future',{},null,5])assert.equal(restoreVideoState({audioFXLink:'true',mediaTreatment}).mediaTreatment,'stretch');
  assert.equal(restoreVideoState({audioFXLink:'true'}).audioFXLink,false);
  assert.equal(restoreVideoState(Object.create({audioFXLink:true,mediaTreatment:'preserve'})).audioFXLink,false);
  let invoked=0;const hostile={};Object.defineProperty(hostile,'mediaTreatment',{get(){invoked++;return 'preserve';}});
  assert.equal(restoreVideoState(hostile).mediaTreatment,'stretch');assert.equal(invoked,0);
});
test('Recording resolution metadata preserves supported scalars without restoring runtime capture sessions',()=>{
  for(const recordingQuality of ['output','360p','480p','720p','1080p']){
    const restored=restoreVideoState(snapshotVideoState({recordingQuality,recorder:{active:true},captureCanvas:{}}));
    assert.equal(restored.recordingQuality,recordingQuality);assert(!('recorder' in restored));assert(!('captureCanvas' in restored));
  }
  for(const recordingQuality of ['unknown',480,{},null])assert.equal(restoreVideoState({recordingQuality}).recordingQuality,'output');
  assert.equal(restoreVideoState(Object.create({recordingQuality:'1080p'})).recordingQuality,'output');
  let invoked=0;const hostile={};Object.defineProperty(hostile,'recordingQuality',{get(){invoked++;return'1080p';}});
  assert.equal(restoreVideoState(hostile).recordingQuality,'output');assert.equal(invoked,0);
});
test('All55 defaults survive snapshots, remain detached and occupy only two ordered slots per target',()=>{
  assert.equal(videoEffectCatalog.length,55);
  for(const entry of videoEffectCatalog){
    const input={name:entry.name,...entry.default}, snapshot=snapshotVideoState({fx:{master:[input,input,input]}});
    assert.deepEqual(snapshot.fx.master[0],input);assert.equal(snapshot.fx.master.length,2);
    snapshot.fx.master[0].params.changed=true;assert(!('changed' in entry.default.params));assert(!('changed' in snapshot.fx.master[1].params));
  }
});
test('Unknown effects are disabled; runtime and undeclared parameters cannot become persistence fields',()=>{
  const runtime={};runtime.self=runtime;
  const snapshot=snapshotVideoState({generation:8,fx:{left:[{name:'Unknown',on:true,value:.3,params:{bytes:runtime}},effect('Filter',{mode:'Band Pass',radius:4,texture:runtime},.2)]},assets:runtime,files:runtime});
  assert.equal(snapshot.fx.left[0].name,'Filter');assert(!snapshot.fx.left[0].on);
  assert.deepEqual(snapshot.fx.left[1],effect('Filter',{mode:'Band Pass',radius:4},.2));
  assert(!('generation' in snapshot));assert(!('assets' in snapshot));assert(!('files' in snapshot));assert.doesNotThrow(()=>JSON.stringify(snapshot));
});
test('Corrupted FX values obey real individual ranges, enum fallbacks and integral panel policy',()=>{
  let restored=restoreVideoState(stateWith(effect('Filter',{mode:'anything',radius:-10},Infinity)));
  assert.deepEqual(restored.fx.left[0],effect('Filter',{mode:'Low Pass',radius:.1},.65));
  restored=restoreVideoState(stateWith(effect('Color Isolator',{hue:999,width:0,softness:1},-1)));
  assert.deepEqual(restored.fx.left[0],effect('Color Isolator',{hue:360,width:.001,softness:.5},0));
  assert.equal(restoreVideoState(stateWith(effect('Split',{panels:3.8}))).fx.left[0].params.panels,4);
  assert.deepEqual(restoreVideoState(stateWith(effect('Mirror',{axis:'Both'}))).fx.left[0].params,{axis:'Both'});
  assert.equal(restoreVideoState(stateWith(effect('Gamma',{gamma:'4'}))).fx.left[0].params.gamma,3);
});
test('Declared capture identity survives while object identity/generation state cannot persist',()=>{
  assert.equal(snapshotVideoState(stateWith(effect('Frame Freeze',{captureToken:123,generation:456}))).fx.left[0].params.captureToken,123);
  const params=snapshotVideoState(stateWith(effect('Frame Freeze',{captureToken:{canvas:true},generation:456}))).fx.left[0].params;
  assert.equal(params.captureToken,0);assert(!('generation' in params));
});
test('Scalar overlay metadata round-trips and runtime cyclic images, File-like objects and URL fields are absent',()=>{
  const bytes={};bytes.self=bytes;
  const input={id:'logo-9',name:'Logo',kind:'image',on:true,imageRef:'logo-9',image:bytes,file:bytes,url:'blob:local',bytes,generation:32,opacity:.4,x:.3,y:.7,scale:2,animation:'scroll-right-left',speed:2};
  const snapshot=snapshotVideoState({overlays:{master:[input]}}), persisted=JSON.parse(JSON.stringify(snapshot));
  assert(snapshot.overlays.master[0].on);assert(!('image' in snapshot.overlays.master[0]));
  for(const key of ['file','url','bytes','generation'])assert(!(key in snapshot.overlays.master[0]));
  const restored=restoreVideoState(persisted).overlays.master[0];
  assert.equal(restored.id,'logo-9');assert.equal(restored.imageRef,'logo-9');assert.equal(restored.opacity,.4);assert.equal(restored.animation,'scroll-right-left');assert(!restored.on);assert(!('image' in restored));
  assert.equal(input.on,true);
});
test('Text remains enabled and editable with existing helper geometry/text limits and no legacy defaults',()=>{
  const restored=restoreVideoState({overlays:{left:[{id:'caption',kind:'text',on:true,text:'A'.repeat(10001),fontFamily:'bad;family',color:'url(bad)',fontSize:999,x:-1,y:2,opacity:0,speed:0,scale:Infinity}]}}).overlays.left[0];
  assert(restored.on);assert.equal(restored.text.length,10000);assert.equal(restored.fontFamily,'sans-serif');assert.equal(restored.color,'#ffffff');
  assert.deepEqual([restored.fontSize,restored.x,restored.y,restored.opacity,restored.speed,restored.scale],[512,0,1,0,0,1]);
});
test('Image references reject resource URLs, object values and existing-helper oversize while retaining stable identifiers',()=>{
  for(const imageRef of ['blob:abc','data:image/png;base64,AAA',' https://host/img ',{bytes:true},'X'.repeat(4097)]){
    assert.equal(snapshotVideoState({overlays:{left:[{kind:'image',imageRef}]}}).overlays.left[0].imageRef,null);
  }
  assert.equal(snapshotVideoState({overlays:{left:[{kind:'image',imageRef:'local:asset-1'}]}}).overlays.left[0].imageRef,'local:asset-1');
});
test('No new overlay-count limit or sparse-array length traversal; non-record entries are dropped',()=>{
  const list=Array.from({length:151},(_,i)=>({id:'text-'+i,kind:'text',text:String(i)}));
  assert.equal(restoreVideoState({overlays:{left:list}}).overlays.left.length,151);
  const sparse=[];sparse.length=4000000000;sparse[3999999999]={kind:'text',text:'last'};
  assert.equal(restoreVideoState({overlays:{right:sparse}}).overlays.right[0].text,'last');
  assert.equal(restoreVideoState({overlays:{left:[null,'text',[],false,7,{}]}}).overlays.left.length,1);
});
test('Inherited metadata, prototype pollution payloads and accessors cannot enable or execute runtime values',()=>{
  let getterCalls=0;
  const input=Object.create({transition:'Melt',cross:1,overlays:{master:[{kind:'text',text:'inherited',on:true}]}});
  Object.defineProperty(input,'linked',{get(){getterCalls++;throw Error('getter');},enumerable:true});
  input.fx={left:[Object.create({name:'Flash On BPM',on:true}),Object.assign(Object.create({on:true}),{name:'Filter',params:Object.create({radius:24})})]};
  input.overlays={left:[{kind:'text',on:true,text:{toString(){throw Error('coercion');}},animation:{toString(){throw Error('coercion');}}}]};
  const result=restoreVideoState(input);
  assert.equal(getterCalls,0);assert.equal(result.transition,'Crossfade');assert.equal(result.cross,0);assert(result.fx.left.every(spec=>!spec.on));assert.equal(result.fx.left[1].params.radius,3);assert.equal(result.overlays.left[0].text,'');
  const payload=JSON.parse('{"__proto__":{"polluted":true},"fx":{"left":[{"name":"Filter","on":true,"params":{"__proto__":{"radius":24}}}]}}');
  assert.equal(restoreVideoState(payload).fx.left[0].params.radius,3);assert.equal({}.polluted,undefined);
});
test('Snapshot and restore produce fresh serializable data without mutating the source',()=>{
  const input={width:1280,height:720,fx:{left:[effect('Zoom',{scale:2,centerX:.25,centerY:.75})]},overlays:{right:[{id:'caption',kind:'text',on:true,text:'hello'}]}};
  const before=JSON.stringify(input),first=snapshotVideoState(input),second=snapshotVideoState(input);
  assert.deepEqual(first,second);first.fx.left[0].params.scale=7;first.overlays.right[0].text='edited';assert.equal(JSON.stringify(input),before);
  const saved=JSON.parse(JSON.stringify(second));assert.deepEqual(restoreVideoState(saved),second);
});
test('Media and transition flags persist separately without storing asset bytes or trusting inherited fields',()=>{
  const result=restoreVideoState(snapshotVideoState({media:{enabled:true,random:false,assets:[{file:new Blob(['private'])}]},transitionSelection:{enabled:false,random:true}}));
  assert.deepEqual(result.media,{enabled:true,random:false});
  assert.deepEqual(result.transitionSelection,{enabled:false,random:true});
  assert.equal(JSON.stringify(result).includes('private'),false);
  const inherited=Object.create({enabled:true,random:true});
  assert.deepEqual(restoreVideoState({media:inherited}).media,{enabled:false,random:false});
});
test('Frame Pulse legacy beat timing survives JSON restore without seconds taking precedence',()=>{
  const input=stateWith(effect('Frame Pulse',{periodBeats:.125}));
  const restored=restoreVideoState(JSON.parse(JSON.stringify(snapshotVideoState(input)))).fx.left[0];
  assert.equal(restored.params.periodBeats,.125);assert(!('periodSeconds' in restored.params));
  assert.equal(restoreVideoState(stateWith(effect('Frame Pulse',{periodBeats:99}))).fx.left[0].params.periodBeats,16);
  assert.equal(restoreVideoState(stateWith(effect('Frame Pulse',{periodBeats:'bad'}))).fx.left[0].params.periodBeats,1);
  const seconds=restoreVideoState(stateWith(effect('Frame Pulse',{periodBeats:2,periodSeconds:.5}))).fx.left[0];
  assert.equal(seconds.params.periodSeconds,.5);assert(!('periodBeats' in seconds.params));
});
test('Frame Pulse compatibility does not execute accessors or accept inherited timing',()=>{
  let calls=0;const params=Object.create({periodBeats:8});
  Object.defineProperty(params,'periodSeconds',{get(){calls++;throw Error('getter');}});
  const result=restoreVideoState(stateWith(effect('Frame Pulse',params))).fx.left[0];
  assert.equal(calls,0);assert.equal(result.params.periodSeconds,1);assert(!('periodBeats' in result.params));
});
test('Earlier Gamma/Smudge/UV saved presets migrate only at restore and survive repeated round trips',()=>{
  const prior={version:1,recordingQuality:'720p',fx:{left:[effect('Gamma',{gamma:.25},0,false),effect('Smudge',{angle:0})],right:[effect('Saturation',{saturation:0})],master:[effect('UV Paint',{})]}};
  const before=JSON.stringify(prior),restored=restoreVideoState(JSON.parse(before));
  for(const target of ['left','master'])for(const s of restored.fx[target])if(['Gamma','Smudge','UV Paint'].includes(s.name))assert.equal(s.params.behavior,'Earlier Open Play');
  assert.deepEqual([restored.fx.left[0].params.gamma,restored.fx.left[0].value,restored.fx.left[0].on],[.25,0,false]);
  assert.equal(restored.fx.left[1].params.angle,0);assert.equal(restored.fx.right[0].params.saturation,0);assert.equal(restored.recordingQuality,'720p');
  const round=restoreVideoState(JSON.parse(JSON.stringify(snapshotVideoState(restored))));assert.deepEqual(round,restored);assert.equal(JSON.stringify(prior),before);
  assert.equal(snapshotVideoState(stateWith(effect('Gamma',{gamma:3}))).fx.left[0].params.behavior,'Manual Meaning','Snapshot of a new runtime spec must not perform saved-record migration');
});
test('Fresh explicit modes survive restore and saturation old-missing versus fresh defaults stay distinct',()=>{
  for(const name of ['Gamma','Smudge','UV Paint']){
    const entry=videoEffectCatalog.find(e=>e.name===name),fresh={name,...entry.default},saved=snapshotVideoState(stateWith(fresh));
    assert.equal(restoreVideoState(saved).fx.left[0].params.behavior,'Manual Meaning');
    saved.fx.left[0].params.behavior='Earlier Open Play';assert.equal(restoreVideoState(saved).fx.left[0].params.behavior,'Earlier Open Play');
  }
  assert.equal(restoreVideoState(stateWith(effect('Saturation',{}))).fx.left[0].params.saturation,0);
  assert.equal(snapshotVideoState(stateWith(effect('Saturation',{}))).fx.left[0].params.saturation,2);
  assert.equal(restoreVideoState(stateWith(effect('Saturation',{saturation:0}))).fx.left[0].params.saturation,0);
});
test('Legacy mode and scalar migrations do not invoke getters, coercions or inherited controls',()=>{
  let calls=0;const params=Object.create({behavior:'Manual Meaning',gamma:8});
  for(const key of ['behavior','gamma','shadowPower'])Object.defineProperty(params,key,{get(){calls++;throw Error('getter');},enumerable:true});
  const result=restoreVideoState(stateWith(effect('Gamma',params))).fx.left[0];assert.equal(calls,0);assert.equal(result.params.behavior,'Earlier Open Play');assert.equal(result.params.gamma,3);
  const bad={toString(){calls++;throw Error('coercion');}},corrupt=restoreVideoState(stateWith(effect('UV Paint',{behavior:bad,colorThreshold:bad}))).fx.left[0];
  assert.equal(calls,0);assert.equal(corrupt.params.behavior,'Manual Meaning');assert.equal(corrupt.params.colorThreshold,.2);
});
test('Independent auto-crossfade seconds persist finite bounded scalars without executing accessors',()=>{
  for(const [input,expected] of [[0,.25],[.25,.25],[2.5,2.5],[10,10],[100,10],[-1,.25],[NaN,2.5],[Infinity,2.5],['3',2.5],[null,2.5]]){
    assert.equal(restoreVideoState(snapshotVideoState({autoCrossfadeSeconds:input})).autoCrossfadeSeconds,expected);
  }
  assert.equal(restoreVideoState(Object.create({autoCrossfadeSeconds:9})).autoCrossfadeSeconds,2.5);
  let calls=0;const hostile={};Object.defineProperty(hostile,'autoCrossfadeSeconds',{get(){calls++;throw Error('getter');}});
  assert.equal(restoreVideoState(hostile).autoCrossfadeSeconds,2.5);assert.equal(calls,0);
});
test('Separate video crossfader link persists literal booleans and falls back to the prior link flag',()=>{
  for(const [input,expected] of [[{},true],[{linked:false},false],[{linked:true},true],[{linked:true,crossLinked:false},false],[{linked:false,crossLinked:true},true],[{linked:false,crossLinked:'true'},false]]){
    const round=restoreVideoState(snapshotVideoState(input));assert.equal(round.crossLinked,expected);assert.equal(round.linked,typeof input.linked==='boolean'?input.linked:true);
  }
  assert.equal(restoreVideoState(Object.create({crossLinked:false,linked:false})).crossLinked,true);
  let calls=0;const hostile={linked:false};Object.defineProperty(hostile,'crossLinked',{get(){calls++;throw Error('getter');}});assert.equal(restoreVideoState(hostile).crossLinked,false);assert.equal(calls,0);
});
test('Channel opacity/link scalar pairs persist independently with legacy fallback and no accessor execution',()=>{
 const input={linked:false,crossLinked:true,channelOpacity:[0,.73],channelOpacityLinked:[true,false]};const round=restoreVideoState(snapshotVideoState(input));
 assert.deepEqual(round.channelOpacity,[0,.73]);assert.deepEqual(round.channelOpacityLinked,[true,false]);assert.equal(round.linked,false);assert.equal(round.crossLinked,true);
 assert.deepEqual(restoreVideoState({linked:false}).channelOpacityLinked,[false,false]);assert.deepEqual(restoreVideoState({}).channelOpacityLinked,[true,true]);
 let calls=0;const levels=[0];Object.defineProperty(levels,'1',{get(){calls++;throw Error('getter');}});const hostile={linked:false,channelOpacity:levels};Object.defineProperty(hostile,'channelOpacityLinked',{get(){calls++;throw Error('getter');}});
 const safe=restoreVideoState(hostile);assert.deepEqual(safe.channelOpacity,[0,1]);assert.deepEqual(safe.channelOpacityLinked,[false,false]);assert.equal(calls,0);
});
test('Old Isolator/Freeze/Analyzer presets retain earlier rendering and fresh finite controls persist without runtime captures',()=>{
 for(const name of ['Isolator Bass','Frame Freeze','Analyzer']){
  const old=restoreVideoState(stateWith(effect(name,{captureToken:0}))).fx.left[0];assert.equal(old.params.behavior,'Earlier Open Play');
  assert.deepEqual(restoreVideoState(snapshotVideoState(stateWith(old))).fx.left[0],old);
 }
 for(const [input,expected] of [[0,.05],[1,1],[99,16]]){
  const fresh=snapshotVideoState(stateWith(effect('Frame Freeze',{behavior:'Manual Meaning',captureToken:0,durationSeconds:input,captureTime:9,holdActive:true,holdExpired:false}))).fx.left[0];
  assert.equal(fresh.params.durationSeconds,expected);assert.equal(fresh.params.behavior,'Manual Meaning');
  for(const key of ['captureTime','holdActive','holdExpired'])assert(!(key in fresh.params));
 }
});
console.log(JSON.stringify({scope:'Executed pure metadata snapshots/restoration and corruption cases; browser persistence integration remains a separate parent check.',passed:checks.length,checks},null,2));
