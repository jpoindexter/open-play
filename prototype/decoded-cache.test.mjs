import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
function fixture(limit=16000){
 const engine=new AudioEngine({maxDecodedBytes:limit});let decodes=0;
 engine.ctx={async decodeAudioData(){decodes++;return {length:1000,numberOfChannels:2,duration:1,sampleRate:1000};}};
 const track=id=>({id,file:{async arrayBuffer(){return new ArrayBuffer(8);}}});
 return {engine,track,decodes:()=>decodes};
}
test('repeated inactive decoding is bounded and an evicted track can be decoded again',async()=>{
 const {engine,track,decodes}=fixture();
 for(let i=0;i<50;i++)await engine.buffer(track('t'+i));
 assert.ok(engine.buffers.size<=2,'50 sequential decodes must not remain strongly cached');
 const before=decodes();await engine.buffer(track('t0'));assert.equal(decodes(),before+1);
});
test('loaded paused decks survive cache pressure and released decks become evictable',async()=>{
 const {engine,track}=fixture(8000),a=track('a'),b=track('b'),deckA={track:a},deckB={track:b};
 engine.loadedBufferTracks=()=>[deckA.track,deckB.track];
 const first=await engine.buffer(a),second=await engine.buffer(b);
 for(let i=0;i<8;i++)await engine.buffer(track('other'+i));
 assert.equal(engine.buffers.get('a'),first);assert.equal(engine.buffers.get('b'),second);
 deckA.track=null;engine.pruneDecodedBuffers();assert.equal(engine.buffers.has('a'),false);assert.equal(engine.buffers.get('b'),second);
});
test('concurrent requests share one decode and failures can retry',async()=>{
 const {engine,track,decodes}=fixture(),a=track('a');
 const [one,two]=await Promise.all([engine.buffer(a),engine.buffer(a)]);
 assert.equal(one,two);assert.equal(decodes(),1);
 let attempts=0;const normal=engine.ctx.decodeAudioData;engine.ctx.decodeAudioData=async bytes=>{if(++attempts===1)throw Error('bad decode');return normal(bytes);};
 await assert.rejects(engine.buffer(track('retry')),/bad decode/);await engine.buffer(track('retry'));assert.equal(attempts,2);
});
test('cache hits refresh recency and inactive clearing preserves loaded and sample owners',async()=>{
 const {engine,track}=fixture(24000);for(const id of ['a','b','c'])await engine.buffer(track(id));await engine.buffer(track('a'));await engine.buffer(track('d'));
 assert.equal(engine.buffers.has('b'),false);assert.equal(engine.buffers.has('a'),true);
 engine.deckStates.set(0,{track:{id:'a'}});engine.sampleRequests.set('sample',{track:{id:'c'}});
 engine.pruneDecodedBuffers({allInactive:true});assert.deepEqual([...engine.buffers.keys()].sort(),['a','c']);
});
test('scratch preparation and in-flight decodes stay owned under pressure',async()=>{
 const {engine,track}=fixture(8000),scratch=track('scratch');
 engine.scratchCache.entries.set(0,{track:scratch});const original=await engine.buffer(scratch);
 let release;const wait=new Promise(resolve=>release=resolve),read=engine.ctx.decodeAudioData;
 engine.ctx.decodeAudioData=async bytes=>{await wait;return read(bytes);};
 const pending=engine.buffer(track('pending'));await Promise.resolve();
 assert.equal(engine.bufferLoads.has('pending'),true);engine.pruneDecodedBuffers({allInactive:true});assert.equal(engine.buffers.get('scratch'),original);
 release();await pending;assert.equal(engine.bufferLoads.size,0);assert.equal(engine.buffers.get('scratch'),original);
});
test('equivalent track objects receive duration when sharing a decode',async()=>{
 const {engine,track}=fixture(),a=track('same'),b=track('same');
 await Promise.all([engine.buffer(a),engine.buffer(b)]);assert.equal(a.duration,1);assert.equal(b.duration,1);
});
