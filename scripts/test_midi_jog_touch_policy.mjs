import assert from 'node:assert/strict';
import {AudioEngine} from '../prototype/engine.js';
import {createMIDIJogTouch,midiJogTouchPolicy} from '../prototype/midi-jog-touch.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const note=(pressed=true,deviceId='hercules')=>({type:'Note',channel:2,number:8,pressed,deviceId});
function fixture(extra={}){
 let at=0,serial=0,owner=null;const timers=new Map(),calls=[],errors=[];
 const deck={index:0,track:{duration:20,id:'a'},position:4,playing:true};
 const engine={position:d=>d.position,beginDeckScratch:async(d,o)=>{calls.push(['begin',o]);owner=o;return{owner:o};},updateDeckScratch:async(d,m,o)=>{if(owner!==o)return false;calls.push(['move',m.position,m.velocity]);d.position=m.position;return true;},endDeckScratch:async(d,o)=>{calls.push(['end',o]);if(owner===o)owner=null;return true;},...extra};
 const touch=createMIDIJogTouch({engine,state:{settings:{'Virtual Deck Speed':'45 RPM'}},now:()=>at,setTimer:fn=>{timers.set(++serial,fn);return serial;},clearTimer:id=>timers.delete(id),onError:e=>errors.push(e.message)});
 return{deck,touch,calls,errors,timers,engine,setAt:x=>at=x};
}
const a=fixture();await a.touch.press(a.deck,note());a.setAt(20);await a.touch.move(a.deck,4,'hercules');a.setAt(40);await a.touch.move(a.deck,-2,'hercules');
assert.ok(Math.abs(a.deck.position-(4+2*60/45/midiJogTouchPolicy.ticksPerRevolution))<1e-12);
await assert.rejects(a.touch.press(a.deck,note(true,'other')),/owner/);const count=a.calls.length;await a.touch.move(a.deck,99,'other');assert.equal(a.calls.length,count);
[...a.timers.values()].at(-1)();await flush();assert.equal(a.calls.at(-1)[2],0);
assert.equal(a.touch.releaseMessage(note(false)),true);await flush();assert.equal(a.calls.at(-1)[0],'end');assert.equal(a.touch.diagnostics().length,0);assert.equal(a.touch.releaseMessage(note(false)),false);
let ready;const b=fixture({beginDeckScratch:()=>new Promise(resolve=>ready=resolve)});const pending=b.touch.press(b.deck,note());await flush();b.touch.releaseMessage(note(false));ready(true);await pending;await flush();assert.equal(b.calls.some(x=>x[0]==='move'),false);assert.equal(b.touch.diagnostics().length,0);
let gate;const c=fixture();const late=createMIDIJogTouch({engine:c.engine,state:{settings:{}},beforeBegin:()=>new Promise(resolve=>gate=resolve)});const waiting=late.press(c.deck,note());late.releaseMessage(note(false));gate();await waiting;await flush();assert.equal(c.calls.some(x=>x[0]==='begin'),false);
const d=fixture();await d.touch.press(d.deck,note());await d.touch.resetInput('hercules');assert.equal(d.calls.at(-1)[0],'end');assert.equal(d.touch.diagnostics().length,0);
const e=fixture();await e.touch.press(e.deck,note());e.deck.track={id:'new',duration:20};const moves=e.calls.filter(x=>x[0]==='move').length;await e.touch.move(e.deck,10,'hercules');e.touch.releaseMessage(note(false));await flush();assert.equal(e.calls.filter(x=>x[0]==='move').length,moves);
const f=fixture();await f.touch.press(f.deck,note());f.engine.updateDeckScratch=async()=>{throw Error('Final movement rejected');};f.touch.releaseMessage(note(false));await flush();assert.equal(f.calls.at(-1)[0],'end');assert.deepEqual(f.errors,['Final movement rejected']);
const fast=fixture();await fast.touch.press(fast.deck,note(),{fast:true,vinyl:false});fast.setAt(20);await fast.touch.move(fast.deck,1,'hercules');assert.ok(Math.abs(fast.deck.position-(4+4*60/45/248))<1e-12);await fast.touch.resetInput();
const off=fixture();await off.touch.press(off.deck,note(),{vinyl:false});assert.equal(off.calls.length,0);assert.equal(await off.touch.move(off.deck,1,'hercules'),false);await off.touch.resetInput();
const backend=Object.create(AudioEngine.prototype),transportState={phase:'idle',generation:1,position:4,audioTime:2,rate:1},transport={state:()=>({...transportState}),command:async(type,data)=>{assert.equal(type,'rate');transportState.rate=data.rate;return{...transportState};}};
const idleDeck={index:0,track:{duration:20},playing:true,rate:1},voice={deckScratchTransport:transport};Object.assign(backend,{voices:new Map([[0,voice]]),rateOwners:new WeakMap(),deckScratchRequests:new Map()});
await backend.setJogBend(idleDeck,1.08);assert.equal(transportState.rate,1.08);assert.equal(idleDeck.rate,1);await backend.setJogBend(idleDeck,1);assert.equal(transportState.rate,1);
transportState.phase='scratching';await assert.rejects(backend.setJogBend(idleDeck,1.08),/scratch/);assert.equal(transportState.rate,1);
console.log(JSON.stringify({passed:true,scope:'MIDI touch actor with controlled clock/engine; not actual audio or hardware acceptance',checks:['signed movement and idle hold','one input owner and original Note Off release','release before preparation/beforeBegin completes','disconnect and track replacement','End still runs when final movement rejects','fast displacement and Vinyl-off routing','actual engine bends idle scratch playback but refuses active scratch']}));
