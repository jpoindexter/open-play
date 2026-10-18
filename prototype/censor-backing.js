// A warped Censor never seeks its forward owner. Its real audio-thread clock
// continues under a silent pull, including all original future warp events.
export class CensorBacking{
 constructor(engine,deck,liveVoice,request){Object.assign(this,{engine,deck,liveVoice,request});this.track=deck.track;this.clock=engine.voiceClock(deck,liveVoice);this.controller=new AbortController();this.claimed=false;this.disposed=false;this.pull=null;}
 async prepare(){
  const cancel=()=>this.controller.abort();this.request.controller.signal.addEventListener('abort',cancel,{once:true});
  try{
   if(this.request.controller.signal.aborted)throw new DOMException('Censor canceled.','AbortError');
   const outputs=this.liveVoice.liveKeylock?.outputs||this.liveVoice.warpLoopTransport?.outputs||this.liveVoice.sources;
   this.pull=await this.engine.createScratchShadowPull({outputs,signal:this.controller.signal,onError:error=>this.fail(error)});
   if(this.request.controller.signal.aborted||this.deck.track!==this.track||this.engine.voices.get(this.deck.index)!==this.liveVoice)throw new DOMException('Censor owner changed.','AbortError');
   return this;
  }catch(error){this.dispose();throw error;}
  finally{this.request.controller.signal.removeEventListener('abort',cancel);}
 }
 claim(raw,when){
  if(this.disposed||this.request.controller.signal.aborted||this.engine.voices.get(this.deck.index)!==this.liveVoice)throw new DOMException('Censor owner changed.','AbortError');
  this.raw=raw;this.when=when;this.claimed=true;
  for(const gate of this.liveVoice.sourceGates||[]){gate.gain.cancelScheduledValues(when);gate.gain.setValueAtTime(1,when);gate.gain.linearRampToValueAtTime(0,when+.01);}
 }
 current(){return this.claimed&&!this.disposed&&this.deck.track===this.track&&this.engine.voices.get(this.deck.index)===this.raw;}
 adopt(){
  if(!this.current())return false;
  const {engine,deck,liveVoice:live,raw,request}=this,at=engine.ctx.currentTime,position=this.clock(at),beforeStart=at<this.when;
  if(raw.stemHistoryState===live.stemHistoryState&&raw.stemGains?.length===5){live.stemGains=raw.stemGains;raw.stemGains=[];live.stemInitialized=raw.stemInitialized;}
  for(const gate of live.sourceGates||[]){gate.gain.cancelScheduledValues(at);gate.gain.setValueAtTime(beforeStart?1:0,at);if(!beforeStart)gate.gain.linearRampToValueAtTime(1,at+.01);}
  raw.censorBacking=null;engine.voices.set(deck.index,live);engine.deckScratchRequests.delete(deck.index);
  deck.position=position;deck.anchorPosition=position;deck.anchorTime=at;deck.playing=!!deck.loop||position<deck.track.duration;
  this.claimed=false;this.closePull();
  if(beforeStart){for(const gate of raw.sourceGates||[]){gate.gain.cancelScheduledValues(at);gate.gain.setValueAtTime(0,at);}engine.disposeVoice(deck.index,raw);}
  else engine.retireVoiceAt(deck.index,raw,at);
  engine.setCross(engine.cross);if(live.stemGains?.length)engine.updateStems(deck);
  return{owner:request.owner,position,playing:deck.playing,restoredForwardOwner:true,beforeScheduledStart:beforeStart};
 }
 closePull(){this.controller.abort();void this.pull?.dispose().catch(error=>this.engine.onError?.(error));}
 fail(error){if(this.current()){this.engine.pause(this.deck);this.engine.onError?.(error);}else this.controller.abort();}
 dispose(){if(this.disposed)return;this.disposed=true;this.closePull();if(this.claimed){this.claimed=false;
  if(this.engine.voices.get(this.deck.index)===this.liveVoice){for(const gate of this.liveVoice.sourceGates||[]){gate.gain.cancelScheduledValues(this.engine.ctx.currentTime);gate.gain.setValueAtTime(1,this.engine.ctx.currentTime);}}
  else this.engine.disposeVoice(this.deck.index,this.liveVoice);
 }}
}
