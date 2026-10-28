import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AudioEngine} from './engine.js';
import {createDeckKeyShift} from './deck-key-shift.js';

// Reuse the existing controlled graph and cached real-renderer-validation
// fixture. This checks original-time ownership, not rendered PCM or reversal.
const source=readFileSync(new URL('./rate-failure-safety.test.mjs',import.meta.url),'utf8');
const bus=source.slice(source.indexOf('const bus='),source.indexOf('\nfunction fixture('));
const body=source.slice(source.indexOf('function fixture('),source.indexOf('\nfor(const reverse'));
const fixture=new Function('AudioEngine',bus+'\n'+body+'\nreturn fixture;')(AudioEngine);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
async function ready(reverse,shift=24){
 const f=fixture({reverse,loop:!reverse,shift});f.deck.rate=1.01;f.deck.keylock=true;f.cache(1.01);await f.engine.start(f.deck);return f;
}
async function waitFor(test){for(let n=0;n<100;n++){if(test())return;await Promise.resolve();}assert.fail('Renderer did not reach controlled wait');}

test('overlapping mapped key changes reject back to the retained pitch configuration',async()=>{
 const f=fixture({loop:true,shift:12}),{engine,deck}=f;await engine.start(deck);
 const voice=engine.voices.get(0),clock=engine.voiceClock(deck,voice),held=deferred(),render=engine.keylockRenderer.render.bind(engine.keylockRenderer);let calls=0,saved=0;
 engine.keylockRenderer.render=async(...args)=>{if(++calls===1){await held.promise;return render(...args);}throw Error('controlled newer pitch rejection');};
 const keys=createDeckKeyShift({state:{decks:[deck]},engine,cancel(){},persist(){saved++;},render(){}});
 const older=keys.set(0,13),aborted=assert.rejects(older,{name:'AbortError'});
 try{await waitFor(()=>calls===1);await assert.rejects(keys.set(0,14),/newer pitch rejection/);}
 finally{held.resolve();await aborted;}
 assert.equal(deck.keylock,false);assert.equal(deck.keyShift,12);assert.equal(keys.intent(0),12);assert.equal(saved,0);
 assert.equal(engine.voices.get(0),voice);assert.equal(deck.playing,true);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
 engine.ctx.currentTime+=.2;assert.equal(engine.position(deck),clock(engine.ctx.currentTime));assert.equal(deck.rate,1);assert.equal(deck.reverse,false);assert.equal(deck.loop,true);
 assert.equal(f.starts.length,1);assert.equal(f.stops.length,0);assert.equal(f.retired.length,0);engine.pause(deck);
});

test('failed overlap retains the committed future live-grid pitch',async()=>{
 const f=fixture({loop:false,shift:0}),{engine,deck}=f,held=deferred();let calls=0;
 engine.onGridTimeline=(_d,{position,when})=>({bpm:120,grid:[{time:0,bpm:120}],events:[],clock:at=>position+at-when,rateAt:()=>1});
 const adapter=()=>({outputs:[],snapshot:()=>({groups:[]}),startTimeline:async({position,when})=>({position,when,playing:true}),dispose:async()=>{}});
 engine.createForwardKeylock=async()=>adapter();await engine.start(deck);await engine.setPitch(deck,{keylock:true,semitones:12});
 const voice=engine.voices.get(0),when=deck.anchorTime;assert(voice.liveKeylock&&voice.gridTimeline);assert(when>engine.ctx.currentTime);
 engine.createForwardKeylock=async()=>{if(++calls===1){await held.promise;throw Error('controlled older grid rejection');}throw Error('controlled newer grid rejection');};
 const older=engine.setPitch(deck,{keylock:true,semitones:13}),rejected=assert.rejects(older,/older grid rejection/);
 try{await waitFor(()=>calls===1);await assert.rejects(engine.setPitch(deck,{keylock:false,semitones:14}),/newer grid rejection/);}
 finally{held.resolve();await rejected;}
 assert.equal(deck.keylock,true);assert.equal(deck.keyShift,12);assert.equal(engine.voices.get(0),voice);assert.equal(deck.anchorTime,when);
 assert.equal(deck.playing,true);assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);assert.equal(deck.rate,1);assert.equal(deck.reverse,false);assert.equal(deck.loop,false);
 engine.pause(deck);
});

for(const reverse of [false,true])test(`${reverse?'reverse':'forward loop'} rejected Key Lock Off retains the old playable owner`,async()=>{
 const f=await ready(reverse),{engine,deck}=f,voice=engine.voices.get(0),position=engine.position(deck),started=f.starts.length,stopped=f.stops.length;
 await assert.rejects(engine.setPitch(deck,{keylock:false}),/Pitch must be/);
 assert.equal(deck.keylock,true);assert.equal(deck.keyShift,24);assert.equal(deck.rate,1.01);
 assert.equal(deck.playing,true);assert.equal(engine.voices.get(0),voice);assert.equal(engine.position(deck),position);
 assert.equal(f.starts.length,started);assert.equal(f.stops.length,stopped);assert.deepEqual(f.retired,[]);
 assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
 engine.pause(deck);await engine.start(deck);assert.equal(deck.playing,true);
});

for(const change of [{keylock:false,semitones:12},{keylock:true,semitones:13}])test(`valid reverse pitch ${JSON.stringify(change)} keeps the future original-time handoff`,async()=>{
 const f=await ready(true,12),{engine,deck}=f,old=engine.voices.get(0),clock=engine.voiceClock(deck,old),stopped=f.stops.length;
 f.cache(deck.rate,change.semitones+(change.keylock?0:12*Math.log2(deck.rate)));
 await engine.setPitch(deck,change);const voice=engine.voices.get(0),when=deck.anchorTime;
 assert.equal(deck.playing,true);assert.equal(deck.reverse,true);assert.equal(deck.keylock,change.keylock);assert.equal(deck.keyShift,change.semitones);
 assert.ok(when>engine.ctx.currentTime);assert.ok(Math.abs(deck.anchorPosition-clock(when))<1e-9,'Pitch preparation must follow the advancing reverse source clock');
 assert.ok(voice.handoffBefore,'Old reverse audio must remain owned until the future boundary');assert.equal(voice.handoffBefore.owner,old);
 assert.equal(f.stops.length,stopped);assert.deepEqual(f.retired,[old]);assert.equal(deck.processing,false);
});

test('Stop revokes held reverse pitch preparation without a later restart',async()=>{
 const f=await ready(true,12),{engine,deck}=f,held=deferred(),original=engine.keylockRenderer.render.bind(engine.keylockRenderer);let waiting=false;
 f.cache(deck.rate,12+12*Math.log2(deck.rate));
 engine.keylockRenderer.render=async(...args)=>{waiting=true;await held.promise;return original(...args);};
 const pending=engine.setPitch(deck,{keylock:false}),rejected=assert.rejects(pending,{name:'AbortError'});await waitFor(()=>waiting);
 const started=f.starts.length;engine.pause(deck);held.resolve();await rejected;
 assert.equal(deck.playing,false);assert.equal(engine.voices.size,0);assert.equal(f.starts.length,started);assert.deepEqual(f.retired,[]);
 assert.equal(deck.processing,false);assert.equal(engine.transforms.size,0);
});

test('late reverse pitch rejection cannot overwrite a newer replacement start',async()=>{
 const f=await ready(true,12),{engine,deck}=f,held=deferred(),original=engine.keylockRenderer.render.bind(engine.keylockRenderer);let waiting=false;
 engine.keylockRenderer.render=async()=>{waiting=true;await held.promise;throw Error('controlled older pitch failure');};
 const pending=engine.setPitch(deck,{keylock:false}),rejected=assert.rejects(pending,/older pitch failure/);await waitFor(()=>waiting);
 engine.pause(deck);Object.assign(deck,{track:{id:'newer-pitch-owner',bpm:100,grid:0,duration:30},position:7,reverse:false,loop:false,keylock:false,keyShift:0});
 engine.keylockRenderer.render=original;await engine.setRate(deck,.9);await engine.start(deck);
 const voice=engine.voices.get(0),token=engine.startTokens.get(0);held.resolve();await rejected;
 assert.equal(deck.track.id,'newer-pitch-owner');assert.equal(deck.rate,.9);assert.equal(deck.keylock,false);assert.equal(deck.keyShift,0);
 assert.equal(deck.playing,true);assert.equal(engine.voices.get(0),voice);assert.equal(engine.startTokens.get(0),token);assert.equal(deck.processing,false);
});

test('reverse scratch and censor gesture voices retain their existing pitch fallback policy',async()=>{
 // Actual setPitch dispatch with controlled gesture endpoints; this does not
 // establish scratch/censor DSP or release behavior.
 for(const kind of ['deckScratchTransport','censorReverse']){
  const f=await ready(true,12),{engine,deck}=f,calls=[];engine.voices.get(0)[kind]={};
  engine.pause=()=>{calls.push('pause');deck.playing=false;};
  engine.start=async(d,options)=>{calls.push(options);d.playing=true;};
  await engine.setPitch(deck,{keylock:false});
  assert.equal(calls.length,2);assert.equal(calls[0],'pause');assert.equal(calls[1],undefined,'The ordinary reverse handoff must not absorb active gesture transports');
  assert.equal(deck.reverse,true);assert.equal(deck.keylock,false);assert.equal(deck.keyShift,12);
 }
});
