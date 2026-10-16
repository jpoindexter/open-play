import assert from 'node:assert/strict';
import {File} from 'node:buffer';
import {createVideoKaraoke,videoKaraokePolicy} from '../prototype/video-karaoke.js';
import {createCDGDecoder} from '../prototype/cdg.js';
const packet=(instruction,data=[],command=9)=>{const p=new Uint8Array(24);p[0]=command;p[1]=instruction;p.set(data,4);return p;};
const join=(...packets)=>{const out=new Uint8Array(packets.reduce((n,p)=>n+p.length,0));let i=0;for(const p of packets){out.set(p,i);i+=p.length;}return out;};
const clut=()=>{const colors=[0,0xf00,0x0f0,0x00f,0xfff,0,0,0],data=[];for(const c of colors)data.push((c>>6)&63,c&63);return packet(30,data);};
const fixture=()=>join(clut(),packet(1,[1]),packet(1,[2]),packet(1,[3]),packet(28,[1]));
const file=(bytes=fixture(),name='original.cdg')=>new File([bytes],name,{type:'application/octet-stream'});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function delayed(bytes=fixture()){const f=file(bytes),gate=deferred();Object.defineProperty(f,'arrayBuffer',{value:()=>gate.promise});return {file:f,resolve:()=>gate.resolve(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),reject:gate.reject};}
function environment(){
  const canvases=[];
  globalThis.document={createElement(type){assert.equal(type,'canvas');const canvas={width:0,height:0,pixels:null,puts:0};
    const context={createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),putImageData(image,x,y){assert.equal(x,0);assert.equal(y,0);assert.equal(canvas.width,image.width);assert.equal(canvas.height,image.height);canvas.pixels=image.data.slice();canvas.puts++;}};
    canvas.getContext=kind=>{assert.equal(kind,'2d');return context;};canvases.push(canvas);return canvas;
  }};
  const track={id:'shared',name:'original audio'},state={decks:[{track,position:0,playing:false},{track,position:0,playing:false}]},calls=[];
  const engine={position(deck){calls.push(deck);return deck.position;},play(){throw new Error('Karaoke must not start audio');},start(){throw new Error('Karaoke must not start audio');}};
  return {state,engine,canvases,calls,karaoke:createVideoKaraoke({state,engine})};
}
const pixel=frame=>Array.from(frame.canvas.pixels.slice(0,4));
const tests=[];const test=(name,run)=>tests.push({name,run});

test('missing pair/track is explicit and does not create fake graphics or start audio',()=>{
  const e=environment();assert.equal(e.karaoke.frame(0),null);assert.equal(e.karaoke.diagnostics(0).available,false);assert.equal(e.karaoke.diagnostics(0).reason,'missing-pair');
  e.state.decks[0].track=null;assert.equal(e.karaoke.frame(0),null);assert.equal(e.karaoke.diagnostics(0).reason,'missing-track');assert.equal(e.canvases.length,0);assert.equal(e.calls.length,0);
});
test('load commits copied session bytes and actual decoder pixels via putImageData',async()=>{
  const e=environment(),bytes=fixture(),f=file(bytes),info=await e.karaoke.load(0,f,'shared');assert.equal(info.available,true);assert.equal(info.loading,false);assert.equal(info.decoder.packetCursor,0);assert.equal(info.retainedAssociationBytes,bytes.length);
  e.state.decks[0].position=1/300;const frame=e.karaoke.frame(0);assert.deepEqual(pixel(frame),[255,0,0,255]);assert.equal(frame.canvas.puts,1);assert.equal(frame.position,1/300);assert.equal(frame.diagnostics.decoder.packetCursor,2);assert.equal(e.calls.at(-1),e.state.decks[0]);
});
test('owned bytes survive mutation of a custom File read buffer',async()=>{
  const e=environment(),bytes=fixture(),f=file(bytes);Object.defineProperty(f,'arrayBuffer',{value:async()=>bytes.buffer});await e.karaoke.load(0,f,'shared');bytes.fill(0);e.state.decks[0].position=2/300;assert.deepEqual(pixel(e.karaoke.frame(0)),[0,255,0,255]);
});
test('original engine seconds drive pause/reverse/loop replay exactly like a fresh decoder',async()=>{
  const e=environment(),bytes=fixture();await e.karaoke.load(0,file(bytes),'shared');
  for(const position of [0,1/300,2/300,2/300,3/300,1/300,0,2/300]){
    e.state.decks[0].position=position;const frame=e.karaoke.frame(0),fresh=createCDGDecoder(bytes),expected=fresh.renderAt(position);
    assert.deepEqual(frame.canvas.pixels,expected.data);assert.equal(frame.diagnostics.decoder.packetCursor,expected.packetCursor);fresh.dispose();
  }
  assert.equal(e.karaoke.diagnostics(0).decoder.memoryPresets,2,'Prefix diagnostics must not accumulate replay work');
});
test('negative engine position clamps to zero, invalid engine clock fails explicitly',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');e.state.decks[0].position=-3;const frame=e.karaoke.frame(0);assert.equal(frame.position,0);assert.equal(frame.diagnostics.decoder.packetCursor,1);
  for(const position of [NaN,Infinity,'1']){e.state.decks[0].position=position;assert.throws(()=>e.karaoke.frame(0),/finite original-track/);}
});
test('both decks sharing one association retain private clocks, decoders and canvases',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');e.state.decks[0].position=1/300;e.state.decks[1].position=2/300;
  const a=e.karaoke.frame(0),b=e.karaoke.frame(1);assert.notEqual(a.canvas,b.canvas);assert.notEqual(a.assetId,b.assetId);assert.deepEqual(pixel(a),[255,0,0,255]);assert.deepEqual(pixel(b),[0,255,0,255]);
  e.state.decks[0].position=0;e.karaoke.frame(0);assert.deepEqual(pixel(e.karaoke.frame(1)),[0,255,0,255]);assert.equal(e.karaoke.diagnostics(1).decoder.replaysLifetime,0);
});
test('profile/crop configuration preserves bytes and rebuilds both associated deck views on demand',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');e.state.decks[0].position=4/300;e.state.decks[1].position=4/300;
  const old=e.karaoke.frame(0),other=e.karaoke.frame(1),length=old.diagnostics.retainedAssociationBytes;
  const info=e.karaoke.configure(0,{transparency:'alpha-table',crop:true});assert.equal(info.transparencyProfile,'alpha-table');assert.equal(info.crop,true);assert.equal(info.retainedAssociationBytes,length);assert.equal(info.decoder.packetCursor,0);assert.equal(old.canvas.width,0);
  const next=e.karaoke.frame(0),second=e.karaoke.frame(1);assert.equal(next.canvas.width,288);assert.equal(next.canvas.height,192);assert.notEqual(next.assetId,old.assetId);assert.notEqual(second.assetId,other.assetId);assert.equal(other.canvas.width,0);assert.equal(second.diagnostics.transparencyProfile,'alpha-table');
});
test('invalid configuration/file reads preserve the previously committed pair',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');e.state.decks[0].position=1/300;const before=e.karaoke.frame(0);
  assert.throws(()=>e.karaoke.configure(0,{transparency:'guess'}),RangeError);assert.throws(()=>e.karaoke.configure(0,{crop:'true'}),TypeError);
  await assert.rejects(e.karaoke.load(0,file(),'shared',{transparency:'guess'}),RangeError);await assert.rejects(e.karaoke.load(0,file(new Uint8Array(23)),'shared'),/complete24-byte/);
  const failed=delayed();const p=e.karaoke.load(0,failed.file,'shared');failed.reject(new Error('read failure'));await assert.rejects(p,/read failure/);
  const after=e.karaoke.frame(0);assert.equal(after.assetId,before.assetId);assert.equal(after.canvas,before.canvas);assert.deepEqual(pixel(after),[255,0,0,255]);
});
test('unknown/timing packets and trailing bytes remain available with prefix diagnostics',async()=>{
  const e=environment(),bytes=join(packet(0,[],0),packet(47,[],9),new Uint8Array(5));await e.karaoke.load(0,file(bytes),'shared');
  e.state.decks[0].position=0;const first=e.karaoke.frame(0);assert.equal(first.diagnostics.graphicsStatus,'no-graphics-packets-in-current-prefix');assert.equal(first.diagnostics.decoder.timingPackets,1);assert.equal(first.diagnostics.decoder.trailingBytes,5);assert.equal(first.diagnostics.available,true);
  e.state.decks[0].position=1;const last=e.karaoke.frame(0);assert.equal(last.diagnostics.decoder.unknownInstructions,1);assert.equal(last.diagnostics.decoder.totalPackets,2);assert.equal(last.diagnostics.decoder.endOfStream,true);
});
test('graphics EOF holds exact last pixels without arbitrary elapsed-time cap',async()=>{
  const e=environment();await e.karaoke.load(0,file(join(clut(),packet(1,[1]))),'shared');e.state.decks[0].position=3;const first=e.karaoke.frame(0).canvas.pixels.slice();
  e.state.decks[0].position=1e10;assert.deepEqual(e.karaoke.frame(0).canvas.pixels,first);assert.equal(e.karaoke.diagnostics(0).decoder.endOfStream,true);
});
test('later load wins while an older read completes last',async()=>{
  const e=environment(),old=delayed(),p=e.karaoke.load(0,old.file,'shared');
  await e.karaoke.load(0,file(join(clut(),packet(1,[2])),'new.cdg'),'shared');old.resolve();assert.equal(await p,null);
  e.state.decks[0].position=1;const frame=e.karaoke.frame(0);assert.equal(frame.diagnostics.name,'new.cdg');assert.deepEqual(pixel(frame),[0,255,0,255]);
});
test('track ownership change rejects a late read and returning to old track recreates its prior association',async()=>{
  const e=environment(),original=e.state.decks[0].track;await e.karaoke.load(0,file(),'shared');const before=e.karaoke.frame(0),pending=delayed(),p=e.karaoke.load(0,pending.file,'shared');
  e.state.decks[0].track={id:'replacement'};assert.equal(e.karaoke.frame(0),null);pending.resolve();assert.equal(await p,null);assert.equal(e.karaoke.diagnostics(0).available,false);
  e.state.decks[0].track=original;const restored=e.karaoke.frame(0);assert(restored);assert.notEqual(restored.assetId,before.assetId);assert.equal(before.canvas.width,0);
});
test('reloaded track object with the same ID gets a fresh view and cannot receive an old pending load',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');const before=e.karaoke.frame(0),pending=delayed(),p=e.karaoke.load(0,pending.file,'shared');
  e.state.decks[0].track={id:'shared'};pending.resolve();assert.equal(await p,null);const after=e.karaoke.frame(0);assert.notEqual(after.assetId,before.assetId);assert.equal(after.diagnostics.decoder.replaysLifetime,0);
});
test('same-object audio reload generation resets decoder identity and rejects prior pending graphics',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');const old=e.karaoke.frame(0),pending=delayed(),p=e.karaoke.load(0,pending.file,'shared');
  e.state.decks[0].videoLoadGeneration=1;pending.resolve();assert.equal(await p,null);const fresh=e.karaoke.frame(0);
  assert.notEqual(fresh.assetId,old.assetId);assert.notEqual(fresh.canvas,old.canvas);assert.equal(old.canvas.width,0);assert.equal(fresh.diagnostics.decoder.renderCallsLifetime,1);
});
test('clear removes shared association, invalidates pending generation and clears the other deck next frame',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');const a=e.karaoke.frame(0),b=e.karaoke.frame(1),pending=delayed(),p=e.karaoke.load(1,pending.file,'shared');
  assert.equal(e.karaoke.clear(0),true);assert.equal(a.canvas.width,0);pending.resolve();assert.equal(await p,null);assert.equal(e.karaoke.frame(0),null);assert.equal(e.karaoke.frame(1),null);assert.equal(b.canvas.width,0);assert.equal(e.karaoke.diagnostics(1).available,false);
});
test('global per-track load revision prevents cross-deck late overwrite',async()=>{
  const e=environment(),old=delayed(),p=e.karaoke.load(0,old.file,'shared');await e.karaoke.load(1,file(join(clut(),packet(1,[2])),'new.cdg'),'shared');old.resolve();assert.equal(await p,null);
  e.state.decks[0].position=1;e.state.decks[1].position=1;assert.deepEqual(pixel(e.karaoke.frame(0)),[0,255,0,255]);assert.equal(e.karaoke.frame(1).diagnostics.name,'new.cdg');
});
test('configure invalidates a pending replacement but retains committed bytes',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');const pending=delayed(),p=e.karaoke.load(0,pending.file,'shared');
  e.karaoke.configure(0,{crop:true});assert.equal(e.karaoke.diagnostics(0).loading,false);pending.resolve();assert.equal(await p,null);assert.equal(e.karaoke.frame(0).canvas.width,288);
});
test('dispose invalidates deferred work, releases canvases/bytes and never resurrects a pair',async()=>{
  const e=environment();await e.karaoke.load(0,file(),'shared');const frame=e.karaoke.frame(0),pending=delayed(),p=e.karaoke.load(1,pending.file,'shared');
  e.karaoke.dispose();e.karaoke.dispose();pending.resolve();assert.equal(await p,null);assert.equal(frame.canvas.width,0);assert.equal(e.karaoke.diagnostics(0).retainedAssociationBytes,0);assert.equal(e.karaoke.diagnostics(0).available,false);
  assert.throws(()=>e.karaoke.frame(0),/disposed/);await assert.rejects(e.karaoke.load(0,file(),'shared'),/disposed/);
});
test('invalid deck, missing ownership and fake file are rejected without creating an association',async()=>{
  const e=environment();assert.throws(()=>createVideoKaraoke(),TypeError);await assert.rejects(e.karaoke.load(7,file(),'shared'),RangeError);await assert.rejects(e.karaoke.load(0,file(),'wrong'),/ownership/);
  await assert.rejects(e.karaoke.load(0,{name:'fake.cdg',size:24,arrayBuffer:async()=>new ArrayBuffer(24)},'shared'),TypeError);assert.throws(()=>e.karaoke.configure(0,{crop:true}),/No CDG/);assert.equal(e.karaoke.diagnostics(0).available,false);assert.equal(videoKaraokePolicy.referenceEquivalent,false);
});

let passed=0;for(const {name,run} of tests){await run();passed++;console.log(`PASS ${name}`);}
console.log(`${passed}/${tests.length} actual-decoder karaoke ownership/clock checks passed.`);
console.log('Scope: actual CDG decoder and karaoke module with original packet/File fixtures and controlled Canvas2D putImageData collaborator; no actual browser canvas/AV synchronization, UI, native or Serato equivalence acceptance.');
