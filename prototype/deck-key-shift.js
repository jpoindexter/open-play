// Key changes share request ownership between buttons and mapped MIDI input.
export function createDeckKeyShift({state,engine,cancel,persist,render}){
 const requests=new WeakMap();
 function intent(index){
  const deck=state.decks[index],request=requests.get(deck);
  return request&&request.track===deck.track?request.semitones:deck.keyShift||0;
 }
 async function set(index,semitones){
  if(!Number.isInteger(semitones)||Math.abs(semitones)>24)
   throw new RangeError('The browser pitch renderer supports±24 semitones.');
  const deck=state.decks[index];
  if(!deck)throw new RangeError('Unknown deck.');
  cancel(deck);deck.keySync=false;
  const request={track:deck.track,semitones};requests.set(deck,request);
  try{
   await engine.setPitch(deck,{keylock:true,semitones});
   if(requests.get(deck)===request&&state.decks[index]===deck&&deck.track===request.track){
    persist();render(deck);
   }
  }finally{
   if(requests.get(deck)===request)requests.delete(deck);
  }
 }
 return{intent,set};
}
