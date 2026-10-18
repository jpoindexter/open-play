// Persistent crate membership is separate from decoded playback buffers.
const jobID=id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id);
export function normalizeStemCrateTrack(track){if(typeof track.inStemCrate!=='boolean')track.inStemCrate=jobID(track.stemJob);return track;}
export function createStemCrate({state,preparation,persist=()=>{},onMembership=()=>{},onStatus=()=>{},fetchJob=id=>fetch(`/api/stems/${id}`,{cache:'no-store'})}){
 const checks=new WeakMap(),epochs=new WeakMap(),members=new WeakMap();
 for(const track of state.tracks){normalizeStemCrateTrack(track);members.set(track,track.inStemCrate);}
 const member=track=>track?.inStemCrate===true;
 const next=track=>{const value=(epochs.get(track)||0)+1;epochs.set(track,value);return value;};
 function status(track){
  if(preparation.clearing?.has(track.id))return{phase:'removing',label:'Removing prepared Stems',symbol:'◌'};
  if(preparation.active.has(track.id))return{phase:'preparing',label:'Stems preparing',symbol:'◌'};
  if(!member(track)&&!jobID(track.stemJob))return{phase:'off',label:'',symbol:''};
  const value=checks.get(track);
  if(value&&value.job===track.stemJob)return value;
  return{phase:jobID(track.stemJob)?'checking':'unprepared',label:jobID(track.stemJob)?'Checking saved Stems':'Stems not prepared',symbol:'◌'};
 }
 function membership(track){const now=member(track),prior=members.get(track);members.set(track,now);if(now!==prior)onMembership(track);}
 async function refresh(track){
  const epoch=next(track),id=track.stemJob;
  if(!jobID(id)){checks.delete(track);onStatus(track);return status(track);}
  if(preparation.active.has(track.id)||preparation.clearing?.has(track.id)){onStatus(track);return status(track);}
  const current=()=>epochs.get(track)===epoch&&track.stemJob===id&&state.tracks.includes(track);
  checks.set(track,{job:id,phase:'checking',label:'Checking saved Stems',symbol:'◌'});onStatus(track);
  try{
   const response=await fetchJob(id),value=await response.json();if(!current())return status(track);
   const names=value.stems?.map(s=>s.name),valid=response.ok&&value.id===id&&value.state==='complete'&&Number.isFinite(value.duration)&&Number.isFinite(track.duration)&&Math.abs(value.duration-track.duration)<=.1&&Array.isArray(names)&&names.length===4&&['vocals','other','bass','drums'].every(n=>names.includes(n));
   checks.set(track,valid?{job:id,phase:'ready',label:'Stems ready',symbol:'●',result:value}:{job:id,phase:'unavailable',label:'Saved Stems unavailable or incompatible · prepare again',symbol:'!'});
  }catch{if(current())checks.set(track,{job:id,phase:'unverified',label:'Saved Stems not checked · local service unavailable',symbol:'◌'});}
  if(current())onStatus(track);return status(track);
 }
 function changed(track){next(track);checks.delete(track);membership(track);onStatus(track);queueMicrotask(()=>void refresh(track));}
 function add(track,update=()=>{},backend='scnet'){
  if(!track||track.provider||track.missing)return Promise.reject(Error('Choose an available local track.'));
  const was=member(track);track.inStemCrate=true;members.set(track,true);persist();if(!was)onMembership(track);
  const epoch=next(track);checks.set(track,{job:track.stemJob,phase:'preparing',label:'Stems preparing',symbol:'◌'});onStatus(track);
  return preparation.prepare(track,text=>{onStatus(track);update(text);},backend).catch(error=>{if(epochs.get(track)===epoch&&member(track)){checks.set(track,{job:track.stemJob,phase:'unavailable',label:'Stems preparation failed · prepare again',symbol:'!'});onStatus(track);}throw error;});
 }
 async function remove(track){
  next(track);const pending=preparation.removeFromCrate(track);onStatus(track);const result=await pending;membership(track);onStatus(track);return result;
 }
 return{member,status,add,remove,changed,refresh,refreshAll:()=>Promise.allSettled(state.tracks.filter(t=>member(t)||jobID(t.stemJob)).map(refresh))};
}
