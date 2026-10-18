// Independent factory-input actions. Source identity and hardware/DSP acceptance
// remain separate. This module emits no MIDI or device initialization messages.
import {mappedValue} from './midi.js';
export const controllerFXMultipliers=[1/16,1/8,1/4,1/2,1,2,4,8];
export const controllerFXSelectionDelay=2000; // Open Play policy; vendor timing unmeasured.
export const controllerMixerTarget=/^(?:Master volume|Cue volume|FX unit ([12]) (?:slot ([1-3]) (depth|enable|select|menu)|beat multiplier)|Deck ([1-4]) fader start enable)$/;
export function normalizeFXMultipliers(value){return [0,1].map(i=>controllerFXMultipliers.includes(value?.[i])?value[i]:1);}
export function withFXMultipliers(banks,multipliers){return banks.map((bank,b)=>bank.map(slot=>{
 const parts=String(slot.beat).split('/').map(Number),base=parts.length===2?parts[0]/parts[1]:parts[0];
 return {...slot,beat:base*(multipliers?.[b]||1)};
}));}
export function createControllerMixer({state,engine,setMasterVolume,updateCue,applyFX,effectNames,persist=()=>{},root=globalThis.document,onStatus=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}){
 state.fxBeatMultipliers=normalizeFXMultipliers(state.fxBeatMultipliers);
 const pairs=new Map(),buttons=new Set(),menus=new Map(),flags=new Map(),flagOwners=new Map();
 const key=m=>JSON.stringify([m.deviceId||'',m.type,m.channel,m.number]);
 const selector=(b,i)=>root?.querySelector(`[data-fx-select="${b}:${i}"]`);
 function closeMenu(id){const menu=menus.get(id);if(!menu)return;clearTimer(menu.timer);menus.delete(id);const el=selector(menu.bank,menu.slot);if(el){el.size=1;el.value=state.fx[menu.bank][menu.slot].name;el.removeAttribute('data-controller-fx-pending');}}
 function syncUI(){
  for(let b=0;b<state.fx.length;b++){
   const multiplier=root?.querySelector(`[data-fx-multiplier="${b}"]`);if(multiplier)multiplier.value=String(state.fxBeatMultipliers[b]);
   for(let i=0;i<state.fx[b].length;i++){
    const slot=state.fx[b][i],depth=root?.querySelector(`[data-fx-depth="${b}:${i}"]`),on=root?.querySelector(`[data-fx-on="${b}:${i}"]`),el=selector(b,i),menu=menus.get(`${b}:${i}`);
    if(depth)depth.value=String(slot.depth);if(on)on.classList.toggle('active',slot.on);
    if(el){el.value=menu?effectNames[menu.index]:slot.name;el.size=menu?6:1;if(menu)el.setAttribute('data-controller-fx-pending','true');else el.removeAttribute('data-controller-fx-pending');}
   }
  }
 }
 function select(bank,slot,index){
  const target=state.fx[bank]?.[slot],name=effectNames[Math.max(0,Math.min(effectNames.length-1,index))];if(!target||!name)return;
  if(target.name!==name){target.name=name;target.params={};target.on=false;applyFX();}
  syncUI();onStatus(`FX unit ${bank+1} slot ${slot+1}: ${name}.`);
 }
 function schedule(menu){clearTimer(menu.timer);menu.timer=setTimer(()=>{if(menus.get(menu.id)!==menu)return;closeMenu(menu.id);select(menu.bank,menu.slot,menu.index);},controllerFXSelectionDelay);}
 function flag(message,deck){
  const d=state.decks[deck],physical=key(message),id=JSON.stringify([message.deviceId||'',deck]);
  if(!d)return;
  if(!message.pressed){release(message);return;}
  let entry=flags.get(id);if(!entry)flags.set(id,entry={deck,deviceId:message.deviceId||'',owners:new Set()});entry.owners.add(physical);
  const ids=flagOwners.get(physical)||new Set();ids.add(id);flagOwners.set(physical,ids);
  (d.controllerFaderStartDevices||=new Set()).add(entry.deviceId);
 }
 function release(message){
  if(message.pressed)return;const physical=key(message);buttons.delete(physical);
  for(const id of flagOwners.get(physical)||[]){const entry=flags.get(id);entry?.owners.delete(physical);if(entry&&!entry.owners.size){state.decks[entry.deck]?.controllerFaderStartDevices?.delete(entry.deviceId);flags.delete(id);}}
  flagOwners.delete(physical);
 }
 async function dispatch(message,mapping){
  const match=controllerMixerTarget.exec(mapping.target);if(!match)return false;
  if(match[4]){flag(message,Number(match[4])-1);return true;}
  if(message.type==='Note'){
   if(!message.pressed){release(message);return true;}if(buttons.has(key(message)))return true;buttons.add(key(message));
  }
  let value=mappedValue(message,mapping.encoding,pairs);if(mapping.invert)value=1-value;
  if(mapping.target==='Master volume'){setMasterVolume(value);return true;}
  if(mapping.target==='Cue volume'){updateCue(value);return true;}
  const bank=Number(match[1])-1,slot=Number(match[2])-1,action=match[3],spec=state.fx[bank]?.[slot];
  if(!action){const next=controllerFXMultipliers[Math.round(value*(controllerFXMultipliers.length-1))];if(next!==state.fxBeatMultipliers[bank]){state.fxBeatMultipliers[bank]=next;applyFX();persist();}syncUI();return true;}
  if(!spec)return true;
  if(action==='enable')spec.on=!spec.on;
  if(action==='depth')spec.depth=Math.max(0,Math.min(100,value*100));
  if(action==='select'||action==='menu'){
   const id=`${bank}:${slot}`,index=Math.max(0,effectNames.indexOf(spec.name)),menu=menus.get(id);
   if(action==='menu'){
    if(menu){closeMenu(id);select(bank,slot,menu.index);}
    else if(state.panel==='fx'&&!root?.querySelector('#panel')?.hidden&&selector(bank,slot)){
     const next={id,bank,slot,index,deviceId:message.deviceId||'',timer:null};menus.set(id,next);schedule(next);syncUI();selector(bank,slot)?.focus();onStatus(`Choose FX unit ${bank+1} slot ${slot+1}; selection commits after2 seconds.`);
    }else select(bank,slot,index+1);
   }else{
    const selected=Math.round(Math.max(0,Math.min(1,value))*(effectNames.length-1));
    if(state.panel==='fx'&&!root?.querySelector('#panel')?.hidden&&selector(bank,slot)){
     const next=menu||{id,bank,slot,index,deviceId:message.deviceId||'',timer:null};next.index=selected;menus.set(id,next);schedule(next);syncUI();
    }else select(bank,slot,selected);
   }
   return true;
  }
  applyFX();syncUI();return true;
 }
 function resetInput(deviceId){
  for(const physical of new Set([...buttons,...flagOwners.keys()])){const [id,type,channel,number]=JSON.parse(physical);if(deviceId===undefined||id===deviceId)release({deviceId:id,type,channel,number,pressed:false});}
  for(const [id,menu]of menus)if(deviceId===undefined||menu.deviceId===deviceId)closeMenu(id);
  pairs.clear();
 }
 return{dispatch,release,resetInput,syncUI,cancelSelection:(bank,slot)=>closeMenu(`${bank}:${slot}`)};
}
