// Actual harness analyzers and capture producer; controlled PCM/clock below.
// No browser event scheduling, speaker route or production return acceptance.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {shadowEnvelope,shadowFixtureSample,inspectShadowReturn,correlateShadowCursor,
  createShadowCaptureProcessor,validateShadowCapture,shadowCases} from '../prototype/keylock-shadow-return-harness.js';
const sr=48000,checks=[];
async function check(name,run){const evidence={};try{await run(evidence);checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,evidence,error:error.stack});}}
function analytic({offset=0,hz=880,silence=0,flat=false,periodic=false}={}){
  const length=Math.round(sr*.7),releaseTime=.05,endPosition=2.4,left=new Float32Array(length),right=new Float32Array(length);
  for(let i=0;i<length;i++){const t=i/sr,relative=t-releaseTime,p=endPosition+1.08*relative+offset;
    if(relative>=silence){left[i]=.12*Math.sin(2*Math.PI*hz*t);right[i]=(flat?.1:periodic?.09+.03*Math.sin(2*Math.PI*10*p):shadowEnvelope(p))*Math.sin(2*Math.PI*1320*t);}}
  return{left,right,sampleRate:sr,firstTime:0,releaseTime,endPosition,alignmentACK:{position:endPosition+1.08*.04,when:releaseTime+.04}};
}
const compact=m=>({passed:m.passed,criteria:m.criteriaPassed,cursor:{position:m.cursor.position,ideal:m.cursor.idealPosition,error:m.cursor.errorFromIdealSeconds,score:m.cursor.score,margin:m.cursor.margin},initialGapSeconds:m.initialGapSeconds,firstCorrectSeconds:m.firstCorrectSeconds});
await check('Exact analyzer accepts known non-periodic correct cursor/pitch without an ACK-only position pass',e=>{const m=inspectShadowReturn(analytic());assert(m.passed,JSON.stringify(compact(m)));assert(Math.abs(m.cursor.errorFromIdealSeconds)<.002);e.result=compact(m);});
await check('Correct pitch and plausible ACK cannot hide a wrong original cursor',e=>{const m=inspectShadowReturn(analytic({offset:.18}));assert(m.criteriaPassed.settledPitch);assert(!m.criteriaPassed.cursorWithin10msOfIdeal);assert(!m.passed);assert(Math.abs(m.cursor.errorFromIdealSeconds-.18)<.003);e.result=compact(m);});
await check('Wrong/raw pitch and40ms silence retain strict30ms/20ms failures',e=>{const raw=inspectShadowReturn(analytic({hz:475.2})),silent=inspectShadowReturn(analytic({silence:.04}));assert(!raw.criteriaPassed.settledPitch&&raw.rawPitchWindows>0&&!raw.passed);assert(!silent.criteriaPassed.initialGapWithin20ms&&!silent.passed);assert(silent.initialGapSeconds>=.039);e.raw=compact(raw);e.silence=compact(silent);});
await check('Silent/flat or periodic10Hz marker cannot manufacture a unique source cursor',e=>{const flat=inspectShadowReturn(analytic({flat:true})),periodic=inspectShadowReturn(analytic({periodic:true})),zero=analytic();zero.left.fill(0);zero.right.fill(0);const silent=inspectShadowReturn(zero);assert(!flat.cursor.confident&&!flat.passed);assert(!periodic.cursor.confident&&!periodic.passed);assert(!silent.passed&&silent.cursor.position===null);e.confidence={flat:flat.cursor.confident,periodic:periodic.cursor.confident,silent:silent.cursor.confident};});
await check('Direct end-position-at+40ms ACK exposes its43.2ms original-time lag against ideal clock',e=>{const input=analytic({offset:-1.08*.04});input.alignmentACK.position=input.endPosition;const m=inspectShadowReturn(input);assert(Math.abs(m.cursor.ackVsIdealSeconds+.0432)<1e-9);assert(Math.abs(m.cursor.errorFromACKSeconds)<.003);assert(!m.criteriaPassed.cursorWithin10msOfIdeal);e.result=compact(m);e.ackLag=m.cursor.ackVsIdealSeconds;});
await check('Exact producer preserves full stereo PCM/preflight64/fences and zeros every physical output',e=>{
  const events=[];let frame=0;class Base{constructor(){this.port={onmessage:null,postMessage:data=>events.push(data)};}}
  const Processor=createShadowCaptureProcessor(Base,()=>frame),p=new Processor(),process=()=>{const input=[[new Float32Array(128).fill(.1),new Float32Array(128).fill(.2)]],output=[[new Float32Array(128).fill(1),new Float32Array(128).fill(1)]];const result=p.process(input,output);assert(output[0].every(c=>c.every(v=>v===0)));frame+=128;return result;};
  p.port.onmessage({data:{type:'preflight',id:'p'}});for(let i=0;i<64;i++)process();const preflight=events.find(x=>x.type==='preflight');assert.equal(preflight.rows.length,64);
  p.port.onmessage({data:{type:'arm',id:'a'}});process();process();p.port.onmessage({data:{type:'finish',id:'f'}});assert.equal(process(),false);
  const target={preflight,arm:events.find(x=>x.type==='armed'),fence:events.find(x=>x.type==='finished'),blocks:events.filter(x=>x.type==='pcm')},m=validateShadowCapture(target);assert(m.passed);assert.equal(m.frames,384);assert.equal(target.blocks[0].channels[0][0],Math.fround(.1));assert.equal(target.blocks[0].channels[1][0],Math.fround(.2));
  target.blocks[1].frame-=128;const bad=validateShadowCapture(target);assert(!bad.passed&&bad.errors.length>0);target.blocks[1].frame+=128;target.blocks[1].inputChannels=0;assert(!validateShadowCapture(target).passed);target.blocks[1].inputChannels=2;
  target.blocks[1].channels[0][0]=NaN;assert(!validateShadowCapture(target).passed);target.blocks[1].channels[0][0]=Math.fround(.1);
  target.fence.lastFrame+=128;assert(!validateShadowCapture(target).passed);target.fence.lastFrame-=128;
  assert.throws(()=>validateShadowCapture({...target,blocks:[]}),/empty/);
  assert.throws(()=>validateShadowCapture({...target,preflight:{consecutive:64,rows:preflight.rows.slice(1)}}),/producer rows/);
  preflight.rows[20].inputChannels=0;assert.throws(()=>validateShadowCapture(target),/stereo/);preflight.rows[20].inputChannels=2;
  assert(validateShadowCapture(target).passed);Object.assign(e,{fullFrames:m.frames,retainedRows:m.rows.length,preflightRows:preflight.rows.length,rejected:['armed duplicate frame','missing armed stereo','nonfinite PCM','wrong final fence','empty armed capture','claimed64 with63 rows','missing preflight stereo']});
});

// Unchanged actual WASM and exact frozen adapter in a serial Node port/gain host.
// This yields a nonvacuous measured control, not real-browser deadline evidence.
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class SourceBuffer{constructor({length,numberOfChannels=2,sampleRate=sr}){Object.assign(this,{length,numberOfChannels,sampleRate,duration:length/sampleRate});this.data=Array.from({length:numberOfChannels},()=>new Float32Array(length));}getChannelData(c){if(!(this instanceof SourceBuffer))throw TypeError('AudioBuffer brand');return this.data[c];}}
globalThis.AudioBuffer=SourceBuffer;let Processor;globalThis.sampleRate=sr;globalThis.currentTime=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.port={onmessage:null,postMessage:data=>queueMicrotask(()=>this.bridge?.(data))};}};
globalThis.registerProcessor=(name,C)=>Processor=C;await import('../prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs?shadow-controlled-host');delete globalThis.AudioWorkletProcessor;delete globalThis.registerProcessor;
class Param{constructor(){this.value=1;this.events=[];}cancelScheduledValues(t){this.events=this.events.filter(e=>e.t<t);}setValueAtTime(v,t){this.events.push({v,t,ramp:false});}linearRampToValueAtTime(v,t){this.events.push({v,t,ramp:true});}at(t){let previous={v:this.value,t:0};for(const event of this.events.toSorted((a,b)=>a.t-b.t)){if(event.t>t){if(event.ramp)return previous.v+(event.v-previous.v)*(t-previous.t)/(event.t-previous.t);break;}previous=event;}return previous.v;}}
class Gain{constructor(){this.gain=new Param();this.connections=[];}connect(target){this.connections.push(target);return target;}disconnect(){this.connections=[];}}
class NodeHost extends EventTarget{constructor(ctx,name,options){super();if(!ctx.loaded)throw Error('Not loaded');this.processor=new Processor(options);this.connections=[];this.channels=options.outputChannelCount[0];this.port={onmessage:null,close(){},postMessage:data=>queueMicrotask(()=>this.processor.port.onmessage({data}))};this.processor.bridge=data=>queueMicrotask(()=>this.port.onmessage?.({data}));ctx.nodes.push(this);}connect(target){this.connections.push(target);}disconnect(){this.connections=[];}}
globalThis.AudioWorkletNode=NodeHost;
class Context{constructor(){this.sampleRate=sr;this.currentTime=0;this.loaded=false;this.nodes=[];this.audioWorklet={addModule:async()=>this.loaded=true};}createGain(){return new Gain();}}
const {createExperimentalLiveKeylock}=await import('../prototype/keylock-live-lead-experiment.js');
const {createShadowFollowKeylock}=await import('../prototype/keylock-shadow-follow-experiment.js');
function render(ctx,adapter,end,gate=null){const first=Math.round(ctx.currentTime*sr/128)*128,last=Math.ceil(end*sr/128)*128,left=[],right=[];
  for(let frame=first;frame<last;frame+=128){ctx.currentTime=frame/sr;globalThis.currentTime=ctx.currentTime;const sum=[new Float32Array(128),new Float32Array(128)];for(const node of ctx.nodes){if(node.terminal)continue;const out=[[new Float32Array(128),new Float32Array(128)]];node.terminal=node.processor.process([[]],out,{})===false;for(const gain of node.connections)for(const bus of gain.connections)if(bus===adapter.outputs[0])for(let c=0;c<2;c++)for(let i=0;i<128;i++)sum[c][i]+=out[0][c][i]*gain.gain.at((frame+i)/sr)*bus.gain.at((frame+i)/sr)*(gate?gate.at((frame+i)/sr):1);}left.push(...sum[0]);right.push(...sum[1]);}ctx.currentTime=last/sr;return{left:Float32Array.from(left),right:Float32Array.from(right),firstTime:first/sr};}
await check('Actual WASM steady control reports cursor correlation accuracy rather than trusting scheduled position',async e=>{
  const ctx=new Context(),buffer=new SourceBuffer({length:sr*16});for(let c=0;c<2;c++)for(let i=0;i<buffer.length;i++)buffer.data[c][i]=shadowFixtureSample(i/sr,c);
  const adapter=await createExperimentalLiveKeylock(ctx,{buffers:[buffer],position:2.4,rate:1.08,keylock:true,semitones:12,experimentalLeadSeconds:.04});
  try{const ack=await adapter.start({position:2.4,when:.3});render(ctx,adapter,.8);const release=ctx.currentTime,endPosition=adapter.position(),input=render(ctx,adapter,ctx.currentTime+.7),m=inspectShadowReturn({...input,sampleRate:sr,releaseTime:release,endPosition,alignmentACK:{position:endPosition,when:release}});assert(m.criteriaPassed.settledPitch,'Actual WASM did not render target pitch');assert(m.cursor.confident&&m.criteriaPassed.cursorWithin10msOfIdeal,'Steady actual-WASM barcode oracle failed its10ms control');e.result=compact(m);e.oracleAccurate=true;e.note='Already-active steady control validates oracle at this fixture, not browser return acceptance.';
  }finally{await adapter.dispose();}
});
await check('Actual unchanged WASM stationary active-shadow experiment records all strict release results',async e=>{
  const ctx=new Context(),buffer=new SourceBuffer({length:sr*16}),events=[];for(let c=0;c<2;c++)for(let i=0;i<buffer.length;i++)buffer.data[c][i]=shadowFixtureSample(i/sr,c);
  const adapter=await createExperimentalLiveKeylock(ctx,{buffers:[buffer],position:2.4,rate:1.08,keylock:true,semitones:12,experimentalLeadSeconds:.04,onEvent:event=>events.push(event)}),gate=new Param();gate.value=0;
  try{await adapter.start({position:2.4,when:.3});render(ctx,adapter,.6,gate);const held=[],follow=[];for(let i=0;i<40;i++){follow.push(await adapter.seek(2.4));const part=render(ctx,adapter,ctx.currentTime+.025,gate);held.push(...part.left);}assert(held.every(s=>s===0),'Controlled external gate did not mute');
    const releaseTime=ctx.currentTime,endPosition=2.4;gate.setValueAtTime(0,releaseTime);gate.linearRampToValueAtTime(1,releaseTime+.003);const ack=await adapter.seek(endPosition+1.08*.04),input=render(ctx,adapter,ctx.currentTime+.7,gate),m=inspectShadowReturn({...input,sampleRate:sr,releaseTime,endPosition,alignmentACK:ack});assert(m.criteriaPassed.settledPitch,'Actual active shadow never returned shifted audio');assert(m.cursor.position!==null,'Actual returned PCM has no measured cursor');e.strictExperimentPassed=m.passed;e.result=compact(m);e.followCommands=follow.length;e.processorGroupsCreated=events.filter(x=>x.type==='preparing').length;e.note='A false strictExperimentPassed is retained negative feasibility evidence, not a passing return. Serial controlled host excludes actual browser timings/gain scheduling.';
  }finally{await adapter.dispose();}
});
async function exerciseRetention(factory){
  const ctx=new Context(),buffer=new SourceBuffer({length:sr*16}),events=[];
  const adapter=await factory(ctx,{buffers:[buffer],position:2.4,rate:1.08,keylock:true,semitones:12,experimentalLeadSeconds:.04,onEvent:event=>events.push(event)});
  const driverTurn=()=>new Promise(resolve=>setTimeout(resolve,65));
  try{
    await adapter.start({position:2.4,when:.3});render(ctx,adapter,.62);await driverTurn();
    const warm=adapter.snapshot(),steps=[];
    for(const position of [2.4,2.35,2.3,2.25,2.2,2.15,2.1,2.05,2,1.95,1.9]){
      const ack=await adapter.seek(position);render(ctx,adapter,ctx.currentTime+.05);await driverTurn();
      steps.push({position,ackGroup:ack.group,snapshot:adapter.snapshot()});
    }
    const groupsCreated=events.filter(event=>event.type==='preparing').length,preparations=events.filter(event=>event.type==='preparing'),beforeCoverageProbe=adapter.snapshot();
    const probe=await adapter.seek(.9);render(ctx,adapter,ctx.currentTime+.05);await driverTurn();
    return{warm,steps,groupsCreated,preparations,requiredCoverageProbe:{position:.9,before:beforeCoverageProbe,ack:probe,after:adapter.snapshot()}};
  }finally{await adapter.dispose();}
}
await check('Actual adapter normal driver retains required backward history across warm/hold/follow',async e=>{
  e.baseline=await exerciseRetention(createExperimentalLiveKeylock);
  assert(e.baseline.groupsCreated>1,'Baseline driver/drop defect was not reproduced');
  assert.equal(e.baseline.warm.groups[0].start,1.5);assert.equal(e.baseline.warm.groups[0].origin,1);
  e.shadow=await exerciseRetention(createShadowFollowKeylock);
  assert.equal(e.shadow.groupsCreated,1,'One-group requirement fails after the normal driver drops still-required preroll');
  assert(e.shadow.steps.every(step=>step.ackGroup===1&&step.snapshot.groups.length===1));
  assert.equal(e.shadow.warm.policy.requiredPrerollSeconds,1);assert.equal(e.shadow.warm.policy.retentionPrerollSeconds,2);assert.equal(e.shadow.warm.policy.retentionHysteresisSeconds,1);
  assert.equal(e.shadow.warm.groups[0].origin,0);assert.equal(e.shadow.warm.groups[0].start,.5);
  assert.equal(e.shadow.warm.retainedPCMBytes-e.baseline.warm.retainedPCMBytes,sr*2*4);
  assert.equal(e.shadow.warm.retainedPCMBytes,4032000);
  const probe=e.shadow.requiredCoverageProbe;assert(probe.before.groups[0].start<=probe.position,'Probe cursor itself must remain in retained source PCM');
  assert(probe.position-1<probe.before.groups[0].start,'Probe must lack full required1s history');assert.equal(probe.ack.group,2,'Required history must still trigger genuine out-of-coverage replacement');
});
const hash=async path=>createHash('sha256').update(await readFile(new URL(path,import.meta.url))).digest('hex');
const result={passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,expectedBrowserCases:shadowCases.length,expectedIndependentBrowserCalibrations:1,expectedFullRawCaptures:1+2*shadowCases.length,
  harnessSHA256:await hash('../prototype/keylock-shadow-return-harness.js'),shadowFollowAdapterSHA256:await hash('../prototype/keylock-shadow-follow-experiment.js'),initialHarnessSHA256:await hash('../prototype/keylock-shadow-return-harness-initial.js'),
  adapterSHA256:await hash('../prototype/keylock-live-lead-experiment.js'),vendorSHA256:await hash('../prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs'),checks,
  scope:'Actual exported analyzer/capture producer with analytic adversarial inputs plus unchanged WASM/exact adapter in a controlled serial Node host. No actual browser capture/scheduling, listening quality, native integration or shadow-return acceptance.'};
console.log(JSON.stringify(result,null,2));assert.equal(result.failed,0);
