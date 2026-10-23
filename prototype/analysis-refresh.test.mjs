import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const runner=source.slice(source.indexOf('async function enqueueAnalysis('),source.indexOf('\nfunction analyze('));
function fixture(indices=[],finish=()=>{}){
 const track={id:'a',title:'Analyzed track',bpm:120,key:null,grid:.1,metadataSources:{}},calls={decks:[],library:0,persist:0,gain:0},state={analysis:false,deckCount:4,analysisSettings:{},decks:Array.from({length:4},(_,index)=>({index,track:indices.includes(index)?track:{id:'other-'+index}}))};
 const result={bpm:126,key:'Cm',grid:{firstBeat:.2},loudness:{version:'bs1770-integrated-v1'}};
 const scope={state,analysisQueue:[],analysisController:null,AbortController,DOMException,engine:{buffer:async()=>({})},analyzeBuffer:async()=>{await finish({state,track});return result;},trackGain:{measurementReady(){calls.gain++;}},persist(){calls.persist++;},renderTracks(){calls.library++;},renderDecks(index){calls.decks.push(index);},updateAnalysisStatus(message){state.analysisStatus=message;},drawWaves(){},notify(){}};
 vm.createContext(scope);vm.runInContext(runner,scope);return{track,calls,state,scope,result};
}
test('unloaded analysis commits metadata and library without rebuilding any deck',async()=>{
 const f=fixture();await f.scope.enqueueAnalysis([f.track]);assert.deepEqual(f.calls.decks,[]);assert.equal(f.calls.library,1);assert.equal(f.calls.gain,1);assert.equal(f.track.key,'Cm');assert.equal(f.track.analysisResult.bpm,126);assert.equal(f.state.analysis,false);
});
test('analysis refreshes only current visible decks containing the measured track, including duplicates',async()=>{
 for(const indices of [[2],[0,3]]){const f=fixture(indices);await f.scope.enqueueAnalysis([f.track]);assert.deepEqual(f.calls.decks,indices);assert.equal(f.calls.library,1);}
});
test('replacement during asynchronous analysis is checked against current deck ownership',async()=>{
 const f=fixture([1],({state})=>{state.decks[1].track={id:'replacement'};});await f.scope.enqueueAnalysis([f.track]);assert.deepEqual(f.calls.decks,[]);
});
test('hidden decks are not structurally refreshed by completed analysis',async()=>{
 const f=fixture([3]);f.state.deckCount=2;await f.scope.enqueueAnalysis([f.track]);assert.deepEqual(f.calls.decks,[]);
});
test('manual edits made during analysis still win over replacement metadata',async()=>{
 const f=fixture([2],({track})=>{track.metadataRevision=1;track.key='G';track.bpm=131;track.grid=.4;});await f.scope.enqueueAnalysis([f.track],{replaceKey:true,replaceTempo:true});assert.equal(f.track.key,'G');assert.equal(f.track.bpm,131);assert.equal(f.track.grid,.4);assert.deepEqual(f.calls.decks,[2]);
});
test('failed or cancelled analysis leaves controls and previous metadata intact',async()=>{
 for(const error of [Error('decode failure'),new DOMException('Cancelled','AbortError')]){const f=fixture([0],()=>{throw error;});await f.scope.enqueueAnalysis([f.track]);assert.deepEqual(f.calls.decks,[]);assert.equal(f.calls.library,0);assert.equal(f.calls.gain,0);assert.equal(f.track.key,null);assert.equal(f.state.analysis,false);}
});
