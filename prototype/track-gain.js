import {autoGainData} from './auto-gain.js';
const normalize=value=>Number.isFinite(Number(value))?Math.max(-24,Math.min(24,Number(value))):0;
export function manualTrackGainDB(track){return normalize(track?.trackGainDb??track?.sampleGain??0);}
export function trackGainDB(track){return track?.playbackGainDb===undefined?manualTrackGainDB(track):normalize(track.playbackGainDb);}
export function boundedTrackGain(value){if(!Number.isFinite(Number(value)))throw new TypeError('Track gain needs a finite decibel value.');return normalize(value);}
export function createTrackGain({state,engine,persist=()=>{},onChange=()=>{}}){
 const data=track=>autoGainData(track,state.settings);
 function prepare(track,info){
  if(!info.enabled||!info.available)return false;
  let changed=false;
  if(Number.isFinite(track.autoGainPendingDb)){track.autoGainOffsetDb=track.autoGainPendingDb-info.baseDB;delete track.autoGainPendingDb;changed=true;}
  else if(track.autoGainSchema!==1){track.autoGainOffsetDb=track.trackGainDb!==undefined||track.sampleGain!==undefined?manualTrackGainDB(track)-info.baseDB:0;changed=true;}
  if(track.autoGainSchema!==1){track.autoGainSchema=1;changed=true;}return changed;
 }
 function refresh(track){
  const info=data(track),changed=prepare(track,info),offset=Number.isFinite(track.autoGainOffsetDb)?track.autoGainOffsetDb:0,value=info.enabled&&info.available?boundedTrackGain(info.baseDB+offset):manualTrackGainDB(track);
  track.playbackGainDb=value;delete track.autoGainDeferred;
  for(const d of state.decks)if(d.track?.id===track.id)engine.setDeckTrackGain(d.index,value);engine.updateSampleTrackGain(track,value);onChange(track,value);if(changed)persist();return value;
 }
 function set(track,value){
  if(!track)throw Error('Load a track first.');value=boundedTrackGain(value);const info=data(track);prepare(track,info);
  if(info.enabled&&info.available){track.autoGainOffsetDb=value-info.baseDB;delete track.autoGainPendingDb;}
  else{track.trackGainDb=value;track.sampleGain=value;track.autoGainSchema=1;if(info.enabled)track.autoGainPendingDb=value;}
  refresh(track);persist();return value;
 }
 function measurementReady(track){
  const active=state.decks.some(d=>d.track?.id===track.id&&(d.playing||d.processing||d.playQueued))||[...(engine.samples?.values()||[]),...(engine.sampleRequests?.values()||[])].some(v=>v.track?.id===track.id);
  if(data(track).enabled&&data(track).available&&active){track.autoGainDeferred=true;onChange(track,trackGainDB(track));persist();return false;}refresh(track);return true;
 }
 function resetAuto(track){const info=data(track);if(!info.enabled)throw Error('Enable Auto Gain first.');if(!info.available)throw Error('Analyze a local track with measurable loudness first.');track.autoGainSchema=1;track.autoGainOffsetDb=0;delete track.autoGainPendingDb;refresh(track);persist();return trackGainDB(track);}
 const refreshAll=()=>{for(const track of state.tracks||[])refresh(track);};refreshAll();return{refresh,refreshAll,set,measurementReady,resetAuto,data};
}
