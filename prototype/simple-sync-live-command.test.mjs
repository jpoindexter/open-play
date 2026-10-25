import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import * as simple from './sync.js';

// Actual Simple Sync/engine and actual app manual-intent hook, controlled
// buffer, source clock and live ACK endpoints. No DSP/native/audible proof.
const text=readFileSync(new URL('./simple-sync-preparation.test.mjs',import.meta.url),'utf8');
const factory=new Function('AudioEngine','synchronizeSimple',text.slice(text.indexOf('function fixture('),text.indexOf('\nconst saved='))+';return fixture;')(AudioEngine,simple.synchronizeSimple);
const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const hook=app.slice(app.indexOf('engine.onManualPosition ='),app.indexOf('\nengine.onGridTimeline ='));
async function until(test){for(let n=0;n<100;n++){if(test())return;await Promise.resolve();}assert.fail('Actual live ACK boundary not reached');}
function live(f,d){
 let position=d.position,when=1,rate=d.rate,release;
 const old=f.engine.voices.get(d.index)||{sources:[]},adapter={
  position:at=>position+Math.max(0,(at??f.engine.ctx.currentTime)-when)*rate,stateAt:()=>({rate}),
  seek(next){return new Promise(resolve=>{release=()=>{position=next;when=1.01;resolve({position,when,playing:true});};});},
  update(next){return new Promise(resolve=>{release=()=>{position=adapter.position(1.01);when=1.01;rate=next.rate??rate;resolve({position,when,rate,superseded:false});};});}
 };
 old.liveKeylock=adapter;f.engine.voices.set(d.index,old);d.keylock=true;
 return{old,release:()=>{assert.equal(typeof release,'function');release();}};
}
function fixture({holdStart=false}={}){
 const f=factory(),state={decks:[f.leader,f.deck]},calls=[],prepared=[];
 const own=live(f,f.deck),primary=live(f,f.leader);
 f.engine.createForwardKeylock=async options=>{
  let position=options.position,when=1,disposed=false;
  const adapter={outputs:[],snapshot:()=>({groups:[{latency:.02}]}),stateAt:()=>({rate:options.rate}),
   position:at=>position+Math.max(0,(at??f.engine.ctx.currentTime)-when)*options.rate,
   async dispose(){disposed=true;},get disposed(){return disposed;},
   start(settings){position=settings.position;when=settings.when;
    return new Promise(resolve=>{const row={signal:options.signal,adapter,release:()=>resolve({position,when,playing:true})};prepared.push(row);if(!holdStart)row.release();});}};
  return adapter;
 };
 vm.runInNewContext(hook,{engine:f.engine,state,cancelSimpleSync:(...args)=>{calls.push({kind:'simple',owner:args[1].index,changed:(args[2]||args[1]).index});simple.cancelSimpleSync?.(...args);},smartSync:{manipulated:d=>calls.push({kind:'smart',changed:d.index})}});
 return{...f,state,calls,prepared,own,primary};
}

for(const stage of ['buffers','owned ACK'])for(const targetName of ['incoming','leader'])test(`new ${targetName} live Seek intent cancels older Simple Sync during ${stage}`,async()=>{
 const f=fixture({holdStart:stage==='owned ACK'}),target=targetName==='incoming'?f.deck:f.leader,manual=targetName==='incoming'?f.own:f.primary;
 const pending=f.press(),rejected=assert.rejects(pending,{name:'AbortError'});
 if(stage==='owned ACK'){f.release();await until(()=>f.prepared[0]);}
 const seek=f.engine.seek(target,11);
 if(stage==='buffers')f.release();else f.prepared[0].release();
 await rejected;
 assert.equal(f.engine.voices.get(1),f.own.old);assert.equal(f.engine.voices.get(0),f.primary.old);
 assert.equal(f.retired.length,0);assert.equal(f.starts.length,0);assert.equal(f.deck.rate,1);
 assert.equal(f.deck.processing,false);assert.equal(f.engine.transforms.size,0);
 if(stage==='owned ACK'){assert.equal(f.prepared[0].signal.aborted,true);assert.equal(f.prepared[0].adapter.disposed,true);}
 manual.release();await seek;assert.equal(target.anchorPosition,11);assert.equal(target.playing,true);
 assert.equal(f.engine.voices.get(target.index),manual.old);
});

for(const rate of [1,1.1])test(`pending live rate ${rate} keeps existing immediate-owner cancellation`,async()=>{
 const f=fixture(),pending=f.press(),rejected=assert.rejects(pending,{name:'AbortError'});
 const update=f.engine.setRate(f.deck,rate);f.release();await rejected;f.own.release();await update;
 assert.equal(f.deck.rate,rate);assert.equal(f.engine.voices.get(1),f.own.old);assert.equal(f.retired.length,0);assert.equal(f.prepared.length,0);
});

test('manual Seek on an unrelated four-deck pair cannot cancel the current Simple Sync',async()=>{
 const f=fixture(),other={...f.deck,index:2,track:{id:'unrelated',bpm:120,grid:0,duration:60}},fourth={...other,index:3};
 f.state.decks.push(other,fourth);const manual=live(f,other),pending=f.press();
 const seek=f.engine.seek(other,11);f.release();const result=await pending;
 assert.equal(result.kind,'grid');assert.equal(f.retired.length,1);assert.equal(f.engine.voices.get(0),f.primary.old);
 manual.release();await seek;assert.equal(other.anchorPosition,11);assert.equal(f.engine.voices.get(2),manual.old);
});

test('actual app hook offers every deck request cancellation before Smart Sync manipulation',()=>{
 const f=fixture();f.engine.onManualPosition(f.leader);
 assert.deepEqual(f.calls.map(c=>c.kind),['simple','simple','smart']);
 assert.deepEqual(f.calls.filter(c=>c.kind==='simple').map(c=>[c.owner,c.changed]),[[0,0],[1,0]]);
});
