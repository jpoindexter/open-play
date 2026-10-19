// Inline HTML controls for the existing monitor bus and preference persistence.
const fields=[['mix','Cue Mix','MIX','Headphone mix',50],['volume','Cue Volume','LEVEL','Headphone level',10]];
let lastSettings;

function show(input,value){
  const percent=Math.max(0,Math.min(100,value*100));
  input.value=String(percent);
  input.parentElement.style.setProperty('--monitor-angle',`${-135+percent*2.7}deg`);
  input.setAttribute('aria-valuetext',input.dataset.rbMonitor==='mix'
    ?`${percent.toFixed(1)}% master, ${(100-percent).toFixed(1)}% cue`
    :percent===0?'Muted':`${percent.toFixed(1)}%`);
}

export function syncHeadphoneControls({engine}){
  if(engine.monitorSettings===lastSettings)return;
  lastSettings=engine.monitorSettings;
  for(const [field]of fields){const input=document.querySelector(`[data-rb-monitor="${field}"]`);if(input)show(input,lastSettings[field]);}
}

export function refineHeadphoneControls(footer,{engine,state,persist}){
  if(footer.querySelector('[data-rb-monitor]'))return;
  const group=document.createElement('div');group.className='preview-headphones rb-monitor-controls';
  group.setAttribute('role','group');group.setAttribute('aria-label','Headphone monitor');
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d','M4 14v-3a8 8 0 0 1 16 0v3 M4 13H3v7h4v-7H4 M20 13h1v7h-4v-7h3');icon.append(path);group.append(icon);
  for(const [field,setting,caption,name,reset]of fields){
    const label=document.createElement('label');label.className='rb-monitor-knob';
    label.dataset.monitorField=field;
    const text=document.createElement('span');text.textContent=caption;
    const input=document.createElement('input');input.type='range';input.min='0';input.max='100';input.step='.1';
    input.dataset.rbMonitor=field;input.setAttribute('aria-label',name);
    input.title=field==='mix'?'Cue at 0% · master at 100%. Drag vertically; Shift for fine control. Double-click: center.'
      :'Headphone level. Drag vertically; Shift for fine control. Double-click: unity (10%).';
    const apply=save=>{
      const percent=Math.max(0,Math.min(100,Number(input.value)));
      const next=engine.setMonitorSettings({[field]:percent/100});
      state.settings[setting]=percent;
      const setup=document.querySelector(`[data-setting="${setting}"]`);if(setup)setup.value=String(percent);
      show(input,next[field]);if(save)persist();
    };
    input.oninput=()=>apply(false);input.onchange=()=>apply(true);
    let drag=null;
    input.onpointerdown=event=>{
      if(event.button!==0)return;event.preventDefault();input.focus();
      drag={id:event.pointerId,y:event.clientY,value:Number(input.value)};input.setPointerCapture(event.pointerId);
    };
    input.onpointermove=event=>{
      if(!drag||drag.id!==event.pointerId)return;
      input.value=String(Math.max(0,Math.min(100,drag.value+(drag.y-event.clientY)*(event.shiftKey ? .1 : .5))));apply(false);
    };
    const release=()=>{if(!drag)return;const {id}=drag;drag=null;if(input.hasPointerCapture(id))input.releasePointerCapture(id);persist();};
    input.onpointerup=release;input.onpointercancel=release;input.onlostpointercapture=release;
    input.ondblclick=()=>{input.value=String(reset);apply(true);};
    label.append(text,input);group.append(label);show(input,engine.monitorSettings[field]);
  }
  const previous=footer.querySelector('.preview-headphones');
  if(previous)previous.replaceWith(group);else footer.prepend(group);
}
