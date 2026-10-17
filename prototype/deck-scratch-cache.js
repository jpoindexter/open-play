// One raw-PCM owner per loaded deck. Preparation is independent of a gesture:
// canceled touches cannot route audio, but can leave a silently ready source.
const aborted=()=>new DOMException('Scratch preparation superseded or cleared.','AbortError');
const sameStems=(a,b)=>a===b||Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
export class DeckScratchCache {
 constructor({buffer,stems,prepare,nextGeneration,beforeClear=()=>{},onPhase=()=>{}}){Object.assign(this,{buffer,stems,prepare,nextGeneration,beforeClear,onPhase});this.entries=new Map();this.epochs=new Map();}
 peek(index){return this.entries.get(index);}
 owns(transport){return [...this.entries.values()].some(entry=>entry.transport===transport&&!entry.controller.signal.aborted);}
 phase(entry,value,error=null){try{this.onPhase(entry,value,error);}catch{}}
 disposeTransport(transport){if(transport&&!transport.state().disposed)transport.dispose();}
 clear(index){
  this.epochs.set(index,(this.epochs.get(index)||0)+1);const entry=this.entries.get(index);if(!entry)return;
  this.entries.delete(index);entry.controller.abort();try{this.beforeClear(index,entry);}finally{this.disposeTransport(entry.transport);this.phase(entry,'empty');}
 }
 clearAll(){for(const index of new Set([...this.epochs.keys(),...this.entries.keys()]))this.clear(index);}
 async get(deck){
  const index=deck.index,track=deck.track,epoch=this.epochs.get(index)||0;this.epochs.set(index,epoch);
  const original=await this.buffer(track),stems=this.stems(track)||null;
  if(deck.track!==track)throw aborted();
  let entry=this.entries.get(index);
  if(entry&&entry.track===track&&entry.original===original&&sameStems(entry.stems,stems)&&!entry.controller.signal.aborted&&!entry.transport?.state().disposed)return entry.promise;
  if(this.epochs.get(index)!==epoch)throw aborted();
  this.clear(index);
  entry={index,deck,track,original,stems:stems&&[...stems],generation:this.nextGeneration(),controller:new AbortController(),transport:null,promise:null};this.entries.set(index,entry);this.phase(entry,'preparing');
  const current=()=>this.entries.get(index)===entry&&deck.track===track&&!entry.controller.signal.aborted;
  entry.promise=(async()=>{
   try{
    const transport=await this.prepare(deck);entry.transport=transport;if(!current())throw aborted();
    await transport.replaceBuffers({generation:entry.generation,original,stems:entry.stems,signal:entry.controller.signal});
    if(!current())throw aborted();const state=transport.state();if(state.generation!==entry.generation||state.disposed||state.sourceCount<1)throw Error('Scratch PCM did not acknowledge ready source ownership.');
    this.phase(entry,'ready');return transport;
   }catch(error){
    if(this.entries.get(index)===entry){this.entries.delete(index);this.phase(entry,error.name==='AbortError'?'empty':'error',error);}
    entry.controller.abort();this.disposeTransport(entry.transport);throw error;
   }
  })();
  return entry.promise;
 }
}
