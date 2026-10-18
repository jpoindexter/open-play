export function trackGainDB(track){const value=track?.trackGainDb??track?.sampleGain??0;return Number.isFinite(Number(value))?Math.max(-24,Math.min(24,Number(value))):0;}
export function boundedTrackGain(value){if(!Number.isFinite(Number(value)))throw new TypeError('Track gain needs a finite decibel value.');return Math.max(-24,Math.min(24,Number(value)));}
export function createTrackGain({state,engine,persist=()=>{},onChange=()=>{}}){
 function refresh(track){const value=trackGainDB(track);for(const d of state.decks)if(d.track?.id===track.id)engine.setDeckTrackGain(d.index,value);engine.updateSampleTrackGain(track,value);onChange(track,value);return value;}
 return{refresh,set(track,value){if(!track)throw Error('Load a track first.');value=boundedTrackGain(value);track.trackGainDb=value;track.sampleGain=value;refresh(track);persist();return value;}};
}
