// Preview-only affordances on original ranges; their app/audio handlers own values.
const selector='.fader-group input, .tempo-control input, #crossfader';
const bound=new WeakSet(),shown=new WeakMap(),titles=new WeakMap();
const active=()=>document.body.dataset.workspace==='traktor-flat';
const kindOf=input=>input.id==='crossfader'?'cross':input.dataset.tempo!==undefined?'tempo':'level';
export function snapFaderValue(value,{min,max,kind},bypass=false){
  const bounded=Math.max(min,Math.min(max,value));
  const points=kind==='level'?[min,max]:[0];
  return bypass?bounded:points.find(point=>Math.abs(bounded-point)<=(max-min)*.015)??bounded;
}
function emit(input,type){input.dispatchEvent(new Event(type,{bubbles:true}));}
function show(input){
  const value=Number(input.value),min=Number(input.min),max=Number(input.max),kind=kindOf(input);
  const signature=`${value}/${min}/${max}/${active()}`;
  if(shown.get(input)===signature)return;shown.set(input,signature);
  const ratio=(value-min)/(max-min),parent=input.parentElement;
  parent.style.setProperty('--preview-level',value);
  parent.dataset.faderDetent=String(kind==='level'?value===min||value===max:value===0);
  if(kind==='level')input.setAttribute('aria-valuetext',value===0?'Muted':`${Math.round(ratio*100)}%${value===max?' · unity':''}`);
  if(kind==='cross')input.setAttribute('aria-valuetext',value===0?'Center':`${Math.round(Math.abs(value)*100)}% toward ${value<0?'A':'B'}`);
}
function bind(input){
  if(bound.has(input))return;bound.add(input);titles.set(input,input.title);
  const kind=kindOf(input),parent=input.parentElement;
  const ticks=document.createElement('span');ticks.className='preview-fader-ticks';ticks.setAttribute('aria-hidden','true');
  for(let i=0;i<=8;i++){const mark=document.createElement('i');mark.style.setProperty('--tick',i/8);if(i%4===0)mark.className='major';ticks.append(mark);}
  parent.append(ticks);parent.dataset.faderKind=kind;
  let pointer;
  const apply=(value,bypass)=>{input.value=String(snapFaderValue(value,{min:Number(input.min),max:Number(input.max),kind},bypass));emit(input,'input');show(input);};
  const position=event=>{
    const rect=input.getBoundingClientRect(),horizontal=kind==='cross',inset=horizontal?12:8;
    let ratio=horizontal?(event.clientX-rect.left-inset)/(rect.width-2*inset):(event.clientY-rect.top-inset)/(rect.height-2*inset);
    if(kind==='level')ratio=1-ratio;
    return Number(input.min)+ratio*(Number(input.max)-Number(input.min));
  };
  input.addEventListener('pointerdown',event=>{
    if(!active()||input.disabled||event.button!==0||event.ctrlKey||event.metaKey||event.altKey)return;
    event.preventDefault();input.focus();pointer=event.pointerId;input.setPointerCapture(pointer);apply(position(event),event.shiftKey);
  });
  input.addEventListener('pointermove',event=>{if(pointer===event.pointerId)apply(position(event),event.shiftKey);});
  const release=()=>{if(pointer===undefined)return;const id=pointer;pointer=undefined;if(input.hasPointerCapture(id))input.releasePointerCapture(id);emit(input,'change');};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])input.addEventListener(type,release);
  input.addEventListener('input',()=>show(input));
}
export function refineFaders(){
  for(const input of document.querySelectorAll(selector)){
    bind(input);
    input.title=titles.get(input)+(active()?` · ${kindOf(input)==='level'?'Endpoint snaps: mute / unity':'Center snap'} · Shift-drag: bypass snaps · Arrow keys: fine adjustment`:'');
    show(input);
  }
}
export function syncFaders(){if(active())for(const input of document.querySelectorAll(selector))show(input);}
