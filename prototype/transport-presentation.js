// Transport changes keep the existing controls, focus and waveform canvases.
export function refreshTransportControls(state,root=document){
 for(const d of state.decks.slice(0,state.deckCount)){
  root.querySelector(`.deck[data-focus="${d.index}"]`)?.classList.toggle('focused',state.focus===d.index);
  const play=root.querySelector(`[data-action="play"][data-deck="${d.index}"]`);
  if(play){
   play.classList.toggle('active',!!d.playing);
   const text=d.playing?'❚❚':'▶',busy=String(!!d.playQueued),title=d.playQueued?'Preparing playback':'Play or pause';
   if(play.textContent!==text)play.textContent=text;
   if(play.getAttribute('aria-busy')!==busy)play.setAttribute('aria-busy',busy);
   if(play.title!==title)play.title=title;
  }
  const censor=root.querySelector(`[data-action="censor"][data-deck="${d.index}"]`);
  const disabled=d.mode==='ABS'||!d.track||!d.playing;
  if(censor&&censor.disabled!==disabled)censor.disabled=disabled;
  const status=root.querySelector(`.deck[data-focus="${d.index}"] .deck-foot > small.muted`);
  const text=d.playQueued?'PREPARING PLAYBACK':d.processing?'PROCESSING PITCH…':d.mode==='INT'?'LOCAL AUDIO':'DEVICE SIMULATION';
  if(status&&status.textContent!==text)status.textContent=text;
 }
}

export function refreshDeckSwitches(state,index,root=document){
 const deck=state.decks[index];
 for(const action of ['reverse','repeat','slip','keylock','keySync']){
  const button=root.querySelector(`[data-action="${action}"][data-deck="${index}"]`);if(!button)continue;
  const active=!!deck[action],pressed=String(active);
  if(button.classList.contains('active')!==active)button.classList.toggle('active',active);
  if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
 }
}

// Cue metadata can be shared by several decks; keep their gesture owners intact.
export function refreshCueControls(state,track,time,root=document){
 for(const d of state.decks.slice(0,state.deckCount)){
  if(d.track!==track||d.tab!=='Cues')continue;
  for(const pad of root.querySelectorAll(`[data-action="pad"][data-deck="${d.index}"]`)){
   const index=Number(pad.dataset.pad),cue=track.cues[index],label=cue?.name||'+';
   const name=pad.querySelector('.rb-cue-name')||[...pad.childNodes].find(node=>node.nodeType===3);
   if(name)name.textContent=label;else pad.prepend(pad.ownerDocument.createTextNode(label));
   const detail=pad.querySelector('small');if(detail)detail.textContent=cue?time(cue.position):index+1;
   pad.classList.toggle('set',!!cue);
   pad.setAttribute('aria-label',`Deck ${d.index+1} hot cue ${pad.dataset.cueLetter||index+1}${cue?'':' — empty'}`);
  }
 }
}
