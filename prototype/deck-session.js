// Persist references and paused positions, never voices, queued starts or Sync work.
export function validateDeckSession(value){
 const fail=()=>{throw new TypeError('Invalid saved deck session. Nothing was restored.');};
 if(!value||typeof value!=='object'||![2,4].includes(value.deckCount)||typeof value.selected!=='string'||!Array.isArray(value.decks)||value.decks.length!==4)fail();
 for(const deck of value.decks)if(deck!==null&&(!deck||typeof deck!=='object'||typeof deck.id!=='string'||!Number.isFinite(deck.position)||deck.position<0))fail();
 return value;
}

export function snapshotDeckSession(state,position){
 return {deckCount:state.deckCount,selected:state.selected,decks:state.decks.map(deck=>deck.track?{id:deck.track.id,position:Math.max(0,position(deck))}:deck.sessionMissing||null)};
}

export function restoreDeckSession(value,state){
 const saved=value===undefined?{deckCount:2,selected:'demo-0',decks:[{id:'demo-0',position:0},{id:'demo-1',position:0},null,null]}:validateDeckSession(value);
 const plans=[],missing=[];
 state.deckCount=saved.deckCount;
 if(state.tracks.some(track=>track.id===saved.selected))state.selected=saved.selected;
 for(const [index,entry]of saved.decks.entries()){
  if(!entry)continue;
  const track=state.tracks.find(track=>track.id===entry.id);
  if(!track){state.decks[index].sessionMissing={id:entry.id,position:entry.position};missing.push(entry.id);continue;}
  const position=Math.min(entry.position,track.duration);
  // Prime every reference before async loading can save a partially restored session.
  Object.assign(state.decks[index],{track,position,playing:false,playQueued:false,sync:false});
  plans.push({index,id:track.id,position});
 }
 return {plans,missing};
}
