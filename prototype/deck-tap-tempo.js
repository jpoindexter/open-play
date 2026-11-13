// Independent deck BPM tap estimator. Reuse bounded interval/octave policy,
// then compensate audible playback rate before writing original-track BPM.
import {createFXTempo} from './fx-tempo.js';
export function createDeckTapTempo({engine,persist=()=>{},render=()=>{},notify=()=>{}}){
 const sessions=new Map();
 async function tap(d,timestamp=performance.now()){
  const track=d.track;if(!track){notify('Load a track first.');return;}
  if(track.locked){sessions.delete(d.index);notify('Beatgrid locked; tapped BPM was not applied.');return;}
  const rate=engine.audibleRate(d);if(!Number.isFinite(rate)||rate<=0)throw Error('Tap Tempo needs a valid playback rate.');
  let session=sessions.get(d.index);
  if(!session||session.track!==track||Math.abs(session.rate-rate)>1e-7){session={track,rate,clock:createFXTempo({count:1})};sessions.set(d.index,session);}
  const result=session.clock.tap(0,timestamp);
  if(result.phase!=='manual'||result.ignored){notify(result.ignored?'Tap ignored; keep a steady rhythm.':'Tap Tempo armed.');return result;}
  const bpm=Math.round(Math.max(1,Math.min(999,result.setting.bpm/rate))*100)/100;
  const before=engine.onGridWillChange?.(track);track.bpm=bpm;
  track.metadataSources={...track.metadataSources,bpm:'manual'};track.metadataRevision=(track.metadataRevision||0)+1;
  persist();try{await engine.onGridChanged?.(track,before);}finally{render(track);}
  notify(`Deck ${d.index+1} tapped BPM ${bpm.toFixed(2)} · playback-rate compensated.`);
  return{...result,sourceBPM:bpm,rate};
 }
 return{tap,diagnostics:index=>{const s=sessions.get(index);return s?{...s.clock.diagnostics(0),rate:s.rate,track:s.track.id}:null;}};
}
