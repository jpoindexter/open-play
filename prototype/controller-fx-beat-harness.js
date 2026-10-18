const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
async function until(fn,label){const end=performance.now()+10000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const input={id:'controls-input',name:'Synthetic factory controls',state:'connected',type:'input',onmidimessage:null};
Object.defineProperty(navigator,'requestMIDIAccess',{configurable:true,value:async()=>({inputs:new Map([[input.id,input]]),onstatechange:null})});
const packet=(ch,n,value=127,type='Note')=>input.onmidimessage?.({data:new Uint8Array([(type==='CC'?0xb0:0x90)+ch-1,n,value]),timeStamp:performance.now()});
async function tap(ch,n){packet(ch,n);await sleep(25);packet(ch,n,0);await sleep(15);}
async function cc(ch,n,value){packet(ch,n,value>>7,'CC');packet(ch,n+32,value&127,'CC');await sleep(35);}
let app;
async function run(){
 const {state,engine}=app,d=state.decks[0],nodes=[],raw=[],report={startedAt:new Date().toISOString(),scope:'Actual restored factory mapping→unit multiplier→production Delay, measured against simultaneous PFL pulse; synthetic MIDI/owned input, no physical/native/vendor equivalence',cases:[],errors:[],maximumTimingErrorSeconds:.005,fullParity:false,physicalCompatibilityVerified:false};$('#beat-run').disabled=true;
 try{
  assert(state.mappings.length===356,'Run the mixer/FX upgrade on this isolated origin first');await engine.resume();engine.audioMonitor.mutePhysical(true);assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute');await until(()=>input.onmidimessage,'Restored MIDI input');await until(()=>!state.analysis,'Analysis idle');
  for(const x of state.decks)engine.pause(x);
  Object.assign(d,{position:0,rate:1,keylock:false,keyShift:0,loop:false,reverse:false,sync:false,mode:'INT',stemSlip:'off'});Object.assign(d.track,{duration:4,bpm:120,grid:0,gridWarpMarkers:[],gridMarkers:[],analyzed:true});
  const sr=engine.ctx.sampleRate,buffer=engine.ctx.createBuffer(2,sr*4,sr);for(let c=0;c<2;c++)for(let n=Math.round(sr*.05);n<Math.round(sr*.06);n++)buffer.getChannelData(c)[n]=.1*Math.sin(2*Math.PI*1000*n/sr);
  engine.buffers.set(d.track.id,buffer);engine.stemBuffers.delete(d.track.id);engine.clearDeckScratchCache(0);engine.mix(0,'level',.8);engine.setPFL(0,true);state.settings['Cue Mix']=0;state.settings['Cue Volume']=10;engine.setMonitorSettings({mix:0,volume:.1,masterCue:false,splitCue:false});
  for(const bank of state.fx)for(const slot of bank)slot.on=false;document.querySelector('[data-panel="fx"]').click();const select=$('[data-fx-select="0:0"]');select.value='Delay';select.dispatchEvent(new Event('change',{bubbles:true}));state.fx[0][0].params={Feedback:'0%',HPF:'20 Hz',Drive:'0%', 'Beat Modify':'1'};await cc(1,3,16383);await cc(2,6,16383);await tap(2,0);assert(state.fx[0][0].on,'Source FX enable');
  await engine.ctx.audioWorklet.addModule(new URL('./fx-tempo-capture-worklet.js',import.meta.url));for(const source of [engine.masterOutput.output,engine.audioMonitor.headphones]){const node=new AudioWorkletNode(engine.ctx,'open-play-fx-tempo-capture-test',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});source.connect(node);node.connect(engine.ctx.destination);nodes.push(node);}
  for(const [index,multiplier]of [[4,1],[5,2]]){
   $('#beat-status').textContent=`Measuring ${multiplier}× Delay…`;await cc(2,7,Math.round(index/7*16383));assert(state.fxBeatMultipliers[0]===multiplier,'Controller multiplier selection');await sleep(140);d.position=0;
   const captures=Promise.all(nodes.map((node,bus)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('PCM timeout')),2500);node.port.onmessage=({data})=>{if(data.type==='done'){clearTimeout(timer);let peak=0,peakIndex=0,sum=0;for(let i=0;i<data.data.length;i++){const v=data.data[i];assert(Number.isFinite(v),'Nonfinite output');sum+=v*v;if(Math.abs(v)>peak){peak=Math.abs(v);peakIndex=i;}}assert(peak>.001,'No pulse on '+bus);raw.push({bus:bus?'cue':'master',multiplier,startFrame:data.startFrame,pcm:Array.from(data.data)});resolve({bus:bus?'cue':'master',startFrame:data.startFrame,peakIndex,peak,rms:Math.sqrt(sum/data.data.length),frames:data.data.length});}};node.port.postMessage({type:'capture',id:multiplier,frames:sr});})));
   await tap(2,7);await until(()=>d.playing,'Source Play');const measured=await captures;await tap(2,7);await until(()=>!d.playing,'Source pause');
   const master=measured.find(x=>x.bus==='master'),cue=measured.find(x=>x.bus==='cue'),delay=(master.startFrame+master.peakIndex-cue.startFrame-cue.peakIndex)/sr,expected=.25*multiplier,error=Math.abs(delay-expected);report.cases.push({multiplier,sampleRate:sr,expectedDelaySeconds:expected,measuredDelaySeconds:delay,errorSeconds:error,buses:measured});assert(error<=report.maximumTimingErrorSeconds,'Wet delay interval does not follow source multiplier');
  }
  report.completed=true;
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{for(const d of state.decks)engine.pause(d);for(const n of nodes){n.disconnect();n.port.close();}report.finishedAt=new Date().toISOString();$('#beat-original').textContent=JSON.stringify({report,raw});$('#beat-results').textContent=JSON.stringify(report,null,2);$('#beat-status').textContent=report.errors.length?'Failed: '+report.errors.map(e=>e.message).join('; '):'Actual wet-delay timing passed; playback stopped';}
}
$('#beat-run').onclick=run;
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#beat-run').disabled=false;$('#beat-run').textContent='Measure actual factory beat multiplier';}
boot().catch(error=>$('#beat-status').textContent=error.message);
