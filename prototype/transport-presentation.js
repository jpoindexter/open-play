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
