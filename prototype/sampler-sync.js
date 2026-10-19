// Independent persistent sampler membership and audio-time phase planning.
import {createBeatgrid} from './beatgrid.js';
import {alignedBarPosition,hasBeatgrid} from './smart-sync.js';
import {sampleVoiceClock} from './sample-sync-transport.js';
const modulo=(n,d)=>((n%d)+d)%d;
// Time-only legacy annotations do not define an accurate phase grid.
const hasSamplerGrid=track=>hasBeatgrid(track)&&!(track.gridMarkers?.length&&!track.gridWarpMarkers?.length);
export function createSamplerSync({state,engine,trackById,optionsFor,render=()=>{},requestTempo}){
 let mode=state.settings['Sync Mode'];
 const slot=key=>state.samples[Math.floor(key/8)]?.[key%8];
 const members=()=>state.samples.flatMap((bank,b)=>bank.flatMap((s,i)=>s.sync&&s.track?[{key:b*8+i,slot:s,track:trackById(s.track)}]:[])).filter(x=>x.track);
 const enabled=()=>state.settings['Sync Mode']!=='Off';
 function leader(exclude){
  const decks=state.decks.filter(d=>d.track&&d.sync&&d.playing);
  const d=decks.find(d=>d.syncRole==='primary')||decks[0];
  // Joining samples use the shared nominal tempo, not Float32 AudioParam
  // rounding. Source position still comes from the actual audible clock.
  if(d)return{key:'deck:'+d.index,track:d.track,bpm:d.track.bpm*d.rate,clock:engine.voiceClock(d,engine.voices.get(d.index)),phase:!d.reverse&&hasSamplerGrid(d.track)};
  for(const x of members())if(x.key!==exclude){const v=engine.samples?.get(x.key);if(v)return{key:'sample:'+x.key,track:x.track,bpm:v.gridTimeline?.bpm||x.track.bpm*v.settings.rate,clock:sampleVoiceClock(v),phase:hasSamplerGrid(x.track)&&v.syncMode==='beat'};}
  return null;
 }
 function externalLeader(){
  if(!enabled())return null;
  for(const x of members()){
   const voice=engine.samples?.get(x.key),nodes=voice?.gridTimeline?.grid;
   if(!nodes?.length||voice.controller.signal.aborted||engine.ctx.currentTime<voice.anchorTime)continue;
   const track={bpm:nodes[0].bpm,grid:nodes[0].time,duration:voice.track.duration,gridWarpMarkers:nodes.slice(1).map(n=>({time:n.time,bpm:n.bpm}))};
   return{id:'sample:'+x.key,track,bpm:voice.gridTimeline.bpm,clock:sampleVoiceClock(voice),phase:voice.syncMode==='beat',
    valid:()=>enabled()&&slot(x.key)===x.slot&&x.slot.sync&&x.slot.track===voice.track.id&&engine.samples?.get(x.key)===voice&&!voice.controller.signal.aborted};
  }
  return null;
 }
 function plan(track,key,options){
  const s=slot(key);if(!enabled()||!s?.sync||s.track!==track.id)return null;
  if(!Number.isFinite(track.bpm)||track.bpm<=0)throw Error('Analyze a BPM before enabling Sampler Sync.');
  const primary=leader(key),override=options.syncOverride||{},bpm=override.bpm||primary?.bpm||s.syncBPM||track.bpm*(Number(options.rate)||1);
  if(!Number.isFinite(bpm)||bpm<=0||bpm/track.bpm<.5||bpm/track.bpm>2)throw Error('The shared tempo exceeds this Sampler track rate range.');
  const gridTrack=hasSamplerGrid(track)?track:{...track,grid:0,gridWarpMarkers:[],gridMarkers:[]};
  const grid=createBeatgrid(gridTrack),loop=options.repeat&&options.loopEnd>options.loopStart?{start:options.loopStart,end:options.loopEnd}:null;
  const beats=loop?grid.beatAt(loop.end)-grid.beatAt(loop.start):null;
  const wholeBar=!loop||(beats>=4&&Math.abs(beats/4-Math.round(beats/4))<1e-6);
  const beat=hasSamplerGrid(track)&&wholeBar&&(!primary||primary.phase);
  return{bpm,track:gridTrack,mode:beat?'beat':'tempo',valid:()=>enabled()&&slot(key)===s&&s.sync&&s.track===track.id,
   positionAt:(when,{start,loop,priorClock})=>{
    if(override.preserve&&priorClock)return priorClock(when);
    return beat&&primary?alignedBarPosition(gridTrack,start,primary.track,primary.clock(when),loop):start;
   },
   committed:voice=>{s.syncBPM=bpm;s.pitch=(bpm/track.bpm-1)*100;voice.syncMode=beat?'beat':'tempo';s.syncState=voice.handoffBefore?voice.syncMode:'armed';render();}
  };
 }
 engine.onSamplePlan=plan;
 async function enable(key){
  const s=slot(key),track=s&&trackById(s.track);if(!enabled())throw Error('Enable Sync in Setup → DJ Preferences first.');
  if(!track?.bpm)throw Error('Load an analyzed track with a BPM before Sampler Sync.');
  const was=!!s.sync;s.sync=true;s.syncState='armed';
  try{const options=optionsFor(key),prepared=plan(track,key,options);s.syncBPM=prepared.bpm;s.pitch=(prepared.bpm/track.bpm-1)*100;if(engine.samples?.has(key)||engine.sampleRequests.get(key)?.processing)await engine.sample(track,key,options);render();}
  catch(error){if(!was){s.sync=false;s.syncState='off';}render();throw error;}
 }
 function off(key){
  const s=slot(key);if(!s)return;s.sync=false;s.syncState='off';
  engine.cancelSamplePreparation?.(key);const v=engine.samples?.get(key);if(v){s.syncBPM=v.gridTimeline?.bpm||v.track.bpm*v.settings.rate;s.pitch=(s.syncBPM/v.track.bpm-1)*100;}
  render();
 }
 function participants(bpm){
  return members().filter(x=>engine.samples?.has(x.key)||engine.sampleRequests.get(x.key)?.processing).map(x=>({id:'sample:'+x.key,start:handoff=>engine.sample(x.track,x.key,{...optionsFor(x.key),syncOverride:{bpm,preserve:true},handoff})}));
 }
 function settingsChanged(){const next=state.settings['Sync Mode'];if(next===mode)return;mode=next;for(const x of members())off(x.key);}
 function stateFor(key){
  const s=slot(key),track=s&&trackById(s.track),v=engine.samples?.get(key);
  if(s?.sync)s.syncState=s.processing?'preparing':v?(engine.ctx.currentTime<v.anchorTime&&!v.handoffBefore?'armed':v.syncMode||'tempo'):'armed';
  const active=!!s?.sync,status=active?s.syncState:'off';
  let label=status==='beat'?`Beat ${Math.floor(modulo(createBeatgrid(track).beatAt(engine.samplePosition(key)),4))+1}`:status==='tempo'?'Tempo Sync':status==='armed'?'Sync armed':status==='preparing'?'Preparing Sync…':'Sync off';
  return{active,status,label,available:enabled()&&!!track?.bpm,reason:!enabled()?'Enable Sync in Setup':!track?.bpm?'Load a track with an analyzed BPM':''};
 }
 function tick(){settingsChanged();for(const x of members())stateFor(x.key);if(state.panel==='sampler'||document.querySelector('#sample-sync-toggle'))render();}
 function rememberTempo(bpm){for(const x of members())if(!engine.samples?.has(x.key)){x.slot.syncBPM=bpm;x.slot.pitch=(bpm/x.track.bpm-1)*100;}render();}
 return{enable,off,plan,participants,settingsChanged,stateFor,tick,members,externalLeader,rememberTempo,tempo:(key,rate)=>{const s=slot(key),track=s&&trackById(s.track);if(!s?.sync||!track?.bpm)return Promise.resolve();return requestTempo(track.bpm*rate);}};
}
