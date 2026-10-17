import assert from 'node:assert/strict';
import {createDeckMIDIRouter,herculesPlaybackMappings} from '../prototype/deck-midi.js';
const decks=Array.from({length:4},(_,index)=>({index,track:{id:'t'+index},playing:false,rate:1})),calls=[],sampleCalls=[],releaseCalls=[];
let bank=0,resolveFirst;const tokens=new Map();
const router=createDeckMIDIRouter({state:{decks},engine:{voices:new Map()},actions:{deckAction:async(a,i)=>calls.push([a,i]),cueHolds:{press:async(...args)=>calls.push(['clear',...args]),release:async()=>{}},midiSample:(index,alt)=>{const key=bank*8+index,t=(tokens.get(key)||0)+1;tokens.set(key,t);sampleCalls.push({key,alt});return{pending:index===0&&!alt&&sampleCalls.length===1?new Promise(resolve=>resolveFirst=resolve):Promise.resolve(),release:alt?null:()=>{if(tokens.get(key)===t)releaseCalls.push(key);}}}}});
const message=(number,value=127,deviceId='a')=>({type:'Note',channel:7,number,value,pressed:value>0,deviceId});
const map=target=>({target,encoding:'7-bit absolute'});
const starting=router.dispatch(message(48),map('Sampler 1'));await Promise.resolve();bank=1;assert.equal(router.release(message(48,0)),true);assert.deepEqual(releaseCalls,[0]);resolveFirst();await starting;
await router.dispatch(message(48),map('Sampler 1'));await router.dispatch(message(48,127,'b'),map('Sampler 1'));router.release(message(48,0));assert.deepEqual(releaseCalls,[0]);router.release(message(48,0,'b'));assert.deepEqual(releaseCalls,[0,8]);
await router.dispatch(message(63),map('Sampler 8 alt'));assert.deepEqual(sampleCalls.at(-1),{key:15,alt:true});router.release(message(63,0));
await router.dispatch(message(49),map('Sampler 2'));router.resetInput('a');assert.equal(releaseCalls.at(-1),9);
for(const [n,name]of ['slip','quantize','tempo range','previous','stutter'].entries()){await router.dispatch(message(70+n),map('Deck 2 '+name));router.release(message(70+n,0));}
assert.deepEqual(calls.slice(-5),[['slip',1],['quantize',1],['range',1],['previous',1],['stutter',1]]);
await router.dispatch(message(8),map('Deck 1 clear cue 1'));assert.equal(calls.at(-1).at(-1),true);router.release(message(8,0));
const preset=herculesPlaybackMappings('candidate');assert.equal(preset.find(m=>m.channel===5&&m.number===2&&m.type==='Note').target,'Deck 1 tempo range');assert.equal(preset.find(m=>m.channel===5&&m.number===6&&m.type==='Note').target,'Deck 1 previous');assert.equal(preset.filter(m=>m.target==='Sampler 8').length,2);
console.log(JSON.stringify({passed:true,scope:'Changed MIDI action/captured-release policy with collaborators; not actual audio/hardware',checks:['release after bank change while preparation is pending','older slot owner cannot stop newer owner','all8 sampler/alternate addressing and disconnect release','documented transport modifier actions and cue clear'],staticPresetMappings:preset.length}));
