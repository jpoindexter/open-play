// Slice feedback belongs to the deck, even when another deck shares its track.
export function refreshSlicerControls(state,d,root=document){
 if(state.decks[d.index]!==d||d.index>=state.deckCount||d.tab!=='Slicer')return true;
 const pads=[...root.querySelectorAll(`[data-action="pad"][data-deck="${d.index}"]`)];
 const loop=root.querySelector(`[data-action="slicerLoop"][data-deck="${d.index}"]`);
 const domain=root.querySelector(`[data-slice-domain="${d.index}"]`),quant=root.querySelector(`[data-slice-quant="${d.index}"]`);
 const indices=pads.map(p=>Number(p.dataset.pad));
 if(pads.length!==8||new Set(indices).size!==8||indices.some(i=>!Number.isInteger(i)||i<0||i>7)||!loop||!domain||!quant)return false;
 for(const pad of pads){
  const index=Number(pad.dataset.pad),active=d.slice===index;
  pad.classList.toggle('active',active);pad.setAttribute('aria-pressed',String(active));
  pad.setAttribute('aria-label',`Deck ${d.index+1} Slice ${index+1}`);
 }
 loop.classList.toggle('active',!!d.slicerLoop);loop.setAttribute('aria-pressed',String(!!d.slicerLoop));
 for(const [node,value]of [[domain,d.slicerDomain||8],[quant,d.sliceQuant||1]])if(node.value!==String(value))node.value=String(value);
 return true;
}
