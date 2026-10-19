// Separate review entry point. Production app/engine/mapping files stay unchanged.
// Both workspaces share the same existing DOM controls and one AudioEngine.
await import('./app.js');
const {refineRekordboxDeck,refineRekordboxMixer}=await import('./rekordbox-preview.js');
const {installLibraryWaveforms}=await import('./library-waveform-preview.js');
installLibraryWaveforms(window.openPlay);

const $=selector=>document.querySelector(selector);
const choices=[...document.querySelectorAll('[data-workspace-choice]')];
const letters=['A','B','C','D'];
const layout=$('#layout');
const display={orientation:'horizontal',density:'expanded',size:'medium',library:false,crates:true,mixer:true,panels:new Map()};
layout.hidden=true;
const workspaceDisplays=new Map([['hybrid',{orientation:'vertical',density:'compact'}],['rekordbox',{orientation:'horizontal',density:'expanded'}]]);
function refined(){return ['hybrid','rekordbox'].includes(document.body.dataset.workspace);}
function vertical(){return refined()&&display.orientation==='vertical';}
function applyDisplay(){
  document.body.dataset.orientation=vertical()?'vertical':'horizontal';
  document.body.dataset.density=display.density;
  document.body.dataset.waveSize=display.size;
  document.body.dataset.libraryFocus=String(display.library);
  document.body.dataset.crates=String(display.crates);
  document.body.dataset.rbMixer=String(display.mixer);
  $('#preview-mixer-toggle')?.setAttribute('aria-pressed',String(display.mixer));
  $('#preview-orientation').value=display.orientation;
  $('#preview-density').value=display.density;
  $('#preview-wave-size').value=display.size;
  $('#preview-library-focus').setAttribute('aria-pressed',String(display.library));
  $('#preview-crates').setAttribute('aria-pressed',String(display.crates));
  const desired=vertical()?'Vertical':'Horizontal';
  if(layout.value!==desired){layout.value=desired;layout.dispatchEvent(new Event('change',{bubbles:true}));}
  decorate();
}
function updatePanels(deck,index){
  const panel=deck.querySelector('.deck-body>div:first-child');
  if(!panel)return;
  panel.id=`preview-controls-${index}`;
  const open=!refined()||(!display.library&&(display.panels.get(index)??display.density==='expanded'));
  panel.hidden=!open;
  deck.dataset.controlsOpen=String(open);
  let button=deck.querySelector('.deck-disclosure');
  if(!button){
    button=document.createElement('button');button.className='deck-disclosure';
    button.type='button';button.setAttribute('aria-controls',panel.id);
    button.onclick=()=>{const next=panel.hidden;if(next&&document.body.dataset.workspace==='rekordbox'&&display.density==='compact'){display.density='expanded';document.body.dataset.density='expanded';$('#preview-density').value='expanded';}if(display.library){display.library=false;document.body.dataset.libraryFocus='false';$('#preview-library-focus').setAttribute('aria-pressed','false');}display.panels.set(index,next);decorate();};
    deck.querySelector('.deck-head').append(button);
  }
  const mode=panel.querySelector('.deck-tabs .active')?.textContent||'Cues';
  button.textContent=`${open?'▾':'▸'} ${mode==='Cues'?'Pads':mode}`;button.setAttribute('aria-expanded',String(open));
  button.setAttribute('aria-label',`Deck ${index+1} pads and performance modes`);
  button.title=open?'Collapse performance pads':'Open cues, loops and performance modes';
}

function decorate(){
  const traktor=document.body.dataset.workspace==='traktor',projected=traktor;
  const original=$('.detail-waves'),originalLanes=original?.querySelector('.waveform-scrub-lanes');
  if(!original||!originalLanes)return;
  original.setAttribute('aria-hidden',String(projected));
  let headings=original.querySelector('.preview-wave-head');
  if(!headings){headings=document.createElement('div');headings.className='preview-wave-head';headings.setAttribute('aria-hidden','true');original.append(headings);}
  const count=document.querySelectorAll('.deck').length;
  if(headings.children.length!==count){headings.replaceChildren(...letters.slice(0,count).map(letter=>{const label=document.createElement('span');label.textContent=letter;return label;}));}
  document.querySelectorAll('.deck').forEach((deck,index)=>{
    deck.dataset.previewLetter=letters[index];
    let view=document.querySelector(`[data-preview-wave="${index}"]`);
    if(!view){
      view=document.createElement('div');view.className='preview-deck-wave';view.dataset.previewWave=index;
      const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');view.append(canvas);
      deck.append(view);
    }
    const lane=document.querySelector(`[data-waveform-scrub][data-deck-scratch="${index}"]`);
    const status=document.querySelector(`[data-waveform-scrub-status="${index}"]`);
    const viewParent=deck;
    if(view.parentNode!==viewParent)viewParent.append(view);
    const destination=projected?view:originalLanes;
    if(lane&&lane.parentNode!==destination)destination.append(lane);
    if(status&&status.parentNode!==destination)destination.append(status);
    if(lane)lane.dataset.waveformScrub=vertical()?'y':'x';
    updatePanels(deck,index);
    refineDeck(deck,index);
  });
  refineMixer();
}
function refineDeck(deck,index){
  if(!refined())return;
  let loops=deck.querySelector('.preview-loop-strip');
  if(!loops){
    loops=document.createElement('div');loops.className='preview-loop-strip';loops.setAttribute('role','group');loops.setAttribute('aria-label',`Deck ${index+1} loops and beat jumps`);
    for(const action of ['loopHalf','jumpBack']){const line=deck.querySelector(`[data-action="${action}"]`)?.closest('.loop-line');if(line)loops.append(line);}
    deck.append(loops);
  }
  const load=deck.querySelector('[data-action="load"]');if(load)load.setAttribute('aria-label',`Load selected track into deck ${index+1}`);
  const key=deck.querySelector('.deck-key');
  let row=deck.querySelector('.preview-key-row');
  if(!row){row=document.createElement('div');row.className='preview-key-row';const caption=document.createElement('span');caption.textContent='Key';caption.className='preview-key-caption';row.append(caption);deck.append(row);}
  if(key&&key.parentNode!==row)row.append(key);
  if(key){
    if(key.textContent==='—')key.textContent='Unknown';
    key.setAttribute('aria-label',`Deck ${index+1} track key: ${key.textContent}`);
    key.title=key.textContent==='Unknown'?'No confident key is available. Analyze or enter a track key in library metadata.':'Track key, including the current semitone shift';
  }
  for(const action of ['keyDown','keyUp','keySync','keyReset']){
    const button=deck.querySelector(`[data-action="${action}"]`);
    if(button&&button.parentNode!==row)row.append(button);
  }
  let utilities=deck.querySelector('.preview-deck-utilities');
  if(!utilities){
    utilities=document.createElement('div');utilities.className='preview-deck-utilities';
    utilities.setAttribute('role','group');utilities.setAttribute('aria-label',`Deck ${index+1} gain and utilities`);deck.append(utilities);
    for(const node of [deck.querySelector('.track-gain-control'),...['reverse','repeat','censor','double'].map(action=>deck.querySelector(`[data-action="${action}"]`))])if(node)utilities.append(node);
  }
  const beat=deck.querySelector('.beat-position');if(beat&&beat.parentNode!==deck.querySelector('.deck-foot'))deck.querySelector('.deck-foot').append(beat);
  const scratch=deck.querySelector('.scratch-status');if(scratch&&scratch.parentNode!==deck.querySelector('.deck-foot'))deck.querySelector('.deck-foot').append(scratch);
  if(document.body.dataset.workspace==='rekordbox'){
    let clock=deck.querySelector('.preview-deck-time');
    if(!clock){clock=document.createElement('div');clock.className='preview-deck-time';clock.setAttribute('aria-label',`Deck ${index+1} elapsed and remaining time`);deck.querySelector('.deck-head').insertBefore(clock,load);}
    for(const node of [deck.querySelector('time'),deck.querySelector(`[id="remain-${index}"]`)])if(node&&node.parentNode!==clock)clock.append(node);
  }
  const title=deck.querySelector('.deck-title strong');if(title)title.title=title.textContent;
  if(document.body.dataset.workspace==='rekordbox')refineRekordboxDeck(deck,index);
}
function refineMixer(){
  // A player rerender creates a new real crossfader. Retire its old moved footer.
  let footer=$('.preview-mixer-footer');
  const fresh=$('#mixer #crossfader');
  if(fresh&&footer&&!footer.contains(fresh)){footer.remove();footer=null;}
  document.querySelectorAll('.knob-group').forEach(updateDial);
  document.querySelectorAll('.fader-group').forEach(updateFader);
  document.querySelectorAll('.channel-strip>strong').forEach((label,index)=>label.textContent=letters[index]);
  if(!$('.preview-headphones')){
    const button=document.createElement('button');button.className='preview-headphones';button.dataset.panel='hardware';button.textContent='Headphones & routing';$('#mixer').append(button);
  }
  if(refined()&&!footer){
    footer=document.createElement('div');footer.className='preview-mixer-footer';
    footer.append($('#crossfader').closest('label'),$('.preview-headphones'));$('#mixer').append(footer);
  }
  if(document.body.dataset.workspace==='rekordbox'&&footer)refineRekordboxMixer(footer);
}
function updateFader(label){const input=label.querySelector('input');if(input)label.style.setProperty('--preview-level',input.value);}
function updateDial(label){
  const input=label.querySelector('input');if(!input)return;
  const value=Number(input.value),min=Number(input.min),max=Number(input.max);
  const ratio=min<0&&max>0?.5+.5*value/(value<0?-min:max):(value-min)/(max-min);
  label.style.setProperty('--dial-angle',`${-135+ratio*270}deg`);
}
function choose(workspace){
  const previous=document.body.dataset.workspace;
  if(previous!==workspace){
    if(['hybrid','rekordbox'].includes(previous))workspaceDisplays.set(previous,{orientation:display.orientation,density:display.density});
    Object.assign(display,workspaceDisplays.get(workspace)||{});display.panels.clear();display.library=false;
  }
  document.body.dataset.workspace=workspace;
  if(previous!==workspace){const footer=$('.preview-mixer-footer');if(footer&&footer.parentNode!==$('#mixer'))footer.remove();layout.dispatchEvent(new Event('change',{bubbles:true}));}
  for(const button of choices)button.setAttribute('aria-pressed',String(button.dataset.workspaceChoice===workspace));
  $('#workspace-caption').textContent=workspace==='traktor'?'Two decks. Mixer in the middle.':workspace==='rekordbox'?'rekordbox 7 · Performance layout reference':workspace==='hybrid'?'Compare the beats. Mix in the middle.':'Stacked waveforms. Familiar deck displays.';
  applyDisplay();
}
for(const button of choices){button.disabled=false;button.onclick=()=>choose(button.dataset.workspaceChoice);}
for(const [id,direction]of [['preview-zoom-out','out'],['preview-zoom-in','in']]){
  const button=$('#'+id);button.disabled=false;
  button.onclick=()=>document.querySelector(`[data-wave-zoom="${direction}"]`)?.click();
}
new MutationObserver(decorate).observe($('#decks'),{childList:true});
new MutationObserver(refineMixer).observe($('#mixer'),{childList:true});
document.addEventListener('input',event=>{const label=event.target.closest?.('.knob-group');if(label)updateDial(label);const fader=event.target.closest?.('.fader-group');if(fader)updateFader(fader);});
$('#preview-orientation').onchange=event=>{display.orientation=event.target.value;applyDisplay();};
$('#preview-density').onchange=event=>{display.density=event.target.value;display.panels.clear();display.library=false;applyDisplay();};
$('#preview-wave-size').onchange=event=>{display.size=event.target.value;applyDisplay();};
$('#preview-library-focus').onclick=()=>{display.library=!display.library;applyDisplay();};
$('#preview-crates').onclick=()=>{display.crates=!display.crates;applyDisplay();};
$('#preview-reset').onclick=()=>{Object.assign(display,{orientation:document.body.dataset.workspace==='rekordbox'?'horizontal':'vertical',density:document.body.dataset.workspace==='rekordbox'?'expanded':'compact',size:'medium',library:false,crates:true,mixer:true});display.panels.clear();applyDisplay();};

// Restore secondary panels without replacing their original controls/handlers.
const more=document.createElement('details');more.className='preview-more';
const moreSummary=document.createElement('summary');moreSummary.textContent='More panels';more.append(moreSummary);
const moreContents=document.createElement('div');moreContents.setAttribute('role','group');moreContents.setAttribute('aria-label','Additional panels');more.append(moreContents);
for(const name of ['sampler','scratch','flip','video','coverage']){const button=document.querySelector(`[data-panel="${name}"]`);if(button)moreContents.append(button);}
const libraryTools=$('#library-tools');if(libraryTools)moreContents.append(libraryTools);
document.querySelector('.toolbar-separator').before(more);
more.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();more.open=false;moreSummary.focus();}});
document.addEventListener('click',event=>{if(more.open&&(!more.contains(event.target)||event.target.closest('button')))more.open=false;});
// Disk import must survive hiding the crates sidebar.
const importButton=$('#import');importButton.textContent='＋ Import';importButton.setAttribute('aria-label','Import audio from disk');$('#preview-crates').after(importButton);
const mixerToggle=document.createElement('button');mixerToggle.id='preview-mixer-toggle';mixerToggle.className='rb-only';mixerToggle.textContent='Mixer';mixerToggle.setAttribute('aria-label','Show or hide mixer');mixerToggle.setAttribute('aria-pressed','true');mixerToggle.onclick=()=>{display.mixer=!display.mixer;applyDisplay();};$('#preview-library-focus').before(mixerToggle);
choose('rekordbox');

// Read-only visual projection of our existing renderer. No second analysis or
// transport. Crop its horizontal rows into Traktor deck views, retaining
// the original focusable scrub surfaces and their delegated engine handlers.
function paint(){
  const source=$('#detail-wave');
  const decks=[...document.querySelectorAll('.deck')];
  if(source&&document.body.dataset.workspace==='traktor'&&source.width&&source.height){
    const ratio=Math.min(2,window.devicePixelRatio||1);
    for(const [index,deck]of decks.entries()){
      const view=document.querySelector(`[data-preview-wave="${index}"]`),canvas=view?.querySelector('canvas');
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
