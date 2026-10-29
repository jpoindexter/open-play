// Independent Smart Sync using a source-time piecewise beatgrid.
import {createBeatgrid,gridBPM} from './beatgrid.js';
const engagedStates = new Set(['armed', 'beat', 'tempo']);
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
const cancelled = () => new DOMException('Sync preparation superseded.', 'AbortError');
export const hasBeatgrid = track => !!track && Number.isFinite(track.grid) && Number.isFinite(track.bpm) && track.bpm > 0;
export function beatPosition(track, position) {
  return hasBeatgrid(track) ? modulo(createBeatgrid(track).beatAt(position),4) : null;
}
function requireGrid(track) {
  if (!hasBeatgrid(track)) throw new Error('Add or analyze a beatgrid before using Smart Sync.');
  if (track.gridMarkers?.length && !track.gridWarpMarkers?.length) throw new Error('Legacy marker annotations need tempo values before warped Smart Sync.');
  createBeatgrid(track);
}
function loopBounds(deck){
  if(!deck.loop)return null;
  const start=deck.loopIn,end=deck.loopOut;
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>deck.track.duration||end<=start)throw new RangeError('Invalid Smart Sync loop bounds.');
  return{start,end};
}
function barCompatible(deck){
  if(!deck.loop)return true;
  const grid=createBeatgrid(deck.track),span=grid.beatAt(deck.loopOut)-grid.beatAt(deck.loopIn);
  return span>0&&Math.round(span/4)>=1&&Math.abs(span/4-Math.round(span/4))<1e-6;
}
const transportSignature=deck=>JSON.stringify([!!deck.loop,deck.loopIn,deck.loopOut,!!deck.reverse,deck.stemSlip||'off']);
export function alignedBarPosition(track,position,primaryTrack,primaryPosition,loop=null){
  const phase=beatPosition(primaryTrack,primaryPosition),grid=createBeatgrid(track),ownBeat=grid.beatAt(position);
  const from=loop?.start??0,to=loop?.end??track.duration;
  if(from<0||to>track.duration||to<=from)throw new RangeError('Invalid Smart Sync alignment bounds.');
  const first=Math.ceil((grid.beatAt(from)-phase)/4),last=Math.ceil((grid.beatAt(to)-phase)/4)-1;
  const bar=Math.min(last,Math.max(first,Math.round((ownBeat-phase)/4)));
  const candidates=[bar,bar-1,bar+1].filter(n=>n>=first&&n<=last).map(n=>grid.timeAt(n*4+phase))
    .filter(p=>p>=from&&p<to).sort((a,b)=>Math.abs(a-position)-Math.abs(b-position));
  if(!candidates.length)throw new Error('No bar position can be aligned within this track or active loop.');
  return candidates[0];
}
export function createSmartSync({engine, state, externalLeader=()=>null}) {
  const revisions = new WeakMap();
  const pendingPresses = new WeakMap();
  const alignmentTimelines = new WeakMap();
  let syncBPM=null,tempoOwner={};
  const setTempo=bpm=>{syncBPM=bpm;tempoOwner={};};
  const enabled = () => state.settings['Sync Mode'] === 'Smart Sync';
  const engaged = deck => !!deck.sync && engagedStates.has(deck.syncState);
  const revise = deck => {const n=(revisions.get(deck)||0)+1; revisions.set(deck,n);return n;};
  function cancelAlignment(deck){
    const controller=engine.transforms?.get(deck.index);
    const pending=[alignmentTimelines.get(deck),pendingPresses.get(deck)?.tempoPreparation].find(owner=>controller&&controller===owner?.controller&&owner.owns());
    if(pending){
      pending.cancelled=true;controller.abort();
    }
  }
  function clear(deck) {cancelAlignment(deck);revise(deck);deck.sync=false;deck.syncState='off';deck.syncRole=null;}
  function reconcile() {
    if (!enabled()) return;
    for (const deck of state.decks) if (!hasBeatgrid(deck.track)) clear(deck);
    const members = state.decks.filter(engaged);
    // A non-whole-bar cycle cannot preserve a four-beat bar position on each
    // wrap. Keep common tempo without reporting a bar lock that does not exist.
    if(members.some(d=>!barCompatible(d)))for(const d of members)if(d.syncState==='beat')d.syncState='tempo';
    if (members.length && !members.some(d => d.syncRole === 'primary') && !externalLeader()?.valid())
      (members.find(d => d.playing) || members[0]).syncRole = 'primary';
  }
  function leader(deck) {
    reconcile();
    const others = state.decks.filter(d => d !== deck && engaged(d));
    return others.find(d => d.syncRole === 'primary') || others.find(d => d.playing) || others[0];
  }
  function rateFor(deck, primary) {
    const rate = (syncBPM || gridBPM(primary.track,engine.position(primary))*engine.audibleRate(primary)) / deck.track.bpm;
    if (!Number.isFinite(rate) || rate < .25 || rate > 4) throw new Error('The matched tempo is outside the current transport range.');
    return rate;
  }
  function validateTransport(deck, primary, allowReverseClock=false) {
    for (const d of [deck,primary]) {
      requireGrid(d.track);
      if ((d.reverse && !allowReverseClock) || (d.stemSlip || 'off') !== 'off')
        throw new Error('This Smart Sync path currently requires forward decks without Stem Slip.');
      loopBounds(d);

    }
  }
  async function align(deck, primary, isCurrent=()=>true) {
    validateTransport(deck,primary);
    const ownTrack=deck.track, primaryTrack=primary.track, revision=revise(deck),ownLoop=loopBounds(deck),ownTransport=transportSignature(deck),primaryTransport=transportSignature(primary),barLock=barCompatible(deck)&&barCompatible(primary);
    const primaryRate=primary.rate, rate=rateFor(deck,primary);
    const priorClock=engine.voiceClock(deck,engine.voices.get(deck.index));
    let token;
    const owns=()=>isCurrent()&&revisions.get(deck)===revision&&deck.track===ownTrack&&transportSignature(deck)===ownTransport&&(token===undefined||engine.startTokens?.get(deck.index)===token);
    const owned=()=>enabled()&&owns();
    const valid=()=>owned()&&primary.track===primaryTrack&&engaged(primary)&&primary.playing&&transportSignature(primary)===primaryTransport;
    // A playing, unsynced warp needs the target clock while preparing its
    // replacement backend, before the public Sync state can be committed.
    const timeline={track:ownTrack,bpm:rate*ownTrack.bpm,valid:owned,owns};
    alignmentTimelines.set(deck,timeline);
    try{
      const pending=engine.synchronize(deck,{rate,priorClock,positionAt:when => {
        // Natural warp progression changes the local source rate, while the
        // nominal control rate and shared musical tempo remain unchanged.
        if (!valid() || Math.abs(primary.rate-primaryRate)>1e-7 || (syncBPM!==null&&Math.abs(syncBPM-timeline.bpm)>1e-7)) throw cancelled();
        return barLock?alignedBarPosition(ownTrack,priorClock(when),primaryTrack,engine.voiceClock(primary,engine.voices.get(primary.index))(when),ownLoop):priorClock(when);
      }});
      token=engine.startTokens?.get(deck.index);
      timeline.controller=engine.transforms?.get(deck.index);
      const result=await pending;
      // The source was validated at scheduling. Its later Pause/Sync Off
      // must not misreport a still-owned, committed replacement as unsynced.
      if (!owned()) throw cancelled();
      deck.sync=true;deck.syncState=barLock?'beat':'tempo';deck.syncRole ||= 'secondary';
      reconcile();
      return result;
    }finally{if(alignmentTimelines.get(deck)===timeline)alignmentTimelines.delete(deck);}
  }
  function externalRate(deck,source){
    const rate=source.bpm/deck.track.bpm;
    if(!Number.isFinite(rate)||rate<.25||rate>4)throw new Error('The matched tempo is outside the current transport range.');
    return rate;
  }
  async function alignExternal(deck,source,isCurrent=()=>true){
    validateTransport(deck,deck);
    const track=deck.track,revision=revise(deck),signature=transportSignature(deck),loop=loopBounds(deck),barLock=barCompatible(deck)&&source.phase;
    const priorClock=engine.voiceClock(deck,engine.voices.get(deck.index));
    let token;
    const owns=()=>isCurrent()&&revisions.get(deck)===revision&&deck.track===track&&transportSignature(deck)===signature&&(token===undefined||engine.startTokens?.get(deck.index)===token);
    const owned=()=>enabled()&&owns();
    const valid=()=>owned()&&source.valid();
    // Preparation needs its target musical clock before public Sync state is
    // committed. Keep that intent scoped to this owned start, not the old voice.
    const timeline={track,bpm:source.bpm,valid:owned,owns};
    alignmentTimelines.set(deck,timeline);
    try{
      const pending=engine.synchronize(deck,{rate:externalRate(deck,source),priorClock,positionAt:when=>{
        if(!valid())throw cancelled();
        return barLock?alignedBarPosition(track,priorClock(when),source.track,source.clock(when),loop):priorClock(when);
      }});
      token=engine.startTokens?.get(deck.index);
      timeline.controller=engine.transforms?.get(deck.index);
      const result=await pending;
      // Source loss after scheduling does not revoke a current committed Play.
      if(!owned())throw cancelled();
      const following=source.valid();
      setTempo(source.bpm);deck.sync=true;deck.syncState=(following?barLock:barCompatible(deck))?'beat':'tempo';deck.syncRole=following?'secondary':'primary';
      return result;
    }finally{if(alignmentTimelines.get(deck)===timeline)alignmentTimelines.delete(deck);}
  }
  async function performPress(deck,request) {
    if (!enabled()) return;
    requireGrid(deck.track);const primary=leader(deck);
    const source=primary?null:externalLeader();
    if(source?.valid()){
      validateTransport(deck,deck);
      if(deck.playing)return alignExternal(deck,source);
      const revision=revise(deck),track=deck.track;
      await engine.setRate(deck,externalRate(deck,source),{syncInternal:true});
      if(!enabled()||revisions.get(deck)!==revision||deck.track!==track||!source.valid())throw cancelled();
      setTempo(source.bpm);deck.sync=true;deck.syncRole='secondary';deck.syncState='armed';
      return;
    }
    if (!primary) {
      validateTransport(deck,deck);
      // An engaged primary already has a common tempo. In particular a paused
      // warped deck's nominal rate is not its local source playback rate.
      const bpm=engaged(deck)&&syncBPM?syncBPM:gridBPM(deck.track,engine.position(deck))*engine.audibleRate(deck);
      const rate=bpm/deck.track.bpm;
      if(!Number.isFinite(rate)||rate<.25||rate>4)throw new Error('The matched tempo is outside the current transport range.');
      const prior=alignmentTimelines.get(deck),voice=engine.voices?.get(deck.index),rateOwner=engine.rateOwners?.get(deck);
      const inherit=prior?.previous&&prior.owns()&&prior.controller===engine.transforms?.get(deck.index)&&prior.voice===voice&&prior.track===deck.track&&prior.rate===deck.rate&&prior.rateOwner===rateOwner;
      const previous=inherit?prior.previous:{rate:deck.rate,sync:deck.sync,syncRole:deck.syncRole,syncState:deck.syncState},previousBPM=inherit?prior.previousBPM:syncBPM,track=deck.track,revision=revise(deck);
      setTempo(bpm);deck.rate=rate;
      deck.sync=true;deck.syncRole='primary';deck.syncState=deck.playing?(barCompatible(deck)?'beat':'tempo'):'armed';
      if(deck.playing && deck.track.gridWarpMarkers?.length){
        deck.position=engine.position(deck);let token;
        const signature=transportSignature(deck);
        const owns=()=>revisions.get(deck)===revision&&deck.track===track&&transportSignature(deck)===signature&&(token===undefined||engine.startTokens?.get(deck.index)===token);
        const timeline={track,bpm,owns,valid:()=>enabled()&&owns(),previous,previousBPM,voice,rateOwner,rate};alignmentTimelines.set(deck,timeline);
        try{const pending=engine.start(deck);token=engine.startTokens?.get(deck.index);timeline.controller=engine.transforms?.get(deck.index);await pending;if(!enabled()||!owns()||timeline.controller?.signal.aborted)throw cancelled();}
        catch(error){
          if(enabled()&&revisions.get(deck)===revision&&deck.track===track&&engine.startTokens?.get(deck.index)===token&&engine.voices?.get(deck.index)===voice&&deck.rate===rate&&deck.syncRole==='primary'&&syncBPM===bpm){Object.assign(deck,previous);setTempo(previousBPM);}
          else if(timeline.cancelled&&deck.track===track&&engine.startTokens?.get(deck.index)===token&&engine.voices?.get(deck.index)===voice&&deck.rate===rate&&engine.rateOwners?.get(deck)===rateOwner)deck.rate=previous.rate;
          throw error;
        }finally{if(alignmentTimelines.get(deck)===timeline)alignmentTimelines.delete(deck);}
      }
      return;
    }
    validateTransport(deck,primary);
    if (deck.playing && primary.playing) return align(deck,primary);
    const revision=revise(deck), track=deck.track,voice=engine.voices?.get(deck.index),previousController=engine.transforms?.get(deck.index);
    const pending=engine.setRate(deck,rateFor(deck,primary),{syncInternal:true});
    const owner=engine.rateOwners?.get(deck),controller=engine.transforms?.get(deck.index);
    // Tempo-only Sync may prepare a replacement while its master is paused.
    // Own cancellation without publishing an alignment/warp timeline.
    if(owner?.pending&&owner.started&&owner.track===track&&owner.voice===voice&&owner.controller===controller&&controller!==previousController)
      request.tempoPreparation={controller,owns:()=>pendingPresses.get(deck)===request&&revisions.get(deck)===revision&&deck.track===track&&engine.voices?.get(deck.index)===voice&&engine.rateOwners?.get(deck)===owner&&engine.startTokens?.get(deck.index)===owner.token};
    await pending;
    if (!enabled() || revisions.get(deck)!==revision || deck.track!==track) throw cancelled();
    deck.sync=true;deck.syncRole ||= 'secondary';deck.syncState=deck.playing?'tempo':'armed';
  }
  function press(deck) {
    const request={track:deck.track,promise:null};pendingPresses.set(deck,request);
    request.promise=performPress(deck,request).finally(()=>{if(pendingPresses.get(deck)===request)pendingPresses.delete(deck);});
    return request.promise;
  }
  function setMaster(deck) {
    if (!enabled() || externalLeader()?.valid()) return false;
    requireGrid(deck.track);
    const bpm=engaged(deck)&&syncBPM?syncBPM:gridBPM(deck.track,engine.position(deck))*engine.audibleRate(deck);
    if(!Number.isFinite(bpm)||bpm<=0)throw new Error('Set a valid master BPM before using Sync.');
    revise(deck);
    setTempo(bpm);
    for(const other of state.decks)if(other!==deck&&other.syncRole==='primary')other.syncRole='secondary';
    deck.sync=true;deck.syncRole='primary';
    deck.syncState=deck.playing?(barCompatible(deck)?'beat':'tempo'):'armed';
    return true;
  }
  async function start(deck,{isCurrent=()=>true}={}) {
    const track=deck.track,token=engine.startTokens?.get(deck.index);
    const pending=pendingPresses.get(deck);
    if(pending){
      await pending.promise;
      // A cue/load/stop while waiting owns the next transport, even if Sync
      // itself finishes arming successfully. Never resurrect the queued Play.
      if(deck.track!==track||engine.startTokens?.get(deck.index)!==token)throw cancelled();
    }
    if(!isCurrent()||deck.track!==track)throw cancelled();
    if (!enabled() || !engaged(deck)) return false;
    requireGrid(deck.track);
    if(deck.track.gridWarpMarkers?.length)validateTransport(deck,deck,true);
    // Track End is the beginning of reverse playback in source coordinates.
    // Only an exhausted forward deck should replay from source0.
    if(!deck.reverse&&deck.position>=deck.track.duration)deck.position=0;
    if (deck.syncState==='armed') {
      const primary=leader(deck);
      if (primary?.playing) {await align(deck,primary,isCurrent);return true;}
      const source=primary?null:externalLeader();
      if(source?.valid()){await alignExternal(deck,source,isCurrent);return true;}
    }
    return false;
  }
  function played(deck) {
    if (enabled() && engaged(deck) && deck.syncState==='armed')
      deck.syncState=deck.reverse||leader(deck)?.playing||!barCompatible(deck)?'tempo':'beat';
  }
  function paused(deck) {
    if (enabled() && engaged(deck) && deck.syncState==='beat') {revise(deck);deck.syncState='armed';}
  }
  function manipulated(deck,{seek=false}={}) {
    if (enabled() && engaged(deck)) {
      revise(deck);
      // Paused needle moves retain an aligned next Play; live nudges keep their offset.
      deck.syncState=seek&&!deck.playing&&!deck.processing&&!deck.reverse&&(deck.stemSlip||'off')==='off'?'armed':'tempo';
    }
  }
  function disengage(deck) {
    cancelAlignment(deck);
    revise(deck);
    const relative=engaged(deck);deck.sync=false;deck.syncRole=null;deck.syncState=relative?'relative':'off';
    reconcile();
  }
  function loaded(deck, previous) {
    if (!enabled()) return;
    clear(deck);
    if (!hasBeatgrid(deck.track) || !previous.engaged || !state.settings['Maintain Sync on Track Load']) {reconcile();return;}
    const rate=(syncBPM||previous.bpm)/deck.track.bpm;
    if (!Number.isFinite(rate) || rate<.25 || rate>4) {reconcile();return;}
    deck.rate=rate;deck.sync=true;deck.syncState='armed';deck.syncRole=previous.role;
    reconcile();
  }
  function validate(deck,changes={}){
    if(enabled()&&engaged(deck)&&deck.track?.gridWarpMarkers?.length){const candidate={...deck,...changes};validateTransport(candidate,candidate,true);}
  }
  function timeline(deck,options){
    const pending=alignmentTimelines.get(deck),preparing=!!pending&&pending.track===deck.track&&pending.valid();
    if(!enabled()||(!engaged(deck)&&!preparing)||!deck.track?.gridWarpMarkers?.length)return;
    validateTransport(deck,deck,true);
    return createBeatgrid(deck.track).timeline({...options,bpm:preparing?pending.bpm:syncBPM,loop:loopBounds(deck)});
  }
  function tempo(deck,rate){
    const bpm=deck.track.bpm*rate;
    for(const d of state.decks.filter(engaged))createBeatgrid(d.track).timeline({position:engine.position(d),when:engine.ctx?.currentTime||0,bpm});
    setTempo(bpm);return bpm;
  }
  function captureGrid(track){
    if(!enabled())return [];
    // Pending Sync and armed Play must relinquish the old grid before saving its replacement.
    for(const deck of state.decks)if(deck.track===track&&(pendingPresses.has(deck)||alignmentTimelines.has(deck))){
      cancelAlignment(deck);
      revise(deck);
    }
    return state.decks.filter(d=>d.track===track&&engaged(d)).map(deck=>({
      deck,track,grid:createBeatgrid(track),clock:engine.voiceClock(deck,engine.voices.get(deck.index)),
      status:deck.syncState,role:deck.syncRole,playing:deck.playing
    }));
  }
  async function edited(track,before=[]){
    if(!enabled())return;
    const next=createBeatgrid(track);
    for(const saved of before){
      const d=saved.deck;
      if(d.track!==track||!engaged(d))continue;
      if(!hasBeatgrid(track)){clear(d);continue;}
      const revision=revise(d),rate=(syncBPM||track.bpm*d.rate)/track.bpm;
      const valid=()=>enabled()&&d.track===track&&engaged(d)&&revisions.get(d)===revision&&d.syncState===saved.status;
      const positionAt=when=>{
        if(!valid())throw cancelled();
        // Preserve the previous musical beat, including a Tempo Sync offset,
        // at the actual future handoff rather than at the Save click.
        return next.timeAt(saved.grid.beatAt(saved.clock(when)));
      };
      try{
        if(saved.playing&&d.playing)await engine.synchronize(d,{rate,priorClock:saved.clock,positionAt});
        else {const position=positionAt(engine.ctx?.currentTime||0);if(position<0||position>=track.duration)throw new RangeError('Edited grid places the saved beat outside this track.');d.position=position;d.rate=rate;}
        if(valid()){d.syncState=saved.status;d.syncRole=saved.role;}
      }catch(error){
        if(valid()){engine.pause(d);clear(d);}
        throw error;
      }
    }
  }
  return {press,setMaster,start,played,paused,manipulated,disengage,loaded,reconcile,engaged,timeline,tempo,captureGrid,edited,validate,
    pending:deck=>pendingPresses.has(deck),
    captureTempo:()=>syncBPM,captureTempoOwner:()=>tempoOwner,
    restoreTempo:(bpm,owner)=>{if(owner!==undefined&&owner!==tempoOwner)return false;setTempo(bpm);return true;},
    reset:() => {state.decks.forEach(clear);setTempo(null);}};
}
