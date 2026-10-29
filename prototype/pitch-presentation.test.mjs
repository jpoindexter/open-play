import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createPitchPlay} from './pitchplay.js';
import {refreshPitchControls} from './pitch-presentation.js';
import {refreshAnalysisControls} from './analysis-presentation.js';
import {refreshLoopControls} from './loop-presentation.js';
import {refreshCueControls,refreshDeckSwitches,refreshTransportControls} from './transport-presentation.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
function node(){
 const attrs=new Map(),classes=new Set();
 return{isConnected:true,textContent:'',dataset:{},childNodes:[],classList:{contains:k=>classes.has(k),toggle(k,on){on?classes.add(k):classes.delete(k);}},getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)};
}
test('actual Pitch Play callbacks retain controls through cue selection, hold, release and failure',async()=>{
 const track={id:'shared',key:'Cm',bpm:120,grid:0,duration:48,cues:[],savedLoops:[]};
 const decks=Array.from({length:4},(_,index)=>({index,track,tab:index%2?'Cues':'Pitch',mode:'INT',position:3.25,playing:false,rate:1,loop:false,loopLength:4,keyShift:0,keylock:false,keySync:false,pitchCue:0}));
 const state={decks,deckCount:4,layout:'Horizontal',settings:{'Sync Mode':'Smart Sync'}},nodes=new Map(),keys=decks.map(()=>node());
 const pads=decks.map(d=>Array.from({length:8},(_,i)=>{const p=node(),name={nodeType:3,textContent:d.tab==='Pitch'?String(i):'+'},detail=node();detail.textContent=d.tab==='Pitch'?'CUE 1':String(i+1);p.dataset.pad=String(i);p.childNodes=[name,detail];p.querySelector=s=>s==='small'?detail:null;return p;}));
 let missing=false,rebuilds=0,focus=node(),drawn=[],failure=false;
 const root={get activeElement(){return focus;},querySelector(s){
  if(!nodes.has(s)){const n=node(),deck=s.match(/^\.deck\[data-focus="(\d+)"\]$/);if(deck)n.querySelector=q=>q==='.deck-key'?keys[+deck[1]]:root.querySelector(q.replace(']',`][data-deck="${deck[1]}"]`));nodes.set(s,n);}return nodes.get(s);
 },querySelectorAll(s){const result=pads[Number(s.match(/data-deck="(\d+)"/)[1])];return missing?result.slice(1):result;}};
 const notices=[],engine={position:d=>d.position,pause(d){d.playing=false;},async start(d){if(failure)throw Error('controlled start failure');d.playing=true;},beginSlip(d){d.slipOrigin={reason:'pitch'};},async endSlip(d){d.slipOrigin=null;}};
 const scope={state,engine,createPitchPlay,document:root,renderedDeckShape:'Horizontal/4/Smart Sync',persist(){},notify:m=>notices.push(m),quantized:(_d,p)=>p,loopPads:{},time:p=>String(p),
  refreshPitchControls:(s,d)=>refreshPitchControls(s,d,root),refreshAnalysisControls:(s,t)=>refreshAnalysisControls(s,t,root),
  refreshCueControls:(s,t,time)=>refreshCueControls(s,t,time,root),refreshDeckSwitches:(s,i)=>refreshDeckSwitches(s,i,root),
  refreshLoopControls:(s,p)=>refreshLoopControls(s,p,root),refreshTransportControls:s=>refreshTransportControls(s,root),
  smartSync:{reconcile(){}},drawWaves:t=>drawn.push(t),renderDecks(){rebuilds++;for(const n of [...nodes.values(),...pads.flat()])n.isConnected=false;focus=null;},
 };
 const refresh=source.slice(source.indexOf('function refreshLoopDecks('),source.indexOf('\nconst manualLoops='));
 const callback=source.includes('function refreshPitchDecks(')?source.slice(source.indexOf('function refreshPitchDecks('),source.indexOf('\nconst pitchPlay =')):'';
 vm.runInNewContext(refresh+'\n'+callback+'\n'+source.match(/^const pitchPlay = createPitchPlay.*$/m)[0]+'\nglobalThis.actions={pitchPlay,refresh:typeof refreshPitchDecks==="function"?refreshPitchDecks:null};',scope);
 const {pitchPlay,refresh:update}=scope.actions,d=decks[0],owner=focus,witness=root.querySelector('[data-mix="level"][data-deck="3"]'),preview=root.querySelector('.library-wave-preview img');
 await pitchPlay.press('select',d,2,true);
 assert.equal(rebuilds,0,'Pitch cue selection globally replaces controls');assert(witness.isConnected&&preview.isConnected);assert.equal(focus,owner);
 assert.equal(d.pitchCue,2);assert.equal(track.cues[2].position,3.25);assert.equal(d.playing,false);
 assert(pads[0].every(p=>p.querySelector('small').textContent==='CUE 3'));assert(pads[2].every(p=>p.querySelector('small').textContent==='CUE 1'));
 assert.equal(pads[1][2].childNodes[0].textContent,'Cue 3');assert.equal(pads[3][2].querySelector('small').textContent,'3.25');
 assert.equal(await pitchPlay.press('hold',d,1),true);assert.equal(d.keyShift,1);assert.equal(d.keylock,true);
 assert.equal(root.querySelector('[data-action="keylock"][data-deck="0"]').getAttribute('aria-pressed'),'true');assert.equal(keys[0].textContent,'C#m (+1)');
 await pitchPlay.release('hold');assert.equal(d.playing,false);assert.equal(d.position,3.25);assert.equal(rebuilds,0);assert.equal(focus,owner);
 await pitchPlay.press('latch',d,2);assert.equal(pitchPlay.latch(d),true);await pitchPlay.release('latch');assert.equal(d.playing,true);engine.pause(d);
 failure=true;assert.equal(await pitchPlay.press('fail',d,1),false);assert.deepEqual(notices,['controlled start failure']);assert.equal(d.playing,false);assert.equal(rebuilds,0);
 assert(witness.isConnected&&preview.isConnected&&pads.flat().every(p=>p.isConnected));assert(drawn.every(t=>t===track));
 d.tab='Cues';update(d);assert.equal(rebuilds,0,'Current replacement mode needs no Pitch nodes');
 state.deckCount=2;update(decks[2]);assert.equal(rebuilds,1,'Deck-count change retains structural fallback');scope.renderedDeckShape='Horizontal/2/Smart Sync';update(decks[2]);assert.equal(rebuilds,1,'Hidden deck needs no Pitch nodes');
 state.deckCount=4;scope.renderedDeckShape='Horizontal/4/Smart Sync';d.tab='Pitch';missing=true;update(d);assert.equal(rebuilds,2,'Missing Pitch structure requires fallback');missing=false;
 state.layout='Vertical';update(d);assert.equal(rebuilds,3,'Layout change requires fallback');
});

test('deck-count reduction retires held Pitch Play before the next normal Play',async()=>{
 const decks=Array.from({length:4},(_,index)=>({index,track:{id:`demo-${index}`,cues:[{position:2}],plays:0},playing:index<2,processing:false,position:index,rate:1,tab:'Pitch'}));
 const state={decks,deckCount:4,focus:3,settings:{},history:[],prepare:[]},selector={},starts=[],tokens=new Map();
 const engine={pause(d){d.playing=false;d.processing=false;tokens.set(d.index,(tokens.get(d.index)||0)+1);},async start(d){starts.push(d.index);tokens.set(d.index,(tokens.get(d.index)||0)+1);d.playing=true;},clearDeckScratchCache(){},beginSlip(){},async endSlip(){}};
 const pitchPlay=createPitchPlay({engine}),playRequests=new WeakMap(),autoplayRequests=new WeakMap();
 const scope={state,engine,pitchPlay,playRequests,autoplayRequests,$:()=>selector,
  cancelPendingPlay:d=>{playRequests.delete(d);autoplayRequests.delete(d);d.playQueued=false;},
  cueHolds:{cancelDeck(){},latch:()=>false},instantDouble:{pending:()=>false},slicer:{cancelDeck(){}},stemSlipControls:{cancelDeck(){}},
  playbackIntents:{record(){}},syncMaster:{started(){}},smartSync:{reconcile(){},async start(){return false;},played(){},paused(){}},
  renderDecks(){},renderTracks(){},refreshTransportControls(){},persist(){},notify:m=>assert.fail(m),
 };
 const count=source.slice(source.indexOf('$("#deck-count").onchange'),source.indexOf('$("#day").onclick'));
 const play=source.slice(source.indexOf('async function play('),source.indexOf('\nfunction deckQuantize('));
 vm.runInNewContext(count+'\n'+play+'\nglobalThis.manualPlay=play;',scope);
 const d=decks[3];
 try{
  assert.equal(await pitchPlay.press('held-D-pad',d,1),true);assert.equal(d.playing,true);assert.deepEqual(starts,[3]);
  const token=tokens.get(3);selector.onchange({target:{value:'2'}});
  assert.equal(d.playing,false);assert(tokens.get(3)>token,'Actual pause generation changed');assert(decks.slice(0,2).every(d=>d.playing));
  selector.onchange({target:{value:'4'}});await scope.manualPlay(d,{origin:'button'});
  assert.equal(d.playing,true,'Old hidden Pitch owner consumed normal Play');assert.deepEqual(starts,[3,3]);
  await pitchPlay.release('held-D-pad');assert.equal(d.playing,true,'Old pad release must not stop the new normal playback');
  assert(decks.slice(0,2).every(d=>d.playing));
 }finally{await pitchPlay.release('held-D-pad');decks.forEach(d=>engine.pause(d));}
});
