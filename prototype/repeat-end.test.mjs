import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createSmartSync} from './smart-sync.js';
import {restartRepeat} from './repeat-restart.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('engine.onEnd = async (d) => {'),source.indexOf('\nfunction tick()'));
function fixture(){
 const track={id:'old',duration:48,bpm:120,grid:0},d={index:0,track,position:48,repeat:true,playing:false,playQueued:false},starts=[],notices=[];
 const requests=new WeakMap(),state={decks:[d],settings:{'Sync Mode':'Smart Sync'},autoplay:false};
 const engine={startTokens:new Map([[0,1]]),async start(deck){this.startTokens.set(deck.index,(this.startTokens.get(deck.index)||0)+1);starts.push(deck.track.id);deck.playing=true;},pause(deck){deck.playing=false;this.startTokens.set(deck.index,(this.startTokens.get(deck.index)||0)+1);}};
 const cancel={cancelDeck(){}},scope={engine,state,restartRepeat,playRequests:requests,autoplayRequests:new WeakMap(),instantDouble:{...cancel,pending:()=>false},smartSync:createSmartSync({engine,state}),refreshTransportControls(){},notify:message=>notices.push(message),
  playbackIntents:{record(){}},pitchPlay:{latch:()=>false},cueHolds:{...cancel,latch:()=>false},loopPads:{...cancel,rolling:()=>false},slicer:cancel,stemSlipControls:cancel,persist(){},renderTracks(){}};
 const play=source.slice(source.indexOf('async function play('),source.indexOf('\nfunction deckQuantize('));
 vm.runInNewContext(source.match(/^function cancelPendingPlay.*$/m)[0]+'\n'+play+'\n'+handler+'\nglobalThis.pressPlay=play;',scope);
 return {d,scope,starts,notices,requests,end:()=>engine.onEnd(d),cancel:()=>{scope.cancelPendingPlay(d);engine.pause(d);}};
}
test('a newer Stop cancels Repeat before its fallback start',async()=>{
 const f=fixture(),pending=f.end();f.cancel();await pending;
 assert.deepEqual(f.starts,[]);assert.equal(f.d.playing,false);
});
test('an old Repeat continuation cannot start a replacement track',async()=>{
 const f=fixture(),pending=f.end();f.cancel();f.d.track={id:'replacement',duration:48};await pending;
 assert.deepEqual(f.starts,[]);assert.equal(f.d.playing,false);
});
test('the actual Play/Pause handler cancels a pending Repeat instead of starting twice',async()=>{
 const f=fixture(),pending=f.end();await f.scope.pressPlay(f.d);await pending;
 assert.deepEqual(f.starts,[]);assert.equal(f.d.playing,false);assert.equal(f.d.playQueued,false);assert.equal(f.requests.has(f.d),false);
});

test('a newer paused seek also cancels Repeat without clearing the Play map',async()=>{
 const f=fixture(),pending=f.end();f.scope.engine.pause(f.d);f.d.position=7;await pending;
 assert.deepEqual(f.starts,[]);assert.equal(f.d.position,7);
});
test('ordinary Repeat starts the current track once and clears its queued request',async()=>{
 const f=fixture();await f.end();assert.deepEqual(f.starts,['old']);assert.equal(f.d.playing,true);
 assert.equal(f.d.position,0);assert.equal(f.d.playQueued,false);assert.equal(f.requests.has(f.d),false);
});
test('Repeat preparation failure is reported without an unhandled rejection',async()=>{
 const f=fixture();f.scope.engine.start=async()=>{throw new Error('decode failed');};await f.end();
 assert.deepEqual(f.notices,['decode failed']);assert.equal(f.d.playing,false);assert.equal(f.d.playQueued,false);assert.equal(f.requests.has(f.d),false);
});
test('superseded Repeat preparation is silent and releases its queued request',async()=>{
 const f=fixture();f.scope.engine.start=async()=>{throw new DOMException('superseded','AbortError');};await f.end();
 assert.deepEqual(f.notices,[]);assert.equal(f.d.playing,false);assert.equal(f.d.playQueued,false);assert.equal(f.requests.has(f.d),false);
});
