// Presentation adapter: preserve each original range and its delegated handlers.
// Native range semantics/keyboard support stay available to assistive technology.
const bound=new WeakSet(),shown=new WeakMap(),titles=new WeakMap();
const active=()=>document.body.dataset.workspace==='rekordbox';
function emit(input,type){input.dispatchEvent(new Event(type,{bubbles:true}));}
function show(input){
  const value=Number(input.value),min=Number(input.min),max=Number(input.max);
  const signature=`${value}/${min}/${max}`;
  if(shown.get(input)===signature)return;shown.set(input,signature);
  const ratio=min<0&&max>0?.5+.5*value/(value<0?-min:max):(value-min)/(max-min);
  input.parentElement.style.setProperty('--rotary-angle',`${-135+270*ratio}deg`);
  let text=input.dataset.fxDepth!==undefined?`${value.toFixed(0)}%`:`${value.toFixed(1)} dB`;
  const output=input.parentElement.querySelector('.rb-rotary-value');if(output)output.textContent=text;
  if(input.dataset.mix?.endsWith(':trim'))text=value===0?'Muted':`${(20*Math.log10(value)).toFixed(1)} dB`;
  if(input.dataset.mix?.endsWith(':filter'))text=value===0?'Filter centered':`${Math.abs(value*100).toFixed(0)}% ${value<0?'low-pass':'high-pass'}`;
  input.setAttribute('aria-valuetext',text);
}
function bind(input){
  if(!input||bound.has(input))return;bound.add(input);input.dataset.previewRotary='true';
  let drag;
  const apply=value=>{input.value=String(Math.max(Number(input.min),Math.min(Number(input.max),value)));emit(input,'input');show(input);};
  input.addEventListener('pointerdown',event=>{
    if(!active()||input.disabled||event.button!==0||event.ctrlKey||event.metaKey||event.altKey)return;
    event.preventDefault();input.focus();drag={id:event.pointerId,y:event.clientY,value:Number(input.value)};input.setPointerCapture(event.pointerId);
  });
  input.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const span=Number(input.max)-Number(input.min);
    apply(drag.value+(drag.y-event.clientY)*span/200*(event.shiftKey?.1:1));
  });
  const release=()=>{if(!drag)return;const id=drag.id;drag=null;if(input.hasPointerCapture(id))input.releasePointerCapture(id);emit(input,'change');};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])input.addEventListener(type,release);
  input.addEventListener('dblclick',event=>{if(!active()||input.disabled)return;event.preventDefault();apply(input.dataset.mix?.endsWith(':trim')?1:0);emit(input,'change');});
  // Existing click modifier shortcuts and track-gain fine keyboard steps stay intact.
  titles.set(input,input.title);
  input.addEventListener('input',()=>show(input));show(input);
}
export function refineRotaryControls(){
  const master=document.querySelector('#master-level');
  if(master&&!master.closest('.rb-output-knob')){
    const knob=document.createElement('div');knob.className='rb-output-knob';
    master.before(knob);knob.append(master);
  }
  bind(master);
  for(const input of document.querySelectorAll('input[data-fx-depth]')){
    if(!input.closest('.rb-fx-depth-knob')){const knob=document.createElement('label');knob.className='rb-fx-depth-knob';input.before(knob);knob.append(input);const output=document.createElement('span');output.className='rb-rotary-value';knob.append(output);}
    bind(input);
  }
  for(const input of document.querySelectorAll('input[data-track-gain]')){input.closest('label')?.classList.add('rb-track-gain-knob');bind(input);}
  for(const input of document.querySelectorAll('.knob-group input[data-mix]'))bind(input);
  for(const input of document.querySelectorAll('[data-preview-rotary]'))input.title=titles.get(input)+(active()?` · Drag up/down; Shift: fine · Double-click: ${input.dataset.mix?.endsWith(':trim')?'unity':input.dataset.fxDepth!==undefined?'0%':'0 dB'}`:'');
}
export function syncRotaryControls(){for(const input of document.querySelectorAll('[data-preview-rotary]'))show(input);}
