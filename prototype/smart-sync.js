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
export function alignedBarPosition(track, position, primaryTrack, primaryPosition) {
  const phase = beatPosition(primaryTrack, primaryPosition), grid=createBeatgrid(track);
  const ownBeat = grid.beatAt(position);
  const bar = Math.round((ownBeat - phase) / 4);
  const candidates = [bar,bar-1,bar+1].map(n => grid.timeAt(n*4+phase))
    .filter(p => p >= 0 && p < track.duration).sort((a,b) => Math.abs(a-position)-Math.abs(b-position));
  if (!candidates.length) throw new Error('No complete bar position can be aligned within this track.');
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
      if (d.reverse || d.loop || (d.stemSlip || 'off') !== 'off')
        throw new Error('This Smart Sync path currently requires forward decks without a loop or Stem Slip.');
    }
  }
  async function align(deck, primary) {
    validateTransport(deck,primary);
    const ownTrack=deck.track, primaryTrack=primary.track, revision=revise(deck);
    const primaryRate=engine.audibleRate(primary), rate=rateFor(deck,primary);
    const priorClock=engine.voiceClock(deck,engine.voices.get(deck.index));
    const valid=() => enabled() && revisions.get(deck)===revision && deck.track===ownTrack && primary.track===primaryTrack && engaged(primary) && primary.playing;
    const result=await engine.synchronize(deck,{rate,priorClock,positionAt:when => {
      if (!valid() || Math.abs(engine.voiceRateAt(primary,engine.voices.get(primary.index),when)-primaryRate)>1e-7) throw cancelled();
      return alignedBarPosition(ownTrack,priorClock(when),primaryTrack,engine.voiceClock(primary,engine.voices.get(primary.index))(when));
    }});
    if (!valid()) throw cancelled();
    deck.sync=true;deck.syncState='beat';deck.syncRole ||= 'secondary';
    return result;
  }
  async function press(deck) {
    if (!enabled()) return;
    requireGrid(deck.track);const primary=leader(deck);
    if (!primary) {
      validateTransport(deck,deck);
      syncBPM=gridBPM(deck.track,engine.position(deck))*engine.audibleRate(deck);
      revise(deck);deck.sync=true;deck.syncRole='primary';deck.syncState=deck.playing?'beat':'armed';
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
      deck.syncState=leader(deck)?.playing?'tempo':'beat';
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
    return createBeatgrid(deck.track).timeline({...options,bpm:syncBPM});
  }
  function tempo(deck,rate){
    const bpm=deck.track.bpm*rate;
    for(const d of state.decks.filter(engaged))createBeatgrid(d.track).timeline({position:engine.position(d),when:engine.ctx?.currentTime||0,bpm});
    syncBPM=bpm;return bpm;
  }
  async function edited(track){
    if(!enabled())return;
    for(const d of state.decks.filter(d=>d.track===track&&engaged(d))){
      if(!hasBeatgrid(track)){clear(d);continue;}
      const position=engine.position(d);d.syncState=d.playing?'tempo':'armed';
      if(d.playing){d.position=position;await engine.start(d);}
    }
  }
  return {press,start,played,paused,manipulated,disengage,loaded,reconcile,engaged,timeline,tempo,edited,validate,
    reset:() => {state.decks.forEach(clear);syncBPM=null;}};
}
