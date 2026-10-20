// Layout adapter for the installed rekordbox 7 Performance reference.
// Move the player's original nodes; never create another transport or mixer.
import {refineHeadphoneControls} from './headphone-preview.js';
const group=(root,name,parent=root)=>{let node=root.querySelector('.'+name);if(!node){node=document.createElement('div');node.className=name;parent.append(node);}return node;};
const move=(node,parent)=>{if(node&&node.parentNode!==parent)parent.append(node);};
const modes=[['Cues','HOT CUE'],['Loops','LOOPS'],['Stems','STEMS'],['Pitch','PITCH PLAY'],['Slicer','SLICER']];
export function refineRekordboxDeck(deck,index){
  const head=deck.querySelector('.deck-head'),rail=deck.querySelector('.preview-deck-utilities');
  let art=head.querySelector('.rb-artwork');if(!art){art=document.createElement('span');art.className='rb-artwork';art.setAttribute('aria-hidden','true');head.insertBefore(art,deck.querySelector('.deck-title'));}
  const sync=group(deck,'rb-sync-controls',head);
  for(const action of ['sync','syncOff']){const node=deck.querySelector(`[data-action="${action}"]`);move(node,sync);if(node&&action==='sync')node.textContent='BEAT SYNC';}
  move(deck.querySelector('.preview-key-row'),head);
  for(const action of ['load','eject','range','keyReset'])move(deck.querySelector(`[data-action="${action}"]`),rail);
  if(document.body.dataset.workspace!=='traktor-flat')move(deck.querySelector('.tempo-control'),rail);
  const transport=deck.querySelector('.transport');move(deck.querySelector('select[data-mode]'),transport);
  const cue=transport.querySelector('[data-action=cue]');if(cue)cue.textContent='CUE';
  const options=group(deck,'rb-deck-options');
  for(const action of ['slip','quantize','keylock']){const node=deck.querySelector(`[data-action="${action}"]`);move(node,options);if(node&&action==='keylock'){node.textContent='MT';node.title='Master tempo / key lock';}}
  const jump=deck.querySelector('[data-action="jumpBack"]')?.closest('.loop-line');move(jump,deck.querySelector('.deck-foot'));
  const panel=deck.querySelector('.deck-body>div:first-child');
  if(panel){
    const tools=group(deck,'rb-pad-tools',panel);let select=tools.querySelector('select');
    if(!select){select=document.createElement('select');select.setAttribute('aria-label',`Deck ${index+1} performance mode`);for(const [value,label]of modes){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}select.onchange=()=>{const chosen=select.value;if(document.body.dataset.density==='compact'&&!['Cues','Loops'].includes(chosen)){const density=document.querySelector('#preview-density');density.value='expanded';density.dispatchEvent(new Event('change',{bubbles:true}));}deck.querySelector(`.deck-tabs [data-tab="${chosen}"]`)?.click();};tools.append(select);}
    const mode=panel.querySelector('.deck-tabs .active')?.dataset.tab||'Cues';select.value=mode;deck.dataset.rbPadMode=mode;
    panel.querySelectorAll('.pad').forEach((pad,i)=>{pad.dataset.cueLetter='ABCDEFGH'[i]||String(i+1);if(mode==='Cues'){pad.setAttribute('aria-label',`Deck ${index+1} hot cue ${pad.dataset.cueLetter}${pad.classList.contains('set')?'':' — empty'}`);if(!pad.querySelector('.rb-cue-name')){const span=document.createElement('span');span.className='rb-cue-name';for(const text of [...pad.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE))span.append(text);pad.prepend(span);}}});
  }
  // Keep the native-style narrow loop block; its existing Save control stays
  // available in the utility footer instead of stretching the loop block.
  const foot=deck.querySelector('.deck-foot');move(deck.querySelector('[data-action="loopSave"]'),foot);move(deck.querySelector('.deck-disclosure'),foot);
}
export function refineRekordboxMixer(footer,monitorAPI){
  footer.classList.add('rb-mixer-band');
  refineHeadphoneControls(footer,monitorAPI);
  const cross=group(footer,'rb-cross-controls');
  move(footer.querySelector('.crossfader'),cross);
  for(const label of document.querySelectorAll('#mixer .cross-assign, .rb-mixer-band .cross-assign')){
    const index=Number(label.querySelector('select')?.dataset.crossAssign);
    label.dataset.rbAssign=String(index);
    const text=[...label.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);
    if(text)text.textContent='ABCDEFGH'[index]+' → ';
    move(label,cross);
  }
  // Screenshot203 supersedes the extra filter row: the native reference uses
  // TRIM/HIGH/MID/LOW. Keep the original filter/value for other layouts.
  document.querySelectorAll('#mixer .channel-strip').forEach((strip,index)=>{
    strip.dataset.rbChannel=String(index);
    const filter=document.querySelector(`input[data-mix="${index}:filter"]`)?.closest('.knob-group');
    move(filter,strip);
    const trim=strip.querySelector('input[data-mix$=":trim"]')?.closest('label');
    const text=trim&&[...trim.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);
    if(text)text.textContent='TRIM';
    const cue=strip.querySelector('[data-action="pfl"]');if(cue)cue.textContent='CUE';
  });
  move(footer,document.querySelector('main'));
}
