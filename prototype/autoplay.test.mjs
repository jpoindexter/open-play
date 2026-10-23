import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('engine.onEnd = async (d) => {'),source.indexOf('\nfunction tick()'));
function fixture(load){
 const current={id:'old'},next={id:'next'},deck={index:0,track:current,repeat:false,playing:false},state={autoplay:true},plays=[];
 const context={engine:{},state,smartSync:{paused(){},async start(){return false;},played(){}},filtered:()=>[current,next],load,play:async d=>plays.push(d.track.id),renderDecks(){}};
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
