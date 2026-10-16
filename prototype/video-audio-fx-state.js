import {parseBeatModifier} from './observed-fx-control-adapters.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),number=(v,f)=>Number.isFinite(parseFloat(v))?parseFloat(v):f;
export const videoAudioFXPolicy=Object.freeze({
  requirement:'REQ-348',source:'docs/research/VIDEO_REMAINING_WORKFLOWS.md',referenceEquivalent:false,
  supported:Object.freeze(['Echo','Distortion']),
  mapping:'Original semantic links for exact DJ-FX bank names Echo/Distortion only. No FFT trigger, no aliases/families/31 hidden definitions inferred. Deck1→left,Deck2→right,Master→master once; other assignments are explicitly unsupported.',
  order:'Dedicated channel links before ordinary channel slots/overlays; dedicated master links after transition and before master overlays/slots. Independent order, not recovered vendor routing.',
  echo:'Three shifted real upstream-frame taps at1T,2T,3T; T=60/BPM*beat*Beat Modify using actual configured audio timing. Depth is wet opacity; Feedback is finite tap decay, not recursive video feedback.16 timestamped frames at up to320x180. Missing past timestamps contribute nothing.',
  distortion:'Original static row warp plus Smooth Drive/Hard Clip/Foldback RGB transform; Drive/Character/Tone/depth have declared independent visual mappings.',
  lifecycle:'Opt-in off, disabled/zero effect, removal/reassignment/upstream topology changes, source asset/generation changes, backward render time, transport generation/direction/seek discontinuity, pause/stop clear Echo history immediately: no visual tail after bypass. Silence alone never gates a semantic link. Resume captures new history. Timing/amount edits retain real samples; insufficient older history is not fabricated.',
  reducedMotion:'Suppress all Echo trails and geometric Distortion warp; retain static distortion colour and observable semantic metadata. No generated flash or zoom.',
  limitations:'No exact Serato transfer/parameters/order/tail claim; channel knob FX, stems, Deck3/4 and Sampler links are not mapped. Audio graph/output is never mutated by this bridge.',
});
const routes=['Deck 1','Deck 2','Deck 3','Deck 4','Sampler','Master'];
export function describeAudioVideoLinks(fxState,{ready=true}={}){
  const result={available:!!ready,left:[],right:[],master:[],unsupported:[],policy:videoAudioFXPolicy};
  if(!ready)return result;
  const input=Array.isArray(fxState)?fxState:[],banks=Array.isArray(input[0])?input[0]:[],assignments=Array.isArray(input[1])?input[1]:[],bpms=Array.isArray(input[2])?input[2]:[];
  for(const [bank,specs] of banks.entries())for(const [slot,spec] of (Array.isArray(specs)?specs:[]).entries()){
    if(!spec||spec.on===false)continue;
    const amount=clamp(number(spec.depth,50)/100,0,1);if(amount===0)continue;
    const route=assignments[bank]||`Deck ${bank+1}`,target=route==='Deck 1'?'left':route==='Deck 2'?'right':route==='Master'?'master':null;
    if(!videoAudioFXPolicy.supported.includes(spec.name)||!target){result.unsupported.push({id:`${bank}:${slot}`,name:typeof spec.name==='string'?spec.name:'Unknown',route,reason:!target?'Video target not mapped.':'No independent semantic mapping for this audio effect.'});continue;}
    const bpm=clamp(number(bpms[routes.indexOf(route)],number(bpms[0],120)),20,400),p=spec.params||{},[n,d]=String(spec.beat??'1/2').split('/').map(Number),beats=Number.isFinite(n)?n/(d||1):.5;
    const modifier=clamp(parseBeatModifier(p['Beat Modify'],1),.125,4),delaySeconds=clamp(60/bpm*beats*modifier,.006,96);
    result[target].push({id:`${bank}:${slot}`,name:spec.name,kind:spec.name==='Echo'?'echo':'distortion',route,target,amount,bpm,beats,beatModifier:modifier,delaySeconds,
      feedback:clamp(number(p.Feedback,80)/100,0,.9),drive:clamp(number(p.Drive,spec.name==='Echo'?0:50)/100,0,1),character:clamp(number(p.Character,50)/100,0,1),tone:clamp(number(p.Tone,0),-24,24),type:['Smooth Drive','Hard Clip','Foldback'].includes(p.Type)?p.Type:'Smooth Drive',
      parameterStatus:'Original visual mapping from current independent audio controls; vendor response unknown.'});
  }
  return result;
}
export function createVideoAudioFXFrameState(){return {times:Array(16).fill(-Infinity),next:0,lastCapture:-Infinity,lastTime:null,lastFrameId:undefined,assetId:undefined,topologyKey:undefined,transport:null,resets:0,lastReset:'initial',captures:0};}
function transport(context){
  const raw=context.audioTransport;if(!raw)return {playing:true,generation:undefined,clocks:[]};
  const clocks=(Array.isArray(raw.sources)?raw.sources:[raw]).map((c,i)=>({id:c.id??i,generation:c.generation,playing:c.playing!==false,position:typeof c.position==='number'&&Number.isFinite(c.position)?c.position:null,rate:typeof c.rate==='number'&&Number.isFinite(c.rate)?c.rate:1}));
  return {playing:raw.playing===undefined?clocks.some(c=>c.playing):raw.playing!==false,generation:raw.generation,clocks};
}
export function planVideoAudioFXFrame(state,link,context={}){
  const time=typeof context.time==='number'&&Number.isFinite(context.time)?context.time:0,nextTransport=transport(context),reasons=[];
  const dt=state.lastTime===null?0:time-state.lastTime;
  if(state.lastTime!==null&&time<state.lastTime)reasons.push('backward-clock');
  if(state.lastTime!==null&&state.assetId!==context.assetId)reasons.push('source-asset');
  if(state.lastTime!==null&&state.topologyKey!==context.topologyKey)reasons.push('upstream-topology');
  if(state.transport){
    const old=state.transport;
    if(old.generation!==nextTransport.generation||old.clocks.length!==nextTransport.clocks.length)reasons.push('transport-generation');
    if(old.playing!==nextTransport.playing)reasons.push('transport-state');
    nextTransport.clocks.forEach((now,i)=>{const prior=old.clocks[i];if(!prior)return;
      if(now.id!==prior.id||now.generation!==prior.generation)reasons.push('transport-generation');
      if(now.playing!==prior.playing)reasons.push('transport-state');
      if(Math.sign(now.rate)!==Math.sign(prior.rate))reasons.push('transport-direction');
      if(now.position!==null&&prior.position!==null&&dt>=0&&Math.abs(now.position-prior.position-(prior.playing?dt*prior.rate:0))>.12)reasons.push('transport-seek');
    });
  }
  const suppressed=link.kind==='echo'&&(!nextTransport.playing||context.reducedMotion===true||link.amount<=0);
  if(suppressed)reasons.push(context.reducedMotion?'reduced-motion':!nextTransport.playing?'paused':'zero-amount');
  if(reasons.length){state.times.fill(-Infinity);state.next=0;state.lastCapture=-Infinity;state.resets++;state.lastReset=[...new Set(reasons)].join(',');}
  const duplicate=context.frameId!==undefined&&context.frameId===state.lastFrameId&&!reasons.length;
  let captureLayer=null;
  if(link.kind==='echo'&&!suppressed&&!duplicate&&time-state.lastCapture>=Math.max(1/120,3*link.delaySeconds/15)-1e-9){captureLayer=state.next;state.times[captureLayer]=time;state.next=(state.next+1)%16;state.lastCapture=time;state.captures++;}
  const taps=[1,2,3].map(multiple=>{const target=time-multiple*link.delaySeconds;let selected=-1,best=-Infinity;for(let i=0;i<16;i++)if(Number.isFinite(state.times[i])&&state.times[i]<=target+1e-9&&state.times[i]>best){best=state.times[i];selected=i;}return selected;});
  state.lastTime=time;state.lastFrameId=context.frameId;state.assetId=context.assetId;state.topologyKey=context.topologyKey;state.transport=nextTransport;
  return {captureLayer,taps,suppressed,duplicate,resetReasons:[...new Set(reasons)],geometricMotion:context.reducedMotion!==true};
}
