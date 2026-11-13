// The editor validates its complete draft before this transaction begins.
export async function saveBeatgrid(track,next,clearLegacy,engine,persist){
 const before=engine.onGridWillChange?.(track);
 track.bpm=next.bpm;track.grid=next.grid;
 track.gridWarpMarkers=next.gridWarpMarkers.map(marker=>({...marker}));
 if(clearLegacy)track.gridMarkers=[];
 track.metadataSources={...track.metadataSources,bpm:'manual',grid:'manual'};
 track.metadataRevision=(track.metadataRevision||0)+1;
 const saved=persist();
 try{await engine.onGridChanged?.(track,before);}
 catch(error){throw new Error((saved===false?'Grid changed in this session only; saving failed':'Grid saved')+'; playback realignment failed: '+error.message,{cause:error});}
 if(saved===false)throw new Error('Grid changed in this session only. Saving failed; keep the app open, export a backup or retry Save grid.');
}
