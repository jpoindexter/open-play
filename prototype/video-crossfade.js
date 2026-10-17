// Independent finite Video fade. Historical manual specifies direction and
// speed orientation; these bounds, linear curve and interruption rules are ours.
export function normalizeAutoCrossfadeSeconds(value) {
  return typeof value==='number'&&Number.isFinite(value)?Math.max(.25,Math.min(10,value)):2.5;
}
export function createVideoCrossfade() {
  let job=null,last=null;
  const position=value=>{if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError('Video fader position must be finite.');return Math.max(-1,Math.min(1,value));};
  const timestamp=value=>{if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError('Video fade clock must be finite.');return value;};
  function sample(time) {
    timestamp(time);if(!job)return null;
    // A discontinuous clock cancels at the last rendered position, never jumps
    // backwards through a blend or restarts a previous action.
    if(time<job.lastTime){job=null;return last;}
    job.lastTime=time;const fraction=Math.max(0,Math.min(1,(time-job.started)/job.seconds));
    last=job.from+(job.target-job.from)*fraction;
    if(fraction>=1){last=job.target;job=null;}
    return last;
  }
  function start(direction,from,seconds,time,{reducedMotion=false}={}) {
    if(direction!=='left'&&direction!=='right')throw new RangeError('Choose left or right Video fade.');
    from=position(from);timestamp(time);const target=direction==='left'?-1:1;
    last=from;
    if(reducedMotion||from===target){last=target;job=null;return last;}
    job={from,target,seconds:normalizeAutoCrossfadeSeconds(seconds),started:time,lastTime:time};return from;
  }
  function cancel(time){const value=sample(time);job=null;return value;}
  return {start,sample,cancel,diagnostics:()=>({active:!!job,position:last,target:job?.target??null,seconds:job?.seconds??null,policy:'Independent linear finite fade; Reduced Motion selects endpoint immediately; clock reversal cancels.'})};
}
