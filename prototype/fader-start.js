// Full fader launches share Smart Sync; temporary Cue auditions stay independent.
export function createFaderStart({engine,smartSync,state,owners,cancel,record,refresh}){
 async function start(d,value,previous,deviceId=''){
  if(!d.track)return;
  if(value===0){
   cancel(d);
   const active=owners.get(d.index);if(active)active.wanted=false;
   if(!d.playing&&!d.processing&&!active){d.cue=engine.position(d);refresh();return;}
   record(d,'stop');engine.pause(d);await engine.seek(d,d.cue);refresh();return;
  }
  if(previous>0)return;
  const owner={track:d.track,deviceId,wanted:true,token:null};owners.set(d.index,owner);
  const current=()=>owners.get(d.index)===owner&&owner.wanted&&d.track===owner.track;
  const seeking=engine.seek(d,d.cue);owner.token=engine.startTokens.get(d.index);await seeking;
  if(!current()||engine.startTokens.get(d.index)!==owner.token||d.playing||d.processing)return;
  record(d,'start');
  const syncing=smartSync.start(d,{isCurrent:current});owner.token=engine.startTokens.get(d.index);
  const synced=await syncing;
  if(!current())return;
  if(!synced){
   if(engine.startTokens.get(d.index)!==owner.token||d.playing||d.processing)return;
   const starting=engine.start(d);owner.token=engine.startTokens.get(d.index);await starting;
  }
  if(current()&&d.playing)smartSync.played(d);
  refresh();
 }
 function resetInput(deviceId){
  for(const [index,owner]of owners)if(deviceId===undefined||owner.deviceId===deviceId){
   owners.delete(index);owner.wanted=false;const d=state.decks[index];
   if(d.track===owner.track&&d.processing&&engine.startTokens.get(index)===owner.token)engine.pause(d);
  }
 }
 return{start,resetInput};
}
