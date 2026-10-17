// Independent actual-pipeline/actual-FX input and uniform test with controlled
// WebGL collaborators. No real shader compilation, image pixels or audio FFT.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createVideoEffects} from '../prototype/video-effects.js';
import {AudioEngine} from '../prototype/engine.js';
import {normalizeVideoContext} from '../prototype/video-effects-state.js';
import {normalizeSpectrum8,videoSpectrum8} from '../prototype/video-analysis.js';
import {restoreVideoState,snapshotVideoState} from '../prototype/video-state.js';
const traces=[];
function controlledCanvas(){
 const trace={uniforms:[],draws:0},constants=new Map();traces.push(trace);let next=1;
 const methods={createShader:()=>({}),getShaderParameter:()=>true,createProgram:()=>({}),getProgramParameter:()=>true,createBuffer:()=>({}),createTexture:()=>({}),createFramebuffer:()=>({}),getAttribLocation:()=>0,getUniformLocation:(_,name)=>name,getError:()=>0,isContextLost:()=>false,getExtension:()=>({loseContext(){}}),drawArrays(){trace.draws++;},uniform1fv(name,value){trace.uniforms.push({name,value:[...value]});},uniform4fv(name,value){trace.uniforms.push({name,value:[...value]});}};
 const gl=new Proxy(methods,{get(target,key){if(key in target)return target[key];if(typeof key==='string'&&key===key.toUpperCase()){if(key==='NO_ERROR')return 0;if(!constants.has(key))constants.set(key,next++);return constants.get(key);}return()=>{};}});
 methods.checkFramebufferStatus=()=>gl.FRAMEBUFFER_COMPLETE;
 const c={width:16,height:16,getContext:()=>gl,addEventListener(){},removeEventListener(){}};return c;
}
globalThis.document={createElement(type){assert.equal(type,'canvas');return controlledCanvas();}};
globalThis.__spectrumReviewEffects=()=>createVideoEffects({width:16,height:16});
globalThis.__spectrumReviewIdentity=()=>({render:source=>source,reset(){},dispose(){},diagnostics:()=>({})});
let source=await readFile(new URL('../prototype/video-pipeline.js',import.meta.url),'utf8');
source=source.replace("import { createVideoEffects } from './video-effects.js';",'const createVideoEffects=()=>globalThis.__spectrumReviewEffects();');
for(const name of ['createVideoTransitions','createVideoOverlays','createVideoAudioFX'])source=source.replace(new RegExp(`import \\{ ${name} \\} from '[^']+';`),`const ${name}=()=>globalThis.__spectrumReviewIdentity();`);
assert(!source.includes('import '),'All pipeline imports must be deliberately replaced');
const {createVideoPipeline}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const pipeline=createVideoPipeline({width:16,height:16}),inputs=[{width:16,height:16},{width:16,height:16}],fx={name:'Analyzer',on:true,value:1},settings={fx:{left:[fx],right:[fx],master:[fx]}},checks=[];
function test(name,run){run();checks.push({name,passed:true});}
let reads=0;const hostile=()=>{const x={};Object.defineProperty(x,'spectrum8',{enumerable:true,get(){reads++;throw Error('must not read spectrum accessor');}});return x;};
function missing(target){const d=pipeline.diagnostics().effects[target];assert.equal(d.spectrum8Available,false);assert.equal(d.slots[0].reason,'spectrum8-unavailable');assert.equal(d.slots[0].sourceBypass,true);}
test('Actual pipeline and actual FX reject channel/master spectrum getters without invoking them',()=>{pipeline.render(inputs,settings,{channels:[hostile(),hostile()],master:hostile()});for(const target of ['left','right','master'])missing(target);assert.equal(reads,0);});
test('Root, channels-array and master-record getters are omitted before any spread or normalization',()=>{for(const key of ['channels','master']){const root={};Object.defineProperty(root,key,{enumerable:true,get(){reads++;throw Error('root getter');}});pipeline.render(inputs,settings,root);for(const target of ['left','right','master'])missing(target);}const channels=[];Object.defineProperty(channels,'0',{enumerable:true,get(){reads++;throw Error('array getter');}});pipeline.render(inputs,settings,{channels});missing('left');assert.equal(reads,0);});
test('Actual pipeline/FX uniform upload keeps all eight values in order per target with no three-band synthesis',()=>{const vectors=[[.1,.2,.3,.4,.5,.6,.7,.8],[.8,.7,.6,.5,.4,.3,.2,.1],[0,.125,.25,.375,.5,.625,.75,1]];pipeline.render(inputs,settings,{channels:[{spectrum8:vectors[0],bass:1,mid:1,treble:1},{spectrum8:vectors[1]}],master:{spectrum8:vectors[2]}});for(const [i,target]of ['left','right','master'].entries()){const d=pipeline.diagnostics().effects[target];assert(d.spectrum8Available);assert.equal(d.slots[0].reason,null);assert.equal(d.slots[0].sourceBypass,false);assert.deepEqual(traces[i].uniforms.filter(u=>u.name==='spectrum8[0]').at(-1).value,vectors[i]);assert.deepEqual(traces[i].uniforms.filter(u=>u.name==='p').at(-1).value,[120,1,1,0]);}});
test('Valid silent zeros remain available; absent spectrum with coarse bands stays diagnosed bypass',()=>{pipeline.render(inputs,settings,{channels:[{spectrum8:Array(8).fill(0),bass:1,mid:1,treble:1},{bass:1,mid:1,treble:1}],master:{spectrum8:Array(8).fill(0)}});assert(pipeline.diagnostics().effects.left.spectrum8Available);assert(!pipeline.diagnostics().effects.left.slots[0].sourceBypass);missing('right');assert(pipeline.diagnostics().effects.master.spectrum8Available);});
test('Accessor vector element and inherited spectrum are rejected without execution at assembled boundary',()=>{const vector=Array(8).fill(0);Object.defineProperty(vector,'2',{get(){reads++;throw Error('vector getter');}});pipeline.render(inputs,settings,{channels:[{spectrum8:vector},Object.create({spectrum8:Array(8).fill(1)})]});missing('left');missing('right');assert.equal(reads,0);});
test('Earlier restored Analyzer stays three-band mode with no unavailable-eight-vector warning',()=>{const old=restoreVideoState({version:1,fx:{left:[{name:'Analyzer',on:true,value:1,params:{}}]}}).fx.left[0];assert.equal(old.params.behavior,'Earlier Open Play');assert.deepEqual(restoreVideoState(snapshotVideoState({fx:{left:[old]}})).fx.left[0],old);pipeline.render(inputs,{fx:{left:[old]}},{channels:[{bass:1,mid:0,treble:0}]});const d=pipeline.diagnostics().effects.left;assert.equal(d.slots[0].reason,null);assert.equal(d.slots[0].sourceBypass,false);assert.equal(traces[0].uniforms.filter(u=>u.name==='p').at(-1).value[3],1);});
test('Pure isolated FFT bins retain independently assigned noncoarse band identity',()=>{const data=new Float32Array(24000).fill(-Infinity);for(const hz of[30,80,180,300,700,1500,3000,8000])data[hz]=-20;const vector=videoSpectrum8(data,48000,48000);assert(vector.every(n=>Math.abs(n-.1)<1e-9));assert.deepEqual(normalizeSpectrum8(Array(8).fill(0)),Array(8).fill(0));assert.equal(normalizeVideoContext({bass:1,mid:1,treble:1}).spectrum8,null);});
test('Actual uninitialized AudioEngine returns unavailable without creating an AudioContext',()=>{const engine=new AudioEngine();assert.deepEqual(engine.videoAnalysis(0),{bass:0,mid:0,treble:0,level:0,audioAvailable:false,spectrum8:null,spectrum8Available:false});assert.equal(engine.ctx,null);});
pipeline.dispose();assert.equal(reads,0);
console.log(JSON.stringify({scope:'Actual pipeline + actual FX normalization/diagnostics/uniform calls with controlled no-op WebGL; no actual shader pixels, FFT audio, UI or vendor parity.',passed:checks.length,checks,accessorsCalled:reads},null,2));
