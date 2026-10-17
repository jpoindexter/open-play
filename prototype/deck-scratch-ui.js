// Delegated ordinary whole-deck platter gestures. No seek/load/source creation.
// The engine owns track/load generations, audio routing and release semantics.
import {deckScratchPolicy} from './deck-scratch-kernel.js';

let instances=0;
export const deckScratchUIPolicy=Object.freeze({
  centerDeadZoneRadius:.15,minimumVelocityIntervalSeconds:.001,
  keyboard:'Focused platter only: hold Left/Right for -1/+1 original seconds per second; Space/Enter hold still; Escape cancels. Keyup releases; focus/window loss cancels.',
  rpm:'Exact Virtual Deck Speed 33 RPM or 45 RPM setting, snapshotted per gesture; missing/invalid uses existing 45 RPM default.',
  motion:'No decorative animation. Pointer angle is unwrapped to the shortest signed arc between events; unobserved full turns cannot be reconstructed.',
  limits:'Independent browser gesture policy; no hardware, DVS, musical quality or Serato response claim.',
});
const selector='.platter[data-deck-scratch]';
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const modified=event=>event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.isComposing;
const finite=value=>typeof value==='number'&&Number.isFinite(value);

export function createDeckScratchControls({engine,state,root=globalThis.document,
  windowTarget=globalThis.window,now=()=>performance.now(),
  requestFrame=callback=>requestAnimationFrame(callback),cancelFrame=id=>cancelAnimationFrame(id),
  notify=()=>{}}={}) {
  if(!engine||!state||!root?.addEventListener||!windowTarget?.addEventListener)
    throw new TypeError('Scratch controls need engine, state and event targets.');
  const instance=++instances,active=new Map(),pointers=new Map(),listeners=[];
  let serial=0,frame=null,disposed=false;
  const consume=event=>{event.preventDefault();event.stopPropagation();};
  const closest=target=>target?.closest?.(selector)||null;
  const deckFor=element=>{
    const raw=element?.dataset?.deckScratch;
    if(typeof raw!=='string'||!/^\d+$/.test(raw))return null;
    const index=Number(raw),deck=state.decks?.[index];
    return deck&&deck.index===index&&deck.track?deck:null;
  };
  const current=g=>!disposed&&active.get(g.deck.index)===g&&state.decks[g.deck.index]===g.deck&&
    g.deck.track===g.track&&g.element.isConnected!==false;
  const position=(g,value)=>clamp(value,0,finite(g.track.duration)&&g.track.duration>0?g.track.duration:Infinity);
  function status(element,index,phase,text) {
    const busy=phase==='preparing'?'true':'false';
    if(element.getAttribute?.('aria-busy')!==busy)element.setAttribute('aria-busy',busy);
    if(element.dataset.scratchPhase!==phase)element.dataset.scratchPhase=phase;
    const output=root.querySelector?.(`[data-deck-scratch-status="${index}"]`);
    if(output&&output.textContent!==text)output.textContent=text;
  }
  function listen(target,type,handler,capture=false){target.addEventListener(type,handler,capture);listeners.push(()=>target.removeEventListener(type,handler,capture));}
  function end(g,cancel=false,message='Scratch released.') {
    if(active.get(g.deck.index)!==g)return Promise.resolve();
    // An ACK may still be in flight. Post the final coalesced ready-owner
    // position before End rather than dropping that last observed movement.
    // Cancel/pending preparation never waits or emits additional motion.
    if(!cancel&&g.ready&&g.desired&&g.sent<g.revision){
      g.sent=g.revision;
      try{Promise.resolve(engine.updateDeckScratch(g.deck,
        {position:g.desired.position,velocity:g.desired.velocity},g.owner)).catch(error=>{
          if(!active.has(g.deck.index)&&g.deck.track===g.track)notify(error.message);
        });}catch(error){notify(error.message);}
    }
    active.delete(g.deck.index);if(g.pointerId!==undefined)pointers.delete(g.pointerId);
    if(frame!==null&&![...active.values()].some(item=>item.mode==='keyboard')){cancelFrame(frame);frame=null;}
    status(g.element,g.deck.index,'idle',message);
    if(g.pointerId!==undefined){try{if(g.element.hasPointerCapture?.(g.pointerId))g.element.releasePointerCapture(g.pointerId);}catch{}}
    // Deliberately do NOT wait for async begin: this retires pending ownership
    // now, and the late begin completion is checked again below.
    try{return Promise.resolve(engine.endDeckScratch(g.deck,g.owner,{cancel})).catch(error=>{
      if(!active.has(g.deck.index)&&g.deck.track===g.track)notify(error.message);
    });}catch(error){if(!active.has(g.deck.index))notify(error.message);return Promise.resolve();}
  }
  function fail(g,error) {
    if(!current(g))return;
    const canceled=error?.name==='AbortError';
    void end(g,true,canceled?'Scratch canceled.':`Scratch unavailable: ${error?.message||error}`);
    if(!canceled)notify(error?.message||String(error));
  }
  async function pump(g) {
    if(g.pumping||!g.ready||!current(g))return;
    g.pumping=true;
    try{
      while(current(g)&&g.ready&&g.sent<g.revision){
        const desired=g.desired;g.sent=desired.revision;
        const result=await engine.updateDeckScratch(g.deck,{position:desired.position,velocity:desired.velocity},g.owner);
        if(result===false||result===null){if(current(g))void end(g,true,'Scratch canceled.');break;}
      }
    }catch(error){fail(g,error);}finally{g.pumping=false;}
  }
  function desired(g,next,velocity) {
    g.position=position(g,next);g.desired={position:g.position,
      velocity:clamp(velocity,-deckScratchPolicy.maxVelocity,deckScratchPolicy.maxVelocity),revision:++g.revision};
    void pump(g);
  }
  function start(element,deck,mode,extra={}) {
    if(disposed||active.has(deck.index))return null;
    const initial=engine.position(deck);
    if(!finite(initial))throw new TypeError('Scratch needs a finite original-track position.');
    const time=now();if(!finite(time))throw new TypeError('Scratch clock must be finite.');
    const g={element,deck,track:deck.track,mode,owner:`deck-scratch-ui:${instance}:${++serial}`,
      rpm:state.settings?.['Virtual Deck Speed']==='33 RPM'?33:45,
      position:Math.max(0,initial),time,revision:0,sent:-1,ready:false,pumping:false,...extra};
    active.set(deck.index,g);if(g.pointerId!==undefined)pointers.set(g.pointerId,g);
    status(element,deck.index,'preparing','Preparing whole-deck scratch…');
    desired(g,g.position,mode==='keyboard'?(g.key==='ArrowLeft'?-1:g.key==='ArrowRight'?1:0):0);
    let preparation;
    try{preparation=engine.beginDeckScratch(deck,g.owner);}catch(error){fail(g,error);return g;}
    Promise.resolve(preparation).then(result=>{
      if(!current(g)){
        // Idempotent retirement closes the seam even if preparation resolves
        // after release, replacement, detached markup or controller disposal.
        return Promise.resolve(engine.endDeckScratch(deck,g.owner,{cancel:true})).catch(()=>{});
      }
      if(result===false||result===null){void end(g,true,'Scratch canceled.');return;}
      g.ready=true;status(element,deck.index,'active',mode==='keyboard'?'Keyboard scratch active.':'Platter scratch active.');
      void pump(g);
    }).catch(error=>fail(g,error));
    return g;
  }
  function angle(element,x,y){
    if(!finite(x)||!finite(y))return null;
    const box=element.getBoundingClientRect();
    if(![box.left,box.top,box.width,box.height].every(finite))return null;
    const dx=x-box.left-box.width/2,dy=y-box.top-box.height/2;
    const radius=Math.min(box.width,box.height)/2;
    if(!finite(radius)||radius<=0||Math.hypot(dx,dy)<radius*deckScratchUIPolicy.centerDeadZoneRadius)return null;
    return Math.atan2(dy,dx);
  }
  function pointerMove(event,g) {
    if(!current(g)){void end(g,true,'Scratch canceled.');return;}
    const time=now();if(!finite(time)||time<g.time){void end(g,true,'Scratch canceled after clock interruption.');return;}
    const next=angle(g.element,event.clientX,event.clientY);
    if(next===null){g.angle=null;g.time=time;desired(g,g.position,0);return;}
    if(g.angle===null){g.angle=next;g.time=time;desired(g,g.position,0);return;}
    let delta=next-g.angle;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
    const seconds=delta/(2*Math.PI)*60/g.rpm,nextPosition=position(g,g.position+seconds);
    const interval=Math.max(deckScratchUIPolicy.minimumVelocityIntervalSeconds,(time-g.time)/1000);
    desired(g,nextPosition,(nextPosition-g.position)/interval);g.angle=next;g.time=time;
  }
  listen(root,'pointerdown',event=>{
    if(disposed||event.defaultPrevented||event.button!==0||modified(event)||!Number.isInteger(event.pointerId)||event.pointerId<0)return;
    const element=closest(event.target),deck=deckFor(element);if(!deck||active.has(deck.index))return;
    if(event.target?.closest?.('input,select,textarea,button,a,[contenteditable="true"]'))return;
    const first=angle(element,event.clientX,event.clientY);if(first===null)return;
    consume(event);
    try{element.setPointerCapture(event.pointerId);}catch{notify('Pointer capture is unavailable; scratch did not start.');return;}
    element.focus?.({preventScroll:true});
    try{start(element,deck,'pointer',{pointerId:event.pointerId,angle:first});}catch(error){try{element.releasePointerCapture(event.pointerId);}catch{}notify(error.message);}
  });
  listen(root,'pointermove',event=>{const g=pointers.get(event.pointerId);if(!g)return;consume(event);pointerMove(event,g);});
  listen(root,'pointerup',event=>{const g=pointers.get(event.pointerId);if(!g)return;consume(event);pointerMove(event,g);void end(g,false);});
  for(const type of ['pointercancel','lostpointercapture'])listen(root,type,event=>{const g=pointers.get(event.pointerId);if(g)void end(g,true,'Scratch canceled.');});
  function frameStep(){
    frame=null;const time=now();
    for(const g of [...active.values()])if(g.mode==='keyboard'){
      if(!current(g)||!finite(time)||time<g.time||time-g.time>deckScratchPolicy.watchdogMilliseconds){void end(g,true,'Scratch canceled after focus or timing interruption.');continue;}
      const velocity=g.key==='ArrowLeft'?-1:g.key==='ArrowRight'?1:0;
      const next=position(g,g.position+velocity*(time-g.time)/1000);
      desired(g,next,next===g.position?0:velocity);g.time=time;
    }
    scheduleFrame();
  }
  function scheduleFrame(){if(frame===null&&[...active.values()].some(g=>g.mode==='keyboard'))frame=requestFrame(frameStep);}
  listen(root,'keydown',event=>{
    if(disposed||event.defaultPrevented||modified(event))return;
    const element=closest(event.target);if(!element||element.isContentEditable||event.target!==element||root.activeElement!==element)return;
    const deck=deckFor(element);if(!deck)return;
    if(event.key==='Escape'){const g=active.get(deck.index);if(g){consume(event);void end(g,true,'Scratch canceled.');}return;}
    if(!['ArrowLeft','ArrowRight',' ','Enter'].includes(event.key))return;
    consume(event);if(event.repeat||active.has(deck.index))return;
    try{start(element,deck,'keyboard',{key:event.key});scheduleFrame();}catch(error){notify(error.message);}
  },true);
  listen(root,'keyup',event=>{
    const g=[...active.values()].find(item=>item.mode==='keyboard'&&item.key===event.key);
    if(g){consume(event);void end(g,false);}
  },true);
  listen(root,'focusout',event=>{for(const g of [...active.values()])if(g.mode==='keyboard'&&g.element===event.target)void end(g,true,'Scratch canceled after focus loss.');});
  const cancelAll=()=>Promise.all([...active.values()].map(g=>end(g,true,'Scratch canceled.')));
  listen(windowTarget,'blur',()=>{void cancelAll();});
  listen(root,'visibilitychange',()=>{if(root.visibilityState==='hidden')void cancelAll();});
  function tick(){for(const g of [...active.values()])if(!current(g))void end(g,true,'Scratch canceled after deck or view changed.');}
  function cancelDeck(deck){return Promise.all([...active.values()].filter(g=>g.deck===deck).map(g=>end(g,true,'Scratch canceled after deck changed.')));}
  function dispose(){if(disposed)return Promise.resolve();const pending=cancelAll();disposed=true;if(frame!==null)cancelFrame(frame);frame=null;for(const remove of listeners)remove();return pending;}
  return {tick,cancelDeck,dispose,diagnostics:()=>({disposed,active:[...active.values()].map(g=>({deck:g.deck.index,owner:g.owner,mode:g.mode,ready:g.ready,position:g.position,rpm:g.rpm,pendingUpdate:g.pumping}))})};
}
