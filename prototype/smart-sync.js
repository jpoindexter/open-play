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
export function createSmartSync({engine, state}) {
  const revisions = new WeakMap();
  let syncBPM=null;
  const enabled = () => state.settings['Sync Mode'] === 'Smart Sync';
  const engaged = deck => !!deck.sync && engagedStates.has(deck.syncState);
  const revise = deck => {const n=(revisions.get(deck)||0)+1; revisions.set(deck,n);return n;};
  function clear(deck) {revise(deck);deck.sync=false;deck.syncState='off';deck.syncRole=null;}
  function reconcile() {
    if (!enabled()) return;
    for (const deck of state.decks) if (!hasBeatgrid(deck.track)) clear(deck);
    const members = state.decks.filter(engaged);
    // A non-whole-bar cycle cannot preserve a four-beat bar position on each
    // wrap. Keep common tempo without reporting a bar lock that does not exist.
    if(members.some(d=>!barCompatible(d)))for(const d of members)if(d.syncState==='beat')d.syncState='tempo';
    if (members.length && !members.some(d => d.syncRole === 'primary'))
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
  function validateTransport(deck, primary) {
    for (const d of [deck,primary]) {
      requireGrid(d.track);
      if (d.reverse || (d.stemSlip || 'off') !== 'off')
        throw new Error('This Smart Sync path currently requires forward decks without Stem Slip.');
      loopBounds(d);

    }
  }
  async function align(deck, primary) {
    validateTransport(deck,primary);
    const ownTrack=deck.track, primaryTrack=primary.track, revision=revise(deck),ownLoop=loopBounds(deck),ownTransport=transportSignature(deck),primaryTransport=transportSignature(primary),barLock=barCompatible(deck)&&barCompatible(primary);
    const primaryRate=engine.audibleRate(primary), rate=rateFor(deck,primary);
    const priorClock=engine.voiceClock(deck,engine.voices.get(deck.index));
    const valid=() => enabled() && revisions.get(deck)===revision && deck.track===ownTrack && primary.track===primaryTrack && engaged(primary) && primary.playing && transportSignature(deck)===ownTransport && transportSignature(primary)===primaryTransport;
    const result=await engine.synchronize(deck,{rate,priorClock,positionAt:when => {
      if (!valid() || Math.abs(engine.voiceRateAt(primary,engine.voices.get(primary.index),when)-primaryRate)>1e-7) throw cancelled();
      return barLock?alignedBarPosition(ownTrack,priorClock(when),primaryTrack,engine.voiceClock(primary,engine.voices.get(primary.index))(when),ownLoop):priorClock(when);
    }});
    if (!valid()) throw cancelled();
    deck.sync=true;deck.syncState=barLock?'beat':'tempo';deck.syncRole ||= 'secondary';
    if(!barLock)reconcile();
    return result;
  }
  async function press(deck) {
    if (!enabled()) return;
    requireGrid(deck.track);const primary=leader(deck);
    if (!primary) {
      validateTransport(deck,deck);
      syncBPM=gridBPM(deck.track,engine.position(deck))*engine.audibleRate(deck);
      revise(deck);deck.sync=true;deck.syncRole='primary';deck.syncState=deck.playing?(barCompatible(deck)?'beat':'tempo'):'armed';
      if(deck.playing && deck.track.gridWarpMarkers?.length){deck.position=engine.position(deck);await engine.start(deck);}
      return;
    }
    validateTransport(deck,primary);
    if (deck.playing && primary.playing) return align(deck,primary);
    const revision=revise(deck), track=deck.track;
    await engine.setRate(deck,rateFor(deck,primary),{syncInternal:true});
    if (!enabled() || revisions.get(deck)!==revision || deck.track!==track) throw cancelled();
    deck.sync=true;deck.syncRole ||= 'secondary';deck.syncState=deck.playing?'tempo':'armed';
  }
  async function start(deck) {
    if (!enabled() || !engaged(deck)) return false;
    requireGrid(deck.track);
    if(deck.track.gridWarpMarkers?.length)validateTransport(deck,deck);
    if(deck.position>=deck.track.duration)deck.position=0;
    if (deck.syncState==='armed') {
      const primary=leader(deck);
      if (primary?.playing) {await align(deck,primary);return true;}
    }
    return false;
  }
  function played(deck) {
    if (enabled() && engaged(deck) && deck.syncState==='armed')
      deck.syncState=leader(deck)?.playing||!barCompatible(deck)?'tempo':'beat';
  }
  function paused(deck) {
    if (enabled() && engaged(deck) && deck.syncState==='beat') {revise(deck);deck.syncState='armed';}
  }
  function manipulated(deck) {
    if (enabled() && engaged(deck)) {revise(deck);deck.syncState='tempo';}
  }
  function disengage(deck) {
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
    if(enabled()&&engaged(deck)&&deck.track?.gridWarpMarkers?.length){const candidate={...deck,...changes};validateTransport(candidate,candidate);}
  }
  function timeline(deck,options){
    if(!enabled()||!engaged(deck)||!deck.track?.gridWarpMarkers?.length)return;
    validateTransport(deck,deck);
    return createBeatgrid(deck.track).timeline({...options,bpm:syncBPM,loop:loopBounds(deck)});
  }
  function tempo(deck,rate){
    const bpm=deck.track.bpm*rate;
    for(const d of state.decks.filter(engaged))createBeatgrid(d.track).timeline({position:engine.position(d),when:engine.ctx?.currentTime||0,bpm});
    syncBPM=bpm;return bpm;
  }
  function captureGrid(track){
    if(!enabled())return [];
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
  return {press,start,played,paused,manipulated,disengage,loaded,reconcile,engaged,timeline,tempo,captureGrid,edited,validate,
    captureTempo:()=>syncBPM,restoreTempo:bpm=>{syncBPM=bpm;},
    reset:() => {state.decks.forEach(clear);syncBPM=null;}};
}
