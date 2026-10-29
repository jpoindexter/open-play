// Pitch cue selection changes pad detail, not the nodes owning held gestures.
export function refreshPitchControls(state,d,root=document){
 if(state.decks[d.index]!==d||d.index>=state.deckCount||d.tab!=='Pitch')return true;
 const pads=[...root.querySelectorAll(`[data-action="pad"][data-deck="${d.index}"]`)];
 const indices=pads.map(p=>Number(p.dataset.pad)),details=pads.map(p=>p.querySelector('small'));
 if(pads.length!==8||new Set(indices).size!==8||indices.some(i=>!Number.isInteger(i)||i<0||i>7)||details.some(n=>!n))return false;
 const text=`CUE ${(d.pitchCue||0)+1}`;
 for(const detail of details)if(detail.textContent!==text)detail.textContent=text;
 return true;
}
