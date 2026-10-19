// Real UI controller with controlled DOM, clock, frames and engine ACKs.
// Not browser capture/focus, actual AudioEngine integration or PCM evidence.
import assert from 'node:assert/strict';
import {createDeckScratchControls} from '../prototype/deck-scratch-ui.js';
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function fixture({onEvent}={}){
  const f={time:1000,calls:[],begins:[],updates:[],notes:[],frames:new Map(),frameId:0};
  function target(){
    const handlers=new Map();return{handlers,addEventListener(type,fn,capture=false){const list=handlers.get(type)||[];list.push({fn,capture});handlers.set(type,list);},
      removeEventListener(type,fn){handlers.set(type,(handlers.get(type)||[]).filter(item=>item.fn!==fn));},
      emit(type,details={}){const event={target:f.root.body,defaultPrevented:false,prevented:0,stopped:0,preventDefault(){this.defaultPrevented=true;this.prevented++;},stopPropagation(){this.stopped++;},...details};for(const item of [...(handlers.get(type)||[])].sort((a,b)=>Number(b.capture)-Number(a.capture)))item.fn(event);return event;}};
  }
  f.root=target();f.window=target();f.root.body={};f.root.activeElement=f.root.body;f.outputs=[{textContent:''},{textContent:''}];
  f.root.querySelector=selector=>f.outputs[Number(selector.match(/"(\d+)"/)?.[1])];
  f.elements=[0,1].map(index=>({dataset:{deckScratch:String(index)},tagName:'DIV',id:'platter-'+index,isConnected:true,captures:new Set(),attrs:{},
    closest(query){return query==='.platter[data-deck-scratch]'?this:null;},
    getBoundingClientRect(){return{left:0,top:0,width:200,height:200};},
    setAttribute(name,value){this.attrs[name]=value;},getAttribute(name){return this.attrs[name];},
    setPointerCapture(id){this.captures.add(id);},hasPointerCapture(id){return this.captures.has(id);},
    releasePointerCapture(id){this.captures.delete(id);f.root.emit('lostpointercapture',{target:this,pointerId:id});},
    focus(){const old=f.root.activeElement;f.root.activeElement=this;if(old!==this)f.root.emit('focusout',{target:old});}}));
  f.state={focus:1,settings:{'Virtual Deck Speed':'45 RPM'},decks:[0,1].map(index=>({index,track:{id:'track-'+index,duration:100},playing:false}))};
  f.engine={position:deck=>20+deck.index*10,
    beginDeckScratch(deck,owner){const gate=deferred();f.begins.push({deck,owner,gate});f.calls.push({kind:'begin',deck:deck.index,owner});return gate.promise;},
    updateDeckScratch(deck,value,owner){const entry={deck:deck.index,owner,...value};f.updates.push(entry);f.calls.push({kind:'update',...entry});return f.updateGate?.promise??Promise.resolve({accepted:true});},
    endDeckScratch(deck,owner,options){f.calls.push({kind:'end',deck:deck.index,owner,...options});return Promise.resolve({accepted:true});}};
  f.controls=createDeckScratchControls({engine:f.engine,state:f.state,root:f.root,windowTarget:f.window,now:()=>f.time,
    requestFrame:fn=>{const id=++f.frameId;f.frames.set(id,fn);return id;},cancelFrame:id=>f.frames.delete(id),notify:message=>f.notes.push(message),onEvent});
  f.point=angle=>({clientX:100+80*Math.cos(angle),clientY:100+80*Math.sin(angle)});
  f.down=(index=0,angle=0,extra={})=>f.root.emit('pointerdown',{target:f.elements[index],pointerId:index+1,button:0,...f.point(angle),...extra});
  f.move=(angle,extra={})=>f.root.emit('pointermove',{target:f.elements[0],pointerId:1,...f.point(angle),...extra});
  f.up=(angle=0)=>f.root.emit('pointerup',{target:f.elements[0],pointerId:1,...f.point(angle)});
  f.ready=async(index=0)=>{f.begins[index].gate.resolve({accepted:true});await flush();};
  f.key=(key,extra={})=>f.root.emit('keydown',{target:f.root.activeElement,key,repeat:false,...extra});
  f.advance=(ms=16)=>{f.time+=ms;const frames=[...f.frames.entries()];f.frames.clear();for(const [,fn]of frames)fn(f.time);};
  return f;
}

await test('Pointer uses exact 45/33 RPM original-time conversion and snapshots setting per owner',async()=>{
  for(const rpm of [45,33]){const f=fixture();f.state.settings['Virtual Deck Speed']=rpm+' RPM';f.down();await f.ready();f.state.settings['Virtual Deck Speed']='45 RPM';f.time+=100;f.move(Math.PI/2);await flush();near(f.updates.at(-1).position,20+15/rpm);near(f.updates.at(-1).velocity,150/rpm);assert.equal(f.state.focus,1);await f.controls.dispose();}
});
await test('Angle unwrap crosses ±π along shortest arc without a full-turn jump',async()=>{
  const f=fixture();f.down(0,170*Math.PI/180);await f.ready();f.time+=100;f.move(-170*Math.PI/180);await flush();near(f.updates.at(-1).position,20+(20/360)*60/45);await f.controls.dispose();
});
await test('Center down is ignored; entering/re-entering dead zone holds and reanchors without jump',async()=>{
  const f=fixture();const ignored=f.down(0,0,{clientX:100,clientY:100});assert.equal(f.begins.length,0);assert.equal(ignored.prevented,0);
  f.down();await f.ready();f.time+=100;f.move(0,{clientX:100,clientY:100});await flush();near(f.updates.at(-1).position,20);assert.equal(f.updates.at(-1).velocity,0);
  f.time+=100;f.move(Math.PI);await flush();near(f.updates.at(-1).position,20);f.time+=100;f.move(-Math.PI/2);await flush();near(f.updates.at(-1).position,20+1/3);await f.controls.dispose();
});
await test('Velocity is finite and bounded ±16; source endpoints do not accumulate hidden position',async()=>{
  const f=fixture();f.down();await f.ready();f.time+=1;f.move(Math.PI/2);await flush();assert.equal(f.updates.at(-1).velocity,16);f.time+=1;f.move(0);await flush();assert.equal(f.updates.at(-1).velocity,-16);
  const g=fixture();g.engine.position=()=>0;g.down();await g.ready();g.time+=1;g.move(-Math.PI/2);await flush();assert.equal(g.updates.at(-1).position,0);assert.equal(g.updates.at(-1).velocity,0);
  const h=fixture();h.engine.position=()=>100;h.down();await h.ready();h.time+=1;h.move(Math.PI/2);await flush();assert.equal(h.updates.at(-1).position,100);assert.equal(h.updates.at(-1).velocity,0);await f.controls.dispose();await g.controls.dispose();await h.controls.dispose();
});
await test('Pending preparation coalesces movement to latest observed original-time command',async()=>{
  const f=fixture();f.down();f.time+=100;f.move(Math.PI/4);f.time+=100;f.move(Math.PI/2);assert.equal(f.updates.length,0);assert.equal(f.elements[0].attrs['aria-busy'],'true');
  await f.ready();assert.equal(f.updates.length,1);near(f.updates[0].position,20+1/3);assert.equal(f.elements[0].attrs['aria-busy'],'false');assert.match(f.outputs[0].textContent,/active/);await f.controls.dispose();
});
await test('Release before readiness retires pending owner immediately; late begin emits no move',async()=>{
  const f=fixture();f.down();const owner=f.begins[0].owner;f.up();assert.equal(f.calls.filter(c=>c.kind==='end').length,1);assert.equal(f.calls.at(-1).owner,owner);assert.equal(f.controls.diagnostics().active.length,0);
  await f.ready();assert.equal(f.updates.length,0);assert.equal(f.calls.filter(c=>c.kind==='end').length,2);assert.equal(f.elements[0].attrs['aria-busy'],'false');assert.equal(f.elements[0].captures.size,0);
});
await test('Cancel before readiness and a newer same-pointer gesture keep unique isolated owners',async()=>{
  const f=fixture();f.down();f.root.emit('pointercancel',{pointerId:1});f.down();assert.notEqual(f.begins[0].owner,f.begins[1].owner);await f.ready(0);assert.equal(f.updates.length,0);await f.ready(1);assert.equal(f.updates.length,1);assert.equal(f.updates[0].owner,f.begins[1].owner);await f.controls.dispose();
});
await test('In-flight update coalescing flushes final movement before End and never replays after release',async()=>{
  const f=fixture();f.updateGate=deferred();f.down();await f.ready();assert.equal(f.updates.length,1);
  f.time+=20;f.move(Math.PI/4);f.time+=20;f.move(Math.PI/2);assert.equal(f.updates.length,1);f.up(Math.PI/2);
  assert.equal(f.updates.length,2);near(f.updates.at(-1).position,20+1/3);assert.equal(f.calls.at(-1).kind,'end');assert.equal(f.calls.at(-2).kind,'update');
  f.updateGate.resolve({accepted:true});await flush();assert.equal(f.updates.length,2);
});
await test('Different deck pointer owners coexist and canceling one cannot retire the other',async()=>{
  const f=fixture();f.down(0);f.down(1);assert.equal(f.controls.diagnostics().active.length,2);await f.ready(0);await f.ready(1);await f.controls.cancelDeck(f.state.decks[0]);assert.equal(f.controls.diagnostics().active.length,1);assert.equal(f.controls.diagnostics().active[0].deck,1);await f.controls.dispose();
});
await test('Modifiers, inputs, nonprimary button, center and unrelated keyboard controls are untouched',async()=>{
  const f=fixture();for(const extra of [{shiftKey:true},{ctrlKey:true},{altKey:true},{metaKey:true},{button:2}])assert.equal(f.down(0,0,extra).prevented,0);
  const child={closest:query=>query==='.platter[data-deck-scratch]'?f.elements[0]:child};assert.equal(f.down(0,0,{target:child}).prevented,0);assert.equal(f.begins.length,0);
  f.elements[0].focus();assert.equal(f.key('ArrowLeft',{shiftKey:true}).prevented,0);assert.equal(f.key('ArrowUp').prevented,0);f.root.activeElement=f.root.body;assert.equal(f.key('ArrowRight').prevented,0);await f.controls.dispose();
});
await test('Focused keyboard hold auditions original seconds, ignores repeats and releases on keyup',async()=>{
  const f=fixture();f.elements[0].focus();const event=f.key('ArrowRight');assert.equal(event.prevented,1);assert.equal(event.stopped,1);await f.ready();assert.equal(f.updates.at(-1).velocity,1);
  f.advance(16);await flush();near(f.updates.at(-1).position,20.016);f.key('ArrowRight',{repeat:true});assert.equal(f.begins.length,1);
  f.root.emit('keyup',{key:'ArrowRight'});assert.equal(f.calls.at(-1).kind,'end');assert.equal(f.calls.at(-1).cancel,false);assert.equal(f.frames.size,0);
});
await test('Space holds zero velocity, Escape cancels and keyboard focus loss cannot leave an owner',async()=>{
  const f=fixture();f.elements[0].focus();f.key(' ');await f.ready();f.advance();await flush();assert.equal(f.updates.at(-1).velocity,0);near(f.updates.at(-1).position,20);f.key('Escape');assert.equal(f.calls.at(-1).cancel,true);
  f.key('ArrowLeft');f.root.emit('focusout',{target:f.elements[0]});assert.equal(f.controls.diagnostics().active.length,0);assert.equal(f.calls.at(-1).cancel,true);await f.ready(1);assert.equal(f.updates.length,2);
});
await test('Window blur, hidden document and detached markup cancel pending owners without focus theft',async()=>{
  for(const mode of ['blur','hidden','detached','track','lostcapture']){const f=fixture();f.down();if(mode==='blur')f.window.emit('blur');if(mode==='hidden'){f.root.visibilityState='hidden';f.root.emit('visibilitychange');}if(mode==='detached'){f.elements[0].isConnected=false;f.controls.tick();}if(mode==='track'){f.state.decks[0].track={id:'new',duration:20};f.controls.tick();}if(mode==='lostcapture')f.root.emit('lostpointercapture',{pointerId:1});assert.equal(f.controls.diagnostics().active.length,0);assert.equal(f.calls.at(-1).cancel,true);f.root.activeElement=f.root.body;await f.ready();assert.equal(f.updates.length,0);assert.equal(f.root.activeElement,f.root.body);}
});
await test('Clock interruption cancels keyboard owner; begin rejection clears busy/capture and exposes failure',async()=>{
  for(const delta of [121,-1]){const f=fixture();f.elements[0].focus();f.key('ArrowLeft');await f.ready();f.advance(delta);assert.equal(f.controls.diagnostics().active.length,0);assert.equal(f.calls.at(-1).cancel,true);}
  const g=fixture();g.down();g.begins[0].gate.reject(new Error('Preparation failed'));await flush();assert.equal(g.controls.diagnostics().active.length,0);assert.equal(g.elements[0].attrs['aria-busy'],'false');assert.match(g.outputs[0].textContent,/Preparation failed/);assert.equal(g.notes.filter(n=>n==='Preparation failed').length,1);assert.equal(g.elements[0].captures.size,0);
});
await test('Dispose removes delegated handlers/frames and cancels before late preparation resolves',async()=>{
  const f=fixture();f.elements[0].focus();f.key('ArrowRight');await f.controls.dispose();assert.equal(f.frames.size,0);assert.equal(f.controls.diagnostics().disposed,true);assert.equal([...f.root.handlers.values()].flat().length,0);assert.equal([...f.window.handlers.values()].flat().length,0);await f.ready();assert.equal(f.updates.length,0);assert.equal(f.calls.filter(c=>c.kind==='end').length,2);
});
await test('Engine refusal never marks scratch active or emits buffered motion',async()=>{
  const f=fixture();f.down();f.time+=20;f.move(Math.PI/2);f.begins[0].gate.resolve(false);await flush();assert.equal(f.updates.length,0);assert.equal(f.controls.diagnostics().active.length,0);assert.equal(f.elements[0].attrs['aria-busy'],'false');assert.match(f.outputs[0].textContent,/canceled/);
});
await test('Engine movement failure retires only the current gesture and exposes its real error',async()=>{
  const f=fixture();f.updateGate=deferred();f.down();await f.ready();f.updateGate.reject(new Error('Transport command failed'));await flush();assert.equal(f.controls.diagnostics().active.length,0);assert.equal(f.calls.at(-1).kind,'end');assert.match(f.outputs[0].textContent,/Transport command failed/);assert.equal(f.notes.filter(n=>n==='Transport command failed').length,1);
});
await test('Left keyboard audition traverses backwards and invalid geometry/capture cannot begin',async()=>{
  const f=fixture();f.elements[0].focus();f.key('ArrowLeft');await f.ready();f.advance(16);await flush();near(f.updates.at(-1).position,19.984);assert.equal(f.updates.at(-1).velocity,-1);await f.controls.dispose();
  const g=fixture();g.elements[0].getBoundingClientRect=()=>({left:NaN,top:0,width:200,height:200});assert.equal(g.down().prevented,0);assert.equal(g.begins.length,0);
  const h=fixture();h.elements[0].setPointerCapture=()=>{throw new Error('denied');};h.down();assert.equal(h.begins.length,0);assert.match(h.notes[0],/capture is unavailable/);await g.controls.dispose();await h.controls.dispose();
});
await test('Enter is the stationary-hold button-key alias and releases only its own owner',async()=>{
  const f=fixture();f.elements[0].focus();const event=f.key('Enter');assert.equal(event.prevented,1);await f.ready();assert.equal(f.updates.at(-1).velocity,0);near(f.updates.at(-1).position,20);f.root.emit('keyup',{key:'Enter'});assert.equal(f.calls.at(-1).kind,'end');assert.equal(f.calls.at(-1).cancel,false);assert.equal(f.controls.diagnostics().active.length,0);await f.controls.dispose();
});
await test('Optional observer reports actual pointer receipt, capture, movement and engine ACK scalars',async()=>{
  const events=[],f=fixture({onEvent:event=>events.push(event)});f.down(0,0,{buttons:1,isTrusted:true,pointerType:'mouse',timeStamp:12});
  f.begins[0].gate.resolve({owner:f.begins[0].owner,generation:17});await flush();f.time+=100;f.move(Math.PI/2);await flush();f.up(Math.PI/2);await flush();
  for(const type of ['pointerdown.received','capture.acquired','pointerdown.accepted','owner.phase','engine.begin.result','pointermove.received','pointermove.applied','pointerup.received','capture.lost','capture.released','engine.end.result'])assert(events.some(e=>e.type===type),type+' missing');
  assert.equal(events.find(e=>e.type==='engine.begin.result').generation,17);const receipt=events.find(e=>e.type==='pointerdown.received');assert.equal(receipt.targetId,'platter-0');assert.equal(receipt.targetTag,'DIV');assert.equal(receipt.clientX,180);assert.equal(receipt.isTrusted,true);assert.equal(receipt.eventTimeMs,12);
  assert(events.every((e,i)=>e.sequence===i+1&&Object.isFrozen(e)));await f.controls.dispose();
});
await test('Observer early refusal reasons distinguish modifiers, missing owner/deck, center and interactive children',async()=>{
  const events=[],f=fixture({onEvent:event=>events.push(event)});f.down(0,0,{shiftKey:true});f.down(0,0,{defaultPrevented:true});f.down(0,0,{button:2});f.down(0,0,{pointerId:-1});f.down(0,0,{target:f.root.body});f.down(0,0,{clientX:100,clientY:100});
  const child={closest:query=>query==='.platter[data-deck-scratch]'?f.elements[0]:child};f.down(0,0,{target:child});f.state.decks[0].track=null;f.down();
  const reasons=events.filter(e=>e.type==='pointerdown.refused').map(e=>e.reason);
  for(const reason of ['modifier-or-composition','already-prevented','nonprimary-button','invalid-pointer-id','not-platter','center-or-invalid-geometry','interactive-child','missing-deck-or-track'])assert(reasons.includes(reason),reason+' missing');
  assert.equal(f.begins.length,0);await f.controls.dispose();
});
await test('Observer payload is detached bounded JSON scalar metadata with no track/input/PCM/result objects',async()=>{
  const events=[],f=fixture({onEvent:event=>events.push(event)});f.state.decks[0].track.title='PRIVATE_TRACK_DO_NOT_REPORT';f.elements[0].id='z'.repeat(5000);f.down(0,0,{secret:'PRIVATE_EVENT',channels:[new Float32Array(4)]});
  f.begins[0].gate.resolve({generation:3,source:'PRIVATE_RESULT',buffer:new Float32Array(8),track:f.state.decks[0].track});await flush();f.move(0,{clientX:NaN});f.up();await flush();
  for(const event of events)for(const value of Object.values(event))assert(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&value.length<=120);
  assert(events.some(e=>e.clientX===null));const json=JSON.stringify(events);assert(!json.includes('PRIVATE_'));assert(!json.includes('Float32Array'));await f.controls.dispose();
});
await test('Throwing/rejecting observers cannot veto motion, pending cancellation or cleanup',async()=>{
  const failures=[];const listener=error=>failures.push(error);process.on('unhandledRejection',listener);
  try{for(const onEvent of [()=>{throw new Error('observer failure');},()=>Promise.reject(new Error('async observer failure'))]){
    const f=fixture({onEvent});f.down();await f.ready();f.time+=100;f.move(Math.PI/2);await flush();near(f.updates.at(-1).position,20+1/3);f.up(Math.PI/2);await flush();assert.equal(f.controls.diagnostics().active.length,0);assert.equal(f.elements[0].captures.size,0);await f.controls.dispose();assert.equal([...f.root.handlers.values()].flat().length,0);
    const pending=fixture({onEvent});pending.down();await pending.controls.dispose();await pending.ready();assert.equal(pending.updates.length,0);
  }await new Promise(resolve=>setImmediate(resolve));assert.equal(failures.length,0);}finally{process.removeListener('unhandledRejection',listener);}
});
function waveform(f,index,axis='x',span=4){
  const element=f.elements[index];element.dataset.waveformScrub=axis;element.dataset.waveformSpan=String(span);
  element.closest=query=>query==='[data-waveform-scrub][data-deck-scratch]'?element:null;
  return element;
}
await test('Waveform drag follows horizontal/vertical source-time geometry on its own deck and releases final position',async()=>{
  for(const [index,axis]of [[0,'x'],[1,'y']]){
    const f=fixture(),element=waveform(f,index,axis);f.state.decks[index].rate=1.25;
    f.down(index,0,{clientX:100,clientY:100});await f.ready();
    f.time+=100;f.root.emit('pointermove',{target:element,pointerId:index+1,clientX:axis==='x'?60:100,clientY:axis==='y'?60:100});await flush();
    near(f.updates.at(-1).position,20+index*10+1);near(f.updates.at(-1).velocity,10);assert.equal(f.updates.at(-1).deck,index);
    f.time+=100;f.root.emit('pointerup',{target:element,pointerId:index+1,clientX:axis==='x'?140:100,clientY:axis==='y'?140:100});await flush();
    near(f.updates.at(-1).position,20+index*10-1);assert.equal(f.calls.at(-1).kind,'end');assert.equal(f.calls.at(-1).cancel,false);
    assert.equal(f.controls.diagnostics().active.length,0);assert.equal(element.captures.size,0);await f.controls.dispose();
  }
});
await test('Shift waveform drag snapshots fine sensitivity, zoom and pitch; Escape cancels with Shift still held',async()=>{
  const f=fixture(),element=waveform(f,0,'x',8);f.state.decks[0].rate=.5;
  f.down(0,0,{clientX:100,clientY:100,shiftKey:true});await f.ready();
  element.dataset.waveformSpan='1';f.state.decks[0].rate=2;
  f.time+=100;f.move(0,{clientX:50,clientY:100,shiftKey:false});await flush();near(f.updates.at(-1).position,20.1);
  f.key('Escape',{shiftKey:true});assert.equal(f.calls.at(-1).cancel,true);assert.equal(element.captures.size,0);assert.equal(f.controls.diagnostics().active.length,0);await f.controls.dispose();
});
await test('Short waveform drag commits its final requested position after preparation, then releases',async()=>{
  const f=fixture(),element=waveform(f,0);f.down(0,0,{clientX:100,clientY:100});f.time+=50;f.move(0,{clientX:50});
  f.root.emit('pointerup',{target:element,pointerId:1,clientX:50,clientY:100});assert.equal(element.captures.size,0);assert.equal(f.updates.length,0);assert.equal(element.attrs['aria-busy'],'true');
  await f.ready();assert.equal(f.updates.length,1);near(f.updates[0].position,21);assert.equal(f.calls.at(-1).kind,'end');assert.equal(f.calls.at(-1).cancel,false);assert.equal(f.controls.diagnostics().active.length,0);await f.controls.dispose();
});
await test('Canceled or superseded pending waveform release cannot replay; invalid geometry/modifiers cannot start',async()=>{
  for(const cancel of ['escape','replacement']){
    const f=fixture(),element=waveform(f,0);f.down(0,0,{clientX:100,clientY:100});f.time+=50;
    f.root.emit('pointerup',{target:element,pointerId:1,clientX:50,clientY:100});
    if(cancel==='escape')f.key('Escape');else f.down(0,0,{clientX:100,clientY:100});
    await f.ready(0);assert.equal(f.updates.length,0);
    if(cancel==='replacement'){await f.ready(1);assert.equal(f.updates.length,1);near(f.updates[0].position,20);}
    await f.controls.dispose();
  }
  const f=fixture(),element=waveform(f,0);
  for(const extra of [{ctrlKey:true},{altKey:true},{metaKey:true},{isComposing:true}])assert.equal(f.down(0,0,extra).prevented,0);
  element.dataset.waveformSpan='NaN';assert.equal(f.down().prevented,0);assert.equal(f.begins.length,0);await f.controls.dispose();
});
console.log(`${passed}/${passed} controlled platter/waveform UI checks passed; actual browser/AudioEngine/PCM acceptance remains separate.`);
