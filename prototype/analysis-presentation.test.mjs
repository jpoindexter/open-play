import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {refreshAnalysisControls} from './analysis-presentation.js';

function fixture({indices=[1],projected=true,key='Cm'}={}){
 const track={id:'measured',key},state={deckCount:4,decks:Array.from({length:4},(_,index)=>({index,track:indices.includes(index)?track:{id:'other',key:'G'},keyShift:0,keySync:true,keySyncTag:'Cm'}))},decks=new Map(),queries=[];
 let writes=0;
 for(const d of state.decks){
  const attrs=new Map(),classes=new Set(['active']);let text='Before',title='';
  const node={get textContent(){return text;},set textContent(value){writes++;text=value;},get title(){return title;},set title(value){writes++;title=value;},
   getAttribute:name=>attrs.get(name),setAttribute(name,value){writes++;attrs.set(name,value);},closest:selector=>projected&&selector==='.preview-key-row'?{}:null};
  const input={value:'.37',pointer:42};Object.defineProperty(input,'value',{get:()=>'.37',set(){assert.fail('Analysis cannot overwrite an active input');}});
  const button={classList:{toggle(name,on){if(classes.has(name)!==on){writes++;on?classes.add(name):classes.delete(name);}},contains:name=>classes.has(name)}};
  const deck={node,button,input,querySelector:selector=>selector==='.deck-key'?node:selector==='[data-action="keySync"]'?button:null};
  Object.defineProperty(deck,'innerHTML',{set(){assert.fail('Analysis cannot replace controls');}});decks.set(d.index,deck);
 }
 const focused=decks.get(1).input,root={activeElement:focused,querySelector(selector){queries.push(selector);return decks.get(Number(/data-focus="(\d+)"/.exec(selector)?.[1]));}};
 return{track,state,decks,root,focused,queries,writes:()=>writes};
}

test('analysis updates keys and accessible projection labels without touching controls, focus or active inputs',()=>{
 const f=fixture(),owner=f.decks.get(1),identities=[...f.decks.values()];f.state.decks[1].keyShift=2;
 refreshAnalysisControls(f.state,f.track,f.root);
 assert.equal(owner.node.textContent,'Dm (+2)');assert.equal(owner.node.getAttribute('aria-label'),'Deck 2 track key: Dm (+2)');
 assert.equal(owner.node.title,'Track key, including the current semitone shift');assert.equal(f.root.activeElement,f.focused);assert.equal(owner.input.pointer,42);assert.deepEqual([...f.decks.values()],identities);
 assert.deepEqual(f.queries,['.deck[data-focus="1"]']);const writes=f.writes();refreshAnalysisControls(f.state,f.track,f.root);assert.equal(f.writes(),writes,'Unchanged metadata must not rewrite labels');
});
test('analysis handles duplicate owners while skipping hidden, replaced and merely same-id tracks',()=>{
 const f=fixture({indices:[0,1,2,3]});f.state.deckCount=3;f.state.decks[1].track={...f.track};f.state.decks[2].track={id:'replacement',key:'F'};
 refreshAnalysisControls(f.state,f.track,f.root);assert.deepEqual(f.queries,['.deck[data-focus="0"]']);assert.equal(f.decks.get(0).node.textContent,'Cm');assert.equal(f.decks.get(3).node.textContent,'Before');
 f.state.decks[2].track=f.track;refreshAnalysisControls(f.state,f.track,f.root);assert.equal(f.decks.get(2).node.textContent,'Cm');
});
test('analysis only revokes key sync when the current key differs from its tag; manual shift stays intact',()=>{
 const f=fixture({indices:[0,1],key:'G'});f.state.decks[0].keyShift=-1;f.state.decks[1].keySyncTag='G';
 refreshAnalysisControls(f.state,f.track,f.root);assert.equal(f.state.decks[0].keySync,false);assert.equal(f.state.decks[0].keyShift,-1);assert.equal(f.decks.get(0).node.textContent,'F# (-1)');assert.equal(f.decks.get(0).button.classList.contains('active'),false);
 assert.equal(f.state.decks[1].keySync,true);assert.equal(f.decks.get(1).button.classList.contains('active'),true);
});
test('unknown and unrecognized keys retain plain and projected presentation without interpreting markup',()=>{
 for(const projected of [false,true]){const f=fixture({key:null,projected});refreshAnalysisControls(f.state,f.track,f.root);assert.equal(f.decks.get(1).node.textContent,projected?'Unknown':'—');}
 const f=fixture({key:'<b>custom</b>'});refreshAnalysisControls(f.state,f.track,f.root);assert.equal(f.decks.get(1).node.textContent,'<b>custom</b>');
});

test('analysis completion preserves the measured deck controls and active gesture',async()=>{
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8'),runner=source.slice(source.indexOf('async function enqueueAnalysis('),source.indexOf('\nfunction analyze('));
 const track={id:'measured',title:'Measured',bpm:120,key:null,grid:0,metadataSources:{}},control={focused:true,pointer:9},deck={index:0,track,control};
 const scope={state:{analysis:false,deckCount:4,analysisSettings:{},decks:[deck]},analysisQueue:[],analysisController:null,AbortController,DOMException,
  engine:{buffer:async()=>({})},analyzeBuffer:async()=>({bpm:120,key:'Cm',grid:{firstBeat:0}}),trackGain:{measurementReady(){}},smartSync:{reconcile(){}},
  persist(){},renderTracks(){},renderDecks(){deck.control={focused:false,pointer:null};},refreshAnalysisControls(){},updateAnalysisStatus(){},drawWaves(){},notify(){}};
 vm.createContext(scope);vm.runInContext(runner,scope);await scope.enqueueAnalysis([track]);
 assert.equal(deck.control,control,'Analysis must retain the same focused, pointer-captured control');assert.equal(control.pointer,9);
});

test('completed analysis refreshes its existing overview before the next queued job finishes',async()=>{
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8'),runner=source.slice(source.indexOf('async function enqueueAnalysis('),source.indexOf('\nfunction analyze('));
 const a={id:'a',title:'A',bpm:0,key:null,grid:null,metadataSources:{}},b={...a,id:'b',title:'B',metadataSources:{}},waves=[];
 const scope={state:{analysis:false,deckCount:4,analysisSettings:{},decks:[{index:0,track:a}]},analysisQueue:[],analysisController:null,AbortController,DOMException,engine:{buffer:async()=>({})},
  analyzeBuffer:async()=>{if(a.analyzed)assert.equal(waves[0],a,'First result must paint its overview before second analysis begins');return{bpm:126,key:'Cm',grid:{firstBeat:0}};},trackGain:{measurementReady(){}},smartSync:{reconcile(){}},refreshAnalysisControls(){},
  persist(){},renderTracks(){},renderDecks(){assert.fail('Controls cannot be rebuilt');},updateAnalysisStatus(){},drawWaves(track){waves.push(track);},notify(){}};
 vm.createContext(scope);vm.runInContext(runner,scope);await scope.enqueueAnalysis([a,b]);assert.equal(waves[0],a);assert.equal(waves[1],b);
});
