// Browser-only ownership for one active, inaudible keylock source during a raw
// scratch gesture. AudioEngine remains the owner of its routes and deck state.
const abortError=()=>new DOMException('Scratch shadow ownership changed.','AbortError');
const configuration=d=>[d.rate,!!d.keylock,d.keyShift||0,!!d.reverse,!!d.loop,d.stemSlip||'off',!!d.slip].join('|');
const setGate=(gate,value,when,ramp=0)=>{
  gate.gain.cancelScheduledValues(when);gate.gain.setValueAtTime(ramp?0:value,when);
  if(ramp)gate.gain.linearRampToValueAtTime(value,when+ramp);
};
export function canRetainScratchShadow(engine,d,voice){
  const state=voice?.liveKeylock?.stateAt?.();
  return !!(d.playing&&!d.reverse&&!d.loop&&!d.slip&&(!d.stemSlip||d.stemSlip==='off')&&
    typeof voice?.liveKeylock?.followSeek==='function'&&state?.playing&&state.rate===d.rate&&
    state.keylock===!!d.keylock&&state.semitones===(d.keyShift||0)&&
    !voice.liveOwnerController?.signal.aborted&&
    (!voice.handoffBefore||engine.ctx.currentTime>=voice.handoffBefore.until));
}
export class KeylockScratchShadow {
  constructor(engine,deck,liveVoice){
    this.engine=engine;this.deck=deck;this.liveVoice=liveVoice;this.adapter=liveVoice.liveKeylock;
    this.track=deck.track;this.config=configuration(deck);this.original=engine.buffers.get(deck.track.id);
    this.stems=[...(engine.stemBuffers.get(deck.track.id)||[])];this.controller=new AbortController();
    this.phase='prepared';this.revision=0;this.owner=null;this.rawVoice=null;this.pending=null;
    this.desired=null;this.timer=null;this.pull=null;this.ownsLive=false;this.disposed=false;
    this.rebases=0;this.rebasing=false;this.lastFollow=null;this.error=null;this.opened=false;
  }
  sourcesMatch(){
    const stems=this.engine.stemBuffers.get(this.track.id)||[];
    return this.deck.track===this.track&&configuration(this.deck)===this.config&&
      this.engine.buffers.get(this.track.id)===this.original&&stems.length===this.stems.length&&
      stems.every((buffer,index)=>buffer===this.stems[index]);
  }
  current(owner=this.owner,revision=this.revision){
    return !this.disposed&&this.sourcesMatch()&&this.owner===owner&&this.revision===revision&&
      this.engine.deckScratchShadows.get(this.deck.index)===this&&
      this.engine.deckScratchRequests.get(this.deck.index)?.owner===owner&&
      this.engine.voices.get(this.deck.index)===this.rawVoice;
  }
  async prepare(request){
    const cancel=()=>this.controller.abort();request.controller.signal.addEventListener('abort',cancel,{once:true});
    try{
      if(request.controller.signal.aborted)throw abortError();
      this.pull=await this.engine.createScratchShadowPull({outputs:this.adapter.outputs,signal:this.controller.signal,
        onError:error=>{this.error=error;if(this.ownsLive)this.fail(error);else this.controller.abort();}});
      if(request.controller.signal.aborted||!this.sourcesMatch()||this.engine.voices.get(this.deck.index)!==this.liveVoice)throw abortError();
      return this;
    }catch(error){this.dispose();throw error;}
    finally{request.controller.signal.removeEventListener('abort',cancel);}
  }
  claim(request,rawVoice){
    if(this.error)throw this.error;
    if(this.disposed||this.controller.signal.aborted||request.controller.signal.aborted||
      this.engine.deckScratchRequests.get(this.deck.index)!==request||!this.sourcesMatch()||
      this.pull?.snapshot().retired||this.adapter.snapshot().disposed||
      this.engine.voices.get(this.deck.index)!==(this.ownsLive?this.rawVoice:this.liveVoice))throw abortError();
    this.stopFollowing();this.revision++;this.owner=request.owner;this.rawVoice=rawVoice;
    this.phase='active';this.ownsLive=true;this.opened=false;
    this.engine.deckScratchShadows.set(this.deck.index,this);
    for(const gate of this.liveVoice.sourceGates||[])setGate(gate,0,this.engine.ctx.currentTime);
    for(const gate of rawVoice.sourceGates||[])setGate(gate,1,this.engine.ctx.currentTime);
    this.timer=setInterval(()=>this.sample(),25);this.sample();return this;
  }
  reserve(request){
    this.stopFollowing();this.revision++;this.owner=request.owner;this.phase='pending';this.opened=false;
    for(const gate of this.liveVoice.sourceGates||[])setGate(gate,0,this.engine.ctx.currentTime);
  }
  sample(){
    if(this.phase!=='active'||!this.current())return;
    const raw=this.rawVoice.deckScratchTransport.state();
    this.desired=raw.phase==='censor'&&raw.hidden?raw.hidden.position:this.engine.position(this.deck);this.pump();
  }
  pump(){
    if(this.pending||this.desired===null||this.phase!=='active'||!this.current())return;
    const position=this.desired,owner=this.owner,revision=this.revision;this.desired=null;
    const task=Promise.resolve().then(async()=>{
      if(!this.current(owner,revision)||this.phase!=='active')throw abortError();
      try{return await this.adapter.followSeek(position);}
      catch(error){
        if(error.name!=='FollowCoverageError'||!this.current(owner,revision)||this.phase!=='active')throw error;
        // Explicit muted rebase, never an unshifted bridge. A release before
        // readiness remains a measured preparation gap, not seamless proof.
        this.rebasing=true;this.rebases++;
        try{return await this.adapter.seek(position);}finally{this.rebasing=false;}
      }
    });
    this.pending=task;
    task.then(ack=>{if(this.current(owner,revision))this.lastFollow=ack;},error=>{
      if(error.name!=='AbortError'&&this.current(owner,revision))this.fail(error);
    }).finally(()=>{if(this.pending===task)this.pending=null;if(this.phase==='active'&&this.current(owner,revision))this.pump();});
  }
  stopFollowing(){clearInterval(this.timer);this.timer=null;this.desired=null;}
  beginRelease(owner){
    if(!this.current(owner))return false;
    this.phase='closing';this.stopFollowing();const when=this.engine.ctx.currentTime;
    for(const gate of this.rawVoice.sourceGates||[])setGate(gate,0,when);
    // The caller issues End after this synchronous mute. The already-active
    // processor can open immediately; any far-rebase delay stays explicit.
    const rawState=this.rawVoice.deckScratchTransport.state();
    const followed=this.lastFollow&&Math.abs(this.lastFollow.position-rawState.position)<=.1;
    if(!this.rebasing&&followed&&rawState.playing){
      for(const gate of this.liveVoice.sourceGates||[])setGate(gate,1,when,.003);
      this.opened=true;
    }
    return this.revision;
  }
  async align(owner,revision,result){
    if(this.pending)await this.pending;
    if(!this.current(owner,revision)||this.phase!=='closing')throw abortError();
    if(!result.playing||result.loop||result.reverse)throw Object.assign(Error('Shadow return no longer owns forward playback.'),{name:'InvalidStateError'});
    const when=this.engine.ctx.currentTime+.05;
    const position=Math.min(this.track.duration,result.position+result.rate*Math.max(0,when-result.audioTime));
    let ack;
    try{ack=await this.adapter.followSeek(position,{when});}
    catch(error){
      if(error.name!=='FollowCoverageError'||!this.current(owner,revision)||this.phase!=='closing')throw error;
      // A final pointer update may arrive after the last follower sample. Keep
      // its out-of-window return explicit and silent while normal seek prepares.
      for(const gate of this.liveVoice.sourceGates||[])setGate(gate,0,this.engine.ctx.currentTime);
      this.opened=false;this.rebases++;this.rebasing=true;
      try{
        const prepared=await this.adapter.seek(Math.min(this.track.duration,result.position+result.rate*Math.max(0,this.engine.ctx.currentTime-result.audioTime)));
        if(!this.current(owner,revision)||this.phase!=='closing')throw abortError();
        const alignedWhen=Math.max(this.engine.ctx.currentTime+.05,prepared.when+(prepared.transitionSeconds||0)+.05);
        ack=await this.adapter.followSeek(Math.min(this.track.duration,result.position+result.rate*Math.max(0,alignedWhen-result.audioTime)),{when:alignedWhen});
      }
      finally{this.rebasing=false;}
    }
    if(!this.current(owner,revision)||this.phase!=='closing')throw abortError();
    return ack;
  }
  adopt(owner,revision,result,ack){
    if(!this.current(owner,revision)||this.phase!=='closing')return false;
    const raw=this.rawVoice,live=this.liveVoice,engine=this.engine,deck=this.deck;
    if(raw.stemHistoryState===live.stemHistoryState&&raw.stemGains?.length===5){
      live.stemGains=raw.stemGains;raw.stemGains=[];live.stemInitialized=raw.stemInitialized;
    }
    const at=engine.ctx.currentTime;
    if(!this.opened)for(const gate of live.sourceGates||[])setGate(gate,1,Math.max(at,ack.when),.003);
    live.handoffBefore={until:ack.when,clock:time=>Math.min(this.track.duration,result.position+
      result.rate*Math.max(0,time-result.audioTime)),rate:()=>result.rate};
    engine.voices.set(deck.index,live);engine.deckStates.set(deck.index,deck);
    deck.position=ack.position;deck.anchorPosition=ack.position;deck.anchorTime=ack.when;deck.playing=ack.playing;
    engine.deckScratchRequests.delete(deck.index);engine.deckScratchShadows.delete(deck.index);
    this.phase='adopted';this.ownsLive=false;this.stopFollowing();this.controller.abort();
    void this.pull?.dispose().catch(error=>engine.onError?.(error));
    // Already-zero raw gates must not go through retireVoiceAt (which raises
    // its initial gate to1). Cached-node adoption checks remain in disposeVoice.
    engine.disposeVoice(deck.index,raw);engine.setCross(engine.cross);if(live.stemGains.length)engine.updateStems(deck);
    return true;
  }
  fail(error){
    if(this.disposed)return;this.error=error;
    if(this.engine.deckScratchShadows.get(this.deck.index)===this)
      this.engine.failKeylockScratchShadow(this.deck,this,error);
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;this.phase='disposed';this.stopFollowing();this.revision++;
    const engine=this.engine,deck=this.deck,owns=engine.deckScratchShadows.get(deck.index)===this;
    if(owns)engine.deckScratchShadows.delete(deck.index);
    if(this.ownsLive){
      const current=engine.voices.get(deck.index);
      if(current===this.liveVoice)engine.voices.delete(deck.index);
      if(current===this.rawVoice){
        if(deck.track===this.track){deck.position=engine.position(deck);deck.anchorPosition=deck.position;deck.anchorTime=engine.ctx.currentTime;}
        for(const gate of this.rawVoice.sourceGates||[])setGate(gate,0,engine.ctx.currentTime);
        engine.stopSource(deck.index,{preserveStemExit:true});
      }
      for(const gate of this.liveVoice.sourceGates||[])setGate(gate,0,engine.ctx.currentTime);
      engine.disposeVoice(deck.index,this.liveVoice);this.ownsLive=false;
    }
    this.controller.abort();void this.pull?.dispose().catch(error=>engine.onError?.(error));
  }
  snapshot(){return{phase:this.phase,owner:this.owner,revision:this.revision,disposed:this.disposed,
    rebasing:this.rebasing,rebases:this.rebases,pending:!!this.pending,lastFollow:this.lastFollow,pull:this.pull?.snapshot()};}
}
