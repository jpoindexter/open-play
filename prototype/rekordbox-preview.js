// Layout adapter for the installed rekordbox 7 Performance reference.
// Move the player's original nodes; never create another transport or mixer.
const group=(root,name,parent=root)=>{let node=root.querySelector('.'+name);if(!node){node=document.createElement('div');node.className=name;parent.append(node);}return node;};
const move=(node,parent)=>{if(node&&node.parentNode!==parent)parent.append(node);};
const modes=[['Cues','HOT CUE'],['Loops','LOOPS'],['Stems','STEMS'],['Pitch','PITCH PLAY'],['Slicer','SLICER']];
export function refineRekordboxDeck(deck,index){
  const head=deck.querySelector('.deck-head'),rail=deck.querySelector('.preview-deck-utilities');
  let art=head.querySelector('.rb-artwork');if(!art){art=document.createElement('span');art.className='rb-artwork';art.setAttribute('aria-hidden','true');head.insertBefore(art,deck.querySelector('.deck-title'));}
  const sync=group(deck,'rb-sync-controls',head);
  for(const action of ['sync','syncOff']){const node=deck.querySelector(`[data-action="${action}"]`);move(node,sync);if(node&&action==='sync')node.textContent='BEAT SYNC';}
  move(deck.querySelector('.preview-key-row'),head);
  for(const action of ['keyReset','load','eject','range'])move(deck.querySelector(`[data-action="${action}"]`),rail);
  move(deck.querySelector('.tempo-control'),rail);
  const transport=deck.querySelector('.transport');move(deck.querySelector('select[data-mode]'),transport);
  const cue=transport.querySelector('[data-action=cue]');if(cue)cue.textContent='CUE';
  const options=group(deck,'rb-deck-options');
  for(const action of ['slip','quantize','keylock']){const node=deck.querySelector(`[data-action="${action}"]`);move(node,options);if(node&&action==='keylock'){node.textContent='MT';node.title='Master tempo / key lock';}}
  const jump=deck.querySelector('[data-action="jumpBack"]')?.closest('.loop-line');move(jump,deck.querySelector('.deck-foot'));
  const panel=deck.querySelector('.deck-body>div:first-child');
  if(panel){
    const tools=group(deck,'rb-pad-tools',panel);let select=tools.querySelector('select');
    if(!select){select=document.createElement('select');select.setAttribute('aria-label',`Deck ${index+1} performance mode`);for(const [value,label]of modes){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}select.onchange=()=>deck.querySelector(`.deck-tabs [data-tab="${select.value}"]`)?.click();tools.append(select);}
    const mode=panel.querySelector('.deck-tabs .active')?.dataset.tab||'Cues';select.value=mode;deck.dataset.rbPadMode=mode;
    panel.querySelectorAll('.pad').forEach((pad,i)=>{pad.dataset.cueLetter='ABCDEFGH'[i]||String(i+1);if(mode==='Cues'){pad.setAttribute('aria-label',`Deck ${index+1} hot cue ${pad.dataset.cueLetter}${pad.classList.contains('set')?'':' — empty'}`);if(!pad.querySelector('.rb-cue-name')){const span=document.createElement('span');span.className='rb-cue-name';for(const text of [...pad.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE))span.append(text);pad.prepend(span);}}});
  }
  // This remains reachable when Compact hides its optional pad bank.
  const foot=deck.querySelector('.deck-foot');move(deck.querySelector('.deck-disclosure'),foot);
}
export function refineRekordboxMixer(footer){
  footer.classList.add('rb-mixer-band');
  const headphones=footer.querySelector('.preview-headphones');
  if(headphones){delete headphones.dataset.panel;headphones.textContent='Headphones · Mix / Level';headphones.onclick=()=>{document.querySelector('[data-panel="settings"]')?.click();document.querySelector('[data-settings-tab="Mixer"]')?.click();};}
  const cross=group(footer,'rb-cross-controls');
  move(footer.querySelector('.crossfader'),cross);
  for(const label of document.querySelectorAll('#mixer .cross-assign, .rb-mixer-band .cross-assign')){
    const index=Number(label.querySelector('select')?.dataset.crossAssign);
    label.dataset.rbAssign=String(index);
    const text=[...label.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);
    if(text)text.textContent='ABCDEFGH'[index]+' → ';
    move(label,cross);
  }
  // Keep the actual filter bound to its channel, below LOW and above CUE.
  document.querySelectorAll('#mixer .channel-strip').forEach((strip,index)=>{
    strip.dataset.rbChannel=String(index);
    const filter=document.querySelector(`input[data-mix="${index}:filter"]`)?.closest('.knob-group');
    move(filter,strip);
  });
  move(footer,document.querySelector('main'));
}
