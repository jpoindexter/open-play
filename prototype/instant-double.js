// Independent same-file transport copy. Mixer gains/EQ remain per channel.
export function createInstantDouble({state,engine,load,render=()=>{},notify=()=>{}}){
 const owners=new Map();
 return async function instantDouble(index,source=null){
  const deck=state.decks[index],paired=state.decks[index^1];
  source ||= paired?.track?paired:state.decks.find(d=>d!==deck&&d.track);
  if(!deck||!source?.track||source===deck){notify('Load the other deck first.');return false;}
  const track=source.track,owner={};owners.set(index,owner);
  const valid=()=>owners.get(index)===owner&&source.track===track&&deck.track===track;
  if(!await load(index,track.id,{position:engine.position(source),skipDouble:true}))return false;
  if(!valid())return false;
  const fields=['keylock','keyShift','reverse','repeat','loop','loopIn','loopOut'];
  for(const field of fields)deck[field]=source[field];
  deck.sync=!!source.sync;deck.syncRole=source.sync?'secondary':null;
  await engine.setRate(deck,source.rate);
  if(!valid())return false;
  if(source.playing){
   await engine.start(deck,{positionAt:when=>{
    if(!valid()||!source.playing)throw new DOMException('Instant Double source changed.','AbortError');
    return engine.voiceClock(source,engine.voices.get(source.index))(when);
   }});
  }else await engine.seek(deck,engine.position(source));
  if(!valid())return false;render();return true;
 };
}
