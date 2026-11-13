// Share Play ownership so ordinary Stop, Cue and load also cancel Repeat.
export async function restartRepeat(d,{engine,smartSync,state,requests,notify}){
  const request={track:d.track};requests.set(d,request);d.playQueued=true;
  const current=()=>requests.get(d)===request&&d.track===request.track&&state.decks[d.index]===d;
  d.position=d.reverse?d.track.duration:0;
  try{
    const syncing=smartSync.start(d,{isCurrent:current});
    let token=engine.startTokens.get(d.index);
    const synced=await syncing;
    if(!current())return;
    if(!synced){
      if(engine.startTokens.get(d.index)!==token||d.playing||d.processing)return;
      const starting=engine.start(d);token=engine.startTokens.get(d.index);
      await starting;
    }
    if(current()&&engine.startTokens.get(d.index)===token&&d.playing)smartSync.played(d);
  }catch(error){
    if(current()&&error.name!=='AbortError')notify(error.message);
  }finally{
    if(requests.get(d)===request){requests.delete(d);d.playQueued=false;}
  }
}
