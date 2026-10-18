import {createBeatgrid} from './beatgrid.js';
// Reverse PCM has coordinate z=duration-source. A reversed marker changes to
// the tempo on its ORIGINAL left side; the integral remains continuous.
export function createReverseCensorPlan(track,bpm){
 const grid=createBeatgrid(track),duration=track?.duration;
 if(!grid||!Number.isFinite(duration)||duration<=0||!Number.isFinite(bpm)||bpm<=0)throw new TypeError('Reverse Censor needs a valid grid and target tempo.');
 const points=[{position:0,rate:bpm/grid.bpmAt(duration)}];
 for(let i=grid.nodes.length-1;i>0;i--){const node=grid.nodes[i];if(node.time>0&&node.time<duration)points.push({position:duration-node.time,rate:bpm/grid.nodes[i-1].bpm});}
 if(points.some(p=>p.rate<.25||p.rate>4))throw new RangeError('Reverse Censor exceeds the current transport rate range.');
 const at=position=>{if(!Number.isFinite(position)||position<0||position>duration)throw new RangeError('Reverse Censor position is outside the source.');let i=0;while(i+1<points.length&&points[i+1].position<=position+1e-10)i++;return i;};
 const reverseTrack={duration,grid:0,bpm:grid.bpmAt(duration),gridWarpMarkers:points.slice(1).map(p=>({time:p.position,bpm:bpm/p.rate}))};
 return{duration,points,track:reverseTrack,loop(bounds){
  if(!Number.isFinite(bounds?.start)||!Number.isFinite(bounds?.end)||bounds.start<0||bounds.end>duration||bounds.end<=bounds.start)throw new RangeError('Reverse Censor loop bounds are invalid.');
  return{start:duration-bounds.end,end:duration-bounds.start};
 },rateAt:position=>points[at(position)].rate,events(position,when){
  if(!Number.isFinite(when)||when<0)throw new RangeError('Reverse Censor start time is invalid.');let i=at(position),time=when,last=position,rate=points[i].rate;const events=[{when,rate}];
  for(i++;i<points.length;i++){const p=points[i];time+=(p.position-last)/rate;events.push({when:time,rate:p.rate});last=p.position;rate=p.rate;}
  return events;
 }};
}
