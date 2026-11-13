import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createSmartSync} from './smart-sync.js';

const source=await readFile(new URL('./app.js',import.meta.url),'utf8');
const runner=source.slice(source.indexOf('async function enqueueAnalysis('),source.indexOf('\nfunction analyze('));
function fixture(){
 const engine=new AudioEngine(),track={id:'incoming',title:'Incoming',bpm:120,key:'Am',grid:0,duration:30,metadataSources:{}};
 const deck={index:1,track,position:3,rate:1,anchorPosition:3,anchorTime:1,playing:true};
 const leader={...deck,index:0,track:{...track,id:'leader',bpm:126}},old={sources:[]},started=[],retired=[],calls=[];
 const state={settings:{'Sync Mode':'Smart Sync'},analysisSettings:{},decks:[leader,deck],deckCount:2,analysis:false};
 engine.ctx={currentTime:1,createBufferSource(){return{playbackRate:{value:1},start(when,offset){started.push({when,offset,rate:this.playbackRate.value});},connect(){},disconnect(){},stop(){}};}};
 engine.nodes[1]={};engine.resume=async()=>{};engine.applyChannelFX=async()=>{};
 engine.buffer=async()=>({duration:30,sampleRate:44100});engine.cancelDeckScratchRequest=()=>{};engine.setDeckTrackGain=()=>{};
 engine.voices.set(1,old);engine.routeOrdinaryVoice=(d,v)=>engine.voices.set(d.index,v);engine.retireVoiceAt=(_i,v)=>retired.push(v);engine.disposeVoice=()=>{};
 const smart=createSmartSync({engine,state});smart.setMaster(leader);
 engine.onGridWillChange=t=>{calls.push(['before',t.bpm,t.grid]);return smart.captureGrid(t);};
 engine.onGridChanged=(t,before)=>{calls.push(['after',t.bpm,t.grid]);return smart.edited(t,before);};
 const scope={state,engine,analysisQueue:[],analysisController:null,analysisJob:null,AbortController,DOMException,
  analyzeBuffer:async()=>({bpm:100,key:'Am',grid:{firstBeat:.1}}),trackGain:{measurementReady(){}},
  persist:()=>calls.push(['persist',track.bpm]),renderTracks:()=>calls.push(['rows']),smartSync:smart,
  refreshAnalysisControls:()=>calls.push(['controls']),drawWaves:()=>calls.push(['waves']),updateAnalysisStatus:s=>state.analysisStatus=s,notify(){}};
 vm.createContext(scope);vm.runInContext(runner,scope);
 return{engine,track,deck,leader,old,started,retired,calls,state,scope,smart};
}
test('actual reanalysis completion revokes pending real Sync before replacing its grid',async()=>{
 const f=fixture(),before={...f.leader};let release;
 f.engine.resume=()=>new Promise(resolve=>{release=resolve;});
 const pending=f.smart.press(f.deck).then(()=>({committed:true}),error=>({error:error.name}));
 assert.equal(f.deck.processing,true);assert.equal(typeof release,'function');
 await f.scope.enqueueAnalysis([f.track],{replaceTempo:true});
 release();const settled=await pending;
 assert.equal(f.track.bpm,100);assert.equal(f.track.grid,.1);
 assert.deepEqual(settled,{error:'AbortError'},'Old-grid Sync must not commit against newly analyzed metadata');
 assert.equal(f.engine.voices.get(1),f.old);assert.equal(f.deck.rate,1);assert.equal(!!f.deck.sync,false);
 assert.deepEqual(f.started,[]);assert.deepEqual(f.retired,[]);assert.deepEqual(f.leader,before);
 assert.equal(f.engine.transforms.size,0);assert.equal(f.state.analysis,false);
 assert.deepEqual(f.calls.slice(0,3),[['before',120,0],['persist',100],['after',100,.1]]);
 f.engine.resume=async()=>{};await f.smart.press(f.deck);
 assert.equal(f.deck.rate,1.26);assert.equal(f.deck.syncState,'beat');
 assert.equal(f.started.length,1);assert.deepEqual(f.leader,before);
});

test('unchanged, locked and superseded analysis cannot disturb grid ownership',async()=>{
 for(const mode of ['unchanged','locked','superseded']){
  const f=fixture();
  if(mode==='locked')f.track.locked=true;
  f.scope.analyzeBuffer=async()=>{
   if(mode==='superseded'){f.track.bpm=131;f.track.metadataRevision=1;}
   return{bpm:mode==='unchanged'?120:100,key:'Am',grid:{firstBeat:mode==='unchanged'?0:.1}};
  };
  await f.scope.enqueueAnalysis([f.track],{replaceTempo:true});
  assert.equal(f.calls.some(([name])=>name==='before'||name==='after'),false,mode);
  assert.equal(f.track.bpm,mode==='superseded'?131:120);
 }
});

test('rejected realignment preserves measured metadata and refreshes existing controls with an error',async()=>{
 const f=fixture();f.engine.onGridChanged=async()=>{throw Error('voice failed');};
 await f.scope.enqueueAnalysis([f.track],{replaceTempo:true});
 assert.equal(f.track.bpm,100);assert.equal(f.track.analysisResult.bpm,100);
 assert.match(f.track.analysisError,/Analysis saved; playback realignment failed: voice failed/);
 assert.deepEqual(f.calls.slice(-4),[['persist',100],['rows'],['controls'],['waves']]);
 assert.match(f.state.analysisStatus,/0 measured, 1 failed/);assert.equal(f.state.analysis,false);
});
