// Test-only rapid GUI Sync requests on real playing decks, with physical mute.
export async function checkSyncOverlap({app,count,label,click,until,capture,event,report}){
 const {state,engine}=app,primary=state.decks.find(d=>d.syncRole==='primary'),deck=state.decks.find(d=>d!==primary&&Math.abs(d.track.bpm-primary.track.bpm*primary.rate)>.1);
 if(!deck)throw Error('Overlap check needs unequal original tempos');
 click(`[data-action="syncOff"][data-deck="${deck.index}"]`);await until(()=>!deck.sync,'Sync Off');
 click(`[data-action="tempoReset"][data-deck="${deck.index}"]`);await until(()=>!deck.processing&&Math.abs(deck.rate-1)<1e-8,'independent pitch reset');
 const rate=primary.rate,voice=engine.voices.get(primary.index),before=deck.rate;
 event('overlap-before',{label,count,deck:deck.index,track:deck.track.title,rate:before,master:primary.index,masterTrack:primary.track.title,masterRate:rate});
 const recording=capture('overlap-'+label);
 for(let i=0;i<count;i++)click(`[data-action="sync"][data-deck="${deck.index}"]`);
 await until(()=>!deck.processing&&!deck.playQueued&&deck.sync,'latest rapid Sync request',15);await recording;
 const audible=engine.audibleRate(deck),expected=primary.track.bpm*primary.rate/deck.track.bpm;
 if(!deck.playing||Math.abs(deck.rate-expected)>1e-6||Math.abs(audible-deck.rate)>1e-6)throw Error('Rapid Sync left audio and controls at different rates');
 if(!primary.playing||primary.rate!==rate||engine.voices.get(primary.index)!==voice)throw Error('Rapid Sync changed outgoing master');
 (report.overlapChecks??=[]).push({label,count,deck:deck.index,track:deck.track.title,before,rate:deck.rate,audible,expected,masterRetained:true});
 event('overlap-after',report.overlapChecks.at(-1));
}
