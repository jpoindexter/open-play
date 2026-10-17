import assert from 'node:assert/strict';
import {normalizeVideoOpacityState,effectiveVideoOpacity,videoOpacityIndex} from '../prototype/video-opacity.js';
const checks=[];function test(name,fn){fn();checks.push({name,passed:true});}
test('Old combined link preserves both historical gain policies once',()=>{
 for(const linked of [false,true]){
  const state=normalizeVideoOpacityState({linked});assert.deepEqual(state.channelOpacity,[1,1]);assert.deepEqual(state.channelOpacityLinked,[linked,linked]);
  assert.deepEqual(effectiveVideoOpacity({linked},[.2,.8]),linked?[.2,.8]:[1,1]);
 }
});
test('Each manual gain and link flag is independent from playback and crossfade',()=>{
 const v={linked:false,crossLinked:true,channelOpacity:[.3,.7],channelOpacityLinked:[false,true]};
 assert.deepEqual(effectiveVideoOpacity(v,[.9,.1]),[.3,.1]);v.linked=true;v.crossLinked=false;assert.deepEqual(effectiveVideoOpacity(v,[.9,.1]),[.3,.1]);
 v.channelOpacityLinked=[true,false];assert.deepEqual(effectiveVideoOpacity(v,[.9,.1]),[.9,.7]);
});
test('Manual/audio values clamp, literal zero/false survive, no numeric coercion',()=>{
 assert.deepEqual(normalizeVideoOpacityState({channelOpacity:[0,2],channelOpacityLinked:[false,false]}),{channelOpacity:[0,1],channelOpacityLinked:[false,false]});
 assert.deepEqual(effectiveVideoOpacity({channelOpacityLinked:[true,true]},[-1,9]),[0,1]);
 for(const bad of ['.5',NaN,Infinity,{},null])assert.deepEqual(normalizeVideoOpacityState({linked:false,channelOpacity:[bad,bad]}).channelOpacity,[1,1]);
});
test('Root/array accessors, prototypes, sparse entries and coercion hooks cannot run',()=>{
 let calls=0;const hostile={toString(){calls++;throw Error('coercion');}},levels=[hostile];
 Object.defineProperty(levels,'1',{get(){calls++;throw Error('getter');}});const v={linked:false,channelOpacity:levels};
 Object.defineProperty(v,'channelOpacityLinked',{get(){calls++;throw Error('getter');}});
 assert.deepEqual(normalizeVideoOpacityState(v),{channelOpacity:[1,1],channelOpacityLinked:[false,false]});
 assert.deepEqual(normalizeVideoOpacityState(Object.create({linked:false,channelOpacity:[0,0]})),{channelOpacity:[1,1],channelOpacityLinked:[true,true]});
 const links=[];links.length=2;assert.deepEqual(normalizeVideoOpacityState({linked:false,channelOpacityLinked:links}).channelOpacityLinked,[false,false]);
 assert.equal(calls,0);
});
test('Output snapshots are detached and only exact deck indices are valid',()=>{
 const v={channelOpacity:[.2,.4],channelOpacityLinked:[false,true]},a=normalizeVideoOpacityState(v);a.channelOpacity[0]=1;a.channelOpacityLinked[1]=false;
 assert.deepEqual(v.channelOpacity,[.2,.4]);assert.deepEqual(v.channelOpacityLinked,[false,true]);
 for(const good of [0,1])assert.equal(videoOpacityIndex(good),good);for(const bad of ['0',-1,2,NaN,null])assert.throws(()=>videoOpacityIndex(bad),RangeError);
});
console.log(JSON.stringify({scope:'Executed pure own-data opacity policies; actual mixer/pixels/UI require separate browser checks.',passed:checks.length,checks},null,2));
