// Independently implemented input predicates and active performance-pad routing.
// This module never sends hardware output or interprets executable source code.
export const controllerPadModes=['hot cues','loop roll','sampler','manual loop','auto loop','pitch play','scratch bank','stems'];
export const controllerPerformanceTarget=/^(?:Deck ([1-4]) (?:pad mode (hot cues|loop roll|sampler|manual loop|auto loop|pitch play|scratch bank|stems)|active (shift )?pad ([1-8])|controller modifier ([1-9]|1[0-6]))|Controller modifier ([1-9]|1[0-6]))$/;
export function validateControllerConditions(conditions){
 if(conditions===undefined)return undefined;
 if(!Array.isArray(conditions)||conditions.length>16)throw Error('Unsupported controller predicate count.');
 return conditions.map(p=>{
  if(!p||!Number.isInteger(p.deck)||p.deck<0||p.deck>4)throw Error('Invalid controller predicate deck.');
  if(p.kind==='modifier'){
   if(Object.keys(p).some(k=>!['kind','number','deck','equals'].includes(k))||!Number.isInteger(p.number)||p.number<1||p.number>16||typeof p.equals!=='boolean')throw Error('Invalid modifier predicate.');
  }else if(p.kind==='padMode'){
   if(Object.keys(p).some(k=>!['kind','deck','equals','negate'].includes(k))||!p.deck||!controllerPadModes.includes(p.equals)||typeof p.negate!=='boolean')throw Error('Invalid pad-mode predicate.');
  }else throw Error('Unknown controller predicate remains inactive.');
  return {...p};
 });
}
export function createControllerPerformance({state,dispatch,onMode=()=>{},onStatus=()=>{}}){
 const modifiers=new Map(),held=new Map(),modeButtons=new Set();
 const inputKey=m=>JSON.stringify([m.deviceId||'',m.type,m.channel,m.number]);
 const scope=(m,deck,number)=>JSON.stringify([m.deviceId||'',m.controllerProfile||'',deck,number]);
 const mode=d=>d?.controllerPadMode||({Cues:'hot cues',Stems:'stems',Pitch:'pitch play'}[d?.tab])||(d?.tab==='Loops'?(d.loopPadMode==='roll'?'loop roll':d.loopPadMode==='auto'?'auto loop':'saved loops'):'unsupported');
 function matches(message,mapping){return (mapping.conditions||[]).every(p=>p.kind==='modifier'
  ?!!modifiers.get(scope({...mapping,deviceId:message.deviceId},p.deck,p.number))?.size===p.equals
  :(mode(state.decks[p.deck-1])===p.equals)!==p.negate);}
 function release(message){
  if(message.pressed)return;
  const key=inputKey(message);modeButtons.delete(key);
  const keys=held.get(key)||[];held.delete(key);
  for(const id of keys){const owners=modifiers.get(id);owners?.delete(key);if(!owners?.size)modifiers.delete(id);}
 }
 async function route(message,mapping){
  const match=controllerPerformanceTarget.exec(mapping.target);if(!match)return false;
  const key=inputKey(message),deck=Number(match[1]),modifier=Number(match[5]||match[6]);
  if(modifier){
   if(message.pressed){const id=scope({...mapping,deviceId:message.deviceId},deck||0,modifier);let owners=modifiers.get(id);if(!owners)modifiers.set(id,owners=new Set());owners.add(key);const ids=held.get(key)||[];if(!ids.includes(id))ids.push(id);held.set(key,ids);}
   else release(message);return true;
  }
  const d=state.decks[deck-1];if(!d)return true;
  if(match[2]){
   if(!message.pressed)return true;
   if(modeButtons.has(key))return true;modeButtons.add(key);
   d.controllerPadMode=match[2];
   const view={'hot cues':'Cues','loop roll':'Loops','manual loop':'Loops','auto loop':'Loops','stems':'Stems','pitch play':'Pitch'}[match[2]];
   if(view)d.tab=view;
   if(match[2]==='auto loop'||match[2]==='loop roll')d.loopPadMode=match[2]==='auto loop'?'auto':'roll';
   if(match[2]==='manual loop')d.loopPadMode='saved';
   onMode(d,match[2]);onStatus(`Deck ${deck} pad mode: ${match[2]}.`);return true;
  }
  // Releases use the action captured by the existing router at Note On.
  // They must never be reinterpreted after a pad-mode/condition change.
  if(!message.pressed)return true;
  const shifted=!!match[3],pad=Number(match[4]),current=mode(d);
  let target;
  if(current==='hot cues')target=`Deck ${deck} ${shifted?'clear cue':'hot cue'} ${pad}`;
  if(current==='pitch play')target=`Deck ${deck} ${shifted?'pitch cue select':'pitch play'} pad ${pad}`;
  if(current==='sampler')target=`Sampler ${pad}${shifted?' alt':''}`;
  if(current==='scratch bank')target=`Deck ${deck} scratch bank${shifted?' previous':''} pad ${pad}`;
  if(!shifted&&current==='stems')target=`Deck ${deck} stems pad ${pad}`;
  if(!shifted&&(current==='auto loop'||current==='loop roll'))target=`Deck ${deck} ${current} pad ${pad}`;
  if(!shifted&&current==='manual loop'&&pad<=7)target=`Deck ${deck} manual loop pad ${pad}`;
  if(!target){onStatus(`Deck ${deck}: ${shifted?'Shift ':''}pad ${pad} in ${current} has no verified adapter.`);return true;}
  await dispatch(message,{...mapping,target});return true;
 }
 function resetInput(deviceId){
  for(const key of [...held.keys(),...modeButtons]){const [id]=JSON.parse(key);if(deviceId===undefined||id===deviceId)release({deviceId:id,type:JSON.parse(key)[1],channel:JSON.parse(key)[2],number:JSON.parse(key)[3],pressed:false});}
 }
 return{matches,dispatch:route,release,resetInput};
}
