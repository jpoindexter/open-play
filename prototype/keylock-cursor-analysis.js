// Test-only nonperiodic audible-position oracle. No production engine imports it.
// Marker and confidence budgets retain the earlier shadow-return experiment's
// 73ms source cells, global search, >=.8 correlation and >=.04 uniqueness margin.
export const cursorCriteria=Object.freeze({rate:1.08,semitones:12,sourceSeconds:16,
  probeSeconds:.4,probeOffsets:[0,.05,.2],cursorErrorSeconds:.01,
  correlationMinimum:.8,correlationMargin:.04});
const assert=(value,message)=>{if(!value)throw Error(message);};
function randomLevel(index){let x=Math.imul(index+202617,0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return((x^(x>>>16))>>>0)/4294967296;}
export function cursorEnvelope(seconds){const at=seconds/.073,index=Math.floor(at),f=at-index,s=f*f*(3-2*f);return .045+.105*(randomLevel(index)*(1-s)+randomLevel(index+1)*s);}
export function cursorFixtureSample(seconds,channel){return channel===0?.12*Math.sin(2*Math.PI*440*seconds):cursorEnvelope(seconds)*Math.sin(2*Math.PI*660*seconds);}
function correlation(a,b){let sa=0,sb=0,saa=0,sbb=0,sab=0;for(let i=0;i<a.length;i++){sa+=a[i];sb+=b[i];saa+=a[i]*a[i];sbb+=b[i]*b[i];sab+=a[i]*b[i];}const n=a.length,den=Math.sqrt((n*saa-sa*sa)*(n*sbb-sb*sb));return den>1e-16?(n*sab-sa*sb)/den:null;}
export function correlateCursor(data,sr,firstTime,probeTime){
  const {rate,probeSeconds:duration,sourceSeconds}=cursorCriteria;
  const rows=[],observed=[],offsets=[],width=Math.round(sr*.008),hop=Math.round(sr*.004);
  const start=Math.round((probeTime-firstTime)*sr),count=Math.round(duration*sr);
  assert(start>=0&&start+count<=data.length,'Full stereo cursor-probe interval unavailable');
  for(let i=0;i+width<=count;i+=hop){let power=0;for(let j=0;j<width;j++)power+=data[start+i+j]**2;observed.push(Math.sqrt(power/width));offsets.push((i+width/2)/sr);}
  const scoreAt=p=>correlation(observed,offsets.map(dt=>cursorEnvelope(p+rate*dt)));
  const max=sourceSeconds-rate*duration;
  for(let p=0;p<=max;p+=.002)rows.push({position:p,score:scoreAt(p)});
  const valid=rows.filter(r=>r.score!==null).sort((a,b)=>b.score-a.score),coarse=valid[0];
  if(!coarse)return{position:null,score:null,competitor:null,margin:null,confident:false,observed,offsets,globalCandidates:rows.length};
  let best=coarse;for(let p=Math.max(0,coarse.position-.002);p<=Math.min(max,coarse.position+.002);p+=.00025){const score=scoreAt(p);if(score!==null&&score>best.score)best={position:p,score};}
  const competitor=valid.find(r=>Math.abs(r.position-best.position)>=.05)||null;
  const margin=competitor?best.score-competitor.score:0;
  return{...best,competitor,margin,confident:best.score>=cursorCriteria.correlationMinimum&&margin>=cursorCriteria.correlationMargin,
    observed,offsets,globalCandidates:rows.length,probeTime,duration,
    scoreAccounting:'All global candidates searched; summaries/envelope retained, every score reproducible from complete raw PCM and this exact source.'};
}
export function inspectCursorProbes(right,sr,firstTime,releaseTime,endPosition){
  return cursorCriteria.probeOffsets.map(offset=>{
    const probeTime=releaseTime+offset,result=correlateCursor(right,sr,firstTime,probeTime);
    const idealPosition=endPosition+cursorCriteria.rate*offset;
    const errorSeconds=result.position===null?null:result.position-idealPosition;
    return{offset,...result,idealPosition,errorSeconds,
      passed:result.confident&&errorSeconds!==null&&Math.abs(errorSeconds)<=cursorCriteria.cursorErrorSeconds};
  });
}
