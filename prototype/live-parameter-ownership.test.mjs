import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';

for(const kind of ['pitch','rate'])for(const replace of [false,true])test(`${kind} failure ${replace?'cannot roll back replacement settings':'restores its current settings'}`,async()=>{
 const engine=new AudioEngine(),deck={index:0,track:{id:'original'},playing:true,keylock:true,keyShift:0,rate:1};
 engine.cancelDeckScratchRequest=()=>{};
 let reject;
 const live={update:()=>new Promise((_,r)=>{reject=r;})};
 engine.voices.set(0,{liveKeylock:live});
 const change=kind==='pitch'?()=>engine.setPitch(deck,{keylock:true,semitones:2}):()=>engine.setRate(deck,1.1);
 const pending=change(),rejected=assert.rejects(pending,/controlled old update failure/);
 if(replace){
  Object.assign(deck,{track:{id:'replacement'},keylock:true,keyShift:2,rate:1.1});
  engine.voices.set(0,{liveKeylock:{}});
 }
 const voice=engine.voices.get(0);
 reject(Error('controlled old update failure'));await rejected;
 assert.equal(deck.keylock,true);
 assert.equal(deck.keyShift,replace?2:0);
 assert.equal(deck.rate,replace?1.1:1);
 assert.equal(engine.voices.get(0),voice);
 assert.equal(deck.playing,true);
});
