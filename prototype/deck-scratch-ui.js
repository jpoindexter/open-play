// Delegated whole-deck platter and detailed-waveform gestures. No seek/load/source creation.
// The engine owns track/load generations, audio routing and release semantics.
import {deckScratchPolicy} from './deck-scratch-kernel.js';

let instances=0;
export const deckScratchUIPolicy=Object.freeze({
  centerDeadZoneRadius:.15,minimumVelocityIntervalSeconds:.001,
  keyboard:'Focused platter only: hold Left/Right for -1/+1 original seconds per second; Space/Enter hold still; Escape cancels. Keyup releases; focus/window loss cancels.',
  rpm:'Exact Virtual Deck Speed 33 RPM or 45 RPM setting, snapshotted per gesture; missing/invalid uses existing 45 RPM default.',
  motion:'No decorative animation. Pointer angle is unwrapped to the shortest signed arc between events; unobserved full turns cannot be reconstructed.',
  waveform:'Drag horizontally/vertically with the displayed pitch-scaled source-time span. Left/up advances, right/down rewinds; Shift at pointerdown snapshots ten-times-finer movement. The existing whole-deck transport owns audition and release.',
  limits:'Independent browser gesture policy; no hardware, DVS, musical quality or Serato response claim.',
});
const selector='.platter[data-deck-scratch]';
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const modified=event=>event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.isComposing;
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const noObservation=()=>{};

export function createDeckScratchControls({engine,state,root=globalThis.document,
  windowTarget=globalThis.window,now=()=>performance.now(),
  requestFrame=callback=>requestAnimationFrame(callback),cancelFrame=id=>cancelAnimationFrame(id),
  notify=()=>{},onEvent=noObservation}={}) {
  if(!engine||!state||!root?.addEventListener||!windowTarget?.addEventListener)
    throw new TypeError('Scratch controls need engine, state and event targets.');
  const instance=++instances,active=new Map(),pointers=new Map(),listeners=[];
  let serial=0,frame=null,disposed=false,observationSequence=0;
  function observe(type,fields={},event=null,g=null) {
    if(onEvent===noObservation||typeof onEvent!=='function')return;
    try{
      const source={sequence:++observationSequence,type,
        ...(g?{deck:g.deck.index,owner:g.owner,mode:g.mode,phase:g.element.dataset.scratchPhase,
          ready:g.ready,position:g.position,rpm:g.rpm,revision:g.revision}:{}),
        ...(event?{pointerId:event.pointerId,button:event.button,buttons:event.buttons,
          clientX:event.clientX,clientY:event.clientY,defaultPrevented:!!event.defaultPrevented,
          isTrusted:event.isTrusted,pointerType:event.pointerType,targetTag:event.target?.tagName,
          targetId:event.target?.id,eventTimeMs:event.timeStamp,altKey:!!event.altKey,
          ctrlKey:!!event.ctrlKey,metaKey:!!event.metaKey,shiftKey:!!event.shiftKey}:{}),...fields};
      const record={};
      for(const [key,value]of Object.entries(source)){
        if(typeof value==='string')record[key]=value.slice(0,120);
        else if(typeof value==='boolean'||value===null)record[key]=value;
        else if(typeof value==='number')record[key]=finite(value)?value:null;
      }
      const returned=onEvent(Object.freeze(record));
      if(returned&&typeof returned.then==='function')Promise.resolve(returned).catch(()=>{});
    }catch{} // Observers cannot veto input or break teardown, including async rejection.
  }
  function resultFields(result){
    if(onEvent===noObservation||typeof onEvent!=='function')return{};
    const own=key=>{try{return result&&typeof result==='object'?Object.getOwnPropertyDescriptor(result,key)?.value:undefined;}catch{return undefined;}};
    const generation=own('generation'),resultPosition=own('position'),resultPlaying=own('playing');
    return{accepted:result!==false&&result!==null,resultKind:result===null?'null':typeof result,
      generation:finite(generation)?generation:undefined,resultPosition:finite(resultPosition)?resultPosition:undefined,
      resultPlaying:typeof resultPlaying==='boolean'?resultPlaying:undefined};
  }
  const consume=event=>{event.preventDefault();event.stopPropagation();};
  const closest=target=>target?.closest?.(selector)||target?.closest?.('[data-waveform-scrub][data-deck-scratch]')||null;
  const deckFor=element=>{
    const raw=element?.dataset?.deckScratch;
    if(typeof raw!=='string'||!/^\d+$/.test(raw))return null;
    const index=Number(raw),deck=state.decks?.[index];
    return deck&&deck.index===index&&deck.track?deck:null;
  };
  const current=g=>!disposed&&active.get(g.deck.index)===g&&state.decks[g.deck.index]===g.deck&&
    g.deck.track===g.track&&g.element.isConnected!==false;
  const position=(g,value)=>clamp(value,0,finite(g.track.duration)&&g.track.duration>0?g.track.duration:Infinity);
  function status(element,index,phase,text,g=active.get(index)) {
    const busy=phase==='preparing'?'true':'false';
    if(element.getAttribute?.('aria-busy')!==busy)element.setAttribute('aria-busy',busy);
    if(element.dataset.scratchPhase!==phase)element.dataset.scratchPhase=phase;
    const output=root.querySelector?.(element.dataset.waveformScrub!==undefined?`[data-waveform-scrub-status="${index}"]`:`[data-deck-scratch-status="${index}"]`);
    if(output&&output.textContent!==text)output.textContent=text;
    observe('owner.phase',{deck:index,phase},null,g);
  }
  function listen(target,type,handler,capture=false){target.addEventListener(type,handler,capture);listeners.push(()=>target.removeEventListener(type,handler,capture));}
  function releasePointer(g){
    if(g.pointerId===undefined)return;
    pointers.delete(g.pointerId);
    try{if(g.element.hasPointerCapture?.(g.pointerId)){g.element.releasePointerCapture(g.pointerId);observe('capture.released',{pointerId:g.pointerId},null,g);}}catch{observe('capture.release-failed',{pointerId:g.pointerId},null,g);}
  }
  function end(g,cancel=false,message='Scratch released.') {
    if(active.get(g.deck.index)!==g)return Promise.resolve();
    // An ACK may still be in flight. Post the final coalesced ready-owner
    // position before End rather than dropping that last observed movement.
    // Cancel/pending preparation never waits or emits additional motion.
    if(!cancel&&g.ready&&g.desired&&g.sent<g.revision){
      g.sent=g.revision;
      observe('engine.update.sent',{reason:'final-release',position:g.desired.position,velocity:g.desired.velocity},null,g);
      try{Promise.resolve(engine.updateDeckScratch(g.deck,
        {position:g.desired.position,velocity:g.desired.velocity},g.owner)).then(result=>{
          observe('engine.update.result',resultFields(result),null,g);
        }).catch(error=>{
          observe('engine.update.error',{errorName:error?.name},null,g);
          if(!active.has(g.deck.index)&&g.deck.track===g.track)notify(error.message);
        });}catch(error){observe('engine.update.error',{errorName:error?.name},null,g);notify(error.message);}
    }
    active.delete(g.deck.index);releasePointer(g);
    if(frame!==null&&![...active.values()].some(item=>item.mode==='keyboard')){cancelFrame(frame);frame=null;}
    status(g.element,g.deck.index,'idle',message,g);
    // Deliberately do NOT wait for async begin: this retires pending ownership
    // now, and the late begin completion is checked again below.
    observe('engine.end.sent',{cancel},null,g);
    try{return Promise.resolve(engine.endDeckScratch(g.deck,g.owner,{cancel})).then(result=>{
      observe('engine.end.result',resultFields(result),null,g);return result;
    }).catch(error=>{
      observe('engine.end.error',{errorName:error?.name},null,g);
      if(!active.has(g.deck.index)&&g.deck.track===g.track)notify(error.message);
    });}catch(error){observe('engine.end.error',{errorName:error?.name},null,g);if(!active.has(g.deck.index))notify(error.message);return Promise.resolve();}
  }
  function fail(g,error) {
    observe('owner.error',{errorName:error?.name,current:current(g)},null,g);
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
        observe('engine.update.sent',{position:desired.position,velocity:desired.velocity},null,g);
        const result=await engine.updateDeckScratch(g.deck,{position:desired.position,velocity:desired.velocity},g.owner);
        observe('engine.update.result',resultFields(result),null,g);
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
    observe('engine.begin.sent',{},null,g);
    try{preparation=engine.beginDeckScratch(deck,g.owner);}catch(error){fail(g,error);return g;}
    Promise.resolve(preparation).then(async result=>{
      observe('engine.begin.result',{...resultFields(result),current:current(g)},null,g);
      if(!current(g)){
        // Idempotent retirement closes the seam even if preparation resolves
        // after release, replacement, detached markup or controller disposal.
        observe('engine.end.sent',{cancel:true,reason:'late-begin-retirement'},null,g);
        return Promise.resolve(engine.endDeckScratch(deck,g.owner,{cancel:true})).then(result=>{
          observe('engine.end.result',resultFields(result),null,g);
        }).catch(error=>observe('engine.end.error',{errorName:error?.name},null,g));
      }
      if(result===false||result===null){void end(g,true,'Scratch canceled.');return;}
      g.ready=true;status(element,deck.index,'active',mode==='waveform'?'Waveform scrub active.':mode==='keyboard'?'Keyboard scratch active.':'Platter scratch active.');
      await pump(g);
      if(g.releaseWhenReady&&current(g))await end(g,false,'Waveform scrub released.');
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
    if(!current(g)){observe('pointermove.ignored',{reason:'stale-owner'},event,g);void end(g,true,'Scratch canceled.');return;}
    const time=now();if(!finite(time)||time<g.time){observe('pointermove.ignored',{reason:'clock-interruption'},event,g);void end(g,true,'Scratch canceled after clock interruption.');return;}
    if(g.mode==='waveform'){
      const coordinate=g.axis==='x'?event.clientX:event.clientY;
      if(!finite(coordinate)){void end(g,true,'Waveform scrub canceled.');return;}
      const nextPosition=position(g,g.anchorPosition-(coordinate-g.anchorCoordinate)*g.secondsPerPixel);
      const interval=Math.max(deckScratchUIPolicy.minimumVelocityIntervalSeconds,(time-g.time)/1000);
      desired(g,nextPosition,(nextPosition-g.position)/interval);g.time=time;
      observe('pointermove.applied',{velocity:g.desired.velocity},event,g);return;
    }
    const next=angle(g.element,event.clientX,event.clientY);
    if(next===null){g.angle=null;g.time=time;desired(g,g.position,0);observe('pointermove.held',{reason:'center-or-invalid-geometry'},event,g);return;}
    if(g.angle===null){g.angle=next;g.time=time;desired(g,g.position,0);observe('pointermove.held',{reason:'reanchored'},event,g);return;}
    let delta=next-g.angle;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
    const seconds=delta/(2*Math.PI)*60/g.rpm,nextPosition=position(g,g.position+seconds);
    const interval=Math.max(deckScratchUIPolicy.minimumVelocityIntervalSeconds,(time-g.time)/1000);
    desired(g,nextPosition,(nextPosition-g.position)/interval);g.angle=next;g.time=time;
    observe('pointermove.applied',{deltaRadians:delta,velocity:g.desired.velocity},event,g);
  }
  listen(root,'pointerdown',event=>{
    observe('pointerdown.received',{},event);
    const refused=reason=>observe('pointerdown.refused',{reason},event);
    if(disposed)return refused('disposed');if(event.defaultPrevented)return refused('already-prevented');
    if(event.button!==0)return refused('nonprimary-button');
    if(!Number.isInteger(event.pointerId)||event.pointerId<0)return refused('invalid-pointer-id');
    const element=closest(event.target);if(!element){if(modified(event))return refused('modifier-or-composition');return refused('not-platter');}
    const waveform=element.dataset.waveformScrub!==undefined;
    if(modified(event)&&!(waveform&&event.shiftKey&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.isComposing))return refused('modifier-or-composition');
    const deck=deckFor(element);if(!deck)return refused('missing-deck-or-track');
    const previous=active.get(deck.index);
    if(previous?.releaseWhenReady)void end(previous,true,'Waveform scrub superseded.');
    if(active.has(deck.index))return observe('pointerdown.refused',{reason:'deck-owned'},event,active.get(deck.index));
    if(event.target?.closest?.('input,select,textarea,button,a,[contenteditable="true"]'))return refused('interactive-child');
    let first=null,geometry=null;
    if(waveform){
      const box=element.getBoundingClientRect(),axis=element.dataset.waveformScrub;
      const pixels=axis==='x'?box.width:axis==='y'?box.height:NaN;
      const span=Number(element.dataset.waveformSpan),coordinate=axis==='x'?event.clientX:event.clientY;
      if(!finite(pixels)||pixels<=0||!finite(span)||span<1||span>16||!finite(coordinate))return refused('invalid-waveform-geometry');
      const rate=finite(deck.rate)?clamp(deck.rate,.25,4):1;
      geometry={axis,anchorCoordinate:coordinate,anchorPosition:engine.position(deck),secondsPerPixel:span*rate/pixels*(event.shiftKey ? .1 : 1)};
    }else{first=angle(element,event.clientX,event.clientY);if(first===null)return refused('center-or-invalid-geometry');}
    consume(event);
    try{element.setPointerCapture(event.pointerId);observe('capture.acquired',{deck:deck.index},event);}catch{observe('capture.failed',{deck:deck.index},event);notify('Pointer capture is unavailable; scratch did not start.');return;}
    element.focus?.({preventScroll:true});
    try{const g=start(element,deck,waveform?'waveform':'pointer',{pointerId:event.pointerId,angle:first,...geometry});observe('pointerdown.accepted',{accepted:!!g&&current(g)},event,g);}catch(error){observe('pointerdown.refused',{reason:'start-error',errorName:error?.name},event);try{element.releasePointerCapture(event.pointerId);}catch{}notify(error.message);}
  });
  listen(root,'pointermove',event=>{const g=pointers.get(event.pointerId);observe('pointermove.received',{},event,g);if(!g){observe('pointermove.ignored',{reason:'no-pointer-owner'},event);return;}consume(event);pointerMove(event,g);});
  listen(root,'pointerup',event=>{
    const g=pointers.get(event.pointerId);observe('pointerup.received',{},event,g);
    if(!g){observe('pointerup.ignored',{reason:'no-pointer-owner'},event);return;}
    consume(event);pointerMove(event,g);
    // A short linear drag is still an explicit positioning request. Retain only
    // its final movement until preparation acknowledges, then release through
    // the same transport. New gestures, source/view changes and cancellation
    // retire this owner normally; late preparation cannot revive a stale one.
    if(current(g)&&g.mode==='waveform'&&!g.ready&&g.position!==g.anchorPosition){
      g.releaseWhenReady=true;releasePointer(g);
      status(g.element,g.deck.index,'preparing','Finishing waveform scrub…',g);return;
    }
    void end(g,false);
  });
  listen(root,'gotpointercapture',event=>observe('capture.gained',{},event,pointers.get(event.pointerId)));
  for(const type of ['pointercancel','lostpointercapture'])listen(root,type,event=>{const g=pointers.get(event.pointerId);observe(type==='pointercancel'?'pointercancel.received':'capture.lost',{},event,g);if(g)void end(g,true,'Scratch canceled.');});
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
    if(disposed||event.defaultPrevented||(modified(event)&&!(event.key==='Escape'&&event.target?.dataset?.waveformScrub!==undefined)))return;
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
