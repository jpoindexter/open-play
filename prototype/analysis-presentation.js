import {parseMusicalKey,shiftedKey,keyLabel} from './pitchplay.js';

// Analysis changes metadata, not the nodes owning a deck's active gestures.
export function refreshAnalysisControls(state,track,root=document){
 for(const d of state.decks.slice(0,state.deckCount)){
  if(d.track!==track)continue;
  if(d.keySync&&d.keySyncTag!==track.key)d.keySync=false;
  const deck=root.querySelector(`.deck[data-focus="${d.index}"]`),key=deck?.querySelector('.deck-key');
  if(key){
   const parsed=parseMusicalKey(track.key),base=parsed?keyLabel(shiftedKey(parsed,d.keyShift||0)):track.key||'—';
   let text=base+(d.keyShift?` (${d.keyShift>0?'+':''}${d.keyShift})`:'');
   if(text==='—'&&key.closest('.preview-key-row'))text='Unknown';
   if(key.textContent!==text)key.textContent=text;
   const label=`Deck ${d.index+1} track key: ${text}`;
   if(key.getAttribute('aria-label')!==label)key.setAttribute('aria-label',label);
   const title=text==='Unknown'?'No confident key is available. Analyze or enter a track key in library metadata.':'Track key, including the current semitone shift';
   if(key.title!==title)key.title=title;
  }
  deck?.querySelector('[data-action="keySync"]')?.classList.toggle('active',!!d.keySync);
 }
}
