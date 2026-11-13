// Loop feedback updates existing gesture owners, including shared saved-loop pads.
export function refreshLoopControls(state,loopPads,root=document){
 const rows=state.decks.slice(0,state.deckCount).map(d=>{
  const buttons=Object.fromEntries(['loop','loopIn','loopOut','loopSave','jumpBack','jumpForward'].map(action=>[action,root.querySelector(`[data-action="${action}"][data-deck="${d.index}"]`)]));
  const pads=d.tab==='Loops'?[...root.querySelectorAll(`[data-action="pad"][data-deck="${d.index}"]`)]:null;
  return{d,buttons,pads};
 });
 if(rows.some(({buttons,pads})=>Object.values(buttons).some(button=>!button)||(pads&&pads.length!==8)))return false;
 for(const {d,buttons,pads}of rows){
  for(const [action,text]of [['loop',`Loop ${d.loopLength}`],['loopSave',`Save ${(d.loopSlot||0)+1}`],['jumpBack',`← ${d.loopLength}`],['jumpForward',`${d.loopLength} →`]]){
   if(buttons[action].textContent!==text)buttons[action].textContent=text;
  }
  buttons.loopSave.setAttribute('aria-label',`Save loop to slot ${(d.loopSlot||0)+1} on deck ${d.index+1}`);
  for(const [action,active]of [['loop',!!d.loop],['loopIn',d.loopEdit==='in'],['loopOut',d.loopEdit==='out']]){
   buttons[action].classList.toggle('active',active);buttons[action].setAttribute('aria-pressed',String(active));
  }
  if(pads)refreshPads(d,pads,loopPads);
 }
 return true;
}

function refreshPads(d,pads,loopPads){
 const mode=d.loopPadMode||'saved',controls=mode==='saved'?null:loopPads.describe(d);
 for(const pad of pads){
  const index=Number(pad.dataset.pad),control=controls?.[index];
  const label=control?.label||d.track?.savedLoops[index]?.name||`Loop ${index+1}`;
  const name=pad.querySelector('.rb-cue-name')||[...pad.childNodes].find(node=>node.nodeType===3);
  if(name){if(name.textContent!==label)name.textContent=label;}else pad.prepend(pad.ownerDocument.createTextNode(label));
  const detail=pad.querySelector('small'),text=control?.detail||String(index+1);
  if(detail&&detail.textContent!==text)detail.textContent=text;
  const active=!!control&&!control.jump&&(mode==='roll'?loopPads.rolling(d,index):control.active);
  pad.classList.toggle('active',active);
  if(control){
   pad.setAttribute('aria-label',`Deck ${d.index+1} ${control.jump?'':mode==='roll'?'Loop Roll ':'Auto Loop '}${label}`);
   pad.setAttribute('aria-pressed',String(active));
  }
 }
}
