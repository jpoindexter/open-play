// HTML-only composition of the player's original nodes. Events still bubble
// through #decks to the existing handlers; no copied transport or audio state.
const move=(node,parent)=>{if(node&&node.parentNode!==parent)parent.append(node);};
export function refineTraktorFlatDeck(deck,index){
 const transport=deck.querySelector('.transport');
 move(deck.querySelector('.rb-pad-tools'),transport);
 move(deck.querySelector('.preview-loop-strip'),transport);
 move(deck.querySelector('.tempo-control'),deck);
 const view=deck.querySelector('.preview-deck-wave');
 if(view){view.setAttribute('role','group');view.setAttribute('aria-label',`Deck ${index+1} detailed waveform`);}
 const lock=deck.querySelector('[data-action=keylock]');if(lock){lock.textContent='Key lock';lock.title='Preserve musical pitch when changing tempo';}
 const mode=deck.querySelector('.rb-pad-tools select');if(mode)mode.title='Cue banks and performance modes; all eight cues remain visible in Compact';
}
