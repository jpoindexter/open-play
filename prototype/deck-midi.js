// Independently authored playback/mixer MIDI actions. Device addresses are data,
// not imported controller scripts. Physical acceptance is recorded separately.
import {mappedValue} from './midi.js';
import {createJogBend} from './jog-bend.js';
import {createMIDIJogTouch} from './midi-jog-touch.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const key=m=>JSON.stringify([m.deviceId||'',m.type,m.channel,m.number]);
const continuous=['tempo','trim','high','mid','low','filter','level','jog nudge','jog bend','jog surface'];
const padCommands=['auto loop','loop roll','stems','pitch play','pitch cue select'].flatMap(mode=>Array.from({length:8},(_,i)=>`${mode} pad ${i+1}`));
const commands=[...padCommands,'load','play','cue','sync','sync off','headphone cue','loop','loop in','loop out','loop half','loop double','keylock','jog touch','jog touch fast','vinyl','slip','quantize','tempo range','previous','stutter'];
export const deckMIDITargets=Array.from({length:4},(_,i)=>[...continuous,...commands,...Array.from({length:8},(_,n)=>`hot cue ${n+1}`),...Array.from({length:8},(_,n)=>`clear cue ${n+1}`)].map(x=>`Deck ${i+1} ${x}`)).flat();
export const samplerMIDITargets=Array.from({length:8},(_,n)=>[`Sampler ${n+1}`,`Sampler ${n+1} alt`]).flat();
export const fxMIDITargets=[1,2].flatMap(n=>['depth','beat','enable'].map(x=>`FX unit ${n} ${x}`));
export function createDeckMIDIRouter({state,engine,actions,applyFX=()=>{},onChange=()=>{},onStatus=()=>{}}){
 const pairs=new Map(),buttons=new Map(),pickup=new Map(),rates=new Map(),nudges=new Map();
 const jogBend=createJogBend({engine,onError:error=>onStatus(error.message)});
 const jogTouch=createMIDIJogTouch({engine,state,beforeBegin:deck=>jogBend.resetDeck(deck.index),onError:error=>onStatus(error.message)});
 const deckFor=target=>/^Deck ([1-4]) (.+)$/.exec(target);
 const repaintMix=(d,field)=>onChange({deck:d.index,field,value:d[field]});
 function scheduleRate(d,rate){
  let q=rates.get(d.index);if(q){q.wanted=rate;return q.promise;}
  q={wanted:rate,promise:null};rates.set(d.index,q);
  q.promise=Promise.resolve().then(async()=>{while(q.wanted!==null){const next=q.wanted;q.wanted=null;await engine.setRate(d,next);}}).finally(()=>{if(rates.get(d.index)===q)rates.delete(d.index);});return q.promise;
 }
 function release(message){
  if(message.pressed)return false;
  if(jogTouch.releaseMessage(message))return true;
  const hold=buttons.get(key(message));if(!hold)return false;
  buttons.delete(key(message));if(hold.release)void Promise.resolve(hold.release()).catch(error=>onStatus(error.message));if(hold.cue)void actions.cueHolds.release(hold.owner,{immediate:true}).catch(error=>onStatus(error.message));return true;
 }
 async function dispatch(message,mapping){
  const sample=/^Sampler ([1-8])( alt)?$/.exec(mapping.target);
  if(sample){
   if(mapping.encoding!=='7-bit absolute'||message.type==='Pitch bend')throw Error('Sampler pads need a7-bit Note/CC button with release.');
   if(!message.pressed){release(message);return true;}
   if(buttons.has(key(message)))return true;
   const held={deviceId:message.deviceId||'',release:null};buttons.set(key(message),held);
   try{const started=actions.midiSample(Number(sample[1])-1,!!sample[2]);held.release=started.release;await started.pending;}
   catch(error){if(buttons.get(key(message))===held)buttons.delete(key(message));throw error;}
   return true;
  }
  const fx=/^FX unit ([12]) (depth|beat|enable)$/.exec(mapping.target);
  if(fx){
   const bank=Number(fx[1])-1,slots=state.fx[bank];if(!slots)return true;
   const relative=mapping.encoding.startsWith('Relative');
   if(fx[2]==='enable'){
    if(!message.pressed){release(message);return true;}
    if(buttons.has(key(message)))return true;
    buttons.set(key(message),{deviceId:message.deviceId||''});slots[0].on=!slots[0].on;
   }else{
    let value=mappedValue(message,mapping.encoding,pairs);if(mapping.invert)value=relative?-value:1-value;
    if(fx[2]==='depth')for(const slot of slots)slot.depth=clamp(relative?slot.depth+value:value*100,0,100);
    else{
     const beats=['1/32','1/16','1/8','1/4','1/2','1','2','4','8'];
     const i=relative?beats.indexOf(String(slots[0].beat))+Math.sign(value):Math.round(value*(beats.length-1));
     for(const slot of slots)slot.beat=beats[clamp(i,0,beats.length-1)];
    }
   }
   applyFX();onChange({fx:bank});return true;
  }
  const match=deckFor(mapping.target);if(!match)return false;
  const d=state.decks[Number(match[1])-1],action=match[2];
  if(!d||![...continuous,...commands,...Array.from({length:8},(_,n)=>`hot cue ${n+1}`),...Array.from({length:8},(_,n)=>`clear cue ${n+1}`)].includes(action))return false;
  const owner=`midi:${key(message)}`;
  if(action==='jog touch'||action==='jog touch fast'){
   if(mapping.encoding!=='7-bit absolute'||message.type==='Pitch bend')throw Error('Jog touch needs a7-bit Note/CC button with release.');
   if(message.pressed)await jogTouch.press(d,message,{fast:action==='jog touch fast',vinyl:d.vinyl!==false});
   else jogTouch.releaseMessage(message);return true;
  }
  if(!continuous.includes(action)){
   if(!message.pressed){release(message);return true;}
   if(buttons.has(key(message)))return true;
   const hot=/^hot cue ([1-8])$/.exec(action),clear=/^clear cue ([1-8])$/.exec(action),cue=action==='cue'||!!hot;
   const held={owner,cue,deviceId:message.deviceId||'',release:null};buttons.set(key(message),held);
   const performancePad=/^(stems|pitch play|pitch cue select) pad ([1-8])$/.exec(action);
   if(performancePad){
    try{
     if(mapping.encoding!=='7-bit absolute'||message.type==='Pitch bend')throw Error('Performance pads need a7-bit Note/CC button with release.');
     const pad=Number(performancePad[2])-1;
     if(performancePad[1]==='stems')await actions.stemPad(d,pad);
     else{
      const select=performancePad[1]==='pitch cue select';
      if(!select)held.release=()=>actions.pitchPlay.release(owner);
      await actions.pitchPlay.press(owner,d,pad,select);
     }
    }catch(error){if(buttons.get(key(message))===held)buttons.delete(key(message));throw error;}return true;
   }
   const loopPad=/^(auto loop|loop roll) pad ([1-8])$/.exec(action);
   if(loopPad){
    if(mapping.encoding!=='7-bit absolute'||message.type==='Pitch bend')throw Error('Loop pads need a7-bit Note/CC button with release.');
    try{const started=actions.loopPads.press(d,loopPad[1]==='auto loop'?'auto':'roll',Number(loopPad[2])-1);held.release=started.release;await started.pending;}
    catch(error){if(buttons.get(key(message))===held)buttons.delete(key(message));throw error;}return true;
   }
   if(clear){await actions.cueHolds.press(owner,d,Number(clear[1])-1,true);return true;}
   if(cue){await actions.cueHolds.press(owner,d,hot?Number(hot[1])-1:null);return true;}
   if(action==='vinyl'){await jogTouch.resetDeck(d.index);await jogBend.resetDeck(d.index);d.vinyl=d.vinyl===false;onStatus(`Deck ${d.index+1} Vinyl ${d.vinyl?'on':'off'}.`);onChange({deck:d.index,action});return true;}
   const names={slip:'slip',quantize:'quantize','tempo range':'range',previous:'previous',stutter:'stutter',load:'load',play:'play',sync:'sync','sync off':'syncOff','headphone cue':'pfl',loop:'loop','loop in':'loopIn','loop out':'loopOut','loop half':'loopHalf','loop double':'loopDouble',keylock:'keylock'};
   await actions.deckAction(names[action],d.index,{});onChange({deck:d.index,action});return true;
  }
  if(message.type==='Note'&&!message.pressed)return true;
  const relative=mapping.encoding.startsWith('Relative');
  let value=mappedValue(message,mapping.encoding,pairs);
  if(mapping.invert)value=relative?-value:1-value;
  if(!Number.isFinite(value))throw new RangeError('MIDI control needs a finite value.');
  const center=mapping.encoding==='14-bit absolute'||message.type==='Pitch bend'?8192/16383:64/127;
  const bipolar=x=>x<center?(x-center)/center:(x-center)/(1-center);
  if(action==='tempo'){
   const range=Number(d.pitchRange)||8;
   const requested=relative?d.rate+value*.0001:1+bipolar(value)*range/100;
   const id=key(mapping.encoding==='14-bit absolute'&&message.type==='CC'?{...message,number:message.number%32}:message),previous=pickup.get(id),physical=requested;
   // After software/Sync moves tempo, an absolute fader must cross it before
   // taking over. No surprise shared-tempo jump from its first stale value.
   const tolerance=range/100/63;
   let caught=relative||mapping.pickup===false||Math.abs(physical-d.rate)<=tolerance;
   if(previous&&Math.abs(previous.applied-d.rate)<=tolerance&&previous.caught)caught=true;
   if(previous&&(physical-d.rate)*(previous.physical-d.rate)<=0)caught=true;
   pickup.set(id,{physical,caught,applied:caught?requested:d.rate});
   if(!caught){onStatus(`Deck ${d.index+1}: move tempo fader through ${((d.rate-1)*100).toFixed(1)}% to pick it up.`);return true;}
   await scheduleRate(d,clamp(requested,.25,4));onChange({deck:d.index,field:'tempo',value:d.rate});return true;
  }
  if(action==='jog surface'){
   if(!relative)throw Error('Jog surface requires a relative MIDI encoding.');
   if(await jogTouch.move(d,value,message.deviceId||''))return true;
  }
  if((action==='jog bend'||action==='jog surface')&&d.playing){
   if(!relative)throw Error('Jog bend requires a relative MIDI encoding.');
   await jogBend.tick(d,value,message.deviceId||'');return true;
  }
  if(action==='jog nudge'||action==='jog bend'||action==='jog surface'){
   if(!relative)throw Error('Jog nudge requires a relative MIDI encoding.');
   if(!value||!d.track)return true;
   // Phase steps for beatmatching; this target does not claim scratch/touch.
   let q=nudges.get(d.index);
   if(q){q.position=clamp(q.position+value*.01,0,d.track.duration);q.revision++;return q.promise;}
   q={track:d.track,position:clamp(engine.position(d)+value*.01,0,d.track.duration),revision:1,promise:null};nudges.set(d.index,q);
   q.promise=Promise.resolve().then(async()=>{let sent=0;while(sent!==q.revision&&d.track===q.track){sent=q.revision;await engine.seek(d,q.position);}}).finally(()=>{if(nudges.get(d.index)===q)nudges.delete(d.index);});return q.promise;
  }
  let next;
  if(action==='level')next=relative?(d.level??.8)+value/127:value;
  else if(action==='trim')next=relative?(d.trim??1)+value/64:1+bipolar(value);
  else if(action==='filter')next=relative?(d.filter||0)+value/64:bipolar(value);
  else next=relative?(d[action]||0)+value*.5:(value<center?bipolar(value)*24:bipolar(value)*6);
  const [lo,hi]=action==='level'?[0,1]:action==='trim'?[0,2]:action==='filter'?[-1,1]:[-24,6];
  d[action]=clamp(next,lo,hi);engine.mix(d.index,action,d[action]);repaintMix(d,action);return true;
 }
 function resetInput(deviceId){
  void jogTouch.resetInput(deviceId).catch(error=>onStatus(error.message));
  void jogBend.resetInput(deviceId).catch(error=>onStatus(error.message));
  for(const [k,b]of buttons)if(deviceId===undefined||b.deviceId===deviceId){buttons.delete(k);if(b.release)void Promise.resolve(b.release()).catch(error=>onStatus(error.message));if(b.cue)void actions.cueHolds.release(b.owner,{immediate:true}).catch(error=>onStatus(error.message));}
  pickup.clear();pairs.clear();
 }
 return{dispatch,release,resetInput};
}

export function herculesPlaybackMappings(deviceId){
 if(!deviceId)throw Error('Connect the named Hercules input before installing its controls.');
 const maps=[],add=(target,type,channel,number,encoding='7-bit absolute',extra={})=>maps.push({target,type,channel,number,encoding,deviceId,preset:'hercules-inpulse-300-mk2-playback-v6',...extra});
 add('Library browse','CC',1,1,'Relative two’s complement');add('Crossfader','CC',1,0);
 for(let deck=1;deck<=2;deck++){
  const ch=deck+1,t=s=>`Deck ${deck} ${s}`;
  for(const [name,n]of [['level',0],['filter',1],['low',2],['mid',3],['high',4],['trim',5]])add(t(name),'CC',ch,n);
  add(t('tempo'),'CC',ch,8,'14-bit absolute',{pickup:true});
  add(`FX unit ${deck} depth`,'CC',ch,6);add(`FX unit ${deck} beat`,'CC',ch,7);add(`FX unit ${deck} enable`,'Note',ch,0);
  add(t('jog bend'),'CC',ch,9,'Relative two’s complement');
  add(t('jog surface'),'CC',ch,10,'Relative two’s complement');
  add(t('jog touch'),'Note',ch,8);add(t('jog touch fast'),'Note',ch+3,8);
  add(t('jog surface'),'CC',ch+3,10,'Relative two’s complement');
  add(t('jog bend'),'CC',ch+3,9,'Relative two’s complement');
  add(t('vinyl'),'Note',ch+3,1);
  for(const [name,n]of [['loop',3],['sync',5],['cue',6],['play',7],['loop in',9],['loop out',10],['headphone cue',12],['load',13]])add(t(name),'Note',ch,n);
  for(const [name,n]of [['sync off',5],['loop half',9],['loop double',10]])add(t(name),'Note',ch+3,n);
  for(const [name,n]of [['slip',1],['quantize',2]])add(t(name),'Note',ch,n);
  for(const [name,n]of [['tempo range',2],['previous',6],['stutter',7]])add(t(name),'Note',ch+3,n);
  for(let n=0;n<8;n++){
   add(t(`stems pad ${n+1}`),'Note',deck+6,n+0x20);add(t(`pitch play pad ${n+1}`),'Note',deck+6,n+0x40);add(t(`pitch cue select pad ${n+1}`),'Note',deck+6,n+0x48);
   add(t(`auto loop pad ${n+1}`),'Note',deck+6,n+0x10);add(t(`loop roll pad ${n+1}`),'Note',deck+6,n+0x50);
   add(t(`hot cue ${n+1}`),'Note',deck+6,n);add(t(`clear cue ${n+1}`),'Note',deck+6,n+8);
   add(`Sampler ${n+1}`,'Note',deck+6,n+0x30);add(`Sampler ${n+1} alt`,'Note',deck+6,n+0x38);
  }
 }
 return maps;
}
