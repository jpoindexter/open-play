// Independent source-time beatgrid. A warp marker changes tempo from its
// source position; accumulated beat coordinates remain continuous.
const positive = n => Number.isFinite(n) && n > 0;
const segmentAt = (nodes,key,value) => {
  let lo=0,hi=nodes.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(nodes[mid][key]<=value)lo=mid+1;else hi=mid;}
  return nodes[Math.max(0,lo-1)];
};
export function createBeatgrid(track) {
  if(!track || !Number.isFinite(track.grid) || !positive(track.bpm))return null;
  const nodes=[{time:track.grid,beat:0,bpm:track.bpm}];
  const markers=[...(track.gridWarpMarkers||[])].sort((a,b)=>a.time-b.time);
  for(const marker of markers){
    const previous=nodes.at(-1);
    if(!Number.isFinite(marker.time)||marker.time<=previous.time||marker.time>=track.duration||!positive(marker.bpm))throw new RangeError('Warp markers need unique increasing source times after the downbeat, within the track, and positive BPM values.');
    nodes.push({time:marker.time,bpm:marker.bpm,beat:previous.beat+(marker.time-previous.time)*previous.bpm/60});
  }
  const beatAt=time=>{const node=segmentAt(nodes,'time',time);return node.beat+(time-node.time)*node.bpm/60;};
  const timeAt=beat=>{const node=segmentAt(nodes,'beat',beat);return node.time+(beat-node.beat)*60/node.bpm;};
  const bpmAt=time=>segmentAt(nodes,'time',time).bpm;
  function lines(from,to,max=2048){
    const first=Math.ceil(beatAt(from)),last=Math.floor(beatAt(to)),step=Math.max(1,Math.ceil((last-first+1)/max));
    const result=[];for(let beat=first;beat<=last;beat+=step)result.push({beat,time:timeAt(beat),bar:Math.floor(beat/4)+1,downbeat:((beat%4)+4)%4===0});
    return result;
  }
  function timeline({position,when,bpm}){
    if(!Number.isFinite(position)||!Number.isFinite(when)||!positive(bpm))throw new TypeError('Invalid beatgrid transport clock.');
    const firstBeat=beatAt(position),events=[{when,rate:bpm/bpmAt(position)}];
    for(const node of nodes.slice(1))if(node.time>position)events.push({when:when+(node.beat-firstBeat)*60/bpm,rate:bpm/node.bpm});
    if(events.some(e=>e.rate<.25||e.rate>4))throw new RangeError('Warped Sync exceeds the current transport rate range.');
    const clock=at=>Math.min(track.duration,Math.max(0,timeAt(firstBeat+Math.max(0,at-when)*bpm/60)));
    return {events,bpm,clock,rateAt:at=>bpm/bpmAt(clock(at)),grid:nodes.map(n=>({...n}))};
  }
  return {nodes,beatAt,timeAt,bpmAt,lines,timeline,warped:markers.length>0};
}
export function gridBPM(track,position=0){return createBeatgrid(track)?.bpmAt(position)||track?.bpm||120;}
