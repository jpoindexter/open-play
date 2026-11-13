// Bounded command evidence only: no event listeners, storage or raw input text.
const origins=new Set(['gui','keyboard','midi','fader-start','autoplay','stutter','unknown']);
const intents=new Set(['start','stop','cancel','latch','toggle','unknown']);
const eventTypes=new Set(['click','keydown','keyup','pointerdown','pointerup','pointercancel','mousedown','mouseup','Note','CC','Pitch bend']);
const playCodes=new Set(['KeyW','KeyS','Space','Enter','NumpadEnter']);
const targetTags=new Set(['HTML','BODY','BUTTON','INPUT','SELECT','TEXTAREA','DIV','SPAN','SVG','PATH','svg','path']);
const targetActions=new Set(['play','stutter']);
const pointerTypes=new Set(['mouse','pen','touch']);
const visibilityStates=new Set(['visible','hidden','prerender']);
export function createPlaybackIntents({now=()=>performance.now()}={}){
 const records=[];
 function record(deck,options={}){
  try{
   const {origin,event,intent,ready,visibility}=options||{},target=event?.target,at=now();
   const row={
    at:Number.isFinite(at)?at:null,
    deck:Number.isInteger(deck?.index)&&deck.index>=0&&deck.index<4?deck.index+1:null,
    intent:intents.has(intent)?intent:'unknown',
    playing:deck?.playing===true,processing:deck?.processing===true,queued:deck?.playQueued===true,
    origin:origins.has(origin)?origin:'unknown',ready:typeof ready==='boolean'?ready:null,
    visibility:visibilityStates.has(visibility)?visibility:'unknown',
    eventType:eventTypes.has(event?.type)?event.type:null,
    trusted:typeof event?.isTrusted==='boolean'?event.isTrusted:null,
    code:playCodes.has(event?.code)?event.code:null,
    ctrl:event?.ctrlKey===true,meta:event?.metaKey===true,alt:event?.altKey===true,shift:event?.shiftKey===true,
    repeat:event?.repeat===true,
    button:Number.isInteger(event?.button)&&event.button>=0&&event.button<=4?event.button:null,
    pointerType:pointerTypes.has(event?.pointerType)?event.pointerType:null,
    targetTag:targetTags.has(target?.tagName)?target.tagName:null,
    targetAction:targetActions.has(target?.dataset?.action)?target.dataset.action:null,
   };
   records.push(row);if(records.length>32)records.shift();return true;
  }catch{return false;}
 }
 return{record,snapshot:()=>records.map(row=>({...row}))};
}
