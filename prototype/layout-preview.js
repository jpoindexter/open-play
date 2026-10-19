// Separate review entry point. Production app/engine/mapping files stay unchanged.
// Both workspaces share the same existing DOM controls and one AudioEngine.
await import('./app.js');

const $=selector=>document.querySelector(selector);
const choices=[...document.querySelectorAll('[data-workspace-choice]')];
const letters=['A','B','C','D'];
const layout=$('#layout');
layout.value='Horizontal';layout.dispatchEvent(new Event('change',{bubbles:true}));
layout.hidden=true;

function decorate(){
  const traktor=document.body.dataset.workspace==='traktor';
  const original=$('.detail-waves'),originalLanes=original?.querySelector('.waveform-scrub-lanes');
  if(!original||!originalLanes)return;
  original.setAttribute('aria-hidden',String(traktor));
  document.querySelectorAll('.deck').forEach((deck,index)=>{
    deck.dataset.previewLetter=letters[index];
    let view=deck.querySelector('.preview-deck-wave');
    if(!view){
      view=document.createElement('div');view.className='preview-deck-wave';
      const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');view.append(canvas);
      deck.append(view);
    }
    const lane=document.querySelector(`[data-waveform-scrub][data-deck-scratch="${index}"]`);
    const status=document.querySelector(`[data-waveform-scrub-status="${index}"]`);
    const destination=traktor?view:originalLanes;
    if(lane&&lane.parentNode!==destination)destination.append(lane);
    if(status&&status.parentNode!==destination)destination.append(status);
    if(lane)lane.dataset.waveformScrub='x';
  });
  document.querySelectorAll('.knob-group').forEach(updateDial);
}
function updateDial(label){
  const input=label.querySelector('input');if(!input)return;
  const ratio=(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min));
  label.style.setProperty('--dial-angle',`${-135+ratio*270}deg`);
}
function choose(workspace){
  document.body.dataset.workspace=workspace;
  for(const button of choices)button.setAttribute('aria-pressed',String(button.dataset.workspaceChoice===workspace));
  $('#workspace-caption').textContent=workspace==='traktor'?'Two decks. Mixer in the middle.':workspace==='hybrid'?'Compare the beats. Mix in the middle.':'Stacked waveforms. Familiar deck displays.';
  decorate();
}
for(const button of choices){button.disabled=false;button.onclick=()=>choose(button.dataset.workspaceChoice);}
for(const [id,direction]of [['preview-zoom-out','out'],['preview-zoom-in','in']]){
  const button=$('#'+id);button.disabled=false;
  button.onclick=()=>document.querySelector(`[data-wave-zoom="${direction}"]`)?.click();
}
new MutationObserver(decorate).observe($('#decks'),{childList:true});
new MutationObserver(()=>document.querySelectorAll('.knob-group').forEach(updateDial)).observe($('#mixer'),{childList:true});
document.addEventListener('input',event=>{const label=event.target.closest?.('.knob-group');if(label)updateDial(label);});
choose('hybrid');

// Read-only visual projection of our existing renderer. No second analysis or
// transport. Crop its horizontal rows into the left/right deck views, retaining
// the original focusable scrub surfaces and their delegated engine handlers.
function paint(){
  const source=$('#detail-wave');
  const decks=[...document.querySelectorAll('.deck')];
  if(source&&document.body.dataset.workspace==='traktor'&&source.width&&source.height){
    const ratio=Math.min(2,window.devicePixelRatio||1);
    for(const [index,deck]of decks.entries()){
      const view=deck.querySelector('.preview-deck-wave'),canvas=view?.querySelector('canvas');
      if(!canvas)continue;
      const width=Math.max(1,Math.round(view.clientWidth*ratio)),height=Math.max(1,Math.round(view.clientHeight*ratio));
      if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
      const ctx=canvas.getContext('2d');ctx.clearRect(0,0,width,height);
      ctx.drawImage(source,0,index*source.height/decks.length,source.width,source.height/decks.length,0,0,width,height);
    }
  }
  const scale=$('#detail-wave-scale')?.textContent;if(scale)$('#preview-zoom-scale').textContent=scale;
  requestAnimationFrame(paint);
}
requestAnimationFrame(paint);
