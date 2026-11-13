import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('engine.onEnd = async (d) => {'),source.indexOf('\nfunction tick()'));
function fixture(load){
 const current={id:'old'},next={id:'next'},deck={index:0,track:current,repeat:false,playing:false},state={autoplay:true},plays=[];
 const context={engine:{},state,autoplayRequests:new WeakMap(),playRequests:new WeakMap(),smartSync:{paused(){},async start(){return false;},played(){}},filtered:()=>[current,next],load,play:async d=>plays.push(d.track.id),refreshTransportControls(){}};
 vm.runInNewContext(handler,context);return {deck,state,plays,end:()=>context.engine.onEnd(deck)};
}
test('failed end-of-track load does not start unavailable replacement audio',async()=>{
 let f;f=fixture(async()=>{f.deck.track={id:'broken'};return false;});await f.end();assert.deepEqual(f.plays,[]);
});
test('turning Autoplay off during decoding cancels the pending automatic start',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r),f=fixture(()=>pending),end=f.end();f.state.autoplay=false;resolve(true);await end;assert.deepEqual(f.plays,[]);
});
test('successful current load still starts the next track once',async()=>{
 let f;f=fixture(async()=>{f.deck.track={id:'next'};return true;});await f.end();assert.deepEqual(f.plays,['next']);
});

// Actual app End/Play/cancellation handlers; decoding, audio and presentation are controlled.
function manualFixture(){
 let finishLoad,finishStart;
 const loading=new Promise(resolve=>finishLoad=resolve),starting=new Promise(resolve=>finishStart=resolve);
 const old={id:'old'},next={id:'next',plays:0},d={index:0,track:old,playing:false},voices=new Set();
 const scope={playbackIntents:{record(){}},state:{autoplay:true,decks:[d],settings:{},history:[],prepare:[]},
  autoplayRequests:new WeakMap(),playRequests:new WeakMap(),instantDouble:{pending:()=>false,cancelDeck(){}},
  pitchPlay:{latch:()=>false},cueHolds:{latch:()=>false,cancelDeck(){}},slicer:{cancelDeck(){}},stemSlipControls:{cancelDeck(){}},loopPads:{rolling:()=>false,cancelDeck(){}},
  smartSync:{paused(){},async start(){return false;},played(){},reconcile(){}},syncMaster:{started(){}},
  engine:{pause(){d.playing=false;d.processing=false;voices.delete(d);},async start(){await starting;d.playing=true;voices.add(d);}},
  filtered:()=>[old,next],load:async()=>{scope.cancelPendingPlay(d);d.track=next;await loading;return true;},
  refreshTransportControls(){},persist(){},renderDecks(){},renderTracks(){},notify:message=>assert.fail(message)};
 const play=source.slice(source.indexOf('async function play('),source.indexOf('\nfunction deckQuantize('));
 vm.runInNewContext(source.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+play+'\n'+handler+'\nglobalThis.pressPlay=play;',scope);
 return{d,scope,voices,finishLoad,finishStart,end:()=>scope.engine.onEnd(d)};
}
test('Autoplay completion cannot cancel a newer pending or playing manual Play',async()=>{
 for(const settled of [false,true]){
  const f=manualFixture(),end=f.end(),manual=f.scope.pressPlay(f.d);
  if(settled){f.finishStart();await manual;}
  f.finishLoad();await end;
  if(!settled){f.finishStart();await manual;}
  assert.equal(f.d.playing,true,`Autoplay canceled ${settled?'playing':'pending'} manual Play`);
  assert.equal(f.voices.has(f.d),true);assert.equal(f.d.track.plays,1);
 }
});
test('manual Play followed by Stop while Autoplay loads cannot queue a later restart',async()=>{
 const f=manualFixture(),end=f.end();f.finishStart();await f.scope.pressPlay(f.d);await f.scope.pressPlay(f.d);
 assert.equal(f.d.playing,false);f.finishLoad();await end;
 assert.equal(f.d.playing,false,'Old Autoplay restarted after explicit Stop');assert.equal(f.voices.size,0);
});
