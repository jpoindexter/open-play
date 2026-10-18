// Momentary whole-deck Censor. A source/gesture owner survives asynchronous
// preparation; releasing one input cannot release another held input.
export function createCensorHolds({engine,onChange=()=>{},onError=()=>{}}){
 const sessions=new Map(),held=new Map();let sequence=0;
 const changed=(s,active)=>{s.deck.censor=active;onChange(s.deck,active);};
 function forget(deck,owner){
  const s=sessions.get(deck.index);if(!s||s.owner!==owner)return false;
  sessions.delete(deck.index);for(const key of s.keys)if(held.get(key)===s)held.delete(key);s.keys.clear();changed(s,false);return true;
 }
 function press(key,deck){
  if(!deck?.track||!deck.playing)return Promise.resolve(false);
  if(deck.mode==='ABS'){onError(Error('Censor is unavailable in Absolute mode.'));return Promise.resolve(false);}
  if(held.has(key))return held.get(key).pending;
  let s=sessions.get(deck.index);
  if(s&&s.track!==deck.track){forget(s.deck,s.owner);s=null;}
  if(s){s.keys.add(key);held.set(key,s);return s.pending;}
  s={deck,track:deck.track,owner:`censor:${++sequence}`,keys:new Set([key]),pending:null};sessions.set(deck.index,s);held.set(key,s);changed(s,true);
  s.pending=Promise.resolve(engine.beginDeckScratch(deck,s.owner,{censor:true})).then(result=>{if(!result)forget(deck,s.owner);return result;}).catch(error=>{forget(deck,s.owner);if(error.name!=='AbortError')onError(error);return false;});
  return s.pending;
 }
 async function release(key){
  const s=held.get(key);if(!s)return false;held.delete(key);s.keys.delete(key);if(s.keys.size)return false;
  if(sessions.get(s.deck.index)===s)sessions.delete(s.deck.index);changed(s,false);
  if(s.deck.track!==s.track)return false;
  try{return await engine.endDeckScratch(s.deck,s.owner);}catch(error){if(error.name!=='AbortError')onError(error);return false;}
 }
 return{press,release,forget,releaseAll:()=>Promise.all([...held.keys()].map(release)),cancelDeck:deck=>Promise.all([...held].filter(([,s])=>s.deck===deck).map(([key])=>release(key))),active:deck=>sessions.has(deck.index)};
}
