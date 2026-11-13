import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const load=source.slice(source.indexOf('async function load('),source.indexOf('\nconst deckKeyShift='));
const waves=source.slice(source.indexOf('function drawWaves('),source.indexOf('\nfunction drawDetailWave('));
function fixture({owners=[],count=4,buffer=async()=>({})}={}){
 const track={id:'arriving',title:'Arriving',analyzed:true,duration:30,bpm:126,cues:[]},painted=[],calls={library:0,scratch:0};
 const decks=Array.from({length:4},(_,index)=>({index,track:owners.includes(index)?track:{...track,id:'other-'+index},rate:1,playing:false,stemSlip:'off',control:{index}}));
 const canvases=decks.map(d=>({index:d.index,getBoundingClientRect:()=>({width:400,height:60}),setAttribute(){}})),scopes=decks.map(()=>({textContent:''}));
 const cancel={cancelDeck(){}};
 const scope={state:{decks,deckCount:count,settings:{},fx:[[],[]],flip:{},focus:0},trackById:id=>id===track.id?track:null,deckLoadRequests:new WeakMap(),faderStarts:new Map(),cancelPendingPlay(){},tempoSliders:{cancel(){}},cueHolds:cancel,deckScratchControls:cancel,pitchPlay:cancel,loopPads:cancel,manualLoops:cancel,slicer:cancel,stemSlipControls:cancel,
  trackGain:{refresh(){}},smartSync:{loaded(){}},engine:{rateOwners:new WeakMap(),buffers:new Map(decks.map(d=>[d.track.id,{}]).concat([[track.id,{}]])),position:d=>d.position||0,pause:d=>{d.playing=false;},clearDeckScratchCache(){},configureFX(){},buffer:async t=>{assert.equal(t,track);return buffer();},preloadDeckScratch:async()=>{calls.scratch++;return false;}},
  renderDecks(){},renderTracks(){calls.library++;},notify:message=>assert.fail(message),overviewWaveViews:[],colors:['red','blue','green','orange'],sourceWaveLoads:new WeakSet(),
  waveformView:()=>({kind:'ordinary',label:'Decoded waveform'}),paintSourceOverview:(ctx)=>{painted.push(ctx.index);return null;},
  prepareWaveCanvas:canvas=>({width:400,height:60,context:{index:canvas.index,clearRect(){},fillRect(){}}}),
  $:selector=>{const canvas=/^#wave-(\d)$/.exec(selector),label=/^\[data-wave-scope="(\d)"\]$/.exec(selector);return canvas?canvases[+canvas[1]]:label?scopes[+label[1]]:null;}};
 vm.createContext(scope);vm.runInContext(waves+'\n'+load,scope);return{scope,track,decks,painted,calls,scopes};
}
test('actual load completion paints only current visible owners, including duplicate decks',async()=>{
 for(const [owners,count,expected]of [[[],4,[1]],[[0,3],4,[0,1,3]],[[3],2,[1]]]){
  const f=fixture({owners,count}),controls=f.decks.map(d=>d.control);assert.equal(await f.scope.load(1,f.track.id),true);
  assert.deepEqual(f.painted,expected,'Unrelated overview canvases must not be repainted');assert.equal(f.calls.library,1);assert.deepEqual(f.decks.map(d=>d.control),controls);assert.equal(f.scopes[1].textContent,'Decoded waveform · 126.0 BPM');
 }
});
test('old decode completion refreshes library without painting a replacement deck',async()=>{
 let finish;const f=fixture({buffer:()=>new Promise(resolve=>{finish=resolve;})});const pending=f.scope.load(1,f.track.id);
 const replacement={...f.track,id:'newer'};f.decks[1].track=replacement;finish({});
 assert.equal(await pending,false);assert.equal(f.decks[1].track,replacement);assert.deepEqual(f.painted,[]);assert.equal(f.calls.library,1);
});
test('explicit global overview refresh retains all visible canvases',()=>{
 const f=fixture();f.scope.drawWaves();assert.deepEqual(f.painted,[0,1,2,3]);
});

test('ordinary decoded deck load leaves scratch preparation to the first gesture',async()=>{
 const f=fixture();assert.equal(await f.scope.load(1,f.track.id),true);
 assert.equal(f.calls.scratch,0);assert.deepEqual(f.painted,[1]);assert.equal(f.calls.library,1);
});

test('loading restored measured tracks reuses analysis while missing results and gain upgrades still queue',async()=>{
 const measured={duration:30,analyzedDuration:30,bpm:126,key:null,grid:null,gain:{recommendedDb:0},warnings:[],loudness:{version:'bs1770-integrated-v1',integratedLUFS:-15}};
 for(const [analysisResult,autoGain,analyzed,expected]of [[measured,true,false,0],[undefined,false,false,1],[{...measured,loudness:null},true,false,1],[{...measured,loudness:null},false,false,0],[undefined,false,true,0]]){
  const f=fixture(),jobs=[];Object.assign(f.track,{analysisResult,analyzed});f.scope.state.settings['Use Auto Gain']=autoGain;f.scope.enqueueAnalysis=tracks=>{jobs.push(...tracks);return Promise.resolve();};
  assert.equal(await f.scope.load(1,f.track.id),true);assert.equal(jobs.length,expected,'A restored measured result must not start a duplicate job; missing analysis and requested loudness upgrades still run');
 }
});
