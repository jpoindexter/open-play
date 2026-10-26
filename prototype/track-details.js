import {refreshAnalysisControls} from './analysis-presentation.js';

export async function saveTrackDetails(track,fields,engine,persist){
 const bpm=Number(fields.get('bpm'))||0,changed=bpm!==track.bpm;
 // Revoke old-grid work before changing the shared track object.
 const before=changed?engine.onGridWillChange?.(track):undefined;
 track.metadataSources??={};
 if(changed)track.metadataSources.bpm='manual';
 if(String(fields.get('key'))!==track.key)track.metadataSources.key='manual';
 track.metadataRevision=(track.metadataRevision||0)+1;
 for(const key of ['title','artist','album','key','comment','color'])track[key]=fields.get(key);
 track.bpm=bpm;
 track.rating=Number(fields.get('rating'));
 track.locked=fields.has('locked');
 persist();
 if(changed)try{await engine.onGridChanged?.(track,before);}
 catch(error){throw new Error('Details saved; playback realignment failed: '+error.message,{cause:error});}
}

export function refreshTrackDetails(state,track,time,root=document){
 refreshAnalysisControls(state,track,root);
 for(const deck of state.decks.slice(0,state.deckCount)){
  if(deck.track!==track)continue;
  const node=root.querySelector(`.deck[data-focus="${deck.index}"]`);
  const title=node?.querySelector('.deck-title strong'),artist=node?.querySelector('.deck-title small');
  if(title){title.textContent=track.title||'Drag song here';title.title=title.textContent;}
  if(artist)artist.textContent=(track.artist||'Select a library track and Load')+' · '+time(track.duration);
 }
}
