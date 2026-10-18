// Independent piecewise source↔prepared clock. A factor q reads original PCM
// q times faster; its prepared duration is original duration/q. Source clocks
// remain in original seconds, including after a window is dropped or rebased.
export function createPitchTimeMap(points,duration){
 if(!Number.isFinite(duration)||duration<=0||!Array.isArray(points)||!points.length||points[0].position!==0)throw new TypeError('Pitch map needs a finite duration and a source-zero anchor.');
 let prepared=0;const nodes=points.map((point,index)=>{
  const {position,factor}=point,previous=points[index-1];
  if(!Number.isFinite(position)||position<0||position>=duration||(index&&position<=previous.position)||!Number.isFinite(factor)||factor<.25||factor>4)throw new RangeError('Pitch map needs increasing source positions and factors.25..4.');
  if(index)prepared+=(position-previous.position)/previous.factor;
  return Object.freeze({position,prepared,factor});
 });
 const at=(key,value)=>{if(!Number.isFinite(value))throw new TypeError('Pitch map coordinate must be finite.');let lo=0,hi=nodes.length;while(lo<hi){const mid=(lo+hi)>>>1;if(nodes[mid][key]<=value+1e-10)lo=mid+1;else hi=mid;}return Math.max(0,lo-1);};
 const sourceSegment=position=>{const i=at('position',position);return {...nodes[i],next:nodes[i+1]||null};};
 const preparedSegment=time=>{const i=at('prepared',time);return {...nodes[i],next:nodes[i+1]||null};};
 return Object.freeze({nodes:Object.freeze(nodes),sourceSegment,preparedSegment,
  preparedAt(position){const s=nodes[at('position',position)];return s.prepared+(position-s.position)/s.factor;},
  sourceAt(time){const s=nodes[at('prepared',time)];return s.position+(time-s.prepared)*s.factor;},
  factorAt(position){return nodes[at('position',position)].factor;}
 });
}
