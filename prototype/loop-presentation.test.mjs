import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {refreshLoopControls} from './loop-presentation.js';
import {createBeatgrid} from './beatgrid.js';
import {createManualLoops} from './manual-loops.js';
import {createLoopPads} from './loop-pads.js';
import {AudioEngine} from './engine.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
function node(){
 const label={nodeType:3,textContent:''},small={textContent:''};
 return{label,small,textContent:'',dataset:{},childNodes:[label,small],classList:{values:new Set(),toggle(k,on){on?this.values.add(k):this.values.delete(k);},contains(k){return this.values.has(k);}},setAttribute(k,v){this[k]=v;},querySelector(s){return s==='small'?small:null;}};
}
test('Actual loop commands and shared callbacks retain controls with current loop/pad feedback',async()=>{
 const track={id:'shared',bpm:120,grid:0,duration:48,savedLoops:[],cues:[]};
 const decks=Array.from({length:4},(_,index)=>({index,track,position:4,mode:'INT',tab:'Loops',loopLength:4,loopIn:2,loopOut:4,rate:1}));
 const state={decks,deckCount:4,layout:'Horizontal',settings:{'Sync Mode':'Simple Sync'}},nodes=new Map(),pads=decks.map(()=>Array.from({length:8},(_,i)=>Object.assign(node(),{dataset:{pad:String(i)}})));
 const root={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},querySelectorAll(s){return pads[Number(s.match(/data-deck="(\d+)"/)[1])];}};
 let rebuilds=0;const drawn=[];
 const engine={ctx:{currentTime:0},voices:new Map(),startTokens:new Map(),position:d=>d.position,audibleRate:d=>d.rate,validateLoop(){},beginSlip(){},async endSlip(){},async setLoop(d,on,start,end){Object.assign(d,{loop:on,loopIn:start,loopOut:end});},async seek(d,p){d.position=p;}};
 const scope={state,engine,createBeatgrid,createManualLoops,createLoopPads,document:root,renderedDeckShape:'Horizontal/4/Simple Sync',renderDecks:()=>rebuilds++,quantized:(_d,p)=>p,persist(){},notify(){},smartSync:{reconcile(){}},refreshTransportControls(){},refreshLoopControls:(s,p)=>refreshLoopControls(s,p,root),drawWaves:t=>drawn.push(t),clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),autoLoopEnd:(d,p)=>p+d.loopLength*.5};
 const action=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
 const legacy=source.slice(source.indexOf('function renderLoopDecks('),source.indexOf('\nconst loopPads='));
 const refresh=source.includes('function refreshLoopDecks(')?source.slice(source.indexOf('function refreshLoopDecks('),source.indexOf('\nconst manualLoops=')):'';
 vm.runInNewContext(action+'\n'+legacy+'\n'+refresh+'\n'+source.match(/^const manualLoops=.*$/m)[0]+'\n'+source.match(/^const loopPads=.*$/m)[0]+'\nglobalThis.actions={press:deckAction,manualLoops,loopPads};',scope);
 const {press,manualLoops,loopPads}=scope.actions,d=decks[0],button=name=>root.querySelector(`[data-action="${name}"][data-deck="0"]`);
 await press('loopHalf',0,{});assert.equal(rebuilds,0,'Loop length replaced all controls');assert.equal(button('loop').textContent,'Loop 2');
 await press('loopDouble',0,{});await press('loop',0,{});assert.equal(button('loop')['aria-pressed'],'true');
 await press('loopIn',0,{});assert.equal(button('loopIn')['aria-pressed'],'true');
 await manualLoops.move(d,5);assert.equal(button('loopIn')['aria-pressed'],'true');
 await press('loopSave',0,{});track.savedLoops[0].name='Shared loop';await manualLoops.command(d,'save');assert.equal(pads[1][0].label.textContent,'Shared loop');
 await manualLoops.command(d,'next');assert.equal(button('loopSave').textContent,'Save 2');
 await press('jumpForward',0,{});assert.equal(button('jumpForward').textContent,`${d.loopLength} →`);
 d.loopPadMode='auto';await loopPads.press(d,'auto',1).pending;assert.equal(pads[0][1]['aria-pressed'],'true');
 d.loopPadMode='roll';const hold=loopPads.press(d,'roll',2);await hold.pending;assert.equal(pads[0][2]['aria-pressed'],'true');await hold.release();assert.equal(pads[0][2]['aria-pressed'],'false');
 assert.equal(rebuilds,0);assert(drawn.every(t=>t===track),'Redraw only affected source overview');
 const original=root.querySelector;root.querySelector=s=>s.includes('data-action="loopOut"')?null:original.call(root,s);
 assert.equal(refreshLoopControls(state,loopPads,root),false,'Missing structure requires fallback');root.querySelector=original;
 state.layout='Vertical';await press('loopHalf',0,{});assert.equal(rebuilds,1,'Changed layout needs structural rebuild');
});

test('normal Stop restores only its current held Loop Roll and preserves newer loop or track state',async()=>{
 function fixture(){
  const track={id:'roll-demo',bpm:120,grid:0,duration:48,plays:0};
  const decks=Array.from({length:4},(_,index)=>({index,track,playing:true,processing:false,position:4,anchorPosition:4,anchorTime:0,rate:1,loop:false,loopIn:0,loopOut:0,slice:null}));
  const state={decks,deckCount:4,focus:3,settings:{},history:[],prepare:[]},engine=new AudioEngine();engine.ctx={currentTime:0};
  for(const d of decks)engine.voices.set(d.index,{sources:[{playbackRate:{value:1},stop(){},disconnect(){}}]});
  const loopPads=createLoopPads({state,engine}),playRequests=new WeakMap(),autoplayRequests=new WeakMap(),cancel={cancelDeck(){}};
  const scope={state,engine,loopPads,playRequests,autoplayRequests,cancelPendingPlay:d=>{playRequests.delete(d);d.playQueued=false;},pitchPlay:{latch:()=>false},cueHolds:{...cancel,latch:()=>false},instantDouble:{pending:()=>false},slicer:cancel,stemSlipControls:cancel,
   playbackIntents:{record(){}},smartSync:{paused(){},reconcile(){}},persist(){},renderDecks(){},renderLoopDecks(){},renderTracks(){},refreshTransportControls(){}};
  vm.runInNewContext(source.slice(source.indexOf('async function play('),source.indexOf('\nfunction deckQuantize('))+'\nglobalThis.stop=play;',scope);
  return{state,engine,loopPads,scope,d:decks[3],cleanup(){decks.forEach(d=>engine.pause(d));}};
 }
 const current=fixture();
 try{
  const {d,loopPads,scope,engine,state}=current;
  await loopPads.hold('roll',d,0,{length:4,ignoreBeatJump:true});assert.equal(d.loop,true);assert.equal(loopPads.rolling(d),true);
  await scope.stop(d,{origin:'button'});
  assert.equal(d.playing,false);assert.equal(d.loop,false,'Stopped Loop Roll retained temporary loop');assert.equal(d.loopIn,0);assert.equal(d.loopOut,0);assert.equal(loopPads.rolling(d),false);
  const position=d.position,token=engine.startTokens.get(3);await loopPads.release('roll');
  assert.equal(d.position,position);assert.equal(engine.startTokens.get(3),token);assert.equal(d.playing,false);assert(state.decks.slice(0,3).every(d=>d.playing&&!d.loop));
 }finally{current.cleanup();}
 const newer=fixture();
 try{
  const {d,loopPads,engine}=newer;await loopPads.hold('old',d,0,{length:4,ignoreBeatJump:true});
  await engine.setLoop(d,true,8,10);loopPads.cancelDeck(d,{restoreLoop:true});
  assert.equal(d.loop,true);assert.equal(d.loopIn,8);assert.equal(d.loopOut,10);await loopPads.release('old');assert.equal(d.loopIn,8);
  await loopPads.hold('default',d,0,{length:4,ignoreBeatJump:true});loopPads.cancelDeck(d);assert.equal(d.loopIn,4,'Existing default cancellation must not restore bounds');assert.equal(d.loopOut,6);
 }finally{newer.cleanup();}
 const replacement=fixture();
 try{
  const {d,loopPads}=replacement;await loopPads.hold('old',d,0,{length:4,ignoreBeatJump:true});
  d.track={...d.track,id:'replacement'};loopPads.cancelDeck(d,{restoreLoop:true});assert.equal(d.loop,true);assert.equal(d.loopIn,4);assert.equal(d.loopOut,6);
  await loopPads.release('old');assert.equal(d.track.id,'replacement');assert.equal(d.loop,true);
  d.track=undefined;assert.doesNotThrow(()=>loopPads.cancelDeck(d,{restoreLoop:true}),'Unloaded deck without roll has nothing to restore');
 }finally{replacement.cleanup();}
 const pending=fixture();let release;
 try{
  const {d,loopPads,engine}=pending,setLoop=engine.setLoop.bind(engine);let entered;
  const reached=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
  engine.setLoop=(...args)=>{const result=setLoop(...args);entered();return Promise.resolve(result).then(()=>gate);};
  const hold=loopPads.hold('pending',d,0,{length:4,ignoreBeatJump:true});await reached;
  engine.pause(d);engine.setLoop=setLoop;await setLoop(d,true,8,10);const token=engine.startTokens.get(3);
  release();await hold;await loopPads.release('pending');assert.equal(d.loopIn,8,'Late roll preparation adopted the newer pause token');assert.equal(d.loopOut,10);assert.equal(d.playing,false);assert.equal(engine.startTokens.get(3),token);
 }finally{release?.();pending.cleanup();}
});
