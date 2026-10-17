import {gridBPM} from './beatgrid.js';
const positive=n=>Number.isFinite(n)&&n>0;
// A stopped Smart Sync deck has a planned nominal tempo, but no audible warp
// voice whose local rate can cancel the source section's BPM. Keep this UI/FX
// calculation separate from the engine's actual audible-rate clock.
export function currentDeckBPM(deck,engine,{smartSync=false,targetBPM=null}={}){
 if(!positive(deck.track?.bpm))return null;
 const planned=smartSync&&deck.sync&&['armed','beat','tempo'].includes(deck.syncState)&&!deck.playing;
 const bpm=planned?(positive(targetBPM)?targetBPM:deck.track.bpm*deck.rate):gridBPM(deck.track,engine.position(deck))*engine.audibleRate(deck);
 return positive(bpm)?bpm:null;
}
