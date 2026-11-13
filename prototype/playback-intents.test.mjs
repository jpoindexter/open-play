import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlaybackIntents} from './playback-intents.js';

test('Play command evidence is bounded, scalar-only, copied, private and nonblocking',()=>{
 let at=0,failClock=false;
 const log=createPlaybackIntents({now:()=>{if(failClock)throw Error('Clock unavailable');return at++;}});
 const deck={index:1,playing:false,processing:true,playQueued:true,track:{title:'PRIVATE TRACK',file:'/private/music.mp3'}};
 const event={type:'keydown',code:'KeyS',key:'PRIVATE KEY',isTrusted:true,shiftKey:true,
  target:{tagName:'BUTTON',textContent:'PRIVATE TEXT',dataset:{action:'play',track:'PRIVATE ID'}},deviceId:'PRIVATE DEVICE'};
 Object.defineProperty(event,'stack',{get(){throw Error('Must not inspect stack');}});
 assert.equal(log.record(deck,{origin:'keyboard',event,intent:'start',ready:false,visibility:'visible'}),true);
 const first=log.snapshot()[0];
 assert.deepEqual(first,{at:0,deck:2,intent:'start',playing:false,processing:true,queued:true,origin:'keyboard',ready:false,visibility:'visible',eventType:'keydown',trusted:true,code:'KeyS',ctrl:false,meta:false,alt:false,shift:true,repeat:false,button:null,pointerType:null,targetTag:'BUTTON',targetAction:'play'});
 deck.index=3;event.code='KeyW';event.target.dataset.action='stutter';
 assert.equal(log.snapshot()[0].deck,2);assert.equal(log.snapshot()[0].code,'KeyS');
 first.origin='tampered';const exported=log.snapshot();exported[0].deck=99;exported.push({});
 assert.equal(log.snapshot().length,1);assert.equal(log.snapshot()[0].origin,'keyboard');assert.equal(log.snapshot()[0].deck,2);
 log.record(deck,{origin:'PRIVATE ORIGIN',event:{type:'PRIVATE TYPE',code:'KeyP',key:'PRIVATE KEY',target:{tagName:'PRIVATE TAG',dataset:{action:'PRIVATE ACTION'}}},intent:'PRIVATE INTENT',visibility:'PRIVATE VISIBILITY'});
 const unknown=log.snapshot()[1];assert.equal(unknown.origin,'unknown');assert.equal(unknown.intent,'unknown');assert.equal(unknown.visibility,'unknown');assert.equal(unknown.code,null);assert.equal(unknown.eventType,null);assert.equal(unknown.targetTag,null);assert.equal(unknown.targetAction,null);
 assert(!JSON.stringify(log.snapshot()).includes('PRIVATE'));
 for(let n=0;n<40;n++)log.record({index:n%4},{origin:'gui',intent:'toggle',ready:true,visibility:'hidden',event:{type:'click',isTrusted:false,button:0,pointerType:'mouse'}});
 const bounded=log.snapshot();assert.equal(bounded.length,32);assert.equal(bounded[0].at,10);assert.equal(bounded.at(-1).at,41);
 assert(bounded.every(row=>Object.values(row).every(value=>value===null||['string','number','boolean'].includes(typeof value))));
 const before=JSON.stringify(log.snapshot());failClock=true;
 assert.doesNotThrow(()=>assert.equal(log.record(deck,{origin:'gui'}),false));assert.equal(JSON.stringify(log.snapshot()),before);
 failClock=false;const hostile={get index(){throw Error('Broken caller object');}};
 assert.doesNotThrow(()=>assert.equal(log.record(hostile),false));assert.equal(JSON.stringify(log.snapshot()),before);
 assert.doesNotThrow(()=>log.record(null,null));
});
