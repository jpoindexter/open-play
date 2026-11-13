import {createSyncTempoHandoff} from './sync-tempo-handoff.js';

export async function setDeckReverse(engine,d,reverse){
 engine.onValidateTransport?.(d,{reverse});
 if(reverse!==d.reverse)engine.onManualPosition?.(d);
 if(d.stemSlip&&d.stemSlip!=='off'){
  d.reverse=reverse;
  if(reverse){await engine.beginStemSlipGesture(d,'transport:reverse');await engine.voices.get(d.index)?.stemSlipTransport.command('reverse',{owner:'transport:reverse',reverse});}
  else await engine.endStemSlipGesture(d,'transport:reverse');
  return;
 }
 const voice=engine.voices.get(d.index);
 if(d.playing&&!voice?.deckScratchTransport&&!voice?.censorReverse&&!engine.deckScratchRequests.has(d.index)){
  // Restore committed transport direction, not an older pending request.
  const track=d.track,previous=voice?!!(voice.reverse??voice.gridTimeline?.reverse):d.reverse,token=engine.startTokens.get(d.index),clock=engine.voiceClock(d,voice),handoff=createSyncTempoHandoff(engine.ctx,[d.index]);
  d.reverse=reverse;
  try{await engine.start(d,{priorClock:clock,positionAt:clock,handoff});handoff.finish();}
  catch(error){handoff.fail(error);const owns=handoff.owns(d.index)||(engine.startTokens.get(d.index)===token&&engine.voices.get(d.index)===voice);if(d.track===track&&owns&&d.reverse===reverse)d.reverse=previous;throw error;}
  finally{handoff.dispose();}
  return;
 }
 const playing=d.playing||d.processing;
 engine.pause(d,{preserveStemExit:true});d.reverse=reverse;
 if(playing)await engine.start(d);
}
