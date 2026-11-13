// Diagnostic only: one imported track, actual engine graph, silent PCM witnesses.
export async function runOutputLevelCheck({state,engine}){
 const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
 async function until(fn,label){const end=performance.now()+30000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
 const sources=['app.js','engine.js','master-output.js','master-output-kernel.js','master-output-worklet.js','track-gain.js','mixer-curves.js','fx-tempo-capture-worklet.js','output-level-check.js'];
 const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
 async function hashes(){return Object.fromEntries(await Promise.all(sources.map(async name=>[name,await hash(await(await fetch(name,{cache:'no-store'})).arrayBuffer())])));}
 function input(selector,value){const node=$(selector);assert(node&&!node.disabled,'Unavailable '+selector);node.value=value;node.dispatchEvent(new Event('input',{bubbles:true}));}
 const click=selector=>{const node=$(selector);assert(node&&!node.disabled,'Unavailable '+selector);node.click();};
 const report={startedAt:new Date().toISOString(),completed:false,cases:[],scope:'One imported real track through the current raw-forward engine graph, installed Play/master/track-gain controls, aligned pre-track-gain and post-master PCM. Physical output muted. Not Serato matching, listening, native/device, keylock/stem/FX or whole-product acceptance.'};
 const d=state.decks[0],observers=[],ports=[];
 assert(d.track&&!d.track.demo&&d.track.contentHash,'Load one imported real track into A first');
 assert(state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&!engine.recording,'Decks and recording must start stopped');
 try{
  report.sourceBefore=await hashes();engine.init();engine.audioMonitor.mutePhysical(true);await engine.resume();await until(()=>!state.analysis,'Pending analysis');
  report.track={id:d.track.id,contentHash:d.track.contentHash,duration:d.track.duration};state.autoplay=false;
  Object.assign(d,{rate:1,keylock:false,keyShift:0,reverse:false,loop:false,repeat:false,stemSlip:'off',sync:false});
  engine.setMasterVolume(1);engine.setMixerSettings({curve:'Linear',amount:.5,upfader:.5,filtersEnabled:false});engine.setCross(0);
  engine.mix(0,'level',.8);engine.mix(0,'trim',1);for(const band of ['low','mid','high'])engine.mix(0,band,0);
  for(const bank of state.fx)for(const slot of bank)slot.on=false;engine.configureFX(state.fx,state.fxRoutes||[],state.decks.map(()=>120),state.fxTempo);
  input('[data-track-gain="0"]',-7);
  await engine.ctx.audioWorklet.addModule(new URL('./fx-tempo-capture-worklet.js',import.meta.url));
  const controls=[...document.querySelectorAll('.deck button,.deck input,.deck select,.channel-strip input,#crossfader')];
  const previews=[...document.querySelectorAll('.library-wave-preview img')].map(n=>({node:n,src:n.src}));
  function witness(tap){
   const split=engine.ctx.createChannelSplitter(2);tap.connect(split);observers.push(split);
   return [0,1].map(channel=>{const node=new AudioWorkletNode(engine.ctx,'open-play-fx-tempo-capture-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit',channelInterpretation:'discrete'});split.connect(node,channel);node.connect(engine.ctx.destination);observers.push(node);ports.push(node.port);return node;});
  }
  function capture(node,id){return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('PCM witness timed out')),5000);node.port.onmessage=({data})=>{if(data.type==='done'&&data.id===id){clearTimeout(timer);resolve(data);}};
   node.port.postMessage({type:'capture',id,frames:engine.ctx.sampleRate});
  });}
  function rms(data,offset,count){let power=0,peak=0;for(let n=offset;n<offset+count;n++){const v=data[n];assert(Number.isFinite(v),'Non-finite PCM');power+=v*v;peak=Math.max(peak,Math.abs(v));}return{rms:Math.sqrt(power/count),peak};}
  function packed(data){const bytes=new Uint8Array(data.buffer,data.byteOffset,data.byteLength),chunks=[];for(let n=0;n<bytes.length;n+=32768)chunks.push(btoa(String.fromCharCode(...bytes.subarray(n,n+32768))));return chunks;}
  for(const masterDB of [-10,0]){
   input('#master-level',masterDB);await engine.seek(d,Math.min(60,d.track.duration/3));click('[data-action="play"][data-deck="0"]');
   await until(()=>d.playing&&!d.processing&&!d.playQueued,'Actual Play');await sleep(300);
   const voice=engine.voices.get(0);assert(voice?.sources?.length===1&&voice.sourceGates?.[0],'Raw source witness required');
   const nodes=[...witness(voice.sourceGates[0]),...witness(engine.masterOutput.output)];
   const packets=await Promise.all(nodes.map((node,i)=>capture(node,masterDB+':'+i))),start=Math.max(...packets.map(p=>p.startFrame)),end=Math.min(...packets.map(p=>p.startFrame+p.data.length)),frames=end-start;
   assert(frames>engine.ctx.sampleRate*.95,'PCM windows do not overlap');
   const expectedDB=-7+20*Math.log10(.8)+masterDB-3,channels=[0,1].map(c=>{
    const source=rms(packets[c].data,start-packets[c].startFrame,frames),output=rms(packets[c+2].data,start-packets[c+2].startFrame,frames);
    assert(source.rms>1e-5,'Source window is silent');const actualDB=20*Math.log10(output.rms/source.rms);return{source,output,actualDB,errorDB:actualDB-expectedDB};
   });
   report.cases.push({masterDB,expectedDB,startFrame:start,frames,channels,trackGainDB:engine.deckTrackGainDB[0],masterVolume:engine.masterVolume,meter:engine.masterSnapshot(),physicalMuted:engine.audioMonitor.snapshot().physicalMuted,pcm:await Promise.all(packets.map(async(p,i)=>({channel:i,startFrame:p.startFrame,frames:p.data.length,sha256:await hash(p.data.buffer),base64Chunks:packed(p.data)})))});
   assert(channels.every(c=>Math.abs(c.errorDB)<.05),'Unexpected gain reduction in current graph');assert(engine.audioMonitor.snapshot().physicalMuted,'Physical output unmuted');
   click('[data-action="play"][data-deck="0"]');await until(()=>!d.playing&&!d.processing,'Actual Pause');
   for(const node of nodes)node.disconnect();
  }
  report.retention={controls:controls.length,retainedControls:controls.filter(n=>n.isConnected).length,readyPreviews:previews.length,previewsRetained:previews.every(p=>p.node.isConnected&&p.node.src===p.src)};
  assert(report.retention.controls===report.retention.retainedControls&&report.retention.previewsRetained,'Controls or previews replaced');report.completed=true;
 }catch(error){report.error={name:error.name,message:error.message,stack:error.stack};}
 finally{
  state.autoplay=false;state.decks.forEach(d=>engine.pause(d));engine.stopAllSamples();for(const port of ports){try{port.postMessage({type:'cancel'});port.close();}catch{}}
  for(const node of observers)try{node.disconnect();}catch{}engine.audioMonitor?.mutePhysical(true);
  report.cleanup={allStopped:state.decks.every(d=>!d.playing&&!d.processing&&!d.playQueued)&&engine.voices.size===0&&engine.transforms.size===0,physicalMuted:!!engine.audioMonitor?.snapshot().physicalMuted};
  try{report.sourceAfter=await hashes();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);}catch(error){report.sourceError=error.message;}
  report.completed=report.completed&&Object.values(report.cleanup).every(Boolean)&&report.sourceStable;report.finishedAt=new Date().toISOString();
 }
 return report;
}
