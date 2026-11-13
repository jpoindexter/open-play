// Test-only actual worker analysis while the normal four-deck transport runs.
export async function checkAnalysis({app,track,turn,until,click,capture,event,report,controls}){
 const {state,engine}=app,loaded=state.decks.slice(0,state.deckCount).filter(d=>d.track===track).map(d=>d.index),contract=new URL(location.href).searchParams.has('analysisContract'),activeContract=new URL(location.href).searchParams.has('analysisControlsContract');
 const retained=[...document.querySelectorAll('.deck,.deck button,.deck input,.deck select,.deck canvas,.deck .platter,.deck .deck-key,#detail-wave,.channel-strip,#crossfader,[data-waveform-scrub],[data-waveform-scrub-status],#tracks tbody tr,#tracks .library-wave-preview img')].filter(node=>activeContract||!node.closest('.deck')||!loaded.includes(Number(node.closest('.deck').dataset.focus)));
 const active=activeContract&&loaded.length?document.querySelector(`[data-tempo="${loaded[0]}"]`):null;
 const before=track.analysisResult,master=state.decks.find(d=>d.syncRole==='primary'),voice=engine.voices.get(master.index),rate=master.rate,gains=state.decks.map(d=>d.track.playbackGainDb);
 event('analysis-before',{turn,track:track.title,loaded,playing:state.decks.map(d=>d.playing),master:master.index,masterTrack:master.track.title,masterRate:rate});
 const pcm=[0,1,4].includes(turn)?capture('analysis-'+turn,12):null;
 click(`tr[data-track="${track.id}"]`);click('#analyze');active?.focus();const activeValue=active?.value;await until(()=>!state.analysis,'actual worker analysis',180);
 event('analysis-worker-ready',{turn,track:track.title,loaded});if(pcm)await pcm;
 if(track.analysisResult===before||track.analysisError)throw Error('Analysis did not commit a fresh worker result');
 if(activeContract&&active&&(document.activeElement!==active||active.value!==activeValue))throw Error('Analysis replaced or changed the focused measured tempo control');
 if(contract&&!retained.every(node=>node.isConnected))throw Error('Analysis replaced an unrelated deck, mixer, shared waveform or library preview');
 if(!state.decks.every(d=>d.playing)||master.rate!==rate||engine.voices.get(master.index)!==voice)throw Error('Analysis disturbed transport/master ownership');
 const gainDeferred=loaded.every(index=>state.decks[index].track.autoGainDeferred&&state.decks[index].track.playbackGainDb===gains[index]);
 if(!gainDeferred)throw Error('Analysis changed active Auto Gain rather than deferring');
 (report.analysisChecks??=[]).push({turn,track:track.title,loaded,retained:retained.length,contract,masterRetained:true,gainDeferred,activeControls:activeContract,focusedTempoRetained:active?document.activeElement===active:null,controls:controls(),measuredAt:track.analysisResult.measuredAt});
 event('analysis-after',{turn,track:track.title,loaded,gainDeferred,controls:controls()});
}
