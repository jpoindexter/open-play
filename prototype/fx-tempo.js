// Independent per-unit timing. Historical source establishes auto/manual/armed,
// octave/subdivision tapping and return-to-auto; estimator/ranges are original.
export const fxTempoPolicy=Object.freeze({
  source:'https://support.serato.com/hc/en-us/articles/224970027-Using-DJ-FX',
  bpmRange:[20,400],estimator:'First two accepted taps anchor the range; median of the last5 normalized intervals. Later quarter/half/single/double/bar intervals fold by .25,.5,1,2,4 toward that anchor, within25% deviation.',
  idle:'After more than max(8seconds,4.5anchor intervals), start a fresh first-tap sequence while retaining any established manual BPM until a new valid pair.',
  invalid:'Nonfinite/nonmonotonic timestamps are ignored. Initial intervals outside150..3000ms restart the first-tap sequence. Later outlier intervals do not alter the held clock or last accepted beat.',
  holdMilliseconds:600,persistence:'Only {mode,bpm}; armed flag, taps, intervals and timestamps are session-local.',referenceResponseVerified:false,
});
const own=(value,key)=>{if(!value||typeof value!=='object')return undefined;try{return Object.getOwnPropertyDescriptor(value,key)?.value;}catch{return undefined;}};
const bpm=(value,fallback=120)=>typeof value==='number'&&Number.isFinite(value)?Math.max(20,Math.min(400,value)):fallback;
export function normalizeFXTempoSettings(input,count=2){
  if(!Number.isInteger(count)||count<0)throw new RangeError('FX unit count must be a nonnegative integer.');
  return Array.from({length:count},(_,index)=>{const setting=Array.isArray(input)?own(input,String(index)):undefined;return{mode:own(setting,'mode')==='manual'?'manual':'auto',bpm:bpm(own(setting,'bpm'))};});
}
export function effectiveFXBPM(setting,automaticBpm=120){return own(setting,'mode')==='manual'?bpm(own(setting,'bpm')):bpm(automaticBpm);}
const fresh=()=>({armed:false,lastSeen:null,lastTap:null,anchor:null,intervals:[],taps:0});
const median=values=>{const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;};
export function createFXTempo({initial=[],count=2,now=()=>performance.now()}={}){
  const settings=normalizeFXTempoSettings(initial,count),runtime=Array.from({length:count},fresh);
  const indexOf=index=>{if(!Number.isInteger(index)||index<0||index>=count)throw new RangeError('Choose an existing FX unit.');return index;};
  const result=(index,ignored=null)=>({setting:{...settings[index]},armed:runtime[index].armed,taps:runtime[index].taps,
    phase:runtime[index].anchor?'manual':runtime[index].armed?'armed':settings[index].mode,ignored});
  return{
    tap(index,timestamp=now()){
      index=indexOf(index);const r=runtime[index];
      if(typeof timestamp!=='number'||!Number.isFinite(timestamp)||timestamp<0)return result(index,'invalid-clock');
      if(r.lastSeen!==null&&timestamp<=r.lastSeen)return result(index,'non-monotonic');
      r.lastSeen=timestamp;
      const idle=Math.max(8000,(r.anchor||0)*4.5);
      if(r.lastTap===null||timestamp-r.lastTap>idle){Object.assign(r,fresh(),{armed:true,lastSeen:timestamp,lastTap:timestamp,taps:1});return result(index);}
      const interval=timestamp-r.lastTap;
      if(r.anchor===null){
        if(interval<150||interval>3000){r.lastTap=timestamp;r.taps=1;return result(index,'initial-interval-out-of-range');}
        r.anchor=interval;r.intervals=[interval];
      }else{
        const normalized=[.25,.5,1,2,4].map(factor=>interval/factor).reduce((best,value)=>Math.abs(value-r.anchor)<Math.abs(best-r.anchor)?value:best);
        if(normalized<150||normalized>3000||Math.abs(normalized/r.anchor-1)>.25)return result(index,'interval-outlier');
        r.intervals.push(normalized);if(r.intervals.length>5)r.intervals.shift();
      }
      r.lastTap=timestamp;r.taps++;settings[index]={mode:'manual',bpm:60000/median(r.intervals)};return result(index);
    },
    automatic(index){index=indexOf(index);settings[index]={mode:'auto',bpm:120};runtime[index]=fresh();return result(index);},
    snapshot(){return settings.map(setting=>({...setting}));},
    diagnostics(index){index=indexOf(index);return{...result(index),anchorMilliseconds:runtime[index].anchor,intervals:[...runtime[index].intervals]};},
  };
}
