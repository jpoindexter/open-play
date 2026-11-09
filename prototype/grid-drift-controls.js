import {analyzeBuffer} from './analysis.js';
import {createBeatgrid} from './beatgrid.js';

export function checkedDriftProposal(suggestion,track){
  if(!suggestion||!Number.isFinite(suggestion.bpm)||suggestion.bpm<1||suggestion.bpm>999||!Number.isFinite(suggestion.firstBeat)||suggestion.firstBeat<0||suggestion.firstBeat>=track.duration||!Array.isArray(suggestion.markers)||!suggestion.markers.length||suggestion.markers.length>64)
    throw new TypeError('No valid drift correction proposal is available.');
  const proposal={bpm:suggestion.bpm,firstBeat:suggestion.firstBeat,markers:suggestion.markers.map(m=>({time:m.time,bpm:m.bpm}))};
  if(proposal.markers.some(m=>!Number.isFinite(m.bpm)||m.bpm<1||m.bpm>999))throw new RangeError('Invalid proposed marker tempo.');
  createBeatgrid({...track,bpm:proposal.bpm,grid:proposal.firstBeat,gridWarpMarkers:proposal.markers});
  return proposal;
}
export function mountGridDrift({body,deck,engine,apply}){
  const track=deck.track,check=body.querySelector('#grid-drift-check'),stage=body.querySelector('#grid-drift-stage'),status=body.querySelector('#grid-drift-status');
  const previous=track.analysisResult?.grid?.drift;
  let drift=previous?.method==='windowed-bass-pulse-drift-v4'&&Number.isFinite(previous.checkedDuration)&&Number.isFinite(previous.maximumResidualSeconds)?previous:null,controller=null;
  const current=()=>body.isConnected&&body.contains(status)&&deck.track===track;
  const proposal=()=>{
    if(drift?.proposalCheck?.status!=='improved')throw new Error('Independent onset check did not validate this correction. Edit the grid manually.');
    if(!drift?.supported||!Number.isFinite(drift.supportedFraction)||drift.supportedFraction<.75)throw new Error('Not enough reliable full-track pulse coverage.');
    return checkedDriftProposal(drift.suggestion,track);
  };
  function render(){
    let valid=false;try{proposal();valid=true;}catch{}
    stage.disabled=track.locked||!valid;
    status.textContent=!drift?'Check the whole track for tempo drift. Proposed markers remain a draft until Save grid.':
      !drift.supported?'Too few reliable pulses for a correction proposal. Edit the grid manually.':
      drift.detected?`Estimated pulse drift up to ${(drift.maximumResidualSeconds*1000).toFixed(1)} ms across ${drift.checkedDuration.toFixed(1)} seconds. ${valid?`${drift.suggestion.markers.length} proposed tempo markers; stage and review before Save grid.`:'No reliable correction map; edit the grid manually.'}`:
      `Checked ${drift.checkedDuration.toFixed(1)} seconds; no sustained drift above 10 ms found in supported sections. This is an estimate, not verified musical alignment.`;
  }
  check.onclick=async()=>{
    if(controller||track.locked)return;
    const owner=new AbortController();controller=owner;check.disabled=true;stage.disabled=true;status.setAttribute('aria-busy','true');
    body.closest('dialog')?.addEventListener('close',()=>owner.abort(),{once:true});
    try{
      status.textContent='Checking the entire track; saved grid is unchanged…';
      const buffer=await engine.buffer(track);
      if(!current()||owner.signal.aborted)return;
      const result=await analyzeBuffer(buffer,{analyzeKey:false,maxSeconds:180,signal:owner.signal});
      if(!current()||owner.signal.aborted)return;
      drift=result.grid?.drift;render();
      if(!drift)status.textContent='No stable reference tempo found. Edit the grid manually.';
    }catch(error){if(current()&&error.name!=='AbortError')status.textContent=error.message;}
    finally{if(controller===owner){controller=null;if(current()){check.disabled=!!track.locked;status.removeAttribute('aria-busy');}}}
  };
  stage.onclick=()=>{
    if(track.locked||controller)return;
    try{apply(proposal());status.textContent='Correction staged in this dialog only. Review the BPM and markers, then Save grid to apply. Close to discard.';}
    catch(error){status.textContent=error.message;}
  };
  check.disabled=!!track.locked;render();
}
