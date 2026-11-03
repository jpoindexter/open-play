import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createStemWaveformModel} from './stem-waveform.js';
import {refreshSyncPresentation} from './sync-presentation.js';
import {hasBeatgrid} from './smart-sync.js';

const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const queue=source.slice(source.indexOf('function cancelAnalysis('),source.indexOf('\nfunction analyze('));
const view=source.slice(source.indexOf('function waveformView('),source.indexOf('\nfunction changeDetailWaveZoom('));
const drawing=source.slice(source.indexOf('function drawWaves('),source.indexOf('\nfunction drawDetailWave('));
const tick=source.slice(source.indexOf('function tick() {'),source.indexOf('\nrenderCrates();',source.indexOf('function tick() {')));

// Actual queue, view/model, overview and full frame functions; endpoints are controlled, not DOM/audio.
function fixture(){
 const tracks=Array.from({length:4},(_,i)=>({id:'track-'+i,title:'Track '+i,bpm:null,key:null,grid:null,duration:30,cues:[],metadataSources:{}}));
 const state={analysis:false,analysisSettings:{},settings:{'Reduced Motion':true},deckCount:4,focus:0,decks:tracks.map((track,index)=>({index,track,rate:1,playing:false,mode:'INT'}))};
 const calls={library:0,persist:0,gain:0,analysis:[],notices:[],status:[],frames:[]},geometry=[],painted=[];
 const control={focused:true,pointer:7},document={activeElement:control,querySelector:()=>null};
 const canvases=tracks.map((_,index)=>({attrs:new Map(),getBoundingClientRect(){geometry.push(index);return{width:400,height:60};},setAttribute(k,v){this.attrs.set(k,v);}}));
 const labels=tracks.map(()=>({textContent:''})),meters=new Map(['#master-meter','#master-peak-value','#master-limit','#audio-status'].map(id=>[id,{textContent:'',getAttribute:()=>null,setAttribute(){},classList:{toggle(){}}}]));
 const engine={buffers:new Map(tracks.map(t=>[t.id,{id:t.id}])),stemBuffers:new Map(),stemStates:new Map(),voices:new Map(),position:()=>0,masterSnapshot:()=>({displayDB:-120,limiting:false}),updateFXBPMs(){}};
 engine.buffer=async track=>engine.buffers.get(track.id);
 let analyze=async()=>({bpm:126,key:'Cm',grid:{firstBeat:.2}});
 const scope={hasBeatgrid,syncMaster:{master:()=>null,manual:()=>false},isSimpleSyncPending:()=>false,state,engine,document,analysisQueue:[],analysisController:null,analysisJob:null,AbortController,DOMException,sourceWaveLoads:new WeakSet(),overviewWaveViews:[],stemWaveforms:tracks.map(()=>createStemWaveformModel()),colors:['red','blue','green','orange'],
  analyzeBuffer:(buffer,options)=>{calls.analysis.push(buffer.id);return analyze(buffer,options);},trackGain:{measurementReady(){calls.gain++;}},smartSync:{reconcile(){}},
  persist(){calls.persist++;},renderTracks(){calls.library++;},refreshAnalysisControls(){},renderDecks(){assert.fail('Analysis must retain deck controls');},
  updateAnalysisStatus(message){state.analysisStatus=message;calls.status.push(message);},notify:message=>calls.notices.push(message),
  prepareWaveCanvas:(canvas)=>({width:400,height:60,context:{clearRect(){painted.push(canvases.indexOf(canvas));},fillRect(){}}}),paintSourceOverview:()=>null,
  $:selector=>{const wave=/^#wave-(\d)$/.exec(selector),label=/^\[data-wave-scope="(\d)"\]$/.exec(selector);return wave?canvases[+wave[1]]:label?labels[+label[1]]:meters.get(selector)||null;},
  drawDetailWave(){},refreshTransportControls(){},refreshSyncPresentation:(d,options)=>refreshSyncPresentation(d,options,document),updateTempoSlider(){},shownDeckBPM:()=> '—',deckBPM:()=>null,time:String,
  flipAutomation:{tick(){}},panels:{tick(){}},stemSlipControls:{tick(){}},deckScratchControls:{tick(){}},requestAnimationFrame:fn=>calls.frames.push(fn)};
 vm.createContext(scope);vm.runInContext(queue+'\n'+view+'\n'+drawing+'\n'+tick,scope);
 return{scope,state,engine,tracks,calls,geometry,painted,labels,canvases,control,document,setAnalyze:fn=>{analyze=fn;},
  reset(){geometry.length=0;painted.length=0;},warm(){scope.drawWaves();geometry.length=0;painted.length=0;}};
}
function terminal(f){assert.equal(f.state.analysis,false);assert.equal(f.scope.analysisController,null);assert.equal(f.calls.notices.length,1);assert.equal(f.document.activeElement,f.control);assert.equal(f.control.pointer,7);}
function expectOwners(f,owners){assert.deepEqual(f.geometry,owners,'Only completed-result owners should need overview geometry');assert.deepEqual(f.painted,owners,'Queue terminal status must not repaint unrelated overviews');}

test('queued success refreshes duplicate visible owners before an unloaded job finishes, without terminal repaint',async()=>{
 const f=fixture(),[a,b]=f.tracks;f.state.deckCount=2;f.state.decks[1].track=a;f.state.decks[3].track=a;f.warm();
 let release,started;const gate=new Promise(resolve=>{release=resolve;}),second=new Promise(resolve=>{started=resolve;});
 f.setAnalyze(async buffer=>{if(buffer.id===b.id){started();await gate;}return{bpm:126,key:'Cm',grid:{firstBeat:.2}};});
 const pending=f.scope.enqueueAnalysis([a,b]);await second;
 assert.equal(f.labels[0].textContent,'Decoded waveform · 126.0 BPM');assert.equal(f.labels[1].textContent,'Decoded waveform · 126.0 BPM');expectOwners(f,[0,1]);
 release();await pending;terminal(f);assert(a.analyzed&&b.analyzed);assert.equal(f.calls.library,2);assert.equal(f.calls.persist,2);assert.equal(f.calls.gain,2);expectOwners(f,[0,1]);
});
test('successful unloaded analysis commits its result without terminal deck geometry',async()=>{
 const f=fixture(),unloaded={...f.tracks[0],id:'unloaded',metadataSources:{}};f.engine.buffers.set(unloaded.id,{id:unloaded.id});f.warm();
 await f.scope.enqueueAnalysis([unloaded]);terminal(f);assert.equal(unloaded.key,'Cm');assert.equal(f.calls.library,1);assert.match(f.state.analysisStatus,/Finished: 1 measured, 0 failed/);expectOwners(f,[]);
});
test('failed analysis with unchanged buffer selection preserves metadata and reports failure without redraw',async()=>{
 const f=fixture(),a=f.tracks[0];f.warm();f.setAnalyze(async()=>{throw Error('measurement failed');});
 await f.scope.enqueueAnalysis([a]);terminal(f);assert.equal(a.key,null);assert.equal(a.analysisResult,undefined);assert.equal(a.analysisError,'measurement failed');assert.equal(f.calls.library,0);assert.match(f.state.analysisStatus,/0 measured, 1 failed/);expectOwners(f,[]);
});
test('cancelled analysis with unchanged selection preserves metadata without terminal repaint',async()=>{
 const f=fixture(),a=f.tracks[0];f.warm();f.setAnalyze(async()=>{f.scope.cancelAnalysis();throw new DOMException('Cancelled','AbortError');});
 await f.scope.enqueueAnalysis([a]);terminal(f);assert.equal(a.analysisResult,undefined);assert.equal(a.key,null);assert.equal(f.calls.library,0);assert.match(f.state.analysisStatus,/Cancelled: 0 measured, 0 failed/);expectOwners(f,[]);
});
test('cancel and re-enqueue drains the new job without reviving cleared jobs or repainting terminal state',async()=>{
 const f=fixture(),[a,b,c]=f.tracks;f.warm();let release;const gate=new Promise(resolve=>{release=resolve;});
 f.engine.buffer=async track=>{if(track===a)await gate;return f.engine.buffers.get(track.id);};
 const pending=f.scope.enqueueAnalysis([a,b]);f.scope.cancelAnalysis();void f.scope.enqueueAnalysis([c]);release();await pending;
 terminal(f);assert.equal(a.analysisResult,undefined);assert.equal(b.analysisResult,undefined);assert.equal(c.key,'Cm');assert.deepEqual(f.calls.analysis,[c.id]);assert.equal(f.calls.library,1);assert.match(f.state.analysisStatus,/Cancelled: 1 measured, 0 failed/);expectOwners(f,[2]);
});
test('buffer publication followed by abort retains actual next-frame selection refresh',async()=>{
 const f=fixture(),a=f.tracks[0],canvas=f.canvases[0];f.engine.buffers.delete(a.id);f.warm();const oldView=f.scope.overviewWaveViews[0];
 let release;const gate=new Promise(resolve=>{release=resolve;});f.engine.buffer=async()=>{await gate;return f.engine.buffers.get(a.id);};
 const pending=f.scope.enqueueAnalysis([a]);f.engine.buffers.set(a.id,{id:a.id});f.scope.cancelAnalysis();release();await pending;
 terminal(f);assert.equal(a.analysisResult,undefined);assert.equal(f.calls.analysis.length,0);const terminalGeometry=[...f.geometry];f.reset();
 f.scope.tick();
 assert.equal(f.labels[0].textContent,'Decoded waveform · — BPM');assert.equal(canvas.attrs.get('aria-label'),'Deck 1: Decoded waveform');assert.notEqual(f.scope.overviewWaveViews[0],oldView);
 assert.equal(f.canvases[0],canvas);assert.equal(f.document.activeElement,f.control);assert.equal(f.calls.frames.length,1);
 assert.deepEqual(terminalGeometry,[],'An aborted queue must leave buffer selection refresh to its real next frame');expectOwners(f,[0,1,2,3]);
 f.reset();f.scope.tick();expectOwners(f,[]);assert.equal(f.calls.frames.length,2,'Stable next frame still reschedules without repaint');
});
test('overlapping analysis requests reuse active work but preserve changed requests and cancelled retries',async()=>{
 for(const mode of ['duplicate','replacement','settings','cancel']){
  const f=fixture(),[a,b]=f.tracks;let release,first=true;
  const gate=new Promise(resolve=>{release=resolve;});
  f.engine.buffer=async track=>{if(first){first=false;await gate;}return f.engine.buffers.get(track.id);};
  const pending=f.scope.enqueueAnalysis([a,b]);
  if(mode==='cancel')f.scope.cancelAnalysis();
  if(mode==='settings')f.state.analysisSettings.analyzeKey=false;
  await f.scope.enqueueAnalysis([a],mode==='replacement'?{replaceTempo:true}:{});
  assert.deepEqual(Array.from(f.scope.analysisQueue,job=>job.track.id),mode==='duplicate'?[b.id]:mode==='cancel'?[a.id]:[b.id,a.id],mode);
  release();await pending;terminal(f);assert.equal(f.scope.analysisJob,null);
  assert.deepEqual(f.calls.analysis,mode==='duplicate'?[a.id,b.id]:mode==='cancel'?[a.id]:[a.id,b.id,a.id],mode);
 }
});
