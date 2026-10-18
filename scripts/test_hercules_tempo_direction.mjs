import assert from 'node:assert/strict';
import {createDeckMIDIRouter,herculesPlaybackMappings} from '../prototype/deck-midi.js';
import {decodeMIDI,matchesMIDIMap} from '../prototype/midi.js';

const mappings=herculesPlaybackMappings('fixture-controller');
const decks=[0,1].map(index=>({index,rate:1,pitchRange:8,track:{id:`track-${index}`,duration:30}}));
const router=createDeckMIDIRouter({state:{decks},engine:{setRate:async(deck,rate)=>{deck.rate=rate;}},actions:{}});
async function send(deck,raw,shift=false){
 for(const [number,value]of [[8,raw>>7],[40,raw&127]]){
  const message={...decodeMIDI([0xb0+deck+1+(shift?3:0),number,value]),deviceId:'fixture-controller'};
  for(const mapping of mappings.filter(candidate=>matchesMIDIMap(message,candidate)))await router.dispatch(message,mapping);
 }
}
for(let deck=0;deck<2;deck++){
 for(const action of ['tempo','tempo ignore'])assert.equal(mappings.find(row=>row.target===`Deck ${deck+1} ${action}`).invert,true);
 await send(deck,8192);assert.equal(decks[deck].rate,1,'physical centre remains exact zero pitch after inversion');
 await send(deck,16383);assert.equal(decks[deck].rate,.92,'larger raw value / physical up is slower');
 await send(deck,0);assert.equal(decks[deck].rate,1.08,'smaller raw value / physical down is faster');
 await send(deck,8192);assert.equal(decks[deck].rate,1);
 await send(deck,12000,true);assert.equal(decks[deck].rate,1,'Shift ignores speed changes');
 await send(deck,12000);assert.equal(decks[deck].rate,1,'release does not jump without pickup');
 await send(deck,8192);assert.equal(decks[deck].rate,1);
}
console.log(JSON.stringify({passed:true,scope:'Production Hercules preset and MIDI router, two-deck paired packets, exact centre and signed endpoints plus Shift-ignore/pickup. Engine collaborator only; no new hardware/audio acceptance.',mappings:mappings.length}));
