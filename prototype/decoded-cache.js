// Budget decoded originals only; live owners may exceed it. This is not a process-RAM cap.
const bytes=buffer=>buffer.length*buffer.numberOfChannels*Float32Array.BYTES_PER_ELEMENT;
function owners(engine){
 const ids=new Set(engine.bufferLoads.keys()),add=track=>{if(track?.id)ids.add(track.id);};
 for(const track of engine.loadedBufferTracks?.()||[])add(track);
 for(const deck of engine.deckStates.values())add(deck.track);
 for(const entry of engine.scratchCache.entries.values())add(entry.track);
 for(const request of engine.sampleRequests.values())add(request.track);
 for(const voice of engine.samples?.values()||[])add(voice.track);
 for(const jobs of engine.sampleRetiring.values())for(const job of jobs)add(job.voice.track);
 return ids;
}
export function decodedBufferUsage(engine){
 const protectedIDs=owners(engine);let total=0,protectedBytes=0;
 for(const [id,buffer]of engine.buffers){const cost=bytes(buffer);total+=cost;if(protectedIDs.has(id))protectedBytes+=cost;}
 return {bytes:total,protectedBytes,inactiveBytes:total-protectedBytes,entries:engine.buffers.size,budgetBytes:engine.maxDecodedBytes};
}
export function pruneDecodedBuffers(engine,{allInactive=false}={}){
 const protectedIDs=owners(engine);let total=0;
 for(const buffer of engine.buffers.values())total+=bytes(buffer);
 for(const [id,buffer]of engine.buffers){
  if(!allInactive&&total<=engine.maxDecodedBytes)break;
  if(!protectedIDs.has(id)){engine.buffers.delete(id);total-=bytes(buffer);}
 }
 return decodedBufferUsage(engine);
}
