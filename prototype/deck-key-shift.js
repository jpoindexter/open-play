// Key changes share request ownership between buttons and mapped MIDI input.
export function createDeckKeyShift({state,engine,cancel,persist,render}){
 const requests=new WeakMap();
 function intent(index){
  const deck=state.decks[index],request=requests.get(deck);
  return request&&request.track===deck.track?request.semitones:deck.keyShift||0;
 }
 async function set(index,semitones,{keySync=false}={}){
  if(!Number.isInteger(semitones)||Math.abs(semitones)>24)
   throw new RangeError('The browser pitch renderer supports±24 semitones.');
  const deck=state.decks[index];
  if(!deck)throw new RangeError('Unknown deck.');
  cancel(deck);deck.keySync=false;
  const request={track:deck.track,key:deck.track?.key,semitones};requests.set(deck,request);
  try{
   const pending=engine.setPitch(deck,{keylock:true,semitones}),token=engine.startTokens?.get(index);
   await pending;
   if(requests.get(deck)===request&&state.decks[index]===deck&&deck.track===request.track&&engine.startTokens?.get(index)===token&&deck.keylock&&deck.keyShift===semitones&&(!keySync||deck.track.key===request.key)){
    deck.keySync=keySync;if(keySync)deck.keySyncTag=request.key;
    persist();render(deck);return true;
   }
   return false;
  }finally{
   if(requests.get(deck)===request)requests.delete(deck);
  }
 }
 return{intent,set};
}
