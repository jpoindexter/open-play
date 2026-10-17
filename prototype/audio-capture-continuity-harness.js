const $=s=>document.querySelector(s);
const source=`class ContinuityDiagnostic extends AudioWorkletProcessor {
 constructor(){super();this.rows=[];this.seq=0;this.arm=null;this.stop=false;this.port.onmessage=({data})=>{if(data.type==='arm')this.arm={id:data.id,seq:this.seq,frame:currentFrame};else if(data.type==='stop')this.stop=true;};this.port.postMessage({type:'ready'});}
 process(inputs,outputs){const size=outputs[0][0].length;outputs[0].forEach(c=>c.fill(0));this.rows.push({seq:this.seq++,frame:currentFrame,time:currentTime,size,inputFrames:inputs[0]?.[0]?.length||0});if(this.rows.length===1)this.port.postMessage({type:'first',row:this.rows[0]});if(this.rows.length===64)this.port.postMessage({type:'preflight',seq:this.seq,frame:currentFrame+size});if(this.stop||this.rows.length>=2048){this.port.postMessage({type:'finished',rows:this.rows,arm:this.arm,lastFrame:currentFrame+size});return false;}return true;}
} registerProcessor('open-play-continuity-diagnostic',ContinuityDiagnostic);`;
function timed(p,label,ms=7000){let t;return Promise.race([p,new Promise((_,reject)=>t=setTimeout(()=>reject(Error(label+' timeout')),ms))]).finally(()=>clearTimeout(t));}
function analyze(rows){const gaps=[];for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i];if(b.frame!==a.frame+a.size||b.seq!==a.seq+1)gaps.push({previous:a,next:b,missingFrames:b.frame-a.frame-a.size});}return{calls:rows.length,first:rows[0]||null,last:rows.at(-1)||null,gaps,contiguous:gaps.length===0};}
async function runCase({name,preflight=false,oscillator=false,resumeLate=false}){
 const ctx=new AudioContext(),start=performance.now(),waiters=new Map();let node,gain,osc,url;
 const event=(type)=>timed(new Promise(resolve=>waiters.set(type,resolve)),name+' '+type);
 const output={name,preflight,oscillator,resumeLate,sampleRate:ctx.sampleRate};
 try{
  const resume=resumeLate?null:ctx.resume();url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));await ctx.audioWorklet.addModule(url);URL.revokeObjectURL(url);url=null;
  gain=ctx.createGain();gain.gain.value=0;gain.connect(ctx.destination);
  node=new AudioWorkletNode(ctx,'open-play-continuity-diagnostic',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2]});
  const ready=event('ready'),first=event('first'),warm=event('preflight'),finish=event('finished');
  // Prevent an unused bounded preflight waiter becoming an unhandled rejection.
  warm.catch(()=>{});first.catch(()=>{});finish.catch(()=>{});
  node.port.onmessage=({data})=>{const r=waiters.get(data.type);if(r){waiters.delete(data.type);r(data);}};
  node.connect(gain);if(oscillator){osc=ctx.createOscillator();osc.connect(node);osc.start();}
  await (resume||ctx.resume());await ready;if(preflight)output.preflight=await warm;
  node.port.postMessage({type:'arm',id:name});output.firstObserved=await first;
  // The bounded wait uses actual reported processor completion rather than ctx.currentTime.
  const completed=await finish;const armedRows=completed.rows.filter(row=>row.seq>=completed.arm.seq);
  Object.assign(output,{arm:completed.arm,lastFrame:completed.lastFrame,all:analyze(completed.rows),armed:analyze(armedRows),firstRows:completed.rows.slice(0,8),wallMs:performance.now()-start});
  output.completed=true;
 }catch(error){output.error=error.message;output.completed=false;}
 finally{if(url)URL.revokeObjectURL(url);try{osc?.stop();osc?.disconnect();node?.disconnect();node?.port.close();gain?.disconnect();await ctx.close();}catch(error){output.cleanupError=error.message;}}
 return output;
}
$('#run').onclick=async()=>{const button=$('#run');button.disabled=true;const report={scope:'Actual browser retained per-process frame/sequence rows, independent of per-quantum IPC. Silent finite diagnostic only; no keylock acceptance.',cases:[]};try{for(const spec of [{name:'early-resume-immediate-arm'},{name:'late-resume-immediate-arm',resumeLate:true},{name:'early-resume-preflight-arm',preflight:true},{name:'early-resume-oscillator-preflight',preflight:true,oscillator:true}]){$('#status').textContent='Running '+spec.name;report.cases.push(await runCase(spec));$('#results').textContent=JSON.stringify(report,null,2);}report.completed=report.cases.every(c=>c.completed&&!c.cleanupError);report.armedContiguous=report.cases.filter(c=>c.completed).every(c=>c.armed.contiguous);$('#status').textContent=report.completed?'Diagnostic finished; inspect startup versus armed spans':'Diagnostic incomplete';}catch(error){report.error=error.message;}finally{$('#results').textContent=JSON.stringify(report,null,2);button.disabled=false;}};
